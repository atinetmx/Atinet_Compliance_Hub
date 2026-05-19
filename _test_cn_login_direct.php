<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$cnBaseUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

// Usuario COMPUMUNDO = cn_usuario_id=21
$user = DB::table('users')->where('cn_usuario_id', 21)->first();
$notaria = DB::table('notarias')->where('id', $user->notaria_id)->first();
$tenantDb = $notaria->tenant_db_name;
$cnUsuario = DB::table('tbl_cat_usuarios')->where('Id', 21)->value('Usuario');
$plainPass = decrypt($user->cn_password);
$notariaId = (string) $notaria->id;
$notariaNumero = (string) $notaria->numero_notaria;

echo "=== Reset sesion tenant ===\n";
DB::select("UPDATE `{$tenantDb}`.`tbl_cat_usuarios` SET Sesion_Iniciada=0 WHERE Usuario=?", [$cnUsuario]);
DB::select("DELETE FROM `{$tenantDb}`.`tbl_log_sesiones_activas` WHERE Usuario_Id=21");
echo "  OK\n";

echo "\n=== Login directo C#: notaria={$notariaId} usuario={$cnUsuario} ===\n";
$loginResp = Http::withHeaders(['Accept' => 'application/json', 'Content-Type' => 'application/json'])
    ->withoutVerifying()->timeout(15)
    ->post($cnBaseUrl.'/Login/Authentication', [
        'notaria' => $notariaId,
        'usuario' => $cnUsuario,
        'contrasena' => $plainPass,
        'equipo' => 'Laravel-Server',
    ]);

echo "  HTTP: {$loginResp->status()}\n";
// Mostrar respuesta completa (excepto token largo)
$loginData = $loginResp->json();
$loginDataDebug = $loginData;
if (isset($loginDataDebug['dataResponse']['accessToken'])) {
    $loginDataDebug['dataResponse']['accessToken'] = substr($loginData['dataResponse']['accessToken'], 0, 50).'...';
}
echo '  Full response: '.json_encode($loginDataDebug)."\n";

if (! isset($loginData['dataResponse']['accessToken'])) {
    echo '  FALLO: '.json_encode($loginData)."\n";
    exit(1);
}

$jwt = $loginData['dataResponse']['accessToken'];
$parts = explode('.', $jwt);
$pl = json_decode(base64_decode(str_pad(strtr($parts[1], '-_', '+/'), 4 - (strlen($parts[1]) % 4 ?: 4) + strlen($parts[1]), '=')), true);
$newJti = $pl['jti'] ?? 'N/A';
echo "  JTI: {$newJti}\n";
echo '  client_notaria: '.($pl['client_notaria'] ?? 'N/A')."\n";
echo '  client_username: '.($pl['client_username'] ?? 'N/A')."\n";
echo '  exp: '.($pl['exp'] ?? 'N/A').' ('.date('Y-m-d H:i:s', $pl['exp'] ?? 0).")\n";
echo '  All claims: '.json_encode($pl)."\n";

// Donde quedo el JTI y que datos tiene
$inMaster = DB::table('tbl_log_sesiones_activas')->where('Token_Jti', $newJti)->first();
$inTenant = DB::select("SELECT * FROM `{$tenantDb}`.`tbl_log_sesiones_activas` WHERE Token_Jti=?", [$newJti]);
echo '  JTI MASTER: '.($inMaster ? 'SI' : 'NO')."\n";
if ($inMaster) {
    echo '  Master row: '.json_encode((array)$inMaster)."\n";
}
echo '  JTI TENANT: '.(!empty($inTenant) ? 'SI' : 'NO')."\n";
if (!empty($inTenant)) {
    echo '  Tenant row: '.json_encode((array)$inTenant[0])."\n";
}

// Probar el JWT
echo "\n=== Test endpoints con nuevo JWT (sin extra headers) ===\n";
foreach (['/Catalogos/GetRoles', '/User/GetUsuarios', '/User/GetUsuarioById?usuarioId=21'] as $ep) {
    $r = Http::withHeaders(['Authorization' => "Bearer {$jwt}", 'Accept' => 'application/json'])
        ->withoutVerifying()->timeout(15)->get($cnBaseUrl.$ep);
    $statusOk = $r->status() === 200;
    echo "  {$ep}: HTTP {$r->status()}\n";
    if (! $statusOk) {
        echo '    body: '.substr($r->body(), 0, 300)."\n";
        $wwwAuth = $r->header('WWW-Authenticate');
        if ($wwwAuth) {
            echo "    WWW-Authenticate: {$wwwAuth}\n";
        }
    }
}

// Probar login con notaria=101 (numero_notaria real)
echo "\n=== Reset y login con notaria=101 ===\n";
DB::select("UPDATE `{$tenantDb}`.`tbl_cat_usuarios` SET Sesion_Iniciada=0 WHERE Usuario=?", [$cnUsuario]);
DB::select("DELETE FROM `{$tenantDb}`.`tbl_log_sesiones_activas` WHERE Usuario_Id=21");
$loginResp2 = Http::withHeaders(['Accept' => 'application/json', 'Content-Type' => 'application/json'])
    ->withoutVerifying()->timeout(15)
    ->post($cnBaseUrl.'/Login/Authentication', [
        'notaria' => '101',
        'usuario' => $cnUsuario,
        'contrasena' => $plainPass,
        'equipo' => 'Laravel-Server',
    ]);
echo "  HTTP: {$loginResp2->status()}\n";
if ($loginResp2->status() === 200) {
    $jwt2 = $loginResp2->json()['dataResponse']['accessToken'] ?? null;
    if ($jwt2) {
        $parts2 = explode('.', $jwt2);
        $pl2 = json_decode(base64_decode(str_pad(strtr($parts2[1], '-_', '+/'), 4 - (strlen($parts2[1]) % 4 ?: 4) + strlen($parts2[1]), '=')), true);
        echo '  client_notaria: '.($pl2['client_notaria'] ?? 'N/A')."\n";
        $r2 = Http::withHeaders(['Authorization' => "Bearer {$jwt2}", 'Accept' => 'application/json'])
            ->withoutVerifying()->timeout(15)->get($cnBaseUrl.'/Catalogos/GetRoles');
        echo "  GetRoles: HTTP {$r2->status()} body=".substr($r2->body(), 0, 200)."\n";
    }
} else {
    echo '  body: '.substr($loginResp2->body(), 0, 300)."\n";
}
