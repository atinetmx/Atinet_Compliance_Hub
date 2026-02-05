<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para asegurar que solo usuarios super_admin accedan a ciertas rutas
 *
 * Los super_admin son empleados de Atinet que pueden ver todo el sistema
 */
class EnsureSuperAdmin
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Verificar que el usuario esté autenticado
        if (!auth()->check()) {
            return response()->json([
                'error' => 'No autenticado',
                'message' => 'Debe estar autenticado para acceder a este recurso'
            ], 401);
        }

        // Verificar que el usuario sea super_admin
        if (auth()->user()->tipo_cuenta !== 'super_admin') {
            return response()->json([
                'error' => 'Acceso denegado',
                'message' => 'Solo usuarios super_admin pueden acceder a este recurso',
                'tipo_cuenta_actual' => auth()->user()->tipo_cuenta
            ], 403);
        }

        return $next($request);
    }
}
