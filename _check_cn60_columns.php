<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

Config::set('database.connections.cn60', [
    'driver' => 'mysql',
    'host' => config('database.connections.mysql.host'),
    'port' => config('database.connections.mysql.port'),
    'database' => 'atinet_edomex_notaria_60',
    'username' => config('database.connections.mysql.username'),
    'password' => config('database.connections.mysql.password'),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
    'prefix' => '',
    'strict' => false,
]);

echo "=== Columnas de tbl_cat_usuarios ===\n";
$cols = DB::connection('cn60')->select('DESCRIBE tbl_cat_usuarios');
foreach ($cols as $c) {
    echo $c->Field.' | '.$c->Type."\n";
}

echo "\n=== Registro del usuario cn_id=19 (Invitado Notaría 60) ===\n";
$u = DB::connection('cn60')->table('tbl_cat_usuarios')->where('Id', 19)->first();
if ($u) {
    foreach ((array) $u as $k => $v) {
        $display = (strlen((string) $v) > 60) ? substr((string) $v, 0, 60).'...' : (string) $v;
        echo "{$k}: {$display}\n";
    }
} else {
    echo "Usuario Id=19 no encontrado\n";
    // listar todos
    $all = DB::connection('cn60')->table('tbl_cat_usuarios')->select('Id', 'Usuario')->get();
    foreach ($all as $row) {
        echo "  Id={$row->Id} | Usuario={$row->Usuario}\n";
    }
}
