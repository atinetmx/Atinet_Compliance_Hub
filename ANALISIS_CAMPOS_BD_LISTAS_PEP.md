# Análisis de Campos para BD Listas PEP

**Fecha:** 28 de Mayo 2026  
**Actualizado:** Junio 2, 2026  
**Propósito:** Identificar campos necesarios antes de crear migraciones

---

## 🎯 Objetivo

Determinar la estructura completa de las tablas `listas_pep_busquedas` y `listas_pep_resultados` antes de la implementación, asegurando que:
1. No falten campos críticos
2. Se cumplan requisitos normativos
3. Se permita auditoría completa
4. Se faciliten análisis futuros

---

## 📊 Campos Propuestos Inicialmente

### Tabla: `listas_pep_busquedas`
```
✅ id                      - PK
✅ user_id                 - FK users
✅ notaria_id              - FK notarias
✅ apellido_denominacion   - VARCHAR(255)
✅ nombres                 - VARCHAR(255) NULL
✅ identificacion          - VARCHAR(255) NULL (CURP/RFC buscado)
✅ opciones                - JSON (5 checkboxes)
✅ total_resultados        - INT (total devuelto por API)
✅ codigo_certificado      - CHAR(36) UNIQUE (UUID de API)
✅ fecha_consulta          - TIMESTAMP (cuando se consultó API)
✅ created_at              - TIMESTAMP
✅ updated_at              - TIMESTAMP
```

### Tabla: `listas_pep_resultados`
```
✅ id                          - PK
✅ busqueda_id                 - FK listas_pep_busquedas
✅ codigo_individuo            - BIGINT (ID único en API)
✅ denominacion                - VARCHAR(500)
✅ identificacion              - VARCHAR(255) NULL (CURP)
✅ id_tributaria               - VARCHAR(255) NULL (RFC)
✅ otra_identificacion         - VARCHAR(255) NULL
✅ fecha_nacimiento            - CHAR(8) NULL (YYYYMMDD)
✅ tipo                        - VARCHAR(50) (PEP, EX PEP, etc)
✅ sub_tipo                    - VARCHAR(50)
✅ estado                      - VARCHAR(50) (ACTIVO/INACTIVO)
✅ cargo                       - TEXT
✅ finalizacion_cargo          - VARCHAR(255) NULL
✅ lugar_trabajo               - TEXT
✅ direccion                   - TEXT
✅ lista                       - VARCHAR(255)
✅ pais_lista                  - VARCHAR(100)
✅ supuesto                    - VARCHAR(255) NULL
✅ situacion                   - VARCHAR(255) NULL
✅ exactitud_denominacion      - VARCHAR(50)
✅ exactitud_identificacion    - VARCHAR(50)
✅ enlace                      - TEXT NULL (URL verificación)
✅ orden_relevancia            - INT
✅ created_at                  - TIMESTAMP
✅ updated_at                  - TIMESTAMP
```

---

## 🔍 Análisis de Sistema Existente

### Tabla Legacy: `tbl_cat_prevencion_lavado_dinero`
**Estructura actual en Control Notarial:**
```sql
Id               INT
Descripcion      TEXT NULL
Activo           BOOLEAN DEFAULT 1
Fecha_Creacion   DATETIME
```

**Observación:** Esta tabla es solo un catálogo simple de tipos de PLD, NO almacena resultados de búsquedas. Nuestro diseño es diferente y más completo.

### Tabla Legacy: `tbl_rel_expediente_pld`
**Relación con expedientes:**
```sql
Id                  INT
Expediente_Id       INT FK
PLD_Id              INT FK
Usuario_Id          INT FK
Realizado           TINYINT(1) DEFAULT 0
Estatus_Id          INT FK
Observaciones       TEXT
Fecha_Realizado     DATETIME
Fecha_Creacion      DATETIME
```

**Posible integración futura:** Vincular resultados PEP con expedientes notariales.

---

## 💡 Campos Adicionales a Considerar

### Para `listas_pep_busquedas`:

#### 1. **Campos de Tracking de Actualizaciones**
```sql
⚠️ ultima_actualizacion      TIMESTAMP NULL
   - Fecha de última re-consulta/actualización
   - Permite tracking de vigencia de datos
```

#### 2. **Campos de Clasificación de Riesgo**
```sql
⚠️ nivel_riesgo              ENUM('ALTO','MEDIO','BAJO') NULL
   - Clasificación manual por usuario
   - Útil para reportes de compliance

⚠️ requiere_analisis         BOOLEAN DEFAULT 0
   - Flag para indicar que necesita revisión adicional
```

#### 3. **Campos de Auditoría Extendida**
```sql
⚠️ ip_address                VARCHAR(45) NULL
   - IP desde donde se realizó la búsqueda
   - Útil para auditorías de seguridad

⚠️ user_agent                TEXT NULL
   - Navegador/dispositivo usado
   - Análisis de patrones de uso
```

#### 4. **Campos de Integración con Expedientes**
```sql
⚠️ expediente_id             BIGINT UNSIGNED NULL FK
   - Vincular búsqueda con expediente específico
   - Relación directa con tbl_ope_expedientes

⚠️ tipo_tramite              VARCHAR(100) NULL
   - Contexto de la búsqueda (compraventa, testamento, etc)
```

#### 5. **Campos de Certificación**
```sql
⚠️ certificado_pdf           LONGTEXT NULL
   - Certificado en base64 o ruta a archivo
   - Almacenar evidencia documental

⚠️ certificado_firmado       BOOLEAN DEFAULT 0
   - Si el certificado fue firmado electrónicamente
```

#### 6. **Campos de Estado de Búsqueda**
```sql
⚠️ estado_busqueda           ENUM('PENDIENTE','PROCESADA','APROBADA','RECHAZADA') DEFAULT 'PROCESADA'
   - Estado del proceso de revisión

⚠️ revisado_por              BIGINT UNSIGNED NULL FK
   - Usuario que revisó los resultados

⚠️ fecha_revision            TIMESTAMP NULL
   - Cuándo se revisó

⚠️ comentarios_revision      TEXT NULL
   - Notas del revisor
```

---

### Para `listas_pep_resultados`:

#### 1. **Campos de Hash/Comparación**
```sql
⚠️ hash_registro             CHAR(64) NULL
   - Hash SHA256 de campos clave
   - Detectar cambios en re-consultas
   - Evitar duplicados exactos
```

#### 2. **Campos de Scoring**
```sql
⚠️ score_relevancia          DECIMAL(5,2) NULL
   - Score calculado (0.00 - 100.00)
   - Basado en exactitud + estado + tipo

⚠️ es_coincidencia_exacta    BOOLEAN DEFAULT 0
   - Flag para coincidencias 100%
```

#### 3. **Campos de Tracking de Cambios**
```sql
⚠️ verificado_en             TIMESTAMP NULL
   - Última vez que se verificó el enlace

⚠️ enlace_activo             BOOLEAN DEFAULT 1
   - Si la URL aún funciona

⚠️ datos_actualizados_en     TIMESTAMP NULL
   - Cuándo se actualizaron los datos del individuo
```

#### 4. **Campos de Acción Tomada**
```sql
⚠️ accion_tomada             ENUM('APROBADO','RECHAZADO','REQUIERE_ANALISIS','EN_REVISION') NULL
   - Decisión sobre este resultado específico

⚠️ justificacion             TEXT NULL
   - Justificación de la acción tomada

⚠️ decidido_por              BIGINT UNSIGNED NULL FK
   - Usuario que tomó la decisión

⚠️ decidido_en               TIMESTAMP NULL
   - Cuándo se tomó la decisión
```

#### 5. **Campos de Documentación**
```sql
⚠️ documento_adjunto         TEXT NULL
   - Ruta o base64 de documento relacionado

⚠️ notas_internas            TEXT NULL
   - Notas privadas del equipo de compliance
```

---

## 🎯 Campos Recomendados para Inclusión Inmediata

### ALTA PRIORIDAD (Incluir en migración inicial):

#### `listas_pep_busquedas`:
1. ✅ `ip_address VARCHAR(45) NULL` - Auditoría de seguridad
2. ✅ `estado_busqueda ENUM('PENDIENTE','PROCESADA','APROBADA','RECHAZADA') DEFAULT 'PROCESADA'`
3. ✅ `expediente_id BIGINT UNSIGNED NULL FK` - Integración con expedientes

#### `listas_pep_resultados`:
1. ✅ `hash_registro CHAR(64) NULL` - Detectar duplicados
2. ✅ `es_coincidencia_exacta BOOLEAN DEFAULT 0` - Filtros rápidos
3. ✅ `accion_tomada ENUM('APROBADO','RECHAZADO','REQUIERE_ANALISIS','EN_REVISION') NULL`
4. ✅ `justificacion TEXT NULL`

---

## 🔮 Campos para FASE 3 (Mejoras Futuras):

### MEDIA PRIORIDAD:
- Clasificación de riesgo manual
- Tracking de actualizaciones/verificaciones
- Certificados PDF almacenados
- Sistema de revisión/aprobación completo

### BAJA PRIORIDAD:
- User agent tracking
- Documentos adjuntos por resultado
- Scoring avanzado
- Firma electrónica de certificados

---

## 📋 Decisión Final

### Estructura Inicial Propuesta (FASE 2):

#### `listas_pep_busquedas` - 15 campos
```
✅ id, user_id, notaria_id
✅ apellido_denominacion, nombres, identificacion
✅ opciones (JSON)
✅ total_resultados, codigo_certificado, fecha_consulta
✅ ip_address                    ← NUEVO
✅ estado_busqueda              ← NUEVO (DEFAULT 'PROCESADA')
✅ expediente_id                 ← NUEVO (NULL FK)
✅ created_at, updated_at
```

#### `listas_pep_resultados` - 29 campos
```
✅ id, busqueda_id
✅ codigo_individuo, denominacion
✅ identificacion, id_tributaria, otra_identificacion
✅ fecha_nacimiento
✅ tipo, sub_tipo, estado
✅ cargo, finalizacion_cargo, lugar_trabajo, direccion
✅ lista, pais_lista
✅ supuesto, situacion
✅ exactitud_denominacion, exactitud_identificacion
✅ enlace
✅ orden_relevancia
✅ hash_registro                 ← NUEVO
✅ es_coincidencia_exacta        ← NUEVO (DEFAULT 0)
✅ accion_tomada                 ← NUEVO (NULL)
✅ justificacion                 ← NUEVO (NULL)
✅ created_at, updated_at
```

---

## ✅ Validación con Requerimientos

### Cumplimiento Normativo:
- ✅ Auditoría completa (user_id, notaria_id, ip_address, timestamps)
- ✅ Trazabilidad (estado_busqueda, accion_tomada, justificacion)
- ✅ Evidencia (todos los campos de API, hash_registro)
- ✅ URLs de verificación (enlace, orden_relevancia)

### Funcionalidad:
- ✅ Mostrar top 5 más relevantes (orden_relevancia 1-5)
- ✅ Almacenar TODOS los resultados (ej: 94 completos)
- ✅ Consultas históricas sin consumir API
- ✅ Integración con expedientes notariales
- ✅ Filtros y reportes avanzados

### Escalabilidad:
- ✅ Estructura extensible (JSON para opciones)
- ✅ Índices para búsquedas rápidas
- ✅ Preparado para mejoras futuras (hash, accion_tomada)

---

## 🚀 Próximo Paso

**Crear migraciones** con la estructura validada:
1. `2026_05_28_create_listas_pep_busquedas_table.php`
2. `2026_05_28_create_listas_pep_resultados_table.php`

---

## 🔭 Campos Adicionales Descubiertos vía Swagger (Junio 2, 2026)

**Fuente:** `GET /swagger/v1/swagger.json` de `mbalistas.prevenciondelavado.com` — descubierto durante auditoría de seguridad.

### Comparación Endpoint `/Listas` (actual) vs `/Listas/ListasApi/Listas` (enriquecido)

Nuestro endpoint actual devuelve `ResultadoPersona`. El endpoint alternativo devuelve `PersonaDto`, que tiene campos adicionales:

| Campo en API (`PersonaDto`) | Columna BD | Tabla | Prioridad | Motivo |
|---|---|---|---|---|
| `fechaBaja` | `fecha_baja` | resultados + personas | **ALTA** | Cuándo fue dado de baja de la lista — crítico para compliance (¿sigue activo?) |
| `listaId` | `lista_id` | resultados + personas | **MEDIA** | ID de la lista (e.g. `"PEP-MEX-GOB"`) — útil para filtros y agrupación |
| `paisListaId3` | `pais_lista_id3` | resultados + personas | **MEDIA** | Código ISO-3 del país (e.g. `"MEX"`) — banderas en UI, búsquedas estandarizadas |
| `fuenteDescLarga` | `fuente_desc_larga` | resultados + personas | **MEDIA** | Nombre completo de la fuente — más descriptivo que `lista` |
| `subTipoDescCorta` | `sub_tipo_desc_corta` | resultados | BAJA | Etiqueta corta del subtipo para badges compactos |
| `paisCooperante` | `pais_cooperante` | resultados | BAJA | País cooperante — solo aplica a listas GAFI/OCDE |

> **Restricción:** Los campos adicionales solo se obtienen con el endpoint `/Listas/ListasApi/Listas`, que requiere un objeto `UA` (Unidad de Acceso) que debe proveer el vendor. Nuestro endpoint actual (`/Listas`) no devuelve esos campos.
> La migración creará las columnas ahora para estar preparados cuando tengamos el `UA`.

### Esquema de `Consumo` — Plan contratado en tiempo real

El endpoint `GET /Listas/Consumos` devuelve:

```json
{
  "resultados": [{
    "periodo":              "31/12/2025 - 31/12/2026",
    "plan":                 "50",
    "consultasDisponibles": 20,
    "consultasContratadas": 50,
    "importante":           "",
    "tipoPlan":             "Demostración"
  }]
}
```

→ Implementado en `PrevencionDeLavadoService::getConsumos()` y expuesto en `GET /admin/listas-pep/consumos`.

### Campos del objeto `UA` (plan contractual — disponible en `/Listas/ListasApi/Listas`)

```
cantidadBusquedas         → INT (total del plan)
cantidadMesesPeriodo      → INT
porcentajeAvisoExceso     → INT (aviso cuando se supere X%)
fechaInicio               → string
fechaExpiracionVenta      → string
tipoPlan                  → string
modulos[].id              → módulos contratados (SAT, etc.)
modulos[].estadoComercial → ACTIVO / INACTIVO / DEMO
modulos[].esDemo          → bool
```

→ Útil para un **dashboard de Atinet admin** mostrando qué APIs están contratadas y el tipo de plan. A implementar en FASE 10 (dashboard).

### Migración pendiente

`2026_06_02_add_swagger_fields_to_listas_pep_tables` — agregar `fecha_baja`, `lista_id`, `pais_lista_id3`, `fuente_desc_larga` a `listas_pep_resultados` y `listas_pep_personas`.

