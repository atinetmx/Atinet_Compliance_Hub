<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Verificar el hash byte a byte
$hash = DB::table('tbl_cat_usuarios')->where('Id', 9)->value('Contrasena');
echo "Hash SUPERUSUARIO (Id=9):\n";
echo "  Valor:    [{$hash}]\n";
echo '  Longitud: '.strlen($hash)." chars (BCrypt estándar = 60)\n";
echo '  Hex:      '.bin2hex($hash)."\n\n";

// Verificar si hay caracteres invisibles
$clean = trim($hash);
echo "  Con trim: [{$clean}]\n";
echo '  Igual tras trim: '.($hash === $clean ? 'SÍ' : '❌ DIFERENTE — hay espacios/newlines')."\n\n";

// Verificar Sesion_Iniciada y Activo
$u = DB::table('tbl_cat_usuarios')->where('Id', 9)->first(['Id', 'Usuario', 'Sesion_Iniciada', 'Activo', 'Numero_Notaria']);
echo "Estado actual: Sesion_Iniciada={$u->Sesion_Iniciada} Activo={$u->Activo} Numero_Notaria={$u->Numero_Notaria}\n\n";

// Hacer login y verificar inmediatamente si C# cambió Sesion_Iniciada
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 9)->delete();

$plain = decrypt(DB::table('users')->where('id', 1)->value('cn_password'));
$notariaId = DB::table('notarias')->where('tenant_db_name', 'atinet_compliance_hub')->value('id');

$payload = json_encode([
    'notaria' => (string) $notariaId,
    'usuario' => 'SUPERUSUARIO',
    'contrasena' => $plain,
    'equipo' => 'Laravel-Server',
    'model' => 'pc',
]);

$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
$resp = curl_exec($ch);
curl_close($ch);

$body = json_decode($resp, true);
echo 'Respuesta C#: '.($body['message'] ?? $resp)."\n";

// Ver Sesion_Iniciada DESPUÉS del intento
$after = DB::table('tbl_cat_usuarios')->where('Id', 9)->value('Sesion_Iniciada');
echo "Sesion_Iniciada luego del intento: {$after}\n";
$sesiones = DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 9)->count();
echo "Registros en tbl_log_sesiones_activas: {$sesiones}\n\n";

// Probar también con ADMIN (Id=1) que tiene el mismo password
echo "=== Test con ADMIN (Id=1) en notaria=11 ===\n";
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 1)->delete();

$payload2 = json_encode(['notaria' => (string) $notariaId, 'usuario' => 'ADMIN', 'contrasena' => $plain, 'equipo' => 'Laravel-Server', 'model' => 'pc']);
$ch2 = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch2, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload2, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
$resp2 = curl_exec($ch2);
curl_close($ch2);
$body2 = json_decode($resp2, true);
echo 'ADMIN login: '.($body2['message'] ?? $resp2)."\n";
$token2 = $body2['dataResponse']['accessToken'] ?? null;
if ($token2) {
    echo '✅ Token: '.substr($token2, 0, 60)."...\n";
}
