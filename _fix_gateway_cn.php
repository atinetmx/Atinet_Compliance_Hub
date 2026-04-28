<?php
/**
 * _fix_gateway_cn.php  v2
 *
 * Estrategia:
 *  1. Resetear sesión de ADMIN (Id=1) directo en BD (conexión default)
 *  2. Login como ADMIN/1010 → obtener JWT de C#
 *  3. Con ese JWT llamar UpdateUsuario para LARAVEL_GW (Id=18)
 *     → C# genera internamente el hash correcto (BCrypt propio)
 *  4. Verificar que LARAVEL_GW ya puede loguear con la nueva contraseña
 *  5. Actualizar .env y limpiar cache
 */

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$cnBase = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

// ── Nueva contraseña para el gateway ────────────────────────────────────────
$newGwPassword = 'LaravelGW2026!';

echo "=== FIX GATEWAY CN v2 ===\n\n";

// ── Helpers curl ─────────────────────────────────────────────────────────────
function cnPost(string $url, array $data, ?string $token = null): array
{
    $ch = curl_init($url);
    $headers = ['Content-Type: application/json', 'Accept: application/json'];
    if ($token) {
        $headers[] = "Authorization: Bearer {$token}";
    }
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_HTTPHEADER     => $headers,
        CURLOPT_POSTFIELDS     => json_encode($data),
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'body' => $body, 'json' => json_decode($body, true) ?? []];
}

function cnGet(string $url, string $token): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER     => ['Accept: application/json', "Authorization: Bearer {$token}"],
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'body' => $body, 'json' => json_decode($body, true) ?? []];
}

function cnPut(string $url, array $data, string $token): array
{
    $ch = curl_init($url);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST  => 'PUT',
        CURLOPT_HTTPHEADER     => [
            'Content-Type: application/json',
            'Accept: application/json',
            "Authorization: Bearer {$token}",
        ],
        CURLOPT_POSTFIELDS     => json_encode($data),
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT        => 15,
    ]);
    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['status' => $status, 'body' => $body, 'json' => json_decode($body, true) ?? []];
}

function extractToken(array $resp): ?string
{
    $j = $resp['json'];
    return $j['dataResponse']['accessToken']
        ?? $j['token']
        ?? $j['Token']
        ?? $j['access_token']
        ?? null;
}

// ── Paso 1: Estado actual ────────────────────────────────────────────────────
echo "1. Estado en tbl_cat_usuarios (Id 1, 9, 18)...\n";
$rows = DB::table('tbl_cat_usuarios')
    ->whereIn('Id', [1, 9, 18])
    ->select('Id', 'Usuario', 'Sesion_Iniciada', 'Activo')
    ->get();
foreach ($rows as $row) {
    echo "   Id={$row->Id} Usuario={$row->Usuario} Sesion={$row->Sesion_Iniciada} Activo={$row->Activo}\n";
}
echo "\n";

// ── Paso 2: Resetear sesión de ADMIN (Id=1) ──────────────────────────────────
echo "2. Reseteando sesion de ADMIN (Id=1)...\n";
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 1)->delete();
echo "   OK\n\n";

// ── Paso 3: Login como ADMIN/1010 ────────────────────────────────────────────
echo "3. Login ADMIN/1010...\n";
$loginResp = cnPost("{$cnBase}/Login/Authentication", [
    'usuario'        => 'ADMIN',
    'contrasena'     => '1010',
    'nombre_Notaria' => 'NOTARIA',
    'equipo'         => 'Laravel-Fix',
]);

$adminJwt = extractToken($loginResp);
if (! $adminJwt) {
    echo "   ERROR {$loginResp['status']}: {$loginResp['body']}\n";
    exit(1);
}
echo "   JWT OK: " . substr($adminJwt, 0, 50) . "...\n\n";

// ── Paso 4: Obtener datos actuales de LARAVEL_GW (Id=18) ─────────────────────
echo "4. Datos actuales de LARAVEL_GW (Id=18)...\n";
$gwGetResp = cnGet("{$cnBase}/User/GetUsuarioById?usuarioId=18", $adminJwt);

if ($gwGetResp['status'] !== 200 || empty($gwGetResp['json'])) {
    echo "   ERROR {$gwGetResp['status']}: {$gwGetResp['body']}\n";
    exit(1);
}

// C# envuelve los datos en dataResponse
$gwData = $gwGetResp['json']['dataResponse'] ?? $gwGetResp['json'];

if (empty($gwData)) {
    echo "   ERROR: dataResponse vacío. Body: {$gwGetResp['body']}\n";
    exit(1);
}
echo "   Usuario: " . ($gwData['usuario'] ?? '?') . "\n";
echo "   Activo: " . json_encode($gwData['activo'] ?? null) . "\n\n";

// ── Paso 5: Actualizar contraseña de LARAVEL_GW vía C# ───────────────────────
echo "5. Actualizando contrasena de LARAVEL_GW a '{$newGwPassword}'...\n";
$payload  = array_merge($gwData, ['contrasena' => $newGwPassword]);
$putResp  = cnPut("{$cnBase}/User/UpdateUsuario?usuarioId=18", $payload, $adminJwt);

if ($putResp['status'] < 200 || $putResp['status'] >= 300) {
    echo "   ERROR {$putResp['status']}: {$putResp['body']}\n";
    exit(1);
}
echo "   Respuesta ({$putResp['status']}): " . substr($putResp['body'], 0, 150) . "\n";
echo "   UPDATE OK\n\n";

// ── Paso 6: Verificar login de LARAVEL_GW ────────────────────────────────────
echo "6. Verificando login LARAVEL_GW/{$newGwPassword}...\n";
DB::table('tbl_cat_usuarios')->where('Id', 18)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 18)->delete();

$gwLoginResp = cnPost("{$cnBase}/Login/Authentication", [
    'usuario'        => 'LARAVEL_GW',
    'contrasena'     => $newGwPassword,
    'nombre_Notaria' => 'NOTARIA',
    'equipo'         => 'Laravel-Fix',
]);

$gwJwt = extractToken($gwLoginResp);
if (! $gwJwt) {
    echo "   FALLO {$gwLoginResp['status']}: {$gwLoginResp['body']}\n";
    exit(1);
}
echo "   GATEWAY JWT OK!\n\n";

// ── Paso 7: Actualizar .env ───────────────────────────────────────────────────
echo "7. Actualizando .env...\n";
$envPath    = __DIR__ . '/.env';
$envContent = file_get_contents($envPath);
$envContent = preg_replace(
    '/^CONTROL_NOTARIAL_GW_PASSWORD=.*/m',
    "CONTROL_NOTARIAL_GW_PASSWORD=\"{$newGwPassword}\"",
    $envContent
);
file_put_contents($envPath, $envContent);
echo "   CONTROL_NOTARIAL_GW_PASSWORD=\"{$newGwPassword}\"\n\n";

// ── Paso 8: Limpiar cache ─────────────────────────────────────────────────────
echo "8. Limpiando cache Laravel...\n";
Artisan::call('cache:clear');
echo "   OK\n\n";

echo "=== GATEWAY ARREGLADO ===\n";
echo "Contrasena del gateway: {$newGwPassword}\n";
echo "Ahora puedes correr --reset-cn para los demas usuarios.\n";
