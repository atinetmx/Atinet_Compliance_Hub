<?php
/**
 * _sync_all_cn_passwords.php
 * Sincroniza las contraseñas de todos los usuarios Laravel → C# directamente via el servicio.
 * Ejecuta: php _sync_all_cn_passwords.php
 */
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Services\ControlNotarialApiService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

$service = app(ControlNotarialApiService::class);

$users = DB::table('users')
    ->whereNotNull('cn_usuario_id')
    ->whereNotNull('cn_password')
    ->get(['id', 'email', 'cn_usuario_id', 'cn_password']);

echo "=== SINCRONIZACION CN PASSWORDS ===\n\n";

$ok = 0;
$fail = 0;

foreach ($users as $user) {
    try {
        $plainPassword = decrypt($user->cn_password);
    } catch (\Throwable $e) {
        echo "SKIP id={$user->id} {$user->email} (cn_password no desencriptable)\n";
        $fail++;
        continue;
    }

    // Limpiar token cacheado del gateway para forzar nuevo login y reset de sesión
    Cache::forget('cn_gw_token');

    $success = $service->resetPasswordCN((int) $user->cn_usuario_id, $plainPassword);

    if ($success) {
        echo "OK  id={$user->id} {$user->email} (cn_id={$user->cn_usuario_id})\n";
        $ok++;
    } else {
        echo "ERR id={$user->id} {$user->email} (cn_id={$user->cn_usuario_id})\n";
        $fail++;
    }
}

echo "\n=== OK:{$ok} | FALLO:{$fail} ===\n";
