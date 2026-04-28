<?php
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Limpiar sesiones bloqueadas
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 1)->delete();
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 9)->delete();

// Renombrar Id=9 de ADMIN a ADMIN1
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Usuario' => 'ADMIN1']);

$r1 = DB::table('tbl_cat_usuarios')->where('Id', 1)->first();
$r9 = DB::table('tbl_cat_usuarios')->where('Id', 9)->first();

echo "=== Estado tbl_cat_usuarios ===" . PHP_EOL;
echo "Id=1 Usuario={$r1->Usuario} Sesion={$r1->Sesion_Iniciada}" . PHP_EOL;
echo "Id=9 Usuario={$r9->Usuario} Sesion={$r9->Sesion_Iniciada}" . PHP_EOL;

// Test login de ambos
echo PHP_EOL . "=== Test login CN ===" . PHP_EOL;

$internalUrl = config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api');

foreach ([['ADMIN','1010'], ['ADMIN1','1010']] as [$user, $pass]) {
    $ch = curl_init($internalUrl . '/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'usuario' => $user,
            'contrasena' => $pass,
            'nombre_Notaria' => 'NOTARIA',
            'equipo' => 'Laravel-Server',
        ]),
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_TIMEOUT => 10,
    ]);
    $body = curl_exec($ch);
    $data = json_decode($body, true);
    curl_close($ch);

    if (!empty($data['dataResponse']['accessToken'])) {
        $jwt = substr($data['dataResponse']['accessToken'], 0, 20) . '...';
        echo "{$user}/{$pass}: JWT OK ({$jwt})" . PHP_EOL;
    } else {
        echo "{$user}/{$pass}: FALLO: " . ($data['message'] ?? $body) . PHP_EOL;
    }
}

echo PHP_EOL . "=== Sesion_Iniciada final ===" . PHP_EOL;
$rows = DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->get(['Id','Usuario','Sesion_Iniciada']);
foreach ($rows as $row) {
    echo "Id={$row->Id} Usuario={$row->Usuario} Sesion={$row->Sesion_Iniciada}" . PHP_EOL;
}
