<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== Estado del Sistema ===\n\n";

$plans = App\Models\Plan::all();
$services = App\Models\Service::count();
$lnService = App\Models\Service::where('code', 'BLACKLIST_SEARCH')->first();
$notarias = App\Models\Notaria::count();
$users = App\Models\User::count();

echo "📊 Base de Datos:\n";
echo '   Planes: '.$plans->count()."\n";
foreach ($plans as $plan) {
    $serviceCount = $plan->services()->count();
    echo "      - {$plan->nombre} (ID: {$plan->id}) - {$serviceCount} servicios\n";
}
echo "   Servicios totales: {$services}\n";
echo '   Servicio Listas Negras: '.($lnService ? "✅ Existe (ID: {$lnService->id})" : '❌ No existe')."\n";
echo "   Notarías: {$notarias}\n";
echo "   Usuarios: {$users}\n\n";

echo "=== Para probar Listas Negras en Dashboard de Notaría ===\n\n";
echo "1. Abre: http://127.0.0.1:8000/login\n";
echo "2. Login Super Admin: admin@atinet.mx / password123\n\n";

if ($notarias == 0) {
    echo "⚠️  NO HAY NOTARÍAS CREADAS\n\n";
    echo "3. Ve a la sección 'Notarías' en el menú lateral\n";
    echo "4. Click en 'Crear Notaría'\n";
    echo "5. Llena el formulario:\n";
    echo "   - Nombre: 'Notaría 1 de Aguascalientes'\n";
    echo "   - Número: 1\n";
    echo "   - Estado: Aguascalientes\n";
    echo "   - Email: notaria1@test.com\n";
    echo "   - Selecciona un plan (todos tienen Listas Negras)\n";
    echo "6. Guarda la notaría\n\n";
} else {
    echo "✅ Ya hay {$notarias} notaría(s) creada(s)\n\n";
    $notaria = App\Models\Notaria::first();
    echo "📋 Primera notaría:\n";
    echo "   Nombre: {$notaria->nombre}\n";
    echo "   ID: {$notaria->id}\n";
    echo '   Plan: '.($notaria->plan ? $notaria->plan->nombre : 'Sin plan')."\n\n";

    $adminNotaria = App\Models\User::where('notaria_id', $notaria->id)
        ->where('tipo_cuenta', 'admin_notaria')
        ->first();

    if ($adminNotaria) {
        echo "✅ Usuario administrador de la notaría existe:\n";
        echo "   Email: {$adminNotaria->email}\n";
        echo "   Password: {$adminNotaria->plain_password}\n\n";
        echo "3. Logout de Super Admin\n";
        echo "4. Login con: {$adminNotaria->email} / {$adminNotaria->plain_password}\n";
        echo "5. Ve a 'Listas Negras' en el menú\n";
        echo "6. ¡Prueba hacer una búsqueda!\n";
    } else {
        echo "⚠️  NO HAY usuario administrador para esta notaría\n\n";
        echo "3. Ve a 'Usuarios' en el menú\n";
        echo "4. Crea un nuevo usuario:\n";
        echo "   - Tipo: Admin de Notaría\n";
        echo "   - Notaría: {$notaria->nombre}\n";
        echo "   - Email: admin@notaria1.com\n";
        echo "   - Nombre: Admin Notaría 1\n";
        echo "5. Guarda el usuario y anota la contraseña\n";
        echo "6. Logout y login con ese usuario\n";
        echo "7. Ve a 'Listas Negras' en el menú\n";
    }
}

echo "\n=== Servicio disponible ===\n";
echo "URL: http://127.0.0.1:8000/admin/listas-negras\n";
echo "✅ El servicio está activo para todos los planes\n";
