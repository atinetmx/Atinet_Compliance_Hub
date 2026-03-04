<?php

namespace App\Console\Commands;

use App\Services\BlacklistSyncService;
use Illuminate\Console\Command;

class SyncBlacklistsCommand extends Command
{
    /**
     * Nombre y firma del comando
     *
     * @var string
     */
    protected $signature = 'blacklists:sync 
                            {--dry-run : Ejecutar sin modificar base de datos}
                            {--test : Solo verificar conexiones}';

    /**
     * Descripción del comando
     *
     * @var string
     */
    protected $description = 'Sincroniza listas negras (OFAC/SAT) desde Hostgator - Solo registros nuevos (incremental)';

    /**
     * Ejecutar el comando
     */
    public function handle(BlacklistSyncService $syncService): int
    {
        $this->info('');
        $this->info('🔄 Sincronización Incremental de Listas Negras');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        $this->info('');

        // Modo test: solo verificar conexiones
        if ($this->option('test')) {
            return $this->testConnections($syncService);
        }

        // Confirmar si no es dry-run
        if (! $this->option('dry-run')) {
            if (! $this->confirm('¿Deseas sincronizar las listas negras? (Esto traerá registros nuevos desde Hostgator)')) {
                $this->warn('Operación cancelada');

                return self::FAILURE;
            }
        }

        // Habilitar dry-run si se solicitó
        if ($this->option('dry-run')) {
            $syncService->enableDryRun();
            $this->warn('⚠️  MODO DRY-RUN: No se modificará la base de datos');
            $this->info('');
        }

        // Ejecutar sincronización
        $startTime = microtime(true);

        $this->info('📡 Conectando a Hostgator...');
        $result = $syncService->syncAll();

        $duration = round(microtime(true) - $startTime, 2);

        $this->info('');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if ($result['success']) {
            $this->info('✅ '.$result['message']);
            $this->info('');
            $this->info("⏱️  Tiempo: {$duration}s");

            // Mostrar estadísticas detalladas
            $this->displayStats($result['stats']);

            return self::SUCCESS;
        } else {
            $this->error('❌ Error en sincronización: '.$result['error']);
            $this->displayStats($result['stats']);

            return self::FAILURE;
        }
    }

    /**
     * Probar conexiones a todas las BDs
     */
    protected function testConnections(BlacklistSyncService $syncService): int
    {
        $this->info('🔍 Verificando conexiones a bases de datos...');
        $this->info('');

        $results = $syncService->testConnections();

        $allOk = true;

        foreach ($results as $connection => $result) {
            $label = str_pad($connection, 25);

            if ($result['status'] === 'OK') {
                $count = number_format($result['count']);

                // Mostrar número de tablas para aplicativos
                if (isset($result['tables'])) {
                    $tables = $result['tables'];
                    $this->info("  ✅ {$label} → {$count} registros ({$tables} tablas)");
                } else {
                    $this->info("  ✅ {$label} → {$count} registros");
                }
            } else {
                $allOk = false;
                $this->error("  ❌ {$label} → {$result['message']}");
            }
        }

        $this->info('');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if ($allOk) {
            $this->info('✅ Todas las conexiones funcionan correctamente');

            return self::SUCCESS;
        } else {
            $this->error('❌ Algunas conexiones tienen problemas');
            $this->info('');
            $this->warn('💡 Verifica:');
            $this->warn('   - Credenciales en .env');
            $this->warn('   - Firewall/puerto 3306 abierto');
            $this->warn('   - Acceso remoto a Hostgator habilitado');

            return self::FAILURE;
        }
    }

    /**
     * Mostrar estadísticas de sincronización
     */
    protected function displayStats(array $stats): void
    {
        $this->info('');
        $this->info('📊 Estadísticas:');
        $this->info('');

        $tableData = [
            ['OFAC', $stats['ofac']['new'], $stats['ofac']['errors']],
            ['SAT', $stats['sat']['new'], $stats['sat']['errors']],
            ['APLICATIVOS', $stats['aplicativos']['new'], $stats['aplicativos']['errors']],
        ];

        // Agregar detalles de tablas de aplicativos si hay cambios
        if (! empty($stats['aplicativos']['tables'])) {
            foreach ($stats['aplicativos']['tables'] as $table => $count) {
                $tableData[] = ["  └─ {$table}", $count, ''];
            }
        }

        $total = $stats['ofac']['new'] + $stats['sat']['new'] + $stats['aplicativos']['new'];
        $totalErrors = $stats['ofac']['errors'] + $stats['sat']['errors'] + $stats['aplicativos']['errors'];

        $tableData[] = ['TOTAL', $total, $totalErrors];

        $this->table(
            ['Lista', 'Nuevos', 'Errores'],
            $tableData
        );
    }
}
