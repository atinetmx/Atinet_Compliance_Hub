<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n=== PLANES ===\n";
foreach (\App\Models\Plan::orderBy('id')->get() as $p) {
    echo "  [{$p->id}] {$p->name} | {$p->slug} | \${$p->price} | ".($p->is_active ? 'activo' : 'inactivo')."\n";
}

echo "\n=== SERVICIOS ===\n";
foreach (\App\Models\Service::orderBy('id')->get() as $s) {
    echo "  [{$s->id}] {$s->code} | {$s->name} | ".($s->is_active ? 'activo' : 'inactivo')." | {$s->implementation_status}\n";
}

echo "\n=== SUSCRIPCIONES ===\n";
foreach (\App\Models\Subscription::with('notaria', 'plan')->get() as $s) {
    $notaria = $s->notaria?->nombre_notaria ?? '(sin notaria)';
    $plan = $s->plan?->name ?? '(sin plan)';
    echo "  [{$s->id}] {$notaria} -> {$plan} | {$s->status} | vence: {$s->ends_at}\n";
}

echo "\n=== PLAN_SERVICES (pivot) ===\n";
foreach (\DB::table('plan_services')->join('plans', 'plans.id', 'plan_services.plan_id')->join('services', 'services.id', 'plan_services.service_id')->select('plans.name as plan', 'services.code', 'plan_services.usage_limit', 'plan_services.is_included')->orderBy('plans.id')->get() as $r) {
    $limit = $r->usage_limit ?? 'ilimitado';
    echo "  {$r->plan} | {$r->code} | límite: {$limit}\n";
}
