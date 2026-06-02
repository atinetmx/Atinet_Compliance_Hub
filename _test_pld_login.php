<?php
// Script para verificar login y explorar endpoints de PrevencionDeLavado.com
// Útil para probar credenciales nuevas o explorar la API

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

// Limpiar caché por si quedó algo de pruebas anteriores
Cache::forget('pld_api_token');

$baseUrl = rtrim(config('services.prevencion_lavado.url'), '/');
$usuario = config('services.prevencion_lavado.user');
$clave   = config('services.prevencion_lavado.password');

echo "URL:     {$baseUrl}\n";
echo "Usuario: {$usuario}\n";
echo "Clave:   " . str_repeat('*', strlen($clave)) . "\n\n";

echo "Llamando a {$baseUrl}/Login ...\n";

try {
    $response = Http::withOptions(['verify' => false])
        ->timeout(30)
        ->post($baseUrl . '/Login', [
            'usuario' => $usuario,
            'clave'   => $clave,
        ]);

    echo "HTTP Status: " . $response->status() . "\n";
    echo "Respuesta completa:\n";
    print_r($response->json());

    $token = $response->json('token');
    if ($token) {
        echo "\n✅ TOKEN OK (primeros 60 chars): " . substr($token, 0, 60) . "...\n";

        // Intentar ver info del usuario si hay endpoint disponible
        echo "\nBuscando endpoints de info del usuario...\n";
        foreach (['/usuario', '/me', '/cuenta', '/perfil', '/info'] as $endpoint) {
            $r = Http::withOptions(['verify' => false])
                ->withToken($token)
                ->timeout(10)
                ->get($baseUrl . $endpoint);
            echo "  GET {$endpoint} → HTTP " . $r->status() . "\n";
            if ($r->successful()) {
                echo "  Respuesta: ";
                print_r($r->json());
            }
        }
    } else {
        echo "\n❌ No se encontró token en la respuesta\n";
    }

} catch (\Exception $e) {
    echo "\n❌ Excepción: " . $e->getMessage() . "\n";
}
