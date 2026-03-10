<?php

/**
 * Script de comparación y extracción de estados
 *
 * Compara los estados actuales en tipos/estados.ts con los estados
 * en la BD de catálogos (cat_cp) para identificar diferencias
 */

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "\n";
echo "╔════════════════════════════════════════════════════════════════╗\n";
echo "║     COMPARACIÓN DE ESTADOS: Código vs BD Catálogos            ║\n";
echo "╚════════════════════════════════════════════════════════════════╝\n";
echo "\n";

try {
    // ============================================================
    // 1. EXTRAER ESTADOS DE LA BD cat_cp
    // ============================================================

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "1. ESTADOS EN LA BD CATÁLOGOS (cat_cp)\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    $estadosDB = DB::connection('catalogos')
        ->table('cat_cp')
        ->select('d_estado', 'c_estado')
        ->distinct()
        ->orderBy('d_estado')
        ->get();

    echo "Total de estados en BD: " . $estadosDB->count() . "\n\n";

    $estadosDBArray = [];
    foreach ($estadosDB as $estado) {
        $estadosDBArray[$estado->d_estado] = $estado->c_estado;
        echo sprintf("%-30s (código: %02d)\n", $estado->d_estado, $estado->c_estado);
    }

    // ============================================================
    // 2. ESTADOS ACTUALES EN EL CÓDIGO
    // ============================================================

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "2. ESTADOS EN EL CÓDIGO (tipos/estados.ts)\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    $estadosCodigo = [
        'Aguascalientes',
        'Baja California',
        'Baja California Sur',
        'Campeche',
        'Chiapas',
        'Chihuahua',
        'Ciudad de México',
        'Coahuila',
        'Colima',
        'Durango',
        'Guanajuato',
        'Guerrero',
        'Hidalgo',
        'Jalisco',
        'Estado de México',
        'Michoacán',
        'Morelos',
        'Nayarit',
        'Nuevo León',
        'Oaxaca',
        'Puebla',
        'Querétaro',
        'Quintana Roo',
        'San Luis Potosí',
        'Sinaloa',
        'Sonora',
        'Tabasco',
        'Tamaulipas',
        'Tlaxcala',
        'Veracruz',
        'Yucatán',
        'Zacatecas',
    ];

    echo "Total de estados en código: " . count($estadosCodigo) . "\n\n";

    foreach ($estadosCodigo as $estado) {
        echo "- $estado\n";
    }

    // ============================================================
    // 3. COMPARAR Y DETECTAR DIFERENCIAS
    // ============================================================

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "3. ANÁLISIS DE DIFERENCIAS\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    $estadosDBNombres = array_keys($estadosDBArray);

    // Estados en BD pero no en código
    $soloEnDB = array_diff($estadosDBNombres, $estadosCodigo);

    // Estados en código pero no en BD
    $soloEnCodigo = array_diff($estadosCodigo, $estadosDBNombres);

    if (empty($soloEnDB) && empty($soloEnCodigo)) {
        echo "✅ PERFECTO: Los estados coinciden exactamente\n\n";
    } else {
        if (!empty($soloEnDB)) {
            echo "⚠️  Estados en BD pero NO en código:\n";
            foreach ($soloEnDB as $estado) {
                echo "   - $estado (código: " . $estadosDBArray[$estado] . ")\n";
            }
            echo "\n";
        }

        if (!empty($soloEnCodigo)) {
            echo "⚠️  Estados en código pero NO en BD:\n";
            foreach ($soloEnCodigo as $estado) {
                echo "   - $estado\n";
            }
            echo "\n";
        }
    }

    // ============================================================
    // 4. DETECTAR VARIACIONES DE NOMBRE
    // ============================================================

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "4. DETECCIÓN DE VARIACIONES DE NOMBRE\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    $variaciones = [];

    // Detectar variaciones comunes
    foreach ($estadosDBNombres as $estadoDB) {
        foreach ($estadosCodigo as $estadoCod) {
            $similarity = 0;
            similar_text(strtolower($estadoDB), strtolower($estadoCod), $similarity);

            if ($similarity > 70 && $similarity < 100) {
                $variaciones[] = [
                    'bd' => $estadoDB,
                    'codigo' => $estadoCod,
                    'similitud' => round($similarity, 2)
                ];
            }
        }
    }

    if (empty($variaciones)) {
        echo "✅ No se detectaron variaciones de nombre\n\n";
    } else {
        echo "Posibles variaciones detectadas:\n\n";
        foreach ($variaciones as $var) {
            echo sprintf(
                "BD: %-30s  <->  Código: %-30s  (%.1f%% similares)\n",
                $var['bd'],
                $var['codigo'],
                $var['similitud']
            );
        }
        echo "\n";
    }

    // ============================================================
    // 5. GENERAR NUEVO ARCHIVO TypeScript (opcional)
    // ============================================================

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "5. PROPUESTA DE ACTUALIZACIÓN\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    if (empty($soloEnDB) && empty($soloEnCodigo)) {
        echo "Los estados actuales están correctos. No se requiere actualización.\n\n";
    } else {
        echo "Se recomienda actualizar tipos/estados.ts con los estados de la BD:\n\n";

        echo "// Estados oficiales de SEPOMEX (202,966 códigos postales)\n";
        echo "export const ESTADOS_MEXICO = [\n";
        foreach ($estadosDBNombres as $estado) {
            $codigo = $estadosDBArray[$estado];
            echo "    '{$estado}', // Código: {$codigo}\n";
        }
        echo "] as const;\n\n";

        // Generar también el objeto con códigos
        echo "\n// Códigos numéricos de estados (para validaciones)\n";
        echo "export const ESTADOS_CODIGOS: Record<string, number> = {\n";
        foreach ($estadosDBArray as $nombre => $codigo) {
            $key = str_replace("'", "\\'", $nombre);
            echo "    '{$key}': {$codigo},\n";
        }
        echo "};\n\n";
    }

    // ============================================================
    // 6. ESTADÍSTICAS DE MUNICIPIOS POR ESTADO
    // ============================================================

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "6. MUNICIPIOS POR ESTADO (Top 5 estados con más municipios)\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

    $municipiosPorEstado = DB::connection('catalogos')
        ->table('cat_cp')
        ->select('d_estado', DB::raw('COUNT(DISTINCT D_mnpio) as total_municipios'))
        ->groupBy('d_estado')
        ->orderBy('total_municipios', 'desc')
        ->limit(5)
        ->get();

    foreach ($municipiosPorEstado as $row) {
        echo sprintf("%-30s %5d municipios\n", $row->d_estado, $row->total_municipios);
    }

    echo "\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "ANÁLISIS COMPLETADO\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

} catch (\Exception $e) {
    echo "\n❌ ERROR: " . $e->getMessage() . "\n\n";
}
