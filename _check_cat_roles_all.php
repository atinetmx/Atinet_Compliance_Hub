<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$notarias = App\Models\Notaria::all();

foreach ($notarias as $notaria) {
    $dbName = $notaria->tenantDatabaseName();
    $connKey = 'cn_tenant_check_'.$notaria->id;

    Illuminate\Support\Facades\Config::set("database.connections.{$connKey}", [
        'driver' => 'mysql',
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => $dbName,
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix' => '',
        'strict' => false,
    ]);

    try {
        $count = Illuminate\Support\Facades\DB::connection($connKey)->table('tbl_cat_roles')->count();
        echo "Notaria #{$notaria->numero_notaria} ({$dbName}): tbl_cat_roles = {$count} registros".PHP_EOL;
    } catch (\Throwable $e) {
        echo "Notaria #{$notaria->numero_notaria} ({$dbName}): ERROR - {$e->getMessage()}".PHP_EOL;
    }

    Illuminate\Support\Facades\DB::purge($connKey);
}
