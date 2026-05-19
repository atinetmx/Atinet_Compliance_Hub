<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// Traer todos los users con su tbl_cat_usuarios vinculado
$rows = $pdo->query('
    SELECT 
        u.id as user_id,
        u.email,
        u.password as user_hash,
        u.cn_usuario_id,
        c.Usuario as cn_usuario,
        c.Contrasena as cn_hash
    FROM users u
    LEFT JOIN tbl_cat_usuarios c ON c.Id = u.cn_usuario_id
    ORDER BY u.id
')->fetchAll(PDO::FETCH_ASSOC);

echo str_pad('user_id', 8).str_pad('email', 35).str_pad('cn_usuario', 18).str_pad('users hash OK?', 16).str_pad('cn hash OK?', 12)."\n";
echo str_repeat('-', 90)."\n";

// Contraseñas conocidas a probar
$candidates = ['ADMIN', 'admin', '12345', '123456', 'password', 'atinet', 'Atinet', 'notaria', '1234'];

foreach ($rows as $r) {
    $userMatch = '???';
    $cnMatch = '???';
    $matchedPwd = null;

    foreach ($candidates as $pwd) {
        if (password_verify($pwd, $r['user_hash'])) {
            $userMatch = "OK ($pwd)";
            $matchedPwd = $pwd;
            break;
        }
    }
    foreach ($candidates as $pwd) {
        if ($r['cn_hash'] && password_verify($pwd, $r['cn_hash'])) {
            $cnMatch = "OK ($pwd)";
            break;
        }
    }

    echo str_pad($r['user_id'], 8)
       .str_pad($r['email'], 35)
       .str_pad($r['cn_usuario'] ?? 'N/A', 18)
       .str_pad($userMatch, 16)
       .str_pad($cnMatch, 12)
       ."\n";
}
