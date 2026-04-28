<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use App\Models\User;

// Verificar notaría 10
$n = Notaria::where('numero_notaria', '10')->first();
echo 'Notaria: '.($n ? $n->nombre : 'NO ENCONTRADA')."\n";

if (! $n) {
    exit(1);
}

$sub = $n->subscripcionActiva()->with('plan.services')->first();
echo 'Suscripcion activa: '.($sub ? "id={$sub->id} plan={$sub->plan->nombre}" : 'NINGUNA')."\n";

if ($sub && $sub->plan) {
    echo "Servicios del plan:\n";
    foreach ($sub->plan->services as $s) {
        $inc = $s->pivot->is_included ?? 'null';
        echo "  [{$s->id}] {$s->code}  is_included={$inc}\n";
    }
}

// Verificar usuario admin_notaria de notaría 10
$user = User::where('notaria_id', $n->id)->where('tipo_cuenta', 'admin_notaria')->first();
echo "\nAdmin notaria: ".($user ? $user->email." tipo={$user->tipo_cuenta}" : 'NO ENCONTRADO')."\n";

// Simular lo que hace HandleInertiaRequests
if ($user) {
    $notaria2 = $user->notaria()->with(['subscripcionActiva.plan.services'])->first();
    $servicios = [];
    if ($notaria2?->subscripcionActiva?->plan?->services) {
        $servicios = $notaria2->subscripcionActiva->plan->services->map(function ($service) {
            return [
                'code' => $service->code,
                'is_included' => $service->pivot->is_included ?? true,
            ];
        })->filter(fn ($s) => $s['is_included'])->values()->toArray();
    }
    echo "\nServicios que llegarían al frontend (is_included=true):\n";
    foreach ($servicios as $s) {
        echo '  '.$s['code']."\n";
    }
    $tieneEscaner = collect($servicios)->contains('code', 'ESCANER_INTELIGENTE');
    echo "\nhasEscanerInteligente = ".($tieneEscaner ? 'TRUE ✅' : 'FALSE ❌')."\n";
}
