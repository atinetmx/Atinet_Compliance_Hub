# 🎯 FASE 1.5: SISTEMA DE SERVICIOS Y PLANES DE SUSCRIPCIÓN

**Versión:** 1.0  
**Fecha:** 9 de Febrero, 2026  
**Estado:** 📋 PLANIFICACIÓN  
**Prioridad:** 🔥 CRÍTICA (prerequisito para Fase 2)

---

## 📊 CONTEXTO Y JUSTIFICACIÓN

### ¿Por qué este paso es crítico AHORA?

La Fase 1 implementó la estructura multi-tenant con planes básicos. **ANTES** de implementar herramientas específicas (listas negras, PEP, APIs, etc.) en la Fase 2, necesitamos:

1. **Arquitectura escalable** que soporte crecimiento sin migraciones constantes
2. **Modelo de negocio flexible** que permita ventas personalizadas
3. **Sistema de facturación** basado en consumo y límites
4. **Catálogo de servicios** independiente de los planes
5. **Control granular** de acceso y permisos por servicio

### Problema que resuelve

**❌ Arquitectura actual (limitada):**
```sql
plans
- id
- name
- monthly_price
- features (JSON) ← rígido, difícil escalar
```

**✅ Arquitectura propuesta (flexible):**
```sql
services (catálogo independiente)
plans (marcos de suscripción)
plan_services (relación con límites)
tenant_services (personalizaciones)
service_usage (consumo real)
```

### Beneficios clave

- ✅ **Sin migraciones futuras** al agregar servicios
- ✅ **Add-ons y bundles** para ventas especiales
- ✅ **Pricing personalizado** por notaría
- ✅ **Auditoría de consumo** para facturación precisa
- ✅ **Control granular** de acceso por servicio
- ✅ **Escalabilidad** sin límites arquitectónicos

---

## 🔗 INTEGRACIÓN CON ARQUITECTURA EXISTENTE

### Relación con tabla `subscriptions`

**IMPORTANTE:** La tabla `subscriptions` (ya existente) **NO queda obsoleta**. Ambas arquitecturas son **complementarias** y trabajan juntas:

#### **`subscriptions`** → Gestión de la suscripción
```sql
subscriptions
├─ notaria_id          (¿Qué notaría?)
├─ plan_id             (¿Qué plan contrató?)
├─ fecha_inicio
├─ fecha_vencimiento
├─ status              (activa/vencida/cancelada)
├─ precio_pagado
├─ ciclo_facturacion   (mensual/anual)
└─ auto_renovacion

Propósito: Gestionar PAGOS, RENOVACIONES y STATUS de la suscripción
```

#### **Nueva arquitectura de servicios** → Gestión de herramientas
```sql
services              → Catálogo de herramientas disponibles
plan_services         → Qué servicios incluye cada plan + límites
tenant_services       → Customizaciones por notaría
service_usage         → Tracking de consumo para facturación

Propósito: Gestionar ACCESO, LÍMITES y CONSUMO de herramientas
```

### Flujo de integración

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Usuario de Notaría intenta usar servicio BLACKLIST_SAT      │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. Sistema verifica: ¿Tiene suscripción activa?                │
│    → notaria.subscription WHERE status = 'activa'              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                         ✅ SÍ
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. Obtener el plan de la suscripción                           │
│    → subscription.plan                                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. ¿El plan incluye el servicio?                               │
│    → plan.services WHERE code = 'BLACKLIST_SAT'                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                         ✅ SÍ
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. ¿Hay customización para esta notaría?                       │
│    → notaria.services WHERE code = 'BLACKLIST_SAT'             │
│    Si existe: usar custom_limit y custom_price                 │
│    Si no: usar usage_limit del plan                            │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Verificar consumo actual del mes                            │
│    → service_usage WHERE tenant_id AND service_id               │
│       AND MONTH(consumed_at) = current_month                    │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. ¿Ha alcanzado el límite?                                    │
│    → count(usage) < limit                                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                    ✅ NO (tiene cuota)
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 8. Permitir acceso + registrar uso                             │
│    → INSERT INTO service_usage                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Ejemplo en código

```php
// Middleware: CheckServiceAccess
public function handle(Request $request, Closure $next, string $serviceCode)
{
    $notaria = auth()->user()->notaria;
    
    // 1. Verificar suscripción activa
    $subscription = $notaria->subscription()
        ->where('status', 'activa')
        ->whereDate('fecha_vencimiento', '>=', now())
        ->first();
    
    if (!$subscription) {
        return response()->json(['error' => 'No hay suscripción activa'], 403);
    }
    
    // 2. Obtener el plan
    $plan = $subscription->plan;
    
    // 3. Verificar si el plan incluye el servicio
    $planService = $plan->services()
        ->where('code', $serviceCode)
        ->first();
    
    if (!$planService) {
        return response()->json(['error' => 'Servicio no incluido en el plan'], 403);
    }
    
    // 4. Buscar customización
    $customService = $notaria->services()
        ->where('code', $serviceCode)
        ->first();
    
    // 5. Determinar límite efectivo
    $limit = $customService?->custom_limit ?? $planService->pivot->usage_limit;
    
    // 6. Verificar consumo actual
    if ($limit !== null) {
        $currentUsage = $notaria->serviceUsage()
            ->where('service_id', $planService->pivot->service_id)
            ->whereMonth('consumed_at', now()->month)
            ->count();
        
        if ($currentUsage >= $limit) {
            return response()->json(['error' => 'Límite alcanzado'], 429);
        }
    }
    
    // 7. Permitir acceso
    return $next($request);
}
```

### Conclusión

- **`subscriptions`** gestiona el ciclo de vida comercial (pago, renovación, vencimiento)
- **`services + plan_services + tenant_services`** gestiona permisos y límites de herramientas
- **`service_usage`** registra consumo real para facturación de excedentes
- **Trabajan juntas** para un sistema completo de suscripciones + servicios

---

## 💳 GESTIÓN DEL CICLO DE VIDA DE SUSCRIPCIONES

### Estados y Transiciones

El sistema de suscripciones maneja 5 estados que representan el ciclo de vida completo:

```
trial (período de prueba)
  ↓ al pagar primer mes
activa (pagada y vigente)
  ↓ al vencer sin renovación
vencida (período de gracia - acceso limitado)
  ↓ después de 7 días
suspendida (sin acceso por falta de pago)
  ↓ si se cancela definitivamente
cancelada (final, no reversible)
```

#### Estados Detallados

| Estado | Descripción | Acceso a Servicios | Duración | Siguiente Estado |
|--------|-------------|-------------------|----------|------------------|
| **trial** | Período de prueba gratuito | ✅ Completo según plan | 30 días | → `activa` (al pagar) <br> → `vencida` (sin renovar) |
| **activa** | Suscripción pagada y vigente | ✅ Completo según plan | Hasta fecha_vencimiento | → `vencida` (automático al vencer) |
| **vencida** | Venció, esperando renovación | ⚠️ Solo lectura/consultas | 7 días (gracia) | → `activa` (al renovar) <br> → `suspendida` (auto después de 7 días) |
| **suspendida** | Suspendida por falta de pago o penalización | ❌ Sin acceso | Indefinido | → `activa` (al reactivar) <br> → `cancelada` (manual) |
| **cancelada** | Cancelación definitiva | ❌ Sin acceso | Permanente | Estado final |

### Funcionalidades del SuperAdmin

El SuperAdmin tiene control completo sobre el ciclo de vida de las suscripciones a través de estas acciones:

#### 1. 🔄 Renovar Suscripción

**Cuándo:**
- Suscripción en estado `vencida` o `activa` próxima a vencer
- Cliente pagó y se debe extender el período

**Proceso:**
```php
// Input
- ciclo_facturacion: 'mensual' | 'anual'
- metodo_pago: 'transferencia' | 'stripe' | 'paypal'
- precio_pagado: decimal

// Cálculo automático
- fecha_inicio: now()
- fecha_vencimiento: 
    * mensual → now()->addMonth()
    * anual → now()->addYear()

// Actualización
- status → 'activa'
- auto_renovacion mantiene valor actual
```

**Validaciones:**
- ✅ El precio debe coincidir con plan.precio_mensual o plan.precio_anual
- ✅ No se puede renovar una suscripción `cancelada`
- ✅ Registrar en historial de pagos

#### 2. ⚠️ Suspender Suscripción

**Cuándo:**
- Falta de pago confirmada
- Violación de términos de servicio
- Solicitud del cliente

**Proceso:**
```php
// Input requerido
- razon_suspension: string (obligatorio)
- notificar_cliente: boolean

// Actualización
- status → 'suspendida'
- fecha_suspension: now()

// Efecto inmediato
- Bloquear acceso a todos los servicios
- Dashboard muestra alerta de suspensión
- Enviar notificación al admin de la notaría
```

**Validaciones:**
- ✅ Razón obligatoria (auditoría)
- ✅ No se puede suspender una suscripción `cancelada`
- ✅ Permitir reactivación posterior

#### 3. 🔓 Reactivar Suscripción

**Cuándo:**
- Cliente pagó deuda pendiente
- Se resolvió el problema que causó la suspensión

**Proceso:**
```php
// Input requerido
- fecha_vencimiento: date (nueva fecha)
- precio_pagado: decimal (puede incluir deuda)
- metodo_pago: string

// Actualización
- status → 'activa'
- fecha_reactivacion: now()
- fecha_vencimiento: input fecha

// Efecto
- Restaurar acceso completo a servicios
- Notificar al cliente
```

**Validaciones:**
- ✅ Solo se puede reactivar desde estado `suspendida`
- ✅ Verificar deuda pendiente
- ✅ Fecha de vencimiento debe ser futura

#### 4. 🔀 Cambiar Plan

**Cuándo:**
- Cliente solicita upgrade (más servicios)
- Cliente solicita downgrade (menos servicios)
- Se ajusta el plan por necesidades

**Proceso:**
```php
// Input
- nuevo_plan_id: integer
- aplicar_prorrateo: boolean (opcional)
- fecha_efectiva: date (default: now())

// Cálculo de prorrateo (si aplica)
$diasRestantes = now()->diffInDays($subscription->fecha_vencimiento);
$diasTotales = $subscription->fecha_inicio->diffInDays($subscription->fecha_vencimiento);
$porcentajeRestante = $diasRestantes / $diasTotales;

$creditoPlanAnterior = $subscription->precio_pagado * $porcentajeRestante;
$costoNuevoPlan = $nuevoPlan->precio_mensual;
$precioFinal = $costoNuevoPlan - $creditoPlanAnterior;

// Actualización
- notaria.plan_id → nuevo_plan_id
- subscription.plan_id → nuevo_plan_id
- subscription.precio_pagado → precio_final (si hay prorrateo)

// Sincronización con tenant
- Copiar nuevos plan_services al tenant
- Mantener customizaciones existentes (tenant_services)
- Notificar cambios al admin de la notaría
```

**Validaciones:**
- ✅ El nuevo plan debe existir y estar activo
- ✅ Si es downgrade, verificar que no pierda servicios en uso
- ✅ Registrar cambio en historial

#### 5. ❌ Cancelar Suscripción

**Cuándo:**
- Cliente solicita cancelación definitiva
- Notaría cierra operaciones
- Decisión administrativa final

**Proceso:**
```php
// Input requerido
- razon_cancelacion: string (obligatorio)
- fecha_cancelacion: date (default: now())
- eliminar_datos: boolean (default: false)

// Actualización IRREVERSIBLE
- status → 'cancelada'
- fecha_cancelacion: input fecha
- razon_cancelacion: input razón
- auto_renovacion → false

// Efecto
- Acceso bloqueado permanentemente
- No se puede reactivar
- Mantener datos históricos para auditoría
- Opcionalmente: desactivar notaría completa
```

**Validaciones:**
- ✅ Requiere confirmación doble (irreversible)
- ✅ Razón obligatoria
- ✅ No eliminar datos automáticamente (GDPR/auditoría)
- ✅ Registrar quién realizó la cancelación

### Automatización con Commands

#### Command: CheckExpiredSubscriptions

```bash
php artisan subscriptions:check-expired
```

**Ejecución:** Diaria (cron job a las 00:00)

**Proceso:**
```php
1. Buscar suscripciones con:
   - status = 'activa'
   - fecha_vencimiento < now()
   
2. Cambiar status → 'vencida'
   - Registrar fecha de cambio
   - Enviar notificación al admin de la notaría
   - Enviar alerta al SuperAdmin

3. Buscar suscripciones con:
   - status = 'vencida'
   - fecha_vencimiento < now()->subDays(7)
   
4. Cambiar status → 'suspendida'
   - Razón: "Suspensión automática por falta de pago"
   - Bloquear acceso a servicios
   - Enviar notificación urgente
   - Crear tarea para SuperAdmin
```

**Notificaciones:**
- A los 7 días antes de vencer: "Tu suscripción vence pronto"
- El día que vence: "Tu suscripción ha vencido - período de gracia de 7 días"
- A los 7 días después: "Tu cuenta ha sido suspendida"

### Control de Acceso por Estado

El sistema valida el estado de la suscripción antes de permitir acceso a servicios:

```php
// ServiceAccessManager::canAccess()

switch ($subscription->status) {
    case 'cancelada':
    case 'suspendida':
        // Sin acceso a nada
        return false;
        
    case 'vencida':
        // Período de gracia: solo lectura
        // Permitir consultas pero no escritura
        return in_array($service->category, ['CONSULTA', 'SISTEMA']);
        
    case 'trial':
    case 'activa':
        // Acceso completo según plan y límites
        return $this->checkServiceLimits($service);
        
    default:
        return false;
}
```

### Dashboard de Suscripciones (SuperAdmin)

**Nueva sección:** `/admin/subscriptions`

**Estadísticas principales:**
```
┌─────────────────────────────────────────────┐
│ 📊 Resumen de Suscripciones                 │
├─────────────────────────────────────────────┤
│ • Activas:     45 (🟢 90%)                  │
│ • Trial:       12 (🔵 24%)                  │
│ • Vencidas:     3 (🟡 6%)                   │
│ • Suspendidas:  2 (🔴 4%)                   │
│ • Canceladas:   1 (⚫ 2%)                   │
├─────────────────────────────────────────────┤
│ 💰 MRR (Ingreso Mensual):  $45,450 MXN     │
│ 📈 ARR (Ingreso Anual):   $545,400 MXN     │
└─────────────────────────────────────────────┘
```

**Alertas:**
- 🔴 **3 suscripciones** vencen en las próximas 48 horas
- 🟡 **2 suscripciones** en período de gracia (día 5 de 7)
- ⚠️ **1 suscripción** requiere acción (suspendida hace 30 días)

**Widget en Detalle de Notaría:**
```
┌─────────────────────────────────────────┐
│ 💳 Suscripción Actual                   │
├─────────────────────────────────────────┤
│ Estado: [🟢 Activa]                     │
│ Plan: Plan Profesional                  │
│ Inicio: 09 Feb 2026                     │
│ Vence: 09 Mar 2026 (28 días restantes)  │
│ Precio: $999.00 MXN / mes               │
│ Auto-renovación: ✅ Activada            │
│                                          │
│ Historial de pagos: 3 pagos (ver todos) │
│                                          │
│ [Renovar] [Suspender] [Cambiar Plan]    │
└─────────────────────────────────────────┘
```

### Consideraciones Adicionales

**Período de Gracia:**
- Configurable (actualmente 7 días)
- Durante este período el cliente puede renovar sin perder datos
- Acceso limitado a funciones de solo lectura

**Auto-renovación:**
- Si está activada, el sistema puede:
  - Intentar cargo automático (si hay pasarela integrada)
  - Enviar recordatorio de pago automáticamente
  - Generar factura pre-fechada

**Historial de Cambios:**
- Cada cambio de estado se registra con:
  - Fecha y hora del cambio
  - Usuario que realizó el cambio (SuperAdmin)
  - Razón del cambio
  - Estado anterior y nuevo estado

**Integración con Pasarelas de Pago (Futuro):**
- Stripe/PayPal para pagos automáticos
- Webhooks para actualizar estado al recibir pago
- Facturación automática

---

## 🎯 OBJETIVOS DE LA FASE 1.5

### Objetivo Principal
Diseñar e implementar un **sistema modular de servicios/herramientas** desacoplado de los planes de suscripción para permitir crecimiento escalable y facturación flexible.

### Objetivos Específicos

1. **Arquitectura de Datos**
   - Crear modelo de servicios independiente
   - Establecer relaciones plan-servicio con límites
   - Implementar personalización por notaría
   - Sistema de registro de consumo

2. **Lógica de Negocio**
   - Validación de acceso a servicios
   - Control de límites de uso
   - Registro automático de consumo
   - Cálculo de costos adicionales

3. **Panel Administrativo**
   - CRUD de servicios (Super Admin)
   - Gestión de planes y asignación de servicios
   - Vista de consumo y estadísticas
   - Configuración de precios

4. **Experiencia Notaría**
   - Vista de servicios activos
   - Consumo actual vs límites
   - Solicitud de servicios adicionales
   - Historial de uso

---

## 🏗️ ARQUITECTURA DE DATOS

### 📋 Modelo Entidad-Relación

```
┌─────────────────────┐
│      SERVICES       │  ← Catálogo global de herramientas
├─────────────────────┤
│ id                  │
│ code (UNIQUE)       │  ← ej: BLACKLIST_SAT, PEP_LIST
│ name                │
│ description         │
│ category            │  ← consulta|api|sistema|analisis
│ billing_model       │  ← included|per_use|unlimited|limited
│ unit_price          │  ← precio por uso (nullable)
│ is_active           │
│ metadata (JSON)     │  ← config adicional
│ created_at          │
│ updated_at          │
└─────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│   PLAN_SERVICES     │  ← Relación Plan ↔ Servicio
├─────────────────────┤
│ id                  │
│ plan_id            │  FK → plans
│ service_id         │  FK → services
│ is_included        │  ← incluido en el plan?
│ usage_limit        │  ← límite de uso (null = ilimitado)
│ extra_price        │  ← precio por uso extra
│ priority           │  ← orden de visualización
│ created_at         │
│ updated_at         │
└─────────────────────┘
           │
           │ N:1
           ▼
┌─────────────────────┐
│       PLANS         │  ← Ya existe (Fase 1)
├─────────────────────┤
│ id                  │
│ name                │
│ slug                │
│ monthly_price       │
│ description         │
│ is_active           │
└─────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│     NOTARIAS        │  ← Ya existe (tenants)
├─────────────────────┤
│ id                  │
│ plan_id            │
│ subscription_status │
│ ...                 │
└─────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│  TENANT_SERVICES    │  ← Personalizaciones por notaría
├─────────────────────┤
│ id                  │
│ tenant_id          │  FK → notarias (cascade)
│ service_id         │  FK → services
│ is_enabled         │  ← servicio activo?
│ custom_limit       │  ← límite personalizado (nullable)
│ custom_price       │  ← precio personalizado (nullable)
│ activation_date    │
│ expiration_date    │  ← para promociones limitadas
│ notes              │  ← observaciones
│ created_at         │
│ updated_at         │
└─────────────────────┘
           │
           │ 1:N
           ▼
┌─────────────────────┐
│   SERVICE_USAGE     │  ← Registro de consumo
├─────────────────────┤
│ id                  │
│ tenant_id          │  FK → notarias (cascade)
│ service_id         │  FK → services
│ user_id            │  FK → users (quién lo usó)
│ consumed_at        │  ← timestamp del consumo
│ quantity           │  ← cantidad consumida (default 1)
│ cost               │  ← costo del consumo
│ billable           │  ← se debe cobrar?
│ billed_at          │  ← fecha de facturación
│ metadata (JSON)    │  ← detalles del uso
│ created_at         │
└─────────────────────┘
```

### 📊 Categorías de Servicios

```php
enum ServiceCategory: string
{
    case CONSULTA = 'consulta';      // Búsquedas en listas (SAT, OFAC, PEP)
    case API = 'api';                // APIs externas (captura docs, etc)
    case SISTEMA = 'sistema';        // Sistema notarial base, QR, etc
    case ANALISIS = 'analisis';      // Reportes, estadísticas, dashboards
    case ALMACENAMIENTO = 'storage'; // Storage adicional
    case INTEGRACION = 'integration'; // Conectores, webhooks
}

enum BillingModel: string
{
    case INCLUDED = 'included';      // Incluido sin límite
    case LIMITED = 'limited';        // Incluido con límite
    case PER_USE = 'per_use';       // Se cobra por uso
    case UNLIMITED = 'unlimited';    // Ilimitado (plan premium)
}
```

---

## 🗂️ DEFINICIÓN DE SERVICIOS INICIALES

### 🔍 **Consultas / Búsquedas**

| Código | Nombre | Categoría | Billing | Precio Unit |
|--------|--------|-----------|---------|-------------|
| `BLACKLIST_SAT` | Lista Negra SAT | consulta | limited | $5 |
| `BLACKLIST_OFAC` | Lista OFAC | consulta | limited | $8 |
| `LIST_PEP` | Lista PEP | consulta | per_use | $10 |
| `LIST_LAVADO` | Lista Lavado de Dinero | consulta | per_use | $12 |
| `CONSULTA_EMPRESA` | Consulta de Empresas | consulta | limited | $7 |

### 🔌 **APIs y Conectores**

| Código | Nombre | Categoría | Billing | Precio Unit |
|--------|--------|-----------|---------|-------------|
| `API_CAPTURA_DOCS` | API Captura Documentos | api | limited | $2 |
| `API_OCR` | OCR Avanzado | api | per_use | $3 |
| `API_FIRMA_DIGITAL` | Firma Digital | api | per_use | $5 |
| `WEBHOOK_NOTIFICATIONS` | Webhooks | integration | included | null |

### ⚙️ **Sistema Base**

| Código | Nombre | Categoría | Billing | Precio Unit |
|--------|--------|-----------|---------|-------------|
| `SISTEMA_NOTARIAL` | Sistema Notarial ATINET | sistema | included | null |
| `EXPEDIENTES_QR` | Expedientes QR | sistema | included | null |
| `DASHBOARD_BASICO` | Dashboard Básico | analisis | included | null |
| `DASHBOARD_AVANZADO` | Dashboard Avanzado | analisis | limited | null |
| `REPORTES_PERSONALIZADOS` | Reportes Custom | analisis | per_use | $15 |

### 💾 **Almacenamiento**

| Código | Nombre | Categoría | Billing | Precio Unit |
|--------|--------|-----------|---------|-------------|
| `STORAGE_BASE` | Almacenamiento 10GB | storage | included | null |
| `STORAGE_EXTRA_GB` | Almacenamiento Extra (por GB) | storage | per_use | $2 |

---

## 📦 DEFINICIÓN DE PLANES CON SERVICIOS

### 🥉 **Plan Básico** - $499/mes

```yaml
Servicios Incluidos:
  - SISTEMA_NOTARIAL (ilimitado)
  - EXPEDIENTES_QR (ilimitado)
  - DASHBOARD_BASICO (ilimitado)
  - STORAGE_BASE (10GB)
  
Servicios con Límite:
  - BLACKLIST_SAT (50 búsquedas/mes)
  - BLACKLIST_OFAC (50 búsquedas/mes)
  - CONSULTA_EMPRESA (30 búsquedas/mes)
  
Servicios NO Incluidos:
  - LIST_PEP (pago por uso: $10)
  - LIST_LAVADO (pago por uso: $12)
  - API_CAPTURA_DOCS (pago por uso: $2)
  - DASHBOARD_AVANZADO (no disponible)
  - REPORTES_PERSONALIZADOS (no disponible)
```

### 🥈 **Plan Profesional** - $999/mes

```yaml
Servicios Incluidos:
  - SISTEMA_NOTARIAL (ilimitado)
  - EXPEDIENTES_QR (ilimitado)
  - DASHBOARD_BASICO (ilimitado)
  - DASHBOARD_AVANZADO (ilimitado)
  - STORAGE_BASE (50GB)
  - WEBHOOK_NOTIFICATIONS (ilimitado)
  
Servicios con Límite:
  - BLACKLIST_SAT (ilimitado)
  - BLACKLIST_OFAC (ilimitado)
  - CONSULTA_EMPRESA (ilimitado)
  - LIST_PEP (100 búsquedas/mes)
  - API_CAPTURA_DOCS (500 usos/mes)
  - API_OCR (100 usos/mes)
  
Servicios con Pago Extra:
  - LIST_LAVADO ($10/búsqueda, antes $12)
  - REPORTES_PERSONALIZADOS ($12/reporte, antes $15)
```

### 🥇 **Plan Premium** - $1,999/mes

```yaml
Todo Ilimitado:
  - Todos los servicios del Plan Profesional
  - LIST_LAVADO (ilimitado)
  - API_CAPTURA_DOCS (ilimitado)
  - API_OCR (ilimitado)
  - API_FIRMA_DIGITAL (ilimitado)
  - REPORTES_PERSONALIZADOS (ilimitado)
  - STORAGE_BASE (200GB)
  - Soporte prioritario 24/7
  - Capacitación mensual
```

---

## 🚀 PLAN DE IMPLEMENTACIÓN

### **SPRINT 1: Base de Datos y Modelos** (3-4 días)

#### ✅ Tareas
1. **Crear migración `services`**
   ```bash
   php artisan make:migration create_services_table
   ```
   - Incluir todos los campos definidos
   - Índices en `code`, `category`, `is_active`

2. **Crear migración `plan_services`**
   ```bash
   php artisan make:migration create_plan_services_table
   ```
   - FK a `plans` y `services` (cascade)
   - Índice único compuesto en `(plan_id, service_id)`

3. **Crear migración `tenant_services`**
   ```bash
   php artisan make:migration create_tenant_services_table
   ```
   - FK a `notarias` y `services` (cascade)
   - Índice único compuesto en `(tenant_id, service_id)`

4. **Crear migración `service_usage`**
   ```bash
   php artisan make:migration create_service_usage_table
   ```
   - FK a `notarias`, `services`, `users`
   - Índices en `tenant_id`, `consumed_at`, `billable`

5. **Crear Enums**
   ```bash
   php artisan make:enum ServiceCategory
   php artisan make:enum BillingModel
   ```

6. **Crear Modelos**
   ```bash
   php artisan make:model Service
   php artisan make:model PlanService
   php artisan make:model TenantService
   php artisan make:model ServiceUsage
   ```

7. **Definir Relaciones**
   - Service → plans (belongsToMany)
   - Service → usage (hasMany)
   - Plan → services (belongsToMany)
   - Notaria → services (belongsToMany)
   - Notaria → usage (hasMany)

8. **Crear Factories y Seeders**
   ```bash
   php artisan make:factory ServiceFactory
   php artisan make:seeder ServicesSeeder
   php artisan make:seeder PlanServicesSeeder
   ```

#### 📦 Entregables
- ✅ 4 migraciones nuevas ejecutadas
- ✅ 2 enums creados
- ✅ 4 modelos con relaciones
- ✅ Seeders con servicios iniciales
- ✅ Tests de relaciones pasando

---

### **SPRINT 2: Lógica de Negocio** (4-5 días)

#### ✅ Tareas

1. **Service: `ServiceAccessManager`**
   ```php
   class ServiceAccessManager
   {
       public function canAccess(Notaria $notaria, string $serviceCode): bool
       public function hasReachedLimit(Notaria $notaria, string $serviceCode): bool
       public function getRemainingUsage(Notaria $notaria, string $serviceCode): ?int
       public function getUsageStats(Notaria $notaria, string $serviceCode): array
   }
   ```

2. **Service: `ServiceUsageRecorder`**
   ```php
   class ServiceUsageRecorder
   {
       public function record(Notaria $notaria, Service $service, User $user, array $metadata = []): ServiceUsage
       public function calculateCost(ServiceUsage $usage): float
       public function markAsBilled(Collection $usages): void
   }
   ```

3. **Service: `ServiceBillingCalculator`**
   ```php
   class ServiceBillingCalculator
   {
       public function calculateMonthlyBill(Notaria $notaria, Carbon $month): array
       public function getExtraCharges(Notaria $notaria, Carbon $month): Collection
       public function generateInvoiceData(Notaria $notaria, Carbon $month): array
   }
   ```

4. **Middleware: `CheckServiceAccess`**
   ```php
   class CheckServiceAccess
   {
       public function handle(Request $request, Closure $next, string $serviceCode)
       {
           if (!ServiceAccessManager::canAccess(auth()->user()->notaria, $serviceCode)) {
               abort(403, 'No tienes acceso a este servicio');
           }
           
           if (ServiceAccessManager::hasReachedLimit(auth()->user()->notaria, $serviceCode)) {
               abort(429, 'Has alcanzado el límite de uso de este servicio');
           }
           
           return $next($request);
       }
   }
   ```

5. **Helper Global: `can_use_service()`**
   ```php
   function can_use_service(string $serviceCode): bool
   {
       return app(ServiceAccessManager::class)->canAccess(
           auth()->user()->notaria,
           $serviceCode
       );
   }
   
   function record_service_usage(string $serviceCode, array $metadata = []): void
   {
       app(ServiceUsageRecorder::class)->record(
           auth()->user()->notaria,
           Service::where('code', $serviceCode)->firstOrFail(),
           auth()->user(),
           $metadata
       );
   }
   ```

6. **Tests de Lógica**
   - Test de acceso con plan básico
   - Test de límites de uso
   - Test de precios personalizados
   - Test de consumo y facturación
   - Test de servicios excluidos

#### 📦 Entregables
- ✅ 3 servicios de lógica de negocio
- ✅ 1 middleware de control de acceso
- ✅ Helper functions globales
- ✅ 15+ tests unitarios pasando
- ✅ Documentación de servicios

---

### **SPRINT 3: Panel Super Admin** (5-6 días)

#### ✅ Tareas

1. **CRUD Servicios**
   - Controller: `Admin/ServiceController`
   - Páginas React:
     - `Admin/Services/Index.tsx` (lista con filtros)
     - `Admin/Services/Create.tsx` (crear servicio)
     - `Admin/Services/Edit.tsx` (editar servicio)
     - `Admin/Services/Show.tsx` (detalle con estadísticas)

2. **Gestión Plan-Servicio**
   - Controller: `Admin/PlanServiceController`
   - Página React:
     - `Admin/Plans/Services.tsx` (asignar servicios al plan)
     - Tabla drag-and-drop para reordenar
     - Modal para configurar límites y precios

3. **Servicios por Notaría**
   - Controller: `Admin/TenantServiceController`
   - Página React:
     - `Admin/Notarias/Services.tsx` (servicios activos)
     - Activar/desactivar servicios
     - Configurar límites y precios custom

4. **Estadísticas y Consumo**
   - Controller: `Admin/ServiceStatsController`
   - Página React:
     - `Admin/Services/Stats.tsx` (dashboard de uso)
     - Gráficas de consumo por servicio
     - Top notarías consumidoras
     - Proyección de facturación

#### 🎨 Componentes React

```tsx
// Componente para mostrar servicio
<ServiceCard
  service={service}
  usage={usage}
  limit={limit}
  onActivate={handleActivate}
/>

// Componente para asignar a plan
<PlanServiceAssigner
  plan={plan}
  availableServices={services}
  assignedServices={planServices}
  onAssign={handleAssign}
  onConfigure={handleConfigure}
/>

// Componente de estadísticas
<ServiceUsageChart
  data={usageData}
  period="month"
  groupBy="service"
/>
```

#### 📦 Entregables
- ✅ 4 controllers nuevos
- ✅ 8+ páginas React
- ✅ Componentes reutilizables
- ✅ Tests de integración
- ✅ Validación de formularios

---

### **SPRINT 4: Vista Notaría** (3-4 días)

#### ✅ Tareas

1. **Dashboard de Servicios**
   - Controller: `NotariaServiceController`
   - Página React: `Notaria/Services/Index.tsx`
   - Mostrar servicios activos con uso actual
   - Indicadores de límite (progress bars)
   - Botón solicitar servicio adicional

2. **Historial de Uso**
   - Controller: `NotariaServiceUsageController`
   - Página React: `Notaria/Services/Usage.tsx`
   - Tabla filtrable por servicio y fecha
   - Exportar a Excel/PDF
   - Gráficas de tendencia mensual

3. **Marketplace de Servicios**
   - Página React: `Notaria/Services/Marketplace.tsx`
   - Catálogo de servicios disponibles
   - Información de precios
   - Solicitud de activación (genera ticket)

4. **Widget en Dashboard Principal**
   - Agregar sección "Tus Servicios"
   - Mostrar top 3 servicios más usados
   - Alertas de límites cercanos (80%+)

#### 📦 Entregables
- ✅ 3 controllers
- ✅ 4 páginas React
- ✅ Widget de servicios en dashboard
- ✅ Sistema de alertas
- ✅ Documentación de usuario

---

### **SPRINT 5: Testing y Documentación** (2-3 días)

#### ✅ Tareas

1. **Tests Completos**
   - Unit tests de servicios (25+)
   - Integration tests de flujo completo
   - Tests de seguridad (acceso multi-tenant)
   - Tests de facturación
   - Tests de límites y consumo

2. **Documentación Técnica**
   - Guía de arquitectura de servicios
   - API documentation (endpoints)
   - Guía de uso de helpers
   - Diagramas de flujo

3. **Documentación Usuario**
   - Manual de gestión de servicios (Super Admin)
   - Guía de uso de servicios (Notaría)
   - FAQs sobre límites y facturación

4. **Performance Testing**
   - Benchmark de queries de consumo
   - Optimización de índices
   - Caching de acceso a servicios

#### 📦 Entregables
- ✅ 40+ tests pasando
- ✅ Documentación completa
- ✅ Performance report
- ✅ README actualizado

---

## ⚙️ CASOS DE USO PRINCIPALES

### 🔐 **CU-01: Verificar Acceso a Servicio**

```php
// En cualquier controller o middleware
if (!can_use_service('BLACKLIST_SAT')) {
    return response()->json([
        'error' => 'No tienes acceso a este servicio',
        'upgrade_url' => route('plans.upgrade')
    ], 403);
}

// Registrar uso automáticamente
record_service_usage('BLACKLIST_SAT', [
    'searched_name' => $request->name,
    'result' => 'found'
]);
```

### 📊 **CU-02: Consultar Límites**

```php
$stats = app(ServiceAccessManager::class)
    ->getUsageStats(auth()->user()->notaria, 'BLACKLIST_SAT');

/*
[
    'used' => 45,
    'limit' => 50,
    'remaining' => 5,
    'percentage' => 90,
    'will_exceed_soon' => true,
    'cost_if_exceed' => 25.00 // 5 búsquedas × $5
]
*/
```

### 💰 **CU-03: Calcular Factura Mensual**

```php
$billing = app(ServiceBillingCalculator::class)
    ->calculateMonthlyBill(
        notaria: Notaria::find(5),
        month: now()
    );

/*
[
    'subscription' => 999.00,        // Plan Profesional
    'extra_services' => [
        'BLACKLIST_SAT' => 50.00,    // 10 búsquedas extra × $5
        'LIST_PEP' => 120.00,        // 12 búsquedas × $10
    ],
    'total_extra' => 170.00,
    'subtotal' => 1169.00,
    'tax' => 187.04,                 // 16% IVA
    'total' => 1356.04
]
*/
```

### 🔧 **CU-04: Activar Servicio Personalizado**

```php
// Super Admin activa servicio especial para notaría
TenantService::create([
    'tenant_id' => 5,
    'service_id' => Service::where('code', 'LIST_LAVADO')->first()->id,
    'is_enabled' => true,
    'custom_limit' => 200,           // límite custom
    'custom_price' => 8.00,          // precio especial ($12 → $8)
    'expiration_date' => now()->addMonths(6), // promoción 6 meses
    'notes' => 'Cliente especial - descuento 33%'
]);
```

---

## 🔒 SEGURIDAD Y VALIDACIONES

### Validaciones Críticas

1. **Multi-tenancy estricto**
   - ServiceUsage SIEMPRE con `tenant_id`
   - TenantService con BelongsToNotaria
   - Validar acceso en cada consulta

2. **Límites de uso**
   - Verificar antes de usar servicio
   - Bloquear si se alcanzó límite (plan básico)
   - Permitir uso extra con cargo (plan profesional+)

3. **Precios**
   - Prioridad: custom_price > plan_price > default_price
   - No permitir precios negativos
   - Validar que solo super_admin modifique precios

4. **Activación/Desactivación**
   - Solo super_admin puede activar servicios
   - Validar dependencias (ej: API_OCR requiere SISTEMA_NOTARIAL)
   - Registrar en audit log

---

## 📈 MÉTRICAS DE ÉXITO

### KPIs Técnicos
- [ ] 100% de servicios definidos en seeders
- [ ] 40+ tests pasando (unit + integration)
- [ ] 0 N+1 queries en listados
- [ ] Response time < 200ms en verificación de acceso
- [ ] 100% de consumo registrado correctamente

### KPIs de Negocio
- [ ] Plans completamente configurados con servicios
- [ ] Panel admin operativo para gestión
- [ ] Notarías pueden ver uso y límites
- [ ] Facturación calculada automáticamente
- [ ] Documentación completa para usuarios

---

## ⚠️ RIESGOS Y MITIGACIONES

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Complejidad de facturación | Media | Alto | Testing exhaustivo con múltiples escenarios |
| Performance en queries de uso | Media | Medio | Índices optimizados + caching |
| Confusión de usuarios con límites | Alta | Medio | UI clara con indicadores visuales |
| Bugs en multi-tenancy | Baja | Crítico | Tests de seguridad + code review |
| Servicios mal definidos | Media | Alto | Workshop con equipo ATINET |

---

## 📅 TIMELINE ESTIMADO

```
SPRINT 1: Base de Datos     [████░░░░░░] 3-4 días
SPRINT 2: Lógica Negocio    [████░░░░░░] 4-5 días
SPRINT 3: Panel Admin       [█████░░░░░] 5-6 días
SPRINT 4: Vista Notaría     [███░░░░░░░] 3-4 días
SPRINT 5: Testing & Docs    [██░░░░░░░░] 2-3 días
─────────────────────────────────────────────────
TOTAL ESTIMADO:              17-22 días (~3-4 semanas)
```

### Hitos Clave

- **Día 4:** ✅ Modelos y migraciones completadas
- **Día 9:** ✅ Lógica de negocio operativa
- **Día 15:** ✅ Panel admin funcional
- **Día 19:** ✅ Vista notaría completada
- **Día 22:** 🎉 Fase 1.5 completada y documentada

---

## 🔄 INTEGRACIÓN CON FASE 2

Una vez completada la Fase 1.5, la Fase 2 podrá:

1. **Implementar herramientas específicas** sin tocar estructura
2. **Usar middleware `CheckServiceAccess`** en rutas
3. **Registrar consumo** con `record_service_usage()`
4. **Validar acceso** con `can_use_service()`
5. **Facturar automáticamente** con datos de usage

### Ejemplo de Integración en Fase 2

```php
// Fase 2: Controller de Lista Negra SAT
Route::middleware(['auth', 'notaria.access', 'service:BLACKLIST_SAT'])
    ->post('/buscar-sat', function (Request $request) {
        
        // Verificar acceso (middleware ya lo hace)
        // Realizar búsqueda
        $resultado = SATService::buscar($request->nombre);
        
        // Registrar uso automático
        record_service_usage('BLACKLIST_SAT', [
            'searched' => $request->nombre,
            'found' => $resultado->found,
            'lists' => $resultado->lists
        ]);
        
        return response()->json($resultado);
    });
```

---

## ✅ CRITERIOS DE ACEPTACIÓN

### Para considerar la Fase 1.5 completada:

- [x] Todas las migraciones ejecutadas sin errores
- [x] 4 modelos creados con relaciones correctas
- [x] Seeders de servicios iniciales funcionando
- [x] 3 servicios de lógica de negocio implementados
- [x] Middleware de control de acceso operativo
- [x] Panel admin con CRUD completo de servicios
- [x] Gestión de plan-servicio funcional
- [x] Vista notaría con dashboard de servicios
- [x] Sistema de facturación calculando correctamente
- [x] 40+ tests pasando
- [x] Documentación técnica completa
- [x] Performance validado (< 200ms)
- [x] Code review aprobado
- [x] Aprobación de stakeholders (ATINET)

---

## 📚 REFERENCIAS Y RECURSOS

### Documentación Laravel
- [Eloquent Relationships](https://laravel.com/docs/12.x/eloquent-relationships)
- [Query Scopes](https://laravel.com/docs/12.x/eloquent#query-scopes)
- [Middleware](https://laravel.com/docs/12.x/middleware)

### Patrones de Diseño
- **Service Layer Pattern**: Para lógica de negocio
- **Repository Pattern**: Para acceso a datos
- **Strategy Pattern**: Para diferentes billing models

### Inspiración
- Stripe Pricing API
- GitHub Marketplace
- Laravel Spark (subscription system)

---

## 🎉 SIGUIENTE PASO

Una vez completada la **Fase 1.5**, el equipo estará listo para:

1. ✅ **Iniciar Fase 2** con arquitectura sólida
2. ✅ Implementar herramientas sin preocupación por estructura
3. ✅ Agregar servicios nuevos sin migraciones
4. ✅ Facturar automáticamente por uso
5. ✅ Escalar sin límites arquitectónicos

---

**🔥 FRASE PARA LA JEFA:**

> "Diseñamos el sistema de servicios desacoplado del plan de suscripción para permitir crecimiento modular, control de costos y escalabilidad sin impacto estructural en la base de datos."

---

**Preparado por:** GitHub Copilot  
**Revisado por:** Equipo de Desarrollo  
**Aprobado por:** [Pendiente]

---

*Este documento es la guía definitiva para implementar la arquitectura de servicios y debe ser revisado con todo el equipo antes de iniciar el desarrollo.*
