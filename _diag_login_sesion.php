<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo '=== notarias ==='.PHP_EOL;
$rows = $pdo->query('SELECT * FROM notarias LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    print_r($r);
}

echo PHP_EOL.'=== tbl_log_sesiones_activas (estructura) ==='.PHP_EOL;
$cols = $pdo->query('DESCRIBE tbl_log_sesiones_activas')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo $c['Field'].' | '.$c['Type'].' | Null:'.$c['Null'].' | Key:'.$c['Key'].PHP_EOL;
}

echo PHP_EOL.'=== tbl_cat_usuarios (ADMIN, notaria 1) ==='.PHP_EOL;
$rows = $pdo->query("SELECT Id, Usuario, Numero_Notaria, Activo FROM tbl_cat_usuarios WHERE Usuario='ADMIN' AND Numero_Notaria=1")->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows as $r) {
    print_r($r);
}
