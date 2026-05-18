<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Muestra de eventos de 'atinet' ===\n\n";

$events = DB::connection('aplicativos')
    ->table('agenda')
    ->where('notaria', 'atinet')
    ->orderBy('id')
    ->limit(5)
    ->get();

foreach ($events as $event) {
    echo "ID: {$event->id}\n";
    echo "  Título: {$event->titulo}\n";
    echo "  Notaría: {$event->notaria}\n";
    echo '  Usuario creador: '.($event->id_usuario_creador ?: '(NULL)')."\n";
    echo "  Start: {$event->start_fecha}\n";
    echo "  End: {$event->end_fecha}\n";
    echo "\n";
}

$total = DB::connection('aplicativos')
    ->table('agenda')
    ->where('notaria', 'atinet')
    ->count();

$conUsuario = DB::connection('aplicativos')
    ->table('agenda')
    ->where('notaria', 'atinet')
    ->whereNotNull('id_usuario_creador')
    ->count();

$sinUsuario = $total - $conUsuario;

echo "Total eventos 'atinet': {$total}\n";
echo "  Con usuario: {$conUsuario}\n";
echo "  Sin usuario (legacy): {$sinUsuario}\n";
