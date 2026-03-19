<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Análisis de atinet65_aplicativos.agenda ===\n\n";

// 1. Estructura de la tabla
echo "--- ESTRUCTURA DE LA TABLA ---\n";
$columns = DB::connection('aplicativos')
    ->select("SHOW COLUMNS FROM agenda");

foreach ($columns as $col) {
    $key = $col->Key ? " [{$col->Key}]" : "";
    $null = $col->Null === 'YES' ? 'NULL' : 'NOT NULL';
    $default = $col->Default ? " DEFAULT {$col->Default}" : "";
    echo sprintf("  %-20s %-15s %-10s%s%s\n",
        $col->Field,
        $col->Type,
        $null,
        $key,
        $default
    );
}
echo "\n";

// 2. Total de registros
$total = DB::connection('aplicativos')->table('agenda')->count();
echo "Total de registros: {$total}\n\n";

// 3. Muestra de registros (primeros 5)
echo "--- MUESTRA DE REGISTROS (primeros 5) ---\n";
$sample = DB::connection('aplicativos')
    ->table('agenda')
    ->orderBy('id')
    ->limit(5)
    ->get();

if ($sample->isEmpty()) {
    echo "  (Sin registros)\n\n";
} else {
    foreach ($sample as $row) {
        echo "\n  Registro ID: {$row->id}\n";
        foreach (get_object_vars($row) as $key => $value) {
            $displayValue = is_null($value) ? '(NULL)' : (strlen($value) > 50 ? substr($value, 0, 50) . '...' : $value);
            echo "    {$key}: {$displayValue}\n";
        }
    }
    echo "\n";
}

// 4. Campos únicos/agrupados
echo "--- ANÁLISIS DE CAMPOS CLAVE ---\n";

// Si tiene un campo 'notaria'
$columnsNames = array_column($columns, 'Field');
if (in_array('notaria', $columnsNames)) {
    echo "\nCampo 'notaria' - Valores únicos:\n";
    $notarias = DB::connection('aplicativos')
        ->table('agenda')
        ->select('notaria', DB::raw('COUNT(*) as total'))
        ->groupBy('notaria')
        ->orderBy('total', 'desc')
        ->limit(10)
        ->get();
    foreach ($notarias as $n) {
        echo "  {$n->notaria} → {$n->total} eventos\n";
    }
}

// Buscar campos que puedan ser identificadores de usuario
$possibleUserFields = ['usuario', 'user', 'mail', 'email', 'creado_por', 'user_id'];
foreach ($possibleUserFields as $field) {
    if (in_array($field, $columnsNames)) {
        echo "\nCampo '{$field}' encontrado - Valores únicos (top 10):\n";
        $values = DB::connection('aplicativos')
            ->table('agenda')
            ->select($field, DB::raw('COUNT(*) as total'))
            ->groupBy($field)
            ->orderBy('total', 'desc')
            ->limit(10)
            ->get();
        foreach ($values as $v) {
            $val = $v->$field ?? '(NULL)';
            echo "  {$val} → {$v->total} eventos\n";
        }
    }
}

// 5. Rango de fechas
if (in_array('fecha', $columnsNames) || in_array('start_fecha', $columnsNames) || in_array('fecha_inicio', $columnsNames)) {
    echo "\n--- RANGO DE FECHAS ---\n";
    foreach (['fecha', 'start_fecha', 'fecha_inicio', 'created_at'] as $dateField) {
        if (in_array($dateField, $columnsNames)) {
            $range = DB::connection('aplicativos')
                ->table('agenda')
                ->selectRaw("MIN({$dateField}) as min, MAX({$dateField}) as max")
                ->first();
            if ($range->min) {
                echo "  {$dateField}: {$range->min} → {$range->max}\n";
            }
        }
    }
}

echo "\n=== Fin del análisis ===\n";
