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

// Tablas que existen en este tenant
$existingTables = collect(DB::connection('t11')->select('SHOW TABLES'))
    ->map(fn ($r) => array_values((array) $r)[0])->toArray();

echo "Tablas existentes en {$dbName} (".count($existingTables)."):\n";
foreach ($existingTables as $t) {
    echo "  - $t\n";
}

// Migraciones ya registradas
$registeredMigrations = collect(DB::connection('t11')->select('SELECT migration FROM migrations'))
    ->pluck('migration')->toArray();

echo "\nMigraciones registradas en migrations table (".count($registeredMigrations)."):\n";
foreach ($registeredMigrations as $m) {
    echo "  - $m\n";
}

// Todas las migraciones del proyecto
$allMigrationFiles = collect(glob(__DIR__.'/database/migrations/*.php'))
    ->map(fn ($f) => pathinfo($f, PATHINFO_FILENAME))
    ->sort()->values();

// Migraciones NO registradas
$unregistered = $allMigrationFiles->diff($registeredMigrations)->values();

echo "\nMigraciones NO registradas (".$unregistered->count()."):\n";
foreach ($unregistered as $m) {
    echo "  - $m\n";
}

DB::purge('t11');
config(['database.connections.t11' => null]);
