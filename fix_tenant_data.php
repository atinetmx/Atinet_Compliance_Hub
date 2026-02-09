<?php

/**
 * Script para ejecutar migración configuracion en la BD del tenant existente
 * y después copiar los datos esenciales que faltaban
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Notaria;
use Illuminate\Support\Facades\DB;

// Obtener la notaría creada
$notaria = Notaria::orderBy('created_at', 'desc')->first();

if (! $notaria) {
    echo "❌ No hay notarías registradas\n";
    exit(1);
}

$databaseName = 'atinet_notaria_'.$notaria->numero_notaria;

echo "════════════════════════════════════════════════════\n";
echo "🔧 REPARAR BD DEL TENANT: {$notaria->nombre}\n";
echo "════════════════════════════════════════════════════\n\n";

// Verificar si la BD existe
try {
    DB::statement("SELECT 1 FROM `{$databaseName}`.users LIMIT 1");
    echo "✅ Base de datos existe: {$databaseName}\n";
} catch (\Exception $e) {
    echo "❌ Base de datos NO existe: {$databaseName}\n";
    exit(1);
}

// Verificar si configuracion ya existe
try {
    DB::statement("SELECT 1 FROM `{$databaseName}`.configuracion LIMIT 1");
    echo "✅ Tabla configuracion ya existe\n\n";
} catch (\Exception $e) {
    echo "ℹ️  Tabla configuracion NO existe - creándola...\n\n";

    // Crear tabla configuracion
    $sql = "CREATE TABLE IF NOT EXISTS `{$databaseName}`.`configuracion` (
        `id` bigint unsigned NOT NULL AUTO_INCREMENT,
        `clave` varchar(255) NOT NULL,
        `valor` text,
        `descripcion` varchar(255) DEFAULT NULL,
        `created_at` timestamp NULL DEFAULT NULL,
        `updated_at` timestamp NULL DEFAULT NULL,
        PRIMARY KEY (`id`),
        UNIQUE KEY `configuracion_clave_unique` (`clave`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci";

    try {
        DB::statement($sql);
        echo "✅ Tabla configuracion creada\n\n";
    } catch (\Exception $e) {
        echo "❌ Error creando tabla configuracion: {$e->getMessage()}\n";
        exit(1);
    }
}

// Copiar datos de configuración
echo "📋 Insertando datos de configuración...\n";

$configs = [
    ['notaria_nombre', $notaria->nombre, 'Nombre de la notaría'],
    ['notaria_numero', $notaria->numero_notaria, 'Número de notaría'],
    ['modo_operacion', 'local', 'Modo de operación (local/online)'],
    ['ultima_sincronizacion', now()->toDateTimeString(), 'Última sincronización con central'],
];

foreach ($configs as [$clave, $valor, $descripcion]) {
    $sql = "INSERT INTO `{$databaseName}`.`configuracion`
            (`clave`, `valor`, `descripcion`, `created_at`, `updated_at`)
            VALUES (?, ?, ?, NOW(), NOW())
            ON DUPLICATE KEY UPDATE `valor` = VALUES(`valor`), `updated_at` = NOW()";
    try {
        DB::statement($sql, [$clave, $valor, $descripcion]);
        echo "   ✅ {$clave}: {$valor}\n";
    } catch (\Exception $e) {
        echo "   ❌ Error con {$clave}: {$e->getMessage()}\n";
    }
}

echo "\n";
echo "📊 VERIFICACIÓN FINAL:\n";
echo "─────────────────────────────────────────────────────\n";

// Contar registros en las tablas importantes
$tablas = ['users', 'configuracion', 'services', 'plan_services', 'tenant_services'];
foreach ($tablas as $tabla) {
    try {
        $count = DB::table("{$databaseName}.{$tabla}")->count();
        echo "   {$tabla}: {$count} registros\n";
    } catch (\Exception $e) {
        echo "   {$tabla}: ❌ Error\n";
    }
}

echo "\n";
echo "════════════════════════════════════════════════════\n";
echo "✅ REPARACIÓN COMPLETADA\n";
echo "════════════════════════════════════════════════════\n";
