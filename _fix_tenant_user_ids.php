<?php

/**
 * Fix Task 4: Sincronizar tbl_cat_usuarios.Id en tenants al valor del master.
 *
 * Problema: C# usa el Id del MASTER (atinet_compliance_hub.tbl_cat_usuarios)
 * como Usuario_Id al insertar en tbl_log_* de los tenants.
 * Los tenants tienen IDs diferentes → FK violation.
 *
 * Casos identificados:
 *  - LARAVEL_GW: master Id=18, tenant Id=2 (o 3 en notaria_100/101)
 *  - LALO:       master Id=20, tenant Id=2 (en notaria_100)
 *  - COMPUMUNDO: master Id=21, tenant Id=2 (en notaria_101)
 *
 * Solución: Actualizar los IDs en los tenants para que coincidan con el master.
 * Se usa SET FOREIGN_KEY_CHECKS=0 para evitar errores de FK durante la actualización,
 * y se actualizan los FK references en las tablas de log del tenant.
 */
$masterPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// Obtener Id de LARAVEL_GW en master
$masterGwId = (int) $masterPdo->query("SELECT Id FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW' LIMIT 1")->fetchColumn();
echo "LARAVEL_GW master Id: $masterGwId\n\n";

// Obtener tenants
$tenants = $masterPdo->query(
    "SELECT n.id, n.nombre, n.numero_notaria, n.tenant_db_name
     FROM notarias n
     WHERE n.tenant_db_name IS NOT NULL AND n.tenant_db_name != '' AND n.tenant_db_name != 'atinet_compliance_hub'
     ORDER BY n.id"
)->fetchAll(PDO::FETCH_ASSOC);

// Mapa de usuarios que necesitan ID fix por tenant
// master_id => username (para identificarlos en el tenant)
$masterIdByUser = [];
foreach ($masterPdo->query('SELECT Id, Usuario FROM tbl_cat_usuarios ORDER BY Id') as $r) {
    $masterIdByUser[$r['Usuario']] = (int) $r['Id'];
}

echo "== INICIANDO FIX DE IDs EN TENANTS ==\n";
echo str_repeat('=', 70)."\n\n";

foreach ($tenants as $tenant) {
    $db = $tenant['tenant_db_name'];
    $nombre = $tenant['nombre'];

    echo "[$db] $nombre\n";

    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
        'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    // Obtener todos los usuarios del tenant
    $tenantUsers = $pdo->query('SELECT Id, Usuario FROM tbl_cat_usuarios ORDER BY Id')
        ->fetchAll(PDO::FETCH_ASSOC);

    // Identificar qué usuarios necesitan cambio de Id
    $fixes = []; // [oldId => newId, usuario => ...]
    foreach ($tenantUsers as $u) {
        $usuario = $u['Usuario'];
        $tenantId = (int) $u['Id'];
        $masterTargetId = $masterIdByUser[$usuario] ?? null;

        if ($masterTargetId !== null && $masterTargetId !== $tenantId) {
            $fixes[] = [
                'usuario' => $usuario,
                'oldId' => $tenantId,
                'newId' => $masterTargetId,
            ];
        }
    }

    if (empty($fixes)) {
        echo "  ✓ IDs ya coinciden con master (o usuario no tiene mapeo)\n\n";

        continue;
    }

    foreach ($fixes as $f) {
        echo "  → {$f['usuario']}: Id {$f['oldId']} → {$f['newId']}\n";
    }

    // Obtener tablas con FK a tbl_cat_usuarios
    $fkTables = ['tbl_log_bitacora', 'tbl_log_general', 'tbl_log_sesiones_activas'];
    $existingTables = [];
    foreach ($fkTables as $t) {
        if ($pdo->query("SHOW TABLES LIKE '$t'")->fetchAll()) {
            $existingTables[] = $t;
        }
    }

    // Verificar que newId no colisione con otro usuario en el tenant
    $currentIds = array_column($tenantUsers, 'Id');
    foreach ($fixes as $f) {
        if (in_array($f['newId'], $currentIds) && $f['newId'] !== $f['oldId']) {
            $conflicting = $pdo->prepare('SELECT Usuario FROM tbl_cat_usuarios WHERE Id=?')->execute([$f['newId']]);
            echo "  ⚠ COLLISION: newId={$f['newId']} ya existe en tenant — se intentará de todas formas\n";
        }
    }

    // APLICAR LOS CAMBIOS
    // Usamos FK_CHECKS=0 para este proceso
    $pdo->exec('SET FOREIGN_KEY_CHECKS=0');

    foreach ($fixes as $f) {
        $oldId = $f['oldId'];
        $newId = $f['newId'];

        // 1. Actualizar el Id en tbl_cat_usuarios
        $pdo->prepare('UPDATE tbl_cat_usuarios SET Id=? WHERE Id=?')->execute([$newId, $oldId]);
        echo "    ✓ tbl_cat_usuarios: Id $oldId → $newId\n";

        // 2. Actualizar FK references en tablas de log
        foreach ($existingTables as $logTable) {
            $cnt = $pdo->query("SELECT COUNT(*) FROM `$logTable` WHERE Usuario_Id=$oldId")->fetchColumn();
            if ($cnt > 0) {
                $pdo->prepare("UPDATE `$logTable` SET Usuario_Id=? WHERE Usuario_Id=?")->execute([$newId, $oldId]);
                echo "    ✓ $logTable: $cnt refs $oldId → $newId\n";
            }
        }
    }

    $pdo->exec('SET FOREIGN_KEY_CHECKS=1');

    // Verificar el AUTO_INCREMENT no quede por debajo del max Id
    $maxId = (int) $pdo->query('SELECT MAX(Id) FROM tbl_cat_usuarios')->fetchColumn();
    $pdo->exec('ALTER TABLE tbl_cat_usuarios AUTO_INCREMENT='.($maxId + 1));
    echo '    ✓ AUTO_INCREMENT actualizado a '.($maxId + 1)."\n";

    echo "  DONE\n\n";
}

echo str_repeat('=', 70)."\n";
echo "Verificación final - IDs en todos los tenants:\n\n";

foreach ($tenants as $tenant) {
    $db = $tenant['tenant_db_name'];
    if ($db === 'atinet_compliance_hub') {
        continue;
    }

    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
        'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

    $users = $pdo->query('SELECT Id, Usuario FROM tbl_cat_usuarios ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
    echo "  [$db]\n";
    foreach ($users as $u) {
        $masterTarget = $masterIdByUser[$u['Usuario']] ?? '?';
        $ok = ($masterTarget === (int) $u['Id']) ? '✓' : '✗';
        echo "    $ok Id={$u['Id']} {$u['Usuario']} (master=$masterTarget)\n";
    }
    echo "\n";
}
