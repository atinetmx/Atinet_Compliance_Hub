<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$cnUserId = 9;
$plainPassword = 'pasword123';
$notariaId = DB::table('notarias')->where('tenant_db_name', 'atinet_compliance_hub')->value('id');

function testLogin(string $hash, string $password, int $cnUserId, int $notariaId, string $label): void
{
    // Actualizar hash y resetear sesión
    DB::table('tbl_cat_usuarios')->where('Id', $cnUserId)->update([
        'Contrasena' => $hash, 'Sesion_Iniciada' => 0,
    ]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $cnUserId)->delete();

    $cnUsuario = DB::table('tbl_cat_usuarios')->where('Id', $cnUserId)->value('Usuario');
    $payload = json_encode(['notaria' => (string) $notariaId, 'usuario' => $cnUsuario, 'contrasena' => $password, 'equipo' => 'test', 'model' => 'pc']);

    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 8]);
    $resp = curl_exec($ch);
    curl_close($ch);

    $body = json_decode($resp, true);
    $token = $body['dataResponse']['accessToken'] ?? null;
    $msg = $token ? '✅ TOKEN OK' : ('❌ '.($body['message'] ?? 'sin respuesta'));

    echo "[{$label}]\n";
    echo "  Hash:   {$hash}\n";
    echo "  Pass:   {$password}\n";
    echo "  Result: {$msg}\n\n";
}

// Generar con $2a$ prefix
$hash2a = str_replace('$2y$', '$2a$', password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 10]));
// Generar con $2b$ prefix
$hash2b = str_replace('$2y$', '$2b$', password_hash($plainPassword, PASSWORD_BCRYPT, ['cost' => 10]));
// Generar con cost=12 (default PHP moderno)
$hash2b12 = str_replace('$2y$', '$2b$', password_hash($plainPassword, PASSWORD_BCRYPT));

echo "=== Probando variantes de hash para '{$plainPassword}' ===\n\n";
testLogin($hash2a, $plainPassword, $cnUserId, $notariaId, '$2a$ cost=10');
testLogin($hash2b, $plainPassword, $cnUserId, $notariaId, '$2b$ cost=10');
testLogin($hash2b12, $plainPassword, $cnUserId, $notariaId, '$2b$ cost=12');

// También probar con '1010' que sabemos coincidía antes
$hash1010_2b = str_replace('$2y$', '$2b$', password_hash('1010', PASSWORD_BCRYPT, ['cost' => 10]));
$hash1010_2a = str_replace('$2y$', '$2a$', password_hash('1010', PASSWORD_BCRYPT, ['cost' => 10]));
echo "=== Probando con '1010' ===\n\n";
testLogin($hash1010_2b, '1010', $cnUserId, $notariaId, '1010 $2b$ cost=10');
testLogin($hash1010_2a, '1010', $cnUserId, $notariaId, '1010 $2a$ cost=10');
