<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    $user = auth()->user();

    // Debug: verificar que el usuario exista y tenga tipo_cuenta
    if (! $user) {
        return response()->json(['error' => 'No user authenticated']);
    }

    if (! $user->tipo_cuenta) {
        return response()->json(['error' => 'No tipo_cuenta defined', 'user' => $user]);
    }

    // Redireccionar según el tipo de cuenta
    switch ($user->tipo_cuenta) {
        case 'super_admin':
            return Inertia::render('SuperAdminDashboard', [
                'stats' => [
                    'total_notarias' => \App\Models\Notaria::count(),
                    'total_usuarios' => \App\Models\User::count(),
                    'total_busquedas' => \App\Models\Busqueda::withoutGlobalScopes()->count(),
                    'suscripciones_activas' => \App\Models\Subscription::where('status', 'activa')->count(),
                ],
            ]);

        case 'admin_notaria':
        case 'usuario_notaria':
            return Inertia::render('NotariaDashboard', [
                'notaria' => $user->notaria,
                'stats' => [
                    'busquedas_mes' => \App\Models\Busqueda::whereMonth('created_at', now()->month)->count(),
                    'busquedas_hoy' => \App\Models\Busqueda::whereDate('created_at', today())->count(),
                    'usuarios_notaria' => \App\Models\User::where('notaria_id', $user->notaria_id)->count(),
                ],
            ]);

        case 'invitado':
            return Inertia::render('InvitadoDashboard', [
                'notaria' => $user->notaria,
            ]);

        default:
            // Fallback al dashboard normal
            return Inertia::render('dashboard');
    }
})->middleware(['auth', 'verified'])->name('dashboard');

require __DIR__.'/settings.php';

// 🧪 EJEMPLOS DE ROLES Y GLOBAL SCOPES (Solo desarrollo/testing)
if (app()->environment(['local', 'testing'])) {
    require __DIR__.'/examples.php';
}
