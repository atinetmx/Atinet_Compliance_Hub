<?php

$pass = 'Atinet2026#Secure';
$dbs = ['atinet_compliance_hub', 'atinet_edomex_notaria_11', 'atinet_edomex_notaria_10'];

foreach ($dbs as $dbName) {
    echo "\n========== DB: $dbName ==========\n";
    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname=$dbName", 'atinet_app', $pass);

    // tbl_cfg_notaria
    echo "\n--- tbl_cfg_notaria ---\n";
    try {
        $rows = $pdo->query('SELECT * FROM tbl_cfg_notaria')->fetchAll(PDO::FETCH_ASSOC);
        if (empty($rows)) {
            echo "(empty)\n";
        } else {
            foreach ($rows as $r) {
                echo json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
            }
        }
    } catch (Exception $e) {
        echo 'ERROR: '.$e->getMessage()."\n";
    }

    // tbl_cfg_configuracion_notarial
    echo "\n--- tbl_cfg_configuracion_notarial ---\n";
    try {
        $rows = $pdo->query('SELECT * FROM tbl_cfg_configuracion_notarial')->fetchAll(PDO::FETCH_ASSOC);
        if (empty($rows)) {
            echo "(empty)\n";
        } else {
            foreach ($rows as $r) {
                echo json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
            }
        }
    } catch (Exception $e) {
        echo 'ERROR: '.$e->getMessage()."\n";
    }

    // tbl_log_sesiones_activas
    echo "\n--- tbl_log_sesiones_activas (últimas 5) ---\n";
    try {
        $rows = $pdo->query('SELECT * FROM tbl_log_sesiones_activas ORDER BY Id DESC LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
        if (empty($rows)) {
            echo "(empty)\n";
        } else {
            foreach ($rows as $r) {
                echo json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
            }
        }
    } catch (Exception $e) {
        echo 'ERROR: '.$e->getMessage()."\n";
    }
}

// Ver tbl_log_general en tenant notaria_11
echo "\n========== tbl_log_general en atinet_edomex_notaria_11 ==========\n";
$pdo11 = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', $pass);
$logs = $pdo11->query('SELECT Id, Estatus, Operacion, Descripcion, Datos, Fecha_Creacion FROM tbl_log_general ORDER BY Id DESC LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
if (empty($logs)) {
    echo "(empty)\n";
} else {
    foreach ($logs as $r) {
        echo json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
    }
}
