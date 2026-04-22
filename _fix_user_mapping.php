<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== FIXES MAPEO users ↔ tbl_cat_usuarios ===\n\n";

// Fix 1: corregir correo de ADMIN1 (CN id=9) a admin@atinet.com.mx
DB::table('tbl_cat_usuarios')->where('Id', 9)->update([
    'Correo' => 'admin@atinet.com.mx',
]);
echo "Fix 1: CN id=9 (ADMIN1) correo → admin@atinet.com.mx\n";

// Fix 2: users.id=11 (admin@atinet.com.mx) debe apuntar a CN id=9, no CN id=1
DB::table('users')->where('id', 11)->update([
    'cn_usuario_id' => 9,
]);
echo "Fix 2: users.id=11 (admin@atinet.com.mx) cn_usuario_id → 9\n";

// Verificar estado final
echo "\n=== VERIFICACION FINAL ===\n";
$mapped = DB::select("
    SELECT u.id as laravel_id, u.email as laravel_email, u.cn_usuario_id,
           cn.Usuario as cn_usuario, cn.Correo as cn_correo
    FROM users u
    LEFT JOIN tbl_cat_usuarios cn ON cn.Id = u.cn_usuario_id
    WHERE u.cn_usuario_id IN (1, 9)
    ORDER BY u.id
");
foreach ($mapped as $m) {
    $conflict = ($m->laravel_email !== $m->cn_correo) ? ' *** CORREO DIFERENTE ***' : ' ✓';
    echo "  Laravel [{$m->laravel_id}] {$m->laravel_email} → CN [{$m->cn_usuario_id}] {$m->cn_usuario} ({$m->cn_correo}){$conflict}\n";
}

// Verificar que no haya otros duplicados
echo "\n=== DUPLICADOS cn_usuario_id (todos) ===\n";
$dups = DB::select("
    SELECT cn_usuario_id, COUNT(*) as total, GROUP_CONCAT(email) as emails
    FROM users
    WHERE cn_usuario_id IS NOT NULL
    GROUP BY cn_usuario_id
    HAVING COUNT(*) > 1
");
if (count($dups) === 0) {
    echo "  Ningún duplicado encontrado ✓\n";
} else {
    foreach ($dups as $d) {
        echo "  cn_usuario_id={$d->cn_usuario_id} usada por {$d->total} usuarios: {$d->emails}\n";
    }
}
