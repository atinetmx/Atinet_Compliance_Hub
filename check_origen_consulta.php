<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== ANÁLISIS COMPLETO DE ORIGEN_CONSULTA ===\n\n";

// 1. Ver todos los valores únicos
$origenes = DB::connection('aplicativos')
    ->table('busquedas')
    ->select('ORIGEN_CONSULTA')
    ->selectRaw('COUNT(*) as total')
    ->groupBy('ORIGEN_CONSULTA')
    ->orderByDesc('total')
    ->get();

echo "📊 TODOS los valores de ORIGEN_CONSULTA:\n";
echo str_repeat('-', 60)."\n";
foreach ($origenes as $o) {
    $origen = $o->ORIGEN_CONSULTA ?? 'NULL';
    $porcentaje = round(($o->total / 20894) * 100, 2);
    printf("  %-30s: %8s búsquedas (%6.2f%%)\n",
        "'{$origen}'",
        number_format($o->total),
        $porcentaje
    );
}

echo "\n";

// 2. Ver distribución por notaría y origen
echo "📋 Distribución ORIGEN_CONSULTA por Notaría (top 10):\n";
echo str_repeat('-', 60)."\n";

$porNotariaOrigen = DB::connection('aplicativos')
    ->table('busquedas')
    ->select('NOTARIA', 'ORIGEN_CONSULTA')
    ->selectRaw('COUNT(*) as total')
    ->groupBy('NOTARIA', 'ORIGEN_CONSULTA')
    ->orderBy('NOTARIA')
    ->limit(30)
    ->get();

$notariaActual = null;
foreach ($porNotariaOrigen as $item) {
    if ($notariaActual !== $item->NOTARIA) {
        if ($notariaActual !== null) {
            echo "\n";
        }
        $notariaActual = $item->NOTARIA;
        echo "  📍 {$item->NOTARIA}\n";
    }
    $origen = $item->ORIGEN_CONSULTA ?? 'NULL';
    printf("     ├─ %-25s: %s\n", $origen, number_format($item->total));
}

echo "\n";

// 3. Ver ejemplos concretos
echo "📝 Ejemplos de registros:\n";
echo str_repeat('-', 60)."\n";

foreach ($origenes as $o) {
    $origen = $o->ORIGEN_CONSULTA;
    $origenLabel = $origen ?? 'NULL';
    echo "\n  Origen: '{$origenLabel}'\n";

    $ejemplos = DB::connection('aplicativos')
        ->table('busquedas')
        ->where(function ($q) use ($origen) {
            if ($origen === null) {
                $q->whereNull('ORIGEN_CONSULTA');
            } else {
                $q->where('ORIGEN_CONSULTA', $origen);
            }
        })
        ->select('NOTARIA', 'TIPO_BUSQUEDA', 'FECHA')
        ->limit(3)
        ->get();

    foreach ($ejemplos as $i => $ej) {
        echo '    '.($i + 1).". {$ej->NOTARIA} | {$ej->TIPO_BUSQUEDA} | {$ej->FECHA}\n";
    }
}
