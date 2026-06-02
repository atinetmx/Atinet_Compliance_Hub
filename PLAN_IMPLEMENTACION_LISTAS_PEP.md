# 📋 Plan de Implementación - Módulo Listas PEP

**Fecha:** Mayo 27, 2026  
**Actualizado:** Junio 1, 2026 (tarde)  
**Proyecto:** Atinet Compliance Hub  
**Objetivo:** Implementar completamente el módulo de Listas PEP con integración a prevenciondelavado.com

---

## 🏗️ Arquitectura del Sistema — Decisiones de Diseño (Junio 1, 2026)

### Modelo de 3 Capas

```
┌─────────────────────────────────────────────────────────────┐
│  CAPA 1 — Pool PLD (pep_paquetes_pld)                       │
│  Atinet compra paquetes a prevenciondelavado.com            │
│  Ej: Plan 50 → total_busquedas=50, periodo_inicio/fin       │
│  reserva_atinet (implícita) = total - busquedas_asignadas   │
└─────────────────────┬───────────────────────────────────────┘
                      │ Atinet asigna cuotas
         ┌────────────┴────────────┐
         ▼                         ▼
┌─────────────────┐    ┌───────────────────────────┐
│  Super-admin    │    │  pep_cuotas_notaria        │
│  (ATINET MASTER │    │  Notaría A → 50 tokens     │
│   notaría fija) │    │  Notaría B → 30 tokens     │
│  sin límite de  │    │  (cuota TOTAL, no mensual) │
│  cuota propia   │    └──────────────┬─────────────┘
└────────┬────────┘                   │
         │                            │ Cada búsqueda consume 1 token
         ▼                            ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA 2 — BD Interna (listas_pep_personas)                  │
│  Un registro por codigo_individuo (deduplicado)             │
│  Alimentada por búsquedas online + scraper diario           │
│  Permite búsquedas OFFLINE sin consumir tokens              │
│  listas_pep_resultados = log de auditoría por búsqueda      │
└─────────────────────┬───────────────────────────────────────┘
                      │ Solo si hay tokens Y no está en BD interna
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  CAPA 3 — API PLD (prevenciondelavado.com)                  │
│  Consume 1 token del pool                                   │
│  Resultados se guardan en listas_pep_personas (upsert)      │
│  + listas_pep_resultados (log)  + service_usage (billing)   │
└─────────────────────────────────────────────────────────────┘
```

### Flujo Completo de una Búsqueda

```
Usuario busca "López Obrador"
        │
        ▼
¿Es SuperAdmin?
  ├─ SÍ → usa notaría ATINET MASTER; verifica pool total
  │        disponible = total_busquedas - busquedas_asignadas_a_notarias
  └─ NO → verifica pep_cuotas_notaria de su notaría
                (busquedas_asignadas - busquedas_consumidas)
        │
        ▼
¿Hay tokens disponibles?
  │
  ├─ SÍ ──────────────────────────────────────────────────────┐
  │                                                            │
  │  ┌─ Llamar API prevenciondelavado.com ──────────────────┐ │
  │  │  → Guardar cada resultado en listas_pep_resultados   │ │
  │  │  → UPSERT en listas_pep_personas por codigo_individuo│ │
  │  │  → Decrementar pep_cuotas_notaria.busquedas_consumidas│ │
  │  │  → Registrar en service_usage (para facturación)     │ │
  │  │  → listas_pep_busquedas.estado = 'PROCESADA'         │ │
  │  └──────────────────────────────────────────────────────┘ │
  │                                                            │
  └─ NO ───────────────────────────────────────────────────────┤
                                                               │
     ┌─ Buscar en listas_pep_personas ──────────────────────┐  │
     │  WHERE denominacion LIKE '%término%'                  │  │
     │  listas_pep_busquedas.estado = 'BD_INTERNA'          │  │
     │  Nota: resultados pueden estar desactualizados        │  │
     └──────────────────────────────────────────────────────┘  │
                                                               │
        ▼──────────────────────────────────────────────────────┘
Guardar listas_pep_busquedas (log de la consulta)
```

### Tarea Programada — Scraper de Verificación

```
Cron diario (horario configurable)
│
├─ Leer listas_pep_personas donde:
│    ultima_verificacion_scraper < NOW() - intervalo_dias
│    OR ultima_verificacion_scraper IS NULL
│
├─ Para cada persona:
│    1. Hacer HTTP GET a listas_pep_personas.enlace
│       (URL de prevenciondelavado.com de ese individuo)
│    2. Hacer scraping de los campos visibles
│    3. Calcular nuevo hash_registro (SHA256 del contenido)
│    4. Comparar con hash_registro almacenado
│
│    ├─ Sin cambios → actualizar ultima_verificacion_scraper
│    └─ Con cambios → actualizar todos los campos modificados
│                     + nueva fila en listas_pep_resultados
│                       (tipo fuente: 'SCRAPER')
│                     + notificar a soporte@atinet.mx si
│                       ACTIVO → INACTIVO o viceversa
│
└─ Enviar resumen de ejecución por correo
```

### Reglas de Negocio Importantes

| Regla | Detalle |
|-------|---------|
| **Sin tokens → solo BD interna** | No se puede llamar a la API PLD si `disponibles = 0` |
| **Super-admin usa reserva Atinet** | `reserva = total_busquedas - busquedas_asignadas`. Sin límite de cuota propia |
| **Cuota es TOTAL, no mensual** | A diferencia de BLACKLIST_SAT/OFAC (que se renuevan mensual), la cuota PEP es por paquete contratado |
| **ATINET MASTER notaría** | Los super-admins tienen asignada esta notaría para búsquedas internas; mantiene consistencia con Control Notarial |
| **Deduplicación por codigo_individuo** | `listas_pep_personas` = 1 fila por persona (UPSERT). `listas_pep_resultados` = log de resultados por búsqueda (puede repetir) |
| **Fuentes del scraper** | prevenciondelavado.com expone sus fuentes en cada perfil → el scraper extrae de esas fuentes (ONU, OFAC, etc.) directamente |

### Comparación con Listas Negras (SAT / OFAC)

| Aspecto | SAT / OFAC | PEP (Lista PEP) |
|---------|-----------|-----------------|
| Fuente | Descarga CSV completo (diario) | API por consulta individual |
| BD local | Tabla completa reemplazada diariamente | Acumulativa (crece con cada búsqueda) |
| Búsqueda | 100% local, sin costo | Online (1 token) o BD interna (gratis) |
| Actualización | Cron reemplaza toda la tabla | Cron verifica/actualiza registros existentes vía scraping |
| Tokens | Sin concepto de tokens | Pool Atinet → cuotas por notaría |
| Facturación | Incluido en plan | `service_usage` registra cada consumo |

---

## 📈 Estado General del Proyecto

| Fase | Descripción | Estado | Progreso |
|------|-------------|--------|----------|
| **FASE 1** | Mejorar Vista React | ✅ Completada | 100% |
| **FASE 2** | Migraciones BD (busquedas + resultados + certificados) | ✅ Completada | 100% |
| **FASE 3** | Servicio API Externa (PrevencionDeLavado.com) | 🔒 Bloqueada | 0% |
| **FASE 4** | Controller — Certificados + Listados PDF Atinet | ✅ Completada | 100% |
| **FASE 5** | Rutas activas (certificados + listados) | ✅ Completada | 100% |
| **FASE 6** | Historial de búsquedas (React + Controller) | ✅ Completada | 100% |
| **FASE 7** | Sistema de Cuotas PEP (`PepQuotaService` + wire) | ✅ Completada | 100% |
| **FASE 8** | BD Interna (listas_pep_personas + scraper) | 🔄 En progreso | 50% |
| **FASE 9** | Testing integral | ✅ Completada | 100% |
| **FASE 10** | Deploy y Producción | ⏳ Pendiente | 0% |

**Progreso Total:** ~80%

> **⚠️ BLOQUEO ACTIVO — FASE 3:** La integración real con PrevencionDeLavado.com está en pausa.
> Solo quedan ~20 de 50 búsquedas disponibles (Plan 50 activo). No se usarán hasta renovar.
> `buscar()` y `PrevencionDeLavadoService` esperan renovación de cuota.
>
> **✅ COMPLETADO HOY (Junio 1, 2026 — tarde):**
> - `History.tsx`: interfaces corregidas (`total_aciertos`→`total_resultados`, `consumo_id` eliminado, `codigo_certificado` + `fecha_consulta` + `estado_busqueda`) ✅
> - `History.tsx`: AJAX eliminado → `router.get()` con `preserveState` (Inertia nativo) ✅
> - `History.tsx`: dropdown de notaría para super-admins (`is_super_admin` + `notarias` props) ✅
> - `History.tsx`: bug Radix `value=""` → sentinel `"all"` corregido ✅
> - `historialPage()`: `notaria_id` filter super-admin, pasa `notarias` + `is_super_admin` ✅
> - `ListaPepBusquedaFactory` creada + `HasFactory` en model ✅
> - `HistorialPageTest.php`: 10 tests pasando (acceso, filtros, scoping por notaría, seguridad) ✅
> - `PlanServicesSeeder`: `LIST_PEP` agregado a los 3 planes ✅
> - `PepQuotaService` creado (`verificarDisponibilidad`, `consumir`, `getPaqueteInfo`) ✅
> - `historialPage()`: prop `paquete` dinámica vía `PepQuotaService::getPaqueteInfo()` ✅
> - `History.tsx`: fallback hardcoded `600 búsquedas` eliminado; estado null manejado ✅
> - `PepQuotaServiceTest.php`: 11 tests pasando (28 total ListasPEP) ✅
> - `CertificadosTest.php`: 13 tests pasando (PDFs + validaciones + auth) ✅
> - `SearchPageTest.php`: 4 tests pasando (acceso, auth, ruta buscar bloqueada) ✅
> - Controller: validación `resultados` corregida (`required` → `present` para arrays vacíos) ✅
> - **Suite completa: 45/45 ListasPEP tests verdes** ✅
>
> **⏭️ SIGUIENTE:** Fase 8 — BD Interna (`pep:verificar-personas` Artisan command) — bloqueada hasta tener búsquedas reales.

---

## 🗂️ Detalle de Fases — Sistema de Cuotas y BD Interna

### FASE 7 — Sistema de Cuotas PEP (✅ Completada)

**Objetivo:** Gestionar tokens de prevenciondelavado.com a dos niveles: Atinet ↔ PLD y Atinet ↔ Notarías.

#### Tablas involucradas

**`pep_paquetes_pld`** ✅ Migración ejecutada
```
id | nombre_plan | total_busquedas | busquedas_demo | busquedas_asignadas
   | periodo_inicio | periodo_fin | activo | notas | timestamps
```
- `busquedas_asignadas` = suma de lo distribuido a notarías
- `reserva_atinet` (implícita) = `total_busquedas - busquedas_asignadas`

**`pep_cuotas_notaria`** ✅ Migración ejecutada
```
id | notaria_id (FK) | paquete_id (FK) | busquedas_asignadas
   | busquedas_consumidas | activo | fecha_asignacion
   | fecha_vencimiento | notas | timestamps
```

**`service_usage`** (existente) — Registra cada búsqueda para facturación
- `service_id` → servicio `LIST_PEP`
- `notaria_id` → notaría que hizo la búsqueda
- `metadata` → puede incluir `busqueda_id`, `paquete_id`

#### Tareas Fase 7

- [x] Actualizar `ServicesSeeder`: `LIST_PEP` → `is_active: true`, `implementation_status: 'implemented'`, `metadata.api_source: 'prevenciondelavado.com'`
- [x] Actualizar `PlanServicesSeeder`: `LIST_PEP` agregado a los 3 planes con `usage_limit` apropiado
- [x] Crear `PepPaquetePld` model con relaciones y `reservaAtinet()`
- [x] Crear `PepCuotaNotaria` model con `disponibles()`, `consumir()`, scope `activa`
- [x] Crear `PepQuotaService` — servicio que centraliza la lógica de verificación/deducción de tokens
- [x] Wire `getPaqueteInfo()` a `historialPage()` — prop `paquete` dinámica
- [x] `History.tsx`: fallback hardcoded eliminado, estado `null` manejado con mensaje
- [x] `PepQuotaServiceTest.php`: 11 tests pasando

---

### FASE 8 — BD Interna PEP (⏳ Pendiente)

**Objetivo:** Construir una BD propia de personas PEP acumulada de búsquedas, que permita búsquedas offline y sea mantenida por un scraper.

#### Tabla nueva: `listas_pep_personas`

Un registro por `codigo_individuo` (deduplicado). Se hace UPSERT desde:
1. Resultados de búsquedas online (API PLD)
2. Actualizaciones del scraper diario

```
id | codigo_individuo (UNIQUE) | denominacion | identificacion | id_tributaria
   | otra_identificacion | relaciones | fecha_nacimiento | tipo | sub_tipo
   | estado | cargo | finalizacion_cargo | lugar_trabajo | direccion
   | lista | pais_lista | supuesto | situacion
   | enlace          ← URL en prevenciondelavado.com (para scraping)
   | hash_registro   ← SHA256 del contenido, detecta cambios
   | primera_busqueda_id (FK listas_pep_busquedas) ← cuándo se encontró primero
   | ultima_busqueda_id (FK listas_pep_busquedas)  ← búsqueda más reciente
   | ultima_verificacion_online    ← última vez que la API PLD lo confirmó
   | ultima_verificacion_scraper   ← última vez que el scraper verificó el enlace
   | timestamps
```

#### Tabla modificada: `listas_pep_busquedas`

Agregar valor `'BD_INTERNA'` al ENUM `estado_busqueda`:
- `PENDIENTE` — búsqueda iniciada, esperando respuesta API
- `PROCESADA` — respuesta de API PLD recibida y guardada
- `BD_INTERNA` — **nuevo** → servida desde `listas_pep_personas` sin consumir token
- `APROBADA` — revisada y aprobada por el notario
- `RECHAZADA` — revisada y rechazada

#### Scraper — Comando Artisan

`php artisan pep:verificar-personas`
- Lee `listas_pep_personas` donde `ultima_verificacion_scraper` es vieja o nula
- Hace HTTP GET al `enlace` de cada persona
- Extrae campos del HTML (prevenciondelavado.com expone las fuentes: ONU, OFAC, etc.)
- Compara `hash_registro` nuevo vs almacenado
- Si cambió → actualiza `listas_pep_personas` + inserta fila en `listas_pep_resultados`
- Envía resumen a soporte@atinet.mx

Configurar en `routes/console.php`:
```php
Schedule::command('pep:verificar-personas')->dailyAt('02:00');
```

#### Tareas pendientes Fase 8

- [x] Migración `create_listas_pep_personas_table`
- [x] Migración `add_bd_interna_to_listas_pep_busquedas_estado_enum`
- [x] Model `ListaPepPersona` con scopes `buscar`, `pendientesVerificacion`, `upsertDesdeApi()`
- [ ] Artisan command `pep:verificar-personas` ← **bloqueado hasta tener búsquedas reales en BD**
- [ ] Registrar schedule en `routes/console.php`
- [ ] Conectar offline search en controller (`buscarEnBdInterna()`)

---

### FASE 6 — Historial de Búsquedas (✅ Completada — 100%)

**Completado:**
- ✅ `ListaPepBusqueda` model con scopes (`deNotaria`, `ultimosDias`, `buscar`) + `HasFactory`
- ✅ `ListaPepBusquedaFactory` con todos los campos requeridos
- ✅ `historialPage()` en `ListasPEPController`: paginación, filtros `q`/`dias`/`notaria_id`
- ✅ Ruta `GET /admin/listas-pep/historial` activa
- ✅ `History.tsx`: interfaces corregidas — `total_resultados`, `codigo_certificado`, `fecha_consulta`, `estado_busqueda`
- ✅ `History.tsx`: AJAX `cargarHistorial()` → `aplicarFiltros()` vía `router.get()` con `preserveState`
- ✅ `History.tsx`: filtros iniciales desde prop `filters` de Inertia
- ✅ `History.tsx`: paginación y refresh usan Inertia (`aplicarFiltros`, `router.reload()`)
- ✅ `History.tsx`: dropdown de notaría para super-admin (visible solo con `is_super_admin`)
- ✅ `History.tsx`: bug Radix `value=""` corregido → sentinel `"all"`
- ✅ Controller pasa `notarias`, `is_super_admin` y `notaria_id` en `filters`
- ✅ Usuario normal no puede ver otra notaría aunque pase `?notaria_id=X`
- ✅ `HistorialPageTest.php`: 10 tests pasando

**Completado en Fase 7+9:**
- [x] Prop `paquete` dinámica desde controller vía `PepQuotaService::getPaqueteInfo()` ✅

---

### 📚 Documentación Generada
- ✅ [PLAN_IMPLEMENTACION_LISTAS_PEP.md](./PLAN_IMPLEMENTACION_LISTAS_PEP.md) - Plan maestro completo
- ✅ [ANALISIS_CAMPOS_BD_LISTAS_PEP.md](./ANALISIS_CAMPOS_BD_LISTAS_PEP.md) - Análisis de campos de BD
- ✅ [DOCUMENTACION_FASE_1_LISTAS_PEP.md](./DOCUMENTACION_FASE_1_LISTAS_PEP.md) - Documentación FASE 1
- ✅ [DOCUMENTACION_FASE_2_LISTAS_PEP.md](./DOCUMENTACION_FASE_2_LISTAS_PEP.md) - Documentación FASE 2 + incidentes

---

## 🗂️ Inventario de Archivos — Estado al 28/Mayo/2026

### 🗄️ Migraciones (todas ejecutadas)
| Migración | Batch | Estado |
|-----------|-------|--------|
| `2026_05_xx_create_listas_pep_busquedas_table` | 2 | ✅ Ejecutada |
| `2026_05_xx_create_listas_pep_resultados_table` | 2 | ✅ Ejecutada |
| `2026_05_28_173320_create_listas_pep_certificados_table` | 4 | ✅ Ejecutada |
| `2026_06_01_093944_create_pep_paquetes_pld_table` | 5 | ✅ Ejecutada |
| `2026_06_01_093945_create_pep_cuotas_notaria_table` | 5 | ✅ Ejecutada |
| `2026_06_01_115311_create_listas_pep_personas_table` | 6 | ✅ Ejecutada |
| `2026_06_01_115313_add_bd_interna_to_listas_pep_busquedas_estado_enum` | 6 | ✅ Ejecutada |

### 🖥️ Backend
| Archivo | Estado | Notas |
|---------|--------|-------|
| `app/Http/Controllers/Admin/ListasPEPController.php` | ✅ Avanzado | `historialPage()` ✅ (filtros q/dias/notaria_id, scoping super-admin) `certificadoSinCoincidencias()` ✅ `certificadoConCoincidencia()` ✅ `descargarListado()` ✅. Pendiente: `buscar()` (bloqueado) |
| `app/Models/ListaPepBusqueda.php` | ✅ Completo | Scopes `deNotaria`, `ultimosDias`, `buscar` + `HasFactory` |
| `app/Models/PepPaquetePld.php` | ✅ Completo | `reservaAtinet()`, scope `activo`, `paqueteActivo()` |
| `app/Models/PepCuotaNotaria.php` | ✅ Completo | `disponibles()`, `consumir()`, scope `activa`, `deNotaria()` |
| `app/Models/ListaPepPersona.php` | ✅ Completo | Scopes `buscar`, `pendientesVerificacion`, `upsertDesdeApi()` |
| `database/factories/ListaPepBusquedaFactory.php` | ✅ Creado | Todos los campos fillable con fake data |
| `app/Services/PrevencionDeLavadoService.php` | ❌ No creado | Requiere renovar quota API |
| `app/Services/PepQuotaService.php` | ✅ Completo | `verificarDisponibilidad()`, `consumir()`, `getPaqueteInfo()` |

### 🛣️ Rutas (`routes/web.php`)
| Ruta | Método | Estado |
|------|--------| ------|
| `POST /admin/listas-pep/certificado/sin-coincidencias` | Controller | ✅ Activa |
| `POST /admin/listas-pep/certificado/con-coincidencia` | Controller | ✅ Activa |
| `GET /admin/listas-pep/listados/{refipre\|ocde\|gafi}` | Controller | ✅ Activa (DomPDF Atinet) |
| `GET /admin/listas-pep/historial` | Controller | ✅ Activa (Inertia + paginación + filtros) |
| `POST /admin/listas-pep/buscar` | Controller | 🔒 Comentada (espera API) |

### 🎨 Frontend React
| Archivo | Estado | Notas |
|---------|--------|-------|
| `resources/js/pages/Admin/ListasPEP/Search.tsx` | 🔄 Parcial | `generarCertificadoSinCoincidencias()` + `generarCertificadoConCoincidencias()` ✅. `handleBuscar()` conectado a endpoint aún comentado |
| `resources/js/pages/Admin/ListasPEP/History.tsx` | ✅ Completo | Filtros `q`/`dias`/`notaria_id`, Inertia nativo, scoping super-admin, bug Radix corregido |

### 🧪 Tests
| Archivo | Estado | Tests |
|---------|--------|-------|
| `tests/Feature/ListasPEP/QuotaTest.php` | ✅ Pasando | 7 tests (PepPaquetePld + PepCuotaNotaria) |
| `tests/Feature/ListasPEP/HistorialPageTest.php` | ✅ Pasando | 10 tests (acceso, auth, filtros, scoping notaría, seguridad) |
| `tests/Feature/ListasPEP/PepQuotaServiceTest.php` | ✅ Pasando | 11 tests (getPaqueteInfo, verificarDisponibilidad, consumir) |
| `tests/Feature/ListasPEP/CertificadosTest.php` | ✅ Pasando | 13 tests (listados PDF, certificados PDF, auth, validación) |
| `tests/Feature/ListasPEP/SearchPageTest.php` | ✅ Pasando | 4 tests (acceso super-admin/notaría, auth, ruta buscar bloqueada) |
| `database/factories/ListaPepBusquedaFactory.php` | ✅ Creado | Fake data para todos los campos fillable |

### 📄 Plantillas PDF (Blade)
| Archivo | Estado |
|---------|--------|
| `resources/views/pdf/listas-pep/certificado-sin-coincidencias.blade.php` | ✅ Completa |
| `resources/views/pdf/listas-pep/certificado-con-coincidencia.blade.php` | ✅ Completa |
| `resources/views/pdf/listas-pep/listado-refipre.blade.php` | ✅ Completa (92 territorios, 2 cols, DOF 01/04/2024) |
| `resources/views/pdf/listas-pep/listado-ocde.blade.php` | ✅ Completa (173 miembros Foro Global + 38 paraísos no coop.) |
| `resources/views/pdf/listas-pep/listado-gafi.blade.php` | ✅ Completa (3 subsecciones, 25 jurisdicciones, Feb 2026) |

### 📦 Archivos Estáticos (fallback)
| Archivo | Estado |
|---------|--------|
| `storage/app/listas-pep/REFIPRE.pdf` | ✅ Fallback (165 KB, no se usa — Blade activo) |
| `storage/app/listas-pep/OCDE.pdf` | ✅ Fallback (339 KB, no se usa — Blade activo) |
| `storage/app/listas-pep/GAFI.pdf` | ✅ Fallback (235 KB, no se usa — Blade activo) |

---

## 📊 Análisis Comparativo: Vista Vue (Legacy) vs Vista React (Actual)

### ✅ Vista Vue (Legacy) - Características

**Formulario:**
- ✓ Campos: Apellido, Nombre, Identificación
- ✓ Checkboxes visibles:
  - `pepsOtrosPaises` (PEPs en otros países)
  - `satXDenominacion` (SAT por denominación)
  - `documentosSimilares` (Documentos similares)
  - `forzarApellidos` (Forzar apellidos)
  - `generarCertificados` (Generar certificados)
- ✓ Botón limpiar formulario
- ✓ Validación básica

**Visualización de Resultados:**
- ✓ Cards individuales por cada resultado
- ✓ Muestra **TODOS** los campos de la API:
  - `denominacion` - Nombre completo
  - `identificacion` - CURP u otra ID
  - `idTributaria` - RFC
  - `fechaNacimiento` - Formato DD/MM/YYYY
  - `tipo` - PEP / EX PEP
  - `estado` - ACTIVO / INACTIVO
  - `cargo` - Puesto desempeñado
  - `finalizacionCargo` - Cuándo terminó
  - `lugarTrabajo` - Entidad/Dependencia
  - `direccion` - Dirección completa
  - `lista` - Nombre de la lista
  - `paisLista` - País de origen
  - `exactitudDenominacion` - ALTO/MEDIO/BAJO (5 sobre 5)
  - `exactitudIdentificacion` - COINCIDE / N/D
  - `enlace` - URL externa para más info
  - `codigoIndividuo` - ID único
- ✓ Código de certificado de búsqueda (UUID)
- ✓ Fecha y hora de consulta
- ✓ Badges de colores por tipo
- ✓ Formateo visual de exactitud
- ✓ Enlace externo a prevenciondelavado.com

**Conexión:**
- Endpoint: `http://127.0.0.1:8000/api/busquedaPrevencion`
- Método: POST
- Sin autenticación Laravel (público)
- Sin guardar en BD

---

### 🆕 Vista React (Actual) - Características

**Formulario:**
- ✓ Campos: Apellido/Denominación, Nombres, Identificación
- ✓ Validación mejorada
- ✓ Mensajes de alerta
- ❌ **FALTA:** Checkboxes de opciones de búsqueda (no se muestran)

**Visualización de Resultados:**
- ✓ Tabla compacta con paginación
- ✓ Filtros por tipo de PEP y fuente
- ✓ Selección múltiple con checkboxes
- ✓ Barras visuales de exactitud (5 barras)
- ✓ Badges por tipo y fuente
- ✓ Contador de resultados
- ❌ **FALTA:** Vista detallada de cada resultado
- ❌ **FALTA:** Mostrar todos los campos (cargo, lugar de trabajo, dirección, etc.)
- ❌ **FALTA:** Enlace externo por resultado
- ❌ **FALTA:** Información de certificado de búsqueda

**Funcionalidades Adicionales (React):**
- ✓ Contador de paquete contratado (600 búsquedas)
- ✓ Barra de progreso de consumo
- ✓ Alertas por pocas búsquedas disponibles
- ✓ Generación de certificados:
  - Con coincidencias (PDF)
  - Sin coincidencias (PDF)
- ✓ Descarga de listados complementarios:
  - REFIPRE (Regímenes Fiscales Preferentes)
  - OCDE (Paraísos Fiscales)
  - GAFI (Territorios informados)
- ✓ Botón de historial
- ✓ Breadcrumbs de navegación

**Conexión:**
- Endpoint: `/admin/listas-pep/buscar`
- Método: POST con CSRF token
- Con autenticación Laravel
- TODO: Guardar en BD

---

## 🔧 Mejoras Necesarias en la Vista React

### 1. **CRÍTICO: Agregar Checkboxes de Opciones de Búsqueda**

El formulario React NO muestra las opciones que la API requiere. Debemos agregar:

```tsx
// En el formulario, después del campo de identificación:
<div className="space-y-2">
  <Label className="text-sm font-medium">Opciones de búsqueda</Label>
  <div className="grid grid-cols-2 gap-3">
    <div className="flex items-center space-x-2">
      <Checkbox
        id="pepsOtrosPaises"
        checked={opciones.pepsOtrosPaises}
        onCheckedChange={(checked) => 
          setOpciones({...opciones, pepsOtrosPaises: checked})
        }
      />
      <label htmlFor="pepsOtrosPaises" className="text-sm">
        PEPs en otros países
      </label>
    </div>
    
    <div className="flex items-center space-x-2">
      <Checkbox
        id="satXDenominacion"
        checked={opciones.satXDenominacion}
        onCheckedChange={(checked) => 
          setOpciones({...opciones, satXDenominacion: checked})
        }
      />
      <label htmlFor="satXDenominacion" className="text-sm">
        SAT por denominación
      </label>
    </div>
    
    <div className="flex items-center space-x-2">
      <Checkbox
        id="documentosSimilares"
        checked={opciones.documentosSimilares}
        onCheckedChange={(checked) => 
          setOpciones({...opciones, documentosSimilares: checked})
        }
      />
      <label htmlFor="documentosSimilares" className="text-sm">
        Documentos similares
      </label>
    </div>
    
    <div className="flex items-center space-x-2">
      <Checkbox
        id="generarCertificados"
        checked={opciones.generarCertificados}
        onCheckedChange={(checked) => 
          setOpciones({...opciones, generarCertificados: checked})
        }
      />
      <label htmlFor="generarCertificados" className="text-sm">
        Generar certificados
      </label>
    </div>
  </div>
</div>
```

**Estado adicional:**
```tsx
const [opciones, setOpciones] = useState({
  pepsOtrosPaises: true,
  satXDenominacion: true,
  documentosSimilares: true,
  forzarApellidos: false,
  generarCertificados: true
});
```

---

### 2. **CRÍTICO: Ajustar Tipos de Datos (TypeScript)**

La API externa devuelve campos diferentes a los que React espera:

**Tipos actuales en React:**
```typescript
interface PEPResultado {
    id: string;
    apellido_denominacion: string;
    nombres: string;
    identificacion?: string;
    exactitud: number; // 0–100
    tipo: TipoPEP;
    fuente: OrigenFuente;
}
```

**Tipos que LA API REALMENTE devuelve:**
```typescript
interface PEPResultadoAPI {
    codigoIndividuo: number;
    denominacion: string;          // Nombre completo
    identificacion: string | null;  // CURP
    idTributaria: string | null;    // RFC
    otraIdentificacion: string | null;
    fechaNacimiento: string | null; // YYYYMMDD
    tipo: string;                   // "PEP" | "EX PEP" | etc.
    subTipo: string;
    estado: string;                 // "ACTIVO" | "INACTIVO"
    cargo: string;
    finalizacionCargo: string | null;
    lugarTrabajo: string;
    direccion: string;
    lista: string;
    paisLista: string;
    supuesto: string | null;
    situacion: string | null;
    exactitudDenominacion: string;  // "ALTO (5 sobre 5)"
    exactitudIdentificacion: string; // "COINCIDE" | "N/D"
    enlace: string | null;
}

interface BusquedaResponseAPI {
    codigoCertificadoBusqueda: string; // UUID
    fechaConsulta: string;             // ISO DateTime
    resultados: PEPResultadoAPI[];
}
```

**Mapeo necesario:**
```typescript
function mapearResultadoAPI(resultado: PEPResultadoAPI): PEPResultado {
    // Separar denominacion en apellido y nombres
    const partes = resultado.denominacion.split(' ');
    const apellido = partes.slice(0, 2).join(' '); // Primeros 2 = apellidos
    const nombres = partes.slice(2).join(' ');      // Resto = nombres
    
    // Convertir exactitud "ALTO (5 sobre 5)" -> 100, "MEDIO (4 sobre 5)" -> 80, etc.
    let exactitud = 0;
    if (resultado.exactitudDenominacion?.includes('5 sobre 5')) exactitud = 100;
    else if (resultado.exactitudDenominacion?.includes('4 sobre 5')) exactitud = 80;
    else if (resultado.exactitudDenominacion?.includes('3 sobre 5')) exactitud = 60;
    
    return {
        id: resultado.codigoIndividuo.toString(),
        apellido_denominacion: apellido,
        nombres: nombres,
        identificacion: resultado.identificacion || resultado.idTributaria,
        exactitud: exactitud,
        tipo: resultado.tipo as TipoPEP,
        fuente: 'MEX', // Determinar según paisLista
        // Campos adicionales para vista detallada
        cargo: resultado.cargo,
        lugarTrabajo: resultado.lugarTrabajo,
        direccion: resultado.direccion,
        fechaNacimiento: resultado.fechaNacimiento,
        estado: resultado.estado,
        enlace: resultado.enlace,
        // ... resto de campos
    };
}
```

---

### 3. **CRÍTICO: Agregar Vista Detallada de Resultados**

Crear un componente `DetalleResultado` o modal expandible:

```tsx
<Dialog>
  <DialogTrigger asChild>
    <Button variant="ghost" size="sm">
      Ver detalles
    </Button>
  </DialogTrigger>
  <DialogContent className="max-w-3xl">
    <DialogHeader>
      <DialogTitle>{resultado.denominacion}</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-4">
      {/* Información Personal */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-muted-foreground">Identificación:</span>
            <p className="font-medium">{resultado.identificacion || 'N/D'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">RFC:</span>
            <p className="font-medium">{resultado.idTributaria || 'N/D'}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Fecha de Nacimiento:</span>
            <p className="font-medium">{formatoFecha(resultado.fechaNacimiento)}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Estado:</span>
            <Badge className={getEstadoBadgeClass(resultado.estado)}>
              {resultado.estado}
            </Badge>
          </div>
        </CardContent>
      </Card>
      
      {/* Cargo y Función */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cargo y Función Pública</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Cargo:</span>
            <p className="font-medium">{resultado.cargo}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Lugar de Trabajo:</span>
            <p className="text-sm text-muted-foreground">{resultado.lugarTrabajo}</p>
          </div>
          {resultado.finalizacionCargo && (
            <div>
              <span className="text-muted-foreground">Finalización:</span>
              <p className="text-sm">{resultado.finalizacionCargo}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Ubicación */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Ubicación</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{resultado.direccion}</p>
        </CardContent>
      </Card>
      
      {/* Lista y Exactitud */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Clasificación y Exactitud</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Lista:</span>
            <p>{resultado.lista}</p>
          </div>
          <div>
            <span className="text-muted-foreground">País:</span>
            <p>{resultado.paisLista}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Exactitud Denominación:</span>
            <span className={getExactitudClass(resultado.exactitudDenominacion)}>
              {resultado.exactitudDenominacion}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Exactitud Identificación:</span>
            <span className={getIdentificacionClass(resultado.exactitudIdentificacion)}>
              {resultado.exactitudIdentificacion}
            </span>
          </div>
        </CardContent>
      </Card>
      
      {/* Enlace externo */}
      {resultado.enlace && (
        <Button asChild className="w-full">
          <a href={resultado.enlace} target="_blank" rel="noopener noreferrer">
            Ver información completa en PrevencionDeLavado.com
          </a>
        </Button>
      )}
    </div>
  </DialogContent>
</Dialog>
```

---

### 4. **Mostrar Información de Certificado**

Agregar tarjeta arriba de los resultados:

```tsx
{ultimaBusqueda && (
  <Card className="mb-4">
    <CardContent className="flex items-center justify-between py-3">
      <div>
        <p className="text-sm text-muted-foreground">
          Código de Certificado de Búsqueda
        </p>
        <code className="text-sm font-mono">
          {resultadosBusqueda?.codigoCertificadoBusqueda}
        </code>
      </div>
      <div className="text-right">
        <p className="text-sm text-muted-foreground">Fecha de Consulta</p>
        <p className="text-sm font-medium">
          {new Date(resultadosBusqueda?.fechaConsulta).toLocaleString('es-MX')}
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

---

## 📝 Plan de Implementación Completo

### **FASE 1: Mejorar Vista React** ⚙️

**Prioridad:** ALTA  
**Tiempo estimado:** 2-3 horas

#### Tareas:
1. ✅ Agregar checkboxes de opciones al formulario
2. ✅ Actualizar tipos TypeScript para coincidir con API real
3. ✅ Crear función de mapeo de resultados API → React
4. ✅ Agregar componente de vista detallada (modal o expandible)
5. ✅ Mostrar código de certificado y fecha de consulta
6. ✅ Agregar formateo de fecha (YYYYMMDD → DD/MM/YYYY)
7. ✅ Probar vista con datos de ejemplo

---

### **FASE 2: Backend - Migración y Modelo** 💾

**Prioridad:** ALTA  
**Tiempo estimado:** 1 hora  
**Estado:** ✅ **COMPLETADA** (28/Mayo/2026)  
**Documentación:** Ver [DOCUMENTACION_FASE_2_LISTAS_PEP.md](./DOCUMENTACION_FASE_2_LISTAS_PEP.md)

#### Tareas:
1. ✅ Crear migración `create_listas_pep_busquedas_table` (Batch 2)
2. ✅ Crear migración `create_listas_pep_resultados_table` (Batch 2)
3. ✅ Crear migración `create_listas_pep_certificados_table` (Batch 4, 28/Mayo/2026)
   - `busqueda_id` FK → listas_pep_busquedas CASCADE
   - `resultado_id` FK nullable → listas_pep_resultados SET NULL
   - `tipo` ENUM: `SIN_COINCIDENCIAS` / `CON_COINCIDENCIA`
   - `archivo_pdf`, `hash_pdf`, `uuid_certificado` (unique), `observaciones`
   - `emitido_por` FK nullable → users SET NULL
4. ✅ Implementar medidas de seguridad en migraciones (verificación hasTable, FKs condicionales)

#### Incidentes Resueltos:
⚠️ **Error FK con expediente_id:** Solucionado removiendo FK constraint (incompatibilidad signed/unsigned)  
🔴 **Incidente db:wipe:** Se eliminó toda la BD por error. Implementadas medidas de seguridad para prevenir en producción.

**📘 Documentación completa:** [DOCUMENTACION_FASE_2_LISTAS_PEP.md](./DOCUMENTACION_FASE_2_LISTAS_PEP.md)
- Estructura detallada de 2 tablas (15 + 29 campos)
- Ejemplos de registros JSON
- Queries SQL útiles
- Checklist de seguridad para producción
- Lecciones aprendidas del incidente

---

### **FASE 3: Backend - Servicio de API Externa** 🌐

**Prioridad:** ALTA  
**Estado:** 🔒 **BLOQUEADA** — Solo 23/600 búsquedas disponibles. No implementar hasta renovar plan.  
**Tiempo estimado:** 2 horas

#### Tareas:
1. ❌ Crear `app/Services/PrevencionDeLavadoService.php`
   - Método `login()` con caché de token (55 minutos)
   - Método `buscarEnListas(array $parametros)`
   - Manejo de errores y reintentos
   - Logging de requests

2. ✅ Credenciales en `.env`
   ```
   PREVENCION_LAVADO_USER=acostacl
   PREVENCION_LAVADO_PASS=26F1D723
   PREVENCION_LAVADO_URL=https://mbalistas.prevenciondelavado.com
   ```

**Código:**
```php
// app/Services/PrevencionDeLavadoService.php
namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PrevencionDeLavadoService
{
    private string $baseUrl;
    private string $usuario;
    private string $clave;
    
    public function __construct()
    {
        $this->baseUrl = config('services.prevencion_lavado.url');
        $this->usuario = config('services.prevencion_lavado.user');
        $this->clave = config('services.prevencion_lavado.password');
    }
    
    /**
     * Obtener token JWT (cacheado 55 minutos)
     */
    private function getToken(): ?string
    {
        return Cache::remember('pld_token', 3300, function () {
            try {
                $response = Http::withOptions([
                    'verify' => app()->environment('production'),
                ])->post($this->baseUrl . '/Login', [
                    'usuario' => $this->usuario,
                    'clave' => $this->clave,
                ]);
                
                if ($response->successful()) {
                    return $response->json('token');
                }
                
                Log::error('PrevencionDeLavado Login failed', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                ]);
                
                return null;
            } catch (\Exception $e) {
                Log::error('PrevencionDeLavado Login exception', [
                    'message' => $e->getMessage(),
                ]);
                return null;
            }
        });
    }
    
    /**
     * Buscar en listas PEP
     */
    public function buscarEnListas(array $parametros): array
    {
        $token = $this->getToken();
        
        if (!$token) {
            return [
                'success' => false,
                'message' => 'No se pudo autenticar con el servicio externo',
            ];
        }
        
        try {
            // Convertir booleanos a "S"/"N"
            $data = [
                'apellido' => $parametros['apellido_denominacion'] ?? '',
                'nombre' => $parametros['nombres'] ?? '',
                'identificacion' => $parametros['identificacion'] ?? '',
                'pepsOtrosPaises' => ($parametros['pepsOtrosPaises'] ?? false) ? 'S' : 'N',
                'satXDenominacion' => ($parametros['satXDenominacion'] ?? false) ? 'S' : 'N',
                'documentosSimilares' => ($parametros['documentosSimilares'] ?? false) ? 'S' : 'N',
                'forzarApellidos' => ($parametros['forzarApellidos'] ?? false) ? 'S' : 'N',
                'generarCertificados' => ($parametros['generarCertificados'] ?? true) ? 'S' : 'N',
            ];
            
            $response = Http::withOptions([
                'verify' => app()->environment('production'),
            ])
                ->withHeaders([
                    'Authorization' => "Bearer {$token}",
                    'Content-Type' => 'application/json',
                ])
                ->timeout(30)
                ->post($this->baseUrl . '/listas', $data);
            
            if ($response->successful()) {
                $result = $response->json();
                
                return [
                    'success' => true,
                    'data' => [
                        'codigo_certificado' => $result['codigoCertificadoBusqueda'] ?? null,
                        'fecha_consulta' => $result['fechaConsulta'] ?? now()->toISOString(),
                        'total_aciertos' => count($result['resultados'] ?? []),
                        'resultados' => $result['resultados'] ?? [],
                    ],
                ];
            }
            
            Log::warning('PrevencionDeLavado Busqueda failed', [
                'status' => $response->status(),
                'response' => $response->json(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Error al consultar el servicio externo',
            ];
            
        } catch (\Exception $e) {
            Log::error('PrevencionDeLavado Busqueda exception', [
                'message' => $e->getMessage(),
            ]);
            
            return [
                'success' => false,
                'message' => 'Error de conexión con el servicio externo',
            ];
        }
    }
}
```

---

### **FASE 4: Backend - Controlador** 🎮

**Prioridad:** ALTA  
**Estado:** ✅ **COMPLETA** (Junio 1, 2026) — Certificados + listados con DomPDF Atinet.

#### Tareas:
1. ✅ Crear `app/Http/Controllers/Admin/ListasPEPController.php`
2. ✅ Método `certificadoSinCoincidencias()` — genera y descarga PDF "Sin Coincidencias"
3. ✅ Método `certificadoConCoincidencia()` — genera y descarga PDF "Con Coincidencia"
4. 🔒 Método `buscar()` — bloqueado por FASE 3 (quota API)
5. ⏳ Método `historial()` — **SIGUIENTE** (FASE 6)
6. ✅ Método `descargarListado($tipo)` — DomPDF Atinet para REFIPRE/OCDE/GAFI (con fallback estático)

**Código:**
```php
// app/Http/Controllers/Admin/ListasPEPController.php
namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\ListaPEPBusqueda;
use App\Services\PrevencionDeLavadoService;
use Illuminate\Http\Request;

class ListasPEPController extends Controller
{
    public function __construct(
        private PrevencionDeLavadoService $pldService
    ) {}
    
    /**
     * Realizar búsqueda en listas PEP
     */
    public function buscar(Request $request)
    {
        $validated = $request->validate([
            'apellido_denominacion' => 'required|string|max:255',
            'nombres' => 'nullable|string|max:255',
            'identificacion' => 'nullable|string|max:50',
            'pepsOtrosPaises' => 'boolean',
            'satXDenominacion' => 'boolean',
            'documentosSimilares' => 'boolean',
            'forzarApellidos' => 'boolean',
            'generarCertificados' => 'boolean',
        ]);
        
        // Realizar búsqueda en API externa
        $resultado = $this->pldService->buscarEnListas($validated);
        
        if (!$resultado['success']) {
            return response()->json($resultado, 500);
        }
        
        // Guardar en base de datos
        $busqueda = ListaPEPBusqueda::create([
            'user_id' => auth()->id(),
            'notaria_id' => auth()->user()->notaria_id,
            'apellido_denominacion' => $validated['apellido_denominacion'],
            'nombres' => $validated['nombres'] ?? null,
            'identificacion' => $validated['identificacion'] ?? null,
            'opciones' => [
                'pepsOtrosPaises' => $validated['pepsOtrosPaises'] ?? false,
                'satXDenominacion' => $validated['satXDenominacion'] ?? false,
                'documentosSimilares' => $validated['documentosSimilares'] ?? false,
                'forzarApellidos' => $validated['forzarApellidos'] ?? false,
                'generarCertificados' => $validated['generarCertificados'] ?? true,
            ],
            'total_aciertos' => $resultado['data']['total_aciertos'],
            'codigo_certificado' => $resultado['data']['codigo_certificado'],
            'raw_response' => $resultado['data'],
        ]);
        
        return response()->json([
            'success' => true,
            'data' => $resultado['data'],
            'busqueda_id' => $busqueda->id,
        ]);
    }
    
    /**
     * Historial de búsquedas
     */
    public function historial(Request $request)
    {
        $query = ListaPEPBusqueda::with(['user', 'notaria'])
            ->where('user_id', auth()->id());
        
        // Filtros
        if ($request->filled('termino')) {
            $termino = $request->termino;
            $query->where(function($q) use ($termino) {
                $q->where('apellido_denominacion', 'like', "%{$termino}%")
                  ->orWhere('nombres', 'like', "%{$termino}%")
                  ->orWhere('identificacion', 'like', "%{$termino}%");
            });
        }
        
        if ($request->filled('dias')) {
            $dias = (int) $request->dias;
            $query->where('created_at', '>=', now()->subDays($dias));
        }
        
        $historial = $query->latest()
            ->paginate(20)
            ->withQueryString();
        
        return response()->json($historial);
    }
    
    // TODO: Implementar generación de PDFs
    // public function certificadoConCoincidencias(Request $request) {}
    // public function certificadoSinCoincidencias(Request $request) {}
    // public function descargarListado(string $tipo) {}
}
```

---

### **FASE 5: Rutas y Middleware** 🛣️

**Prioridad:** ALTA  
**Estado:** ✅ **COMPLETA** (Junio 1, 2026) — Rutas de certificados y listados activas.

#### Tareas:
1. ✅ Rutas de certificados activas:
   - `POST /admin/listas-pep/certificado/sin-coincidencias`
   - `POST /admin/listas-pep/certificado/con-coincidencia`
2. ✅ `GET /admin/listas-pep/listados/{refipre|ocde|gafi}` — activa con DomPDF
3. 🔒 Descomentar `buscar` (requiere FASE 3 — quota API)
4. ⏳ Activar `historial/data` — **SIGUIENTE** (FASE 6)

**Código:**
```php
// routes/web.php (líneas 377-382, descomentar)
Route::prefix('listas-pep')->name('listas-pep.')->middleware(['auth', 'verified'])->group(function () {
    Route::post('buscar', [\App\Http\Controllers\Admin\ListasPEPController::class, 'buscar'])->name('buscar');
    Route::get('historial/data', [\App\Http\Controllers\Admin\ListasPEPController::class, 'historial'])->name('historial.data');
    Route::post('certificado/con-coincidencias', [\App\Http\Controllers\Admin\ListasPEPController::class, 'certificadoConCoincidencias'])->name('certificado.con-coincidencias');
    Route::post('certificado/sin-coincidencias', [\App\Http\Controllers\Admin\ListasPEPController::class, 'certificadoSinCoincidencias'])->name('certificado.sin-coincidencias');
    Route::get('listados/{tipo}', [\App\Http\Controllers\Admin\ListasPEPController::class, 'descargarListado'])->name('listados');
});
```

---

### ~~FASE 6: Historial de Búsquedas~~ ✅

**Prioridad:** ALTA  
**Estado:** ✅ **COMPLETADA** (Junio 1, 2026) — Ver detalle completo en sección "FASE 6 — Historial de Búsquedas" arriba.

---

### **FASE 9 (renombrada): Testing** 🧪

**Prioridad:** MEDIA  
**Estado:** ✅ **COMPLETADA** — 45 tests pasando en ListasPEP

#### Completado:
- ✅ `QuotaTest.php`: 7 tests (PepPaquetePld + PepCuotaNotaria)
- ✅ `HistorialPageTest.php`: 10 tests (acceso, filtros, scoping notaría, seguridad)
- ✅ `PepQuotaServiceTest.php`: 11 tests (getPaqueteInfo, verificarDisponibilidad, consumir)
- ✅ `CertificadosTest.php`: 13 tests (listados PDF ×3, auth ×2, sin-coincidencias ×4, con-coincidencia ×4)
- ✅ `SearchPageTest.php`: 4 tests (acceso super-admin, acceso notaría, auth, ruta buscar bloqueada=404)
- ✅ Corrección controller: `'resultados' => ['present', 'array']` (arrays vacíos válidos)

#### Pendiente (bloqueado por Fase 3):
- ⏳ Test Feature: ruta `buscar` funciona correctamente (cuando API se reactive)

---

### ~~FASE 7 (completada, renombrada): Generación de PDFs~~ ✅

**Completada:** Junio 1, 2026
- ✅ `barryvdh/laravel-dompdf` v3.1.1 instalado
- ✅ Plantillas Blade con marca Atinet: certificado-sin-coincidencias, certificado-con-coincidencia
- ✅ Listados Atinet: listado-refipre (92 territorios), listado-ocde (173+38), listado-gafi (25 jurisdicciones)
- ✅ `descargarListado()` con DomPDF + fallback a archivos estáticos

---

## 📊 Resumen de Prioridades

> ⚠️ **Tabla del plan original — desactualizada.** Ver tabla actual en **"📈 Estado General del Proyecto"** al inicio del documento.

| Fase | Descripción | Estado actual |
|------|-------------|---------------|
| 1 | Mejorar Vista React | ✅ Completada |
| 2 | Migración y Modelo | ✅ Completada |
| 3 | Servicio API Externa | 🔒 Bloqueada (quota) |
| 4 | Controlador (PDFs + Historial) | ✅ Completada |
| 5 | Rutas y Middleware | ✅ Completada |
| 6 | Historial de Búsquedas | ✅ Completada |
| 7 | Sistema de Cuotas PEP | ✅ Completada |
| 8 | BD Interna (listas_pep_personas) | 🔄 En progreso (50%) |
| 9 | Testing integral | ✅ Completada |
| 10 | Deploy y Producción | ⏳ Pendiente |

---

## 🚀 Orden de Ejecución (actualizado Junio 1, 2026)

1. ✅ ~~FASE 1 — Mejorar Vista React~~
2. ✅ ~~FASE 2 — Migraciones BD~~
3. 🔒 FASE 3 — API Externa (bloqueada — renovar quota PLD)
4. ✅ ~~FASE 4 — Controller (PDFs + Historial)~~
5. ✅ ~~FASE 5 — Rutas~~
6. ✅ ~~FASE 6 — Historial + Tests~~
7. ✅ ~~FASE 7 — Cuotas PEP (PepQuotaService + PlanServicesSeeder + wire prop)~~
8. 🔄 FASE 8 — BD Interna (parcial — bloqueada hasta tener búsquedas reales)
9. ✅ ~~FASE 9 — Testing integral (45 tests pasando)~~
10. ⏳ FASE 10 — Deploy y Producción

---

## ✅ Checklist de Implementación (actualizado Junio 1, 2026)

### Vista React
- ✅ `Search.tsx`: checkboxes de opciones, tipos TS, certificados PDF
- ✅ `History.tsx`: Inertia nativo, filtros `q`/`dias`/`notaria_id`, scoping super-admin
- ⏳ `Search.tsx`: conectar `handleBuscar()` al endpoint (espera FASE 3)
- ⏳ `Search.tsx`: prop `paquete` dinámica (espera Fase 7)

### Backend
- ✅ Migraciones: 7 tablas ejecutadas (busquedas, resultados, certificados, paquetes_pld, cuotas_notaria, personas, ENUM update)
- ✅ Modelos: `ListaPepBusqueda`, `PepPaquetePld`, `PepCuotaNotaria`, `ListaPepPersona`
- ✅ Controller: `historialPage()`, `certificadoSinCoincidencias()`, `certificadoConCoincidencia()`, `descargarListado()`
- ✅ Rutas activas: certificados, listados PDF, historial
- ✅ `ServicesSeeder`: `LIST_PEP` activo
- 🔒 `PrevencionDeLavadoService` (espera renovación quota)
- ⏳ `PlanServicesSeeder`: agregar `LIST_PEP` a planes con `usage_limit`
- ⏳ `PepQuotaService`: centralizar verificación/deducción de tokens

### Testing
- ✅ `QuotaTest.php`: 7 tests (PepPaquetePld + PepCuotaNotaria)
- ✅ `HistorialPageTest.php`: 10 tests (acceso, filtros, scoping, seguridad)
- ⏳ Tests para PDFs (certificados + listados)
- ⏳ Tests para `buscar()` (cuando se reactive)

---

## 📌 Notas Importantes

1. **Credenciales de API:**  
   - ✅ En `.env`: `PREVENCION_LAVADO_USER`, `PREVENCION_LAVADO_PASS`, `PREVENCION_LAVADO_URL`
   - No exponer en código fuente

2. **Caché de Token:**  
   - Duración: 55 minutos (token dura 1 hora, se renueva 5 min antes)
   - Clave: `pld_token`

3. **Paquete Contratado:**  
   - Plan 50 activo: 50 búsquedas totales (~20 disponibles al 1/Jun/2026)
   - Contador real en BD: tablas `pep_paquetes_pld` + `pep_cuotas_notaria` ✅ implementadas

4. **Campos Críticos:**  
   - `apellido` es REQUERIDO por la API
   - `nombre` es REQUERIDO por la API
   - `identificacion` es opcional pero RECOMENDADO

5. **Tipos de PEP:**  
   - PEP: Persona activa
   - EX PEP: Persona inactiva
   - AFIN PEP: Familiar de PEP activo
   - AFIN EX PEP: Familiar de ex-PEP

---

## 🎯 Resultado Final Esperado

Al completar todas las fases ALTA:

✅ Usuario puede buscar personas en listas PEP  
✅ Resultados se muestran con todos los detalles  
✅ Búsquedas se guardan en BD con historial  
✅ Contador de paquete funciona correctamente  
✅ Vista detallada de cada resultado  
✅ Filtros por tipo y fuente  
✅ Sistema completamente funcional  

---

**Última actualización:** Junio 1, 2026 (tarde)  
**Autor:** Sistema de Análisis Técnico
