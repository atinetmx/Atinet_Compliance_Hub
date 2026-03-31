<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== ESTRUCTURA DE atinet65_aplicativos.log ===\n\n";

// Estructura de la tabla
$columns = DB::connection('aplicativos')->select('DESCRIBE log');

echo "Columnas:\n";
foreach ($columns as $col) {
    echo sprintf(
        "  - %-20s %s %s %s\n",
        $col->Field,
        $col->Type,
        $col->Null === 'YES' ? 'NULL' : 'NOT NULL',
        $col->Key ? "[$col->Key]" : ''
    );
}

echo "\n=== REGISTROS DE EJEMPLO (Primeros 10) ===\n\n";

// Primeros registros
$logs = DB::connection('aplicativos')
    ->table('log')
    ->orderBy('fecha', 'desc')
    ->orderBy('hora', 'desc')
    ->limit(10)
    ->get();

foreach ($logs as $log) {
    echo "Fecha: {$log->fecha} {$log->hora}\n";
    echo "Notaría: {$log->notaria}\n";
    echo "Usuario: {$log->mail}\n";
    echo "Acción: {$log->accion}\n";
    echo str_repeat('-', 60)."\n";
}

echo "\n=== ESTADÍSTICAS ===\n\n";

// Total de registros
$total = DB::connection('aplicativos')->table('log')->count();
echo 'Total de registros: '.number_format($total)."\n";

// Registros por notaría (top 5)
echo "\nTop 5 notarías con más registros:\n";
$topNotarias = DB::connection('aplicativos')
    ->table('log')
    ->select('notaria', DB::raw('COUNT(*) as total'))
    ->groupBy('notaria')
    ->orderBy('total', 'desc')
    ->limit(5)
    ->get();

foreach ($topNotarias as $item) {
    echo "  {$item->notaria}: ".number_format($item->total)." registros\n";
}

// Tipos de acciones más comunes
echo "\nAcciones más comunes (primeras 10):\n";
$topAcciones = DB::connection('aplicativos')
    ->table('log')
    ->select('accion', DB::raw('COUNT(*) as total'))
    ->groupBy('accion')
    ->orderBy('total', 'desc')
    ->limit(10)
    ->get();

foreach ($topAcciones as $item) {
    echo '  ['.number_format($item->total)."] {$item->accion}\n";
}
