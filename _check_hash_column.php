<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$col = DB::select("SHOW COLUMNS FROM tbl_cat_usuarios WHERE Field = 'Contrasena'")[0];
echo "Columna tipo: {$col->Field} {$col->Type}\n";

$val = DB::table('tbl_cat_usuarios')->where('Id', 9)->value('Contrasena');
echo "Hash en DB [{$val}]\n";
echo 'Longitud: '.strlen($val)." (BCrypt necesita 60)\n";
echo "Verify 'pasword123': ".(password_verify('pasword123', $val) ? 'MATCH' : 'NO MATCH')."\n";
