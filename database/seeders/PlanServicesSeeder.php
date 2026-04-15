<?php

namespace Database\Seeders;

use App\Models\Plan;
use App\Models\Service;
use Illuminate\Database\Seeder;

/**
 * Seeder para asignar servicios a los planes con sus límites y configuraciones
 *
 * Define qué servicios incluye cada plan según la arquitectura de Fase 1.5
 */
class PlanServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->seedPlanBasico();
        $this->seedPlanProfesional();
        $this->seedPlanPremium();

        $this->command->info('✅ Servicios asignados a los planes correctamente');
    }

    /**
     * Plan Básico - $499/mes
     */
    private function seedPlanBasico(): void
    {
        $plan = Plan::where('slug', 'plan-basico')->first();

        if (! $plan) {
            $this->command->warn('⚠️ Plan Básico no encontrado. Ejecutar primero UserRoleExamplesSeeder.');

            return;
        }

        $services = [
            // ✅ MÓDULOS CORE INCLUIDOS
            'CONTROL_NOTARIAL' => ['is_included' => true, 'usage_limit' => null, 'priority' => 1],
            'AGENDA_WEB' => ['is_included' => true, 'usage_limit' => null, 'priority' => 2],

            // ✅ REGISTRO WEB - Con límite de registros
            'REGISTRO_WEB' => ['is_included' => true, 'usage_limit' => 50, 'priority' => 3],

            // ✅ BÚSQUEDAS - Con límite
            'BLACKLIST_SAT' => ['is_included' => true, 'usage_limit' => 50, 'priority' => 4],
            'BLACKLIST_OFAC' => ['is_included' => true, 'usage_limit' => 50, 'priority' => 5],

            // ✅ ESCÁNER INTELIGENTE - Con límite
            'ESCANER_INTELIGENTE' => ['is_included' => true, 'usage_limit' => 20, 'priority' => 6],
        ];

        $this->attachServicesToPlan($plan, $services);
        $this->command->info('  - Plan Básico configurado');
    }

    /**
     * Plan Profesional - $999/mes
     */
    private function seedPlanProfesional(): void
    {
        $plan = Plan::where('slug', 'plan-premium')->first();

        if (! $plan) {
            $this->command->warn('⚠️ Plan Profesional no encontrado.');

            return;
        }

        $services = [
            // ✅ MÓDULOS CORE ILIMITADOS
            'CONTROL_NOTARIAL' => ['is_included' => true, 'usage_limit' => null, 'priority' => 1],
            'AGENDA_WEB' => ['is_included' => true, 'usage_limit' => null, 'priority' => 2],

            // ✅ REGISTRO WEB - Mayor límite
            'REGISTRO_WEB' => ['is_included' => true, 'usage_limit' => 200, 'priority' => 3],

            // ✅ BÚSQUEDAS ILIMITADAS
            'BLACKLIST_SAT' => ['is_included' => true, 'usage_limit' => null, 'priority' => 4],
            'BLACKLIST_OFAC' => ['is_included' => true, 'usage_limit' => null, 'priority' => 5],

            // ✅ ESCÁNER INTELIGENTE - Mayor límite
            'ESCANER_INTELIGENTE' => ['is_included' => true, 'usage_limit' => 100, 'priority' => 6],
        ];

        $this->attachServicesToPlan($plan, $services);
        $this->command->info('  - Plan Profesional configurado');
    }

    /**
     * Plan Premium - $1,999/mes
     */
    private function seedPlanPremium(): void
    {
        $plan = Plan::where('slug', 'plan-empresa')->first();

        if (! $plan) {
            $this->command->warn('⚠️ Plan Premium no encontrado.');

            return;
        }

        $services = [
            // ✅ TODO ILIMITADO
            'CONTROL_NOTARIAL' => ['is_included' => true, 'usage_limit' => null, 'priority' => 1],
            'AGENDA_WEB' => ['is_included' => true, 'usage_limit' => null, 'priority' => 2],
            'REGISTRO_WEB' => ['is_included' => true, 'usage_limit' => null, 'priority' => 3],
            'BLACKLIST_SAT' => ['is_included' => true, 'usage_limit' => null, 'priority' => 4],
            'BLACKLIST_OFAC' => ['is_included' => true, 'usage_limit' => null, 'priority' => 5],
            'ESCANER_INTELIGENTE' => ['is_included' => true, 'usage_limit' => null, 'priority' => 6],
        ];

        $this->attachServicesToPlan($plan, $services);
        $this->command->info('  - Plan Premium configurado');
    }

    /**
     * Attach services to a plan with pivot data
     */
    private function attachServicesToPlan(Plan $plan, array $services): void
    {
        foreach ($services as $code => $pivotData) {
            $service = Service::where('code', $code)->first();

            if (! $service) {
                $this->command->warn("    ⚠️ Servicio {$code} no encontrado. Ejecutar primero ServicesSeeder.");

                continue;
            }

            $plan->services()->syncWithoutDetaching([
                $service->id => $pivotData,
            ]);
        }
    }
}
