<?php // v2
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$failing = DB::table('users')->whereNotNull('cn_usuario_id')->get(['id', 'email', 'cn_usuario_id', 'cn_password']);

foreach ($failing as $u) {
    try {
        $p = decrypt($u->cn_password);
    } catch (\Throwable $e) {
        $p = 'ERR_DECRYPT';
    }

    $cn = DB::table('tbl_cat_usuarios')->where('Id', $u->cn_usuario_id)->first(['Usuario', 'Contrasena']);
    if (! $cn) {
        echo "users.id={$u->id} cn_id={$u->cn_usuario_id} NO CN RECORD\n";
        continue;
    }

    $hashPrefix = substr($cn->Contrasena, 0, 7);
    echo "users.id={$u->id} cn_id={$u->cn_usuario_id} stored_pass='{$p}' CN_usuario={$cn->Usuario} hash={$hashPrefix}...\n";
}
