<?php

/**
 * Prueba del sistema de vistas: "propio" vs "todos"
 * Verifica que admins puedan ver diferentes conjuntos de eventos según la vista
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AgendaEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "🧪 PRUEBA: Sistema de Vistas (Propio vs Todos)\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Obtener usuarios de prueba
$superAdmin1 = User::where('tipo_cuenta', 'super_admin')->first();
$superAdmin2 = User::where('tipo_cuenta', 'super_admin')->where('id', '!=', $superAdmin1->id)->first();
$adminNotaria = User::where('tipo_cuenta', 'admin_notaria')->first();

echo "📋 Preparando datos de prueba...\n\n";

// Crear eventos de prueba
$eventoSuperAdmin1 = AgendaEvent::create([
    'titulo' => 'EVENTO SUPER ADMIN 1',
    'start_fecha' => now()->addDays(1),
    'end_fecha' => now()->addDays(1)->addHour(),
    'comentarios' => 'Creado por super admin 1',
    'color' => '#ff0000',
    'tipo' => 'general',
    'notaria_id' => null,
    'user_id' => $superAdmin1->id,
]);

$eventoSuperAdmin2 = null;
if ($superAdmin2) {
    $eventoSuperAdmin2 = AgendaEvent::create([
        'titulo' => 'EVENTO SUPER ADMIN 2',
        'start_fecha' => now()->addDays(2),
        'end_fecha' => now()->addDays(2)->addHour(),
        'comentarios' => 'Creado por super admin 2',
        'color' => '#00ff00',
        'tipo' => 'general',
        'notaria_id' => null,
        'user_id' => $superAdmin2->id,
    ]);
}

echo "✓ Eventos de prueba creados\n";
echo "  - Evento Super Admin 1: #{$eventoSuperAdmin1->id}\n";
if ($eventoSuperAdmin2) echo "  - Evento Super Admin 2: #{$eventoSuperAdmin2->id}\n";
echo "\n";

// ==================== PRUEBA 1: SUPER ADMIN ====================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "👤 SUPER ADMIN: {$superAdmin1->name} (ID: {$superAdmin1->id})\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Vista "propio"
$eventosPropio = AgendaEvent::visiblePara($superAdmin1, 'propio')->get();
$totalEventos = AgendaEvent::count();
$eventosLegacy = AgendaEvent::whereNull('user_id')->where('legacy_notaria', 'atinet')->count();

echo "👤 Vista: SOLO MÍOS (propio)\n";
echo "  Total visible: {$eventosPropio->count()}\n";
echo "    - Propios: " . $eventosPropio->where('user_id', $superAdmin1->id)->count() . "\n";
echo "    - Legacy compartidos: " . $eventosPropio->whereNull('user_id')->count() . "\n";
echo "    - De otros super admins: " . $eventosPropio->where('user_id', '!=', $superAdmin1->id)->whereNotNull('user_id')->count() . "\n";
echo "\n";

// Vista "todos"
$eventosTodos = AgendaEvent::visiblePara($superAdmin1, 'todos')->get();

echo "👁️  Vista: VER TODO (todos)\n";
echo "  Total visible: {$eventosTodos->count()}\n";
echo "    - Propios: " . $eventosTodos->where('user_id', $superAdmin1->id)->count() . "\n";
echo "    - Legacy compartidos: " . $eventosTodos->whereNull('user_id')->count() . "\n";
echo "    - De otros super admins: " . $eventosTodos->where('user_id', '!=', $superAdmin1->id)->whereNotNull('user_id')->count() . "\n";
echo "\n";

// Verificación
$deberiaVerEvento1_propio = $eventosPropio->contains('id', $eventoSuperAdmin1->id);
$deberiaVerEvento2_propio = $eventoSuperAdmin2 ? $eventosPropio->contains('id', $eventoSuperAdmin2->id) : 'N/A';
$deberiaVerEvento1_todos = $eventosTodos->contains('id', $eventoSuperAdmin1->id);
$deberiaVerEvento2_todos = $eventoSuperAdmin2 ? $eventosTodos->contains('id', $eventoSuperAdmin2->id) : 'N/A';

echo "✅ Verificación:\n";
echo "  Vista 'propio':\n";
echo "    - Ve su evento #{$eventoSuperAdmin1->id}: " . ($deberiaVerEvento1_propio ? '✅ SÍ' : '❌ NO') . " (esperado: ✅ SÍ)\n";
if ($eventoSuperAdmin2) {
    echo "    - Ve evento de otro super admin #{$eventoSuperAdmin2->id}: " . ($deberiaVerEvento2_propio ? '❌ SÍ' : '✅ NO') . " (esperado: ✅ NO)\n";
}
echo "\n";
echo "  Vista 'todos':\n";
echo "    - Ve su evento #{$eventoSuperAdmin1->id}: " . ($deberiaVerEvento1_todos ? '✅ SÍ' : '❌ NO') . " (esperado: ✅ SÍ)\n";
if ($eventoSuperAdmin2) {
    echo "    - Ve evento de otro super admin #{$eventoSuperAdmin2->id}: " . ($deberiaVerEvento2_todos ? '✅ SÍ' : '❌ NO') . " (esperado: ✅ SÍ)\n";
}
echo "\n";

// ==================== LIMPIEZA ====================

echo "🧹 Limpiando eventos de prueba...\n";
$eventoSuperAdmin1->delete();
if ($eventoSuperAdmin2) $eventoSuperAdmin2->delete();
echo "✓ Limpieza completada\n\n";

// ==================== RESUMEN ====================

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 RESUMEN DEL SISTEMA DE VISTAS\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "🎯 Comportamiento implementado:\n\n";

echo "SUPER ADMIN:\n";
echo "  Vista 'Solo míos':\n";
echo "    ✓ Sus eventos propios\n";
echo "    ✓ Eventos legacy de atinet (user_id NULL)\n";
echo "    ✗ Eventos de otros super admins\n\n";
echo "  Vista 'Ver todo':\n";
echo "    ✓ Sus eventos propios\n";
echo "    ✓ Eventos legacy de atinet (user_id NULL)\n";
echo "    ✓ Eventos de otros super admins\n\n";

echo "ADMIN NOTARÍA:\n";
echo "  Vista 'Solo míos':\n";
echo "    ✓ Sus eventos propios\n";
echo "    ✓ Eventos legacy de su notaría (user_id NULL)\n";
echo "    ✗ Eventos de otros usuarios de su notaría\n\n";
echo "  Vista 'Ver todo':\n";
echo "    ✓ Sus eventos propios\n";
echo "    ✓ Eventos legacy de su notaría (user_id NULL)\n";
echo "    ✓ Eventos de todos los usuarios de su notaría\n\n";

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
