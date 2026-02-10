<?php

namespace App\Console\Commands;

use App\Models\Plan;
use App\Models\Service;
use Illuminate\Console\Command;

class SyncPlanServices extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'plan:sync-services {--plan= : ID del plan específico a sincronizar}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Sincroniza herramientas_activas de planes existentes con la tabla plan_services';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $planId = $this->option('plan');

        if ($planId) {
            $plans = Plan::where('id', $planId)->get();
            if ($plans->isEmpty()) {
                $this->error("Plan con ID {$planId} no encontrado.");

                return 1;
            }
        } else {
            $plans = Plan::all();
        }

        $this->info('Iniciando sincronización de servicios...');
        $this->newLine();

        $syncedCount = 0;
        $skippedCount = 0;

        foreach ($plans as $plan) {
            if (empty($plan->herramientas_activas)) {
                $this->line("⊘ Plan #{$plan->id} '{$plan->nombre}' - Sin herramientas activas");
                $skippedCount++;

                continue;
            }

            $this->line("→ Procesando Plan #{$plan->id} '{$plan->nombre}'");

            // Obtener servicios por nombre
            $services = Service::whereIn('name', $plan->herramientas_activas)
                ->where('is_active', true)
                ->get();

            if ($services->isEmpty()) {
                $this->warn('  ! No se encontraron servicios activos para este plan');
                $skippedCount++;

                continue;
            }

            // Preparar datos para sincronización
            $syncData = [];
            foreach ($services as $service) {
                // Mantener configuración existente si ya existe
                $existing = $plan->services()->where('service_id', $service->id)->first();

                if ($existing) {
                    // Mantener configuración existente
                    $syncData[$service->id] = [
                        'is_included' => $existing->pivot->is_included,
                        'usage_limit' => $existing->pivot->usage_limit,
                        'extra_price' => $existing->pivot->extra_price,
                        'priority' => $existing->pivot->priority,
                    ];
                } else {
                    // Crear nueva configuración por defecto
                    $syncData[$service->id] = [
                        'is_included' => true,
                        'usage_limit' => null,
                        'extra_price' => null,
                        'priority' => 0,
                    ];
                }
            }

            // Sincronizar (mantiene solo los servicios en herramientas_activas)
            $plan->services()->sync($syncData);

            $this->info("  ✓ Sincronizados {$services->count()} servicios");
            $syncedCount++;
        }

        $this->newLine();
        $this->info('Sincronización completada:');
        $this->line("  • Planes sincronizados: {$syncedCount}");
        $this->line("  • Planes omitidos: {$skippedCount}");

        return 0;
    }
}
