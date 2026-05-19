<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Hashes en tbl_cat_usuarios Id=1 y Id=9 ===\n";
$rows = DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->get(['Id', 'Usuario', 'Contrasena', 'Numero_Notaria']);
foreach ($rows as $r) {
    echo "Id={$r->Id} {$r->Usuario} NumNotaria={$r->Numero_Notaria}\n";
    echo "  Hash: {$r->Contrasena}\n";
    echo "  PHP verify('1010'): ".(password_verify('1010', $r->Contrasena) ? '✅ MATCH' : '❌ NO')."\n\n";
}

echo "=== users.id=1 cn_password ===\n";
$user = DB::table('users')->where('id', 1)->first(['cn_usuario_id', 'cn_password']);
echo "cn_usuario_id: {$user->cn_usuario_id}\n";
$plain = decrypt($user->cn_password);
echo "cn_password decrypted: '{$plain}'\n\n";

$hashSU = DB::table('tbl_cat_usuarios')->where('Id', 9)->value('Contrasena');
$hashAD = DB::table('tbl_cat_usuarios')->where('Id', 1)->value('Contrasena');
echo '¿Mismo hash? '.($hashSU === $hashAD ? '✅ SÍ' : '❌ DIFERENTE')."\n";
echo 'Prefix Id=9: '.substr($hashSU, 0, 4)."\n";
echo 'Prefix Id=1: '.substr($hashAD, 0, 4)."\n";
