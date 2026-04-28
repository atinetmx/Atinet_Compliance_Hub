#!/usr/bin/env python3
"""Helper: writes _check_plans.php to inspect plan services for a notaria."""

php = r"""<?php
require __DIR__.'/vendor/autoload.php';
$app = require __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Notaria;
use App\Models\Service;

$n = Notaria::with(['subscripciones.plan.services'])->where('nombre', 'like', '%COLIMA%')->first();

$sub  = $n->subscripciones->first();
$plan = $sub->plan;

echo "=== Notaria: {$n->nombre} ===\n";
echo "Sub #{$sub->id} | Status: {$sub->status} | Vence: {$sub->fecha_vencimiento}\n\n";

echo "=== Plan: {$plan->nombre} ===\n";
echo "Descripcion: {$plan->descripcion}\n";
echo "Precio: \${$plan->precio_mensual}/mes | \${$plan->precio_anual}/anual\n";
echo "Limite usuarios: ".($plan->limite_usuarios ?? 'sin limite')."\n";
echo "Limite busquedas/mes: ".($plan->limite_busquedas_mes ?? 'sin limite')."\n\n";

echo "Herramientas activas (herramientas_activas JSON):\n";
foreach ($plan->herramientas_activas ?? [] as $h) {
    echo "  - {$h}\n";
}
echo "\nCaracteristicas:\n";
foreach ($plan->caracteristicas ?? [] as $c) {
    echo "  - {$c}\n";
}

echo "\n=== Servicios via plan_services (".count($plan->services).") ===\n";
if ($plan->services->isEmpty()) {
    echo "  (ninguno enlazado via pivot plan_services)\n";
} else {
    foreach ($plan->services as $s) {
        $included = $s->pivot->is_included ? 'INCLUIDO' : 'EXTRA';
        $limit    = $s->pivot->usage_limit ? "limite={$s->pivot->usage_limit}" : 'sin limite';
        $price    = $s->pivot->extra_price ? "\${$s->pivot->extra_price}" : '-';
        echo "  [{$included}] #{$s->id} {$s->name} | code={$s->code} | {$limit} | extra={$price}\n";
    }
}

echo "\n=== TODOS los servicios en BD ===\n";
Service::all()->each(function($s) use ($plan) {
    $enPlan = $plan->services->contains('id', $s->id) ? '[EN PLAN]' : '        ';
    $impl = $s->implementation_status ?? '?';
    echo "{$enPlan} #{$s->id} | {$s->name} | code={$s->code} | cat={$s->category?->value} | activo=".($s->is_active ? 'SI' : 'NO')." | impl={$impl}\n";
});
"""

target = r'c:\inetpub\wwwroot\Atinet_Compliance_Hub\_check_plans.php'
with open(target, 'w', encoding='utf-8') as f:
    f.write(php)
print(f'Escrito OK -> {target}')


php = r"""<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Enums\EstadoMexico;
use App\Models\Notaria;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

echo '=== Provision LARAVEL_GW en BDs Tenant v2 ==='.PHP_EOL.PHP_EOL;

$gwMaster = DB::table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->first();
if (!$gwMaster) {
    echo 'LARAVEL_GW no encontrado en BD principal. Abortando.'.PHP_EOL;
    exit(1);
}
echo "LARAVEL_GW master Id={$gwMaster->Id} Rol={$gwMaster->Rol_Id}".PHP_EOL.PHP_EOL;

$masterRoles   = DB::table('tbl_cat_roles')->get()->toArray();
$masterModulos = DB::table('tbl_cat_modulos')->get()->toArray();
echo 'Roles en master: '.count($masterRoles).PHP_EOL;
foreach ($masterRoles as $r) {
    echo "  Id={$r->Id} Desc={$r->Descripcion}".PHP_EOL;
}
echo PHP_EOL;

$notarias = Notaria::all();
echo "Notarias: {$notarias->count()}".PHP_EOL.PHP_EOL;

foreach ($notarias as $notaria) {
    $estadoCodigo = EstadoMexico::getCodeFromName($notaria->estado);
    $dbName  = "atinet_{$estadoCodigo}_notaria_{$notaria->numero_notaria}";
    $connKey = 'tenant_gw_prov_'.$notaria->id;

    echo "--- {$notaria->nombre} -> {$dbName} ---".PHP_EOL;

    $dbExists = DB::select("SHOW DATABASES LIKE '{$dbName}'");
    if (empty($dbExists)) {
        echo '    BD no existe - omitiendo'.PHP_EOL.PHP_EOL;
        continue;
    }

    Config::set("database.connections.{$connKey}", [
        'driver'    => 'mysql',
        'host'      => config('database.connections.mysql.host'),
        'port'      => config('database.connections.mysql.port'),
        'database'  => $dbName,
        'username'  => config('database.connections.mysql.username'),
        'password'  => config('database.connections.mysql.password'),
        'charset'   => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
        'prefix'    => '',
        'strict'    => false,
    ]);

    try {
        $tenantDb = DB::connection($connKey);

        // Roles
        $rolesCount = $tenantDb->table('tbl_cat_roles')->count();
        if ($rolesCount === 0 && count($masterRoles) > 0) {
            $tenantDb->statement('SET FOREIGN_KEY_CHECKS=0');
            foreach ($masterRoles as $role) {
                $tenantDb->table('tbl_cat_roles')->insertOrIgnore((array) $role);
            }
            $tenantDb->statement('SET FOREIGN_KEY_CHECKS=1');
            echo '    OK Roles copiados: '.count($masterRoles).PHP_EOL;
        } else {
            echo "    - Roles ya existen ({$rolesCount})".PHP_EOL;
        }

        // Modulos
        $modulosCount = $tenantDb->table('tbl_cat_modulos')->count();
        if ($modulosCount === 0 && count($masterModulos) > 0) {
            $tenantDb->statement('SET FOREIGN_KEY_CHECKS=0');
            foreach ($masterModulos as $modulo) {
                $tenantDb->table('tbl_cat_modulos')->insertOrIgnore((array) $modulo);
            }
            $tenantDb->statement('SET FOREIGN_KEY_CHECKS=1');
            echo '    OK Modulos copiados: '.count($masterModulos).PHP_EOL;
        } else {
            echo "    - Modulos ya existen ({$modulosCount})".PHP_EOL;
        }

        // LARAVEL_GW
        $gwTenant = $tenantDb->table('tbl_cat_usuarios')->where('Usuario', 'LARAVEL_GW')->first();
        if ($gwTenant) {
            echo "    - LARAVEL_GW ya existe (Id={$gwTenant->Id})".PHP_EOL;
        } else {
            $newId = $tenantDb->table('tbl_cat_usuarios')->insertGetId([
                'Nombre'          => $gwMaster->Nombre,
                'Correo'          => $gwMaster->Correo,
                'Usuario'         => 'LARAVEL_GW',
                'Contrasena'      => $gwMaster->Contrasena,
                'Rol_Id'          => $gwMaster->Rol_Id,
                'Numero_Notaria'  => $notaria->numero_notaria,
                'Activo'          => 1,
                'Sesion_Iniciada' => 0,
                'Fecha_Creacion'  => now(),
            ]);
            echo "    OK LARAVEL_GW creado Id={$newId}".PHP_EOL;
        }
    } catch (\Throwable $e) {
        echo '    ERROR: '.$e->getMessage().PHP_EOL;
    } finally {
        DB::purge($connKey);
    }

    echo PHP_EOL;
}
echo '=== Completado ==='.PHP_EOL;
"""

target = r'c:\inetpub\wwwroot\Atinet_Compliance_Hub\_provision_gw_tenants.php'
with open(target, 'w', encoding='utf-8') as f:
    f.write(php)

print(f'Escrito OK -> {target}')
