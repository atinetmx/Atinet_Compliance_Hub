<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

function resetSessions(): void
{
    DB::table('tbl_cat_usuarios')->where('Sesion_Iniciada', 1)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->truncate();
}

function cnLogin(string $usuario, string $pass): array
{
    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode(['usuario' => $usuario, 'contrasena' => $pass, 'nombre_Notaria' => 'NOTARIA', 'equipo' => 'Laravel-Server']),
        CURLOPT_HTTPHEADER     => ['Content-Type: application/json', 'Accept: application/json'],
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => false,
    ]);
    $body = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $code, 'body' => json_decode($body, true)];
}

resetSessions();

// Confirmar ADMIN/1010 sigue funcionando
$r = cnLogin('ADMIN', '1010');
$tkn = $r['body']['dataResponse']['accessToken'] ?? null;
echo 'ADMIN/1010: HTTP ' . $r['code'] . ' → ' . ($tkn ? 'JWT OK' : json_encode($r['body']['message'] ?? '')) . "\n";
resetSessions();

// Buscar contraseña CN real de ADMIN1 probando cada una con hash fresco
$candidates = ['password123', 'Password123', 'admin', 'admin123', '1010', 'Atinet2026', 'superadmin', 'Admin2026'];
echo "\n=== PROBANDO PASSWORDS PARA ADMIN1 (CN id=9) ===\n";

$found = null;
foreach ($candidates as $pwd) {
    $hash = str_replace('$2y$', '$2b$', password_hash($pwd, PASSWORD_BCRYPT, ['cost' => 10]));
    DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Contrasena' => $hash]);
    resetSessions();

    $r    = cnLogin('ADMIN1', $pwd);
    $tkn  = $r['body']['dataResponse']['accessToken'] ?? null;
    $msg  = is_array($r['body']['message'] ?? null)
          ? ($r['body']['message']['detalle'] ?? json_encode($r['body']['message']))
          : ($r['body']['message'] ?? '');
    echo "  ADMIN1 / '{$pwd}' → HTTP {$r['code']} → " . ($tkn ? 'JWT OK' : "FALLO: {$msg}") . "\n";

    if ($tkn) {
        $found = $pwd;
        DB::table('users')->where('id', 1)->update(['cn_password' => encrypt($pwd)]);
        echo "  users.id=1 cn_password guardado como '{$pwd}'\n";
        resetSessions();
        break;
    }
    resetSessions();
}

if (! $found) {
    echo "\n  Ninguna contraseña estándar funciona — revisando el hash original en DB...\n";
    // Mostrar hash actual en tbl_cat_usuarios id=9
    $cn9 = DB::selectOne("SELECT Contrasena FROM tbl_cat_usuarios WHERE Id = 9");
    echo "  Contrasena actual CN id=9: " . $cn9->Contrasena . "\n";
    echo "\n  ACCION NECESARIA: ¿Cuál fue la contraseña original con la que se creó ADMIN1 en C#?\n";
}
