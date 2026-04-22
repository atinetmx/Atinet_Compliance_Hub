<?php
// _debug_update_user.php — debuggear UpdateUsuario para un usuario específico
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$cnBase = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');
$usuarioId = (int) ($argv[1] ?? 10); // por defecto PANFILOP (Id=10)

// Resetear sesión gateway y obtener token
DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->update(['Sesion_Iniciada' => 0]);
DB::table('tbl_log_sesiones_activas')
    ->whereIn('Usuario_Id', DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->pluck('Id'))
    ->delete();

$ch = curl_init("{$cnBase}/Login/Authentication");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode([
        'usuario'        => config('services.control_notarial.gw_user', 'LARAVEL_GW'),
        'contrasena'     => config('services.control_notarial.gw_password', ''),
        'nombre_Notaria' => 'NOTARIA',
        'equipo'         => 'Debug',
    ]),
    CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 15,
]);
$gwBody = curl_exec($ch);
curl_close($ch);
$gwData = json_decode($gwBody, true);
$gwJwt  = $gwData['dataResponse']['accessToken'] ?? null;
if (! $gwJwt) {
    echo "ERROR gateway: $gwBody\n";
    exit(1);
}
echo "Gateway JWT OK\n\n";

// Obtener datos del usuario desde C#
echo "=== GET /User/GetUsuarioById?usuarioId={$usuarioId} ===\n";
$ch = curl_init("{$cnBase}/User/GetUsuarioById?usuarioId={$usuarioId}");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER     => ['Accept: application/json', "Authorization: Bearer $gwJwt"],
    CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 15,
]);
$userBody   = curl_exec($ch);
$userStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "Status: $userStatus\n";

$userData = json_decode($userBody, true);
$userObj  = $userData['dataResponse'] ?? null;

if (! $userObj) {
    echo "ERROR: dataResponse vacío.\n$userBody\n";
    exit(1);
}

echo "Campos devueltos por C#:\n";
foreach ($userObj as $key => $val) {
    $display = is_null($val) ? '*** NULL ***' : (is_bool($val) ? ($val ? 'true' : 'false') : json_encode($val));
    echo "  {$key}: {$display}\n";
}

// Intentar el update sanitizando nulls y vacíos → "." como placeholder, quitar campos read-only
echo "\n=== Intentando UpdateUsuario con sanitización de nulls ===\n";
$stringFields = [
    'nombre', 'apellido_Paterno', 'apellido_Materno', 'correo', 'usuario',
    'curp', 'rfc', 'iniciales', 'adscripcion',
    'tipo', 'procedencia', 'observaciones',
];
// numero_Notaria necesita "." o número real como string
$sanitized = $userObj;
unset($sanitized['rol']); // campo read-only, C# lo rechaza en update

foreach ($stringFields as $field) {
    if (! isset($sanitized[$field]) || is_null($sanitized[$field]) || $sanitized[$field] === '') {
        $sanitized[$field] = '.';
    }
}
if (empty($sanitized['numero_Notaria'])) {
    $sanitized['numero_Notaria'] = '.';
}
$sanitized['contrasena'] = 'admin123';

$ch = curl_init("{$cnBase}/User/UpdateUsuario?usuarioId={$usuarioId}");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true, CURLOPT_CUSTOMREQUEST => 'PUT',
    CURLOPT_HTTPHEADER     => [
        'Content-Type: application/json',
        'Accept: application/json',
        "Authorization: Bearer $gwJwt",
    ],
    CURLOPT_POSTFIELDS     => json_encode($sanitized),
    CURLOPT_SSL_VERIFYPEER => false, CURLOPT_TIMEOUT => 15,
]);
$putBody   = curl_exec($ch);
$putStatus = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);
echo "Respuesta PUT ({$putStatus}): {$putBody}\n";
require __DIR__ . '/vendor/autoload.php';
