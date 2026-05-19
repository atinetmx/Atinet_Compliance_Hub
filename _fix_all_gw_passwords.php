<?php

/**
 * Reset LARAVEL_GW password to LaravelGW2026! in ALL tenant DBs.
 * PHP generates $2y$ bcrypt; BCrypt.Net (C#) verifies both $2y$ and $2b$ variants.
 */
$newPassword = 'LaravelGW2026!';
$hash = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
echo "New hash: {$hash}\n\n";

$tenants = [
    'atinet_edomex_notaria_11',
    'atinet_edomex_notaria_10',
    'atinet_mor_notaria_10',
    'atinet_oax_notaria_113',
    'atinet_edomex_notaria_60',
    'atinet_edomex_notaria_100',
    'atinet_edomex_notaria_101',
];

foreach ($tenants as $db) {
    try {
        $pdo = new PDO("mysql:host=localhost;port=3307;dbname={$db}", 'atinet_app', 'Atinet2026#Secure');
        $stmt = $pdo->prepare("UPDATE tbl_cat_usuarios SET Contrasena = ?, Sesion_Iniciada = 0 WHERE Usuario = 'LARAVEL_GW'");
        $stmt->execute([$hash]);
        $rows = $stmt->rowCount();
        echo "✅ {$db}: updated {$rows} row(s)\n";
    } catch (Exception $e) {
        echo "❌ {$db}: ".$e->getMessage()."\n";
    }
}

echo "\nVerification en atinet_edomex_notaria_101:\n";
$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
$row = $pdo->query("SELECT Contrasena FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW'")->fetch(PDO::FETCH_ASSOC);
echo "Hash guardado: {$row['Contrasena']}\n";
echo 'Verifica OK: '.(password_verify($newPassword, $row['Contrasena']) ? 'SI' : 'NO')."\n";
