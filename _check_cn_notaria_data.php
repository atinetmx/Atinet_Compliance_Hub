<?php

require_once __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$p = new PDO('mysql:host=localhost;port=3307;dbname=atinet_compliance_hub', 'atinet_app', 'Atinet2026#Secure');

echo "=== ERROR 1: tbl_cat_usuarios.Id=1 ===\n";
$u1 = $p->query('SELECT * FROM tbl_cat_usuarios WHERE Id=1')->fetch(PDO::FETCH_ASSOC);
print_r($u1);

echo "\n=== ERROR 2: tbl_cfg_notaria (todos) ===\n";
$cfgs = $p->query('SELECT * FROM tbl_cfg_notaria')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cfgs as $c) {
    print_r($c);
}

echo "\n=== ERROR 3: users super_admin con notaria_id asignada ===\n";
$supers = $p->query("SELECT id, name, email, notaria_id, tipo_cuenta FROM users WHERE tipo_cuenta='super_admin' AND notaria_id IS NOT NULL")->fetchAll(PDO::FETCH_ASSOC);
if (empty($supers)) {
    echo "  Ninguno\n";
} else {
    foreach ($supers as $s) {
        print_r($s);
    }
}

echo "\n=== tbl_cat_usuarios completo ===\n";
$cnus = $p->query('SELECT Id, Usuario, Nombre, Numero_Notaria, Rol_Id, Tipo FROM tbl_cat_usuarios ORDER BY Id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($cnus as $u) {
    echo "  Id={$u['Id']} Usuario={$u['Usuario']} Numero_Notaria={$u['Numero_Notaria']} Rol_Id={$u['Rol_Id']} Tipo={$u['Tipo']}\n";
}

echo "\n=== Notarias existentes (referencia) ===\n";
$ns = $p->query('SELECT id, nombre, numero_notaria, tenant_db_name FROM notarias ORDER BY id')->fetchAll(PDO::FETCH_ASSOC);
foreach ($ns as $n) {
    echo "  notarias.id={$n['id']} numero={$n['numero_notaria']} nombre={$n['nombre']} → {$n['tenant_db_name']}\n";
}

use Illuminate\Support\Facades\DB;

echo '=== tbl_cat_usuarios MASTER (todos) ==='.PHP_EOL;
$cnUsuarios = DB::table('tbl_cat_usuarios')->get();
foreach ($cnUsuarios as $r) {
    echo "Id={$r->Id} Usuario={$r->Usuario} Correo={$r->Correo} Rol={$r->Rol_Id} Notaria={$r->Numero_Notaria} Activo={$r->Activo}".PHP_EOL;
}

echo PHP_EOL.'=== users Laravel con notaria_id ==='.PHP_EOL;
$users = DB::table('users')->whereNotNull('notaria_id')->get();
foreach ($users as $u) {
    $enMaster = DB::table('tbl_cat_usuarios')->where('Correo', $u->email)->first();
    $status = $enMaster ? "cn_id_master={$enMaster->Id} ✅" : '❌ NO ESTA EN MASTER';
    echo "user_id={$u->id} email={$u->email} notaria_id={$u->notaria_id} cn_usuario_id=".($u->cn_usuario_id ?? 'NULL')." | {$status}".PHP_EOL;
}

echo PHP_EOL.'=== FALTANTES: users de notaria sin registro en tbl_cat_usuarios master ==='.PHP_EOL;
$faltantes = [];
foreach ($users as $u) {
    if (! DB::table('tbl_cat_usuarios')->where('Correo', $u->email)->exists()) {
        $faltantes[] = $u;
    }
}
echo 'Total faltantes: '.count($faltantes).PHP_EOL;
foreach ($faltantes as $u) {
    echo "  user_id={$u->id} email={$u->email} notaria_id={$u->notaria_id} cn_usuario_id=".($u->cn_usuario_id ?? 'NULL').PHP_EOL;
}
