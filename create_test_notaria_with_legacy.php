<?php

/**
 * Script para crear notaría de prueba con legacy_identifier
 * REPLICANDO EXACTAMENTE el flujo del NotariaController
 *
 * ADVERTENCIA: Esto es para pruebas. En producción usa la UI.
 */

require_once __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\EstadoMexico;
use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

echo "\n";
echo "═════════════════════════════════════════════════════════════════════════\n";
echo "   CREAR NOTARÍA DE PRUEBA CON LEGACY_IDENTIFIER (PROGRAMÁTICAMENTE)     \n";
echo "═════════════════════════════════════════════════════════════════════════\n";
echo "\n";

// Configuración de la notaría de prueba
$config = [
    'nombre' => 'Notaría 10 de Cuernavaca (PRUEBA LEGACY)',
    'numero_notaria' => '10_test',
    'legacy_identifier' => '10Cuernavaca', // ← KEY: vincula con historial legacy
    'plan_id' => 1, // Asegúrate que existe
    'contacto_principal' => 'Juan Pérez (Prueba)',
    'email_contacto' => 'notaria10test@atinet.com.mx',
    'telefono' => '777-123-4567',
    'direccion' => 'Av. Principal #123, Cuernavaca',
    'notas_internas' => 'Notaría de prueba para verificar historial legacy del sistema antiguo.',
    'activa' => true,
    'estado' => 'Morelos',
    'municipio' => 'Cuernavaca',
    'codigo_postal' => '62000',
    'colonia' => 'Centro',
    'calle' => 'Av. Principal',
];

echo "📋 DATOS DE LA NOTARÍA:\n";
echo "────────────────────────────────────────────────────────────────────────\n";
foreach ($config as $key => $value) {
    if (is_bool($value)) {
        $value = $value ? 'Sí' : 'No';
    }
    printf("  %-30s: %s\n", ucfirst(str_replace('_', ' ', $key)), $value);
}
echo "\n";

// Verificar que el plan existe
$plan = Plan::find($config['plan_id']);
if (! $plan) {
    echo "❌ ERROR: El plan ID {$config['plan_id']} no existe.\n";
    echo "   Crea un plan primero o ajusta el plan_id.\n\n";
    exit(1);
}

// Verificar que el email no esté en uso
$existingUser = User::where('email', $config['email_contacto'])->first();
if ($existingUser) {
    echo "❌ ERROR: El email {$config['email_contacto']} ya está en uso.\n";
    echo "   Usa otro email o elimina el usuario existente.\n\n";
    exit(1);
}

// Verificar que el número de notaría no esté en uso
$existingNotaria = Notaria::where('numero_notaria', $config['numero_notaria'])->first();
if ($existingNotaria) {
    echo "❌ ERROR: El número de notaría {$config['numero_notaria']} ya está en uso.\n";
    echo "   Usa otro número o elimina la notaría existente.\n\n";
    exit(1);
}

echo "✅ Verificaciones pasadas. Procediendo con la creación...\n\n";

DB::beginTransaction();

try {
    // ═══════════════════════════════════════════════════════════════════
    // PASO 1: CREAR REGISTRO DE NOTARÍA
    // ═══════════════════════════════════════════════════════════════════
    echo "📝 PASO 1: Creando registro de notaría...\n";

    $notaria = Notaria::create(array_merge($config, [
        'fecha_registro' => now(),
        'total_usuarios' => 0,
        'busquedas_mes_actual' => 0,
    ]));

    echo "   ✓ Notaría creada con ID: {$notaria->id}\n\n";

    // ═══════════════════════════════════════════════════════════════════
    // PASO 2: CREAR USUARIO ADMINISTRADOR
    // ═══════════════════════════════════════════════════════════════════
    echo "👤 PASO 2: Creando usuario administrador...\n";

    $tempPassword = 'admin123';
    $adminUser = User::create([
        'name' => $config['contacto_principal'],
        'email' => $config['email_contacto'],
        'password' => Hash::make($tempPassword),
        'recoverable_password' => Crypt::encryptString($tempPassword),
        'tipo_cuenta' => 'admin_notaria',
        'notaria_id' => $notaria->id,
        'email_verified_at' => now(),
    ]);

    echo "   ✓ Usuario creado: {$adminUser->email}\n";
    echo "   ✓ Contraseña temporal: {$tempPassword}\n\n";

    // ═══════════════════════════════════════════════════════════════════
    // PASO 3: CREAR BASE DE DATOS DEL TENANT
    // ═══════════════════════════════════════════════════════════════════
    echo "🗄️  PASO 3: Creando base de datos del tenant...\n";

    $estadoCodigo = EstadoMexico::getCodeFromName($notaria->estado);
    $databaseName = "atinet_{$estadoCodigo}_notaria_{$notaria->numero_notaria}";

    echo "   Nombre de BD: {$databaseName}\n";

    // Crear BD
    DB::statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    echo "   ✓ Base de datos creada\n";

    // Configurar conexión temporal
    config(['database.connections.tenant_temp' => [
        'driver' => 'mysql',
        'host' => config('database.connections.mysql.host'),
        'port' => config('database.connections.mysql.port'),
        'database' => $databaseName,
        'username' => config('database.connections.mysql.username'),
        'password' => config('database.connections.mysql.password'),
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ]]);

    echo "   ⚙️  Ejecutando migraciones en tenant...\n";

    try {
        \Illuminate\Support\Facades\Artisan::call('migrate', [
            '--database' => 'tenant_temp',
            '--path' => 'database/migrations',
            '--force' => true,
        ]);
        echo "   ✓ Migraciones ejecutadas\n";
    } catch (\Exception $e) {
        echo '   ⚠️  Error en migraciones (se continuará): '.$e->getMessage()."\n";
    }

    echo "\n";

    // ═══════════════════════════════════════════════════════════════════
    // PASO 4: CREAR SUSCRIPCIÓN TRIAL
    // ═══════════════════════════════════════════════════════════════════
    echo "💳 PASO 4: Creando suscripción trial...\n";

    $subscription = Subscription::create([
        'notaria_id' => $notaria->id,
        'plan_id' => $config['plan_id'],
        'status' => 'trial',
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addMonth(),
        'precio_pagado' => $plan->precio_mensual,
        'moneda' => 'MXN',
        'ciclo_facturacion' => 'mensual',
        'auto_renovacion' => true,
    ]);

    echo "   ✓ Suscripción creada (trial por 1 mes)\n";
    echo '   ✓ Vencimiento: '.$subscription->fecha_vencimiento->format('d/m/Y')."\n\n";

    // ═══════════════════════════════════════════════════════════════════
    // PASO 5: ACTUALIZAR CONTADOR DE USUARIOS
    // ═══════════════════════════════════════════════════════════════════
    $notaria->increment('total_usuarios');

    // Obtener estadísticas del historial legacy
    echo "📊 PASO 5: Verificando historial legacy vinculado...\n";

    $service = new \App\Services\BusquedasLegacyService;
    $stats = $service->getEstadisticas($config['legacy_identifier']);

    echo "   ✓ Legacy ID: {$config['legacy_identifier']}\n";
    echo '   ✓ Total búsquedas: '.number_format($stats['total'])."\n";
    echo '   ✓ OFAC: '.number_format($stats['por_fuente']['ofac'])."\n";
    echo '   ✓ SAT: '.number_format($stats['por_fuente']['sat'])."\n";

    // Actualizar campos legacy en la notaría
    $notaria->update([
        'legacy_busquedas_count' => $stats['total'],
        'legacy_ultima_busqueda' => $stats['ultima_busqueda'],
    ]);

    echo "   ✓ Campos legacy actualizados\n\n";

    DB::commit();

    echo "═════════════════════════════════════════════════════════════════════════\n";
    echo "   ✅ NOTARÍA CREADA EXITOSAMENTE                                         \n";
    echo "═════════════════════════════════════════════════════════════════════════\n";
    echo "\n";
    echo "📌 INFORMACIÓN IMPORTANTE:\n";
    echo "────────────────────────────────────────────────────────────────────────\n";
    echo "  ID Notaría: {$notaria->id}\n";
    echo "  Nombre: {$notaria->nombre}\n";
    echo "  Número: {$notaria->numero_notaria}\n";
    echo "  Legacy ID: {$notaria->legacy_identifier}\n";
    echo "  Base de datos: {$databaseName}\n";
    echo "\n";
    echo "  Usuario admin: {$adminUser->email}\n";
    echo "  Contraseña: {$tempPassword}\n";
    echo "\n";
    echo "  Plan: {$plan->nombre}\n";
    echo "  Suscripción: Trial (1 mes)\n";
    echo '  Vence: '.$subscription->fecha_vencimiento->format('d/m/Y')."\n";
    echo "\n";
    echo "🔗 SIGUIENTE PASO:\n";
    echo "────────────────────────────────────────────────────────────────────────\n";
    echo "  Accede a: /admin/notarias/{$notaria->id}\n";
    echo "  Verás la sección 'Historial Sistema Legacy' con ".number_format($stats['total'])." búsquedas\n";
    echo "\n";

} catch (\Exception $e) {
    DB::rollBack();

    echo "\n";
    echo "═════════════════════════════════════════════════════════════════════════\n";
    echo "   ❌ ERROR AL CREAR NOTARÍA                                              \n";
    echo "═════════════════════════════════════════════════════════════════════════\n";
    echo "\n";
    echo 'Error: '.$e->getMessage()."\n";
    echo "\nStack trace:\n".$e->getTraceAsString()."\n\n";
    exit(1);
}
