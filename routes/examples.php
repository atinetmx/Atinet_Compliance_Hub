<?php

use App\Http\Controllers\Examples\UserRoleExamplesController;
use Illuminate\Support\Facades\Route;

/**
 * Rutas de EJEMPLO para demostrar el sistema de roles y Global Scopes
 *
 * IMPORTANTE: Estas rutas son solo para DEMOSTRACIÓN y DESARROLLO
 * NO incluir en producción o comentar/eliminar antes del deploy
 */

Route::middleware(['auth'])->prefix('examples')->name('examples.')->group(function () {

    // � PÁGINA DE DEMOSTRACIÓN (interfaz web para probar los ejemplos)
    Route::get('/', function () {
        return response()->file(resource_path('views/examples/role-examples.html'));
    })->name('index');

    // �🔥 SUPER_ADMIN: Dashboard global con todas las notarías
    Route::get('/super-admin', [UserRoleExamplesController::class, 'superAdminExample'])
         ->name('super-admin')
         ->middleware(['ensure.super.admin']); // Solo super_admin

    // 🏢 ADMIN_NOTARIA: Dashboard de su notaría específica
    Route::get('/admin-notaria', [UserRoleExamplesController::class, 'adminNotariaExample'])
         ->name('admin-notaria')
         ->middleware(['ensure.admin.notaria']); // Solo admin_notaria

    // 👤 USUARIO_NOTARIA: Vista de usuario regular
    Route::get('/usuario-notaria', [UserRoleExamplesController::class, 'usuarioNotariaExample'])
         ->name('usuario-notaria')
         ->middleware(['ensure.usuario.notaria']); // Solo usuario_notaria

    // 👥 INVITADO: Vista limitada de solo lectura
    Route::get('/invitado', [UserRoleExamplesController::class, 'invitadoExample'])
         ->name('invitado')
         ->middleware(['ensure.invitado']); // Solo invitado

    // 🔍 DEMO GLOBAL SCOPE: Funciona para cualquier usuario autenticado
    Route::get('/global-scope-demo', [UserRoleExamplesController::class, 'globalScopeDemo'])
         ->name('global-scope-demo'); // Cualquier usuario autenticado
});

/**
 * Ruta especial para cambiar entre tipos de usuario (solo para desarrollo/testing)
 * ELIMINAR en producción
 */
if (app()->environment(['local', 'testing'])) {
    Route::middleware(['auth'])->prefix('examples')->group(function () {

        // 🧪 TESTING: Cambiar tipo de cuenta para probar diferentes comportamientos
        Route::post('/change-user-type/{tipo}', function (string $tipo) {
            $validTypes = ['super_admin', 'admin_notaria', 'usuario_notaria', 'invitado'];

            if (!in_array($tipo, $validTypes)) {
                return response()->json(['error' => 'Tipo de usuario inválido'], 400);
            }

            auth()->user()->update(['tipo_cuenta' => $tipo]);

            return response()->json([
                'message' => "Tipo de cuenta cambiado a: {$tipo}",
                'usuario' => auth()->user()->only(['id', 'name', 'email', 'tipo_cuenta', 'notaria_id'])
            ]);
        })->name('examples.change-user-type');

        // 🧪 TESTING: Ver información del usuario actual
        Route::get('/current-user-info', function () {
            return response()->json([
                'usuario_actual' => auth()->user()->only(['id', 'name', 'email', 'tipo_cuenta', 'notaria_id']),
                'notaria' => auth()->user()->notaria?->only(['id', 'nombre', 'activa']),
                'puede_cambiar_tipo' => app()->environment(['local', 'testing']),
            ]);
        })->name('examples.current-user-info');
    });
}
