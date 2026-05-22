<?php
/**
 * Compara el backup de Alex vs la BD master actual
 * Detecta: tablas faltantes + columnas faltantes por tabla
 */

$backupPath = "C:\\Users\\Administrador\\Desktop\\Nueva carpeta\\dump-bd_sistemacontrolnotarial_principal-202605191611.sql";

// ── Conectar a master ────────────────────────────────────────────────────────
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

// ── Leer backup ──────────────────────────────────────────────────────────────
echo "Leyendo backup...\n";
$sql = file_get_contents($backupPath);

// ── Extraer tablas y columnas del backup ─────────────────────────────────────
preg_match_all('/CREATE TABLE `(\w+)`\s*\((.*?)\)\s*ENGINE/s', $sql, $matches, PREG_SET_ORDER);

$backupTables = [];
foreach ($matches as $m) {
    $tableName = $m[1];
    $body = $m[2];
    // extraer columnas (líneas que empiezan con `nombre_columna`)
    preg_match_all('/^\s+`(\w+)`\s+/m', $body, $cols);
    $backupTables[$tableName] = $cols[1];
}

echo "Tablas en backup: " . count($backupTables) . "\n\n";

// ── Tablas en master ──────────────────────────────────────────────────────────
$masterTablesRaw = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$masterTables = array_flip($masterTablesRaw);

// ── 1. TABLAS FALTANTES ───────────────────────────────────────────────────────
$missingTables = [];
foreach ($backupTables as $tbl => $cols) {
    if (!isset($masterTables[$tbl])) {
        $missingTables[] = $tbl;
    }
}

echo "=== TABLAS FALTANTES EN MASTER (" . count($missingTables) . ") ===\n";
foreach ($missingTables as $t) {
    echo "  - $t\n";
}

// ── 2. TABLAS EXTRA EN MASTER (info) ─────────────────────────────────────────
$extraInMaster = [];
foreach ($masterTablesRaw as $tbl) {
    if (!isset($backupTables[$tbl])) {
        $extraInMaster[] = $tbl;
    }
}
echo "\n=== TABLAS EXTRA EN MASTER (no están en backup) (" . count($extraInMaster) . ") ===\n";
foreach ($extraInMaster as $t) {
    echo "  + $t\n";
}

// ── 3. COLUMNAS FALTANTES POR TABLA ──────────────────────────────────────────
echo "\n=== COLUMNAS FALTANTES EN MASTER (por tabla) ===\n";
$anyMissingCol = false;
foreach ($backupTables as $tbl => $backupCols) {
    if (!isset($masterTables[$tbl])) {
        continue; // tabla completa ya listada arriba
    }
    // columnas actuales en master
    $stmt = $pdo->query("SHOW COLUMNS FROM `$tbl`");
    $masterCols = array_flip($stmt->fetchAll(PDO::FETCH_COLUMN));

    $missingCols = [];
    foreach ($backupCols as $col) {
        if (!isset($masterCols[$col])) {
            $missingCols[] = $col;
        }
    }
    if ($missingCols) {
        $anyMissingCol = true;
        echo "  Tabla: $tbl\n";
        foreach ($missingCols as $c) {
            echo "    - $c\n";
        }
    }
}
if (!$anyMissingCol) {
    echo "  (ninguna)\n";
}

echo "\nDone.\n";
