<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Notaria;
use App\Models\Subscription;

// Buscar notaría 10 colima
$n = Notaria::with('subscripciones.plan')
    ->where('nombre', 'like', '%COLIMA%')
    ->orWhere('nombre', 'like', '%colima%')
    ->first();

if (! $n) {
    // Buscar por estado colima
    $n = Notaria::with('subscripciones.plan')
        ->where('estado', 'like', '%colima%')
        ->where('numero_notaria', 10)
        ->first();
}
if (! $n) {
    // Listar todas las notarías disponibles
    echo "No encontrada por colima. Listando todas:\n";
    Notaria::all(['id', 'nombre', 'numero_notaria', 'estado'])->each(function ($x) {
        echo "  #{$x->id} | N{$x->numero_notaria} | {$x->nombre} | {$x->estado}\n";
    });
    exit;
}

echo "=== Notaria ===\n";
echo "ID: {$n->id} | Nombre: {$n->nombre}\n";
echo "Estado: {$n->estado} | Numero: {$n->numero_notaria}\n";
echo 'Activa en sistema: '.($n->activa ? 'SI' : 'NO')."\n\n";

echo '=== Suscripciones ('.count($n->subscripciones).") ===\n";
foreach ($n->subscripciones->sortByDesc('created_at') as $s) {
    $plan = $s->plan ? $s->plan->nombre : 'sin plan';
    $hoy = now();
    $diasDiff = $s->fecha_vencimiento->diffInDays($hoy, false);
    $vstate = $diasDiff > 0 ? "vencida hace {$diasDiff} dias" : "vigente {$hoy->diffInDays($s->fecha_vencimiento)} dias restantes";

    echo "\nSub #{$s->id}\n";
    echo "  Plan: {$plan}\n";
    echo "  Status: {$s->status}\n";
    echo "  Ciclo: {$s->ciclo_facturacion}\n";
    echo "  Inicio: {$s->fecha_inicio}\n";
    echo "  Vencimiento: {$s->fecha_vencimiento} ({$vstate})\n";
    echo "  Precio: {$s->precio_pagado} {$s->moneda}\n";
    echo '  Auto-renovacion: '.($s->auto_renovacion ? 'SI' : 'NO')."\n";
    echo '  Razon cancelacion: '.($s->razon_cancelacion ?? '-')."\n";
    if ($s->fecha_cancelacion) {
        echo "  Fecha cancelacion: {$s->fecha_cancelacion}\n";
    }
}

echo "\n=== Verificacion flujo ===\n";
// Verificar que el método estaActiva() funciona correctamente
$ultima = $n->subscripciones->first();
if ($ultima) {
    echo 'estaActiva(): '.($ultima->estaActiva() ? 'SI' : 'NO')."\n";
    echo 'vencePronto(7): '.($ultima->vencePronto(7) ? 'SI' : 'NO')."\n";
}

// Verificar también CheckSubscriptionStatus: qué suscripciones encontraría
$subMiddleware = $n->subscripciones()
    ->whereIn('status', [
        Subscription::STATUS_ACTIVA,
        Subscription::STATUS_TRIAL,
        Subscription::STATUS_VENCIDA,
    ])
    ->latest()
    ->first();
echo 'Middleware encontraría: '.($subMiddleware ? "Sub #{$subMiddleware->id} ({$subMiddleware->status})" : 'NINGUNA - bloquearia acceso')."\n";
