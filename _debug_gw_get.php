<?php
// _debug_gw_get.php — inspeccionar la respuesta exacta de GetUsuarioById y CreateUsuario
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$cnBase = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

// Resetear sesion admin y obtener JWT
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 1)->delete();

$ch = curl_init("{$cnBase}/Login/Authentication");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode(['usuario'=>'ADMIN','contrasena'=>'1010','nombre_Notaria'=>'NOTARIA','equipo'=>'Debug']),
    CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 15]);
$loginBody = curl_exec($ch); curl_close($ch);
$loginData = json_decode($loginBody, true);
$jwt = $loginData['dataResponse']['accessToken'] ?? $loginData['token'] ?? null;
echo "JWT: " . ($jwt ? "OK" : "FALLO: $loginBody") . "\n\n";
if (!$jwt) exit(1);

// Obtener usuario 18 — ver estructura completa
echo "=== GET /User/GetUsuarioById?usuarioId=18 ===\n";
$ch = curl_init("{$cnBase}/User/GetUsuarioById?usuarioId=18");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json', "Authorization: Bearer $jwt"],
    CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 15]);
$body = curl_exec($ch);
$status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "Status: $status\n";
echo "Body completo:\n$body\n\n";

// También listar usuarios para comparar
echo "=== GET /User/GetUsuarios (primeros 3) ===\n";
$ch = curl_init("{$cnBase}/User/GetUsuarios");
curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => ['Accept: application/json', "Authorization: Bearer $jwt"],
    CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 15]);
$body2 = curl_exec($ch);
$status2 = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$users = json_decode($body2, true);
echo "Status: $status2\n";
if (is_array($users)) {
    // Wrap si es un array directo o si viene en dataResponse
    $list = $users['dataResponse'] ?? $users;
    if (is_array($list)) {
        foreach (array_slice((array)$list, 0, 3) as $u) {
            echo "  keys: " . implode(', ', array_keys((array)$u)) . "\n";
            echo "  Id/id: " . ($u['Id'] ?? $u['id'] ?? '?') . " Usuario: " . ($u['Usuario'] ?? $u['usuario'] ?? '?') . "\n";
            break; // solo el primero para ver keys
        }
    }
} else {
    echo "No es array. Body: " . substr($body2, 0, 300) . "\n";
}
