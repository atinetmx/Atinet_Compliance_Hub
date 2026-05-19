<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$cnBase = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');
$gwPass = config('services.control_notarial.gw_password', '');

// Notaria 11 (ID=1 en notarias table) → atinet_edomex_notaria_11
$notaria = DB::table('notarias')->where('tenant_db_name', 'atinet_edomex_notaria_11')->first();
if (! $notaria) {
    echo "Notaria 11 no encontrada\n";
    exit(1);
}
$notariaId = (string) $notaria->id;
echo "Notaria: id={$notariaId} db={$notaria->tenant_db_name}\n";

// Reset LARAVEL_GW en notaria_11
DB::select("UPDATE `atinet_edomex_notaria_11`.`tbl_cat_usuarios` SET Sesion_Iniciada=0 WHERE Usuario='LARAVEL_GW'");
DB::select("DELETE FROM `atinet_edomex_notaria_11`.`tbl_log_sesiones_activas` WHERE Usuario_Id=1");
echo "Reset sesión OK\n";

// Login
$loginResp = Http::withHeaders(['Accept' => 'application/json', 'Content-Type' => 'application/json'])
    ->withoutVerifying()->timeout(15)
    ->post($cnBase.'/Login/Authentication', [
        'notaria' => $notariaId,
        'usuario' => 'LARAVEL_GW',
        'contrasena' => $gwPass,
        'equipo' => 'Laravel-Test',
    ]);

echo "Login HTTP: {$loginResp->status()}\n";
$data = $loginResp->json();
if (! isset($data['dataResponse']['accessToken'])) {
    echo "FALLO: ".json_encode($data)."\n";
    exit(1);
}

$jwt = $data['dataResponse']['accessToken'];
$parts = explode('.', $jwt);
$pl = json_decode(base64_decode(str_pad(strtr($parts[1], '-_', '+/'), 4 - (strlen($parts[1]) % 4 ?: 4) + strlen($parts[1]), '=')), true);
echo "client_notaria: ".($pl['client_notaria'] ?? 'N/A')."\n";

// Test endpoints
foreach (['/Catalogos/GetRoles', '/User/GetUsuarios'] as $ep) {
    $r = Http::withHeaders(['Authorization' => "Bearer {$jwt}", 'Accept' => 'application/json'])
        ->withoutVerifying()->timeout(15)->get($cnBase.$ep);
    $wwwAuth = $r->header('WWW-Authenticate');
    echo "{$ep}: HTTP {$r->status()}";
    if ($wwwAuth) {
        echo " | WWW-Auth: {$wwwAuth}";
    } else {
        echo " | body: ".substr($r->body(), 0, 150);
    }
    echo "\n";
}
