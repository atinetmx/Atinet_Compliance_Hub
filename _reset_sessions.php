<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Resetear Sesion_Iniciada de ADMIN (Id=1) y LARAVEL_GW (Id=18)
DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 18])->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->whereIn('Usuario_Id', [1, 18])->delete();

$rows = DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 18])->get(['Id', 'Usuario', 'Sesion_Iniciada']);
foreach ($rows as $r) {
    echo "Id={$r->Id} {$r->Usuario} Sesion_Iniciada={$r->Sesion_Iniciada}" . PHP_EOL;
}
echo "Sesiones reseteadas OK" . PHP_EOL;
