<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo "=== tbl_log_general MASTER (ultimos 30 registros, hoy) ===\n";
$stmt = $pdo->query('SELECT Id, Fecha_Creacion, Operacion, Usuario_Id, Estatus, LEFT(Descripcion,200) as Descripcion, LEFT(Datos,300) as Datos FROM tbl_log_general WHERE Fecha_Creacion >= CURDATE() ORDER BY Id DESC LIMIT 30');
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
if (empty($rows)) {
    echo "(sin registros hoy)\n";
    // fallback a los 10 mas recientes
    $stmt2 = $pdo->query('SELECT Id, Fecha_Creacion, Operacion, Usuario_Id, Estatus, LEFT(Descripcion,200) as Descripcion, LEFT(Datos,300) as Datos FROM tbl_log_general ORDER BY Id DESC LIMIT 10');
    foreach ($stmt2 as $r) {
        echo "--- ID={$r['Id']} | {$r['Fecha_Creacion']} | Op={$r['Operacion']} | UsuId={$r['Usuario_Id']} | Est={$r['Estatus']}\n";
        echo "  Desc: {$r['Descripcion']}\n";
        echo "  Datos: {$r['Datos']}\n";
    }
} else {
    foreach ($rows as $r) {
        echo "--- ID={$r['Id']} | {$r['Fecha_Creacion']} | Op={$r['Operacion']} | UsuId={$r['Usuario_Id']} | Est={$r['Estatus']}\n";
        echo "  Desc: {$r['Descripcion']}\n";
        echo "  Datos: {$r['Datos']}\n";
    }
}

echo "\n=== tbl_cat_usuarios TENANT notaria_101 ===\n";
$t = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
foreach ($t->query('SELECT Id, Usuario, Numero_Notaria, Activo FROM tbl_cat_usuarios LIMIT 10') as $r) {
    echo "Id={$r['Id']} | Usuario={$r['Usuario']} | Numero_Notaria={$r['Numero_Notaria']} | Activo={$r['Activo']}\n";
}
