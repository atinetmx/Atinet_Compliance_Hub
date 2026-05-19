<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$plain = 'admin123';
$userIds = [2, 3, 4, 5, 13, 16, 17, 18, 19, 22, 23];

// Generar hashes una sola vez
$hashLaravel = password_hash($plain, PASSWORD_BCRYPT, ['cost' => 12]);
$hashCsharp = str_replace('$2y$', '$2a$', $hashLaravel);

echo 'Hash Laravel: '.substr($hashLaravel, 0, 30)."...\n";
echo 'Hash C#:      '.substr($hashCsharp, 0, 30)."...\n\n";

// Obtener los usuarios con su cn_usuario_id
$inList = implode(',', $userIds);
$rows = $pdo->query("
    SELECT u.id, u.email, u.cn_usuario_id, c.Usuario
    FROM users u
    LEFT JOIN tbl_cat_usuarios c ON c.Id = u.cn_usuario_id
    WHERE u.id IN ($inList)
    ORDER BY u.id
")->fetchAll(PDO::FETCH_ASSOC);

echo str_pad('uid', 5).str_pad('email', 38).str_pad('cn_id', 7)."cn_usuario\n";
echo str_repeat('-', 65)."\n";

$cnIds = [];
foreach ($rows as $r) {
    echo str_pad($r['id'], 5).str_pad($r['email'], 38).str_pad($r['cn_usuario_id'] ?? 'NULL', 7).($r['Usuario'] ?? 'N/A')."\n";
    if ($r['cn_usuario_id']) {
        $cnIds[] = (int) $r['cn_usuario_id'];
    }
}

// Actualizar users
$stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id IN ($inList)");
$stmt->execute([$hashLaravel]);
echo "\nusers actualizados: ".$stmt->rowCount()." fila(s)\n";

// Actualizar tbl_cat_usuarios
if (! empty($cnIds)) {
    $cnList = implode(',', array_unique($cnIds));
    $stmt2 = $pdo->prepare("UPDATE tbl_cat_usuarios SET Contrasena = ? WHERE Id IN ($cnList)");
    $stmt2->execute([$hashCsharp]);
    echo 'tbl_cat_usuarios actualizados: '.$stmt2->rowCount()." fila(s)\n";
}

// Verificacion rapida (solo el primero y el ultimo)
echo "\nVerificacion:\n";
foreach ([$rows[0], $rows[count($rows) - 1]] as $r) {
    $h = $pdo->query("SELECT password FROM users WHERE id = {$r['id']}")->fetchColumn();
    echo "users.id={$r['id']} ({$r['email']}): ".(password_verify($plain, $h) ? 'TRUE ✓' : 'FALSE ✗')."\n";
}
