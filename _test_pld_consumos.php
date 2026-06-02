<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

Cache::forget('pld_api_token');
$base  = rtrim(config('services.prevencion_lavado.url'), '/');
$r     = Http::withOptions(['verify' => false])->timeout(30)
    ->post($base . '/Login', [
        'usuario' => config('services.prevencion_lavado.user'),
        'clave'   => config('services.prevencion_lavado.password'),
    ]);
$token = $r->json('token');

echo "Login: " . $r->status() . "\n";

$consumos = Http::withOptions(['verify' => false])->withToken($token)->timeout(30)
    ->get($base . '/Listas/Consumos');

echo "Consumos status: " . $consumos->status() . "\n";
echo json_encode($consumos->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n";
