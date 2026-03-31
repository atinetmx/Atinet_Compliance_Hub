<?php

/**
 * Script de prueba para verificar el logging de actividad en AgendaEvent
 *
 * Este script:
 * 1. Crea un evento de agenda
 * 2. Verifica que se registró en activity_log
 * 3. Actualiza el evento
 * 4. Verifica que se registró la actualización
 * 5. Elimina el evento
 * 6. Verifica que se registró la eliminación
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AgendaEvent;
use App\Models\User;
use Spatie\Activitylog\Models\Activity;

echo "\n=== TEST: Activity Logging en AgendaEvent ===\n\n";

// 1. Obtener un usuario de prueba
$user = User::where('tipo_cuenta', 'super_admin')->first();
if (! $user) {
    echo "❌ No se encontró un usuario super_admin para pruebas\n";
    exit(1);
}

echo "✓ Usuario de prueba: {$user->name} (ID: {$user->id})\n";

// 2. Crear un evento de agenda
echo "\n--- Creando evento de prueba ---\n";
$event = AgendaEvent::create([
    'notaria_id' => $user->notaria_id,
    'user_id' => $user->id,
    'titulo' => 'Evento de prueba - Activity Log',
    'start_fecha' => now(),
    'end_fecha' => now()->addHour(),
    'comentarios' => 'Este es un evento de prueba para verificar el logging',
    'color' => '#3b82f6',
    'tipo' => 'general',
    'all_day' => false,
]);

echo "✓ Evento creado (ID: {$event->id})\n";

// 3. Verificar que se registró en activity_log
$createActivity = Activity::where('log_name', 'agenda')
    ->where('subject_type', AgendaEvent::class)
    ->where('subject_id', $event->id)
    ->where('event', 'created')
    ->first();

if ($createActivity) {
    echo "✅ LOG CREATE registrado correctamente\n";
    echo "   - Descripción: {$createActivity->description}\n";
    echo '   - Causer: '.($createActivity->causer?->name ?? 'N/A')."\n";
    echo '   - Propiedades: '.json_encode($createActivity->properties)."\n";
} else {
    echo "❌ No se encontró el log de creación\n";
}

// 4. Actualizar el evento
echo "\n--- Actualizando evento ---\n";
$event->update([
    'titulo' => 'Evento ACTUALIZADO - Activity Log',
    'comentarios' => 'Comentario actualizado para pruebas',
]);

echo "✓ Evento actualizado\n";

// 5. Verificar que se registró la actualización
$updateActivity = Activity::where('log_name', 'agenda')
    ->where('subject_type', AgendaEvent::class)
    ->where('subject_id', $event->id)
    ->where('event', 'updated')
    ->first();

if ($updateActivity) {
    echo "✅ LOG UPDATE registrado correctamente\n";
    echo "   - Descripción: {$updateActivity->description}\n";
    echo '   - Propiedades: '.json_encode($updateActivity->properties)."\n";
} else {
    echo "❌ No se encontró el log de actualización\n";
}

// 6. Eliminar el evento
echo "\n--- Eliminando evento ---\n";
$eventId = $event->id;
$eventTitulo = $event->titulo;
$event->delete();

echo "✓ Evento eliminado\n";

// 7. Verificar que se registró la eliminación
$deleteActivity = Activity::where('log_name', 'agenda')
    ->where('subject_type', AgendaEvent::class)
    ->where('subject_id', $eventId)
    ->where('event', 'deleted')
    ->first();

if ($deleteActivity) {
    echo "✅ LOG DELETE registrado correctamente\n";
    echo "   - Descripción: {$deleteActivity->description}\n";
    echo '   - Propiedades: '.json_encode($deleteActivity->properties)."\n";
} else {
    echo "❌ No se encontró el log de eliminación\n";
}

// 8. Resumen final
echo "\n=== RESUMEN ===\n";
$totalLogs = Activity::where('log_name', 'agenda')
    ->where('subject_type', AgendaEvent::class)
    ->where('subject_id', $eventId)
    ->count();

echo "Total de logs generados: {$totalLogs}\n";

$allLogs = Activity::where('log_name', 'agenda')
    ->where('subject_type', AgendaEvent::class)
    ->where('subject_id', $eventId)
    ->orderBy('created_at')
    ->get();

foreach ($allLogs as $log) {
    echo "\n- [{$log->event}] {$log->description}\n";
    echo "  @ {$log->created_at->format('Y-m-d H:i:s')}\n";
}

echo "\n✅ Test completado exitosamente\n\n";
