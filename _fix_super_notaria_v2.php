<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Obtener todos los cn_usuario_id de usuarios super_admin
$superAdminIds = $pdo->query(
    "SELECT id, email, cn_usuario_id FROM users WHERE tipo_cuenta='super_admin' AND cn_usuario_id IS NOT NULL"
)->fetchAll(PDO::FETCH_ASSOC);

echo '=== super_admin con cn_usuario_id ==='.PHP_EOL;
foreach ($superAdminIds as $u) {
    echo json_encode($u).PHP_EOL;
}

$cnIds = array_column($superAdminIds, 'cn_usuario_id');
if (empty($cnIds)) {
    echo 'No hay super_admin con cn_usuario_id'.PHP_EOL;
    exit;
}

$in = implode(',', array_map('intval', $cnIds));

echo PHP_EOL."=== tbl_cat_usuarios ANTES (Id IN ({$in})) ===".PHP_EOL;
$rows = $pdo->query(
    "SELECT Id, Usuario, Numero_Notaria, Tipo FROM tbl_cat_usuarios WHERE Id IN ({$in})"
)->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r).PHP_EOL;
}

// Actualizar Numero_Notaria='1' para todos esos IDs
$updated = $pdo->exec(
    "UPDATE tbl_cat_usuarios SET Numero_Notaria='1' WHERE Id IN ({$in})"
);
echo PHP_EOL."Filas actualizadas: {$updated}".PHP_EOL;

echo PHP_EOL.'=== tbl_cat_usuarios DESPUES ==='.PHP_EOL;
$rows = $pdo->query(
    "SELECT Id, Usuario, Numero_Notaria, Tipo FROM tbl_cat_usuarios WHERE Id IN ({$in})"
)->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r).PHP_EOL;
}

echo PHP_EOL.'=== Estado completo de tbl_cat_usuarios ==='.PHP_EOL;
$all = $pdo->query(
    'SELECT Id, Usuario, Numero_Notaria, Tipo, Activo FROM tbl_cat_usuarios ORDER BY Id'
)->fetchAll(PDO::FETCH_ASSOC);
foreach ($all as $r) {
    echo json_encode($r).PHP_EOL;
}
