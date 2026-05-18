<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== agenda_events: distribucion por anio ===\n";
$rows = DB::table('agenda_events')
    ->selectRaw('YEAR(start_fecha) as anio, COUNT(*) as total')
    ->groupByRaw('YEAR(start_fecha)')
    ->orderBy('anio', 'desc')
    ->get();
foreach ($rows as $r) {
    echo "  Anio={$r->anio} total={$r->total}\n";
}

echo "\n=== agenda_events: eventos de 2026 (muestra 10) ===\n";
$rows2 = DB::table('agenda_events')
    ->whereYear('start_fecha', 2026)
    ->orderBy('start_fecha')
    ->limit(10)
    ->get(['id', 'legacy_notaria', 'titulo', 'start_fecha', 'end_fecha']);
foreach ($rows2 as $r) {
    echo "  id={$r->id} legacy={$r->legacy_notaria} start={$r->start_fecha} titulo=" . substr($r->titulo ?? '', 0, 40) . "\n";
}

echo "\n=== agenda_events: eventos de marzo 2026 ===\n";
$marzo = DB::table('agenda_events')
    ->whereYear('start_fecha', 2026)
    ->whereMonth('start_fecha', 3)
    ->count();
echo "  Total marzo 2026: {$marzo}\n";

echo "=== LEGACY: distribucion por anio ===\n";
$rows = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->selectRaw('YEAR(start_fecha) as anio, COUNT(*) as total')
    ->groupByRaw('YEAR(start_fecha)')
    ->orderBy('anio', 'desc')
    ->get();
foreach ($rows as $r) {
    echo "  Anio={$r->anio} total={$r->total}\n";
}

echo "\n=== LEGACY: total registros 2026+ ===\n";
$count = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->where('start_fecha', '>=', '2026-01-01')
    ->count();
echo "  Total 2026+: {$count}\n";

echo "\n=== LEGACY: muestra 5 registros 2026 ===\n";
$rows = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->where('start_fecha', '>=', '2026-01-01')
    ->orderBy('start_fecha', 'desc')
    ->limit(5)
    ->get(['id', 'notaria', 'start_fecha', 'end_fecha', 'titulo', 'id_usuario_creador']);
foreach ($rows as $r) {
    echo "  id={$r->id} notaria={$r->notaria} start={$r->start_fecha} userid={$r->id_usuario_creador} titulo=" . substr($r->titulo ?? '', 0, 40) . "\n";
}

echo "\n=== LEGACY: total registros con notaria='atinet' ===\n";
$totalAtinet = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->where('notaria', 'atinet')
    ->count();
echo "  Total atinet: {$totalAtinet}\n";

echo "\n=== agenda_events (ya migrados): distribucion por anio ===\n";
$rows2 = DB::table('agenda_events')
    ->selectRaw('YEAR(start_fecha) as anio, COUNT(*) as total')
    ->groupByRaw('YEAR(start_fecha)')
    ->orderBy('anio', 'desc')
    ->get();
foreach ($rows2 as $r) {
    echo "  Anio={$r->anio} total={$r->total}\n";
}

echo "\n=== legacy_id min y max en agenda_events ===\n";
$max = DB::table('agenda_events')->max('legacy_id');
$min = DB::table('agenda_events')->min('legacy_id');
echo "  legacy_id min={$min} max={$max}\n";

echo "\n=== LEGACY: IDs pendientes de migrar (mayores al max ya migrado) ===\n";
$pending = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->where('notaria', 'atinet')
    ->where('id', '>', $max)
    ->count();
echo "  Pendientes (id > {$max}): {$pending}\n";

if ($pending > 0) {
    echo "\n=== LEGACY: muestra de pendientes ===\n";
    $rows3 = DB::connection('aplicativos_remote')
        ->table('agenda')
        ->where('notaria', 'atinet')
        ->where('id', '>', $max)
        ->orderBy('start_fecha', 'desc')
        ->limit(5)
        ->get(['id', 'notaria', 'start_fecha', 'titulo', 'id_usuario_creador']);
    foreach ($rows3 as $r) {
        echo "  id={$r->id} start={$r->start_fecha} userid={$r->id_usuario_creador} titulo=" . substr($r->titulo ?? '', 0, 40) . "\n";
    }
}
foreach ($rows as $r) {
    echo "  Anio={$r->anio} total={$r->total}\n";
}

echo "\n=== LEGACY: total registros 2026+ ===\n";
$count = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->where('start', '>=', '2026-01-01')
    ->count();
echo "  Total 2026+: {$count}\n";

echo "\n=== LEGACY: muestra de registros 2026 ===\n";
$rows = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->where('start', '>=', '2026-01-01')
    ->limit(5)
    ->get(['id', 'notaria', 'start', 'end', 'title', 'userid']);
foreach ($rows as $r) {
    echo "  id={$r->id} notaria={$r->notaria} start={$r->start} userid={$r->userid} title=" . substr($r->title ?? '', 0, 40) . "\n";
}

echo "\n=== agenda_events: distribucion por anio ===\n";
$rows2 = DB::table('agenda_events')
    ->selectRaw('YEAR(start_fecha) as anio, COUNT(*) as total')
    ->groupByRaw('YEAR(start_fecha)')
    ->orderBy('anio', 'desc')
    ->get();
foreach ($rows2 as $r) {
    echo "  Anio={$r->anio} total={$r->total}\n";
}

echo "\n=== agenda_events IDs legacy: min y max ===\n";
$max = DB::table('agenda_events')->max('legacy_id');
$min = DB::table('agenda_events')->min('legacy_id');
echo "  legacy_id min={$min} max={$max}\n";

echo "\n=== LEGACY: total de registros con notaria='atinet' ===\n";
$totalAtinet = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->where('notaria', 'atinet')
    ->count();
echo "  Total atinet en legacy: {$totalAtinet}\n";

echo "\n=== LEGACY: registros NO migrados (legacy_id no existe en agenda_events) ===\n";
$migratedIds = DB::table('agenda_events')->pluck('legacy_id')->filter()->toArray();
$pending = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->where('notaria', 'atinet')
    ->whereNotIn('id', $migratedIds)
    ->count();
echo "  Pendientes de migrar: {$pending}\n";

if ($pending > 0) {
    echo "\n=== LEGACY: muestra de NO migrados ===\n";
    $rows3 = DB::connection('aplicativos_remote')
        ->table('agenda')
        ->where('notaria', 'atinet')
        ->whereNotIn('id', $migratedIds)
        ->orderBy('start', 'desc')
        ->limit(5)
        ->get(['id', 'notaria', 'start', 'end', 'title', 'userid']);
    foreach ($rows3 as $r) {
        echo "  id={$r->id} start={$r->start} userid={$r->userid} title=" . substr($r->title ?? '', 0, 40) . "\n";
    }
}
