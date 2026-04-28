<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$base = 'http://192.168.1.1:5000/api';

// Reset LARAVEL_GW session
DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')
    ->whereIn('Usuario_Id', DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->pluck('Id'))
    ->delete();

// Get GW token
$gwResp = Http::withoutVerifying()->timeout(10)->post("{$base}/Login/Authentication", [
    'usuario' => 'LARAVEL_GW', 'contrasena' => 'LaravelGW2026!',
    'nombre_Notaria' => 'NOTARIA', 'equipo' => 'Debug',
]);
$token = $gwResp->json()['dataResponse']['accessToken'] ?? null;
if (! $token) {
    echo "FALLO GW: " . $gwResp->body() . "\n";
    exit(1);
}
echo "GW JWT OK\n\n";

// Test users that are failing
$failing = [
    ['cn_id' => 2,  'usuario' => 'PRUEBA',         'target_pass' => 'admin123'],
    ['cn_id' => 3,  'usuario' => 'ALMA',            'target_pass' => 'admin123'],
    ['cn_id' => 5,  'usuario' => 'KARCER',          'target_pass' => '5402'],
    ['cn_id' => 6,  'usuario' => 'NOT1',            'target_pass' => 'admin123'],
    ['cn_id' => 7,  'usuario' => 'SEC1',            'target_pass' => 'admin123'],
    ['cn_id' => 8,  'usuario' => 'RES1',            'target_pass' => 'admin123'],
    ['cn_id' => 11, 'usuario' => 'CONTACTO',        'target_pass' => 'admin123'],
    ['cn_id' => 12, 'usuario' => 'NOTARIA113HUX',   'target_pass' => 'admin123'],
    ['cn_id' => 17, 'usuario' => 'USUARIO',         'target_pass' => 'admin123'],
    ['cn_id' => 4,  'usuario' => 'ELIZABETH.ORTEGA','target_pass' => 'admin123'],
];

foreach ($failing as $u) {
    // Get user data from C#
    $getResp = Http::withToken($token)->withoutVerifying()->timeout(10)
        ->get("{$base}/User/GetUsuarioById?usuarioId={$u['cn_id']}");
    $data = $getResp->json()['dataResponse'] ?? $getResp->json();
    unset($data['rol']);

    // Sanitize
    $stringFields = ['nombre','apellido_Paterno','apellido_Materno','correo','usuario','curp','rfc','iniciales','numero_Notaria','adscripcion','tipo','procedencia','observaciones'];
    foreach ($stringFields as $f) {
        if (! isset($data[$f]) || $data[$f] === null || $data[$f] === '') {
            $data[$f] = '.';
        }
    }

    // PUT with new password
    $payload = array_merge($data, ['contrasena' => $u['target_pass']]);
    $putResp = Http::withToken($token)->withoutVerifying()->timeout(10)
        ->put("{$base}/User/UpdateUsuario?usuarioId={$u['cn_id']}", $payload);

    $putStatus = $putResp->status();
    $putMsg    = $putResp->json()['message'] ?? $putResp->body();

    if ($putStatus === 200) {
        // Update cn_password in users table
        $laravelUser = DB::table('users')->where('cn_usuario_id', $u['cn_id'])->first();
        if ($laravelUser) {
            DB::table('users')->where('cn_usuario_id', $u['cn_id'])
                ->update(['cn_password' => encrypt($u['target_pass'])]);
        }
        echo "OK  cn_id={$u['cn_id']} {$u['usuario']} → password set to '{$u['target_pass']}'\n";
    } else {
        echo "FAIL cn_id={$u['cn_id']} {$u['usuario']} → HTTP {$putStatus}: {$putMsg}\n";
    }
}

echo "\nDone.\n";
