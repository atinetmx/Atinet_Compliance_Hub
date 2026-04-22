<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$newPassword = 'GatewayAtinet2026';

// Generamos hash $2b (compatible con C# BCrypt)
$phpHash = password_hash($newPassword, PASSWORD_BCRYPT);
// BCrypt de PHP genera $2y, C# espera $2b — son equivalentes, solo diferencia de prefijo
$newHash = '$2b$10$' . substr($phpHash, 7);

echo "Nueva contraseña: $newPassword\n";
echo "Nuevo hash ($2b): $newHash\n";
echo "Verificación PHP: " . (password_verify($newPassword, $newHash) ? 'OK' : 'FAIL') . "\n";

// 1. Actualizar LARAVEL_GW: nueva contraseña + limpiar sesión
$updated = DB::table('tbl_cat_usuarios')
    ->where('Usuario', 'LARAVEL_GW')
    ->update([
        'Contrasena' => $newHash,
        'Sesion_Iniciada' => 0,
    ]);
echo "LARAVEL_GW actualizado: $updated registro(s)\n";

// 2. Limpiar sesiones activas de ADMIN también
$updatedAdmin = DB::table('tbl_cat_usuarios')
    ->where('Usuario', 'ADMIN')
    ->update(['Sesion_Iniciada' => 0]);
echo "ADMIN sesiones limpiadas: $updatedAdmin registro(s)\n";

// Verificar estado final
$users = DB::table('tbl_cat_usuarios')
    ->whereIn('Usuario', ['LARAVEL_GW', 'ADMIN'])
    ->select('Id', 'Usuario', 'Sesion_Iniciada', 'Activo')
    ->get();
foreach ($users as $u) {
    echo "ID: {$u->Id} | {$u->Usuario} | Sesion: {$u->Sesion_Iniciada} | Activo: {$u->Activo}\n";
}
