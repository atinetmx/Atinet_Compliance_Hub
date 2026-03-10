# 📋 PLAN DE TRABAJO: Sistema Legacy - Visualización y Análisis

**Fecha**: 10 Marzo 2026  
**Proyecto**: Atinet Compliance Hub  
**Fase**: 4 (Completada) → 5 (Mejoras de Visualización)

---

## 🎯 OBJETIVO GENERAL

Implementar interfaces de usuario para visualizar, analizar y monitorear el sistema legacy y su proceso de migración al nuevo sistema.

---

## 📊 ESTADO ACTUAL

### ✅ Completado (Fase 1-4)

- [x] **Fase 1**: Importación usuarios Atinet (6 SuperAdmins)
- [x] **Fase 2**: Catálogo legacy generado (130 notarías, 383,545 búsquedas)
- [x] **Fase 3**: UI de integración (autocomplete, migration)
- [x] **Fase 4**: Queries en tiempo real (servicio + endpoints)
  - [x] BusquedasLegacyService.php (427 líneas)
  - [x] LegacyController con endpoints
  - [x] HistorialBusquedasLegacy.tsx (componente completo)
  - [x] Integración en Notarias/Show.tsx

### ⚠️ Limitaciones Actuales

- ❌ 0 notarías con legacy_identifier (no se ve el historial)
- ❌ No hay vista general del sistema legacy
- ❌ No hay análisis comparativo legacy vs nuevo
- ❌ No hay métricas de migración
- ❌ No hay visibilidad en Dashboard SuperAdmin

---

## 🗺️ PLAN DE IMPLEMENTACIÓN

### **PRIORIDAD 1: Foundation** (30 min)
> Crear notaría de prueba para validar funcionalidad

#### Task 1.1: Crear Notaría de Prueba
- [ ] **Método**: Manual UI o Script programático
- [ ] **Datos**: 
  - Legacy ID: `10Cuernavaca` (47,551 búsquedas)
  - Número: `10_test`
  - Estado: Morelos
- [ ] **Resultado Esperado**: Ver historial en `/admin/notarias/{id}`
- [ ] **Tiempo estimado**: 15 min
- [ ] **Responsable**: Usuario

#### Task 1.2: Verificar Funcionalidad
- [ ] Acceder a Show de notaría
- [ ] Verificar sección "Historial Sistema Legacy" visible
- [ ] Probar filtros (fuente, fechas, límite)
- [ ] Validar estadísticas (5 cards)
- [ ] Validar tabla de búsquedas
- [ ] **Tiempo estimado**: 15 min

---

### **PRIORIDAD 2: SuperAdmin Dashboard** (1 hora)
> Visibilidad general del sistema legacy

#### Task 2.1: Diseño de Tarjeta Legacy
**Ubicación**: `resources/js/pages/SuperAdminDashboard.tsx`

**Diseño**:
```tsx
┌─────────────────────────────────────────────┐
│ 🗄️ SISTEMA LEGACY                          │
├─────────────────────────────────────────────┤
│ • 130 notarías catalogadas                  │
│ • 383,545 búsquedas históricas              │
│ • 93 notarías activas (últimos 6 meses)     │
│ • Última actividad: 04 Mar 2026             │
│                                             │
│ Top 5 Notarías:                             │
│ 1. 10Cuernavaca    - 47,551 búsquedas      │
│ 2. 71Monterrey     - 6,227 búsquedas       │
│ 3. ...                                      │
│                                             │
│ [Ver Análisis Completo →]                  │
└─────────────────────────────────────────────┘
```

**Tareas**:
- [ ] Crear endpoint: `GET /admin/legacy/dashboard-stats`
- [ ] Implementar método en LegacyController
- [ ] Agregar tarjeta en SuperAdminDashboard
- [ ] Estilizar con Tailwind + animaciones GSAP
- [ ] Link a página de reportes

**Tiempo estimado**: 45 min

#### Task 2.2: Testing Dashboard
- [ ] Verificar carga de estadísticas
- [ ] Validar performance (<500ms)
- [ ] Probar link a reportes
- [ ] **Tiempo estimado**: 15 min

---

### **PRIORIDAD 3: Página de Reportes Legacy** (2-3 horas)
> Análisis completo y comparativas

#### Task 3.1: Backend - Controller & Endpoints
**Archivo**: `app/Http/Controllers/Admin/LegacyController.php`

**Endpoints necesarios**:
```php
// Vista principal
GET /admin/legacy/overview → getOverview()
  - Estadísticas generales
  - Top notarías por búsquedas
  - Distribución por fuente
  - Timeline de actividad

// Comparativas
GET /admin/legacy/comparison → getComparison()
  - Legacy vs Nuevo (últimos 3 meses)
  - Proyecciones de adopción

// Exportación
GET /admin/legacy/export → exportData()
  - CSV/Excel con datos completos
```

**Tareas**:
- [ ] Implementar getOverview()
- [ ] Implementar getComparison()
- [ ] Implementar exportData()
- [ ] Agregar caché (1 hora)
- [ ] **Tiempo estimado**: 1 hora

#### Task 3.2: Frontend - Página Overview
**Archivo**: `resources/js/pages/Admin/Legacy/Overview.tsx` (NUEVO)

**Secciones**:
1. **Hero Stats** (4 cards grandes)
   - Total notarías catalogadas
   - Total búsquedas históricas
   - Notarías activas
   - Rango de fechas

2. **Gráficos de Distribución**
   - Pie Chart: Búsquedas por fuente (Web/Desktop/OFAC/SAT)
   - Bar Chart: Top 15 notarías
   - Line Chart: Actividad en el tiempo (últimos 12 meses)

3. **Comparativa Legacy vs Nuevo**
   - Bar Chart comparativo (últimos 3 meses)
   - Métricas de adopción
   - Proyección de migración

4. **Tabla de Notarías**
   - Lista completa con filtros
   - Columnas: ID, Nombre, Búsquedas, Última actividad, Estado
   - Búsqueda en tiempo real
   - Ordenamiento por columnas

5. **Métricas de Migración**
   - Notarías vinculadas: X/130
   - Búsquedas transferidas: X/383,545
   - Progreso: X%
   - Estimación de completitud

**Tareas**:
- [ ] Crear componente Overview.tsx
- [ ] Implementar Hero Stats
- [ ] Agregar gráficos (Recharts)
- [ ] Implementar tabla con filtros
- [ ] Agregar métricas de migración
- [ ] Botón de exportación
- [ ] **Tiempo estimado**: 2 horas

#### Task 3.3: Routing & Navigation
**Archivos**: `routes/web.php`, Navigation components

**Tareas**:
- [ ] Agregar ruta: `/admin/legacy/overview`
- [ ] Agregar al menú Admin (Reports section)
- [ ] Breadcrumbs
- [ ] **Tiempo estimado**: 15 min

#### Task 3.4: Testing Reportes
- [ ] Validar carga de datos
- [ ] Validar gráficos (render correcto)
- [ ] Probar filtros y búsqueda
- [ ] Validar exportación
- [ ] Performance (<1s carga inicial)
- [ ] **Tiempo estimado**: 30 min

---

### **PRIORIDAD 4: Optimizaciones** (1 hora)
> Mejoras de performance y UX

#### Task 4.1: Cache Strategy
**Objetivo**: Reducir queries a BD legacy

**Tareas**:
- [ ] Implementar cache para catálogo (24h)
- [ ] Implementar cache para estadísticas (1h)
- [ ] Cache warming en background
- [ ] Invalidación selectiva
- [ ] **Tiempo estimado**: 30 min

#### Task 4.2: Loading States
**Objetivo**: Mejor UX durante cargas

**Tareas**:
- [ ] Skeletons para todas las vistas
- [ ] Progress indicators
- [ ] Error boundaries
- [ ] Retry mechanisms
- [ ] **Tiempo estimado**: 30 min

---

### **PRIORIDAD 5: Documentación** (30 min)
> Guías para usuarios y desarrolladores

#### Task 5.1: Documentación Usuario
**Archivo**: `docs/GUIA_SISTEMA_LEGACY.md` (NUEVO)

**Contenido**:
- Qué es el sistema legacy
- Cómo vincular notarías
- Dónde ver el historial
- Interpretación de estadísticas
- FAQ

**Tiempo estimado**: 15 min

#### Task 5.2: Documentación Técnica
**Archivo**: `docs/TECHNICAL_LEGACY_INTEGRATION.md` (NUEVO)

**Contenido**:
- Arquitectura de integración
- Estructura de BD legacy
- Endpoints disponibles
- Cómo agregar nuevas fuentes
- Testing

**Tiempo estimado**: 15 min

---

## 📅 CRONOGRAMA ESTIMADO

### **Opción A: Implementación Completa** (5-6 horas)
```
Día 1 (3h):
├─ [0h00-0h30] Prioridad 1: Foundation + Testing
├─ [0h30-1h30] Prioridad 2: Dashboard Card
└─ [1h30-3h00] Prioridad 3: Endpoints Backend

Día 2 (3h):
├─ [0h00-2h00] Prioridad 3: Frontend Overview
├─ [2h00-2h30] Prioridad 4: Optimizaciones
└─ [2h30-3h00] Prioridad 5: Documentación
```

### **Opción B: MVP Rápido** (2 horas)
```
├─ [0h00-0h30] Prioridad 1: Foundation
├─ [0h30-1h15] Prioridad 2: Dashboard Card
└─ [1h15-2h00] Simplificar Prioridad 3 (solo stats básicas)
```

### **Opción C: Por Fases** (Flexible)
```
Fase A: Dashboard Card (1h)
  ↓ Deploy y feedback
Fase B: Página Overview (2h)
  ↓ Deploy y feedback
Fase C: Optimizaciones (1h)
```

---

## 🎯 ENTREGABLES POR PRIORIDAD

### Prioridad 1 ✅
- Notaría de prueba creada
- Historial legacy visible y funcional

### Prioridad 2 ✅
- Tarjeta en SuperAdmin Dashboard
- Estadísticas generales visibles
- Link a análisis completo

### Prioridad 3 ✅
- Página `/admin/legacy/overview`
- Gráficos de distribución
- Tabla de notarías
- Comparativas legacy vs nuevo
- Exportación de datos

### Prioridad 4 ✅
- Cache implementado
- Loading states mejorados
- Performance optimizado

### Prioridad 5 ✅
- Documentación usuario
- Documentación técnica

---

## 📊 MÉTRICAS DE ÉXITO

### KPIs Técnicos
- [ ] Carga de Dashboard < 500ms
- [ ] Carga de Overview < 1s
- [ ] Queries a BD legacy < 100ms
- [ ] Cache hit rate > 80%
- [ ] 0 errores en consola

### KPIs de Negocio
- [ ] SuperAdmins pueden ver estado legacy en 1 click
- [ ] Exportación de datos funcional
- [ ] Comparativas claras y accionables
- [ ] Progreso de migración visible

---

## 🚨 RIESGOS Y MITIGACIONES

### Riesgo 1: Performance en queries legacy
**Mitigación**: 
- Implementar cache agresivo
- Limitar resultados (500 por query)
- Índices en BD legacy

### Riesgo 2: BD legacy no disponible
**Mitigación**:
- Fallback con datos cacheados
- Error handling robusto
- Logs detallados

### Riesgo 3: Datos inconsistentes
**Mitigación**:
- Validaciones en servicio
- Normalización de IDs (case-insensitive)
- Tests de integración

---

## 📝 NOTAS IMPORTANTES

### Estado Actual del Sistema
- **BD Legacy**: Conectada y funcionando
- **Servicio**: BusquedasLegacyService completado
- **Endpoints**: 2/4 implementados
- **Frontend**: Componente base listo

### Dependencias Externas
- Ninguna (todo interno)

### Consideraciones Especiales
1. **Case Sensitivity**: Ya resuelto en comparaciones
2. **Notarías sin búsquedas**: 5 usan otros servicios (incluir en catálogo)
3. **Fuentes**: 4 tablas legacy (Web, Desktop, OFAC, SAT)
4. **Rango de fechas**: Oct 2023 - Mar 2026

---

## 🔄 PRÓXIMOS PASOS

### Inmediato (Hoy)
1. [ ] Usuario arregla vista de crear notaría
2. [ ] Crear notaría de prueba (Task 1.1)
3. [ ] Validar historial legacy funcional

### Corto Plazo (Esta Semana)
1. [ ] Implementar Dashboard Card (Prioridad 2)
2. [ ] Iniciar página Overview (Prioridad 3)

### Mediano Plazo (Próxima Semana)
1. [ ] Completar página Overview
2. [ ] Optimizaciones
3. [ ] Documentación

---

## 💬 DECISIONES PENDIENTES

1. **¿Qué opción de cronograma prefieres?**
   - [ ] A: Implementación Completa (5-6h)
   - [ ] B: MVP Rápido (2h)
   - [ ] C: Por Fases (flexible)

2. **¿Dónde priorizamos primero?**
   - [ ] Dashboard (visibilidad rápida)
   - [ ] Reportes (análisis completo)
   - [ ] Ambos en paralelo

3. **¿Necesitas alguna funcionalidad adicional?**
   - [ ] Alertas de actividad legacy
   - [ ] Reportes automáticos por email
   - [ ] Dashboard para notarías (no solo SuperAdmin)

---

## 📞 CONTACTO Y SOPORTE

- **Desarrollador**: GitHub Copilot
- **Documentación**: `/docs/GUIA_SISTEMA_LEGACY.md` (pendiente)
- **Issues**: GitHub Issues

---

**Última actualización**: 10 Marzo 2026  
**Versión**: 1.0  
**Estado**: 📋 Plan creado - Esperando inicio de implementación
