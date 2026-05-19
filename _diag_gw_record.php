<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');

echo "=== DESCRIBE tbl_cat_usuarios ===\n";
foreach ($pdo->query('DESCRIBE tbl_cat_usuarios') as $col) {
    echo $col['Field'].' | '.$col['Type']."\n";
}

echo "\n=== LARAVEL_GW actual record ===\n";
$row = $pdo->query("SELECT Id, Usuario, LENGTH(Contrasena) as hash_len, Contrasena, Numero_Notaria, Activo, Sesion_Iniciada, Tipo, Rol_Id FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW'")->fetch(PDO::FETCH_ASSOC);
foreach ($row as $k => $v) {
    echo "{$k}: {$v}\n";
}

echo "\nHash length: ".strlen($row['Contrasena'])." chars\n";
echo 'Starts with: '.substr($row['Contrasena'], 0, 7)."\n";

// Verify both variants
$pass = 'LaravelGW2026!';
echo "\npwd_verify \$2b: ".(password_verify($pass, $row['Contrasena']) ? 'YES' : 'NO')."\n";
echo 'pwd_verify $2y: '.(password_verify($pass, str_replace('$2b$', '$2y$', $row['Contrasena'])) ? 'YES' : 'NO')."\n";
