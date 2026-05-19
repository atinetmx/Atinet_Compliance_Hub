<?php

$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_edomex_notaria_11;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

echo "== tbl_cat_usuarios en tenant notaria_11 ==\n";
foreach ($pdo->query('SELECT Id, Usuario, Activo FROM tbl_cat_usuarios ORDER BY Id') as $r) {
    echo "  Id={$r['Id']} Usuario={$r['Usuario']} Activo={$r['Activo']}\n";
}

echo "\n== CREATE TABLE tbl_log_general (FKs) ==\n";
$r = $pdo->query('SHOW CREATE TABLE tbl_log_general')->fetch();
echo $r[1]."\n";

echo "\n== CREATE TABLE tbl_log_bitacora (FKs) ==\n";
$r = $pdo->query('SHOW CREATE TABLE tbl_log_bitacora')->fetch();
echo $r[1]."\n";

echo "\n== Últimos registros en tbl_log_general ==\n";
foreach ($pdo->query('SELECT * FROM tbl_log_general ORDER BY Id DESC LIMIT 5') as $r) {
    echo '  '.json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
}

echo "\n== Últimos registros en tbl_log_bitacora ==\n";
foreach ($pdo->query('SELECT * FROM tbl_log_bitacora ORDER BY Id DESC LIMIT 5') as $r) {
    echo '  '.json_encode($r, JSON_UNESCAPED_UNICODE)."\n";
}
