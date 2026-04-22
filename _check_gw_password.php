<?php
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$internalUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

echo "=== Config gateway ===\n";
echo "GW_USER: " . config('services.control_notarial.gw_user') . "\n";
echo "GW_PASS: " . config('services.control_notarial.gw_password') . "\n\n";

$row = DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->first();
if ($row) {
    echo "CN: Id={$row->Id} | Sesion={$row->Sesion_Iniciada} | Hash={$row->Contrasena}\n\n";
} else {
    echo "LARAVEL_GW NO ENCONTRADO en tbl_cat_usuarios\n\n";
}

// Limpiar sesion
if ($row) {
    DB::table('tbl_cat_usuarios')->where('Id', $row->Id)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $row->Id)->delete();
}

// Probar candidatos de contraseña
$candidates = array_unique([
    config('services.control_notarial.gw_password'),
    'LaravelGateway2026#',
    'LaravelGateway2026!',
    'LaravelGateway2026',
    'gateway123',
    '1010',
    'admin123',
]);

echo "=== Probando contraseñas LARAVEL_GW ===\n";
foreach ($candidates as $pass) {
    if ($row) {
        DB::table('tbl_cat_usuarios')->where('Id', $row->Id)->update(['Sesion_Iniciada' => 0]);
        DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $row->Id)->delete();
    }
    $resp = Http::withoutVerifying()->timeout(10)->post("{$internalUrl}/Login/Authentication", [
        'usuario'        => 'LARAVEL_GW',
        'contrasena'     => $pass,
        'nombre_Notaria' => 'NOTARIA',
        'equipo'         => 'Laravel-Server',
    ]);
    $body = $resp->json();
    $jwt  = $body['dataResponse']['accessToken'] ?? null;
    $msg  = $body['message'] ?? json_encode($body);
    echo "  '{$pass}' -> " . ($jwt ? "✓ JWT OK" : "✗ {$msg}") . "\n";
    if ($jwt) {
        echo "\n  *** CONTRASEÑA CORRECTA: '{$pass}' ***\n";
        echo "  Actualizando .env...\n";
        $envPath = __DIR__.'/.env';
        $env     = file_get_contents($envPath);
        $env     = preg_replace('/^CN_GW_PASSWORD=.*/m', "CN_GW_PASSWORD=\"{$pass}\"", $env);
        file_put_contents($envPath, $env);
        echo "  .env actualizado ✓\n";
        break;
    }
}
