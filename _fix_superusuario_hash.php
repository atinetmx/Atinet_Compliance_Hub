<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$user = DB::table('users')->where('email', 'admin@atinet.mx')->first();
$plain = decrypt($user->cn_password);

echo "=== Bytes exactos de la contraseña ===\n";
echo "Valor: [{$plain}]\n";
echo 'Longitud: '.strlen($plain)." chars\n";
echo 'Bytes hex: '.bin2hex($plain)."\n";

$hash = DB::table('tbl_cat_usuarios')->where('Id', 9)->value('Contrasena');
echo "\n=== Hash actual ===\n";
echo "Valor: [{$hash}]\n";
echo 'PHP verify: '.(password_verify($plain, $hash) ? 'MATCH' : 'NO MATCH')."\n";

// Hash limpio desde cero
$nuevoHash = str_replace('$2y$', '$2b$', password_hash($plain, PASSWORD_BCRYPT, ['cost' => 10]));
echo "\n=== Hash fresco ===\n";
echo "Valor: [{$nuevoHash}]\n";
echo 'PHP verify: '.(password_verify($plain, $nuevoHash) ? 'MATCH' : 'NO MATCH')."\n";

DB::table('tbl_cat_usuarios')->where('Id', 9)->update([
    'Contrasena' => $nuevoHash,
    'Sesion_Iniciada' => 0,
    'Numero_Notaria' => '11',
]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 9)->delete();
echo "\n✅ Hash actualizado y sesión reseteada\n";

// Test C#
sleep(1);
$notariaId = DB::table('notarias')->where('tenant_db_name', 'atinet_compliance_hub')->value('id');
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['notaria' => (string) $notariaId, 'usuario' => 'SUPERUSUARIO', 'contrasena' => $plain, 'equipo' => 'Laravel-Server', 'model' => 'pc']),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$body = json_decode($resp, true);
$token = $body['dataResponse']['accessToken'] ?? null;
echo "\n=== Test C# (notaria={$notariaId} usuario=SUPERUSUARIO pass=[{$plain}]) ===\n";
echo "HTTP {$code}: ".($body['message'] ?? '?')."\n";
if ($token) {
    echo '✅ TOKEN: '.substr($token, 0, 80)."...\n";
} else {
    echo json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
}
