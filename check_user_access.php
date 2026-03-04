<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Análisis de Acceso de Usuario ===\n\n";

$user = App\Models\User::where('email', 'leinad@notaria1.com')->first();

if (! $user) {
    echo "❌ Usuario no encontrado\n";
    exit;
}

echo "👤 Usuario: {$user->name} ({$user->email})\n";
echo "   Tipo: {$user->tipo_cuenta}\n\n";

$notaria = $user->notaria;
if (! $notaria) {
    echo "❌ No tiene notaría asignada\n";
    exit;
}

echo "🏢 Notaría: {$notaria->nombre}\n";
echo "   ID: {$notaria->id}\n\n";

// Verificar todas las suscripciones
$todasSubs = $notaria->subscripciones;
echo "📋 Suscripciones totales: {$todasSubs->count()}\n";
foreach ($todasSubs as $sub) {
    echo "   - Status: {$sub->status} | Vence: {$sub->fecha_vencimiento}\n";
}
echo "\n";

$subscription = $notaria->subscripcionActiva;
if (! $subscription) {
    echo "❌ No tiene suscripción activa/trial\n";
    echo "Necesitas crear una suscripción desde el panel de Super Admin\n";
    exit;
}

echo "📋 Suscripción:\n";
echo "   Status: {$subscription->status}\n";
echo "   Fecha inicio: {$subscription->fecha_inicio}\n";
echo "   Fecha vencimiento: {$subscription->fecha_vencimiento}\n\n";

$plan = $subscription->plan;
if (! $plan) {
    echo "❌ No tiene plan asignado\n";
    exit;
}

echo "💼 Plan: {$plan->nombre}\n";
echo "   Límite usuarios: {$plan->limite_usuarios}\n";
echo "   Límite búsquedas: {$plan->limite_busquedas_mes}\n\n";

echo "✅ Servicios incluidos en el plan:\n";
$servicios = $plan->services;
foreach ($servicios as $servicio) {
    echo "   - [{$servicio->code}] {$servicio->name}\n";
}

echo "\n=== ¿Tiene acceso a Listas Negras? ===\n";
$tieneOfac = $servicios->where('code', 'BLACKLIST_OFAC')->count() > 0;
$tieneSat = $servicios->where('code', 'BLACKLIST_SAT')->count() > 0;

echo 'BLACKLIST_OFAC: '.($tieneOfac ? '✅ SÍ' : '❌ NO')."\n";
echo 'BLACKLIST_SAT: '.($tieneSat ? '✅ SÍ' : '❌ NO')."\n";

if ($tieneOfac || $tieneSat) {
    echo "\n✅ El usuario DEBERÍA ver 'Listas Negras' en el menú\n";
} else {
    echo "\n❌ El usuario NO tiene acceso a Listas Negras\n";
}
