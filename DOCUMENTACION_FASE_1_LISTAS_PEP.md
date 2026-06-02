# Documentación FASE 1 - Mejoras Vista React Listas PEP

**Fecha:** 28 de Mayo 2026  
**Archivo Principal:** `resources/js/pages/Admin/ListasPEP/Search.tsx`  
**Estado:** ✅ COMPLETADO

---

## 📋 Resumen Ejecutivo

Se completó la FASE 1 del proyecto de implementación de Listas PEP, mejorando significativamente la interfaz React para consultas de Personas Expuestas Políticamente (PEP). Se implementó un sistema completo de búsqueda, visualización de resultados, filtros, y un modo de demostración que NO consume las búsquedas reales del paquete contratado (23 búsquedas restantes de 600 totales).

---

## 🎯 Objetivos Alcanzados

### 1. Definición de Interfaces TypeScript
Se crearon interfaces robustas que mapean exactamente la estructura de la API de PrevencionDeLavado.com:

#### **PEPResultadoAPI** (Estructura Real de API)
```typescript
interface PEPResultadoAPI {
    codigoIndividuo: number;
    denominacion: string;
    identificacion: string | null;      // CURP
    idTributaria: string | null;         // RFC
    otraIdentificacion: string | null;
    fechaNacimiento: string | null;      // YYYYMMDD
    tipo: string;                        // "PEP" | "EX PEP" | "AFIN PEP" | etc.
    subTipo: string;
    estado: string;                      // "ACTIVO" | "INACTIVO"
    cargo: string;
    finalizacionCargo: string | null;
    lugarTrabajo: string;
    direccion: string;
    lista: string;
    paisLista: string;
    supuesto: string | null;
    situacion: string | null;
    exactitudDenominacion: string;       // "ALTO (5 sobre 5)"
    exactitudIdentificacion: string;     // "COINCIDE" | "N/D"
    enlace: string | null;               // URL a fuente original
}
```

#### **BusquedaResponseAPI** (Respuesta Completa API)
```typescript
interface BusquedaResponseAPI {
    codigoCertificadoBusqueda: string;   // UUID
    fechaConsulta: string;               // ISO DateTime
    resultados: PEPResultadoAPI[];
}
```

#### **PEPResultado** (Adaptado para React)
```typescript
interface PEPResultado extends PEPResultadoAPI {
    id: string;                          // Para keys de React
    apellido_denominacion: string;       // Separado para tabla
    nombres: string;                     // Separado para tabla
    exactitud: number;                   // 0-100 para visualización
    fuente: OrigenFuente;                // MEX | ARG | USA | OTRO
}
```

#### **OpcionesBusqueda** (5 Opciones de Búsqueda)
```typescript
interface OpcionesBusqueda {
    pepsOtrosPaises: boolean;            // Incluir PEPs de otros países
    satXDenominacion: boolean;           // Búsqueda SAT por denominación
    documentosSimilares: boolean;        // Incluir documentos similares
    forzarApellidos: boolean;            // Forzar búsqueda por apellidos
    generarCertificados: boolean;        // Generar certificado de consulta
}
```

---

## 🔧 Funciones Helper Implementadas

### 1. `formatoFecha(fecha: string | null): string`
**Propósito:** Convertir fechas de formato API (YYYYMMDD) a formato legible (DD/MM/YYYY)

```typescript
// Entrada: "19531113"
// Salida:  "13/11/1953"
```

### 2. `mapearResultadoAPI(resultado: PEPResultadoAPI): PEPResultado`
**Propósito:** Transformar respuesta de API a formato React optimizado

**Transformaciones:**
- **Separación de nombres:** `"LOPEZ OBRADOR ANDRES MANUEL"` → apellido: `"LOPEZ OBRADOR"`, nombres: `"ANDRES MANUEL"`
- **Conversión de exactitud:** `"ALTO (5 sobre 5)"` → `100` (porcentaje)
  - 5 sobre 5 = 100%
  - 4 sobre 5 = 80%
  - 3 sobre 5 = 60%
  - 2 sobre 5 = 40%
  - 1 sobre 5 = 20%
- **Detección de fuente:** Analiza `paisLista` para determinar origen:
  - Contiene "MEX" → `MEX`
  - Contiene "ARG" → `ARG`
  - Contiene "USA" o "ESTADOS UNIDOS" → `USA`
  - Otros → `OTRO`

### 3. `generarDatosEjemplo(): BusquedaResponseAPI`
**Propósito:** Generar datos de demostración sin consumir búsquedas reales

**Registros de Ejemplo:**
1. **LOPEZ OBRADOR ANDRES MANUEL** - EX PEP, 100% exactitud
2. **GARCIA MORALES JUAN CARLOS** - PEP, 100% exactitud
3. **MARTINEZ RODRIGUEZ MARIA ELENA** - AFIN PEP, 80% exactitud
4. **HERNANDEZ LOPEZ CARLOS ALBERTO** - PEP, 60% exactitud
5. **RAMIREZ SANCHEZ JOSE LUIS** - EX PEP, 100% exactitud

---

## 🎨 Componentes UI Mejorados

### 1. **ExactitudBars** - Indicador Visual de Exactitud
**Cambio:** De 5 barras individuales a barra de progreso + badge de porcentaje

**Características:**
- Barra de progreso con ancho fijo (16px)
- Badge con porcentaje numérico
- Código de colores:
  - **Verde:** ≥80% (alta coincidencia)
  - **Amarillo:** 50-79% (media coincidencia)
  - **Rojo:** <50% (baja coincidencia)

```tsx
// Ejemplo visual:
// [████████████████] 100%  (verde)
// [████████░░░░░░░░] 60%   (amarillo)
// [███░░░░░░░░░░░░░] 20%   (rojo)
```

### 2. **TipoBadge** - Badge por Tipo de PEP
**Características:**
- Badges con bordes de color
- Etiquetas descriptivas

**Variantes:**
- 🔴 **PEP** - `bg-red-100 text-red-700 border-red-300`
- 🟠 **EX PEP** - `bg-orange-100 text-orange-700 border-orange-300`
- 🟡 **AFIN PEP** - `bg-yellow-100 text-yellow-700 border-yellow-300`
- 🔵 **AFIN EX PEP** - `bg-blue-100 text-blue-700 border-blue-300`
- ⚪ **OTROS** - `bg-gray-100 text-gray-600 border-gray-300`

### 3. **FuenteBadge** - Badge por Origen de Fuente
**Características:**
- Badges con bordes y punto indicador circular
- Etiquetas descriptivas en español
- Fuente semibold para mejor legibilidad

**Variantes:**
- 🟢 **México** (MEX) - `bg-green-100 text-green-800 border-green-300`
- 🔷 **Argentina** (ARG) - `bg-sky-100 text-sky-800 border-sky-300`
- 🔵 **USA** (USA) - `bg-indigo-100 text-indigo-800 border-indigo-300`
- ⚪ **Otro** (OTRO) - `bg-gray-100 text-gray-700 border-gray-300`

```tsx
// Ejemplo visual:
// [●] México  [●] Argentina  [●] USA  [●] Otro
```

### 4. **DetalleExpandido** - Vista Detallada en Fila Expandible
**Cambio:** De modal Dialog a filas expandibles en tabla

**Diseño:**
- 4 Cards en grid responsivo (1 columna móvil, 2 tablet, 4 desktop)
- Fondo semi-transparente (`bg-muted/30`)
- Padding consistente

**Cards Implementadas:**

#### a) **Información Personal** (Icono: User)
- CURP
- RFC
- Fecha de Nacimiento
- Estado (Badge: ACTIVO verde / INACTIVO gris)
- Código de Individuo (monospace)

#### b) **Cargo y Función** (Icono: Briefcase)
- Cargo actual/anterior
- Lugar de trabajo
- Fecha de finalización (si aplica)
- Tipo de PEP (TipoBadge)
- Subtipo (Badge outline)

#### c) **Ubicación** (Icono: MapPin)
- Dirección completa

#### d) **Clasificación** (Icono: Hash)
- Lista de origen
- País (con icono Globe)
- Exactitud de denominación (coloreada)
- Exactitud de identificación (COINCIDE en verde)
- **Botón "Ver más"** - Redirige a fuente original
  - Solo visible si existe `resultado.enlace`
  - Abre en nueva pestaña (`target="_blank"`)
  - Seguro (`rel="noopener noreferrer"`)

---

## 🔍 Sistema de Filtros

### Diseño de Filtros (Estilo Dropdown)
**Patrón:** Replicado de `Users/Index.tsx` para consistencia

**Características:**
1. **Botón "Filtros"** con icono ChevronDown
2. Panel expandible/colapsable
3. Grid de 2 columnas (1 en móvil)
4. Botón "Limpiar" cuando hay filtros activos

**Filtros Disponibles:**
- **Tipo de Fuente:** Select con opciones
  - PEP
  - EX PEP
  - AFIN PEP
  - AFIN EX PEP
  - OTROS
  
- **Origen de la fuente:** Select con opciones
  - México
  - Argentina
  - USA
  - Otro

- **Búsqueda por texto:** Input con icono Search
  - Busca en apellido, nombres, identificación

---

## 📊 Tabla de Resultados

### Estructura
**Columnas:**
1. Checkbox (selección múltiple para certificados)
2. Apellidos y Denominación
3. Nombres
4. Identificación (CURP/RFC)
5. Exactitud (ExactitudBars)
6. Tipo (TipoBadge)
7. Fuente (FuenteBadge)
8. Acciones (botón chevron para expandir)

### Filas Expandibles
**Implementación:**
- Estado `filasExpandidas: Set<string>` para tracking
- Botón chevron (ChevronDown/ChevronUp) por fila
- Al expandir: se inserta `<TableRow>` adicional con `colSpan={7}`
- Contenido: Componente `DetalleExpandido` con 4 Cards

**Ventajas sobre Modal:**
- Comparación lado a lado de múltiples registros
- No pierde contexto de la tabla
- Mejor para workflows de revisión masiva

---

## 🎮 Modo Demostración

### Implementación
**Propósito:** Permitir pruebas de UI sin consumir búsquedas reales del paquete contratado

### `handleSearchDemo()` Function
**Características:**
1. **NO realiza llamadas a API real**
2. Simula delay de 1.5 segundos (UX realista)
3. Genera 5 registros de ejemplo con `generarDatosEjemplo()`
4. Actualiza todos los estados como búsqueda real:
   - `resultados`
   - `totalAciertos`
   - `codigoCertificado` (UUID simulado)
   - `fechaConsulta` (fecha actual)
   - `ultimaBusqueda` (datos del formulario)

### Botón "Vista Previa (Demo)"
**Ubicación:** Junto al botón "Buscar en Listas PEP"

```tsx
<Button
    type="button"
    variant="outline"
    onClick={handleSearchDemo}
    disabled={loading}
>
    <Eye className="mr-2 h-4 w-4" />
    Vista Previa (Demo)
</Button>
```

**Estado Visual:**
- Variante `outline` para diferenciarlo del botón principal
- Icono Eye para indicar "vista previa"
- Se deshabilita durante loading

---

## ✅ Opciones de Búsqueda

### Checkboxes Implementados
**Ubicación:** Formulario de búsqueda, debajo de campos de entrada

**5 Opciones:**
1. ☑️ **PEPs de otros países** (default: activo)
   - Incluir resultados internacionales
   
2. ☑️ **SAT por denominación** (default: activo)
   - Búsqueda en registros SAT
   
3. ☑️ **Documentos similares** (default: activo)
   - Incluir coincidencias aproximadas
   
4. ☐ **Forzar apellidos** (default: inactivo)
   - Búsqueda estricta por apellidos
   
5. ☑️ **Generar certificados** (default: activo)
   - Crear certificado de consulta automáticamente

**Gestión de Estado:**
```typescript
const [opciones, setOpciones] = useState<OpcionesBusqueda>({
    pepsOtrosPaises: true,
    satXDenominacion: true,
    documentosSimilares: true,
    forzarApellidos: false,
    generarCertificados: true,
});
```

---

## 📦 Información de Paquete

### Props Interface
```typescript
interface PaqueteInfo {
    total_contratado: number;    // 600
    consumidas: number;          // 577
    disponibles: number;         // 23
}

interface Props {
    paquete?: PaqueteInfo;
}
```

### Display
**Ubicación:** Header de la página

**Formato:**
```
📊 Búsquedas: 577 / 600 (23 disponibles)
```

**Colores:**
- Verde: >100 disponibles
- Amarillo: 20-100 disponibles
- Rojo: <20 disponibles

---

## 🔗 Integración con API Real

### Preparación Completada

#### 1. **Tipos de Datos**
✅ Interfaces TypeScript coinciden exactamente con respuesta de API

#### 2. **Mapeo de Datos**
✅ Función `mapearResultadoAPI()` lista para transformar datos reales

#### 3. **Opciones de Búsqueda**
✅ Checkboxes listos para convertir a formato API:
- `boolean` → `"S"` / `"N"` (conversión en controller)

#### 4. **Visualización de Resultados**
✅ Todos los campos de API mapeados a componentes UI:
- Información personal completa
- Cargos y funciones
- Ubicación
- Clasificación y listas
- Enlaces a fuentes originales

#### 5. **Certificados**
✅ Sistema de selección múltiple listo
✅ Display de código de certificado UUID

---

## 🎨 Mejoras Visuales vs. PrevencionDeLavado.com

### Diferencias Implementadas

| Aspecto | PrevencionDeLavado.com | Atinet Compliance Hub |
|---------|------------------------|------------------------|
| **Filtros** | Badges horizontales | Dropdowns colapsables |
| **Exactitud** | 5 barras verticales | Barra progreso + % |
| **Detalles** | Modal flotante | Filas expandibles |
| **Tipo PEP** | Texto plano | Badges coloreados con bordes |
| **Fuente** | Código país | Badge con label descriptivo + punto indicador |
| **Diseño** | Layout compacto | Espaciado generoso, Cards con sombra |
| **Tipografía** | Font sistema | Tailwind optimizada |

---

## 📁 Estructura de Archivos

### Archivo Principal
```
resources/js/pages/Admin/ListasPEP/Search.tsx (1,462 líneas)
```

### Organización Interna
```typescript
// ---------------------------------------------------------------------------
// Tipos (líneas 1-105)
// ---------------------------------------------------------------------------
- TipoPEP, OrigenFuente (types)
- PEPResultadoAPI, BusquedaResponseAPI (API interfaces)
- PEPResultado (React interface)
- BusquedaForm, OpcionesBusqueda
- PaqueteInfo, Props

// ---------------------------------------------------------------------------
// Helpers (líneas 106-160)
// ---------------------------------------------------------------------------
- formatoFecha()
- mapearResultadoAPI()

// ---------------------------------------------------------------------------
// Helpers UI (líneas 161-385)
// ---------------------------------------------------------------------------
- ExactitudBars()
- TipoBadge()
- FuenteBadge()
- DetalleExpandido()

// ---------------------------------------------------------------------------
// Componente Principal (líneas 386-1462)
// ---------------------------------------------------------------------------
- Estados (form, opciones, resultados, filtros, selección, expansión)
- generarDatosEjemplo()
- handleSearchDemo()
- handleSearch() [placeholder para API real]
- JSX (formulario, filtros, tabla, filas expandibles)
```

---

## 🚀 Estado de Implementación

### ✅ FASE 1 - COMPLETADO (100%)

**Checklist:**
- [x] Interfaces TypeScript completas
- [x] Funciones helper (formatoFecha, mapearResultadoAPI)
- [x] Componentes UI (ExactitudBars, TipoBadge, FuenteBadge)
- [x] Sistema de filtros dropdown
- [x] Tabla con filas expandibles
- [x] Componente DetalleExpandido (4 Cards)
- [x] Modo demostración (generarDatosEjemplo, handleSearchDemo)
- [x] Opciones de búsqueda (5 checkboxes)
- [x] Display de información de paquete
- [x] Selección múltiple para certificados
- [x] Botón "Ver más" con enlace a fuente
- [x] Compilación exitosa sin errores
- [x] 23 búsquedas preservadas (sin consumo durante desarrollo)

---

## 📝 Próximos Pasos

### FASE 2 - Migraciones de Base de Datos (EN PROGRESO)
**Estimado:** 1 hora  
**Prioridad:** ALTA

---

# FASE 2 - Estructura de Base de Datos

## 🎯 Objetivo
Crear estructura de base de datos para almacenar **TODOS** los resultados de consultas PEP (no solo los 5 mostrados en UI), permitiendo:
1. Auditoría completa de búsquedas realizadas
2. Consultas históricas sin consumir API adicional
3. Almacenamiento de URLs de verificación para cada resultado
4. Análisis y reportes de PEPs encontrados
5. Preservación de evidencia para cumplimiento normativo

---

## 📊 Diseño de Tablas

### **Tabla 1: `listas_pep_busquedas`**
**Propósito:** Historial de búsquedas realizadas (metadata de cada consulta)

```sql
CREATE TABLE listas_pep_busquedas (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id                 BIGINT UNSIGNED NOT NULL,
    notaria_id              BIGINT UNSIGNED NOT NULL,
    apellido_denominacion   VARCHAR(255) NOT NULL,
    nombres                 VARCHAR(255) NULL,
    identificacion          VARCHAR(255) NULL COMMENT 'CURP/RFC buscado',
    opciones                JSON NOT NULL COMMENT 'OpcionesBusqueda (5 checkboxes)',
    total_resultados        INT NOT NULL DEFAULT 0 COMMENT 'Total devuelto por API (ej: 94)',
    codigo_certificado      CHAR(36) NOT NULL UNIQUE COMMENT 'UUID de la API',
    fecha_consulta          TIMESTAMP NOT NULL COMMENT 'Fecha/hora de consulta a API',
    created_at              TIMESTAMP NULL,
    updated_at              TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (notaria_id) REFERENCES notarias(id) ON DELETE CASCADE,
    
    INDEX idx_user_id (user_id),
    INDEX idx_notaria_id (notaria_id),
    INDEX idx_codigo_certificado (codigo_certificado),
    INDEX idx_fecha_consulta (fecha_consulta),
    INDEX idx_apellido_denominacion (apellido_denominacion)
);
```

**Campos Clave:**
- `total_resultados`: Ej: Si API devuelve 94 resultados, aquí se guarda 94 (aunque UI muestre solo 5)
- `codigo_certificado`: UUID único de la búsqueda generado por PrevencionDeLavado.com
- `opciones`: JSON con estructura `OpcionesBusqueda`:
  ```json
  {
    "pepsOtrosPaises": true,
    "satXDenominacion": true,
    "documentosSimilares": true,
    "forzarApellidos": false,
    "generarCertificados": true
  }
  ```

---

### **Tabla 2: `listas_pep_resultados`**
**Propósito:** TODOS los resultados individuales de cada búsqueda (100% de datos API)

```sql
CREATE TABLE listas_pep_resultados (
    id                          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    busqueda_id                 BIGINT UNSIGNED NOT NULL,
    codigo_individuo            BIGINT NOT NULL COMMENT 'ID único del individuo en API',
    denominacion                VARCHAR(500) NOT NULL,
    identificacion              VARCHAR(255) NULL COMMENT 'CURP',
    id_tributaria               VARCHAR(255) NULL COMMENT 'RFC',
    otra_identificacion         VARCHAR(255) NULL,
    fecha_nacimiento            CHAR(8) NULL COMMENT 'YYYYMMDD',
    tipo                        VARCHAR(50) NOT NULL COMMENT 'PEP|EX PEP|AFIN PEP|AFIN EX PEP|OTROS',
    sub_tipo                    VARCHAR(50) NOT NULL,
    estado                      VARCHAR(50) NOT NULL COMMENT 'ACTIVO|INACTIVO',
    cargo                       TEXT NOT NULL,
    finalizacion_cargo          VARCHAR(255) NULL,
    lugar_trabajo               TEXT NOT NULL,
    direccion                   TEXT NOT NULL,
    lista                       VARCHAR(255) NOT NULL,
    pais_lista                  VARCHAR(100) NOT NULL,
    supuesto                    VARCHAR(255) NULL,
    situacion                   VARCHAR(255) NULL,
    exactitud_denominacion      VARCHAR(50) NOT NULL COMMENT 'ALTO (5 sobre 5)',
    exactitud_identificacion    VARCHAR(50) NOT NULL COMMENT 'COINCIDE|N/D',
    enlace                      TEXT NULL COMMENT '⭐ URL de verificación - CRÍTICO',
    orden_relevancia            INT NOT NULL COMMENT 'Posición 1-N en resultados API',
    created_at                  TIMESTAMP NULL,
    updated_at                  TIMESTAMP NULL,
    
    FOREIGN KEY (busqueda_id) REFERENCES listas_pep_busquedas(id) ON DELETE CASCADE,
    
    INDEX idx_busqueda_id (busqueda_id),
    INDEX idx_codigo_individuo (codigo_individuo),
    INDEX idx_tipo (tipo),
    INDEX idx_estado (estado),
    INDEX idx_pais_lista (pais_lista),
    INDEX idx_orden_relevancia (orden_relevancia),
    INDEX idx_identificacion (identificacion),
    INDEX idx_id_tributaria (id_tributaria)
);
```

**Campos Críticos:**
- `enlace`: **⭐ CAMPO MÁS IMPORTANTE** - URL de verificación para consultar datos actualizados
  - Ejemplo: `https://www.prevenciondelavado.com/portal/enlace.aspx?c=UTERU6LnQHe...`
- `orden_relevancia`: Posición en resultados API (1=más relevante, 94=menos relevante)
  - UI mostrará solo los primeros 5
  - Historial puede mostrar todos
- `codigo_individuo`: ID único del individuo en la base de datos de PrevencionDeLavado.com
  - Permite identificar al mismo individuo en múltiples búsquedas

---

## 🔄 Flujo de Datos

### Ejemplo: Búsqueda "Perez Guillermo"

**1. Usuario realiza búsqueda:**
```
Apellido: Perez
Nombre: Guillermo
Opciones: { pepsOtrosPaises: true, satXDenominacion: true, ... }
```

**2. API devuelve 94 resultados**

**3. Se almacena en BD:**

**`listas_pep_busquedas` (1 registro):**
```
id: 1
user_id: 42
notaria_id: 89
apellido_denominacion: "Perez"
nombres: "Guillermo"
identificacion: null
opciones: { "pepsOtrosPaises": true, ... }
total_resultados: 94
codigo_certificado: "6a71f8da-a0d8-4946-9579-7b5978ae4f70"
fecha_consulta: "2026-05-28 14:30:00"
```

**`listas_pep_resultados` (94 registros):**
```
Registro 1:
  busqueda_id: 1
  codigo_individuo: 3086274
  denominacion: "PEREZ GUILLERMO"
  tipo: "PEP"
  enlace: "https://www.prevenciondelavado.com/portal/enlace.aspx?c=..."
  orden_relevancia: 1  ← Top 1, se muestra en UI

Registro 2:
  busqueda_id: 1
  codigo_individuo: 19231715
  denominacion: "PEREZ GUILLERMO ANTONIO"
  tipo: "EX PEP"
  enlace: "https://www.prevenciondelavado.com/portal/enlace.aspx?c=..."
  orden_relevancia: 2  ← Top 2, se muestra en UI

...

Registro 94:
  busqueda_id: 1
  codigo_individuo: 7482913
  denominacion: "PEREZ GOMEZ GUILLERMO"
  tipo: "AFIN PEP"
  enlace: "https://www.prevenciondelavado.com/portal/enlace.aspx?c=..."
  orden_relevancia: 94  ← Se guarda pero NO se muestra en UI
```

**4. UI muestra solo top 5 (orden_relevancia 1-5)**

**5. Historial puede consultar todos los 94 sin consumir API**

---

## ✅ Beneficios de Esta Estructura

### 1. **Preservación Completa de Datos**
- Se guardan **TODOS** los resultados (94 en el ejemplo), no solo los 5 mostrados
- No se pierde información valiosa que podría ser relevante después

### 2. **URLs de Verificación**
- Campo `enlace` preserva URLs únicas para verificar datos actualizados
- Cumplimiento con regulaciones de verificación periódica

### 3. **Auditoría Completa**
- Rastreo de quién buscó qué y cuándo
- Evidencia de due diligence para auditorías

### 4. **Optimización de Búsquedas**
- Consultas repetidas se responden desde BD sin consumir API
- Ahorro de créditos del paquete contratado

### 5. **Análisis y Reportes**
```sql
-- Reportes posibles:
-- ¿Cuántos PEPs activos de México hemos encontrado?
SELECT COUNT(*) FROM listas_pep_resultados 
WHERE tipo = 'PEP' AND estado = 'ACTIVO' AND pais_lista = 'MÉXICO';

-- ¿Qué notaría ha realizado más búsquedas?
SELECT notaria_id, COUNT(*) FROM listas_pep_busquedas 
GROUP BY notaria_id ORDER BY COUNT(*) DESC;

-- ¿Hay individuos que aparecen en múltiples búsquedas?
SELECT codigo_individuo, denominacion, COUNT(*) 
FROM listas_pep_resultados 
GROUP BY codigo_individuo HAVING COUNT(*) > 1;
```

### 6. **Normalización Correcta**
- Datos de búsqueda no se duplican en cada resultado
- Relación 1:N (1 búsqueda → N resultados)
- Facilita mantenimiento y actualizaciones

---

## 🔍 Campos por Revisar en Benchmarking

**Ver análisis completo:** [ANALISIS_CAMPOS_BD_LISTAS_PEP.md](ANALISIS_CAMPOS_BD_LISTAS_PEP.md)

### Resumen de Campos Adicionales Identificados:

#### ALTA PRIORIDAD (Incluir en migración inicial):

**`listas_pep_busquedas`:**
- ✅ `ip_address` - Auditoría de seguridad
- ✅ `estado_busqueda` - Estado del proceso (PROCESADA, APROBADA, etc)
- ✅ `expediente_id` - Integración con expedientes notariales

**`listas_pep_resultados`:**
- ✅ `hash_registro` - Detectar duplicados y cambios
- ✅ `es_coincidencia_exacta` - Flag para filtros rápidos (100% exactitud)
- ✅ `accion_tomada` - Decisión sobre el resultado (APROBADO, RECHAZADO, etc)
- ✅ `justificacion` - Justificación de la acción tomada

#### MEDIA/BAJA PRIORIDAD (Fases futuras):
- Clasificación manual de riesgo (ALTO/MEDIO/BAJO)
- Tracking de actualizaciones/verificaciones
- Certificados PDF almacenados (base64)
- Sistema completo de revisión con usuarios revisores
- User agent tracking
- Documentos adjuntos por resultado

### Campos Validados con Sistema Existente:

✅ **Integración con `tbl_ope_expedientes`** - Se agregará `expediente_id` para vincular búsquedas con trámites notariales

✅ **Patrón de auditoría** - Se replica el patrón usado en `tbl_rel_expediente_pld` con campos de usuario, fechas y observaciones

✅ **Enums y estados** - Se usan ENUMs para campos de estado/clasificación siguiendo convenciones del proyecto

---

## 📋 Tareas FASE 2

### Checklist:
- [x] Investigar estructuras de BD similares (benchmarking)
- [x] Validar campos con normativas aplicables
- [x] Documentar análisis de campos (ANALISIS_CAMPOS_BD_LISTAS_PEP.md)
- [ ] Crear migración `create_listas_pep_busquedas_table`
- [ ] Crear migración `create_listas_pep_resultados_table`
- [ ] Crear modelo `ListaPEPBusqueda` con relaciones
- [ ] Crear modelo `ListaPEPResultado` con relaciones
- [ ] Aplicar trait `BelongsToNotaria` en ambos modelos
- [ ] Crear factories para testing
- [ ] Crear seeders para datos de ejemplo
- [ ] Ejecutar migraciones
- [ ] Validar estructura con `php artisan migrate:status`

---

### FASE 3 - PrevencionDeLavadoService (Siguiente)
**Estimado:** 2 horas

### FASE 4 - ListasPEPController
**Estimado:** 2 horas

### FASE 5 - Routes Activation
**Estimado:** 30 minutos

### FASE 6-8 - Features Avanzadas
**Estimado:** 4-6 horas

---

## 🔧 Comandos de Desarrollo

### Compilación Frontend
```bash
npm run build
```

### Verificar Errores
```bash
npm run build
# Salida: ✓ compiled successfully
```

### Formateo de Código (Laravel Pint)
```bash
vendor/bin/pint --dirty --format agent
```

---

## 📊 Métricas del Proyecto

- **Líneas de Código:** 1,462 (Search.tsx)
- **Interfaces TypeScript:** 8
- **Componentes UI:** 4 (ExactitudBars, TipoBadge, FuenteBadge, DetalleExpandido)
- **Funciones Helper:** 3 (formatoFecha, mapearResultadoAPI, generarDatosEjemplo)
- **Handlers:** 2 (handleSearchDemo, handleSearch)
- **Estados React:** 14
- **Búsquedas API Consumidas:** 0 (modo demo funcionando)
- **Búsquedas Disponibles:** 23 / 600

---

## ✨ Logros Clave

1. **💰 Preservación de Recursos:** Sistema de demo evitó consumo de 23 búsquedas restantes
2. **🎨 UI Diferenciada:** Diseño único vs. PrevencionDeLavado.com
3. **♿ Accesibilidad:** Enlaces seguros, labels descriptivos, estados visuales claros
4. **📱 Responsive:** Grid adaptativo, tabla responsive, diseño mobile-first
5. **🔒 Type Safety:** TypeScript estricto, interfaces completas, mapeo tipado
6. **🎯 UX Mejorada:** Filas expandibles > modals para comparación de resultados
7. **⚡ Performance:** Estados optimizados, renders mínimos, Set para tracking

---

## 🐛 Debugging History

### Problemas Resueltos

1. **FuenteBadge mostrando solo gris**
   - **Causa:** Uso de clases genéricas `bg-muted`
   - **Solución:** Cambio a variantes específicas con colores Tailwind explícitos

2. **Multi-replace fallando con "Multiple matches"**
   - **Causa:** Contexto de búsqueda ambiguo
   - **Solución:** Aumentar líneas de contexto antes/después del código

3. **handleSearchDemo con errores de sintaxis**
   - **Causa:** Falta de try/catch block
   - **Solución:** Agregado try/catch completo en función demo

---

## 📖 Referencias

- **API:** https://mbalistas.prevenciondelavado.com
- **Credenciales:** usuario="acostacl", clave="26F1D723"
- **Legacy Vue:** C:\Users\Dev pc\Desktop\LARAVEL\VUE\listasnegrasfront
- **Legacy Laravel:** C:\Users\Dev pc\Desktop\LARAVEL\listasNegras
- **Plan Maestro:** PLAN_IMPLEMENTACION_LISTAS_PEP.md

---

**Documentado por:** GitHub Copilot (Claude Sonnet 4.5)  
**Última Actualización:** 28 de Mayo 2026, 14:30  
**Estado:** FASE 1 COMPLETADA ✅
