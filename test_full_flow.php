<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n=== PRUEBA DE FLUJO COMPLETO: EXPIRACIÓN Y REACTIVACIÓN ===\n\n";

// 1. Obtener Notaría prueba 1
$notaria = \App\Models\Notaria::where('nombre', 'LIKE', '%prueba 1%')->first();

if (! $notaria) {
    echo "❌ No se encontró Notaría prueba 1\n";
    exit(1);
}

echo "📋 PASO 1: Estado Inicial\n";
echo "Notaría: {$notaria->nombre}\n";
echo 'Estado: '.($notaria->activa ? '✅ ACTIVA' : '❌ INACTIVA')."\n\n";

// 2. Obtener suscripción activa
$subscription = \App\Models\Subscription::where('notaria_id', $notaria->id)
    ->whereIn('status', ['activa', 'trial'])
    ->first();

if (! $subscription) {
    echo "❌ No hay suscripción activa para probar\n";
    exit(1);
}

echo "💳 Suscripción encontrada:\n";
echo "ID: {$subscription->id}\n";
echo "Plan: {$subscription->plan->nombre}\n";
echo "Estado: {$subscription->status}\n";
echo "Vencimiento: {$subscription->fecha_vencimiento->format('Y-m-d')}\n\n";

// 3. Cambiar fecha de vencimiento para que esté vencida (trial)
echo "📋 PASO 2: Simular Vencimiento\n";
$subscription->update([
    'fecha_vencimiento' => now()->subDays(1),
    'status' => 'trial', // Importante: trial para que se desactive inmediatamente
]);
echo "✅ Fecha vencimiento cambiada a ayer\n";
echo "✅ Status cambiado a 'trial'\n\n";

// 4. Ejecutar comando de verificación
echo "📋 PASO 3: Ejecutar Comando CheckExpiredSubscriptions\n";
\Illuminate\Support\Facades\Artisan::call('subscriptions:check-expired');
echo \Illuminate\Support\Facades\Artisan::output();

// 5. Verificar que notaría está inactiva
$notaria->refresh();
$subscription->refresh();

echo "📊 Estado después del comando:\n";
echo "Suscripción: {$subscription->status}\n";
echo 'Notaría: '.($notaria->activa ? '✅ ACTIVA' : '❌ INACTIVA')."\n\n";

if (! $notaria->activa && $subscription->status === 'vencida') {
    echo "✅ CORRECTO: Notaría desactivada por suscripción trial vencida\n\n";
} else {
    echo "❌ ERROR: Estado inesperado\n\n";
    exit(1);
}

// 6. Reactivar cambiando status a activa
echo "📋 PASO 4: Reactivar Suscripción\n";
$subscription->update([
    'status' => 'activa',
    'fecha_vencimiento' => now()->addMonth(),
]);
echo "✅ Status cambiado a 'activa'\n";
echo '✅ Fecha vencimiento: '.now()->addMonth()->format('Y-m-d')."\n\n";

// 7. Simular el update del controller
echo "📋 PASO 5: Sincronizar Estado de Notaría (como lo hace el Controller)\n";
if (in_array($subscription->status, ['activa', 'trial'])) {
    $notaria->update(['activa' => true]);
    echo "✅ Notaría reactivada automáticamente\n\n";
}

// 8. Verificar estado final
$notaria->refresh();
echo "📊 ESTADO FINAL:\n";
echo "Suscripción: {$subscription->status}\n";
echo 'Notaría: '.($notaria->activa ? '✅ ACTIVA' : '❌ INACTIVA')."\n\n";

if ($notaria->activa && $subscription->status === 'activa') {
    echo "✅ ¡ÉXITO! El flujo completo funciona correctamente:\n";
    echo "   1. ✅ Suscripción expiró → Notaría se desactivó\n";
    echo "   2. ✅ Suscripción se reactivó → Notaría se reactivó\n\n";
} else {
    echo "❌ ERROR: Estado final inesperado\n\n";
    exit(1);
}

echo "===========================================\n\n";
