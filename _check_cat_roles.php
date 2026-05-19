<?php

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$notaria = App\Models\Notaria::find(10);
$connKey = 'cn_tenant_10';
Illuminate\Support\Facades\Config::set("database.connections.{$connKey}", [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => $notaria->tenantDatabaseName(),
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => false,
]);

$roles = Illuminate\Support\Facades\DB::connection($connKey)->table('tbl_cat_roles')->get();
echo 'tbl_cat_roles en tenant notaria_101: '.count($roles).' registros'.PHP_EOL;
foreach ($roles as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
}

// Verificar en master
$rolesMaster = Illuminate\Support\Facades\DB::table('tbl_cat_roles')->get();
echo PHP_EOL.'tbl_cat_roles en MASTER: '.count($rolesMaster).' registros'.PHP_EOL;
foreach ($rolesMaster as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
}
