<?php

/**
 * Script para verificar los datos copiados a la BD del tenant
 * Uso: php verify_tenant_data.php [numero_notaria]
 * Ejemplo: php verify_tenant_data.php 001
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Obtener número de notaría desde argumentos o usar la primera disponible
$numeroNotaria = $argv[1] ?? null;

if (! $numeroNotaria) {
    $notaria = DB::table('notarias')->orderBy('created_at', 'desc')->first();
    if (! $notaria) {
        echo "❌ No hay notarías registradas\n";
        exit(1);
    }
    $numeroNotaria = $notaria->numero_notaria;
    echo "ℹ️  Verificando última notaría creada: {$notaria->nombre} (#{$numeroNotaria})\n\n";
} else {
    $notaria = DB::table('notarias')->where('numero_notaria', $numeroNotaria)->first();
    if (! $notaria) {
        echo "❌ No se encontró la notaría #{$numeroNotaria}\n";
        exit(1);
    }
    echo "ℹ️  Verificando notaría: {$notaria->nombre} (#{$numeroNotaria})\n\n";
}

$databaseName = 'atinet_notaria_'.$numeroNotaria;

echo "════════════════════════════════════════════════════\n";
echo "🔍 VERIFICACIÓN DE BD DEL TENANT: {$databaseName}\n";
echo "════════════════════════════════════════════════════\n\n";

// Verificar si la BD existe
try {
    DB::statement("USE `{$databaseName}`");
    echo "✅ Base de datos existe\n\n";
} catch (\Exception $e) {
    echo "❌ Base de datos NO existe\n";
    echo "   Error: {$e->getMessage()}\n";
    exit(1);
}

// Verificar tablas y contar registros
$tablas = [
    'users' => ['esperado' => '1+', 'descripcion' => 'Usuario admin local'],
    'configuracion' => ['esperado' => '4', 'descripcion' => 'Configuración básica del tenant'],
    'services' => ['esperado' => '16', 'descripcion' => 'Catálogo de servicios activos'],
    'plan_services' => ['esperado' => '5+', 'descripcion' => 'Servicios incluidos en el plan'],
    'tenant_services' => ['esperado' => '0', 'descripcion' => 'Customizaciones (opcional)'],
    'service_usage' => ['esperado' => '0', 'descripcion' => 'Uso de servicios (se llenará)'],
];

echo "📋 VERIFICACIÓN DE TABLAS Y DATOS:\n";
echo "─────────────────────────────────────────────────────\n\n";

foreach ($tablas as $tabla => $info) {
    try {
        $count = DB::table("{$databaseName}.{$tabla}")->count();
        $status = ($info['esperado'] === '0' && $count === 0) ||
                  ($info['esperado'] !== '0' && $count > 0) ? '✅' : '❌';

        echo "{$status} {$tabla}\n";
        echo "   Registros: {$count} (esperado: {$info['esperado']})\n";
        echo "   Descripción: {$info['descripcion']}\n";

        // Mostrar datos si hay pocos registros
        if ($count > 0 && $count <= 5 && in_array($tabla, ['users', 'configuracion'])) {
            $registros = DB::table("{$databaseName}.{$tabla}")->get();
            foreach ($registros as $registro) {
                if ($tabla === 'configuracion') {
                    echo "      → {$registro->clave}: {$registro->valor}\n";
                } elseif ($tabla === 'users') {
                    echo "      → {$registro->email} ({$registro->tipo_cuenta})\n";
                }
            }
        }

        echo "\n";
    } catch (\Exception $e) {
        echo "❌ {$tabla}\n";
        echo "   Error: Tabla no existe o error al consultar\n";
        echo "   Detalle: {$e->getMessage()}\n\n";
    }
}

// Verificar plan_services en detalle
echo "─────────────────────────────────────────────────────\n";
echo "📊 DETALLE DE SERVICIOS DEL PLAN:\n";
echo "─────────────────────────────────────────────────────\n\n";

try {
    $planServices = DB::table("{$databaseName}.plan_services as ps")
        ->join("{$databaseName}.services as s", 'ps.service_id', '=', 's.id')
        ->select('s.name', 's.code', 'ps.is_included', 'ps.usage_limit', 'ps.extra_price')
        ->orderBy('ps.priority')
        ->get();

    if ($planServices->count() > 0) {
        echo "Plan ID: {$notaria->plan_id}\n";
        echo "Servicios configurados: {$planServices->count()}\n\n";

        foreach ($planServices as $ps) {
            $limit = $ps->usage_limit === null ? 'ilimitado' : $ps->usage_limit;
            $included = $ps->is_included ? '✅ Incluido' : '❌ No incluido';
            echo "  • {$ps->name} ({$ps->code})\n";
            echo "    {$included} | Límite: {$limit}\n";
            if ($ps->extra_price) {
                echo "    Precio extra: \${$ps->extra_price}\n";
            }
            echo "\n";
        }
    } else {
        echo "❌ NO HAY SERVICIOS CONFIGURADOS PARA EL PLAN\n";
        echo "   Esto indica que la copia de plan_services FALLÓ\n\n";

        // Verificar si existen en la BD central
        echo "🔍 Verificando BD central...\n";
        $centralPlanServices = DB::table('plan_services')
            ->where('plan_id', $notaria->plan_id)
            ->count();
        echo "   Plan services en BD central: {$centralPlanServices}\n";

        if ($centralPlanServices > 0) {
            echo "   ⚠️  Los datos existen en central pero NO se copiaron al tenant\n";
        } else {
            echo "   ⚠️  El plan no tiene servicios configurados en la BD central\n";
        }
    }
} catch (\Exception $e) {
    echo "❌ Error al verificar servicios del plan\n";
    echo "   {$e->getMessage()}\n";
}

echo "\n";
echo "════════════════════════════════════════════════════\n";
echo "🏁 VERIFICACIÓN COMPLETADA\n";
echo "════════════════════════════════════════════════════\n";
