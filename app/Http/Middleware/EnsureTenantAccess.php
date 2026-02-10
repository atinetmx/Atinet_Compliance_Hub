<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureTenantAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $user = $request->user();

        // Si no hay usuario autenticado, redirigir al login
        if (! $user) {
            return redirect()->route('login');
        }

        // Super admin siempre tiene acceso
        if ($user->tipo_cuenta === 'super_admin') {
            return $next($request);
        }

        // Verificar si el usuario tiene un tipo de cuenta permitido
        if (! empty($allowedRoles) && ! in_array($user->tipo_cuenta, $allowedRoles)) {
            abort(403, 'No tienes permisos para acceder a este recurso.');
        }

        // Verificar que el usuario tenga una notaría asignada (excepto super_admin)
        if (! $user->notaria_id) {
            abort(403, 'Tu cuenta no está asignada a ninguna notaría.');
        }

        // Verificar que la notaría esté activa
        if (! $user->notaria?->activa) {
            abort(403, 'Tu notaría está inactiva. Contacta al administrador.');
        }

        // Verificar suscripción activa de la notaría
        $suscripcionActiva = $user->notaria?->subscripcionActiva;
        if (! $suscripcionActiva || ! $suscripcionActiva->estaActiva()) {
            abort(403, 'La suscripción de tu notaría ha vencido. Contacta al administrador.');
        }

        // Si hay un parámetro de notaría en la ruta, verificar que coincida
        $notariaIdFromRoute = $request->route('notaria_id') ?? $request->route('notaria');
        if ($notariaIdFromRoute && (int) $notariaIdFromRoute !== $user->notaria_id) {
            abort(403, 'No puedes acceder a recursos de otra notaría.');
        }

        return $next($request);
    }
}
