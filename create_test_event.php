<?php

/**
 * Crear eventos de prueba para verificar la bitácora combinada
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AgendaEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

echo "\n=== CREAR EVENTOS DE PRUEBA PARA FECHA 2026-03-12 ===\n\n";

$user = User::where('tipo_cuenta', 'super_admin')->first();
$fecha = '2026-03-12 10:00:00';

// Crear evento que se registrará en activity_log
echo "Creando evento de prueba...\n";
$event = AgendaEvent::create([
    'notaria_id' => null, // Para super admin
    'user_id' => $user->id,
    'titulo' => 'Evento de prueba para bitácora - 12 Marzo',
    'start_fecha' => $fecha,
    'end_fecha' => '2026-03-12 11:00:00',
    'tipo' => 'general',
    'color' => '#3b82f6',
]);

echo "✓ Evento creado (ID: {$event->id})\n\n";

// Verificar que se creó el log
$log = Activity::where('log_name', 'agenda')
    ->where('subject_type', AgendaEvent::class)
    ->where('subject_id', $event->id)
    ->first();

if ($log) {
    echo "✓ Log registrado en activity_log:\n";
    echo "  - ID: {$log->id}\n";
    echo "  - Descripción: {$log->description}\n";
    echo "  - Fecha: {$log->created_at}\n";

    // Actualizar la fecha del log para que sea del 12 de marzo
    $log->created_at = '2026-03-12 10:00:00';
    $log->save();
    echo "  - ✓ Fecha actualizada a: {$log->created_at}\n\n";
}

echo "=== VER BITÁCORA COMBINADA PARA 2026-03-12 ===\n\n";

// Simular la consulta del controlador
$fecha = '2026-03-12';

// 1. Logs nuevos
$newActivity = Activity::where('log_name', 'agenda')
    ->whereDate('created_at', $fecha)
    ->get();

echo "1. Activity Log (nuevos):\n";
echo "   Total: {$newActivity->count()} registros\n";
foreach ($newActivity as $act) {
    echo "   - [{$act->created_at->format('H:i')}] {$act->causer?->name}: {$act->description}\n";
}
echo "\n";

// 2. Logs legacy
$legacyLogs = DB::connection('aplicativos')
    ->table('log')
    ->where('notaria', 'atinet')
    ->where('fecha', $fecha)
    ->get();

echo "2. Legacy Log:\n";
echo "   Total: {$legacyLogs->count()} registros\n";
foreach ($legacyLogs->take(5) as $log) {
    echo "   - [{$log->hora}] {$log->mail}: {$log->accion}\n";
}
echo "\n";

// 3. Combinados
$newMapped = $newActivity->map(fn ($a) => [
    'hora' => $a->created_at->format('H:i'),
    'mail' => $a->causer?->name ?? 'Sistema',
    'accion' => $a->description,
])->all();

$legacyMapped = $legacyLogs->map(fn ($l) => [
    'hora' => $l->hora,
    'mail' => $l->mail,
    'accion' => $l->accion,
])->all();

$combined = collect(array_merge($newMapped, $legacyMapped))
    ->sortByDesc('hora')
    ->values();

echo "3. Combinados (ordenados por hora DESC):\n";
echo "   Total: {$combined->count()} registros\n";
foreach ($combined->take(10) as $log) {
    echo "   - [{$log['hora']}] {$log['mail']}: {$log['accion']}\n";
}

echo "\n✅ Verificación completa\n";
echo "Ahora refresca la página en el navegador y ve a la bitácora del 12-03-2026\n";
echo "Deberías ver tanto el evento nuevo como los logs legacy combinados\n\n";
