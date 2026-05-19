<?php
/**
 * _audit_tenant_cn_users.php
 * Tarea 1: Auditar tbl_cat_usuarios en cada BD tenant.
 * Compara con el master para detectar discrepancias de IDs, hashes y usuarios faltantes.
 */
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Config;
use App\Models\Notaria;

$tenants = Notaria::whereNotNull('tenant_db_name')->orderBy('id')->get();

// Contraseñas esperadas por users.id (para verificar hash en tenant)
$expectedPasswords = [
    'SUPERUSUARIO' => 'password123',
    'ADMIN'        => 'ADMIN',
];
$defaultPassword = 'admin123';

echo "=== AUDITORIA tbl_cat_usuarios POR BD TENANT ===\n";
echo "Master: atinet_compliance_hub\n\n";

foreach ($tenants as $notaria) {
    $db = $notaria->tenant_db_name;

    // Saltar si el tenant ES la BD master
    if ($db === 'atinet_compliance_hub') {
        echo "━━━ Notaria {$notaria->id} | {$db} (= master, skip) ━━━\n\n";
        continue;
    }

    $connKey = 'audit_' . $notaria->id;
    Config::set("database.connections.{$connKey}", [
        'driver'    => 'mysql',
        'host'      => config('database.connections.mysql.host'),
        'port'      => config('database.connections.mysql.port'),
        'database'  => $db,
        'username'  => config('database.connections.mysql.username'),
        'password'  => config('database.connections.mysql.password'),
        'charset'   => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'strict'    => false,
    ]);

    echo "━━━ Notaria {$notaria->id} | numero_notaria={$notaria->numero_notaria} | {$db} ━━━\n";

    try {
        DB::connection($connKey)->getPdo();
    } catch (\Exception $e) {
        echo "  ❌ No se pudo conectar: {$e->getMessage()}\n\n";
        continue;
    }

    // Verificar que existe la tabla
    $hasTbl = DB::connection($connKey)->select("SHOW TABLES LIKE 'tbl_cat_usuarios'");
    if (empty($hasTbl)) {
        echo "  ❌ Tabla tbl_cat_usuarios NO existe\n\n";
        continue;
    }

    $rows = DB::connection($connKey)
        ->table('tbl_cat_usuarios')
        ->orderBy('Id')
        ->get(['Id', 'Usuario', 'Correo', 'Contrasena', 'Activo', 'Sesion_Iniciada']);

    if ($rows->isEmpty()) {
        echo "  ⚠️  Tabla vacía\n\n";
        continue;
    }

    echo str_pad('Id', 5) . str_pad('Usuario', 20) . str_pad('Prefijo hash', 14) . str_pad('Activo', 8) . str_pad('Sesion', 8) . "Hash OK?\n";
    echo str_repeat('-', 70) . "\n";

    foreach ($rows as $r) {
        $prefijo  = substr($r->Contrasena ?? '', 0, 7);
        $pwd      = $expectedPasswords[$r->Usuario] ?? $defaultPassword;
        $hashOk   = $r->Contrasena ? (password_verify($pwd, str_replace('$2a$', '$2y$', $r->Contrasena)) ? '✓' : '✗') : 'NULL';

        echo str_pad($r->Id, 5)
           . str_pad($r->Usuario, 20)
           . str_pad($prefijo, 14)
           . str_pad($r->Activo, 8)
           . str_pad($r->Sesion_Iniciada, 8)
           . $hashOk . "\n";
    }

    // Usuarios del master que pertenecen a esta notaría — verificar que existen en tenant
    $masterUsers = DB::connection('mysql')
        ->table('users as u')
        ->join('tbl_cat_usuarios as c', 'c.Id', '=', 'u.cn_usuario_id')
        ->where('u.notaria_id', $notaria->id)
        ->select('u.id as uid', 'u.email', 'u.cn_usuario_id', 'c.Usuario')
        ->get();

    if ($masterUsers->isNotEmpty()) {
        echo "\n  Usuarios Laravel asignados a esta notaría:\n";
        foreach ($masterUsers as $mu) {
            $existeEnTenant = $rows->contains('Usuario', $mu->Usuario);
            $mark = $existeEnTenant ? '✓ existe en tenant' : '❌ FALTA en tenant';
            echo "  uid={$mu->uid} {$mu->email} → CN_master_id={$mu->cn_usuario_id} ({$mu->Usuario}) — {$mark}\n";
        }
    }

    echo "\n";
    DB::purge($connKey);
}
