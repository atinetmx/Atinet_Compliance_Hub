<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$hashId1 = DB::table('tbl_cat_usuarios')->where('Id', 1)->value('Contrasena');
echo "Hash Id=1: {$hashId1}\n";
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Contrasena' => $hashId1, 'Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 9)->delete();
echo "Hash copiado a Id=9 y sesión limpiada\n";

// Retest
$cnUrl = rtrim(config('services.control_notarial.internal_url','http://192.168.1.1:5000/api'), '/');

// Reset Id=1 session first
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 1)->delete();

$tests = [['ADMIN','1010',1],['ADMIN1','1010',9]];
foreach ($tests as [$u, $p, $id]) {
    DB::table('tbl_cat_usuarios')->where('Id', $id)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $id)->delete();
    $r = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(15)
        ->post("{$cnUrl}/Login/Authentication", ['usuario'=>$u,'contrasena'=>$p,'nombre_Notaria'=>'NOTARIA','equipo'=>'Laravel-Server']);
    $body = $r->json();
    $token = $body['dataResponse']['accessToken'] ?? null;
    $sesion = DB::table('tbl_cat_usuarios')->where('Id', $id)->value('Sesion_Iniciada');
    echo "{$u}/{$p}: " . ($token ? "JWT OK | Sesion_Iniciada={$sesion}" : "FALLO: ".json_encode($body)) . "\n";
    // Reset after test
    DB::table('tbl_cat_usuarios')->where('Id', $id)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $id)->delete();
}
