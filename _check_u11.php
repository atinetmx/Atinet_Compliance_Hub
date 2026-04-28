<?php
require __DIR__ . "/vendor/autoload.php";
$app = require_once __DIR__ . "/bootstrap/app.php";
$app->make("Illuminate\Contracts\Console\Kernel")->bootstrap();
use Illuminate\Support\Facades\DB;

// Generar BCrypt $2a$ hash de cada cn_password real
// ADMIN (CN id=1) -> cn_password = 'admin'
$hashAdmin = password_hash("admin", PASSWORD_BCRYPT, ["cost"=>12]);
DB::table("tbl_cat_usuarios")->where("Id", 1)->update([
    "Contrasena"     => $hashAdmin,
    "Numero_Notaria" => "2",
]);
echo "ADMIN (id=1) Contrasena -> hash('admin'), Numero_Notaria='2'\n";
echo "  hash: $hashAdmin\n";

// ADMIN1 (CN id=9) -> cn_password = '1010'
$hash1010 = password_hash("1010", PASSWORD_BCRYPT, ["cost"=>12]);
DB::table("tbl_cat_usuarios")->where("Id", 9)->update([
    "Contrasena"     => $hash1010,
    "Numero_Notaria" => "2",
]);
echo "ADMIN1 (id=9) Contrasena -> hash('1010'), Numero_Notaria='2'\n";
echo "  hash: $hash1010\n";

// Resetear sesiones activas
DB::table("tbl_cat_usuarios")->whereIn("Id", [1,9])->update(["Sesion_Iniciada"=>0]);
DB::table("tbl_log_sesiones_activas")->truncate();
echo "\nSesiones reseteadas\n";

// Test: ADMIN/admin con equipo
echo "\n=== Test ADMIN/admin con equipo ===\n";
$ch = curl_init("http://192.168.1.1:5000/api/Login/Authentication");
$payload = json_encode(["usuario"=>"ADMIN","contrasena"=>"admin","nombre_Notaria"=>"NOTARIA","equipo"=>"Laravel-Server"]);
curl_setopt_array($ch,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$payload,CURLOPT_HTTPHEADER=>["Content-Type: application/json","Accept: application/json"],CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>10,CURLOPT_SSL_VERIFYPEER=>false]);
$body=curl_exec($ch); $status=curl_getinfo($ch,CURLINFO_HTTP_CODE); curl_close($ch);
echo "HTTP: $status\n";
$data = json_decode($body,true);
if (isset($data["dataResponse"]["token"])) {
    echo "TOKEN OK: " . substr($data["dataResponse"]["token"],0,50) . "...\n";
} else {
    echo "Response: $body\n";
}

// Resetear + Test: ADMIN1/1010 con equipo
DB::table("tbl_cat_usuarios")->where("Id",9)->update(["Sesion_Iniciada"=>0]);
DB::table("tbl_log_sesiones_activas")->truncate();
echo "\n=== Test ADMIN1/1010 con equipo ===\n";
$ch2 = curl_init("http://192.168.1.1:5000/api/Login/Authentication");
$payload2 = json_encode(["usuario"=>"ADMIN1","contrasena"=>"1010","nombre_Notaria"=>"NOTARIA","equipo"=>"Laravel-Server"]);
curl_setopt_array($ch2,[CURLOPT_POST=>true,CURLOPT_POSTFIELDS=>$payload2,CURLOPT_HTTPHEADER=>["Content-Type: application/json","Accept: application/json"],CURLOPT_RETURNTRANSFER=>true,CURLOPT_TIMEOUT=>10,CURLOPT_SSL_VERIFYPEER=>false]);
$body2=curl_exec($ch2); $status2=curl_getinfo($ch2,CURLINFO_HTTP_CODE); curl_close($ch2);
echo "HTTP: $status2\n";
$data2 = json_decode($body2,true);
if (isset($data2["dataResponse"]["token"])) {
    echo "TOKEN OK: " . substr($data2["dataResponse"]["token"],0,50) . "...\n";
} else {
    echo "Response: $body2\n";
}
