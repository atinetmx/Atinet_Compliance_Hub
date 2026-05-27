<?php

/**
 * Script para analizar la tabla 'agenda' legacy
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== ANÁLISIS DE LA TABLA 'agenda' LEGACY ===\n\n";

// 1. Estructura de la tabla agenda
echo "=== ESTRUCTURA DE LA TABLA 'agenda' ===\n";
$columns = DB::connection('aplicativos')
    ->select("DESCRIBE agenda");

foreach ($columns as $col) {
    $extra = $col->Extra ? " [{$col->Extra}]" : '';
    echo "  - {$col->Field} ({$col->Type}) ".($col->Null === 'YES' ? 'NULL' : 'NOT NULL').$extra."\n";
}

// 2. Sample de datos
echo "\n=== SAMPLE DE DATOS (últimos 10 registros) ===\n";
$eventos = DB::connection('aplicativos')
    ->table('agenda')
    ->orderBy('start_fecha', 'desc')
    ->limit(10)
    ->get();

foreach ($eventos as $evento) {
    echo "\n";
    foreach ((array) $evento as $key => $value) {
        if (!is_null($value) && $value !== '') {
            echo "  {$key}: {$value}\n";
        }
    }
    echo "  ---\n";
}

// 3. Ver eventos de 'atinet'
echo "\n=== EVENTOS DE 'atinet' (SUPER ADMIN) ===\n";
$atinetEventos = DB::connection('aplicativos')
    ->table('agenda')
    ->where('notaria', 'atinet')
    ->orderBy('start_fecha', 'desc')
    ->limit(5)
    ->get();

if ($atinetEventos->count() > 0) {
    echo "Total de eventos 'atinet': ".DB::connection('aplicativos')->table('agenda')->where('notaria', 'atinet')->count()."\n\n";
    foreach ($atinetEventos as $evento) {
        echo "\n[{$evento->start_fecha}]\n";
        foreach ((array) $evento as $key => $value) {
            if (!is_null($value) && $value !== '' && $key !== 'start_fecha') {
                echo "  {$key}: {$value}\n";
            }
        }
    }
} else {
    echo "  ⚠️ No hay eventos de 'atinet' en la tabla\n";
}

// 4. Ver distribución por notaria
echo "\n\n=== DISTRIBUCIÓN DE EVENTOS POR NOTARÍA ===\n";
$notarias = DB::connection('aplicativos')
    ->table('agenda')
    ->select('notaria', DB::raw('COUNT(*) as total'))
    ->groupBy('notaria')
    ->orderByDesc('total')
    ->limit(15)
    ->get();

foreach ($notarias as $n) {
    echo "  - {$n->notaria}: {$n->total} eventos\n";
}

// 5. Ver tipos de eventos si existe la columna
echo "\n\n=== VERIFICANDO SI HAY COLUMNA 'tipo' o 'color' ===\n";
$hasColor = collect($columns)->contains(fn($col) => $col->Field === 'color');
$hasTipo = collect($columns)->contains(fn($col) => $col->Field === 'tipo');

if ($hasTipo) {
    echo "✓ Columna 'tipo' encontrada\n";
    $tipos = DB::connection('aplicativos')
        ->table('agenda')
        ->select('tipo', DB::raw('COUNT(*) as total'))
        ->groupBy('tipo')
        ->get();
    foreach ($tipos as $t) {
        echo "  - {$t->tipo}: {$t->total}\n";
    }
}

if ($hasColor) {
    echo "✓ Columna 'color' encontrada\n";
    $colores = DB::connection('aplicativos')
        ->table('agenda')
        ->select('color', DB::raw('COUNT(*) as total'))
        ->groupBy('color')
        ->limit(10)
        ->get();
    foreach ($colores as $c) {
        echo "  - {$c->color}: {$c->total}\n";
    }
}

echo "\n=== FIN DEL ANÁLISIS ===\n";
