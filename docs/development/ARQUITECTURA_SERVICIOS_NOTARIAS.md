# 🏗️ Arquitectura de Servicios por Notaría

**Fecha:** 14 Abril 2026  
**Propósito:** Explicar cómo se asignan y detectan servicios disponibles para cada notaría

---

## 📊 Flujo de Datos

```
┌─────────────────┐
│   NOTARÍA       │  (Tenant)
│   Notaría 99    │
│   Nogales       │
└────────┬────────┘
         │ tiene
         ↓
┌─────────────────┐
│  SUSCRIPCIÓN    │  (Subscription)
│  Status: activa │
│  Plan: Pro      │
└────────┬────────┘
         │ incluye
         ↓
┌─────────────────┐
│     PLAN        │  (Plan)
│  Plan Pro       │
│  $999/mes       │
└────────┬────────┘
         │ contiene (plan_services)
         ↓
┌─────────────────────────────────┐
│        SERVICIOS                │
│  • CONTROL_NOTARIAL (∞)         │
│  • AGENDA_WEB (∞)               │
│  • REGISTRO_WEB (200/mes)       │
│  • BLACKLIST_SAT (∞)            │
│  • ESCANER_INTELIGENTE (100/mes)│
└─────────────────────────────────┘
         │ override opcional
         ↓
┌─────────────────────────────────┐
│    TENANT_SERVICES              │
│  (Configuración custom)         │
│  • REGISTRO_WEB: 500/mes        │ ← Override limit
│  • ESCANER_IA: deshabilitado    │ ← Custom config
└─────────────────────────────────┘
```

---

## 🔑 Métodos Disponibles en el Modelo Notaria

### 1. **Obtener todos los servicios disponibles**

```php
$notaria = Notaria::find(99); // Notaría 99 Nogales

$servicios = $notaria->getAllAvailableServices();
// Collection de Service models
// Solo servicios con implementation_status='implemented' y is_active=true
```

**Retorna:**
```php
Collection [
    Service {code: 'CONTROL_NOTARIAL', name: 'Control Notarial', ...},
    Service {code: 'AGENDA_WEB', name: 'Agenda Web', ...},
    Service {code: 'REGISTRO_WEB', name: 'Registro Web', ...},
    Service {code: 'BLACKLIST_SAT', name: 'Lista Negra SAT', ...},
    Service {code: 'BLACKLIST_OFAC', name: 'Lista OFAC', ...},
    Service {code: 'ESCANER_INTELIGENTE', name: 'Escáner Inteligente', ...},
]
```

---

### 2. **Verificar acceso a servicio específico**

```php
if ($notaria->tieneAccesoServicio('ESCANER_INTELIGENTE')) {
    // Mostrar el módulo en el dashboard
    echo "✅ Tiene acceso al Escáner Inteligente";
}

if ($notaria->tieneAccesoServicio('LIST_PEP')) {
    // Este servicio está 'planned', NO se mostrará
    echo "❌ No tiene acceso (servicio planificado)";
}
```

---

### 3. **Obtener servicios agrupados por categoría**

```php
$serviciosPorCategoria = $notaria->getServiciosPorCategoria();

// Array:
[
    'sistema' => [
        Service {code: 'CONTROL_NOTARIAL'},
        Service {code: 'AGENDA_WEB'},
        Service {code: 'REGISTRO_WEB'},
    ],
    'consulta' => [
        Service {code: 'BLACKLIST_SAT'},
        Service {code: 'BLACKLIST_OFAC'},
    ],
    'api' => [
        Service {code: 'ESCANER_INTELIGENTE'},
    ],
]
```

**Uso en Dashboard:**
```php
foreach ($serviciosPorCategoria as $categoria => $servicios) {
    echo "<h2>{$categoria}</h2>";
    foreach ($servicios as $servicio) {
        echo "<div>{$servicio->name}</div>";
    }
}
```

---

### 4. **Obtener límite de servicio**

```php
$limite = $notaria->getLimiteServicio('REGISTRO_WEB');
// Retorna: 200 (del plan) o null (ilimitado)

$limite = $notaria->getLimiteServicio('CONTROL_NOTARIAL');
// Retorna: null (ilimitado)
```

---

### 5. **Obtener uso actual del mes**

```php
$uso = $notaria->getUsoServicioMesActual('ESCANER_INTELIGENTE');
// Retorna: 45 (documentos escaneados este mes)
```

---

### 6. **Verificar si puede usar servicio (no excedió límite)**

```php
if ($notaria->puedeUsarServicio('ESCANER_INTELIGENTE')) {
    // Puede escanear más documentos
    echo "✅ Puede usar el servicio (45/100 usados)";
} else {
    // Límite alcanzado
    echo "⚠️ Límite mensual alcanzado (100/100)";
}
```

---

## 💻 Ejemplo: Controlador de Dashboard

```php
// app/Http/Controllers/DashboardController.php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $notaria = $request->user()->notaria; // Notaría del usuario logueado

        // 1. Obtener servicios disponibles agrupados por categoría
        $serviciosPorCategoria = $notaria->getServiciosPorCategoria();

        // 2. Obtener información de uso para cada servicio
        $serviciosConUso = $notaria->getAllAvailableServices()->map(function ($servicio) use ($notaria) {
            $limite = $notaria->getLimiteServicio($servicio->code);
            $uso = $notaria->getUsoServicioMesActual($servicio->code);
            $disponible = $notaria->puedeUsarServicio($servicio->code);

            return [
                'code' => $servicio->code,
                'name' => $servicio->name,
                'description' => $servicio->description,
                'category' => $servicio->category->value,
                'limite' => $limite, // null = ilimitado
                'uso_actual' => $uso,
                'puede_usar' => $disponible,
                'porcentaje_uso' => $limite ? ($uso / $limite * 100) : 0,
            ];
        });

        // 3. Información de la suscripción
        $suscripcion = $notaria->subscripcionActiva;

        return Inertia::render('Dashboard', [
            'notaria' => [
                'nombre' => $notaria->nombre,
                'numero' => $notaria->numero_notaria,
            ],
            'suscripcion' => [
                'plan' => $suscripcion->plan->nombre,
                'status' => $suscripcion->status,
                'vencimiento' => $suscripcion->fecha_vencimiento,
            ],
            'servicios_por_categoria' => $serviciosPorCategoria,
            'servicios_con_uso' => $serviciosConUso,
        ]);
    }
}
```

---

## 🎨 Ejemplo: Frontend (React + Inertia)

```tsx
// resources/js/Pages/Dashboard.tsx

import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DashboardProps {
    notaria: {
        nombre: string;
        numero: number;
    };
    suscripcion: {
        plan: string;
        status: string;
        vencimiento: string;
    };
    servicios_con_uso: Array<{
        code: string;
        name: string;
        description: string;
        category: string;
        limite: number | null;
        uso_actual: number;
        puede_usar: boolean;
        porcentaje_uso: number;
    }>;
}

export default function Dashboard({ notaria, suscripcion, servicios_con_uso }: DashboardProps) {
    return (
        <div className="p-6">
            <h1>Bienvenido a {notaria.nombre}</h1>
            <p>Plan: {suscripcion.plan}</p>

            <div className="grid grid-cols-3 gap-4 mt-6">
                {servicios_con_uso.map((servicio) => (
                    <Card key={servicio.code} className="p-4">
                        <h3>{servicio.name}</h3>
                        <p className="text-sm text-gray-600">{servicio.description}</p>

                        {servicio.limite !== null ? (
                            <>
                                <Progress value={servicio.porcentaje_uso} className="mt-2" />
                                <p className="text-sm mt-1">
                                    {servicio.uso_actual} / {servicio.limite} usados este mes
                                </p>
                            </>
                        ) : (
                            <p className="text-sm text-green-600 mt-2">✓ Ilimitado</p>
                        )}

                        {!servicio.puede_usar && (
                            <p className="text-sm text-red-600 mt-2">
                                ⚠️ Límite alcanzado
                            </p>
                        )}
                    </Card>
                ))}
            </div>
        </div>
    );
}
```

---

## 🔧 Personalización por Notaría (tenant_services)

### Caso: Notaría Premium necesita más límite de Registro Web

```php
// Asignar límite custom a Notaría 99
$notaria = Notaria::find(99);
$servicioRegistroWeb = Service::where('code', 'REGISTRO_WEB')->first();

$notaria->services()->attach($servicioRegistroWeb->id, [
    'is_enabled' => true,
    'custom_limit' => 500, // Override: 500 en lugar de 200 del plan
    'activation_date' => now(),
]);

// Ahora getLimiteServicio('REGISTRO_WEB') retorna 500 en vez de 200
```

### Caso: Deshabilitar servicio temporalmente

```php
$notaria->services()->updateExistingPivot($servicioEscaner->id, [
    'is_enabled' => false,
    'notes' => 'Deshabilitado temporalmente por mantenimiento',
]);

// tieneAccesoServicio('ESCANER_INTELIGENTE') seguirá siendo true
// pero puedes verificar is_enabled en tenant_services
```

---

## 📋 Tabla de Relaciones

| Tabla | Propósito |
|-------|-----------|
| `services` | Catálogo global de servicios (CONTROL_NOTARIAL, AGENDA_WEB, etc.) |
| `plans` | Planes de suscripción (Básico, Profesional, Premium) |
| `plan_services` | Qué servicios incluye cada plan + límites default |
| `subscriptions` | Suscripciones de notarías a planes |
| `notarias` | Tenants (clientes) |
| `tenant_services` | Overrides de servicios por notaría (custom limits, habilitación) |
| `service_usages` | Registro de uso de servicios (para contabilizar límites) |

---

## 🎯 Reglas de Negocio

### ✅ Servicios Visibles

Un servicio se muestra en el dashboard SI Y SOLO SI:
1. ✅ `implementation_status = 'implemented'`
2. ✅ `is_active = true`
3. ✅ La notaría tiene suscripción activa/trial
4. ✅ El plan de la suscripción incluye ese servicio

### 📋 Servicios Planificados

Los servicios con `implementation_status = 'planned'`:
- ❌ NO se muestran en dashboard
- ❌ NO están disponibles aunque estén en el plan
- ✅ Existen en BD para roadmap futuro
- ✅ Se activan cambiando `implementation_status='implemented'` + `is_active=true`

### 🔄 Múltiples Suscripciones

Si una notaría tiene:
- Suscripción ACTIVA (Plan Profesional)
- Suscripción TRIAL (Plan Premium)

Resultado: **UNIÓN de servicios** de ambos planes
- Obtiene servicios del Profesional
- + Servicios adicionales del Premium
- Límites se toman de la suscripción ACTIVA (no trial)

---

## 🚀 Activar Servicio Planificado (Futuro)

Cuando implementes LIST_PEP:

```sql
-- 1. Activar servicio
UPDATE services 
SET implementation_status = 'implemented', is_active = true 
WHERE code = 'LIST_PEP';

-- 2. ¡Listo! Todas las notarías con planes que incluyen PEP ahora lo ven
```

**NO necesitas:**
- ❌ Nuevas migraciones
- ❌ Modificar seeders
- ❌ Actualizar tenant_services
- ❌ Reiniciar servidores

---

## 📝 Resumen de Métodos

| Método | Retorna | Uso |
|--------|---------|-----|
| `getAllAvailableServices()` | Collection\<Service\> | Todos los servicios disponibles |
| `tieneAccesoServicio($code)` | bool | Verificar acceso a servicio |
| `getServiciosPorCategoria()` | array | Servicios agrupados por categoría |
| `getLimiteServicio($code)` | int\|null | Límite mensual (null = ilimitado) |
| `getUsoServicioMesActual($code)` | int | Uso del mes actual |
| `puedeUsarServicio($code)` | bool | Verificar si puede usar (no excedió límite) |

---

**Documentación actualizada:** 14 Abril 2026  
**Arquitectura:** Multitenant con servicios modulares escalables
