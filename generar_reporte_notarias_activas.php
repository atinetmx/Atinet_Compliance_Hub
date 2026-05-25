<?php

/**
 * ============================================================================
 * REPORTE DE NOTARÍAS ACTIVAS POR TIPO DE BÚSQUEDA Y PLATAFORMA
 * ============================================================================
 *
 * Genera un reporte detallado de notarías activas clasificadas por:
 * - Tipo de búsqueda: Lista Negra (OFAC) y Lista SAT
 * - Plataforma: WEB, ESCRITORIO, MIXTAS
 *
 * INFORMACIÓN QUE GENERA:
 * 1. Notarías activas en Lista Negra por plataforma
 * 2. Notarías activas en Lista SAT por plataforma
 * 3. Análisis de actividad reciente
 * 4. Estadísticas comparativas
 *
 * USO:
 *   php generar_reporte_notarias_activas.php
 *   php generar_reporte_notarias_activas.php --export=csv
 *   php generar_reporte_notarias_activas.php --export=json
 *
 * @version 1.0
 * @date 2026-04-22
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Configuración
$exportFormat = null;
if (isset($argv[1]) && strpos($argv[1], '--export=') === 0) {
    $exportFormat = substr($argv[1], 9);
}

echo "==================================================================\n";
echo "  REPORTE DE NOTARÍAS ACTIVAS POR TIPO DE BÚSQUEDA\n";
echo "  Base de datos: atinet65_aplicativos\n";
echo "  Fecha: ".date('Y-m-d H:i:s')."\n";
echo "==================================================================\n\n";

try {
    // ========================================================================
    // ANÁLISIS DE LISTA NEGRA (OFAC)
    // ========================================================================
    
    echo "🔴 NOTARÍAS ACTIVAS EN LISTA NEGRA (OFAC)\n";
    echo str_repeat('═', 66)."\n\n";

    // Lista Negra - Solo WEB
    $listaNegraWeb = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('TIPO_BUSQUEDA', 'Lista Negra')
        ->select('NOTARIA')
        ->selectRaw('COUNT(*) as total_busquedas')
        ->selectRaw('MAX(FECHA) as ultima_busqueda')
        ->selectRaw('MIN(FECHA) as primera_busqueda')
        ->groupBy('NOTARIA')
        ->orderByDesc('total_busquedas')
        ->get();

    // Lista Negra - Solo ESCRITORIO
    $listaNegraEscritorio = DB::connection('aplicativos')
        ->table('busquedas_escritorio')
        ->where('TIPO_BUSQUEDA', 'Lista Negra')
        ->select('NOTARIA')
        ->selectRaw('COUNT(*) as total_busquedas')
        ->selectRaw('MAX(FECHA) as ultima_busqueda')
        ->selectRaw('MIN(FECHA) as primera_busqueda')
        ->groupBy('NOTARIA')
        ->orderByDesc('total_busquedas')
        ->get();

    // Identificar notarías mixtas en Lista Negra
    $notariasWebListaNegra = $listaNegraWeb->pluck('NOTARIA')->toArray();
    $notariasEscritorioListaNegra = $listaNegraEscritorio->pluck('NOTARIA')->toArray();
    $notariasMixtasListaNegra = array_intersect($notariasWebListaNegra, $notariasEscritorioListaNegra);
    $notariasSoloWebListaNegra = array_diff($notariasWebListaNegra, $notariasMixtasListaNegra);
    $notariasSoloEscritorioListaNegra = array_diff($notariasEscritorioListaNegra, $notariasMixtasListaNegra);

    // SOLO WEB - Lista Negra
    echo "🌐 Notarías que usan SOLO WEB para Lista Negra (".count($notariasSoloWebListaNegra)." notarías)\n";
    echo str_repeat('─', 66)."\n";
    printf("   %-35s %15s %12s\n", 'NOTARÍA', 'BÚSQUEDAS', 'ÚLTIMA');
    echo "   ".str_repeat('─', 64)."\n";

    $datosExportListaNegra = [];
    foreach ($listaNegraWeb as $notaria) {
        if (in_array($notaria->NOTARIA, $notariasSoloWebListaNegra)) {
            printf("   %-35s %15s %12s\n",
                substr($notaria->NOTARIA, 0, 35),
                number_format($notaria->total_busquedas),
                date('Y-m-d', strtotime($notaria->ultima_busqueda))
            );

            $datosExportListaNegra[] = [
                'notaria' => $notaria->NOTARIA,
                'tipo_busqueda' => 'Lista Negra',
                'plataforma' => 'SOLO WEB',
                'total_busquedas' => $notaria->total_busquedas,
                'primera_busqueda' => $notaria->primera_busqueda,
                'ultima_busqueda' => $notaria->ultima_busqueda,
            ];
        }
    }

    echo "\n";

    // SOLO ESCRITORIO - Lista Negra
    echo "💻 Notarías que usan SOLO ESCRITORIO para Lista Negra (".count($notariasSoloEscritorioListaNegra)." notarías)\n";
    echo str_repeat('─', 66)."\n";
    printf("   %-35s %15s %12s\n", 'NOTARÍA', 'BÚSQUEDAS', 'ÚLTIMA');
    echo "   ".str_repeat('─', 64)."\n";

    foreach ($listaNegraEscritorio as $notaria) {
        if (in_array($notaria->NOTARIA, $notariasSoloEscritorioListaNegra)) {
            printf("   %-35s %15s %12s\n",
                substr($notaria->NOTARIA, 0, 35),
                number_format($notaria->total_busquedas),
                date('Y-m-d', strtotime($notaria->ultima_busqueda))
            );

            $datosExportListaNegra[] = [
                'notaria' => $notaria->NOTARIA,
                'tipo_busqueda' => 'Lista Negra',
                'plataforma' => 'SOLO ESCRITORIO',
                'total_busquedas' => $notaria->total_busquedas,
                'primera_busqueda' => $notaria->primera_busqueda,
                'ultima_busqueda' => $notaria->ultima_busqueda,
            ];
        }
    }

    echo "\n";

    // MIXTAS - Lista Negra
    if (count($notariasMixtasListaNegra) > 0) {
        echo "🔄 Notarías que usan AMBAS PLATAFORMAS para Lista Negra (".count($notariasMixtasListaNegra)." notarías)\n";
        echo str_repeat('─', 66)."\n";
        printf("   %-25s %10s %10s %10s %12s\n", 
            'NOTARÍA', 'TOTAL', 'WEB', 'ESCRIT.', 'ÚLTIMA');
        echo "   ".str_repeat('─', 64)."\n";

        foreach ($notariasMixtasListaNegra as $notariaNombre) {
            $web = $listaNegraWeb->firstWhere('NOTARIA', $notariaNombre);
            $escritorio = $listaNegraEscritorio->firstWhere('NOTARIA', $notariaNombre);
            
            $totalWeb = $web ? $web->total_busquedas : 0;
            $totalEscritorio = $escritorio ? $escritorio->total_busquedas : 0;
            $total = $totalWeb + $totalEscritorio;
            $ultimaFecha = max(
                $web ? strtotime($web->ultima_busqueda) : 0,
                $escritorio ? strtotime($escritorio->ultima_busqueda) : 0
            );

            printf("   %-25s %10s %10s %10s %12s\n",
                substr($notariaNombre, 0, 25),
                number_format($total),
                number_format($totalWeb),
                number_format($totalEscritorio),
                date('Y-m-d', $ultimaFecha)
            );

            $datosExportListaNegra[] = [
                'notaria' => $notariaNombre,
                'tipo_busqueda' => 'Lista Negra',
                'plataforma' => 'MIXTA',
                'total_busquedas' => $total,
                'busquedas_web' => $totalWeb,
                'busquedas_escritorio' => $totalEscritorio,
                'primera_busqueda' => min($web->primera_busqueda, $escritorio->primera_busqueda),
                'ultima_busqueda' => date('Y-m-d H:i:s', $ultimaFecha),
            ];
        }

        echo "\n";
    }

    // Resumen Lista Negra
    $totalNotariasListaNegra = count($notariasSoloWebListaNegra) + count($notariasSoloEscritorioListaNegra) + count($notariasMixtasListaNegra);
    $totalBusquedasListaNegra = $listaNegraWeb->sum('total_busquedas') + $listaNegraEscritorio->sum('total_busquedas');

    echo "📊 RESUMEN LISTA NEGRA:\n";
    echo str_repeat('─', 66)."\n";
    printf("   %-30s: %s\n", 'Total notarías activas', $totalNotariasListaNegra);
    printf("   %-30s: %s\n", 'Total búsquedas', number_format($totalBusquedasListaNegra));
    printf("   %-30s: %s (%s%%)\n", 
        'Solo WEB', 
        count($notariasSoloWebListaNegra),
        round((count($notariasSoloWebListaNegra) / $totalNotariasListaNegra) * 100, 1)
    );
    printf("   %-30s: %s (%s%%)\n", 
        'Solo ESCRITORIO', 
        count($notariasSoloEscritorioListaNegra),
        round((count($notariasSoloEscritorioListaNegra) / $totalNotariasListaNegra) * 100, 1)
    );
    printf("   %-30s: %s (%s%%)\n", 
        'MIXTAS', 
        count($notariasMixtasListaNegra),
        round((count($notariasMixtasListaNegra) / $totalNotariasListaNegra) * 100, 1)
    );

    echo "\n\n";

    // ========================================================================
    // ANÁLISIS DE LISTA SAT
    // ========================================================================
    
    echo "🟡 NOTARÍAS ACTIVAS EN LISTA SAT\n";
    echo str_repeat('═', 66)."\n\n";

    // Lista SAT - Solo existe en WEB
    $listaSatWeb = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('TIPO_BUSQUEDA', 'Lista SAT')
        ->select('NOTARIA')
        ->selectRaw('COUNT(*) as total_busquedas')
        ->selectRaw('MAX(FECHA) as ultima_busqueda')
        ->selectRaw('MIN(FECHA) as primera_busqueda')
        ->groupBy('NOTARIA')
        ->orderByDesc('total_busquedas')
        ->get();

    // Verificar si existe en escritorio (no debería)
    $listaSatEscritorio = DB::connection('aplicativos')
        ->table('busquedas_escritorio')
        ->where('TIPO_BUSQUEDA', 'Lista SAT')
        ->count();

    echo "🌐 Notarías que usan WEB para Lista SAT (".$listaSatWeb->count()." notarías)\n";
    echo str_repeat('─', 66)."\n";
    printf("   %-35s %15s %12s\n", 'NOTARÍA', 'BÚSQUEDAS', 'ÚLTIMA');
    echo "   ".str_repeat('─', 64)."\n";

    $datosExportListaSat = [];
    foreach ($listaSatWeb as $notaria) {
        printf("   %-35s %15s %12s\n",
            substr($notaria->NOTARIA, 0, 35),
            number_format($notaria->total_busquedas),
            date('Y-m-d', strtotime($notaria->ultima_busqueda))
        );

        $datosExportListaSat[] = [
            'notaria' => $notaria->NOTARIA,
            'tipo_busqueda' => 'Lista SAT',
            'plataforma' => 'WEB',
            'total_busquedas' => $notaria->total_busquedas,
            'primera_busqueda' => $notaria->primera_busqueda,
            'ultima_busqueda' => $notaria->ultima_busqueda,
        ];
    }

    echo "\n";

    if ($listaSatEscritorio > 0) {
        echo "⚠️  ALERTA: Se encontraron {$listaSatEscritorio} búsquedas SAT en ESCRITORIO\n";
        echo "   (Esto es inusual, la app de escritorio no debería tener esta funcionalidad)\n\n";
    } else {
        echo "ℹ️  NOTA: La aplicación de ESCRITORIO NO tiene funcionalidad para búsquedas SAT\n";
        echo "   Solo la aplicación WEB puede realizar búsquedas en Lista SAT\n\n";
    }

    // Resumen Lista SAT
    $totalNotariasListaSat = $listaSatWeb->count();
    $totalBusquedasListaSat = $listaSatWeb->sum('total_busquedas');

    echo "📊 RESUMEN LISTA SAT:\n";
    echo str_repeat('─', 66)."\n";
    printf("   %-30s: %s\n", 'Total notarías activas', $totalNotariasListaSat);
    printf("   %-30s: %s\n", 'Total búsquedas', number_format($totalBusquedasListaSat));
    printf("   %-30s: %s (100%%)\n", 'Solo WEB', $totalNotariasListaSat);
    printf("   %-30s: %s\n", 'Solo ESCRITORIO', '0 (funcionalidad no disponible)');

    echo "\n\n";

    // ========================================================================
    // ANÁLISIS COMPARATIVO
    // ========================================================================
    
    echo "📊 ANÁLISIS COMPARATIVO\n";
    echo str_repeat('═', 66)."\n\n";

    // Notarías que usan ambos tipos de búsqueda
    $notariasListaNegra = array_unique(array_merge($notariasWebListaNegra, $notariasEscritorioListaNegra));
    $notariasListaSat = $listaSatWeb->pluck('NOTARIA')->toArray();
    $notariasAmbasBusquedas = array_intersect($notariasListaNegra, $notariasListaSat);
    $notariasSoloListaNegra = array_diff($notariasListaNegra, $notariasListaSat);
    $notariasSoloListaSat = array_diff($notariasListaSat, $notariasListaNegra);

    echo "🔍 Notarías según tipos de búsqueda que realizan:\n";
    echo str_repeat('─', 66)."\n";
    printf("   %-40s: %s\n", 'Usan AMBAS (Lista Negra + SAT)', count($notariasAmbasBusquedas));
    printf("   %-40s: %s\n", 'Usan SOLO Lista Negra', count($notariasSoloListaNegra));
    printf("   %-40s: %s\n", 'Usan SOLO Lista SAT', count($notariasSoloListaSat));

    echo "\n";

    // Mostrar notarías que usan ambas
    if (count($notariasAmbasBusquedas) > 0) {
        echo "🎯 Notarías que usan AMBOS tipos de búsqueda:\n";
        echo "   ".str_repeat('─', 60)."\n";
        foreach ($notariasAmbasBusquedas as $notariaNombre) {
            echo "   ✓ {$notariaNombre}\n";
        }
        echo "\n";
    }

    // Mostrar notarías limitadas a Lista Negra
    if (count($notariasSoloListaNegra) > 0) {
        echo "⚠️  Notarías LIMITADAS a Lista Negra (no usan SAT):\n";
        echo "   ".str_repeat('─', 60)."\n";
        $contador = 0;
        foreach ($notariasSoloListaNegra as $notariaNombre) {
            echo "   • {$notariaNombre}\n";
            $contador++;
            if ($contador >= 10) {
                $restantes = count($notariasSoloListaNegra) - 10;
                if ($restantes > 0) {
                    echo "   ... y {$restantes} más\n";
                }
                break;
            }
        }
        echo "\n";
    }

    echo "\n";

    // ========================================================================
    // ACTIVIDAD RECIENTE (ÚLTIMOS 30 DÍAS)
    // ========================================================================
    
    echo "📅 ACTIVIDAD RECIENTE (ÚLTIMOS 30 DÍAS)\n";
    echo str_repeat('═', 66)."\n\n";

    $fecha30Dias = date('Y-m-d H:i:s', strtotime('-30 days'));

    // Lista Negra reciente
    $listaNegra30DiasWeb = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('TIPO_BUSQUEDA', 'Lista Negra')
        ->where('FECHA', '>=', $fecha30Dias)
        ->count();

    $listaNegra30DiasEscritorio = DB::connection('aplicativos')
        ->table('busquedas_escritorio')
        ->where('TIPO_BUSQUEDA', 'Lista Negra')
        ->where('FECHA', '>=', $fecha30Dias)
        ->count();

    // Lista SAT reciente
    $listaSat30DiasWeb = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('TIPO_BUSQUEDA', 'Lista SAT')
        ->where('FECHA', '>=', $fecha30Dias)
        ->count();

    echo "🔴 Lista Negra:\n";
    printf("   %-30s: %s\n", 'Búsquedas WEB', number_format($listaNegra30DiasWeb));
    printf("   %-30s: %s\n", 'Búsquedas ESCRITORIO', number_format($listaNegra30DiasEscritorio));
    printf("   %-30s: %s\n", 'Total', number_format($listaNegra30DiasWeb + $listaNegra30DiasEscritorio));

    echo "\n🟡 Lista SAT:\n";
    printf("   %-30s: %s\n", 'Búsquedas WEB', number_format($listaSat30DiasWeb));
    printf("   %-30s: %s\n", 'Total', number_format($listaSat30DiasWeb));

    echo "\n";

    // ========================================================================
    // EXPORTACIÓN DE DATOS
    // ========================================================================
    if ($exportFormat) {
        $timestamp = date('Y-m-d_His');
        
        switch (strtolower($exportFormat)) {
            case 'csv':
                // Exportar Lista Negra
                $csvListaNegra = "reporte_activas_lista_negra_{$timestamp}.csv";
                $fp = fopen($csvListaNegra, 'w');
                fputcsv($fp, ['Notaría', 'Tipo Búsqueda', 'Plataforma', 'Total Búsquedas', 'Búsquedas Web', 'Búsquedas Escritorio', 'Primera Búsqueda', 'Última Búsqueda']);
                foreach ($datosExportListaNegra as $row) {
                    fputcsv($fp, [
                        $row['notaria'],
                        $row['tipo_busqueda'],
                        $row['plataforma'],
                        $row['total_busquedas'],
                        $row['busquedas_web'] ?? $row['total_busquedas'],
                        $row['busquedas_escritorio'] ?? 0,
                        $row['primera_busqueda'],
                        $row['ultima_busqueda'],
                    ]);
                }
                fclose($fp);
                echo "✅ Exportado: {$csvListaNegra}\n";

                // Exportar Lista SAT
                $csvListaSat = "reporte_activas_lista_sat_{$timestamp}.csv";
                $fp = fopen($csvListaSat, 'w');
                fputcsv($fp, ['Notaría', 'Tipo Búsqueda', 'Plataforma', 'Total Búsquedas', 'Primera Búsqueda', 'Última Búsqueda']);
                foreach ($datosExportListaSat as $row) {
                    fputcsv($fp, $row);
                }
                fclose($fp);
                echo "✅ Exportado: {$csvListaSat}\n";
                break;

            case 'json':
                $jsonFile = "reporte_notarias_activas_{$timestamp}.json";
                $jsonData = [
                    'fecha_generacion' => date('Y-m-d H:i:s'),
                    'resumen' => [
                        'lista_negra' => [
                            'total_notarias' => $totalNotariasListaNegra,
                            'total_busquedas' => $totalBusquedasListaNegra,
                            'solo_web' => count($notariasSoloWebListaNegra),
                            'solo_escritorio' => count($notariasSoloEscritorioListaNegra),
                            'mixtas' => count($notariasMixtasListaNegra),
                        ],
                        'lista_sat' => [
                            'total_notarias' => $totalNotariasListaSat,
                            'total_busquedas' => $totalBusquedasListaSat,
                            'solo_web' => $totalNotariasListaSat,
                        ],
                        'comparativo' => [
                            'ambas_busquedas' => count($notariasAmbasBusquedas),
                            'solo_lista_negra' => count($notariasSoloListaNegra),
                            'solo_lista_sat' => count($notariasSoloListaSat),
                        ],
                    ],
                    'lista_negra' => $datosExportListaNegra,
                    'lista_sat' => $datosExportListaSat,
                    'actividad_30_dias' => [
                        'lista_negra_web' => $listaNegra30DiasWeb,
                        'lista_negra_escritorio' => $listaNegra30DiasEscritorio,
                        'lista_sat_web' => $listaSat30DiasWeb,
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
    echo "   Mensaje: ".$e->getMessage()."\n";
    echo "   Archivo: ".$e->getFile()."\n";
    echo "   Línea: ".$e->getLine()."\n\n";
    exit(1);
}
