<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$base     = env('CONTROL_NOTARIAL_INTERNAL_URL', 'http://192.168.1.1:5000/api');
$newGwPass = 'LaravelGateway2026#';

function cnApi(string $method, string $base, string $ep, array $body = [], ?string $tok = null): array {
    $ch = curl_init("{$base}/{$ep}");
    $h = ['Content-Type: application/json', 'Accept: application/json'];
    if ($tok) { $h[] = "Authorization: Bearer {$tok}"; }
    $opts = [CURLOPT_HTTPHEADER=>$h, CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>10, CURLOPT_SSL_VERIFYPEER=>false];
    if ($method === 'POST') { $opts[CURLOPT_POST] = true; $opts[CURLOPT_POSTFIELDS] = json_encode($body); }
    if ($method === 'PUT')  { $opts[CURLOPT_CUSTOMREQUEST] = 'PUT'; $opts[CURLOPT_POSTFIELDS] = json_encode($body); }
    curl_setopt_array($ch, $opts);
    $r = curl_exec($ch); $c = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return ['code' => $c, 'data' => json_decode($r, true) ?? $r];
}

// 1. Reset sesiones
DB::update("UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0");
try { DB::delete("DELETE FROM tbl_log_sesiones_activas"); echo "tbl_log_sesiones_activas vaciada\n"; }
catch (\Exception $e) { echo "Advertencia sesiones: " . $e->getMessage() . "\n"; }

// 2. Reiniciar App Pool
$appcmd = getenv('SystemRoot') . '\system32\inetsrv\appcmd.exe';
shell_exec("\"$appcmd\" stop apppool /apppool.name:\"SCN\""); sleep(2);
shell_exec("\"$appcmd\" start apppool /apppool.name:\"SCN\""); sleep(3);
echo "App Pool SCN reiniciado\n";

// 3. Login ADMIN
$r = cnApi('POST', $base, 'Login/Authentication', ['usuario' => 'ADMIN', 'contrasena' => 'admin']);
$adminToken = $r['data']['token'] ?? null;
if (!$adminToken) { echo "ADMIN login FALLO: " . json_encode($r['data']) . "\n"; exit; }
echo "ADMIN login OK\n";

// 4. Actualizar LARAVEL_GW via C# API
$gw = cnApi('GET', $base, 'User/GetUsuarioById?usuarioId=18', [], $adminToken);
echo "GetUsuarioById: HTTP {$gw['code']}\n";
if ($gw['code'] === 200 && is_array($gw['data'])) {
    $payload = array_merge($gw['data'], ['contrasena' => $newGwPass, 'sesion_Iniciada' => 0]);
    $upd = cnApi('PUT', $base, 'User/UpdateUsuario?usuarioId=18', $payload, $adminToken);
    echo "UpdateUsuario: HTTP {$upd['code']} | " . (is_string($upd['data']['message'] ?? null) ? $upd['data']['message'] : json_encode($upd['data'])) . "\n";
}

// Logout ADMIN
cnApi('POST', $base, 'Login/Logout', [], $adminToken);
DB::update("UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0");
try { DB::delete("DELETE FROM tbl_log_sesiones_activas"); } catch (\Exception $e) {}
sleep(1);

// 5. Test LARAVEL_GW
$r2 = cnApi('POST', $base, 'Login/Authentication', ['usuario' => 'LARAVEL_GW', 'contrasena' => $newGwPass]);
$gwTok = $r2['data']['token'] ?? null;
if ($gwTok) {
    echo "LARAVEL_GW login OK - JWT obtenido\n";
    echo "Token: " . substr($gwTok, 0, 60) . "...\n";
    cnApi('POST', $base, 'Login/Logout', [], $gwTok);
} else {
    echo "LARAVEL_GW FALLO: " . json_encode($r2['data']) . "\n";
}
