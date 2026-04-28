<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Subscription;

// Limpiar razon_cancelacion en suscripciones activas/trial que aún la tienen
$affected = Subscription::whereIn('status', ['activa', 'trial'])
    ->whereNotNull('razon_cancelacion')
    ->get();

echo 'Suscripciones activas con razon_cancelacion sucia: '.count($affected)."\n\n";

foreach ($affected as $s) {
    echo "Sub #{$s->id} | {$s->status} | Razon: {$s->razon_cancelacion}\n";
    $s->update([
        'razon_cancelacion' => null,
        'fecha_cancelacion' => null,
    ]);
    echo "  -> Limpiada OK\n";
}

echo "\nListo.\n";
