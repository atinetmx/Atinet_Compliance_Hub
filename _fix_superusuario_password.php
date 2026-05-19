<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// La contraseña de login de users.id=1 es "pasword123"
// El UserObserver sincroniza users.password → tbl_cat_usuarios.Contrasena ($2b$)
// → la contraseña real de SUPERUSUARIO en C# ES "pasword123", no "1010"
// → cn_password en users.id=1 debe ser "pasword123"

$newCnPassword = 'pasword123';
$user = DB::table('users')->where('id', 1)->first(['id', 'cn_usuario_id', 'cn_password', 'password']);

echo "=== Diagnóstico previo ===\n";
echo "cn_usuario_id: {$user->cn_usuario_id}\n";
echo "cn_password actual: '".decrypt($user->cn_password)."'\n\n";

// Verificar que "pasword123" hace match con el hash actual de SUPERUSUARIO
$hashCN = DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->value('Contrasena');
echo "Hash SUPERUSUARIO: {$hashCN}\n";
echo "verify('pasword123'): ".(password_verify($newCnPassword, $hashCN) ? '✅ MATCH' : '❌ NO')."\n";
echo "verify('1010'):      ".(password_verify('1010', $hashCN) ? '✅ MATCH' : '❌ NO')."\n\n";

if (! password_verify($newCnPassword, $hashCN)) {
    echo "Hash no coincide — regenerando desde users.password...\n";
    // El UserObserver haría: str_replace($2y$ → $2b$, users.password)
    $newHash = str_replace('$2y$', '$2b$', $user->password);
    echo "Hash derivado de users.password: {$newHash}\n";
    echo "verify('pasword123') sobre hash derivado: ".(password_verify($newCnPassword, $newHash) ? '✅' : '❌')."\n\n";
    if (password_verify($newCnPassword, $newHash)) {
        DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)
            ->update(['Contrasena' => $newHash, 'Sesion_Iniciada' => 0]);
        DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $user->cn_usuario_id)->delete();
        echo "Hash de SUPERUSUARIO actualizado.\n";
        $hashCN = $newHash;
    } else {
        // Forzar nuevo hash directo
        $newHash2 = str_replace('$2y$', '$2b$', password_hash($newCnPassword, PASSWORD_BCRYPT, ['cost' => 10]));
        DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)
            ->update(['Contrasena' => $newHash2, 'Sesion_Iniciada' => 0]);
        DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $user->cn_usuario_id)->delete();
        echo "Hash forzado para '{$newCnPassword}': {$newHash2}\n";
        $hashCN = $newHash2;
    }
}

// Actualizar cn_password del user a "pasword123"
DB::table('users')->where('id', 1)->update(['cn_password' => encrypt($newCnPassword)]);
echo "cn_password users.id=1 → '{$newCnPassword}'\n\n";

// Limpiar caché JWT
\Illuminate\Support\Facades\Cache::forget('cn_jwt_user_'.$user->cn_usuario_id);

// Test inmediato
DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->update(['Sesion_Iniciada' => 0]);
$cnUsuario = DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->value('Usuario');
$notariaId = DB::table('notarias')->where('tenant_db_name', 'atinet_compliance_hub')->value('id');

$payload = json_encode(['notaria' => (string) $notariaId, 'usuario' => $cnUsuario, 'contrasena' => $newCnPassword, 'equipo' => 'Laravel-Server', 'model' => 'pc']);
echo "=== Test C# ===\n{$payload}\n";

$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
$resp = curl_exec($ch);
curl_close($ch);

$body = json_decode($resp, true);
$token = $body['dataResponse']['accessToken'] ?? null;
if ($token) {
    echo "✅ LOGIN EXITOSO\nToken: ".substr($token, 0, 100)."...\n";
    echo 'Sesion_Iniciada: '.DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->value('Sesion_Iniciada')."\n";
} else {
    echo '❌ '.($body['message'] ?? json_encode($body))."\n";
}
