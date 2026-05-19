<?php
/**
 * Restaurar LARAVEL_GW a Id=1 en todos los tenants.
 * C# usa Usuario_Id=1 para sus logs internos → LARAVEL_GW debe ser Id=1.
 *
 * Proceso por tenant:
 *  1. Eliminar FK constraints de log tables
 *  2. Limpiar registros de log que apunten a Id=18 (LARAVEL_GW actual)
 *  3. Actualizar LARAVEL_GW: Id=18 → Id=1
 *  4. Restaurar FK constraints
 *  5. Resetear AUTO_INCREMENT
 */

$masterPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// Hash actual de LARAVEL_GW en master (ya corregido a $2a$)
$gwMaster = $masterPdo->query("SELECT * FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
echo "LARAVEL_GW master: Id={$gwMaster['Id']} hash=" . substr($gwMaster['Contrasena'], 0, 10) . "...\n\n";

$tenants = $masterPdo->query(
    "SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias
     WHERE tenant_db_name IS NOT NULL AND tenant_db_name != ''
     AND tenant_db_name != 'atinet_compliance_hub'
     ORDER BY id"
)->fetchAll(PDO::FETCH_ASSOC);

echo "Tenants a procesar: " . count($tenants) . "\n";
echo str_repeat('=', 60) . "\n\n";

foreach ($tenants as $t) {
    $db = $t['tenant_db_name'];
    echo "[{$t['nombre']}] BD: $db\n";

    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
            'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        // Verificar estado actual de LARAVEL_GW
        $gw = $pdo->query("SELECT Id, Usuario FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        if (!$gw) {
            echo "  ⚠ LARAVEL_GW no existe — omitiendo\n\n";
            continue;
        }

        $gwId = $gw['Id'];

        if ($gwId == 1) {
            echo "  ✓ LARAVEL_GW ya tiene Id=1 — sin cambios\n\n";
            continue;
        }

        echo "  LARAVEL_GW actual: Id=$gwId → necesita ser Id=1\n";

        // ¿Existe ya alguien con Id=1?
        $existing1 = $pdo->query("SELECT Id, Usuario FROM tbl_cat_usuarios WHERE Id=1 LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        if ($existing1) {
            echo "  ⚠ Id=1 ya está ocupado por '{$existing1['Usuario']}' — saltando tenant\n\n";
            continue;
        }

        // 1. Eliminar FK constraints de tablas de log
        $fksDropped = [];
        $logTables = ['tbl_log_general', 'tbl_log_bitacora', 'tbl_log_sesiones_activas'];
        foreach ($logTables as $lt) {
            $exists = $pdo->query("SHOW TABLES LIKE '$lt'")->fetch();
            if (!$exists) continue;

            $create = $pdo->query("SHOW CREATE TABLE `$lt`")->fetch();
            preg_match_all('/CONSTRAINT `([^`]+)` FOREIGN KEY \(`Usuario_Id`\)/', $create[1], $matches);
            foreach ($matches[1] as $fkName) {
                $pdo->exec("ALTER TABLE `$lt` DROP FOREIGN KEY `$fkName`");
                $fksDropped[] = [$lt, $fkName];
                echo "  · FK eliminado: $lt.$fkName\n";
            }
        }

        // 2. Limpiar logs que referencian al LARAVEL_GW actual (registros del sistema)
        foreach (['tbl_log_general', 'tbl_log_bitacora'] as $lt) {
            $exists = $pdo->query("SHOW TABLES LIKE '$lt'")->fetch();
            if (!$exists) continue;
            $del = $pdo->prepare("DELETE FROM `$lt` WHERE Usuario_Id = ?");
            $del->execute([$gwId]);
            if ($del->rowCount() > 0) {
                echo "  · $lt: eliminados {$del->rowCount()} registros de LARAVEL_GW (Id=$gwId)\n";
            }
        }

        // 3. Actualizar LARAVEL_GW: Id=$gwId → Id=1
        $pdo->prepare("UPDATE tbl_cat_usuarios SET Id=1 WHERE Id=?")->execute([$gwId]);
        echo "  ✓ LARAVEL_GW: Id=$gwId → Id=1\n";

        // 4. Restaurar FK constraints
        foreach ($fksDropped as [$lt, $fkName]) {
            $pdo->exec("ALTER TABLE `$lt` ADD CONSTRAINT `$fkName` FOREIGN KEY (`Usuario_Id`) REFERENCES `tbl_cat_usuarios` (`Id`)");
            echo "  · FK restaurado: $lt.$fkName\n";
        }

        // 5. Resetear AUTO_INCREMENT para que próximos inserts no colisionen
        $maxId = $pdo->query("SELECT MAX(Id) FROM tbl_cat_usuarios")->fetchColumn();
        $nextId = $maxId + 1;
        $pdo->exec("ALTER TABLE tbl_cat_usuarios AUTO_INCREMENT = $nextId");
        echo "  ✓ AUTO_INCREMENT reseteado a $nextId\n";

        echo "  ✅ Completado\n";

    } catch (PDOException $e) {
        echo "  ✗ ERROR: " . $e->getMessage() . "\n";
    }

    echo "\n";
}

echo str_repeat('=', 60) . "\n";
echo "VERIFICACIÓN FINAL:\n\n";

// Verificar resultado
foreach ($tenants as $t) {
    $db = $t['tenant_db_name'];
    if ($db === 'atinet_compliance_hub') continue;
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
            'atinet_app', 'Atinet2026#Secure');
        $gw = $pdo->query("SELECT Id, Usuario FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
        $status = ($gw && $gw['Id'] == 1) ? '✓' : '✗';
        echo "  $status {$t['nombre']}: LARAVEL_GW Id=" . ($gw ? $gw['Id'] : 'N/A') . "\n";
    } catch (PDOException $e) {
        echo "  ✗ {$t['nombre']}: ERROR\n";
    }
}
