<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
$rows = $pdo->query('SELECT Id, Usuario_Id, Operacion, Estatus, Descripcion, Datos, Fecha_Creacion FROM tbl_log_general ORDER BY Id DESC LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
echo "=== Last 10 log entries ===\n";
foreach ($rows as $r) {
    echo "  ID={$r['Id']} User={$r['Usuario_Id']} Op={$r['Operacion']} Status={$r['Estatus']}\n";
    echo "    Desc: {$r['Descripcion']}\n";
    echo "    Data: {$r['Datos']}\n";
    echo "    Date: {$r['Fecha_Creacion']}\n\n";
}
