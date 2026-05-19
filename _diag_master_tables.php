<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo '=== TABLAS EN MASTER (atinet_compliance_hub) ==='.PHP_EOL;
$tables = DB::select('SHOW TABLES');
foreach ($tables as $t) {
    echo array_values((array) $t)[0].PHP_EOL;
}

echo PHP_EOL.'=== tbl_cfg_notaria EN MASTER ==='.PHP_EOL;
try {
    $rows = DB::table('tbl_cfg_notaria')->get();
    foreach ($rows as $r) {
        print_r((array) $r);
    }
} catch (Exception $e) {
    echo 'No existe: '.$e->getMessage().PHP_EOL;
}

// Buscar cualquier tabla con "notaria" en el nombre
echo PHP_EOL."=== Tablas con 'notaria' en master ===".PHP_EOL;
$filtered = array_filter(array_map(fn ($t) => array_values((array) $t)[0], $tables), fn ($n) => stripos($n, 'notaria') !== false);
foreach ($filtered as $t) {
    echo "-- $t --".PHP_EOL;
    $rows = DB::select("SELECT * FROM `$t` LIMIT 5");
    foreach ($rows as $r) {
        print_r((array) $r);
    }
}
