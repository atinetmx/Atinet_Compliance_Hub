# 📋 Sistema de Múltiples Suscripciones

## 🎯 Modelo de Negocio

Una notaría puede tener **múltiples suscripciones activas simultáneamente** con las siguientes reglas:

### Reglas de Suscripciones

```
┌─────────────────────────────────────────────────────────────┐
│  NOTARÍA                                                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✅ 1 Suscripción ACTIVA (Principal/Pagada)        │   │
│  │     - Plan: Plan Completo                           │   │
│  │     - Servicios: OFAC, SAT, Agenda                  │   │
│  │     - Límites: 10 usuarios, 1000 búsquedas/mes     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔵 N Suscripciones TRIAL (Prueba de Servicios)    │   │
│  │                                                      │   │
│  │  Trial #1:                                           │   │
│  │     - Plan: Plan Control Notarial                   │   │
│  │     - Servicios: Control Notarial                   │   │
│  │                                                      │   │
│  │  Trial #2:                                           │   │
│  │     - Plan: Plan Registro Web                       │   │
│  │     - Servicios: Registro Web                       │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### ✅ Permitido

- ✅ **1 suscripción 'activa'** (principal, pagada)
- ✅ **Múltiples suscripciones 'trial'** (sin límite)
- ✅ Crear suscripción trial aunque ya exista una activa
- ✅ Crear múltiples suscripciones trial para probar diferentes servicios

### ❌ NO Permitido

- ❌ Tener **2 suscripciones 'activa'** simultáneamente
- ❌ Crear una nueva suscripción 'activa' sin cancelar la existente

---

## 🔧 Agregación de Servicios

### Modelo: Unión (OR)

El usuario tiene acceso a **TODOS los servicios** de **TODAS las suscripciones** activas.

```php
Suscripción ACTIVA → servicios: [OFAC, SAT, Agenda]
Suscripción TRIAL #1 → servicios: [Control Notarial]
Suscripción TRIAL #2 → servicios: [Registro Web]

RESULTADO → Servicios disponibles: 
[OFAC, SAT, Agenda, Control Notarial, Registro Web]
```

**Implementación:**
```php
$notaria->getAllAvailableServices(); // Retorna colección de servicios únicos
$notaria->tieneAccesoServicio('control_notarial'); // true
```

---

## 📊 Límites de Recursos

### Modelo: Solo Plan Principal

Los límites de **usuarios** y **búsquedas** se toman **ÚNICAMENTE** de la suscripción 'activa'.

Las suscripciones 'trial' **NO aportan** límites adicionales.

```php
Suscripción ACTIVA:
  - limite_usuarios: 10
  - limite_busquedas_mes: 1000

Suscripción TRIAL #1:
  - limite_usuarios: 5      // ❌ IGNORADO
  - limite_busquedas_mes: 100  // ❌ IGNORADO

RESULTADO: 
  - Límite usuarios: 10
  - Límite búsquedas: 1000
```

**Implementación:**
```php
$limites = $notaria->getLimitesFromMainSubscription();
// ['limite_usuarios' => 10, 'limite_busquedas_mes' => 1000]
```

---

## 🎬 Caso de Uso: Probar Nuevo Servicio

### Escenario

1. **Notaría 10 Colima** tiene suscripción activa con **Plan Básico**
   - Servicios: OFAC, SAT, Agenda
   - 10 usuarios, 1000 búsquedas/mes

2. Quieren probar el servicio **Control Notarial** (no incluido en su plan)

3. **Atinet** crea un **Plan de Prueba** con solo:
   - Servicios: Control Notarial

4. Se crea una **suscripción TRIAL** con el Plan de Prueba

5. **Resultado final:**
   ```
   Notaría 10 Colima ahora tiene:
   
   ✅ Suscripción #1 (activa):
      - Plan: Plan Básico
      - Servicios: OFAC, SAT, Agenda
      - Límites: 10 usuarios, 1000 búsquedas/mes
   
   🔵 Suscripción #2 (trial):
      - Plan: Plan de Prueba
      - Servicios: Control Notarial
      - Límites: NO APLICA
   
   📦 Servicios totales disponibles:
      [OFAC, SAT, Agenda, Control Notarial]
   
   📊 Límites efectivos:
      10 usuarios, 1000 búsquedas/mes (solo de la activa)
   ```

6. **Si les convence:**
   - Opción A: Agregar servicio al Plan Básico
   - Opción B: Crear nuevo plan completo y migrar suscripción principal

---

## 💻 Implementación Backend

### Validación al crear suscripción

```php
// SubscriptionController@store
public function store(StoreSubscriptionRequest $request)
{
    $newStatus = $request->status;
    
    // Si se está creando una suscripción 'activa'
    if ($newStatus === 'activa') {
        // Verificar que no haya otra 'activa'
        $existingActiva = Subscription::where('notaria_id', $notariaId)
            ->where('status', 'activa')
            ->first();
            
        if ($existingActiva) {
            return back()->with('error', 
                'Esta notaría ya tiene una suscripción activa. 
                Solo puede tener una suscripción principal activa.');
        }
    }
    
    // Si es 'trial', PERMITIR múltiples (no hay validación)
    
    Subscription::create($request->validated());
}
```

### Métodos en modelo Notaria

```php
// Obtener todos los servicios disponibles
$services = $notaria->getAllAvailableServices();

// Verificar acceso a un servicio
$hasAccess = $notaria->tieneAccesoServicio('control_notarial');

// Obtener límites (solo de suscripción principal)
$limits = $notaria->getLimitesFromMainSubscription();
```

---

## 🎨 UI/UX

### Al crear suscripción

Si la notaría ya tiene suscripciones, se muestra un panel informativo:

```
┌──────────────────────────────────────────────────────────┐
│ ⚠️  Suscripciones actuales de esta notaría:             │
│                                                           │
│ 🔴 Suscripción ACTIVA (Principal)                       │
│    Plan: Plan Básico                                     │
│    Vence: 15/05/2026                                     │
│                                                           │
│ 🔵 Suscripciones TRIAL (2):                             │
│    Plan: Plan Control Notarial                           │
│    Vence: 30/04/2026                                     │
│                                                           │
│    Plan: Plan Registro Web                               │
│    Vence: 25/04/2026                                     │
│                                                           │
│ 📋 Reglas:                                               │
│ • Solo puede tener UNA suscripción ACTIVA (principal)   │
│ • Puede tener MÚLTIPLES suscripciones TRIAL             │
│ • Si crea una nueva ACTIVA, debe cancelar la actual    │
│ • Las suscripciones TRIAL son independientes            │
└──────────────────────────────────────────────────────────┘
```

---

## ✅ Checklist de Implementación

- [x] Actualizar validación en `SubscriptionController@store`
- [x] Agregar métodos en modelo `Notaria`:
  - [x] `getAllAvailableServices()`
  - [x] `tieneAccesoServicio($code)`
  - [x] `getLimitesFromMainSubscription()`
- [x] Actualizar UI de creación de suscripciones
- [x] Mostrar información de suscripciones existentes
- [ ] **PENDIENTE**: Actualizar dashboard de notaría para mostrar servicios combinados
- [ ] **PENDIENTE**: Actualizar verificación de acceso a servicios en controllers
- [ ] **PENDIENTE**: Tests para validar reglas de múltiples suscripciones

---

**Fecha de implementación:** 01/04/2026  
**Autor:** Sistema Atinet Compliance Hub
