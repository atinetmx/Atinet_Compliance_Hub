<?php

/**
 * Migración de Agenda Legacy → Sistema Nuevo
 *
 * Traslada eventos desde aplicativos_remote.agenda → agenda_events
 * con mapeo de notarias y usuarios.
 * Soporta re-ejecución segura: omite eventos ya migrados (deduplicación
 * por legacy_notaria + titulo + start_fecha).
 *
 * Ejecutar: php migrate_agenda_to_new_system.php
 *
 * Flags:
 * - --dry-run: Solo muestra lo que haría sin modificar BD
 * - --verbose: Muestra detalles de cada evento migrado
 * - --limit=N: Solo migra los primeros N eventos (para testing)
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// ========== CONFIGURACIÓN ==========

$dryRun = in_array('--dry-run', $argv);
$verbose = in_array('--verbose', $argv);
$limit = null;

foreach ($argv as $arg) {
    if (str_starts_with($arg, '--limit=')) {
        $limit = (int) str_replace('--limit=', '', $arg);
    }
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "🗓️  Migración de Agenda Legacy → Sistema Nuevo\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

if ($dryRun) {
    echo "⚠️  MODO DRY-RUN: No se modificará la base de datos\n\n";
}

if ($limit) {
    echo "⚠️  LÍMITE: Solo se migrarán {$limit} eventos\n\n";
}

// ========== PASO 1: CONSTRUIR MAPEOS ==========

echo "📋 Paso 1/4: Construyendo mapeos de notarias y usuarios...\n";

// Mapeo: legacy_identifier → notaria_id
$notariasMap = DB::table('notarias')
    ->whereNotNull('legacy_identifier')
    ->pluck('id', 'legacy_identifier')
    ->toArray();

// IMPORTANTE: Agregar "atinet" → NULL (super_admins sin notaria_id)
$notariasMap['atinet'] = null;

$totalNotarias = count($notariasMap);
echo "  ✓ {$totalNotarias} notarías mapeadas (incluyendo 'atinet' para super_admins)\n";

// Ya no necesitamos mapeo a admin por notaría, los eventos legacy serán user_id=NULL
// para que se vean por todos los usuarios de la notaría
echo "  → Eventos legacy (sin id_usuario_creador) se migrarán con user_id=NULL (vista compartida)\n";

// Mapeo: email legacy → user_id nuevo
$legacyUsuarios = DB::connection('aplicativos_remote')
    ->table('usuario')
    ->select('id', 'USER as email', 'notaria')
    ->get();

$usuariosMap = []; // [legacy_id => new_user_id]
$usuariosEmailMap = []; // [email => new_user_id]

$newUsersEmails = DB::table('users')->pluck('id', 'email')->toArray();

foreach ($legacyUsuarios as $legacyUser) {
    if (isset($newUsersEmails[$legacyUser->email])) {
        $usuariosMap[$legacyUser->id] = $newUsersEmails[$legacyUser->email];
        $usuariosEmailMap[$legacyUser->email] = $newUsersEmails[$legacyUser->email];
    }
}

$totalMapped = count($usuariosMap);
echo "  ✓ {$totalMapped} usuarios legacy mapeados a sistema nuevo\n\n";

// ========== PASO 2: OBTENER EVENTOS LEGACY ==========

echo "📅 Paso 2/4: Obteniendo eventos de aplicativos_remote.agenda...\n";

$query = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->whereIn('notaria', array_keys($notariasMap))
    ->orderBy('id');

if ($limit) {
    $query->limit($limit);
}

$legacyEvents = $query->get();

$totalEvents = count($legacyEvents);
echo "  ✓ {$totalEvents} eventos obtenidos (filtrados por notarías mapeadas)\n";

// Construir set de eventos ya existentes para deduplicación (legacy_notaria|titulo|start_fecha)
echo "  ↳ Construyendo índice de deduplicación...\n";
$existingKeys = DB::table('agenda_events')
    ->whereNotNull('legacy_notaria')
    ->get(['legacy_notaria', 'titulo', 'start_fecha'])
    ->mapWithKeys(function ($e) {
        $key = $e->legacy_notaria . '|' . $e->titulo . '|' . $e->start_fecha;
        return [$key => true];
    })
    ->toArray();
$existingCount = count($existingKeys);
echo "  ✓ {$existingCount} eventos ya migrados indexados para deduplicación\n\n";

// ========== PASO 3: MAPEAR Y PREPARAR DATOS ==========

echo "🔄 Paso 3/4: Mapeando eventos...\n";

$stats = [
    'total' => count($legacyEvents),
    'notaria_mapped' => 0,
    'notaria_unmapped' => 0,
    'user_mapped_by_id' => 0,
    'user_legacy_null' => 0,
    'user_not_found' => 0,
    'already_exists' => 0,
    'skipped' => 0,
];

$eventsToInsert = [];

foreach ($legacyEvents as $event) {
    try {
        // Mapear notaria
        if (!array_key_exists($event->notaria, $notariasMap)) {
            if ($verbose) {
                echo "  ⚠️  Evento #{$event->id}: Notaría '{$event->notaria}' no encontrada, omitiendo\n";
            }
            $stats['notaria_unmapped']++;
            $stats['skipped']++;
            continue;
        }

        $notariaId = $notariasMap[$event->notaria];
        $stats['notaria_mapped']++;

        // Verificar si ya fue migrado (deduplicación)
        $dedupKey = $event->notaria . '|' . $event->titulo . '|' . $event->start_fecha;
        if (isset($existingKeys[$dedupKey])) {
            $stats['already_exists']++;
            $stats['skipped']++;
            continue;
        }

        // Mapear usuario
        // LÓGICA IMPORTANTE:
        // - Si id_usuario_creador es NULL → user_id = NULL (evento legacy compartido)
        // - Si id_usuario_creador existe → intentar mapear, si no existe → NULL con warning
        $userId = null;

        if ($event->id_usuario_creador) {
            // Intentar mapear por ID legacy
            if (isset($usuariosMap[$event->id_usuario_creador])) {
                $userId = $usuariosMap[$event->id_usuario_creador];
                $stats['user_mapped_by_id']++;
            } else {
                // Usuario legacy no encontrado en sistema nuevo → NULL (evento legacy)
                $userId = null;
                $stats['user_not_found']++;

                if ($verbose) {
                    echo "  ⚠️  Evento #{$event->id}: Usuario legacy #{$event->id_usuario_creador} no encontrado en sistema nuevo, user_id=NULL\n";
                }
            }
        } else {
            // Sin usuario legacy: dejar NULL para vista compartida
            $stats['user_legacy_null']++;
        }

        // Preparar registro para insertar
        $eventsToInsert[] = [
            'notaria_id' => $notariaId,
            'user_id' => $userId,
            'legacy_notaria' => $event->notaria,
            'titulo' => $event->titulo,
            'start_fecha' => $event->start_fecha,
            'end_fecha' => $event->end_fecha,
            'comentarios' => $event->comentarios ? substr($event->comentarios, 0, 255) : null,
            'color' => $event->color ?: '#2563eb',
            'tipo' => 'general',
            'rrule' => null,
            'duration' => null,
            'all_day' => false,
            'created_at' => now(),
            'updated_at' => now(),
        ];

        if ($verbose && count($eventsToInsert) % 500 == 0) {
            $mapped = count($eventsToInsert);
            echo "  → {$mapped} eventos mapeados...\n";
        }

    } catch (\Exception $e) {
        echo "  ❌ Error mapeando evento #{$event->id}: {$e->getMessage()}\n";
        $stats['skipped']++;
    }
}

$totalMapped = count($eventsToInsert);
echo "  ✓ {$totalMapped} eventos listos para insertar\n\n";

// ========== PASO 4: INSERTAR EN BD ==========

echo "💾 Paso 4/4: Insertando eventos en agenda_events...\n";

$totalToInsert = count($eventsToInsert);

if (!$dryRun && count($eventsToInsert) > 0) {
    // Insertar en chunks de 500 para evitar errores de memoria
    $chunks = array_chunk($eventsToInsert, 500);
    $inserted = 0;

    foreach ($chunks as $index => $chunk) {
        DB::table('agenda_events')->insert($chunk);
        $inserted += count($chunk);
        echo "  → {$inserted}/{$totalToInsert} eventos insertados...\n";
    }

    echo "  ✓ {$inserted} eventos insertados exitosamente\n\n";
} else {
    echo "  ⚠️  No se insertaron eventos (dry-run o sin datos)\n\n";
}

// ========== RESUMEN FINAL ==========

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 Resumen de Migración\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "Eventos procesados:       {$stats['total']}\n";
echo "  ✓ Migrados:             " . ($stats['total'] - $stats['skipped']) . "\n";
echo "  ✗ Omitidos:             {$stats['skipped']}\n";
echo "    (ya existían):        {$stats['already_exists']}\n\n";

echo "Mapeo de Notarías:\n";
echo "  ✓ Mapeadas:             {$stats['notaria_mapped']}\n";
echo "  ✗ No encontradas:       {$stats['notaria_unmapped']}\n\n";

echo "Mapeo de Usuarios:\n";
echo "  ✓ Por ID legacy:        {$stats['user_mapped_by_id']}\n";
echo "  ○ Legacy sin usuario:   {$stats['user_legacy_null']}\n";
echo "  ⚠️  No encontrados:      {$stats['user_not_found']}\n\n";

if ($dryRun) {
    echo "⚠️  Modo DRY-RUN: No se modificó la base de datos\n";
    echo "    Ejecuta sin --dry-run para aplicar cambios\n\n";
}

// Verificación final
if (!$dryRun) {
    $finalCount = DB::table('agenda_events')->count();
    echo "Registros en agenda_events: {$finalCount}\n\n";
}

echo "✅ Migración completada\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
