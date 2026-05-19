<?php

$pdo = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
foreach ($pdo->query('SELECT id, nombre, tenant_db_name FROM notarias ORDER BY id') as $r) {
    echo $r['id'].' | '.$r['nombre'].' | '.($r['tenant_db_name'] ?? 'NULL').PHP_EOL;
}
