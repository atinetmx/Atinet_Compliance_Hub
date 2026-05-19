<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$pass = 'Atinet2026#Secure';
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', $pass);

echo "=== users (super_admin) ===\n";
$users = DB::table('users')->where('tipo_cuenta', 'super_admin')->get(['id', 'email', 'tipo_cuenta', 'notaria_id', 'cn_usuario_id']);
foreach ($users as $u) {
    echo json_encode((array) $u)."\n";
}

echo "\n=== notarias disponibles ===\n";
$notarias = $pdo->query('SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($notarias as $n) {
    echo json_encode($n)."\n";
}

echo "\n=== tbl_cat_usuarios (super_admin candidates) ===\n";
$cnu = $pdo->query('SELECT Id, Usuario, Numero_Notaria, Tipo, Activo FROM tbl_cat_usuarios WHERE Tipo="ADMINISTRADOR" OR Numero_Notaria IN ("0","11") ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cnu as $u) {
    echo json_encode($u)."\n";
}
