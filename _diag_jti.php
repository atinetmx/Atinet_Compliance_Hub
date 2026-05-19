<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$jti = '56469c2a-b6e2-46d2-92ec-96e4585d44d4';

echo "=== JTI en MASTER tbl_log_sesiones_activas ===\n";
$master = DB::table('tbl_log_sesiones_activas')->where('Token_Jti', $jti)->first();
echo json_encode($master)."\n";

echo "\n=== JTI en TENANT tbl_log_sesiones_activas ===\n";
$tenant = DB::select('SELECT * FROM `atinet_edomex_notaria_101`.`tbl_log_sesiones_activas` WHERE `Token_Jti`=? LIMIT 1', [$jti]);
echo json_encode($tenant[0] ?? null)."\n";

echo "\n=== MASTER tbl_cat_usuarios COMPUMUNDO (Id=21) ===\n";
$masterU = DB::table('tbl_cat_usuarios')->where('Id', 21)->first(['Id', 'Usuario', 'Rol_Id', 'Sesion_Iniciada', 'Activo']);
echo json_encode($masterU)."\n";

echo "\n=== TENANT tbl_cat_usuarios COMPUMUNDO ===\n";
$tenantU = DB::select("SELECT Id,Usuario,Rol_Id,Sesion_Iniciada,Activo,Numero_Notaria FROM `atinet_edomex_notaria_101`.`tbl_cat_usuarios` WHERE Usuario='COMPUMUNDO' LIMIT 1");
echo json_encode($tenantU[0] ?? null)."\n";

// Número de sesiones activas en ambas BDs
echo "\n=== Todas las sesiones activas MASTER ===\n";
DB::table('tbl_log_sesiones_activas')->get()->each(fn ($r) => print (json_encode($r)."\n"));

echo "\n=== Todas las sesiones activas TENANT ===\n";
$ts = DB::select('SELECT Id, Usuario_Id, Token_Jti, Es_Activa FROM `atinet_edomex_notaria_101`.`tbl_log_sesiones_activas`');
foreach ($ts as $r) {
    echo json_encode($r)."\n";
}
