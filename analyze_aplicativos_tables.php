<?php

/**
 * Script para analizar tablas clave de aplicativos
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "📊 ANÁLISIS DETALLADO - TABLAS CLAVE\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$keyTables = [
    'registro' => 'Notarías registradas',
    'usuario' => 'Usuarios del sistema',
    'agenda' => 'Citas y eventos',
    'busquedas' => 'Historial de búsquedas OFAC/SAT',
    'busquedas_escritorio' => 'Búsquedas desde escritorio',
    'Permisos_Notarias' => 'Configuración de permisos',
    'correos_notaria' => 'Configuración de correos',
];

try {
    foreach ($keyTables as $tableName => $description) {
        echo "📋 {$tableName}\n";
        echo "   {$description}\n";
        echo str_repeat('─', 80)."\n";

        // Estructura
        $columns = DB::connection('aplicativos')
            ->select("SHOW COLUMNS FROM `{$tableName}`");

        echo "Columnas:\n";
        foreach ($columns as $column) {
            $key = $column->Key === 'PRI' ? ' 🔑' : '';
            $null = $column->Null === 'YES' ? ' [NULL]' : '';
            $default = $column->Default !== null ? " [DEFAULT: {$column->Default}]" : '';
            echo "  • {$column->Field} ({$column->Type}){$key}{$null}{$default}\n";
        }

        // Conteo
        $count = DB::connection('aplicativos')->table($tableName)->count();
        echo "\n📊 Total de registros: ".number_format($count)."\n";

        // Muestra de 2 registros
        echo "\n📄 Registros de ejemplo:\n";
        $samples = DB::connection('aplicativos')
            ->table($tableName)
            ->limit(2)
            ->get();

        foreach ($samples as $index => $sample) {
            echo "\n  Registro #".($index + 1).":\n";
            foreach ((array) $sample as $field => $value) {
                if ($value === null) {
                    $preview = '[NULL]';
                } elseif (is_string($value) && strlen($value) > 60) {
                    $preview = substr($value, 0, 60).'...';
                } else {
                    $preview = $value;
                }
                echo "    {$field}: {$preview}\n";
            }
        }

        echo "\n".str_repeat('━', 80)."\n\n";
    }

    echo "✅ Análisis completado\n\n";

} catch (\Exception $e) {
    echo '❌ ERROR: '.$e->getMessage()."\n\n";
    exit(1);
}
