# 📋 Fase 3 - Checklist de Mejoras
## Sistema de Búsqueda en Listas Negras - Expansión y Optimización

**Versión:** 3.0 (Planificación)  
**Fecha Inicio:** 13 de Febrero, 2026  
**Status:** 📅 Planificado

---

## 🎯 Objetivo General
Expandir funcionalidades del sistema de búsqueda con exportación, historial, caché, estadísticas y notificaciones.

---

## ✅ Checklist de Tareas - Orden de Prioridad

### **PARTE 1: Historial de Búsquedas** 🟢 PRIORITARIO
*Complejidad: Baja | Impacto: Alto | Tiempo: 1-2 horas*

#### 1.1 Base de Datos
- [ ] Crear migrate: `SearchHistory` table
  - Campos: id, user_id, notaria_id, search_term, search_type, results_count, created_at
- [ ] Crear modelo: `SearchHistory`
- [ ] Crear factory y seeder

#### 1.2 Backend - API
- [ ] Crear endpoint: `POST /admin/search-history` (guardar búsqueda)
- [ ] Crear endpoint: `GET /admin/search-history` (listar recientes)
- [ ] Crear endpoint: `DELETE /admin/search-history/{id}` (eliminar)
- [ ] Proteger con middleware auth + subscription
- [ ] Agregar validación

#### 1.3 Frontend - UI
- [ ] Guardar búsqueda después de cada resultado
- [ ] Sidebar: mostrar "Búsquedas Recientes"
- [ ] Mostrar: término, tipo, cantidad resultados, fecha
- [ ] Click en reciente = ejecutar búsqueda nuevamente
- [ ] Botón para limpiar historial

#### 1.4 Testing
- [ ] Test: guardar búsqueda después de OFAC
- [ ] Test: guardar búsqueda después de SAT  
- [ ] Test: listar historial por usuario
- [ ] Test: borrar búsqueda del historial

---

### **PARTE 2: Excel Export** 🟡 IMPORTANTE
*Complejidad: Media | Impacto: Alto | Tiempo: 2-3 horas*

#### 2.1 Backend - Controlador
- [ ] Instalar `maatwebsite/excel` (Laravel Excel)
- [ ] Crear export class: `SearchResultsExport`
- [ ] Crear endpoint: `GET /admin/export/ofac` (Excel OFAC)
- [ ] Crear endpoint: `GET /admin/export/sat` (Excel SAT)
- [ ] Proteger con middleware

#### 2.2 Excel Sheets - OFAC
- [ ] Tabla con columnas: Nombre, RFC, Similitud, Tipo, Fecha
- [ ] Aplicar formatos: headers bold, colores, widths
- [ ] Agregar logo
- [ ] Agregar fecha de generación en pie
- [ ] Agregar disclaimer legal

#### 2.3 Excel Sheets - SAT
- [ ] Tabla con columnas: Nombre, RFC, Situación, Fecha
- [ ] Aplicar formatos
- [ ] Agregar logo
- [ ] Agregar fecha y disclaimer

#### 2.4 Frontend - Botones
- [ ] Agregar botón "Descargar Excel" en resultados OFAC
- [ ] Agregar botón "Descargar Excel" en resultados SAT
- [ ] Botón "Sin Coincidencias" también exportable a Excel
- [ ] Estilo consistente con botones PDF

#### 2.5 Testing
- [ ] Descargar Excel OFAC y verificar contenido
- [ ] Descargar Excel SAT y verificar contenido
- [ ] Verificar formato correcto
- [ ] Verificar que se descarga con nombre correcto

---

### **PARTE 3: Cache de Búsquedas** 🟡 OPTIMIZACIÓN
*Complejidad: Media | Impacto: Medio | Tiempo: 1.5-2 horas*

#### 3.1 Backend - Cache
- [ ] Implementar cache para búsquedas OFAC (TTL: 24 horas)
- [ ] Implementar cache para búsquedas SAT (TTL: 24 horas)
- [ ] Usar cache key: `search_{type}_{hash(término)}`
- [ ] Invalidar cache manualmente si es necesario

#### 3.2 Endpoint Updates
- [ ] Modificar `/admin/search/persona-fisica` para usar cache
- [ ] Modificar `/admin/search/persona-moral` para usar cache
- [ ] Modificar `/admin/search/rfc` para usar cache
- [ ] Modificar `/admin/search/combined` para usar cache
- [ ] Agregar log cuando cache hit

#### 3.3 Frontend - UX
- [ ] Mostrar badge "Cached" cuando resultado viene de caché
- [ ] Agregar opción "Buscar nuevamente" para forzar refresh
- [ ] Mostrar timestamp de cuándo fue cacheado

#### 3.4 Testing
- [ ] Buscar mismo término 2 veces, verificar caché
- [ ] Medir reducción de tiempo en 2da búsqueda
- [ ] Verificar TTL: buscar después de 24h
- [ ] Forzar refresh sin caché

---

### **PARTE 4: Dashboard de Estadísticas** 🟠 AVANZADO
*Complejidad: Alta | Impacto: Alto | Tiempo: 3-4 horas*

#### 4.1 Base de Datos
- [ ] Crear tabla: `SearchStatistics` 
  - Campos: date, notaria_id, total_searches, ofac_count, sat_count, unique_users
- [ ] Crear seeder de datos históricos (últimos 30 días mock)

#### 4.2 Backend - Endpoints
- [ ] Endpoint: `GET /admin/statistics/summary` (resumen general)
- [ ] Endpoint: `GET /admin/statistics/by-date` (por fecha)
- [ ] Endpoint: `GET /admin/statistics/by-type` (OFAC vs SAT)
- [ ] Endpoint: `GET /admin/statistics/top-searches` (búsquedas top)
- [ ] Todos con filtros: date range, notaria

#### 4.3 React Component
- [ ] Crear componente: `SearchStatsboard`
- [ ] 4 Gráficos:
  - 📊 **Línea:** Búsquedas por día (últimos 30)
  - 🥧 **Circular:** OFAC vs SAT (proporciones)
  - 📈 **Barras:** Top 10 búsquedas
  - 🎯 **Números:** KPIs (total, promedio, máximo)

#### 4.4 Interactivos
- [ ] Date range picker (desde-hasta)
- [ ] Toggle entre vistas (día, semana, mes)
- [ ] Click en gráfico = drilldown
- [ ] Export stats a PDF/Excel

#### 4.5 Testing
- [ ] Verificar datos en gráficos
- [ ] Filtros funcionan correctamente
- [ ] Export genera archivo válido
- [ ] Performance con muchos datos

---

### **PARTE 5: Alertas y Notificaciones** 🔴 AVANZADO
*Complejidad: Alta | Impacto: Medio | Tiempo: 3-4 horas*

#### 5.1 Base de Datos
- [ ] Crear tabla: `WatchList` (personas monitoreadas)
- [ ] Crear tabla: `ListNotifications` (alertas enviadas)
- [ ] Crear tabla: `NotificationPreferences` (preferencias usuario)

#### 5.2 WatchList Management
- [ ] Endpoint: `POST /admin/watchlist` (agregar persona)
- [ ] Endpoint: `GET /admin/watchlist` (listar monitoreadas)
- [ ] Endpoint: `DELETE /admin/watchlist/{id}` (remover)
- [ ] Frontend: agregar botón "Monitorear" en cada resultado
- [ ] Mostrar lista de personas monitoreadas

#### 5.3 Notificación Sistema
- [ ] Crear job: `CheckListUpdates` (diário)
- [ ] Verificar si persona en watchlist está en lista negra
- [ ] Si sí → crear notificación y enviar email
- [ ] Scheduler con CRON

#### 5.4 Notificación UI
- [ ] Bell icon en navbar (unread count)
- [ ] Click en bell = dropdown con notificaciones
- [ ] Marcar como leída
- [ ] Eliminar notificación
- [ ] Settings: qué notificaciones recibir

#### 5.5 Email Notifications
- [ ] Mailable: `ListAlertNotification`
- [ ] Template HTML professional
- [ ] Incluir: persona, lista, detalles
- [ ] Link a dashboard

#### 5.6 Testing
- [ ] Agregar persona a watchlist
- [ ] Ejecutar job de verificación
- [ ] Verificar que se crea notificación
- [ ] Verificar email enviado
- [ ] Marcar como leída funciona

---

### **PARTE 6: API Real OFAC/SAT** 🔴 CRÍTICO (Future)
*Complejidad: Muy Alta | Impacto: Crítico | Tiempo: 6-8 horas*

#### 6.1 Research
- [ ] Estudiar API oficial OFAC (SDN List)
- [ ] Estudiar API oficial SAT (Contribuyentes)
- [ ] Estudiar credenciales necesarias
- [ ] Documentar endpoints y formatos

#### 6.2 Integration OFAC
- [ ] Service class: `OfacSearchService`
- [ ] Implementar: llamada a API real
- [ ] Cachear resultados (por seguridad y performance)
- [ ] Error handling

#### 6.3 Integration SAT
- [ ] Service class: `SatSearchService`
- [ ] Implementar: llamada a API real
- [ ] Cachear resultados
- [ ] Error handling

#### 6.4 Migration
- [ ] Crear endpoint para sync de datos OFAC/SAT
- [ ] Crear job para actualización periódica
- [ ] Migrate datos existentes si es necesario
- [ ] Fallback a datos locales si API falla

#### 6.5 Testing
- [ ] Test búsquedas con API real
- [ ] Verificar rate limiting
- [ ] Verificar fallback si API cae
- [ ] Comparar resultados mock vs real

---

## 📊 Resumen Plan

| Parte | Nombre | Prioridad | Complejidad | Tiempo Est. |
|-------|--------|-----------|-------------|------------|
| 1️⃣ | Historial | 🔴 ALTA | 🟢 Baja | 1-2h |
| 2️⃣ | Excel Export | 🔴 ALTA | 🟡 Media | 2-3h |
| 3️⃣ | Cache | 🟡 MEDIA | 🟡 Media | 1.5-2h |
| 4️⃣ | Estadísticas | 🟡 MEDIA | 🟠 Alta | 3-4h |
| 5️⃣ | Alertas | 🟡 MEDIA | 🟠 Alta | 3-4h |
| 6️⃣ | API Real | 🟢 BAJA* | 🔴 Muy Alta | 6-8h |

**\*Depende de disponibilidad de APIs*

---

## 🚀 Orden de Implementación Recomendado

```
1️⃣  HISTORIAL (rápido, alto impacto)
    ↓
2️⃣  EXCEL EXPORT (rápido, alto impacto)
    ↓
3️⃣  CACHE (optimización importante)
    ↓
4️⃣  ESTADÍSTICAS (análisis y reporting)
    ↓
5️⃣  ALERTAS (proactivo, importante)
    ↓
6️⃣  API REAL (cuando tengas acceso)
```

---

## 📝 Cómo Usar Este Checklist

### Cada Subtarea
```markdown
- [ ] Tarea específica
  ```

Cuando completes una:
- [ ] Tarea específica ✅

### Marcar Parte Completa
Cuando todas las tareas de una parte estén ✅:
- Cambiar status a "✅ COMPLETADO"
- Crear documento de cambios
- Update en README.md

---

## 📌 Notas Importantes

### Al Comenzar Cada Parte
1. Lee el "Objetivo" de la parte
2. Verifica prerequisitos
3. Estima tiempo real vs planeado
4. Comunica cambios importantes

### Documentación Required
- Cada parte terá su propio documento `.md`
- ej: `FASE_3_PARTE_1_HISTORIAL.md`
- Incluir: cambios técnicos, testing, deployment

### Testing Requerido
- Unit tests para lógica backend
- Integration tests para APIs
- Manual tests para UI
- Performance tests donde aplique

### Deployment
- Cada parte se puede deployer independientemente
- Usar feature flags si es necesario
- Rollback plan si falla

---

## 🎯 Próximo Paso

**COMENZAR CON: Parte 1 - Historial de Búsquedas** ✅

¿Confirmamos que iniciamos con esto?

---

**Checklist Creado:** 13 de Febrero, 2026  
**Responsable:** GitHub Copilot  
**Status:** 📅 Listo para Implementación
