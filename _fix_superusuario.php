<?php

/**
 * Correcciones de consistencia de datos superusuarios:
 * 1. users.id=3 (elizabeth.ortega) → super_admin, notaria_id=NULL
 * 2. tbl_cat_usuarios.Id=1 (ADMIN) → Numero_Notaria=NULL (legado Alex, no tiene notaria)
 * 3. tbl_cat_usuarios.Id=9 (SUPERUSUARIO) → Numero_Notaria=NULL (idem)
 * 4. tbl_cfg_notaria con Numero_Notaria=2 huérfana → NULL
 */
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

$dryRun = in_array('--dry-run', $argv ?? []);
echo ($dryRun ? '[DRY-RUN] ' : '[LIVE] ')."Iniciando correcciones de superusuarios...\n\n";

// ─── FIX 1: users.id=3 (elizabeth.ortega) → super_admin, notaria_id=NULL ─────
$user3 = DB::table('users')->where('id', 3)->first();
echo "FIX 1: users.id=3 ({$user3->email})\n";
echo "  ANTES: tipo_cuenta={$user3->tipo_cuenta}  notaria_id={$user3->notaria_id}\n";
if (! $dryRun) {
    DB::table('users')->where('id', 3)->update(['tipo_cuenta' => 'super_admin', 'notaria_id' => null]);
    Cache::forget("cn_jwt_user_{$user3->cn_usuario_id}");
    Cache::forget("cn_jwt_lock_{$user3->cn_usuario_id}");
}
echo "  DESPUES: tipo_cuenta=super_admin  notaria_id=NULL\n\n";

// ─── FIX 2: tbl_cat_usuarios.Id=1 (ADMIN / admin@atinet.com.mx) ──────────────
$cn1 = DB::table('tbl_cat_usuarios')->where('Id', 1)->first();
echo "FIX 2: tbl_cat_usuarios.Id=1 ({$cn1->Usuario} / {$cn1->Correo})\n";
echo "  ANTES: Numero_Notaria='{$cn1->Numero_Notaria}' (legado Alex, sin notaria real)\n";
if (! $dryRun) {
    DB::table('tbl_cat_usuarios')->where('Id', 1)->update(['Numero_Notaria' => null]);
}
echo "  DESPUES: Numero_Notaria=NULL\n\n";

// ─── FIX 3: tbl_cat_usuarios.Id=9 (SUPERUSUARIO / admin@atinet.mx) ───────────
$cn9 = DB::table('tbl_cat_usuarios')->where('Id', 9)->first();
echo "FIX 3: tbl_cat_usuarios.Id=9 ({$cn9->Usuario} / {$cn9->Correo})\n";
echo "  ANTES: Numero_Notaria='{$cn9->Numero_Notaria}' (legado Alex, sin notaria real)\n";
if (! $dryRun) {
    DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Numero_Notaria' => null]);
}
echo "  DESPUES: Numero_Notaria=NULL\n\n";

// ─── FIX 4: tbl_cfg_notaria — Numero_Notaria='2' huérfana ────────────────────
$cfgsOrfanas = DB::table('tbl_cfg_notaria')->where('Numero_Notaria', '2')->get();
if ($cfgsOrfanas->isEmpty()) {
    echo "FIX 4: tbl_cfg_notaria — ningún registro con Numero_Notaria='2'\n\n";
} else {
    foreach ($cfgsOrfanas as $cfg) {
        echo "FIX 4: tbl_cfg_notaria.Id={$cfg->Id}\n";
        echo "  ANTES: Numero_Notaria='{$cfg->Numero_Notaria}'\n";
        if (! $dryRun) {
            DB::table('tbl_cfg_notaria')->where('Id', $cfg->Id)->update(['Numero_Notaria' => null]);
        }
        echo "  DESPUES: Numero_Notaria=NULL\n\n";
    }
}

// ─── Verificación final ───────────────────────────────────────────────────────
echo "─── Verificación final ──────────────────────────────────────────\n";
$u3f = DB::table('users')->where('id', 3)->first();
echo "users.id=3:             tipo_cuenta={$u3f->tipo_cuenta}  notaria_id=".var_export($u3f->notaria_id, true)."\n";
$c1f = DB::table('tbl_cat_usuarios')->where('Id', 1)->first();
echo "tbl_cat_usuarios.Id=1:  {$c1f->Usuario}  Numero_Notaria=".var_export($c1f->Numero_Notaria, true)."\n";
$c9f = DB::table('tbl_cat_usuarios')->where('Id', 9)->first();
echo "tbl_cat_usuarios.Id=9:  {$c9f->Usuario}  Numero_Notaria=".var_export($c9f->Numero_Notaria, true)."\n";
$cfgFinal = DB::table('tbl_cfg_notaria')->whereNull('Numero_Notaria')->orWhere('Numero_Notaria', '2')->count();
echo 'tbl_cfg_notaria con Numero_Notaria=2: '.DB::table('tbl_cfg_notaria')->where('Numero_Notaria', '2')->count()."\n";

echo "\n".($dryRun ? "Dry-run completado. Sin --dry-run para aplicar.\n" : "✅ Correcciones aplicadas.\n");
