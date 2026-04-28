<?php // v2
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$internalUrl = rtrim(config('services.control_notarial.internal_url','http://192.168.1.1:5000/api'), '/');
$gwUser = config('services.control_notarial.gw_user', 'LARAVEL_GW');
$gwPass = config('services.control_notarial.gw_password', '');

echo "Gateway user: {$gwUser}" . PHP_EOL;
echo "Gateway pass: {$gwPass}" . PHP_EOL;

// Test login gateway
$ch = curl_init($internalUrl . '/Login/Authentication');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode([
        'usuario'        => $gwUser,
        'contrasena'     => $gwPass,
        'nombre_Notaria' => 'NOTARIA',
        'equipo'         => 'Laravel-Server',
    ]),
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_TIMEOUT => 10,
]);
$body = curl_exec($ch);
$data = json_decode($body, true);
curl_close($ch);

echo "Respuesta C#: " . json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . PHP_EOL;

// Verificar hash en BD
$hash = \Illuminate\Support\Facades\DB::table('tbl_cat_usuarios')
    ->where('Usuario', $gwUser)
    ->value('Contrasena');
echo "Hash en tbl_cat_usuarios: {$hash}" . PHP_EOL;
echo "¿Hash valido?: " . (password_verify($gwPass, str_replace('$2b$', '$2y$', $hash)) ? 'SI' : 'NO') . PHP_EOL;
