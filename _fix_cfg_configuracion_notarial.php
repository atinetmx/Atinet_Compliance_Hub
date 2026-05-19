<?php
/**
 * Aplicar ALTER TABLE de las columnas nuevas de tbl_cfg_configuracion_notarial
 * a todos los tenants que aún no las tienen:
 *   - Orden_Caja INT NULL
 *   - Orden_Pago INT NULL
 *   - Servidor TEXT NULL
 */

$dbs = [
    'atinet_compliance_hub',
    'atinet_edomex_notaria_11',
    'atinet_edomex_notaria_10',
    'atinet_mor_notaria_10',
    'atinet_oax_notaria_113',
    'atinet_edomex_notaria_60',
    'atinet_edomex_notaria_100',
    'atinet_edomex_notaria_101',
];

$columnas = [
    'Orden_Caja'   => "ALTER TABLE tbl_cfg_configuracion_notarial ADD COLUMN Orden_Caja INT NULL AFTER Recibo_Honorarios",
    'Orden_Pago'   => "ALTER TABLE tbl_cfg_configuracion_notarial ADD COLUMN Orden_Pago INT NULL AFTER Orden_Caja",
    'Servidor'     => "ALTER TABLE tbl_cfg_configuracion_notarial ADD COLUMN Servidor TEXT NULL AFTER Folio_Inicial_Tomo_Certificaciones",
];

foreach ($dbs as $db) {
    echo "[$db]\n";
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
            'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        // Verificar que la tabla existe
        $exists = $pdo->query("SHOW TABLES LIKE 'tbl_cfg_configuracion_notarial'")->fetchAll();
        if (empty($exists)) {
            echo "  ⚠ tbl_cfg_configuracion_notarial no existe — omitiendo\n\n";
            continue;
        }

        // Obtener columnas actuales
        $cols = $pdo->query("SHOW COLUMNS FROM tbl_cfg_configuracion_notarial")
            ->fetchAll(PDO::FETCH_COLUMN);

        foreach ($columnas as $nombre => $sql) {
            if (in_array($nombre, $cols)) {
                echo "  · $nombre ya existe\n";
            } else {
                $pdo->exec($sql);
                echo "  ✓ $nombre agregada\n";
            }
        }
    } catch (PDOException $e) {
        echo "  ✗ ERROR: {$e->getMessage()}\n";
    }
    echo "\n";
}

echo "Listo.\n";
