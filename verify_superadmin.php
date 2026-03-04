<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 Verificando configuración de SuperAdmin...\n\n";

$user = App\Models\User::first();

if (! $user) {
    echo "❌ No hay usuarios en el sistema\n";
    exit(1);
}

echo "Usuario: {$user->email}\n";
echo "ID: {$user->id}\n";
echo 'Tipo de cuenta: '.($user->tipo_cuenta ?? 'NO DEFINIDO')."\n";
echo '¿Es SuperAdmin?: '.($user->isSuperAdmin() ? '✅ SÍ' : '❌ NO')."\n\n";

if (! $user->isSuperAdmin()) {
    echo "⚠️  El usuario NO es SuperAdmin\n";
    echo "💡 Corrigiendo...\n\n";

    $user->tipo_cuenta = 'super_admin';
    $user->save();

    echo "✅ Usuario actualizado a SuperAdmin\n";
    echo "   tipo_cuenta: {$user->tipo_cuenta}\n\n";
} else {
    echo "✅ El usuario YA es SuperAdmin\n\n";
}

echo "🎉 Todo listo. Como SuperAdmin:\n";
echo "   - NO necesita notaría asociada\n";
echo "   - NO necesita suscripción activa\n";
echo "   - Tiene acceso ilimitado a todos los servicios\n";
echo "   - Los middlewares de suscripción y servicios hacen bypass automático\n\n";

echo "🔥 Ahora puedes hacer búsquedas sin error 403\n";
