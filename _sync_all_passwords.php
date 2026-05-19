<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Mapa definitivo: users.id => contraseña en texto plano
$passwords = [
    1  => 'password123', // SUPERUSUARIO
    11 => 'ADMIN',       // ADMIN
];
$default = 'admin123';

$users = DB::table('users')->orderBy('id')->get();

echo "=== Sincronizando cn_password y tbl_cat_usuarios ===\n\n";

foreach ($users as $u) {
    $plain = $passwords[$u->id] ?? $default;

    // 1. Actualizar cn_password en users (contraseña cifrada para auto-login C#)
    DB::table('users')->where('id', $u->id)->update([
        'cn_password' => encrypt($plain),
    ]);

    // 2. Si tiene cn_usuario_id, actualizar tbl_cat_usuarios con hash $2a$ para C#
    if ($u->cn_usuario_id) {
        $hashCsharp = str_replace('$2y$', '$2a$', password_hash($plain, PASSWORD_BCRYPT, ['cost' => 12]));
        DB::table('tbl_cat_usuarios')->where('Id', $u->cn_usuario_id)->update([
            'Contrasena' => $hashCsharp,
        ]);
    }

    echo "id={$u->id} | {$u->email} | cn_usuario_id=" . ($u->cn_usuario_id ?? 'NULL') . " | pwd=$plain\n";
}

echo "\n=== Verificacion final ===\n";
$verificar = DB::table('users')->orderBy('id')->get();
foreach ($verificar as $u) {
    try {
        $decrypted = decrypt($u->cn_password);
        $expected  = $passwords[$u->id] ?? $default;
        $ok = ($decrypted === $expected);
        echo "id={$u->id} cn_password=" . ($ok ? "OK ($decrypted)" : "MISMATCH (got $decrypted, expected $expected)") . "\n";
    } catch (\Exception $e) {
        echo "id={$u->id} ERROR: " . $e->getMessage() . "\n";
    }
}
