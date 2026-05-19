<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// tbl_cat_usuarios Id=1 (ADMIN)
$cn = $pdo->query('SELECT Id, Usuario, Contrasena FROM tbl_cat_usuarios WHERE Id = 1')->fetch(PDO::FETCH_ASSOC);
echo "=== tbl_cat_usuarios (ADMIN) ===\n";
echo 'Id:       '.$cn['Id']."\n";
echo 'Usuario:  '.$cn['Usuario']."\n";
echo 'Hash:     '.$cn['Contrasena']."\n\n";

// Verificar que la contraseña "ADMIN" coincide con el hash
$plain = 'ADMIN';
$verifica = password_verify($plain, $cn['Contrasena']);
echo "password_verify('ADMIN', hash) => ".($verifica ? 'TRUE ✓' : 'FALSE ✗')."\n\n";

// users con cn_usuario_id=1
$u = $pdo->query('SELECT id, email, password FROM users WHERE cn_usuario_id = 1')->fetch(PDO::FETCH_ASSOC);
if ($u) {
    echo "=== users (cn_usuario_id=1) ===\n";
    echo 'id:      '.$u['id']."\n";
    echo 'email:   '.$u['email']."\n";
    echo 'Hash:    '.$u['password']."\n\n";
    $verifica2 = password_verify($plain, $u['password']);
    echo "password_verify('ADMIN', hash users) => ".($verifica2 ? 'TRUE ✓' : 'FALSE ✗')."\n";
} else {
    echo "No se encontró ningún user con cn_usuario_id=1\n";
}
