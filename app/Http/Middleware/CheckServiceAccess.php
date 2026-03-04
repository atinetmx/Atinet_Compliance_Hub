<?php

namespace App\Http\Middleware;

use App\Services\ServiceAccessManager;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckServiceAccess
{
    public function __construct(
        protected ServiceAccessManager $accessManager
    ) {}

    /**
     * Handle an incoming request.
     *
     * Verifica que el usuario tenga acceso al servicio especificado
     * y que no haya alcanzado su límite de uso.
     *
     * @param  string  $serviceCode  Código del servicio a verificar
     */
    public function handle(Request $request, Closure $next, string $serviceCode): Response
    {
        // Verificar que el usuario esté autenticado
        if (! $request->user()) {
            return $this->responseUnauthorized($request);
        }

        // BYPASS: SuperAdmin tiene acceso ilimitado a todos los servicios (es administrador de Atinet)
        if ($request->user()->isSuperAdmin()) {
            $request->attributes->set('service_code', $serviceCode);
            $request->attributes->set('service_access', 'superadmin_unlimited');

            return $next($request);
        }

        // Verificar que el usuario tenga una notaría asociada
        $notaria = $request->user()->notaria;
        if (! $notaria) {
            return $this->responseNoNotaria($request);
        }

        // Verificar si tiene acceso al servicio
        if (! $this->accessManager->canAccess($notaria, $serviceCode)) {
            return $this->responseNoAccess($request, $serviceCode);
        }

        // Verificar si ha alcanzado el límite de uso
        if ($this->accessManager->hasReachedLimit($notaria, $serviceCode)) {
            return $this->responseLimitReached($request, $serviceCode);
        }

        // Agregar información del servicio al request para uso posterior
        $request->attributes->set('service_code', $serviceCode);
        $request->attributes->set('service_stats', $this->accessManager->getUsageStats($notaria, $serviceCode));

        return $next($request);
    }

    /**
     * Respuesta cuando el usuario no está autenticado
     */
    protected function responseUnauthorized(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'No autenticado. Por favor inicia sesión.',
            ], 401);
        }

        return redirect()->route('login')->with('error', 'Debes iniciar sesión para acceder a este servicio.');
    }

    /**
     * Respuesta cuando el usuario no tiene notaría asociada
     */
    protected function responseNoNotaria(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Tu usuario no está asociado a ninguna notaría.',
            ], 403);
        }

        abort(403, 'Tu usuario no está asociado a ninguna notaría.');
    }

    /**
     * Respuesta cuando no tiene acceso al servicio
     */
    protected function responseNoAccess(Request $request, string $serviceCode): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'No tienes acceso a este servicio.',
                'service' => $serviceCode,
                'reason' => 'Tu plan actual no incluye este servicio o tu suscripción no está activa.',
            ], 403);
        }

        abort(403, 'No tienes acceso a este servicio. Verifica tu plan de suscripción.');
    }

    /**
     * Respuesta cuando ha alcanzado el límite de uso
     */
    protected function responseLimitReached(Request $request, string $serviceCode): Response
    {
        $notaria = $request->user()->notaria;
        $remaining = $this->accessManager->getRemainingUsage($notaria, $serviceCode);
        $stats = $this->accessManager->getUsageStats($notaria, $serviceCode);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Has alcanzado el límite de uso de este servicio.',
                'service' => $serviceCode,
                'limit' => $stats['limit'],
                'used' => $stats['used'],
                'remaining' => $remaining,
            ], 429);
        }

        abort(429, "Has alcanzado el límite de uso de este servicio ({$stats['used']}/{$stats['limit']}). Contacta con soporte para aumentar tu límite.");
    }
}
