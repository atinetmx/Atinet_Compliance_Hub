<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "== ESTRUCTURA tbl_log_bitacora ==\n";
$r = $pdo->query('SHOW CREATE TABLE tbl_log_bitacora')->fetch();
echo $r[1]."\n\n";

echo "== ESTRUCTURA tbl_log_general ==\n";
$r = $pdo->query('SHOW CREATE TABLE tbl_log_general')->fetch();
echo $r[1]."\n\n";

// Mostrar registros existentes en tbl_log_bitacora (sample)
echo "== SAMPLE tbl_log_bitacora (últimos 5) ==\n";
foreach ($pdo->query('SELECT * FROM tbl_log_bitacora ORDER BY Id DESC LIMIT 5') as $row) {
    echo '  '.json_encode($row)."\n";
}
