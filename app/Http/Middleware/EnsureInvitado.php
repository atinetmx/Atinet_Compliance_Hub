<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para asegurar que solo usuarios invitado accedan a ciertas rutas
 *
 * Los invitado tienen acceso muy limitado y temporal al sistema
 */
class EnsureInvitado
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar que el usuario esté autenticado
        if (! auth()->check()) {
            return response()->json([
                'error' => 'No autenticado',
                'message' => 'Debe estar autenticado para acceder a este recurso',
            ], 401);
        }

        $user = auth()->user();

        // Verificar que el usuario sea invitado
        if ($user->tipo_cuenta !== 'invitado') {
            return response()->json([
                'error' => 'Acceso denegado',
                'message' => 'Solo usuarios invitado pueden acceder a este recurso',
                'tipo_cuenta_actual' => $user->tipo_cuenta,
            ], 403);
        }

        // Verificar que tenga una notaría asignada (los invitados también están vinculados a una notaría)
        if (! $user->notaria_id) {
            return response()->json([
                'error' => 'Sin notaría asignada',
                'message' => 'El usuario invitado debe tener una notaría asignada',
            ], 403);
        }

        return $next($request);
    }
}
