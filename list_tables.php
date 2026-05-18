<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== LISTADO DE TABLAS EN LA BASE DE DATOS ===\n\n";

$tables = DB::select('SHOW TABLES');
$dbName = DB::getDatabaseName();

echo "Base de datos: {$dbName}\n";
echo 'Total de tablas: '.count($tables)."\n\n";

foreach ($tables as $table) {
    $tableName = array_values((array) $table)[0];
    echo "- {$tableName}\n";
}
