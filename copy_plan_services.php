<?php

/**
 * Script para copiar plan_services desde BD central al tenant
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use Illuminate\Support\Facades\DB;

$notaria = Notaria::orderBy('created_at', 'desc')->first();

if (! $notaria) {
    echo "❌ No hay notarías registradas\n";
    exit(1);
}

$databaseName = 'atinet_notaria_'.$notaria->numero_notaria;

echo "════════════════════════════════════════════════════\n";
echo "📦 COPIAR PLAN_SERVICES AL TENANT\n";
echo "════════════════════════════════════════════════════\n\n";

echo "Notaría: {$notaria->nombre}\n";
echo "Plan ID: {$notaria->plan_id}\n";
echo "Base de datos: {$databaseName}\n\n";

// Verificar plan_services en BD central
$centralPlanServices = DB::table('plan_services')
    ->where('plan_id', $notaria->plan_id)
    ->get();

echo "📊 Plan services en BD CENTRAL: {$centralPlanServices->count()}\n\n";

if ($centralPlanServices->count() === 0) {
    echo "⚠️  No hay servicios configurados para el plan {$notaria->plan_id}\n";
    echo "   Esto es normal si el plan aún no tiene servicios asignados\n";
    exit(0);
}

// Copiar a tenant
echo "📋 Copiando servicios al tenant...\n";

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

        // Obtener nombre del servicio para mostrar
        $service = DB::table('services')->find($planService->service_id);
        $limit = $planService->usage_limit === null ? 'ilimitado' : $planService->usage_limit;
        echo "   ✅ {$service->name} (límite: {$limit})\n";

    } catch (\Exception $e) {
        echo "   ❌ Error copiando servicio #{$planService->service_id}: {$e->getMessage()}\n";
    }
}

echo "\n";
echo "📊 VERIFICACIÓN FINAL:\n";
echo "─────────────────────────────────────────────────────\n";

$tenantCount = DB::table("{$databaseName}.plan_services")->count();
echo "   Plan services en tenant: {$tenantCount}\n";
echo "   Plan services en central: {$centralPlanServices->count()}\n";

if ($tenantCount === $centralPlanServices->count()) {
    echo "\n✅ Todos los servicios copiados correctamente\n";
} else {
    echo "\n⚠️  Diferencia detectada\n";
}

echo "\n════════════════════════════════════════════════════\n";
echo "✅ PROCESO COMPLETADO\n";
echo "════════════════════════════════════════════════════\n";
