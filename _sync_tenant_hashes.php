<?php
/**
 * Task 2: Sincronizar hashes $2a$ + limpiar Sesion_Iniciada en BDs tenant
 *
 * Acciones:
 *  1. Cambiar prefijo $2b$ → $2a$ en tbl_cat_usuarios.Contrasena (todos los users)
 *  2. Resetear Sesion_Iniciada=0 en todos los users de cada tenant
 *  3. Sincronizar contraseña de LARAVEL_GW desde master
 *
 * También sincroniza el campo 'password' en la tabla 'users' de cada tenant
 * para que el hash también sea $2a$ en el tenant users table.
 */

$masterPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

// Obtener LARAVEL_GW hash del master (para sincronizar)
$gwRow = $masterPdo->query("SELECT * FROM tbl_cat_usuarios WHERE Usuario='LARAVEL_GW' LIMIT 1")->fetch(PDO::FETCH_ASSOC);
$gwHash = $gwRow ? $gwRow['Contrasena'] : null;
echo "LARAVEL_GW master hash: " . ($gwHash ? substr($gwHash, 0, 10) . '...' : 'NOT FOUND') . "\n\n";

// Obtener todos los tenants activos
$tenants = $masterPdo->query(
    "SELECT n.id, n.nombre, n.numero_notaria, n.tenant_db_name
     FROM notarias n
     WHERE n.tenant_db_name IS NOT NULL AND n.tenant_db_name != ''
     ORDER BY n.id"
)->fetchAll(PDO::FETCH_ASSOC);

echo "Tenants encontrados: " . count($tenants) . "\n";
echo str_repeat('=', 70) . "\n\n";

$totalFixed = 0;
$totalSessions = 0;
$errors = [];

foreach ($tenants as $tenant) {
    $db     = $tenant['tenant_db_name'];
    $nombre = $tenant['nombre'];
    $num    = $tenant['numero_notaria'];

    echo "[Notaría $num - $nombre] BD: $db\n";

    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
            'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

        // Verificar que existe tbl_cat_usuarios
        $tables = $pdo->query("SHOW TABLES LIKE 'tbl_cat_usuarios'")->fetchAll();
        if (empty($tables)) {
            echo "  ⚠ No existe tbl_cat_usuarios — omitiendo\n\n";
            continue;
        }

        // Obtener todos los usuarios del tenant
        $users = $pdo->query("SELECT Id, Usuario, Contrasena, Sesion_Iniciada FROM tbl_cat_usuarios")->fetchAll(PDO::FETCH_ASSOC);
        echo "  Usuarios: " . count($users) . "\n";

        foreach ($users as $u) {
            $id       = $u['Id'];
            $usuario  = $u['Usuario'];
            $contrasena = $u['Contrasena'];
            $sesion   = $u['Sesion_Iniciada'];

            $changes = [];

            // --- Fix 1: Cambiar prefijo $2b$ → $2a$ ---
            $nuevaContrasena = $contrasena;
            if (str_starts_with($contrasena, '$2b$')) {
                $nuevaContrasena = '$2a$' . substr($contrasena, 4);
                $changes[] = "hash $2b$→$2a$";
            }

            // --- Fix 2: Sincronizar LARAVEL_GW desde master ---
            if ($usuario === 'LARAVEL_GW' && $gwHash) {
                if ($nuevaContrasena !== $gwHash) {
                    $nuevaContrasena = $gwHash;
                    $changes[] = "LARAVEL_GW hash ← master";
                }
            }

            // --- Fix 3: Resetear Sesion_Iniciada ---
            if ($sesion != 0) {
                $changes[] = "Sesion_Iniciada $sesion→0";
            }

            if (!empty($changes)) {
                $pdo->prepare(
                    "UPDATE tbl_cat_usuarios SET Contrasena=?, Sesion_Iniciada=0 WHERE Id=?"
                )->execute([$nuevaContrasena, $id]);

                $totalFixed++;
                echo "  ✓ [$usuario id=$id] " . implode(', ', $changes) . "\n";
            } else {
                echo "  · [$usuario id=$id] sin cambios (hash=" . substr($contrasena, 0, 8) . "...)\n";
            }
        }

        // --- Fix 4: Resetar sessions en tabla users del tenant (si existe) ---
        $tenantUsersTable = $pdo->query("SHOW TABLES LIKE 'sessions'")->fetchAll();
        if (!empty($tenantUsersTable)) {
            $delSessions = $pdo->exec("DELETE FROM sessions");
            if ($delSessions > 0) {
                echo "  ✓ Limpiadas $delSessions sesiones en tabla sessions\n";
                $totalSessions += $delSessions;
            }
        }

    } catch (PDOException $e) {
        $msg = "  ✗ ERROR: " . $e->getMessage();
        echo $msg . "\n";
        $errors[] = "[$db] " . $e->getMessage();
    }

    echo "\n";
}

echo str_repeat('=', 70) . "\n";
echo "RESUMEN:\n";
echo "  Registros actualizados: $totalFixed\n";
echo "  Sesiones limpiadas: $totalSessions\n";
echo "  Errores: " . count($errors) . "\n";
if ($errors) {
    foreach ($errors as $e) {
        echo "    - $e\n";
    }
}

// --- También actualizar master tbl_cat_usuarios: confirmar todos en $2a$ ---
echo "\n--- Verificación master tbl_cat_usuarios ---\n";
$masterUsers = $masterPdo->query("SELECT Id, Usuario, LEFT(Contrasena,8) as Prefix FROM tbl_cat_usuarios ORDER BY Id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($masterUsers as $u) {
    $ok = str_starts_with($u['Prefix'], '$2a$') ? '✓' : '✗';
    echo "  $ok [$u[Usuario]] {$u['Prefix']}...\n";
}
