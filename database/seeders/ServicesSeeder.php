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
            // ========================================
            // ✅ SERVICIOS IMPLEMENTADOS
            // ========================================

            // 🏢 MÓDULOS CORE DEL SISTEMA
            [
                'code' => 'CONTROL_NOTARIAL',
                'name' => 'Control Notarial',
                'description' => 'Sistema principal de gestión notarial (migrado desde VB6)',
                'category' => ServiceCategory::SISTEMA,
                'billing_model' => BillingModel::UNLIMITED,
                'unit_price' => null,
                'is_active' => true,
                'implementation_status' => 'implemented',
                'metadata' => [
                    'required' => true,
                    'base_system' => true,
                    'api_externa' => 'https://localhost:44327/api',
                    'legacy_integration' => true,
                ],
            ],
            [
                'code' => 'AGENDA_WEB',
                'name' => 'Agenda Web',
                'description' => 'Sistema de calendario y eventos para notarías',
                'category' => ServiceCategory::SISTEMA,
                'billing_model' => BillingModel::INCLUDED,
                'unit_price' => null,
                'is_active' => true,
                'implementation_status' => 'implemented',
                'metadata' => [
                    'legacy_integration' => true,
                    'features' => ['eventos_recurrentes', 'recordatorios', 'bitacora'],
                ],
            ],
            [
                'code' => 'REGISTRO_WEB',
                'name' => 'Registro Web',
                'description' => 'Captura de datos de clientes con OCR y QR (80+ campos)',
                'category' => ServiceCategory::SISTEMA,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => null,
                'is_active' => true,
                'implementation_status' => 'implemented',
                'metadata' => [
                    'ocr_scanners' => ['ine', 'curp', 'acta_nacimiento'],
                    'qr_scanners' => ['sat_constancia'],
                    'features' => ['pdf_qr_generation', 'email_automation'],
                    'ai_engine' => 'gemini_vision',
                ],
            ],

            // 🔍 BÚSQUEDAS EN LISTAS NEGRAS
            [
                'code' => 'BLACKLIST_SAT',
                'name' => 'Lista Negra SAT',
                'description' => 'Consulta de contribuyentes con restricciones del SAT',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => 5.00,
                'is_active' => true,
                'implementation_status' => 'implemented',
                'metadata' => [
                    'export_formats' => ['excel', 'pdf'],
                    'includes_history' => true,
                ],
            ],
            [
                'code' => 'BLACKLIST_OFAC',
                'name' => 'Lista OFAC',
                'description' => 'Verificación contra la lista OFAC (Oficina de Control de Activos Extranjeros)',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => 8.00,
                'is_active' => true,
                'implementation_status' => 'implemented',
                'metadata' => [
                    'export_formats' => ['excel', 'pdf'],
                    'includes_history' => true,
                ],
            ],

            // 🤖 ESCÁNER INTELIGENTE CON IA
            [
                'code' => 'ESCANER_INTELIGENTE',
                'name' => 'Escáner Inteligente de Documentos',
                'description' => 'Análisis de documentos con IA (GPT-4o Vision)',
                'category' => ServiceCategory::API,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => 10.00,
                'is_active' => true,
                'implementation_status' => 'implemented',
                'metadata' => [
                    'ai_engine' => 'openai_gpt4o_vision',
                    'document_types' => ['escritura', 'contrato', 'poder', 'testamento'],
                    'features' => ['auto_detection', 'key_extraction', 'pdf_to_word'],
                ],
            ],

            // ========================================
            // 📋 SERVICIOS PLANIFICADOS (Futuro)
            // ========================================

            // 🔍 BÚSQUEDAS INTERNACIONALES
            [
                'code' => 'LIST_PEP',
                'name' => 'Lista PEP',
                'description' => 'Consulta de Personas Expuestas Políticamente (ONU)',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 10.00,
                'is_active' => false,
                'implementation_status' => 'planned',
                'metadata' => [
                    'planned_release' => 'Q3 2026',
                    'api_source' => 'ONU / API internacional',
                ],
            ],
            [
                'code' => 'LIST_LAVADO',
                'name' => 'Lista Lavado de Dinero',
                'description' => 'Verificación contra listas de prevención de lavado de dinero',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 12.00,
                'is_active' => false,
                'implementation_status' => 'planned',
                'metadata' => [
                    'planned_release' => 'Q3 2026',
                    'api_source' => 'UIF / organismos internacionales',
                ],
            ],
            [
                'code' => 'CONSULTA_EMPRESA',
                'name' => 'Consulta de Empresas',
                'description' => 'Búsqueda y verificación de información empresarial',
                'category' => ServiceCategory::CONSULTA,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => 7.00,
                'is_active' => false,
                'implementation_status' => 'planned',
                'metadata' => [
                    'planned_release' => 'Q4 2026',
                    'api_source' => 'SAT / Registro Público de Comercio',
                ],
            ],

            // 🔌 APIs Y FIRMA DIGITAL
            [
                'code' => 'API_FIRMA_DIGITAL',
                'name' => 'Firma Digital',
                'description' => 'API para firma electrónica avanzada',
                'category' => ServiceCategory::API,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 5.00,
                'is_active' => false,
                'implementation_status' => 'planned',
                'metadata' => [
                    'planned_release' => 'Q4 2026',
                    'compliance' => 'NOM-151-SCFI-2016',
                ],
            ],
            [
                'code' => 'WEBHOOK_NOTIFICATIONS',
                'name' => 'Webhooks',
                'description' => 'Sistema de notificaciones mediante webhooks',
                'category' => ServiceCategory::INTEGRACION,
                'billing_model' => BillingModel::INCLUDED,
                'unit_price' => null,
                'is_active' => false,
                'implementation_status' => 'planned',
                'metadata' => [
                    'planned_release' => 'Q2 2026',
                ],
            ],

            // 📊 DASHBOARDS Y REPORTES AVANZADOS
            [
                'code' => 'DASHBOARD_AVANZADO',
                'name' => 'Dashboard Avanzado',
                'description' => 'Panel de control con analytics avanzados y reportes',
                'category' => ServiceCategory::ANALISIS,
                'billing_model' => BillingModel::INCLUDED,
                'unit_price' => null,
                'is_active' => false,
                'implementation_status' => 'planned',
                'metadata' => [
                    'planned_release' => 'Q3 2026',
                    'features' => ['custom_charts', 'exportacion_avanzada', 'ai_insights'],
                ],
            ],
            [
                'code' => 'REPORTES_PERSONALIZADOS',
                'name' => 'Reportes Custom',
                'description' => 'Generación de reportes personalizados bajo demanda',
                'category' => ServiceCategory::ANALISIS,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 15.00,
                'is_active' => false,
                'implementation_status' => 'planned',
                'metadata' => [
                    'planned_release' => 'Q3 2026',
                ],
            ],

            // 💾 ALMACENAMIENTO EXTRA
            [
                'code' => 'STORAGE_EXTRA',
                'name' => 'Almacenamiento Extra',
                'description' => 'Almacenamiento adicional por GB/mes',
                'category' => ServiceCategory::ALMACENAMIENTO,
                'billing_model' => BillingModel::PER_USE,
                'unit_price' => 1.50,
                'is_active' => false,
                'implementation_status' => 'planned',
                'metadata' => [
                    'planned_release' => 'Q4 2026',
                    'unit' => 'GB/mes',
                ],
            ],
        ];

        foreach ($services as $service) {
            Service::updateOrCreate(
                ['code' => $service['code']],
                $service
            );
        }

        $implementedCount = collect($services)->where('implementation_status', 'implemented')->count();
        $plannedCount = collect($services)->where('implementation_status', 'planned')->count();

        $this->command->info('✅ Catálogo de servicios creado:');
        $this->command->info("   • {$implementedCount} servicios IMPLEMENTADOS");
        $this->command->info("   • {$plannedCount} servicios PLANIFICADOS");
        $this->command->info('   • Total: '.count($services).' servicios');
    }
}
