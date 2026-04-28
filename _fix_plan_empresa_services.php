<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Plan;

// Plan Empresa #3 - mismos servicios que Basico y Profesional
// codes: CONTROL_NOTARIAL, AGENDA_WEB, REGISTRO_WEB, BLACKLIST_SAT, BLACKLIST_OFAC, ESCANER_INTELIGENTE
$planEmpresa = Plan::with('services')->find(3);

echo "Plan: {$planEmpresa->nombre} | services actuales: ".$planEmpresa->services->count()."\n\n";

// Tomar los pivots del Plan Basico como referencia
$planBasico = Plan::with('services')->find(1);

$sync = [];
foreach ($planBasico->services as $s) {
    $sync[$s->id] = [
        'is_included' => $s->pivot->is_included,
        'usage_limit' => $s->pivot->usage_limit,
        'extra_price' => $s->pivot->extra_price,
        'priority' => $s->pivot->priority,
        'created_at' => now(),
        'updated_at' => now(),
    ];
    echo "  Enlazando: #{$s->id} {$s->name} (code={$s->code})\n";
}

$planEmpresa->services()->sync($sync);

echo "\nplan_services del Plan Empresa ahora: ".Plan::with('services')->find(3)->services->count()."\n";
echo "OK\n";
