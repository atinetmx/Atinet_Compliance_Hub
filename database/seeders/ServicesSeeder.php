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
                'description' => 'Captura de datos de personas físicas y morales con OCR, QR y análisis IA (80+ campos)',
                'category' => ServiceCategory::SISTEMA,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => null,
                'is_active' => true,
                'implementation_status' => 'implemented',
                'metadata' => [
                    // Escaneo OCR de documentos con Gemini Vision (server-side)
                    'ocr_scanners' => ['ine_frontal', 'ine_reverso', 'acta_nacimiento'],
                    // Lectura QR (client-side: TensorFlow.js + COCO-SSD)
                    'qr_scanners' => ['sat_constancia_fiscal', 'acta_nacimiento'],
                    // Extracción de documentos notariales
                    'document_extractors' => ['pdf', 'word', 'testamento_ai'],
                    // Motores de IA
                    'ai_engines' => [
                        // Gemini Vision: OCR de imágenes (INE, actas) — con fallback entre modelos
                        'gemini_vision' => ['gemini-2.5-flash-preview', 'gemini-2.0-flash'],
                        // OpenAI GPT: análisis semántico de documentos notariales (testamentos, contratos)
                        'openai_gpt' => ['gpt-4o'],
                    ],
                    // Integraciones externas
                    'external_apis' => [
                        'sat_scraping' => true,  // Constancias fiscales (cURL directo al SAT)
                        'curp_lookup' => true,  // Validación y búsqueda CURP
                        'rfc_lookup' => true,  // Validación y búsqueda RFC
                        'codigo_postal' => true,  // Autocompletado colonias/municipio/estado
                    ],
                    'person_types' => ['fisica', 'moral'],
                    'form_fields' => 80,
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
                'description' => 'Captura fotográfica de documentos en papel con IA. Convierte a PDF/Word y extrae datos clave para llenar formularios automáticamente.',
                'category' => ServiceCategory::API,
                'billing_model' => BillingModel::LIMITED,
                'unit_price' => 10.00,
                'is_active' => true,
                'implementation_status' => 'implemented',
                'metadata' => [
                    // Motores de IA
                    'ai_engines' => [
                        // Gemini Vision: captura fotográfica → texto estructurado
                        'gemini_vision' => ['gemini-2.5-flash-preview', 'gemini-2.0-flash'],
                        // OpenAI GPT-4o: análisis semántico profundo y extracción de datos clave
                        'openai_gpt' => ['gpt-4o'],
                    ],
                    // Tipos de documentos notariales soportados
                    'document_types' => [
                        'acta_nacimiento',
                        'acta_matrimonio',
                        'acta_defuncion',
                        'escritura_publica',
                        'contrato',
                        'poder_notarial',
                        'testamento',
                        'acta_constitutiva',
                        'documento_generico',
                    ],
                    // Formatos de salida
                    'output_formats' => ['pdf', 'word', 'json_estructurado'],
                    // Flujos principales
                    'features' => [
                        'foto_a_pdf',           // Captura foto → convierte a PDF/Word legible
                        'foto_a_formulario',    // Captura foto → extrae datos → llena formulario → guarda en BD
                        'analisis_semantico',   // Comprende contexto del documento notarial
                        'multi_pagina',         // Documentos de múltiples páginas
                    ],
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

        // Eliminar servicios obsoletos que ya no están en el catálogo
        // (solo si no tienen registros de uso activos)
        $newCodes = collect($services)->pluck('code')->toArray();
        $codigosConUsage = \DB::table('service_usage')
            ->join('services', 'services.id', '=', 'service_usage.service_id')
            ->whereNotIn('services.code', $newCodes)
            ->pluck('services.code')
            ->unique()
            ->toArray();

        $eliminados = Service::whereNotIn('code', $newCodes)
            ->whereNotIn('code', $codigosConUsage)
            ->delete();

        $implementedCount = collect($services)->where('implementation_status', 'implemented')->count();
        $plannedCount = collect($services)->where('implementation_status', 'planned')->count();

        $this->command->info('✅ Catálogo de servicios actualizado:');
        $this->command->info("   • {$implementedCount} servicios IMPLEMENTADOS");
        $this->command->info("   • {$plannedCount} servicios PLANIFICADOS");
        $this->command->info('   • Total: '.count($services).' servicios');
        if ($eliminados > 0) {
            $this->command->info("   • {$eliminados} servicios obsoletos eliminados");
        }
        if (! empty($codigosConUsage)) {
            $this->command->warn('   ⚠️  Servicios obsoletos con usage preservados: '.implode(', ', $codigosConUsage));
        }
    }
}
