<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

$refs = [
    'tbl_ope_expedientes'       => 'Id',
    'tbl_cat_clientes'          => 'Id',
    'tbl_cat_estatus'           => 'Id',
    'tbl_cat_usuarios'          => 'Id',
    'tbl_cat_operaciones'       => 'Id',
    'tbl_cat_impuestos_derechos'=> 'Id',
    'tbl_cat_forma_pago'        => 'Id',  // tabla nueva a crear
];

// También check columnas FK en tablas existentes
$fkCols = [
    'tbl_ope_recibos_provisionales' => 'Forma_Pago_Id',
    'tbl_rel_expediente_clientes'   => 'Busqueda_Listas',
    'clientes'                      => 'nacionalidad_nombre',
];

echo "=== PKs referenciadas ===\n";
foreach ($refs as $table => $col) {
    try {
        $r = $pdo->query("SHOW COLUMNS FROM `$table` WHERE Field='$col'")->fetch(PDO::FETCH_ASSOC);
        echo "  $table.$col => " . ($r ? $r['Type'] . ' ' . $r['Extra'] : 'TABLE DOES NOT EXIST YET') . "\n";
    } catch (Exception $e) {
        echo "  $table => ERROR: " . $e->getMessage() . "\n";
    }
}

echo "\n=== Columnas FK existentes ===\n";
foreach ($fkCols as $table => $col) {
    try {
        $r = $pdo->query("SHOW COLUMNS FROM `$table` WHERE Field='$col'")->fetch(PDO::FETCH_ASSOC);
        echo "  $table.$col => " . ($r ? $r['Type'] . ' ' . $r['Extra'] : 'COLUMN DOES NOT EXIST') . "\n";
    } catch (Exception $e) {
        echo "  $table => ERROR: " . $e->getMessage() . "\n";
    }
}

// Mostrar el error actual de la migración fallida para entender tipo esperado
echo "\n=== Tipo de Forma_Pago_Id en recibos ===\n";
$r = $pdo->query("SHOW COLUMNS FROM `tbl_ope_recibos_provisionales` WHERE Field='Forma_Pago_Id'")->fetch(PDO::FETCH_ASSOC);
echo $r ? json_encode($r) . "\n" : "columna no encontrada\n";
