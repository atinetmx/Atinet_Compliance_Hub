<?php
/**
 * Fix LARAVEL_GW usando el hash de ADMIN ID=9 (password='admin')
 * Se sabe que C# acepta ese hash porque ADMIN/admin da "Ya hay sesion" (no "contraseña incorrecta")
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$base = env('CONTROL_NOTARIAL_INTERNAL_URL', 'http://192.168.1.1:5000/api');

echo "=== Estado actual tbl_cat_usuarios ===" . PHP_EOL;
$rows = DB::select("SELECT Id, Usuario, Sesion_Iniciada, LEFT(Contrasena,30) as Hash FROM tbl_cat_usuarios WHERE Usuario IN ('ADMIN','LARAVEL_GW') ORDER BY Id");
foreach ($rows as $r) {
    echo "  ID={$r->Id} | {$r->Usuario} | Sesion={$r->Sesion_Iniciada} | {$r->Hash}..." . PHP_EOL;
}

// Reset sesiones
DB::update("UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0");
echo PHP_EOL . "Sesion_Iniciada=0 aplicado a todos." . PHP_EOL;

// Copiar hash de ADMIN ID=9 (password='admin') a LARAVEL_GW
$admin9 = DB::selectOne("SELECT Contrasena FROM tbl_cat_usuarios WHERE Id = 9");
if (!$admin9) {
    echo "ERROR: No se encontro ADMIN ID=9" . PHP_EOL;
    exit(1);
}
DB::update("UPDATE tbl_cat_usuarios SET Contrasena = ? WHERE Usuario = 'LARAVEL_GW'", [$admin9->Contrasena]);
echo "Hash de ADMIN ID=9 copiado a LARAVEL_GW." . PHP_EOL;
echo "Hash: {$admin9->Contrasena}" . PHP_EOL;
$verifyLocal = password_verify('admin', $admin9->Contrasena);
echo "PHP password_verify('admin', hash): " . ($verifyLocal ? 'OK' : 'FALLO') . PHP_EOL;

echo PHP_EOL . "=== STOP+START App Pool SCN ===" . PHP_EOL;
echo shell_exec('"' . getenv('SystemRoot') . '\system32\inetsrv\appcmd.exe" stop apppool /apppool.name:"SCN" 2>&1');
sleep(2);
echo shell_exec('"' . getenv('SystemRoot') . '\system32\inetsrv\appcmd.exe" start apppool /apppool.name:"SCN" 2>&1');
sleep(3);

echo PHP_EOL . "=== Test logins ===" . PHP_EOL;

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
    if ($err) return "CURL ERROR: {$err}";
    $data = json_decode($body, true);
    if ($http === 200 && !empty($data['token'])) {
        return "✅ JWT: " . substr($data['token'], 0, 50) . "...";
    }
    $msg = $data['message'] ?? $data['mensaje'] ?? $body;
    return "HTTP {$http} | ❌ {$msg}";
}

echo "LARAVEL_GW / admin -> " . cnLogin($base, 'LARAVEL_GW', 'admin') . PHP_EOL;
echo "ADMIN      / admin -> " . cnLogin($base, 'ADMIN', 'admin') . PHP_EOL;
echo "ADMIN      / 1010  -> " . cnLogin($base, 'ADMIN', '1010') . PHP_EOL;

echo PHP_EOL . "=== Si LARAVEL_GW da JWT, actualiza .env ===" . PHP_EOL;
echo "  CONTROL_NOTARIAL_GW_PASSWORD=admin" . PHP_EOL;
echo "  Luego: php artisan cache:clear" . PHP_EOL;

// Old helper functions kept below for compatibility
function cnPost(string $url, array $data, ?string $token = null): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => array_filter([
            'Content-Type: application/json',
            $token ? "Authorization: Bearer $token" : null,
        ]),
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($resp, true) ?? $resp];
}

function cnGet(string $url, string $token): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", 'Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($resp, true) ?? $resp];
}

function cnPut(string $url, array $data, string $token): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_CUSTOMREQUEST => 'PUT',
        CURLOPT_POSTFIELDS => json_encode($data),
        CURLOPT_HTTPHEADER => ["Authorization: Bearer $token", 'Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($resp, true) ?? $resp];
}

$base = 'http://192.168.1.1:5000/api';

// Probar todas las combinaciones de ADMIN
$combos = [
    ['ADMIN', 'admin'],
    ['ADMIN', '1010'],
    ['ADMIN', 'Admin2026'],
    ['ADMIN', 'admin123'],
];

$workingToken = null;
foreach ($combos as [$user, $pass]) {
    $r = cnPost("$base/Login/Authentication", [
        'usuario' => $user,
        'contrasena' => $pass,
        'nombre_Notaria' => 'NOTARIA',
        'equipo' => 'Laravel-Test',
    ]);
    $token = $r['body']['token'] ?? $r['body']['Token'] ?? null;
    $msg = $r['body']['message'] ?? '(sin mensaje)';
    echo "Login $user/$pass -> HTTP {$r['code']} | " . ($token ? '✅ TOKEN' : "❌ $msg") . "\n";
    if ($token && !$workingToken) {
        $workingToken = $token;
    }
}

if (!$workingToken) {
    echo "\nNo se pudo obtener token para ningún usuario.\n";
    exit;
}

echo "\n=== Token obtenido, ahora actualizar LARAVEL_GW ===\n";

// Obtener datos actuales de LARAVEL_GW (ID=18)
$gwData = cnGet("$base/User/GetUsuarioById?usuarioId=18", $workingToken);
echo "GetUsuarioById 18 -> HTTP {$gwData['code']}\n";
print_r($gwData['body']);

if ($gwData['code'] === 200 && is_array($gwData['body'])) {
    $newPass = 'LaravelGateway2026#';
    $payload = array_merge($gwData['body'], [
        'contrasena' => $newPass,
        'sesion_Iniciada' => 0,
    ]);
    $upd = cnPut("$base/User/UpdateUsuario?usuarioId=18", $payload, $workingToken);
    echo "\nUpdateUsuario 18 -> HTTP {$upd['code']}\n";
    print_r($upd['body']);
    
    // Logout para liberar la sesión del usuario que usamos
    cnPost("$base/Login/Logout", [], $workingToken);
    
    // Si cambio exitoso, hacer logout ya no toca. Ahora test login GW
    echo "\n=== Test login LARAVEL_GW con LaravelGateway2026# ===\n";
    $test = cnPost("$base/Login/Authentication", [
        'usuario' => 'LARAVEL_GW',
        'contrasena' => $newPass,
        'nombre_Notaria' => 'NOTARIA',
        'equipo' => 'Laravel-Test',
    ]);
    $gwToken = $test['body']['token'] ?? $test['body']['Token'] ?? null;
    $gwMsg = $test['body']['message'] ?? '';
    echo "Login LARAVEL_GW -> HTTP {$test['code']} | " . ($gwToken ? '✅ TOKEN OK' : "❌ $gwMsg") . "\n";
    if ($gwToken) {
        echo "Token (primeros 60): " . substr($gwToken, 0, 60) . "...\n";
        // Hacer logout del GW
        cnPost("$base/Login/Logout", [], $gwToken);
    }
}
