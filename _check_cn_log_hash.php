<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

// Ver últimas entradas en tbl_log_general
$rows = $pdo->query('SELECT Id, Estatus, Operacion, Descripcion, Datos, Fecha_Creacion FROM tbl_log_general ORDER BY Id DESC LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
echo "tbl_log_general recientes:\n";
foreach ($rows as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
}

// Ver el hash EXACTO en la DB con HEX para detectar bytes ocultos
echo "\n--- SUPERUSUARIO (Id=9) ---\n";
$row = $pdo->query('SELECT Id, Usuario, Numero_Notaria, Contrasena, HEX(Contrasena) as hex_hash, CHAR_LENGTH(Contrasena) as len, LENGTH(Contrasena) as byte_len FROM tbl_cat_usuarios WHERE Id = 9')->fetch(PDO::FETCH_ASSOC);
echo 'Contrasena: '.$row['Contrasena']."\n";
echo 'Len chars: '.$row['len']."\n";
echo 'Len bytes: '.$row['byte_len']."\n";
echo 'Hex: '.$row['hex_hash']."\n";

// Verificar PHP
$plain = 'pasword123';
$hash = $row['Contrasena'];
echo "\nPHP password_verify('$plain', hash): ".(password_verify($plain, $hash) ? 'YES' : 'NO')."\n";

// Verificar info del hash
$info = password_get_info($hash);
echo 'Hash info: '.json_encode($info)."\n";

// Ver también ADMIN (Id=1)
echo "\n--- ADMIN (Id=1) ---\n";
$row2 = $pdo->query('SELECT Id, Usuario, Contrasena, CHAR_LENGTH(Contrasena) as len FROM tbl_cat_usuarios WHERE Id = 1')->fetch(PDO::FETCH_ASSOC);
echo 'Contrasena: '.$row2['Contrasena']."\n";
echo 'Len: '.$row2['len']."\n";
$info2 = password_get_info($row2['Contrasena']);
echo 'Hash info: '.json_encode($info2)."\n";
echo "PHP verify '1010': ".(password_verify('1010', $row2['Contrasena']) ? 'YES' : 'NO')."\n";

// Ver un tenant user (notaria=1, atinet_edomex_notaria_11)
echo "\n--- Tenant DB: buscando un user en atinet_edomex_notaria_11 ---\n";
try {
    $pdo2 = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', 'Atinet2024!');
    $r3 = $pdo2->query('SELECT Id, Usuario, Numero_Notaria, Contrasena, CHAR_LENGTH(Contrasena) as len FROM tbl_cat_usuarios LIMIT 3')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($r3 as $r) {
        echo "Id={$r['Id']} Usuario={$r['Usuario']} NN={$r['Numero_Notaria']} len={$r['len']} hash_prefix=".substr($r['Contrasena'], 0, 10)."\n";
    }
} catch (Exception $e) {
    echo 'Error tenant: '.$e->getMessage()."\n";
}
