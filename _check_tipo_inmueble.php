<?php
$pass = 'Atinet2026#Secure';
$master = new PDO('mysql:host=127.0.0.1;port=3307;dbname=atinet_compliance_hub', 'atinet_app', $pass);

echo "=== Notarías ===" . PHP_EOL;
$notarias = $master->query("SELECT id, name, tenant_db_name FROM notarias ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
foreach ($notarias as $n) {
    echo "  id={$n['id']} | {$n['name']} | db={$n['tenant_db_name']}" . PHP_EOL;
}

echo PHP_EOL . "=== tbl_cat_tipo_inmueble en cada tenant ===" . PHP_EOL;
foreach ($notarias as $n) {
    $dbName = $n['tenant_db_name'];
    if (!$dbName) { continue; }
    try {
        $pdo = new PDO("mysql:host=127.0.0.1;port=3307;dbname={$dbName}", 'atinet_app', $pass);
        $rows = $pdo->query("SELECT id, descripcion, categoria, activo FROM tbl_cat_tipo_inmueble ORDER BY id")->fetchAll(PDO::FETCH_ASSOC);
        $count = count($rows);
        if ($count > 0) {
            echo PHP_EOL . "  DB: {$dbName} ({$count} registros)" . PHP_EOL;
            foreach ($rows as $r) {
                echo "    id={$r['id']} | {$r['categoria']} | {$r['descripcion']} | activo={$r['activo']}" . PHP_EOL;
            }
        } else {
            echo "  DB: {$dbName} → VACÍA" . PHP_EOL;
        }
    } catch (Exception $e) {
        echo "  DB: {$dbName} → ERROR: " . $e->getMessage() . PHP_EOL;
    }
}
