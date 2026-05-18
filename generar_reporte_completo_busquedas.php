<?php

/**
 * ============================================================================
 * REPORTE COMPLETO DE BÚSQUEDAS - BD REMOTA GATOR (atinet65_aplicativos)
 * ============================================================================
 *
 * Genera un reporte completo de las búsquedas realizadas por las notarías
 * desde la base de datos legacy de Hostgator, incluyendo BÚSQUEDAS WEB y
 * BÚSQUEDAS DE ESCRITORIO.
 *
 * INFORMACIÓN QUE GENERA:
 * 1. Notarías activas (que realizan búsquedas)
 * 2. Cantidad de búsquedas por notaría (Web + Escritorio)
 * 3. Tipos de búsquedas realizadas
 * 4. Distribución de búsquedas por tipo y origen (Web vs Escritorio)
 * 5. Actividad reciente
 * 6. Comparación entre búsquedas Web y Escritorio
 *
 * USO:
 *   php generar_reporte_completo_busquedas.php
 *   php generar_reporte_completo_busquedas.php --export=csv
 *   php generar_reporte_completo_busquedas.php --export=json
 *
 * @version 2.0
 *
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
echo "  REPORTE COMPLETO DE BÚSQUEDAS - BASE DE DATOS REMOTA GATOR\n";
echo "  Base de datos: atinet65_aplicativos\n";
echo "  Tablas: busquedas (WEB) + busquedas_escritorio (ESCRITORIO)\n";
echo '  Fecha: '.date('Y-m-d H:i:s')."\n";
echo "==================================================================\n\n";

try {
    // ========================================================================
    // 1. RESUMEN GENERAL
    // ========================================================================
    echo "📊 RESUMEN GENERAL\n";
    echo str_repeat('─', 66)."\n";

    $totalWeb = DB::connection('aplicativos')->table('busquedas')->count();
    $totalEscritorio = DB::connection('aplicativos')->table('busquedas_escritorio')->count();
    $totalBusquedas = $totalWeb + $totalEscritorio;

    $notariasWeb = DB::connection('aplicativos')
        ->table('busquedas')
        ->distinct('NOTARIA')
        ->count('NOTARIA');

    $notariasEscritorio = DB::connection('aplicativos')
        ->table('busquedas_escritorio')
        ->distinct('NOTARIA')
        ->count('NOTARIA');

    // Notarías únicas totales
    $notariasUnicas = DB::connection('aplicativos')
        ->table(DB::raw('(SELECT NOTARIA FROM busquedas UNION SELECT NOTARIA FROM busquedas_escritorio) as notarias_union'))
        ->count();

    $porcentajeWeb = ($totalBusquedas > 0) ? round(($totalWeb / $totalBusquedas) * 100, 2) : 0;
    $porcentajeEscritorio = ($totalBusquedas > 0) ? round(($totalEscritorio / $totalBusquedas) * 100, 2) : 0;

    echo '   • Total de búsquedas registradas: '.number_format($totalBusquedas)."\n";
    echo '     ├─ Búsquedas WEB: '.number_format($totalWeb)." ({$porcentajeWeb}%)\n";
    echo '     └─ Búsquedas ESCRITORIO: '.number_format($totalEscritorio)." ({$porcentajeEscritorio}%)\n\n";
    echo '   • Notarías activas: '.number_format($notariasUnicas)."\n";
    echo '     ├─ Usan aplicación WEB: '.number_format($notariasWeb)."\n";
    echo '     └─ Usan aplicación ESCRITORIO: '.number_format($notariasEscritorio)."\n\n";

    // ========================================================================
    // 2. BÚSQUEDAS POR NOTARÍA (COMBINADAS)
    // ========================================================================
    echo "📋 BÚSQUEDAS POR NOTARÍA (WEB + ESCRITORIO)\n";
    echo str_repeat('─', 66)."\n";

    // Unir búsquedas de ambas tablas
    $busquedasPorNotaria = DB::connection('aplicativos')
        ->table(DB::raw('(
            SELECT NOTARIA, FECHA, "WEB" as origen FROM busquedas
            UNION ALL
            SELECT NOTARIA, FECHA, "ESCRITORIO" as origen FROM busquedas_escritorio
        ) as busquedas_combinadas'))
        ->select('NOTARIA')
        ->selectRaw('COUNT(*) as total_busquedas')
        ->selectRaw('SUM(CASE WHEN origen = "WEB" THEN 1 ELSE 0 END) as total_web')
        ->selectRaw('SUM(CASE WHEN origen = "ESCRITORIO" THEN 1 ELSE 0 END) as total_escritorio')
        ->selectRaw('MIN(FECHA) as primera_busqueda')
        ->selectRaw('MAX(FECHA) as ultima_busqueda')
        ->groupBy('NOTARIA')
        ->orderByDesc('total_busquedas')
        ->get();

    $datosExportNotarias = [];

    printf("   %-25s %10s %10s %10s %12s %12s\n",
        'NOTARÍA', 'TOTAL', 'WEB', 'ESCRIT.', 'PRIMERA', 'ÚLTIMA');
    echo '   '.str_repeat('─', 78)."\n";

    foreach ($busquedasPorNotaria as $notaria) {
        printf("   %-25s %10s %10s %10s %12s %12s\n",
            substr($notaria->NOTARIA, 0, 25),
            number_format($notaria->total_busquedas),
            number_format($notaria->total_web),
            number_format($notaria->total_escritorio),
            date('Y-m-d', strtotime($notaria->primera_busqueda)),
            date('Y-m-d', strtotime($notaria->ultima_busqueda))
        );

        $datosExportNotarias[] = [
            'notaria' => $notaria->NOTARIA,
            'total_busquedas' => $notaria->total_busquedas,
            'busquedas_web' => $notaria->total_web,
            'busquedas_escritorio' => $notaria->total_escritorio,
            'primera_busqueda' => $notaria->primera_busqueda,
            'ultima_busqueda' => $notaria->ultima_busqueda,
        ];
    }

    echo "\n";

    // ========================================================================
    // 3. TIPOS DE BÚSQUEDA
    // ========================================================================
    echo "🔍 TIPOS DE BÚSQUEDA UTILIZADOS (POR ORIGEN)\n";
    echo str_repeat('─', 66)."\n";

    $tiposPorOrigen = DB::connection('aplicativos')
        ->table(DB::raw('(
            SELECT TIPO_BUSQUEDA, "WEB" as origen FROM busquedas
            UNION ALL
            SELECT TIPO_BUSQUEDA, "ESCRITORIO" as origen FROM busquedas_escritorio
        ) as tipos_combinados'))
        ->select('TIPO_BUSQUEDA', 'origen')
        ->selectRaw('COUNT(*) as total')
        ->groupBy('TIPO_BUSQUEDA', 'origen')
        ->orderBy('TIPO_BUSQUEDA')
        ->orderBy('origen')
        ->get();

    $datosExportTipos = [];
    $tipoActual = null;

    foreach ($tiposPorOrigen as $tipo) {
        if ($tipoActual !== $tipo->TIPO_BUSQUEDA) {
            if ($tipoActual !== null) {
                echo "\n";
            }
            $tipoActual = $tipo->TIPO_BUSQUEDA;
            $tipoLabel = $tipo->TIPO_BUSQUEDA ?? 'SIN TIPO';
            echo '   📌 '.substr($tipoLabel, 0, 45)."\n";
        }

        $porcentaje = ($totalBusquedas > 0)
            ? round(($tipo->total / $totalBusquedas) * 100, 2)
            : 0;

        printf("      ├─ %-15s: %10s búsquedas (%5.2f%%)\n",
            $tipo->origen,
            number_format($tipo->total),
            $porcentaje
        );

        $datosExportTipos[] = [
            'tipo_busqueda' => $tipo->TIPO_BUSQUEDA,
            'origen' => $tipo->origen,
            'total' => $tipo->total,
            'porcentaje' => $porcentaje,
        ];
    }

    echo "\n";

    // ========================================================================
    // 4. ANÁLISIS DETALLADO POR NOTARÍA, TIPO Y ORIGEN
    // ========================================================================
    echo "📊 ANÁLISIS DETALLADO: TOP 10 NOTARÍAS\n";
    echo str_repeat('─', 66)."\n";

    $busquedasDetalladas = DB::connection('aplicativos')
        ->table(DB::raw('(
            SELECT NOTARIA, TIPO_BUSQUEDA, "WEB" as origen FROM busquedas
            UNION ALL
            SELECT NOTARIA, TIPO_BUSQUEDA, "ESCRITORIO" as origen FROM busquedas_escritorio
        ) as detalle_combinado'))
        ->select('NOTARIA', 'TIPO_BUSQUEDA', 'origen')
        ->selectRaw('COUNT(*) as total')
        ->groupBy('NOTARIA', 'TIPO_BUSQUEDA', 'origen')
        ->orderBy('NOTARIA')
        ->orderBy('TIPO_BUSQUEDA')
        ->orderBy('origen')
        ->get();

    $datosExportDetalle = [];
    $notariaActual = null;
    $tipoActual = null;
    $contador = 0;
    $maxNotarias = 10;

    // Obtener top 10 notarías
    $top10Notarias = $busquedasPorNotaria->take(10)->pluck('NOTARIA')->toArray();

    foreach ($busquedasDetalladas as $detalle) {
        // Solo mostrar top 10 notarías
        if (! in_array($detalle->NOTARIA, $top10Notarias)) {
            continue;
        }

        if ($notariaActual !== $detalle->NOTARIA) {
            if ($notariaActual !== null) {
                echo "\n";
            }
            $notariaActual = $detalle->NOTARIA;
            $contador++;
            echo '   📍 '.substr($detalle->NOTARIA, 0, 50)."\n";
            $tipoActual = null;
        }

        if ($tipoActual !== $detalle->TIPO_BUSQUEDA) {
            $tipoActual = $detalle->TIPO_BUSQUEDA;
            echo '      │ '.substr($detalle->TIPO_BUSQUEDA ?? 'SIN TIPO', 0, 40)."\n";
        }

        printf("      ├─── %-12s: %s búsquedas\n",
            $detalle->origen,
            number_format($detalle->total)
        );

        $datosExportDetalle[] = [
            'notaria' => $detalle->NOTARIA,
            'tipo_busqueda' => $detalle->TIPO_BUSQUEDA,
            'origen' => $detalle->origen,
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

    $busquedasRecientesWeb = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('FECHA', '>=', $fecha30Dias)
        ->count();

    $busquedasRecientesEscritorio = DB::connection('aplicativos')
        ->table('busquedas_escritorio')
        ->where('FECHA', '>=', $fecha30Dias)
        ->count();

    $busquedasRecientes = $busquedasRecientesWeb + $busquedasRecientesEscritorio;

    echo '   • Búsquedas en últimos 30 días: '.number_format($busquedasRecientes)."\n";
    echo '     ├─ WEB: '.number_format($busquedasRecientesWeb)."\n";
    echo '     └─ ESCRITORIO: '.number_format($busquedasRecientesEscritorio)."\n\n";

    if ($busquedasRecientes > 0) {
        echo "   Top 10 Notarías más activas (últimos 30 días):\n";
        echo '   '.str_repeat('─', 64)."\n";

        $topRecientes = DB::connection('aplicativos')
            ->table(DB::raw('(
                SELECT NOTARIA, "WEB" as origen FROM busquedas WHERE FECHA >= "'.addslashes($fecha30Dias).'"
                UNION ALL
                SELECT NOTARIA, "ESCRITORIO" as origen FROM busquedas_escritorio WHERE FECHA >= "'.addslashes($fecha30Dias).'"
            ) as recientes_combinadas'))
            ->select('NOTARIA')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN origen = "WEB" THEN 1 ELSE 0 END) as total_web')
            ->selectRaw('SUM(CASE WHEN origen = "ESCRITORIO" THEN 1 ELSE 0 END) as total_escritorio')
            ->groupBy('NOTARIA')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        foreach ($topRecientes as $i => $top) {
            printf("   %2d. %-30s: %s (Web: %s | Escrit: %s)\n",
                $i + 1,
                substr($top->NOTARIA, 0, 30),
                number_format($top->total),
                number_format($top->total_web),
                number_format($top->total_escritorio)
            );
        }
    }

    echo "\n";

    // ========================================================================
    // 6. LISTADO COMPLETO DE NOTARÍAS POR TIPO DE USO
    // ========================================================================
    echo "📋 LISTADO COMPLETO DE NOTARÍAS POR TIPO DE USO\n";
    echo str_repeat('─', 66)."\n\n";

    // Clasificar notarías según su uso
    $notariasWeb = [];
    $notariasEscritorio = [];
    $notariasMixtas = [];

    foreach ($busquedasPorNotaria as $notaria) {
        if ($notaria->total_web > 0 && $notaria->total_escritorio > 0) {
            $notariasMixtas[] = $notaria;
        } elseif ($notaria->total_web > 0) {
            $notariasWeb[] = $notaria;
        } elseif ($notaria->total_escritorio > 0) {
            $notariasEscritorio[] = $notaria;
        }
    }

    // 1. Notarías que usan SOLO WEB
    echo '🌐 NOTARÍAS QUE USAN SOLO APLICACIÓN WEB ('.count($notariasWeb)." notarías)\n";
    echo str_repeat('─', 66)."\n";
    printf("   %-35s %15s %12s\n", 'NOTARÍA', 'BÚSQUEDAS', 'ÚLTIMA');
    echo '   '.str_repeat('─', 64)."\n";

    foreach ($notariasWeb as $notaria) {
        printf("   %-35s %15s %12s\n",
            substr($notaria->NOTARIA, 0, 35),
            number_format($notaria->total_web),
            date('Y-m-d', strtotime($notaria->ultima_busqueda))
        );
    }

    echo "\n";

    // 2. Notarías que usan SOLO ESCRITORIO
    echo '💻 NOTARÍAS QUE USAN SOLO APLICACIÓN ESCRITORIO ('.count($notariasEscritorio)." notarías)\n";
    echo str_repeat('─', 66)."\n";
    printf("   %-35s %15s %12s\n", 'NOTARÍA', 'BÚSQUEDAS', 'ÚLTIMA');
    echo '   '.str_repeat('─', 64)."\n";

    foreach ($notariasEscritorio as $notaria) {
        printf("   %-35s %15s %12s\n",
            substr($notaria->NOTARIA, 0, 35),
            number_format($notaria->total_escritorio),
            date('Y-m-d', strtotime($notaria->ultima_busqueda))
        );
    }

    echo "\n";

    // 3. Notarías que usan AMBAS plataformas
    if (count($notariasMixtas) > 0) {
        echo '🔄 NOTARÍAS QUE USAN AMBAS PLATAFORMAS ('.count($notariasMixtas)." notarías)\n";
        echo str_repeat('─', 66)."\n";
        printf("   %-25s %10s %10s %10s %12s\n",
            'NOTARÍA', 'TOTAL', 'WEB', 'ESCRIT.', 'ÚLTIMA');
        echo '   '.str_repeat('─', 64)."\n";

        foreach ($notariasMixtas as $notaria) {
            $pWeb = round(($notaria->total_web / $notaria->total_busquedas) * 100, 1);
            printf("   %-25s %10s %10s %10s %12s\n",
                substr($notaria->NOTARIA, 0, 25),
                number_format($notaria->total_busquedas),
                number_format($notaria->total_web)." ({$pWeb}%)",
                number_format($notaria->total_escritorio),
                date('Y-m-d', strtotime($notaria->ultima_busqueda))
            );
        }

        echo "\n";
    } else {
        echo "🔄 NOTARÍAS QUE USAN AMBAS PLATAFORMAS: Ninguna\n\n";
    }

    // Resumen
    echo "📊 RESUMEN POR TIPO DE USO:\n";
    echo str_repeat('─', 66)."\n";
    printf("   %-30s: %s notarías (%s búsquedas)\n",
        'Solo WEB',
        number_format(count($notariasWeb)),
        number_format(array_sum(array_column($notariasWeb, 'total_web')))
    );
    printf("   %-30s: %s notarías (%s búsquedas)\n",
        'Solo ESCRITORIO',
        number_format(count($notariasEscritorio)),
        number_format(array_sum(array_column($notariasEscritorio, 'total_escritorio')))
    );
    printf("   %-30s: %s notarías (%s búsquedas)\n",
        'Uso MIXTO',
        number_format(count($notariasMixtas)),
        number_format(array_sum(array_column($notariasMixtas, 'total_busquedas')))
    );

    echo "\n";

    // ========================================================================
    // EXPORTACIÓN DE DATOS
    // ========================================================================
    if ($exportFormat) {
        $timestamp = date('Y-m-d_His');

        switch (strtolower($exportFormat)) {
            case 'csv':
                // Exportar notarías
                $csvNotarias = "reporte_completo_notarias_{$timestamp}.csv";
                $fp = fopen($csvNotarias, 'w');
                fputcsv($fp, ['Notaría', 'Total Búsquedas', 'Búsquedas Web', 'Búsquedas Escritorio', 'Primera Búsqueda', 'Última Búsqueda']);
                foreach ($datosExportNotarias as $row) {
                    fputcsv($fp, $row);
                }
                fclose($fp);
                echo "✅ Exportado: {$csvNotarias}\n";

                // Exportar tipos
                $csvTipos = "reporte_completo_tipos_{$timestamp}.csv";
                $fp = fopen($csvTipos, 'w');
                fputcsv($fp, ['Tipo Búsqueda', 'Origen', 'Total', 'Porcentaje']);
                foreach ($datosExportTipos as $row) {
                    fputcsv($fp, $row);
                }
                fclose($fp);
                echo "✅ Exportado: {$csvTipos}\n";

                // Exportar detalle
                $csvDetalle = "reporte_completo_detalle_{$timestamp}.csv";
                $fp = fopen($csvDetalle, 'w');
                fputcsv($fp, ['Notaría', 'Tipo Búsqueda', 'Origen', 'Total']);
                foreach ($datosExportDetalle as $row) {
                    fputcsv($fp, $row);
                }
                fclose($fp);
                echo "✅ Exportado: {$csvDetalle}\n";

                // Exportar clasificación por tipo de uso
                $csvClasificacion = "reporte_completo_clasificacion_{$timestamp}.csv";
                $fp = fopen($csvClasificacion, 'w');
                fputcsv($fp, ['Notaría', 'Tipo de Uso', 'Total Búsquedas', 'Búsquedas Web', 'Búsquedas Escritorio', 'Última Búsqueda']);

                foreach ($notariasWeb as $notaria) {
                    fputcsv($fp, [
                        $notaria->NOTARIA,
                        'SOLO WEB',
                        $notaria->total_busquedas,
                        $notaria->total_web,
                        0,
                        $notaria->ultima_busqueda,
                    ]);
                }

                foreach ($notariasEscritorio as $notaria) {
                    fputcsv($fp, [
                        $notaria->NOTARIA,
                        'SOLO ESCRITORIO',
                        $notaria->total_busquedas,
                        0,
                        $notaria->total_escritorio,
                        $notaria->ultima_busqueda,
                    ]);
                }

                foreach ($notariasMixtas as $notaria) {
                    fputcsv($fp, [
                        $notaria->NOTARIA,
                        'MIXTO',
                        $notaria->total_busquedas,
                        $notaria->total_web,
                        $notaria->total_escritorio,
                        $notaria->ultima_busqueda,
                    ]);
                }

                fclose($fp);
                echo "✅ Exportado: {$csvClasificacion}\n";
                break;

            case 'json':
                $jsonFile = "reporte_completo_busquedas_{$timestamp}.json";
                $jsonData = [
                    'fecha_generacion' => date('Y-m-d H:i:s'),
                    'resumen' => [
                        'total_busquedas' => $totalBusquedas,
                        'total_web' => $totalWeb,
                        'total_escritorio' => $totalEscritorio,
                        'porcentaje_web' => $porcentajeWeb,
                        'porcentaje_escritorio' => $porcentajeEscritorio,
                        'total_notarias' => $notariasUnicas,
                        'notarias_solo_web' => count($notariasWeb),
                        'notarias_solo_escritorio' => count($notariasEscritorio),
                        'notarias_mixtas' => count($notariasMixtas),
                        'busquedas_30_dias' => $busquedasRecientes,
                        'busquedas_30_dias_web' => $busquedasRecientesWeb,
                        'busquedas_30_dias_escritorio' => $busquedasRecientesEscritorio,
                    ],
                    'notarias' => $datosExportNotarias,
                    'tipos_busqueda' => $datosExportTipos,
                    'detalle' => $datosExportDetalle,
                    'clasificacion' => [
                        'solo_web' => array_map(function ($n) {
                            return [
                                'notaria' => $n->NOTARIA,
                                'total_busquedas' => $n->total_web,
                                'ultima_busqueda' => $n->ultima_busqueda,
                            ];
                        }, $notariasWeb),
                        'solo_escritorio' => array_map(function ($n) {
                            return [
                                'notaria' => $n->NOTARIA,
                                'total_busquedas' => $n->total_escritorio,
                                'ultima_busqueda' => $n->ultima_busqueda,
                            ];
                        }, $notariasEscritorio),
                        'mixtas' => array_map(function ($n) {
                            return [
                                'notaria' => $n->NOTARIA,
                                'total_busquedas' => $n->total_busquedas,
                                'busquedas_web' => $n->total_web,
                                'busquedas_escritorio' => $n->total_escritorio,
                                'ultima_busqueda' => $n->ultima_busqueda,
                            ];
                        }, $notariasMixtas),
                    ],
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
    echo '   Mensaje: '.$e->getMessage()."\n";
    echo '   Archivo: '.$e->getFile()."\n";
    echo '   Línea: '.$e->getLine()."\n\n";
    exit(1);
}
