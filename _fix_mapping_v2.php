<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;

echo "=== ESTADO ACTUAL ===\n";
foreach (DB::select("SELECT id, email, cn_usuario_id FROM users WHERE id IN (1,11)") as $r) {
    echo "  users.id={$r->id} | {$r->email} | cn_usuario_id={$r->cn_usuario_id}\n";
}
foreach (DB::select("SELECT Id, Usuario, Correo FROM tbl_cat_usuarios WHERE Id IN (1,9)") as $r) {
    echo "  CN.id={$r->Id} | {$r->Usuario} | {$r->Correo}\n";
}

// Fix 1: mapeo correcto
// users.id=1  (admin@atinet.mx,     pass=password123) → cn_usuario_id=9 (ADMIN1)
// users.id=11 (admin@atinet.com.mx, pass=1010)        → cn_usuario_id=1 (ADMIN)
DB::table('users')->where('id', 1)->update(['cn_usuario_id' => 9]);
DB::table('users')->where('id', 11)->update(['cn_usuario_id' => 1]);
echo "\nFix 1: cn_usuario_id corregido\n";

// Fix 2: correos en CN
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Correo' => 'admin@atinet.mx']);
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Correo' => 'admin@atinet.com.mx']);
echo "Fix 2: correos CN corregidos\n";

// Fix 3: cn_password cifrado con la contraseña CN real de cada usuario
DB::table('users')->where('id', 1)->update(['cn_password' => encrypt('password123')]);
DB::table('users')->where('id', 11)->update(['cn_password' => encrypt('1010')]);
echo "Fix 3: cn_password actualizados\n";

// Fix 4: hash BCrypt $2b$ en tbl_cat_usuarios.Contrasena
$hashP123 = str_replace('$2y$', '$2b$', password_hash('password123', PASSWORD_BCRYPT, ['cost' => 10]));
$hash1010 = str_replace('$2y$', '$2b$', password_hash('1010',        PASSWORD_BCRYPT, ['cost' => 10]));
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Contrasena' => $hashP123]);
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Contrasena' => $hash1010]);
echo "Fix 4: Contrasena BCrypt actualizados\n";

// Fix 5: Numero_Notaria correcta para cada CN
//   ADMIN1 (id=9) es de admin@atinet.mx → notaría 2
//   ADMIN  (id=1) es de admin@atinet.com.mx → notaría 2 también (misma notaría)
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Numero_Notaria' => '2']);
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Numero_Notaria' => '2']);
echo "Fix 5: Numero_Notaria=2 para ambos\n";

// Reset sesiones
DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->truncate();
echo "\nSesiones reseteadas.\n";

echo "\n=== VERIFICACION FINAL ===\n";
foreach (DB::select("
    SELECT u.id, u.email, u.cn_usuario_id,
           cn.Usuario AS cn_usuario, cn.Correo AS cn_correo, cn.Numero_Notaria
    FROM users u
    JOIN tbl_cat_usuarios cn ON cn.Id = u.cn_usuario_id
    WHERE u.id IN (1,11)
") as $m) {
    $ok = ($m->email === $m->cn_correo) ? 'OK' : '*** DIFERENTE ***';
    echo "  Laravel[{$m->id}] {$m->email} → CN[{$m->cn_usuario_id}] {$m->cn_usuario} | correo:{$m->cn_correo} [{$ok}] | Notaria:{$m->Numero_Notaria}\n";
}

echo "\n=== TEST C# LOGIN ===\n";
$tests = [
    ['usuario' => 'ADMIN1', 'contrasena' => 'password123', 'label' => 'ADMIN1/password123 (users.id=1)'],
    ['usuario' => 'ADMIN',  'contrasena' => '1010',        'label' => 'ADMIN/1010 (users.id=11)'],
];
foreach ($tests as $t) {
    DB::table('tbl_cat_usuarios')->where('Sesion_Iniciada', 1)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->truncate();

    $payload = json_encode([
        'usuario'        => $t['usuario'],
        'contrasena'     => $t['contrasena'],
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
    $body   = curl_exec($ch);
    $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    $decoded = json_decode($body, true);
    $token   = $decoded['token'] ?? $decoded['Token'] ?? null;
    $result  = $token
        ? 'JWT OK: ' . substr($token, 0, 40) . '...'
        : 'FALLO: ' . ($decoded['message']['detalle'] ?? $body);

    echo "  [{$t['label']}] HTTP {$status} → {$result}\n";
}
