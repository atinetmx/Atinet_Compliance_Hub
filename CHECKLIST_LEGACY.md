# ✅ CHECKLIST RÁPIDO: Sistema Legacy

## 🎯 FASE ACTUAL: Preparación

- [ ] **CRÍTICO**: Arreglar vista de crear notaría
- [ ] **CRÍTICO**: Crear notaría de prueba con `legacy_identifier = "10Cuernavaca"`
- [ ] **CRÍTICO**: Validar que historial legacy se muestre en Show

---

## 📋 IMPLEMENTACIONES PENDIENTES

### 🏠 Dashboard SuperAdmin (1h)
```
├─ [ ] Endpoint: GET /admin/legacy/dashboard-stats
├─ [ ] Controller: LegacyController->getDashboardStats()
├─ [ ] Component: Tarjeta "Sistema Legacy" en Dashboard
└─ [ ] Link: → Análisis Completo
```

### 📊 Página de Reportes (2-3h)
```
├─ [ ] Route: GET /admin/legacy/overview
├─ [ ] Controller: 3 endpoints (overview, comparison, export)
├─ [ ] Page: resources/js/pages/Admin/Legacy/Overview.tsx
├─ [ ] Components:
│   ├─ [ ] Hero Stats (4 cards)
│   ├─ [ ] Gráfico Pie: Distribución por fuente
│   ├─ [ ] Gráfico Bar: Top 15 notarías
│   ├─ [ ] Gráfico Line: Timeline de actividad
│   ├─ [ ] Comparativa: Legacy vs Nuevo
│   ├─ [ ] Tabla: Lista completa notarías
│   └─ [ ] Métricas: Progreso de migración
└─ [ ] Navigation: Agregar al menú Admin
```

### ⚡ Optimizaciones (1h)
```
├─ [ ] Cache: Catálogo (24h)
├─ [ ] Cache: Estadísticas (1h)
├─ [ ] Loading: Skeletons
└─ [ ] Error: Boundaries
```

### 📚 Documentación (30min)
```
├─ [ ] docs/GUIA_SISTEMA_LEGACY.md
└─ [ ] docs/TECHNICAL_LEGACY_INTEGRATION.md
```

---

## 🚀 ORDEN DE EJECUCIÓN RECOMENDADO

### Hoy (30 min)
1. ✅ Plan de trabajo creado
2. ⏳ Arreglar vista Create Notaría
3. ⏳ Crear notaría de prueba
4. ⏳ Validar funcionalidad

### Mañana (3-4 horas)
1. ⏳ Dashboard Card (1h)
2. ⏳ Endpoints Backend (1h)
3. ⏳ Página Overview (2h)

### Próxima Semana
1. ⏳ Optimizaciones (1h)
2. ⏳ Documentación (30m)

---

## 🎯 DECISIONES NECESARIAS

**¿Qué implementamos primero?**
- [ ] Opción A: Dashboard + Overview completo (4h)
- [ ] Opción B: Solo Dashboard (1h)
- [ ] Opción C: Solo Overview (2-3h)

---

## 📌 QUICK LINKS

- Plan completo: `/docs/PLAN_TRABAJO_SISTEMA_LEGACY.md`
- Script creación: `/create_test_notaria_with_legacy.php`
- Servicio: `/app/Services/BusquedasLegacyService.php`
- Controller: `/app/Http/Controllers/Admin/LegacyController.php`
- Component: `/resources/js/components/Admin/HistorialBusquedasLegacy.tsx`

---

**Estado**: 📋 Esperando inicio de implementación  
**Prioridad**: 🔴 Alta - Validar funcionalidad primero
