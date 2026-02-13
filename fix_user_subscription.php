<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔧 Arreglando configuración de usuario y suscripción...\n\n";

// 1. Asociar usuario con notaría
$user = App\Models\User::first();
$notaria = App\Models\Notaria::first();

if (!$user || !$notaria) {
    echo "❌ No hay usuario o notaría disponible\n";
    exit(1);
}

echo "1️⃣ Asociando usuario {$user->email} con notaría {$notaria->nombre}...\n";
$user->notaria_id = $notaria->id;
$user->save();
echo "   ✅ Usuario asociado correctamente\n\n";

// 2. Verificar/crear suscripción activa
echo "2️⃣ Verificando suscripción...\n";
$subscription = $notaria->activeSubscription;

if (!$subscription) {
    echo "   No hay suscripción activa, creando una...\n";
    
    // Buscar plan completo o el primer plan disponible
    $plan = App\Models\Plan::where('slug', 'plan-completo')->first()
        ?? App\Models\Plan::first();
    
    if (!$plan) {
        echo "   ❌ No existen planes en el sistema\n";
        exit(1);
    }
    
    echo "   Usando plan: {$plan->nombre}\n";
    
    $subscription = App\Models\Subscription::create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'status' => 'activa',
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addYear(),
        'precio_pagado' => $plan->precio ?? 0,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'anual',
        'auto_renovacion' => true,
        'metodo_pago' => 'manual',
    ]);
    
    echo "   ✅ Suscripción creada: ID {$subscription->id}\n\n";
} else {
    echo "   ✅ Suscripción activa existente: ID {$subscription->id}\n\n";
}

// 3. Verificar/agregar servicio BLACKLIST_OFAC
echo "3️⃣ Verificando servicio BLACKLIST_OFAC...\n";
$ofacService = App\Models\Service::where('codigo', 'BLACKLIST_OFAC')->first();

if (!$ofacService) {
    echo "   ❌ No existe el servicio BLACKLIST_OFAC\n";
    exit(1);
}

$hasService = $subscription->services()->where('service_id', $ofacService->id)->exists();

if (!$hasService) {
    echo "   Agregando servicio BLACKLIST_OFAC a la suscripción...\n";
    $subscription->services()->attach($ofacService->id, [
        'limite_mensual' => 1000,
        'limite_anual' => null,
    ]);
    echo "   ✅ Servicio agregado con límite de 1000 búsquedas/mes\n\n";
} else {
    echo "   ✅ Servicio ya está asignado\n\n";
}

// 4. Verificar servicio BLACKLIST_SAT
echo "4️⃣ Verificando servicio BLACKLIST_SAT...\n";
$satService = App\Models\Service::where('codigo', 'BLACKLIST_SAT')->first();

if (!$satService) {
    echo "   ⚠️  No existe el servicio BLACKLIST_SAT (opcional)\n\n";
} else {
    $hasSatService = $subscription->services()->where('service_id', $satService->id)->exists();
    
    if (!$hasSatService) {
        echo "   Agregando servicio BLACKLIST_SAT a la suscripción...\n";
        $subscription->services()->attach($satService->id, [
            'limite_mensual' => 1000,
            'limite_anual' => null,
        ]);
        echo "   ✅ Servicio agregado con límite de 1000 búsquedas/mes\n\n";
    } else {
        echo "   ✅ Servicio ya está asignado\n\n";
    }
}

echo "✅ ¡CONFIGURACIÓN COMPLETADA!\n";
echo "\nResumen:\n";
echo "  Usuario: {$user->email}\n";
echo "  Notaría: {$notaria->nombre}\n";
echo "  Suscripción: {$subscription->plan->nombre}\n";
echo "  Estado: {$subscription->estado}\n";
echo "  Servicios activos:\n";

foreach ($subscription->services as $service) {
    $limit = $service->pivot->limite_mensual ?? 'ILIMITADO';
    echo "    - {$service->nombre} (Límite: {$limit}/mes)\n";
}

echo "\n🎉 Ahora puedes hacer búsquedas en listas negras sin error 403\n";
