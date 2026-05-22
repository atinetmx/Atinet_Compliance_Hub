<?php
/**
 * Compara el backup de Alex vs la BD master.
 * Reporta: tablas faltantes en master, columnas faltantes por tabla.
 */

$backupFile = 'C:\\Users\\Administrador\\Desktop\\Nueva carpeta\\dump-bd_sistemacontrolnotarial_principal-202605191611.sql';
$dsn        = 'mysql:host=localhost;port=3306;dbname=atinet_compliance_hub';

// --- intentar también puerto 3307 si 3306 falla ---
try {
    $pdo = new PDO($dsn, 'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
} catch (Exception $e) {
    $pdo = new PDO(str_replace('3306', '3307', $dsn), 'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
}

// 1) Leer tablas y columnas del backup
$backupSchema = []; // ['table' => ['col1','col2',...]]
$lines = file($backupFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

$currentTable = null;
foreach ($lines as $line) {
    // Detectar CREATE TABLE
    if (preg_match('/^CREATE TABLE `(.+?)`/i', $line, $m)) {
        $currentTable = $m[1];
        $backupSchema[$currentTable] = [];
        continue;
    }
    // Detectar columnas (líneas que empiezan con `nombre_col`)
    if ($currentTable && preg_match('/^\s+`([^`]+)`\s+(int|bigint|tinyint|smallint|varchar|char|text|longtext|mediumtext|decimal|float|double|datetime|date|timestamp|tinytext|blob|enum|json|bit)/i', $line, $m)) {
        $backupSchema[$currentTable][] = $m[1];
    }
    // Fin de tabla
    if ($currentTable && preg_match('/^\) ENGINE=/i', $line)) {
        $currentTable = null;
    }
}

// 2) Leer tablas y columnas del master
$masterTables = $pdo->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
$masterSchema = [];
foreach ($masterTables as $table) {
    $cols = $pdo->query("SHOW COLUMNS FROM `{$table}`")->fetchAll(PDO::FETCH_COLUMN);
    $masterSchema[$table] = $cols;
}

// 3) Comparar
$missingTables  = [];
$missingColumns = [];

foreach ($backupSchema as $table => $cols) {
    if (!isset($masterSchema[$table])) {
        $missingTables[] = $table;
        continue;
    }
    $missing = array_diff($cols, $masterSchema[$table]);
    if ($missing) {
        $missingColumns[$table] = array_values($missing);
    }
}

$extraTables = array_diff($masterTables, array_keys($backupSchema));

// 4) Reporte
echo "\n";
echo str_repeat('=', 70) . "\n";
echo "  BACKUP DE ALEX vs MASTER (atinet_compliance_hub)\n";
echo str_repeat('=', 70) . "\n";

echo "\n📋 TABLAS EN BACKUP: " . count($backupSchema) . "\n";
echo "📋 TABLAS EN MASTER: " . count($masterTables) . "\n";

echo "\n❌ TABLAS FALTANTES EN MASTER (" . count($missingTables) . "):\n";
if ($missingTables) {
    foreach ($missingTables as $t) {
        echo "   - {$t}\n";
    }
} else {
    echo "   Ninguna\n";
}

echo "\n⚠️  COLUMNAS FALTANTES EN MASTER (" . count($missingColumns) . " tablas):\n";
if ($missingColumns) {
    foreach ($missingColumns as $table => $cols) {
        echo "   {$table}:\n";
        foreach ($cols as $col) {
            echo "      + {$col}\n";
        }
    }
} else {
    echo "   Ninguna\n";
}

echo "\n➕ TABLAS EXTRA EN MASTER (no están en backup de Alex) (" . count($extraTables) . "):\n";
if ($extraTables) {
    foreach ($extraTables as $t) {
        echo "   + {$t}\n";
    }
} else {
    echo "   Ninguna\n";
}

echo "\n" . str_repeat('=', 70) . "\n";
echo "✅ COMPARACIÓN COMPLETADA\n";
echo str_repeat('=', 70) . "\n\n";
