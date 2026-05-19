<?php

error_reporting(E_ALL);
$master = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$tenant = new PDO('mysql:host=localhost;port=3307;dbname=atinet_edomex_notaria_11', 'atinet_app', 'Atinet2026#Secure');

$tables = $tenant->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);

echo "COLUMNAS FALTANTES EN atinet_compliance_hub vs atinet_edomex_notaria_11\n";
echo str_repeat('=', 70)."\n";

$hasDiff = false;
foreach ($tables as $table) {
    $stmt = $tenant->query("SHOW COLUMNS FROM `{$table}`");
    if (! $stmt) {
        continue;
    }
    $rTenant = $stmt->fetchAll(PDO::FETCH_COLUMN);

    $stmt2 = $master->query("SHOW COLUMNS FROM `{$table}`");
    if (! $stmt2) {
        echo "TABLA FALTANTE EN MASTER: {$table}\n";
        $hasDiff = true;

        continue;
    }
    $rMaster = $stmt2->fetchAll(PDO::FETCH_COLUMN);

    $missing = array_diff($rTenant, $rMaster);
    if ($missing) {
        echo "  {$table}: falta -> ".implode(', ', $missing)."\n";
        $hasDiff = true;
    }
}

if (! $hasDiff) {
    echo "Sin diferencias encontradas.\n";
}
echo "FIN\n";
