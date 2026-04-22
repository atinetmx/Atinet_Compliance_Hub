<?php
/**
 * Fix de contraseñas CN via API de C#
 * Usa el token de ADMIN para actualizar passwords via UpdateUsuario de C#
 * luego guarda encrypt(password) en users.cn_password
 */
define('LARAVEL_START', microtime(true));
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;

$internalUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');

// ─── 1. Obtener JWT via ADMIN/1010 ───────────────────────────────────────────
echo "=== Obteniendo JWT de ADMIN ===\n";
DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 1)->delete();

$loginResp = Http::withoutVerifying()->timeout(15)->post("{$internalUrl}/Login/Authentication", [
    'usuario'        => 'ADMIN',
    'contrasena'     => '1010',
    'nombre_Notaria' => 'NOTARIA',
    'equipo'         => 'Laravel-Server',
]);
$jwt = $loginResp->json()['dataResponse']['accessToken'] ?? null;
if (!$jwt) {
    echo "FALLO obteniendo JWT: " . json_encode($loginResp->json()) . "\n";
    exit(1);
}
echo "JWT OK: " . substr($jwt, 0, 30) . "...\n\n";

// ─── 2. Función para actualizar password en C# via API ───────────────────────
function updateCnPassword(string $internalUrl, string $jwt, int $cnId, string $newPassword): bool {
    // Primero obtener datos actuales del usuario
    $userResp = Http::withoutVerifying()->timeout(15)
        ->withToken($jwt)
        ->get("{$internalUrl}/User/GetUsuarioById?usuarioId={$cnId}");
    $user = $userResp->json();

    if (empty($user['id'])) {
        echo "  No se encontró usuario CN Id={$cnId}\n";
        return false;
    }

    // Actualizar con nueva contraseña — C# hasheará internamente
    $updateResp = Http::withoutVerifying()->timeout(15)
        ->withToken($jwt)
        ->put("{$internalUrl}/User/UpdateUsuario?usuarioId={$cnId}", [
            'nombre'          => $user['nombre'] ?? '',
            'apellido_Paterno'=> $user['apellido_Paterno'] ?? '',
            'apellido_Materno'=> $user['apellido_Materno'] ?? '',
            'correo'          => $user['correo'] ?? '',
            'usuario'         => $user['usuario'] ?? '',
            'contrasena'      => $newPassword,
            'curp'            => $user['curp'] ?? '',
            'rfc'             => $user['rfc'] ?? '',
            'rol_Id'          => $user['rol_Id'] ?? 1,
            'iniciales'       => $user['iniciales'] ?? '',
            'numero_Notaria'  => $user['numero_Notaria'] ?? '',
            'adscripcion'     => $user['adscripcion'] ?? '',
            'tipo'            => $user['tipo'] ?? '',
            'procedencia'     => $user['procedencia'] ?? '',
            'observaciones'   => $user['observaciones'] ?? '',
            'activo'          => $user['activo'] ?? true,
        ]);

    $status = $updateResp->status();
    $body   = $updateResp->json();
    $ok     = $status === 200 && ($body['operationStatus'] ?? '') !== 'Error';
    echo "  UpdateUsuario CN Id={$cnId} -> HTTP {$status} | " . ($body['message'] ?? json_encode($body)) . "\n";
    return $ok;
}

// ─── 3. Fix LARAVEL_GW (CN Id=18) ───────────────────────────────────────────
echo "=== Fix LARAVEL_GW (CN Id=18) ===\n";
$gwPassword = 'LaravelGateway2026!';
$ok = updateCnPassword($internalUrl, $jwt, 18, $gwPassword);
if ($ok) {
    echo "  ✓ Contraseña actualizada en C#\n";
    // Actualizar .env con contraseña con comillas
    $envPath = __DIR__.'/.env';
    $env = file_get_contents($envPath);
    $env = preg_replace('/^CN_GW_PASSWORD=.*/m', 'CN_GW_PASSWORD="' . $gwPassword . '"', $env);
    file_put_contents($envPath, $env);
    echo "  ✓ .env actualizado: CN_GW_PASSWORD=\"{$gwPassword}\"\n";
} else {
    echo "  ✗ Falló actualización en C#\n";
}

// Verificar que gateway login funciona ahora
echo "  Verificando login gateway...\n";
$gwResp = Http::withoutVerifying()->timeout(15)->post("{$internalUrl}/Login/Authentication", [
    'usuario'        => 'LARAVEL_GW',
    'contrasena'     => $gwPassword,
    'nombre_Notaria' => 'NOTARIA',
    'equipo'         => 'Laravel-Server',
]);
$gwJwt = $gwResp->json()['dataResponse']['accessToken'] ?? null;
echo "  Gateway login: " . ($gwJwt ? "JWT OK ✓" : "FALLO: " . json_encode($gwResp->json())) . "\n\n";

// ─── 4. Fix usuarios con DECRYPT_ERROR en users ───────────────────────────────
echo "=== Fix usuarios con cn_password inválido ===\n";

// Usuarios con cn_password que no se pueden desencriptar
$users = DB::table('users')->whereNotNull('cn_usuario_id')->get();
$broken = [];
foreach ($users as $u) {
    try {
        decrypt($u->cn_password);
    } catch (\Exception $e) {
        $broken[] = $u;
    }
}

if (empty($broken)) {
    echo "Ningún usuario con cn_password inválido ✓\n";
} else {
    // Contraseña por defecto para resetear
    $defaultPassword = 'Atinet2026!';

    foreach ($broken as $u) {
        $cn = DB::table('tbl_cat_usuarios')->where('Id', $u->cn_usuario_id)->first();
        if (!$cn) {
            echo "users.id={$u->id} ({$u->email}) -> CN Id={$u->cn_usuario_id} NO ENCONTRADO en tbl_cat_usuarios\n";
            continue;
        }

        echo "users.id={$u->id} ({$u->email}) -> CN Id={$u->cn_usuario_id} ({$cn->Usuario})\n";
        $ok = updateCnPassword($internalUrl, $jwt, $u->cn_usuario_id, $defaultPassword);
        if ($ok) {
            // Guardar en users.cn_password con encrypt()
            DB::table('users')->where('id', $u->id)->update([
                'cn_password' => encrypt($defaultPassword),
            ]);
            echo "  ✓ cn_password actualizado en users.id={$u->id}\n";
        } else {
            echo "  ✗ Falló usuarios.id={$u->id}\n";
        }
    }
}

echo "\n=== Estado final ===\n";
$allUsers = DB::table('users')->whereNotNull('cn_usuario_id')->get();
foreach ($allUsers as $u) {
    $plain = '';
    try { $plain = decrypt($u->cn_password); } catch (\Exception $e) { $plain = 'DECRYPT_ERROR'; }
    echo "users.id={$u->id} | {$u->email} | cn_usuario_id={$u->cn_usuario_id} | cn_password={$plain}\n";
}
