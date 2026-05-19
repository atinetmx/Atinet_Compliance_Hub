<?php

/**
 * Reset LARAVEL_GW password con hash $2b$ (BCrypt.Net-Next enhanced compatible).
 * PHP genera $2y$ → convertimos prefijo a $2b$.
 * El algoritmo bcrypt es idéntico, solo cambia el marcador de versión.
 */
$newPassword = 'LaravelGW2026!';
$hash2y = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => 10]);
$hash2b = str_replace('$2y$', '$2b$', $hash2y);

echo "Password: {$newPassword}\n";
echo "Hash \$2y (PHP): {$hash2y}\n";
echo "Hash \$2b (C#):  {$hash2b}\n";
echo 'PHP verifies $2b: '.(password_verify($newPassword, str_replace('$2b$', '$2y$', $hash2b)) ? 'SI' : 'NO')."\n\n";

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
        $stmt->execute([$hash2b]);
        echo "✅ {$db}: updated {$stmt->rowCount()} row(s)\n";
    } catch (Exception $e) {
        echo "❌ {$db}: ".$e->getMessage()."\n";
    }
}
echo "\nListo. Prueba: POST /api/Login/Authentication con notaria=10, usuario=LARAVEL_GW, contrasena=LaravelGW2026!\n";
