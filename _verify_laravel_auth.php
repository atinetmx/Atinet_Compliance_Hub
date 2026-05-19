<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Auth;

$users = [
    ['id' => 1,  'email' => 'admin@atinet.mx',                   'password' => 'password123', 'label' => 'SUPERUSUARIO'],
    ['id' => 11, 'email' => 'admin@atinet.com.mx',               'password' => 'ADMIN',       'label' => 'ADMIN'],
    ['id' => 2,  'email' => 'panfilop@11cuatitlan.com',           'password' => 'admin123',    'label' => 'PANFILOP'],
    ['id' => 3,  'email' => 'elizabeth.ortega@atinet.com.mx',    'password' => 'admin123',    'label' => 'ELIZABETH.ORTEGA'],
    ['id' => 4,  'email' => 'contacto@not10.mx',                 'password' => 'admin123',    'label' => 'CONTACTO'],
    ['id' => 5,  'email' => 'notaria113hux@gmail.com',           'password' => 'admin123',    'label' => 'NOTARIA113HUX'],
    ['id' => 6,  'email' => 'atencion@atinet.com.mx',            'password' => 'admin123',    'label' => 'ATENCION'],
    ['id' => 7,  'email' => 'jess@atinet.com.mx',               'password' => 'admin123',    'label' => 'JESS'],
    ['id' => 8,  'email' => 'karla@atinet.com.mx',              'password' => 'admin123',    'label' => 'KARCER'],
    ['id' => 9,  'email' => 'claus@atinet.com.mx',              'password' => 'admin123',    'label' => 'CLAUS'],
    ['id' => 10, 'email' => 'ari@atinet.com.mx',                'password' => 'admin123',    'label' => 'ARI'],
    ['id' => 13, 'email' => 'usuario@gmail.com',                'password' => 'admin123',    'label' => 'USUARIO'],
    ['id' => 14, 'email' => 'PRUEBA@GMAIL.COM',                 'password' => 'admin123',    'label' => 'PRUEBA'],
    ['id' => 15, 'email' => 'alma@atinet.local',                'password' => 'admin123',    'label' => 'ALMA'],
    ['id' => 16, 'email' => 'not1@notaria11.local',             'password' => 'admin123',    'label' => 'NOT1'],
    ['id' => 17, 'email' => 'sec1@notaria11.local',             'password' => 'admin123',    'label' => 'SEC1'],
    ['id' => 18, 'email' => 'res1@notaria11.local',             'password' => 'admin123',    'label' => 'RES1'],
    ['id' => 19, 'email' => 'notaria60@notaria60edomex.com',    'password' => 'admin123',    'label' => 'NOTARIA60'],
    ['id' => 22, 'email' => 'lalo@gmail.com',                   'password' => 'admin123',    'label' => 'LALO'],
    ['id' => 23, 'email' => 'compumundo@hypermegared.com',      'password' => 'admin123',    'label' => 'COMPUMUNDO'],
];

echo "=== VERIFICACION LOGIN LARAVEL (Auth::attempt) ===\n";
echo str_pad('id', 5) . str_pad('cn_usuario', 20) . str_pad('email', 38) . str_pad('password', 14) . "resultado\n";
echo str_repeat('-', 90) . "\n";

$ok = 0; $fail = 0;

foreach ($users as $u) {
    $attempt = Auth::attempt([
        'email'    => strtolower($u['email']),
        'password' => $u['password'],
    ]);

    Auth::logout(); // limpiar sesión entre intentos

    $estado = $attempt ? 'TRUE ✓' : 'FALSE ✗';
    echo str_pad($u['id'], 5)
       . str_pad($u['label'], 20)
       . str_pad($u['email'], 38)
       . str_pad($u['password'], 14)
       . $estado . "\n";

    $attempt ? $ok++ : $fail++;
}

echo "\nOK: $ok | Fallos: $fail\n";
