<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== BUSCAR TABLAS RELACIONADAS CON BÚSQUEDAS ===\n\n";

// Listar todas las tablas de la BD aplicativos
$tables = DB::connection('aplicativos')
    ->select("SHOW TABLES");

echo "📋 Todas las tablas en atinet65_aplicativos:\n";
echo str_repeat('-', 60)."\n";

$tablesList = [];
foreach ($tables as $table) {
    $tableName = array_values((array)$table)[0];
    $tablesList[] = $tableName;

    // Contar registros
    try {
        $count = DB::connection('aplicativos')
            ->table($tableName)
            ->count();
        printf("  %-35s: %s registros\n", $tableName, number_format($count));
    } catch (Exception $e) {
        printf("  %-35s: [Error al contar]\n", $tableName);
    }
}

echo "\n";

// Buscar tablas que puedan tener info de búsquedas de escritorio
echo "🔍 Buscando tablas con nombres relacionados a 'busqueda', 'search', 'query', 'consulta', 'log':\n";
echo str_repeat('-', 60)."\n";

$keywords = ['busque', 'search', 'query', 'consulta', 'log', 'histor', 'registro', 'audit'];
$tablesRelacionadas = [];

foreach ($tablesList as $tableName) {
    foreach ($keywords as $keyword) {
        if (stripos($tableName, $keyword) !== false) {
            $tablesRelacionadas[] = $tableName;
            echo "  ✓ {$tableName}\n";
            break;
        }
    }
}

echo "\n";

// Ver estructura de tablas relacionadas
if (!empty($tablesRelacionadas)) {
    echo "📊 Estructura de tablas relacionadas:\n";
    echo str_repeat('-', 60)."\n";

    foreach ($tablesRelacionadas as $tabla) {
        echo "\n  Tabla: {$tabla}\n";
        try {
            $columns = DB::connection('aplicativos')
                ->select("DESCRIBE {$tabla}");

            foreach ($columns as $col) {
                echo "    ├─ {$col->Field} ({$col->Type})\n";
            }
        } catch (Exception $e) {
            echo "    └─ Error: ".$e->getMessage()."\n";
        }
    }
}
