<?php

$pdo = new PDO('mysql:host=localhost;port=3307', 'atinet_app', 'Atinet2026#Secure');

// Check which tenant DBs exist
$dbs = $pdo->query("SHOW DATABASES LIKE 'atinet_%'")->fetchAll(PDO::FETCH_COLUMN);
echo "=== Tenant DBs ===\n";
foreach ($dbs as $db) {
    echo $db."\n";
}

// Check if atinet_edomex_notaria_101 has tbl_cat_usuarios
echo "\n=== Checking atinet_edomex_notaria_101 ===\n";
try {
    $pdo2 = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
    $tables = $pdo2->query("SHOW TABLES LIKE 'tbl_cat_usuarios'")->fetchAll(PDO::FETCH_COLUMN);
    echo 'tbl_cat_usuarios exists: '.(count($tables) > 0 ? 'YES' : 'NO')."\n";
    if (count($tables) > 0) {
        $users = $pdo2->query('SELECT Id, Usuario, Numero_Notaria, Rol_Id, Activo FROM tbl_cat_usuarios LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($users as $u) {
            echo $u['Id'].' | '.$u['Usuario'].' | Notaria='.$u['Numero_Notaria'].' | Rol='.$u['Rol_Id'].' | Activo='.$u['Activo']."\n";
        }
    }
} catch (Exception $e) {
    echo 'ERROR: '.$e->getMessage()."\n";
}
