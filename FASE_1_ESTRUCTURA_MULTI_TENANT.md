# 🏗️ ESTRUCTURA MULTI-TENANT - FASE 1

## 📊 Relaciones entre Tablas

```
┌─────────────────────────────────────────────────────────────────────┐
│                     ARQUITECTURA MULTI-TENANT                        │
└─────────────────────────────────────────────────────────────────────┘

planes (nuevo)
├── id
├── nombre
├── slug
├── precio_mensual
├── limite_usuarios
├── limite_busquedas_mes
├── herramientas_activas [json]
└── ...

        │
        │ plan_id (FK)
        ↓

notarias (nuevo)
├── id
├── nombre
├── plan_id → planes.id
├── limite_usuarios_custom (override plan)
├── limite_busquedas_mes_custom (override plan)
├── herramientas_activas_custom (override plan)
├── total_usuarios
├── busquedas_mes_actual
└── ...

        │
        │ notaria_id (FK)
        ├────────────────────┐
        ↓                    ↓

users (modificado)                search_logs (modificado)
├── id                            ├── id
├── notaria_id → notarias.id      ├── user_id → users.id
├── tipo_cuenta (enum)            ├── notaria_id → notarias.id
│   ├── super_admin               ├── search_term
│   ├── admin_notaria             ├── search_type
│   ├── usuario_notaria           └── ...
│   └── invitado                  
├── notaria (string) 🔴 DEPRECATED
├── permiso_usuario (legacy)
└── ...
```

---

## � JERARQUÍA DE USUARIOS Y PERMISOS

### **📊 Estructura Jerárquica del Sistema:**

```
┌─────────────────────────────────────────────────────────────┐
│                    SUPER_ADMIN (Atinet)                     │
├─────────────────────────────────────────────────────────────┤
│  • notaria_id = NULL                                        │
│  • Ve TODAS las notarías                                    │
│  • Gestiona planes, facturación, soporte global             │
│  • Puede actuar como cualquier usuario (para soporte)       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                 ADMIN_NOTARIA (Por Notaría)                 │
├─────────────────────────────────────────────────────────────┤
│  • notaria_id = [ID específico]                             │
│  • Ve SOLO su notaría                                       │
│  • Gestiona usuarios, herramientas, reportes de SU notaría  │
│  • Puede crear/editar/eliminar usuarios de su notaría       │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│               USUARIO_NOTARIA (Usuario Regular)             │
├─────────────────────────────────────────────────────────────┤
│  • notaria_id = [ID específico]                             │
│  • Ve SOLO su notaría                                       │
│  • Usa herramientas, ve reportes asignados                  │
│  • NO puede gestionar otros usuarios                        │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                  INVITADO (Acceso Limitado)                 │
├─────────────────────────────────────────────────────────────┤
│  • notaria_id = [ID específico]                             │
│  • Ve SOLO su notaría (más limitado)                        │
│  • Acceso de solo lectura o funciones muy específicas       │
│  • No puede crear/modificar datos                           │
└─────────────────────────────────────────────────────────────┘
```

### **🔐 Global Scope Multi-Tenant:**

```php
// app/Models/Scopes/NotariaScope.php
public function apply(Builder $builder, Model $model): void
{
    if (Auth::check()) {
        $user = Auth::user();
        
        switch ($user->tipo_cuenta) {
            case 'super_admin':
                // NO aplica filtro - ve TODO
                break;
                
            case 'admin_notaria':
            case 'usuario_notaria':  
            case 'invitado':
                // Filtra por su notaría
                if ($user->notaria_id) {
                    $builder->where('notaria_id', $user->notaria_id);
                }
                break;
        }
    }
}
```

### **📋 Matriz de Permisos:**

| Acción | super_admin | admin_notaria | usuario_notaria | invitado |
|--------|-------------|---------------|-----------------|----------|
| Ver todas las notarías | ✅ | ❌ | ❌ | ❌ |
| Gestionar usuarios | ✅ Global | ✅ Su notaría | ❌ | ❌ |
| Hacer búsquedas | ✅ | ✅ | ✅ | ❌ |
| Ver reportes | ✅ Todos | ✅ Su notaría | ✅ Limitados | ✅ Públicos |
| Facturación | ✅ | ❌ | ❌ | ❌ |
| Soporte técnico | ✅ | ✅ Crear tickets | ✅ Crear tickets | ❌ |
| Gestionar planes | ✅ | ❌ | ❌ | ❌ |
| Activar herramientas | ✅ | ✅ Su notaría | ❌ | ❌ |

### **🎯 Casos de Uso por Tipo de Usuario:**

#### **SUPER_ADMIN (Empleado de Atinet)**
```php
// Dashboard global - ve todas las notarías
$notarias = Notaria::all(); // 21 notarías
$busquedasHoy = Busqueda::whereDate('created_at', today())->count();
$ticketsAbiertos = Ticket::where('status', 'abierto')->get();

// Gestión de planes y facturación
$facturasPendientes = Factura::where('status', 'pendiente')->get();
$suscripcionesVencen = Subscription::where('fecha_vencimiento', '<', now()->addDays(7))->get();
```

#### **ADMIN_NOTARIA (Notario o Administrador)**
```php
// Dashboard de su notaría - datos automáticamente filtrados
$miNotaria = Auth::user()->notaria;
$usuariosActivos = User::where('notaria_id', $miNotaria->id)->count();
$busquedasMes = Busqueda::whereMonth('created_at', now()->month)->count();
$limitesUso = $miNotaria->plan; // Verificar límites
```

#### **USUARIO_NOTARIA (Usuario Regular)**
```php
// Solo sus propias búsquedas y datos de su notaría
$misBusquedas = Busqueda::where('user_id', Auth::id())->get();
$reportesCompartidos = Reporte::where('es_compartido', true)->get(); // Solo de su notaría
```

---

## �🔄 Estrategia de Migración de Datos

### **Fase 1A: Crear Estructura (NO AFECTA DATOS)**

```sql
-- Paso 1: Crear tabla planes
CREATE TABLE planes (...);

-- Paso 2: Crear tabla notarias
CREATE TABLE notarias (
    plan_id FK → planes.id
);

-- Paso 3: Agregar columnas a users (nullable)
ALTER TABLE users ADD notaria_id FK → notarias.id NULLABLE;
ALTER TABLE users ADD tipo_cuenta ENUM(...) DEFAULT 'usuario_notaria';

-- Paso 4: Agregar columnas a search_logs (nullable)
ALTER TABLE search_logs ADD notaria_id FK → notarias.id NULLABLE;

✅ RESULTADO: Tablas creadas, sistema actual sigue funcionando
```

### **Fase 1B: Migrar Datos (SEEDER)**

```php
// Paso 1: Crear planes base
Plan::create([
    'nombre' => 'Legacy',
    'slug' => 'legacy',
    'limite_usuarios' => -1, // Ilimitado
    'limite_busquedas_mes' => -1, // Ilimitado
    'herramientas_activas' => ['ofac', 'sat'],
]);

Plan::create([
    'nombre' => 'Básico',
    'slug' => 'basico',
    'precio_mensual' => 999.00,
    'limite_usuarios' => 5,
    'limite_busquedas_mes' => 500,
    'herramientas_activas' => ['ofac', 'sat'],
]);

// ... más planes

// Paso 2: Extraer notarías únicas del campo users.notaria
$notariasUnicas = DB::table('users')
    ->select('notaria')
    ->whereNotNull('notaria')
    ->distinct()
    ->get(); // 21 notarías

// Paso 3: Crear registro en tabla notarias para cada una
foreach ($notariasUnicas as $item) {
    Notaria::create([
        'nombre' => $item->notaria,
        'slug' => Str::slug($item->notaria),
        'plan_id' => $planLegacy->id, // Plan Legacy para todos
        'status_suscripcion' => 'activa',
        'is_active' => true,
    ]);
}

// Paso 4: Actualizar users.notaria_id basado en users.notaria (string)
$notarias = Notaria::all();
foreach ($notarias as $notaria) {
    User::where('notaria', $notaria->nombre)
        ->update(['notaria_id' => $notaria->id]);
}

// Paso 5: Actualizar search_logs.notaria_id basado en search_logs.notaria
foreach ($notarias as $notaria) {
    SearchLog::where('notaria', $notaria->nombre)
        ->update(['notaria_id' => $notaria->id]);
}

// Paso 6: Identificar y marcar super admins de Atinet
User::whereIn('email', ['admin@atinet.com.mx', 'soporte@atinet.com.mx'])
    ->update([
        'tipo_cuenta' => 'super_admin',
        'notaria_id' => null, // Super admins no pertenecen a notaría
    ]);

✅ RESULTADO: 
   - 4 planes creados (Legacy, Básico, Profesional, Enterprise)
   - 21 notarías migradas
   - 246 usuarios con notaria_id asignado
   - 18,586 búsquedas con notaria_id asignado
   - 2-3 super admins identificados
```

### **Fase 1C: Aplicar Tenant Scopes (MIDDLEWARE)**

```php
// Middleware: EnsureTenantScope
class EnsureTenantScope
{
    public function handle($request, Closure $next)
    {
        $user = $request->user();
        
        // Super admins ven todo
        if ($user->isSuperAdmin()) {
            return $next($request);
        }
        
        // Usuarios regulares solo ven su notaría
        if ($user->notaria_id) {
            // Aplicar scope global a búsquedas
            SearchLog::addGlobalScope('tenant', function ($query) use ($user) {
                $query->where('notaria_id', $user->notaria_id);
            });
        }
        
        return $next($request);
    }
}

✅ RESULTADO: Aislamiento de datos por notaría funcionando
```

---

## 🎯 Estado Final después de Fase 1

### **Base de Datos:**

| Tabla | Estado | Descripción |
|-------|--------|-------------|
| `planes` | 🆕 **NUEVA** | 4 planes: Legacy, Básico, Profesional, Enterprise |
| `notarias` | 🆕 **NUEVA** | 21 notarías migradas con plan_id = Legacy |
| `users` | ✅ **MODIFICADA** | +notaria_id, +tipo_cuenta, notaria(string) deprecated |
| `search_logs` | ✅ **MODIFICADA** | +notaria_id, notaria(string) deprecated |

### **Usuarios:**

```
246 usuarios totales:
├── 2-3 super_admin (Atinet) → notaria_id = null
├── 21 admin_notaria (1 por notaría) → notaria_id = X
└── 221 usuario_notaria → notaria_id = X
```

### **Búsquedas:**

```
18,586 búsquedas migradas:
└── Todas con notaria_id asignado correctamente
```

---

## ✅ Ventajas de esta Estrategia

### **1. Sin Breaking Changes**
- Campo `users.notaria` (string) se mantiene temporalmente
- Campo `search_logs.notaria` (string) se mantiene temporalmente
- Sistema actual sigue funcionando mientras migramos

### **2. Rollback Fácil**
```sql
-- Si algo sale mal, solo eliminamos las columnas nuevas
ALTER TABLE users DROP COLUMN notaria_id;
ALTER TABLE users DROP COLUMN tipo_cuenta;
ALTER TABLE search_logs DROP COLUMN notaria_id;
DROP TABLE notarias;
DROP TABLE planes;
```

### **3. Migración Verificable**
```sql
-- Verificar que todos los usuarios tienen notaria_id
SELECT COUNT(*) FROM users WHERE notaria_id IS NULL AND tipo_cuenta != 'super_admin';
-- Debe ser 0

-- Verificar que todas las búsquedas tienen notaria_id
SELECT COUNT(*) FROM search_logs WHERE notaria_id IS NULL;
-- Debe ser 0

-- Verificar que las 21 notarías existen
SELECT COUNT(*) FROM notarias;
-- Debe ser 21
```

---

## 📝 Próximos Pasos

### **Después de ejecutar migraciones:**

1. ✅ Ejecutar `php artisan migrate`
2. ✅ Ejecutar seeder de migración de datos
3. ✅ Verificar conteos con queries
4. ✅ Testing manual con usuarios de diferentes notarías
5. ✅ Aplicar middleware de tenant scope
6. ✅ **Sistema listo para Fase 2 (Panel Admin)**

---

## 🚨 IMPORTANTE

### **Campos Deprecated:**

- `users.notaria` (string) → **NO ELIMINAR AÚN**
- `search_logs.notaria` (string) → **NO ELIMINAR AÚN**

Estos campos se mantendrán hasta validar que todo funciona correctamente.
En una migración futura (Fase 7) se pueden eliminar.

### **Beneficio:**

Si detectamos algún problema, podemos revertir rápidamente
sin perder el dato original.
---

## 📧 CONFIGURACIÓN EMAIL EMPRESARIAL

### **📋 Estado Actual:**
- ✅ **Sistema de recuperación de contraseñas** funcionando
- ✅ **Dominio configurado**: `@atinet.com.mx`
- ✅ **Driver actual**: `MAIL_MAILER=log` (desarrollo)
- ⏳ **Pendiente**: Credenciales SMTP empresariales

### **🔧 Configuración para Producción:**

**Paso NO crítico - Para implementar cuando se tengan credenciales SMTP empresariales:**

```env
# Cambiar en .env cuando se obtengan credenciales:
MAIL_MAILER=smtp
MAIL_HOST=mail.atinet.com.mx          # Servidor SMTP de Atinet
MAIL_PORT=587                         # Puerto típico para TLS
MAIL_USERNAME=soporte@atinet.com.mx   # Usuario del email empresarial
MAIL_PASSWORD=contraseña_real         # Password del email empresarial
MAIL_ENCRYPTION=tls                   # Encriptación TLS
MAIL_FROM_ADDRESS=soporte@atinet.com.mx
MAIL_FROM_NAME="Soporte Atinet"
```

### **✅ Funcionamiento Actual:**

**En Desarrollo:**
- 📧 Emails guardados en: `storage/logs/laravel.log`
- 🔗 Links válidos generados por Laravel
- ✅ Dominio Atinet configurado correctamente

**En Producción (futuro):**
- 📤 Emails enviados desde: `soporte@atinet.com.mx`
- 📨 Entregados a bandejas de usuarios reales
- ✅ Autenticación SMTP empresarial

### **🎯 Migración a Producción:**

1. **Obtener credenciales SMTP** del proveedor de email empresarial
2. **Actualizar `.env`** con las credenciales reales
3. **Cambiar** `MAIL_MAILER=log` → `MAIL_MAILER=smtp`
4. **Reiniciar** configuración: `php artisan config:clear`

**💡 Nota**: El sistema de emails está 100% funcional, solo falta la configuración SMTP para entrega real.
