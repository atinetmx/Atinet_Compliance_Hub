<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Notaria;

$n = Notaria::with(['subscripciones.plan.services'])->where('nombre', 'like', '%COLIMA%')->first();

$sub = $n->subscripciones->first();
$plan = $sub->plan;

echo "=== Notaria: {$n->nombre} ===\n";
echo "Sub #{$sub->id} | Status: {$sub->status} | Vence: {$sub->fecha_vencimiento}\n\n";

echo "=== Plan: {$plan->nombre} ===\n";
echo "Descripcion: {$plan->descripcion}\n";
echo "Precio: \${$plan->precio_mensual}/mes | \${$plan->precio_anual}/anual\n";
echo 'Limite usuarios: '.($plan->limite_usuarios ?? 'sin limite')."\n";
echo 'Limite busquedas/mes: '.($plan->limite_busquedas_mes ?? 'sin limite')."\n\n";

echo "Herramientas activas:\n";
foreach ($plan->herramientas_activas ?? [] as $h) {
    echo "  - {$h}\n";
}
echo "\nCaracteristicas:\n";
foreach ($plan->caracteristicas ?? [] as $c) {
    echo "  - {$c}\n";
}

echo "\n=== Servicios del plan (".count($plan->services).") ===\n";
if ($plan->services->isEmpty()) {
    echo "  (ninguno en tabla plan_services)\n";
} else {
    foreach ($plan->services as $s) {
        $included = $s->pivot->is_included ? 'INCLUIDO' : 'EXTRA';
        $limit = $s->pivot->usage_limit ? "limite={$s->pivot->usage_limit}" : 'sin limite';
        $price = $s->pivot->extra_price ? "\${$s->pivot->extra_price}" : '-';
        echo "  [{$included}] {$s->nombre}\n";
        echo "         slug={$s->slug} | activo=".($s->is_active ? 'SI' : 'NO')." | {$limit} | extra={$price} | prioridad={$s->pivot->priority}\n";
    }
}

// Tambien mostrar todos los servicios existentes en la BD
echo "\n=== TODOS los servicios en BD ===\n";
App\Models\Service::all()->each(function ($s) use ($plan) {
    $enPlan = $plan->services->contains('id', $s->id) ? '[EN PLAN]' : '        ';
    echo "{$enPlan} #{$s->id} {$s->nombre} | slug={$s->slug} | activo=".($s->is_active ? 'SI' : 'NO')."\n";
});
