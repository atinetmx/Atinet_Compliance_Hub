<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

// Descubrir la contraseña CN real de ADMIN1 (CN id=9) probando distintos passwords
// Prueba: poner hash conocido → testear contra C# → si falla, el problema es otro

function resetSessions(): void {
    DB::table('tbl_cat_usuarios')->where('Sesion_Iniciada', 1)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->truncate();
}

function cnLogin(string $usuario, string $pass): array {
    $payload = json_encode([
        'usuario'        => $usuario,
        'contrasena'     => $pass,
        'nombre_Notaria' => 'NOTARIA',
        'equipo'         => 'Laravel-Server',
    ]);
    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json', 'Accept: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($body, true)];
}

resetSessions();

// Confirmar que ADMIN/1010 sigue funcionando
$r = cnLogin('ADMIN', '1010');
$token = $r['body']['dataResponse']['accessToken'] ?? null;
echo 'ADMIN/1010: HTTP ' . $r['code'] . ' → ' . ($token ? 'JWT OK' : ($r['body']['message'] ?? 'sin token')) . "\n";
resetSessions();

// Probar ADMIN1 con distintas contraseñas — cada vez ponemos hash conocido en DB
$toTry = ['password123', 'Password123', 'admin', 'admin123', '1010', 'Atinet2026', 'superadmin'];

echo "\n=== PROBANDO PASSWORDS PARA ADMIN1 (CN id=9) ===\n";
foreach ($toTry as $pwd) {
    // Poner hash fresco en DB
    $hash = str_replace('$2y$', '$2b$', password_hash($pwd, PASSWORD_BCRYPT, ['cost' => 10]));
    DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Contrasena' => $hash]);
    resetSessions();

    $r = cnLogin('ADMIN1', $pwd);
    $token = $r['body']['dataResponse']['accessToken'] ?? null;
    $msg   = is_array($r['body']['message'] ?? null)
           ? ($r['body']['message']['detalle'] ?? json_encode($r['body']['message']))
           : ($r['body']['message'] ?? '');
    $result = $token ? 'JWT OK ✅' : "FALLO: {$msg}";
    echo "  ADMIN1 / '{$pwd}' → HTTP {$r['code']} → {$result}\n";

    if ($token) {
        // Guardar la contraseña que funciona en users.cn_password
        DB::table('users')->where('id', 1)->update(['cn_password' => encrypt($pwd)]);
        echo "  cn_password de users.id=1 actualizado a '{$pwd}'\n";
        break;
    }
    resetSessions();
}

echo "\n=== ESTADO FINAL ===\n";
foreach (DB::select("
    SELECT u.id, u.email, u.cn_usuario_id, cn.Usuario AS cn_usuario
    FROM users u JOIN tbl_cat_usuarios cn ON cn.Id = u.cn_usuario_id
    WHERE u.id IN (1,11)
") as $m) {
    echo "  Laravel[{$m->id}] {$m->email} → CN[{$m->cn_usuario_id}] {$m->cn_usuario}\n";
}
?>

$base = 'http://192.168.1.1:5000/api';

function cnPost(string $url, array $body, ?string $tok = null): array {
    $ch = curl_init($url);
    $h = ['Content-Type: application/json', 'Accept: application/json'];
    if ($tok) { $h[] = "Authorization: Bearer {$tok}"; }
    curl_setopt_array($ch, [CURLOPT_POST=>true, CURLOPT_POSTFIELDS=>json_encode($body), CURLOPT_HTTPHEADER=>$h, CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>10, CURLOPT_SSL_VERIFYPEER=>false]);
    $r = curl_exec($ch); $c = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return ['code' => $c, 'data' => json_decode($r, true) ?? $r];
}

function cnGet(string $url, string $tok): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_HTTPHEADER=>["Authorization: Bearer {$tok}", 'Accept: application/json'], CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>10, CURLOPT_SSL_VERIFYPEER=>false]);
    $r = curl_exec($ch); $c = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return ['code' => $c, 'data' => json_decode($r, true) ?? $r];
}

function cnPut(string $url, array $body, string $tok): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST=>'PUT', CURLOPT_POSTFIELDS=>json_encode($body), CURLOPT_HTTPHEADER=>["Authorization: Bearer {$tok}", 'Content-Type: application/json', 'Accept: application/json'], CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>10, CURLOPT_SSL_VERIFYPEER=>false]);
    $r = curl_exec($ch); $c = curl_getinfo($ch, CURLINFO_HTTP_CODE); curl_close($ch);
    return ['code' => $c, 'data' => json_decode($r, true) ?? $r];
}

function clearSessions(): void {
    DB::update("UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0");
    try { DB::delete("DELETE FROM tbl_log_sesiones_activas"); } catch (\Exception $e) {}
}

function restartPool(): void {
    $appcmd = getenv('SystemRoot') . '\system32\inetsrv\appcmd.exe';
    shell_exec("\"$appcmd\" stop apppool /apppool.name:\"SCN\""); sleep(2);
    shell_exec("\"$appcmd\" start apppool /apppool.name:\"SCN\""); sleep(4);
    echo "App Pool reiniciado\n";
}

function msgStr(mixed $msg): string {
    if (is_array($msg)) { return $msg['mensaje'] ?? json_encode($msg); }
    return (string)$msg;
}

clearSessions();
restartPool();

// Test ADMIN con múltiples contraseñas
$candidates = ['admin', 'Admin', 'admin123', 'Admin123', 'Admin2026', 'Atinet2026#', 'GatewayAtinet2026', '12345', 'password123', 'Admin2024', 'atinet'];
$adminToken = null;
foreach ($candidates as $p) {
    $r = cnPost("{$base}/Login/Authentication", ['usuario' => 'ADMIN', 'contrasena' => $p]);
    $msg = msgStr($r['data']['message'] ?? '');
    $inner = is_array($r['data']['message'] ?? null) ? ($r['data']['message']['excepcion_Interna'] ?? '') : '';
    echo "ADMIN/{$p}: HTTP {$r['code']} | {$msg}" . ($inner ? " | inner: {$inner}" : '') . "\n";
    if ($r['data']['token'] ?? null) {
        $adminToken = $r['data']['token'];
        echo "   ✅ TOKEN obtenido para ADMIN!\n";
        break;
    }
    clearSessions();
    usleep(500000);
}

if ($adminToken) {
    $gwId = DB::selectOne("SELECT Id FROM tbl_cat_usuarios WHERE Usuario = 'LARAVEL_GW'")?->Id ?? 18;
    $gw = cnGet("{$base}/User/GetUsuarioById?usuarioId={$gwId}", $adminToken);
    echo "\nGetUsuarioById({$gwId}): HTTP {$gw['code']}\n";
    if ($gw['code'] === 200 && is_array($gw['data'])) {
        $payload = array_merge($gw['data'], ['contrasena' => 'LaravelGateway2026#', 'sesion_Iniciada' => 0]);
        $upd = cnPut("{$base}/User/UpdateUsuario?usuarioId={$gwId}", $payload, $adminToken);
        echo "UpdateUsuario: HTTP {$upd['code']} | " . json_encode($upd['data']) . "\n";
        if ($upd['code'] === 200) { echo "✅ LARAVEL_GW password actualizado via C#\n"; }
    }
    cnPost("{$base}/Login/Logout", [], $adminToken);
    clearSessions();
    sleep(1);
}

// Test LARAVEL_GW
$r2 = cnPost("{$base}/Login/Authentication", ['usuario' => 'LARAVEL_GW', 'contrasena' => 'LaravelGateway2026#']);
echo "\nLARAVEL_GW/LaravelGateway2026#: HTTP {$r2['code']} | " . msgStr($r2['data']['message'] ?? '') . "\n";
if ($r2['data']['token'] ?? null) {
    echo "✅ LARAVEL_GW autenticado! JWT listo.\n";
    cnPost("{$base}/Login/Logout", [], $r2['data']['token']);
    clearSessions();
}
