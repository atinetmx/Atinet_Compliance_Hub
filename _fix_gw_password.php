<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$pass = 'LaravelGateway2026#';
$hash2y = password_hash($pass, PASSWORD_BCRYPT, ['cost' => 10]);
$hash2b = str_replace('$2y$', '$2b$', $hash2y);

\Illuminate\Support\Facades\DB::table('tbl_cat_usuarios')
    ->where('Usuario', 'LARAVEL_GW')
    ->update(['Contrasena' => $hash2b, 'Sesion_Iniciada' => 0]);

echo "Hash actualizado: {$hash2b}" . PHP_EOL;

// Test inmediato
$internalUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');
$ch = curl_init($internalUrl . '/Login/Authentication');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode([
        'usuario'        => 'LARAVEL_GW',
        'contrasena'     => $pass,
        'nombre_Notaria' => 'NOTARIA',
        'equipo'         => 'Laravel-Server',
    ]),
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT => 10,
]);
$body = curl_exec($ch);
$data = json_decode($body, true);
curl_close($ch);

$token = $data['dataResponse']['accessToken'] ?? null;
echo "Login gateway: " . ($token ? "JWT OK (" . substr($token, 0, 20) . "...)" : "FALLO: " . ($data['message'] ?? $body)) . PHP_EOL;
