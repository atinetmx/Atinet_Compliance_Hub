<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Ver últimos logs del C# en la BD
$logs = DB::table('tbl_log_general')
    ->orderBy('Id', 'desc')
    ->limit(10)
    ->get(['Id', 'Usuario_Id', 'Operacion', 'Descripcion', 'Estatus', 'Equipo', 'Fecha_Creacion']);

foreach ($logs as $log) {
    echo "Id={$log->Id} UserId={$log->Usuario_Id} Op={$log->Operacion}\n";
    echo "  Desc: {$log->Descripcion}\n";
    echo "  Status: {$log->Estatus} Equipo: {$log->Equipo}\n";
    echo "  Fecha: {$log->Fecha_Creacion}\n\n";
}
