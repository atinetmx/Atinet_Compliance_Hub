<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo '=== users (super_admin) ==='.PHP_EOL;
$users = $pdo->query("SELECT id, name, email, tipo_cuenta, notaria_id, cn_usuario_id FROM users WHERE tipo_cuenta='super_admin' ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($users as $u) {
    echo json_encode($u).PHP_EOL;
}

echo PHP_EOL.'=== notarias (master) ==='.PHP_EOL;
$notarias = $pdo->query("SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias WHERE tenant_db_name='atinet_compliance_hub'")->fetchAll(PDO::FETCH_ASSOC);
foreach ($notarias as $n) {
    echo json_encode($n).PHP_EOL;
}

echo PHP_EOL.'=== tbl_cat_usuarios (ADMIN/SUPERUSUARIO/LARAVEL_GW) ==='.PHP_EOL;
$cn = $pdo->query("SELECT Id, Usuario, Numero_Notaria, Activo, Tipo FROM tbl_cat_usuarios WHERE Usuario IN ('ADMIN','SUPERUSUARIO','LARAVEL_GW') ORDER BY Id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($cn as $u) {
    echo json_encode($u).PHP_EOL;
}

echo PHP_EOL.'=== COLUMNAS tabla users ==='.PHP_EOL;
$cols = $pdo->query('SHOW COLUMNS FROM users')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['Field']} {$c['Type']} {$c['Null']} default={$c['Default']}".PHP_EOL;
}
