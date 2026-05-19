<?php

// Verify bcrypt hashes for LARAVEL_GW and COMPUMUNDO across ALL tenant DBs
$tenants = [
    ['db' => 'atinet_edomex_notaria_11', 'notaria_id' => 1],
    ['db' => 'atinet_edomex_notaria_10', 'notaria_id' => 2],
    ['db' => 'atinet_mor_notaria_10', 'notaria_id' => 3],
    ['db' => 'atinet_oax_notaria_113', 'notaria_id' => 4],
    ['db' => 'atinet_edomex_notaria_60', 'notaria_id' => 6],
    ['db' => 'atinet_edomex_notaria_100', 'notaria_id' => 9],
    ['db' => 'atinet_edomex_notaria_101', 'notaria_id' => 10],
];

$testPasswords = ['LaravelGW2026!', 'laravelgw2026!', 'Gateway2026!', 'gateway', 'Atinet2026!', 'LaravelGW'];

echo "=== Testing LARAVEL_GW password ===\n";
// Just test on one DB since hashes are the same across all
$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
$user = $pdo->query("SELECT Contrasena, Numero_Notaria FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW'")->fetch(PDO::FETCH_ASSOC);
echo "Numero_Notaria now: {$user['Numero_Notaria']}\n";
echo "Hash: {$user['Contrasena']}\n";
foreach ($testPasswords as $p) {
    echo (password_verify($p, $user['Contrasena']) ? '✅ MATCH' : '❌')." → {$p}\n";
}

// Note: C# uses BCrypt.Net which uses $2b$ prefix (some PHP versions only handle $2y$)
// Try converting $2b$ to $2y$ for PHP's password_verify
echo "\n--- Testing with $2b → $2y conversion ---\n";
$hash2y = str_replace('$2b$', '$2y$', $user['Contrasena']);
foreach ($testPasswords as $p) {
    echo (password_verify($p, $hash2y) ? '✅ MATCH ($2y)' : '❌')." → {$p}\n";
}

echo "\n=== tbl_cat_usuarios estado actual en atinet_edomex_notaria_101 ===\n";
foreach ($pdo->query('SELECT Id, Usuario, Numero_Notaria, Activo FROM tbl_cat_usuarios') as $r) {
    echo "  {$r['Id']} | {$r['Usuario']} | Notaria={$r['Numero_Notaria']} | Activo={$r['Activo']}\n";
}
