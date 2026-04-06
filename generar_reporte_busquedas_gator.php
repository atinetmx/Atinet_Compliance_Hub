<?php

/**
 * ============================================================================
 * REPORTE DE BÚSQUEDAS - BD REMOTA GATOR (atinet65_aplicativos)
 * ============================================================================
 *
 * Genera un reporte completo de las búsquedas realizadas por las notarías
 * desde la base de datos legacy de Hostgator.
 *
 * INFORMACIÓN QUE GENERA:
 * 1. Notarías activas (que realizan búsquedas)
 * 2. Cantidad de búsquedas por notaría
 * 3. Tipos de búsquedas realizadas
 * 4. Distribución de búsquedas por tipo
 * 5. Actividad reciente
 *
 * USO:
 *   php generar_reporte_busquedas_gator.php
 *   php generar_reporte_busquedas_gator.php --export=csv
 *   php generar_reporte_busquedas_gator.php --export=json
 *
 * @version 1.0
 * @date 2026-04-06
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Configuración
$exportFormat = null;
if (isset($argv[1]) && strpos($argv[1], '--export=') === 0) {
    $exportFormat = substr($argv[1], 9); // csv, json, etc.
}

echo "==================================================================\n";
echo "  REPORTE DE BÚSQUEDAS - BASE DE DATOS REMOTA GATOR\n";
echo "  Base de datos: atinet65_aplicativos\n";
echo "  Fecha: ".date('Y-m-d H:i:s')."\n";
echo "==================================================================\n\n";

try {
    // ========================================================================
    // 1. RESUMEN GENERAL
    // ========================================================================
    echo "📊 RESUMEN GENERAL\n";
    echo str_repeat('─', 66)."\n";

    $totalBusquedas = DB::connection('aplicativos')
        ->table('busquedas')
        ->count();

    $totalNotarias = DB::connection('aplicativos')
        ->table('busquedas')
        ->distinct('NOTARIA')
        ->count('NOTARIA');

    $totalTipos = DB::connection('aplicativos')
        ->table('busquedas')
        ->distinct('TIPO_BUSQUEDA')
        ->count('TIPO_BUSQUEDA');

    echo "   • Total de búsquedas registradas: ".number_format($totalBusquedas)."\n";
    echo "   • Notarías activas: ".number_format($totalNotarias)."\n";
    echo "   • Tipos de búsqueda diferentes: ".number_format($totalTipos)."\n\n";

    // ========================================================================
    // 2. BÚSQUEDAS POR NOTARÍA
    // ========================================================================
    echo "📋 BÚSQUEDAS POR NOTARÍA\n";
    echo str_repeat('─', 66)."\n";

    $busquedasPorNotaria = DB::connection('aplicativos')
        ->table('busquedas')
        ->select('NOTARIA')
        ->selectRaw('COUNT(*) as total_busquedas')
        ->selectRaw('MIN(FECHA) as primera_busqueda')
        ->selectRaw('MAX(FECHA) as ultima_busqueda')
        ->groupBy('NOTARIA')
        ->orderByDesc('total_busquedas')
        ->get();

    $datosExportNotarias = [];

    printf("   %-30s %15s %12s %12s\n",
        'NOTARÍA', 'BÚSQUEDAS', 'PRIMERA', 'ÚLTIMA');
    echo "   ".str_repeat('─', 64)."\n";

    foreach ($busquedasPorNotaria as $notaria) {
        printf("   %-30s %15s %12s %12s\n",
            substr($notaria->NOTARIA, 0, 30),
            number_format($notaria->total_busquedas),
            date('Y-m-d', strtotime($notaria->primera_busqueda)),
            date('Y-m-d', strtotime($notaria->ultima_busqueda))
        );

        $datosExportNotarias[] = [
            'notaria' => $notaria->NOTARIA,
            'total_busquedas' => $notaria->total_busquedas,
            'primera_busqueda' => $notaria->primera_busqueda,
            'ultima_busqueda' => $notaria->ultima_busqueda,
        ];
    }

    echo "\n";

    // ========================================================================
    // 3. TIPOS DE BÚSQUEDA
    // ========================================================================
    echo "🔍 TIPOS DE BÚSQUEDA UTILIZADOS\n";
    echo str_repeat('─', 66)."\n";

    $tiposBusqueda = DB::connection('aplicativos')
        ->table('busquedas')
        ->select('TIPO_BUSQUEDA')
        ->selectRaw('COUNT(*) as total')
        ->selectRaw('COUNT(DISTINCT NOTARIA) as notarias_usan')
        ->groupBy('TIPO_BUSQUEDA')
        ->orderByDesc('total')
        ->get();

    $datosExportTipos = [];

    printf("   %-35s %15s %15s\n",
        'TIPO DE BÚSQUEDA', 'TOTAL', 'NOTARÍAS');
    echo "   ".str_repeat('─', 64)."\n";

    foreach ($tiposBusqueda as $tipo) {
        $porcentaje = ($totalBusquedas > 0)
            ? round(($tipo->total / $totalBusquedas) * 100, 2)
            : 0;

        printf("   %-35s %10s (%5.2f%%) %10s\n",
            substr($tipo->TIPO_BUSQUEDA ?? 'SIN TIPO', 0, 35),
            number_format($tipo->total),
            $porcentaje,
            $tipo->notarias_usan
        );

        $datosExportTipos[] = [
            'tipo_busqueda' => $tipo->TIPO_BUSQUEDA,
            'total' => $tipo->total,
            'porcentaje' => $porcentaje,
            'notarias_usan' => $tipo->notarias_usan,
        ];
    }

    echo "\n";

    // ========================================================================
    // 4. ANÁLISIS DETALLADO POR NOTARÍA Y TIPO
    // ========================================================================
    echo "📊 ANÁLISIS DETALLADO: BÚSQUEDAS POR NOTARÍA Y TIPO\n";
    echo str_repeat('─', 66)."\n";

    $busquedasDetalladas = DB::connection('aplicativos')
        ->table('busquedas')
        ->select('NOTARIA', 'TIPO_BUSQUEDA')
        ->selectRaw('COUNT(*) as total')
        ->groupBy('NOTARIA', 'TIPO_BUSQUEDA')
        ->orderBy('NOTARIA')
        ->orderByDesc('total')
        ->get();

    $datosExportDetalle = [];
    $notariaActual = null;

    foreach ($busquedasDetalladas as $detalle) {
        if ($notariaActual !== $detalle->NOTARIA) {
            if ($notariaActual !== null) {
                echo "\n";
            }
            $notariaActual = $detalle->NOTARIA;
            echo "   📍 ".substr($detalle->NOTARIA, 0, 50)."\n";
        }

        printf("      ├─ %-35s: %s búsquedas\n",
            substr($detalle->TIPO_BUSQUEDA ?? 'SIN TIPO', 0, 35),
            number_format($detalle->total)
        );

        $datosExportDetalle[] = [
            'notaria' => $detalle->NOTARIA,
            'tipo_busqueda' => $detalle->TIPO_BUSQUEDA,
            'total' => $detalle->total,
        ];
    }

    echo "\n";

    // ========================================================================
    // 5. ACTIVIDAD RECIENTE (ÚLTIMOS 30 DÍAS)
    // ========================================================================
    echo "📅 ACTIVIDAD RECIENTE (ÚLTIMOS 30 DÍAS)\n";
    echo str_repeat('─', 66)."\n";

    $fecha30Dias = date('Y-m-d H:i:s', strtotime('-30 days'));

    $busquedasRecientes = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('FECHA', '>=', $fecha30Dias)
        ->count();

    $notariasActivas = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('FECHA', '>=', $fecha30Dias)
        ->distinct('NOTARIA')
        ->count('NOTARIA');

    echo "   • Búsquedas en últimos 30 días: ".number_format($busquedasRecientes)."\n";
    echo "   • Notarías activas (últimos 30 días): ".number_format($notariasActivas)."\n\n";

    if ($busquedasRecientes > 0) {
        echo "   Top 10 Notarías más activas (últimos 30 días):\n";
        echo "   ".str_repeat('─', 60)."\n";

        $topRecientes = DB::connection('aplicativos')
            ->table('busquedas')
            ->select('NOTARIA')
            ->selectRaw('COUNT(*) as total')
            ->where('FECHA', '>=', $fecha30Dias)
            ->groupBy('NOTARIA')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        foreach ($topRecientes as $i => $top) {
            printf("   %2d. %-40s: %s búsquedas\n",
                $i + 1,
                substr($top->NOTARIA, 0, 40),
                number_format($top->total)
            );
        }
    }

    echo "\n";

    // ========================================================================
    // 6. ORIGEN DE CONSULTAS (si existe la columna)
    // ========================================================================
    try {
        $origenes = DB::connection('aplicativos')
            ->table('busquedas')
            ->select('ORIGEN_CONSULTA')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('ORIGEN_CONSULTA')
            ->orderByDesc('total')
            ->get();

        if ($origenes->isNotEmpty()) {
            echo "🌐 ORIGEN DE CONSULTAS\n";
            echo str_repeat('─', 66)."\n";

            foreach ($origenes as $origen) {
                $origenLabel = $origen->ORIGEN_CONSULTA ?? 'NO ESPECIFICADO';
                printf("   %-45s: %s\n",
                    substr($origenLabel, 0, 45),
                    number_format($origen->total)
                );
            }
            echo "\n";
        }
    } catch (Exception $e) {
        // Columna ORIGEN_CONSULTA no existe o no es accesible
    }

    // ========================================================================
    // EXPORTACIÓN DE DATOS
    // ========================================================================
    if ($exportFormat) {
        $timestamp = date('Y-m-d_His');

        switch (strtolower($exportFormat)) {
            case 'csv':
                // Exportar notarías
                $csvNotarias = "reporte_busquedas_notarias_{$timestamp}.csv";
                $fp = fopen($csvNotarias, 'w');
                fputcsv($fp, ['Notaría', 'Total Búsquedas', 'Primera Búsqueda', 'Última Búsqueda']);
                foreach ($datosExportNotarias as $row) {
                    fputcsv($fp, $row);
                }
                fclose($fp);
                echo "✅ Exportado: {$csvNotarias}\n";

                // Exportar tipos
                $csvTipos = "reporte_busquedas_tipos_{$timestamp}.csv";
                $fp = fopen($csvTipos, 'w');
                fputcsv($fp, ['Tipo Búsqueda', 'Total', 'Porcentaje', 'Notarías que Usan']);
                foreach ($datosExportTipos as $row) {
                    fputcsv($fp, $row);
                }
                fclose($fp);
                echo "✅ Exportado: {$csvTipos}\n";

                // Exportar detalle
                $csvDetalle = "reporte_busquedas_detalle_{$timestamp}.csv";
                $fp = fopen($csvDetalle, 'w');
                fputcsv($fp, ['Notaría', 'Tipo Búsqueda', 'Total']);
                foreach ($datosExportDetalle as $row) {
                    fputcsv($fp, $row);
                }
                fclose($fp);
                echo "✅ Exportado: {$csvDetalle}\n";
                break;

            case 'json':
                $jsonFile = "reporte_busquedas_{$timestamp}.json";
                $jsonData = [
                    'fecha_generacion' => date('Y-m-d H:i:s'),
                    'resumen' => [
                        'total_busquedas' => $totalBusquedas,
                        'total_notarias' => $totalNotarias,
                        'total_tipos' => $totalTipos,
                        'busquedas_30_dias' => $busquedasRecientes,
                        'notarias_activas_30_dias' => $notariasActivas,
                    ],
                    'notarias' => $datosExportNotarias,
                    'tipos_busqueda' => $datosExportTipos,
                    'detalle' => $datosExportDetalle,
                ];
                file_put_contents($jsonFile, json_encode($jsonData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
                echo "✅ Exportado: {$jsonFile}\n";
                break;

            default:
                echo "⚠️  Formato de exportación no reconocido: {$exportFormat}\n";
                echo "   Formatos válidos: csv, json\n";
        }
        echo "\n";
    }

    echo "==================================================================\n";
    echo "  REPORTE COMPLETADO EXITOSAMENTE\n";
    echo "==================================================================\n";

} catch (Exception $e) {
    echo "\n❌ ERROR AL GENERAR REPORTE\n";
    echo "   Mensaje: ".$e->getMessage()."\n";
    echo "   Archivo: ".$e->getFile()."\n";
    echo "   Línea: ".$e->getLine()."\n\n";
    exit(1);
}
