<?php
/**
 * 1. Resetear Sesion_Iniciada=0 en todos los tenants
 * 2. Verificar/corregir hashes de NOT1, SEC1, RES1, USUARIO en notaria_11
 */

$masterPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$tenants = $masterPdo->query(
    "SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias
     WHERE tenant_db_name IS NOT NULL AND tenant_db_name != ''
     ORDER BY id"
)->fetchAll(PDO::FETCH_ASSOC);

echo "=== RESET SESIONES + FIX HASHES ===\n\n";

foreach ($tenants as $t) {
    $db = $t['tenant_db_name'];
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
            'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        $tables = $pdo->query("SHOW TABLES LIKE 'tbl_cat_usuarios'")->fetchAll();
        if (empty($tables)) continue;

        // Reset sesiones
        $affected = $pdo->exec("UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0 WHERE Sesion_Iniciada != 0");
        if ($affected > 0) {
            echo "[{$t['nombre']}] ✓ Sesiones reseteadas: $affected\n";
        }

        // Sincronizar hash completo desde master (garantiza misma contraseña Y prefijo $2a$)
        $users = $pdo->query("SELECT Id, Usuario, Contrasena FROM tbl_cat_usuarios ORDER BY Id")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($users as $u) {
            $masterUser = $masterPdo->prepare("SELECT Contrasena FROM tbl_cat_usuarios WHERE Usuario = ? LIMIT 1");
            $masterUser->execute([$u['Usuario']]);
            $masterHash = $masterUser->fetchColumn();

            if (!$masterHash) {
                echo "[{$t['nombre']}] ⚠ {$u['Usuario']}: no existe en master, omitiendo\n";
                continue;
            }

            if ($u['Contrasena'] !== $masterHash) {
                $pdo->prepare("UPDATE tbl_cat_usuarios SET Contrasena=? WHERE Id=?")->execute([$masterHash, $u['Id']]);
                echo "[{$t['nombre']}] ✓ Hash sincronizado para {$u['Usuario']}\n";
            }
        }
    } catch (PDOException $e) {
        echo "[{$t['nombre']}] ERROR: {$e->getMessage()}\n";
    }
}

echo "\nListo.\n";
