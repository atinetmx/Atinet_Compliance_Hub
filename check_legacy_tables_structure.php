<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Estructura de tabla OFAC consultas:\n";
echo "=====================================\n";
$columns = DB::connection('aplicativos')->select('DESCRIBE atinet65_listasofac.consultas');
foreach ($columns as $col) {
    echo $col->Field . ' (' . $col->Type . ')' . PHP_EOL;
}

echo "\n\nEstructura de tabla SAT consultas:\n";
echo "=====================================\n";
$columns = DB::connection('aplicativos')->select('DESCRIBE atinet65_listassat.consultas');
foreach ($columns as $col) {
    echo $col->Field . ' (' . $col->Type . ')' . PHP_EOL;
}

echo "\n\nEjemplo de registro OFAC:\n";
echo "=========================\n";
$sample = DB::connection('aplicativos')
    ->table('atinet65_listasofac.consultas')
    ->where('proyecto', '10Cuernavaca')
    ->first();
if ($sample) {
    print_r($sample);
}

echo "\n\nEjemplo de registro SAT:\n";
echo "========================\n";
$sample = DB::connection('aplicativos')
    ->table('atinet65_listassat.consultas')
    ->where('proyecto', '10Cuernavaca')
    ->first();
if ($sample) {
    print_r($sample);
}
