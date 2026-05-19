<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$cnUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

$users = DB::table('users as u')
    ->join('tbl_cat_usuarios as c', 'c.Id', '=', 'u.cn_usuario_id')
    ->join('notarias as n', 'n.id', '=', 'u.notaria_id')
    ->select('u.id', 'u.email', 'u.cn_password', 'u.notaria_id', 'c.Id as cn_id', 'c.Usuario')
    ->orderBy('u.id')
    ->get();

echo "=== VERIFICACION LOGIN C# API ===\n";
echo str_pad('uid', 5) . str_pad('cn_usuario', 18) . str_pad('notaria_id', 11) . str_pad('password', 14) . "resultado\n";
echo str_repeat('-', 85) . "\n";

$ok = 0; $fail = 0;

foreach ($users as $u) {
    // Descifrar contraseña
    try {
        $plain = decrypt($u->cn_password);
    } catch (\Exception $e) {
        echo str_pad($u->id, 5) . str_pad($u->Usuario, 18) . "ERROR decrypt\n";
        $fail++;
        continue;
    }

    // Resetear sesión antes del intento
    DB::table('tbl_cat_usuarios')->where('Id', $u->cn_id)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $u->cn_id)->delete();

    // POST a C# API
    $response = Http::withoutVerifying()->timeout(10)->post("$cnUrl/Login/Authentication", [
        'usuario'    => $u->Usuario,
        'contrasena' => $plain,
        'notaria'    => (string) $u->notaria_id,
        'equipo'     => 'Laravel-Verify',
    ]);

    $body     = $response->json();
    $jwtOk    = isset($body['dataResponse']['accessToken']);
    $httpCode = $response->status();
    $msgRaw   = $body['message'] ?? $body['title'] ?? '';
    $msg      = $jwtOk
        ? "HTTP $httpCode ✓"
        : "HTTP $httpCode ✗ " . (is_array($msgRaw) ? json_encode($msgRaw) : $msgRaw);

    echo str_pad($u->id, 5)
       . str_pad($u->Usuario, 18)
       . str_pad($u->notaria_id, 11)
       . str_pad($plain, 14)
       . $msg . "\n";

    $jwtOk ? $ok++ : $fail++;
}

echo "\nC# OK: $ok | Fallos: $fail\n";
