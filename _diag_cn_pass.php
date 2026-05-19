<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

// 1. Descifrar cn_password de Homero (users.id=23)
$u = DB::table('users')->where('id', 23)->first(['cn_password', 'name', 'email']);
echo "Usuario: {$u->name} / {$u->email}\n";
$descifrado = decrypt($u->cn_password);
echo "cn_password descifrado: {$descifrado}\n\n";

// 2. Conexión al tenant
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

$cu = DB::connection('t10')
    ->table('tbl_cat_usuarios')
    ->where('Usuario', 'COMPUMUNDO')
    ->first();

if (! $cu) {
    echo "ERROR: No se encontró COMPUMUNDO en tbl_cat_usuarios del tenant\n";
    exit(1);
}

echo "Tenant usuario ID: {$cu->Id}\n";
echo "Hash Contrasena: {$cu->Contrasena}\n\n";

// 3. Verificar si admin123 coincide con el hash del tenant
$ok = password_verify('admin123', $cu->Contrasena);
echo "password_verify('admin123', hash): ".($ok ? 'SI ✓' : 'NO ✗')."\n";

// 4. Verificar si cn_password coincide con el hash del tenant
$okCn = password_verify($descifrado, $cu->Contrasena);
echo 'password_verify(cn_password descifrado, hash): '.($okCn ? 'SI ✓' : 'NO ✗')."\n";
