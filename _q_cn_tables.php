<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;

// Ver todas las tablas en la BD master del C#
$tables = DB::select('SHOW TABLES');
$key = array_key_first((array) $tables[0]);
echo "Tablas en atinet_compliance_hub:\n";
foreach ($tables as $t) {
    $name = $t->$key;
    $count = DB::table($name)->count();
    echo "  {$name} ({$count} registros)\n";
}

// Buscar tablas relacionadas con notarías o conexiones
echo "\nBuscando config de notarías/tenants en el C#...\n";
$candidates = ['notarias', 'tbl_cat_notarias', 'tbl_notarias', 'tbl_conexiones', 'conexiones', 'tenants', 'tbl_tenants', 'configuracion', 'config'];
foreach ($candidates as $t) {
    try {
        $rows = DB::table($t)->get();
        if ($rows->isNotEmpty()) {
            echo "\n=== {$t} ===\n";
            echo $rows->take(5)->toJson(JSON_PRETTY_PRINT)."\n";
        }
    } catch (\Throwable) {
    }
}
