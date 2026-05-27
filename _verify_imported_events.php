<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== VERIFICACIÓN DE EVENTOS IMPORTADOS ===\n\n";

$total = DB::table('agenda_events')->where('legacy_notaria', 'atinet')->count();
$with11 = DB::table('agenda_events')->where('legacy_notaria', 'atinet')->where('notaria_id', 11)->count();
$withNull = DB::table('agenda_events')->where('legacy_notaria', 'atinet')->whereNull('notaria_id')->count();

echo "📊 Total eventos 'atinet': {$total}\n";
echo "✅ Con notaria_id=11: {$with11}\n";
echo "❌ Con notaria_id=NULL: {$withNull}\n\n";

if ($with11 === $total) {
    echo "🎉 PERFECTO! Todos los eventos tienen notaria_id=11 (ATINET MASTER)\n\n";
} else {
    echo "⚠️  ATENCIÓN: Hay eventos sin notaria_id=11\n\n";
}

echo "=== SAMPLE DE EVENTOS IMPORTADOS ===\n";
$sample = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->orderBy('start_fecha', 'desc')
    ->limit(5)
    ->get();

foreach ($sample as $event) {
    echo "\n[{$event->id}] {$event->start_fecha}\n";
    echo "  Título: {$event->titulo}\n";
    echo "  legacy_notaria: {$event->legacy_notaria}\n";
    echo "  notaria_id: {$event->notaria_id}\n";
    echo "  color: {$event->color}\n";
    if ($event->comentarios) {
        echo "  comentarios: {$event->comentarios}\n";
    }
}

echo "\n=== VERIFICACIÓN COMPLETADA ===\n";
