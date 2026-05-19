<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$plain = 'admin123';
$hashLaravel = password_hash($plain, PASSWORD_BCRYPT, ['cost' => 12]);
$hashCsharp = str_replace('$2y$', '$2a$', $hashLaravel);

// Excluir users.id=1 (SUPERUSUARIO) y users.id=11 (ADMIN)
$rows = $pdo->query('
    SELECT u.id, u.email, u.cn_usuario_id, c.Usuario
    FROM users u
    LEFT JOIN tbl_cat_usuarios c ON c.Id = u.cn_usuario_id
    WHERE u.id NOT IN (1, 11)
    ORDER BY u.id
')->fetchAll(PDO::FETCH_ASSOC);

$cnIds = [];
foreach ($rows as $r) {
    echo "uid={$r['id']} | {$r['email']} | CN_id={$r['cn_usuario_id']} ({$r['Usuario']})\n";
    if ($r['cn_usuario_id']) {
        $cnIds[] = (int) $r['cn_usuario_id'];
    }
}

// Actualizar tabla users (todos excepto id=1 y id=11)
$stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id NOT IN (1, 11)');
$stmt->execute([$hashLaravel]);
echo "\nusers actualizados: ".$stmt->rowCount()." fila(s)\n";

// Actualizar tbl_cat_usuarios (todos los vinculados, excepto Id=9 SUPERUSUARIO e Id=1 ADMIN)
if (! empty($cnIds)) {
    $cnList = implode(',', array_unique($cnIds));
    $stmt2 = $pdo->prepare("UPDATE tbl_cat_usuarios SET Contrasena = ? WHERE Id IN ($cnList)");
    $stmt2->execute([$hashCsharp]);
    echo 'tbl_cat_usuarios actualizados: '.$stmt2->rowCount()." fila(s)\n";
}

// Verificacion de todos
echo "\n--- Verificacion final ---\n";
foreach ($rows as $r) {
    $h = $pdo->query("SELECT password FROM users WHERE id = {$r['id']}")->fetchColumn();
    echo "users.id={$r['id']} ({$r['email']}): ".(password_verify($plain, $h) ? 'TRUE ✓' : 'FALSE ✗')."\n";
}

echo "\n--- Usuarios excluidos (sin cambios) ---\n";
foreach ([1, 11] as $eid) {
    $row = $pdo->query("SELECT u.id, u.email, c.Usuario FROM users u LEFT JOIN tbl_cat_usuarios c ON c.Id = u.cn_usuario_id WHERE u.id = $eid")->fetch(PDO::FETCH_ASSOC);
    echo "users.id={$row['id']} ({$row['email']}) CN={$row['Usuario']} — SIN CAMBIO\n";
}
