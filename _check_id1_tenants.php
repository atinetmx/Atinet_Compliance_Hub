<?php
/**
 * Verificar: en each tenant, ¿qué usuario tiene Id=1?
 * C# siempre usa Usuario_Id=1 en los logs → ese Id debe existir.
 */

$masterPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$tenants = $masterPdo->query(
    "SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias
     WHERE tenant_db_name IS NOT NULL AND tenant_db_name != '' ORDER BY id"
)->fetchAll(PDO::FETCH_ASSOC);

echo "=== VERIFICACIÓN Id=1 en cada tenant ===\n\n";

foreach ($tenants as $t) {
    $db = $t['tenant_db_name'];
    echo "[{$t['nombre']}] BD: $db\n";
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
            'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        $tables = $pdo->query("SHOW TABLES LIKE 'tbl_cat_usuarios'")->fetchAll();
        if (empty($tables)) { echo "  ⚠ Sin tbl_cat_usuarios\n\n"; continue; }

        // ¿Existe Id=1?
        $r = $pdo->query("SELECT * FROM tbl_cat_usuarios WHERE Id = 1")->fetch(PDO::FETCH_ASSOC);
        if ($r) {
            echo "  ✓ Id=1 existe → Usuario={$r['Usuario']}\n";
        } else {
            echo "  ✗ Id=1 NO existe\n";
        }

        // Todos los usuarios del tenant
        foreach ($pdo->query("SELECT Id, Usuario FROM tbl_cat_usuarios ORDER BY Id") as $u) {
            echo "    Id={$u['Id']} {$u['Usuario']}\n";
        }
    } catch (PDOException $e) {
        echo "  ERROR: {$e->getMessage()}\n";
    }
    echo "\n";
}
