# 🔄 Integración de Búsquedas con Sistema Legacy
## Consolidación de Historial de Búsquedas OFAC/SAT

**Fecha de Creación:** 9 de Marzo, 2026  
**Versión:** 1.0  
**Estado:** 📋 En Planificación

---

## 📋 Resumen Ejecutivo

Este documento describe la estrategia de integración entre el **nuevo sistema Atinet Compliance Hub** (Laravel/React) y los **sistemas legacy** (Visual Basic 6.0 + PHP) para consolidar el historial de búsquedas de listas negras OFAC y SAT.

### Contexto

Atinet tiene **dos sistemas activos en producción**:

1. **Sistema Legacy** (En uso desde hace años):
   - Sistema de Control Notarial (Visual Basic 6.0) - Desktop
   - Páginas web de consultas (PHP) - Web
   - Ambos comparten las mismas bases de datos

2. **Sistema Nuevo** (En desarrollo):
   - Atinet Compliance Hub (Laravel 12 + React + Inertia)
   - Arquitectura multi-tenant moderna
   - Actualmente: 1 superusuario + 2 notarías de prueba

### Problema a Resolver

Las notarías han estado haciendo búsquedas durante años en el sistema legacy, pero este historial **NO es visible** en el sistema nuevo. Necesitamos:

- ✅ Consolidar historial legacy con búsquedas nuevas
- ✅ Permitir que notarías vean su historial completo
- ✅ Mantener compatibilidad con ambos sistemas durante transición
- ✅ Migrar notarías gradualmente al sistema nuevo

---

## 🗄️ Arquitectura de Bases de Datos Legacy

### Bases de Datos del Sistema Legacy

El sistema legacy utiliza **3 bases de datos principales** alojadas en MySQL 5.0:

```
📦 SISTEMA LEGACY - Bases de Datos
├── 📁 atinet65_aplicativos
│   ├── 📊 usuario                    ← Usuarios y notarías (web)
│   ├── 📊 busquedas                  ← Búsquedas desde web
│   └── 📊 busquedas_escritorio       ← Búsquedas desde VB6.0
│
├── 📁 atinet65_listasofac
│   └── 📊 consultas                  ← Búsquedas OFAC
│
└── 📁 atinet65_listassat
    └── 📊 consultas                  ← Búsquedas SAT (Art. 69-B)
```

### Estructura de Tabla: `usuario` (atinet65_aplicativos)

**Total de registros:** 322 usuarios

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | int(11) | ID único del usuario |
| `USER` | varchar(255) | Nombre de usuario |
| `NOMBRE` | varchar(255) | Nombre completo |
| `APELLIDO` | varchar(30) | Apellido |
| `PASSWORD` | varchar(255) | Contraseña |
| `FECHA` | date | Fecha de creación |
| `PERMISO` | varchar(20) | Permisos de acceso |
| `PERMISO_USUARIO` | varchar(20) | Permisos específicos |
| **`notaria`** | varchar(30) | **Identificador de notaría** |
| `SESION_LISTAS` | tinyint(4) | Sesión activa |
| `TIPO_USUARIO` | varchar(20) | Tipo de usuario |

**📝 Nota Importante:**
- **70 notarías diferentes** registradas
- `notaria = 'atinet'` → Empleados de Atinet (NO son notarías)
- Usuarios con `notaria != 'atinet'` → Personal de notarías

### Estructura de Tabla: `busquedas` (atinet65_aplicativos)

Búsquedas realizadas desde **páginas web**:

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| **`NOTARIA`** | **Identificador de notaría** |
| `RFC` | RFC buscado |
| `NOMBRE` | Nombre buscado |
| `fecha` | Timestamp de búsqueda |

### Estructura de Tabla: `busquedas_escritorio` (atinet65_aplicativos)

Búsquedas realizadas desde **Sistema VB6.0** (aplicación desktop):

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| **`NOTARIA`** | **Identificador de notaría** |
| `RFC` | RFC buscado |
| `NOMBRE` | Nombre buscado |
| `fecha` | Timestamp de búsqueda |

### Estructura de Tabla: `consultas` (atinet65_listasofac y atinet65_listassat)

Búsquedas en listas negras OFAC y SAT:

| Campo | Descripción |
|-------|-------------|
| `id` | ID único |
| **`proyecto`** | **Identificador de notaría** |
| `rfc` | RFC consultado (SAT) |
| `nombre` | Nombre consultado (OFAC) |
| `fecha` | Timestamp de búsqueda |
| `resultado` | Resultado de la búsqueda |

---

## 🔍 Hallazgos del Análisis

### 1. Dos Vías de Acceso al Sistema Legacy

#### 🌐 Acceso Web (Requiere registro en `usuario`)
- Página de consultas de listas negras
- Aplicativo de agenda
- Registro web
- **Registrados en tabla `usuario`**

#### 💻 Acceso Local/Desktop (NO requiere registro)
- Sistema de Control Notarial (Visual Basic 6.0)
- Conexión directa por API
- **NO registrados en tabla `usuario`**
- Solo necesitan identificador de `proyecto`

### 2. Notarías "Huérfanas" (Crítico)

**Definición:** Notarías que tienen búsquedas pero NO están en tabla `usuario`

**Ejemplo encontrado:**
```
Notaría: 142etla
- ❌ NO existe en tabla `usuario`
- ✅ Tiene 16 búsquedas (8 OFAC + 8 SAT)
- 📅 Búsquedas del 7 de diciembre de 2023
- 🖥️ Solo usa sistema VB6.0 (escritorio)
```

**Otros ejemplos del Top 10:**
- `10Cuernavaca` → 16,666 búsquedas OFAC → NO en `usuario`
- `9Acambaro` → 11,531 búsquedas OFAC → NO en `usuario`
- `60Quintanaroo` → 8,593 búsquedas OFAC → NO en `usuario`

**Conclusión:**
- ⚠️ **Muchas notarías activas NO están registradas en `usuario`**
- ✅ Todas las notarías están identificables desde tablas de `consultas`
- 📊 El listado real de notarías debe obtenerse de las **búsquedas**, no de `usuario`

### 3. Mapeo de Identificadores

El identificador de notaría **varía según la tabla**:

| Tabla | Campo Identificador | Ejemplo |
|-------|---------------------|---------|
| `usuario` | `notaria` | `2tlatlauquitepec` |
| `busquedas` | `NOTARIA` | `2tlatlauquitepec` |
| `busquedas_escritorio` | `NOTARIA` | `2tlatlauquitepec` |
| `consultas` (OFAC/SAT) | `proyecto` | `142etla`, `10Cuernavaca` |

**Importante:** Los identificadores generalmente coinciden, pero notarías que solo usan VB6.0 pueden no estar en `usuario`.

### 4. Estadísticas del Sistema Legacy

**Total de notarías únicas:** ~70-100+ (depende de la fuente)

**Distribución:**
- 70 notarías en tabla `usuario` (solo las que usan web)
- 100+ notarías en tablas de `consultas` (web + desktop)
- Rango de actividad: desde 1 búsqueda hasta 16,666+ búsquedas

**Top notarías más activas (por búsquedas OFAC):**
1. 10Cuernavaca → 16,666 consultas
2. 312reynosa → 14,338 consultas
3. 9Acambaro → 11,531 consultas
4. 60Quintanaroo → 8,593 consultas
5. 114Oaxaca → 7,417 consultas

---

## 🎯 Plan de Desarrollo

### Estado Actual del Sistema Nuevo

**Base de datos:** `Atinet_Compliance_Hub` (MySQL 8.0)

**Registros actuales:**
- ✅ 1 superusuario (miembro del equipo Atinet)
- ✅ 2 notarías de prueba con sus respectivos administradores
- ✅ Arquitectura multi-tenant funcional
- ✅ Sistema de búsquedas guardando en tabla `busquedas`

---

## 📝 Fases de Implementación

### **Fase 1: Importar Equipo Atinet como Superusuarios** 🎯

**Objetivo:** Agregar a la BD master todos los miembros del equipo Atinet como superusuarios.

**Origen de datos:**
```sql
-- Obtener usuarios de Atinet desde BD legacy
SELECT *
FROM atinet65_aplicativos.usuario
WHERE notaria = 'atinet'
```

**Destino:**
- Tabla: `users` (BD master: `Atinet_Compliance_Hub`)
- Rol: SuperAdmin
- No requieren `notaria_id` (son administradores globales)

**Tareas:**
1. ✅ Crear comando Artisan `ImportAtinetUsers`
2. ✅ Mapear campos legacy → nuevo sistema
3. ✅ Asignar rol SuperAdmin automáticamente
4. ✅ Generar contraseñas temporales o mantener hash legacy
5. ✅ Enviar notificación a usuarios importados

**Consideraciones:**
- Validar que el email sea único (puede no existir en legacy)
- Generar email si no existe: `{usuario}@atinet.com.mx`
- Registrar en log la importación

---

### **Fase 2: Catálogo de Notarías Legacy** 📋

**Objetivo:** Crear un catálogo completo de todas las notarías que han usado el sistema legacy.

**Consulta para obtener listado completo:**
```sql
-- Todas las notarías que han hecho búsquedas
SELECT DISTINCT proyecto as notaria_id,
       COUNT(*) as total_busquedas,
       MIN(fecha) as primera_busqueda,
       MAX(fecha) as ultima_busqueda
FROM (
    SELECT NOTARIA as proyecto, fecha 
    FROM atinet65_aplicativos.busquedas
    WHERE NOTARIA != '' AND NOTARIA != 'atinet'
    
    UNION ALL
    
    SELECT NOTARIA as proyecto, fecha 
    FROM atinet65_aplicativos.busquedas_escritorio
    WHERE NOTARIA != '' AND NOTARIA != 'atinet'
    
    UNION ALL
    
    SELECT proyecto, fecha 
    FROM atinet65_listasofac.consultas
    WHERE proyecto != '' AND proyecto != 'atinet'
    
    UNION ALL
    
    SELECT proyecto, fecha 
    FROM atinet65_listassat.consultas
    WHERE proyecto != '' AND proyecto != 'atinet'
) AS todas_busquedas
GROUP BY proyecto
ORDER BY total_busquedas DESC;
```

**Resultado esperado:**
- Lista de ~100+ notarías con actividad
- Estadísticas de búsquedas por notaría
- Rango de fechas de actividad

**Almacenar en:**
- Archivo JSON temporal: `storage/app/catalogo_notarias_legacy.json`
- O tabla temporal: `notarias_legacy_catalog` (para consultas rápidas)

---

### **Fase 3: Mejorar SuperAdminDashboard** 🎨

**Objetivo:** Agregar combobox con catálogo de notarías legacy al crear nueva notaría.

**Ubicación:**
- Componente: `resources/js/Pages/SuperAdminDashboard.tsx`
- Vista actual: Botón "Crear Nueva Notaría" → Modal/Form

**Mejoras propuestas:**

#### Opción A: Selector con dos modos
```tsx
<Select>
  <option value="">-- Seleccionar de catálogo legacy --</option>
  <option value="NEW">➕ Nueva notaría (manual)</option>
  <optgroup label="Notarías con búsquedas legacy">
    <option value="142etla">142etla (16 búsquedas)</option>
    <option value="2tlatlauquitepec">2tlatlauquitepec (31 búsquedas)</option>
    <option value="10Cuernavaca">10Cuernavaca (16,666 búsquedas)</option>
    ...
  </optgroup>
</Select>
```

#### Opción B: Autocompletado con búsqueda
```tsx
<Autocomplete
  options={catalogoNotarias}
  placeholder="Buscar notaría (ej: '142', 'Cuernavaca', 'tlatlauquitepec')"
  onSelect={handleSelectNotaria}
  allowCustom={true}
/>
```

**Ventajas:**
- ✅ Solo se requiere el **nombre de la notaría** del catálogo
- ✅ Los demás campos (dirección, RFC, etc.) se llenan manualmente después
- ✅ Evita duplicados al crear notarías que ya existen en legacy
- ✅ Muestra estadísticas de actividad (número de búsquedas)

**Campos del formulario:**

**Si selecciona del catálogo:**
```
Nombre: [AUTO-COMPLETADO desde catálogo]
Identificador legacy: [142etla] (readonly)
Total búsquedas legacy: [16] (info)
Primera búsqueda: [2023-12-07] (info)
Última búsqueda: [2023-12-07] (info)
---
[Resto de campos manuales: RFC, dirección, etc.]
```

**Si selecciona "Nueva notaría (manual)":**
```
Nombre: [________] (manual)
Identificador: [auto-generado desde nombre]
---
[Resto de campos manuales]
```

**Tareas backend:**
1. ✅ Endpoint: `GET /api/admin/legacy/notarias` → Retorna catálogo JSON
2. ✅ Agregar campo `legacy_identifier` en tabla `notarias`
3. ✅ Al crear notaría, vincular con `legacy_identifier`

---

### **Fase 4: Vincular Búsquedas Legacy** 🔗

**Objetivo:** Mostrar historial completo en dashboard de cada notaría (búsquedas legacy + nuevas).

**Estrategia:** Consultas en tiempo real (no importar datos)

**¿Por qué NO importar?**
- Sistema legacy sigue en uso → datos cambian constantemente
- Millones de registros históricos → no eficiente
- Solo importar cuando notaría se migre completamente

**Implementación:**

#### Backend: Servicio de búsquedas consolidadas

```php
// app/Services/BusquedasConsolidadasService.php
class BusquedasConsolidadasService
{
    public function obtenerHistorialCompleto(Notaria $notaria, $filtros = [])
    {
        $legacyId = $notaria->legacy_identifier;
        
        // Búsquedas del sistema nuevo
        $busquedasNuevas = Busqueda::where('notaria_id', $notaria->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($b) => [
                'id' => $b->id,
                'tipo' => $b->tipo_busqueda,
                'termino' => $b->termino_busqueda,
                'fecha' => $b->created_at,
                'origen' => 'nuevo',
                'usuario' => $b->user->name ?? 'Desconocido',
            ]);
        
        // Búsquedas legacy - OFAC
        $busquedasOfacLegacy = DB::connection('ofac')
            ->table('consultas')
            ->where('proyecto', $legacyId)
            ->orderBy('fecha', 'desc')
            ->get()
            ->map(fn($b) => [
                'id' => "legacy-ofac-{$b->id}",
                'tipo' => 'OFAC',
                'termino' => $b->nombre ?? $b->rfc,
                'fecha' => $b->fecha,
                'origen' => 'legacy-ofac',
                'sistema' => 'OFAC',
            ]);
        
        // Búsquedas legacy - SAT
        $busquedasSatLegacy = DB::connection('sat')
            ->table('consultas')
            ->where('proyecto', $legacyId)
            ->orderBy('fecha', 'desc')
            ->get()
            ->map(fn($b) => [
                'id' => "legacy-sat-{$b->id}",
                'tipo' => 'SAT',
                'termino' => $b->rfc ?? $b->nombre,
                'fecha' => $b->fecha,
                'origen' => 'legacy-sat',
                'sistema' => 'SAT 69-B',
            ]);
        
        // Búsquedas legacy - Aplicativos (web)
        $busquedasWebLegacy = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('NOTARIA', $legacyId)
            ->orderBy('fecha', 'desc')
            ->get()
            ->map(fn($b) => [
                'id' => "legacy-web-{$b->id}",
                'tipo' => 'Web',
                'termino' => $b->NOMBRE ?? $b->RFC,
                'fecha' => $b->fecha,
                'origen' => 'legacy-web',
                'sistema' => 'Web',
            ]);
        
        // Búsquedas legacy - Aplicativos (escritorio VB6)
        $busquedasEscritorioLegacy = DB::connection('aplicativos')
            ->table('busquedas_escritorio')
            ->where('NOTARIA', $legacyId)
            ->orderBy('fecha', 'desc')
            ->get()
            ->map(fn($b) => [
                'id' => "legacy-desktop-{$b->id}",
                'tipo' => 'Escritorio',
                'termino' => $b->NOMBRE ?? $b->RFC,
                'fecha' => $b->fecha,
                'origen' => 'legacy-desktop',
                'sistema' => 'VB6.0',
            ]);
        
        // Consolidar y ordenar
        $todasBusquedas = collect()
            ->merge($busquedasNuevas)
            ->merge($busquedasOfacLegacy)
            ->merge($busquedasSatLegacy)
            ->merge($busquedasWebLegacy)
            ->merge($busquedasEscritorioLegacy)
            ->sortByDesc('fecha')
            ->values();
        
        return $todasBusquedas;
    }
}
```

#### Frontend: Componente de historial mejorado

```tsx
// resources/js/Components/HistorialBusquedas.tsx
interface Busqueda {
    id: string;
    tipo: string;
    termino: string;
    fecha: string;
    origen: 'nuevo' | 'legacy-ofac' | 'legacy-sat' | 'legacy-web' | 'legacy-desktop';
    sistema?: string;
    usuario?: string;
}

export default function HistorialBusquedas({ busquedas }: { busquedas: Busqueda[] }) {
    const getBadgeColor = (origen: string) => {
        switch (origen) {
            case 'nuevo': return 'bg-green-100 text-green-800';
            case 'legacy-ofac': return 'bg-red-100 text-red-800';
            case 'legacy-sat': return 'bg-blue-100 text-blue-800';
            case 'legacy-web': return 'bg-purple-100 text-purple-800';
            case 'legacy-desktop': return 'bg-gray-100 text-gray-800';
        }
    };
    
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h3>Historial de Búsquedas</h3>
                <span className="text-sm text-gray-600">
                    Total: {busquedas.length} búsquedas
                </span>
            </div>
            
            {busquedas.map((busqueda) => (
                <Card key={busqueda.id} className="p-4">
                    <div className="flex justify-between">
                        <div>
                            <p className="font-medium">{busqueda.termino}</p>
                            <p className="text-sm text-gray-600">
                                {format(new Date(busqueda.fecha), 'dd/MM/yyyy HH:mm')}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Badge className={getBadgeColor(busqueda.origen)}>
                                {busqueda.sistema || busqueda.tipo}
                            </Badge>
                            {busqueda.usuario && (
                                <Badge variant="outline">{busqueda.usuario}</Badge>
                            )}
                        </div>
                    </div>
                </Card>
            ))}
        </div>
    );
}
```

---

### **Fase 5: Adaptación de Tabla `busquedas`** 🗃️

**Objetivo:** Preparar la tabla para almacenar información del origen de la búsqueda.

**Migración propuesta:**

```php
// database/migrations/xxxx_add_origin_fields_to_busquedas_table.php
Schema::table('busquedas', function (Blueprint $table) {
    // Tipo de origen del sistema
    $table->enum('origen_sistema', ['nuevo', 'legacy'])
        ->default('nuevo')
        ->after('resultados');
    
    // Tipo de interfaz usada
    $table->enum('origen_interfaz', ['web', 'escritorio', 'api'])
        ->default('web')
        ->after('origen_sistema');
    
    // Identificador legacy (si aplica)
    $table->string('legacy_id')->nullable()->after('origen_interfaz');
    
    // Índices
    $table->index('origen_sistema');
    $table->index('origen_interfaz');
});
```

**Casos de uso:**

1. **Búsqueda nueva desde sistema web:**
   ```
   origen_sistema: 'nuevo'
   origen_interfaz: 'web'
   legacy_id: null
   ```

2. **Búsqueda nueva desde API (futuro - app móvil):**
   ```
   origen_sistema: 'nuevo'
   origen_interfaz: 'api'
   legacy_id: null
   ```

3. **Búsqueda importada de legacy web:**
   ```
   origen_sistema: 'legacy'
   origen_interfaz: 'web'
   legacy_id: 'busquedas-1234'
   ```

4. **Búsqueda importada de legacy escritorio (VB6):**
   ```
   origen_sistema: 'legacy'
   origen_interfaz: 'escritorio'
   legacy_id: 'busquedas_escritorio-5678'
   ```

**Nota:** Por ahora solo se usan para búsquedas nuevas. La importación masiva será opcional.

---

## 🚀 Puntos Adicionales Sugeridos

### 1. **Cache de Búsquedas Legacy** ⚡

**Problema:** Consultar 5 tablas legacy cada vez puede ser lento.

**Solución:**
```php
// Cache por 1 hora
Cache::remember("busquedas-legacy-{$notaria->id}", 3600, function() use ($notaria) {
    return $this->busquedasConsolidadasService->obtenerHistorialCompleto($notaria);
});
```

**Invalidar cache:**
- Cada hora automáticamente
- Al forzar refresh desde dashboard
- Comando Artisan: `php artisan cache:clear-legacy-searches {notaria_id}`

---

### 2. **Reportes Consolidados** 📊

**Métricas útiles:**
- Total de búsquedas (nuevo + legacy)
- Distribución por sistema (OFAC vs SAT)
- Distribución por interfaz (web vs escritorio)
- Tendencia temporal (gráfica)
- Top términos buscados

**Vista propuesta:** `/admin/reports/notaria/{id}/busquedas`

---

### 3. **Sincronización de Notarías Existentes** 🔄

**Caso:** Notarías que ya están en el sistema nuevo pero también tienen búsquedas legacy.

**Tarea:**
```bash
php artisan notarias:link-legacy
```

**Proceso:**
1. Buscar notarías existentes en sistema nuevo
2. Intentar match con notarías legacy por nombre similar
3. Proponer matches con score de similitud
4. Confirmar manualmente o auto-asignar si similitud > 95%

**Ejemplo:**
```
Sistema Nuevo: "Notaría 2 Tlatlauquitepec, Puebla"
Legacy:        "2tlatlauquitepec"
Similitud:     98% ✅
Acción:        Auto-vincular
```

---

### 4. **Modo de Solo Lectura para Legacy** 🔒

**Restricción:** Las búsquedas legacy son de **solo lectura**.

**Implementar:**
- Badge "Legacy" en búsquedas antiguas
- No permitir editar/eliminar búsquedas legacy
- Solo permitir "ver detalles" (si están disponibles)

---

### 5. **Dashboard de Migración** 📈

**Vista para SuperAdmin:**
- Lista de notarías legacy no migradas
- Estadísticas de actividad (última búsqueda)
- Priorizar por volumen de búsquedas
- Botón "Migrar notaría" (crea notaría + vincula legacy)

**Endpoint:**
```
GET /admin/migration/dashboard
```

**Métricas:**
- Total notarías legacy: 100+
- Notarías migradas: 2
- Notarías pendientes: 98+
- Búsquedas legacy: ~500,000+
- Búsquedas nuevas: 50

---

### 6. **Validación de Identificadores Legacy** ✅

**Al vincular notaría con legacy:**
1. Verificar que `legacy_identifier` existe en tablas de búsquedas
2. Validar que no esté ya vinculado a otra notaría
3. Mostrar preview de búsquedas que se vincularán

**Vista previa:**
```
Vincular notaría: "142etla"

Búsquedas que se agregarán al historial:
- OFAC: 8 búsquedas (Diciembre 2023)
- SAT: 8 búsquedas (Diciembre 2023)
- Total: 16 búsquedas

¿Confirmar vinculación?
[Confirmar] [Cancelar]
```

---

### 7. **Logging de Vinculaciones** 📝

**Registro de auditoría:**
```php
// Tabla: notaria_legacy_links
Schema::create('notaria_legacy_links', function (Blueprint $table) {
    $table->id();
    $table->foreignId('notaria_id');
    $table->string('legacy_identifier');
    $table->integer('total_busquedas_vinculadas');
    $table->timestamp('vinculado_at');
    $table->foreignId('vinculado_por'); // SuperAdmin que hizo la vinculación
    $table->timestamps();
});
```

---

## 🔐 Consideraciones de Seguridad

### 1. **Acceso a Bases de Datos Legacy**

**Conexiones de solo lectura:**
```php
// config/database.php
'aplicativos_readonly' => [
    'driver' => 'mysql',
    'read' => [
        'host' => ['127.0.0.1'],
    ],
    'write' => [
        'host' => ['readonly.example.com'], // No usado
    ],
    'database' => 'atinet65_aplicativos',
    'username' => 'reader_user', // Usuario con permisos SELECT only
    'password' => env('DB_LEGACY_READONLY_PASSWORD'),
    'strict' => false,
],
```

### 2. **Rate Limiting**

**Limitar consultas a legacy:**
```php
RateLimiter::for('legacy-searches', function (Request $request) {
    return Limit::perMinute(10)->by($request->user()?->id);
});
```

### 3. **Sanitización de Datos Legacy**

**Los datos legacy pueden tener:**
- Caracteres especiales sin escapar
- Formato inconsistente
- Valores NULL inesperados

**Siempre sanitizar:**
```php
$termino = htmlspecialchars($busqueda->NOMBRE ?? $busqueda->RFC ?? 'Sin término');
```

---

## 📅 Cronograma Estimado

| Fase | Duración | Status |
|------|----------|--------|
| **Fase 1:** Importar usuarios Atinet | 2-3 días | 📋 Pendiente |
| **Fase 2:** Catálogo de notarías legacy | 1-2 días | 📋 Pendiente |
| **Fase 3:** Mejorar SuperAdminDashboard | 3-4 días | 📋 Pendiente |
| **Fase 4:** Vincular búsquedas legacy | 4-5 días | 📋 Pendiente |
| **Fase 5:** Adaptación tabla busquedas | 1-2 días | 📋 Pendiente |
| **Puntos adicionales** | 3-5 días | 📋 Opcional |
| **Testing + Deployment** | 2-3 días | 📋 Final |
| **TOTAL ESTIMADO** | **16-24 días** | |

---

## ✅ Checklist de Implementación

### Pre-requisitos
- [ ] Confirmar acceso a bases de datos legacy (lectura)
- [ ] Verificar conexiones configuradas en `database.php`
- [ ] Backup de BD master antes de cambios
- [ ] Crear branch: `feature/integracion-legacy`

### Fase 1: Usuarios Atinet
- [ ] Comando `php artisan import:atinet-users`
- [ ] Mapeo de campos legacy → nuevo
- [ ] Envío de notificaciones a usuarios
- [ ] Testing con usuarios reales

### Fase 2: Catálogo Notarías
- [ ] Query unificado para obtener notarías
- [ ] Endpoint API: `/api/admin/legacy/notarias`
- [ ] Cache del catálogo (1 día)
- [ ] Testing con notarías conocidas

### Fase 3: SuperAdminDashboard
- [ ] Combobox/Autocomplete de notarías
- [ ] Formulario con dos modos (catálogo/manual)
- [ ] Preview de estadísticas legacy
- [ ] Validación de duplicados

### Fase 4: Búsquedas Consolidadas
- [ ] Servicio `BusquedasConsolidadasService`
- [ ] Endpoint `/api/notarias/{id}/busquedas/consolidadas`
- [ ] Componente React `HistorialBusquedas`
- [ ] Testing de rendimiento

### Fase 5: Tabla Busquedas
- [ ] Migración para agregar campos `origen_*`
- [ ] Actualizar modelo `Busqueda`
- [ ] Actualizar seeders/factories
- [ ] Actualizar tests existentes

### Testing General
- [ ] Unit tests para servicio de búsquedas
- [ ] Feature tests para endpoints
- [ ] E2E tests para flujo completo
- [ ] Performance tests (1000+ búsquedas)

### Deployment
- [ ] Merge a `master`
- [ ] Ejecutar migraciones en producción
- [ ] Importar usuarios Atinet
- [ ] Verificar conexiones legacy en servidor
- [ ] Monitoreo de errores

---

## 📞 Contacto y Soporte

Para dudas o problemas con la integración:

- **Equipo de desarrollo:** dev@atinet.com.mx
- **Documentación legacy:** `/docs/DOCUMENTACION_PROYECTO_paginas de sistema legacy.md`
- **Arquitectura multi-tenant:** `/docs/architecture/ARQUITECTURA_MULTI_TENANT.md`

---

**Última actualización:** 9 de Marzo, 2026  
**Próxima revisión:** Al completar Fase 1
