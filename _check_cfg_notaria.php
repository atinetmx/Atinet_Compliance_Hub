<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$pdo->exec('ALTER TABLE tbl_cfg_configuracion_notarial ADD COLUMN Orden_Caja INT NULL AFTER Recibo_Honorarios');
$pdo->exec('ALTER TABLE tbl_cfg_configuracion_notarial ADD COLUMN Orden_Pago INT NULL AFTER Orden_Caja');
$pdo->exec('ALTER TABLE tbl_cfg_configuracion_notarial ADD COLUMN Servidor TEXT NULL AFTER Folio_Inicial_Tomo_Certificaciones');
echo 'OK - columnas agregadas'.PHP_EOL;

// Verificar resultado
$cols = $pdo->query('SHOW COLUMNS FROM tbl_cfg_configuracion_notarial')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo "  {$c['Field']} | {$c['Type']}".PHP_EOL;
}
