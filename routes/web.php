<?php

use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Laravel\Fortify\Features;

Route::get('/', function () {
    return Inertia::render('welcome', [
        'canRegister' => Features::enabled(Features::registration()),
    ]);
})->name('home');

Route::get('dashboard', function () {
    $user = Auth::user();

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
                    'suscripciones_activas' => \App\Models\Subscription::whereIn('status', ['activa', 'trial'])->count(),
                    'suscripciones_trial' => \App\Models\Subscription::where('status', 'trial')->count(),
                    'suscripciones_vencidas' => \App\Models\Subscription::where('status', 'vencida')->count(),
                    'suscripciones_suspendidas' => \App\Models\Subscription::where('status', 'suspendida')->count(),
                ],
                'recent_subscriptions' => \App\Models\Subscription::with(['notaria', 'plan'])
                    ->latest()
                    ->take(5)
                    ->get(),
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

// Rutas de administración para super_admin
Route::middleware(['auth', 'verified'])->prefix('admin')->name('admin.')->group(function () {
    // Gestión de notarías
    Route::resource('notarias', \App\Http\Controllers\Admin\NotariaController::class);

    // Gestión de servicios por notaría (tenant services)
    Route::get('notarias/{notaria}/services', [\App\Http\Controllers\Admin\TenantServiceController::class, 'index'])->name('notarias.services.index');
    Route::post('notarias/{notaria}/services', [\App\Http\Controllers\Admin\TenantServiceController::class, 'store'])->name('notarias.services.store');
    Route::put('notarias/{notaria}/services/{tenantService}', [\App\Http\Controllers\Admin\TenantServiceController::class, 'update'])->name('notarias.services.update');
    Route::delete('notarias/{notaria}/services/{tenantService}', [\App\Http\Controllers\Admin\TenantServiceController::class, 'destroy'])->name('notarias.services.destroy');
    Route::post('notarias/{notaria}/services/{tenantService}/toggle', [\App\Http\Controllers\Admin\TenantServiceController::class, 'toggleEnabled'])->name('notarias.services.toggle');

    // Gestión de suscripciones
    Route::get('subscriptions', [\App\Http\Controllers\Admin\SubscriptionController::class, 'index'])->name('subscriptions.index');
    Route::get('subscriptions/create', [\App\Http\Controllers\Admin\SubscriptionController::class, 'create'])->name('subscriptions.create');
    Route::post('subscriptions', [\App\Http\Controllers\Admin\SubscriptionController::class, 'store'])->name('subscriptions.store');
    Route::get('subscriptions/{subscription}', [\App\Http\Controllers\Admin\SubscriptionController::class, 'show'])->name('subscriptions.show');
    Route::get('subscriptions/{subscription}/edit', [\App\Http\Controllers\Admin\SubscriptionController::class, 'edit'])->name('subscriptions.edit');
    Route::put('subscriptions/{subscription}', [\App\Http\Controllers\Admin\SubscriptionController::class, 'update'])->name('subscriptions.update');
    Route::post('subscriptions/{subscription}/change-status', [\App\Http\Controllers\Admin\SubscriptionController::class, 'changeStatus'])->name('subscriptions.change-status');
    Route::post('subscriptions/{subscription}/renew', [\App\Http\Controllers\Admin\SubscriptionController::class, 'renew'])->name('subscriptions.renew');

    // Gestión de planes
    Route::resource('plans', \App\Http\Controllers\Admin\PlanController::class);
    Route::post('plans/{plan}/toggle-active', [\App\Http\Controllers\Admin\PlanController::class, 'toggleActive'])->name('plans.toggle-active');

    // Gestión de servicios
    Route::resource('services', \App\Http\Controllers\Admin\ServiceController::class);
    Route::post('services/{service}/toggle-active', [\App\Http\Controllers\Admin\ServiceController::class, 'toggleActive'])->name('services.toggle-active');

    // Gestión de servicios por plan
    Route::get('plans/{plan}/services', [\App\Http\Controllers\Admin\PlanServiceController::class, 'index'])->name('plans.services.index');
    Route::post('plans/{plan}/services', [\App\Http\Controllers\Admin\PlanServiceController::class, 'store'])->name('plans.services.store');
    Route::put('plans/{plan}/services/{service}', [\App\Http\Controllers\Admin\PlanServiceController::class, 'update'])->name('plans.services.update');
    Route::delete('plans/{plan}/services/{service}', [\App\Http\Controllers\Admin\PlanServiceController::class, 'destroy'])->name('plans.services.destroy');
    Route::post('plans/{plan}/services/reorder', [\App\Http\Controllers\Admin\PlanServiceController::class, 'reorder'])->name('plans.services.reorder');
    Route::post('plans/{plan}/services/bulk-assign', [\App\Http\Controllers\Admin\PlanServiceController::class, 'bulkAssign'])->name('plans.services.bulk-assign');

    // Gestión de usuarios del sistema
    Route::resource('users', \App\Http\Controllers\Admin\UserController::class);
    Route::get('users/reports', [\App\Http\Controllers\Admin\UserController::class, 'reports'])->name('users.reports');

    // Configuración del sistema
    Route::resource('settings', \App\Http\Controllers\Admin\SettingsController::class);
    Route::get('settings/logs', [\App\Http\Controllers\Admin\SettingsController::class, 'logs'])->name('settings.logs');
    Route::post('settings/cache/clear', [\App\Http\Controllers\Admin\SettingsController::class, 'clearCache'])->name('settings.cache.clear');
    Route::post('settings/optimize', [\App\Http\Controllers\Admin\SettingsController::class, 'optimize'])->name('settings.optimize');

    // Rutas para gestión de contraseñas
    Route::post('users/{user}/reveal-password', [\App\Http\Controllers\Admin\PasswordController::class, 'revealPassword'])->name('users.reveal-password');
    Route::post('users/{user}/reset-password', [\App\Http\Controllers\Admin\PasswordController::class, 'resetPassword'])->name('users.reset-password');

    // === BÚSQUEDAS EN LISTAS NEGRAS (OFAC + SAT) - SUPERADMIN ===
    // Estas rutas permiten a los superadministradores realizar búsquedas
    // sin restricciones de servicios en las listas negras OFAC y SAT

    // Página de búsqueda
    Route::get('listas-negras', function () {
        return Inertia::render('Admin/ListasNegras/Search');
    })->name('listas-negras');

    // API endpoints para búsquedas
    Route::prefix('search')->name('search.')->group(function () {
        Route::post('persona-fisica', [\App\Http\Controllers\SuperAdmin\SuperAdminSearchController::class, 'searchPersonaFisica'])->name('persona-fisica');
        Route::post('persona-moral', [\App\Http\Controllers\SuperAdmin\SuperAdminSearchController::class, 'searchPersonaMoral'])->name('persona-moral');
        Route::post('rfc', [\App\Http\Controllers\SuperAdmin\SuperAdminSearchController::class, 'searchRfc'])->name('rfc');
        Route::post('combined', [\App\Http\Controllers\SuperAdmin\SuperAdminSearchController::class, 'searchCombined'])->name('combined');
    });
});

require __DIR__.'/settings.php';

// 🧪 EJEMPLOS DE ROLES Y GLOBAL SCOPES (Solo desarrollo/testing)
if (app()->environment(['local', 'testing'])) {
    require __DIR__.'/examples.php';
}
