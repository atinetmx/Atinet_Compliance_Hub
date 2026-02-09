# 📍 PROPUESTA: NORMALIZACIÓN DE DATOS DE UBICACIÓN - NOTARÍAS

## 🎯 PROBLEMA ACTUAL

La tabla `notarias` solo tiene un campo `direccion` (text) que contiene toda la información de ubicación en texto libre:
- Dificulta búsquedas por estado o región
- No permite filtros geográficos
- Imposibilita estadísticas por zona
- Complica validaciones de datos

## ✅ SOLUCIÓN PROPUESTA

### 1. Estructura de Campos Normalizada

```
notarias:
  - estado (varchar 50) → Estado de la República (32 estados)
  - municipio (varchar 100) → Municipio o Alcaldía
  - codigo_postal (varchar 5) → CP de 5 dígitos
  - colonia (varchar 100) → Colonia o Fraccionamiento
  - calle (varchar 255) → Calle, número exterior e interior
  - direccion_completa (text, computed) → Generado automáticamente
```

### 2. Beneficios

✅ **Búsquedas Avanzadas**
- Filtrar notarías por estado
- Buscar por región (ej: "todas en Jalisco")
- Agrupar por zona geográfica

✅ **Validaciones**
- Lista cerrada de 32 estados
- Validación de código postal (5 dígitos numéricos)
- Autocompletado de campos

✅ **Estadísticas**
- Notarías por estado
- Concentración geográfica
- Análisis de mercado por región

✅ **UX Mejorada**
- Selectores en lugar de input libre para estado
- Autocompletar municipios según estado
- Validación en tiempo real de CP

---

## 📋 PLAN DE IMPLEMENTACIÓN

### **PASO 1: Migración de Base de Datos**

```php
// database/migrations/2026_02_09_add_location_fields_to_notarias_table.php

public function up(): void
{
    Schema::table('notarias', function (Blueprint $table) {
        // Campos geográficos normalizados
        $table->string('estado', 50)->nullable()->after('direccion');
        $table->string('municipio', 100)->nullable()->after('estado');
        $table->string('codigo_postal', 5)->nullable()->after('municipio');
        $table->string('colonia', 100)->nullable()->after('codigo_postal');
        $table->string('calle', 255)->nullable()->after('colonia');
        
        // Índices para búsquedas rápidas
        $table->index('estado');
        $table->index('municipio');
        $table->index('codigo_postal');
        
        // Nota: direccion se mantiene para compatibilidad temporal
    });
}

public function down(): void
{
    Schema::table('notarias', function (Blueprint $table) {
        $table->dropIndex(['estado']);
        $table->dropIndex(['municipio']);
        $table->dropIndex(['codigo_postal']);
        $table->dropColumn([
            'estado', 'municipio', 'codigo_postal', 
            'colonia', 'calle'
        ]);
    });
}
```

### **PASO 2: Actualizar Modelo Notaria**

```php
// app/Models/Notaria.php

protected $fillable = [
    // ... campos existentes ...
    'estado',
    'municipio',
    'codigo_postal',
    'colonia',
    'calle',
    'direccion', // Mantener para retrocompatibilidad
];

// Accessor para dirección completa formateada
public function getDireccionCompletaAttribute(): string
{
    $partes = array_filter([
        $this->calle,
        $this->colonia,
        $this->municipio,
        $this->estado,
        $this->codigo_postal ? "C.P. {$this->codigo_postal}" : null,
    ]);
    
    return implode(', ', $partes) ?: $this->direccion;
}

// Scopes para búsquedas
public function scopePorEstado($query, $estado)
{
    return $query->where('estado', $estado);
}

public function scopePorRegion($query, array $estados)
{
    return $query->whereIn('estado', $estados);
}
```

### **PASO 3: Crear Enum de Estados**

```php
// app/Enums/EstadoMexico.php

namespace App\Enums;

enum EstadoMexico: string
{
    case AGUASCALIENTES = 'Aguascalientes';
    case BAJA_CALIFORNIA = 'Baja California';
    case BAJA_CALIFORNIA_SUR = 'Baja California Sur';
    case CAMPECHE = 'Campeche';
    case CHIAPAS = 'Chiapas';
    case CHIHUAHUA = 'Chihuahua';
    case CDMX = 'Ciudad de México';
    case COAHUILA = 'Coahuila';
    case COLIMA = 'Colima';
    case DURANGO = 'Durango';
    case GUANAJUATO = 'Guanajuato';
    case GUERRERO = 'Guerrero';
    case HIDALGO = 'Hidalgo';
    case JALISCO = 'Jalisco';
    case MEXICO = 'Estado de México';
    case MICHOACAN = 'Michoacán';
    case MORELOS = 'Morelos';
    case NAYARIT = 'Nayarit';
    case NUEVO_LEON = 'Nuevo León';
    case OAXACA = 'Oaxaca';
    case PUEBLA = 'Puebla';
    case QUERETARO = 'Querétaro';
    case QUINTANA_ROO = 'Quintana Roo';
    case SAN_LUIS_POTOSI = 'San Luis Potosí';
    case SINALOA = 'Sinaloa';
    case SONORA = 'Sonora';
    case TABASCO = 'Tabasco';
    case TAMAULIPAS = 'Tamaulipas';
    case TLAXCALA = 'Tlaxcala';
    case VERACRUZ = 'Veracruz';
    case YUCATAN = 'Yucatán';
    case ZACATECAS = 'Zacatecas';

    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }
}
```

### **PASO 4: Actualizar Validaciones**

```php
// app/Http/Requests/NotariaRequest.php (crear si no existe)

public function rules(): array
{
    return [
        // ... reglas existentes ...
        'estado' => 'nullable|string|in:' . implode(',', EstadoMexico::toArray()),
        'municipio' => 'nullable|string|max:100',
        'codigo_postal' => 'nullable|regex:/^\d{5}$/',
        'colonia' => 'nullable|string|max:100',
        'calle' => 'nullable|string|max:255',
    ];
}

public function messages(): array
{
    return [
        'estado.in' => 'El estado seleccionado no es válido.',
        'codigo_postal.regex' => 'El código postal debe tener 5 dígitos.',
    ];
}
```

### **PASO 5: Actualizar Interfaces TypeScript**

```typescript
// resources/js/types/models.ts

interface Notaria {
    // ... campos existentes ...
    estado?: string;
    municipio?: string;
    codigo_postal?: string;
    colonia?: string;
    calle?: string;
    direccion?: string; // Mantener para compatibilidad
    direccion_completa?: string; // Computed
}

// Agregar enum de estados
export const ESTADOS_MEXICO = [
    'Aguascalientes', 'Baja California', 'Baja California Sur',
    'Campeche', 'Chiapas', 'Chihuahua', 'Ciudad de México',
    'Coahuila', 'Colima', 'Durango', 'Guanajuato', 'Guerrero',
    'Hidalgo', 'Jalisco', 'Estado de México', 'Michoacán',
    'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
    'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa',
    'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz',
    'Yucatán', 'Zacatecas'
] as const;

export type EstadoMexico = typeof ESTADOS_MEXICO[number];
```

### **PASO 6: Actualizar Formularios (Create/Edit)**

```tsx
// resources/js/Pages/Admin/Notarias/Create.tsx

import { ESTADOS_MEXICO } from '@/types/models';

// En el formulario, reemplazar el campo direccion por:

<div className="space-y-4">
    <h3 className="text-lg font-semibold">Ubicación</h3>
    
    <div className="grid gap-4 md:grid-cols-2">
        {/* Estado */}
        <div className="space-y-2">
            <Label htmlFor="estado">Estado *</Label>
            <select
                id="estado"
                value={data.estado}
                onChange={(e) => setData('estado', e.target.value)}
                className={`w-full rounded-md border ${
                    errors.estado ? 'border-red-500' : ''
                } px-3 py-2`}
            >
                <option value="">Seleccionar estado</option>
                {ESTADOS_MEXICO.map((estado) => (
                    <option key={estado} value={estado}>
                        {estado}
                    </option>
                ))}
            </select>
            {errors.estado && (
                <p className="text-sm text-red-500">{errors.estado}</p>
            )}
        </div>

        {/* Municipio */}
        <div className="space-y-2">
            <Label htmlFor="municipio">Municipio *</Label>
            <Input
                id="municipio"
                value={data.municipio}
                onChange={(e) => setData('municipio', e.target.value)}
                placeholder="Ej: Guadalajara"
            />
        </div>

        {/* Código Postal */}
        <div className="space-y-2">
            <Label htmlFor="codigo_postal">Código Postal</Label>
            <Input
                id="codigo_postal"
                value={data.codigo_postal}
                onChange={(e) => setData('codigo_postal', e.target.value)}
                placeholder="44100"
                maxLength={5}
            />
        </div>

        {/* Colonia */}
        <div className="space-y-2">
            <Label htmlFor="colonia">Colonia</Label>
            <Input
                id="colonia"
                value={data.colonia}
                onChange={(e) => setData('colonia', e.target.value)}
                placeholder="Ej: Centro"
            />
        </div>

        {/* Calle (span 2 columns) */}
        <div className="space-y-2 md:col-span-2">
            <Label htmlFor="calle">Calle y Número *</Label>
            <Input
                id="calle"
                value={data.calle}
                onChange={(e) => setData('calle', e.target.value)}
                placeholder="Av. Juárez #123 Int. 4"
            />
        </div>
    </div>
</div>
```

### **PASO 7: Actualizar Vista Show (Subscriptions)**

```tsx
// resources/js/Pages/Admin/Subscriptions/Show.tsx

{/* Ubicación - Ahora con datos normalizados */}
<div>
    <p className="text-sm font-medium text-muted-foreground">
        Ubicación
    </p>
    <p className="text-base">
        {subscription.notaria.municipio && subscription.notaria.estado
            ? `${subscription.notaria.municipio}, ${subscription.notaria.estado}`
            : subscription.notaria.direccion || 'No especificada'}
    </p>
    {subscription.notaria.codigo_postal && (
        <p className="text-sm text-muted-foreground">
            C.P. {subscription.notaria.codigo_postal}
        </p>
    )}
</div>
```

### **PASO 8: Script de Migración de Datos Existentes**

```php
// database/seeders/MigrateExistingDireccionesSeeder.php

public function run(): void
{
    // Script para migrar datos existentes del campo direccion
    // a los nuevos campos normalizados (si es posible)
    
    $notarias = Notaria::whereNotNull('direccion')->get();
    
    foreach ($notarias as $notaria) {
        // Aquí podrías implementar lógica para parsear
        // la dirección existente y extraer componentes
        // O simplemente dejarlas en NULL para actualizar manualmente
        
        Log::info("Revisar direccion para notaria: {$notaria->nombre}");
    }
}
```

---

## 🚀 ORDEN DE EJECUCIÓN

### Fase 1: Backend (1-2 horas)
1. ✅ Crear migración de campos
2. ✅ Ejecutar migración: `php artisan migrate`
3. ✅ Crear enum EstadoMexico
4. ✅ Actualizar modelo Notaria (fillable, accessor, scopes)
5. ✅ Actualizar validaciones en NotariaController

### Fase 2: Frontend (2-3 horas)
6. ✅ Actualizar interfaces TypeScript
7. ✅ Actualizar formulario Create
8. ✅ Actualizar formulario Edit
9. ✅ Actualizar vista Show (Notarias)
10. ✅ Actualizar vista Show (Subscriptions)
11. ✅ Actualizar vista Index con filtros opcionales

### Fase 3: Testing y Migración de Datos (1 hora)
12. ✅ Crear nuevas notarías con campos normalizados
13. ✅ Actualizar notarías existentes manualmente
14. ✅ Verificar búsquedas y filtros funcionan
15. ✅ Opcional: Deprecar campo `direccion` después

---

## 🎯 VENTAJAS ADICIONALES

### Búsquedas Avanzadas
```php
// Buscar notarías en zona metropolitana
Notaria::whereIn('estado', ['Ciudad de México', 'Estado de México'])->get();

// Notarías en zona norte
Notaria::porRegion(['Nuevo León', 'Coahuila', 'Chihuahua', 'Sonora'])->get();
```

### Filtros en Frontend
```tsx
// Agregar filtro por estado en el Index de notarías
<select onChange={(e) => filtrarPorEstado(e.target.value)}>
    <option value="">Todos los estados</option>
    {ESTADOS_MEXICO.map(estado => (
        <option key={estado} value={estado}>{estado}</option>
    ))}
</select>
```

### Estadísticas
```php
// Dashboard del SuperAdmin
$estadisticas = Notaria::selectRaw('estado, COUNT(*) as total')
    ->groupBy('estado')
    ->orderByDesc('total')
    ->get();
```

---

## ⚠️ CONSIDERACIONES

1. **Retrocompatibilidad**: Mantener campo `direccion` por si alguno está en uso
2. **Migración Gradual**: Nuevas notarías usan campos normalizados, existentes se actualizan manualmente
3. **Validación Opcional**: Hacer campos obligatorios solo para nuevas notarías
4. **Geocoding Futuro**: Con ciudad/estado estructurados, se puede agregar lat/lng más adelante

---

## ✅ SIGUIENTE PASO

¿Quieres que implemente esta normalización completa? Puedo:
1. Crear la migración y ejecutarla
2. Actualizar el modelo y enum
3. Modificar todos los formularios y vistas
4. Agregar filtros de búsqueda por estado

**Tiempo estimado total: 3-4 horas**
