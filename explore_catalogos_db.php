<?php

/**
 * Script de exploración de la BD atinet65_catalogos
 *
 * Este script analiza la estructura de la base de datos de catálogos
 * importada desde el sistema legacy para determinar:
 * - Tablas disponibles
 * - Estructura de cada tabla
 * - Cantidad de registros
 * - Datos de ejemplo
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║     EXPLORACIÓN BD CATÁLOGOS (atinet65_catalogos)             ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n";
echo "\n";

try {
    // Test de conexión
    DB::connection('catalogos')->getPdo();
    echo "✅ Conexión exitosa a la BD de catálogos\n\n";

    // ============================================================
    // 1. LISTAR TODAS LAS TABLAS
    // ============================================================

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "1. TABLAS DISPONIBLES\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    $tables = DB::connection('catalogos')->select('SHOW TABLES');
    $tableKey = 'Tables_in_atinet65_catalogos';

    $tablesInfo = [];

    foreach ($tables as $table) {
        $tableName = $table->$tableKey;
        $count = DB::connection('catalogos')->table($tableName)->count();
        $tablesInfo[] = [
            'nombre' => $tableName,
            'registros' => $count,
        ];
    }

    // Ordenar por cantidad de registros (descendente)
    usort($tablesInfo, function ($a, $b) {
        return $b['registros'] - $a['registros'];
    });

    foreach ($tablesInfo as $info) {
        $registros = number_format($info['registros'], 0, '.', ',');
        echo sprintf("%-30s %15s registros\n", $info['nombre'], $registros);
    }

    echo "\n";
    echo 'Total de tablas: '.count($tablesInfo)."\n";

    // ============================================================
    // 2. ANALIZAR TABLA cat_cp (Códigos Postales) - LA MÁS GRANDE
    // ============================================================

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "2. TABLA cat_cp (Códigos Postales) - ANÁLISIS DETALLADO\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    // Obtener columnas
    $columns = DB::connection('catalogos')->select('DESCRIBE cat_cp');

    echo "ESTRUCTURA DE cat_cp:\n\n";
    echo sprintf("%-25s %-20s %-10s %-10s\n", 'Campo', 'Tipo', 'Null', 'Key');
    echo str_repeat('-', 70)."\n";

    foreach ($columns as $col) {
        echo sprintf(
            "%-25s %-20s %-10s %-10s\n",
            $col->Field,
            $col->Type,
            $col->Null,
            $col->Key
        );
    }

    echo "\n\nEJEMPLOS DE REGISTROS (primeros 10):\n\n";

    $ejemplos = DB::connection('catalogos')->table('cat_cp')->limit(10)->get();

    if ($ejemplos->count() > 0) {
        // Obtener todas las columnas del primer registro
        $primerRegistro = (array) $ejemplos->first();
        $columnas = array_keys($primerRegistro);

        // Mostrar como tabla
        foreach ($ejemplos as $registro) {
            echo str_repeat('─', 70)."\n";
            foreach ($columnas as $columna) {
                $valor = $registro->$columna ?? 'NULL';
                echo sprintf("%-20s: %s\n", $columna, $valor);
            }
        }
    }

    // ============================================================
    // 3. ANALIZAR OTRAS TABLAS IMPORTANTES
    // ============================================================

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "3. ANÁLISIS DE OTRAS TABLAS\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    $tablasAAnalizar = ['cat_estados', 'cat_municipios', 'cat_localidades', 'cat_colonias'];

    foreach ($tablasAAnalizar as $tabla) {
        // Verificar si la tabla existe
        if (! in_array($tabla, array_column($tablesInfo, 'nombre'))) {
            echo "⚠️  Tabla '$tabla' no encontrada\n\n";

            continue;
        }

        echo "\n▶ TABLA: $tabla\n";
        echo str_repeat('─', 70)."\n";

        // Obtener estructura
        $cols = DB::connection('catalogos')->select("DESCRIBE $tabla");
        echo 'Columnas: ';
        $colNames = array_map(fn ($c) => $c->Field, $cols);
        echo implode(', ', $colNames)."\n";

        // Obtener ejemplo
        $ejemplo = DB::connection('catalogos')->table($tabla)->first();
        if ($ejemplo) {
            echo "\nEjemplo de registro:\n";
            foreach ((array) $ejemplo as $key => $value) {
                echo sprintf("  %-20s: %s\n", $key, $value);
            }
        }
        echo "\n";
    }

    // ============================================================
    // 4. ESTADÍSTICAS Y RELACIONES
    // ============================================================

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "4. ESTADÍSTICAS GENERALES\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    // Contar estados únicos en cat_cp
    if (in_array('cat_cp', array_column($tablesInfo, 'nombre'))) {
        // Primero verificar qué columna contiene el estado
        $cpCols = DB::connection('catalogos')->select('DESCRIBE cat_cp');
        $hasEstado = false;
        $estadoColumn = null;

        foreach ($cpCols as $col) {
            if (stripos($col->Field, 'estado') !== false) {
                $estadoColumn = $col->Field;
                $hasEstado = true;
                break;
            }
        }

        if ($hasEstado && $estadoColumn) {
            $estadosUnicos = DB::connection('catalogos')
                ->table('cat_cp')
                ->distinct()
                ->count($estadoColumn);

            echo "Estados únicos en cat_cp: $estadosUnicos\n";

            // Mostrar algunos estados
            $ejemplosEstados = DB::connection('catalogos')
                ->table('cat_cp')
                ->select($estadoColumn)
                ->distinct()
                ->limit(10)
                ->pluck($estadoColumn);

            echo 'Ejemplos: '.implode(', ', $ejemplosEstados->toArray())."\n\n";
        }
    }

    // ============================================================
    // 5. EVALUACIÓN PARA INTEGRACIÓN
    // ============================================================

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "5. EVALUACIÓN PARA INTEGRACIÓN\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    echo "✅ RECOMENDACIONES:\n\n";

    // Verificar si hay tabla de estados
    $tieneEstados = in_array('cat_estados', array_column($tablesInfo, 'nombre'));
    $tieneMunicipios = in_array('cat_municipios', array_column($tablesInfo, 'nombre'));
    $tieneCP = in_array('cat_cp', array_column($tablesInfo, 'nombre'));

    if ($tieneEstados) {
        $countEstados = DB::connection('catalogos')->table('cat_estados')->count();
        echo "1. ✅ Tabla cat_estados encontrada ($countEstados estados)\n";
        echo "   → Se puede usar para el selector de estados en Create.tsx\n\n";
    } else {
        echo "1. ⚠️  No se encontró tabla cat_estados\n\n";
    }

    if ($tieneMunicipios) {
        $countMunicipios = DB::connection('catalogos')->table('cat_municipios')->count();
        echo "2. ✅ Tabla cat_municipios encontrada ($countMunicipios municipios)\n";
        echo "   → Se puede usar para selector de municipio (con filtro por estado)\n\n";
    } else {
        echo "2. ⚠️  No se encontró tabla cat_municipios\n\n";
    }

    if ($tieneCP) {
        $countCP = DB::connection('catalogos')->table('cat_cp')->count();
        echo "3. ✅ Tabla cat_cp encontrada ($countCP códigos postales)\n";
        echo "   → Se puede usar para autocomplete de CP\n";
        echo "   → Auto-completar estado/municipio al ingresar CP\n\n";
    } else {
        echo "3. ⚠️  No se encontró tabla cat_cp\n\n";
    }

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "EXPLORACIÓN COMPLETADA\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

} catch (\Exception $e) {
    echo "\n❌ ERROR: ".$e->getMessage()."\n\n";
    echo "Verifica que:\n";
    echo "1. La BD atinet65_catalogos esté importada en localhost\n";
    echo "2. Las credenciales en .env sean correctas\n";
    echo "3. El servidor MySQL esté corriendo\n\n";

    echo "Detalles técnicos:\n";
    echo $e->getTraceAsString()."\n\n";
}
