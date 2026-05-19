<?php

$p = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');
$tables = $p->query('SHOW TABLES')->fetchAll(PDO::FETCH_COLUMN);
echo "=== Tablas con datos en atinet_compliance_hub ===\n";
foreach ($tables as $t) {
    $n = $p->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
    if ($n > 0) {
        echo "  {$t}: {$n} registros\n";
    }
}
echo "\n=== Datos clave ===\n";
// Users (Laravel)
$users = $p->query('SELECT id, name, email, notaria_id FROM users ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
echo "USERS:\n";
foreach ($users as $u) {
    echo "  [{$u['id']}] {$u['name']} ({$u['email']}) notaria_id={$u['notaria_id']}\n";
}
// Notarias
$notarias = $p->query('SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
echo "NOTARIAS:\n";
foreach ($notarias as $n) {
    echo "  [{$n['id']}] {$n['nombre']} num={$n['numero_notaria']} db={$n['tenant_db_name']}\n";
}
// Subscriptions
$subs = $p->query('SELECT COUNT(*) FROM subscriptions')->fetchColumn();
echo "SUBSCRIPTIONS: {$subs}\n";
$plans = $p->query('SELECT COUNT(*) FROM plans')->fetchColumn();
echo "PLANS: {$plans}\n";
$svcs = $p->query('SELECT COUNT(*) FROM services')->fetchColumn();
echo "SERVICES: {$svcs}\n";
// tbl_cat_usuarios (in master)
$cats = $p->query("SHOW TABLES LIKE 'tbl_cat_%'")->fetchAll(PDO::FETCH_COLUMN);
echo "\ntbl_cat_* tables: ".implode(', ', $cats)."\n";
foreach ($cats as $t) {
    $n = $p->query("SELECT COUNT(*) FROM `{$t}`")->fetchColumn();
    echo "  {$t}: {$n}\n";
}
