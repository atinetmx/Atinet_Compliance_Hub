<?php

namespace Database\Seeders;

use App\BillingModel;
use App\Models\Service;
use App\ServiceCategory;
use Illuminate\Database\Seeder;

/**
 * Seeder para crear el catálogo de servicios de ATINET
 *
 * Define todos los servicios disponibles según la arquitectura de Fase 1.5
 */
class ServicesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            // 🔍 CONSULTAS / BÚSQUEDAS
            [
                'code' => 'BLACKLIST_SAT',
                'name' => 'Lista Negra SAT',
                'description' => 'Consulta la lista de contribuyentes con restricciones del SAT',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => 5.00,
                'is_active' => true,
            ],
            [
                'code' => 'BLACKLIST_OFAC',
                'name' => 'Lista OFAC',
                'description' => 'Verificación contra la lista de la Oficina de Control de Activos Extranjeros',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => 8.00,
                'is_active' => true,
            ],
            [
                'code' => 'LIST_PEP',
                'name' => 'Lista PEP',
                'description' => 'Consulta de Personas Expuestas Políticamente',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 10.00,
                'is_active' => true,
            ],
            [
                'code' => 'LIST_LAVADO',
                'name' => 'Lista Lavado de Dinero',
                'description' => 'Verificación contra listas de prevención de lavado de dinero',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 12.00,
                'is_active' => true,
            ],
            [
                'code' => 'CONSULTA_EMPRESA',
                'name' => 'Consulta de Empresas',
                'description' => 'Búsqueda y verificación de información empresarial',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => 7.00,
                'is_active' => true,
            ],

            // 🔌 APIs Y CONECTORES
            [
                'code' => 'API_CAPTURA_DOCS',
                'name' => 'API Captura Documentos',
                'description' => 'API para captura automatizada de documentos',
                'category' => ServiceCategory::API,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => 2.00,
                'is_active' => true,
            ],
            [
                'code' => 'API_OCR',
                'name' => 'OCR Avanzado',
                'description' => 'Reconocimiento óptico de caracteres con IA',
                'category' => ServiceCategory::API,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 3.00,
                'is_active' => true,
            ],
            [
                'code' => 'API_FIRMA_DIGITAL',
                'name' => 'Firma Digital',
                'description' => 'API para firma electrónica avanzada',
                'category' => ServiceCategory::API,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 5.00,
                'is_active' => true,
            ],
            [
                'code' => 'WEBHOOK_NOTIFICATIONS',
                'name' => 'Webhooks',
                'description' => 'Sistema de notificaciones mediante webhooks',
                'category' => ServiceCategory::INTEGRACION,
                'billing_model' => BillingModel::INCLUDED,
                'unit_price' => null,
                'is_active' => true,
            ],

            // ⚙️ SISTEMA BASE
            [
                'code' => 'SISTEMA_NOTARIAL',
                'name' => 'Sistema Notarial ATINET',
                'description' => 'Sistema base para gestión notarial',
                'category' => ServiceCategory::SISTEMA,
                'billing_model' => BillingModel::INCLUDED,
                'unit_price' => null,
                'is_active' => true,
                'metadata' => ['required' => true, 'base_system' => true],
            ],
            [
                'code' => 'EXPEDIENTES_QR',
                'name' => 'Expedientes QR',
                'description' => 'Sistema de gestión de expedientes con códigos QR',
                'category' => ServiceCategory::SISTEMA,
                'billing_model' => BillingModel::INCLUDED,
                'unit_price' => null,
                'is_active' => true,
            ],
            [
                'code' => 'DASHBOARD_BASICO',
                'name' => 'Dashboard Básico',
                'description' => 'Panel de control con métricas básicas',
                'category' => ServiceCategory::ANALISIS,
                'billing_model' => BillingModel::INCLUDED,
                'unit_price' => null,
                'is_active' => true,
            ],
            [
                'code' => 'DASHBOARD_AVANZADO',
                'name' => 'Dashboard Avanzado',
                'description' => 'Panel de control con analytics avanzados y reportes',
                'category' => ServiceCategory::ANALISIS,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => null,
                'is_active' => true,
            ],
            [
                'code' => 'REPORTES_PERSONALIZADOS',
                'name' => 'Reportes Custom',
                'description' => 'Generación de reportes personalizados bajo demanda',
                'category' => ServiceCategory::ANALISIS,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 15.00,
                'is_active' => true,
            ],

            // 💾 ALMACENAMIENTO
            [
                'code' => 'STORAGE_BASICO',
                'name' => 'Almacenamiento Básico',
                'description' => 'Espacio de almacenamiento de documentos (10GB)',
                'category' => ServiceCategory::ALMACENAMIENTO,
                'billing_model' => BillingModel::INCLUDED,
                'unit_price' => null,
                'is_active' => true,
                'metadata' => ['storage_gb' => 10],
            ],
            [
                'code' => 'STORAGE_EXTRA',
                'name' => 'Almacenamiento Extra',
                'description' => 'Almacenamiento adicional por GB/mes',
                'category' => ServiceCategory::ALMACENAMIENTO,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 1.50,
                'is_active' => true,
                'metadata' => ['unit' => 'GB/mes'],
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['code' => $service['code']],
                $service
            );
        }

        $this->command->info('✅ Catálogo de servicios creado: '.count($services).' servicios');
    }
}
