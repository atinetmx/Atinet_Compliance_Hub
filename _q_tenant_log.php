<?php

$t = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
echo "=== TENANT tbl_log_general (hoy) ===\n";
$rows = $t->query('SELECT Id, Fecha_Creacion, Operacion, Estatus, Descripcion, Datos FROM tbl_log_general WHERE Fecha_Creacion >= CURDATE() ORDER BY Id DESC LIMIT 20')->fetchAll(PDO::FETCH_ASSOC);
if (empty($rows)) {
    echo "(sin registros hoy)\n";
    echo "\n=== TENANT tbl_log_general (ultimos 5) ===\n";
    foreach ($t->query('SELECT Id, Fecha_Creacion, Operacion, Estatus, Descripcion, Datos FROM tbl_log_general ORDER BY Id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC) as $r) {
        echo "ID={$r['Id']} | {$r['Fecha_Creacion']} | {$r['Operacion']} | {$r['Estatus']} | {$r['Descripcion']} | {$r['Datos']}\n";
    }
} else {
    foreach ($rows as $r) {
        echo "ID={$r['Id']} | {$r['Fecha_Creacion']} | {$r['Operacion']} | {$r['Estatus']} | {$r['Descripcion']} | {$r['Datos']}\n";
    }
}

echo "\n=== TENANT tbl_log_sesiones_activas ===\n";
foreach ($t->query('SELECT * FROM tbl_log_sesiones_activas ORDER BY Id DESC LIMIT 10')->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo implode(' | ', $r)."\n";
}

// Check tbl_cat_usuarios password hash
echo "\n=== TENANT tbl_cat_usuarios (password hashes) ===\n";
foreach ($t->query('SELECT Id, Usuario, Numero_Notaria, LEFT(Contrasena,60) as hash, Activo FROM tbl_cat_usuarios')->fetchAll(PDO::FETCH_ASSOC) as $r) {
    echo "Id={$r['Id']} | {$r['Usuario']} | Notaria={$r['Numero_Notaria']} | Hash={$r['hash']} | Activo={$r['Activo']}\n";
}
