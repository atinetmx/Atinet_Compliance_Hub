<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$cnUser = DB::table('tbl_cat_usuarios')->where('Id', 9)->first();
echo "SUPERUSUARIO hash: {$cnUser->Contrasena}\n";
echo "Numero_Notaria: {$cnUser->Numero_Notaria}\n";
echo 'Prefix: '.substr($cnUser->Contrasena, 0, 4)."\n\n";

$user = DB::table('users')->where('email', 'admin@atinet.mx')->first();
$plain = decrypt($user->cn_password);
echo "cn_password decrypted: {$plain}\n";
echo 'PHP verify: '.(password_verify($plain, $cnUser->Contrasena) ? '✅ MATCH' : '❌ NO MATCH')."\n\n";

// Probar variantes comunes
$tries = ['1010', 'admin', 'Admin123', 'admin123', '12345', 'superusuario', 'Superusuario'];
foreach ($tries as $t) {
    if (password_verify($t, $cnUser->Contrasena)) {
        echo "✅ Match encontrado: '{$t}'\n";
    }
}
echo "Prueba de variantes terminada.\n";
