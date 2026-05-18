<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== ANTES ===\n";
$rows = DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->get(['Id','Usuario','Sesion_Iniciada','Activo']);
foreach ($rows as $r) echo "  tbl_cat_usuarios Id={$r->Id} Usuario={$r->Usuario} SI={$r->Sesion_Iniciada} Activo={$r->Activo}\n";

$uRows = DB::table('users')->whereIn('cn_usuario_id', [1, 9])->get(['id','email','cn_usuario_id']);
foreach ($uRows as $r) echo "  users id={$r->id} email={$r->email} cn_usuario_id={$r->cn_usuario_id}\n";

echo "\n=== APLICANDO FIX ===\n";

// 1. users.id=1 (admin@atinet.mx) debe apuntar a cn_usuario_id=1 (el ADMIN real que C# conoce)
$affected = DB::table('users')->where('id', 1)->where('cn_usuario_id', 9)->update(['cn_usuario_id' => 1]);
echo "  users.id=1 cn_usuario_id -> 1: {$affected} fila(s) afectada(s)\n";

// 2. Desactivar Id=9 en tbl_cat_usuarios (registro huérfano de reconciliación)
// Primero limpiar cualquier sesión activa que apunte a él
DB::table('tbl_log_sesiones_activas')->where('Usuario_Id', 9)->delete();
$affected2 = DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Activo' => 0, 'Sesion_Iniciada' => 0]);
echo "  tbl_cat_usuarios Id=9 desactivado: {$affected2} fila(s) afectada(s)\n";

echo "\n=== DESPUÉS ===\n";
$rows = DB::table('tbl_cat_usuarios')->whereIn('Id', [1, 9])->get(['Id','Usuario','Sesion_Iniciada','Activo']);
foreach ($rows as $r) echo "  tbl_cat_usuarios Id={$r->Id} Usuario={$r->Usuario} SI={$r->Sesion_Iniciada} Activo={$r->Activo}\n";

$uRows = DB::table('users')->where('email', 'admin@atinet.mx')->orWhere('email', 'admin@atinet.com.mx')->get(['id','email','cn_usuario_id']);
foreach ($uRows as $r) echo "  users id={$r->id} email={$r->email} cn_usuario_id={$r->cn_usuario_id}\n";

echo "\n=== Limpiando cache JWT ===\n";
\Illuminate\Support\Facades\Cache::forget('cn_jwt_user_1');
\Illuminate\Support\Facades\Cache::forget('cn_jwt_user_9');
echo "  Cache cn_jwt_user_1 y cn_jwt_user_9 eliminados\n";
