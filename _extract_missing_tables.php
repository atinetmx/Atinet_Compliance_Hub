<?php
/**
 * Extrae los CREATE TABLE del backup de Alex para las tablas faltantes.
 */

$backupFile = 'C:\\Users\\Administrador\\Desktop\\Nueva carpeta\\dump-bd_sistemacontrolnotarial_principal-202605191611.sql';

$missingTables = [
    'tbl_cat_forma_pago',
    'tbl_cat_formatos',
    'tbl_cat_html_templates',
    'tbl_cat_marcadores',
    'tbl_ope_declaranot_enajenacion',
    'tbl_ope_orden_caja',
    'tbl_rel_formatos_marcadores',
    'tbl_rel_formatos_tipos_comparecientes',
    'tbl_rel_ordenes_caja_detalle',
    'tbl_system_info',
];

$lines = file($backupFile, FILE_IGNORE_NEW_LINES);

foreach ($missingTables as $table) {
    $capture = false;
    echo "\n-- TABLE: {$table}\n";
    foreach ($lines as $line) {
        if (preg_match('/^CREATE TABLE `' . preg_quote($table, '/') . '`/i', $line)) {
            $capture = true;
        }
        if ($capture) {
            echo $line . "\n";
        }
        if ($capture && preg_match('/^\) ENGINE=/i', $line)) {
            break;
        }
    }
    echo "\n";
}
