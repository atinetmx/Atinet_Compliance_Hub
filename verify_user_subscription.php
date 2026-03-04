<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Obtener el primer usuario (probablemente el SuperAdmin)
$user = App\Models\User::first();

if (! $user) {
    echo "❌ No hay usuarios en el sistema\n";
    exit(1);
}

echo "✅ Usuario encontrado: {$user->email}\n";
echo "   ID: {$user->id}\n";
echo '   Notaría ID: '.($user->notaria_id ?? 'NINGUNA')."\n\n";

if (! $user->notaria) {
    echo "❌ El usuario NO tiene notaría asociada\n";
    echo "   Esto es el problema del error 403\n\n";

    // Buscar si existe alguna notaría
    $notaria = App\Models\Notaria::first();
    if ($notaria) {
        echo "📋 Hay una notaría disponible:\n";
        echo "   ID: {$notaria->id}\n";
        echo "   Nombre: {$notaria->nombre}\n\n";
        echo "💡 Solución: Ejecutar este comando para asociar:\n";
        echo "   php artisan tinker\n";
        echo "   >>> \$user = App\\Models\\User::first();\n";
        echo "   >>> \$user->notaria_id = {$notaria->id};\n";
        echo "   >>> \$user->save();\n\n";
    } else {
        echo "❌ No hay notarías en el sistema\n";
        echo "💡 Necesitas crear una notaría primero\n\n";
    }
    exit(1);
}

$notaria = $user->notaria;
echo "✅ Notaría asociada: {$notaria->nombre}\n";
echo "   ID: {$notaria->id}\n\n";

// Verificar suscripción
$subscription = $notaria->activeSubscription;
if (! $subscription) {
    echo "❌ La notaría NO tiene suscripción activa\n";
    echo "   Esto es el problema del error 403\n\n";

    // Verificar si hay planes disponibles
    $plan = App\Models\Plan::where('codigo', 'PLAN_COMPLETO')->first();
    if ($plan) {
        echo "📋 Hay un plan disponible:\n";
        echo "   ID: {$plan->id}\n";
        echo "   Nombre: {$plan->nombre}\n\n";
        echo "💡 Solución: Crear suscripción con este comando:\n";
        echo "   php verify_create_subscription.php\n\n";
    }
    exit(1);
}

echo "✅ Suscripción activa encontrada\n";
echo "   ID: {$subscription->id}\n";
echo "   Plan: {$subscription->plan->nombre}\n";
echo "   Estado: {$subscription->estado}\n";
echo "   Fecha inicio: {$subscription->fecha_inicio}\n";
echo "   Fecha fin: {$subscription->fecha_fin}\n\n";

// Verificar si tiene el servicio BLACKLIST_OFAC
$ofacService = App\Models\Service::where('codigo', 'BLACKLIST_OFAC')->first();
if (! $ofacService) {
    echo "❌ No existe el servicio BLACKLIST_OFAC en el sistema\n";
    exit(1);
}

echo "✅ Servicio BLACKLIST_OFAC existe\n";
echo "   ID: {$ofacService->id}\n";
echo "   Nombre: {$ofacService->nombre}\n\n";

// Verificar si la suscripción tiene ese servicio
$hasService = $subscription->services()->where('service_id', $ofacService->id)->exists();
if (! $hasService) {
    echo "❌ La suscripción NO tiene el servicio BLACKLIST_OFAC asignado\n";
    echo "   Esto es el problema del error 403\n\n";
    echo "💡 Solución: Agregar servicio con este comando:\n";
    echo "   php artisan tinker\n";
    echo "   >>> \$subscription = App\\Models\\Subscription::find({$subscription->id});\n";
    echo "   >>> \$service = App\\Models\\Service::where('codigo', 'BLACKLIST_OFAC')->first();\n";
    echo "   >>> \$subscription->services()->attach(\$service->id, ['limite_mensual' => 1000, 'limite_anual' => null]);\n\n";
    exit(1);
}

echo "✅ La suscripción TIENE el servicio BLACKLIST_OFAC\n\n";

// Verificar límites
$serviceSubscription = $subscription->services()->where('service_id', $ofacService->id)->first();
echo "📊 Límites del servicio:\n";
echo '   Límite mensual: '.($serviceSubscription->pivot->limite_mensual ?? 'ILIMITADO')."\n";
echo '   Límite anual: '.($serviceSubscription->pivot->limite_anual ?? 'ILIMITADO')."\n\n";

echo "✅ ¡TODO CONFIGURADO CORRECTAMENTE!\n";
echo "   El usuario debería poder hacer búsquedas sin problemas\n\n";
