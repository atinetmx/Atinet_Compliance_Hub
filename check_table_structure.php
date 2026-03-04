<?php

/**
 * Script para verificar estructura de tablas OFAC y SAT
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "🔍 ESTRUCTURA DE TABLAS - LISTAS NEGRAS\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Verificar tabla OFAC
echo "📋 Tabla: Nombres (OFAC)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

try {
    $columns = DB::connection('ofac_remote')
        ->select('SHOW COLUMNS FROM Nombres');

    echo "Columnas encontradas:\n";
    foreach ($columns as $column) {
        $key = $column->Key === 'PRI' ? ' [PRIMARY KEY]' : '';
        echo "  • {$column->Field} ({$column->Type}){$key}\n";
    }

    // Obtener un registro de ejemplo
    echo "\n📄 Registro de ejemplo:\n";
    $sample = DB::connection('ofac_remote')
        ->table('Nombres')
        ->first();

    if ($sample) {
        foreach ((array) $sample as $field => $value) {
            $preview = strlen($value) > 50 ? substr($value, 0, 50).'...' : $value;
            echo "  • {$field}: {$preview}\n";
        }
    }

} catch (\Exception $e) {
    echo '❌ Error: '.$e->getMessage()."\n";
}

echo "\n";
echo "📋 Tabla: 69-B (SAT)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

try {
    $columns = DB::connection('sat_remote')
        ->select('SHOW COLUMNS FROM `69-B`');

    echo "Columnas encontradas:\n";
    foreach ($columns as $column) {
        $key = $column->Key === 'PRI' ? ' [PRIMARY KEY]' : '';
        echo "  • {$column->Field} ({$column->Type}){$key}\n";
    }

    // Obtener un registro de ejemplo
    echo "\n📄 Registro de ejemplo:\n";
    $sample = DB::connection('sat_remote')
        ->table('69-B')
        ->first();

    if ($sample) {
        foreach ((array) $sample as $field => $value) {
            $preview = strlen($value) > 50 ? substr($value, 0, 50).'...' : $value;
            echo "  • {$field}: {$preview}\n";
        }
    }

} catch (\Exception $e) {
    echo '❌ Error: '.$e->getMessage()."\n";
}

echo "\n";
