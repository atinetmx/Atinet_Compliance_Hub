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
            // Servicios incluidos ilimitados
            'SISTEMA_NOTARIAL' => ['is_included' => true, 'usage_limit' => null, 'priority' => 1],
            'EXPEDIENTES_QR' => ['is_included' => true, 'usage_limit' => null, 'priority' => 2],
            'DASHBOARD_BASICO' => ['is_included' => true, 'usage_limit' => null, 'priority' => 3],
            'STORAGE_BASICO' => ['is_included' => true, 'usage_limit' => null, 'priority' => 4],

            // Servicios con límite
            'BLACKLIST_SAT' => ['is_included' => true, 'usage_limit' => 50, 'priority' => 5],
            'BLACKLIST_OFAC' => ['is_included' => true, 'usage_limit' => 50, 'priority' => 6],
            'CONSULTA_EMPRESA' => ['is_included' => true, 'usage_limit' => 30, 'priority' => 7],

            // Servicios NO incluidos pero disponibles por pago
            'LIST_PEP' => ['is_included' => false, 'extra_price' => 10.00, 'priority' => 8],
            'LIST_LAVADO' => ['is_included' => false, 'extra_price' => 12.00, 'priority' => 9],
            'API_CAPTURA_DOCS' => ['is_included' => false, 'extra_price' => 2.00, 'priority' => 10],
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
            // Servicios incluidos ilimitados
            'SISTEMA_NOTARIAL' => ['is_included' => true, 'usage_limit' => null, 'priority' => 1],
            'EXPEDIENTES_QR' => ['is_included' => true, 'usage_limit' => null, 'priority' => 2],
            'DASHBOARD_BASICO' => ['is_included' => true, 'usage_limit' => null, 'priority' => 3],
            'DASHBOARD_AVANZADO' => ['is_included' => true, 'usage_limit' => null, 'priority' => 4],
            'STORAGE_BASICO' => ['is_included' => true, 'usage_limit' => null, 'priority' => 5],
            'WEBHOOK_NOTIFICATIONS' => ['is_included' => true, 'usage_limit' => null, 'priority' => 6],

            // Búsquedas ilimitadas
            'BLACKLIST_SAT' => ['is_included' => true, 'usage_limit' => null, 'priority' => 7],
            'BLACKLIST_OFAC' => ['is_included' => true, 'usage_limit' => null, 'priority' => 8],
            'CONSULTA_EMPRESA' => ['is_included' => true, 'usage_limit' => null, 'priority' => 9],

            // Servicios con límite
            'LIST_PEP' => ['is_included' => true, 'usage_limit' => 100, 'priority' => 10],
            'API_CAPTURA_DOCS' => ['is_included' => true, 'usage_limit' => 500, 'priority' => 11],
            'API_OCR' => ['is_included' => true, 'usage_limit' => 100, 'priority' => 12],

            // Servicios con precio extra reducido
            'LIST_LAVADO' => ['is_included' => false, 'extra_price' => 10.00, 'priority' => 13],
            'REPORTES_PERSONALIZADOS' => ['is_included' => false, 'extra_price' => 12.00, 'priority' => 14],
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
            // TODO ILIMITADO
            'SISTEMA_NOTARIAL' => ['is_included' => true, 'usage_limit' => null, 'priority' => 1],
            'EXPEDIENTES_QR' => ['is_included' => true, 'usage_limit' => null, 'priority' => 2],
            'DASHBOARD_BASICO' => ['is_included' => true, 'usage_limit' => null, 'priority' => 3],
            'DASHBOARD_AVANZADO' => ['is_included' => true, 'usage_limit' => null, 'priority' => 4],
            'STORAGE_BASICO' => ['is_included' => true, 'usage_limit' => null, 'priority' => 5],
            'WEBHOOK_NOTIFICATIONS' => ['is_included' => true, 'usage_limit' => null, 'priority' => 6],
            'BLACKLIST_SAT' => ['is_included' => true, 'usage_limit' => null, 'priority' => 7],
            'BLACKLIST_OFAC' => ['is_included' => true, 'usage_limit' => null, 'priority' => 8],
            'CONSULTA_EMPRESA' => ['is_included' => true, 'usage_limit' => null, 'priority' => 9],
            'LIST_PEP' => ['is_included' => true, 'usage_limit' => null, 'priority' => 10],
            'LIST_LAVADO' => ['is_included' => true, 'usage_limit' => null, 'priority' => 11],
            'API_CAPTURA_DOCS' => ['is_included' => true, 'usage_limit' => null, 'priority' => 12],
            'API_OCR' => ['is_included' => true, 'usage_limit' => null, 'priority' => 13],
            'API_FIRMA_DIGITAL' => ['is_included' => true, 'usage_limit' => null, 'priority' => 14],
            'REPORTES_PERSONALIZADOS' => ['is_included' => true, 'usage_limit' => null, 'priority' => 15],
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
