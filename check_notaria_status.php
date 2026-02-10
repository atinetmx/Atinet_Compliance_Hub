<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n=== VERIFICACIÓN DE ESTADO DE NOTARÍA ===\n\n";

// Buscar Notaría prueba 1
$notaria = \App\Models\Notaria::where('nombre', 'LIKE', '%prueba 1%')->first();

if (! $notaria) {
    echo "❌ No se encontró Notaría prueba 1\n";
    exit(1);
}

echo "📋 NOTARÍA: {$notaria->nombre}\n";
echo "🔢 ID: {$notaria->id}\n";
echo '📊 Estado Actual: '.($notaria->activa ? '✅ ACTIVA' : '❌ INACTIVA')."\n\n";

// Obtener suscripciones de esta notaría
$subscriptions = \App\Models\Subscription::where('notaria_id', $notaria->id)
    ->with('plan')
    ->orderBy('created_at', 'desc')
    ->get();

echo "💳 SUSCRIPCIONES ENCONTRADAS: {$subscriptions->count()}\n\n";

foreach ($subscriptions as $index => $sub) {
    echo '--- Suscripción #'.($index + 1)." ---\n";
    echo "Plan: {$sub->plan->nombre}\n";
    echo "Estado: {$sub->status}\n";
    echo "Fecha Inicio: {$sub->fecha_inicio->format('Y-m-d')}\n";
    echo "Fecha Vencimiento: {$sub->fecha_vencimiento->format('Y-m-d')}\n";
    echo "Precio Pagado: \${$sub->precio_pagado}\n";

    if ($sub->status === 'vencida') {
        $diasVencida = now()->diffInDays($sub->fecha_vencimiento);
        echo "⚠️  Vencida hace {$diasVencida} días\n";
    }
    echo "\n";
}

// Verificar si hay suscripciones activas o trial
$activeSubscriptions = $subscriptions->whereIn('status', ['activa', 'trial']);

if ($activeSubscriptions->count() > 0) {
    echo "✅ Hay {$activeSubscriptions->count()} suscripción(es) activa(s)\n";
    echo '⚠️  Pero la notaría está marcada como: '.($notaria->activa ? 'ACTIVA' : 'INACTIVA')."\n\n";

    if (! $notaria->activa) {
        echo "🔧 POSIBLE SOLUCIÓN:\n";
        echo "La notaría debería estar activa. Esto puede deberse a:\n";
        echo "1. La suscripción se creó antes de implementar la sincronización automática\n";
        echo "2. Necesitas crear una NUEVA suscripción o cambiar el estado de una existente\n";
        echo "3. Puedes usar el endpoint de cambio de estado en el admin\n\n";
    }
} else {
    echo "❌ NO hay suscripciones activas o trial\n";
    echo "✅ La notaría está correctamente marcada como INACTIVA\n\n";
    echo "🔧 PARA REACTIVAR:\n";
    echo "1. Ve al panel de Admin → Suscripciones\n";
    echo "2. Crea una nueva suscripción ACTIVA o TRIAL para esta notaría\n";
    echo "3. O cambia el estado de una suscripción existente a 'activa'\n\n";
}

echo "===========================================\n\n";
