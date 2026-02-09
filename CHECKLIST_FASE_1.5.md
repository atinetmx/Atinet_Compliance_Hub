# ✅ CHECKLIST DE IMPLEMENTACIÓN - FASE 1.5

## Sistema de Servicios y Planes - Guía Paso a Paso

**Estado:** 📋 Lista para iniciar
**Fecha inicio:** [Por definir]
**Responsable:** Equipo de Desarrollo

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

## 🧠 SPRINT 2: LÓGICA DE NEGOCIO (4-5 días)

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

### Día 3: Command de Automatización

- [ ] Crear CheckExpiredSubscriptions Command
  ```bash
  php artisan make:command CheckExpiredSubscriptions
  ```
  - [ ] Buscar suscripciones activas vencidas → cambiar a 'vencida'
  - [ ] Buscar suscripciones vencidas hace > 7 días → cambiar a 'suspendida'
  - [ ] Enviar notificaciones a notarías afectadas
  - [ ] Enviar reporte diario a SuperAdmin
  - [ ] Log de todas las acciones realizadas

- [ ] Registrar en Kernel para ejecución diaria
  ```php
  // bootstrap/app.php o routes/console.php
  Schedule::command('subscriptions:check-expired')->daily();
  ```

- [ ] Tests del Command
  - [ ] Test: Suscripciones vencidas se marcan correctamente
  - [ ] Test: Suspensión automática después de 7 días
  - [ ] Test: Notificaciones se envían correctamente
  - [ ] Test: Log completo de acciones

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
