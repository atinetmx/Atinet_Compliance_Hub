<?php

/**
 * Verifica y corrige registros tbl_cat_usuarios del master para usuarios super_admin.
 * - Numero_Notaria debe coincidir con el numero_notaria de la notaria asignada al usuario Laravel.
 * - Sesion_Iniciada debe estar en 0 para evitar bloqueos en C#.
 */

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== DIAGNÓSTICO super_admin → tbl_cat_usuarios (master) ===\n\n";

// Obtener super_admins con su notaria asignada
$superAdmins = DB::table('users')
    ->join('notarias', 'users.notaria_id', '=', 'notarias.id')
    ->where('users.tipo_cuenta', 'super_admin')
    ->whereNotNull('users.cn_usuario_id')
    ->select(
        'users.id as user_id',
        'users.name',
        'users.cn_usuario_id',
        'notarias.id as notaria_id',
        'notarias.numero_notaria',  // este es el valor que debe tener Numero_Notaria en tbl_
        'notarias.tenant_db_name'
    )
    ->get();

$toFix = [];

foreach ($superAdmins as $u) {
    $cn = DB::table('tbl_cat_usuarios')->where('Id', $u->cn_usuario_id)->first();

    if (! $cn) {
        echo "  ⚠ {$u->name} (cn_id={$u->cn_usuario_id}) — NO ENCONTRADO en tbl_cat_usuarios\n";

        continue;
    }

    $correcto = $cn->Numero_Notaria === $u->numero_notaria;
    $sesionOk = $cn->Sesion_Iniciada == 0;

    $estado = ($correcto && $sesionOk) ? '✓ OK' : '✗ REQUIERE FIX';
    echo "  {$estado} | {$u->name} | cn_id={$u->cn_usuario_id} | Usuario={$cn->Usuario}\n";
    echo "         Numero_Notaria en tbl_: '{$cn->Numero_Notaria}' → esperado: '{$u->numero_notaria}'".($correcto ? ' ✓' : ' ✗')."\n";
    echo "         Sesion_Iniciada: {$cn->Sesion_Iniciada}".($sesionOk ? ' ✓' : ' ✗')."\n";

    if (! $correcto || ! $sesionOk) {
        $toFix[] = [
            'cn_usuario_id' => $u->cn_usuario_id,
            'numero_notaria' => $u->numero_notaria,
        ];
    }
}

if (empty($toFix)) {
    echo "\n✅ Todo correcto. No se requieren cambios.\n";
    exit(0);
}

echo "\n=== APLICANDO CORRECCIONES ===\n";

foreach ($toFix as $fix) {
    $affected = DB::table('tbl_cat_usuarios')
        ->where('Id', $fix['cn_usuario_id'])
        ->update([
            'Numero_Notaria' => $fix['numero_notaria'],
            'Sesion_Iniciada' => 0,
        ]);

    // Limpiar log de sesiones activas para evitar bloqueo residual
    DB::table('tbl_log_sesiones_activas')
        ->where('Usuario_Id', $fix['cn_usuario_id'])
        ->delete();

    echo "  ✓ cn_id={$fix['cn_usuario_id']} → Numero_Notaria='{$fix['numero_notaria']}', Sesion_Iniciada=0, sesiones limpiadas\n";
}

// También limpiar caché de CN en Laravel para forzar re-login fresco
$prefix = config('cache.prefix', '');
echo "\nLimpiando caché JWT de super_admins en Laravel...\n";
foreach ($superAdmins as $u) {
    $cacheKey = 'cn_jwt_user_'.$u->cn_usuario_id;
    \Illuminate\Support\Facades\Cache::forget($cacheKey);
    echo "  ✓ Cache key '{$cacheKey}' eliminado\n";
}

echo "\n✅ Correcciones aplicadas. Recarga la página y vuelve a intentar.\n";
