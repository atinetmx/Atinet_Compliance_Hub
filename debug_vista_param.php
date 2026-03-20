<?php

require __DIR__ . '/vendor/autoload.php';

use App\Models\AgendaEvent;
use App\Models\User;
use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== DEBUG: Vista Parameter Test ===\n\n";

// Obtener super_admin
$superAdmin = User::where('tipo_cuenta', 'super_admin')
    ->whereNull('notaria_id')
    ->first();

if (!$superAdmin) {
    echo "❌ No se encontró super_admin\n";
    exit(1);
}

echo "Usuario: {$superAdmin->nombre} (ID: {$superAdmin->id})\n";
echo "Email: {$superAdmin->email}\n";
echo "Tipo: {$superAdmin->tipo_cuenta}\n\n";

// Verificar eventos del usuario
$eventosPropios = AgendaEvent::where('user_id', $superAdmin->id)->get();
echo "Eventos propios (user_id={$superAdmin->id}): {$eventosPropios->count()}\n";
foreach ($eventosPropios as $evento) {
    echo "  - ID: {$evento->id}, Título: {$evento->titulo}, legacy_notaria: " . ($evento->legacy_notaria ?? 'NULL') . "\n";
}
echo "\n";

// Eventos legacy atinet
$eventosLegacy = AgendaEvent::whereNull('user_id')
    ->where('legacy_notaria', 'atinet')
    ->count();
echo "Eventos legacy 'atinet' (user_id=NULL): {$eventosLegacy}\n\n";

// Eventos de otros super_admins
$eventosOtros = AgendaEvent::whereNotNull('user_id')
    ->where('user_id', '!=', $superAdmin->id)
    ->whereNull('notaria_id')
    ->get();
echo "Eventos de otros super_admins: {$eventosOtros->count()}\n";
foreach ($eventosOtros as $evento) {
    echo "  - ID: {$evento->id}, Título: {$evento->titulo}, user_id: {$evento->user_id}\n";
}
echo "\n";

// Test vista 'propio'
echo "=== TEST VISTA 'propio' ===\n";
$queryPropio = AgendaEvent::visiblePara($superAdmin, 'propio');
$resultPropio = $queryPropio->get();

echo "Eventos visibles: {$resultPropio->count()}\n";
echo "SQL: " . $queryPropio->toSql() . "\n";
echo "Bindings: " . json_encode($queryPropio->getBindings()) . "\n\n";

$propios = $resultPropio->where('user_id', $superAdmin->id)->count();
$legacy = $resultPropio->whereNull('user_id')->count();
$otros = $resultPropio->where('user_id', '!=', $superAdmin->id)->whereNotNull('user_id')->count();

echo "Desglose:\n";
echo "  - Propios: {$propios}\n";
echo "  - Legacy (NULL): {$legacy}\n";
echo "  - Otros usuarios: {$otros}\n\n";

if ($otros > 0) {
    echo "❌ ERROR: Vista 'propio' está mostrando eventos de otros usuarios!\n";
    echo "Eventos de otros:\n";
    foreach ($resultPropio->where('user_id', '!=', $superAdmin->id)->whereNotNull('user_id') as $evento) {
        echo "  - ID: {$evento->id}, user_id: {$evento->user_id}, Título: {$evento->titulo}\n";
    }
} else {
    echo "✅ Vista 'propio' OK: Solo muestra propios + legacy\n";
}

echo "\n=== TEST VISTA 'todos' ===\n";
$queryTodos = AgendaEvent::visiblePara($superAdmin, 'todos');
$resultTodos = $queryTodos->get();

echo "Eventos visibles: {$resultTodos->count()}\n\n";

$propiosTodos = $resultTodos->where('user_id', $superAdmin->id)->count();
$legacyTodos = $resultTodos->whereNull('user_id')->count();
$otrosTodos = $resultTodos->where('user_id', '!=', $superAdmin->id)->whereNotNull('user_id')->count();

echo "Desglose:\n";
echo "  - Propios: {$propiosTodos}\n";
echo "  - Legacy (NULL): {$legacyTodos}\n";
echo "  - Otros usuarios: {$otrosTodos}\n\n";

if ($otrosTodos === $eventosOtros->count()) {
    echo "✅ Vista 'todos' OK: Muestra propios + legacy + otros\n";
} else {
    echo "⚠️ Vista 'todos': Conteo de otros no coincide\n";
}

echo "\n=== TOTAL EVENTOS EN DB ===\n";
echo "Total agenda_events: " . AgendaEvent::count() . "\n";
