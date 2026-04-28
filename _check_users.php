<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// ============================================================
// Verificar la relación entre users y tbl_cat_usuarios
// ============================================================

echo "=== TABLA users (id, name, email, cn_usuario_id, cn_password) ===\n";
$users = DB::select("SELECT id, name, email, cn_usuario_id, cn_password FROM users ORDER BY id");
foreach ($users as $u) {
    $hasCnPassword = $u->cn_password ? 'SI' : 'NO';
    echo "  id={$u->id} | {$u->email} | cn_usuario_id={$u->cn_usuario_id} | cn_password={$hasCnPassword}\n";
}

echo "\n=== TABLA tbl_cat_usuarios (Id, Usuario, Correo, Tipo, Numero_Notaria) ===\n";
$cnUsers = DB::select("SELECT Id, Usuario, Correo, Tipo, Numero_Notaria FROM tbl_cat_usuarios ORDER BY Id");
foreach ($cnUsers as $u) {
    echo "  id={$u->Id} | {$u->Usuario} | {$u->Correo} | Tipo={$u->Tipo} | Notaria={$u->Numero_Notaria}\n";
}

echo "\n=== RELACION: users.cn_usuario_id → tbl_cat_usuarios ===\n";
$mapped = DB::select("
    SELECT u.id as laravel_id, u.email as laravel_email, u.cn_usuario_id,
           cn.Usuario as cn_usuario, cn.Correo as cn_correo
    FROM users u
    LEFT JOIN tbl_cat_usuarios cn ON cn.Id = u.cn_usuario_id
    ORDER BY u.id
");
foreach ($mapped as $m) {
    $conflict = ($m->laravel_email !== $m->cn_correo) ? ' *** CORREO DIFERENTE ***' : '';
    echo "  Laravel [{$m->laravel_id}] {$m->laravel_email} → CN [{$m->cn_usuario_id}] {$m->cn_usuario} ({$m->cn_correo}){$conflict}\n";
}

// Específicamente: admin@atinet.mx  y  admin@atinet.com.mx
echo "\n=== DUPLICADOS: quien tiene cn_usuario_id=1 ===\n";
$dup = DB::select("SELECT id, name, email, cn_usuario_id FROM users WHERE cn_usuario_id = 1");
foreach ($dup as $d) {
    echo "  Laravel id={$d->id} | {$d->email} | name={$d->name}\n";
}
