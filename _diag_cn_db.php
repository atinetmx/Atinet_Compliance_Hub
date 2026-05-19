<?php

/**
 * Diagnosis: Compare structures and data for failing vs succeeding tenants
 */
$masterPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$tenants = [
    'atinet_compliance_hub' => '(MASTER - success)',
    'atinet_edomex_notaria_11' => '(notaria_id=1 - FAILS)',
];

foreach ($tenants as $db => $note) {
    echo "\n=== BD: $db $note ===\n";
    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname=$db;charset=utf8mb4",
        'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Show full tbl_log_general DDL
    $tables = $pdo->query("SHOW TABLES LIKE 'tbl_log_general'")->fetchAll();
    if ($tables) {
        echo "\ntbl_log_general DDL:\n";
        $r = $pdo->query('SHOW CREATE TABLE tbl_log_general')->fetch();
        echo $r[1]."\n";

        echo "\ntbl_log_general sample (last 3):\n";
        foreach ($pdo->query('SELECT * FROM tbl_log_general ORDER BY Id DESC LIMIT 3') as $row) {
            echo json_encode($row, JSON_UNESCAPED_UNICODE)."\n";
        }
    }

    echo "\ntbl_cat_usuarios IDs available:\n";
    foreach ($pdo->query('SELECT Id, Usuario FROM tbl_cat_usuarios ORDER BY Id') as $r) {
        echo "  Id={$r['Id']} {$r['Usuario']}\n";
    }
}
