<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== MONITOR SESIONES CN (Ctrl+C para detener) ===\n";
echo str_pad("Hora", 10) . str_pad("Id", 5) . str_pad("Usuario", 18) . str_pad("SI", 4) . "Sesiones_Activas\n";
echo str_repeat("-", 70) . "\n";

$prev = [];

while (true) {
    $usuarios = DB::table('tbl_cat_usuarios')
        ->select('Id','Usuario','Sesion_Iniciada')
        ->orderBy('Id')
        ->get()
        ->keyBy('Id');

    $sesiones = DB::table('tbl_log_sesiones_activas')
        ->select('Usuario_Id', DB::raw('COUNT(*) as total'))
        ->groupBy('Usuario_Id')
        ->pluck('total', 'Usuario_Id');

    foreach ($usuarios as $id => $u) {
        $key = "{$u->Sesion_Iniciada}";
        $changed = isset($prev[$id]) && $prev[$id] !== $key;
        $ses = $sesiones[$id] ?? 0;

        if ($changed || !isset($prev[$id])) {
            $mark = $changed ? " ◄ CAMBIO" : "";
            echo str_pad(date('H:i:s'), 10)
                . str_pad($u->Id, 5)
                . str_pad($u->Usuario, 18)
                . str_pad($u->Sesion_Iniciada, 4)
                . "sesiones={$ses}{$mark}\n";
        }
        $prev[$id] = $key;
    }

    sleep(2);
}
