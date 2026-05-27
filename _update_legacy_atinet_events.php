<?php

/**
 * Script para actualizar eventos legacy de 'atinet' que tienen notaria_id=NULL
 * y asignarles notaria_id=11 (ATINET MASTER)
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== ACTUALIZACIÓN DE EVENTOS LEGACY 'atinet' ===\n\n";

// 1. Verificar eventos con legacy_notaria='atinet' y notaria_id=NULL
$atinetEventsNull = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->whereNull('notaria_id')
    ->count();

echo "📊 Eventos 'atinet' con notaria_id=NULL: {$atinetEventsNull}\n";

// 2. Verificar eventos con legacy_notaria='atinet' y notaria_id=11
$atinetEvents11 = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->where('notaria_id', 11)
    ->count();

echo "📊 Eventos 'atinet' con notaria_id=11: {$atinetEvents11}\n";

// 3. Verificar total de eventos 'atinet'
$totalAtinet = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->count();

echo "📊 Total eventos 'atinet': {$totalAtinet}\n\n";

if ($atinetEventsNull === 0) {
    echo "✅ No hay eventos con notaria_id=NULL. Todo correcto.\n";
    exit(0);
}

// 4. Verificar que ATINET MASTER existe
$atinetMaster = DB::table('notarias')->find(11);

if (!$atinetMaster) {
    echo "❌ ERROR: ATINET MASTER (id=11) no existe en la tabla notarias\n";
    echo "   Ejecuta primero el script _reorganize_atinet_master.php\n";
    exit(1);
}

echo "✅ ATINET MASTER encontrada: id={$atinetMaster->id}, numero_notaria={$atinetMaster->numero_notaria}\n\n";

// 5. Mostrar sample de eventos que se actualizarán
echo "=== SAMPLE DE EVENTOS A ACTUALIZAR ===\n";
$sampleEvents = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->whereNull('notaria_id')
    ->orderBy('start_fecha', 'desc')
    ->limit(5)
    ->get(['id', 'titulo', 'start_fecha', 'legacy_notaria', 'notaria_id']);

foreach ($sampleEvents as $event) {
    echo "  [{$event->id}] {$event->start_fecha} - {$event->titulo}\n";
    echo "      legacy_notaria={$event->legacy_notaria}, notaria_id={$event->notaria_id}\n";
}

// 6. Confirmación
echo "\n⚠️  ¿Actualizar {$atinetEventsNull} eventos de 'atinet' a notaria_id=11? (y/N): ";
$handle = fopen("php://stdin", "r");
$line = fgets($handle);
fclose($handle);

if (trim(strtolower($line)) !== 'y') {
    echo "❌ Operación cancelada por el usuario.\n";
    exit(0);
}

// 7. Actualizar
echo "\n🔄 Actualizando eventos...\n";

$updated = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->whereNull('notaria_id')
    ->update([
        'notaria_id' => 11,
        'updated_at' => now()
    ]);

echo "✅ Eventos actualizados: {$updated}\n";

// 8. Verificar resultado
$remainingNull = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->whereNull('notaria_id')
    ->count();

$total11 = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->where('notaria_id', 11)
    ->count();

echo "\n=== RESULTADO FINAL ===\n";
echo "✅ Eventos 'atinet' con notaria_id=NULL: {$remainingNull}\n";
echo "✅ Eventos 'atinet' con notaria_id=11: {$total11}\n";
echo "\n=== ACTUALIZACIÓN COMPLETADA ===\n";
