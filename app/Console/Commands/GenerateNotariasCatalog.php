<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class GenerateNotariasCatalog extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'catalog:generate-notarias
                            {--dry-run : Previsualizar catálogo sin guardarlo}
                            {--force : Generar sin confirmación}
                            {--clear-cache : Limpiar caché del catálogo}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Genera catálogo unificado de notarías desde tablas de búsquedas legacy';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('🔍 Generando catálogo de notarías desde sistema legacy...');
        $this->newLine();

        // Clear cache if requested
        if ($this->option('clear-cache')) {
            Cache::forget('catalogo-notarias-legacy');
            $this->info('✅ Caché limpiado exitosamente.');
            $this->newLine();
        }

        try {
            // Generate catalog
            $startTime = microtime(true);
            $catalog = $this->buildCatalog();
            $duration = round(microtime(true) - $startTime, 2);

            $this->info("📊 Catálogo generado en {$duration}s");
            $this->newLine();

            // Display statistics
            $this->displayStatistics($catalog);

            // Dry-run mode
            if ($this->option('dry-run')) {
                $this->warn('🔸 Modo DRY-RUN: No se guardará el catálogo');
                $this->displaySample($catalog);
                return 0;
            }

            // Confirmation
            if (! $this->option('force')) {
                if (! $this->confirm('¿Deseas guardar este catálogo?', true)) {
                    $this->warn('❌ Operación cancelada');
                    return 1;
                }
            }

            // Save to JSON file
            $this->saveCatalog($catalog);

            // Update cache
            Cache::put('catalogo-notarias-legacy', $catalog, now()->addDay());

            $this->newLine();
            $this->info('✅ Catálogo guardado exitosamente');
            $this->displaySample($catalog);

            return 0;
        } catch (\Exception $e) {
            $this->error('❌ Error al generar catálogo: '.$e->getMessage());
            $this->error($e->getTraceAsString());

            return 1;
        }
    }

    /**
     * Build unified catalog from all legacy search tables + usuario table
     */
    private function buildCatalog(): array
    {
        $this->info('Consultando tablas legacy...');

        // 1. Obtener notarías con búsquedas en listas negras
        $sql = "
            SELECT
                notaria_id,
                COUNT(*) as total_busquedas,
                MIN(fecha) as primera_busqueda,
                MAX(fecha) as ultima_busqueda,
                GROUP_CONCAT(DISTINCT fuente ORDER BY fuente SEPARATOR ', ') as fuentes
            FROM (
                -- Búsquedas Web (aplicativos)
                SELECT
                    TRIM(NOTARIA) as notaria_id,
                    fecha,
                    'Web' as fuente
                FROM atinet65_aplicativos.busquedas
                WHERE NOTARIA IS NOT NULL
                  AND TRIM(NOTARIA) != ''
                  AND TRIM(NOTARIA) != 'atinet'

                UNION ALL

                -- Búsquedas Desktop/VB6 (aplicativos)
                SELECT
                    TRIM(NOTARIA) as notaria_id,
                    fecha,
                    'Desktop' as fuente
                FROM atinet65_aplicativos.busquedas_escritorio
                WHERE NOTARIA IS NOT NULL
                  AND TRIM(NOTARIA) != ''
                  AND TRIM(NOTARIA) != 'atinet'

                UNION ALL

                -- Búsquedas OFAC (listasofac)
                SELECT
                    TRIM(proyecto) as notaria_id,
                    fecha,
                    'OFAC' as fuente
                FROM atinet65_listasofac.consultas
                WHERE proyecto IS NOT NULL
                  AND TRIM(proyecto) != ''
                  AND TRIM(proyecto) != 'atinet'

                UNION ALL

                -- Búsquedas SAT (listassat)
                SELECT
                    TRIM(proyecto) as notaria_id,
                    fecha,
                    'SAT' as fuente
                FROM atinet65_listassat.consultas
                WHERE proyecto IS NOT NULL
                  AND TRIM(proyecto) != ''
                  AND TRIM(proyecto) != 'atinet'
            ) AS todas_busquedas
            GROUP BY notaria_id
            HAVING total_busquedas > 0
            ORDER BY total_busquedas DESC
        ";

        $busquedas = DB::connection('aplicativos')->select($sql);

        // Convertir a colección indexada por notaria_id (lowercase para match)
        $catalogoConBusquedas = collect($busquedas)->keyBy(function ($item) {
            return strtolower($item->notaria_id);
        });

        // 2. Obtener TODAS las notarías registradas en usuario (pueden usar otros servicios)
        $this->info('Consultando tabla usuario...');
        
        $usuariosNotarias = DB::connection('aplicativos')
            ->table('usuario')
            ->where('notaria', '!=', 'atinet')
            ->whereNotNull('notaria')
            ->where('notaria', '!=', '')
            ->select(
                'notaria',
                DB::raw('COUNT(*) as total_usuarios'),
                DB::raw('MIN(FECHA) as primer_registro'),
                DB::raw('MAX(FECHA) as ultimo_registro')
            )
            ->groupBy('notaria')
            ->get();

        // 3. Merge: combinar notarías con búsquedas + notarías solo con registro
        $catalogoFinal = collect();

        // Agregar notarías con búsquedas
        foreach ($catalogoConBusquedas as $notaria) {
            $catalogoFinal->push([
                'notaria_id' => $notaria->notaria_id,
                'total_busquedas' => (int) $notaria->total_busquedas,
                'primera_busqueda' => $notaria->primera_busqueda,
                'ultima_busqueda' => $notaria->ultima_busqueda,
                'fuentes' => explode(', ', $notaria->fuentes),
                'es_activa' => $this->isActive($notaria->ultima_busqueda),
                'tiene_busquedas_listas_negras' => true,
                'tiene_acceso_web' => false, // Se actualizará abajo
                'total_usuarios' => 0, // Se actualizará abajo
            ]);
        }

        // Agregar notarías solo con registro (sin búsquedas en listas negras)
        foreach ($usuariosNotarias as $usuario) {
            $notariaLower = strtolower($usuario->notaria);
            
            // Buscar si ya existe en el catálogo (case-insensitive)
            $existente = $catalogoFinal->first(function ($item) use ($notariaLower) {
                return strtolower($item['notaria_id']) === $notariaLower;
            });

            if ($existente) {
                // Ya existe con búsquedas, actualizar info de usuarios
                $catalogoFinal->transform(function ($item) use ($notariaLower, $usuario) {
                    if (strtolower($item['notaria_id']) === $notariaLower) {
                        $item['tiene_acceso_web'] = true;
                        $item['total_usuarios'] = (int) $usuario->total_usuarios;
                        $item['primer_registro'] = $usuario->primer_registro;
                    }
                    return $item;
                });
            } else {
                // Notaría solo con registro web (usa otros servicios, no listas negras)
                $catalogoFinal->push([
                    'notaria_id' => $usuario->notaria,
                    'total_busquedas' => 0,
                    'primera_busqueda' => null,
                    'ultima_busqueda' => null,
                    'fuentes' => [],
                    'es_activa' => true, // Considerada activa si tiene registro reciente
                    'tiene_busquedas_listas_negras' => false,
                    'tiene_acceso_web' => true,
                    'total_usuarios' => (int) $usuario->total_usuarios,
                    'primer_registro' => $usuario->primer_registro,
                    'ultimo_registro' => $usuario->ultimo_registro,
                    'tipo' => 'solo_otros_servicios', // No usa listas negras
                ]);
            }
        }

        // Ordenar: primero por búsquedas, luego por usuarios
        return $catalogoFinal
            ->sortByDesc(function ($item) {
                return $item['total_busquedas'] * 1000 + ($item['total_usuarios'] ?? 0);
            })
            ->values()
            ->toArray();
    }

    /**
     * Check if notary is active (has searches in last 6 months)
     */
    private function isActive(?string $ultimaBusqueda): bool
    {
        if (! $ultimaBusqueda) {
            return false;
        }

        $lastSearch = \Carbon\Carbon::parse($ultimaBusqueda);
        $sixMonthsAgo = now()->subMonths(6);

        return $lastSearch->isAfter($sixMonthsAgo);
    }

    /**
     * Display catalog statistics
     */
    private function displayStatistics(array $catalog): void
    {
        $total = count($catalog);
        $catalog = collect($catalog);
        
        $activas = $catalog->where('es_activa', true)->count();
        $inactivas = $total - $activas;

        $conBusquedas = $catalog->where('tiene_busquedas_listas_negras', true)->count();
        $soloOtrosServicios = $catalog->where('tiene_busquedas_listas_negras', false)->count();
        $conAccesoWeb = $catalog->where('tiene_acceso_web', true)->count();

        $totalBusquedas = $catalog->sum('total_busquedas');
        $totalUsuarios = $catalog->sum('total_usuarios');

        $fuentesStats = $catalog
            ->flatMap(fn ($item) => $item['fuentes'])
            ->countBy()
            ->sortDesc();

        $this->table(
            ['Métrica', 'Valor'],
            [
                ['Total Notarías en Catálogo', number_format($total)],
                ['', ''],
                ['├─ Con búsquedas en Listas Negras', number_format($conBusquedas)],
                ['└─ Solo otros servicios (sin búsquedas)', number_format($soloOtrosServicios)],
                ['', ''],
                ['Notarías con Acceso Web', number_format($conAccesoWeb)],
                ['Total Usuarios Registrados', number_format($totalUsuarios)],
                ['', ''],
                ['Notarías Activas (< 6 meses)', number_format($activas)],
                ['Notarías Inactivas (> 6 meses)', number_format($inactivas)],
                ['', ''],
                ['Total Búsquedas en Listas Negras', number_format($totalBusquedas)],
                ['Promedio búsquedas/notaría (con búsquedas)', $conBusquedas > 0 ? number_format($totalBusquedas / $conBusquedas, 2) : '0'],
            ],
        );

        $this->newLine();
        $this->info('📌 Fuentes de búsquedas (Listas Negras):');
        foreach ($fuentesStats as $fuente => $count) {
            $this->line("  • {$fuente}: ".number_format($count).' notarías');
        }
        $this->newLine();
    }

    /**
     * Display sample of top notaries
     */
    private function displaySample(array $catalog): void
    {
        $this->info('🔝 Top 15 notarías por búsquedas:');

        $sample = array_slice($catalog, 0, 15);

        $rows = collect($sample)->map(function ($item) {
            $fechaPrimera = $item['primera_busqueda'] 
                ? \Carbon\Carbon::parse($item['primera_busqueda'])->format('Y-m-d')
                : 'N/A';
            
            $fechaUltima = $item['ultima_busqueda']
                ? \Carbon\Carbon::parse($item['ultima_busqueda'])->format('Y-m-d')
                : 'N/A';
            
            $fuentes = count($item['fuentes']) > 0 
                ? implode(', ', $item['fuentes'])
                : 'Otros servicios';
            
            $tipo = isset($item['tipo']) && $item['tipo'] === 'solo_otros_servicios'
                ? '🌐 Web'
                : ($item['es_activa'] ? '🟢 Activa' : '🔴 Inactiva');

            return [
                'Notaría' => $item['notaria_id'],
                'Búsquedas' => number_format($item['total_busquedas']),
                'Usuarios' => $item['total_usuarios'] ?? 0,
                'Primera' => $fechaPrimera,
                'Última' => $fechaUltima,
                'Fuentes' => $fuentes,
                'Estado' => $tipo,
            ];
        })->toArray();

        $this->table(
            ['Notaría', 'Búsquedas', 'Usuarios', 'Primera', 'Última', 'Fuentes', 'Estado'],
            $rows,
        );
    }

    /**
     * Save catalog to JSON file
     */
    private function saveCatalog(array $catalog): void
    {
        $filename = 'catalogo_notarias_legacy.json';
        $data = [
            'generated_at' => now()->toIso8601String(),
            'total_notarias' => count($catalog),
            'notarias' => $catalog,
        ];

        Storage::disk('local')->put(
            $filename,
            json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
        );

        $path = Storage::disk('local')->path($filename);
        $this->info("💾 Archivo guardado: {$path}");
    }
}
