<?php

/**
 * Script para copiar el plan y luego los plan_services al tenant
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use Illuminate\Support\Facades\DB;

$notaria = Notaria::with('plan')->orderBy('created_at', 'desc')->first();

if (! $notaria) {
    echo "❌ No hay notarías registradas\n";
    exit(1);
}

$databaseName = 'atinet_notaria_'.$notaria->numero_notaria;

echo "════════════════════════════════════════════════════\n";
echo "📦 COPIAR PLAN Y SERVICIOS AL TENANT\n";
echo "════════════════════════════════════════════════════\n\n";

echo "Notaría: {$notaria->nombre}\n";
echo "Plan: {$notaria->plan->nombre} (ID: {$notaria->plan_id})\n";
echo "Base de datos: {$databaseName}\n\n";

// Paso 1: Copiar el plan
echo "📋 Paso 1: Copiando plan al tenant...\n";

$plan = DB::table('plans')->find($notaria->plan_id);

if (! $plan) {
    echo "❌ Plan no encontrado\n";
    exit(1);
}

$sql = "INSERT INTO `{$databaseName}`.`plans`
        (`id`, `nombre`, `slug`, `descripcion`, `precio_mensual`, `precio_anual`, 
         `limite_usuarios`, `limite_busquedas_mes`, `herramientas_activas`, 
         `caracteristicas`, `is_active`, `orden`, `created_at`, `updated_at`)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            `nombre` = VALUES(`nombre`),
            `descripcion` = VALUES(`descripcion`),
            `precio_mensual` = VALUES(`precio_mensual`),
            `precio_anual` = VALUES(`precio_anual`),
            `updated_at` = VALUES(`updated_at`)";

try {
    DB::statement($sql, [
        $plan->id,
        $plan->nombre,
        $plan->slug,
        $plan->descripcion,
        $plan->precio_mensual,
        $plan->precio_anual,
        $plan->limite_usuarios,
        $plan->limite_busquedas_mes,
        $plan->herramientas_activas,
        $plan->caracteristicas,
        $plan->is_active,
        $plan->orden,
        $plan->created_at,
        $plan->updated_at,
    ]);
    echo "   ✅ Plan '{$plan->nombre}' copiado\n\n";
} catch (\Exception $e) {
    echo "   ❌ Error copiando plan: {$e->getMessage()}\n";
    exit(1);
}

// Paso 2: Copiar plan_services
echo "📋 Paso 2: Copiando servicios del plan...\n";

$centralPlanServices = DB::table('plan_services')
    ->where('plan_id', $notaria->plan_id)
    ->get();

echo "   Servicios a copiar: {$centralPlanServices->count()}\n\n";

$copied = 0;
foreach ($centralPlanServices as $planService) {
    $sql = "INSERT INTO `{$databaseName}`.`plan_services`
            (`id`, `plan_id`, `service_id`, `is_included`, `usage_limit`, `extra_price`, `priority`, `created_at`, `updated_at`)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE
                `is_included` = VALUES(`is_included`),
                `usage_limit` = VALUES(`usage_limit`),
                `extra_price` = VALUES(`extra_price`),
                `priority` = VALUES(`priority`),
                `updated_at` = VALUES(`updated_at`)";

    try {
        DB::statement($sql, [
            $planService->id,
            $planService->plan_id,
            $planService->service_id,
            $planService->is_included,
            $planService->usage_limit,
            $planService->extra_price,
            $planService->priority,
            $planService->created_at,
            $planService->updated_at,
        ]);

        $service = DB::table('services')->find($planService->service_id);
        $limit = $planService->usage_limit === null ? 'ilimitado' : $planService->usage_limit;
        $included = $planService->is_included ? '✅' : '❌';
        echo "   {$included} {$service->name} (límite: {$limit})\n";
        $copied++;

    } catch (\Exception $e) {
        echo "   ❌ Error copiando servicio #{$planService->service_id}: {$e->getMessage()}\n";
    }
}

echo "\n";
echo "📊 RESUMEN FINAL:\n";
echo "─────────────────────────────────────────────────────\n";

$tenantPlanCount = DB::table("{$databaseName}.plans")->count();
$tenantPlanServicesCount = DB::table("{$databaseName}.plan_services")->count();
$tenantServicesCount = DB::table("{$databaseName}.services")->count();

echo "   Plans: {$tenantPlanCount}\n";
echo "   Services: {$tenantServicesCount}\n";
echo "   Plan Services: {$tenantPlanServicesCount} / {$centralPlanServices->count()}\n";

if ($tenantPlanServicesCount === $centralPlanServices->count()) {
    echo "\n✅ TODOS LOS DATOS COPIADOS CORRECTAMENTE\n";
} else {
    echo "\n⚠️  Faltan servicios por copiar\n";
}

echo "\n════════════════════════════════════════════════════\n";
echo "✅ PROCESO COMPLETADO\n";
echo "════════════════════════════════════════════════════\n";
