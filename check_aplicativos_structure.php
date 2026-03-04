<?php

/**
 * Script para verificar estructura de atinet65_aplicativos
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "🔍 ESTRUCTURA BD: atinet65_aplicativos\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

try {
    // Conectar a aplicativos remota
    echo "📡 Conectando a Hostgator (162.144.6.1)...\n\n";

    // Listar todas las tablas
    $tables = DB::connection('aplicativos')
        ->select('SHOW TABLES');

    $tableKey = 'Tables_in_atinet65_aplicativos';

    echo '📋 TABLAS ENCONTRADAS ('.count($tables)." total):\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    foreach ($tables as $table) {
        $tableName = $table->$tableKey;

        // Obtener conteo de registros
        try {
            $count = DB::connection('aplicativos')
                ->table($tableName)
                ->count();

            echo sprintf("  📊 %-40s → %s registros\n", $tableName, number_format($count));
        } catch (\Exception $e) {
            echo sprintf("  ❌ %-40s → Error: %s\n", $tableName, $e->getMessage());
        }
    }

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "💡 Analizando tablas clave...\n\n";

    // Analizar tablas importantes (posibles)
    $keyTables = ['notarias', 'usuarios', 'notarios', 'citas', 'agenda', 'clientes'];

    foreach ($keyTables as $tableName) {
        try {
            // Verificar si existe
            $exists = DB::connection('aplicativos')
                ->select("SHOW TABLES LIKE '{$tableName}'");

            if (empty($exists)) {
                continue;
            }

            echo "📋 Estructura de: {$tableName}\n";
            echo str_repeat('─', 60)."\n";

            $columns = DB::connection('aplicativos')
                ->select("SHOW COLUMNS FROM `{$tableName}`");

            foreach ($columns as $column) {
                $key = $column->Key === 'PRI' ? ' [PRIMARY KEY]' : '';
                $null = $column->Null === 'YES' ? ' [NULL]' : '';
                echo "  • {$column->Field} ({$column->Type}){$key}{$null}\n";
            }

            // Obtener registro de ejemplo
            echo "\n📄 Registro de ejemplo:\n";
            $sample = DB::connection('aplicativos')
                ->table($tableName)
                ->first();

            if ($sample) {
                foreach ((array) $sample as $field => $value) {
                    $preview = is_string($value) && strlen($value) > 50
                        ? substr($value, 0, 50).'...'
                        : $value;
                    echo "  • {$field}: {$preview}\n";
                }
            }

            echo "\n";

        } catch (\Exception $e) {
            // Tabla no existe o error
            continue;
        }
    }

    echo "✅ Análisis completado\n\n";

} catch (\Exception $e) {
    echo '❌ ERROR: '.$e->getMessage()."\n\n";
    echo "💡 Verifica:\n";
    echo "   - Credenciales en .env (DB_APLICATIVOS_*)\n";
    echo "   - Conexión 'aplicativos' en config/database.php\n";
    echo "   - Acceso remoto a Hostgator\n\n";
    exit(1);
}
