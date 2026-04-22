<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== users (con cn_usuario_id) ===\n";
$users = DB::table('users')->whereNotNull('cn_usuario_id')->get(['id','email','cn_usuario_id','cn_password']);
foreach ($users as $u) {
    $plain = '';
    try { $plain = decrypt($u->cn_password); } catch (\Exception $e) { $plain = 'DECRYPT_ERROR'; }
    echo "id={$u->id} | email={$u->email} | cn_usuario_id={$u->cn_usuario_id} | cn_password_plain={$plain}\n";
}

echo "\n=== tbl_cat_usuarios ===\n";
$cnus = DB::table('tbl_cat_usuarios')->get(['Id','Usuario','Correo','Contrasena','Sesion_Iniciada','Numero_Notaria','Tipo']);
foreach ($cnus as $c) {
    echo "Id={$c->Id} | Usuario={$c->Usuario} | Correo={$c->Correo} | Contrasena={$c->Contrasena} | Sesion_Iniciada={$c->Sesion_Iniciada} | Notaria={$c->Numero_Notaria} | Tipo={$c->Tipo}\n";
}
