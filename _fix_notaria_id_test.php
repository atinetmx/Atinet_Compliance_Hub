<?php

/**
 * Test updating Numero_Notaria in atinet_edomex_notaria_101 from 101 → 10
 * to match notarias.id=10
 *
 * This is a reversible test. Run with ?rollback=1 to undo.
 */
$rollback = isset($_GET['rollback']) || in_array('--rollback', $argv ?? []);

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$oldValue = '101';
$newValue = '10';

if ($rollback) {
    echo "=== ROLLBACK: {$newValue} → {$oldValue} ===\n";
    $oldValue = '10';
    $newValue = '101';
}

// Tables to update (find all tables with Numero_Notaria column)
$tables = $pdo->query("SELECT TABLE_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'atinet_edomex_notaria_101' AND COLUMN_NAME = 'Numero_Notaria'")->fetchAll(PDO::FETCH_COLUMN);

echo "Tables with Numero_Notaria column:\n";
foreach ($tables as $table) {
    $count = $pdo->query("SELECT COUNT(*) FROM `{$table}` WHERE Numero_Notaria = '{$oldValue}'")->fetchColumn();
    echo "  {$table}: {$count} rows with Numero_Notaria='{$oldValue}'\n";
    if ($count > 0) {
        $updated = $pdo->exec("UPDATE `{$table}` SET Numero_Notaria = '{$newValue}' WHERE Numero_Notaria = '{$oldValue}'");
        echo "  → Updated {$updated} rows\n";
    }
}

// Verify
echo "\n=== Verification: tbl_cat_usuarios ===\n";
foreach ($pdo->query('SELECT Id, Usuario, Numero_Notaria, Activo FROM tbl_cat_usuarios') as $r) {
    echo "  {$r['Id']} | {$r['Usuario']} | Numero_Notaria={$r['Numero_Notaria']} | Activo={$r['Activo']}\n";
}
echo "\n=== Verification: tbl_cfg_notaria ===\n";
foreach ($pdo->query('SELECT Id, Nombre_Notario, Numero_Notaria FROM tbl_cfg_notaria') as $r) {
    echo "  {$r['Id']} | {$r['Nombre_Notario']} | Numero_Notaria={$r['Numero_Notaria']}\n";
}
echo "\nDone. Test login with notaria=10 now.\n";
