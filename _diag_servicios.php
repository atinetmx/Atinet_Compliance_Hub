<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Service;
use App\Models\User;

// --- PROBLEMA 1: Servicios del plan de elizabeth.ortega ---
$u = User::where('email', 'elizabeth.ortega@atinet.com.mx')
    ->with('notaria.plan.services')
    ->first();

echo '=== Plan de '.$u->email." ===\n";
echo 'Notaría: '.$u->notaria->nombre." (id={$u->notaria->id})\n";
echo 'Plan: '.$u->notaria->plan->nombre." (id={$u->notaria->plan_id})\n";
echo "Servicios en plan_services:\n";
foreach ($u->notaria->plan->services as $s) {
    echo "  [{$s->id}] {$s->clave} - {$s->nombre} (status={$s->status})\n";
}

// herramientas_activas del plan
echo "\nherramientas_activas del plan:\n";
$ha = $u->notaria->plan->herramientas_activas ?? '[]';
$arr = is_string($ha) ? json_decode($ha, true) : (array) $ha;
foreach ($arr as $h) {
    echo "  - $h\n";
}

// --- PROBLEMA 2: ¿Qué servicio es el escáner inteligente? ---
echo "\n=== Servicio escáner inteligente ===\n";
$escaner = Service::where('clave', 'LIKE', '%scan%')
    ->orWhere('clave', 'LIKE', '%escaner%')
    ->orWhere('nombre', 'LIKE', '%scan%')
    ->orWhere('nombre', 'LIKE', '%escáner%')
    ->orWhere('nombre', 'LIKE', '%escaner%')
    ->get(['id', 'clave', 'nombre', 'status']);
foreach ($escaner as $s) {
    echo "  [{$s->id}] {$s->clave} - {$s->nombre} (status={$s->status})\n";
}

// --- Todos los servicios disponibles ---
echo "\n=== Todos los servicios ===\n";
foreach (Service::orderBy('id')->get(['id', 'clave', 'nombre', 'status']) as $s) {
    $inPlan = $u->notaria->plan->services->contains('id', $s->id) ? '✓' : ' ';
    echo "  [{$inPlan}] [{$s->id}] {$s->clave} - {$s->nombre} (status={$s->status})\n";
}
