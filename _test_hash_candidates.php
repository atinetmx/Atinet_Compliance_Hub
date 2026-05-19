<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
$hash = $pdo->query("SELECT Contrasena FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW'")->fetchColumn();
echo "Hash: {$hash}\n\n";

$candidates = [
    'LaravelGateway2026#',
    'LaravelGateway2026!',
    'LaravelGateway2026',
    'Gateway2026#',
    'Atinet2026#Secure',
    'LaravelGW2026!',
    'LaravelGW_2026!',
    'LaravelGW2026',
    'laravelgw',
    'admin',
    '1010',
];

echo "Testing against hash directly (\$2b support):\n";
foreach ($candidates as $p) {
    $ok = password_verify($p, $hash);
    echo ($ok ? '✅ MATCH' : '❌').": {$p}\n";
}

$hash2y = str_replace('$2b$', '$2y$', $hash);
echo "\nTesting with \$2b → \$2y:\n";
foreach ($candidates as $p) {
    $ok = password_verify($p, $hash2y);
    echo ($ok ? '✅ MATCH' : '❌').": {$p}\n";
}

// Also check PHP version
echo "\nPHP version: ".PHP_VERSION."\n";
