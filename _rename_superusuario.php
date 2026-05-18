<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();
use Illuminate\Support\Facades\DB;
DB::table('tbl_cat_usuarios')->where('Id', 9)->update(['Usuario' => 'SUPERUSUARIO']);
echo "Usuario ahora: ".DB::table('tbl_cat_usuarios')->where('Id', 9)->value('Usuario').PHP_EOL;
