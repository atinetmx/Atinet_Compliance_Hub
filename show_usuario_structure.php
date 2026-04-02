<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== Estructura tabla usuario (Hostgator) ===\n\n";

$cols = DB::connection('aplicativos_remote')->select('SHOW COLUMNS FROM usuario');

foreach ($cols as $c) {
    $null = $c->Null === 'YES' ? 'NULL' : 'NOT NULL';
    $key = $c->Key ? " [{$c->Key}]" : '';
    echo sprintf("  %-20s %-20s %-10s%s\n", $c->Field, $c->Type, $null, $key);
}

echo "\n→ Muestra de usuarios (primeros 3):\n\n";
$users = DB::connection('aplicativos_remote')->table('usuario')->limit(3)->get();

foreach ($users as $u) {
    echo "Usuario ID {$u->id}:\n";
    foreach (get_object_vars($u) as $k => $v) {
        $display = is_null($v) ? '(NULL)' : (strlen($v) > 60 ? substr($v, 0, 60).'...' : $v);
        echo "  {$k}: {$display}\n";
    }
    echo "\n";
}
