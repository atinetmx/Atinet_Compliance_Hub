<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TABLAS EN BASE DE DATOS LEGACY ===\n\n";

$connection = 'aplicativos';

try {
    DB::connection($connection)->getPdo();
    echo "✓ Conexión exitosa a: " . config("database.connections.{$connection}.database") . "\n\n";
} catch (\Exception $e) {
    echo "✗ Error de conexión: " . $e->getMessage() . "\n";
    exit(1);
}

// Listar todas las tablas
echo "Listando tablas...\n";
$tables = DB::connection($connection)->select('SHOW TABLES');

$tableCount = 0;
foreach ($tables as $table) {
    $tableName = array_values((array) $table)[0];
    echo "  - {$tableName}\n";
    $tableCount++;
}

echo "\nTotal de tablas: {$tableCount}\n";

// Buscar específicamente tablas que contengan 'aplicativo', 'ofac' o 'sat'
echo "\n=== TABLAS CANDIDATAS PARA BÚSQUEDA ===\n";
foreach ($tables as $table) {
    $tableName = array_values((array) $table)[0];
    if (stripos($tableName, 'aplicativo') !== false ||
        stripos($tableName, 'ofac') !== false ||
        stripos($tableName, 'sat') !== false ||
        stripos($tableName, 'listas') !== false ||
        stripos($tableName, 'busqueda') !== false ||
        stripos($tableName, 'notaria') !== false) {
        echo "  → {$tableName}\n";
    }
}

echo "\n¡Listado completado!\n";
