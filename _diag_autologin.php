<?php
// Diagnóstico completo del flujo autoLogin
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use App\Services\ControlNotarialApiService;

echo "=== DIAGNÓSTICO AUTOLOGIN ===\n\n";

// 1. Verificar usuario admin@atinet.mx
$user = DB::table('users')->where('email', 'admin@atinet.mx')->first();
if (!$user) {
    echo "ERROR: usuario admin@atinet.mx no encontrado en users\n";
    exit(1);
}
echo "Usuario Laravel: {$user->email}, cn_usuario_id={$user->cn_usuario_id}\n";
echo "cn_password: ".(!empty($user->cn_password) ? 'SET' : 'VACÍO')."\n\n";

// 2. Verificar tbl_cat_usuarios
$cnUser = DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->first();
if (!$cnUser) {
    echo "ERROR: cn_usuario_id={$user->cn_usuario_id} no encontrado en tbl_cat_usuarios\n";
    exit(1);
}
echo "tbl_cat_usuarios[{$cnUser->Id}]:\n";
echo "  Usuario:        {$cnUser->Usuario}\n";
echo "  Sesion_Iniciada:{$cnUser->Sesion_Iniciada}\n";
echo "  Hash prefix:    ".substr($cnUser->Contrasena ?? '', 0, 7)."\n\n";

// 3. Verificar decrypt
try {
    $plain = decrypt($user->cn_password);
    echo "Decrypt OK, longitud=".strlen($plain)."\n";
} catch (Exception $e) {
    echo "ERROR decrypt: ".$e->getMessage()."\n";
    exit(1);
}

// 4. Intentar login en C#
echo "\nIntentando loginUser en C#...\n";
$svc = app(ControlNotarialApiService::class);

// Reset sesión primero
DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $user->cn_usuario_id)->delete();
echo "Sesion_Iniciada seteada a 0.\n";

$jwt = $svc->loginUser($cnUser->Usuario, $plain);
if ($jwt) {
    echo "LOGIN EXITOSO. JWT: ".substr($jwt, 0, 30)."...\n\n";
} else {
    echo "LOGIN FALLÓ. JWT = null\n\n";
}

// 5. Verificar si C# cambió Sesion_Iniciada
$cnUserAfter = DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->first();
echo "Sesion_Iniciada DESPUÉS de login: {$cnUserAfter->Sesion_Iniciada}\n";

// 6. Ver log_sesiones_activas
$sesion = DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $user->cn_usuario_id)->first();
echo "tbl_log_sesiones_activas: ".($sesion ? "EXISTE (Id={$sesion->Id})" : "SIN REGISTRO")."\n\n";

// 7. Si hay JWT, hacer una llamada de prueba a C#
if ($jwt) {
    echo "Probando GET /Notaria/GetNotaria con el JWT...\n";
    $internalUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');
    $response = Http::withToken($jwt)->withoutVerifying()->timeout(10)->get($internalUrl.'/Notaria/GetNotaria');
    echo "Status: ".$response->status()."\n";
    if ($response->status() === 401) {
        echo "=> C# dice 401 con el JWT recién obtenido.\n";
        echo "   Respuesta: ".$response->body()."\n";
    } else {
        echo "=> OK, C# acepta el JWT.\n";
    }
}

echo "\n=== FIN DIAGNÓSTICO ===\n";
