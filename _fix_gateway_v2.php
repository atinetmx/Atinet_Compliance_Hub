<?php
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$internalUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');
$newGwPass   = 'LaravelGW_2026!';

// 1. JWT de ADMIN
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 1)->delete();
$jwt = Http::withoutVerifying()->timeout(15)->post("{$internalUrl}/Login/Authentication", [
    'usuario' => 'ADMIN', 'contrasena' => '1010',
    'nombre_Notaria' => 'NOTARIA', 'equipo' => 'Laravel-Server',
])->json()['dataResponse']['accessToken'] ?? null;
if (!$jwt) { echo "FALLO JWT ADMIN\n"; exit(1); }
echo "JWT ADMIN OK\n";

// 2. Buscar LARAVEL_GW en GetUsuarios
$allUsers = Http::withoutVerifying()->timeout(15)->withToken($jwt)
    ->get("{$internalUrl}/User/GetUsuarios")->json();
$gw = null;
foreach ((array)$allUsers as $u) {
    if (($u['usuario'] ?? '') === 'LARAVEL_GW') { $gw = $u; break; }
}
echo "LARAVEL_GW en GetUsuarios: " . ($gw ? "Id=".$gw['id'] : "NO ENCONTRADO - usando Id=18") . "\n";

$cnId = $gw['id'] ?? 18;
$upd  = Http::withoutVerifying()->timeout(15)->withToken($jwt)
    ->put("{$internalUrl}/User/UpdateUsuario?usuarioId={$cnId}", [
        'nombre'           => $gw['nombre']          ?? 'GATEWAY',
        'apellido_Paterno' => $gw['apellido_Paterno'] ?? 'SERVER',
        'apellido_Materno' => $gw['apellido_Materno'] ?? '',
        'correo'           => $gw['correo']           ?? 'gateway@atinet.local',
        'usuario'          => 'LARAVEL_GW',
        'contrasena'       => $newGwPass,
        'curp'             => '', 'rfc'  => '',
        'rol_Id'           => $gw['rol_Id'] ?? 1,
        'iniciales'        => 'GW',
        'numero_Notaria'   => '', 'adscripcion' => '',
        'tipo'             => 'GATEWAY', 'procedencia' => '', 'observaciones' => '',
        'activo'           => true,
    ]);
echo "UpdateUsuario HTTP=" . $upd->status() . " | " . ($upd->json()['message'] ?? $upd->body()) . "\n";

// 3. Verificar
DB::table('tbl_cat_usuarios')->where('Id', $cnId)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $cnId)->delete();
$test    = Http::withoutVerifying()->timeout(15)->post("{$internalUrl}/Login/Authentication", [
    'usuario' => 'LARAVEL_GW', 'contrasena' => $newGwPass,
    'nombre_Notaria' => 'NOTARIA', 'equipo' => 'Laravel-Server',
]);
$testJwt = $test->json()['dataResponse']['accessToken'] ?? null;
echo "Login GW: " . ($testJwt ? "✓ JWT OK" : "✗ " . ($test->json()['message'] ?? '')) . "\n";

if ($testJwt) {
    $env = preg_replace('/^CN_GW_PASSWORD=.*/m', "CN_GW_PASSWORD=\"{$newGwPass}\"", file_get_contents(__DIR__.'/.env'));
    file_put_contents(__DIR__.'/.env', $env);
    echo ".env actualizado. Ejecuta: php artisan config:clear\n";
}
