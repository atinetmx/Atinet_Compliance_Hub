<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n=== SINCRONIZACIÓN DE ESTADO DE NOTARÍAS ===\n\n";

// Obtener todas las notarías
$notarias = \App\Models\Notaria::all();

$updated = 0;
$alreadyCorrect = 0;

foreach ($notarias as $notaria) {
    // Verificar si tiene suscripciones activas o trial
    $hasActiveSubscription = \App\Models\Subscription::where('notaria_id', $notaria->id)
        ->whereIn('status', ['activa', 'trial'])
        ->exists();

    $shouldBeActive = $hasActiveSubscription;
    $currentlyActive = (bool) $notaria->activa;

    if ($shouldBeActive !== $currentlyActive) {
        echo "🔧 Actualizando: {$notaria->nombre}\n";
        echo '   Estado anterior: '.($currentlyActive ? 'ACTIVA' : 'INACTIVA')."\n";
        echo '   Estado nuevo: '.($shouldBeActive ? 'ACTIVA' : 'INACTIVA')."\n";

        $notaria->update(['activa' => $shouldBeActive]);
        $updated++;
        echo "   ✅ Actualizada\n\n";
    } else {
        $alreadyCorrect++;
    }
}

echo "\n=== RESUMEN ===\n";
echo "✅ Notarías actualizadas: {$updated}\n";
echo "✓  Notarías ya correctas: {$alreadyCorrect}\n";
echo '📊 Total procesadas: '.($updated + $alreadyCorrect)."\n\n";

// Verificar específicamente Notaría prueba 1
$notaria = \App\Models\Notaria::where('nombre', 'LIKE', '%prueba 1%')->first();
if ($notaria) {
    echo "=== NOTARÍA PRUEBA 1 ===\n";
    echo 'Estado final: '.($notaria->activa ? '✅ ACTIVA' : '❌ INACTIVA')."\n";

    $activeSubs = \App\Models\Subscription::where('notaria_id', $notaria->id)
        ->whereIn('status', ['activa', 'trial'])
        ->count();
    echo "Suscripciones activas: {$activeSubs}\n\n";
}

echo "===========================================\n\n";
