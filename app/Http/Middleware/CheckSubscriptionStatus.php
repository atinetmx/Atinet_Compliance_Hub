<?php

namespace App\Http\Middleware;

use App\Models\Subscription;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware para validar el estado de suscripción
 *
 * Verifica que la notaría tiene una suscripción activa y válida
 * para poder acceder a servicios.
 *
 * Estados permitidos:
 * - activa: acceso completo
 * - trial: acceso completo
 * - vencida: acceso limitado (solo lectura) durante período de gracia
 *
 * Estados bloqueados:
 * - suspendida: bloqueado por falta de pago
 * - cancelada: bloqueado definitivamente
 * - sin suscripción: bloqueado
 */
class CheckSubscriptionStatus
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, ?string $mode = null): Response
    {
        // Verificar que el usuario esté autenticado
        if (! $request->user()) {
            return $this->responseUnauthorized($request);
        }

        // BYPASS: SuperAdmin no requiere suscripción (es administrador de Atinet, no cliente)
        if ($request->user()->isSuperAdmin()) {
            $request->attributes->set('subscription_status', 'superadmin_bypass');

            return $next($request);
        }

        // Verificar que el usuario tenga una notaría asociada
        $notaria = $request->user()->notaria;
        if (! $notaria) {
            return $this->responseNoNotaria($request);
        }

        // Obtener la suscripción activa
        $subscription = $notaria->subscripciones()
            ->whereIn('status', [
                Subscription::STATUS_ACTIVA,
                Subscription::STATUS_TRIAL,
                Subscription::STATUS_VENCIDA,
            ])
            ->latest()
            ->first();

        // Verificar si existe suscripción
        if (! $subscription) {
            return $this->responseNoSubscription($request);
        }

        // Verificar fecha de vencimiento
        if ($subscription->fecha_vencimiento < now()) {
            // Suscripción vencida: bloquear si está fuera de período de gracia
            $diasVencido = now()->diffInDays($subscription->fecha_vencimiento);

            if ($diasVencido > 7) {
                return $this->responseSubscriptionExpired($request, $subscription);
            }

            // En período de gracia: modo lectura si se especifica
            if ($mode === 'read_only') {
                $request->attributes->set('subscription_mode', 'read_only');
                $request->attributes->set('grace_period_days', $diasVencido);
            }
        }

        // Verificar estado de la suscripción
        switch ($subscription->status) {
            case Subscription::STATUS_SUSPENDIDA:
                return $this->responseSuspended($request, $subscription);

            case Subscription::STATUS_CANCELADA:
                return $this->responseCancelled($request, $subscription);

            case Subscription::STATUS_VENCIDA:
                // Verificar si está en período de gracia
                $diasVencido = now()->diffInDays($subscription->fecha_vencimiento);
                if ($diasVencido > 7) {
                    return $this->responseGracePeriodExpired($request, $subscription);
                }

                // En período de gracia
                $request->attributes->set('subscription_status', 'grace_period');
                $request->attributes->set('grace_period_days_remaining', 7 - $diasVencido);
                break;

            case Subscription::STATUS_ACTIVA:
            case Subscription::STATUS_TRIAL:
                $request->attributes->set('subscription_status', $subscription->status);
                break;

            default:
                return $this->responseInvalidStatus($request, $subscription);
        }

        // Pasar información de suscripción al request
        $request->attributes->set('subscription', $subscription);
        $request->attributes->set('notaria', $notaria);

        return $next($request);
    }

    /**
     * Respuesta: Usuario no autenticado
     */
    protected function responseUnauthorized(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'No autenticado. Por favor inicia sesión.',
                'code' => 'UNAUTHORIZED',
            ], 401);
        }

        return redirect()->route('login')
            ->with('error', 'Debes iniciar sesión para acceder a este servicio.');
    }

    /**
     * Respuesta: Notaría no asociada
     */
    protected function responseNoNotaria(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Tu usuario no está asociado a ninguna notaría.',
                'code' => 'NO_NOTARIA',
            ], 403);
        }

        abort(403, 'Tu usuario no está asociado a ninguna notaría.');
    }

    /**
     * Respuesta: Sin suscripción activa
     */
    protected function responseNoSubscription(Request $request): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Tu notaría no tiene una suscripción activa.',
                'code' => 'NO_SUBSCRIPTION',
                'action' => 'Contacta al administrador para activar una suscripción.',
            ], 403);
        }

        abort(403, 'Tu notaría no tiene una suscripción activa.');
    }

    /**
     * Respuesta: Suscripción suspendida
     */
    protected function responseSuspended(Request $request, Subscription $subscription): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Tu suscripción ha sido suspendida.',
                'code' => 'SUBSCRIPTION_SUSPENDED',
                'reason' => 'Por falta de pago',
                'action' => 'Contacta al administrador para resolver el pago pendiente.',
            ], 403);
        }

        abort(403, 'Tu suscripción ha sido suspendida. Contacta al administrador.');
    }

    /**
     * Respuesta: Suscripción cancelada
     */
    protected function responseCancelled(Request $request, Subscription $subscription): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Tu suscripción ha sido cancelada.',
                'code' => 'SUBSCRIPTION_CANCELLED',
                'cancelled_at' => $subscription->fecha_cancelacion,
                'reason' => $subscription->razon_cancelacion,
            ], 403);
        }

        abort(403, 'Tu suscripción ha sido cancelada.');
    }

    /**
     * Respuesta: Suscripción expirada (fuera de período de gracia)
     */
    protected function responseSubscriptionExpired(Request $request, Subscription $subscription): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Tu suscripción ha expirado y está fuera del período de gracia.',
                'code' => 'SUBSCRIPTION_EXPIRED',
                'expired_at' => $subscription->fecha_vencimiento,
                'grace_period_ended' => $subscription->fecha_vencimiento->addDays(7),
                'action' => 'Contacta al administrador para renovar tu suscripción.',
            ], 403);
        }

        abort(403, 'Tu suscripción ha expirado.');
    }

    /**
     * Respuesta: Período de gracia agotado
     */
    protected function responseGracePeriodExpired(Request $request, Subscription $subscription): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Tu período de gracia ha expirado. Tu suscripción será suspendida.',
                'code' => 'GRACE_PERIOD_EXPIRED',
                'expired_at' => $subscription->fecha_vencimiento,
                'grace_ended_at' => $subscription->fecha_vencimiento->addDays(7),
            ], 403);
        }

        abort(403, 'Tu período de gracia ha expirado.');
    }

    /**
     * Respuesta: Estado de suscripción inválido
     */
    protected function responseInvalidStatus(Request $request, Subscription $subscription): Response
    {
        if ($request->expectsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'El estado de tu suscripción es inválido.',
                'code' => 'INVALID_SUBSCRIPTION_STATUS',
                'status' => $subscription->status,
            ], 400);
        }

        abort(400, 'Estado de suscripción inválido.');
    }
}
