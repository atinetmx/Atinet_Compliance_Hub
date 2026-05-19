<?php

/**
 * Limpiar Sesion_Iniciada y tbl_log_sesiones_activas en todos los tenants
 */
$masterPdo = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub;charset=utf8mb4',
    'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);

$tenants = $masterPdo->query(
    "SELECT tenant_db_name FROM notarias WHERE tenant_db_name IS NOT NULL AND tenant_db_name != '' ORDER BY id"
)->fetchAll(PDO::FETCH_COLUMN);

foreach ($tenants as $db) {
    $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$db};charset=utf8mb4",
        'atinet_app', 'Atinet2026#Secure', [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    $pdo->exec('UPDATE tbl_cat_usuarios SET Sesion_Iniciada=0');
    $pdo->exec('DELETE FROM tbl_log_sesiones_activas');
    echo "OK $db\n";
}
echo "DONE\n";
