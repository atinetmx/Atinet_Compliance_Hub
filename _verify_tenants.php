<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tenants = [
    'atinet_edomex_notaria_10',
    'atinet_edomex_notaria_11',
    'atinet_mor_notaria_10',
    'atinet_oax_notaria_113',
    'atinet_edomex_notaria_60',
];

echo "=== VERIFICACIÓN FINAL DE TENANTS ===\n\n";

foreach ($tenants as $db) {
    config(['database.connections.tv' => [
        'driver' => 'mysql',
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => $db,
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'strict' => false,
    ]]);
    DB::purge('tv');

    $tables = collect(DB::connection('tv')->select('SHOW TABLES'))
        ->map(fn ($r) => array_values((array) $r)[0]);

    $cols = collect(DB::connection('tv')->select('SHOW COLUMNS FROM users'))
        ->pluck('Field')->toArray();

    $tableOk = $tables->count() >= 80;
    $cnOk = in_array('cn_usuario_id', $cols) && in_array('cn_rol_id', $cols) && in_array('cn_password', $cols);

    $status = ($tableOk && $cnOk) ? '✅' : '❌';
    echo "{$status} {$db}\n";
    echo "   Tablas: {$tables->count()}/91  |  cn_fields en users: ".($cnOk ? 'OK' : 'FALTANTES')."\n";

    DB::purge('tv');
    config(['database.connections.tv' => null]);
}

echo "\n✅ Verificación completada.\n";
