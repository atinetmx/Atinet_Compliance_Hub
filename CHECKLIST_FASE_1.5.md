# ✅ CHECKLIST DE IMPLEMENTACIÓN - FASE 1.5

## Sistema de Servicios y Planes - Guía Paso a Paso

**Estado:** 📋 Lista para iniciar  
**Fecha inicio:** [Por definir]  
**Responsable:** Equipo de Desarrollo

---

## 🎯 PRE-REQUISITOS

- [ ] Fase 1 completada al 100%
- [ ] Documento FASE_1.5 revisado por equipo
- [ ] Ambiente de desarrollo configurado
- [ ] Base de datos de testing disponible
- [ ] Aprobación de gerencia recibida
- [ ] Reunión con equipo comercial completada (definir servicios)

---

## 📦 SPRINT 1: BASE DE DATOS (3-4 días)

### Día 1: Migraciones Principales

- [ ] Crear migración `create_services_table`
  ```bash
  php artisan make:migration create_services_table
  ```
  - [ ] Agregar columnas: id, code, name, description, category, billing_model, unit_price, is_active, metadata, timestamps
  - [ ] Crear índices: code (unique), category, is_active
  - [ ] Ejecutar migración: `php artisan migrate`

- [ ] Crear migración `create_plan_services_table`
  ```bash
  php artisan make:migration create_plan_services_table
  ```
  - [ ] Agregar columnas: id, plan_id, service_id, is_included, usage_limit, extra_price, priority, timestamps
  - [ ] FK a plans y services (cascade)
  - [ ] Índice único compuesto (plan_id, service_id)
  - [ ] Ejecutar migración

### Día 2: Migraciones Complementarias

- [ ] Crear migración `create_tenant_services_table`
  ```bash
  php artisan make:migration create_tenant_services_table
  ```
  - [ ] Agregar columnas: id, tenant_id, service_id, is_enabled, custom_limit, custom_price, activation_date, expiration_date, notes, timestamps
  - [ ] FK a notarias y services (cascade)
  - [ ] Índice único compuesto (tenant_id, service_id)
  - [ ] Ejecutar migración

- [ ] Crear migración `create_service_usage_table`
  ```bash
  php artisan make:migration create_service_usage_table
  ```
  - [ ] Agregar columnas: id, tenant_id, service_id, user_id, consumed_at, quantity, cost, billable, billed_at, metadata, created_at
  - [ ] FK a notarias, services, users
  - [ ] Índices: tenant_id, consumed_at, billable
  - [ ] Ejecutar migración

### Día 2-3: Enums y Modelos

- [ ] Crear Enums
  ```bash
  php artisan make:enum ServiceCategory
  php artisan make:enum BillingModel
  ```
  - [ ] ServiceCategory: consulta, api, sistema, analisis, storage, integration
  - [ ] BillingModel: included, limited, per_use, unlimited

- [ ] Crear Modelos
  ```bash
  php artisan make:model Service
  php artisan make:model PlanService
  php artisan make:model TenantService
  php artisan make:model ServiceUsage
  ```

- [ ] Definir relaciones en Service.php
  - [ ] belongsToMany(Plan::class)
  - [ ] hasMany(ServiceUsage::class)
  - [ ] belongsToMany(Notaria::class)

- [ ] Definir relaciones en Plan.php
  - [ ] belongsToMany(Service::class)

- [ ] Definir relaciones en Notaria.php
  - [ ] belongsToMany(Service::class)
  - [ ] hasMany(ServiceUsage::class)

- [ ] Agregar BelongsToNotaria trait a TenantService y ServiceUsage

### Día 3-4: Seeders y Datos Iniciales

- [ ] Crear ServiceFactory
  ```bash
  php artisan make:factory ServiceFactory
  ```

- [ ] Crear ServicesSeeder
  ```bash
  php artisan make:seeder ServicesSeeder
  ```
  - [ ] Agregar servicios de consultas (BLACKLIST_SAT, BLACKLIST_OFAC, LIST_PEP, etc.)
  - [ ] Agregar servicios de APIs (API_CAPTURA_DOCS, API_OCR, etc.)
  - [ ] Agregar servicios de sistema (SISTEMA_NOTARIAL, EXPEDIENTES_QR, etc.)
  - [ ] Agregar servicios de almacenamiento (STORAGE_BASE, STORAGE_EXTRA_GB)

- [ ] Crear PlanServicesSeeder
  ```bash
  php artisan make:seeder PlanServicesSeeder
  ```
  - [ ] Configurar Plan Básico con servicios y límites
  - [ ] Configurar Plan Profesional con servicios y límites
  - [ ] Configurar Plan Premium con servicios ilimitados

- [ ] Ejecutar seeders
  ```bash
  php artisan db:seed --class=ServicesSeeder
  php artisan db:seed --class=PlanServicesSeeder
  ```

### Tests Sprint 1

- [ ] Test: Crear servicio y validar campos
- [ ] Test: Relación Service -> Plans funciona
- [ ] Test: Relación Plan -> Services funciona
- [ ] Test: Índices únicos previenen duplicados
- [ ] Test: Cascade delete funciona correctamente
- [ ] Test: BelongsToNotaria filtra correctamente
- [ ] Ejecutar: `php artisan test --filter=Service`

**✅ Entregable Sprint 1:** Base de datos completa con servicios iniciales

---

## 🧠 SPRINT 2: LÓGICA DE NEGOCIO (4-5 días)

### Día 1-2: Service Manager

- [ ] Crear ServiceAccessManager
  ```bash
  php artisan make:class Services/ServiceAccessManager
  ```
  - [ ] Método: `canAccess(Notaria $notaria, string $serviceCode): bool`
  - [ ] Método: `hasReachedLimit(Notaria $notaria, string $serviceCode): bool`
  - [ ] Método: `getRemainingUsage(Notaria $notaria, string $serviceCode): ?int`
  - [ ] Método: `getUsageStats(Notaria $notaria, string $serviceCode): array`

- [ ] Tests de ServiceAccessManager
  - [ ] Test: Usuario con plan básico accede a servicio incluido
  - [ ] Test: Usuario sin servicio es bloqueado
  - [ ] Test: Límites se calculan correctamente
  - [ ] Test: Servicios ilimitados retornan null en límite
  - [ ] Test: Precios custom tienen prioridad

### Día 2-3: Usage Recorder

- [ ] Crear ServiceUsageRecorder
  ```bash
  php artisan make:class Services/ServiceUsageRecorder
  ```
  - [ ] Método: `record(Notaria $notaria, Service $service, User $user, array $metadata = []): ServiceUsage`
  - [ ] Método: `calculateCost(ServiceUsage $usage): float`
  - [ ] Método: `markAsBilled(Collection $usages): void`

- [ ] Tests de ServiceUsageRecorder
  - [ ] Test: Registro de uso crea entrada correcta
  - [ ] Test: Costo se calcula según billing model
  - [ ] Test: Precio custom se aplica correctamente
  - [ ] Test: Metadata JSON se guarda
  - [ ] Test: markAsBilled actualiza correctamente

### Día 3-4: Billing Calculator

- [ ] Crear ServiceBillingCalculator
  ```bash
  php artisan make:class Services/ServiceBillingCalculator
  ```
  - [ ] Método: `calculateMonthlyBill(Notaria $notaria, Carbon $month): array`
  - [ ] Método: `getExtraCharges(Notaria $notaria, Carbon $month): Collection`
  - [ ] Método: `generateInvoiceData(Notaria $notaria, Carbon $month): array`

- [ ] Tests de ServiceBillingCalculator
  - [ ] Test: Factura mensual incluye plan + extras
  - [ ] Test: Límites excedidos se cobran
  - [ ] Test: Servicios per_use se suman
  - [ ] Test: IVA se calcula correctamente
  - [ ] Test: Data de factura es completa

### Día 4: Middleware y Helpers

- [ ] Crear Middleware CheckServiceAccess
  ```bash
  php artisan make:middleware CheckServiceAccess
  ```
  - [ ] Implementar handle con verificación de acceso
  - [ ] Registrar en bootstrap/app.php como 'service'

- [ ] Crear helpers en app/helpers.php
  ```php
  function can_use_service(string $serviceCode): bool
  function record_service_usage(string $serviceCode, array $metadata = []): void
  function get_service_limit(string $serviceCode): ?int
  ```

- [ ] Tests de Middleware
  - [ ] Test: Request con acceso pasa
  - [ ] Test: Request sin acceso retorna 403
  - [ ] Test: Request con límite alcanzado retorna 429

### Día 5: Integración y Refactoring

- [ ] Revisar performance de queries
- [ ] Agregar eager loading donde sea necesario
- [ ] Documentar métodos públicos con PHPDoc
- [ ] Code review del equipo
- [ ] Optimizar índices si es necesario

**✅ Entregable Sprint 2:** Lógica de negocio completa y testeada

---

## 🎨 SPRINT 3: PANEL SUPER ADMIN (5-6 días)

### Día 1-2: CRUD Servicios

- [ ] Crear ServiceController
  ```bash
  php artisan make:controller Admin/ServiceController --resource
  ```
  - [ ] Implementar index (lista con filtros)
  - [ ] Implementar create y store
  - [ ] Implementar edit y update
  - [ ] Implementar destroy
  - [ ] Implementar show (con estadísticas)

- [ ] Crear Form Requests
  ```bash
  php artisan make:request Admin/StoreServiceRequest
  php artisan make:request Admin/UpdateServiceRequest
  ```

- [ ] Crear páginas React
  - [ ] `Admin/Services/Index.tsx` (tabla con filtros)
  - [ ] `Admin/Services/Create.tsx` (formulario)
  - [ ] `Admin/Services/Edit.tsx` (formulario)
  - [ ] `Admin/Services/Show.tsx` (detalle + stats)

- [ ] Agregar rutas en routes/web.php
  ```php
  Route::middleware(['auth', 'super_admin'])->prefix('admin')->group(function () {
      Route::resource('services', ServiceController::class);
  });
  ```

### Día 2-3: Gestión Plan-Servicio

- [ ] Crear PlanServiceController
  ```bash
  php artisan make:controller Admin/PlanServiceController
  ```
  - [ ] Método: index (servicios del plan)
  - [ ] Método: store (asignar servicio)
  - [ ] Método: update (configurar límites/precios)
  - [ ] Método: destroy (quitar servicio)

- [ ] Crear página React
  - [ ] `Admin/Plans/Services.tsx` (gestión servicios del plan)
  - [ ] Implementar drag-and-drop para reordenar
  - [ ] Modal para configurar límites
  - [ ] Toggle para incluir/excluir

### Día 3-4: Servicios por Notaría

- [ ] Crear TenantServiceController
  ```bash
  php artisan make:controller Admin/TenantServiceController
  ```
  - [ ] Método: index (servicios de la notaría)
  - [ ] Método: store (activar servicio custom)
  - [ ] Método: update (modificar configuración)
  - [ ] Método: destroy (desactivar servicio)

- [ ] Crear página React
  - [ ] `Admin/Notarias/Services.tsx` (servicios activos)
  - [ ] Cards con toggle activar/desactivar
  - [ ] Form para límites y precios custom
  - [ ] Indicador de consumo actual

### Día 4-5: Estadísticas y Dashboard

- [ ] Crear ServiceStatsController
  ```bash
  php artisan make:controller Admin/ServiceStatsController
  ```
  - [ ] Método: index (dashboard general)
  - [ ] Método: byService (stats por servicio)
  - [ ] Método: byTenant (stats por notaría)
  - [ ] Método: billing (proyección facturación)

- [ ] Crear página React
  - [ ] `Admin/Services/Stats.tsx` (dashboard de uso)
  - [ ] Gráficas con Recharts (línea, barras, pie)
  - [ ] Top 10 notarías consumidoras
  - [ ] Proyección de facturación mensual

### Día 5-6: Componentes y Validaciones

- [ ] Crear componentes reutilizables
  - [ ] `ServiceCard.tsx` (card de servicio)
  - [ ] `ServiceBadge.tsx` (badge de categoría/billing)
  - [ ] `UsageIndicator.tsx` (progress bar de uso)
  - [ ] `PlanServiceAssigner.tsx` (asignar servicio a plan)
  - [ ] `ServiceUsageChart.tsx` (gráfica de consumo)

- [ ] Implementar validaciones frontend
  - [ ] Precios no negativos
  - [ ] Límites válidos (> 0 o null)
  - [ ] Fechas de expiración futuras
  - [ ] Códigos de servicio únicos

- [ ] Tests de integración
  - [ ] Test: CRUD completo de servicios
  - [ ] Test: Asignar servicio a plan
  - [ ] Test: Activar servicio para notaría
  - [ ] Test: Dashboard carga correctamente

**✅ Entregable Sprint 3:** Panel admin completo y operativo

---

## 👥 SPRINT 4: VISTA NOTARÍA (3-4 días)

### Día 1: Dashboard de Servicios

- [ ] Crear NotariaServiceController
  ```bash
  php artisan make:controller NotariaServiceController
  ```
  - [ ] Método: index (servicios activos)
  - [ ] Método: show (detalle de servicio)

- [ ] Crear página React
  - [ ] `Notaria/Services/Index.tsx` (dashboard servicios)
  - [ ] Grid de cards con servicios activos
  - [ ] Progress bars de uso vs límite
  - [ ] Alertas si cerca del límite (80%+)
  - [ ] Badge de billing model

### Día 2: Historial de Uso

- [ ] Crear NotariaServiceUsageController
  ```bash
  php artisan make:controller NotariaServiceUsageController
  ```
  - [ ] Método: index (historial con filtros)
  - [ ] Método: export (Excel/PDF)
  - [ ] Método: stats (gráficas de tendencia)

- [ ] Crear página React
  - [ ] `Notaria/Services/Usage.tsx` (historial)
  - [ ] Tabla filtrable (servicio, fecha, usuario)
  - [ ] Paginación
  - [ ] Botón exportar
  - [ ] Gráfica de tendencia mensual

### Día 3: Marketplace

- [ ] Crear página React
  - [ ] `Notaria/Services/Marketplace.tsx` (catálogo)
  - [ ] Cards de servicios disponibles
  - [ ] Información de precios y límites
  - [ ] Botón "Solicitar servicio" (genera ticket)
  - [ ] Comparación con plan actual

### Día 4: Widget en Dashboard

- [ ] Modificar `NotariaDashboard.tsx`
  - [ ] Agregar sección "Tus Servicios"
  - [ ] Mostrar top 3 servicios más usados
  - [ ] Alertas de límites cercanos
  - [ ] Link a vista completa de servicios

- [ ] Crear componente ServiceWidget
  - [ ] Muestra servicio, uso, límite
  - [ ] Color indica estado (verde, amarillo, rojo)
  - [ ] Animaciones con GSAP

**✅ Entregable Sprint 4:** Vista notaría completa y funcional

---

## 🧪 SPRINT 5: TESTING Y DOCUMENTACIÓN (2-3 días)

### Día 1: Tests Completos

- [ ] Unit Tests (25+)
  - [ ] ServiceAccessManager (8 tests)
  - [ ] ServiceUsageRecorder (7 tests)
  - [ ] ServiceBillingCalculator (6 tests)
  - [ ] Helpers (4 tests)

- [ ] Integration Tests (15+)
  - [ ] Flujo completo: activar servicio → usar → facturar
  - [ ] Multi-tenancy (aislamiento de datos)
  - [ ] Límites y consumo
  - [ ] Precios custom
  - [ ] Facturación mensual

- [ ] Feature Tests (10+)
  - [ ] CRUD servicios (admin)
  - [ ] Gestión plan-servicio (admin)
  - [ ] Vista servicios (notaría)
  - [ ] Historial de uso (notaría)

- [ ] Ejecutar suite completa
  ```bash
  php artisan test --coverage
  ```
  - [ ] Target: 80%+ coverage

### Día 1-2: Documentación Técnica

- [ ] Actualizar README.md
  - [ ] Sección de sistema de servicios
  - [ ] Instrucciones de uso de helpers
  - [ ] Ejemplos de código

- [ ] Crear API Documentation
  - [ ] Endpoints de servicios
  - [ ] Request/Response examples
  - [ ] Error codes

- [ ] Documentar lógica de negocio
  - [ ] Flujo de verificación de acceso
  - [ ] Cálculo de facturación
  - [ ] Prioridades de precios

- [ ] Diagramas de flujo
  - [ ] Flujo de uso de servicio
  - [ ] Proceso de facturación
  - [ ] Arquitectura de servicios

### Día 2: Documentación Usuario

- [ ] Manual Super Admin
  - [ ] Cómo crear servicios
  - [ ] Cómo asignar a planes
  - [ ] Cómo personalizar por notaría
  - [ ] Interpretar estadísticas

- [ ] Manual Notaría
  - [ ] Cómo ver servicios activos
  - [ ] Entender límites y uso
  - [ ] Solicitar servicios adicionales
  - [ ] Exportar historial

- [ ] FAQs
  - [ ] ¿Qué pasa si excedo el límite?
  - [ ] ¿Cómo se cobra el uso extra?
  - [ ] ¿Puedo cambiar de plan?
  - [ ] ¿Cómo solicito un servicio nuevo?

### Día 3: Performance y Optimización

- [ ] Performance Testing
  - [ ] Benchmark de queries de consumo
  - [ ] Optimizar índices
  - [ ] Agregar eager loading
  - [ ] Cache de verificación de acceso

- [ ] Code Review Final
  - [ ] Revisar todos los controllers
  - [ ] Verificar validaciones
  - [ ] Comprobar multi-tenancy
  - [ ] Linting (Pint y ESLint)

- [ ] Security Audit
  - [ ] Verificar autorizaciones
  - [ ] Validar que super_admin sea requerido
  - [ ] Comprobar injection SQL
  - [ ] Test de data leakage

**✅ Entregable Sprint 5:** Sistema completo, testeado y documentado

---

## 🎉 POST-IMPLEMENTACIÓN

### Semana 1 Post-Launch

- [ ] Monitoreo de logs y errores
- [ ] Recopilar feedback de super admin
- [ ] Ajustes menores de UI/UX
- [ ] Performance monitoring

### Semana 2 Post-Launch

- [ ] Reunión con equipo comercial
  - [ ] Training en nuevo sistema
  - [ ] Casos de uso reales
  - [ ] Pricing strategies

- [ ] Piloto con 2-3 notarías
  - [ ] Capacitación usuarios
  - [ ] Recopilar feedback
  - [ ] Ajustar según necesidades

### Semana 3 Post-Launch

- [ ] Iteración basada en feedback
- [ ] Documentación de lecciones aprendidas
- [ ] Preparación para Fase 2

---

## 📊 MÉTRICAS DE ÉXITO

### Técnicas ✅
- [ ] 40+ tests pasando con 80%+ coverage
- [ ] Response time < 200ms en verificación de acceso
- [ ] 0 N+1 queries en listados
- [ ] 100% de consumo registrado correctamente
- [ ] 0 errores de multi-tenancy en tests

### Negocio ✅
- [ ] Planes completamente configurados con servicios
- [ ] Panel admin operativo para gestión
- [ ] Notarías pueden ver uso y límites claramente
- [ ] Facturación calculada automáticamente
- [ ] Documentación completa y comprensible

### Calidad ✅
- [ ] 0 errores de compilación
- [ ] 0 warnings de linting
- [ ] Code review aprobado por equipo
- [ ] Performance validado
- [ ] Security audit pasado

---

## ⚠️ BLOQUEADORES Y ESCALACIÓN

### Si encuentras bloqueadores:

1. **Técnicos:**
   - Documentar el problema detalladamente
   - Buscar solución alternativa
   - Escalar a líder técnico si > 2 horas

2. **De Negocio:**
   - Consultar con equipo comercial
   - Documentar decisión
   - Continuar con otras tareas

3. **De Diseño:**
   - Crear mockup básico
   - Validar con equipo
   - Iterar según feedback

### Canales de Escalación:
- **Técnico:** Slack #dev-soporte
- **Negocio:** Email gerencia
- **Urgente:** WhatsApp equipo

---

## 🎓 RECURSOS

### Documentación
- [Fase 1.5 Completa](FASE_1.5_SERVICIOS_Y_PLANES.md)
- [Resumen Ejecutivo](RESUMEN_EJECUTIVO_FASE_1.5.md)
- [Plan General](PLAN_DESARROLLO_ATINET_COMPLIANCE_HUB.md)

### Ejemplos de Código
- Laravel Multi-tenancy: https://laravel.com/docs/12.x/eloquent#global-scopes
- Service Layer Pattern: https://dev.to/patterns
- Billing Systems: https://stripe.com/docs/billing

---

## ✍️ NOTAS Y APRENDIZAJES

### Durante la implementación:
*Espacio para notas del equipo*

---

**💪 ¡Vamos equipo! A construir la mejor arquitectura de servicios SaaS!**

---

**Última actualización:** 9 de Febrero, 2026  
**Mantenido por:** Equipo de Desarrollo ATINET
