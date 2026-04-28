<?php

define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$r = DB::table('tbl_log_general')
    ->where('Operacion', 'ExceptionExecuted')
    ->orderByDesc('Id')
    ->first();

if ($r) {
    echo "Última excepción: [{$r->Fecha_Creacion}]\n";
    echo 'Descripción: '.substr($r->Descripcion, 0, 120)."\n";
} else {
    echo "Sin excepciones registradas.\n";
}

// Ver si hubo excepciones DESPUÉS de las 15:30 de hoy
$postFix = DB::table('tbl_log_general')
    ->where('Operacion', 'ExceptionExecuted')
    ->where('Fecha_Creacion', '>', date('Y-m-d').' 15:30:00')
    ->count();

echo "\nExcepciones después de las 15:30 de hoy: $postFix\n";
echo $postFix === 0 ? "✅ Fix funcionando — sin nuevas excepciones desde que se aplicaron los permisos.\n" : "⚠️ Siguen habiendo excepciones post-fix.\n";
