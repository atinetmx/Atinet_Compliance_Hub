<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$count = DB::table('tbl_cat_usuarios')->where('Sesion_Iniciada', 1)->count();
DB::table('tbl_cat_usuarios')->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->truncate();

echo "Reseteadas {$count} sesiones activas. tbl_log_sesiones_activas truncada.\n";
