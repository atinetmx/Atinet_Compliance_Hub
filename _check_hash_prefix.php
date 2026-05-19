<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=information_schema', 'atinet_app', 'Atinet2026#Secure');
$rows = $pdo->query("
    SELECT TABLE_SCHEMA, TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
    FROM COLUMNS
    WHERE COLUMN_NAME = 'Orden_Caja'
    ORDER BY TABLE_SCHEMA, TABLE_NAME
")->fetchAll(PDO::FETCH_ASSOC);

if (empty($rows)) {
    echo "Orden_Caja NO existe en ninguna BD\n";
} else {
    foreach ($rows as $r) {
        echo "{$r['TABLE_SCHEMA']}.{$r['TABLE_NAME']} | tipo:{$r['COLUMN_TYPE']} | null:{$r['IS_NULLABLE']} | default:{$r['COLUMN_DEFAULT']}\n";
    }
}

// Buscar Orden_Caja en todas las tablas de ambas BDs
foreach ([['master', $pdo, 'atinet_compliance_hub'], ['tenant', $pdo2, 'atinet_edomex_notaria_11']] as [$label, $db, $dbname]) {
    $rows = $db->query("SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA='$dbname' AND COLUMN_NAME='Orden_Caja'")->fetchAll(PDO::FETCH_ASSOC);
    echo "=== {$label} ({$dbname}) ===\n";
    if (empty($rows)) {
        echo "  NO encontrado\n";
    } else {
        foreach ($rows as $r) {
            echo "  {$r['TABLE_NAME']}.{$r['COLUMN_NAME']} ({$r['COLUMN_TYPE']})\n";
        }
    }
}

// Comparar tablas completas de ambas BDs
echo "\n=== Tablas en tenant pero NO en master ===\n";
$tMaster = array_column($pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_NUM), 0);
$tTenant = array_column($pdo2->query('SHOW TABLES')->fetchAll(PDO::FETCH_NUM), 0);
$diff = array_diff($tTenant, $tMaster);
echo empty($diff) ? "  Ninguna\n" : implode(', ', $diff)."\n";
