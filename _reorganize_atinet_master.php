<?php

require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "=== REORGANIZANDO NOTARIA ATINET MASTER ===\n\n";

// 1. Eliminar la notaría actual con id=2
echo "1. Eliminando notaría id=2...\n";
DB::table('notarias')->where('id', 2)->delete();
echo "   ✅ Eliminada\n\n";

// 2. Crear ATINET MASTER con id=11
echo "2. Creando ATINET MASTER con id=11...\n";
$planId = DB::table('plans')->orderBy('id')->value('id') ?? 1;

DB::statement("SET FOREIGN_KEY_CHECKS=0");
DB::table('notarias')->insert([
    'id' => 11,
    'nombre' => 'ATINET MASTER',
    'numero_notaria' => '1',
    'estado' => 'Nacional',
    'municipio' => 'Sistema Central',
    'tenant_db_name' => 'atinet_compliance_hub',
    'cn_notaria_id' => 1,
    'plan_id' => $planId,
    'fecha_registro' => now()->toDateString(),
    'activa' => 1,
    'created_at' => now(),
    'updated_at' => now(),
]);
DB::statement("SET FOREIGN_KEY_CHECKS=1");
echo "   ✅ Creada con id=11\n\n";

// 3. Actualizar tbl_cat_usuarios
echo "3. Actualizando tbl_cat_usuarios para usar Numero_Notaria='1'...\n";
if (DB::getSchemaBuilder()->hasTable('tbl_cat_usuarios')) {
    $affected = DB::table('tbl_cat_usuarios')
        ->where(function ($q) {
            $q->whereNull('Numero_Notaria')
              ->orWhere('Numero_Notaria', '')
              ->orWhere('Numero_Notaria', '.')
              ->orWhere('Numero_Notaria', '0')
              ->orWhere('Numero_Notaria', '2');
        })
        ->update(['Numero_Notaria' => '1', 'Sesion_Iniciada' => 0]);
    echo "   ✅ {$affected} registros actualizados\n\n";
}

// 4. Actualizar users.notaria_id para super_admin
echo "4. Asignando notaria_id=11 a super_admin...\n";
$affected = DB::table('users')
    ->where('tipo_cuenta', 'super_admin')
    ->update(['notaria_id' => 11, 'updated_at' => now()]);
echo "   ✅ {$affected} usuarios actualizados\n\n";

// 5. Verificar estado final
echo "=== VERIFICACIÓN FINAL ===\n";
$notarias = DB::table('notarias')->get(['id', 'nombre', 'numero_notaria', 'tenant_db_name']);
foreach ($notarias as $n) {
    echo "Notaría: ID={$n->id} | {$n->nombre} | Num={$n->numero_notaria} | DB={$n->tenant_db_name}\n";
}

$admins = DB::table('users')->where('tipo_cuenta', 'super_admin')->get(['id', 'name', 'email', 'notaria_id']);
echo "\nSuper Admins:\n";
foreach ($admins as $a) {
    echo "  {$a->name} ({$a->email}) → notaria_id={$a->notaria_id}\n";
}

echo "\n✅ REORGANIZACIÓN COMPLETA\n";
