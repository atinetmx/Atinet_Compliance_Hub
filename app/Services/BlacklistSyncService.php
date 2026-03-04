<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * Servicio de Sincronización Incremental de Listas Negras y Aplicativos
 *
 * Sincroniza únicamente registros nuevos desde Hostgator a BD local
 * - Compara IDs entre BD local y remota
 * - Trae solo los registros faltantes (delta sync)
 * - Optimizado para minimizar tráfico de red
 * - Auto-detección de tablas (sincroniza TODAS las tablas de cada BD)
 *
 * Bases de datos sincronizadas:
 * - OFAC (atinet65_listasofac): 11 tablas - SDN, ALT, Nombres, CONS_SDN, etc.
 * - SAT (atinet65_listassat): 4 tablas - 69-B, 69-C, Version, consultas
 * - Aplicativos (atinet65_aplicativos): 10 tablas - registro, usuario, agenda, búsquedas, etc.
 *
 * Uso:
 * ```php
 * $syncService = new BlacklistSyncService();
 * $result = $syncService->syncAll();
 * ```
 */
class BlacklistSyncService
{
    protected bool $dryRun = false;

    protected array $stats = [
        'ofac' => ['new' => 0, 'errors' => 0, 'tables' => []],
        'sat' => ['new' => 0, 'errors' => 0, 'tables' => []],
        'aplicativos' => ['new' => 0, 'errors' => 0, 'tables' => []],
    ];

    /**
     * Habilitar modo dry-run (sin modificar BD)
     */
    public function enableDryRun(): self
    {
        $this->dryRun = true;

        return $this;
    }

    /**
     * Sincronizar todas las listas negras y aplicativos
     */
    public function syncAll(): array
    {
        Log::info('🔄 Iniciando sincronización incremental completa', [
            'dry_run' => $this->dryRun,
        ]);

        try {
            // Listas negras
            $this->syncOfac();
            $this->syncSat();

            // Aplicativos (todas las tablas automáticamente)
            $this->syncAplicativos();

            Log::info('✅ Sincronización completada exitosamente', $this->stats);

            return [
                'success' => true,
                'stats' => $this->stats,
                'message' => $this->formatSummary(),
            ];
        } catch (\Exception $e) {
            Log::error('❌ Error en sincronización', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
                'stats' => $this->stats,
            ];
        }
    }

    /**
     * Sincronizar toda la base de datos OFAC
     * Detecta todas las tablas automáticamente y las sincroniza
     *
     * Tablas incluidas: SDN, ALT, Nombres, CONS_SDN, CONS_ALT, etc. (11 tablas totales)
     */
    protected function syncOfac(): void
    {
        Log::info('📋 OFAC: Iniciando sincronización completa de BD...');

        // Obtener lista de todas las tablas desde la BD remota
        $tables = DB::connection('ofac_remote')
            ->select('SHOW TABLES');

        $tableKey = 'Tables_in_atinet65_listasofac';

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;

            try {
                // Obtener la PRIMARY KEY o primera columna identificadora de la tabla
                $columns = DB::connection('ofac_remote')
                    ->select("SHOW COLUMNS FROM `{$tableName}`");

                $primaryKey = null;
                foreach ($columns as $column) {
                    if ($column->Key === 'PRI') {
                        $primaryKey = $column->Field;
                        break;
                    }
                }

                // Si no tiene PRIMARY KEY, usar la primera columna
                if (! $primaryKey && ! empty($columns)) {
                    $primaryKey = $columns[0]->Field;
                }

                if (! $primaryKey) {
                    Log::warning("⚠️  OFAC: Tabla '{$tableName}' sin columna identificadora, omitiendo");

                    continue;
                }

                // Sincronizar la tabla
                $newRecordsCount = $this->syncOfacTable($tableName, $primaryKey);

                if ($newRecordsCount > 0) {
                    $this->stats['ofac']['tables'][$tableName] = $newRecordsCount;
                }

            } catch (\Exception $e) {
                Log::error("❌ OFAC: Error en tabla '{$tableName}'", [
                    'error' => $e->getMessage(),
                ]);
                $this->stats['ofac']['errors']++;
            }
        }

        $totalNew = array_sum($this->stats['ofac']['tables']);
        $this->stats['ofac']['new'] = $totalNew;

        Log::info('✅ OFAC: Sincronización completada', [
            'total_new' => $totalNew,
            'tables_updated' => count($this->stats['ofac']['tables']),
        ]);
    }

    /**
     * Sincronizar toda la base de datos SAT
     * Detecta todas las tablas automáticamente y las sincroniza
     *
     * Tablas incluidas: 69-B, 69-C, Version, consultas (4 tablas totales)
     */
    protected function syncSat(): void
    {
        Log::info('📋 SAT: Iniciando sincronización completa de BD...');

        // Obtener lista de todas las tablas desde la BD remota
        $tables = DB::connection('sat_remote')
            ->select('SHOW TABLES');

        $tableKey = 'Tables_in_atinet65_listassat';

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;

            try {
                // Obtener la PRIMARY KEY o primera columna identificadora de la tabla
                $columns = DB::connection('sat_remote')
                    ->select("SHOW COLUMNS FROM `{$tableName}`");

                $primaryKey = null;
                foreach ($columns as $column) {
                    if ($column->Key === 'PRI') {
                        $primaryKey = $column->Field;
                        break;
                    }
                }

                // Si no tiene PRIMARY KEY, usar la primera columna
                if (! $primaryKey && ! empty($columns)) {
                    $primaryKey = $columns[0]->Field;
                }

                if (! $primaryKey) {
                    Log::warning("⚠️  SAT: Tabla '{$tableName}' sin columna identificadora, omitiendo");

                    continue;
                }

                // Sincronizar la tabla
                $newRecordsCount = $this->syncSatTable($tableName, $primaryKey);

                if ($newRecordsCount > 0) {
                    $this->stats['sat']['tables'][$tableName] = $newRecordsCount;
                }

            } catch (\Exception $e) {
                Log::error("❌ SAT: Error en tabla '{$tableName}'", [
                    'error' => $e->getMessage(),
                ]);
                $this->stats['sat']['errors']++;
            }
        }

        $totalNew = array_sum($this->stats['sat']['tables']);
        $this->stats['sat']['new'] = $totalNew;

        Log::info('✅ SAT: Sincronización completada', [
            'total_new' => $totalNew,
            'tables_updated' => count($this->stats['sat']['tables']),
        ]);
    }

    /**
     * Sincronizar toda la base de datos Aplicativos
     * Detecta todas las tablas automáticamente y las sincroniza
     */
    protected function syncAplicativos(): void
    {
        Log::info('📦 APLICATIVOS: Iniciando sincronización completa de BD...');

        // Obtener lista de todas las tablas desde la BD remota
        $tables = DB::connection('aplicativos_remote')
            ->select('SHOW TABLES');

        $tableKey = 'Tables_in_atinet65_aplicativos';

        foreach ($tables as $table) {
            $tableName = $table->$tableKey;

            try {
                // Obtener la PRIMARY KEY de la tabla
                $columns = DB::connection('aplicativos_remote')
                    ->select("SHOW COLUMNS FROM `{$tableName}`");

                $primaryKey = null;
                foreach ($columns as $column) {
                    if ($column->Key === 'PRI') {
                        $primaryKey = $column->Field;
                        break;
                    }
                }

                // Si no tiene PRIMARY KEY, usar la primera columna
                if (! $primaryKey && ! empty($columns)) {
                    $primaryKey = $columns[0]->Field;
                }

                if (! $primaryKey) {
                    Log::warning("⚠️  APLICATIVOS: Tabla '{$tableName}' sin columna identificadora, omitiendo");

                    continue;
                }

                // Sincronizar la tabla
                $newRecordsCount = $this->syncAplicativosTable($tableName, $primaryKey);

                if ($newRecordsCount > 0) {
                    $this->stats['aplicativos']['tables'][$tableName] = $newRecordsCount;
                }

            } catch (\Exception $e) {
                Log::error("❌ APLICATIVOS: Error en tabla '{$tableName}'", [
                    'error' => $e->getMessage(),
                ]);
                $this->stats['aplicativos']['errors']++;
            }
        }

        $totalNew = array_sum($this->stats['aplicativos']['tables']);
        $this->stats['aplicativos']['new'] = $totalNew;

        Log::info('✅ APLICATIVOS: Sincronización completada', [
            'total_new' => $totalNew,
            'tables_updated' => count($this->stats['aplicativos']['tables']),
        ]);
    }

    /**
     * Sincronizar una tabla específica de OFAC
     */
    protected function syncOfacTable(string $tableName, string $primaryKey): int
    {
        // 1. Obtener todos los IDs de la BD local
        $localIds = DB::connection('ofac')
            ->table($tableName)
            ->pluck($primaryKey)
            ->toArray();

        // 2. Obtener todos los IDs de la BD remota (Hostgator)
        $remoteIds = DB::connection('ofac_remote')
            ->table($tableName)
            ->pluck($primaryKey)
            ->toArray();

        // 3. Calcular diferencia (IDs nuevos)
        $newIds = array_diff($remoteIds, $localIds);

        if (empty($newIds)) {
            Log::info("  ✅ {$tableName}: Sin cambios");

            return 0;
        }

        Log::info("  🆕 {$tableName}: {count} nuevos registros", [
            'count' => count($newIds),
        ]);

        // 4. Traer solo registros nuevos en lotes de 100
        $chunks = array_chunk($newIds, 100);
        $totalInserted = 0;

        foreach ($chunks as $chunk) {
            try {
                $newRecords = DB::connection('ofac_remote')
                    ->table($tableName)
                    ->whereIn($primaryKey, $chunk)
                    ->get()
                    ->toArray();

                if (! $this->dryRun) {
                    $recordsArray = array_map(fn ($record) => (array) $record, $newRecords);

                    DB::connection('ofac')
                        ->table($tableName)
                        ->insert($recordsArray);
                }

                $totalInserted += count($newRecords);

            } catch (\Exception $e) {
                Log::error("  ❌ {$tableName}: Error en lote", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $totalInserted;
    }

    /**
     * Sincronizar una tabla específica de SAT
     */
    protected function syncSatTable(string $tableName, string $primaryKey): int
    {
        // 1. Obtener todos los IDs de la BD local
        $localIds = DB::connection('sat')
            ->table($tableName)
            ->pluck($primaryKey)
            ->toArray();

        // 2. Obtener todos los IDs de la BD remota (Hostgator)
        $remoteIds = DB::connection('sat_remote')
            ->table($tableName)
            ->pluck($primaryKey)
            ->toArray();

        // 3. Calcular diferencia (IDs nuevos)
        $newIds = array_diff($remoteIds, $localIds);

        if (empty($newIds)) {
            Log::info("  ✅ {$tableName}: Sin cambios");

            return 0;
        }

        Log::info("  🆕 {$tableName}: {count} nuevos registros", [
            'count' => count($newIds),
        ]);

        // 4. Traer solo registros nuevos en lotes de 100
        $chunks = array_chunk($newIds, 100);
        $totalInserted = 0;

        foreach ($chunks as $chunk) {
            try {
                $newRecords = DB::connection('sat_remote')
                    ->table($tableName)
                    ->whereIn($primaryKey, $chunk)
                    ->get()
                    ->toArray();

                if (! $this->dryRun) {
                    $recordsArray = array_map(fn ($record) => (array) $record, $newRecords);

                    DB::connection('sat')
                        ->table($tableName)
                        ->insert($recordsArray);
                }

                $totalInserted += count($newRecords);

            } catch (\Exception $e) {
                Log::error("  ❌ {$tableName}: Error en lote", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $totalInserted;
    }

    /**
     * Sincronizar una tabla específica de aplicativos
     */
    protected function syncAplicativosTable(string $tableName, string $primaryKey): int
    {
        // 1. Obtener todos los IDs de la BD local
        $localIds = DB::connection('aplicativos')
            ->table($tableName)
            ->pluck($primaryKey)
            ->toArray();

        // 2. Obtener todos los IDs de la BD remota (Hostgator)
        $remoteIds = DB::connection('aplicativos_remote')
            ->table($tableName)
            ->pluck($primaryKey)
            ->toArray();

        // 3. Calcular diferencia (IDs nuevos)
        $newIds = array_diff($remoteIds, $localIds);

        if (empty($newIds)) {
            Log::info("  ✅ {$tableName}: Sin cambios");

            return 0;
        }

        Log::info("  🆕 {$tableName}: {count} nuevos registros", [
            'count' => count($newIds),
        ]);

        // 4. Traer solo registros nuevos en lotes de 100
        $chunks = array_chunk($newIds, 100);
        $totalInserted = 0;

        foreach ($chunks as $chunk) {
            try {
                $newRecords = DB::connection('aplicativos_remote')
                    ->table($tableName)
                    ->whereIn($primaryKey, $chunk)
                    ->get()
                    ->toArray();

                if (! $this->dryRun) {
                    $recordsArray = array_map(fn ($record) => (array) $record, $newRecords);

                    DB::connection('aplicativos')
                        ->table($tableName)
                        ->insert($recordsArray);
                }

                $totalInserted += count($newRecords);

            } catch (\Exception $e) {
                Log::error("  ❌ {$tableName}: Error en lote", [
                    'error' => $e->getMessage(),
                ]);
            }
        }

        return $totalInserted;
    }

    /**
     * Formatear resumen de sincronización
     */
    protected function formatSummary(): string
    {
        $ofacNew = $this->stats['ofac']['new'];
        $ofacErrors = $this->stats['ofac']['errors'];
        $satNew = $this->stats['sat']['new'];
        $satErrors = $this->stats['sat']['errors'];
        $aplicativosNew = $this->stats['aplicativos']['new'];
        $aplicativosErrors = $this->stats['aplicativos']['errors'];

        $summary = "Sincronización completada:\n";
        $summary .= "  OFAC: {$ofacNew} nuevos registros";

        if ($ofacErrors > 0) {
            $summary .= " ({$ofacErrors} errores)";
        }

        // Detalles por tabla OFAC si hay cambios
        if (! empty($this->stats['ofac']['tables'])) {
            $summary .= "\n    Tablas actualizadas:";
            foreach ($this->stats['ofac']['tables'] as $table => $count) {
                $summary .= "\n      - {$table}: {$count}";
            }
        }

        $summary .= "\n  SAT: {$satNew} nuevos registros";

        if ($satErrors > 0) {
            $summary .= " ({$satErrors} errores)";
        }

        // Detalles por tabla SAT si hay cambios
        if (! empty($this->stats['sat']['tables'])) {
            $summary .= "\n    Tablas actualizadas:";
            foreach ($this->stats['sat']['tables'] as $table => $count) {
                $summary .= "\n      - {$table}: {$count}";
            }
        }

        $summary .= "\n  APLICATIVOS: {$aplicativosNew} nuevos registros";

        if ($aplicativosErrors > 0) {
            $summary .= " ({$aplicativosErrors} errores)";
        }

        // Detalles por tabla Aplicativos si hay cambios
        if (! empty($this->stats['aplicativos']['tables'])) {
            $summary .= "\n    Tablas actualizadas:";
            foreach ($this->stats['aplicativos']['tables'] as $table => $count) {
                $summary .= "\n      - {$table}: {$count}";
            }
        }

        if ($this->dryRun) {
            $summary .= "\n\n⚠️  Modo DRY-RUN: No se modificó la base de datos";
        }

        return $summary;
    }

    /**
     * Verificar conexiones (diagnóstico)
     */
    public function testConnections(): array
    {
        $results = [];

        // Test OFAC local
        try {
            $localCount = DB::connection('ofac')->table('Nombres')->count();
            $results['ofac_local'] = [
                'status' => 'OK',
                'count' => $localCount,
            ];
        } catch (\Exception $e) {
            $results['ofac_local'] = [
                'status' => 'ERROR',
                'message' => $e->getMessage(),
            ];
        }

        // Test OFAC remota
        try {
            $remoteCount = DB::connection('ofac_remote')->table('Nombres')->count();
            $results['ofac_remote'] = [
                'status' => 'OK',
                'count' => $remoteCount,
            ];
        } catch (\Exception $e) {
            $results['ofac_remote'] = [
                'status' => 'ERROR',
                'message' => $e->getMessage(),
            ];
        }

        // Test SAT local
        try {
            $localCount = DB::connection('sat')->table('69-B')->count();
            $results['sat_local'] = [
                'status' => 'OK',
                'count' => $localCount,
            ];
        } catch (\Exception $e) {
            $results['sat_local'] = [
                'status' => 'ERROR',
                'message' => $e->getMessage(),
            ];
        }

        // Test SAT remota
        try {
            $remoteCount = DB::connection('sat_remote')->table('69-B')->count();
            $results['sat_remote'] = [
                'status' => 'OK',
                'count' => $remoteCount,
            ];
        } catch (\Exception $e) {
            $results['sat_remote'] = [
                'status' => 'ERROR',
                'message' => $e->getMessage(),
            ];
        }

        // Test Aplicativos local + remota
        try {
            // Contar todas las tablas locales
            $tables = DB::connection('aplicativos')->select('SHOW TABLES');
            $totalLocal = 0;
            foreach ($tables as $table) {
                $tableName = $table->Tables_in_atinet65_aplicativos;
                $totalLocal += DB::connection('aplicativos')->table($tableName)->count();
            }

            $results['aplicativos_local'] = [
                'status' => 'OK',
                'count' => $totalLocal,
                'tables' => count($tables),
            ];
        } catch (\Exception $e) {
            $results['aplicativos_local'] = [
                'status' => 'ERROR',
                'message' => $e->getMessage(),
            ];
        }

        try {
            // Contar todas las tablas remotas
            $tables = DB::connection('aplicativos_remote')->select('SHOW TABLES');
            $totalRemote = 0;
            foreach ($tables as $table) {
                $tableName = $table->Tables_in_atinet65_aplicativos;
                $totalRemote += DB::connection('aplicativos_remote')->table($tableName)->count();
            }

            $results['aplicativos_remote'] = [
                'status' => 'OK',
                'count' => $totalRemote,
                'tables' => count($tables),
            ];
        } catch (\Exception $e) {
            $results['aplicativos_remote'] = [
                'status' => 'ERROR',
                'message' => $e->getMessage(),
            ];
        }

        return $results;
    }
}
