<?php

$pdo = new PDO('mysql:host=localhost;port=3307', 'atinet_app', 'Atinet2026#Secure');

echo '=== BDs tenant disponibles ==='.PHP_EOL;
$dbs = $pdo->query("SHOW DATABASES LIKE 'atinet_%'")->fetchAll(PDO::FETCH_COLUMN);
foreach ($dbs as $d) {
    echo $d.PHP_EOL;
}

// Intentar conectar a la tenant de notaria 11
echo PHP_EOL.'=== Verificando atinet_edomex_notaria_11 ==='.PHP_EOL;
try {
    $tenant = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', 'Atinet2026#Secure');
    $tables = $tenant->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
    foreach ($tables as $t) {
        echo $t.PHP_EOL;
    }
    echo PHP_EOL.'=== tbl_cat_usuarios en tenant ==='.PHP_EOL;
    $users = $tenant->query('SELECT Id, Usuario, Numero_Notaria, Activo FROM tbl_cat_usuarios LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($users as $u) {
        print_r($u);
    }
} catch (Exception $e) {
    echo 'ERROR: '.$e->getMessage().PHP_EOL;
}
