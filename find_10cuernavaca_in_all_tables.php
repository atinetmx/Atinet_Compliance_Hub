<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "==================================================\n";
echo "Explorando BD aplicativos - Todas las tablas\n";
echo "==================================================\n\n";

// 1. Listar todas las tablas
$tables = DB::connection('aplicativos')->select('SHOW TABLES');
$dbName = DB::connection('aplicativos')->getDatabaseName();

echo "Tablas en '{$dbName}':\n";
foreach ($tables as $table) {
    $tableName = $table->{"Tables_in_{$dbName}"};
    $count = DB::connection('aplicativos')->table($tableName)->count();
    echo sprintf("  %-40s %15s registros\n", $tableName, number_format($count));
}

echo "\n--- Buscando '10Cuernavaca' en todas las tablas ---\n";

foreach ($tables as $table) {
    $tableName = $table->{"Tables_in_{$dbName}"};
    try {
        // Obtener columnas de la tabla
        $cols = DB::connection('aplicativos')->select("SHOW COLUMNS FROM `{$tableName}`");

        // Buscar columnas que puedan contener el identificador de notaría
        $possibleCols = array_filter($cols, function ($col) {
            $field = strtolower($col->Field);

            return str_contains($field, 'notaria') ||
                   str_contains($field, 'proyecto') ||
                   str_contains($field, 'client');
        });

        foreach ($possibleCols as $col) {
            $colName = $col->Field;
            $count = DB::connection('aplicativos')
                ->table($tableName)
                ->where($colName, '10Cuernavaca')
                ->count();

            if ($count > 0) {
                echo "\n✅ Encontrado en: {$tableName}.{$colName}\n";
                echo '   Total registros: '.number_format($count)."\n";
            }
        }
    } catch (Exception $e) {
        // Ignorar errores en tablas que no podemos consultar
        continue;
    }
}

echo "\n==================================================\n";
