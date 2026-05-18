<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$db = app('db');

echo "=== tbl_cat_usuarios ===" . PHP_EOL;
foreach ($db->select('DESCRIBE tbl_cat_usuarios') as $c) {
    echo sprintf("  %-35s %s\n", $c->Field, $c->Type);
}

echo PHP_EOL . "=== users ===" . PHP_EOL;
foreach ($db->select('DESCRIBE users') as $c) {
    echo sprintf("  %-35s %s\n", $c->Field, $c->Type);
}

echo PHP_EOL . "=== tbl_cat_usuarios — datos ===" . PHP_EOL;
foreach ($db->select('SELECT Id, Usuario, Correo, Tipo, Rol_Id, Activo, SUBSTRING(Contrasena,1,7) as hash_prefix FROM tbl_cat_usuarios') as $u) {
    echo sprintf("  id=%-3s user=%-20s email=%-35s tipo=%-15s rol=%-3s activo=%s hash=%s\n",
        $u->Id, $u->Usuario, $u->Correo, $u->Tipo, $u->Rol_Id, $u->Activo, $u->hash_prefix);
}

echo PHP_EOL . "=== users — datos ===" . PHP_EOL;
foreach ($db->select('SELECT id, name, email, tipo_cuenta, notaria_id, SUBSTRING(password,1,7) as hash_prefix FROM users') as $u) {
    echo sprintf("  id=%-3s name=%-30s email=%-35s tipo=%-20s notaria=%s hash=%s\n",
        $u->id, $u->name, $u->email, $u->tipo_cuenta, $u->notaria_id, $u->hash_prefix);
}

echo PHP_EOL . "=== Conteos ===" . PHP_EOL;
$cnt_tbl = $db->selectOne('SELECT COUNT(*) as n FROM tbl_cat_usuarios')->n;
$cnt_usr = $db->selectOne('SELECT COUNT(*) as n FROM users')->n;
echo "  tbl_cat_usuarios: $cnt_tbl registros\n";
echo "  users: $cnt_usr registros\n";
