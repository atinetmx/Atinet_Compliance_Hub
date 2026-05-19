<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo '=== ANTES ==='.PHP_EOL;
foreach ($pdo->query('SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias WHERE id=11')->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo json_encode($r).PHP_EOL;
}
foreach ($pdo->query('SELECT Id, Usuario, Numero_Notaria FROM tbl_cat_usuarios WHERE Id IN (1,9,18)')->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo json_encode($r).PHP_EOL;
}
foreach ($pdo->query("SELECT id, email, tipo_cuenta, notaria_id FROM users WHERE tipo_cuenta='super_admin'")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo json_encode($r).PHP_EOL;
}

// 1. Cambiar numero_notaria de ATINET MASTER: "11" → "1"
$pdo->exec("UPDATE notarias SET numero_notaria='1' WHERE id=11");
echo PHP_EOL."notarias.id=11 numero_notaria actualizado a '1'".PHP_EOL;

// 2. Actualizar Numero_Notaria en tbl_cat_usuarios para ADMIN y SUPERUSUARIO
$affected = $pdo->exec("UPDATE tbl_cat_usuarios SET Numero_Notaria='1' WHERE Numero_Notaria='11' AND Id IN (1, 9, 18)");
echo "tbl_cat_usuarios actualizados: $affected filas".PHP_EOL;

// 3. Asignar notaria_id=11 (ATINET MASTER) a todos los super_admin en users
$affected2 = $pdo->exec("UPDATE users SET notaria_id=11 WHERE tipo_cuenta='super_admin'");
echo "users.notaria_id=11 asignado a super_admin: $affected2 filas".PHP_EOL;

echo PHP_EOL.'=== DESPUES ==='.PHP_EOL;
foreach ($pdo->query('SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias WHERE id=11')->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo json_encode($r).PHP_EOL;
}
foreach ($pdo->query('SELECT Id, Usuario, Numero_Notaria FROM tbl_cat_usuarios WHERE Id IN (1,9,18)')->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo json_encode($r).PHP_EOL;
}
foreach ($pdo->query("SELECT id, email, tipo_cuenta, notaria_id FROM users WHERE tipo_cuenta='super_admin'")->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo json_encode($r).PHP_EOL;
}
