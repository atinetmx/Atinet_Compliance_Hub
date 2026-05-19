<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$pdo = DB::connection('mysql')->getPdo();

// Ver columnas de tbl_cfg_notaria en master
echo '=== tbl_cfg_notaria (MASTER) ==='.PHP_EOL;
$rows = $pdo->query('SELECT * FROM tbl_cfg_notaria LIMIT 3')->fetchAll(PDO::FETCH_ASSOC);
if (empty($rows)) {
    echo '(vacía)'.PHP_EOL;
} else {
    echo 'Columnas: '.implode(', ', array_keys($rows[0])).PHP_EOL;
    foreach ($rows as $r) {
        echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
    }
}

// Ver notarias con tenant_db_name
echo PHP_EOL.'=== notarias (MASTER) ==='.PHP_EOL;
$rows2 = $pdo->query('SELECT id, numero_notaria, nombre, tenant_db_name FROM notarias LIMIT 10')->fetchAll(PDO::FETCH_ASSOC);
foreach ($rows2 as $r) {
    echo json_encode($r, JSON_UNESCAPED_UNICODE).PHP_EOL;
}

// Buscar en el código fuente del C# cómo usa nombre_Notaria
echo PHP_EOL.'=== Buscando en C# appsettings claves de notaria ==='.PHP_EOL;
$appsettings = json_decode(file_get_contents('C:/SCN/appsettings.json'), true);
echo json_encode($appsettings, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE).PHP_EOL;
