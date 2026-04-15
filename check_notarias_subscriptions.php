<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Notaria;

echo "═══════════════════════════════════════════════════════════\n";
echo "  DEBUG: Notarías y Suscripciones\n";
echo "═══════════════════════════════════════════════════════════\n\n";

$totalNotarias = Notaria::count();
echo "✓ Total de notarías registradas: {$totalNotarias}\n\n";

if ($totalNotarias === 0) {
    echo "❌ No hay notarías registradas en el sistema.\n";
    exit;
}

// Notarías sin suscripción activa o trial
$notariasSinSuscripcion = Notaria::whereDoesntHave('subscripciones', function ($query) {
    $query->whereIn('status', ['activa', 'trial']);
})->get();

echo '📊 Notarías SIN suscripción activa/trial: '.$notariasSinSuscripcion->count()."\n";
foreach ($notariasSinSuscripcion as $notaria) {
    echo "   - {$notaria->nombre} (ID: {$notaria->id})\n";
}

echo "\n";

// Notarías CON suscripción activa o trial
$notariasConSuscripcion = Notaria::whereHas('subscripciones', function ($query) {
    $query->whereIn('status', ['activa', 'trial']);
})->with('subscripciones')->get();

echo '📊 Notarías CON suscripción activa/trial: '.$notariasConSuscripcion->count()."\n";
foreach ($notariasConSuscripcion as $notaria) {
    $subs = $notaria->subscripciones->whereIn('status', ['activa', 'trial']);
    foreach ($subs as $sub) {
        echo "   - {$notaria->nombre} → Status: {$sub->status}\n";
    }
}

echo "\n";

// Todas las notarías (para el selector)
echo "📋 TODAS las notarías (como deberían aparecer en el selector):\n";
$todasNotarias = Notaria::orderBy('nombre')->get(['id', 'nombre', 'numero_notaria']);
foreach ($todasNotarias as $notaria) {
    echo "   - {$notaria->nombre} (Notaría #{$notaria->numero_notaria})\n";
}

echo "\n═══════════════════════════════════════════════════════════\n";
