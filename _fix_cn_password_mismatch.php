<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$user = DB::table('users')->where('id', 1)->first();
$cnUser = DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->first();

$plain = decrypt($user->cn_password);
$laravelPasswordHash = $user->password; // hash de "pasword123"

echo "=== Diagnóstico users.id=1 ===\n";
echo "email:          {$user->email}\n";
echo "cn_usuario_id:  {$user->cn_usuario_id} ({$cnUser->Usuario})\n";
echo "cn_password (decrypted): [{$plain}]\n";
echo 'Laravel password hash: '.substr($laravelPasswordHash, 0, 20)."...\n\n";

echo "=== tbl_cat_usuarios.Id={$cnUser->Id} ===\n";
echo "Contrasena: {$cnUser->Contrasena}\n";
echo 'PHP verify cn_password vs Contrasena: '.(password_verify($plain, $cnUser->Contrasena) ? '✅ MATCH' : '❌ NO MATCH')."\n";
echo "PHP verify 'pasword123' vs Contrasena: ".(password_verify('pasword123', $cnUser->Contrasena) ? '✅ MATCH' : '❌ NO MATCH')."\n\n";

// La contraseña CN correcta es la que hace match con Contrasena
if (password_verify('pasword123', $cnUser->Contrasena)) {
    $correctPlain = 'pasword123';
    echo ">>> La contraseña CN real es 'pasword123' — cn_password está MAL (tiene '1010')\n\n";
} elseif (password_verify($plain, $cnUser->Contrasena)) {
    echo ">>> cn_password y hash ya coinciden — no hay problema de contraseña\n";
    exit;
} else {
    // El hash es de 'pasword123' pero el $2b$ fresco no coincide
    // Necesitamos actualizar el hash con la contraseña de Laravel
    $correctPlain = 'pasword123';
    echo ">>> Ni '1010' ni 'pasword123' coinciden — regenerando hash desde cero\n\n";
}

// FIX: actualizar SUPERUSUARIO con hash de pasword123 y cn_password correcto
$nuevoHash = str_replace('$2y$', '$2b$', password_hash($correctPlain, PASSWORD_BCRYPT, ['cost' => 10]));
echo "Nuevo hash ($2b$): {$nuevoHash}\n";
echo "PHP verify '{$correctPlain}': ".(password_verify($correctPlain, $nuevoHash) ? '✅' : '❌')."\n\n";

// 1. Actualizar Contrasena en tbl_cat_usuarios
DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->update([
    'Contrasena' => $nuevoHash,
    'Sesion_Iniciada' => 0,
]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $user->cn_usuario_id)->delete();

// 2. Actualizar cn_password en users
DB::table('users')->where('id', 1)->update([
    'cn_password' => encrypt($correctPlain),
]);

echo "✅ Actualizados:\n";
echo "  - tbl_cat_usuarios.Id={$user->cn_usuario_id}.Contrasena = hash('{$correctPlain}')\n";
echo "  - users.id=1.cn_password = encrypt('{$correctPlain}')\n\n";

// Test C#
$notariaId = DB::table('notarias')->where('tenant_db_name', 'atinet_compliance_hub')->value('id');
$payload = json_encode([
    'notaria' => (string) $notariaId,
    'usuario' => $cnUser->Usuario,
    'contrasena' => $correctPlain,
    'equipo' => 'Laravel-Server',
    'model' => 'pc',
]);
echo "=== Test C# ===\n{$payload}\n";

$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$body = json_decode($resp, true);
$token = $body['dataResponse']['accessToken'] ?? null;
echo "HTTP {$code}: ".($body['message'] ?? '?')."\n";
if ($token) {
    echo '✅ TOKEN OBTENIDO: '.substr($token, 0, 80)."...\n";
} else {
    echo json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
}
