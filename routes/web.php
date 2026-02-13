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

    // Reportes y estadísticas de uso de servicios
    Route::prefix('reports')->name('reports.')->group(function () {
        Route::get('/', [\App\Http\Controllers\Admin\ReportsController::class, 'index'])->name('index');
        Route::get('service-usage', [\App\Http\Controllers\Admin\ReportsController::class, 'serviceUsage'])->name('service-usage');
        Route::get('notarias/{notaria}/stats', [\App\Http\Controllers\Admin\ReportsController::class, 'notariaStats'])->name('notaria-stats');
        Route::get('notarias-comparison', [\App\Http\Controllers\Admin\ReportsController::class, 'notariasComparison'])->name('notarias-comparison');
        Route::get('usage-trends', [\App\Http\Controllers\Admin\ReportsController::class, 'usageTrends'])->name('usage-trends');
        Route::get('top-services', [\App\Http\Controllers\Admin\ReportsController::class, 'topServices'])->name('top-services');
        Route::get('near-limit', [\App\Http\Controllers\Admin\ReportsController::class, 'notariasNearLimit'])->name('near-limit');
        Route::get('export', [\App\Http\Controllers\Admin\ReportsController::class, 'export'])->name('export');
    });

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

    // API endpoints para búsquedas (protegidas por validación de suscripción y límites de servicio)
    Route::prefix('search')->name('search.')->middleware(['subscription'])->group(function () {
        // Búsquedas que usan OFAC como servicio principal (también pueden incluir SAT)
        Route::post('persona-fisica', [\App\Http\Controllers\SuperAdmin\SuperAdminSearchController::class, 'searchPersonaFisica'])
            ->middleware('service:BLACKLIST_OFAC')
            ->name('persona-fisica');
        Route::post('persona-moral', [\App\Http\Controllers\SuperAdmin\SuperAdminSearchController::class, 'searchPersonaMoral'])
            ->middleware('service:BLACKLIST_OFAC')
            ->name('persona-moral');
        Route::post('combined', [\App\Http\Controllers\SuperAdmin\SuperAdminSearchController::class, 'searchCombined'])
            ->middleware('service:BLACKLIST_OFAC')
            ->name('combined');

        // Búsqueda exclusiva de SAT (solo RFC)
        Route::post('rfc', [\App\Http\Controllers\SuperAdmin\SuperAdminSearchController::class, 'searchRfc'])
            ->middleware('service:BLACKLIST_SAT')
            ->name('rfc');
    });

    // Generación de PDFs para resultados de búsqueda
    // NOTA: Los PDFs NO consumen límites porque son resultado de búsquedas ya realizadas
    Route::prefix('pdf')->name('pdf.')->middleware(['subscription'])->group(function () {
        Route::get('ofac', [\App\Http\Controllers\SuperAdmin\PdfController::class, 'generateOfacPdf'])->name('ofac');
        Route::get('sat', [\App\Http\Controllers\SuperAdmin\PdfController::class, 'generateSatPdf'])->name('sat');
    });

    // === HISTORIAL DE BÚSQUEDAS EN LISTAS NEGRAS ===
    // Endpoints para gestionar el historial de búsquedas realizadas
    Route::prefix('search-history')->name('search-history.')->middleware(['subscription'])->group(function () {
        // Lista de búsquedas con filtros y paginación
        Route::get('/', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'index'])->name('index');

        // Detalle de una búsqueda específica
        Route::get('{busqueda}', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'show'])->name('show');

        // Eliminar una búsqueda del historial
        Route::delete('{busqueda}', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'destroy'])->name('destroy');

        // Limpiar historial de búsquedas de una notaría (solo super_admin)
        Route::post('clear-notaria', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'clearNotaria'])
            ->middleware('can:clear-search-history')
            ->name('clear-notaria');

        // Estadísticas del historial
        Route::get('statistics', [\App\Http\Controllers\SuperAdmin\SearchHistoryController::class, 'statistics'])->name('statistics');
    });
});

require __DIR__.'/settings.php';

// 🧪 EJEMPLOS DE ROLES Y GLOBAL SCOPES (Solo desarrollo/testing)
if (app()->environment(['local', 'testing'])) {
    require __DIR__.'/examples.php';
}
