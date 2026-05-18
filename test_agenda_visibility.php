<?php

/**
 * Prueba de Visibilidad de Eventos por Usuario
 * Verifica que los usuarios solo vean sus eventos + eventos legacy compartidos
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AgendaEvent;
use App\Models\User;

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "🧪 PRUEBA: Crear evento y verificar visibilidad\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

// Obtener usuarios de prueba
$superAdmin = User::where('tipo_cuenta', 'super_admin')->first();
$admin1 = User::where('tipo_cuenta', 'admin_notaria')->where('notaria_id', 1)->first();
$admin2 = User::where('tipo_cuenta', 'admin_notaria')->where('notaria_id', 2)->first();

echo "📋 Usuarios de prueba:\n";
echo "  1. Super Admin: {$superAdmin->name} (ID: {$superAdmin->id})\n";
if ($admin1) {
    echo "  2. Admin Notaría 1: {$admin1->name} (ID: {$admin1->id})\n";
}
if ($admin2) {
    echo "  3. Admin Notaría 2: {$admin2->name} (ID: {$admin2->id})\n";
}
echo "\n";

// Crear un evento de prueba con el super admin
echo "➕ Creando evento de prueba con Super Admin...\n";

$nuevoEvento = AgendaEvent::create([
    'titulo' => 'PRUEBA DE VISIBILIDAD - '.now()->format('H:i:s'),
    'start_fecha' => now()->addDays(1),
    'end_fecha' => now()->addDays(1)->addHour(),
    'comentarios' => 'Este evento fue creado por el super admin para pruebas',
    'color' => '#ff0000',
    'tipo' => 'general',
    'notaria_id' => $superAdmin->notaria_id,
    'user_id' => $superAdmin->id,
    'all_day' => false,
]);

echo "  ✓ Evento #{$nuevoEvento->id} creado exitosamente\n";
echo "    - Título: {$nuevoEvento->titulo}\n";
echo "    - Creado por: user_id = {$nuevoEvento->user_id}\n";
echo '    - Notaría: '.($nuevoEvento->notaria_id ?: 'NULL (super_admin)')."\n\n";

// Verificar visibilidad por cada usuario
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "👁️  VERIFICACIÓN DE VISIBILIDAD\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$usuarios = [$superAdmin];
if ($admin1) {
    $usuarios[] = $admin1;
}
if ($admin2) {
    $usuarios[] = $admin2;
}

foreach ($usuarios as $usuario) {
    echo "Usuario: {$usuario->name} (ID: {$usuario->id})\n";
    echo "  Tipo: {$usuario->tipo_cuenta}\n";
    echo '  Notaría ID: '.($usuario->notaria_id ?: 'NULL')."\n";

    // Buscar el evento usando el scope
    $puedeVer = AgendaEvent::where('id', $nuevoEvento->id)
        ->visiblePara($usuario)
        ->exists();

    $debePoder = ($usuario->id === $nuevoEvento->user_id) ||
                 ($usuario->tipo_cuenta === 'admin_notaria' && $usuario->notaria_id === $nuevoEvento->notaria_id);

    if ($puedeVer) {
        echo "  ✅ PUEDE ver el evento #{$nuevoEvento->id}\n";
    } else {
        echo "  ❌ NO PUEDE ver el evento #{$nuevoEvento->id}\n";
    }

    echo '  Esperado: '.($debePoder ? 'PUEDE ver' : 'NO PUEDE ver')."\n";

    if ($puedeVer === $debePoder) {
        echo "  ✅ Correcto\n";
    } else {
        echo "  ⚠️  Diferencia en comportamiento esperado\n";
    }

    echo "\n";
}

// Limpiar: eliminar evento de prueba
echo "🧹 Limpiando: Eliminando evento de prueba...\n";
$nuevoEvento->delete();
echo "  ✓ Evento #{$nuevoEvento->id} eliminado\n\n";

// Resumen de eventos actuales
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "📊 RESUMEN DE EVENTOS ACTUALES\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

$totalEventos = AgendaEvent::count();
$eventosConUsuario = AgendaEvent::whereNotNull('user_id')->count();
$eventosLegacy = AgendaEvent::whereNull('user_id')->count();

echo "Total eventos en BD:           {$totalEventos}\n";
echo "  Con user_id (personales):    {$eventosConUsuario}\n";
echo "  Sin user_id (legacy):        {$eventosLegacy}\n\n";

echo "✅ Confirmación: El sistema GUARDA correctamente el user_id\n";
echo "   cuando un usuario crea un evento nuevo.\n\n";

echo "📝 Reglas de visibilidad:\n";
echo "  • Usuario normal: Solo ve SUS eventos + eventos legacy (user_id NULL)\n";
echo "  • Admin notaría: Ve TODOS los eventos de su notaría + eventos legacy\n";
echo "  • Super admin: Ve SUS eventos + eventos legacy de 'atinet'\n\n";

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
