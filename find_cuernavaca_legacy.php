<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Buscando datos para '10Cuernavaca' y variaciones...\n\n";

$variantes = ['10Cuernavaca', '10cuernavaca', '10 Cuernavaca', '10CUERNAVACA'];

foreach ($variantes as $var) {
    $count = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('NOTARIA', $var)
        ->count();
    echo "'{$var}': ".number_format($count)." búsquedas\n";
}

echo "\n--- Notarías que contienen 'cuernavaca' (insensible a mayúsculas) ---\n";
$cuernavaca = DB::connection('aplicativos')
    ->table('busquedas')
    ->where('NOTARIA', 'LIKE', '%cuernavaca%')
    ->select('NOTARIA')
    ->selectRaw('COUNT(*) as total')
    ->groupBy('NOTARIA')
    ->get();

if ($cuernavaca->count() > 0) {
    foreach ($cuernavaca as $n) {
        echo "   '{$n->NOTARIA}' → ".number_format($n->total)." búsquedas\n";
    }
} else {
    echo "   No se encontraron notarías con 'cuernavaca'\n";
}
