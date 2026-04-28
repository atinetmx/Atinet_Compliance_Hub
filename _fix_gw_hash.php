<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

$newGwPass = 'LaravelGateway2026#';

// Genera hash BCrypt con prefijo $2y$ (confirmado que C# BCrypt.Net-Core lo acepta)
$hash = password_hash($newGwPass, PASSWORD_BCRYPT, ['cost' => 12]);
echo "Hash generado: {$hash}\n";

// Verifica que el hash funcione en PHP
$ok = password_verify($newGwPass, $hash);
echo "Verificación PHP: " . ($ok ? 'OK' : 'FALLO') . "\n";

// Actualiza en DB
$rows = DB::update("UPDATE tbl_cat_usuarios SET Contrasena = ?, Sesion_Iniciada = 0 WHERE Usuario = 'LARAVEL_GW'", [$hash]);
echo "Filas actualizadas: {$rows}\n";

// Limpiar sesiones activas
DB::update("UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0");
try { DB::delete("DELETE FROM tbl_log_sesiones_activas"); echo "Sesiones vaciadas\n"; }
catch (\Exception $e) { echo "Advertencia: " . $e->getMessage() . "\n"; }

// Reiniciar App Pool
$appcmd = getenv('SystemRoot') . '\system32\inetsrv\appcmd.exe';
shell_exec("\"$appcmd\" stop apppool /apppool.name:\"SCN\"");
sleep(2);
shell_exec("\"$appcmd\" start apppool /apppool.name:\"SCN\"");
sleep(3);
echo "App Pool reiniciado\n";

// Test LARAVEL_GW login
$ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
curl_setopt_array($ch, [
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode(['usuario' => 'LARAVEL_GW', 'contrasena' => $newGwPass]),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => false,
]);
$resp = curl_exec($ch);
$code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
$data = json_decode($resp, true);
$token = $data['token'] ?? null;

echo "HTTP {$code}\n";
if ($token) {
    echo "✅ LARAVEL_GW autenticado OK - JWT obtenido\n";
    echo "Token: " . substr($token, 0, 80) . "...\n";
    // Logout
    $ch2 = curl_init('http://192.168.1.1:5000/api/Login/Logout');
    curl_setopt_array($ch2, [CURLOPT_POST=>true, CURLOPT_HTTPHEADER=>["Authorization: Bearer {$token}", 'Content-Type: application/json'], CURLOPT_RETURNTRANSFER=>true, CURLOPT_TIMEOUT=>5]);
    curl_exec($ch2); curl_close($ch2);
    // Limpiar sesiones post-test
    DB::update("UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0");
    try { DB::delete("DELETE FROM tbl_log_sesiones_activas"); } catch (\Exception $e) {}
} else {
    echo "❌ LARAVEL_GW FALLO: " . json_encode($data) . "\n";
}
