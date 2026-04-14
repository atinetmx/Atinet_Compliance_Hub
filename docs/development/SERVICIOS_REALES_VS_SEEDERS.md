# 📊 Servicios Reales vs Seeders de Ejemplo

**Fecha:** 14 Abril 2026  
**Objetivo:** Documentar discrepancias entre servicios de ejemplo (seeders) y servicios reales de ATINET

---

## 🎯 Servicios REALES que ya ofrece ATINET

### 1. **🛡️ Búsquedas en Listas Negras** - ✅ IMPLEMENTADO

**Código:** `BLACKLIST_OFAC`, `BLACKLIST_SAT`  
**Categoría:** CONSULTA  
**Modelo:** PER_USE / LIMITED  
**Estado:** ✅ Funcional al 100%

**Описание real:**
- Búsqueda OFAC (Lista de la Oficina de Control de Activos Extranjeros)
- Búsqueda SAT (Lista de contribuyentes con restricciones)
- **Tablas:** `busquedas` - almacena historial de búsquedas
- **Controllers:** `SearchHistoryController`
- **Features:** Exportación a Excel, historial, filtros avanzados

**Discrepancia con seeder:**
- ✅ Codes correctos: BLACKLIST_OFAC, BLACKLIST_SAT
- ⚠️ Precios ejemplo no son reales
- ✅ Categoría correcta: CONSULTA

---

### 2. **📅 Agenda Web** - ✅ IMPLEMENTADO

**Código:** ❌ NO EXISTE EN SEEDER  
**Categoría:** SISTEMA  
**Modelo:** INCLUDED / LIMITED  
**Estado:** ✅ Funcional con integración legacy

**Descripción real:**
- Sistema de calendario y eventos para notarías
- Integración bidireccional con sistema PHP legacy
- Eventos recurrentes (RRULE), recordatorios
- Bitácora de actividad combinada
- **Tabla:** `agenda_events`
- **Controllers:** `AgendaController`
- **Rutas:** `/agenda/*`

**⚠️ CRÍTICO:** Este servicio NO existe en los seeders actuales

---

### 3. **📝 Registro Web** - ✅ IMPLEMENTADO

**Código:** ❌ NO EXISTE EN SEEDER  
**Categoría:** SISTEMA  
**Modelo:** LIMITED  
**Estado:** ✅ Backend funcional, frontend 60%

**Descripción real:**
- Captura de datos de clientes (80+ campos)
- Generación de códigos QR
- OCR de documentos (INE, CURP, Acta Nacimiento)
- Escaneo QR del SAT (constancia fiscal)
- Envío de correos automáticos
- **Tabla:** `registro_web`
- **Controllers:** `RegistroWebController`
- **Rutas:** `/registro-web/*`
- **Features:**
  - Scanner INE (OCR)
  - Scanner CURP (OCR)
  - Scanner Acta Nacimiento (OCR)
  - Scanner QR SAT
  - Generador PDF con QR

**⚠️ CRÍTICO:** Este servicio NO existe en los seeders actuales

---

### 4. **⚖️ Control Notarial** - ✅ EN MIGRACIÓN

**Código:** ❌ NO EXISTE EN SEEDER (como módulo específico)  
**Categoría:** SISTEMA  
**Modelo:** UNLIMITED (incluido en plan base)  
**Estado:** ⏳ Coexiste con legacy VB6, API .NET externa

**Descripción real:**
- Sistema principal de gestión notarial
- Migración desde VB6 (516 formularios)
- API .NET externa: `https://localhost:44327/api`
- **Módulos:**
  - Configuración Notaría
  - Alta Expedientes
  - Gestión Presupuestos
  - Usuarios y Catálogos
  - Configuración de Operaciones
- **Controllers:** `ControlNotarialController`
- **Rutas:** `/control-notarial/*`
- **Integración:** Laravel como proxy, lógica en API .NET

**⚠️ CRÍTICO:** Este servicio NO existe en los seeders actuales

---

### 5. **🔍 Escáner Inteligente de Documentos** - ✅ RECIÉN IMPLEMENTADO

**Código:** ❌ NO EXISTE EN SEEDER  
**Categoría:** API / SISTEMA  
**Modelo:** PER_USE (OpenAI API)  
**Estado:** ✅ Funcional al 100% (13 Abril 2026)

**Descripción real:**
- Análisis de documentos con OpenAI GPT-4o Vision
- Detección automática de tipo de documento
- Análisis especializado:
  - Escrituras públicas
  - Contratos
  - Poderes notariales
  - Testamentos
- Extracción de datos clave
- Conversión PDF → Word
- **Tabla:** `documento_escaneados`
- **Controllers:** `EscanerInteligenteController`
- **Services:** `OpenAIDocumentAnalyzer`
- **Rutas:** `/escaner-inteligente/*`
- **API Key:** OpenAI (desde sistema legacy)

**⚠️ CRÍTICO:** Este servicio NO existe en los seeders actuales

---

## ❌ Servicios en SEEDERS que NO existen realmente

### 1. **Lista PEP (Personas Expuestas Políticamente)**
- Code: `LIST_PEP`
- **Estado:** ❌ NO IMPLEMENTADO
- **Razón:** Servicio de ejemplo, no hay backend ni API

### 2. **Lista Lavado de Dinero**
- Code: `LIST_LAVADO`
- **Estado:** ❌ NO IMPLEMENTADO
- **Razón:** Servicio de ejemplo, no hay backend

### 3. **Consulta de Empresas**
- Code: `CONSULTA_EMPRESA`
- **Estado:** ❌ NO IMPLEMENTADO
- **Razón:** Servicio de ejemplo

### 4. **API Captura Documentos**
- Code: `API_CAPTURA_DOCS`
- **Estado:** ⚠️ IMPLEMENTADO PARCIALMENTE
- **Nota:** Existe como parte de Registro Web, pero no como servicio independiente

### 5. **OCR Avanzado**
- Code: `API_OCR`
- **Estado:** ⚠️ IMPLEMENTADO COMO PARTE DE OTROS MÓDULOS
- **Nota:** 
  - Registro Web tiene OCR (Gemini Vision)
  - Escáner Inteligente tiene OCR (OpenAI Vision)
  - Pero no es un servicio API independiente

### 6. **Firma Digital**
- Code: `API_FIRMA_DIGITAL`
- **Estado:** ❌ NO IMPLEMENTADO

### 7. **Webhooks**
- Code: `WEBHOOK_NOTIFICATIONS`
- **Estado:** ❌ NO IMPLEMENTADO

### 8. **Sistema Notarial ATINET**
- Code: `SISTEMA_NOTARIAL`
- **Estado:** ⚠️ ES "CONTROL NOTARIAL"
- **Nota:** Mismo concepto, nombre diferente

### 9. **Expedientes QR**
- Code: `EXPEDIENTES_QR`
- **Estado:** ⚠️ PARTE DE CONTROL NOTARIAL
- **Nota:** No es servicio independiente

### 10. **Dashboard Básico/Avanzado**
- Codes: `DASHBOARD_BASICO`, `DASHBOARD_AVANZADO`
- **Estado:** ⚠️ ES PARTE DEL SISTEMA BASE
- **Nota:** No son servicios facturables

### 11. **Reportes Personalizados**
- Code: `REPORTES_PERSONALIZADOS`
- **Estado:** ⚠️ EXISTE PERO NO COMO SERVICIO
- **Nota:** Los reportes existen (ReportsController) pero no se facturan aparte

### 12. **Almacenamiento**
- Codes: `STORAGE_BASICO`, `STORAGE_EXTRA`
- **Estado:** ❌ NO SE FACTURA
- **Nota:** El almacenamiento no se mide ni factura actualmente

---

## 🎯 PLAN DE ACCIÓN: Nuevos Seeders con Servicios Reales

### Servicios que DEBEN estar en los nuevos seeders:

```php
// 1. MÓDULOS CORE DEL SISTEMA (INCLUDED / UNLIMITED)
[
    'code' => 'CONTROL_NOTARIAL',
    'name' => 'Control Notarial',
    'description' => 'Sistema principal de gestión notarial (migrado desde VB6)',
    'category' => ServiceCategory::SISTEMA,
    'billing_model' => BillingModel::UNLIMITED,
    'unit_price' => null,
    'is_active' => true,
    'metadata' => [
        'required' => true,
        'base_system' => true,
        'api_externa' => 'https://localhost:44327/api'
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
    'metadata' => [
        'legacy_integration' => true,
        'features' => ['eventos_recurrentes', 'recordatorios', 'bitacora']
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
    'metadata' => [
        'ocr_scanners' => ['ine', 'curp', 'acta_nacimiento'],
        'qr_scanners' => ['sat_constancia'],
        'features' => ['pdf_qr_generation', 'email_automation']
    ],
],

// 2. BÚSQUEDAS EN LISTAS NEGRAS (PER_USE / LIMITED)
[
    'code' => 'BLACKLIST_SAT',
    'name' => 'Lista Negra SAT',
    'description' => 'Consulta de contribuyentes con restricciones del SAT',
    'category' => ServiceCategory::CONSULTA,
    'billing_model' => BillingModel::LIMITED,
    'unit_price' => 5.00, // ⚠️ Revisar precio real
    'is_active' => true,
],

[
    'code' => 'BLACKLIST_OFAC',
    'name' => 'Lista OFAC',
    'description' => 'Verificación contra la lista OFAC (Oficina de Control de Activos Extranjeros)',
    'category' => ServiceCategory::CONSULTA,
    'billing_model' => BillingModel::LIMITED,
    'unit_price' => 8.00, // ⚠️ Revisar precio real
    'is_active' => true,
],

// 3. ESCÁNER INTELIGENTE (PER_USE - OpenAI API)
[
    'code' => 'ESCANER_INTELIGENTE',
    'name' => 'Escáner Inteligente de Documentos',
    'description' => 'Análisis de documentos con IA (GPT-4o Vision)',
    'category' => ServiceCategory::API,
    'billing_model' => BillingModel::PER_USE,
    'unit_price' => 10.00, // ⚠️ Basado en costo OpenAI API
    'is_active' => true,
    'metadata' => [
        'ai_engine' => 'openai_gpt4o_vision',
        'document_types' => ['escritura', 'contrato', 'poder', 'testamento'],
        'features' => ['auto_detection', 'key_extraction', 'pdf_to_word']
    ],
],
```

---

## 📋 CHECKLIST: Actualización de Seeders

### DatabaseSeeder.php
- [ ] Eliminar servicios de ejemplo que no existen
- [ ] Agregar servicios reales (Control Notarial, Agenda, Registro Web, Escáner)
- [ ] Actualizar precios con valores reales (consultar con finanzas/admin)
- [ ] Agregar metadata útil para cada servicio

### PlanServicesSeeder.php
- [ ] Actualizar Plan Básico:
  - Control Notarial (UNLIMITED)
  - Agenda Web (INCLUDED)
  - Registro Web (LIMITED - definir cuántos registros/mes)
  - Búsquedas SAT/OFAC (LIMITED - definir cantidad)
  
- [ ] Actualizar Plan Profesional:
  - Todo lo de Básico sin límites
  - Escáner Inteligente (LIMITED - definir cantidad)
  
- [ ] Actualizar Plan Premium/Empresa:
  - Todo ilimitado

### Nuevos Enums/Constants
- [ ] Actualizar `ServiceCategory`:
  ```php
  enum ServiceCategory: string
  {
      case CONSULTA = 'consulta';          // Búsquedas OFAC/SAT
      case API = 'api';                    // Escáner Inteligente
      case SISTEMA = 'sistema';            // Control Notarial, Agenda, Registro Web
      case INTEGRACION = 'integracion';    // Webhooks (futuro)
      case ANALISIS = 'analisis';          // Reportes
      case ALMACENAMIENTO = 'almacenamiento'; // (futuro)
  }
  ```

---

## ⚠️ PREGUNTAS PARA RESOLVER

1. **Precios reales:**
   - ¿Cuánto cuesta una búsqueda OFAC/SAT al cliente final?
   - ¿Cuál es el costo de OpenAI API por análisis de documento?
   - ¿Se cobra por Escáner Inteligente o está incluido?

2. **Límites por plan:**
   - Plan Básico: ¿Cuántas búsquedas OFAC/SAT incluye?
   - Plan Básico: ¿Cuántos registros web/mes?
   - Plan Profesional: ¿Cuántos análisis con Escáner/mes?

3. **Servicios futuros:**
   - ¿Se planea implementar PEP, Lavado de Dinero?
   - ¿Firma digital está en roadmap?
   - ¿Webhooks son necesarios?

4. **Facturación de Almacenamiento:**
   - ¿Se factura por GB de documentos almacenados?
   - ¿Hay límite de almacenamiento por plan?

---

## 🚀 PRÓXIMOS PASOS

1. **Revisar con equipo de negocio:**
   - Validar servicios reales
   - Definir precios
   - Establecer límites por plan

2. **Crear nuevos seeders:**
   - `ServicesSeeder.php` actualizado
   - `PlanServicesSeeder.php` actualizado
   - Agregar `RealDataSeeder.php` para datos iniciales de producción

3. **Ejecutar:**
   ```bash
   php artisan migrate:fresh
   php artisan db:seed
   ```

4. **Verificar:**
   - Dashboard muestra servicios correctos
   - Planes tienen límites correctos
   - Facturación funciona con servicios reales

---

## 📝 NOTAS ADICIONALES

- **Control Notarial** usa API .NET externa → No facturar por uso, es parte del sistema base
- **Escáner Inteligente** usa OpenAI API → Costo variable, considerar incluir en planes altos
- **Registro Web** con OCR Gemini → Verificar si se factura aparte o está incluido
- **Agenda Web** integra con legacy → Es servicio core, debe estar INCLUDED en todos los planes

---

**Estado:** 📋 Documento listo para revisión  
**Acción requerida:** Validar con equipo de negocio para crear seeders reales
