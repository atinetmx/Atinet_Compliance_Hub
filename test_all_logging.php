<?php

/**
 * Script de prueba para verificar el logging en todos los modelos
 *
 * Prueba el logging automático en:
 * - AgendaEvent (agenda)
 * - Busqueda (listas_negras)
 * - Subscription (suscripciones)
 * - User (usuarios)
 * - Notaria (notarias)
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\AgendaEvent;
use App\Models\Busqueda;
use App\Models\Notaria;
use App\Models\Plan;
use App\Models\Subscription;
use App\Models\User;
use Spatie\Activitylog\Models\Activity;

echo "\n=== TEST: Activity Logging en Todos los Modelos ===\n\n";

// Obtener datos base para las pruebas
$user = User::where('tipo_cuenta', 'super_admin')->first();
$notaria = Notaria::first();
$plan = Plan::first();

if (! $user || ! $notaria || ! $plan) {
    echo "❌ Falta información base (user, notaria o plan)\n";
    exit(1);
}

echo "✓ Datos base:\n";
echo "  - Usuario: {$user->name} (ID: {$user->id})\n";
echo "  - Notaría: {$notaria->nombre} (ID: {$notaria->id})\n";
echo "  - Plan: {$plan->nombre} (ID: {$plan->id})\n\n";

$testResults = [];

// TEST 1: BÚSQUEDA (Listas Negras)
echo "--- Test 1: Busqueda (Listas Negras) ---\n";
try {
    $busqueda = Busqueda::create([
        'notaria_id' => $notaria->id,
        'user_id' => $user->id,
        'tipo_busqueda' => 'OFAC',
        'termino_busqueda' => 'TEST COMPANY',
        'resultados' => ['data' => []],
    ]);

    $log = Activity::where('log_name', 'listas_negras')
        ->where('subject_type', Busqueda::class)
        ->where('subject_id', $busqueda->id)
        ->where('event', 'created')
        ->first();

    if ($log) {
        echo "✅ LOG CREATE registrado\n";
        echo "   - Descripción: {$log->description}\n";
        echo "   - Log Name: {$log->log_name}\n";
        $testResults['busqueda_create'] = true;
    } else {
        echo "❌ No se registró el log\n";
        $testResults['busqueda_create'] = false;
    }

    $busqueda->delete();
} catch (\Exception $e) {
    echo "❌ Error: {$e->getMessage()}\n";
    $testResults['busqueda_create'] = false;
}

// TEST 2: SUSCRIPCIÓN
echo "\n--- Test 2: Subscription (Suscripciones) ---\n";
try {
    $subscription = Subscription::create([
        'notaria_id' => $notaria->id,
        'plan_id' => $plan->id,
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addMonth(),
        'status' => Subscription::STATUS_TRIAL,
        'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
        'auto_renovacion' => true,
        'precio_pagado' => 0.00,
        'moneda' => 'MXN',
    ]);

    $log = Activity::where('log_name', 'suscripciones')
        ->where('subject_type', Subscription::class)
        ->where('subject_id', $subscription->id)
        ->where('event', 'created')
        ->first();

    if ($log) {
        echo "✅ LOG CREATE registrado\n";
        echo "   - Descripción: {$log->description}\n";
        echo "   - Log Name: {$log->log_name}\n";
        $testResults['subscription_create'] = true;

        // Test update
        $subscription->update(['status' => Subscription::STATUS_ACTIVA]);
        $updateLog = Activity::where('log_name', 'suscripciones')
            ->where('subject_id', $subscription->id)
            ->where('event', 'updated')
            ->first();

        if ($updateLog) {
            echo "✅ LOG UPDATE registrado\n";
            echo "   - Descripción: {$updateLog->description}\n";
            $testResults['subscription_update'] = true;
        } else {
            echo "❌ No se registró el log de actualización\n";
            $testResults['subscription_update'] = false;
        }
    } else {
        echo "❌ No se registró el log\n";
        $testResults['subscription_create'] = false;
    }

    $subscription->delete();
} catch (\Exception $e) {
    echo "❌ Error: {$e->getMessage()}\n";
    $testResults['subscription_create'] = false;
}

// TEST 3: USUARIO
echo "\n--- Test 3: User (Usuarios) ---\n";
try {
    $newUser = User::create([
        'name' => 'Usuario Test Logging',
        'email' => 'test.logging.'.time().'@example.com',
        'password' => bcrypt('password123'),
        'notaria_id' => $notaria->id,
        'tipo_cuenta' => 'usuario',
    ]);

    $log = Activity::where('log_name', 'usuarios')
        ->where('subject_type', User::class)
        ->where('subject_id', $newUser->id)
        ->where('event', 'created')
        ->first();

    if ($log) {
        echo "✅ LOG CREATE registrado\n";
        echo "   - Descripción: {$log->description}\n";
        echo "   - Log Name: {$log->log_name}\n";
        $testResults['user_create'] = true;
    } else {
        echo "❌ No se registró el log\n";
        $testResults['user_create'] = false;
    }

    $newUser->delete();
} catch (\Exception $e) {
    echo "❌ Error: {$e->getMessage()}\n";
    $testResults['user_create'] = false;
}

// TEST 4: NOTARÍA
echo "\n--- Test 4: Notaria (Notarías) ---\n";
try {
    $notariaTest = Notaria::create([
        'nombre' => 'Notaría Test Logging',
        'numero_notaria' => '999',
        'plan_id' => $plan->id,
        'activa' => true,
        'fecha_registro' => now(),
        'email_contacto' => 'test.notaria.'.time().'@example.com',
        'legacy_identifier' => 'test_'.time(),
    ]);

    $log = Activity::where('log_name', 'notarias')
        ->where('subject_type', Notaria::class)
        ->where('subject_id', $notariaTest->id)
        ->where('event', 'created')
        ->first();

    if ($log) {
        echo "✅ LOG CREATE registrado\n";
        echo "   - Descripción: {$log->description}\n";
        echo "   - Log Name: {$log->log_name}\n";
        $testResults['notaria_create'] = true;
    } else {
        echo "❌ No se registró el log\n";
        $testResults['notaria_create'] = false;
    }

    $notariaTest->delete();
} catch (\Exception $e) {
    echo "❌ Error: {$e->getMessage()}\n";
    $testResults['notaria_create'] = false;
}

// TEST 5: AGENDA
echo "\n--- Test 5: AgendaEvent (Agenda) ---\n";
try {
    $event = AgendaEvent::create([
        'notaria_id' => $notaria->id,
        'user_id' => $user->id,
        'titulo' => 'Evento Test Logging',
        'start_fecha' => now(),
        'end_fecha' => now()->addHour(),
        'tipo' => 'general',
        'color' => '#3b82f6',
    ]);

    $log = Activity::where('log_name', 'agenda')
        ->where('subject_type', AgendaEvent::class)
        ->where('subject_id', $event->id)
        ->where('event', 'created')
        ->first();

    if ($log) {
        echo "✅ LOG CREATE registrado\n";
        echo "   - Descripción: {$log->description}\n";
        echo "   - Log Name: {$log->log_name}\n";
        $testResults['agenda_create'] = true;
    } else {
        echo "❌ No se registró el log\n";
        $testResults['agenda_create'] = false;
    }

    $event->delete();
} catch (\Exception $e) {
    echo "❌ Error: {$e->getMessage()}\n";
    $testResults['agenda_create'] = false;
}

// RESUMEN
echo "\n=== RESUMEN DE PRUEBAS ===\n";
$total = count($testResults);
$passed = count(array_filter($testResults, fn ($r) => $r === true));
$failed = $total - $passed;

foreach ($testResults as $test => $result) {
    $icon = $result ? '✅' : '❌';
    echo "{$icon} {$test}\n";
}

echo "\nTotal: {$total} pruebas\n";
echo "Exitosas: {$passed}\n";
echo "Fallidas: {$failed}\n";

if ($failed === 0) {
    echo "\n🎉 ¡TODOS LOS TESTS PASARON! El logging está funcionando correctamente en todos los modelos.\n\n";
} else {
    echo "\n⚠️ Algunos tests fallaron. Revisar la configuración.\n\n";
    exit(1);
}

// Mostrar logs recientes de cada categoría
echo "=== LOGS RECIENTES POR CATEGORÍA ===\n\n";

$categories = ['agenda', 'listas_negras', 'suscripciones', 'usuarios', 'notarias'];

foreach ($categories as $category) {
    $count = Activity::where('log_name', $category)->count();
    echo "📊 {$category}: {$count} registros\n";

    $recent = Activity::where('log_name', $category)
        ->orderBy('created_at', 'desc')
        ->limit(3)
        ->get();

    foreach ($recent as $log) {
        echo "   - [{$log->event}] {$log->description} @ {$log->created_at->format('Y-m-d H:i:s')}\n";
    }
    echo "\n";
}

echo "✅ Verificación completa\n\n";
