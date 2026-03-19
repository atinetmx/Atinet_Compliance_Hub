<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Comparación Agenda: Local vs Hostgator ===\n\n";

// Test conexiones
echo "→ Testing conexiones...\n";
try {
    DB::connection('aplicativos')->getPdo();
    echo "  ✓ Conexión LOCAL 'aplicativos' OK\n";
} catch (Exception $e) {
    echo "  ✗ Error LOCAL: {$e->getMessage()}\n";
    exit(1);
}

try {
    DB::connection('aplicativos_remote')->getPdo();
    echo "  ✓ Conexión REMOTA 'aplicativos_remote' OK\n\n";
} catch (Exception $e) {
    echo "  ✗ Error REMOTA: {$e->getMessage()}\n";
    echo "  (Verifica las variables de entorno DB_APLICATIVOS_REMOTE_*)\n";
    exit(1);
}

// ================================================
// ANÁLISIS ESTRUCTURA
// ================================================
echo "=== ESTRUCTURA DE LA TABLA ===\n\n";

echo "--- LOCAL (aplicativos.agenda) ---\n";
$localCols = DB::connection('aplicativos')
    ->select("SHOW COLUMNS FROM agenda");
foreach ($localCols as $col) {
    $key = $col->Key ? " [{$col->Key}]" : "";
    $null = $col->Null === 'YES' ? 'NULL' : 'NOT NULL';
    echo sprintf("  %-20s %-15s %-10s%s\n", 
        $col->Field, 
        $col->Type, 
        $null,
        $key
    );
}

echo "\n--- REMOTO (Hostgator aplicativos.agenda) ---\n";
$remoteCols = DB::connection('aplicativos_remote')
    ->select("SHOW COLUMNS FROM agenda");
foreach ($remoteCols as $col) {
    $key = $col->Key ? " [{$col->Key}]" : "";
    $null = $col->Null === 'YES' ? 'NULL' : 'NOT NULL';
    echo sprintf("  %-20s %-15s %-10s%s\n", 
        $col->Field, 
        $col->Type, 
        $null,
        $key
    );
}

// Detectar diferencias
echo "\n--- DIFERENCIAS EN COLUMNAS ---\n";
$localFields = collect($localCols)->pluck('Field')->toArray();
$remoteFields = collect($remoteCols)->pluck('Field')->toArray();

$onlyLocal = array_diff($localFields, $remoteFields);
$onlyRemote = array_diff($remoteFields, $localFields);

if (empty($onlyLocal) && empty($onlyRemote)) {
    echo "  ✓ Mismas columnas en ambas BDs\n";
} else {
    if (!empty($onlyLocal)) {
        echo "  Solo en LOCAL: " . implode(', ', $onlyLocal) . "\n";
    }
    if (!empty($onlyRemote)) {
        echo "  Solo en REMOTO: " . implode(', ', $onlyRemote) . "\n";
    }
}

// ================================================
// CONTEO DE REGISTROS
// ================================================
echo "\n=== CONTEO DE REGISTROS ===\n\n";
$localCount = DB::connection('aplicativos')->table('agenda')->count();
$remoteCount = DB::connection('aplicativos_remote')->table('agenda')->count();

echo "  Local:  {$localCount} registros\n";
echo "  Remoto: {$remoteCount} registros\n";

if ($localCount != $remoteCount) {
    $diff = abs($remoteCount - $localCount);
    echo "  → Diferencia: {$diff} registros\n";
}

// ================================================
// MUESTRA DE DATOS REMOTOS
// ================================================
echo "\n=== MUESTRA DATOS REMOTOS (últimos 3 registros) ===\n";
$remoteSample = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->orderBy('id', 'desc')
    ->limit(3)
    ->get();

foreach ($remoteSample as $row) {
    echo "\n  ID: {$row->id}\n";
    foreach (get_object_vars($row) as $key => $value) {
        $display = is_null($value) ? '(NULL)' : 
                   (strlen($value) > 60 ? substr($value, 0, 60) . '...' : $value);
        echo "    {$key}: {$display}\n";
    }
}

// ================================================
// ANÁLISIS DE CAMPOS PARA USER TRACKING
// ================================================
echo "\n=== ANÁLISIS DE CAMPOS REMOTOS ===\n";

$remoteFieldNames = collect($remoteCols)->pluck('Field')->toArray();

// Buscar campos nuevos que puedan indicar usuario
$userFields = ['usuario_id', 'user_id', 'creado_por', 'created_by', 'mail', 'email', 'usuario'];
echo "\n→ Campos de identificación de usuario:\n";
$foundUserFields = array_intersect($userFields, $remoteFieldNames);

if (empty($foundUserFields)) {
    echo "  ✗ No se encontraron campos de usuario\n";
} else {
    foreach ($foundUserFields as $field) {
        echo "  ✓ Campo '{$field}' encontrado\n";
        // Muestra distribución
        $dist = DB::connection('aplicativos_remote')
            ->table('agenda')
            ->select($field, DB::raw('COUNT(*) as total'))
            ->groupBy($field)
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();
        foreach ($dist as $d) {
            $val = $d->$field ?? '(NULL)';
            echo "    {$val} → {$d->total} eventos\n";
        }
    }
}

// ================================================
// REGISTROS RECIENTES REMOTOS
// ================================================
if (in_array('created_at', $remoteFieldNames) || in_array('fecha_creacion', $remoteFieldNames)) {
    echo "\n→ Registros más recientes en remoto:\n";
    $dateField = in_array('created_at', $remoteFieldNames) ? 'created_at' : 'fecha_creacion';
    $recent = DB::connection('aplicativos_remote')
        ->table('agenda')
        ->select('id', 'titulo', 'notaria', $dateField)
        ->orderBy($dateField, 'desc')
        ->limit(5)
        ->get();
    
    foreach ($recent as $r) {
        $date = $r->$dateField ?? 'N/A';
        echo "  ID {$r->id} | {$r->notaria} | {$date} | {$r->titulo}\n";
    }
}

echo "\n=== Fin de la comparación ===\n";
