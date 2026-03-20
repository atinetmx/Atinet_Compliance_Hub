<?php

require __DIR__ . '/vendor/autoload.php';

use App\Models\AgendaEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "========================================\n";
echo "  CREAR SEGUNDO SUPER_ADMIN Y TESTEAR\n";
echo "========================================\n\n";

// Crear o buscar segundo super_admin
$superAdmin2 = User::where('email', 'admin2@atinet.mx')->first();

if (!$superAdmin2) {
    echo "Creando segundo super_admin...\n";
    $superAdmin2 = User::create([
        'name' => 'Super Admin 2',
        'email' => 'admin2@atinet.mx',
        'email_verified_at' => now(),
        'password' => Hash::make('password'),
        'tipo_cuenta' => 'super_admin',
        'notaria_id' => null,
    ]);
    echo "✅ Super admin 2 creado (ID: {$superAdmin2->id})\n\n";
} else {
    echo "✅ Super admin 2 ya existe (ID: {$superAdmin2->id})\n\n";
}

// Crear un evento para super_admin 2
$eventoTest = AgendaEvent::where('user_id', $superAdmin2->id)->first();

if (!$eventoTest) {
    echo "Creando evento de prueba para super_admin 2...\n";
    $eventoTest = AgendaEvent::create([
        'titulo' => 'Evento de Super Admin 2',
        'start_fecha' => now()->addDays(2)->setTime(10, 0),
        'end_fecha' => now()->addDays(2)->setTime(11, 0),
        'comentarios' => 'Este evento solo debe verse en "Ver todo", NO en "Solo míos"',
        'color' => '#ff0000',
        'tipo' => 'general',
        'user_id' => $superAdmin2->id,
        'notaria_id' => null,
    ]);
    echo "✅ Evento creado (ID: {$eventoTest->id})\n\n";
} else {
    echo "✅ Evento de prueba ya existe (ID: {$eventoTest->id})\n\n";
}

echo "========================================\n\n";

// Ahora probar con super_admin 1
$superAdmin1 = User::where('tipo_cuenta', 'super_admin')
    ->whereNull('notaria_id')
    ->where('id', '!=', $superAdmin2->id)
    ->first();

echo "PROBANDO CON SUPER_ADMIN 1:\n";
echo "Usuario: {$superAdmin1->name} (ID: {$superAdmin1->id})\n\n";

// Vista "Ver todo"
$eventosTodos = AgendaEvent::visiblePara($superAdmin1, 'todos')->get();
$propiosTodos = $eventosTodos->filter(fn($e) => $e->user_id === $superAdmin1->id)->count();
$legacyTodos = $eventosTodos->filter(fn($e) => $e->user_id === null)->count();
$otrosTodos = $eventosTodos->filter(fn($e) => $e->user_id !== null && $e->user_id !== $superAdmin1->id)->count();

echo "🔍 Vista 'Ver todo' (todos):\n";
echo "   Total: {$eventosTodos->count()} eventos\n";
echo "   - Propios: {$propiosTodos}\n";
echo "   - Legacy: {$legacyTodos}\n";
echo "   - Otros super_admins: {$otrosTodos}\n";

if ($otrosTodos > 0) {
    echo "   Eventos de otros:\n";
    foreach ($eventosTodos->filter(fn($e) => $e->user_id !== null && $e->user_id !== $superAdmin1->id) as $evento) {
        echo "     - [{$evento->id}] {$evento->titulo} (user_id: {$evento->user_id})\n";
    }
}
echo "\n";

// Vista "Solo míos"
$eventosPropio = AgendaEvent::visiblePara($superAdmin1, 'propio')->get();
$propiosPropio = $eventosPropio->filter(fn($e) => $e->user_id === $superAdmin1->id)->count();
$legacyPropio = $eventosPropio->filter(fn($e) => $e->user_id === null)->count();
$otrosPropio = $eventosPropio->filter(fn($e) => $e->user_id !== null && $e->user_id !== $superAdmin1->id)->count();

echo "🔍 Vista 'Solo míos' (propio):\n";
echo "   Total: {$eventosPropio->count()} eventos\n";
echo "   - Propios: {$propiosPropio}\n";
echo "   - Legacy: {$legacyPropio}\n";
echo "   - Otros super_admins: {$otrosPropio}\n\n";

// Comparación
$diferencia = $eventosTodos->count() - $eventosPropio->count();

echo "========================================\n";
echo "📊 RESULTADO:\n";
echo "========================================\n\n";

if ($diferencia > 0) {
    echo "✅✅✅ FUNCIONA CORRECTAMENTE ✅✅✅\n\n";
    echo "Vista 'Ver todo' muestra {$diferencia} evento(s) adicional(es)\n";
    echo "que NO aparecen en 'Solo míos'\n\n";
    echo "Estos son los eventos de otros super_admins.\n";
} else {
    echo "⚠️  Ambas vistas muestran lo mismo\n";
    echo "Esto NO debería pasar si hay eventos de otros usuarios.\n";
}

echo "\n";
echo "AHORA en el navegador:\n";
echo "  • 'Ver todo' debería mostrar: {$eventosTodos->count()} eventos\n";
echo "  • 'Solo míos' debería mostrar: {$eventosPropio->count()} eventos\n";
echo "  • Diferencia: {$diferencia} evento(s)\n";

echo "\n========================================\n";
