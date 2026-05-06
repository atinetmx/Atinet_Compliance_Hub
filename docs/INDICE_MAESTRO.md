# 📚 Índice Maestro de Documentación

**Sistema:** Atinet Compliance Hub  
**Versión:** 2.0  
**Última Actualización:** 8 de Abril, 2026

---

## 🎯 DOCUMENTOS CLAVE POR ROL

### Para Desarrolladores Backend (PHP/Laravel)

1. **[Guía Rápida: Sincronización y Desarrollo](GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md)** ⭐ INICIO AQUÍ
   - Comandos diarios más usados
   - Sincronización de listas negras
   - Troubleshooting común
   - Atajos de testing

2. **[Arquitectura Completa y Sincronización](architecture/ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md)**
   - Multi-tenancy database-per-tenant
   - Conexiones a Hostgator
   - Sistema de sincronización incremental
   - Roadmap de servidores dedicados

3. **[Actualización NotariaController](development/ACTUALIZACION_NOTARIA_CONTROLLER.md)** 🚨 CRÍTICO
   - Migraciones faltantes en createMinimalTables()
   - SQL completo de registro_web (116 columnas)
   - SQL de activity_log, search_histories
   - Checklist de implementación

4. **[Fix: Creación de Notaría y Sync CN](development/FIX_CREACION_NOTARIA_Y_SYNC_CN.md)** ✅ Mayo 2026
   - Fix DDL (CREATE DATABASE) dentro de DB::transaction()
   - Provisión de tbl_cat_roles, tbl_cat_modulos y LARAVEL_GW en tenants nuevos
   - UserObserver usa API C# para crear usuarios con hash correcto
   - Migraciones para tablas/columnas importadas directamente por Alex

4. **[Listas Negras OFAC/SAT](LISTAS_NEGRAS_OFAC_SAT.md)**
   - Integración con BDs legacy
   - Búsquedas en OFAC (11 tablas)
   - Búsquedas en SAT 69-B/69-C
   - Algoritmos de matching

5. **[Propuesta: Historial de Búsquedas](PROPUESTA_HISTORIAL_BUSQUEDAS.md)**
   - Tabla search_histories vs busquedas
   - Sistema de auditoría
   - Reportes de uso

### Para Desarrolladores Frontend (React/Inertia)

1. **[Guía Rápida](GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md)** ⭐ INICIO AQUÍ
   - Comandos npm
   - Testing de componentes
   - Build y deploy

2. **Sistema de Modales** (implementado 8 Abril 2026)
   - Archivos: `resources/js/components/ui/`
   - confirm-dialog.tsx
   - info-modal.tsx
   - loading-modal.tsx
   - action-modal.tsx
   - atinet-loader-3d.tsx

3. **QR Scanner** (completado 8 Abril 2026)
   - Componente: `resources/js/components/ScannerQR.tsx`
   - Parser: `resources/js/utils/qr-parser.ts`
   - Backend: `app/Services/SATScraperService.php`

### Para Administradores de Sistema

1. **[Arquitectura Completa](architecture/ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md)**
   - Topología de servidores
   - Conexiones de red
   - Programador de Tareas

2. **[Guía Rápida](GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md)**
   - Verificación de conexiones
   - Logs y monitoreo
   - Troubleshooting de red

### Para Product Managers / Stakeholders

1. **[Visión General](../vision_general.txt)**
   - Estado del proyecto
   - Funcionalidades implementadas

2. **[Arquitectura Completa](architecture/ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md)**
   - Sección 5: Roadmap de Implementación
   - Tiempos estimados
   - Prioridades

---

## 📂 ESTRUCTURA DE DOCUMENTACIÓN

```
docs/
├── GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md  ← ⭐ START HERE
├── LISTAS_NEGRAS_OFAC_SAT.md
├── PROPUESTA_HISTORIAL_BUSQUEDAS.md
├── ANALISIS_GAPS_LISTAS_NEGRAS.md
├── INTEGRACION_BUSQUEDAS_OFAC_SAT.md
├── PROPUESTA_NORMALIZACION_UBICACION.md
├── VERIFICACION_SUSCRIPCIONES_AUTOMATICA.md
├── HOTFIX_RFC_VALIDACION.md
├── SESION_FEB13_RESUMEN.md
│
├── architecture/
│   ├── ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md  ← ⭐ COMPLETO
│   └── [Otros documentos de arquitectura]
│
├── development/
│   ├── ACTUALIZACION_NOTARIA_CONTROLLER.md     ← 🚨 DECISIÓN ESTRATÉGICA (Opción B)
│   ├── PLAN_CONSOLIDACION_BDS_LEGACY.md        ← 📋 Plan de 2 semanas (8-19 Abril)
│   ├── SISTEMA_OCR_REGISTRO_WEB.md             ← ✅ NUEVO (8 Abril) - OCR completo
│   └── [Otros documentos de desarrollo]
│
├── design/
│   └── [Diseños UI/UX]
│
└── phases/
    ├── FASE_3_CHECKLIST.md
    ├── INDICE_FASE_2.md
    ├── CAMBIOS_TECNICOS_FASE_2.md
    └── [Otros checklists de fases]
```

---

## 🗺️ ROADMAP ACTUAL

### ✅ COMPLETADO (8 Abril 2026)

#### Fase 1: Core Business
- [x] Multi-tenancy database-per-tenant
- [x] Sistema de planes y suscripciones
- [x] Gestión de notarías (CRUD completo)
- [x] Autenticación con Fortify + 2FA
- [x] Dashboard administrativo

#### Fase 2: Listas Negras
- [x] Sincronización incremental con Hostgator
- [x] Búsquedas OFAC (11 tablas)
- [x] Búsquedas SAT 69-B/69-C
- [x] Búsquedas en Aplicativos legacy
- [x] Histórico de búsquedas

#### Fase 3: Agenda
- [x] Calendario de eventos
- [x] Recurrencia (RRULE)
- [x] Integración con sistema legacy

#### Fase 4: Activity Log
- [x] Auditoría con Spatie Activity Log
- [x] Batch tracking (UUID)
- [x] Event types

#### Fase 5: Registro Web - COMPLETADO ✅
- [x] QR Scanner (html5-qrcode)
- [x] Scraping SAT con Gemini AI
- [x] **OCR para INE** (Gemini Vision API) ← NUEVO 8 Abril
- [x] **OCR para CURP** (Gemini Vision API) ← NUEVO 8 Abril
- [x] **OCR para Acta de Nacimiento** (Gemini Vision API) ← NUEVO 8 Abril
- [x] **Auto-fill de formulario desde documentos** ← NUEVO 8 Abril
- [x] ImageOCRScanner component (React)
- [x] GeminiVisionService + OCRParserService
- [ ] Sistema híbrido (lee legacy + escribe tenant) ← PRÓXIMO
- [x] Parser de 6 formatos de QR
- [x] SAT Scraper Service
- [x] Auto-fill de formulario
- [x] Tests completos

#### Fase 6: Sistema de Modales
- [x] 5 componentes React + Radix UI
- [x] Loader 3D con Three.js
- [x] Toast system (Sonner)
- [x] Migración de SweetAlert2 completa

### 🏗️ EN DESARROLLO (8-22 Abril 2026)

#### Fase 5: Registro Web - PARTE 2 (1-2 semanas)
- [ ] **Button 2:** Escáner INE (OCR)
- [ ] **Button 3:** Escáner CURP (validación)
- [ ] **Button 4:** Escáner Acta Nacimiento
- [ ] Integración completa 4 botones
- [ ] Testing end-to-end
- [ ] **DEADLINE:** 22 Abril (Demo)

### 🔧 PENDIENTE CRÍTICO (Antes de Demo)

#### Actualización NotariaController
- [ ] Agregar SQL de registro_web a createMinimalTables()
- [ ] Agregar SQL de activity_log
- [ ] Agregar SQL de search_histories
- [ ] Testing con notarías de prueba
- [ ] Verificar migración automática funciona
- [ ] **TIEMPO ESTIMADO:** 3-5 días

### � PENDIENTE CRÍTICO (Esta Semana - 8-15 Abril)

#### Actualización NotariaController
- [ ] Agregar SQL de registro_web a createMinimalTables()
- [ ] Agregar SQL de activity_log
- [ ] Agregar SQL de search_histories
- [ ] Testing con notarías de prueba
- [ ] Verificar 14 tablas creadas correctamente
- [ ] **TIEMPO ESTIMADO:** 1-2 días

### 📅 FUTURO (Próxima Semana - 15-19 Abril)

#### Consolidación de BDs Legacy
- [ ] **Mes 1:** Crear migraciones para tablas legacy (OFAC, SAT, Catálogos, Aplicativos)
- [ ] **Mes 1:** Crear seeders para migrar datos históricos
- [ ] **Mes 1:** Testing de consolidación
- [ ] **Ver:** [PLAN_CONSOLIDACION_BDS_LEGACY.md](development/PLAN_CONSOLIDACION_BDS_LEGACY.md)
  
### 📅 LARGO PLAZO (Mayo-Junio 2026)

#### Servidores Dedicados (2-3 meses)
- [ ] **Mes 1:** Demo con 3 notarías distribuidas
  - [ ] Agregar campos de servidor a tabla notarias
  - [ ] Middleware SetTenantDatabaseConnection
  - [ ] UI para configurar servidor
  - [ ] **DEADLINE:** 22 Abril (Demo)
  
- [ ] **Mes 2-3:** Producción completa (50+ notarías)
  - [ ] Job de sincronización bidireccional
  - [ ] Dashboard de monitoreo
  - [ ] Sistema de fallback
  - [ ] Migración gradual
  - [ ] **DEADLINE:** Junio 2026

---

## 💎 DECISIÓN ESTRATÉGICA: Opción B + Consolidación Legacy

### 1. 🛠️ Implementar Tablas Tenant (Opción B)

**Estado:** 🟡 EN IMPLEMENTACIÓN (8-15 Abril)  
**Razón:** Preparación para transición desde sistemas legacy  
**Documento:** [ACTUALIZACION_NOTARIA_CONTROLLER.md](development/ACTUALIZACION_NOTARIA_CONTROLLER.md)

**Plan:**
```
🔨 Fase 1: Tablas Tenant (Esta semana)
├── Actualizar NotariaController::createMinimalTables()
├── Agregar SQL de registro_web (116 columnas)
├── Agregar SQL de activity_log
├── Agregar SQL de search_histories
└── Testing con notarías de prueba

📁 Fase 2: Consolidación BDs Legacy (15-19 Abril)
├── Migraciones para tablas OFAC (11 tablas)
├── Migraciones para tablas SAT (4 tablas)
├── Migraciones para catálogos (estados, municipios, CPs)
├── Migraciones para aplicativos (registro, agenda)
├── Seeders para migrar datos históricos
└── php artisan migrate:fresh crea TODO

🎯 Resultado:
✓ BD Master auto-suficiente
✓ Sistema híbrido (lee legacy + escribe tenant)
✓ Preparado para deprecar legacy
✓ Infraestructura lista para servidores dedicados
```

**Documentos Clave:**
- [ACTUALIZACION_NOTARIA_CONTROLLER.md](development/ACTUALIZACION_NOTARIA_CONTROLLER.md) - Tablas tenant
- [FIX_CREACION_NOTARIA_Y_SYNC_CN.md](development/FIX_CREACION_NOTARIA_Y_SYNC_CN.md) - Fix creación + sync CN (Mayo 2026)
- [PLAN_CONSOLIDACION_BDS_LEGACY.md](development/PLAN_CONSOLIDACION_BDS_LEGACY.md) - Migraciones legacy

---

### 2. ⚠️ MEDIO: Activity Log Sin Auditoría en Tenants

**Estado:** 🟡 IDENTIFICADO  
**Impacto:** No hay tracking de cambios por notaría  
**Documento:** [ACTUALIZACION_NOTARIA_CONTROLLER.md](development/ACTUALIZACION_NOTARIA_CONTROLLER.md)

**Acción Requerida:**
```php
// Agregar tabla activity_log a NotariaController::createMinimalTables()
```

**Responsable:** Backend Team  
**Deadline:** Antes del 15 de Abril

---

### 3. ℹ️ PROCESO: Sincronización Manual en Dev

**Estado:** 🔵 DOCUMENTADO  
**Impacto:** Desarrolladores olvidan sincronizar, pruebas fallan  
**Documento:** [GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md](GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md)

**Solución:**
```bash
# Recordatorio en README y documentación
# Script .bat para sincronización rápida
```

**Responsable:** DevOps  
**Deadline:** Opcional (baja prioridad)

---

## 🎓 ONBOARDING PARA NUEVOS DESARROLLADORES

### Día 1: Setup Local

1. **Clonar repositorio**
   ```bash
   git clone [repo_url]
   cd Atinet_Compliance_Hub
   ```

2. **Instalar dependencias**
   ```bash
   composer install
   npm install
   ```

3. **Configurar .env**
   ```bash
   cp .env.example .env
   php artisan key:generate
   # Editar .env con credenciales de BD
   ```

4. **Crear BDs necesarias**
   ```sql
   CREATE DATABASE atinet_compliance_hub;
   CREATE DATABASE atinet65_listasofac;
   CREATE DATABASE atinet65_listassat;
   CREATE DATABASE atinet65_aplicativos;
   CREATE DATABASE atinet65_catalogos;
   ```

5. **Ejecutar migraciones**
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

6. **Sincronizar listas**
   ```bash
   php artisan blacklists:sync
   ```

### Día 2-3: Lectura de Documentación

1. **Leer:** [GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md](GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md) (30 min)
2. **Leer:** [ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md](architecture/ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md) (1 hora)
3. **Leer:** [LISTAS_NEGRAS_OFAC_SAT.md](LISTAS_NEGRAS_OFAC_SAT.md) (30 min)
4. **Explorar:** Código de NotariaController, BlacklistSyncService (2 horas)

### Día 4-5: Hands-On Tasks

1. **Crear notaría de prueba** vía UI
2. **Ejecutar búsqueda OFAC/SAT**
3. **Probar QR Scanner**
4. **Modificar un componente React simple**
5. **Ejecutar tests** (`php artisan test`)

---

## 📊 MÉTRICAS DEL SISTEMA

### Estado Actual (8 Abril 2026)

| Métrica | Valor |
|---------|-------|
| **Notarías Activas** | 50+ |
| **Usuarios Totales** | ~500 |
| **BDs Tenant** | 50+ |
| **Migraciones** | 30 archivos |
| **Tests Backend** | 150+ (90% coverage) |
| **Tests Frontend** | 50+ (Jest) |
| **OFAC Registros** | ~45,000 |
| **SAT Registros** | ~8,000 |
| **Búsquedas/mes** | ~2,000 |
| **Uptime** | 99.5% |

### Metas para Junio 2026

| Métrica | Meta |
|---------|------|
| **Notarías Distribuidas** | 50 (cada una en su servidor) |
| **Usuarios Totales** | 800 |
| **Uptime** | 99.9% |
| **Tests Backend** | 95% coverage |
| **Registro Web Completo** | 100% |

---

## 📞 CONTACTOS Y RECURSOS

### Equipo

- **Tech Lead:** [Nombre]
- **Backend Lead:** [Nombre]
- **Frontend Lead:** [Nombre]
- **DevOps:** [Nombre]
- **QA:** [Nombre]

### Recursos Externos

- **Hostgator:** 162.144.6.1 (credenciales en .env)
- **Soporte Hostgator:** soporte@hostgator.com
- **Documentación Laravel:** https://laravel.com/docs/12.x
- **Documentación Inertia:** https://inertiajs.com/

### Canales de Comunicación

- **Slack:** #atinet-compliance-dev
- **Slack Urgencias:** #atinet-compliance-urgente
- **Email:** equipo@atinet.com
- **Jira:** [Link al proyecto]

---

## 🔄 MANTENIMIENTO DE DOCUMENTACIÓN

### Responsabilidades

- **Tech Lead:** Revisar y aprobar cambios mayores
- **Developers:** Actualizar docs al hacer cambios en código
- **QA:** Actualizar checklists de testing
- **PM:** Actualizar roadmap y prioridades

### Proceso de Actualización

1. Modificar archivo .md correspondiente
2. Actualizar fecha en encabezado
3. Agregar entrada en CHANGELOG si aplica
4. Commit con mensaje: `docs: descripción del cambio`
5. Notificar en Slack si es cambio importante

### Revisión Trimestral

- **Cada 3 meses:** Revisar toda la documentación
- **Archivar:** Docs obsoletos a `docs/archive/`
- **Actualizar:** README.md con últimos cambios
- **Validar:** Enlaces no rotos

---

## 📝 CHANGELOG DE DOCUMENTACIÓN

### 8 de Abril, 2026
- ✅ Creado: ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md
- ✅ Creado: ACTUALIZACION_NOTARIA_CONTROLLER.md
- ✅ Creado: GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md
- ✅ Creado: INDICE_MAESTRO.md (este archivo)
- 📝 Motivo: Documentar sistema multi-tenant y sincronización

### [Agregar futuras actualizaciones aquí]

---

**Siguiente Revisión:** 15 de Abril, 2026  
**Responsable:** Tech Lead  
**Versión:** 2.0
