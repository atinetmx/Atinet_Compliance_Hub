<?php

/**
 * Script para probar el endpoint de bitácora y reproducir el error
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AgendaEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

echo "\n=== TEST: Bitácora de Agenda ===\n\n";

// Obtener usuario
$user = User::where('tipo_cuenta', 'super_admin')->first();
if (! $user) {
    echo "❌ No se encontró usuario super_admin\n";
    exit(1);
}

echo "✓ Usuario: {$user->name} (ID: {$user->id})\n";
echo '  - Notaría ID: '.($user->notaria_id ?? 'NULL')."\n";
echo "  - Tipo cuenta: {$user->tipo_cuenta}\n\n";

// Fecha a probar
$fecha = '2026-03-12';
echo "--- Probando fecha: {$fecha} ---\n\n";

try {
    // === 1. ACTIVIDADES DE LA NUEVA TABLA (activity_log) ===
    echo "1. Consultando activity_log...\n";

    $newActivitiesQuery = Activity::query()
        ->where('log_name', 'agenda')
        ->whereDate('created_at', $fecha);

    echo '   Query base: '.$newActivitiesQuery->toRawSql()."\n";

    // Filtrar por notaría
    if ($user->notaria_id) {
        echo "   Aplicando filtro por notaría #{$user->notaria_id}\n";
        $newActivitiesQuery->whereHasMorph('subject', [AgendaEvent::class], function ($q) use ($user) {
            $q->where('notaria_id', $user->notaria_id);
        });
    } elseif ($user->tipo_cuenta === 'super_admin') {
        echo "   Aplicando filtro super_admin (sin notaría)\n";
        $newActivitiesQuery->whereHasMorph('subject', [AgendaEvent::class], function ($q) {
            $q->whereNull('notaria_id');
        });
    }

    $newActivities = $newActivitiesQuery->get();
    echo "   ✓ Encontrados: {$newActivities->count()} registros\n\n";

    $newLogs = $newActivities->map(fn ($activity) => [
        'fecha' => $activity->created_at->format('Y-m-d'),
        'hora' => $activity->created_at->format('H:i'),
        'mail' => $activity->causer?->name ?? 'Sistema',
        'accion' => $activity->description,
    ])->all(); // Convertir a array plano

    echo "   Logs nuevos mapeados:\n";
    foreach ($newLogs as $log) {
        echo "     - [{$log['hora']}] {$log['mail']}: {$log['accion']}\n";
    }
    echo "\n";

    // === 2. ACTIVIDADES LEGACY (atinet65_aplicativos.log) ===
    echo "2. Consultando tabla legacy...\n";

    $legacySlug = '';
    if ($user->tipo_cuenta === 'super_admin' && ! $user->notaria_id) {
        $legacySlug = 'atinet';
        echo "   Legacy slug: {$legacySlug} (super admin sin notaría)\n";
    } else {
        $legacySlug = DB::table('notarias')
            ->where('id', $user->notaria_id)
            ->value('legacy_identifier');
        echo '   Legacy slug: '.($legacySlug ?? 'NULL')." (desde notarias table)\n";
    }

    $legacyLogs = [];
    if ($legacySlug) {
        $legacyQuery = DB::connection('aplicativos')
            ->table('log')
            ->where('notaria', $legacySlug)
            ->where('fecha', $fecha);

        echo "   Query legacy: SELECT * FROM log WHERE notaria = '{$legacySlug}' AND fecha = '{$fecha}'\n";

        $legacyData = $legacyQuery->limit(100)->get();
        $legacyLogs = $legacyData->map(fn ($log) => [
            'fecha' => $log->fecha,
            'hora' => $log->hora,
            'mail' => $log->mail,
            'accion' => $log->accion,
        ])->all();

        echo '   ✓ Encontrados: '.count($legacyLogs)." registros legacy\n\n";

        echo "   Logs legacy (primeros 5):\n";
        foreach (array_slice($legacyLogs, 0, 5) as $log) {
            echo "     - [{$log['hora']}] {$log['mail']}: {$log['accion']}\n";
        }
        echo "\n";
    } else {
        echo "   ⚠️ No se encontró legacy_identifier\n\n";
    }

    // === 3. COMBINAR Y ORDENAR ===
    echo "3. Combinando logs...\n";

    $combinedLogs = collect(array_merge($newLogs, $legacyLogs))
        ->sortByDesc('hora')
        ->take(100)
        ->values();

    echo "   ✓ Total combinado: {$combinedLogs->count()} registros\n\n";

    echo "   Primeros 10 registros combinados:\n";
    foreach ($combinedLogs->take(10) as $log) {
        $hora = is_object($log) ? ($log->hora ?? '??:??') : ($log['hora'] ?? '??:??');
        $mail = is_object($log) ? ($log->mail ?? 'N/A') : ($log['mail'] ?? 'N/A');
        $accion = is_object($log) ? ($log->accion ?? 'Sin descripción') : ($log['accion'] ?? 'Sin descripción');

        echo "     - [{$hora}] {$mail}: {$accion}\n";
    }

    echo "\n✅ Test completado sin errores\n\n";
} catch (\Exception $e) {
    echo "\n❌ ERROR DETECTADO:\n";
    echo '   Tipo: '.get_class($e)."\n";
    echo "   Mensaje: {$e->getMessage()}\n";
    echo "   Archivo: {$e->getFile()}:{$e->getLine()}\n\n";
    echo "   Stack trace:\n";
    echo $e->getTraceAsString()."\n\n";
    exit(1);
}
