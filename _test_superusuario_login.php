<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Reset sesión
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 9)->delete();

$user = DB::table('users')->where('email', 'admin@atinet.mx')->first();
$cnUser = DB::table('tbl_cat_usuarios')->where('Id', 9)->first();
$notaria = DB::table('notarias')->where('tenant_db_name', 'atinet_compliance_hub')->first();
$plain = decrypt($user->cn_password);

echo "Notaria master: id={$notaria->id} tenant_db_name={$notaria->tenant_db_name}\n";
echo "SUPERUSUARIO: Id={$cnUser->Id} Usuario={$cnUser->Usuario} Numero_Notaria={$cnUser->Numero_Notaria}\n";
echo "cn_password decrypted: {$plain}\n\n";

// Test login
$payload = json_encode([
    'notaria' => (string) $notaria->id,
    'usuario' => $cnUser->Usuario,
    'contrasena' => $plain,
    'equipo' => 'Laravel-Server',
    'model' => 'pc',
]);
echo "POST /api/Login/Authentication\n{$payload}\n\n";

$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 15,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP {$code}:\n";
$body = json_decode($resp, true);
echo json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";

$token = $body['dataResponse']['accessToken'] ?? $body['token'] ?? $body['Token'] ?? null;
if ($token) {
    echo "\n✅ LOGIN EXITOSO — Token: ".substr($token, 0, 100)."...\n";
} else {
    echo "\n❌ Login fallido: ".($body['message'] ?? 'sin mensaje')."\n";
    echo "- Verifica que la C# API lea la tabla 'notarias' en tiempo real (no caché de startup)\n";
    echo "- Verifica que tenant_db_name='atinet_compliance_hub' sea accesible desde la C# API\n";
}
