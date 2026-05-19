<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Buscar el usuario con cn_usuario_id=21
$user = DB::table('users')
    ->leftJoin('notarias', 'users.notaria_id', '=', 'notarias.id')
    ->where('users.cn_usuario_id', 21)
    ->select(
        'users.id', 'users.name', 'users.tipo_cuenta', 'users.notaria_id', 'users.cn_usuario_id',
        'notarias.nombre as notaria_nombre', 'notarias.numero_notaria',
        'notarias.tenant_db_name', 'notarias.cn_notaria_id'
    )
    ->first();

echo "=== Usuario cn_usuario_id=21 ===\n";
echo "  Nombre: {$user->name} | tipo: {$user->tipo_cuenta}\n";
echo "  notaria_id: {$user->notaria_id} | tenant_db: {$user->tenant_db_name}\n";
echo "  numero_notaria: {$user->numero_notaria} | cn_notaria_id: {$user->cn_notaria_id}\n";

// Estado en master
$master = DB::table('tbl_cat_usuarios')->where('Id', 21)->first(['Id', 'Usuario', 'Numero_Notaria', 'Sesion_Iniciada']);
echo "\n=== tbl_cat_usuarios MASTER Id=21 ===\n";
echo '  '.json_encode($master)."\n";

// Estado en tenant
$tenantDb = $user->tenant_db_name;
echo "\n=== tbl_cat_usuarios TENANT ({$tenantDb}) para COMPUMUNDO ===\n";
try {
    $tenantRow = DB::connection('mysql')->select(
        "SELECT Id, Usuario, Numero_Notaria, Sesion_Iniciada FROM `{$tenantDb}`.`tbl_cat_usuarios` WHERE Usuario='COMPUMUNDO' LIMIT 1"
    );
    echo '  '.json_encode($tenantRow[0] ?? 'NO ENCONTRADO')."\n";
} catch (\Exception $e) {
    echo '  ERROR: '.$e->getMessage()."\n";
}

// También ver tbl_log_sesiones_activas en tenant
echo "\n=== tbl_log_sesiones_activas TENANT ({$tenantDb}) ===\n";
try {
    $sesiones = DB::connection('mysql')->select(
        "SELECT * FROM `{$tenantDb}`.`tbl_log_sesiones_activas` LIMIT 10"
    );
    if (empty($sesiones)) {
        echo "  (vacío)\n";
    }
    foreach ($sesiones as $s) {
        echo '  '.json_encode($s)."\n";
    }
} catch (\Exception $e) {
    echo '  ERROR: '.$e->getMessage()."\n";
}
