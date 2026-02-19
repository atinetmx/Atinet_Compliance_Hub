# 🔍 Búsqueda en Listas Negras - OFAC + SAT
## Módulo de Cumplimiento Normativo - SuperAdmin

**Última actualización:** 13 de Febrero, 2026  
**Estado:** ✅ COMPLETADO Y FUNCIONAL

---

## 📋 Resumen Ejecutivo

Se ha implementado un sistema completo de búsqueda en listas negras OFAC (Estados Unidos) y SAT (México - Artículo 69-B) con soporte para:

- ✅ 4 tipos de búsqueda (Persona Física, Persona Moral, RFC, Combinada)
- ✅ Visualización detallada de resultados con múltiples coincidencias
- ✅ Generación de reportes en PDF profesionales (idéntico a sistema legacy)
- ✅ Interfaz intuitiva con React/TypeScript
- ✅ Soporte UTF-8 completo con tFPDF
- ✅ Protección por middleware de suscripción

---

## 🎯 Funcionalidades Implementadas

### 1. Búsquedas Disponibles

| Búsqueda | Parámetros | Lista | Respuesta |
|----------|-----------|-------|-----------|
| **Persona Física** | Nombre | OFAC | Detalles completos de coincidencias |
| **Persona Moral** | Nombre de empresa | OFAC | Coincidencias empresariales |
| **RFC** | RFC del contribuyente | SAT | Estado en lista SAT 69-B |
| **Combinada** | Nombre + RFC | OFAC + SAT | Resultados de ambas listas |

### 2. Visualización de Resultados

**Antes:** Solo mostraba texto genérico "Resultados de búsqueda"  
**Ahora:** Cards detallados con:
- Nombre completo del registro
- Similitud de coincidencia (%)
- RFC (cuando aplica)
- Tipo de coincidencia
- Situación legal (para SAT)
- Fecha de publicación
- Información adicional

**Separación visual:**
- ❌ Resultados OFAC (fondo rojo)
- 📋 Resultados SAT (fondo azul)

### 3. Generación de Reportes PDF

#### Formato OFAC
```
Estructura:
├─ Logo corporativo
├─ Fecha y hora en español
├─ Título y subtítulo OFAC
├─ Datos de búsqueda (nombre/RFC)
├─ Tabla con información de coincidencias
├─ Texto legal completo (OFAC disclaimer)
├─ Anexos (A, B, C, D)
├─ Fuentes consultadas
└─ Soporte para "Sin coincidencias"
```

#### Formato SAT
```
Estructura:
├─ Logo corporativo
├─ Fecha y hora en español
├─ Título (Artículo 69-B CFF)
├─ Datos de búsqueda (nombre/RFC)
├─ Tabla con información de coincidencias
├─ Texto legal completo (SAT disclaimer)
├─ Fuentes consultadas
└─ Soporte para "Sin coincidencias"
```

---

## 🛠️ Arquitectura Técnica

### Backend - Laravel

**Controlador:** `SuperAdmin/PdfController.php`
```php
// Clases FPDF para generación
- PdfOfac extends tFPDF
- PdfSat extends tFPDF
```

**Rutas Protegidas:**
```
GET /admin/search/persona-fisica  - Búsqueda OFAC (Física)
GET /admin/search/persona-moral   - Búsqueda OFAC (Moral)
GET /admin/search/rfc             - Búsqueda SAT
GET /admin/search/combined        - Búsqueda OFAC + SAT

GET /admin/pdf/ofac   - Generar PDF OFAC
GET /admin/pdf/sat    - Generar PDF SAT
```

**Protecciones:**
- Middleware `auth` (usuario autenticado)
- Middleware `subscription` (suscripción activa)
- Middleware `service:BLACKLIST_OFAC` o `service:BLACKLIST_SAT` (servicio habilitado)

### Frontend - React/TypeScript

**Página:** `resources/js/pages/Admin/ListasNegras/Search.tsx`

**Funcionalidades:**
```typescript
- handlePersonaFisicaSearch()     // API call con búsqueda
- handlePersonaMoralSearch()      // API call con búsqueda
- handleRfcSearch()               // API call con búsqueda
- handleCombinedSearch()          // API call con búsqueda

- renderAdvancedResults()         // Render cards con resultados
- generateSingleOfacPdfUrl()      // URL PDF individual OFAC
- generateSingleSatPdfUrl()       // URL PDF individual SAT
```

**UI Components (Shadcn):**
- Card, CardHeader, CardContent, CardTitle, CardDescription
- Button, Badge, Alert, AlertDescription, AlertCircle
- Input, Textarea, Select
- Tabs (para alternancia de búsquedas)

### Base de Datos

**Endpoints API esperados:**
```
POST /search/persona-fisica
  ├─ Parámetros: { nombre }
  └─ Respuesta: { success, data: { ofac_resultados, total_resultados }}

POST /search/persona-moral
  ├─ Parámetros: { nombre }
  └─ Respuesta: { success, data: { ofac_resultados, total_resultados }}

POST /search/rfc
  ├─ Parámetros: { rfc }
  └─ Respuesta: { success, data: { sat_resultados, total_resultados }}

POST /search/combined
  ├─ Parámetros: { nombre, rfc }
  └─ Respuesta: { success, data: { ofac_resultados, sat_resultados, total_resultados }}
```

---

## 📊 Flujo de Datos

```
Usuario SuperAdmin
    ↓
Completa formulario (nombre/RFC)
    ↓
Submit → /admin/search/{tipo}
    ↓
Backend valida suscripción + servicio
    ↓
Ejecuta búsqueda en BD OFAC/SAT
    ↓
Retorna resultados JSON con source: 'OFAC'|'SAT'
    ↓
Frontend renderiza cards separados por source
    ↓
Usuario hace click en "PDF" → /admin/pdf/ofac?params
    ↓
Backend genera PDF con tFPDF
    ↓
PDF descargado o abierto en navegador
```

---

## 🔧 Interfaz de Búsqueda

### Panel Izquierdo - 4 Tabs

#### Tab 1: Persona Física
- **Input:** Nombre completo o parcial
- **Búsqueda:** OFAC
- **Ejemplo:** "JUAN PEREZ"

#### Tab 2: Persona Moral
- **Input:** Razón social o parcial
- **Búsqueda:** OFAC
- **Ejemplo:** "BANCO NACIONAL"

#### Tab 3: RFC
- **Input:** RFC (12-13 caracteres)
- **Búsqueda:** SAT 69-B
- **Ejemplo:** "RFC123456ABC01"

#### Tab 4: Búsqueda Combinada
- **Input 1:** Nombre/RFC
- **Input 2:** RFC (opcional)
- **Búsqueda:** OFAC + SAT
- **Ejemplo:** "JUAN PEREZ" + "RFC123456ABC01"

### Panel Derecho - Sidebar

- Búsquedas recientes
- Estadísticas de búsqueda
- Links a documentación oficial
- Estado de suscripción

---

## 📝 Estructura de Datos - SearchResult

```typescript
interface SearchResult {
  id: string;
  name: string;
  nombre_limpio: string;
  tipo?: string;
  source: 'OFAC' | 'SAT';           // Crítico para filtrado
  
  // Campos OFAC
  similarity?: number;               // %
  tipo_coincidencia?: string;
  publicacion_ofac?: string;
  
  // Campos SAT
  coincidencia?: number;             // %
  rfc?: string;
  situacion?: string;
  publicacion_sat?: string;
  
  // Adicional
  details?: Record<string, any>;
}
```

---

## 🐛 Bugs Resueltos

### Problema 1: Resultados No Mostraban Detalles
**Causa:** Interfaz mostraba solo "Resultados de búsqueda"  
**Solución:** Implementamos `renderAdvancedResults()` con cards detallados

### Problema 2: Múltiples Resultados No Se Mostraban
**Causa:** `source` field no se asignaba en search handlers  
**Solución:** Mapeamos todos los resultados: `.map(r => ({ ...r, source: 'OFAC' as const }))`

### Problema 3: Rutas PDF 404
**Causa:** Frontend llamaba `/pdf/ofac` sin prefijo `/admin/`  
**Solución:** Actualizamos URLs a `/admin/pdf/ofac?params`

### Problema 4: Encoding UTF-8 Deprecated
**Causa:** FPDF usaba `utf8_encode()` deprecated en PHP 8.2  
**Solución:** Migramos a tFPDF con encoding `iconv()`

### Problema 5: PDF Button en Posición Incorrecta
**Causa:** Botón en header aplicaba a todos los resultados  
**Solución:** Movimos botón a cada result card individual

---

## 🚀 Instalación y Setup

### 1. Requisitos
```bash
# Ya instalados
- PHP 8.2.12
- Laravel 12
- React 19
- TypeScript
- setasign/tfpdf v1.33
```

### 2. Rutas Configuradas
✅ Archivo: `routes/web.php` (líneas 159-165)

### 3. Controlador Implementado
✅ Archivo: `app/Http/Controllers/SuperAdmin/PdfController.php`

### 4. Componente Frontend
✅ Archivo: `resources/js/pages/Admin/ListasNegras/Search.tsx`

---

## 📦 Librerías Utilizadas

| Librería | Versión | Uso |
|----------|---------|-----|
| **setasign/tfpdf** | 1.33 | Generación de PDFs con UTF-8 |
| **carbon** | 3.x | Formateo de fechas en español |
| **react** | 19 | Interfaz de usuario |
| **@inertiajs/react** | 2.0 | SSR + React |
| **tailwindcss** | 4.0 | Estilos |
| **shadcn/ui** | Latest | Componentes UI |

---

## 📄 Generación de PDF - Detalles Técnicos

### Clase `PdfOfac extends tFPDF`

```php
public function generarPdf($nombre, $encontrado)
{
    // $encontrado: bool - SI encontró coincidencia
    // $nombre: string - Nombre buscado
    
    // Resultado: "Afirmativo" o "Negativo"
    $resultado = $encontrado ? 'Afirmativo' : 'Negativo';
    $resultado2 = $encontrado ? 'SI' : 'NO';
    
    // PDF incluye:
    // - Logo corporativo
    // - Fecha/hora en español (Carbon)
    // - Tabla con información
    // - 2 párrafos de legales OFAC
    // - 4 Anexos (A, B, C, D)
    // - Fuentes consultadas
}
```

### Clase `PdfSat extends tFPDF`

```php
public function generarPdf($nombre, $rfc, $encontradoNombre, $encontradoRfc)
{
    // Resultado separado para nombre y RFC
    $resultadoNombre = $encontradoNombre ? 'Afirmativo' : 'Negativo';
    $resultadoRfc = $encontradoRfc ? 'Afirmativo' : 'Negativo';
    
    // PDF incluye:
    // - Logo corporativo
    // - Fecha/hora en español (Carbon)
    // - Tabla con nombre, RFC y estados
    // - Artículo 69-B información legal
    // - Fuentes consultadas (SAT)
}
```

### Encoding de Texto

```php
private function encodeText($text)
{
    // Modernización: iconv reemplaza utf8_encode (deprecated)
    return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
}
```

---

## 🔐 Seguridad

### Middleware de Protección

```
GET /admin/pdf/ofac → 3 capas:
├─ auth              (Usuario autenticado)
├─ subscription      (Suscripción activa)
└─ service:BLACKLIST_OFAC (Servicio habilitado)
```

### Validación de Entrada

- Nombre/RFC sanitizados antes de búsqueda
- Parámetros JSON `json_decode()` con validación
- URL parameters `encodeURIComponent()` en frontend

### Límites de Servicio

- PDFs NO consumen límites (resultado de búsqueda ya realizada)
- Búsquedas SÍ consumen límites del plan
- Contador de búsquedas por servicio

---

## 📊 Estados del Resultado

### OFAC
```
Afirmativo   → ✅ Se encontró coincidencia exacta
Negativo     → ✅ NO se encontró coincidencia (PDF válido)
```

### SAT (Artículo 69-B)
```
Nombre: Afirmativo/Negativo
RFC:    Afirmativo/Negativo
```

---

## 🧪 Testing

### Casos de Prueba Básicos

```
✓ Búsqueda OFAC sin resultados → PDF "Negativo"
✓ Búsqueda OFAC con 1 resultado → PDF "Afirmativo" 
✓ Búsqueda OFAC con 3+ resultados → Múltiples PDFs
✓ Búsqueda SAT sin resultados → PDF "Negativo"
✓ Búsqueda SAT con resultados → PDF con RFC y estado
✓ Búsqueda Combinada → Ambas listas
✓ Caracteres acentuados → Renderé correctamente en PDF
✓ RFC con formato → Válida estructura 12-13 caracteres
```

---

## 📈 Próximas Mejoras (Futuro)

- [ ] Cacheo de búsquedas recientes
- [ ] Exportación a Excel además de PDF
- [ ] Historial de búsquedas por usuario
- [ ] Alertas cuando nombre entra a lista negra
- [ ] Integración con API real de OFAC/SAT
- [ ] Análisis de similitud mejorado
- [ ] Dashboard de estadísticas de búsquedas

---

## 📚 Archivos Principales

| Archivo | Líneas | Descripción |
|---------|--------|-------------|
| `Search.tsx` | 1,070 | Componente React principal |
| `SuperAdmin/PdfController.php` | 240 | Generación de PDFs |
| `routes/web.php` | 165 | Rutas protegidas |
| `.intelephense.json` | - | Configuración IDE |

---

## 🔍 Validación de Setup

```bash
# Verificar sintaxis PHP
php -l app/Http/Controllers/SuperAdmin/PdfController.php
# → No syntax errors detected ✅

# Verificar dependencias
composer show setasign/tfpdf
# → versions: * v1.33 ✅

# Verificar build frontend
npm run build
# → ✅ Build successful
```

---

## 📞 Contacto y Reportes

Para bugs o mejoras en este módulo:
- Revisar [GitHub Issues](https://github.com/spartha1/Atinet_Compliance_Hub/issues)
- Crear pull request con cambios
- Documentar en sesión de notas

---

**Documentación creada:** 13 de Febrero, 2026  
**Desarrollador:** GitHub Copilot  
**Estado:** Completo y listo para producción ✅
