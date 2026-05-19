<?php

/**
 * Diagnóstico del FK issue:
 * C# intenta insertar en tbl_log_bitacora/tbl_log_general con un Usuario_Id
 * que no existe en el tenant. ¿Qué Id usa C# para el usuario?
 */
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "== NOTARIAS ==\n";
foreach ($pdo->query('SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias ORDER BY id') as $r) {
    echo "  id={$r['id']} num_not={$r['numero_notaria']} tenant={$r['tenant_db_name']} nombre={$r['nombre']}\n";
}

echo "\n== USERS: cn_usuario_id vs tenant tbl_cat_usuarios.Id ==\n";
printf("%-4s %-20s %-12s %-12s %-12s %-10s\n", 'uid', 'name', 'cn_usr_id', 'notaria_id', 'tenant_id', 'match?');
echo str_repeat('-', 75)."\n";

$users = $pdo->query(
    'SELECT u.id, u.name, u.cn_usuario_id, u.notaria_id,
            c.Id as master_cn_id, c.Usuario,
            n.tenant_db_name
     FROM users u
     LEFT JOIN tbl_cat_usuarios c ON c.Id = u.cn_usuario_id
     LEFT JOIN notarias n ON n.id = u.notaria_id
     WHERE u.cn_usuario_id IS NOT NULL
     ORDER BY u.id'
)->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $u) {
    $tenantDb = $u['tenant_db_name'] ?? null;
    $tenantId = 'N/A';
    $match = '?';

    if ($tenantDb) {
        try {
            $tPdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$tenantDb};charset=utf8mb4",
                'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

            $row = $tPdo->prepare('SELECT Id FROM tbl_cat_usuarios WHERE Usuario = ? LIMIT 1');
            $row->execute([$u['Usuario']]);
            $tRow = $row->fetch(PDO::FETCH_ASSOC);

            if ($tRow) {
                $tenantId = $tRow['Id'];
                $match = ($tenantId == $u['cn_usuario_id']) ? 'OK' : "MISMATCH(master={$u['cn_usuario_id']},tenant={$tenantId})";
            } else {
                $match = 'NOT_FOUND_IN_TENANT';
                $tenantId = '-';
            }
        } catch (PDOException $e) {
            $tenantId = 'ERR';
            $match = $e->getMessage();
        }
    } else {
        $tenantId = 'NO_TENANT';
        $match = 'master_only';
    }

    printf("%-4s %-20s %-12s %-12s %-12s %-10s\n",
        $u['id'], $u['name'], $u['cn_usuario_id'], $u['notaria_id'], $tenantId, $match
    );
}

echo "\n== EXPLICACIÓN ==\n";
echo "C# usa el cn_usuario_id del MASTER para insertar en tbl_log_bitacora del tenant.\n";
echo "Si tenant.tbl_cat_usuarios.Id != master.cn_usuario_id → FK FALLA.\n";
echo "Solución: sincronizar IDs en tenant O hacer que C# busque por Username en tenant.\n";
