<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$pass = 'GatewayAtinet2026';

// Generar con crypt() nativo - TRUE $2a$ BCrypt
$generatedSalt = '$2a$12$'.substr(str_replace(['+', '/', '='], ['.', '.', ''], base64_encode(random_bytes(16))), 0, 22);
$hash = crypt($pass, $generatedSalt);

echo "Password: $pass\n";
echo "Salt used: $generatedSalt\n";
echo "Hash: $hash\n";
echo 'Len: '.strlen($hash)."\n";
echo 'PHP crypt verify: '.((crypt($pass, $hash) === $hash) ? 'OK' : 'FAIL')."\n";
echo 'PHP password_verify: '.(password_verify($pass, $hash) ? 'OK' : 'FAIL')."\n";

DB::table('tbl_cat_usuarios')
    ->where('Usuario', 'LARAVEL_GW')
    ->update(['Contrasena' => $hash]);

echo "\nActualizado. Prueba ahora: curl -X POST http://192.168.1.1:5000/api/Login/Authentication -d '{\"usuario\":\"LARAVEL_GW\",\"contrasena\":\"GatewayAtinet2026\",\"equipo\":\"test\"}'\n";
