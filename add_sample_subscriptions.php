<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n=== AGREGAR SUSCRIPCIONES DE EJEMPLO PARA GRÁFICOS ===\n\n";

// Verificar si ya hay suficientes suscripciones
$currentCount = \App\Models\Subscription::count();
if ($currentCount >= 10) {
    echo "⚠️  Ya hay {$currentCount} suscripciones en el sistema.\n";
    echo "¿Deseas agregar más suscripciones de ejemplo? (y/n): ";
    $handle = fopen('php://stdin', 'r');
    $line = trim(fgets($handle));
    if (strtolower($line) !== 'y') {
        echo "❌ Operación cancelada\n\n";
        exit(0);
    }
}

// Obtener planes y notarías existentes
$plans = \App\Models\Plan::all();
$notarias = \App\Models\Notaria::all();

if ($plans->isEmpty()) {
    echo "❌ No hay planes creados. Crea planes primero.\n\n";
    exit(1);
}

if ($notarias->isEmpty()) {
    echo "❌ No hay notarías creadas. Crea notarías primero.\n\n";
    exit(1);
}

echo "📊 Planes disponibles: {$plans->count()}\n";
echo "🏢 Notarías disponibles: {$notarias->count()}\n\n";

// Definir distribución de suscripciones por estado
$distributions = [
    'trial' => 2,
    'activa' => 5,
    'vencida' => 2,
    'suspendida' => 1,
    'cancelada' => 1,
];

$created = 0;
$skipped = 0;

foreach ($distributions as $status => $count) {
    echo "📝 Creando {$count} suscripciones con estado: {$status}\n";

    for ($i = 0; $i < $count; $i++) {
        // Para suscripciones activas/trial, verificar que no haya otra activa
        $availableNotaria = null;

        if (in_array($status, ['activa', 'trial'])) {
            // Solo puede haber 1 suscripción activa/trial por notaría
            foreach ($notarias as $notaria) {
                $hasActive = \App\Models\Subscription::where('notaria_id', $notaria->id)
                    ->whereIn('status', ['activa', 'trial'])
                    ->exists();

                if (! $hasActive) {
                    $availableNotaria = $notaria;
                    break;
                }
            }

            if (! $availableNotaria) {
                echo "   ⚠️  No hay notarías disponibles sin suscripción activa\n";
                $skipped++;

                continue;
            }
        } else {
            // Para suscripciones históricas (vencidas, canceladas, suspendidas)
            // podemos usar cualquier notaría, incluso si ya tiene una activa
            $availableNotaria = $notarias->random();
        }

        $plan = $plans->random();

        // Configurar fechas según estado
        $fechaInicio = now()->subMonths(rand(1, 6));
        $fechaVencimiento = match ($status) {
            'trial' => now()->addDays(rand(7, 14)),
            'activa' => now()->addMonths(rand(1, 12)),
            'vencida' => now()->subDays(rand(1, 30)),
            'suspendida' => now()->subDays(rand(8, 60)),
            'cancelada' => now()->subDays(rand(30, 180)),
        };

        // Crear suscripción
        $subscription = \App\Models\Subscription::create([
            'notaria_id' => $availableNotaria->id,
            'plan_id' => $plan->id,
            'status' => $status,
            'fecha_inicio' => $fechaInicio,
            'fecha_vencimiento' => $fechaVencimiento,
            'precio_pagado' => $plan->precio_mensual,
            'moneda' => 'MXN',
            'ciclo_facturacion' => 'mensual',
            'auto_renovacion' => $status === 'activa',
        ]);

        // Actualizar estado de notaría solo para suscripciones activas/trial
        if (in_array($status, ['activa', 'trial'])) {
            $availableNotaria->update([
                'activa' => true,
            ]);
            echo "   ✅ {$availableNotaria->nombre} → {$status} (notaría activada)\n";
        } else {
            echo "   ✅ {$availableNotaria->nombre} → {$status} (histórica)\n";
        }

        $created++;
    }
}

echo "\n=== RESUMEN ===\n";
echo "✅ Suscripciones creadas: {$created}\n";
echo "⚠️  Suscripciones omitidas: {$skipped}\n";
echo "📊 Total en sistema: ".\App\Models\Subscription::count()."\n\n";

// Mostrar distribución actual
echo "=== DISTRIBUCIÓN ACTUAL ===\n";
$stats = [
    'Trial' => \App\Models\Subscription::where('status', 'trial')->count(),
    'Activas' => \App\Models\Subscription::where('status', 'activa')->count(),
    'Vencidas' => \App\Models\Subscription::where('status', 'vencida')->count(),
    'Suspendidas' => \App\Models\Subscription::where('status', 'suspendida')->count(),
    'Canceladas' => \App\Models\Subscription::where('status', 'cancelada')->count(),
];

foreach ($stats as $name => $count) {
    $icon = match ($name) {
        'Trial' => '🔵',
        'Activas' => '✅',
        'Vencidas' => '🟠',
        'Suspendidas' => '🔴',
        'Canceladas' => '⚫',
        default => '❓',
    };
    echo "{$icon} {$name}: {$count}\n";
}

echo "\n✅ Ahora puedes ver los diferentes tipos de gráficos en:\n";
echo "   http://tu-dominio/admin/subscriptions\n\n";
echo "💡 Prueba cambiar entre:\n";
echo "   🥧 Circular (Pie) - Vista de proporciones\n";
echo "   📊 Barras (Bar) - Comparación directa\n";
echo "   🎯 Radial - Progreso circular\n";
echo "   🗺️  Mapa de Árbol - Visualización jerárquica\n\n";
