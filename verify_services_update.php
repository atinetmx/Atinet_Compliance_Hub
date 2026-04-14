<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "📊 VERIFICACIÓN DE ACTUALIZACIÓN DE SERVICIOS\n";
echo str_repeat('=', 60)."\n\n";

// 1. Verificar servicios implementados
echo "✅ SERVICIOS IMPLEMENTADOS (is_active=true):\n";
echo str_repeat('-', 60)."\n";
$implemented = App\Models\Service::implemented()->where('is_active', true)->get();
foreach ($implemented as $service) {
    echo sprintf(
        "   • %-25s | %-20s | %s\n",
        $service->code,
        $service->category->value,
        $service->billing_model->value
    );
}
echo "\n";

// 2. Verificar servicios planificados
echo "📋 SERVICIOS PLANIFICADOS (is_active=false):\n";
echo str_repeat('-', 60)."\n";
$planned = App\Models\Service::planned()->get();
foreach ($planned as $service) {
    echo sprintf(
        "   • %-25s | %-20s | Lanzamiento: %s\n",
        $service->code,
        $service->category->value,
        $service->metadata['planned_release'] ?? 'TBD'
    );
}
echo "\n";

// 3. Verificar planes y sus servicios
echo "📦 PLANES Y SUS SERVICIOS:\n";
echo str_repeat('-', 60)."\n";
$plans = App\Models\Plan::with('services')->get();
foreach ($plans as $plan) {
    echo "\n🔷 {$plan->name} ({$plan->slug}):\n";
    echo "   Servicios asignados: {$plan->services->count()}\n";

    if ($plan->services->count() > 0) {
        echo "   Lista de servicios:\n";
        foreach ($plan->services as $service) {
            $limit = $service->pivot->usage_limit
                ? "Límite: {$service->pivot->usage_limit}"
                : 'Ilimitado';
            $included = $service->pivot->is_included ? '✅ Incluido' : '❌ Extra';

            echo sprintf(
                "      • %-25s | %s | %s\n",
                $service->code,
                $included,
                $limit
            );
        }
    }
}

echo "\n".str_repeat('=', 60)."\n";
echo "🎯 RESUMEN:\n";
echo '   • Servicios IMPLEMENTADOS: '.App\Models\Service::implemented()->count()."\n";
echo '   • Servicios PLANIFICADOS:  '.App\Models\Service::planned()->count()."\n";
echo '   • Total servicios:         '.App\Models\Service::count()."\n";
echo '   • Total planes:            '.App\Models\Plan::count()."\n";
echo "\n✅ Verificación completada\n";
