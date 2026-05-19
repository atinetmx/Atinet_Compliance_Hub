<?php

// Inspect LARAVEL_GW record in atinet_edomex_notaria_101 and check C# logs
$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
$row = $pdo->query("SELECT * FROM tbl_cat_usuarios WHERE Usuario = 'LARAVEL_GW'")->fetch(PDO::FETCH_ASSOC);
echo "=== LARAVEL_GW record in atinet_edomex_notaria_101 ===\n";
foreach ($row as $k => $v) {
    echo "  {$k}: ".var_export($v, true)."\n";
}

// Also show table columns
echo "\n=== Table columns ===\n";
$cols = $pdo->query('SHOW COLUMNS FROM tbl_cat_usuarios')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['Field']} ({$c['Type']}) default={$c['Default']} null={$c['Null']}\n";
}
