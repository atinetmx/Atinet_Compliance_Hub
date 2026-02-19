<?php

namespace App\Services;

use App\Models\Notaria;
use App\Models\Service;
use App\Models\ServiceUsage;
use App\Models\Subscription;
use Illuminate\Support\Facades\Cache;

/**
 * Servicio de control de acceso a servicios
 *
 * Gestiona permisos, límites y validación de acceso a servicios
 * basado en suscripciones, planes y configuraciones personalizadas
 */
class ServiceAccessManager
{
    /**
     * Verificar si una notaría puede acceder a un servicio
     *
     * @param  Notaria  $notaria  La notaría a verificar
     * @param  string  $serviceCode  Código del servicio
     * @return bool True si tiene acceso, false si no
     */
    public function canAccess(Notaria $notaria, string $serviceCode): bool
    {
        // Usar caché para optimizar consultas frecuentes (5 minutos)
        $cacheKey = "service_access:{$notaria->id}:{$serviceCode}";

        return Cache::remember($cacheKey, 300, function () use ($notaria, $serviceCode) {
            // 1. Verificar que el servicio existe y está activo
            $service = Service::where('code', $serviceCode)
                ->where('is_active', true)
                ->first();

            if (! $service) {
                return false;
            }

            // 2. Verificar que la notaría está activa
            if (! $notaria->activa) {
                return false;
            }

            // 3. Obtener suscripción activa o en trial
            $subscription = $notaria->subscripciones()
                ->whereIn('status', [
                    Subscription::STATUS_ACTIVA,
                    Subscription::STATUS_TRIAL,
                    Subscription::STATUS_VENCIDA, // Acceso limitado en período de gracia
                ])
                ->where('fecha_vencimiento', '>=', now())
                ->latest()
                ->first();

            if (! $subscription) {
                return false;
            }

            // 4. Si la suscripción está vencida, solo lectura (consultas)
            if ($subscription->status === Subscription::STATUS_VENCIDA) {
                // Solo servicios de consulta en período de gracia
                return $service->category->value === 'consulta';
            }

            // 5. Verificar servicios personalizados (tenant_services)
            $customService = $notaria->services()
                ->where('service_id', $service->id)
                ->wherePivot('is_enabled', true)
                ->where(function ($query) {
                    $query->whereNull('tenant_services.expiration_date')
                        ->orWhere('tenant_services.expiration_date', '>=', now());
                })
                ->first();

            if ($customService) {
                // Tiene configuración personalizada y está habilitado
                return true;
            }

            // 6. Verificar si está en el plan
            $plan = $subscription->plan;
            if (! $plan) {
                return false;
            }

            $serviceInPlan = $plan->services()
                ->where('service_id', $service->id)
                ->wherePivot('is_included', true)
                ->exists();

            return $serviceInPlan;
        });
    }

    /**
     * Verificar si se ha alcanzado el límite de uso de un servicio
     *
     * @param  Notaria  $notaria  La notaría a verificar
     * @param  string  $serviceCode  Código del servicio
     * @return bool True si alcanzó el límite, false si aún puede usar
     */
    public function hasReachedLimit(Notaria $notaria, string $serviceCode): bool
    {
        $remaining = $this->getRemainingUsage($notaria, $serviceCode);

        // Si es null = ilimitado
        if ($remaining === null) {
            return false;
        }

        // Si remaining <= 0 = límite alcanzado
        return $remaining <= 0;
    }

    /**
     * Obtener uso restante de un servicio
     *
     * @param  Notaria  $notaria  La notaría a verificar
     * @param  string  $serviceCode  Código del servicio
     * @return int|null Cantidad restante (null = ilimitado)
     */
    public function getRemainingUsage(Notaria $notaria, string $serviceCode): ?int
    {
        // 1. Obtener servicio
        $service = Service::where('code', $serviceCode)->first();
        if (! $service) {
            return 0;
        }

        // 2. Obtener límite (prioridad: custom > plan)
        $limit = $this->getUsageLimit($notaria, $service);

        // Si es ilimitado
        if ($limit === null || $limit === 0) {
            return null;
        }

        // 3. Obtener uso del mes actual
        $currentUsage = $this->getCurrentMonthUsage($notaria, $service);

        // 4. Calcular restante
        $remaining = $limit - $currentUsage;

        return max(0, $remaining);
    }

    /**
     * Obtener estadísticas de uso de un servicio
     *
     * @param  Notaria  $notaria  La notaría
     * @param  string  $serviceCode  Código del servicio
     * @return array Estadísticas completas
     */
    public function getUsageStats(Notaria $notaria, string $serviceCode): array
    {
        $service = Service::where('code', $serviceCode)->first();

        if (! $service) {
            return [
                'service_code' => $serviceCode,
                'service_name' => 'Servicio no encontrado',
                'has_access' => false,
                'limit' => 0,
                'used' => 0,
                'remaining' => 0,
                'is_unlimited' => false,
                'usage_percentage' => 0,
                'current_month_usage' => 0,
                'last_usage' => null,
                'total_cost' => 0,
            ];
        }

        $limit = $this->getUsageLimit($notaria, $service);
        $currentUsage = $this->getCurrentMonthUsage($notaria, $service);
        $remaining = $limit ? max(0, $limit - $currentUsage) : null;
        $isUnlimited = $limit === null || $limit === 0;
        $percentage = $limit ? min(100, ($currentUsage / $limit) * 100) : 0;

        // Obtener último uso
        $lastUsage = ServiceUsage::where('notaria_id', $notaria->id)
            ->where('service_id', $service->id)
            ->latest('consumed_at')
            ->first();

        // Calcular costo total del mes
        $monthlyCost = ServiceUsage::where('notaria_id', $notaria->id)
            ->where('service_id', $service->id)
            ->whereYear('consumed_at', now()->year)
            ->whereMonth('consumed_at', now()->month)
            ->sum('cost');

        return [
            'service_code' => $service->code,
            'service_name' => $service->name,
            'service_category' => $service->category->value,
            'has_access' => $this->canAccess($notaria, $serviceCode),
            'limit' => $limit,
            'used' => $currentUsage,
            'remaining' => $remaining,
            'is_unlimited' => $isUnlimited,
            'usage_percentage' => round($percentage, 2),
            'current_month_usage' => $currentUsage,
            'last_usage' => $lastUsage?->consumed_at?->toDateTimeString(),
            'total_cost' => (float) $monthlyCost,
            'billing_model' => $service->billing_model->value,
        ];
    }

    /**
     * Obtener todos los servicios disponibles para una notaría con sus estadísticas
     *
     * @param  Notaria  $notaria  La notaría
     * @return array Array de servicios con estadísticas
     */
    public function getAvailableServices(Notaria $notaria): array
    {
        // Obtener suscripción activa
        $subscription = $notaria->subscripciones()
            ->whereIn('status', [
                Subscription::STATUS_ACTIVA,
                Subscription::STATUS_TRIAL,
            ])
            ->where('fecha_vencimiento', '>=', now())
            ->latest()
            ->first();

        if (! $subscription || ! $subscription->plan) {
            return [];
        }

        // Obtener servicios del plan
        $services = $subscription->plan->services()
            ->wherePivot('is_included', true)
            ->where('is_active', true)
            ->get();

        // Agregar estadísticas a cada servicio
        return $services->map(function ($service) use ($notaria) {
            return $this->getUsageStats($notaria, $service->code);
        })->toArray();
    }

    /**
     * Limpiar caché de acceso para una notaría
     *
     * @param  Notaria  $notaria  La notaría
     */
    public function clearCache(Notaria $notaria): void
    {
        // Obtener todos los códigos de servicio
        $serviceCodes = Service::pluck('code');

        foreach ($serviceCodes as $code) {
            $cacheKey = "service_access:{$notaria->id}:{$code}";
            Cache::forget($cacheKey);
        }
    }

    /**
     * Obtener límite de uso configurado para un servicio
     *
     * @param  Notaria  $notaria  La notaría
     * @param  Service  $service  El servicio
     * @return int|null Límite (null = ilimitado)
     */
    protected function getUsageLimit(Notaria $notaria, Service $service): ?int
    {
        // 1. Verificar límite personalizado (tenant_services)
        $customService = $notaria->services()
            ->where('service_id', $service->id)
            ->wherePivot('is_enabled', true)
            ->first();

        if ($customService && $customService->pivot->custom_limit !== null) {
            return $customService->pivot->custom_limit;
        }

        // 2. Verificar límite del plan
        $subscription = $notaria->subscripciones()
            ->whereIn('status', [
                Subscription::STATUS_ACTIVA,
                Subscription::STATUS_TRIAL,
            ])
            ->where('fecha_vencimiento', '>=', now())
            ->latest()
            ->first();

        if (! $subscription || ! $subscription->plan) {
            return 0;
        }

        $serviceInPlan = $subscription->plan->services()
            ->where('service_id', $service->id)
            ->first();

        if ($serviceInPlan && $serviceInPlan->pivot->usage_limit !== null) {
            return $serviceInPlan->pivot->usage_limit;
        }

        // 3. Sin límite = ilimitado
        return null;
    }

    /**
     * Obtener uso del mes actual de un servicio
     *
     * @param  Notaria  $notaria  La notaría
     * @param  Service  $service  El servicio
     * @return int Cantidad usada
     */
    protected function getCurrentMonthUsage(Notaria $notaria, Service $service): int
    {
        return ServiceUsage::where('notaria_id', $notaria->id)
            ->where('service_id', $service->id)
            ->whereYear('consumed_at', now()->year)
            ->whereMonth('consumed_at', now()->month)
            ->sum('quantity');
    }
}
