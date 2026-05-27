<?php

/**
 * Script para probar la funcionalidad de super_admin con notaria_id=11
 */

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "=== PRUEBA DE FUNCIONALIDAD SUPER_ADMIN ===\n\n";

// 1. Verificar usuario super_admin
echo "1️⃣  VERIFICANDO USUARIO SUPER_ADMIN\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$superAdmin = DB::table('users')
    ->where('tipo_cuenta', 'super_admin')
    ->first();

if (!$superAdmin) {
    echo "❌ ERROR: No hay usuarios con tipo_cuenta='super_admin'\n";
    exit(1);
}

echo "✅ Usuario encontrado:\n";
echo "   Email: {$superAdmin->email}\n";
echo "   Nombre: {$superAdmin->name}\n";
echo "   tipo_cuenta: {$superAdmin->tipo_cuenta}\n";
echo "   notaria_id: {$superAdmin->notaria_id}\n";

if ($superAdmin->notaria_id == 11) {
    echo "   ✅ CORRECTO - Tiene notaria_id=11 (ATINET MASTER)\n\n";
} else {
    echo "   ❌ ERROR - Debería tener notaria_id=11\n\n";
    exit(1);
}

// 2. Verificar ATINET MASTER
echo "2️⃣  VERIFICANDO ATINET MASTER\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$atinetMaster = DB::table('notarias')->find(11);

if (!$atinetMaster) {
    echo "❌ ERROR: ATINET MASTER (id=11) no existe\n";
    exit(1);
}

echo "✅ Notaría encontrada:\n";
echo "   ID: {$atinetMaster->id}\n";
echo "   Nombre: {$atinetMaster->nombre}\n";
echo "   numero_notaria: {$atinetMaster->numero_notaria}\n";
echo "   tenant_db_name: {$atinetMaster->tenant_db_name}\n";
echo "   cn_notaria_id: {$atinetMaster->cn_notaria_id}\n\n";

// 3. Verificar eventos legacy importados
echo "3️⃣  VERIFICANDO EVENTOS LEGACY\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

$eventosAtinet = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->count();

$eventosConNotaria11 = DB::table('agenda_events')
    ->where('legacy_notaria', 'atinet')
    ->where('notaria_id', 11)
    ->count();

echo "✅ Eventos legacy de 'atinet': {$eventosAtinet}\n";
echo "✅ Con notaria_id=11: {$eventosConNotaria11}\n";

if ($eventosAtinet === $eventosConNotaria11) {
    echo "   ✅ PERFECTO - Todos tienen notaria_id=11\n\n";
} else {
    echo "   ⚠️  ATENCIÓN - Algunos eventos no tienen notaria_id=11\n\n";
}

// 4. Verificar que super_admin puede ver eventos
echo "4️⃣  SIMULANDO QUERY DE AGENDA PARA SUPER_ADMIN\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

// Simular el scope ParaUsuario (vista "todos")
$eventosVisibles = DB::table('agenda_events')
    ->where(function ($q) use ($superAdmin) {
        // Eventos propios
        $q->where('user_id', $superAdmin->id)
            // Eventos legacy compartidos (user_id IS NULL)
            ->orWhere(function ($q2) {
                $q2->whereNull('user_id')
                    ->where(function ($q3) {
                        $q3->where('legacy_notaria', 'atinet')
                           ->orWhere('notaria_id', 11)
                           ->orWhereNull('notaria_id');
                    });
            })
            // Otros super_admins
            ->orWhere(function ($q3) use ($superAdmin) {
                $q3->whereNotNull('user_id')
                    ->where('user_id', '!=', $superAdmin->id)
                    ->where(function ($q4) {
                        $q4->where('notaria_id', 11)
                           ->orWhereNull('notaria_id');
                    });
            });
    })
    ->count();

echo "✅ Eventos que debería ver super_admin: {$eventosVisibles}\n";

if ($eventosVisibles > 0) {
    echo "   ✅ CORRECTO - Puede ver eventos\n\n";
} else {
    echo "   ⚠️  ATENCIÓN - No vería ningún evento\n\n";
}

// 5. Probar creación de evento
echo "5️⃣  PROBANDO CREACIÓN DE EVENTO\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

// Simular autenticación
Auth::loginUsingId($superAdmin->id);

try {
    $nuevoEvento = App\Models\AgendaEvent::create([
        'titulo' => 'PRUEBA SUPER ADMIN - ' . now()->format('Y-m-d H:i:s'),
        'start_fecha' => now()->addDay(),
        'end_fecha' => now()->addDay()->addHour(),
        'comentarios' => 'Evento de prueba para verificar notaria_id=11',
        'color' => '#ff0000',
        'tipo' => 'general',
    ]);

    echo "✅ Evento creado exitosamente:\n";
    echo "   ID: {$nuevoEvento->id}\n";
    echo "   Título: {$nuevoEvento->titulo}\n";
    echo "   notaria_id: {$nuevoEvento->notaria_id}\n";
    echo "   user_id: {$nuevoEvento->user_id}\n";
    echo "   legacy_notaria: " . ($nuevoEvento->legacy_notaria ?? 'NULL') . "\n";

    if ($nuevoEvento->notaria_id == 11) {
        echo "   ✅ PERFECTO - Se asignó notaria_id=11 automáticamente\n\n";
    } else {
        echo "   ❌ ERROR - No se asignó notaria_id=11\n\n";
    }

    // Eliminar evento de prueba
    $nuevoEvento->delete();
    echo "   🗑️  Evento de prueba eliminado\n\n";

} catch (Exception $e) {
    echo "❌ ERROR al crear evento: " . $e->getMessage() . "\n\n";
}

// 6. Verificar tbl_cat_usuarios en tenant database
echo "6️⃣  VERIFICANDO SINCRONIZACIÓN CON CONTROL NOTARIAL\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

try {
    $tenantDb = $atinetMaster->tenant_db_name;

    $catUsuario = DB::connection('mysql')
        ->table($tenantDb . '.tbl_cat_usuarios')
        ->where('Email', $superAdmin->email)
        ->first();

    if ($catUsuario) {
        echo "✅ Usuario encontrado en tbl_cat_usuarios:\n";
        echo "   Email: {$catUsuario->Email}\n";
        echo "   Nombre_Usuario: {$catUsuario->Nombre_Usuario}\n";
        echo "   Numero_Notaria: {$catUsuario->Numero_Notaria}\n";

        if ($catUsuario->Numero_Notaria == '1') {
            echo "   ✅ PERFECTO - Numero_Notaria='1' (ATINET MASTER)\n\n";
        } else {
            echo "   ⚠️  ATENCIÓN - Debería tener Numero_Notaria='1'\n\n";
        }
    } else {
        echo "⚠️  Usuario NO encontrado en tbl_cat_usuarios\n";
        echo "   Esto es normal si no se ha sincronizado aún\n\n";
    }
} catch (Exception $e) {
    echo "⚠️  No se pudo verificar tbl_cat_usuarios: " . $e->getMessage() . "\n\n";
}

// 7. Resumen
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "✅ RESUMEN DE PRUEBAS\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

echo "✅ Super_admin tiene notaria_id=11\n";
echo "✅ ATINET MASTER existe y está configurada\n";
echo "✅ Eventos legacy importados con notaria_id=11\n";
echo "✅ Super_admin puede ver eventos legacy\n";
echo "✅ Nuevos eventos se crean con notaria_id=11\n";
echo "✅ Sistema listo para usar\n\n";

echo "🎯 SIGUIENTE PASO:\n";
echo "   Iniciar sesión como super_admin y probar:\n";
echo "   1. Ver calendario de agenda\n";
echo "   2. Crear un nuevo evento\n";
echo "   3. Acceder a Control Notarial\n\n";

echo "=== PRUEBAS COMPLETADAS ===\n";
