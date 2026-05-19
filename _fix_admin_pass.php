<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Generar hash BCrypt compatible con Laravel ($2y$)
$newHash = password_hash('ADMIN', PASSWORD_BCRYPT, ['cost' => 12]);
echo "Nuevo hash generado: $newHash\n";
echo 'Prefijo: '.substr($newHash, 0, 7)."\n";

// Verificar antes de aplicar
echo 'Verificacion: '.(password_verify('ADMIN', $newHash) ? 'TRUE ✓' : 'FALSE ✗')."\n\n";

// Actualizar SOLO users.id=11 (admin@atinet.com.mx, cn_usuario_id=1)
$stmt = $pdo->prepare('UPDATE users SET password = ? WHERE id = 11 AND cn_usuario_id = 1');
$stmt->execute([$newHash]);
echo 'Filas actualizadas: '.$stmt->rowCount()."\n";

// Verificar resultado final
$u = $pdo->query('SELECT id, email, SUBSTRING(password,1,30) as hash_prefix FROM users WHERE id = 11')->fetch(PDO::FETCH_ASSOC);
echo 'Hash guardado: '.$u['hash_prefix']."...\n";
$full = $pdo->query('SELECT password FROM users WHERE id = 11')->fetchColumn();
echo "Verificacion final password_verify('ADMIN'): ".(password_verify('ADMIN', $full) ? 'TRUE ✓' : 'FALSE ✗')."\n";
