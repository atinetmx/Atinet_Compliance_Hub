<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$dbName = 'atinet_edomex_notaria_11';

config(['database.connections.t11' => [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => $dbName,
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'strict' => false,
]]);
DB::purge('t11');

// Tablas existentes en el tenant
$existingTables = collect(DB::connection('t11')->select('SHOW TABLES'))
    ->map(fn ($r) => array_values((array) $r)[0])->toArray();

// Migraciones ya registradas
$registered = collect(DB::connection('t11')->select('SELECT migration, batch FROM migrations'))
    ->pluck('batch', 'migration');

$maxBatch = $registered->max() ?? 1;

// Mapa de migración → tabla que crea (para detectar las que ya existen pero no están registradas)
$migrationTableMap = [
    '2026_04_15_170006_create_clientes_table' => 'clientes',
    '2026_04_15_170019_create_alarmas_table' => 'alarmas',
    '2026_04_15_170024_create_seguimientos_atencion_table' => 'seguimientos_atencion',
    '2026_04_15_170027_create_seguimientos_soporte_table' => 'seguimientos_soporte',
];

// Registrar las migraciones cuya tabla ya existe pero no están en migrations
$toRegister = [];
foreach ($migrationTableMap as $migration => $table) {
    if (in_array($table, $existingTables) && ! $registered->has($migration)) {
        $toRegister[] = $migration;
        DB::connection('t11')->table('migrations')->insert([
            'migration' => $migration,
            'batch' => $maxBatch,
        ]);
        echo "  ✅ Registrada: {$migration} (tabla '{$table}' ya existía)\n";
    }
}

if (empty($toRegister)) {
    echo "  No hay migraciones huérfanas que registrar.\n";
}

DB::purge('t11');
config(['database.connections.t11' => null]);

echo "\nEjecutando migrate en {$dbName}...\n";

config(['database.connections.t11' => [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => $dbName,
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'strict' => false,
]]);

Artisan::call('migrate', [
    '--database' => 't11',
    '--path' => 'database/migrations',
    '--force' => true,
]);
echo Artisan::output();

// Conteo final
DB::purge('t11');
config(['database.connections.t11' => [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => $dbName,
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'strict' => false,
]]);

$finalCount = collect(DB::connection('t11')->select('SHOW TABLES'))->count();
echo "\nTablas finales en {$dbName}: {$finalCount}\n";
$icon = $finalCount >= 80 ? '✅ COMPLETA' : '❌ INCOMPLETA';
echo "{$icon}\n";

DB::purge('t11');
config(['database.connections.t11' => null]);
