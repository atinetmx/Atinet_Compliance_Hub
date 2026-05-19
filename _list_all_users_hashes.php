<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$rows = $pdo->query('
    SELECT 
        u.id as user_id,
        u.email,
        SUBSTRING(u.password, 1, 7) as user_prefix,
        u.cn_usuario_id,
        c.Usuario as cn_usuario,
        SUBSTRING(c.Contrasena, 1, 7) as cn_prefix
    FROM users u
    LEFT JOIN tbl_cat_usuarios c ON c.Id = u.cn_usuario_id
    ORDER BY u.id
')->fetchAll(PDO::FETCH_ASSOC);

echo str_pad('uid', 5).str_pad('email', 38).str_pad('cn_usuario', 18).str_pad('user_prefix', 13).str_pad('cn_prefix', 10)."\n";
echo str_repeat('-', 85)."\n";
foreach ($rows as $r) {
    echo str_pad($r['user_id'], 5)
       .str_pad($r['email'], 38)
       .str_pad($r['cn_usuario'] ?? 'N/A', 18)
       .str_pad($r['user_prefix'], 13)
       .str_pad($r['cn_prefix'] ?? 'NULL', 10)
       ."\n";
}
