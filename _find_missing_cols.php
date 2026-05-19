<?php
/**
 * Comparar esquemas de tablas tbl_* entre master y todos los tenants.
 * Detectar y aplicar columnas faltantes en tenants.
 */

$masterDb = 'atinet_compliance_hub';
$tenantDbs = [
    'atinet_edomex_notaria_11',
    'atinet_edomex_notaria_10',
    'atinet_mor_notaria_10',
    'atinet_oax_notaria_113',
    'atinet_edomex_notaria_60',
    'atinet_edomex_notaria_100',
    'atinet_edomex_notaria_101',
];

$master = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$masterDb};charset=utf8mb4",
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// Obtener schema completo de tablas tbl_* del master (columna + posición + definición)
$masterSchema = [];
$rows = $master->query(
    "SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT, EXTRA, ORDINAL_POSITION
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = '{$masterDb}' AND TABLE_NAME LIKE 'tbl_%'
     ORDER BY TABLE_NAME, ORDINAL_POSITION"
)->fetchAll(PDO::FETCH_ASSOC);

foreach ($rows as $r) {
    $masterSchema[$r['TABLE_NAME']][$r['COLUMN_NAME']] = $r;
}

echo "Tablas tbl_* en master: " . count($masterSchema) . "\n\n";

$totalAdded = 0;

foreach ($tenantDbs as $tenantDb) {
    echo "=== $tenantDb ===\n";
    try {
        $tenant = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$tenantDb};charset=utf8mb4",
            'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        // Schema del tenant
        $tenantSchema = [];
        $tRows = $tenant->query(
            "SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION
             FROM information_schema.COLUMNS
             WHERE TABLE_SCHEMA = '{$tenantDb}' AND TABLE_NAME LIKE 'tbl_%'
             ORDER BY TABLE_NAME, ORDINAL_POSITION"
        )->fetchAll(PDO::FETCH_ASSOC);
        foreach ($tRows as $r) {
            $tenantSchema[$r['TABLE_NAME']][$r['COLUMN_NAME']] = true;
        }

        $tenantMissing = false;
        foreach ($masterSchema as $table => $masterCols) {
            if (!isset($tenantSchema[$table])) continue; // tabla no existe en tenant, ignorar

            foreach ($masterCols as $colName => $colDef) {
                if (!isset($tenantSchema[$table][$colName])) {
                    $tenantMissing = true;
                    // Construir ALTER TABLE
                    $type     = $colDef['COLUMN_TYPE'];
                    $nullable = $colDef['IS_NULLABLE'] === 'YES' ? 'NULL' : 'NOT NULL';
                    $default  = '';
                    if ($colDef['COLUMN_DEFAULT'] !== null) {
                        $default = " DEFAULT '" . addslashes($colDef['COLUMN_DEFAULT']) . "'";
                    } elseif ($colDef['IS_NULLABLE'] === 'YES') {
                        $default = ' DEFAULT NULL';
                    }

                    // Encontrar columna anterior para AFTER
                    $masterColNames = array_keys($masterCols);
                    $idx = array_search($colName, $masterColNames);
                    $after = $idx > 0 ? " AFTER `{$masterColNames[$idx - 1]}`" : ' FIRST';

                    $sql = "ALTER TABLE `{$tenantDb}`.`{$table}` ADD COLUMN `{$colName}` {$type} {$nullable}{$default}{$after}";

                    try {
                        $master->exec($sql); // ejecutar desde master connection (cross-DB)
                        echo "  ✓ {$table}.{$colName} agregada\n";
                        $totalAdded++;
                    } catch (PDOException $e) {
                        echo "  ✗ {$table}.{$colName}: {$e->getMessage()}\n";
                    }
                }
            }
        }
        if (!$tenantMissing) {
            echo "  ✓ Sin columnas faltantes\n";
        }
    } catch (PDOException $e) {
        echo "  ERROR: {$e->getMessage()}\n";
    }
    echo "\n";
}

echo "Total columnas agregadas: $totalAdded\n";
