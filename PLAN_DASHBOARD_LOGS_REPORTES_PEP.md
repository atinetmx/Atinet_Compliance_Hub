# 📊 Plan — Dashboard, Logs y Reportes: Módulo Listas PEP

**Creado:** Junio 2, 2026  
**Módulo:** Listas PEP / PrevencionDeLavado.com  
**Contexto:** Hallazgos de auditoría Swagger + campos nuevos en BD + endpoint `GET /Listas/Consumos`

---

## 🗺️ ¿Por qué este documento?

La auditoría del Swagger de `mbalistas.prevenciondelavado.com` (Junio 2, 2026) reveló tres capacidades nuevas que podemos aprovechar inmediatamente:

1. **`GET /Listas/Consumos`** — datos del plan contratado en tiempo real (`consultasDisponibles`, `consultasContratadas`, `tipoPlan`, `periodo`)
2. **Campos enriquecidos de personas** — `fecha_baja`, `lista_id`, `pais_lista_id3`, `fuente_desc_larga` (ya migrados a BD)
3. **Estado real del plan** — sabemos que estamos en **Plan Demostración** (50 búsquedas, vence 31/12/2026)

Estos datos habilitan mejoras concretas en dashboard, logs y reportes. Este documento los planifica en detalle.

---

## 1. 🖥️ Dashboard

### 1.1 Widget: Estado del Plan PLD  
*Fuente de datos: `GET /Listas/Consumos` → `PrevencionDeLavadoService::getConsumos()`*

**Ubicación:** Dashboard de super-admin (ATINET MASTER). Solo visible con rol `super_admin`.

**Datos a mostrar:**

| Dato | Campo API | Uso en UI |
|---|---|---|
| Consultas disponibles | `consultasDisponibles` | Barra de progreso (disponibles / contratadas) |
| Consultas contratadas | `consultasContratadas` | Denominador de la barra |
| Tipo de plan | `tipoPlan` | Badge: 🟡 Demostración / 🟢 Producción |
| Período activo | `periodo` | Texto con días restantes hasta vencimiento |
| Alerta de exceso | `importante` | Banner naranja si hay mensaje |

**Comportamiento:**
- Cache de 15 minutos (no llamar PLD en cada render del dashboard).
- Si `tipoPlan === "Demostración"` → mostrar aviso prominente "Contacta a PLD para activar plan de producción".
- Si `consultasDisponibles / consultasContratadas < 0.20` (< 20%) → badge rojo "Cuota baja".
- Si `consultasDisponibles === 0` → badge crítico "Sin búsquedas disponibles — las notarías operan en modo BD interna".
- Si el endpoint falla → mostrar último valor conocido (de cache) con nota "datos en caché".

**Componente sugerido:** `resources/js/components/Admin/PldPlanWidget.tsx`

```
┌─────────────────────────────────────────────┐
│ 🔍 Plan PLD — PrevencionDeLavado.com        │
│                                             │
│  Tipo:     [🟡 Demostración]                │
│  Período:  31/12/2025 – 31/12/2026          │
│            212 días restantes               │
│                                             │
│  Consultas disponibles:                     │
│  ████████████░░░░░░░  20 / 50              │
│                   40% consumidas            │
│                                             │
│  [Ver historial de consumo]                 │
└─────────────────────────────────────────────┘
```

---

### 1.2 Widget: Distribución de Coincidencias por País  
*Fuente de datos: `listas_pep_resultados.pais_lista_id3` (nuevo campo)*

**Ubicación:** Dashboard → sección Listas PEP.

Una vez que `pais_lista_id3` esté poblado (requiere migrar al endpoint `/Listas/ListasApi/Listas`), mostrar un desglose de los top 5 países de las coincidencias encontradas:

```
🇲🇽 México    ████████████  42 coincidencias
🇺🇸 EE.UU.   ████████       28
🇨🇴 Colombia  ████           14
🌍 Otros      ███             9
```

**Mientras no tengamos `UA`:** Widget oculto o con placeholder "Disponible en plan de producción".

---

### 1.3 Widget: Distribución por Lista de Origen  
*Fuente de datos: `listas_pep_resultados.lista_id` (nuevo campo)*

Muestra qué listas generaron más coincidencias (PEP-MEX-GOB, OFAC-SDN, ONU-CONC, etc.). Útil para compliance — saber qué fuentes son más relevantes para los clientes.

---

### 1.4 Widget: Resumen de Actividad PEP por Notaría  
*Fuente de datos: `listas_pep_busquedas` + `pep_cuotas_notaria`*

Tabla compacta para super-admin mostrando, por notaría:
- Búsquedas realizadas en los últimos 30 días
- Cuota restante
- Última búsqueda
- Coincidencias encontradas

---

## 2. 📋 Sistema de Logs

### 2.1 Campo `fecha_baja` en el log de auditoría

**Impacto:** Alta importancia para compliance.

Cuando una persona en lista tiene `fecha_baja` poblada, significa que fue **removida de la lista** en esa fecha. El historial de búsquedas debe reflejar esto:

- En `History.tsx` → columna "Estado en lista" que muestre:
  - Sin `fecha_baja` → 🔴 **En lista activa**
  - Con `fecha_baja` → 🟡 **Dado de baja (${fecha_baja})**
- En el log de auditoría de `listas_pep_resultados`, `fecha_baja` ya se almacena en el momento de la búsqueda (snapshot histórico). Esto permite responder: *"cuando se hizo la búsqueda, ¿estaba la persona activa en la lista?"*

**Caso de uso compliance crítico:**
> Notaría busca a Juan Pérez en enero → está en lista → `fecha_baja` = null (activo).  
> Scraper verifica en marzo → persona fue dada de baja → `fecha_baja` = "2026-02-15".  
> El log de enero muestra estado original. El log de marzo muestra la actualización.  
> La notaría tiene evidencia de cuándo fue activo y cuándo fue dado de baja.

**Cambios necesarios:**
- [ ] `History.tsx`: columna adicional en la tabla de resultados mostrando `fecha_baja` (null → activo, valor → dado de baja con fecha)
- [ ] `ListasPEPController::historialPage()`: incluir `fecha_baja` en los resultados paginados
- [ ] Cuando el scraper detecte cambio en `fecha_baja` → crear entrada en `listas_pep_resultados` con `accion_tomada = 'BAJA_DETECTADA'`

---

### 2.2 Enriquecimiento del Log con `fuente_desc_larga`

Actualmente el campo `lista` contiene algo como "OFAC" o "PEP-GOB". Con `fuente_desc_larga` podemos mostrar:
- `lista` → "OFAC"
- `fuente_desc_larga` → "Office of Foreign Assets Control — Specially Designated Nationals List (SDN)"

**Cambios:**
- [ ] En la vista detalle de resultado (modal en `Search.tsx`) → mostrar `fuente_desc_larga` si está disponible, sino `lista`.
- [ ] En certificados PDF → usar `fuente_desc_larga` para mayor formalidad y precisión legal.

---

### 2.3 Log de Consumo de API (Nuevo registro periódico)

**Propuesta:** Guardar el resultado de `GET /Listas/Consumos` en una tabla `pld_consumos_historico` (o como metadata en `pep_paquetes_pld`) cada 24 horas, vía el command scheduler.

```
fecha_registro | periodo | plan | consultas_disponibles | consultas_contratadas | tipo_plan
```

Esto permite:
- Ver la curva de consumo de búsquedas a lo largo del tiempo.
- Detectar picos de uso (ej: una notaría consumió 30 búsquedas en un día).
- Generar reportes de consumo para facturación a Atinet.

**Implementación:**
- [ ] Migración: `create_pld_consumos_historico_table`
- [ ] Model: `PldConsumoHistorico`
- [ ] Agregar al Artisan command `pep:verificar-personas` (o crear comando separado `pep:registrar-consumo`)
- [ ] Schedule: `dailyAt('03:00')` (después del scraper a las 02:00)

---

### 2.4 Log de Cambios de `lista_id` / `pais_lista_id3`

Con los nuevos campos identificadores, el scraper puede detectar si una persona **cambió de lista** (ej: pasó de OFAC-SDN a OFAC-CONS). Esto debe quedar registrado en `listas_pep_resultados` con `accion_tomada = 'CAMBIO_LISTA'`.

---

## 3. 📈 Reportes

### 3.1 Reporte: Consumo del Plan PLD

**Audiencia:** Super-admin (Atinet).  
**Formato:** Tabla HTML + opción exportar CSV.

Columnas:
- Fecha del registro histórico
- Consultas disponibles ese día
- Consultas contratadas
- % consumido
- Tipo de plan

**Implementación:**
- [ ] `GET /admin/listas-pep/reportes/consumo-plan` → controller method `reporteConsumoPlan()`
- [ ] Vista React: `resources/js/pages/Admin/ListasPEP/Reportes/ConsumoPlan.tsx`
- [ ] Fuente: `pld_consumos_historico` (ver §2.3)

---

### 3.2 Reporte: Coincidencias por País

**Audiencia:** Super-admin y notaría (scoped).  
**Formato:** Tabla con totales + chart de barras.

Agrupa `listas_pep_resultados` por `pais_lista_id3`, contando:
- Total de búsquedas con al menos 1 coincidencia
- Total de coincidencias exactas (`es_coincidencia_exacta = 1`)
- Personas dadas de baja (`fecha_baja IS NOT NULL`)

```sql
SELECT pais_lista_id3, COUNT(*) as total, 
       SUM(es_coincidencia_exacta) as exactas,
       SUM(CASE WHEN fecha_baja IS NOT NULL THEN 1 ELSE 0 END) as inactivas
FROM listas_pep_resultados
WHERE notaria_id = ?  -- o sin filtro para super-admin
GROUP BY pais_lista_id3
ORDER BY total DESC
```

---

### 3.3 Reporte: Personas con `fecha_baja` (Inactivas en Lista)

**Audiencia:** Compliance officer / Super-admin.  
**Propósito:** Identificar qué personas que alguna vez marcamos como coincidencia ya **no están activas** en la lista.

Esto tiene implicación directa en compliance: si una notaría tenía un expediente bloqueado por una coincidencia PEP, y la persona fue dada de baja, el notario puede saber que la restricción levantó.

Columnas:
- Nombre (denominación)
- Lista donde estaba (`lista_id`)
- País (`pais_lista_id3`)
- Fecha de baja de la lista (`fecha_baja`)
- Notaría(s) que la consultaron
- Última acción tomada (`accion_tomada`)

---

### 3.4 Reporte: Actividad por Notaría (Reporte Ejecutivo)

**Audiencia:** Super-admin.  
**Período:** Configurable (últimos 30/90/365 días).

Por cada notaría muestra:
- Total búsquedas realizadas
- Búsquedas con coincidencia vs sin coincidencia
- Cuota asignada vs consumida
- Certificados emitidos (sin coincidencias + con coincidencia)
- % de uso de cuota
- Top 3 países de coincidencias (`pais_lista_id3`)

**Opción exportar PDF** → reporte formal con logo Atinet, útil para auditorías externas.

---

### 3.5 Reporte: Distribución por Fuente/Lista

**Audiencia:** Compliance + Atinet.  
**Propósito:** Entender qué listas generan más coincidencias → justificar el costo del servicio.

Agrupa por `lista_id` + `fuente_desc_larga` mostrando:
- Nombre completo de la lista
- País/organismo
- Total de coincidencias encontradas
- Exactas vs aproximadas

---

### 3.6 Reporte: Vencimiento de Plan y Alertas

**Audiencia:** Super-admin.  
**Propósito:** Anticipar cuando el plan está por vencer o la cuota por agotarse.

Cálculos desde `GET /Listas/Consumos`:
- Días restantes hasta fin de `periodo`
- Velocidad de consumo (búsquedas por día, promedio últimos 30 días)
- Proyección de agotamiento: a este ritmo, ¿cuándo se acaban las búsquedas?

```
Plan actual: 20 / 50 búsquedas disponibles
Período:     31/12/2025 – 31/12/2026 (212 días restantes)
Ritmo:       ~1.5 búsquedas/día (últimos 30 días)
Proyección:  Se agotará en ~13 días (15 de Junio) ← ALERTA 🔴
             Plan vence en 212 días
```

Si `proyección_agotamiento < días_para_vencimiento` → alerta automática por email a `soporte@atinet.mx`.

---

## 4. 📧 Notificaciones / Alertas

Derivadas de los datos anteriores, proponer 3 alertas automáticas:

| Alerta | Condición | Canal | Frecuencia |
|---|---|---|---|
| Cuota baja | `consultasDisponibles < 20%` del total | Email a soporte@atinet.mx | 1 vez cuando cruza el umbral |
| Sin cuota | `consultasDisponibles === 0` | Email + notificación dashboard | Diario hasta recargar |
| Plan por vencer | `días_para_vencimiento < 30` | Email a claudia@atinet.com.mx | Semanal |
| Persona dada de baja | Scraper detecta `fecha_baja` nueva | Email a notaría involucrada | Por evento |

---

## 5. 🗂️ Orden de Implementación Sugerido

```
PRIORIDAD ALTA (inmediato, antes de conectar Search.tsx)
  [1] Search.tsx → handleBuscar() conectado a POST /admin/listas-pep/buscar
  [2] History.tsx → columna fecha_baja en resultados
  [3] Search.tsx → fuente_desc_larga en modal de detalle

PRIORIDAD MEDIA (siguiente sprint)
  [4] PldPlanWidget.tsx → widget dashboard con datos de GET /Listas/Consumos
  [5] Alerta de cuota baja (email) → desde Artisan command diario
  [6] pld_consumos_historico → tabla + registro diario

PRIORIDAD NORMAL (post-MVP)
  [7] Reporte consumo plan (§3.1)
  [8] Reporte actividad por notaría (§3.4)
  [9] Reporte distribución por fuente (§3.5)
  [10] Reporte proyección de agotamiento (§3.6)

REQUIERE UA DEL VENDOR (bloqueado)
  [11] Widget distribución por país (§1.2) — requiere pais_lista_id3 poblado
  [12] Reporte coincidencias por país (§3.2) — idem
  [13] Reporte personas con fecha_baja (§3.3) — idem
```

---

## 6. 🔧 Cambios en BD necesarios para este plan

| Tabla | Campo/Cambio | Propósito | Estado |
|---|---|---|---|
| `listas_pep_resultados` | `fecha_baja`, `lista_id`, `pais_lista_id3`, `fuente_desc_larga` | Enriquecimiento de datos | ✅ Migrado (Jun 2) |
| `listas_pep_personas` | `fecha_baja`, `lista_id`, `pais_lista_id3`, `fuente_desc_larga` | Deduplicado enriquecido | ✅ Migrado (Jun 2) |
| `pld_consumos_historico` | Nueva tabla (ver §2.3) | Log de consumo periódico | ⏳ Pendiente |

---

## 7. 📚 Referencia de Campos Clave

### Campos nuevos en BD (migración Jun 2, 2026)

| Columna | Tipo | Procedencia | Cuándo se poblará |
|---|---|---|---|
| `fecha_baja` | `string nullable` | `PersonaDto.fechaBaja` | Cuando tengamos `UA` del vendor |
| `lista_id` | `string(100) nullable` | `PersonaDto.listaId` | Cuando tengamos `UA` del vendor |
| `pais_lista_id3` | `char(3) nullable` | `PersonaDto.paisListaId3` | Cuando tengamos `UA` del vendor |
| `fuente_desc_larga` | `string(500) nullable` | `PersonaDto.fuenteDescLarga` | Cuando tengamos `UA` del vendor |

### Endpoint `GET /Listas/Consumos` (activo desde Jun 2, 2026)

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

Expuesto en nuestro sistema en `GET /admin/listas-pep/consumos` → `ListasPEPController::consumos()`.

### Campos del objeto `UA` (aún no disponible — requiere vendor)

```
cantidadBusquedas, cantidadMesesPeriodo, porcentajeAvisoExceso,
fechaInicio, fechaExpiracionVenta, tipoPlan,
modulos[].id, modulos[].estadoComercial, modulos[].esDemo
```
