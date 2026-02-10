<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$notaria = App\Models\Notaria::find(1);
$subscription = $notaria->subscripciones()->latest()->first();

echo '=== Verificación de Suscripción ==='.PHP_EOL.PHP_EOL;
echo 'Notaría: '.$notaria->nombre.PHP_EOL;
echo 'Notaría Activa: '.($notaria->activa ? 'SÍ' : 'NO').PHP_EOL;
echo PHP_EOL;
echo 'Suscripción ID: '.$subscription->id.PHP_EOL;
echo 'Estado: '.$subscription->status.PHP_EOL;
echo 'Fecha Vencimiento: '.$subscription->fecha_vencimiento->format('Y-m-d').PHP_EOL;
echo 'Plan: '.$subscription->plan->nombre.PHP_EOL;
echo PHP_EOL;

// Verificar si las tarjetas de estadísticas están correctas
$totalSubscriptions = App\Models\Subscription::count();
$trialSubscriptions = App\Models\Subscription::where('status', 'trial')->count();
$vencidas = App\Models\Subscription::where('status', 'vencida')->count();
$suspendidas = App\Models\Subscription::where('status', 'suspendida')->count();
$requierenAtencion = $vencidas + $suspendidas;

echo '=== Estadísticas ==='.PHP_EOL;
echo 'Total Suscripciones: '.$totalSubscriptions.PHP_EOL;
echo 'Trial: '.$trialSubscriptions.PHP_EOL;
echo 'Vencidas: '.$vencidas.PHP_EOL;
echo 'Suspendidas: '.$suspendidas.PHP_EOL;
echo 'Requieren Atención: '.$requierenAtencion.PHP_EOL;
