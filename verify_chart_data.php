<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "\n=== VERIFICACIÓN DE DATOS PARA GRÁFICO DE SUSCRIPCIONES ===\n\n";

// Obtener estadísticas como lo hace el controller
$stats = [
    'total' => \App\Models\Subscription::count(),
    'activas' => \App\Models\Subscription::where('status', 'activa')->count(),
    'trial' => \App\Models\Subscription::where('status', 'trial')->count(),
    'vencidas' => \App\Models\Subscription::where('status', 'vencida')->count(),
    'suspendidas' => \App\Models\Subscription::where('status', 'suspendida')->count(),
    'canceladas' => \App\Models\Subscription::where('status', 'cancelada')->count(),
    'mrr' => \App\Models\Subscription::whereIn('status', ['activa'])->sum('precio_pagado'),
];

echo "📊 ESTADÍSTICAS ACTUALES:\n\n";
echo "Total de Suscripciones: {$stats['total']}\n";
echo "├─ ✅ Activas: {$stats['activas']}\n";
echo "├─ 🔵 Trial: {$stats['trial']}\n";
echo "├─ 🟠 Vencidas: {$stats['vencidas']}\n";
echo "├─ 🔴 Suspendidas: {$stats['suspendidas']}\n";
echo "└─ ⚫ Canceladas: {$stats['canceladas']}\n\n";

echo '💰 MRR (Monthly Recurring Revenue): $'.number_format($stats['mrr'], 2)."\n\n";

// Verificar que hay datos para el gráfico
$chartData = [];
if ($stats['trial'] > 0) {
    $chartData[] = ['name' => 'Trial', 'value' => $stats['trial'], 'color' => 'azul'];
}
if ($stats['activas'] > 0) {
    $chartData[] = ['name' => 'Activas', 'value' => $stats['activas'], 'color' => 'verde'];
}
if ($stats['vencidas'] > 0) {
    $chartData[] = ['name' => 'Vencidas', 'value' => $stats['vencidas'], 'color' => 'naranja'];
}
if ($stats['suspendidas'] > 0) {
    $chartData[] = ['name' => 'Suspendidas', 'value' => $stats['suspendidas'], 'color' => 'rojo'];
}
if ($stats['canceladas'] > 0) {
    $chartData[] = ['name' => 'Canceladas', 'value' => $stats['canceladas'], 'color' => 'gris'];
}

echo "📈 DATOS PARA EL GRÁFICO:\n\n";
if (count($chartData) > 0) {
    foreach ($chartData as $data) {
        $percentage = ($data['value'] / $stats['total']) * 100;
        echo "  {$data['name']}: {$data['value']} ({$percentage}%)\n";
    }
    echo "\n✅ El gráfico mostrará ".count($chartData)." segmentos\n";
} else {
    echo "⚠️  No hay datos para mostrar en el gráfico\n";
}

echo "\n=== DETALLES DE SUSCRIPCIONES ===\n\n";

$subscriptions = \App\Models\Subscription::with(['notaria', 'plan'])
    ->orderBy('created_at', 'desc')
    ->get();

foreach ($subscriptions as $sub) {
    $statusIcon = match ($sub->status) {
        'activa' => '✅',
        'trial' => '🔵',
        'vencida' => '🟠',
        'suspendida' => '🔴',
        'cancelada' => '⚫',
        default => '❓',
    };

    echo "{$statusIcon} {$sub->notaria->nombre}\n";
    echo "   Plan: {$sub->plan->nombre}\n";
    echo "   Estado: {$sub->status}\n";
    echo "   Vence: {$sub->fecha_vencimiento->format('d/m/Y')}\n";
    echo "   Precio: \${$sub->precio_pagado}\n\n";
}

echo "===========================================\n\n";
echo "✅ Ahora puedes ver el gráfico en: http://tu-dominio/admin/subscriptions\n\n";
