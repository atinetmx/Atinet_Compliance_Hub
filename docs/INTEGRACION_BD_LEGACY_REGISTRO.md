# Integración con Base de Datos Legacy: Registro Web

## 📊 Resumen Ejecutivo

El sistema **Registro Web** sigue el patrón arquitectónico establecido en el sistema de migración:
- **READ-ONLY** de las bases de datos legacy
- **WRITE** a las tablas nuevas en `Atinet_Compliance_Hub`
- Migración gradual de datos históricos

### Bases de Datos Involucradas

| Base de Datos | Propósito | Acceso |
|---------------|-----------|--------|
| `Atinet_Compliance_Hub` | Sistema NUEVO - Almacena registros nuevos (tabla `registro_web`) | **Lectura/Escritura** |
| `atinet65_aplicativos` | Sistema LEGACY - Datos históricos (tabla `registro`) | **Solo Lectura** |
| `atinet65_catalogos` | Catálogos geográficos (estados, municipios, CP) | **Solo Lectura** |

---

## 🔗 Estrategia de Integración

### **PATRÓN UTILIZADO: Read-Only Legacy + Tabla Nueva**

✅ **Ventajas:**
- Sistema legacy permanece intacto (no se modifica)
- Datos nuevos en BD moderna con features Laravel (timestamps, soft deletes)
- Migración controlada y reversible
- Puede mostrar historial combinado (legacy + nuevo)
- Sistema legacy puede retirarse completamente después de migración

❌ **Desventajas (mínimas):**
- Requiere migración de datos históricos (una sola vez)
- Dos modelos: RegistroPersona (nuevo) + LegacyRegistro (lectura)

### **Alternativa descartada: Escribir directamente en tabla legacy**
❌ Rechazada porque:
- Viola principio de read-only para sistemas legacy
- Riesgo de corrupción de datos del sistema PHP
- No permite usar features de Laravel (timestamps, soft deletes)
- Dificulta el retiro del sistema legacy

---

## 🏗️ Arquitectura de Modelos

### Diagrama de Flujo

```
┌─────────────────────────────────────────────────────────┐
│                   SISTEMA NUEVO                          │
│            (Atinet_Compliance_Hub)                       │
│                                                           │
│  ┌──────────────────────────────────────────────┐       │
│  │  RegistroPersona Model                        │       │
│  │  - Connection: mysql (BD nueva)               │       │
│  │  - Table: registro_web                        │       │
│  │  - Features: timestamps, soft deletes         │       │
│  │  - Permisos: READ + WRITE                     │       │
│  └──────────────────────────────────────────────┘       │
│                         │                                 │
│                         │ writes                          │
│                         ▼                                 │
│  ┌──────────────────────────────────────────────┐       │
│  │  registro_web table                           │       │
│  │  - id, timestamps, deleted_at                 │       │
│  │  - 85 campos normalizados (sin duplicados)    │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                  SISTEMA LEGACY                          │
│            (atinet65_aplicativos)                        │
│                                                           │
│  ┌──────────────────────────────────────────────┐       │
│  │  LegacyRegistro Model                         │       │
│  │  - Connection: aplicativos (BD legacy)        │       │
│  │  - Table: registro                             │       │
│  │  - Permisos: READ ONLY                        │       │
│  │  - Method: migrateToNew()                     │       │
│  └──────────────────────────────────────────────┘       │
│                         │                                 │
│                         │ reads only                      │
│                         ▼                                 │
│  ┌──────────────────────────────────────────────┐       │
│  │  registro table (legacy)                      │       │
│  │  - idregistro (PK)                            │       │
│  │  - 85 campos (con duplicados legacy)          │       │
│  │  - No timestamps                              │       │
│  └──────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘

         ┌────────────────────────────────┐
         │    USUARIO VE AMBOS            │
         │  (Histórico + Nuevo)           │
         │                                │
         │  $legacy = LegacyRegistro::all()│
         │  $new = RegistroPersona::all() │
         │  $combined = $new->merge($legacy)│
         └────────────────────────────────┘
```

---

## 📋 Estructura de la Tabla Legacy

### **Tabla LEGACY: `registro`** (atinet65_aplicativos - SOLO LECTURA)

**Total de campos: 85 columnas** (incluye duplicados por evolución del sistema)

```sql
CREATE TABLE `registro` (
 `idregistro` int(11) NOT NULL AUTO_INCREMENT,
  
  -- METADATA (4 campos)
  `dia_registro` date NOT NULL COMMENT 'Fecha de registro',
  `notaria` varchar(30) NOT NULL,
  `envio_de_correo` tinyint(1) NOT NULL DEFAULT 0,
  `Persona` varchar(10) DEFAULT 'fisica' COMMENT 'FISICA o MORAL',
  
  -- DATOS PERSONALES (16 campos)
  `nombre` varchar(30) NOT NULL,
  `apellidopat` varchar(30) NOT NULL,
  `apellidomat` varchar(30) NOT NULL,
  `alias` varchar(100) NOT NULL,
  `curp` varchar(50) NOT NULL,
  `rfc` varchar(50) NOT NULL,
  `dia` date NOT NULL COMMENT 'Fecha nacimiento/constitución',
  `genero` varchar(50) NOT NULL,
  `paisnac` varchar(100) NOT NULL,
  `nacionalidad` varchar(100) NOT NULL,
  `estado_nac` varchar(100) NOT NULL,
  `ciudad_nac` varchar(100) NOT NULL,
  `municipio_nac` varchar(100) NOT NULL,
  `ocupacion` varchar(100) NOT NULL,
  `edo_civil` varchar(100) NOT NULL,
  `conyuge` varchar(100) DEFAULT NULL,
  
  -- ... (85 campos total, ver migración para campos completos)
  
  PRIMARY KEY (`idregistro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

**Estadísticas:** 1,118 registros existentes (al 31 de Marzo 2026)

---

## ⚠️ Campos Duplicados en Tabla Legacy

La tabla legacy tiene **8 campos duplicados** por evolución del sistema PHP:

| Campo Moderno (snake_case) | Campo Legacy (camelCase/legacy) | Tipo |
|----------------------------|---------------------------------|------|
| `padre_nombre` | `nombre_padre` | varchar(255) |
| `madre_nombre` | `nombre_madre` | varchar(255) |
| `herederos_sustitutos` | `herederosSustitutos` | longtext vs varchar(200) |
| `albacea_sustituto` | `albaceaSustituto` | varchar(255) vs varchar(45) |
| `tutor_tutriz` | `TutorTutriz` | varchar(255) vs varchar(45) |
| `tutor_sustituto` | `tutorSustituto` | varchar(255) vs varchar(45) |
| `sabe_escribir` | `escribir` | varchar(10) |
| `sabe_leer` | `leer` | varchar(10) |

**Decisión:** La tabla NUEVA (`registro_web`) usa SOLO los campos modernos (sin duplicados).

---

## 🗄️ Modelos Laravel Implementados

### **1. RegistroPersona** (Escritura en BD Nueva)

```php
// app/Models/RegistroPersona.php
class RegistroPersona extends Model
{
    use SoftDeletes;
    
    protected $connection = 'mysql';        // ✅ BD nueva
    protected $table = 'registro_web';      // ✅ Tabla nueva
    public $timestamps = true;              // ✅ Con timestamps Laravel
    
    protected $fillable = [85 campos...];   // Sin duplicados
}
```

**Uso:**
```php
// Crear nuevo registro (va a BD nueva)
$registro = RegistroPersona::create([
    'persona' => 'fisica',
    'nombre' => 'Juan',
    'curp' => 'JUAP850101HMCRXN01',
    // ... 82 campos más
]);
```

### **2. LegacyRegistro** (Solo Lectura de BD Legacy)

```php
// app/Models/LegacyRegistro.php
class LegacyRegistro extends Model
{
    protected $connection = 'aplicativos';  // 📖 BD legacy
    protected $table = 'registro';          // 📖 Tabla legacy
    protected $guarded = ['*'];             // ⚠️ READ ONLY
    public $timestamps = false;
    
    // Métodos bloqueados (lanzan RuntimeException):
    public function save() { throw ... }
    public function update() { throw ... }
    public function delete() { throw ... }
    
    // Método útil para migración:
    public function migrateToNew(): RegistroPersona { ... }
}
```

**Uso:**
```php
// Leer datos legacy (solo lectura)
$legacyRecords = LegacyRegistro::where('notaria', '2tlatlauquitepec')->get();

// Migrar un registro specific legacy → nuevo
$legacy = LegacyRegistro::find(123);
$nuevo = $legacy->migrateToNew(); // Crea en BD nueva
```

---

## 📝 Ejemplo de Uso en Controller

```php
<?php

namespace App\Http\Controllers\Admin;

use App\Models\RegistroPersona;
use App\Models\LegacyRegistro;
use Illuminate\Http\Request;
use Inertia\Inertia;

class RegistroWebController extends Controller
{
    /**
     * Mostrar formulario + historial combinado
     */
    public function index()
    {
        // Registros NUEVOS (BD nueva) - últimos 50
        $nuevos = RegistroPersona::query()
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn($r) => ['source' => 'nuevo', 'data' => $r]);
        
        // Registros LEGACY (solo lectura) - últimos 50
        $legacy = LegacyRegistro::query()
            ->orderBy('idregistro', 'desc')
            ->limit(50)
            ->get()
            ->map(fn($r) => ['source' => 'legacy', 'data' => $r]);
        
        // Combinar y ordenar
        $historial = $nuevos
            ->merge($legacy)
            ->sortByDesc('data.created_at')
            ->values();
        
        return Inertia::render('Admin/RegistroWeb/Index', [
            'historial' => $historial
        ]);
    }
    
    /**
     * Guardar NUEVO registro (en BD NUEVA)
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'persona' => 'required|in:fisica,moral',
            'nombre' => 'required|string|max:30',
            'curp' => 'nullable|string|size:18',
            'rfc' => 'required|string|max:13',
            // ... validación de 85 campos
        ]);
        
        // Metadata automática
        $validated['dia_registro'] = now()->toDateString();
        $validated['notaria'] = auth()->user()->notaria_code;
        
        // ✅ Guardar en BD NUEVA (registro_web)
        $registro = RegistroPersona::create($validated);
        
        return redirect()
            ->route('registro-web.index')
            ->with('success', "Registro #{$registro->id} creado");
    }
    
    /**
     * Buscar por CURP (ambas BD)
     */
    public function searchCurp(Request $request)
    {
        $curp = strtoupper($request->query('curp'));
        
        // Buscar primero en BD nueva
        $persona = RegistroPersona::where('curp', $curp)->first();
        
        // Si no existe, buscar en legacy
        if (! $persona) {
            $legacyPersona = LegacyRegistro::where('curp', $curp)->first();
            
            if ($legacyPersona) {
                return response()->json([
                    'found' => true,
                    'source' => 'legacy',
                    'data' => $legacyPersona,
                    'message' => 'Registro encontrado en sistema legacy (solo lectura)'
                ]);
            }
        }
        
        return response()->json([
            'found' => $persona !== null,
            'source' => 'nuevo',
            'data' => $persona
        ]);
    }
}
```

---

## 🔄 Migración de Datos Legacy

### **Comando Artisan: `registro:migrate-legacy`**

```bash
# Dry-run (sin guardar cambios)
php artisan registro:migrate-legacy --dry-run --limit=10

# Migrar todos los registros (1,118 total)
php artisan registro:migrate-legacy --force

# Migrar solo una notaría específica
php artisan registro:migrate-legacy --notaria=2tlatlauquitepec --force

# Migrar con límite
php artisan registro:migrate-legacy --limit=100 --force
```

**Características:**
- ✅ Detecta duplicados por CURP/RFC
- ✅ Progress bar en tiempo real
- ✅ Resumen al finalizar (migrados/omitidos/errores)
- ✅ Mapea campos legacy → nuevos (normaliza duplicados)
- ✅ Transacciones DB para rollback automático en errores

**Resultado esperado:**
```
📊 Resumen de Migración:
+--------------------------+----------+
| Métrica                  | Cantidad |
+--------------------------+----------+
| ✅ Migrados exitosamente | 1118     |
| ⏭️ Omitidos (duplicados) | 0        |
| ❌ Errores               | 0        |
| 📊 Total procesados      | 1118     |
+--------------------------+----------+
```

---

## ✅ Ventajas de esta Arquitectura

1. **✅ BD Legacy Protegida**: No se modifica, permanece intacta
2. **✅ Migración Controlada**: Datos legacy se migran bajo demanda
3. **✅ Features Laravel**: Timestamps, soft deletes, validación moderna
4. **✅ Roll back Fácil**: Sistema legacy no se afecta
5. **✅ Sin Conflictos de Escritura**: Cada sistema escribe en su propia BD
6. **✅ Historial Completo**: Puede visualizar datos legacy + nuevos combinados

---

## 🚨 Consideraciones Importantes

### **Antes de Empezar Desarrollo**

1. ✅ **Ejecutar migración** (tabla `registro_web` creada):
   ```bash
   php artisan migrate
   ```

2. ✅ **Verificar modelos**:
   ```bash
   php artisan tinker
   >>> RegistroPersona::count();  // BD nueva (0 registros inicialmente)
   >>> LegacyRegistro::count();   // BD legacy (1118 registros)
   ```

3. ⚙️ **Opcional: Migrar datos legacy** (cuando estés listo):
   ```bash
   # Primero dry-run para probar
   php artisan registro:migrate-legacy --dry-run

   # Luego migrar todo
   php artisan registro:migrate-legacy --force
   ```

### **Durante Desarrollo**

1. ✅ **Nuevos registros** → Usar `RegistroPersona` (escribe en `registro_web`)
2. 📖 **Leer legacy** → Usar `LegacyRegistro` (lee de `registro` legacy)
3. ⚠️ **NO intentar escribir con LegacyRegistro** → Lanza `RuntimeException`
4. 🔄 **Para migrar** → Método `LegacyRegistro::migrateToNew()`

### **Testing**

```bash
# Ver estructura de ambas tablas
php artisan tinker
>>> Schema::connection('mysql')->getColumnListing('registro_web');
>>> Schema::connection('aplicativos')->getColumnListing('registro');

# Comparar counts
>>> RegistroPersona::count();
>>> LegacyRegistro::count();

# Test de lectura/escritura
>>> $nuevo = RegistroPersona::create([...]); // ✅ Funciona
>>> $legacy = LegacyRegistro::create([...]); // ❌ RuntimeException (correcto)
```

---

## 📊 Resumen de Campos

| Sección | Campos | Tabla Nueva | Tabla Legacy |
|---------|--------|-------------|--------------|
| **Metadata** | 4 | ✅ | ✅ |
| **Datos Personales** | 16 | ✅ | ✅ |
| **Cónyuge** | 6 | ✅ | ✅ |
| **Domicilio Particular** | 11 | ✅ | ✅ |
| **Domicilio Fiscal** | 11 | ✅ | ✅ |
| **Contacto** | 6 | ✅ | ✅ |
| **Identificación** | 4 | ✅ | ✅ |
| **Info Adicional** | 4 | ✅ | ✅ |
| **Testador** | 14 (sin duplicados) | ✅ | 23 (con 9 duplicados) |
| **Timestamps** | 3 (`created_at`, `updated_at`, `deleted_at`) | ✅ | ❌ |
| **TOTAL** | **79 únicos** + 3 timestamps | **82 campos** | **85 campos** |

---

**Fecha de creación:** 31 de Marzo, 2026  
**Versión:** 2.0 (Corregida - Read-Only Legacy + Nueva BD)  
**Estado:** ✅ Arquitectura validada y documentada
