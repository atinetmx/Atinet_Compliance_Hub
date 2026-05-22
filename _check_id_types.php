<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

echo $pdo->query("SELECT VERSION()")->fetchColumn() . "\n\n";

$tables = [
    'tbl_ope_expedientes','tbl_cat_clientes','tbl_cat_estatus','tbl_cat_usuarios',
    'tbl_cat_operaciones','tbl_cat_impuestos_derechos','tbl_cat_forma_pago',
    'tbl_cat_formatos','tbl_cat_marcadores','tbl_ope_orden_caja',
];
foreach ($tables as $t) {
    try {
        $r = $pdo->query("SHOW COLUMNS FROM `$t` WHERE Field='Id'")->fetch(PDO::FETCH_ASSOC);
        echo "$t.Id = " . ($r ? $r['Type'] . ' ' . $r['Extra'] : 'NOT FOUND') . "\n";
    } catch (Exception $e) {
        echo "$t = NOT EXISTS\n";
    }
}
