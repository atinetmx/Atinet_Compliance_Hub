<?php
// _verify_final.php â€” verificar login de usuarios clave post-sync
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$cnBase = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

function testLogin(string $base, string $usuario, string $password): string
{
    DB::table('tbl_cat_usuarios')->where('Usuario', $usuario)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')
        ->whereIn('Usuario_Id', DB::table('tbl_cat_usuarios')->where('Usuario', $usuario)->pluck('Id'))
        ->delete();

    $ch = curl_init("{$base}/Login/Authentication");
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_POSTFIELDS => json_encode([
            'usuario' => $usuario, 'contrasena' => $password,
            'nombre_Notaria' => 'NOTARIA', 'equipo' => 'Verify',
        ]),
        CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 10,
    ]);
    $body = curl_exec($ch);
    curl_close($ch);
    $data = json_decode($body, true);
    if (isset($data['dataResponse']['accessToken'])) {
        return 'JWT OK';
    }

    return 'FALLO: ' . ($data['message'] ?? $body);
}

$users = DB::table('users')
    ->whereNotNull('cn_usuario_id')
    ->whereNotNull('cn_password')
    ->get(['id', 'email', 'cn_usuario_id', 'cn_password']);

echo "=== VERIFICACION FINAL LOGIN CN ===\n\n";
printf("%-4s %-35s %-8s %s\n", 'id', 'email', 'cn_id', 'resultado');
echo str_repeat('-', 72) . "\n";

foreach ($users as $user) {
    try {
        $pass = decrypt($user->cn_password);
    } catch (\Throwable $e) {
        printf("%-4s %-35s %-8s %s\n", $user->id, $user->email, $user->cn_usuario_id, 'ERR decrypt');
        continue;
    }

    $cnUsuario = DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->value('Usuario') ?? '?';
    $result    = testLogin($cnBase, $cnUsuario, $pass);
    printf("%-4s %-35s %-8s %s\n", $user->id, $user->email, $user->cn_usuario_id, $result);
}
