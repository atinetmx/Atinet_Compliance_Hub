<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_101', 'atinet_app', 'Atinet2026#Secure');
echo "=== tbl_log_general in atinet_edomex_notaria_101 (ultimos 20) ===\n";
try {
    $stmt = $pdo->query('SELECT Id, Fecha_Creacion, Operacion, Usuario_Id, Estatus, LEFT(Descripcion,200) as Descripcion, LEFT(Datos,300) as Datos FROM tbl_log_general ORDER BY Id DESC LIMIT 20');
    foreach ($stmt as $r) {
        echo "--- ID={$r['Id']} | {$r['Fecha_Creacion']} | Op={$r['Operacion']} | UsuId={$r['Usuario_Id']} | Est={$r['Estatus']}\n";
        echo "  Desc: {$r['Descripcion']}\n";
        echo "  Datos: {$r['Datos']}\n";
    }
} catch (Exception $e) {
    echo 'ERROR: '.$e->getMessage()."\n";
}

// Also check tbl_cfg_notaria
echo "\n=== tbl_cfg_notaria in atinet_edomex_notaria_101 ===\n";
try {
    foreach ($pdo->query('SELECT * FROM tbl_cfg_notaria LIMIT 5') as $r) {
        echo implode(' | ', array_map(fn ($v) => $v ?? 'NULL', $r))."\n";
    }
} catch (Exception $e) {
    echo 'tbl_cfg_notaria ERROR: '.$e->getMessage()."\n";
}
