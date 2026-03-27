<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class SyncAgendaFromLegacy extends Command
{
    protected $signature = 'agenda:sync-legacy
                            {--dry-run : Solo muestra los cambios sin modificar la BD}
                            {--notaria= : Filtrar por notaría legacy específica (default: todas las mapeadas)}';

    protected $description = 'Sincroniza eventos nuevos desde aplicativos_remote.agenda → agenda_events (incremental)';

    /**
     * Mapeo de notarías legacy → notaria_id en sistema nuevo.
     * NULL = eventos de Atinet (super_admins).
     * Agregar aquí nuevas notarías conforme se den de alta.
     */
    protected function buildNotariasMap(): array
    {
        $mapped = DB::table('notarias')
            ->whereNotNull('legacy_identifier')
            ->pluck('id', 'legacy_identifier')
            ->toArray();

        // Atinet siempre mapeada a NULL (sin notaria asignada, visible para super_admins)
        $mapped['atinet'] = null;

        return $mapped;
    }

    public function handle(): int
    {
        $dryRun = $this->option('dry-run');
        $soloNotaria = $this->option('notaria');

        $this->info('');
        $this->info('🗓️  Sincronización de Agenda Legacy → agenda_events');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        if ($dryRun) {
            $this->warn('⚠️  MODO DRY-RUN: No se modificará la base de datos');
        }

        // 1. Construir mapeo de notarías
        $notariasMap = $this->buildNotariasMap();

        if ($soloNotaria) {
            if (! array_key_exists($soloNotaria, $notariasMap)) {
                $this->error("Notaría '{$soloNotaria}' no está en el mapeo. Notarías disponibles: " . implode(', ', array_keys($notariasMap)));

                return self::FAILURE;
            }
            $notariasMap = [$soloNotaria => $notariasMap[$soloNotaria]];
        }

        $this->info('📋 Notarías a sincronizar: ' . implode(', ', array_keys($notariasMap)));

        // 2. Construir índice de deduplicación (lo que ya existe)
        $existingKeys = DB::table('agenda_events')
            ->whereNotNull('legacy_notaria')
            ->get(['legacy_notaria', 'titulo', 'start_fecha'])
            ->mapWithKeys(fn ($e) => ["{$e->legacy_notaria}|{$e->titulo}|{$e->start_fecha}" => true])
            ->toArray();

        $this->info('🔍 Eventos ya migrados indexados: ' . count($existingKeys));

        // 3. Traer eventos remotos
        $legacyEvents = DB::connection('aplicativos_remote')
            ->table('agenda')
            ->whereIn('notaria', array_keys($notariasMap))
            ->orderBy('id')
            ->get();

        $this->info('📥 Eventos en Hostgator (notarías mapeadas): ' . count($legacyEvents));

        // 4. Filtrar los que no existen aún
        $toInsert = [];
        $skipped = 0;

        foreach ($legacyEvents as $event) {
            $dedupKey = "{$event->notaria}|{$event->titulo}|{$event->start_fecha}";

            if (isset($existingKeys[$dedupKey])) {
                $skipped++;
                continue;
            }

            $toInsert[] = [
                'notaria_id'   => $notariasMap[$event->notaria],
                'user_id'      => null, // Eventos legacy siempre compartidos
                'legacy_notaria' => $event->notaria,
                'titulo'       => $event->titulo,
                'start_fecha'  => $event->start_fecha,
                'end_fecha'    => $event->end_fecha,
                'comentarios'  => $event->comentarios ? substr($event->comentarios, 0, 255) : null,
                'color'        => $event->color ?: '#2563eb',
                'tipo'         => 'general',
                'rrule'        => null,
                'duration'     => null,
                'all_day'      => false,
                'created_at'   => now(),
                'updated_at'   => now(),
            ];
        }

        $newCount = count($toInsert);
        $this->info("✅ Ya existían: {$skipped} | Nuevos a insertar: {$newCount}");

        if ($newCount === 0) {
            $this->info('');
            $this->info('✔  Sin cambios. La agenda está al día.');

            return self::SUCCESS;
        }

        // 5. Insertar en chunks
        if (! $dryRun) {
            $chunks = array_chunk($toInsert, 500);
            $inserted = 0;

            foreach ($chunks as $chunk) {
                DB::table('agenda_events')->insert($chunk);
                $inserted += count($chunk);
            }

            $this->info("💾 {$inserted} eventos insertados en agenda_events.");
            Log::info("agenda:sync-legacy: {$inserted} nuevos eventos insertados desde Hostgator.");
        } else {
            $this->warn("DRY-RUN: Se insertarían {$newCount} eventos (sin cambios aplicados).");
        }

        $this->info('');
        $this->info('✅ Sincronización completada.');
        $this->info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        return self::SUCCESS;
    }
}
