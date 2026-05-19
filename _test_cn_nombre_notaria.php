<?php

// Test what valor acepta nombre_Notaria en el C#
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$internalUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');
$gwUser = config('services.control_notarial.gw_user', 'LARAVEL_GW');
$gwPass = config('services.control_notarial.gw_password', '');

$testValues = [
    'NOTARIA',                         // hardcoded actual
    'atinet_edomex_notaria_11',        // tenant_db_name
    'atinet_compliance_hub',           // master DB name
    'edomex_notaria_11',               // cnIdentifier() format
    '11',                              // numero_notaria
    'noteria 11 cuatitlan mexico',     // nombre notaria
];

foreach ($testValues as $testVal) {
    $ch = curl_init($internalUrl.'/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'usuario' => $gwUser,
            'contrasena' => $gwPass,
            'nombre_Notaria' => $testVal,
            'equipo' => 'Laravel-Server',
        ]),
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 10,
    ]);
    $body = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $data = json_decode($body, true);
    $mensaje = $data['message']['detalle'] ?? $data['message']['mensaje'] ?? ($data['token'] ? 'TOKEN OK' : json_encode($data));
    echo "[nombre_Notaria='$testVal'] HTTP=$httpCode => $mensaje".PHP_EOL;
}
