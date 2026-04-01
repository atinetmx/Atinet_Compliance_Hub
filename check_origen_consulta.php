<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Verificando valores de ORIGEN_CONSULTA para 10Cuernavaca...\n\n";

$origs = DB::connection('aplicativos')
    ->table('busquedas')
    ->where('NOTARIA', '10Cuernavaca')
    ->select('ORIGEN_CONSULTA')
    ->selectRaw('COUNT(*) as total')
    ->groupBy('ORIGEN_CONSULTA')
    ->get();

echo "Valores únicos de ORIGEN_CONSULTA:\n";
foreach ($origs as $o) {
    $val = $o->ORIGEN_CONSULTA ?? 'NULL';
    echo "  - '{$val}' → ".number_format($o->total)." registros\n";
}

echo "\nVerificando valores de TIPO_BUSQUEDA...\n";

$tipos = DB::connection('aplicativos')
    ->table('busquedas')
    ->where('NOTARIA', '10Cuernavaca')
    ->select('TIPO_BUSQUEDA')
    ->selectRaw('COUNT(*) as total')
    ->groupBy('TIPO_BUSQUEDA')
    ->get();

echo "\nValores únicos de TIPO_BUSQUEDA:\n";
foreach ($tipos as $t) {
    $val = $t->TIPO_BUSQUEDA ?? 'NULL';
    echo "  - '{$val}' → ".number_format($t->total)." registros\n";
}
