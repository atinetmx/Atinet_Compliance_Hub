# Sistema de Gestión de Suscripciones - Fase 1.5

## 🎯 Objetivo

Permitir al SuperAdmin gestionar el ciclo de vida completo de las suscripciones de las notarías (activar, suspender, renovar, cambiar plan, etc.).

---

## 📊 Estados de Suscripción

```
trial → activa → vencida
              ↓
          suspendida
              ↓
          cancelada
```

### Estados Disponibles:

| Estado | Descripción | Acceso a Servicios | Acción Siguiente |
|--------|-------------|-------------------|------------------|
| **trial** | Período de prueba (1 mes gratis) | ✅ Completo | → `activa` (al pagar) o `vencida` |
| **activa** | Suscripción pagada y vigente | ✅ Completo | → `vencida` (automático) |
| **vencida** | Venció el período, esperando pago | ⚠️ Limitado (solo lectura) | → `activa` (al renovar) o `suspendida` |
| **suspendida** | Suspendida por falta de pago o penalización | ❌ Sin acceso | → `activa` (al reactivar) |
| **cancelada** | Cancelada definitivamente | ❌ Sin acceso | Final (no reversible) |

---

## 🔄 Flujos de Gestión

### 1. Creación de Notaría (Actual)
```
SuperAdmin crea notaría
  → Se crea suscripción automática en estado 'trial'
  → Duración: 1 mes
  → Precio: $0 (gratis)
  → Auto-renovación: activada
```

### 2. Renovación Manual (NUEVO)
```
SuperAdmin → Menú "Renovar Suscripción"
  → Seleccionar ciclo (mensual/anual)
  → Confirmar precio del plan
  → Ingresar método de pago
  → Generar nueva fecha de vencimiento
  → Cambiar estado a 'activa'
```

### 3. Suspensión por Falta de Pago (NUEVO)
```
Automático:
  - Si subscription.status = 'vencida'
  - Y han pasado > 7 días desde fecha_vencimiento
  - Cambiar a 'suspendida'
  - Bloquear acceso a servicios

Manual:
  - SuperAdmin puede suspender inmediatamente
  - Razón: seleccionar de lista o escribir
```

### 4. Cambio de Plan (NUEVO)
```
SuperAdmin → "Cambiar Plan"
  → Seleccionar nuevo plan
  → Calcular prorrateo (opcional)
  → Actualizar notaria.plan_id
  → Actualizar subscription.plan_id
  → Copiar nuevos plan_services al tenant
  → Mantener estado actual de suscripción
```

### 5. Reactivación (NUEVO)
```
SuperAdmin → "Reactivar Suscripción"
  → Verificar si hay saldo pendiente
  → Registrar pago pendiente
  → Cambiar estado a 'activa'
  → Calcular nueva fecha de vencimiento
```

### 6. Cancelación Definitiva (NUEVO)
```
SuperAdmin → "Cancelar Suscripción"
  → Confirmar acción (irreversible)
  → Ingresar razón de cancelación
  → Cambiar estado a 'cancelada'
  → Opcionalmente: desactivar notaría
  → No eliminar datos (auditoría)
```

---

## 🛠️ Componentes a Implementar

### Backend

#### 1. **SubscriptionController** (Admin)
- `index()` - Listar todas las suscripciones
- `show()` - Ver detalle de suscripción
- `renew()` - Renovar suscripción
- `suspend()` - Suspender suscripción
- `reactivate()` - Reactivar suscripción
- `cancel()` - Cancelar suscripción
- `changePlan()` - Cambiar plan de una suscripción

#### 2. **SubscriptionService** (Lógica de Negocio)
- `createTrialSubscription()` - Crear suscripción trial automática
- `renewSubscription()` - Renovar con cálculo de fechas
- `suspendSubscription()` - Suspender con validaciones
- `reactivateSubscription()` - Reactivar con validaciones
- `cancelSubscription()` - Cancelar definitivamente
- `changePlan()` - Cambiar plan con prorrateo
- `checkExpiredSubscriptions()` - Job para revisar vencidas
- `calculateProrateo()` - Calcular prorrateo al cambiar plan

#### 3. **Command: CheckExpiredSubscriptions**
```bash
php artisan subscriptions:check-expired
```
- Ejecutar diariamente (cron)
- Buscar subscripciones vencidas hace > 7 días
- Cambiar a 'suspendida'
- Notificar a SuperAdmin y notaría

#### 4. **Policies & Middleware**
- `CheckActiveSubscription` - Middleware para validar suscripción activa
- `SubscriptionPolicy` - Solo SuperAdmin puede gestionar

### Frontend (Inertia/Vue)

#### Vistas Nuevas:
1. **Admin/Subscriptions/Index.vue** - Lista de suscripciones
2. **Admin/Subscriptions/Show.vue** - Detalle de suscripción
3. **Admin/Notarias/Subscriptions/Manage.vue** - Widget en notaría

#### Componentes:
- `SubscriptionStatusBadge.vue` - Badge de estado
- `SubscriptionTimeline.vue` - Historial de cambios
- `RenewSubscriptionModal.vue` - Modal para renovar
- `ChangePlanModal.vue` - Modal para cambiar plan
- `SuspendSubscriptionModal.vue` - Modal para suspender

---

## 🎨 UI/UX Propuesta

### En el Panel de SuperAdmin

#### Sección Nueva: "Suscripciones"
```
📊 Dashboard de Suscripciones
├─ Estadísticas
│  ├─ Activas: 45
│  ├─ Trial: 12
│  ├─ Vencidas: 3
│  ├─ Suspendidas: 2
│  └─ MRR (Ingreso Mensual Recurrente): $45,000 MXN
│
├─ Tabla de Suscripciones
│  └─ Columnas: Notaría, Plan, Estado, F. Vencimiento, Acciones
│
└─ Filtros
   ├─ Por estado
   ├─ Por plan
   └─ Vencen pronto (próximos 7 días)
```

#### En Detalle de Notaría

Agregar widget:
```
┌─────────────────────────────────────┐
│ 💳 Suscripción Actual               │
├─────────────────────────────────────┤
│ Estado: [🟢 Activa]                 │
│ Plan: Plan Profesional              │
│ Vence: 09 Mar 2026 (28 días)       │
│ Precio: $999.00 MXN / mes           │
│                                      │
│ [Renovar] [Suspender] [Cambiar Plan]│
└─────────────────────────────────────┘
```

---

## 📋 Validaciones Importantes

### Al Suspender:
- ✅ Confirmar que no hay operaciones en curso
- ✅ Notificar al admin de la notaría
- ✅ Permitir período de gracia (configurable)

### Al Renovar:
- ✅ Calcular precio según ciclo seleccionado
- ✅ Aplicar descuentos si corresponde
- ✅ Generar fecha de vencimiento correcta
- ✅ Mantener auto_renovacion configurada

### Al Cambiar Plan:
- ✅ Validar que el nuevo plan existe
- ✅ Calcular prorrateo si aplica
- ✅ Actualizar servicios en tenant
- ✅ Notificar al admin de la notaría

### Al Cancelar:
- ✅ Requiere confirmación
- ✅ Razón obligatoria
- ✅ Irreversible (avisar claramente)
- ✅ Mantener datos históricos

---

## 🔐 Control de Acceso

### Restringir Servicios por Estado:

```php
// En ServiceAccessManager
public function canAccess(Service $service): bool
{
    // 1. Verificar suscripción activa
    $subscription = $this->getActiveSubscription();
    
    if (!$subscription) {
        return false; // Sin suscripción
    }
    
    if ($subscription->status === 'suspendida') {
        return false; // Suspendido = sin acceso
    }
    
    if ($subscription->status === 'cancelada') {
        return false; // Cancelado = sin acceso
    }
    
    if ($subscription->status === 'vencida') {
        // Período de gracia: solo lectura
        return $service->category === 'consulta'; // Solo búsquedas
    }
    
    // 2. Verificar si el servicio está en el plan...
    // (resto de la lógica)
}
```

---

## 📅 Implementación Propuesta

### Sprint 2A: Gestión de Suscripciones (2-3 días)
1. ✅ Crear SubscriptionService con lógica de negocio
2. ✅ Crear SubscriptionController (CRUD + acciones)
3. ✅ Crear Form Requests para validación
4. ✅ Crear CheckExpiredSubscriptions Command
5. ✅ Actualizar NotariaController::store() para usar SubscriptionService
6. ✅ Tests unitarios y de integración

### Sprint 2B: UI de Gestión (2 días)
1. ✅ Crear vistas de suscripciones (Index, Show)
2. ✅ Agregar widget en detalle de notaría
3. ✅ Crear modales de acciones
4. ✅ Agregar rutas y navegación
5. ✅ Integrar con Wayfinder

### Sprint 2C: Integración con ServiceAccessManager (1 día)
1. ✅ Implementar validación de suscripción en ServiceAccessManager
2. ✅ Crear middleware CheckActiveSubscription
3. ✅ Aplicar middleware a rutas protegidas
4. ✅ Tests de integración

---

## 🎯 Próximos Pasos

1. **¿Aprobas este diseño?**
2. **¿Alguna modificación o caso de uso adicional?**
3. **¿Procedemos con la implementación?**

