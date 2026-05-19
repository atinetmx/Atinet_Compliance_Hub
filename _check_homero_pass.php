<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$u = DB::table('users')->where('id', 23)->first(['cn_password']);
$plain = decrypt($u->cn_password);
echo 'cn_password descifrado: '.$plain.PHP_EOL;

// Hash en el tenant
Config::set('database.connections.t10', [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => 'atinet_edomex_notaria_101',
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => false,
]);

$cu = DB::connection('t10')->table('tbl_cat_usuarios')->where('Usuario', 'COMPUMUNDO')->first(['Id', 'Usuario', 'Contrasena']);
echo 'Hash en tenant: '.$cu->Contrasena.PHP_EOL;

// Verificar si cn_password coincide con el hash del tenant
$hashFixed = str_replace('$2b$', '$2y$', $cu->Contrasena);
echo 'Coincide con cn_password: '.(password_verify($plain, $hashFixed) ? 'SI' : 'NO').PHP_EOL;
echo 'Coincide con admin123:    '.(password_verify('admin123', $hashFixed) ? 'SI' : 'NO').PHP_EOL;
