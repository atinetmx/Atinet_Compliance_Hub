<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;

echo "=======================================================================\n";
echo "    VERIFICACION DE USUARIOS IMPORTADOS\n";
echo "=======================================================================\n\n";

$totalUsuarios = User::count();
$superAdmins = User::where('tipo_cuenta', 'super_admin')->count();

echo "Total de usuarios en el sistema: {$totalUsuarios}\n";
echo "Total de SuperAdmins: {$superAdmins}\n\n";

echo "Usuarios Atinet importados (SuperAdmins sin notaría):\n";
echo "-----------------------------------------------------------------------\n";

$usuariosAtinet = User::where('tipo_cuenta', 'super_admin')
    ->whereNull('notaria_id')
    ->orderBy('created_at', 'desc')
    ->get();

foreach ($usuariosAtinet as $user) {
    echo sprintf(
        "  ✓ %-25s | %-30s | %s\n",
        $user->name,
        $user->email,
        $user->created_at->format('Y-m-d H:i:s')
    );
}

echo "\nTotal usuarios Atinet importados: {$usuariosAtinet->count()}\n";
echo "=======================================================================\n";
