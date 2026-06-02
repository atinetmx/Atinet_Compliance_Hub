<?php
// Explorar endpoints de saldo/consumo de la API PrevencionDeLavado.com

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

Cache::forget('pld_api_token');

$baseUrl = rtrim(config('services.prevencion_lavado.url'), '/');
$usuario = config('services.prevencion_lavado.user');
$clave   = config('services.prevencion_lavado.password');

// Login
$loginResp = Http::withOptions(['verify' => false])
    ->timeout(30)
    ->post($baseUrl . '/Login', ['usuario' => $usuario, 'clave' => $clave]);

$token = $loginResp->json('token');
if (! $token) {
    echo "❌ Login fallido\n";
    exit(1);
}

// Decodificar JWT para obtener Client ID y User ID
$payload = json_decode(base64_decode(str_pad(
    strtr(explode('.', $token)[1], '-_', '+/'),
    4, '=', STR_PAD_RIGHT
)), true);

$clientId = $payload['Client'] ?? null;
$userId   = $payload['Id'] ?? null;
$email    = $payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? null;

echo "✅ Login OK\n";
echo "   Client: {$clientId} | User ID: {$userId} | Email: {$email}\n\n";

$http = Http::withOptions(['verify' => false])
    ->withToken($token)
    ->timeout(15);

// Endpoints candidatos a retornar saldo/consumo
$endpoints = [
    // Genéricos
    '/saldo',
    '/consumo',
    '/creditos',
    '/busquedas-disponibles',
    '/quota',
    '/plan',
    '/cuenta',
    '/cuenta/saldo',
    '/cuenta/consumo',
    // Con Client ID y User ID (se sustituyen abajo)
    '/cliente/CLIENT_ID',
    '/cliente/CLIENT_ID/saldo',
    '/usuario/USER_ID',
    '/usuario/USER_ID/saldo',
    // Patrones REST
    '/listas/saldo',
    '/listas/consumo',
    '/busquedas/saldo',
    // Swagger discovery
    '/swagger/v1/swagger.json',
    '/swagger.json',
    '/openapi.json',
    '/',
];

echo "Explorando " . count($endpoints) . " endpoints...\n";
echo str_repeat('-', 70) . "\n";

foreach ($endpoints as $path) {
    $path = str_replace(['CLIENT_ID', 'USER_ID'], [$clientId, $userId], $path);
    try {
        $r = $http->get($baseUrl . $path);
        $status = $r->status();
        $marker = $status === 200 ? '✅' : ($status === 401 ? '🔑' : ($status === 404 ? '  ' : '⚠️'));
        echo "{$marker} [{$status}] GET {$path}";
        if ($status !== 404) {
            $body = $r->json();
            if ($body) {
                echo " → " . json_encode($body, JSON_UNESCAPED_UNICODE);
            } else {
                $text = substr($r->body(), 0, 150);
                if (trim($text)) {
                    echo " → " . trim($text);
                }
            }
        }
        echo "\n";
    } catch (\Exception $e) {
        echo "  [ERR] GET {$path} → {$e->getMessage()}\n";
    }
}
