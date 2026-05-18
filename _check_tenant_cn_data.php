<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

$tenants = Notaria::all()->filter(fn ($n) => ! empty($n->tenantDatabaseName()));

$tablasCN = ['tbl_cat_expedientes', 'tbl_cat_clientes', 'tbl_cat_operaciones', 'tbl_cat_usuarios'];

foreach ($tenants as $notaria) {
    $db = $notaria->tenantDatabaseName();
    $connKey = 'tmp_'.$notaria->id;

    Config::set("database.connections.{$connKey}", [
        'driver' => 'mysql', 'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'), 'database' => $db,
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4', 'collation' => 'utf8mb4_unicode_ci', 'strict' => false,
    ]);

    echo "\n=== {$notaria->nombre} ({$db}) ===\n";
    foreach ($tablasCN as $tabla) {
        try {
            $count = DB::connection($connKey)->table($tabla)->count();
            echo "  {$tabla}: {$count} registros\n";
        } catch (\Throwable $e) {
            echo "  {$tabla}: NO EXISTE o error\n";
        }
    }
    DB::purge($connKey);
}
