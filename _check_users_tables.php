<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo '=== TABLAS ==='.PHP_EOL;
$rows = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
foreach ($rows as $r) {
    echo $r.PHP_EOL;
}

// Buscar tabla de usuarios
$userTables = array_filter($rows, fn ($t) => stripos($t, 'user') !== false || stripos($t, 'usuario') !== false);
echo PHP_EOL.'=== TABLAS DE USUARIOS ==='.PHP_EOL;
foreach ($userTables as $t) {
    echo $t.PHP_EOL;
    $cols = $pdo->query("SELECT * FROM `$t` LIMIT 5")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($cols as $row) {
        print_r($row);
    }
}
