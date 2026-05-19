<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "== FULL CREATE TABLE tbl_log_bitacora ==\n";
$r = $pdo->query('SHOW CREATE TABLE tbl_log_bitacora')->fetch();
echo $r[1]."\n\n";

echo "== tbl_log_sesiones_activas rows ==\n";
foreach ($pdo->query('SELECT * FROM tbl_log_sesiones_activas') as $row) {
    echo json_encode($row)."\n";
}

echo "\n== FULL CREATE TABLE tbl_cfg_notaria ==\n";
$r = $pdo->query('SHOW CREATE TABLE tbl_cfg_notaria')->fetch();
echo $r[1]."\n\n";

echo "== tbl_cfg_notaria rows ==\n";
foreach ($pdo->query('SELECT * FROM tbl_cfg_notaria') as $row) {
    echo json_encode($row)."\n";
}
