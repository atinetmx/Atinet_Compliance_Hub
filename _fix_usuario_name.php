<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

// Renombrar tbl_cat_usuarios Id=9 de ADMIN a ADMIN1
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Usuario' => 'ADMIN1']);
echo "Id=9 renombrado a ADMIN1\n";

// Resetear sesiones
DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->whereIn('Usuario_Id', [1, 9])->delete();
echo "Sesiones reseteadas\n";

// Verificar
$cnUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

echo "\n=== Test login ADMIN/1010 (Id=1, users.id=11) ===\n";
$r1 = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(15)
    ->post("{$cnUrl}/Login/Authentication", ['usuario'=>'ADMIN','contrasena'=>'1010','nombre_Notaria'=>'NOTARIA','equipo'=>'Laravel-Server']);
$b1 = $r1->json();
$t1 = $b1['dataResponse']['accessToken'] ?? null;
echo ($t1 ? "JWT OK: ".substr($t1,0,30)."..." : "FALLO: ".json_encode($b1))."\n";

// Reset sesión antes del segundo test
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 1)->delete();

echo "\n=== Test login ADMIN1/1010 (Id=9, users.id=1) ===\n";
$r2 = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(15)
    ->post("{$cnUrl}/Login/Authentication", ['usuario'=>'ADMIN1','contrasena'=>'1010','nombre_Notaria'=>'NOTARIA','equipo'=>'Laravel-Server']);
$b2 = $r2->json();
$t2 = $b2['dataResponse']['accessToken'] ?? null;
echo ($t2 ? "JWT OK: ".substr($t2,0,30)."..." : "FALLO: ".json_encode($b2))."\n";

echo "\n=== Estado final ===\n";
$rows = DB::table('tbl_cat_usuarios')->whereIn('Id',[1,9])->get(['Id','Usuario','Correo','Sesion_Iniciada']);
foreach ($rows as $r) {
    echo "Id={$r->Id} | Usuario={$r->Usuario} | Correo={$r->Correo} | Sesion_Iniciada={$r->Sesion_Iniciada}\n";
}
