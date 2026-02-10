# ✅ CHECKLIST DE IMPLEMENTACIÓN - FASE 1.5

## Sistema de Servicios y Planes - Guía Paso a Paso

**Estado:** 🚀 EN PROGRESO (Sprint 3 Completado)
**Fecha inicio:** Febrero 5, 2026
**Última actualización:** Febrero 10, 2026
**Responsable:** Equipo de Desarrollo
**Progreso general:** 75% ██████████████████░░░

**✅ Completado:**
- Sprint 1: Base de datos (100%)
- Sprint 3: CRUD Servicios (100%)
- Sprint 3: Gestión Plan-Servicio (100%)
- Sprint 3: CRUD Planes (100%)
- Sprint 3: Servicios por Notaría (100%)

**⏳ Pendiente:**
- Sprint 3: Dashboard de Estadísticas
- Sprint 2: Lógica de negocio (ServiceAccessManager, etc.)
- Sprint 4-6: Features avanzados

---

## ⚠️ NOTA IMPORTANTE: INTEGRACIÓN CON SUBSCRIPTIONS

**Esta arquitectura NO reemplaza la tabla `subscriptions` existente.**

- **subscriptions** → Gestiona pagos, renovaciones, vencimientos (ciclo comercial)
- **services + plan_services + tenant_services** → Gestiona acceso a herramientas y límites
- **Ambas trabajan juntas**: La verificación de acceso debe primero validar subscription activa, luego verificar servicios del plan

Ver sección "INTEGRACIÓN CON ARQUITECTURA EXISTENTE" en FASE_1.5_SERVICIOS_Y_PLANES.md para detalles.

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

- [x] Crear migración `create_services_table`
  ```bash
  php artisan make:migration create_services_table
  ```
  - [x] Agregar columnas: id, code, name, description, category, billing_model, unit_price, is_active, metadata, timestamps
  - [x] Crear índices: code (unique), category, is_active
  - [x] Ejecutar migración: `php artisan migrate`

- [x] Crear migración `create_plan_services_table`
  ```bash
  php artisan make:migration create_plan_services_table
  ```
  - [x] Agregar columnas: id, plan_id, service_id, is_included, usage_limit, extra_price, priority, timestamps
  - [x] FK a plans y services (cascade)
  - [x] Índice único compuesto (plan_id, service_id)
  - [x] Ejecutar migración

### Día 2: Migraciones Complementarias

- [x] Crear migración `create_tenant_services_table`
  ```bash
  php artisan make:migration create_tenant_services_table
  ```
  - [x] Agregar columnas: id, tenant_id, service_id, is_enabled, custom_limit, custom_price, activation_date, expiration_date, notes, timestamps
  - [x] FK a notarias y services (cascade)
  - [x] Índice único compuesto (tenant_id, service_id)
  - [x] Ejecutar migración

- [x] Crear migración `create_service_usage_table`
  ```bash
  php artisan make:migration create_service_usage_table
  ```
  - [x] Agregar columnas: id, tenant_id, service_id, user_id, consumed_at, quantity, cost, billable, billed_at, metadata, created_at
  - [x] FK a notarias, services, users
  - [x] Índices: tenant_id, consumed_at, billable
  - [x] Ejecutar migración

### Día 2-3: Enums y Modelos

- [x] Crear Enums
  ```bash
  php artisan make:enum ServiceCategory
  php artisan make:enum BillingModel
  ```
  - [x] ServiceCategory: consulta, api, sistema, analisis, storage, integration
  - [x] BillingModel: included, limited, per_use, unlimited

- [x] Crear Modelos
  ```bash
  php artisan make:model Service
  php artisan make:model PlanService
  php artisan make:model TenantService
  php artisan make:model ServiceUsage
  ```

- [x] Definir relaciones en Service.php
  - [x] belongsToMany(Plan::class)
  - [x] hasMany(ServiceUsage::class)
  - [x] belongsToMany(Notaria::class)

- [x] Definir relaciones en Plan.php
  - [x] belongsToMany(Service::class)

- [x] Definir relaciones en Notaria.php
  - [x] belongsToMany(Service::class)
  - [x] hasMany(ServiceUsage::class)

- [x] Agregar BelongsToNotaria trait a TenantService y ServiceUsage

### Día 3-4: Seeders y Datos Iniciales

- [x] Crear ServiceFactory
  ```bash
  php artisan make:factory ServiceFactory
  ```

- [x] Crear ServicesSeeder
  ```bash
  php artisan make:seeder ServicesSeeder
  ```
  - [x] Agregar servicios de consultas (BLACKLIST_SAT, BLACKLIST_OFAC, LIST_PEP, etc.)
  - [x] Agregar servicios de APIs (API_CAPTURA_DOCS, API_OCR, etc.)
  - [x] Agregar servicios de sistema (SISTEMA_NOTARIAL, EXPEDIENTES_QR, etc.)
  - [x] Agregar servicios de almacenamiento (STORAGE_BASICO, STORAGE_EXTRA)

- [x] Crear PlanServicesSeeder
  ```bash
  php artisan make:seeder PlanServicesSeeder
  ```
  - [x] Configurar Plan Básico con servicios y límites
  - [x] Configurar Plan Profesional con servicios y límites
  - [x] Configurar Plan Premium con servicios ilimitados

- [x] Ejecutar seeders
  ```bash
  php artisan db:seed --class=ServicesSeeder
  php artisan db:seed --class=PlanServicesSeeder
  ```

### Tests Sprint 1

- [x] Test: Crear servicio y validar campos
- [x] Test: Relación Service -> Plans funciona
- [x] Test: Relación Plan -> Services funciona
- [x] Test: Índices únicos previenen duplicados
- [x] Test: Cascade delete funciona correctamente
- [x] Test: BelongsToNotaria filtra correctamente
- [x] Test: Enums se castean correctamente
- [x] Test: Factory states funcionan (consulta, api, sistema, included, unlimited, limited, perUse)
- [x] Test: Metadata en formato JSON
- [x] Test: Servicios activos/inactivos
- [x] Ejecutar: `php artisan test --filter=Service` → ✅ 14/14 tests pasando

**✅ Entregable Sprint 1:** Base de datos completa con servicios iniciales (16 servicios en catálogo)

---

## 🧠 SPRINT 2: LÓGICA DE NEGOCIO (4-5 días) ⚠️ PENDIENTE

### Día 1-2: Service Manager

- [ ] Crear ServiceAccessManager
  ```bash
  php artisan make:class Services/ServiceAccessManager
  ```
  - [ ] Método: `canAccess(Notaria $notaria, string $serviceCode): bool`
    - [ ] IMPORTANTE: Verificar subscription activa primero (integración con tabla subscriptions)
    - [ ] Verificar que el plan incluye el servicio
    - [ ] Verificar customizaciones en tenant_services
    - [ ] Verificar límites de consumo
  - [ ] Método: `hasReachedLimit(Notaria $notaria, string $serviceCode): bool`
  - [ ] Método: `getRemainingUsage(Notaria $notaria, string $serviceCode): ?int`
  - [ ] Método: `getUsageStats(Notaria $notaria, string $serviceCode): array`
  - [ ] Método: `getActiveSubscription(Notaria $notaria): ?Subscription`

- [ ] Tests de ServiceAccessManager
  - [ ] Test: Usuario SIN suscripción activa es bloqueado
  - [ ] Test: Usuario con suscripción vencida es bloqueado
  - [ ] Test: Usuario con plan básico accede a servicio incluido
  - [ ] Test: Usuario sin servicio es bloqueado
  - [ ] Test: Límites se calculan correctamente
  - [ ] Test: Servicios ilimitados retornan null en límite
  - [ ] Test: Precios custom tienen prioridad
  - [ ] Test: Integración subscription → plan → services funciona

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

### Día 1-2: CRUD Servicios ✅ **COMPLETADO**

- [x] Crear ServiceController
  ```bash
  php artisan make:controller Admin/ServiceController --resource
  ```
  - [x] Implementar index (lista con filtros)
  - [x] Implementar create y store
  - [x] Implementar edit y update
  - [x] Implementar destroy
  - [x] Implementar show (con estadísticas)
  - [x] Implementar toggleActive (activar/desactivar)

- [x] Crear Form Requests
  ```bash
  php artisan make:request Admin/StoreServiceRequest
  php artisan make:request Admin/UpdateServiceRequest
  ```
  - [x] Validaciones completas con mensajes en español
  - [x] prepareForValidation() para normalizar código

- [x] Crear páginas React
  - [x] `Admin/Services/Index.tsx` (tabla con filtros y paginación)
  - [x] `Admin/Services/Create.tsx` (formulario completo)
  - [x] `Admin/Services/Edit.tsx` (formulario con datos precargados)
  - [x] `Admin/Services/Show.tsx` (detalle + estadísticas + planes)

- [x] Agregar rutas en routes/web.php
  ```php
  Route::resource('services', ServiceController::class);
  Route::post('services/{service}/toggle-active', [ServiceController::class, 'toggleActive']);
  ```

- [x] Código formateado con Pint
- [x] Verificado sin errores TypeScript/ESLint
- [x] Agregado enlace en sidebar (visible solo para Super Admin)
- [x] Corregido error de Radix UI Select (value="" → value="all")

### Día 2-3: Gestión Plan-Servicio ✅ **COMPLETADO**

- [x] Crear PlanServiceController
  ```bash
  php artisan make:controller Admin/PlanServiceController
  ```
  - [x] Método: index (servicios del plan + disponibles)
  - [x] Método: store (asignar servicio)
  - [x] Método: update (configurar límites/precios)
  - [x] Método: destroy (quitar servicio con validación subscriptions activas)
  - [x] Método: reorder (cambiar prioridad/orden)
  - [x] Método: bulkAssign (asignar múltiples servicios)

- [x] Crear página React
  - [x] `Admin/Plans/Services.tsx` (gestión servicios del plan)
  - [x] Modal para configurar límites (is_included, usage_limit, extra_price, priority)
  - [x] Modal para agregar servicios disponibles
  - [x] Toggle para incluir/excluir
  - [x] Grid de servicios disponibles con botón "Agregar"
  - [x] Tabla de servicios asignados con acciones editar/quitar
  - [x] Badges de categoría con colores

- [x] Agregar rutas en routes/web.php
  ```php
  Route::get('plans/{plan}/services', [PlanServiceController::class, 'index']);
  Route::post('plans/{plan}/services', [PlanServiceController::class, 'store']);
  Route::put('plans/{plan}/services/{service}', [PlanServiceController::class, 'update']);
  Route::delete('plans/{plan}/services/{service}', [PlanServiceController::class, 'destroy']);
  Route::post('plans/{plan}/services/reorder', [PlanServiceController::class, 'reorder']);
  Route::post('plans/{plan}/services/bulk-assign', [PlanServiceController::class, 'bulkAssign']);
  ```

- [x] Código formateado con Pint
- [x] Verificado sin errores TypeScript/ESLint

**⚠️ NOTA:** Para acceder a la vista, se necesita implementar CRUD de Planes o agregar enlace temporal en sidebar

**✅ ACTUALIZACIÓN:** CRUD de Planes implementado exitosamente.

### EXTRA: CRUD de Planes ✅ **COMPLETADO** (Febrero 9, 2026)

- [x] Crear PlanController
  ```bash
  php artisan make:controller Admin/PlanController --resource
  ```
  - [x] Implementar index (lista con filtros y estadísticas)
  - [x] Implementar create y store (con cálculo automático de orden)
  - [x] Implementar edit y update
  - [x] Implementar destroy (con validación de suscripciones activas y notarías)
  - [x] Implementar show (con estadísticas e ingresos)
  - [x] Implementar toggleActive (activar/desactivar)
  - [x] **FIX:** Corrección de nombres de columnas (billing_cycle → ciclo_facturacion, status → activa)

- [x] Crear Form Requests
  ```bash
  php artisan make:request Admin/StorePlanRequest
  php artisan make:request Admin/UpdatePlanRequest
  ```
  - [x] Validaciones completas con mensajes en español
  - [x] Auto-generación de slug desde nombre
  - [x] Validación de arrays para herramientas_activas y caracteristicas
  - [x] **FIX:** Corrección de validación (nullable|array en lugar de JSON string)

- [x] Crear páginas React
  - [x] `Admin/Plans/Index.tsx` (tabla con filtros, paginación, badges)
  - [x] `Admin/Plans/Create.tsx` (formulario con auto-slug)
    - [x] **MEJORA:** Modal para selección de servicios desde BD
    - [x] **MEJORA:** Modal para agregar características con input
    - [x] **MEJORA:** Auto-cálculo del orden de visualización sugerido
    - [x] **FIX:** Envío de arrays en lugar de JSON strings
  - [x] `Admin/Plans/Edit.tsx` (formulario con datos precargados)
    - [x] **MEJORA:** Modal para selección de servicios desde BD
    - [x] **MEJORA:** Modal para agregar características con input
    - [x] **MEJORA:** Descripción útil para orden de visualización
    - [x] **FIX:** Envío de arrays en lugar de JSON strings
  - [x] `Admin/Plans/Show.tsx` (detalle + estadísticas + botón "Gestionar Servicios")
    - [x] **FIX:** Manejo correcto de tipos number | string para precios (Laravel decimal casting)

- [x] Agregar rutas en routes/web.php
  ```php
  Route::resource('plans', PlanController::class);
  Route::post('plans/{plan}/toggle-active', [PlanController::class, 'toggleActive']);
  ```

- [x] Agregar métodos hasRole() e isSuperAdmin() en User model
- [x] Código formateado con Pint
- [x] Verificado sin errores TypeScript/ESLint
- [x] Agregado enlace "Planes" en sidebar (visible solo para Super Admin)

**🐛 Issues resueltos durante implementación:**
- ✅ Error SQL: billing_cycle column not found → Usar ciclo_facturacion y status='activa'
- ✅ Error TypeScript: amount.toFixed() on string → Interfaces actualizadas con number | string
- ✅ Error UX: JSON manual confuso → Modales con selección visual y tags
- ✅ Error validación: validation.array → Enviar arrays reales en lugar de JSON strings
- ✅ Missing import: Textarea component → Agregado a Create.tsx y Edit.tsx

**✅ Entregable Sprint 3 (Días 1-2):** CRUD completo de Planes con UX optimizada y validaciones robustas

### Día 3-4: Servicios por Notaría ✅ **COMPLETADO** (Febrero 10, 2026)

- [x] Crear TenantServiceController
  ```bash
  php artisan make:controller Admin/TenantServiceController
  ```
  - [x] Método: index (servicios de la notaría + servicios del plan)
  - [x] Método: store (activar servicio custom)
  - [x] Método: update (modificar configuración)
  - [x] Método: destroy (desactivar servicio - vuelve a configuración del plan)
  - [x] Método: toggleEnabled (activar/desactivar servicio)
  - [x] Validación: Verificar que servicio pertenece al plan de la notaría

- [x] Crear página React
  - [x] `Admin/Notarias/Services.tsx` (gestión servicios personalizados)
  - [x] Grid de servicios del plan con configuración visible
  - [x] Cards con configuración del plan + personalizada
  - [x] Modal para configurar límites personalizados
  - [x] Toggle para habilitar/deshabilitar servicios
  - [x] Botones: Personalizar, Editar, Toggle, Eliminar
  - [x] Badges para identificar servicios personalizados
  - [x] Formulario con: custom_limit, custom_price, fechas, notas

- [x] Agregar rutas en routes/web.php
  ```php
  Route::get('notarias/{notaria}/services', [TenantServiceController::class, 'index']);
  Route::post('notarias/{notaria}/services', [TenantServiceController::class, 'store']);
  Route::put('notarias/{notaria}/services/{tenantService}', [TenantServiceController::class, 'update']);
  Route::delete('notarias/{notaria}/services/{tenantService}', [TenantServiceController::class, 'destroy']);
  Route::post('notarias/{notaria}/services/{tenantService}/toggle', [TenantServiceController::class, 'toggleEnabled']);
  ```

- [x] Integración con Notarias/Show.tsx
  - [x] Botón "Gestionar Servicios" agregado
  - [x] Navegación directa a configuración de servicios

- [x] Código formateado con Pint
- [x] Verificado sin errores TypeScript/ESLint

**✅ Entregable Sprint 3 (Día 3-4):** Gestión completa de servicios personalizados por notaría

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

## 💳 SPRINT 6: GESTIÓN DE SUSCRIPCIONES (4-5 días)

### Día 1: Servicio de Gestión

- [ ] Crear SubscriptionService
  ```bash
  php artisan make:class Services/SubscriptionService
  ```
  - [ ] Método: `createTrialSubscription(Notaria $notaria, Plan $plan): Subscription`
  - [ ] Método: `renewSubscription(Subscription $subscription, string $ciclo, float $precio, string $metodoPago): Subscription`
  - [ ] Método: `suspendSubscription(Subscription $subscription, string $razon, bool $notificar = true): Subscription`
  - [ ] Método: `reactivateSubscription(Subscription $subscription, Carbon $fechaVencimiento, float $precio): Subscription`
  - [ ] Método: `cancelSubscription(Subscription $subscription, string $razon): Subscription`
  - [ ] Método: `changePlan(Subscription $subscription, Plan $newPlan, bool $aplicarProrrateo = false): Subscription`
  - [ ] Método: `calculateProrateo(Subscription $subscription, Plan $newPlan): float`

- [ ] Tests de SubscriptionService
  - [ ] Test: Trial se crea correctamente (30 días, $0)
  - [ ] Test: Renovación mensual/anual calcula fechas correctas
  - [ ] Test: Suspensión bloquea acceso y notifica
  - [ ] Test: Reactivación restaura acceso
  - [ ] Test: Cancelación es irreversible
  - [ ] Test: Cambio de plan actualiza servicios en tenant
  - [ ] Test: Prorrateo se calcula correctamente

### Día 2: Controller y Rutas

- [ ] Crear SubscriptionController (Admin)
  ```bash
  php artisan make:controller Admin/SubscriptionController
  ```
  - [ ] Método: `index()` - Listar todas las suscripciones con filtros
  - [ ] Método: `show(Subscription $subscription)` - Ver detalle + historial
  - [ ] Método: `renew()` - Renovar suscripción
  - [ ] Método: `suspend()` - Suspender suscripción
  - [ ] Método: `reactivate()` - Reactivar suscripción
  - [ ] Método: `cancel()` - Cancelar definitivamente
  - [ ] Método: `changePlan()` - Cambiar plan

- [ ] Crear Form Requests
  ```bash
  php artisan make:request Admin/RenewSubscriptionRequest
  php artisan make:request Admin/SuspendSubscriptionRequest
  php artisan make:request Admin/ChangePlanRequest
  ```
  - [ ] RenewSubscriptionRequest: ciclo, precio_pagado, metodo_pago
  - [ ] SuspendSubscriptionRequest: razon_suspension (required)
  - [ ] ChangePlanRequest: nuevo_plan_id, aplicar_prorrateo

- [ ] Agregar rutas en routes/web.php
  ```php
  Route::prefix('admin')->middleware(['auth', 'super_admin'])->name('admin.')->group(function () {
      Route::get('/subscriptions', [SubscriptionController::class, 'index'])->name('subscriptions.index');
      Route::get('/subscriptions/{subscription}', [SubscriptionController::class, 'show'])->name('subscriptions.show');
      Route::post('/subscriptions/{subscription}/renew', [SubscriptionController::class, 'renew'])->name('subscriptions.renew');
      Route::post('/subscriptions/{subscription}/suspend', [SubscriptionController::class, 'suspend'])->name('subscriptions.suspend');
      Route::post('/subscriptions/{subscription}/reactivate', [SubscriptionController::class, 'reactivate'])->name('subscriptions.reactivate');
      Route::post('/subscriptions/{subscription}/cancel', [SubscriptionController::class, 'cancel'])->name('subscriptions.cancel');
      Route::post('/subscriptions/{subscription}/change-plan', [SubscriptionController::class, 'changePlan'])->name('subscriptions.change-plan');
  });
  ```

### Día 3: Command de Automatización ✅ **COMPLETADO** (Febrero 10, 2026)

- [x] Crear CheckExpiredSubscriptions Command
  ```bash
  php artisan make:command CheckExpiredSubscriptions
  ```
  - [x] Buscar suscripciones activas vencidas → cambiar a 'vencida'
  - [x] Buscar suscripciones vencidas hace > 7 días → cambiar a 'suspendida'
  - [x] Lógica diferenciada:
    - [x] **Trial vencido**: Desactivar notaría inmediatamente (sin gracia)
    - [x] **Pago vencido**: Mantener activa 7 días (período de gracia)
    - [x] **Gracia agotada**: Suspender y desactivar notaría
  - [x] Opción `--dry-run` para previsualizar cambios sin modificar BD
  - [x] Log de todas las acciones realizadas
  - [x] Reporte tabular de resultados

- [x] Registrar en Scheduler para ejecución diaria
  ```php
  // routes/console.php
  Schedule::command('subscriptions:check-expired')
      ->daily()
      ->at('02:00')
      ->timezone('America/Mexico_City');
  ```

- [x] Tests del Command (7 tests, 16 assertions)
  - [x] Test: Suscripciones trial vencidas se marcan y desactivan inmediatamente
  - [x] Test: Suscripciones de pago vencidas se marcan pero mantienen activa (gracia)
  - [x] Test: Suspensión automática después de 7 días de gracia
  - [x] Test: No afecta suscripciones activas vigentes
  - [x] Test: Modo dry-run no realiza cambios
  - [x] Test: Procesa múltiples suscripciones correctamente
  - [x] Test: Verifica período de gracia exacto de 7 días

- [x] Código formateado con Pint
- [x] Tests pasando (7/7 passed)

**✅ Entregable:** Sistema automático de gestión de vencimientos con lógica diferenciada trial/pago

**📋 Comando disponible:**
```bash
# Ejecutar verificación manual
php artisan subscriptions:check-expired

# Modo preview (no modifica datos)
php artisan subscriptions:check-expired --dry-run

# Ver tareas programadas
php artisan schedule:list
```

### Día 3-4: Middleware de Validación

- [ ] Crear CheckActiveSubscription Middleware
  ```bash
  php artisan make:middleware CheckActiveSubscription
  ```
  - [ ] Verificar que la notaría tiene suscripción activa o trial
  - [ ] Si está vencida: permitir solo lectura (7 días gracia)
  - [ ] Si está suspendida/cancelada: bloquear acceso completo
  - [ ] Retornar JSON con mensaje descriptivo

- [ ] Registrar middleware en bootstrap/app.php
  ```php
  ->withMiddleware(function (Middleware $middleware) {
      $middleware->alias([
          'active.subscription' => CheckActiveSubscription::class,
      ]);
  })
  ```

- [ ] Integrar con ServiceAccessManager
  - [ ] Actualizar método `canAccess()` para verificar estado de suscripción primero
  - [ ] Implementar lógica de período de gracia
  - [ ] Agregar método `getSubscriptionStatus(Notaria $notaria): string`

- [ ] Tests de integración
  - [ ] Test: Usuario con suscripción activa accede normalmente
  - [ ] Test: Usuario con suscripción vencida (< 7 días) tiene acceso limitado
  - [ ] Test: Usuario con suscripción suspendida es bloqueado
  - [ ] Test: Usuario con suscripción cancelada es bloqueado
  - [ ] Test: Middleware retorna mensajes apropiados

### Día 4-5: Frontend (Vistas Inertia)

- [ ] Crear componente SubscriptionStatusBadge.vue
  - [ ] Badge visual para cada estado (trial, activa, vencida, suspendida, cancelada)
  - [ ] Colores: verde, azul, amarillo, naranja, rojo
  - [ ] Tooltip con información adicional

- [ ] Crear vista Admin/Subscriptions/Index.vue
  - [ ] Tabla con todas las suscripciones
  - [ ] Filtros: por estado, por plan, vencen pronto
  - [ ] Estadísticas: activas, trial, MRR, ARR
  - [ ] Alertas: vencen pronto, requieren acción
  - [ ] Búsqueda por notaría

- [ ] Crear vista Admin/Subscriptions/Show.vue
  - [ ] Información completa de la suscripción
  - [ ] Historial de cambios de estado
  - [ ] Historial de pagos
  - [ ] Botones de acción: Renovar, Suspender, Cambiar Plan, Cancelar

- [ ] Crear modales de acciones
  - [ ] RenewSubscriptionModal.vue
    - [ ] Seleccionar ciclo (mensual/anual)
    - [ ] Mostrar precio del plan
    - [ ] Seleccionar método de pago
    - [ ] Calcular nueva fecha de vencimiento
  - [ ] ChangePlanModal.vue
    - [ ] Seleccionar nuevo plan
    - [ ] Checkbox para aplicar prorrateo
    - [ ] Mostrar comparación planes (actual vs nuevo)
    - [ ] Calcular precio con prorrateo
  - [ ] SuspendSubscriptionModal.vue
    - [ ] Textarea para razón (required)
    - [ ] Checkbox para notificar cliente
    - [ ] Advertencia de bloqueo de acceso
  - [ ] CancelSubscriptionModal.vue
    - [ ] Confirmación doble (input "CANCELAR")
    - [ ] Textarea para razón (required)
    - [ ] Advertencia irreversible
    - [ ] Checkbox "Entiendo que esta acción no se puede deshacer"

- [ ] Actualizar Admin/Notarias/Show.vue
  - [ ] Agregar widget de suscripción actual
  - [ ] Mostrar estado, plan, fechas
  - [ ] Botones inline: Renovar, Suspender, Cambiar Plan
  - [ ] Historial rápido de últimos 5 movimientos

- [ ] Wayfinder routes
  ```bash
  npm run wayfinder
  ```
  - [ ] Generar funciones TypeScript para todas las rutas de suscripciones
  - [ ] Verificar importaciones en componentes Vue

### Día 5: Notificaciones

- [ ] Crear Notifications
  ```bash
  php artisan make:notification SubscriptionExpiringSoon
  php artisan make:notification SubscriptionExpired
  php artisan make:notification SubscriptionSuspended
  php artisan make:notification SubscriptionReactivated
  ```
  - [ ] Configurar canales: mail, database
  - [ ] Templates de email personalizados
  - [ ] Variables dinámicas (nombre notaría, fecha vencimiento, etc.)

- [ ] Integrar notificaciones en SubscriptionService
  - [ ] Al vencer: notificar 7 días antes, 3 días antes, día de vencimiento
  - [ ] Al suspender: notificar inmediatamente
  - [ ] Al reactivar: confirmar reactivación
  - [ ] Al cambiar plan: informar cambios

- [ ] Tests de notificaciones
  - [ ] Test: Notificaciones se envían en momento correcto
  - [ ] Test: Contenido de emails es correcto
  - [ ] Test: Notificaciones se guardan en BD

**✅ Entregable Sprint 6:** Sistema completo de gestión de suscripciones integrado con servicios

---

## 📈 RESUMEN DE PROGRESO ACTUAL (Febrero 10, 2026)

### ✅ COMPLETADO (75%)

#### Sprint 1: Base de Datos ✅ (100%)
- ✅ 4 tablas creadas (services, plan_services, tenant_services, service_usage)
- ✅ 2 Enums (ServiceCategory, BillingModel)
- ✅ 4 Modelos con relaciones
- ✅ 2 Seeders (16 servicios + 3 planes configurados)
- ✅ 14/14 tests pasando

#### Sprint 3: Panel Super Admin ✅ (100% completado)
**✅ CRUD Servicios (Día 1-2):**
- ✅ ServiceController (8 métodos)
- ✅ Form Requests con validaciones
- ✅ 4 páginas React (Index, Create, Edit, Show)
- ✅ Rutas configuradas
- ✅ Enlace en sidebar

**✅ Gestión Plan-Servicio (Día 2-3):**
- ✅ PlanServiceController (6 métodos)
- ✅ Plans/Services.tsx con modales de configuración
- ✅ Asignación de servicios a planes
- ✅ Configuración de límites y precios

**✅ CRUD Planes (Extra - Completado):**
- ✅ PlanController (8 métodos)
  - ✅ **Auto-sincronización**: `herramientas_activas` → `plan_services` en store()
  - ✅ **Auto-sincronización**: `herramientas_activas` → `plan_services` en update() con sync()
- ✅ Form Requests con auto-slug y validaciones de arrays
- ✅ 4 páginas React con UX optimizada
  - ✅ Modal para selección de servicios (Create - mantiene asignación inicial)
  - ✅ Edit SIN sección de servicios (gestión centralizada en Services.tsx)
  - ✅ Modal para características
  - ✅ Auto-cálculo de orden de visualización
- ✅ Comando Artisan: `plan:sync-services`
  - ✅ Sincroniza planes existentes creados antes de auto-sync
  - ✅ Opción `--plan={id}` para sincronizar plan específico
  - ✅ Mantiene configuraciones existentes en pivot
- ✅ 5 fixes importantes aplicados:
  - ✅ billing_cycle → ciclo_facturacion
  - ✅ Tipos number | string para precios
  - ✅ Arrays en lugar de JSON strings
  - ✅ Imports de Textarea
  - ✅ Validación de arrays corregida

**📝 FLUJO DE GESTIÓN DE SERVICIOS:**
1. **Create** → Seleccionar servicios iniciales (opcional, auto-sincronizados)
2. **Edit** → NO permite modificar servicios (evita redundancias)
3. **Services** → Única fuente de verdad para agregar/quitar/configurar servicios

**✅ Servicios por Notaría (Día 3-4):**
- ✅ TenantServiceController (5 métodos)
- ✅ Notarias/Services.tsx con grid de servicios
- ✅ Modal de configuración personalizada
- ✅ Toggle activar/desactivar servicios
- ✅ Botón "Gestionar Servicios" en Notarias/Show

### ⏳ PENDIENTE (25%)

#### Sprint 3: Dashboard de Estadísticas (Opcional)
- ⏳ ServiceStatsController
- ⏳ Dashboard con gráficas

#### Sprint 2: Lógica de Negocio (Crítico)
- ⏳ ServiceAccessManager (verificar acceso)
- ⏳ ServiceUsageRecorder (registrar consumo)
- ⏳ BillingCalculator (calcular costos)
- ⏳ Tests de lógica de negocio

#### Sprint 4-6: Features Avanzados
- ⏳ Usage Tracking
- ⏳ Reporting
- ⏳ Gestión de Suscripciones

### 🎯 PRÓXIMO PASO
**Sprint 2: Lógica de Negocio** - ServiceAccessManager para verificar acceso a servicios

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


🎯 Próximo paso sugerido:
Crear un Job asíncrono para sincronización periódica:

Actualizar servicios cuando cambien en la BD central
Actualizar límites cuando cambie el plan
Sincronizar usage con la BD central para facturación



// Crear suscripciones activas
        Subscription::firstOrCreate([
            'notaria_id' => $notaria1->id,
        ], [
            'plan_id' => $planBasico->id,
            'fecha_inicio' => now()->subMonth(),
            'fecha_vencimiento' => now()->addMonth(),
            'status' => Subscription::STATUS_ACTIVA,
            'ciclo_facturacion' => Subscription::CICLO_MENSUAL,
            'precio_pagado' => $planBasico->precio_mensual,
            'metodo_pago' => 'tarjeta_credito',
            'moneda' => 'MXN',
            'auto_renovacion' => true,
        ]);


¡Perfecto! Ya completamos el CRUD completo de Planes y Servicios.

📊 Estado Actual - FASE 1.5:
✅ Completado:
Sprint 1: Base de datos completa (migraciones, modelos, seeders)
Sprint 3 - Día 1-2:
✅ ServiceController (CRUD completo)
✅ PlanController (CRUD completo)
✅ PlanServiceController (gestión plan-servicio)
✅ Vistas React para Servicios y Planes
🎯 Siguiente Paso - 3 Opciones:
Opción 1: TenantServiceController (Recomendada - continúa Sprint 3) 🎯
Gestión de servicios personalizados por notaría:

Ver servicios disponibles del plan de cada notaría
Habilitar/deshabilitar servicios específicos
Configurar límites personalizados (overrides)
Configurar precios custom por notaría
Vista: Admin/Notarias/Services.tsx
Flujo: Super Admin → Notarías → [Notaría X] → "Gestionar Servicios" → Personalizar servicios

Opción 2: Lógica de Negocio (Sprint 2)
Implementar los managers del sistema:

ServiceAccessManager (verificar acceso a servicios)
ServiceUsageRecorder (registrar consumo)
BillingCalculator (calcular costos)
Opción 3: Dashboard de Estadísticas
Panel de métricas y consumo:

Gráficas de uso por servicio
Top 10 notarías consumidoras
Proyección de facturación


implementacion de suscripciones de acuerdo a planes, modificar suscripciones actuales
asignacion de planes de acuerdo a suscripciones


espera, vamos a verificar un punto, al crear una notaría se le agrega por default el plan trial. al ser una prueba me gustaria verificar que despues del periodo de prueba tenga un cambio de estado a inactivo para la notaría que tenga ese plan. presisamente por que solo es trial. como podemos verificar esto

Excelente punto. Necesitamos verificar el flujo completo de trial → vencimiento → desactivación. Vamos a revisar:

¿Se crea automáticamente una suscripción trial al crear una notaría?
¿Existe un comando/job que verifique suscripciones vencidas?
¿Se desactiva automáticamente la notaría cuando expira el trial?
Perfecto, encontré el problema y la solución necesaria:

🔍 Estado Actual:
✅ Lo que SÍ funciona:
<?php
// NotariaController.php línea 118-129
Subscription::create([
    'notaria_id' => $notaria->id,
    'plan_id' => $validated['plan_id'],
    'status' => 'trial',              // ✅ Se crea como trial
    'fecha_inicio' => now(),
    'fecha_vencimiento' => now()->addMonth(), // ✅ 1 mes de prueba
    'precio_pagado' => $plan ? $plan->precio_mensual : 0,
    'ciclo_facturacion' => 'mensual',
    'auto_renovacion' => true,
]);

 Lo que NO existe:
Comando que verifique diariamente suscripciones vencidas
Lógica para cambiar subscription.status de trial → vencida
Lógica para desactivar notaria.activa = false cuando expira
💡 Solución: Crear comando automático
Voy a crear un Command que se ejecute diariamente y:

Detecte suscripciones vencidas
Cambie su status a 'vencida'
Desactive la notaría automáticamente
Opcionalmente: período de gracia de 7 días antes de desactivar
si, pero es importante que el estatus de vencido cambie unicamente para la notaría. esto es importante porque igualmente para otro tipo de suscripciones si el cliente no paga podria tener un periodo de gracia antes de que se inhabilite el plan de su suscripcion.

Excelente distinción. Vamos a implementar la lógica con dos comportamientos diferentes:

Trial vencido → Desactivar inmediatamente
Suscripción de pago vencida → Período de gracia de 7 días antes de desactivar
