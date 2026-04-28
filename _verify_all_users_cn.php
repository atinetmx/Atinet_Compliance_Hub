<?php
// Verificar login en C# para TODOS los usuarios que tienen cn_usuario_id
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$internalUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

$users = DB::table('users')
    ->whereNotNull('cn_usuario_id')
    ->whereNotNull('cn_password')
    ->get(['id', 'email', 'cn_usuario_id', 'cn_password']);

echo "=== VERIFICACIÓN DE LOGIN CN PARA TODOS LOS USUARIOS ===\n\n";
echo sprintf("%-5s %-30s %-5s %-15s %-7s %-7s %s\n", 'UsrId', 'Email', 'CnId', 'Usuario CN', 'Hash', 'Pass?', 'Login C#');
echo str_repeat('-', 90)."\n";

$ok = 0;
$fail = 0;
$skip = 0;

foreach ($users as $user) {
    $cnRow = DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->first();
    if (!$cnRow) {
        echo sprintf("%-5s %-30s %-5s %-15s %-7s %-7s %s\n",
            $user->id, $user->email, $user->cn_usuario_id, 'NO EXISTE', '-', '-', '⚠ Sin registro CN');
        $skip++;
        continue;
    }

    $hashPrefix = substr($cnRow->Contrasena ?? '', 0, 7);

    try {
        $plain = decrypt($user->cn_password);
    } catch (Exception $e) {
        echo sprintf("%-5s %-30s %-5s %-15s %-7s %-7s %s\n",
            $user->id, $user->email, $user->cn_usuario_id, $cnRow->Usuario, $hashPrefix, 'ERR', '✗ Decrypt falló');
        $fail++;
        continue;
    }

    // Resetear sesión antes de intentar login
    DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $user->cn_usuario_id)->delete();

    $response = Http::withoutVerifying()->timeout(10)->post($internalUrl.'/Login/Authentication', [
        'usuario'        => $cnRow->Usuario,
        'contrasena'     => $plain,
        'nombre_Notaria' => 'NOTARIA',
        'equipo'         => 'Laravel-Check',
    ]);

    $body = $response->json();
    $loginOk = isset($body['dataResponse']['accessToken']);
    $msg = $loginOk ? '✓ JWT OK' : '✗ '.(($body['message'] ?? $response->status()));

    echo sprintf("%-5s %-30s %-5s %-15s %-7s %-7s %s\n",
        $user->id, $user->email, $user->cn_usuario_id, $cnRow->Usuario, $hashPrefix, 'OK', $msg);

    // Resetear sesión después del check para no dejar sesiones abiertas
    DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $user->cn_usuario_id)->delete();

    $loginOk ? $ok++ : $fail++;
}

echo str_repeat('-', 90)."\n";
echo "\nResumen: {$ok} OK, {$fail} FALLIDOS, {$skip} SIN REGISTRO CN\n";

if ($fail > 0) {
    echo "\n⚠ Usuarios fallidos requieren fix de password o de hash en tbl_cat_usuarios.\n";
}
