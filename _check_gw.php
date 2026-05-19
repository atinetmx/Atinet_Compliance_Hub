<?php

// db-connection-test
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$rows = $pdo->query("SELECT Id, Usuario, Contrasena, Sesion_Iniciada, Activo FROM tbl_cat_usuarios WHERE Usuario IN ('LARAVEL_GW','ADMIN')");
foreach ($rows as $r) {
    echo "ID: {$r['Id']} | Usuario: {$r['Usuario']} | Password: {$r['Contrasena']} | Sesion: {$r['Sesion_Iniciada']} | Activo: {$r['Activo']}\n";
}

// También verificar qué contraseña tiene el usuario en users (para ADMIN)
$rows2 = $pdo->query("SELECT id, cn_usuario_id FROM users WHERE email LIKE '%admin%' LIMIT 3");
foreach ($rows2 as $r) {
    echo "Laravel user id: {$r['id']} | cn_usuario_id: {$r['cn_usuario_id']}\n";
}
