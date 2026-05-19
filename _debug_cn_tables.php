<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$pdo = DB::connection('mysql')->getPdo();

// Ver TODAS las columnas de notarias
echo '=== TODAS COLUMNAS de notarias ==='.PHP_EOL;
$cols = $pdo->query('SHOW COLUMNS FROM notarias')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols as $c) {
    echo '  '.$c['Field'].' ('.$c['Type'].')'.PHP_EOL;
}

// Ver primer registro completo de notarias
echo PHP_EOL.'=== Primer registro completo notarias ==='.PHP_EOL;
$row = $pdo->query('SELECT * FROM notarias LIMIT 1')->fetch(PDO::FETCH_ASSOC);
foreach ($row as $k => $v) {
    if (strlen($v ?? '') < 200) {
        echo "  $k = $v".PHP_EOL;
    }
}

// Ver TODAS las columnas de tbl_cfg_notaria en master
echo PHP_EOL.'=== COLUMNAS tbl_cfg_notaria (MASTER) ==='.PHP_EOL;
$cols2 = $pdo->query('SHOW COLUMNS FROM tbl_cfg_notaria')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cols2 as $c) {
    echo '  '.$c['Field'].' ('.$c['Type'].')'.PHP_EOL;
}

// Ver todos los registros de tbl_cfg_notaria (sin logotipo)
echo PHP_EOL.'=== Registros tbl_cfg_notaria (sin Logotipo) ==='.PHP_EOL;
$rows3 = $pdo->query('SELECT Id, Nombre_Notario, Numero_Notaria, Telefono, RFC, Municipio, Estado FROM tbl_cfg_notaria LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows3 as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
}

// Ver tbl_cfg_notaria en tenants
foreach (['atinet_edomex_notaria_11', 'atinet_edomex_notaria_10'] as $db) {
    echo PHP_EOL."=== tbl_cfg_notaria en $db ===".PHP_EOL;
    try {
        $rows4 = $pdo->query("SELECT Id, Nombre_Notario, Numero_Notaria, Municipio FROM `$db`.tbl_cfg_notaria LIMIT 3")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows4 as $r) {
            echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
        }
    } catch (Exception $e) {
        echo 'Error: '.$e->getMessage().PHP_EOL;
    }
}

// Ver que hay en la tabla notarias de atinet_edomex_notaria_11
echo PHP_EOL.'=== notarias en atinet_edomex_notaria_11 ==='.PHP_EOL;
try {
    $rows5 = $pdo->query('SELECT id, numero_notaria, nombre, tenant_db_name FROM `atinet_edomex_notaria_11`.notarias LIMIT 5')->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows5 as $r) {
        echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage().PHP_EOL;
}
