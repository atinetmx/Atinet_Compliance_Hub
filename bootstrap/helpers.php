<?php

use App\Models\Notaria;
use App\Models\Service;
use App\Models\ServiceUsage;
use App\Services\ServiceAccessManager;

if (! function_exists('can_use_service')) {
    /**
     * Verifica si el usuario actual puede usar un servicio
     *
     * @param  string  $serviceCode  Código del servicio (ej: 'sat-consulta')
     * @param  Notaria|null  $notaria  Notaría (opcional, usa la del usuario autenticado)
     */
    function can_use_service(string $serviceCode, ?Notaria $notaria = null): bool
    {
        if (! auth()->check()) {
            return false;
        }

        $notaria = $notaria ?? auth()->user()->notaria;

        if (! $notaria) {
            return false;
        }

        $accessManager = app(ServiceAccessManager::class);

        return $accessManager->canAccess($notaria, $serviceCode);
    }
}

if (! function_exists('has_service_limit')) {
    /**
     * Verifica si el usuario ha alcanzado el límite de uso de un servicio
     *
     * @param  string  $serviceCode  Código del servicio
     * @param  Notaria|null  $notaria  Notaría (opcional)
     */
    function has_service_limit(string $serviceCode, ?Notaria $notaria = null): bool
    {
        if (! auth()->check()) {
            return true;
        }

        $notaria = $notaria ?? auth()->user()->notaria;

        if (! $notaria) {
            return true;
        }

        $accessManager = app(ServiceAccessManager::class);

        return $accessManager->hasReachedLimit($notaria, $serviceCode);
    }
}

if (! function_exists('record_service_usage')) {
    /**
     * Registra el uso de un servicio
     *
     * @param  string  $serviceCode  Código del servicio
     * @param  int  $quantity  Cantidad consumida
     * @param  array  $metadata  Metadata adicional del uso
     * @param  float|null  $cost  Costo del uso (opcional, se calcula automáticamente)
     * @param  bool  $billable  Si se debe cobrar
     */
    function record_service_usage(
        string $serviceCode,
        int $quantity = 1,
        array $metadata = [],
        ?float $cost = null,
        bool $billable = true
    ): ?ServiceUsage {
        if (! auth()->check()) {
            return null;
        }

        $notaria = auth()->user()->notaria;

        if (! $notaria) {
            return null;
        }

        $service = Service::where('code', $serviceCode)->first();

        if (! $service) {
            return null;
        }

        // Calcular costo si no se proporciona
        if ($cost === null && $service->unit_price) {
            $cost = $service->unit_price * $quantity;
        }

        return ServiceUsage::create([
            'notaria_id' => $notaria->id,
            'service_id' => $service->id,
            'user_id' => auth()->id(),
            'consumed_at' => now(),
            'quantity' => $quantity,
            'cost' => $cost ?? 0,
            'billable' => $billable,
            'metadata' => $metadata,
        ]);
    }
}

if (! function_exists('get_service_stats')) {
    /**
     * Obtiene estadísticas de uso de un servicio
     *
     * @param  string  $serviceCode  Código del servicio
     * @param  Notaria|null  $notaria  Notaría (opcional)
     */
    function get_service_stats(string $serviceCode, ?Notaria $notaria = null): array
    {
        if (! auth()->check()) {
            return [];
        }

        $notaria = $notaria ?? auth()->user()->notaria;

        if (! $notaria) {
            return [];
        }

        $accessManager = app(ServiceAccessManager::class);

        return $accessManager->getUsageStats($notaria, $serviceCode);
    }
}

if (! function_exists('get_remaining_service_usage')) {
    /**
     * Obtiene el uso restante de un servicio
     *
     * @param  string  $serviceCode  Código del servicio
     * @param  Notaria|null  $notaria  Notaría (opcional)
     * @return int|null Null si es ilimitado
     */
    function get_remaining_service_usage(string $serviceCode, ?Notaria $notaria = null): ?int
    {
        if (! auth()->check()) {
            return 0;
        }

        $notaria = $notaria ?? auth()->user()->notaria;

        if (! $notaria) {
            return 0;
        }

        $accessManager = app(ServiceAccessManager::class);

        return $accessManager->getRemainingUsage($notaria, $serviceCode);
    }
}
