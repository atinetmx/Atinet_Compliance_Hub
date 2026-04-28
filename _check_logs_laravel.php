<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== TABLAS DE LOG EN LARAVEL BD ===\n";
$tables = DB::select("SHOW TABLES LIKE '%log%'");
foreach ($tables as $t) {
    echo ' - '.array_values((array) $t)[0]."\n";
}

echo "\n=== TABLAS DE AUDITORÍA / ACTIVIDAD ===\n";
$tables2 = DB::select("SHOW TABLES LIKE '%audit%'");
$tables3 = DB::select("SHOW TABLES LIKE '%activit%'");
foreach (array_merge($tables2, $tables3) as $t) {
    echo ' - '.array_values((array) $t)[0]."\n";
}

echo "\n=== TODAS LAS TABLAS DE LA BD ===\n";
$all = DB::select('SHOW TABLES');
foreach ($all as $t) {
    echo ' - '.array_values((array) $t)[0]."\n";
}
