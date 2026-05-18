<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Diagnóstico de Bitácora ===\n\n";

// 1. Verificar conexión aplicativos
try {
    DB::connection('aplicativos')->getPdo();
    echo "✓ Conexión 'aplicativos' OK\n\n";
} catch (Exception $e) {
    echo "✗ Error en conexión 'aplicativos': {$e->getMessage()}\n";
    exit(1);
}

// 2. Verificar estructura de tabla log
echo "--- Estructura de tabla 'log' ---\n";
$columns = DB::connection('aplicativos')
    ->select('SHOW COLUMNS FROM log');
foreach ($columns as $col) {
    echo "  {$col->Field} ({$col->Type})\n";
}
echo "\n";

// 3. Contar registros totales
$totalRegistros = DB::connection('aplicativos')->table('log')->count();
echo "Total de registros en log: {$totalRegistros}\n\n";

// 4. Ver fechas disponibles (primeras 10)
echo "--- Primeras 10 fechas en log ---\n";
$fechas = DB::connection('aplicativos')
    ->table('log')
    ->select('fecha', DB::raw('COUNT(*) as total'))
    ->groupBy('fecha')
    ->orderBy('fecha', 'desc')
    ->limit(10)
    ->get();

foreach ($fechas as $f) {
    echo "  {$f->fecha} → {$f->total} registros\n";
}
echo "\n";

// 5. Ver notarías disponibles
echo "--- Notarías en log (primeras 10) ---\n";
$notarias = DB::connection('aplicativos')
    ->table('log')
    ->select('notaria', DB::raw('COUNT(*) as total'))
    ->groupBy('notaria')
    ->limit(10)
    ->get();

foreach ($notarias as $n) {
    echo "  {$n->notaria} → {$n->total} registros\n";
}
echo "\n";

// 6. Verificar legacy_identifier en notarias
echo "--- Legacy identifiers configurados ---\n";
$notariasConLegacy = DB::table('notarias')
    ->whereNotNull('legacy_identifier')
    ->select('id', 'nombre', 'legacy_identifier')
    ->get();

echo 'Total notarías con legacy_identifier: '.$notariasConLegacy->count()."\n";
foreach ($notariasConLegacy as $n) {
    echo "  ID {$n->id}: {$n->nombre} → legacy: '{$n->legacy_identifier}'\n";
}
echo "\n";

// 7. Ejemplo de consulta para fecha específica
$fechaEjemplo = '2026-02-01';
echo "--- Ejemplo: registros para fecha {$fechaEjemplo} ---\n";
$ejemplos = DB::connection('aplicativos')
    ->table('log')
    ->where('fecha', $fechaEjemplo)
    ->limit(5)
    ->get();

if ($ejemplos->isEmpty()) {
    echo "  (Sin registros para esta fecha)\n";
} else {
    foreach ($ejemplos as $e) {
        echo "  {$e->hora} | {$e->mail} | {$e->notaria} | ".substr($e->accion, 0, 50)."...\n";
    }
}
echo "\n";

echo "=== Fin del diagnóstico ===\n";
