<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo '=== tbl_cfg_notaria EN MASTER (todos, sin Logotipo) ==='.PHP_EOL;
$rows = DB::table('tbl_cfg_notaria')
    ->select('Id', 'Nombre_Notario', 'Numero_Notaria', 'Municipio', 'Estado')
    ->get();
foreach ($rows as $r) {
    echo "Id={$r->Id} | Num={$r->Numero_Notaria} | {$r->Estado} | {$r->Nombre_Notario}".PHP_EOL;
}

echo PHP_EOL.'=== COUNT ==='.PHP_EOL;
echo 'Total rows: '.DB::table('tbl_cfg_notaria')->count().PHP_EOL;

// Buscar row 101, Mexico
echo PHP_EOL.'=== Buscar Notaria 101 ==='.PHP_EOL;
$r101 = DB::table('tbl_cfg_notaria')->where('Numero_Notaria', 101)->get(['Id', 'Numero_Notaria', 'Estado', 'Municipio', 'Nombre_Notario']);
print_r($r101->toArray());

// Mostrar estructura de la tabla
echo PHP_EOL.'=== DESCRIBE tbl_cfg_notaria ==='.PHP_EOL;
$cols = DB::select('DESCRIBE tbl_cfg_notaria');
foreach ($cols as $c) {
    echo "{$c->Field} ({$c->Type})".PHP_EOL;
}

// Verificar si hay tabla de tenants/notarias mapping en el master
echo PHP_EOL."=== Buscar tabla tipo 'tenant' o 'db' en MASTER ===".PHP_EOL;
$tables = DB::select('SHOW TABLES');
foreach ($tables as $t) {
    $name = array_values((array) $t)[0];
    if (stripos($name, 'tenant') !== false || stripos($name, 'database') !== false || stripos($name, '_db') !== false) {
        echo "FOUND: $name".PHP_EOL;
    }
}
