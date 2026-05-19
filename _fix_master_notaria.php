<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

// ─── 1. Insertar/obtener notaria master ──────────────────────────────────────
$master = DB::table('notarias')->where('tenant_db_name', 'atinet_compliance_hub')->first();

if ($master) {
    echo "✅ Notaria master ya existe: id={$master->id} nombre={$master->nombre}\n";
    $masterNotariaId = $master->id;
} else {
    $planId = DB::table('plans')->orderBy('id')->value('id');
    $masterNotariaId = DB::table('notarias')->insertGetId([
        'nombre' => 'ATINET MASTER',
        'numero_notaria' => '0',
        'tenant_db_name' => 'atinet_compliance_hub',
        'plan_id' => $planId,
        'activa' => 1,
        'fecha_registro' => now()->toDateString(),
        'created_at' => now(),
        'updated_at' => now(),
    ]);
    echo "✅ Notaria master creada: id={$masterNotariaId}\n";
}

// ─── 2. Actualizar Numero_Notaria de super_admin en tbl_cat_usuarios ─────────
// Usuarios sin notaria real: Id=1(ADMIN), 2(PRUEBA), 3(ALMA), 5(KARCER),
// 9(SUPERUSUARIO), 13(ATENCION), 14(JESS), 15(CLAUS), 16(ARI)
$affected = DB::table('tbl_cat_usuarios')
    ->where(function ($q) {
        $q->whereNull('Numero_Notaria')
            ->orWhere('Numero_Notaria', '')
            ->orWhere('Numero_Notaria', '.')
            ->orWhere('Numero_Notaria', '0');
    })
    ->update(['Numero_Notaria' => (string) $masterNotariaId, 'Sesion_Iniciada' => 0]);
echo "tbl_cat_usuarios actualizados (Numero_Notaria=null/./0 → {$masterNotariaId}): {$affected} registros\n";

// ─── 3. Invalidar caches de JWT para super_admin ─────────────────────────────
$superAdmins = DB::table('users')->where('tipo_cuenta', 'super_admin')->pluck('cn_usuario_id');
foreach ($superAdmins as $cnId) {
    Cache::forget("cn_jwt_user_{$cnId}");
    Cache::forget("cn_jwt_lock_{$cnId}");
}
Cache::forget('cn_gw_token_master');
echo 'Caches JWT invalidados para '.count($superAdmins)." super_admins\n\n";

// ─── 4. Verificar estado final ───────────────────────────────────────────────
echo "=== Estado final tbl_cat_usuarios (super_admin) ===\n";
$rows = DB::table('tbl_cat_usuarios')
    ->where('Numero_Notaria', (string) $masterNotariaId)
    ->get(['Id', 'Usuario', 'Correo', 'Numero_Notaria']);
foreach ($rows as $r) {
    echo "  Id={$r->Id} {$r->Usuario} ({$r->Correo}) → Numero_Notaria={$r->Numero_Notaria}\n";
}

// ─── 5. Test login C# con el nuevo notaria_id ────────────────────────────────
echo "\n=== Test login C# SUPERUSUARIO (notaria={$masterNotariaId}) ===\n";
$user = DB::table('users')->where('email', 'admin@atinet.mx')->first();
$cnUser = DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->first();

try {
    DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->update(['Sesion_Iniciada' => 0]);
    DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', $user->cn_usuario_id)->delete();

    $plain = decrypt($user->cn_password);
    $payload = json_encode([
        'notaria' => (string) $masterNotariaId,
        'usuario' => $cnUser->Usuario,
        'contrasena' => $plain,
        'equipo' => 'Laravel-Test',
        'model' => 'pc',
    ]);
    echo "Payload: {$payload}\n";

    $ch = curl_init('http://192.168.1.1:5000/api/Login/Authentication');
    curl_setopt_array($ch, [
        CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload,
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
        CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
    ]);
    $resp = curl_exec($ch);
    $code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    $body = json_decode($resp, true);
    $token = $body['dataResponse']['accessToken'] ?? $body['token'] ?? $body['Token'] ?? null;
    echo "HTTP {$code}: ".($token ? '✅ TOKEN: '.substr($token, 0, 80).'...' : '❌ '.($body['message'] ?? $resp))."\n";
    if (! $token) {
        echo 'Full: '.json_encode($body, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)."\n";
    }
} catch (\Throwable $e) {
    echo '❌ Error: '.$e->getMessage()."\n";
}

echo "\n➡ master notaria_id = {$masterNotariaId} — usar este valor en cnNombreNotaria()\n";
