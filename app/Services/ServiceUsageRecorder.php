<?php

namespace App\Services;

use App\Models\Notaria;
use App\Models\Service;
use App\Models\ServiceUsage;
use App\Models\User;
use Illuminate\Support\Facades\Log;

/**
 * Servicio para registrar automáticamente el uso de servicios
 */
class ServiceUsageRecorder
{
    /**
     * Registra el uso de un servicio
     *
     * @param  Notaria  $notaria  Notaría que consume el servicio
     * @param  Service|string  $service  Servicio o código del servicio
     * @param  User|null  $user  Usuario que ejecuta la acción (opcional, usa auth()->user())
     * @param  int  $quantity  Cantidad consumida
     * @param  array  $metadata  Metadata adicional
     * @param  float|null  $cost  Costo específico (opcional, se calcula automáticamente)
     * @param  bool  $billable  Si se debe cobrar
     */
    public function record(
        Notaria $notaria,
        Service|string $service,
        ?User $user = null,
        int $quantity = 1,
        array $metadata = [],
        ?float $cost = null,
        bool $billable = true
    ): ?ServiceUsage {
        try {
            // Resolver el servicio si se pasa como código
            if (is_string($service)) {
                $service = Service::where('code', $service)->first();

                if (! $service) {
                    Log::warning('Intento de registrar uso de servicio inexistente', [
                        'service_code' => $service,
                        'notaria_id' => $notaria->id,
                    ]);

                    return null;
                }
            }

            // Usar el usuario autenticado si no se proporciona
            $user = $user ?? auth()->user();

            if (! $user) {
                Log::warning('Intento de registrar uso sin usuario autenticado', [
                    'service_code' => $service->code,
                    'notaria_id' => $notaria->id,
                ]);

                return null;
            }

            // Calcular costo si no se proporciona
            if ($cost === null) {
                $cost = $this->calculateCost($notaria, $service, $quantity);
            }

            // Crear el registro
            $usage = ServiceUsage::create([
                'notaria_id' => $notaria->id,
                'service_id' => $service->id,
                'user_id' => $user->id,
                'consumed_at' => now(),
                'quantity' => $quantity,
                'cost' => $cost,
                'billable' => $billable,
                'metadata' => $metadata,
            ]);

            Log::info('Uso de servicio registrado', [
                'service_code' => $service->code,
                'notaria_id' => $notaria->id,
                'user_id' => $user->id,
                'quantity' => $quantity,
                'cost' => $cost,
            ]);

            return $usage;
        } catch (\Exception $e) {
            Log::error('Error al registrar uso de servicio', [
                'service' => is_string($service) ? $service : $service->code,
                'notaria_id' => $notaria->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Registra múltiples usos de servicios en batch
     *
     * @param  Notaria  $notaria  Notaría que consume los servicios
     * @param  array  $usages  Array de usos con formato ['service_code' => quantity] o datos completos
     * @param  User|null  $user  Usuario (opcional)
     * @return int Cantidad de registros creados exitosamente
     */
    public function recordBatch(Notaria $notaria, array $usages, ?User $user = null): int
    {
        $successCount = 0;

        foreach ($usages as $serviceCode => $data) {
            // Permitir formato simple: ['service-code' => quantity]
            if (! is_array($data)) {
                $data = ['quantity' => $data];
            }

            $recorded = $this->record(
                notaria: $notaria,
                service: $serviceCode,
                user: $user,
                quantity: $data['quantity'] ?? 1,
                metadata: $data['metadata'] ?? [],
                cost: $data['cost'] ?? null,
                billable: $data['billable'] ?? true
            );

            if ($recorded) {
                $successCount++;
            }
        }

        return $successCount;
    }

    /**
     * Calcula el costo de un servicio
     *
     * @param  Notaria  $notaria  Notaría
     * @param  Service  $service  Servicio
     * @param  int  $quantity  Cantidad
     */
    protected function calculateCost(Notaria $notaria, Service $service, int $quantity): float
    {
        // Verificar si hay precio personalizado
        $customService = $notaria->services()
            ->where('service_id', $service->id)
            ->wherePivot('is_enabled', true)
            ->first();

        if ($customService && $customService->pivot->custom_price !== null) {
            return $customService->pivot->custom_price * $quantity;
        }

        // Usar precio del servicio
        return ($service->unit_price ?? 0) * $quantity;
    }

    /**
     * Obtiene el uso del mes actual de un servicio
     *
     * @param  Notaria  $notaria  Notaría
     * @param  Service|string  $service  Servicio o código
     */
    public function getCurrentMonthUsage(Notaria $notaria, Service|string $service): int
    {
        if (is_string($service)) {
            $service = Service::where('code', $service)->first();

            if (! $service) {
                return 0;
            }
        }

        return ServiceUsage::where('notaria_id', $notaria->id)
            ->where('service_id', $service->id)
            ->whereYear('consumed_at', now()->year)
            ->whereMonth('consumed_at', now()->month)
            ->sum('quantity');
    }

    /**
     * Obtiene el costo total del mes actual de un servicio
     *
     * @param  Notaria  $notaria  Notaría
     * @param  Service|string  $service  Servicio o código
     */
    public function getCurrentMonthCost(Notaria $notaria, Service|string $service): float
    {
        if (is_string($service)) {
            $service = Service::where('code', $service)->first();

            if (! $service) {
                return 0.0;
            }
        }

        return (float) ServiceUsage::where('notaria_id', $notaria->id)
            ->where('service_id', $service->id)
            ->whereYear('consumed_at', now()->year)
            ->whereMonth('consumed_at', now()->month)
            ->where('billable', true)
            ->sum('cost');
    }

    /**
     * Marca registros como facturados
     *
     * @param  array  $usageIds  IDs de los ServiceUsage
     * @return int Cantidad de registros actualizados
     */
    public function markAsBilled(array $usageIds): int
    {
        return ServiceUsage::whereIn('id', $usageIds)
            ->whereNull('billed_at')
            ->update(['billed_at' => now()]);
    }

    /**
     * Obtiene registros pendientes de facturación
     *
     * @param  Notaria|null  $notaria  Notaría específica (opcional)
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function getPendingBilling(?Notaria $notaria = null)
    {
        $query = ServiceUsage::with(['service', 'user', 'notaria'])
            ->where('billable', true)
            ->whereNull('billed_at');

        if ($notaria) {
            $query->where('notaria_id', $notaria->id);
        }

        return $query->orderBy('consumed_at')->get();
    }
}
