<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo "=== tbl_log_general (last 10) ===\n";
$rows = $pdo->query('SELECT Id, Usuario_Id, Operacion, Estatus, Descripcion, Datos, Fecha_Creacion FROM tbl_log_general ORDER BY Id DESC LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    echo json_encode($r, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
}

echo "\n=== tbl_log_sesiones_activas (last 5) ===\n";
$rows2 = $pdo->query('SELECT * FROM tbl_log_sesiones_activas ORDER BY Id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows2 as $r) {
    echo json_encode($r, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
}

echo "\n=== notarias table ===\n";
$notarias = $pdo->query('SELECT id, nombre, tenant_db_name FROM notarias')->fetchAll(PDO::FETCH_ASSOC);
foreach ($notarias as $r) {
    echo "  id={$r['id']} nombre={$r['nombre']} db={$r['tenant_db_name']}\n";
}
