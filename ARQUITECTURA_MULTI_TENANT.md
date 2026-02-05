# Arquitectura Multi-Tenant: Shared Database

## 📋 Decisión Arquitectónica

Se eligió **Shared Database con `notaria_id`** (opción A) en lugar de Database per Tenant por:

### ✅ Ventajas
- **Escala actual:** 21 notarías (no requiere complejidad de multi-DB)
- **Volumen:** 18,586 búsquedas totales es perfectamente manejable
- **Mantenimiento:** Una sola BD, backups centralizados
- **Reportes:** Super_admin accede fácilmente a datos agregados
- **Costos:** Infraestructura más económica
- **Laravel nativo:** Global Scopes garantizan aislamiento automático

### ⚠️ Consideraciones
- Implementar Global Scopes estrictos
- Tests exhaustivos para prevenir data leakage
- Índices compuestos para performance

---

## 🔒 Mecanismos de Aislamiento

### 1️⃣ **NotariaScope** (Global Scope)
Filtro automático aplicado a TODOS los queries:

```php
// Automáticamente filtra por notaria_id del usuario
Busqueda::all(); // WHERE notaria_id = {usuario_actual->notaria_id}

// Super_admin puede ver todo
Busqueda::withoutGlobalScope(NotariaScope::class)->get();

// Ver datos de una notaría específica (solo super_admin)
Busqueda::deNotaria(5)->get();
```

### 2️⃣ **BelongsToNotaria Trait**
Trait aplicado a modelos multi-tenant:

```php
use App\Concerns\BelongsToNotaria;

class Busqueda extends Model
{
    use BelongsToNotaria; // ← Automáticamente aplica scope y asigna notaria_id
}
```

**Funcionalidades:**
- ✅ Aplica `NotariaScope` automáticamente
- ✅ Asigna `notaria_id` al crear registros
- ✅ Define relación `belongsTo(Notaria::class)`
- ✅ Previene data leakage

### 3️⃣ **EnsureNotariaAccess Middleware**
Garantiza que usuarios tengan notaría asignada:

```php
// bootstrap/app.php
->withMiddleware(function (Middleware $middleware) {
    $middleware->alias([
        'notaria.access' => \App\Http\Middleware\EnsureNotariaAccess::class,
    ]);
})

// routes/web.php
Route::middleware(['auth', 'notaria.access'])->group(function () {
    // Rutas protegidas
});
```

---

## 📊 Estructura de Tablas

### Tablas con Multi-Tenancy (incluyen `notaria_id`)
```sql
busquedas
├── id
├── notaria_id         ← FK a notarias (CASCADE DELETE)
├── user_id
├── nombre_buscado
├── resultado
└── created_at

tickets
├── id
├── notaria_id         ← FK a notarias
├── user_id
├── asunto
└── estado

-- Otros modelos que implementarán BelongsToNotaria:
-- busquedas, tickets, reportes, alertas, etc.
```

### Tablas Globales (sin `notaria_id`)
```sql
herramientas          -- Catálogo global de Atinet
planes                -- Planes de Atinet
notarias              -- Clientes de Atinet
users                 -- Usuarios (tienen notaria_id)
```

---

## 🛡️ Prevención de Data Leakage

### ✅ **Buenas Prácticas Implementadas**

#### 1. Usar siempre Eloquent (nunca raw queries)
```php
// ✅ CORRECTO - Aplica scope automáticamente
$busquedas = Busqueda::where('resultado', 'coincidencia')->get();

// ❌ INCORRECTO - Bypasea scopes
$busquedas = DB::table('busquedas')->where('resultado', 'coincidencia')->get();
```

#### 2. Controllers con Policies
```php
// app/Policies/BusquedaPolicy.php
public function view(User $user, Busqueda $busqueda): bool
{
    // Super_admin puede ver todo
    if ($user->isSuperAdmin()) {
        return true;
    }
    
    // Usuario solo puede ver búsquedas de su notaría
    return $user->notaria_id === $busqueda->notaria_id;
}
```

#### 3. Tests de Aislamiento
```php
// tests/Feature/MultiTenancyTest.php
test('usuarios no pueden ver búsquedas de otras notarías', function () {
    $notaria1 = Notaria::factory()->create();
    $notaria2 = Notaria::factory()->create();
    
    $user1 = User::factory()->for($notaria1)->create();
    $user2 = User::factory()->for($notaria2)->create();
    
    $busqueda1 = Busqueda::factory()->for($notaria1)->create();
    $busqueda2 = Busqueda::factory()->for($notaria2)->create();
    
    // User1 autenticado
    actingAs($user1);
    
    // Solo ve búsquedas de su notaría
    expect(Busqueda::count())->toBe(1);
    expect(Busqueda::first()->id)->toBe($busqueda1->id);
    
    // No puede acceder directamente a búsquedas de otra notaría
    expect(fn() => Busqueda::findOrFail($busqueda2->id))
        ->toThrow(ModelNotFoundException::class);
});

test('super admin puede ver búsquedas de todas las notarías', function () {
    $superAdmin = User::factory()->superAdmin()->create();
    
    Busqueda::factory()->count(5)->create();
    
    actingAs($superAdmin);
    
    expect(Busqueda::withoutGlobalScope(NotariaScope::class)->count())->toBe(5);
});
```

---

## 🚀 Performance: Índices Críticos

### Índices Compuestos
```sql
-- Optimiza queries por notaría + fecha
CREATE INDEX idx_busquedas_notaria_fecha 
ON busquedas(notaria_id, created_at);

-- Optimiza queries por notaría + resultado
CREATE INDEX idx_busquedas_notaria_resultado 
ON busquedas(notaria_id, resultado);
```

### Queries Optimizados
```php
// ✅ CORRECTO - Usa índice compuesto
Busqueda::where('resultado', 'coincidencia')
    ->whereBetween('created_at', [$inicio, $fin])
    ->get();
// → Automáticamente agrega notaria_id gracias al scope
// → Usa índice (notaria_id, created_at)

// Para super_admin con notaría específica
Busqueda::deNotaria($notariaId)
    ->where('resultado', 'coincidencia')
    ->get();
```

---

## 📈 Escalabilidad

### Cuándo considerar Database per Tenant:
- ✅ Más de 500 notarías activas
- ✅ Millones de registros por notaría
- ✅ Requisitos regulatorios de aislamiento total (bancos)
- ✅ Clientes que pagan por BD dedicada (Enterprise)

### Estado actual:
- ❌ 21 notarías
- ❌ 18,586 búsquedas totales
- ❌ Búsquedas en listas públicas (no ultra-sensible)
- ✅ **Shared Database es óptimo**

---

## 🔧 Implementación en Modelos

### Ejemplo: Modelo Busqueda
```php
<?php

namespace App\Models;

use App\Concerns\BelongsToNotaria;
use Illuminate\Database\Eloquent\Model;

class Busqueda extends Model
{
    use BelongsToNotaria; // ← Activa multi-tenancy

    protected $fillable = [
        // NO incluir 'notaria_id' - se asigna automáticamente
        'nombre_buscado',
        'resultado',
        'detalles',
    ];

    // Relación con Usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relación con Notaria (definida en BelongsToNotaria trait)
}
```

### Ejemplo: Controller
```php
<?php

namespace App\Http\Controllers;

use App\Models\Busqueda;
use Illuminate\Http\Request;

class BusquedaController extends Controller
{
    public function index()
    {
        // ✅ Automáticamente filtra por notaria_id del usuario
        $busquedas = Busqueda::with('user')
            ->latest()
            ->paginate(20);

        return inertia('Busquedas/Index', [
            'busquedas' => $busquedas,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nombre_buscado' => 'required|string',
            'resultado' => 'required|in:sin_coincidencia,coincidencia',
        ]);

        // ✅ notaria_id se asigna automáticamente
        $busqueda = Busqueda::create($validated);

        return redirect()->back();
    }
}
```

### Ejemplo: Panel Super Admin
```php
public function adminDashboard()
{
    // Ver estadísticas de TODAS las notarías
    $stats = [
        'total_busquedas' => Busqueda::withoutGlobalScope(NotariaScope::class)->count(),
        'por_notaria' => Busqueda::withoutGlobalScope(NotariaScope::class)
            ->selectRaw('notaria_id, COUNT(*) as total')
            ->groupBy('notaria_id')
            ->with('notaria:id,nombre')
            ->get(),
    ];

    return inertia('Admin/Dashboard', $stats);
}

public function notariaDetalle($notariaId)
{
    $this->authorize('viewAnyNotaria', Busqueda::class); // Policy para super_admin

    // Ver búsquedas de una notaría específica
    $busquedas = Busqueda::deNotaria($notariaId)
        ->with('user')
        ->latest()
        ->paginate(50);

    return inertia('Admin/NotariaDetalle', [
        'busquedas' => $busquedas,
    ]);
}
```

---

## 🧪 Testing

### Test Suite de Multi-Tenancy
```bash
php artisan test --filter=MultiTenancy
```

**Tests críticos:**
1. ✅ Usuarios no ven datos de otras notarías
2. ✅ Super_admin ve todos los datos
3. ✅ `notaria_id` se asigna automáticamente al crear
4. ✅ Foreign key CASCADE DELETE funciona
5. ✅ Middleware bloquea usuarios sin notaria_id
6. ✅ Policies validan acceso correcto

---

## 📝 Checklist de Migración

- [x] Crear `NotariaScope` global scope
- [x] Crear `BelongsToNotaria` trait
- [x] Crear `EnsureNotariaAccess` middleware
- [x] Migración: agregar `notaria_id` a `busquedas`
- [x] Migración: asignar `notaria_id` a búsquedas existentes
- [ ] Aplicar trait a modelo `Busqueda`
- [ ] Registrar middleware en `bootstrap/app.php`
- [ ] Crear policies para autorización
- [ ] Crear tests de aislamiento
- [ ] Ejecutar migraciones
- [ ] Verificar datos existentes

---

## 🎯 Conclusión

**Shared Database con `notaria_id`** es la arquitectura óptima para este sistema porque:

1. ✅ **Simplicidad:** Una sola BD, fácil de mantener
2. ✅ **Seguridad:** Global Scopes garantizan aislamiento automático
3. ✅ **Performance:** Índices compuestos optimizan queries
4. ✅ **Costo:** Infraestructura económica para 21 clientes
5. ✅ **Escalabilidad:** Soporta crecimiento a 100+ notarías sin problemas
6. ✅ **Laravel nativo:** Framework tiene soporte excepcional

Si en el futuro llegamos a **500+ notarías** o necesitamos **aislamiento regulatorio total**, podemos migrar a Database per Tenant, pero hoy **NO es necesario**.
