<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Usuarios con rol super / sin notaría / con notaría
$supers = DB::table('users')
    ->where('name', 'LIKE', '%super%')
    ->orWhere('name', 'LIKE', '%Super%')
    ->orWhere('email', 'LIKE', '%super%')
    ->get(['id', 'name', 'email', 'notaria_id']);

echo '=== USUARIOS SUPER ==='.PHP_EOL;
foreach ($supers as $u) {
    echo "  id={$u->id} | notaria_id=".($u->notaria_id ?? 'NULL')." | {$u->name} | {$u->email}".PHP_EOL;
}

// Notaria id=1
$n1 = DB::table('notarias')->where('id', 1)->first();
echo PHP_EOL.'=== NOTARIA id=1 ==='.PHP_EOL;
echo json_encode($n1, JSON_PRETTY_PRINT).PHP_EOL;

// tbl_cat_usuarios para SUPERUSUARIO
$cn = DB::table('tbl_cat_usuarios')->where('Usuario', 'SUPERUSUARIO')->first();
echo PHP_EOL.'=== tbl_cat_usuarios SUPERUSUARIO ==='.PHP_EOL;
echo json_encode($cn, JSON_PRETTY_PRINT).PHP_EOL;

// ¿Qué BD usa el autoLogin para notaria_id asignada al super?
// Ver config del tenant para notaria_id del super
if (! empty($supers)) {
    foreach ($supers as $u) {
        if ($u->notaria_id) {
            $notaria = DB::table('notarias')->where('id', $u->notaria_id)->first();
            echo PHP_EOL."=== NOTARIA asignada al super (id={$u->notaria_id}) ===".PHP_EOL;
            echo json_encode($notaria, JSON_PRETTY_PRINT).PHP_EOL;
        }
    }
}
