<?php

require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Estado de cn_password en tabla users ===\n";
echo str_pad('id', 5).str_pad('email', 38)."cn_password (descifrado)\n";
echo str_repeat('-', 80)."\n";

$users = DB::table('users')->orderBy('id')->get();
foreach ($users as $u) {
    try {
        $plain = decrypt($u->cn_password);
        echo str_pad($u->id, 5).str_pad($u->email, 38).$plain."\n";
    } catch (\Exception $e) {
        $status = is_null($u->cn_password) ? 'NULL' : 'ERROR: '.$e->getMessage();
        echo str_pad($u->id, 5).str_pad($u->email, 38).$status."\n";
    }
}
