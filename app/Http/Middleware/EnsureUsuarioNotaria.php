<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para asegurar que solo usuarios usuario_notaria accedan a ciertas rutas
 *
 * Los usuario_notaria son empleados regulares de una notaría
 */
class EnsureUsuarioNotaria
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

        // Verificar que el usuario sea usuario_notaria
        if ($user->tipo_cuenta !== 'usuario_notaria') {
            return response()->json([
                'error' => 'Acceso denegado',
                'message' => 'Solo usuarios usuario_notaria pueden acceder a este recurso',
                'tipo_cuenta_actual' => $user->tipo_cuenta,
            ], 403);
        }

        // Verificar que tenga una notaría asignada
        if (! $user->notaria_id) {
            return response()->json([
                'error' => 'Sin notaría asignada',
                'message' => 'El usuario debe tener una notaría asignada',
            ], 403);
        }

        return $next($request);
    }
}
