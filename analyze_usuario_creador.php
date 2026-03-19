<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Análisis de id_usuario_creador en Hostgator ===\n\n";

// 1. Contar eventos CON usuario creador
$conUsuario = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->whereNotNull('id_usuario_creador')
    ->count();

$sinUsuario = DB::connection('aplicativos_remote')
    ->table('agenda')
    ->whereNull('id_usuario_creador')
    ->count();

$total = $conUsuario + $sinUsuario;

echo "→ Distribución de id_usuario_creador:\n";
echo "  CON usuario:  {$conUsuario} eventos (" . round(($conUsuario/$total)*100, 1) . "%)\n";
echo "  SIN usuario:  {$sinUsuario} eventos (" . round(($sinUsuario/$total)*100, 1) . "%)\n";
echo "  Total:        {$total}\n\n";

// 2. Si hay eventos con usuario, mostrar distribución
if ($conUsuario > 0) {
    echo "--- DISTRIBUCIÓN POR USUARIO (Top 10) ---\n";
    $dist = DB::connection('aplicativos_remote')
        ->table('agenda')
        ->select('id_usuario_creador', DB::raw('COUNT(*) as total'))
        ->whereNotNull('id_usuario_creador')
        ->groupBy('id_usuario_creador')
        ->orderBy('total', 'desc')
        ->limit(10)
        ->get();

    foreach ($dist as $d) {
        echo "  Usuario ID {$d->id_usuario_creador} → {$d->total} eventos\n";
    }
    echo "\n";

    // 3. Muestras de eventos CON usuario
    echo "--- MUESTRA: Eventos CON usuario asignado ---\n";
    $samples = DB::connection('aplicativos_remote')
        ->table('agenda')
        ->whereNotNull('id_usuario_creador')
        ->orderBy('id', 'desc')
        ->limit(5)
        ->get();

    foreach ($samples as $s) {
        echo "\n  ID: {$s->id} |Usuario: {$s->id_usuario_creador} | Notaría: {$s->notaria}\n";
        echo "    Título: {$s->titulo}\n";
        echo "    Fecha: {$s->start_fecha}\n";
    }
    echo "\n";

    // 4. Intentar obtener info de esos usuarios desde la tabla usuario legacy
    echo "--- INFO DE USUARIOS CREADORES ---\n";
    $userIds = DB::connection('aplicativos_remote')
        ->table('agenda')
        ->whereNotNull('id_usuario_creador')
        ->distinct()
        ->pluck('id_usuario_creador')
        ->take(10);

    foreach ($userIds as $uid) {
        $userInfo = DB::connection('aplicativos_remote')
            ->table('usuario')
            ->where('id', $uid)
            ->first();

        if ($userInfo) {
            $notaria = $userInfo->notaria ?? '?';
            $nombre = $userInfo->nombre ?? '?';
            $email = $userInfo->mail ?? '?';
            echo "  ID {$uid}: {$nombre} | {$email} | Notaría: {$notaria}\n";
        } else {
            echo "  ID {$uid}: (Usuario no encontrado en tabla usuario)\n";
        }
    }
}

echo "\n=== Fin del análisis ===\n";
