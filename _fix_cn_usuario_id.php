<?php

// Corrige cn_usuario_id=2 en los dos nuevos usuarios (id=22 y id=23)
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;

$fixes = [
    22 => 20, // lalo@gmail.com        → LALO (cn id=20)
    23 => 21, // compumundo@...        → COMPUMUNDO (cn id=21)
];

foreach ($fixes as $laravelId => $cnId) {
    DB::table('users')->where('id', $laravelId)->update(['cn_usuario_id' => $cnId]);

    $u = DB::table('users')->find($laravelId);
    $cn = DB::table('tbl_cat_usuarios')->find($cnId);

    echo "users.id={$laravelId} ({$u->email}) → cn_usuario_id={$u->cn_usuario_id} → CN {$cnId}: {$cn->Usuario}\n";

    // Generar cn_password si falta
    if (empty($u->cn_password) && $cn) {
        $plain = strtolower($cn->Usuario).'@123';
        DB::table('users')->where('id', $laravelId)->update(['cn_password' => encrypt($plain)]);
        echo "  cn_password generado: {$plain}\n";
    } else {
        echo '  cn_password: '.(! empty($u->cn_password) ? 'YA PRESENTE' : 'VACÍO')."\n";
    }
}

echo "\nVerificación final:\n";
$rows = DB::table('users')
    ->whereIn('id', [22, 23])
    ->get(['id', 'email', 'cn_usuario_id']);
foreach ($rows as $r) {
    echo "  users.id={$r->id} {$r->email} → cn_usuario_id={$r->cn_usuario_id}\n";
}
echo "Done.\n";
