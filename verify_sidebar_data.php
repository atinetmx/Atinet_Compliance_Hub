<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Buscar el usuario admin_notaria
$user = \App\Models\User::where('email', 'leinad@notaria1.com')->first();

if (! $user) {
    echo "❌ Usuario no encontrado\n";
    exit(1);
}

echo "✅ Usuario: {$user->name} ({$user->email})\n";
echo "   Tipo: {$user->tipo_cuenta}\n";
echo "   Notaría ID: {$user->notaria_id}\n\n";

// Cargar notaria con suscripción y servicios
$notaria = $user->notaria()
    ->with(['subscripcionActiva.plan.services'])
    ->first();

if (! $notaria) {
    echo "❌ Notaría no encontrada\n";
    exit(1);
}

echo "✅ Notaría: {$notaria->nombre}\n\n";

$subscripcion = $notaria->subscripcionActiva;

if (! $subscripcion) {
    echo "❌ Sin suscripción activa\n";
    exit(1);
}

echo "✅ Suscripción:\n";
echo "   Status: {$subscripcion->status}\n";
echo "   Vence: {$subscripcion->fecha_vencimiento}\n";
echo "   Plan: {$subscripcion->plan->nombre}\n\n";

$servicios = $subscripcion->plan->services;

echo "✅ Servicios disponibles ({$servicios->count()}):\n";

$serviciosArray = $servicios->map(function ($service) {
    return [
        'code' => $service->code,
        'name' => $service->name,
        'is_included' => $service->pivot->is_included ?? true,
    ];
})->filter(function ($service) {
    return $service['is_included'];
})->values()->all();

foreach ($serviciosArray as $servicio) {
    $icon = in_array($servicio['code'], ['BLACKLIST_OFAC', 'BLACKLIST_SAT']) ? '🛡️' : '  ';
    echo "   {$icon} {$servicio['code']} - {$servicio['name']}\n";
}

$hasBlacklistServices = collect($serviciosArray)->contains(function ($s) {
    return in_array($s['code'], ['BLACKLIST_OFAC', 'BLACKLIST_SAT']);
});

echo "\n";
echo $hasBlacklistServices
    ? "✅ Debería ver 'Listas Negras' en el menú\n"
    : "❌ NO debería ver 'Listas Negras' en el menú\n";

echo "\n📦 Datos que se compartirán con Inertia:\n";
echo json_encode(['servicios' => $serviciosArray], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
echo "\n";
