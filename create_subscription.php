<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Creando Suscripción para Notaría ===\n\n";

$notaria = App\Models\Notaria::find(1);
if (!$notaria) {
    echo "❌ Notaría no encontrada\n";
    exit;
}

$planBasico = App\Models\Plan::where('nombre', 'Plan Básico')->first();
if (!$planBasico) {
    echo "❌ Plan Básico no encontrado\n";
    exit;
}

// Verificar si ya existe una suscripción
$existente = App\Models\Subscription::where('notaria_id', $notaria->id)->first();
if ($existente) {
    echo "⚠️  Ya existe una suscripción\n";
    echo "   Status actual: {$existente->status}\n";
    echo "   Vencimiento: {$existente->fecha_vencimiento}\n\n";
    echo "¿Actualizar? Eliminando la anterior...\n";
    $existente->delete();
}

// Crear nueva suscripción
$subscription = App\Models\Subscription::create([
    'notaria_id' => $notaria->id,
    'plan_id' => $planBasico->id,
    'status' => App\Models\Subscription::STATUS_ACTIVA,
    'tipo' => 'trial', // trial, mensual, anual
    'fecha_inicio' => now(),
    'fecha_vencimiento' => now()->addMonth(),
    'auto_renovacion' => false,
]);

echo "✅ Suscripción creada exitosamente\n\n";
echo "📋 Detalles:\n";
echo "   ID: {$subscription->id}\n";
echo "   Notaría: {$notaria->nombre}\n";
echo "   Plan: {$planBasico->nombre}\n";
echo "   Tipo: {$subscription->tipo}\n";
echo "   Status: {$subscription->status}\n";
echo "   Inicio: {$subscription->fecha_inicio}\n";
echo "   Vencimiento: {$subscription->fecha_vencimiento}\n\n";

echo "✅ Servicios incluidos:\n";
foreach ($planBasico->services as $service) {
    echo "   - {$service->name}\n";
}

echo "\n🎯 Ahora {$notaria->nombre} tiene acceso a todos los servicios del Plan Básico\n";
echo "   Recarga el navegador para ver el menú actualizado\n";
