<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$cnId = 9;
$apiUrl = 'http://192.168.1.1:5000/api';

// Leer usuario CN
$row = DB::table('tbl_cat_usuarios')->where('Id', $cnId)->first();
echo "Usuario CN Id={$cnId}: {$row->Usuario}\n";
echo "Sesion_Iniciada ANTES: {$row->Sesion_Iniciada}\n\n";

// Obtener password de Laravel
$laravelUser = DB::table('users')->where('cn_usuario_id', $cnId)->first();
if (!$laravelUser) {
    echo "No hay usuario Laravel con cn_usuario_id={$cnId}\n";
    exit(1);
}
$plainPassword = decrypt($laravelUser->cn_password);
echo "Usuario Laravel: {$laravelUser->email}\n";
echo "Password CN (decrypt): {$plainPassword}\n\n";

// Llamar a C# Authentication
echo "Llamando POST /Login/Authentication...\n";
$response = Http::withoutVerifying()->timeout(15)->post("{$apiUrl}/Login/Authentication", [
    'usuario'       => $row->Usuario,
    'contrasena'    => $plainPassword,
    'nombre_Notaria'=> 'NOTARIA',
    'equipo'        => 'Laravel-Test',
]);

echo "HTTP Status: {$response->status()}\n";
echo "Response body:\n";
echo json_encode($response->json(), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE) . "\n\n";

// Leer Sesion_Iniciada DESPUÉS
$rowDespues = DB::table('tbl_cat_usuarios')->where('Id', $cnId)->first();
echo "Sesion_Iniciada DESPUES: {$rowDespues->Sesion_Iniciada}\n";

// Leer tbl_log_sesiones_activas
$sesiones = DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $cnId)->get();
echo "Registros en tbl_log_sesiones_activas para Usuario_Id={$cnId}: " . count($sesiones) . "\n";
foreach ($sesiones as $s) {
    echo "  => " . json_encode((array)$s) . "\n";
}
