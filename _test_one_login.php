<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$base = 'http://192.168.1.1:5000/api';

// Test PANFILOP with admin123
$tests = [
    ['cn_id' => 10, 'usuario' => 'PANFILOP', 'pass' => 'admin123'],
    ['cn_id' => 2,  'usuario' => 'PRUEBA',   'pass' => 'admin123'],
    ['cn_id' => 5,  'usuario' => 'KARCER',   'pass' => '5402'],
    ['cn_id' => 6,  'usuario' => 'NOT1',     'pass' => 'admin123'],
];

foreach ($tests as $t) {
    DB::table('tbl_cat_usuarios')->where('Usuario', $t['usuario'])->update(['Sesion_Iniciada' => 0]);

    $ch = curl_init("{$base}/Login/Authentication");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'usuario' => $t['usuario'],
            'contrasena' => $t['pass'],
            'nombre_Notaria' => 'TEST', 'equipo' => 'Debug',
        ]),
        CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 10,
    ]);
    $body = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($body, true);
    $jwt  = isset($data['dataResponse']['accessToken']) ? 'JWT OK' : 'FAIL';
    $msg  = $data['message'] ?? '';
    echo "{$t['usuario']} / {$t['pass']} → {$jwt} [{$msg}]\n";
}
