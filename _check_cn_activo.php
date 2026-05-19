<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$tenantDb = 'atinet_edomex_notaria_101';

Config::set('database.connections.t101', [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => $tenantDb,
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => false,
]);

// Todas las tablas del tenant
echo "=== TABLAS en $tenantDb ===".PHP_EOL;
$tables = DB::connection('t101')->select('SHOW TABLES');
foreach ($tables as $t) {
    echo array_values((array) $t)[0].PHP_EOL;
}

// Campos de tbl_cfg_notaria en ambas BDs
echo PHP_EOL.'=== DESCRIBE tbl_cfg_notaria (MASTER) ==='.PHP_EOL;
foreach (DB::select('DESCRIBE tbl_cfg_notaria') as $c) {
    echo " {$c->Field} ({$c->Type}) default={$c->Default}".PHP_EOL;
}

echo PHP_EOL.'=== DESCRIBE tbl_cfg_notaria (TENANT) ==='.PHP_EOL;
foreach (DB::connection('t101')->select('DESCRIBE tbl_cfg_notaria') as $c) {
    echo " {$c->Field} ({$c->Type}) default={$c->Default}".PHP_EOL;
}

// Contenido completo Id=8 en master
echo PHP_EOL.'=== tbl_cfg_notaria MASTER Id=8 ==='.PHP_EOL;
$r = DB::select('SELECT * FROM tbl_cfg_notaria WHERE Id = 8');
foreach ($r as $row) {
    print_r((array) $row);
}

// Todas las tablas del master buscando activo/plan
echo PHP_EOL."=== Tablas MASTER con 'activ|plan|suscri|licen|notaria' ===".PHP_EOL;
$masterTables = DB::select('SHOW TABLES');
foreach ($masterTables as $t) {
    $name = array_values((array) $t)[0];
    if (preg_match('/activ|plan|suscri|licen|notaria/i', $name)) {
        echo "-- $name --".PHP_EOL;
        $rows2 = DB::select("SELECT * FROM `$name` LIMIT 3");
        foreach ($rows2 as $row2) {
            print_r((array) $row2);
        }
    }
}
