<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$logs = DB::table('tbl_log_general')
    ->orderBy('Id', 'desc')
    ->limit(5)
    ->get();

foreach ($logs as $l) {
    echo "\n[{$l->Fecha_Creacion}] Op={$l->Operacion} Status={$l->Estatus} UserID={$l->Usuario_Id}\n";
    echo "  Desc: {$l->Descripcion}\n";
    if ($l->Datos) {
        echo '  Datos: '.substr($l->Datos, 0, 300)."\n";
    }
}
