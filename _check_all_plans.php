<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Service;

// Ver todos los planes y su relación con plan_services
echo "=== TODOS LOS PLANES ===\n";
Plan::with('services')->get()->each(function ($plan) {
    echo "\nPlan #{$plan->id} | {$plan->nombre} | activo=".($plan->is_active ? 'SI' : 'NO')."\n";
    echo '  herramientas_activas: '.json_encode($plan->herramientas_activas)."\n";
    echo '  plan_services count: '.$plan->services->count()."\n";
    foreach ($plan->services as $s) {
        echo "    -> #{$s->id} {$s->name} | code={$s->code} | included={$s->pivot->is_included}\n";
    }
});

// Ver todos los Services con su code y name
echo "\n=== TODOS LOS SERVICES EN BD ===\n";
Service::all()->each(function ($s) {
    echo "  #{$s->id} | name={$s->name} | code={$s->code} | category={$s->category?->value} | active=".($s->is_active ? 'SI' : 'NO')." | impl={$s->implementation_status}\n";
});

// Ver la notaría 60
echo "\n=== NOTARIA 60 ECATEPEC ===\n";
$n60 = Notaria::with(['subscripciones.plan.services'])->where('nombre', 'like', '%60%')->first();
if ($n60) {
    $sub = $n60->subscripciones->first();
    echo "Sub #{$sub->id} | plan_id={$sub->plan_id} | status={$sub->status}\n";
    echo "Plan: {$sub->plan->nombre}\n";
    echo 'herramientas: '.json_encode($sub->plan->herramientas_activas)."\n";
    echo 'plan_services: '.$sub->plan->services->count()."\n";
    foreach ($sub->plan->services as $s) {
        echo "  -> {$s->name} code={$s->code} included={$s->pivot->is_included}\n";
    }
}
