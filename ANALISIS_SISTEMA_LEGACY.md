# 📊 Análisis Sistema Legacy ListasNegrasV2.1

## 🗄️ Estructura de Bases de Datos Legacy

### **Bases de Datos Existentes (Reutilizaremos)**

#### 1. BD Global OFAC: `atinet65_listasofac`
```php
Conexión: 'ofac'
Tablas:
  - Nombres (principal) → OfacNombres.php
    * NombreOriginal (varchar)
    * Campos: minimal
  
  - sdn (opcional)
  - alt (nombres alternativos - opcional)
```

#### 2. BD Global SAT: `atinet65_listassat`
```php
Conexión: 'sat'
Tablas:
  - 69-B (principal) → Sat69B.php
    * NombreOriginal (varchar)
    * RFC (varchar 12-13 chars)
    * Situacion (varchar)
    * PublicacionSAT (date)
    * PublicacionDOF (date)
    * NumeroOficio (varchar)
```

#### 3. BDs por Notaría (Tenant DBs)
```
Formato: atinet_{estado}_notaria_{numero}

Ejemplos:
  - atinet_bcs_notaria_21 (Baja California Sur)
  - atinet_edomex_notaria_1 (Estado de México)
  - atinet_jal_notaria_15 (Jalisco)

Tablas:
  - busquedas (logging legacy)
    * USER (varchar)
    * TIPO_BUSQUEDA (varchar)
    * NOMBRE (varchar)
    * RFC (varchar)
    * FECHA (timestamp)
    * N_ESTATUS (varchar)
    * R_ESTATUS (varchar)
```

---

## 🎯 Modelos Eloquent del Sistema Legacy

### **1. OfacNombres.php** (Reutilizable 100%)
```php
Ubicación: app/Models/OfacNombres.php
Conexión: 'ofac'
Tabla: 'Nombres'

Scopes:
  - searchByName($query, $nombre)
    * Búsqueda por palabras con LIKE
    * Remove comas automáticamente
    * Limit 100 resultados
  
Métodos Estáticos:
  - searchPersonaFisica($nombre)
  - searchPersonaMoral($nombre)
```

### **2. Sat69B.php** (Reutilizable 100%)
```php
Ubicación: app/Models/Sat69B.php
Conexión: 'sat'
Tabla: '69-B'

Scopes:
  - searchByRfc($query, $rfc)
    * Validación 12-13 caracteres
    * Upper case automático
    * Exacto match
  
  - searchByName($query, $nombre)
    * LIKE con wildcards
    * Remove comas
  
  - searchCombined($query, $rfc, $nombre)
    * RFC + nombre simultáneo
    * Mayor precisión

Métodos Estáticos:
  - searchRfc($rfc)
  - searchNombre($nombre)
  - searchRfcAndName($rfc, $nombre)
  
Validaciones:
  - isValidRfc($rfc) - 12 o 13 chars alfanuméricos
```

---

## 🔍 Algoritmos de Búsqueda

### **Búsqueda OFAC**
```php
1. Limpiar término: UPPER + TRIM
2. Dividir en palabras
3. REPLACE(NombreOriginal, ',', '') LIKE %palabra1% AND LIKE %palabra2%
4. Limit 100
5. unique('nombre_limpio')

Ejemplo: "BIN LADEN Osama" → encuentra "Osama BIN LADEN" y "BIN LADEN, Osama"
```

### **Búsqueda SAT**
```php
Por RFC:
  - Validar 12-13 caracteres alfanuméricos
  - WHERE RFC = '{rfcLimpio}'
  - Exacto match

Por Nombre:
  - REPLACE(NombreOriginal, ',', '') LIKE %{nombre}%
  - unique('RFC')

Combinado:
  - RFC + nombre simultáneo
  - Mayor precisión (100% match)
```

### **Cálculo de Coincidencias**
```php
similar_text($item->nombre_limpio, $termino, $porcentaje);
return round($porcentaje, 2);

Ejemplo:
  - "JUAN PEREZ" vs "JUAN PEREZ GARCIA" → 75%
  - "JUAN PEREZ" vs "JUAN PEREZ" → 100%
```

---

## 📋 Endpoints del Sistema Legacy

### **API Routes** (a replicar)
```php
POST /api/search/persona-fisica
  - Params: { nombre: string }
  - Returns: { resultados_ofac: [], resultados_sat: [] }

POST /api/search/persona-moral
  - Params: { denominacion_social: string }
  - Returns: { resultados_ofac: [], resultados_sat: [] }

POST /api/search/rfc
  - Params: { rfc: string }
  - Returns: { resultados: [] } (solo SAT)

POST /api/search/combined
  - Params: { nombre: string, rfc: string, tipo_persona: 'fisica|moral' }
  - Returns: { resultados_ofac: [], resultados_sat: { combinados, por_rfc, por_nombre } }
```

### **PDF Generation**
```php
GET /pdf/ofac?nombre={nombre}&encontrado=true
GET /pdf/sat?nombre={nombre}&rfc={rfc}&encontrado_nombre=true&encontrado_rfc=true
GET /pdf/negative?term={term}&type={type}

Clase: PdfOfac extends FPDF
Clase: PdfSat extends FPDF
```

---

## 🔧 Controlador Principal: BlacklistSearchController.php

### **Métodos Implementados** (a adaptar para multi-tenant)
```php
1. searchPersonaFisica(Request $request)
   - Búsqueda OFAC por nombre
   - Búsqueda SAT por nombre
   - Logging con logLegacySearch()

2. searchPersonaMoral(Request $request)
   - Similar a física pero para empresas
   - Denominación social

3. searchRfc(Request $request)
   - Solo SAT
   - Validación RFC 12-13 chars

4. searchCombined(Request $request)
   - OFAC + SAT simultáneo
   - Resultados estructurados por prioridad:
     * combinados (RFC + nombre)
     * por_rfc
     * por_nombre

5. calculateMatch($nombre1, $nombre2)
   - similar_text() nativo PHP
   - Return porcentaje

6. logLegacySearch($user, $type, $term, $rfc, $count, $request)
   - Inserta en tabla busquedas (BD tenant)
   - Campos: USER, TIPO_BUSQUEDA, NOMBRE, RFC, FECHA, estatus
```

---

## 🎨 Frontend Components (opcional)

### **Search.tsx** (React + Inertia)
```tsx
Funcionalidades:
  - Selector tipo: física/moral/rfc/combinada
  - Validación RFC client-side
  - Resultados clickeables
  - Botones PDF por resultado
  - Coincidencia % badge
  - Sin resultados → opción PDF negativo
```

---

## 🔄 Integración con Sistema Actual

### **Paso 1: Conexiones de Base de Datos**
```php
// config/database.php - AGREGAR:

'ofac' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_OFAC_DATABASE', 'atinet65_listasofac'),
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
],

'sat' => [
    'driver' => 'mysql',
    'host' => env('DB_HOST', '127.0.0.1'),
    'port' => env('DB_PORT', '3306'),
    'database' => env('DB_SAT_DATABASE', 'atinet65_listassat'),
    'username' => env('DB_USERNAME', 'root'),
    'password' => env('DB_PASSWORD', ''),
    'charset' => 'utf8mb4',
    'collation' => 'utf8mb4_unicode_ci',
],
```

### **Paso 2: Conexiones Dinámicas por Tenant**
```php
// Para logging en BD tenant
Config::set('database.connections.tenant', [
    'driver' => 'mysql',
    'host' => env('DB_HOST'),
    'database' => "atinet_{$estado}_notaria_{$numero}",
    'username' => env('DB_USERNAME'),
    'password' => env('DB_PASSWORD'),
]);

DB::purge('tenant');
DB::reconnect('tenant');
```

### **Paso 3: Integración con Servicios**
```php
// Antes de cada búsqueda
if (!can_use_service('OFAC')) {
    return response()->json(['error' => 'Servicio OFAC no disponible'], 403);
}

// Después de búsqueda
record_service_usage('OFAC', auth()->user(), [
    'termino' => $nombre,
    'resultados' => $count,
]);
```

### **Paso 4: SuperAdmin Access**
```php
// Middleware: EnsureSuperAdmin
if (auth()->user()->tipo_cuenta !== 'super_admin') {
    abort(403);
}

// SuperAdminSearchController extiende BlacklistSearchController
// Acceso sin restricciones de servicios
```

---

## 📊 Diferencias Sistema Legacy vs Actual

| Característica | Legacy | Actual (Atinet Hub) |
|---------------|--------|---------------------|
| Arquitectura | Single-tenant | Multi-tenant (shared DB) |
| Autenticación | Custom | Laravel Fortify |
| Frontend | React + Inertia v2 | React + Inertia v2 ✅ |
| Base de Datos | 3 BDs globales | BD central + tenant DBs |
| Logging | Tabla `busquedas` (tenant) | `search_logs` (central) |
| Servicios | Hard-coded | Sistema dinámico de servicios |
| Planes | No existe | 4 planes con herramientas |
| PDFs | FPDF nativo | FPDF (reutilizable) |
| Validaciones | Básicas | Form Requests + validación |

---

## ✅ Elementos Reutilizables (Copy-Paste)

1. ✅ **Modelos:** `OfacNombres.php`, `Sat69B.php`
2. ✅ **Scopes:** `searchByRfc`, `searchByName`, `searchCombined`
3. ✅ **Algoritmos:** Validación RFC, cálculo coincidencias, búsqueda por palabras
4. ✅ **PDFs:** Clases `PdfOfac`, `PdfSat`
5. ✅ **Logging:** Lógica de `logLegacySearch()` (adaptar a multi-tenant)

---

## 🔐 Elementos a Adaptar

1. 🔄 **BlacklistSearchController:** 
   - Agregar control de servicios (`can_use_service()`)
   - Agregar logging dual (central + tenant)
   - Agregar notaria_id awareness

2. 🔄 **Rutas:**
   - Proteger con middleware `auth`, `EnsureSuperAdmin`
   - Rate limiting

3. 🔄 **Frontend:**
   - Integrar con AppLayout actual
   - Considerar TypeScript types del sistema actual

---

## 📝 Tabla de Trabajo: Fase 2 Implementation

| # | Tarea | Tiempo | Prioridad |
|---|-------|--------|-----------|
| 1 | Copiar modelos OfacNombres, Sat69B | 10 min | ALTA |
| 2 | Actualizar config/database.php | 5 min | ALTA |
| 3 | Crear SuperAdminSearchController | 1 hora | ALTA |
| 4 | Crear rutas /superadmin/search/* | 15 min | ALTA |
| 5 | Integrar helpers de servicios | 30 min | ALTA |
| 6 | Crear vista SuperAdmin Search | 2 horas | MEDIA |
| 7 | Tests de búsqueda | 1 hora | MEDIA |
| 8 | Copiar PdfController | 30 min | BAJA |
| 9 | Tests de PDFs | 30 min | BAJA |

**Total estimado: 6 horas**

---

## 🎯 Conclusión

El sistema legacy ListasNegrasV2.1 tiene **código production-ready** que podemos reutilizar con **adaptaciones mínimas**. La arquitectura multi-tenant del sistema actual nos obliga a:

1. ✅ Mantener las **3 conexiones globales** (mysql, ofac, sat)
2. ✅ Agregar **conexión dinámica por tenant** para logging
3. ✅ Integrar con **sistema de servicios** existente
4. ✅ Implementar **SuperAdmin access** primero
5. ✅ Luego migrar a **NotariaDashboard** cuando funcione

**Siguiente paso:** Copiar modelos y configurar conexiones DB.
