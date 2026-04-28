<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$cnUrl = rtrim(config('services.control_notarial.internal_url','http://192.168.1.1:5000/api'), '/');

function testLogin(string $cnUrl, int $cnId, string $usuario, string $password): void {
    // Simula exactamente lo que hace autoLogin()
    DB::table('tbl_cat_usuarios')->where('Id', $cnId)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $cnId)->delete();

    $r = \Illuminate\Support\Facades\Http::withoutVerifying()->timeout(15)
        ->post("{$cnUrl}/Login/Authentication", [
            'usuario'        => $usuario,
            'contrasena'     => $password,
            'nombre_Notaria' => 'NOTARIA',
            'equipo'         => 'Laravel-Server',
        ]);
    $body = $r->json();
    $token = $body['dataResponse']['accessToken'] ?? null;
    $sesion = DB::table('tbl_cat_usuarios')->where('Id', $cnId)->value('Sesion_Iniciada');
    echo "{$usuario}/{$password} (CN Id={$cnId}): " . ($token ? "JWT OK | Sesion_Iniciada={$sesion}" : "FALLO: ".json_encode($body)) . "\n";
}

echo "=== Simulacion autoLogin() ===\n";
// users.id=11 (admin@atinet.com.mx) → cn_usuario_id=1 → ADMIN
testLogin($cnUrl, 1, 'ADMIN', '1010');

// users.id=1 (admin@atinet.mx) → cn_usuario_id=9 → ADMIN1
testLogin($cnUrl, 9, 'ADMIN1', '1010');
