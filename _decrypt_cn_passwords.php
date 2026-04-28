<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Leer cn_password encriptado de usuarios que tienen cn_usuario_id
$users = DB::table('users')
    ->whereNotNull('cn_usuario_id')
    ->whereNotNull('cn_password')
    ->select('id', 'email', 'cn_usuario_id', 'cn_password')
    ->get();

foreach ($users as $u) {
    try {
        $plain = decrypt($u->cn_password);
        echo "User #{$u->id} ({$u->email}) -> cn_usuario_id={$u->cn_usuario_id} -> password_plain: {$plain}\n";
    } catch (Exception $e) {
        echo "User #{$u->id} ({$u->email}) -> ERROR decrypt: {$e->getMessage()}\n";
    }
}

// Verificar qué hash tiene LARAVEL_GW ahora en la BD
$gw = DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->first();
echo "\nLARAVEL_GW hash actual: {$gw->Contrasena}\n";
echo "Verify GatewayAtinet2026 vs hash: " . (password_verify('GatewayAtinet2026', $gw->Contrasena) ? 'OK' : 'FAIL') . "\n";

// Probar si hay algún endpoint de logout en C# para forzar cierre de sesión sin autenticarse
// Por ahora solo podemos probar directamente con curl
$url = 'http://192.168.1.1:5000/api/Login/Authentication';
$payload = json_encode([
    'usuario' => 'LARAVEL_GW',
    'contrasena' => 'GatewayAtinet2026',
    'nombre_Notaria' => 'NOTARIA',
    'equipo' => 'Laravel-Server',
]);
$ch = curl_init($url);
curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 10, CURLOPT_SSL_VERIFYPEER => false]);
$response = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "\nC# login LARAVEL_GW -> HTTP $code: $response\n";
