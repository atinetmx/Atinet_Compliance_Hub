<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$plain = 'password123';

// Hash $2y$ para Laravel (users)
$hashLaravel = password_hash($plain, PASSWORD_BCRYPT, ['cost' => 12]);

// Hash $2a$ para C# (tbl_cat_usuarios) — mismo algoritmo, solo cambia el prefijo
$hashCsharp = str_replace('$2y$', '$2a$', $hashLaravel);

// Actualizar users.id=1
$stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = 1');
$stmt->execute([$hashLaravel]);
echo 'users.id=1 actualizado: '.$stmt->rowCount()." fila(s)\n";

// Actualizar tbl_cat_usuarios.Id=9 (SUPERUSUARIO, vinculado a users.id=1)
$stmt2 = $pdo->prepare('UPDATE tbl_cat_usuarios SET Contrasena = ? WHERE Id = 9');
$stmt2->execute([$hashCsharp]);
echo 'tbl_cat_usuarios.Id=9 (SUPERUSUARIO) actualizado: '.$stmt2->rowCount()." fila(s)\n";

// Verificacion final
$uHash = $pdo->query('SELECT password FROM users WHERE id = 1')->fetchColumn();
$cnHash = $pdo->query('SELECT Contrasena FROM tbl_cat_usuarios WHERE Id = 9')->fetchColumn();

echo "\nVerificacion users.id=1:           ".(password_verify($plain, $uHash) ? 'TRUE ✓' : 'FALSE ✗')."\n";
echo 'Verificacion tbl_cat_usuarios.Id=9: '.(password_verify($plain, $cnHash) ? 'TRUE ✓' : 'FALSE ✗')."\n";
