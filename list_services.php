<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Servicios disponibles ===\n\n";
$services = App\Models\Service::select('code', 'name')->get();

foreach ($services as $service) {
    echo "  {$service->code} - {$service->name}\n";
}

echo "\n=== Usuario de la notaría ===\n\n";
$user = App\Models\User::where('email', 'leinad@notaria1.com')->first();
if ($user) {
    echo "Email: {$user->email}\n";
    echo "Nombre: {$user->name}\n";
    echo "Tipo cuenta: {$user->tipo_cuenta}\n";
    echo "Plain password: " . ($user->plain_password ?: 'No disponible') . "\n\n";
    echo "⚠️  Si no tienes la contraseña, debes:\n";
    echo "1. Login como Super Admin\n";
    echo "2. Ir a Usuarios\n";
    echo "3. Editar el usuario o usar 'Revelar contraseña'\n";
    echo "   O resetear la contraseña a una nueva\n";
}
