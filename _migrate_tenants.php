<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$tenants = [
    'atinet_edomex_notaria_10',
    'atinet_edomex_notaria_11',
    'atinet_edomex_notaria_60',
    'atinet_edomex_notaria_100',
    'atinet_edomex_notaria_101',
    'atinet_mor_notaria_10',
    'atinet_oax_notaria_113',
];

foreach ($tenants as $dbName) {
    echo "\n".str_repeat('=', 60)."\n";
    echo "MIGRANDO: {$dbName}\n";
    echo str_repeat('=', 60)."\n";

    // Verificar que la BD existe
    $exists = DB::select("SHOW DATABASES LIKE '{$dbName}'");
    if (empty($exists)) {
        echo "  ❌ BD no existe, saltando...\n";

        continue;
    }

    // Configurar conexión temporal
    config(['database.connections.tenant_migrate' => [
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
    ]]);
    DB::purge('tenant_migrate');

    // Contar tablas antes
    $tablesBefore = collect(DB::connection('tenant_migrate')->select('SHOW TABLES'))
        ->map(fn ($r) => array_values((array) $r)[0])->count();
    echo "  Tablas antes: {$tablesBefore}\n";

    // Ejecutar migraciones
    try {
        Artisan::call('migrate', [
            '--database' => 'tenant_migrate',
            '--path' => 'database/migrations',
            '--force' => true,
        ]);
        $output = Artisan::output();
        echo $output;
    } catch (Exception $e) {
        echo '  ❌ Error en migrate: '.$e->getMessage()."\n";
    }

    // Refrescar conexión y contar tablas después
    DB::purge('tenant_migrate');
    config(['database.connections.tenant_migrate' => [
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
    ]]);

    $tablesAfter = collect(DB::connection('tenant_migrate')->select('SHOW TABLES'))
        ->map(fn ($r) => array_values((array) $r)[0])->count();

    echo "\n  Tablas antes : {$tablesBefore}\n";
    echo "  Tablas después: {$tablesAfter}\n";
    echo '  Tablas creadas: '.($tablesAfter - $tablesBefore)."\n";

    // Limpiar conexión
    DB::purge('tenant_migrate');
    config(['database.connections.tenant_migrate' => null]);
}

echo "\n".str_repeat('=', 60)."\n";
echo "✅ PROCESO COMPLETADO\n";
echo str_repeat('=', 60)."\n";
