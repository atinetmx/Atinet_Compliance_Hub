<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "==================================================\n";
echo "Análisis detallado de datos legacy para 10Cuernavaca\n";
echo "==================================================\n\n";

// 1. Contar total de registros
$total = DB::connection('aplicativos')
    ->table('busquedas')
    ->where('NOTARIA', '10Cuernavaca')
    ->count();

echo "Total registros para '10Cuernavaca': " . number_format($total) . "\n\n";

if ($total === 0) {
    echo "⚠️  No hay registros. Probando variaciones...\n\n";

    $variantes = ['10Cuernavaca', '10cuernavaca', '10 Cuernavaca', '10CUERNAVACA'];
    foreach ($variantes as $var) {
        $count = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('NOTARIA', $var)
            ->count();
        echo "  '{$var}': " . number_format($count) . "\n";
    }

    echo "\n--- Buscando con LIKE ---\n";
    $likes = DB::connection('aplicativos')
        ->table('busquedas')
        ->where('NOTARIA', 'LIKE', '%10%')
        ->where('NOTARIA', 'LIKE', '%Cuernavaca%')
        ->select('NOTARIA')
        ->selectRaw('COUNT(*) as total')
        ->groupBy('NOTARIA')
        ->get();

    foreach ($likes as $l) {
        echo "  '{$l->NOTARIA}' → " . number_format($l->total) . " registros\n";
    }
}

// 2. Revisar nombres de columnas reales
echo "\n--- Estructura de tabla 'busquedas' ---\n";
$cols = DB::connection('aplicativos')->select("SHOW COLUMNS FROM busquedas");
echo "Columnas:\n";
foreach ($cols as $col) {
    echo "  - {$col->Field} ({$col->Type})\n";
}

// 3. Muestra de 3 registros
echo "\n--- Muestra de 3 registros (cualquier notaría) ---\n";
$muestra = DB::connection('aplicativos')
    ->table('busquedas')
    ->limit(3)
    ->get();

foreach ($muestra as $i => $m) {
    echo "\nRegistro " . ($i+1) . ":\n";
    echo "  id: {$m->id}\n";
    echo "  NOTARIA: {$m->NOTARIA}\n";
    echo "  TIPO_BUSQUEDA: {$m->TIPO_BUSQUEDA}\n";
    echo "  NOMBRE: {$m->NOMBRE}\n";
    echo "  FECHA: {$m->FECHA}\n";
    echo "  ORIGEN_CONSULTA: " . ($m->ORIGEN_CONSULTA ?? 'NULL') . "\n";
}

echo "\n==================================================\n";
