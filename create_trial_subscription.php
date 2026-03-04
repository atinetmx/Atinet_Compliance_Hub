<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;

echo "=== Crear Suscripción Trial ===\n\n";

// Obtener la notaría
$notaria = Notaria::find(1);
if (! $notaria) {
    echo "❌ No se encontró la notaría con ID 1\n";
    exit(1);
}

// Obtener el plan básico
$planBasico = Plan::where('nombre', 'Plan Básico')->first();
if (! $planBasico) {
    echo "❌ No se encontró el Plan Básico\n";
    exit(1);
}

// Verificar si ya tiene suscripción
$suscripcionExistente = $notaria->subscripciones()->latest()->first();
if ($suscripcionExistente) {
    echo "⚠️  La notaría ya tiene una suscripción:\n";
    echo "   Status: {$suscripcionExistente->status}\n";
    echo "   Plan: {$suscripcionExistente->plan->nombre}\n";
    echo "   Vencimiento: {$suscripcionExistente->fecha_vencimiento}\n";
    echo "   ¿Crear nueva suscripción de todos modos? (actualizando la existente)\n\n";

    // Actualizar la existente
    $suscripcionExistente->update([
        'status' => Subscription::STATUS_TRIAL,
        'plan_id' => $planBasico->id,
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addDays(30), // 30 días de trial
        'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
        'precio_pagado' => 0,
        'moneda' => 'MXN',
        'auto_renovacion' => false,
        'notas' => 'Suscripción trial de 30 días - Plan Básico',
    ]);

    echo "✅ Suscripción actualizada a TRIAL\n";
    $subscription = $suscripcionExistente;
} else {
    // Crear nueva suscripción trial
    $subscription = Subscription::create([
        'notaria_id' => $notaria->id,
        'plan_id' => $planBasico->id,
        'status' => Subscription::STATUS_TRIAL,
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addDays(30), // 30 días de trial
        'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
        'precio_pagado' => 0,
        'moneda' => 'MXN',
        'auto_renovacion' => false,
        'notas' => 'Suscripción trial de 30 días - Plan Básico',
    ]);

    echo "✅ Suscripción TRIAL creada\n";
}

echo "\n=== Detalles de la Suscripción ===\n\n";
echo "Notaría: {$notaria->nombre}\n";
echo "Plan: {$planBasico->nombre}\n";
echo "Status: {$subscription->status}\n";
echo "Inicio: {$subscription->fecha_inicio->format('d/m/Y')}\n";
echo "Vencimiento: {$subscription->fecha_vencimiento->format('d/m/Y')}\n";
echo 'Días restantes: '.now()->diffInDays($subscription->fecha_vencimiento)."\n\n";

echo "=== Servicios incluidos en el Plan Básico ===\n\n";
$servicios = $planBasico->services;
foreach ($servicios as $servicio) {
    echo "  ✅ {$servicio->name} (código: {$servicio->code})\n";
}

echo "\n=== Próximo paso ===\n";
echo "1. Recarga la página del dashboard (F5)\n";
echo "2. Deberías ver el enlace 'Listas Negras' en el menú lateral\n";
echo "3. Click en 'Listas Negras' para acceder al servicio\n";
