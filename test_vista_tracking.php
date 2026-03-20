<?php

require __DIR__ . '/vendor/autoload.php';

use App\Models\AgendaEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "========================================\n";
echo "  TEST: TRACKING VISTA SELECTOR\n";
echo "========================================\n\n";

// Obtener super_admin
$superAdmin = User::where('tipo_cuenta', 'super_admin')
    ->whereNull('notaria_id')
    ->first();

if (!$superAdmin) {
    echo "❌ No se encontró super_admin\n";
    exit(1);
}

echo "👤 USUARIO: {$superAdmin->nombre} (ID: {$superAdmin->id})\n";
echo "   Email: {$superAdmin->email}\n";
echo "   Tipo: {$superAdmin->tipo_cuenta}\n";
echo "   Notaría: " . ($superAdmin->notaria_id ?? 'NULL (super admin)') . "\n\n";

// Resumen de eventos en BD
echo "📊 RESUMEN BASE DE DATOS:\n";
echo "   Total eventos: " . AgendaEvent::count() . "\n";
echo "   Eventos propios (user_id={$superAdmin->id}): " . AgendaEvent::where('user_id', $superAdmin->id)->count() . "\n";
echo "   Eventos legacy atinet (user_id=NULL): " . AgendaEvent::whereNull('user_id')->where('legacy_notaria', 'atinet')->count() . "\n";
echo "   Eventos otros super_admins: " . AgendaEvent::whereNotNull('user_id')->where('user_id', '!=', $superAdmin->id)->whereNull('notaria_id')->count() . "\n\n";

echo "========================================\n\n";

// TEST 1: Vista "Ver todo" (todos)
echo "🔍 TEST 1: VISTA 'Ver todo' (todos)\n";
echo "─────────────────────────────────────\n";

$eventosTodos = AgendaEvent::visiblePara($superAdmin, 'todos')->get();

echo "Total eventos visibles: {$eventosTodos->count()}\n\n";

// Desglose por tipo
$propiosTodos = $eventosTodos->filter(fn($e) => $e->user_id === $superAdmin->id);
$legacyTodos = $eventosTodos->filter(fn($e) => $e->user_id === null);
$otrosTodos = $eventosTodos->filter(fn($e) => $e->user_id !== null && $e->user_id !== $superAdmin->id);

echo "Desglose:\n";
echo "  • Propios: {$propiosTodos->count()}\n";
if ($propiosTodos->count() > 0) {
    foreach ($propiosTodos as $evento) {
        echo "    - [{$evento->id}] {$evento->titulo} (creado: {$evento->created_at?->format('Y-m-d H:i')})\n";
    }
}
echo "\n";

echo "  • Legacy compartidos (user_id=NULL): {$legacyTodos->count()}\n";
if ($legacyTodos->count() > 0) {
    echo "    Mostrando primeros 5:\n";
    foreach ($legacyTodos->take(5) as $evento) {
        echo "    - [{$evento->id}] {$evento->titulo} (legacy_notaria: {$evento->legacy_notaria})\n";
    }
}
echo "\n";

echo "  • Otros super_admins: {$otrosTodos->count()}\n";
if ($otrosTodos->count() > 0) {
    foreach ($otrosTodos as $evento) {
        echo "    - [{$evento->id}] {$evento->titulo} (user_id: {$evento->user_id})\n";
    }
}

echo "\n========================================\n\n";

// TEST 2: Vista "Solo míos" (propio)
echo "🔍 TEST 2: VISTA 'Solo míos' (propio)\n";
echo "─────────────────────────────────────\n";

$eventosPropio = AgendaEvent::visiblePara($superAdmin, 'propio')->get();

echo "Total eventos visibles: {$eventosPropio->count()}\n\n";

// Desglose por tipo
$propiosPropio = $eventosPropio->filter(fn($e) => $e->user_id === $superAdmin->id);
$legacyPropio = $eventosPropio->filter(fn($e) => $e->user_id === null);
$otrosPropio = $eventosPropio->filter(fn($e) => $e->user_id !== null && $e->user_id !== $superAdmin->id);

echo "Desglose:\n";
echo "  • Propios: {$propiosPropio->count()}\n";
if ($propiosPropio->count() > 0) {
    foreach ($propiosPropio as $evento) {
        echo "    - [{$evento->id}] {$evento->titulo} (creado: {$evento->created_at?->format('Y-m-d H:i')})\n";
    }
}
echo "\n";

echo "  • Legacy compartidos (user_id=NULL): {$legacyPropio->count()}\n";
if ($legacyPropio->count() > 0) {
    echo "    Mostrando primeros 5:\n";
    foreach ($legacyPropio->take(5) as $evento) {
        echo "    - [{$evento->id}] {$evento->titulo} (legacy_notaria: {$evento->legacy_notaria})\n";
    }
}
echo "\n";

echo "  • Otros super_admins: {$otrosPropio->count()}\n";
if ($otrosPropio->count() > 0) {
    echo "    ❌ ERROR: No debería haber eventos de otros en vista 'propio'!\n";
    foreach ($otrosPropio as $evento) {
        echo "    - [{$evento->id}] {$evento->titulo} (user_id: {$evento->user_id})\n";
    }
}

echo "\n========================================\n\n";

// COMPARACIÓN
echo "📊 COMPARACIÓN:\n";
echo "─────────────────────────────────────\n";
$diff = $eventosTodos->count() - $eventosPropio->count();

if ($diff === 0) {
    echo "ℹ️  Ambas vistas muestran {$eventosTodos->count()} eventos\n";
    echo "   Esto es normal si NO hay eventos de otros super_admins\n";
} else {
    echo "✅ Vista 'todos' muestra {$diff} evento(s) adicional(es)\n";
    echo "   Estos son eventos de otros super_admins\n";
}

echo "\n";

// VALIDACIÓN
echo "🔎 VALIDACIÓN:\n";
echo "─────────────────────────────────────\n";

$todosOk = true;

// Check 1: Vista 'propio' NO debe tener eventos de otros
if ($otrosPropio->count() > 0) {
    echo "❌ Vista 'propio' contiene {$otrosPropio->count()} evento(s) de otros usuarios\n";
    $todosOk = false;
} else {
    echo "✅ Vista 'propio': Solo eventos propios + legacy\n";
}

// Check 2: Vista 'todos' debe tener >= eventos que 'propio'
if ($eventosTodos->count() >= $eventosPropio->count()) {
    echo "✅ Vista 'todos': Contiene todos los eventos de 'propio' + adicionales\n";
} else {
    echo "❌ Vista 'todos' tiene MENOS eventos que 'propio' (error lógico)\n";
    $todosOk = false;
}

// Check 3: Eventos propios deben ser los mismos en ambas vistas
if ($propiosTodos->count() === $propiosPropio->count()) {
    echo "✅ Eventos propios: Coinciden en ambas vistas ({$propiosTodos->count()} eventos)\n";
} else {
    echo "❌ Eventos propios no coinciden: 'todos'={$propiosTodos->count()}, 'propio'={$propiosPropio->count()}\n";
    $todosOk = false;
}

echo "\n";

if ($todosOk) {
    echo "✅✅✅ TODAS LAS VALIDACIONES PASARON ✅✅✅\n";
} else {
    echo "❌❌❌ HAY ERRORES EN LA LÓGICA ❌❌❌\n";
}

echo "\n========================================\n";

// SQL QUERIES para debugging
echo "\n📝 SQL QUERIES GENERADAS:\n";
echo "─────────────────────────────────────\n\n";

echo "Vista 'todos':\n";
$queryTodos = AgendaEvent::visiblePara($superAdmin, 'todos');
echo $queryTodos->toSql() . "\n";
echo "Bindings: " . json_encode($queryTodos->getBindings()) . "\n\n";

echo "Vista 'propio':\n";
$queryPropio = AgendaEvent::visiblePara($superAdmin, 'propio');
echo $queryPropio->toSql() . "\n";
echo "Bindings: " . json_encode($queryPropio->getBindings()) . "\n";

echo "\n========================================\n";
echo "Test completado.\n";
