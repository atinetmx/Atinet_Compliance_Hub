<?php

/**
 * ============================================================================
 * REPORTE DE ACTIVIDAD DE NOTARÍAS - TODAS LAS FUENTES
 * ============================================================================
 *
 * Genera un reporte completo de actividad de notarías consultando TODAS las
 * fuentes de datos disponibles:
 *
 * BÚSQUEDAS WEB (navegador):
 *   1. atinet65_aplicativos.busquedas
 *
 * BÚSQUEDAS ESCRITORIO (aplicativos locales):
 *   2. atinet65_aplicativos.busquedas_escritorio
 *   3. atinet65_listasofac.consultas
 *   4. atinet65_listassat.consultas
 *   5. atinet65_listasnegras.consultas (Sistema Legacy)
 *
 * El reporte permite:
 * - Ver actividad general de todas las notarías
 * - Filtrar y resaltar una notaría específica
 * - Filtrar por año específico
 * - Comparar actividad entre WEB vs ESCRITORIO
 * - Exportar a CSV, JSON o PDF/HTML
 *
 * PARÁMETROS:
 *   --notaria=PATRON  Filtrar notarías que coincidan con el patrón (ej: 14villahermosa, 14%)
 *   --year=YYYY       Filtrar consultas del año específico (ej: 2026, 2025)
 *   --export=FORMATO  Exportar en formato: csv, json, pdf, html
 *
 * USO:
 *   php generar_reporte_actividad_notaria.php
 *   php generar_reporte_actividad_notaria.php --notaria=14villahermosa
 *   php generar_reporte_actividad_notaria.php --notaria=14villahermosa --year=2026
 *   php generar_reporte_actividad_notaria.php --notaria=14% --year=2025 --export=pdf
 *   php generar_reporte_actividad_notaria.php --notaria=14 --export=json
 *
 * @version 1.2
 * @date 2026-05-27
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// ============================================================================
// CONFIGURACIÓN Y PARÁMETROS
// ============================================================================

$notariaFiltro = null;
$exportFormat = null;
$yearFiltro = null;

// Procesar argumentos de línea de comandos
foreach ($argv as $arg) {
    if (strpos($arg, '--notaria=') === 0) {
        $notariaFiltro = substr($arg, 10);
        // Si no tiene %, agregarlo al final para búsqueda LIKE
        if (strpos($notariaFiltro, '%') === false) {
            $notariaFiltro = $notariaFiltro . '%';
        }
    }
    if (strpos($arg, '--export=') === 0) {
        $exportFormat = substr($arg, 9);
    }
    if (strpos($arg, '--year=') === 0) {
        $yearFiltro = (int)substr($arg, 7);
    }
}

echo "==================================================================\n";
echo "  REPORTE DE ACTIVIDAD DE NOTARÍAS - TODAS LAS FUENTES\n";
echo "  Fecha: ".date('Y-m-d H:i:s')."\n";
if ($notariaFiltro) {
    echo "  Filtro aplicado: NOTARIA/PROYECTO LIKE '{$notariaFiltro}'\n";
}
if ($yearFiltro) {
    echo "  Filtro de año: {$yearFiltro}\n";
}
echo "==================================================================\n\n";

$datosExport = [];

try {
    // ========================================================================
    // 1. CONSULTAR TODAS LAS FUENTES DE DATOS
    // ========================================================================

    echo "🔍 CONSULTANDO FUENTES DE DATOS...\n";
    echo str_repeat('─', 66)."\n\n";

    // === FUENTE 1: busquedas (WEB) ===
    echo "  🌐 Consultando atinet65_aplicativos.busquedas (WEB)...\n";
    $busquedasWeb = DB::connection('aplicativos_remote')
        ->table('busquedas')
        ->when($yearFiltro, function($query) use ($yearFiltro) {
            return $query->whereYear('FECHA', $yearFiltro);
        })
        ->select('NOTARIA')
        ->selectRaw('COUNT(*) as total')
        ->selectRaw('MIN(FECHA) as primera')
        ->selectRaw('MAX(FECHA) as ultima')
        ->groupBy('NOTARIA')
        ->orderByDesc('total')
        ->get()
        ->map(function ($item) {
            return [
                'notaria' => $item->NOTARIA,
                'total' => $item->total,
                'primera' => $item->primera,
                'ultima' => $item->ultima,
                'fuente' => 'aplicativos.busquedas',
                'origen' => 'WEB',
            ];
        });

    echo "     ✓ ".number_format($busquedasWeb->count())." notarías encontradas\n";
    echo "     ✓ ".number_format($busquedasWeb->sum('total'))." búsquedas totales\n\n";

    // === FUENTE 2: busquedas_escritorio (ESCRITORIO) ===
    echo "  💻 Consultando atinet65_aplicativos.busquedas_escritorio (ESCRITORIO)...\n";
    $busquedasEscritorio = DB::connection('aplicativos_remote')
        ->table('busquedas_escritorio')
        ->when($yearFiltro, function($query) use ($yearFiltro) {
            return $query->whereYear('FECHA', $yearFiltro);
        })
        ->select('NOTARIA')
        ->selectRaw('COUNT(*) as total')
        ->selectRaw('MIN(FECHA) as primera')
        ->selectRaw('MAX(FECHA) as ultima')
        ->groupBy('NOTARIA')
        ->orderByDesc('total')
        ->get()
        ->map(function ($item) {
            return [
                'notaria' => $item->NOTARIA,
                'total' => $item->total,
                'primera' => $item->primera,
                'ultima' => $item->ultima,
                'fuente' => 'aplicativos.busquedas_escritorio',
                'origen' => 'ESCRITORIO',
            ];
        });

    echo "     ✓ ".number_format($busquedasEscritorio->count())." notarías encontradas\n";
    echo "     ✓ ".number_format($busquedasEscritorio->sum('total'))." búsquedas totales\n\n";

    // === FUENTE 3: listasofac.consultas (ESCRITORIO) ===
    echo "  💻 Consultando atinet65_listasofac.consultas (ESCRITORIO)...\n";
    $consultasOfac = DB::connection('ofac_remote')
        ->table('consultas')
        ->when($yearFiltro, function($query) use ($yearFiltro) {
            return $query->whereYear('fecha', $yearFiltro);
        })
        ->select('proyecto')
        ->selectRaw('COUNT(*) as total')
        ->selectRaw('MIN(fecha) as primera')
        ->selectRaw('MAX(fecha) as ultima')
        ->groupBy('proyecto')
        ->orderByDesc('total')
        ->get()
        ->map(function ($item) {
            return [
                'notaria' => $item->proyecto,
                'total' => $item->total,
                'primera' => $item->primera,
                'ultima' => $item->ultima,
                'fuente' => 'listasofac.consultas',
                'origen' => 'ESCRITORIO',
            ];
        });

    echo "     ✓ ".number_format($consultasOfac->count())." proyectos encontrados\n";
    echo "     ✓ ".number_format($consultasOfac->sum('total'))." consultas totales\n\n";

    // === FUENTE 4: listassat.consultas (ESCRITORIO) ===
    echo "  💻 Consultando atinet65_listassat.consultas (ESCRITORIO)...\n";
    $consultasSat = DB::connection('sat_remote')
        ->table('consultas')
        ->when($yearFiltro, function($query) use ($yearFiltro) {
            return $query->whereYear('fecha', $yearFiltro);
        })
        ->select('proyecto')
        ->selectRaw('COUNT(*) as total')
        ->selectRaw('MIN(fecha) as primera')
        ->selectRaw('MAX(fecha) as ultima')
        ->groupBy('proyecto')
        ->orderByDesc('total')
        ->get()
        ->map(function ($item) {
            return [
                'notaria' => $item->proyecto,
                'total' => $item->total,
                'primera' => $item->primera,
                'ultima' => $item->ultima,
                'fuente' => 'listassat.consultas',
                'origen' => 'ESCRITORIO',
            ];
        });

    echo "     ✓ ".number_format($consultasSat->count())." proyectos encontrados\n";
    echo "     ✓ ".number_format($consultasSat->sum('total'))." consultas totales\n\n";

    // === FUENTE 5: listasnegras.consultas (ESCRITORIO - LEGACY) ===
    echo "  💻 Consultando atinet65_listasnegras.consultas (ESCRITORIO - LEGACY)...\n";
    try {
        $consultasListasNegras = DB::connection('listasnegras_remote')
            ->table('consultas')
            ->when($yearFiltro, function($query) use ($yearFiltro) {
                return $query->whereYear('fecha', $yearFiltro);
            })
            ->select('proyecto')
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('MIN(fecha) as primera')
            ->selectRaw('MAX(fecha) as ultima')
            ->groupBy('proyecto')
            ->orderByDesc('total')
            ->get()
            ->map(function ($item) {
                return [
                    'notaria' => $item->proyecto,
                    'total' => $item->total,
                    'primera' => $item->primera,
                    'ultima' => $item->ultima,
                    'fuente' => 'listasnegras.consultas',
                    'origen' => 'ESCRITORIO',
                ];
            });

        echo "     ✓ ".number_format($consultasListasNegras->count())." proyectos encontrados\n";
        echo "     ✓ ".number_format($consultasListasNegras->sum('total'))." consultas totales\n\n";
    } catch (\Exception $e) {
        echo "     ⚠️  No se pudo consultar (conexión no configurada o BD no existe)\n";
        echo "     Error: ".$e->getMessage()."\n\n";
        $consultasListasNegras = collect([]);
    }

    // ========================================================================
    // 2. COMBINAR TODOS LOS DATOS
    // ========================================================================

    echo "📊 CONSOLIDANDO DATOS...\n";
    echo str_repeat('─', 66)."\n\n";

    $todosLosDatos = collect([])
        ->merge($busquedasWeb)
        ->merge($busquedasEscritorio)
        ->merge($consultasOfac)
        ->merge($consultasSat)
        ->merge($consultasListasNegras);

    // Agrupar por notaría (consolidar datos de todas las fuentes)
    $notariasConsolidadas = $todosLosDatos->groupBy(function ($item) {
        // Normalizar nombre (quitar espacios, a minúsculas)
        return strtolower(trim($item['notaria']));
    })->map(function ($grupo, $notariaNormalizada) {
        $fuentesDetalle = [];
        $totalGeneral = 0;
        $totalWeb = 0;
        $totalEscritorio = 0;
        $primeraGeneral = null;
        $ultimaGeneral = null;

        foreach ($grupo as $item) {
            $fuentesDetalle[] = [
                'fuente' => $item['fuente'],
                'origen' => $item['origen'],
                'total' => $item['total'],
                'primera' => $item['primera'],
                'ultima' => $item['ultima'],
            ];

            $totalGeneral += $item['total'];

            // Sumar por origen
            if ($item['origen'] === 'WEB') {
                $totalWeb += $item['total'];
            } else {
                $totalEscritorio += $item['total'];
            }

            // Primera fecha más antigua
            if ($primeraGeneral === null || $item['primera'] < $primeraGeneral) {
                $primeraGeneral = $item['primera'];
            }

            // Última fecha más reciente
            if ($ultimaGeneral === null || $item['ultima'] > $ultimaGeneral) {
                $ultimaGeneral = $item['ultima'];
            }
        }

        return [
            'notaria' => $grupo->first()['notaria'], // Nombre original
            'notaria_normalizada' => $notariaNormalizada,
            'total_general' => $totalGeneral,
            'total_web' => $totalWeb,
            'total_escritorio' => $totalEscritorio,
            'primera_general' => $primeraGeneral,
            'ultima_general' => $ultimaGeneral,
            'num_fuentes' => count($fuentesDetalle),
            'fuentes' => $fuentesDetalle,
        ];
    })->sortByDesc('total_general');

    echo "  ✓ Total de notarías únicas: ".number_format($notariasConsolidadas->count())."\n";
    echo "  ✓ Total de registros consolidados: ".number_format($notariasConsolidadas->sum('total_general'))."\n";
    echo "    ├─ WEB: ".number_format($notariasConsolidadas->sum('total_web'))." registros\n";
    echo "    └─ ESCRITORIO: ".number_format($notariasConsolidadas->sum('total_escritorio'))." registros\n\n";

    // ========================================================================
    // 3. APLICAR FILTRO SI SE ESPECIFICÓ
    // ========================================================================

    $notariasFiltradas = $notariasConsolidadas;
    $notariasResaltadas = collect([]);

    if ($notariaFiltro) {
        echo "🔍 APLICANDO FILTRO: {$notariaFiltro}\n";
        echo str_repeat('─', 66)."\n\n";

        // Convertir patrón SQL LIKE a expresión regular
        $patron = str_replace('%', '.*', preg_quote($notariaFiltro, '/'));
        $patron = '/^' . $patron . '/i';

        $notariasResaltadas = $notariasConsolidadas->filter(function ($item) use ($patron) {
            return preg_match($patron, $item['notaria']);
        });

        echo "  ✓ Notarías que coinciden con el filtro: ".number_format($notariasResaltadas->count())."\n";
        echo "  ✓ Total de actividad filtrada: ".number_format($notariasResaltadas->sum('total_general'))."\n\n";
    }

    // ========================================================================
    // 4. MOSTRAR RESULTADOS
    // ========================================================================

    echo "═══════════════════════════════════════════════════════════════════\n";
    echo "  REPORTE DE ACTIVIDAD POR NOTARÍA\n";
    echo "═══════════════════════════════════════════════════════════════════\n\n";

    // Si hay filtro, mostrar primero las notarías resaltadas
    if ($notariasResaltadas->isNotEmpty()) {
        echo "🎯 NOTARÍAS FILTRADAS (COINCIDEN CON '{$notariaFiltro}')\n";
        echo str_repeat('═', 66)."\n\n";

        foreach ($notariasResaltadas as $notaria) {
            echo "┌".str_repeat('─', 64)."┐\n";
            echo "│ 📌 NOTARÍA: ".str_pad($notaria['notaria'], 48)."│\n";
            echo "├".str_repeat('─', 64)."┤\n";
            echo sprintf("│   Total actividad: %-45s │\n", number_format($notaria['total_general']) . ' registros');
            echo sprintf("│     ├─ WEB: %-51s │\n", number_format($notaria['total_web']) . ' registros');
            echo sprintf("│     └─ ESCRITORIO: %-43s │\n", number_format($notaria['total_escritorio']) . ' registros');
            echo sprintf("│   Primera actividad: %-43s │\n", date('Y-m-d H:i:s', strtotime($notaria['primera_general'])));
            echo sprintf("│   Última actividad: %-44s │\n", date('Y-m-d H:i:s', strtotime($notaria['ultima_general'])));
            echo sprintf("│   Fuentes de datos: %-44s │\n", $notaria['num_fuentes'] . ' fuente(s)');
            echo "├".str_repeat('─', 64)."┤\n";
            echo "│   DETALLE POR FUENTE:".str_repeat(' ', 41)."│\n";

            foreach ($notaria['fuentes'] as $fuente) {
                $origenIcon = $fuente['origen'] === 'WEB' ? '🌐' : '💻';
                echo "├".str_repeat('─', 64)."┤\n";
                echo sprintf("│     %s %-54s │\n", $origenIcon, $fuente['fuente']);
                echo sprintf("│       Registros: %-46s │\n", number_format($fuente['total']));
                echo sprintf("│       Primera: %-48s │\n", date('Y-m-d H:i:s', strtotime($fuente['primera'])));
                echo sprintf("│       Última: %-49s │\n", date('Y-m-d H:i:s', strtotime($fuente['ultima'])));
            }

            echo "└".str_repeat('─', 64)."┘\n\n";

            // Agregar a datos de exportación
            $datosExport[] = [
                'notaria' => $notaria['notaria'],
                'total_general' => $notaria['total_general'],
                'total_web' => $notaria['total_web'],
                'total_escritorio' => $notaria['total_escritorio'],
                'primera_general' => $notaria['primera_general'],
                'ultima_general' => $notaria['ultima_general'],
                'num_fuentes' => $notaria['num_fuentes'],
                'destacada' => true,
            ];
        }

        echo "\n";
    }

    // ========================================================================
    // 5. RESUMEN POR FUENTE DE DATOS
    // ========================================================================

    echo "📋 RESUMEN POR FUENTE DE DATOS\n";
    echo str_repeat('═', 66)."\n\n";

    $resumenFuentes = [
        ['nombre' => 'aplicativos.busquedas', 'icon' => '🌐', 'tipo' => 'WEB', 'datos' => $busquedasWeb],
        ['nombre' => 'aplicativos.busquedas_escritorio', 'icon' => '💻', 'tipo' => 'ESCRITORIO', 'datos' => $busquedasEscritorio],
        ['nombre' => 'listasofac.consultas', 'icon' => '💻', 'tipo' => 'ESCRITORIO', 'datos' => $consultasOfac],
        ['nombre' => 'listassat.consultas', 'icon' => '💻', 'tipo' => 'ESCRITORIO', 'datos' => $consultasSat],
        ['nombre' => 'listasnegras.consultas', 'icon' => '💻', 'tipo' => 'ESCRITORIO LEGACY', 'datos' => $consultasListasNegras],
    ];

    foreach ($resumenFuentes as $fuente) {
        $datos = $fuente['datos'];
        if ($datos->isEmpty()) {
            continue;
        }

        $totalRegistros = $datos->sum('total');
        $totalNotarias = $datos->count();

        echo "┌".str_repeat('─', 64)."┐\n";
        echo sprintf("│ %s %s (%s)%s│\n",
            $fuente['icon'],
            $fuente['nombre'],
            $fuente['tipo'],
            str_repeat(' ', 64 - strlen($fuente['icon'] . ' ' . $fuente['nombre'] . ' (' . $fuente['tipo'] . ')') - 2)
        );
        echo "├".str_repeat('─', 64)."┤\n";
        echo sprintf("│   Total registros: %-46s │\n", number_format($totalRegistros));
        echo sprintf("│   Notarías/Proyectos únicos: %-35s │\n", number_format($totalNotarias));

        // Top 10 notarías de esta fuente
        echo "├".str_repeat('─', 64)."┤\n";
        echo "│   🏆 TOP 10 NOTARÍAS:".str_repeat(' ', 40)."│\n";

        $top10 = $datos->take(10);
        $ranking = 1;

        foreach ($top10 as $item) {
            $porcentaje = $totalRegistros > 0 ? round(($item['total'] / $totalRegistros) * 100, 2) : 0;

            // Resaltar si coincide con el filtro
            $esResaltada = false;
            if ($notariaFiltro) {
                $patron = str_replace('%', '.*', preg_quote($notariaFiltro, '/'));
                $patron = '/^' . $patron . '/i';
                $esResaltada = preg_match($patron, $item['notaria']);
            }

            $marcador = $esResaltada ? '🎯' : '  ';
            $notariaTexto = substr($item['notaria'], 0, 25);

            echo sprintf("│   %s %2d. %-25s %10s (%5.2f%%) │\n",
                $marcador,
                $ranking,
                $notariaTexto,
                number_format($item['total']),
                $porcentaje
            );

            $ranking++;
        }

        echo "└".str_repeat('─', 64)."┘\n\n";
    }

    // ========================================================================
    // 6. ESTADÍSTICAS GENERALES
    // ========================================================================

    echo "📈 ESTADÍSTICAS GENERALES\n";
    echo str_repeat('═', 66)."\n\n";

    $totalNotariasUnicas = $notariasConsolidadas->count();
    $totalActividadConsolidada = $notariasConsolidadas->sum('total_general');

    // Notarías que aparecen en múltiples fuentes
    $notariasMultifuente = $notariasConsolidadas->filter(function ($item) {
        return $item['num_fuentes'] > 1;
    });

    // Notarías de una sola fuente
    $notariasUnafuente = $notariasConsolidadas->filter(function ($item) {
        return $item['num_fuentes'] == 1;
    });

    echo "  • Notarías únicas (todas las fuentes): ".number_format($totalNotariasUnicas)."\n";
    echo "  • Actividad total consolidada: ".number_format($totalActividadConsolidada)." registros\n";
    echo "  • Notarías en múltiples fuentes: ".number_format($notariasMultifuente->count())."\n";
    echo "  • Notarías en una sola fuente: ".number_format($notariasUnafuente->count())."\n\n";

    echo "  • Distribución por fuentes:\n";
    echo "    ├─ aplicativos.busquedas (WEB): ".number_format($busquedasWeb->count())." notarías\n";
    echo "    ├─ aplicativos.busquedas_escritorio: ".number_format($busquedasEscritorio->count())." notarías\n";
    echo "    ├─ listasofac.consultas: ".number_format($consultasOfac->count())." proyectos\n";
    echo "    ├─ listassat.consultas: ".number_format($consultasSat->count())." proyectos\n";
    echo "    └─ listasnegras.consultas: ".number_format($consultasListasNegras->count())." proyectos\n\n";

    // ========================================================================
    // 7. EXPORTAR DATOS SI SE SOLICITÓ
    // ========================================================================

    if ($exportFormat) {
        echo "💾 EXPORTANDO DATOS...\n";
        echo str_repeat('─', 66)."\n\n";

        $timestamp = date('Y-m-d_His');
        $filtroSuffix = $notariaFiltro ? '_filtrado' : '';
        $yearSuffix = $yearFiltro ? "_{$yearFiltro}" : '';
        $filename = "reporte_actividad_notarias{$filtroSuffix}{$yearSuffix}_{$timestamp}";

        // Preparar datos completos para exportación
        $datosExportCompleto = $notariasConsolidadas->map(function ($item) use ($notariaFiltro) {
            $esResaltada = false;
            if ($notariaFiltro) {
                $patron = str_replace('%', '.*', preg_quote($notariaFiltro, '/'));
                $patron = '/^' . $patron . '/i';
                $esResaltada = preg_match($patron, $item['notaria']);
            }

            return [
                'notaria' => $item['notaria'],
                'total_general' => $item['total_general'],
                'total_web' => $item['total_web'],
                'total_escritorio' => $item['total_escritorio'],
                'primera_general' => $item['primera_general'],
                'ultima_general' => $item['ultima_general'],
                'num_fuentes' => $item['num_fuentes'],
                'destacada' => $esResaltada,
                'fuentes_detalle' => $item['fuentes'],
            ];
        })->values()->all();

        if ($exportFormat === 'json') {
            $filepath = __DIR__ . "/{$filename}.json";
            file_put_contents($filepath, json_encode([
                'generado' => date('Y-m-d H:i:s'),
                'filtro' => $notariaFiltro,
                'year' => $yearFiltro,
                'estadisticas' => [
                    'total_notarias' => $totalNotariasUnicas,
                    'total_actividad' => $totalActividadConsolidada,
                    'notarias_multifuente' => $notariasMultifuente->count(),
                ],
                'notarias' => $datosExportCompleto,
            ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

            echo "  ✓ Archivo JSON generado: {$filename}.json\n\n";
        } elseif ($exportFormat === 'csv') {
            $filepath = __DIR__ . "/{$filename}.csv";
            $fp = fopen($filepath, 'w');

            // Encabezados
            fputcsv($fp, [
                'Notaría',
                'Total General',
                'Total WEB',
                'Total ESCRITORIO',
                'Primera Actividad',
                'Última Actividad',
                'Num Fuentes',
                'Destacada',
                'Fuentes',
            ]);

            // Datos
            foreach ($datosExportCompleto as $row) {
                $fuentesTexto = implode('; ', array_map(function ($f) {
                    return "{$f['origen']} - {$f['fuente']}: {$f['total']}";
                }, $row['fuentes_detalle']));

                fputcsv($fp, [
                    $row['notaria'],
                    $row['total_general'],
                    $row['total_web'],
                    $row['total_escritorio'],
                    $row['primera_general'],
                    $row['ultima_general'],
                    $row['num_fuentes'],
                    $row['destacada'] ? 'SÍ' : 'NO',
                    $fuentesTexto,
                ]);
            }

            fclose($fp);
            echo "  ✓ Archivo CSV generado: {$filename}.csv\n\n";
        } elseif ($exportFormat === 'pdf' || $exportFormat === 'html') {
            $filepath = __DIR__ . "/{$filename}.html";

            // Generar HTML con el estilo del cuestionario de entrega
            $html = generarHTMLReporte(
                $datosExportCompleto,
                $notariasResaltadas,
                $notariaFiltro,
                $yearFiltro,
                $totalNotariasUnicas,
                $totalActividadConsolidada,
                $notariasConsolidadas,
                $busquedasWeb,
                $busquedasEscritorio,
                $consultasOfac,
                $consultasSat,
                $consultasListasNegras
            );

            file_put_contents($filepath, $html);
            echo "  ✓ Archivo HTML generado: {$filename}.html\n";
            echo "  💡 Abre el archivo HTML en un navegador y usa Ctrl+P para exportar a PDF\n\n";
        }
    }

    echo "═══════════════════════════════════════════════════════════════════\n";
    echo "✅ REPORTE COMPLETADO\n";
    echo "═══════════════════════════════════════════════════════════════════\n\n";

} catch (\Exception $e) {
    echo "\n❌ ERROR AL GENERAR REPORTE\n";
    echo str_repeat('─', 66)."\n";
    echo "Error: ".$e->getMessage()."\n";
    echo "Archivo: ".$e->getFile().":".$e->getLine()."\n\n";
    echo "Stack trace:\n";
    echo $e->getTraceAsString()."\n";
    exit(1);
}

// ============================================================================
// FUNCIÓN PARA GENERAR HTML CON FORMATO PROFESIONAL
// ============================================================================

function generarHTMLReporte(
    $datosExportCompleto,
    $notariasResaltadas,
    $notariaFiltro,
    $yearFiltro,
    $totalNotariasUnicas,
    $totalActividadConsolidada,
    $notariasConsolidadas,
    $busquedasWeb,
    $busquedasEscritorio,
    $consultasOfac,
    $consultasSat,
    $consultasListasNegras
) {
    $fechaGeneracion = date('d \d\e F \d\e Y, H:i:s');
    $filtroTexto = $notariaFiltro ? htmlspecialchars($notariaFiltro) : 'Todas las notarías';
    $yearTexto = $yearFiltro ? " - Año {$yearFiltro}" : '';

    $totalWeb = $notariasConsolidadas->sum('total_web');
    $totalEscritorio = $notariasConsolidadas->sum('total_escritorio');

    ob_start();
    ?>
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Reporte de Actividad de Notarías — atinet</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 13px;
      color: #1a1a2e;
      background: #f4f6fb;
      line-height: 1.7;
    }

    #print-bar {
      position: fixed;
      top: 0; left: 0; right: 0;
      background: #0f3460;
      color: #fff;
      padding: 10px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    #print-bar span { font-size: 14px; font-weight: 600; }
    #print-bar button {
      background: #e94560;
      color: #fff;
      border: none;
      padding: 8px 22px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
    }
    #print-bar button:hover { background: #c73652; }

    .wrapper {
      max-width: 1200px;
      margin: 70px auto 40px;
      padding: 0 16px;
    }

    /* PORTADA */
    .cover {
      background: linear-gradient(135deg, #0f3460 0%, #16213e 60%, #1a1a2e 100%);
      color: #fff;
      border-radius: 12px;
      padding: 44px 48px 36px;
      margin-bottom: 24px;
      position: relative;
      overflow: hidden;
    }
    .cover::before {
      content: '';
      position: absolute;
      top: -50px; right: -50px;
      width: 200px; height: 200px;
      background: rgba(233,69,96,0.12);
      border-radius: 50%;
    }
    .cover .badge {
      display: inline-block;
      background: #e94560;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      padding: 4px 14px;
      border-radius: 20px;
      margin-bottom: 14px;
    }
    .cover h1 { font-size: 28px; font-weight: 800; line-height: 1.2; margin-bottom: 6px; }
    .cover h1 span { color: #e94560; }
    .cover .subtitle { font-size: 14px; color: rgba(255,255,255,0.7); margin-bottom: 22px; }
    .cover .meta {
      display: flex;
      gap: 24px;
      flex-wrap: wrap;
      border-top: 1px solid rgba(255,255,255,0.15);
      padding-top: 16px;
      font-size: 12px;
      color: rgba(255,255,255,0.55);
    }
    .cover .meta strong { color: #fff; }

    /* STATS CARDS */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }
    .stat-card {
      background: #fff;
      border-radius: 10px;
      padding: 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      border-left: 4px solid #e94560;
    }
    .stat-card .label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 6px;
    }
    .stat-card .value {
      font-size: 26px;
      font-weight: 800;
      color: #0f3460;
    }
    .stat-card .sub {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 4px;
    }
    .stat-card.web { border-left-color: #3b82f6; }
    .stat-card.escritorio { border-left-color: #8b5cf6; }

    /* SECTION */
    .section {
      background: #fff;
      border-radius: 10px;
      margin-bottom: 18px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      overflow: hidden;
    }

    .section-header {
      background: #0f3460;
      color: #fff;
      padding: 14px 24px;
      font-size: 15px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .section-header .icon { margin-right: 8px; }

    .section-body { padding: 24px; }

    /* TABLA */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 10px 0;
      font-size: 12.5px;
    }
    thead tr { background: #f1f5f9; }
    thead th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 700;
      font-size: 11px;
      text-transform: uppercase;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
    }
    tbody td {
      padding: 10px 12px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    tbody tr:hover { background: #f8fafc; }
    tbody tr.destacada { background: #fef3c7; font-weight: 600; }
    tbody tr.destacada td:first-child::before {
      content: '🎯 ';
      margin-right: 4px;
    }

    .badge-web {
      display: inline-block;
      background: #dbeafe;
      color: #1e40af;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
    }
    .badge-escritorio {
      display: inline-block;
      background: #ede9fe;
      color: #5b21b6;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
    }

    @media print {
      body { background: #fff; }
      #print-bar { display: none !important; }
      .wrapper { margin-top: 0; max-width: 100%; padding: 0; }
      .section { box-shadow: none; border: 1px solid #e2e8f0; page-break-inside: avoid; }
      .cover { border-radius: 0; }
      .stats-grid { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

<div id="print-bar">
  <span>📊 atinet — Reporte de Actividad de Notarías</span>
  <button onclick="window.print()">⬇ Exportar a PDF</button>
</div>

<div class="wrapper">

  <!-- PORTADA -->
  <div class="cover">
    <div class="badge">Reporte de Actividad</div>
    <h1>Actividad de Notarías<?= $yearTexto ?><br><span>Todas las Fuentes de Datos</span></h1>
    <div class="subtitle">Análisis consolidado de búsquedas WEB y ESCRITORIO</div>
    <div class="meta">
      <div><strong>Fecha:</strong> <?= $fechaGeneracion ?></div>
      <div><strong>Filtro:</strong> <?= $filtroTexto ?></div>
      <?php if ($yearFiltro): ?>
      <div><strong>Año:</strong> <?= $yearFiltro ?></div>
      <?php endif; ?>
      <div><strong>Total Notarías:</strong> <?= number_format($totalNotariasUnicas) ?></div>
    </div>
  </div>

  <!-- ESTADÍSTICAS GENERALES -->
  <div class="stats-grid">
    <div class="stat-card">
      <div class="label">Total Actividad</div>
      <div class="value"><?= number_format($totalActividadConsolidada) ?></div>
      <div class="sub">registros consolidados</div>
    </div>
    <div class="stat-card web">
      <div class="label">🌐 Búsquedas WEB</div>
      <div class="value"><?= number_format($totalWeb) ?></div>
      <div class="sub"><?= $totalActividadConsolidada > 0 ? round(($totalWeb / $totalActividadConsolidada) * 100, 1) : 0 ?>% del total</div>
    </div>
    <div class="stat-card escritorio">
      <div class="label">💻 Búsquedas ESCRITORIO</div>
      <div class="value"><?= number_format($totalEscritorio) ?></div>
      <div class="sub"><?= $totalActividadConsolidada > 0 ? round(($totalEscritorio / $totalActividadConsolidada) * 100, 1) : 0 ?>% del total</div>
    </div>
    <div class="stat-card">
      <div class="label">Notarías Únicas</div>
      <div class="value"><?= number_format($totalNotariasUnicas) ?></div>
      <div class="sub">en todas las fuentes</div>
    </div>
  </div>

  <?php if ($notariasResaltadas->isNotEmpty()): ?>
  <!-- NOTARÍAS FILTRADAS -->
  <div class="section">
    <div class="section-header">
      <span class="icon">🎯</span> Notarías Filtradas (<?= $notariasResaltadas->count() ?>)
    </div>
    <div class="section-body">
      <?php foreach ($notariasResaltadas as $notaria): ?>
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 16px;">
        <h3 style="font-size: 16px; color: #92400e; margin-bottom: 10px;">🎯 <?= htmlspecialchars($notaria['notaria']) ?></h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 12px;">
          <div>
            <div style="font-size: 10px; color: #78350f; font-weight: 700; text-transform: uppercase;">Total</div>
            <div style="font-size: 18px; font-weight: 800; color: #92400e;"><?= number_format($notaria['total_general']) ?></div>
          </div>
          <div>
            <div style="font-size: 10px; color: #78350f; font-weight: 700; text-transform: uppercase;">WEB</div>
            <div style="font-size: 18px; font-weight: 800; color: #1e40af;"><?= number_format($notaria['total_web']) ?></div>
          </div>
          <div>
            <div style="font-size: 10px; color: #78350f; font-weight: 700; text-transform: uppercase;">ESCRITORIO</div>
            <div style="font-size: 18px; font-weight: 800; color: #5b21b6;"><?= number_format($notaria['total_escritorio']) ?></div>
          </div>
          <div>
            <div style="font-size: 10px; color: #78350f; font-weight: 700; text-transform: uppercase;">Fuentes</div>
            <div style="font-size: 18px; font-weight: 800; color: #92400e;"><?= $notaria['num_fuentes'] ?></div>
          </div>
        </div>
        <div style="font-size: 11px; color: #78350f; margin-top: 8px;">
          <strong>Primera actividad:</strong> <?= date('Y-m-d H:i:s', strtotime($notaria['primera_general'])) ?> &nbsp;|&nbsp;
          <strong>Última actividad:</strong> <?= date('Y-m-d H:i:s', strtotime($notaria['ultima_general'])) ?>
        </div>
        <div style="margin-top: 12px;">
          <div style="font-size: 10px; color: #78350f; font-weight: 700; text-transform: uppercase; margin-bottom: 6px;">Detalle por fuente:</div>
          <?php foreach ($notaria['fuentes'] as $fuente): ?>
          <div style="font-size: 11px; padding: 4px 0; border-bottom: 1px solid rgba(0,0,0,0.05);">
            <span style="font-weight: 700;"><?= $fuente['origen'] === 'WEB' ? '🌐' : '💻' ?> <?= htmlspecialchars($fuente['fuente']) ?></span>:
            <?= number_format($fuente['total']) ?> registros
            (<?= date('Y-m-d', strtotime($fuente['primera'])) ?> → <?= date('Y-m-d', strtotime($fuente['ultima'])) ?>)
          </div>
          <?php endforeach; ?>
        </div>
      </div>
      <?php endforeach; ?>
    </div>
  </div>
  <?php endif; ?>

  <!-- TODAS LAS NOTARÍAS -->
  <div class="section">
    <div class="section-header">
      <span class="icon">📋</span> Todas las Notarías (Top 50)
    </div>
    <div class="section-body">
      <table>
        <thead>
          <tr>
            <th>Notaría</th>
            <th style="text-align: right;">Total</th>
            <th style="text-align: right;">WEB</th>
            <th style="text-align: right;">ESCRITORIO</th>
            <th style="text-align: center;">Fuentes</th>
            <th>Primera</th>
            <th>Última</th>
          </tr>
        </thead>
        <tbody>
          <?php
          $contador = 0;
          foreach ($datosExportCompleto as $row):
            if (++$contador > 50) break;
            $claseDestacada = $row['destacada'] ? 'destacada' : '';
          ?>
          <tr class="<?= $claseDestacada ?>">
            <td><?= htmlspecialchars($row['notaria']) ?></td>
            <td style="text-align: right; font-weight: 700;"><?= number_format($row['total_general']) ?></td>
            <td style="text-align: right;"><?= number_format($row['total_web']) ?></td>
            <td style="text-align: right;"><?= number_format($row['total_escritorio']) ?></td>
            <td style="text-align: center;"><?= $row['num_fuentes'] ?></td>
            <td><?= date('Y-m-d', strtotime($row['primera_general'])) ?></td>
            <td><?= date('Y-m-d', strtotime($row['ultima_general'])) ?></td>
          </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
      <?php if (count($datosExportCompleto) > 50): ?>
      <div style="text-align: center; padding: 12px; color: #6b7280; font-size: 11px;">
        Mostrando las primeras 50 notarías. Total: <?= number_format(count($datosExportCompleto)) ?>
      </div>
      <?php endif; ?>
    </div>
  </div>

  <!-- RESUMEN POR FUENTE -->
  <div class="section">
    <div class="section-header">
      <span class="icon">📊</span> Resumen por Fuente de Datos
    </div>
    <div class="section-body">
      <table>
        <thead>
          <tr>
            <th>Fuente</th>
            <th>Tipo</th>
            <th style="text-align: right;">Total Registros</th>
            <th style="text-align: right;">Notarías/Proyectos</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>aplicativos.busquedas</td>
            <td><span class="badge-web">WEB</span></td>
            <td style="text-align: right; font-weight: 700;"><?= number_format($busquedasWeb->sum('total')) ?></td>
            <td style="text-align: right;"><?= number_format($busquedasWeb->count()) ?></td>
          </tr>
          <tr>
            <td>aplicativos.busquedas_escritorio</td>
            <td><span class="badge-escritorio">ESCRITORIO</span></td>
            <td style="text-align: right; font-weight: 700;"><?= number_format($busquedasEscritorio->sum('total')) ?></td>
            <td style="text-align: right;"><?= number_format($busquedasEscritorio->count()) ?></td>
          </tr>
          <tr>
            <td>listasofac.consultas</td>
            <td><span class="badge-escritorio">ESCRITORIO</span></td>
            <td style="text-align: right; font-weight: 700;"><?= number_format($consultasOfac->sum('total')) ?></td>
            <td style="text-align: right;"><?= number_format($consultasOfac->count()) ?></td>
          </tr>
          <tr>
            <td>listassat.consultas</td>
            <td><span class="badge-escritorio">ESCRITORIO</span></td>
            <td style="text-align: right; font-weight: 700;"><?= number_format($consultasSat->sum('total')) ?></td>
            <td style="text-align: right;"><?= number_format($consultasSat->count()) ?></td>
          </tr>
          <?php if ($consultasListasNegras->isNotEmpty()): ?>
          <tr>
            <td>listasnegras.consultas</td>
            <td><span class="badge-escritorio">ESCRITORIO LEGACY</span></td>
            <td style="text-align: right; font-weight: 700;"><?= number_format($consultasListasNegras->sum('total')) ?></td>
            <td style="text-align: right;"><?= number_format($consultasListasNegras->count()) ?></td>
          </tr>
          <?php endif; ?>
        </tbody>
      </table>
    </div>
  </div>

  <!-- FOOTER -->
  <div style="text-align:center; padding: 24px 0 8px; color: #9ca3af; font-size: 11px; border-top: 1px solid #e2e8f0; margin-top: 8px;">
    atinet — Reporte de Actividad de Notarías &nbsp;·&nbsp; Generado: <?= $fechaGeneracion ?> &nbsp;·&nbsp;
    Las notarías resaltadas con <span style="background:#fef3c7;padding:1px 6px;border-radius:3px;">🎯</span> coinciden con el filtro aplicado
  </div>

</div>

<script>
  document.title = "Reporte Actividad Notarías — " + new Date().toLocaleDateString('es-MX');
</script>
</body>
</html>
<?php
    return ob_get_clean();
}

