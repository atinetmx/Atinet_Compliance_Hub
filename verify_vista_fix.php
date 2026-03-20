<?php

require __DIR__ . '/vendor/autoload.php';

use App\Models\AgendaEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== VERIFICACIÓN: Vista 'Solo míos' ===\n\n";

// Obtener el super_admin
$superAdmin = User::where('tipo_cuenta', 'super_admin')
    ->whereNull('notaria_id')
    ->first();

if (!$superAdmin) {
    echo "❌ No se encontró super_admin\n";
    exit(1);
}

echo "Usuario: {$superAdmin->nombre} ({$superAdmin->email})\n";
echo "Tipo: {$superAdmin->tipo_cuenta}\n";
echo "Notaría ID: " . ($superAdmin->notaria_id ?? 'NULL') . "\n\n";

// Contar eventos propios del super_admin
$eventosPropios = AgendaEvent::where('user_id', $superAdmin->id)->count();
echo "Eventos propios del super_admin: {$eventosPropios}\n";

// Contar eventos legacy de atinet
$eventosLegacyAtinet = AgendaEvent::whereNull('user_id')
    ->where('legacy_notaria', 'atinet')
    ->count();
echo "Eventos legacy 'atinet' (user_id=NULL): {$eventosLegacyAtinet}\n\n";

// Contar eventos de otros super admins
$eventosOtrosSuperAdmins = AgendaEvent::whereNotNull('user_id')
    ->where('user_id', '!=', $superAdmin->id)
    ->whereNull('notaria_id')
    ->count();
echo "Eventos de otros super_admins: {$eventosOtrosSuperAdmins}\n\n";

// Total de eventos en la tabla
$totalEventos = AgendaEvent::count();
echo "Total eventos en agenda_events: {$totalEventos}\n\n";

echo "--- Vista 'propio' ---\n";
$eventosPropio = AgendaEvent::visiblePara($superAdmin, 'propio')->get();
echo "Eventos visibles: {$eventosPropio->count()}\n";

// Desglosar
$propiosEnPropio = $eventosPropio->where('user_id', $superAdmin->id)->count();
$legacyEnPropio = $eventosPropio->whereNull('user_id')->count();
echo "  - Propios: {$propiosEnPropio}\n";
echo "  - Legacy (NULL): {$legacyEnPropio}\n";

$expectedPropio = $eventosPropios + $eventosLegacyAtinet;
if ($eventosPropio->count() === $expectedPropio) {
    echo "✅ Vista 'propio' CORRECTA: {$eventosPropio->count()} eventos\n";
} else {
    echo "❌ Vista 'propio' INCORRECTA\n";
    echo "   Esperado: {$expectedPropio} (propios + legacy)\n";
    echo "   Obtenido: {$eventosPropio->count()}\n";
}

echo "\n--- Vista 'todos' ---\n";
$eventosTodos = AgendaEvent::visiblePara($superAdmin, 'todos')->get();
echo "Eventos visibles: {$eventosTodos->count()}\n";

$propiosEnTodos = $eventosTodos->where('user_id', $superAdmin->id)->count();
$legacyEnTodos = $eventosTodos->whereNull('user_id')->count();
$otrosEnTodos = $eventosTodos->where('user_id', '!=', $superAdmin->id)
    ->whereNotNull('user_id')->count();

echo "  - Propios: {$propiosEnTodos}\n";
echo "  - Legacy (NULL): {$legacyEnTodos}\n";
echo "  - Otros super_admins: {$otrosEnTodos}\n";

$expectedTodos = $eventosPropios + $eventosLegacyAtinet + $eventosOtrosSuperAdmins;
if ($eventosTodos->count() === $expectedTodos) {
    echo "✅ Vista 'todos' CORRECTA: {$eventosTodos->count()} eventos\n";
} else {
    echo "❌ Vista 'todos' INCORRECTA\n";
    echo "   Esperado: {$expectedTodos} (propios + legacy + otros)\n";
    echo "   Obtenido: {$eventosTodos->count()}\n";
}

echo "\n=== RESUMEN ===\n";
echo "Vista 'propio' debe mostrar SOLO eventos propios + legacy compartidos\n";
echo "Vista 'todos' debe mostrar propios + legacy + eventos de otros super_admins\n";
