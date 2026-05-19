<?php

// Check what tables exist in tenant and their record counts
$tenants = [
    'atinet_edomex_notaria_11' => 1,
    'atinet_edomex_notaria_10' => 2,
];

foreach ($tenants as $db => $notariaId) {
    echo "\n== BD: $db ==\n";
    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
        'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Show all tables with counts
    foreach ($pdo->query('SHOW TABLES') as $t) {
        $table = $t[0];
        $cnt = $pdo->query("SELECT COUNT(*) FROM `$table`")->fetchColumn();
        echo "  $table: $cnt rows\n";
    }

    // Check tbl_cat_usuarios detail
    echo "\n  tbl_cat_usuarios:\n";
    foreach ($pdo->query('SELECT Id, Usuario, Activo, Sesion_Iniciada FROM tbl_cat_usuarios ORDER BY Id') as $r) {
        echo "    Id={$r['Id']} {$r['Usuario']} Activo={$r['Activo']} Sesion={$r['Sesion_Iniciada']}\n";
    }

    // Show log table structure
    $tables = $pdo->query("SHOW TABLES LIKE 'tbl_log_bitacora'")->fetchAll();
    if ($tables) {
        echo "\n  tbl_log_bitacora CREATE:\n";
        $r = $pdo->query('SHOW CREATE TABLE tbl_log_bitacora')->fetch();
        // Extract FK lines only
        foreach (explode("\n", $r[1]) as $line) {
            if (stripos($line, 'FOREIGN KEY') !== false || stripos($line, 'CONSTRAINT') !== false) {
                echo '    '.trim($line)."\n";
            }
        }
    }
}
