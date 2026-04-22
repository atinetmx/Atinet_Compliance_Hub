<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$password = 'LaravelGateway2026#';
$base     = env('CONTROL_NOTARIAL_INTERNAL_URL', 'http://192.168.1.1:5000/api');

// Generar hash con prefijo $2a$ (BCrypt.Net clásico de C#)
$phpHash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);
$hash2a  = '$2a$' . substr($phpHash, 4); // PHP genera $2y$, reemplazar por $2a$

echo "Password : {$password}" . PHP_EOL;
echo "Hash     : {$hash2a}" . PHP_EOL;

// Resetear TODAS las sesiones y actualizar hash
DB::update("UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0");
DB::update("UPDATE tbl_cat_usuarios SET Contrasena = ?, Sesion_Iniciada = 0 WHERE Usuario = 'LARAVEL_GW'", [$hash2a]);
echo "BD actualizada. Sesiones reseteadas." . PHP_EOL;

// Reiniciar App Pool SCN
shell_exec('"' . getenv('SystemRoot') . '\system32\inetsrv\appcmd.exe" stop apppool /apppool.name:"SCN" 2>&1');
sleep(2);
shell_exec('"' . getenv('SystemRoot') . '\system32\inetsrv\appcmd.exe" start apppool /apppool.name:"SCN" 2>&1');
sleep(3);
echo "App Pool SCN reiniciado." . PHP_EOL;

// Función de test
function cnLogin(string $base, string $user, string $pass): string
{
    $ch = curl_init("{$base}/Login/Authentication");
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode(['usuario' => $user, 'contrasena' => $pass]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $body = curl_exec($ch);
    $http = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $err  = curl_error($ch);
    curl_close($ch);
    if ($err) { return "CURL ERROR: {$err}"; }
    $data = json_decode($body, true);
    if ($http === 200 && !empty($data['token'])) {
        return "✅ JWT obtenido (" . strlen($data['token']) . " chars)";
    }
    $msg = $data['message'] ?? $data['mensaje'] ?? substr($body, 0, 200);
    return "HTTP {$http} | ❌ {$msg}";
}

echo PHP_EOL . "=== Test logins ===" . PHP_EOL;
echo "LARAVEL_GW / LaravelGateway2026# -> " . cnLogin($base, 'LARAVEL_GW', 'LaravelGateway2026#') . PHP_EOL;
echo "ADMIN      / admin               -> " . cnLogin($base, 'ADMIN', 'admin') . PHP_EOL;
echo "ADMIN      / 1010                -> " . cnLogin($base, 'ADMIN', '1010') . PHP_EOL;
