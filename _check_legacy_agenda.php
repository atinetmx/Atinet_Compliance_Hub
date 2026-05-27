<?php

/**
 * Script para verificar la estructura de la tabla log legacy
 * y entender cómo se cargan los datos de agenda
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== ANÁLISIS DE DATOS LEGACY DE AGENDA ===\n\n";

// 1. Verificar conexión a aplicativos
try {
    DB::connection('aplicativos')->getPdo();
    echo "✅ Conexión a 'aplicativos' exitosa\n";
    echo "   Base de datos: ".config('database.connections.aplicativos.database')."\n";
    echo "   Host: ".config('database.connections.aplicativos.host')."\n\n";
} catch (Exception $e) {
    echo "❌ Error conectando a 'aplicativos': ".$e->getMessage()."\n";
    exit(1);
}

// 2. Verificar estructura de la tabla log
echo "=== ESTRUCTURA DE LA TABLA 'log' ===\n";
$columns = DB::connection('aplicativos')
    ->select("DESCRIBE log");

foreach ($columns as $col) {
    echo "  - {$col->Field} ({$col->Type}) ".($col->Null === 'YES' ? 'NULL' : 'NOT NULL')."\n";
}

echo "\n=== SAMPLE DE DATOS (últimos 10 registros) ===\n";
$logs = DB::connection('aplicativos')
    ->table('log')
    ->orderBy('fecha', 'desc')
    ->orderBy('hora', 'desc')
    ->limit(10)
    ->get();

foreach ($logs as $log) {
    echo "\n[{$log->fecha} {$log->hora}]\n";
    echo "  Notaria: {$log->notaria}\n";
    echo "  Mail: {$log->mail}\n";
    echo "  Acción: {$log->accion}\n";
}

// 3. Ver qué notarías existen en los logs
echo "\n\n=== NOTARÍAS EN LOGS LEGACY ===\n";
$notarias = DB::connection('aplicativos')
    ->table('log')
    ->select('notaria', DB::raw('COUNT(*) as total'))
    ->groupBy('notaria')
    ->orderByDesc('total')
    ->limit(20)
    ->get();

foreach ($notarias as $n) {
    echo "  - {$n->notaria}: {$n->total} registros\n";
}

// 4. Ver logs específicos de 'atinet' (super_admin)
echo "\n\n=== LOGS DE 'atinet' (SUPER ADMIN) ===\n";
$atinetLogs = DB::connection('aplicativos')
    ->table('log')
    ->where('notaria', 'atinet')
    ->orderBy('fecha', 'desc')
    ->orderBy('hora', 'desc')
    ->limit(5)
    ->get();

if ($atinetLogs->count() > 0) {
    foreach ($atinetLogs as $log) {
        echo "\n[{$log->fecha} {$log->hora}] {$log->mail}: {$log->accion}\n";
    }
} else {
    echo "  ⚠️ No hay logs de 'atinet' en la tabla\n";
}

// 5. Verificar si hay otras tablas de agenda
echo "\n\n=== BUSCANDO OTRAS TABLAS DE AGENDA ===\n";
$tables = DB::connection('aplicativos')
    ->select("SHOW TABLES LIKE '%agenda%'");

if (count($tables) > 0) {
    foreach ($tables as $table) {
        $tableName = array_values((array) $table)[0];
        echo "  ✓ Encontrada: {$tableName}\n";

        // Contar registros
        $count = DB::connection('aplicativos')->table($tableName)->count();
        echo "    Total registros: {$count}\n";
    }
} else {
    echo "  ℹ️ No hay otras tablas de agenda en la BD legacy\n";
}

echo "\n=== FIN DEL ANÁLISIS ===\n";
