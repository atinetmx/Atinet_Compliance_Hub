<?php

$tenants = ['atinet_edomex_notaria_11', 'atinet_edomex_notaria_10', 'atinet_mor_notaria_10', 'atinet_oax_notaria_113', 'atinet_edomex_notaria_60', 'atinet_edomex_notaria_100', 'atinet_edomex_notaria_101'];
foreach ($tenants as $db) {
    $pdo = new PDO("mysql:host=localhost;port=3307;dbname={$db}", 'atinet_app', 'Atinet2026#Secure');
    $count = $pdo->query('SELECT COUNT(*) FROM tbl_log_general')->fetchColumn();
    if ($count > 0) {
        echo "=== {$db}: {$count} rows ===\n";
        $rows = $pdo->query('SELECT Id, Usuario_Id, Operacion, Estatus, Descripcion, Datos FROM tbl_log_general ORDER BY Id DESC LIMIT 3')->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as $r) {
            print_r($r);
        }
    } else {
        echo "{$db}: empty\n";
    }
}

// Also check master DB for any log table
$master = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$tables = $master->query("SHOW TABLES LIKE '%log%'")->fetchAll(PDO::FETCH_COLUMN);
echo "\nMaster log tables: ".implode(', ', $tables)."\n";
