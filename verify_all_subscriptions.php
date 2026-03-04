<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use App\Models\Subscription;
use Illuminate\Support\Facades\DB;

echo '=== VERIFICACIÓN COMPLETA DE SUSCRIPCIONES ==='.PHP_EOL.PHP_EOL;

// Obtener TODAS las suscripciones
$subscriptions = Subscription::with(['notaria', 'plan'])->get();

if ($subscriptions->isEmpty()) {
    echo '❌ No hay suscripciones en el sistema'.PHP_EOL;
    exit;
}

echo '✅ Total de suscripciones: '.$subscriptions->count().PHP_EOL.PHP_EOL;

foreach ($subscriptions as $sub) {
    echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.PHP_EOL;
    echo "Suscripción ID: {$sub->id}".PHP_EOL;
    echo "Notaría: {$sub->notaria->nombre} (ID: {$sub->notaria->id})".PHP_EOL;
    echo "Plan: {$sub->plan->nombre}".PHP_EOL;
    echo "Status: {$sub->status}".PHP_EOL;
    echo PHP_EOL;

    echo '📅 FECHAS:'.PHP_EOL;
    echo '  fecha_inicio: '.($sub->fecha_inicio ?? 'NULL').PHP_EOL;
    echo '  fecha_vencimiento: '.($sub->fecha_vencimiento ?? 'NULL').PHP_EOL;
    echo PHP_EOL;

    echo '💰 PAGO:'.PHP_EOL;
    echo "  Precio pagado: \${$sub->precio_pagado}".PHP_EOL;
    echo "  Ciclo: {$sub->ciclo_facturacion}".PHP_EOL;
    echo '  Auto-renovación: '.($sub->auto_renovacion ? 'Sí' : 'No').PHP_EOL;
    echo PHP_EOL;

    echo '✅ VALIDACIÓN:'.PHP_EOL;

    // Verificar método estaActiva()
    $estaActiva = $sub->estaActiva();
    echo '  estaActiva(): '.($estaActiva ? '✅ Sí' : '❌ No').PHP_EOL;

    // Verificar subscripcionActiva()
    $notaria = Notaria::find($sub->notaria_id);
    $activaSub = $notaria->subscripcionActiva;
    echo '  subscripcionActiva(): '.($activaSub ? "✅ ID {$activaSub->id}" : '❌ NULL').PHP_EOL;

    // Verificar si está vencida
    if ($sub->fecha_vencimiento) {
        $now = now();
        $vencimiento = \Carbon\Carbon::parse($sub->fecha_vencimiento);

        if ($vencimiento < $now) {
            $diasVencido = $now->diffInDays($vencimiento);
            echo "  ⚠️  Vencida hace {$diasVencido} días".PHP_EOL;
        } else {
            $diasRestantes = $now->diffInDays($vencimiento);
            echo "  ✅ Vence en {$diasRestantes} días ({$vencimiento->format('d/m/Y')})".PHP_EOL;
        }
    } else {
        echo '  ❌ Sin fecha de vencimiento configurada'.PHP_EOL;
    }

    echo PHP_EOL;
}

echo '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'.PHP_EOL;
echo PHP_EOL;

// Verificar columnas RAW de la base de datos
echo '=== VERIFICACIÓN RAW DE BASE DE DATOS ==='.PHP_EOL.PHP_EOL;

$rawSubs = DB::table('subscriptions')->get();

foreach ($rawSubs as $raw) {
    echo "ID {$raw->id}: ".PHP_EOL;
    echo "  notaria_id: {$raw->notaria_id}".PHP_EOL;
    echo "  plan_id: {$raw->plan_id}".PHP_EOL;
    echo "  status: {$raw->status}".PHP_EOL;
    echo '  fecha_inicio (RAW): '.($raw->fecha_inicio ?? 'NULL').PHP_EOL;
    echo '  fecha_vencimiento (RAW): '.($raw->fecha_vencimiento ?? 'NULL').PHP_EOL;
    echo "  created_at: {$raw->created_at}".PHP_EOL;
    echo "  updated_at: {$raw->updated_at}".PHP_EOL;
    echo PHP_EOL;
}

echo '=== RESUMEN ==='.PHP_EOL;
echo 'Total suscripciones: '.$subscriptions->count().PHP_EOL;
echo 'Con fechas válidas: '.$subscriptions->filter(fn ($s) => $s->fecha_vencimiento !== null)->count().PHP_EOL;
echo 'Sin fechas (NULL): '.$subscriptions->filter(fn ($s) => $s->fecha_vencimiento === null)->count().PHP_EOL;
echo "Estado 'trial': ".$subscriptions->where('status', 'trial')->count().PHP_EOL;
echo "Estado 'activa': ".$subscriptions->where('status', 'activa')->count().PHP_EOL;
