<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
use Illuminate\Support\Facades\DB;

$users = DB::select("SELECT Id, Usuario, SUBSTRING(Contrasena,1,10) as h, LENGTH(Contrasena) as l, Sesion_Iniciada, Activo FROM tbl_cat_usuarios WHERE Usuario IN ('ADMIN','LARAVEL_GW') ORDER BY Id");
foreach ($users as $u) {
    echo "ID={$u->Id} | {$u->Usuario} | prefix={$u->h} | len={$u->l} | sesion={$u->Sesion_Iniciada} | activo={$u->Activo}\n";
}

foreach ([1, 9] as $id) {
    $row = DB::selectOne("SELECT Contrasena FROM tbl_cat_usuarios WHERE Id = ?", [$id]);
    $hash = $row->Contrasena ?? '';
    echo "\nID={$id} hash: " . substr($hash, 0, 30) . "\n";
    foreach (['admin', 'Admin', '12345', 'admin123', 'Atinet2026#', 'atinet'] as $p) {
        if (password_verify($p, $hash)) { echo "  ✅ password='$p'\n"; }
    }
}
