<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$notariaId = DB::table('notarias')->where('tenant_db_name', 'atinet_compliance_hub')->value('id');

// Actualizar ADMIN (Id=1) para que también apunte a notaria master
DB::table('tbl_cat_usuarios')->where('Id', 1)->update([
    'Sesion_Iniciada' => 0,
    'Numero_Notaria' => (string) $notariaId,
]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 1)->delete();

$admin = DB::table('tbl_cat_usuarios')->where('Id', 1)->first();
echo "ADMIN: Usuario={$admin->Usuario} Numero_Notaria={$admin->Numero_Notaria} hash=".substr($admin->Contrasena, 0, 20)."...\n";
echo "PHP verify '1010': ".(password_verify('1010', $admin->Contrasena) ? '✅ MATCH' : '❌ NO MATCH')."\n\n";

$tests = [
    ['Id' => 1,  'usuario' => 'ADMIN',       'pass' => '1010'],
    ['Id' => 9,  'usuario' => 'SUPERUSUARIO', 'pass' => 'pasword123'],
];

foreach ($tests as $t) {
    $u = DB::table('tbl_cat_usuarios')->where('Id', $t['Id'])->first();
    $hashOk = password_verify($t['pass'], $u->Contrasena);

    $payload = json_encode([
        'notaria' => (string) $notariaId,
        'usuario' => $t['usuario'],
        'contrasena' => $t['pass'],
        'equipo' => 'Laravel-Server',
        'model' => 'pc',
    ]);
    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $body = json_decode($resp, true);
    $token = $body['dataResponse']['accessToken'] ?? null;

    echo "=== {$t['usuario']} (Id={$t['Id']}) pass=[{$t['pass']}] ===\n";
    echo '  PHP verify: '.($hashOk ? '✅' : '❌')."\n";
    echo "  C# HTTP {$code}: ".($body['message'] ?? '?')."\n";
    echo '  Token: '.($token ? '✅ '.substr($token, 0, 60).'...' : '❌ ninguno')."\n\n";
    sleep(1);
}
