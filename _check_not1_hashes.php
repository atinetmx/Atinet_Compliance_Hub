<?php

/**
 * Verificar hashes de NOT1, SEC1, RES1, USUARIO en notaria_11
 * y determinar a qué contraseña corresponden.
 */
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$masterPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$usuarios = ['NOT1', 'SEC1', 'RES1', 'USUARIO'];
$candidatos = ['admin123', 'ADMIN', 'password123', 'notaria11', '123456', 'notaria'];

echo "=== HASHES en tenant notaria_11 vs master ===\n\n";

foreach ($usuarios as $usr) {
    $tenantRow = $pdo->prepare('SELECT Id, Usuario, Contrasena FROM tbl_cat_usuarios WHERE Usuario=? LIMIT 1');
    $tenantRow->execute([$usr]);
    $tr = $tenantRow->fetch(PDO::FETCH_ASSOC);

    $masterRow = $masterPdo->prepare('SELECT Id, Contrasena FROM tbl_cat_usuarios WHERE Usuario=? LIMIT 1');
    $masterRow->execute([$usr]);
    $mr = $masterRow->fetch(PDO::FETCH_ASSOC);

    echo "[$usr]\n";
    echo "  Tenant  Id={$tr['Id']} hash={$tr['Contrasena']}\n";
    echo "  Master  Id={$mr['Id']} hash={$mr['Contrasena']}\n";
    echo '  Mismo hash: '.($tr['Contrasena'] === $mr['Contrasena'] ? 'SÍ' : 'NO')."\n";

    // Probar candidatos de contraseña contra hash del tenant
    $hashTenant = $tr['Contrasena'];
    // BCrypt $2a$ → PHP necesita $2y$ para password_verify
    $hashForPHP = '$2y$'.substr($hashTenant, 4);
    echo "  Probando contraseñas:\n";
    foreach ($candidatos as $pwd) {
        $ok = password_verify($pwd, $hashForPHP);
        if ($ok) {
            echo "    ✓ '$pwd' COINCIDE\n";
        }
    }

    echo "\n";
}
