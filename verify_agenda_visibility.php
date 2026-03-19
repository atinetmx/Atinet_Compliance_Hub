<?php

/**
 * Verificar visibilidad de eventos según lógica actualizada
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AgendaEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "🔍 Verificación de Visibilidad de Eventos\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Estadísticas generales
$totalEventos = AgendaEvent::count();
$eventosConUsuario = AgendaEvent::whereNotNull('user_id')->count();
$eventosLegacy = AgendaEvent::whereNull('user_id')->count();
$eventosAtinet = AgendaEvent::where('legacy_notaria', 'atinet')->count();

echo "📊 Estadísticas Generales:\n";
echo "  Total eventos: {$totalEventos}\n";
echo "  Con usuario (personales): {$eventosConUsuario}\n";
echo "  Sin usuario (legacy/compartidos): {$eventosLegacy}\n";
echo "  Eventos de 'atinet': {$eventosAtinet}\n\n";

// Probar con diferentes tipos de usuarios
$usuarios = User::whereIn('id', [1, 2, 3, 9])->get(); // Diferentes tipos

foreach ($usuarios as $user) {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "👤 Usuario: {$user->name} (ID: {$user->id})\n";
    echo "   Tipo: {$user->tipo_cuenta}\n";
    echo "   Notaría ID: " . ($user->notaria_id ?: 'NULL (super_admin)') . "\n\n";

    // Obtener eventos visibles usando el scope
    $eventosVisibles = AgendaEvent::visiblePara($user)->get();

    echo "   📅 Eventos visibles: " . $eventosVisibles->count() . "\n";

    // Desglosar por tipo
    $personales = $eventosVisibles->whereNotNull('user_id')->where('user_id', $user->id)->count();
    $legacy = $eventosVisibles->whereNull('user_id')->count();
    $otrosUsuarios = $eventosVisibles->whereNotNull('user_id')->where('user_id', '!=', $user->id)->count();

    echo "     → Personales (mis eventos): {$personales}\n";
    echo "     → Legacy compartidos (user_id NULL): {$legacy}\n";

    if ($otrosUsuarios > 0) {
        echo "     → De otros usuarios (admin): {$otrosUsuarios}\n";
    }

    // Mostrar muestra de eventos legacy si existen
    if ($legacy > 0) {
        echo "\n   📋 Muestra de eventos legacy (primeros 3):\n";
        $muestraLegacy = $eventosVisibles->whereNull('user_id')->take(3);
        foreach ($muestraLegacy as $evento) {
            $notaria = $evento->legacy_notaria ?: "ID:{$evento->notaria_id}";
            echo "     - {$evento->titulo} (Notaría: {$notaria}, Fecha: " . $evento->start_fecha->format('Y-m-d') . ")\n";
        }
    }

    echo "\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ Verificación Completada\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
