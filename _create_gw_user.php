<?php

require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$hash = '$2b$10$w4P9FEy4BZuBwsn./V5Az.uAB0J8kaddUUoyIY.MlfgR.OATEpwda';

$exists = DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->first();
if ($exists) {
    echo "Usuario LARAVEL_GW ya existe (Id={$exists->Id})\n";
} else {
    $id = DB::table('tbl_cat_usuarios')->insertGetId([
        'Usuario' => 'LARAVEL_GW',
        'Nombre' => 'Laravel Gateway',
        'Contrasena' => $hash,
        'Rol_Id' => 1,
        'Activo' => 1,
        'Numero_Notaria' => null,
        'Correo' => 'gateway@atinet.local',
    ]);
    echo "Creado LARAVEL_GW con Id={$id}\n";
}
