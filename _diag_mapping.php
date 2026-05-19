<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

// Ver tenant_services
echo '=== tenant_services ==='.PHP_EOL;
try {
    $rows = DB::table('tenant_services')->limit(10)->get();
    if ($rows->isEmpty()) {
        echo '(vacío)'.PHP_EOL;
    }
    foreach ($rows as $r) {
        print_r((array) $r);
    }
    echo 'DESCRIBE:'.PHP_EOL;
    foreach (DB::select('DESCRIBE tenant_services') as $c) {
        echo " {$c->Field} ({$c->Type})".PHP_EOL;
    }
} catch (Exception $e) {
    echo 'Error: '.$e->getMessage().PHP_EOL;
}

// MAPEO COMPLETO: notarias Laravel -> tbl_cfg_notaria C# master
echo PHP_EOL.'=== MAPEO notarias Laravel <-> tbl_cfg_notaria master ==='.PHP_EOL;
$notarias = DB::table('notarias')->get();
$cnNotarias = DB::table('tbl_cfg_notaria')->select('Id', 'Numero_Notaria', 'Estado', 'Nombre_Notario')->get();
echo 'Laravel notarias:'.PHP_EOL;
foreach ($notarias as $n) {
    echo "  L.id={$n->id} | num={$n->numero_notaria} | tenant_db={$n->tenant_db_name}".PHP_EOL;
}
echo PHP_EOL.'C# tbl_cfg_notaria (master):'.PHP_EOL;
foreach ($cnNotarias as $c) {
    echo "  CN.Id={$c->Id} | num={$c->Numero_Notaria} | estado={$c->Estado}".PHP_EOL;
}
