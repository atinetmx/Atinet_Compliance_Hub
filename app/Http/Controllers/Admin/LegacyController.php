<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\BusquedasLegacyService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class LegacyController extends Controller
{
    /**
     * Get the catalog of notaries from legacy system
     */
    public function getNotariasCatalog(Request $request)
    {
        try {
            // Try cache first (24 hours)
            $catalog = Cache::remember('catalogo-notarias-legacy', 86400, function () {
                return $this->loadCatalogFromFile();
            });

            // Apply filters if requested
            if ($request->has('search')) {
                $search = strtolower($request->input('search'));
                $catalog['notarias'] = collect($catalog['notarias'])
                    ->filter(function ($notaria) use ($search) {
                        return str_contains(strtolower($notaria['notaria_id']), $search);
                    })
                    ->values()
                    ->toArray();
                $catalog['total_notarias'] = count($catalog['notarias']);
            }

            if ($request->has('only_active')) {
                $catalog['notarias'] = collect($catalog['notarias'])
                    ->where('es_activa', true)
                    ->values()
                    ->toArray();
                $catalog['total_notarias'] = count($catalog['notarias']);
            }

            if ($request->has('limit')) {
                $limit = (int) $request->input('limit');
                $catalog['notarias'] = collect($catalog['notarias'])
                    ->take($limit)
                    ->values()
                    ->toArray();
            }

            return response()->json($catalog);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'No se pudo cargar el catálogo',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Search for notaries in the catalog
     */
    public function searchNotarias(Request $request)
    {
        $request->validate([
            'query' => 'required|string|min:1',
        ]);

        try {
            $catalog = Cache::remember('catalogo-notarias-legacy', 86400, function () {
                return $this->loadCatalogFromFile();
            });

            $query = strtolower($request->input('query'));

            $results = collect($catalog['notarias'])
                ->filter(function ($notaria) use ($query) {
                    return str_contains(strtolower($notaria['notaria_id']), $query);
                })
                ->take(20)
                ->values();

            return response()->json([
                'query' => $request->input('query'),
                'total_results' => $results->count(),
                'results' => $results,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error en la búsqueda',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Force refresh the catalog (SuperAdmin only)
     */
    public function refreshCatalog()
    {
        try {
            // Clear cache
            Cache::forget('catalogo-notarias-legacy');

            // Regenerate catalog
            Artisan::call('catalog:generate-notarias', ['--force' => true]);

            $output = Artisan::output();

            return response()->json([
                'success' => true,
                'message' => 'Catálogo regenerado exitosamente',
                'output' => $output,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al regenerar catálogo',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get catalog statistics
     */
    public function getStatistics()
    {
        try {
            $catalog = Cache::remember('catalogo-notarias-legacy', 86400, function () {
                return $this->loadCatalogFromFile();
            });

            $notarias = collect($catalog['notarias']);

            return response()->json([
                'total_notarias' => $notarias->count(),
                'notarias_activas' => $notarias->where('es_activa', true)->count(),
                'notarias_inactivas' => $notarias->where('es_activa', false)->count(),
                'total_busquedas' => $notarias->sum('total_busquedas'),
                'promedio_busquedas' => round($notarias->avg('total_busquedas'), 2),
                'top_notarias' => $notarias->take(10)->values(),
                'fuentes' => $this->getFuentesStats($notarias),
                'generated_at' => $catalog['generated_at'],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener estadísticas',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Get dashboard statistics for SuperAdmin dashboard card
     */
    public function getDashboardStats()
    {
        return Cache::remember('legacy-dashboard-stats', 3600, function () {
            try {
                // 1. Count notarías with legacy data
                $notariasCount = \App\Models\Notaria::whereNotNull('legacy_identifier')->count();

                // 2. Get total búsquedas from OFAC + SAT
                $busquedasOfac = DB::connection('ofac')->table('consultas')->count();
                $busquedasSat = DB::connection('sat')->table('consultas')->count();
                $totalBusquedas = $busquedasOfac + $busquedasSat;

                // 3. Get date range (periodo)
                $primeraOfac = DB::connection('ofac')->table('consultas')->min('fecha');
                $primeraSat = DB::connection('sat')->table('consultas')->min('fecha');
                $ultimaOfac = DB::connection('ofac')->table('consultas')->max('fecha');
                $ultimaSat = DB::connection('sat')->table('consultas')->max('fecha');

                $fechaInicio = min($primeraOfac, $primeraSat);
                $fechaFin = max($ultimaOfac, $ultimaSat);

                // 4. Get top 5 notarías by búsquedas count
                $topNotarias = \App\Models\Notaria::whereNotNull('legacy_identifier')
                    ->whereNotNull('legacy_busquedas_count')
                    ->where('legacy_busquedas_count', '>', 0)
                    ->orderBy('legacy_busquedas_count', 'desc')
                    ->limit(5)
                    ->get(['legacy_identifier', 'nombre', 'numero_notaria', 'legacy_busquedas_count'])
                    ->map(function ($notaria) {
                        return [
                            'legacy_identifier' => $notaria->legacy_identifier,
                            'nombre' => $notaria->nombre,
                            'numero_notaria' => $notaria->numero_notaria,
                            'busquedas' => $notaria->legacy_busquedas_count,
                        ];
                    });

                return [
                    'notarias_count' => $notariasCount,
                    'total_busquedas' => $totalBusquedas,
                    'periodo' => [
                        'inicio' => $fechaInicio,
                        'fin' => $fechaFin,
                    ],
                    'top_notarias' => $topNotarias,
                    'fuentes' => [
                        'ofac' => $busquedasOfac,
                        'sat' => $busquedasSat,
                    ],
                ];
            } catch (\Exception $e) {
                // Return empty stats if error occurs (e.g., connection issues)
                return [
                    'notarias_count' => 0,
                    'total_busquedas' => 0,
                    'periodo' => null,
                    'top_notarias' => [],
                    'fuentes' => [
                        'ofac' => 0,
                        'sat' => 0,
                    ],
                    'error' => $e->getMessage(),
                ];
            }
        });
    }

    /**
     * Load catalog from JSON file
     */
    private function loadCatalogFromFile(): array
    {
        $filename = 'catalogo_notarias_legacy.json';

        if (! Storage::disk('local')->exists($filename)) {
            // Generate catalog if doesn't exist
            Artisan::call('catalog:generate-notarias', ['--force' => true]);
        }

        $json = Storage::disk('local')->get($filename);

        return json_decode($json, true);
    }

    /**
     * Get statistics by source
     */
    private function getFuentesStats($notarias)
    {
        $stats = [];
        $fuentes = ['Web', 'Desktop', 'OFAC', 'SAT'];

        foreach ($fuentes as $fuente) {
            $stats[$fuente] = $notarias->filter(function ($notaria) use ($fuente) {
                return in_array($fuente, $notaria['fuentes']);
            })->count();
        }

        return $stats;
    }

    /**
     * Obtener búsquedas consolidadas de una notaría legacy
     */
    public function getBusquedasNotaria(Request $request, string $legacyIdentifier)
    {
        $request->validate([
            'limit' => 'nullable|integer|min:1|max:500',
            'fuente' => 'nullable|in:web,desktop,ofac,sat',
            'fecha_desde' => 'nullable|date',
            'fecha_hasta' => 'nullable|date|after_or_equal:fecha_desde',
        ]);

        try {
            $service = new BusquedasLegacyService();

            $options = [
                'limit' => $request->input('limit', 100),
                'fuente' => $request->input('fuente'),
                'fecha_desde' => $request->input('fecha_desde'),
                'fecha_hasta' => $request->input('fecha_hasta'),
            ];

            $result = $service->getBusquedasConsolidadas($legacyIdentifier, $options);

            return response()->json($result);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener búsquedas',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener estadísticas de búsquedas de una notaría legacy
     */
    public function getEstadisticasNotaria(string $legacyIdentifier)
    {
        try {
            $service = new BusquedasLegacyService();
            $stats = $service->getEstadisticas($legacyIdentifier);

            return response()->json($stats);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener estadísticas',
                'message' => $e->getMessage(),
            ], 500);
        }
    }
}
