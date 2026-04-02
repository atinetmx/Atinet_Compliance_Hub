<?php

namespace App\Console\Commands;

use App\Models\LegacyRegistro;
use App\Models\RegistroPersona;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class MigrateRegistroLegacy extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'registro:migrate-legacy
                            {--notaria= : Migrar solo registros de una notaría específica}
                            {--limit= : Limitar el número de registros a migrar}
                            {--dry-run : Ejecutar sin guardar cambios (solo mostrar lo que se migraría)}
                            {--force : Forzar migración sin confirmación}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Migra registros desde atinet65_aplicativos.registro (legacy) hacia registro_web (nueva BD)';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $this->info('🔄 Iniciando migración de Registro Web Legacy...');
        $this->newLine();

        // Contar registros legacy
        $query = LegacyRegistro::query();

        if ($notaria = $this->option('notaria')) {
            $query->where('notaria', $notaria);
        }

        $totalLegacy = $query->count();
        $this->info("📊 Total de registros legacy: {$totalLegacy}");

        if ($totalLegacy === 0) {
            $this->warn('⚠️ No hay registros legacy para migrar.');

            return Command::SUCCESS;
        }

        // Contar registros ya migrados
        $totalMigrated = RegistroPersona::count();
        $this->info("✅ Registros ya en BD nueva: {$totalMigrated}");
        $this->newLine();

        // Confirmación
        if (! $this->option('force') && ! $this->option('dry-run')) {
            if (! $this->confirm("¿Deseas continuar con la migración de {$totalLegacy} registros?")) {
                $this->warn('❌ Migración cancelada.');

                return Command::FAILURE;
            }
            $this->newLine();
        }

        // Aplicar límite si se especifica
        if ($limit = $this->option('limit')) {
            $query->limit((int) $limit);
            $this->info("⚠️ Límite aplicado: {$limit} registros");
            $this->newLine();
        }

        // Migración en lotes
        $migrated = 0;
        $errors = 0;
        $skipped = 0;

        $progressBar = $this->output->createProgressBar($query->count());
        $progressBar->start();

        DB::transaction(function () use ($query, &$migrated, &$errors, &$skipped, $progressBar) {
            $query->chunk(100, function ($legacyRecords) use (&$migrated, &$errors, &$skipped, $progressBar) {
                foreach ($legacyRecords as $legacy) {
                    try {
                        // Verificar si ya existe (por CURP o RFC)
                        $exists = RegistroPersona::where('curp', $legacy->curp)
                            ->orWhere('rfc', $legacy->rfc)
                            ->exists();

                        if ($exists) {
                            $skipped++;
                            $progressBar->advance();

                            continue;
                        }

                        // Migrar registro
                        if (! $this->option('dry-run')) {
                            $legacy->migrateToNew();
                        }

                        $migrated++;
                    } catch (\Exception $e) {
                        $errors++;
                        $this->error("\n❌ Error migrando registro ID {$legacy->idregistro}: {$e->getMessage()}");
                    }

                    $progressBar->advance();
                }
            });
        });

        $progressBar->finish();
        $this->newLine(2);

        // Resumen
        $this->info('📊 Resumen de Migración:');
        $this->table(
            ['Métrica', 'Cantidad'],
            [
                ['✅ Migrados exitosamente', $migrated],
                ['⏭️ Omitidos (ya existen)', $skipped],
                ['❌ Errores', $errors],
                ['📊 Total procesados', $migrated + $skipped + $errors],
            ]
        );

        if ($this->option('dry-run')) {
            $this->warn('⚠️ Modo DRY-RUN: No se guardaron cambios en la base de datos.');
        }

        $this->newLine();
        $this->info('✅ Migración completada!');

        return Command::SUCCESS;
    }
}
