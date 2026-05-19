<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;

// Obtener cn_usuario_id de super_admins
$superAdmins = DB::table('users')
    ->leftJoin('notarias', 'users.notaria_id', '=', 'notarias.id')
    ->where('users.tipo_cuenta', 'super_admin')
    ->whereNotNull('users.cn_usuario_id')
    ->select('users.id as user_id', 'users.name', 'users.cn_usuario_id', 'notarias.numero_notaria', 'notarias.tenant_db_name')
    ->get();
$cnIds = $superAdmins->pluck('cn_usuario_id')->toArray();

echo "=== tbl_cat_usuarios MASTER para super_admins ===\n";
$registros = DB::table('tbl_cat_usuarios')->whereIn('Id', $cnIds)
    ->select('Id', 'Usuario', 'Numero_Notaria', 'Sesion_Iniciada')->get();
foreach ($registros as $r) {
    $ok = $r->Numero_Notaria === '1' ? '✓' : '✗ WRONG';
    echo "  Id={$r->Id} | {$r->Usuario} | Numero_Notaria={$r->Numero_Notaria} {$ok} | Sesion_Iniciada={$r->Sesion_Iniciada}\n";
}

echo "\n=== Payload que recibe C# (notarias.id del super_admin) ===\n";
$n11 = DB::table('notarias')->where('id', 11)->first();
echo '  notaria_id=11 | cn_notaria_id='.($n11->cn_notaria_id ?? 'NULL')." | tenant_db={$n11->tenant_db_name}\n";
echo "  → C# recibe notaria='11' → JWT client_notaria='atinet_compliance_hub' → 401 en endpoints operacionales\n";

echo "\n=== Notarias con tenant real (cn_notaria_id no null) ===\n";
DB::table('notarias')->whereNotNull('cn_notaria_id')
    ->select('id', 'numero_notaria', 'tenant_db_name', 'cn_notaria_id')->get()
    ->each(fn ($n) => print ("  id={$n->id} | numero={$n->numero_notaria} | db={$n->tenant_db_name} | cn_id={$n->cn_notaria_id}\n"));

echo "\nSUPER_ADMIN USERS === \n";
$users = DB::table('users')
    ->leftJoin('notarias', 'users.notaria_id', '=', 'notarias.id')
    ->where('users.tipo_cuenta', 'super_admin')
    ->select(
        'users.id', 'users.name', 'users.email', 'users.notaria_id', 'users.cn_usuario_id',
        'notarias.nombre as notaria_nombre', 'notarias.numero_notaria',
        'notarias.tenant_db_name', 'notarias.cn_notaria_id'
    )
    ->get();

foreach ($users as $u) {
    echo "  User: {$u->name} (id={$u->id})\n";
    echo "    notaria_id: {$u->notaria_id} | numero_notaria: {$u->numero_notaria}\n";
    echo "    tenant_db: {$u->tenant_db_name} | cn_notaria_id: {$u->cn_notaria_id}\n";
    echo "    cn_usuario_id: {$u->cn_usuario_id}\n";
}

echo "\n=== NOTARIA id=1 ===\n";
$n1 = DB::table('notarias')->where('id', 1)->first();
echo json_encode($n1, JSON_PRETTY_PRINT)."\n";

echo "\n=== tbl_cat_usuarios SUPERUSUARIO (master) ===\n";
$cui = DB::table('tbl_cat_usuarios')->where('Usuario', 'SUPERUSUARIO')->first();
echo json_encode($cui, JSON_PRETTY_PRINT)."\n";
