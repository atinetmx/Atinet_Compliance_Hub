<?php
$sql = file_get_contents("C:\\Users\\Administrador\\Desktop\\Nueva carpeta\\dump-bd_sistemacontrolnotarial_principal-202605191611.sql");
preg_match('/CREATE TABLE `tbl_cat_forma_pago`\s*\(([\s\S]*?)\)\s*ENGINE[^\n]*/s', $sql, $m);
echo $m[0] ?? 'NOT FOUND';
