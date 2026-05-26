<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== TODAS LAS NOTARÍAS ===\n";
$notarias = DB::table('notarias')->get(['id', 'nombre', 'numero_notaria', 'tenant_db_name']);

if ($notarias->isEmpty()) {
    echo "⚠️  La tabla notarias está vacía\n";
} else {
    foreach ($notarias as $n) {
        echo "ID: {$n->id} | Nombre: {$n->nombre} | Num: {$n->numero_notaria} | DB: {$n->tenant_db_name}\n";
    }
}

echo "\n=== RESUMEN ===\n";
echo "Total notarías: " . $notarias->count() . "\n";
