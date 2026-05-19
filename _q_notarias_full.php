<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

// Full notarias table structure + data
echo "=== notarias columns ===\n";
foreach ($pdo->query('DESCRIBE notarias') as $col) {
    echo $col['Field'].' | '.$col['Type'].' | '.($col['Null'] === 'YES' ? 'nullable' : 'not null')."\n";
}

echo "\n=== notarias data ===\n";
foreach ($pdo->query('SELECT * FROM notarias ORDER BY id') as $r) {
    echo implode(' | ', array_map(fn ($v) => $v ?? 'NULL', $r))."\n";
}

// Also check tbl_cat_usuarios across all tenant DBs
$tenants = [
    ['db' => 'atinet_edomex_notaria_11', 'id' => 1],
    ['db' => 'atinet_edomex_notaria_10', 'id' => 2],
    ['db' => 'atinet_mor_notaria_10', 'id' => 3],
    ['db' => 'atinet_oax_notaria_113', 'id' => 4],
    ['db' => 'atinet_edomex_notaria_60', 'id' => 6],
    ['db' => 'atinet_edomex_notaria_100', 'id' => 9],
    ['db' => 'atinet_edomex_notaria_101', 'id' => 10],
];

echo "\n=== Numero_Notaria in each tenant tbl_cat_usuarios ===\n";
foreach ($tenants as $t) {
    try {
        $pdo2 = new PDO("mysql:host=localhost;port=3307;dbname={$t['db']}", 'atinet_app', 'Atinet2026#Secure');
        $numNotaria = $pdo2->query('SELECT DISTINCT Numero_Notaria FROM tbl_cat_usuarios LIMIT 5')->fetchAll(PDO::FETCH_COLUMN);
        echo "notarias.id={$t['id']} | {$t['db']} | Numero_Notaria in tbl_cat_usuarios: ".implode(', ', $numNotaria)."\n";
    } catch (Exception $e) {
        echo "notarias.id={$t['id']} | {$t['db']} | ERROR: ".$e->getMessage()."\n";
    }
}
