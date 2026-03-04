<?php

/**
 * Script para verificar TODAS las tablas en OFAC y SAT
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "🔍 ANÁLISIS COMPLETO - BASES DE DATOS OFAC Y SAT\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// ============================================
// BASE DE DATOS OFAC (atinet65_listasofac)
// ============================================
echo "📋 BASE DE DATOS: atinet65_listasofac (OFAC)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

try {
    // Listar todas las tablas
    $tables = DB::connection('ofac_remote')->select('SHOW TABLES');

    $tableKey = 'Tables_in_atinet65_listasofac';

    echo '📊 TABLAS ENCONTRADAS ('.count($tables)." total):\n\n";

    foreach ($tables as $table) {
        $tableName = $table->$tableKey;

        try {
            // Contar registros
            $count = DB::connection('ofac_remote')->table($tableName)->count();
            echo sprintf("  📄 %-40s → %s registros\n", $tableName, number_format($count));

            // Mostrar estructura
            $columns = DB::connection('ofac_remote')->select("SHOW COLUMNS FROM `{$tableName}`");
            echo '      Columnas: ';
            $colNames = array_map(fn ($col) => $col->Field, $columns);
            echo implode(', ', $colNames)."\n\n";

        } catch (\Exception $e) {
            echo sprintf("  ❌ %-40s → Error: %s\n\n", $tableName, $e->getMessage());
        }
    }

} catch (\Exception $e) {
    echo '❌ ERROR: '.$e->getMessage()."\n\n";
}

echo "\n";

// ============================================
// BASE DE DATOS SAT (atinet65_listassat)
// ============================================
echo "📋 BASE DE DATOS: atinet65_listassat (SAT)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

try {
    // Listar todas las tablas
    $tables = DB::connection('sat_remote')->select('SHOW TABLES');

    $tableKey = 'Tables_in_atinet65_listassat';

    echo '📊 TABLAS ENCONTRADAS ('.count($tables)." total):\n\n";

    foreach ($tables as $table) {
        $tableName = $table->$tableKey;

        try {
            // Contar registros
            $count = DB::connection('sat_remote')->table($tableName)->count();
            echo sprintf("  📄 %-40s → %s registros\n", $tableName, number_format($count));

            // Mostrar estructura
            $columns = DB::connection('sat_remote')->select("SHOW COLUMNS FROM `{$tableName}`");
            echo '      Columnas: ';
            $colNames = array_map(fn ($col) => $col->Field, $columns);
            echo implode(', ', $colNames)."\n\n";

        } catch (\Exception $e) {
            echo sprintf("  ❌ %-40s → Error: %s\n\n", $tableName, $e->getMessage());
        }
    }

} catch (\Exception $e) {
    echo '❌ ERROR: '.$e->getMessage()."\n\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ Análisis completado\n\n";
