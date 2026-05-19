<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

$cnBase = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

// Test con PANFILOP (notaria_id=1 → id=1 en notarias)
$user = DB::table('users')->where('cn_usuario_id', 10)->first();
$tenantDb = 'atinet_edomex_notaria_11';
$notariaId = (string) $user->notaria_id;
$plainPwd = decrypt($user->cn_password);
$cnRow = DB::select("SELECT * FROM `{$tenantDb}`.`tbl_cat_usuarios` WHERE Id=10")[0];

echo "=== PANFILOP test ===\n";
echo "notaria_id={$notariaId} usuario={$cnRow->Usuario}\n\n";

// Reset
DB::select("UPDATE `{$tenantDb}`.`tbl_cat_usuarios` SET Sesion_Iniciada=0 WHERE Id=10");
DB::select("DELETE FROM `{$tenantDb}`.`tbl_log_sesiones_activas` WHERE Usuario_Id=10");

// Login
$resp = Http::withoutVerifying()->timeout(15)->post($cnBase.'/Login/Authentication', [
    'notaria' => $notariaId,
    'usuario' => $cnRow->Usuario,
    'contrasena' => $plainPwd,
    'equipo' => 'Test',
]);
echo "Login: HTTP {$resp->status()}\n";
$d = $resp->json();
if (! isset($d['dataResponse']['accessToken'])) {
    echo "FALLO: ".json_encode($d)."\n";
    exit(1);
}
$jwt = $d['dataResponse']['accessToken'];
$pparts = explode('.', $jwt);
$pl = json_decode(base64_decode(str_pad(strtr($pparts[1], '-_', '+/'), 4 - (strlen($pparts[1]) % 4 ?: 4) + strlen($pparts[1]), '=')), true);
echo "client_notaria: ".($pl['client_notaria'] ?? 'N/A')."\n";

// Probar endpoints
foreach (['/Catalogos/GetRoles', '/User/GetUsuarios'] as $ep) {
    $r = Http::withHeaders(['Authorization' => "Bearer {$jwt}", 'Accept' => 'application/json'])
        ->withoutVerifying()->timeout(15)->get($cnBase.$ep);
    $wwwAuth = $r->header('WWW-Authenticate') ?? '';
    echo "{$ep}: HTTP {$r->status()} {$wwwAuth} ".substr($r->body(), 0, 100)."\n";
}
