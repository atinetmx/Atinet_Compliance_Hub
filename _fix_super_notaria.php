<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

$superUserId = 1; // users.id del Super Administrador Atinet
$notariaIdObjetivo = 1; // notarias.id = 1 → atinet_edomex_notaria_11

// 1. Cambiar notaria_id en users
$updated = DB::table('users')->where('id', $superUserId)->update(['notaria_id' => $notariaIdObjetivo]);
echo "users.notaria_id actualizado (filas={$updated}): notaria_id → {$notariaIdObjetivo}".PHP_EOL;

// 2. Resetear Sesion_Iniciada en master tbl_cat_usuarios
$resetMaster = DB::table('tbl_cat_usuarios')->where('Usuario', 'SUPERUSUARIO')->update(['Sesion_Iniciada' => 0]);
echo "tbl_cat_usuarios master Sesion_Iniciada → 0 (filas={$resetMaster})".PHP_EOL;

// 3. Verificar / crear SUPERUSUARIO en el tenant atinet_edomex_notaria_11
$notaria1 = DB::table('notarias')->where('id', $notariaIdObjetivo)->first();
echo PHP_EOL."Notaria objetivo: {$notaria1->nombre} | tenant_db={$notaria1->tenant_db_name}".PHP_EOL;

$tenantDb = $notaria1->tenant_db_name;

$existeTenant = DB::connection('mysql')->select("SELECT Id, Usuario, Sesion_Iniciada FROM `{$tenantDb}`.`tbl_cat_usuarios` WHERE `Usuario` = 'SUPERUSUARIO'");

if ($existeTenant) {
    $row = $existeTenant[0];
    echo "SUPERUSUARIO YA EXISTE en tenant: Id={$row->Id} Sesion_Iniciada={$row->Sesion_Iniciada}".PHP_EOL;

    // Resetear sesión en tenant también
    DB::connection('mysql')->statement("UPDATE `{$tenantDb}`.`tbl_cat_usuarios` SET `Sesion_Iniciada`=0 WHERE `Usuario`='SUPERUSUARIO'");
    echo 'Sesion_Iniciada → 0 en tenant ✓'.PHP_EOL;

    // Sincronizar hash desde master
    $masterRow = DB::table('tbl_cat_usuarios')->where('Usuario', 'SUPERUSUARIO')->first();
    DB::connection('mysql')->statement(
        "UPDATE `{$tenantDb}`.`tbl_cat_usuarios` SET `Contrasena`=? WHERE `Usuario`='SUPERUSUARIO'",
        [$masterRow->Contrasena]
    );
    echo 'Hash sincronizado desde master ✓'.PHP_EOL;
} else {
    echo 'SUPERUSUARIO NO existe en tenant — creando con Id=2...'.PHP_EOL;

    $masterRow = DB::table('tbl_cat_usuarios')->where('Usuario', 'SUPERUSUARIO')->first();

    // Insertar (sin especificar Id para que tome auto-increment normal, no Id=1 que es LARAVEL_GW)
    DB::connection('mysql')->statement(
        "INSERT INTO `{$tenantDb}`.`tbl_cat_usuarios`
         (`Nombre`, `Correo`, `Usuario`, `Contrasena`, `Rol_Id`, `Numero_Notaria`, `Activo`, `Sesion_Iniciada`, `Fecha_Creacion`)
         VALUES (?, ?, ?, ?, ?, ?, 1, 0, NOW())",
        [
            $masterRow->Nombre,
            $masterRow->Correo,
            $masterRow->Usuario,
            $masterRow->Contrasena,
            $masterRow->Rol_Id,
            $notaria1->numero_notaria,
        ]
    );
    echo 'SUPERUSUARIO creado en tenant ✓'.PHP_EOL;
}

// 4. Verificar estado final
echo PHP_EOL.'=== ESTADO FINAL ==='.PHP_EOL;
$finalUser = DB::table('users')->where('id', $superUserId)->first(['id', 'name', 'notaria_id']);
$finalNotaria = DB::table('notarias')->where('id', $finalUser->notaria_id)->first(['id', 'nombre', 'tenant_db_name', 'cn_notaria_id']);
echo "users.notaria_id = {$finalUser->notaria_id}".PHP_EOL;
echo "notaria: id={$finalNotaria->id} | {$finalNotaria->nombre} | tenant_db={$finalNotaria->tenant_db_name} | cn_notaria_id=".($finalNotaria->cn_notaria_id ?? 'NULL').PHP_EOL;

$tenantRows = DB::connection('mysql')->select("SELECT Id, Usuario, Sesion_Iniciada, LEFT(Contrasena,10) as hash_prefix FROM `{$tenantDb}`.`tbl_cat_usuarios` ORDER BY Id LIMIT 5");
echo PHP_EOL."Primeros registros tenant {$tenantDb}:".PHP_EOL;
foreach ($tenantRows as $r) {
    echo "  Id={$r->Id} | {$r->Usuario} | Sesion={$r->Sesion_Iniciada} | hash={$r->hash_prefix}...".PHP_EOL;
}
