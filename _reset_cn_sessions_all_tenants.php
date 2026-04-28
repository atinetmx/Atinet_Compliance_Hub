<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use App\Models\Notaria;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

// Resetear Sesion_Iniciada en TODAS las BDs tenant para evitar bloqueos
foreach (Notaria::all() as $n) {
    $db = $n->tenantDatabaseName();
    $key = 'tmp_reset_'.$n->id;
    Config::set("database.connections.{$key}", [
        'driver' => 'mysql',
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => $db,
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4', 'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '', 'strict' => false,
    ]);
    try {
        $rows = DB::connection($key)->table('tbl_cat_usuarios')
            ->where('Sesion_Iniciada', 1)
            ->update(['Sesion_Iniciada' => 0]);
        if ($rows > 0) {
            echo "{$n->nombre} ({$db}): {$rows} sesion(es) reseteada(s)\n";
        }
    } catch (\Throwable $e) {
        echo "{$n->nombre}: ERROR - {$e->getMessage()}\n";
    }
    DB::purge($key);
}
echo "Listo.\n";
