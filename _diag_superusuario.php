<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo "=== users con cn_usuario_id (superadmins) ===\n";
$users = $pdo->query('SELECT id, name, email, notaria_id, cn_usuario_id, cn_rol_id FROM users WHERE cn_usuario_id IS NOT NULL ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    print_r($u);
}

echo "\n=== tbl_cat_usuarios (todos) ===\n";
$cns = $pdo->query('SELECT Id, Usuario, Nombre, Numero_Notaria, Tipo, Activo, Sesion_Iniciada FROM tbl_cat_usuarios ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cns as $cn) {
    echo "  Id={$cn['Id']} Usuario={$cn['Usuario']} Numero_Notaria={$cn['Numero_Notaria']} Tipo={$cn['Tipo']} Activo={$cn['Activo']}\n";
}

echo "\n=== notarias ===\n";
$ns = $pdo->query('SELECT id, nombre, tenant_db_name FROM notarias')->fetchAll(PDO::FETCH_ASSOC);
foreach ($ns as $n) {
    echo "  id={$n['id']} nombre={$n['nombre']} db={$n['tenant_db_name']}\n";
}

// Check if SUPERUSUARIO exists in any tenant DB
echo "\n=== SUPERUSUARIO in tenant DBs ===\n";
foreach ($ns as $n) {
    try {
        $t = new PDO("mysql:host=localhost;port=3307;dbname={$n['tenant_db_name']}", 'atinet_app', 'Atinet2026#Secure');
        $su = $t->query("SELECT Id, Usuario, Numero_Notaria, Activo FROM tbl_cat_usuarios WHERE Usuario='SUPERUSUARIO'")->fetch(PDO::FETCH_ASSOC);
        if ($su) {
            echo "  FOUND in {$n['tenant_db_name']}: Id={$su['Id']} Numero_Notaria={$su['Numero_Notaria']}\n";
        } else {
            echo "  NOT in {$n['tenant_db_name']}\n";
        }
    } catch (Exception $e) {
        echo "  ERROR {$n['tenant_db_name']}: {$e->getMessage()}\n";
    }
}

// Test actual C# login with notaria=2 (the Numero_Notaria of SUPERUSUARIO if it's 2)
echo "\n=== Test C# login SUPERUSUARIO with notaria from Numero_Notaria ===\n";
$su = $pdo->query('SELECT Id, Usuario, Numero_Notaria FROM tbl_cat_usuarios WHERE Id=9')->fetch(PDO::FETCH_ASSOC);
echo "  Numero_Notaria in master: {$su['Numero_Notaria']}\n";

// Also test what C# returns with notaria='2' (the Numero_Notaria value)
$payload = json_encode(['notaria' => $su['Numero_Notaria'], 'usuario' => 'SUPERUSUARIO', 'contrasena' => 'Test1234!', 'equipo' => 'Diag', 'model' => 'PC']);
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_HTTPHEADER => ['Content-Type: application/json'], CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$body = json_decode($resp, true);
echo "  C# with notaria={$su['Numero_Notaria']}: HTTP {$code} → ".($body['message'] ?? $resp)."\n";

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== SUPER_USUARIO: estado actual ===\n\n";

// 1. Usuario super_admin en Laravel
$su = DB::table('users')->where('tipo_cuenta', 'super_admin')->get();
foreach ($su as $u) {
    echo "Laravel user: {$u->email}\n";
    echo "  cn_usuario_id: {$u->cn_usuario_id}\n";
    echo '  cn_password: '.(! empty($u->cn_password) ? 'SET' : 'VACÍO')."\n";
    echo "  notaria_id: {$u->notaria_id}\n\n";
}

// 2. Todos los registros en tbl_cat_usuarios del master
echo "=== tbl_cat_usuarios (master, todos) ===\n";
$rows = DB::table('tbl_cat_usuarios')->get();
foreach ($rows as $r) {
    echo "Id={$r->Id} Usuario={$r->Usuario} Rol_Id={$r->Rol_Id} Numero_Notaria={$r->Numero_Notaria} Tipo={$r->Tipo} Sesion_Iniciada={$r->Sesion_Iniciada}\n";
    echo "  Hash: {$r->Contrasena}\n";
}

// 3. Intentar descifrar cn_password de super_admin
$su = DB::table('users')->where('tipo_cuenta', 'super_admin')->first();
if ($su && $su->cn_usuario_id && $su->cn_password) {
    try {
        $plain = decrypt($su->cn_password);
        echo "\n=== cn_password descifrado: '{$plain}' ===\n";
        // Verificar contra el hash en tbl_cat_usuarios
        $hash = DB::table('tbl_cat_usuarios')->where('Id', $su->cn_usuario_id)->value('Contrasena');
        echo "Hash en BD: {$hash}\n";
        $hash2y = str_replace('$2b$', '$2y$', $hash);
        echo 'PHP verify: '.(password_verify($plain, $hash2y) ? 'OK ✅' : 'FALLO ❌')."\n";
    } catch (\Throwable $e) {
        echo "\nError al descifrar cn_password: ".$e->getMessage()."\n";
    }
}

// 4. Test directo de login con SUPERUSUARIO en C#
echo "\n=== Test login C# con notaria=0 ===\n";
$cnUser = DB::table('tbl_cat_usuarios')->where('Id', $su->cn_usuario_id ?? 9)->first();
if ($cnUser && $su->cn_password) {
    try {
        $plain = decrypt($su->cn_password);
        $payload = json_encode(['notaria' => '0', 'usuario' => $cnUser->Usuario, 'contrasena' => $plain, 'equipo' => 'Laravel-Test', 'model' => 'pc']);
        echo "Payload: {$payload}\n";
        $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
        $resp = curl_exec($ch);
        $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        $body = json_decode($resp, true);
        $token = $body['dataResponse']['accessToken'] ?? $body['token'] ?? null;
        echo "HTTP {$code}: ".($token ? '✅ TOKEN OBTENIDO' : '❌ '.($body['message'] ?? $resp))."\n";
        echo 'Full: '.json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
    } catch (\Throwable $e) {
        echo 'Error: '.$e->getMessage()."\n";
    }
}
