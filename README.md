# 📚 Índice de Documentación - Atinet Compliance Hub PRUEBA GIT

**Última actualización:** 8 de Abril, 2026

Este documento sirve como índice central de toda la documentación del proyecto. Aquí encontrarás referencias organizadas a todos los documentos técnicos, guías y recursos disponibles.

---

## ⭐ DOCUMENTACIÓN ACTUALIZADA (8 Abril 2026)

### 🎯 INICIO RÁPIDO

| Documento | Para quién | Descripción |
|-----------|-----------|-------------|
| **[📋 Índice Maestro](docs/INDICE_MAESTRO.md)** | Todos | Índice completo de documentación por rol |
| **[⚡ Guía Rápida](docs/GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md)** | Desarrolladores | Comandos diarios, sincronización, troubleshooting |
| **[🏗️ Arquitectura Completa](docs/architecture/ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md)** | Tech Lead, Arquitectos | Multi-tenancy, sincronización, roadmap servidores dedicados |
| **[🔧 Actualización NotariaController](docs/development/ACTUALIZACION_NOTARIA_CONTROLLER.md)** | Backend PHP | 🚨 CRÍTICO - Migraciones faltantes, SQL completo |

### 💎 DECISIÓN ESTRATÉGICA (8 Abril 2026)

**1. Sistema de Registro Web - Opción B: Tablas Tenant**
- **Decisión:** Implementar tablas tenant AHORA (registro_web, activity_log, etc.)
- **Razón:** Preparación para transición desde sistemas legacy
- **Timeline:** 8-15 Abril (implementación), Mayo-Junio (servidores dedicados)
- **Ver:** [ACTUALIZACION_NOTARIA_CONTROLLER.md](docs/development/ACTUALIZACION_NOTARIA_CONTROLLER.md)

**2. Consolidación de BDs Legacy a BD Master**
- **Objetivo:** `php artisan migrate:fresh` crea TODAS las tablas (incluye OFAC, SAT, Catálogos, Aplicativos)
- **Beneficio:** BD Master auto-suficiente, desarrollo sin dependencia de Hostgator
- **Timeline:** 15-19 Abril (1 semana)
- **Ver:** [PLAN_CONSOLIDACION_BDS_LEGACY.md](docs/development/PLAN_CONSOLIDACION_BDS_LEGACY.md)

**3. Sistema de sincronización con Hostgator**
- **Producción:** Automático cada 15 minutos (durante transición)
- **Desarrollo:** php artisan db:seed --class=LegacyConsolidationSeeder
- **Ver:** [Guía Rápida](docs/GUIA_RAPIDA_SINCRONIZACION_Y_DESARROLLO.md)

---

## 📖 Documentación

### 🗂️ Por Categoría

| Categoría | Descripción | Ubicación |
|-----------|-------------|-----------|
| **Arquitectura** | Diseño técnico y arquitectura del sistema | [`docs/architecture/`](docs/architecture/) |
| **Desarrollo** | Guías de desarrollo, convenciones y referencias técnicas | [`docs/development/`](docs/development/) |
| **Diseño UI/UX** | Paletas de colores y guías de interfaz | [`docs/design/`](docs/design/) |
| **Fases del Proyecto** | Documentación organizada por fases de desarrollo | [`docs/phases/`](docs/phases/) |
| **Archivo** | Documentos históricos y obsoletos | [`docs/archive/`](docs/archive/) |

### 🚀 Por Fase de Implementación

#### Fase 0 - Infraestructura Base ✅ Completada
- [`FASE_0_COMPLETADO.md`](docs/phases/phase-0/FASE_0_COMPLETADO.md)

#### Fase 1 - Multi-Tenant ✅ Completada
- [`FASE_1_ESTRUCTURA_MULTI_TENANT.md`](docs/phases/phase-1/FASE_1_ESTRUCTURA_MULTI_TENANT.md)

#### Fase 1.5 - Servicios y Suscripciones 🚀 100% Completada
- [`FASE_1.5_SERVICIOS_Y_PLANES.md`](docs/phases/phase-1.5/FASE_1.5_SERVICIOS_Y_PLANES.md) - **Documento maestro consolidado**
  - ✅ Sistema de servicios y planes
  - ✅ Gestión completa de suscripciones
  - ✅ Sistema de visualización de datos con gráficos interactivos
- [`RESUMEN_EJECUTIVO_FASE_1.5.md`](docs/phases/phase-1.5/RESUMEN_EJECUTIVO_FASE_1.5.md) - Resumen para gerencia
- [`HELPERS_SERVICIOS.md`](docs/development/HELPERS_SERVICIOS.md) - Referencia técnica de funciones helper

**Documentos completados (archivados):**
- [`CHECKLIST_FASE_1.5.md`](docs/phases/phase-1.5/completed/CHECKLIST_FASE_1.5.md)
- [`NOTAS_PROXIMA_SESION.md`](docs/phases/phase-1.5/completed/NOTAS_PROXIMA_SESION.md)

#### Fase 2 - Búsqueda en Listas Negras (OFAC + SAT) ✅ Completada
- [`LISTAS_NEGRAS_OFAC_SAT.md`](docs/LISTAS_NEGRAS_OFAC_SAT.md) - **Sistema completo de búsqueda y PDFs**
  - ✅ Búsqueda en lista OFAC (Persona Física/Moral)
  - ✅ Búsqueda en lista SAT (RFC - Artículo 69-B)
  - ✅ Búsqueda combinada (OFAC + SAT)
  - ✅ Generación de reportes en PDF profesionales
  - ✅ Visualización detallada de múltiples resultados
  - ✅ Migración a tFPDF con soporte UTF-8 completo
  - ✅ Interfaz React/TypeScript con Shadcn UI
  - ✅ Rutas protegidas por middleware de suscripción

#### Módulo Agenda 📅 Completado (Marzo 2026)
- [`MODULO_AGENDA.md`](docs/MODULO_AGENDA.md) - **Sistema completo de gestión de calendario**
  - ✅ FullCalendar v7 con 3 tabs (Calendario, Citas del día, Bitácora)
  - ✅ Eventos recurrentes con RRule (RFC 5545)
  - ✅ Migración de 1,020 eventos legacy desde atinet65_aplicativos
  - ✅ View selector para admins ("Ver todo" / "Solo míos")
  - ✅ Modal read-only para eventos legacy compartidos
  - ✅ Drag & Drop y Resize de eventos
  - ✅ Sistema completo de permisos y visibilidad por notaría
  - ✅ 4 tipos de eventos (General, Cita, Recordatorio, Festivo)
  - ✅ Integración con React/TypeScript + Inertia.js v2
  - 📖 **[Integración Legacy](docs/AGENDA_INTEGRACION_LEGACY.md)** - Documentación técnica completa de integración con sistema VB6/PHP

#### Activity Logging System 📋 Completado (Marzo 2026)
- [`ACTIVITY_LOGGING_IMPLEMENTACION.md`](docs/ACTIVITY_LOGGING_IMPLEMENTACION.md) - **Sistema de registro de actividades**
  - ✅ Spatie Laravel Activity Log v4.12.3 instalado y configurado
  - ✅ 5 modelos con logging automático (Agenda, Búsquedas, Suscripciones, Usuarios, Notarías)
  - ✅ Bitácora mejorada que combina activity_log + datos legacy
  - ✅ Seguimiento de operaciones create, update, delete con properties JSON
  - ✅ Filtros inteligentes por notaría y usuario
  - ✅ Causer automático en peticiones HTTP
  - ✅ Visualización en pestaña Bitácora del módulo Agenda
  - ✅ Issues resueltos: Error 500 (Collection merge) + whereHasMorph filter

### 📘 Documentos de Referencia Rápida

| Documento | Descripción | Ubicación |
|-----------|-------------|-----------|
| `CONVENCIONES.md` | Convenciones de código PHP/Laravel/TypeScript | [`docs/development/`](docs/development/CONVENCIONES.md) |
| `HELPERS_SERVICIOS.md` | Funciones helper de servicios | [`docs/development/`](docs/development/HELPERS_SERVICIOS.md) |
| `PALETA_COLORES_ATINET.md` | Paleta de colores corporativa | [`docs/design/`](docs/design/PALETA_COLORES_ATINET.md) |
| `LISTAS_NEGRAS_OFAC_SAT.md` | 📘 Documentación técnica completa búsqueda | [`docs/`](docs/LISTAS_NEGRAS_OFAC_SAT.md) |
| `CAMBIOS_TECNICOS_FASE_2.md` | 🔧 Cambios y migraciones Fase 2 | [`docs/`](docs/CAMBIOS_TECNICOS_FASE_2.md) |
| `GUIA_RAPIDA_LISTAS_NEGRAS.md` | ⚡ Troubleshooting y comandos rápidos | [`docs/`](docs/GUIA_RAPIDA_LISTAS_NEGRAS.md) |
| `INDICE_FASE_2.md` | 📑 Índice completo de Fase 2 | [`docs/`](docs/INDICE_FASE_2.md) |

---

## 🛠️ Funcionalidades Implementadas

### Sistema de Autenticación
- ✅ Laravel Fortify configurado
- ✅ Autenticación por email
- ✅ Two-Factor Authentication (2FA)
- ✅ Migración de usuarios desde sistema anterior

### Sistema Multi-Tenant
- ✅ Arquitectura Shared Database
- ✅ Gestión de notarías (CRUD completo)
- ✅ Usuarios por notaría con roles
- ✅ Aislamiento de datos por tenant

### Sistema de Servicios y Planes (Fase 1.5)
- ✅ CRUD completo de servicios y planes
- ✅ Control de límites de uso por suscripción
- ✅ Dashboard con gráficos interactivos (Chart.js)
- ✅ Gestión de suscripciones automáticas
- ✅ Verificación automática de vencimientos

### Sistema de Búsquedas en Listas Negras (Fase 2)
- ✅ Búsqueda OFAC (Persona Física/Moral)
- ✅ Búsqueda SAT (RFC - Artículo 69-B)
- ✅ Búsqueda combinada (OFAC + SAT)
- ✅ Generación de PDFs profesionales (tFPDF)
- ✅ Visualización detallada de múltiples resultados
- ✅ Middleware de protección por suscripción

### Sistema de Agenda (Módulo Agenda)
- ✅ Calendario completo con FullCalendar v7
- ✅ 3 tabs: Calendario, Citas del día, Bitácora
- ✅ Eventos recurrentes (Diario, Semanal, Mensual, Anual)
- ✅ View selector ("Ver todo" / "Solo míos") para admins
- ✅ 4 tipos de eventos: General, Cita, Recordatorio, Festivo
- ✅ Drag & Drop y Resize de eventos
- ✅ Migración de 1,020 eventos legacy de 'atinet'
- ✅ Modal read-only para eventos legacy compartidos
- ✅ Sistema de permisos multi-nivel (Super Admin, Admin Notaría, Usuario)
- ✅ Integración con sistema legacy para bitácora de actividades

### Sistema de Activity Logging (Auditoría)
- ✅ **Spatie Activity Log v4.12.3** instalado y configurado
- ✅ **5 modelos con logging automático:**
  - AgendaEvent (log_name: 'agenda')
  - Busqueda (log_name: 'listas_negras')
  - Subscription (log_name: 'suscripciones')
  - User (log_name: 'usuarios')
  - Notaria (log_name: 'notarias')
- ✅ **Tabla activity_log:** Estructura completa con subject/causer polymorphic
- ✅ **Properties JSON:** Before/after data en cada operación
- ✅ **Bitácora mejorada:** Combina logs nuevos + legacy (atinet65_aplicativos.log)
- ✅ **Filtros inteligentes:** Por notaría, usuario, fecha
- ✅ **Causer automático:** Detecta usuario autenticado en peticiones HTTP
- ✅ **Eventos tracked:** created, updated, deleted con descripciones personalizadas
- ✅ **Visualización:** Pestaña Bitácora en módulo Agenda
- ✅ **Issues resueltos:** Error 500 + filtro whereHasMorph para eventos eliminados
- ✅ CRUD de servicios con categorías
- ✅ CRUD de planes con auto-sincronización
- ✅ Asignación de servicios a planes
- ✅ Servicios personalizados por notaría
- ✅ Sistema de límites y cuotas
- ✅ **Gestión completa de suscripciones**
- ✅ **Sistema automático de verificación de suscripciones vencidas**
- ✅ **Dashboard con visualización de datos interactiva**

### Búsqueda en Listas Negras (Fase 2) ✨ NUEVO
- ✅ **4 tipos de búsqueda:** Persona Física, Persona Moral, RFC, Combinada
- ✅ **OFAC List:** Búsqueda de personas y empresas en lista negra OFAC
- ✅ **SAT Artículo 69-B:** Búsqueda de RFC en lista de incumplimiento del SAT
- ✅ **Visualización detallada:** Resultados con multiple coincidencias
- ✅ **Generación de PDFs profesionales:** Reportes idénticos al sistema legacy
- ✅ **tFPDF v1.33:** UTF-8 completo, PHP 8.2+ compatible, sin deprecaciones
- ✅ **Interfaz SuperAdmin:** React/TypeScript con Shadcn UI
- ✅ **Protección:** Middleware de suscripción + servicio habilitado

---

## 📊 Sistema de Visualización de Suscripciones

### Características Destacadas

El sistema incluye un potente dashboard de análisis visual con:

#### 4 Tipos de Gráficos Interactivos
- 🥧 **Circular (Pie)** - Vista de proporciones con porcentajes
- 📊 **Barras (Bar)** - Comparación directa entre estados
- 🎯 **Radial** - Visualización de progreso circular
- 🗺️ **Mapa de Árbol (Treemap)** - Visualización jerárquica

#### Funcionalidades
- ✅ Selector interactivo para cambiar entre tipos
- ✅ Persistencia de preferencias con localStorage
- ✅ Paleta de colores consistente por estado
- ✅ Responsive y adaptable
- ✅ TypeScript con tipado completo
- ✅ Powered by Recharts 2.x

**Documentación completa:** [FASE_1.5_SERVICIOS_Y_PLANES.md - Sistema de Visualización](docs/phases/phase-1.5/FASE_1.5_SERVICIOS_Y_PLANES.md#-sistema-de-visualización-de-datos)

---

## 🔄 Sistema de Suscripciones

### Estados de Suscripción

| Estado | Descripción | Acceso | Notaría Activa |
|--------|-------------|--------|----------------|
| **trial** | Período de prueba (1 mes) | ✅ Completo | ✅ Sí |
| **activa** | Suscripción pagada vigente | ✅ Completo | ✅ Sí |
| **vencida** | Venció, en período de gracia | ✅ Completo | ✅ Sí (7 días) |
| **suspendida** | Suspendida por falta de pago | ❌ Sin acceso | ❌ No |
| **cancelada** | Cancelada definitivamente | ❌ Sin acceso | ❌ No |

### Verificación Automática

**Comando:** `php artisan subscriptions:check-expired`  
**Frecuencia:** Diario a las 2:00 AM (America/Mexico_City)  
**Lógica:**
- Trial vencido → Desactivar inmediatamente
- Pago vencido → Período de gracia 7 días
- Gracia agotada → Suspender y desactivar

**Documentación completa:** [FASE_1.5_SERVICIOS_Y_PLANES.md - Gestión de Suscripciones](docs/phases/phase-1.5/FASE_1.5_SERVICIOS_Y_PLANES.md#-gestión-del-ciclo-de-vida-de-suscripciones)

---

## 🎯 Recursos Técnicos

### Scripts Útiles

| Script | Descripción | Comando |
|--------|-------------|---------|
| `add_sample_subscriptions.php` | Crear suscripciones de ejemplo para testing | `php add_sample_subscriptions.php` |
| `copy_plan_and_services.php` | Copiar planes entre entornos | `php copy_plan_and_services.php` |
| `verify_tenant_data.php` | Verificar integridad de datos multi-tenant | `php verify_tenant_data.php` |
| `fix_tenant_data.php` | Reparar datos de tenant | `php fix_tenant_data.php` |

### Comandos Artisan Personalizados

```bash
# Verificar suscripciones vencidas
php artisan subscriptions:check-expired

# Modo dry-run (sin modificar datos)
php artisan subscriptions:check-expired --dry-run

# Ver comandos programados
php artisan schedule:list
```

---

## 🧪 Testing

### Cobertura de Tests

```bash
# Ejecutar todos los tests
php artisan test --compact

# Ejecutar tests específicos
php artisan test --filter=CheckExpiredSubscriptions
php artisan test --filter=SubscriptionNotariaActivation

# Con cobertura
php artisan test --coverage
```

### Tests Implementados

#### Comandos
- ✅ CheckExpiredSubscriptionsTest (7 tests, 16 assertions)
  - Trial expiration
  - Paid subscription grace period
  - Suspension after grace period
  - Dry-run mode

#### Controllers
- ✅ SubscriptionNotariaActivationTest (8 tests, 18 assertions)
  - Create subscription activates notaría
  - Update subscription activates/deactivates notaría
  - Change status reflects in notaría
  - Renew subscription activates notaría

**Total:** 15 tests, 34 assertions ✅

---

## 📂 Estructura del Proyecto

```
Atinet_Compliance_Hub/
├── app/
│   ├── Console/Commands/
│   │   └── CheckExpiredSubscriptions.php
│   ├── Http/Controllers/
│   │   ├── Admin/
│   │   │   ├── SubscriptionController.php
│   │   │   ├── ServiceController.php
│   │   │   └── PlanController.php
│   │   └── Tenant/
│   ├── Models/
│   │   ├── Subscription.php
│   │   ├── Plan.php
│   │   ├── Service.php
│   │   └── Notaria.php
│   └── Providers/
├── database/
│   ├── migrations/
│   └── seeders/
├── resources/
│   ├── js/
│   │   └── Pages/
│   │       └── Admin/
│   │           └── Subscriptions/
│   │               └── Index.tsx  ← Dashboard con gráficos
│   └── views/
├── routes/
│   ├── web.php
│   └── console.php
├── tests/
│   ├── Feature/
│   │   ├── Admin/
│   │   │   └── SubscriptionNotariaActivationTest.php
│   │   └── Commands/
│   │       └── CheckExpiredSubscriptionsTest.php
│   └── Unit/
└── Documentation/
    ├── GESTION_SUSCRIPCIONES.md
    ├── SISTEMA_VISUALIZACION_SUSCRIPCIONES.md
    └── [otros documentos...]
```

---

## 🚀 Próximos Pasos

### Fase 1.5 - Completar (18% restante)
- ⏳ ServiceAccessManager (lógica de negocio)
- ⏳ Middleware de control de acceso
- ⏳ Features avanzados de reportes

### Fase 2 - Herramientas de Cumplimiento
- 📅 Integración API SAT
- 📅 Integración API OFAC
- 📅 Sistema de búsqueda en listas negras
- 📅 Generación automática de reportes

### Fase 3 - Funcionalidades Avanzadas
- 📅 Dashboard analítico avanzado
- 📅 Sistema de alertas y notificaciones
- 📅 Exportación de datos
- 📅 API pública para integraciones

---

## 🔧 Configuración del Entorno

### Requisitos
- PHP 8.2.12+
- Node.js 18+
- MySQL 8.0+
- Composer 2.x
- npm/yarn

### Variables de Entorno Críticas

```env
# Base de datos principal
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=atinet65_aplicativos

# Zona horaria
APP_TIMEZONE=America/Mexico_City

# Inertia.js
INERTIA_SSR_ENABLED=false
```

---

## 📞 Contacto y Soporte

### Equipo de Desarrollo
**Email:** dev@atinet.com  
**Disponible para:** Dudas técnicas, demos, reuniones

### Reportar Issues
**GitHub Issues:** [github.com/spartha1/Atinet_Compliance_Hub](https://github.com/spartha1/Atinet_Compliance_Hub)

---

## 📝 Convenciones de Documentación

### Símbolos de Estado
- ✅ **Completado** - Funcionalidad 100% implementada y testeada
- 🚀 **En Progreso** - Desarrollo activo
- ⏳ **Pendiente** - Planificado pero no iniciado
- 📅 **Futuro** - Roadmap de largo plazo
- 📘 **Actualizado** - Documentación al día
- 🎨 **Referencia** - Guía de estilo o diseño
- 📊 **Análisis** - Documentos de datos y estadísticas

### Formato de Documentos
- Todos los documentos en **Markdown**
- Usar **Mermaid** para diagramas
- Incluir ejemplos de código siempre que sea posible
- Mantener tabla de contenidos actualizada
- Fecha de última actualización en header

---

## 🎯 Métricas del Proyecto

### Progreso General
- **Fase 0:** ✅ 100% Completada
- **Fase 1:** ✅ 100% Completada
- **Fase 1.5:** ✅ 100% Completada
- **Fase 2:** ✅ 100% Completada (Listas Negras OFAC + SAT)

### Cobertura de Tests
- **15+ tests** implementados
- **34+ assertions** ejecutándose
- **100%** de tests pasando

### Documentación
- **15+ documentos** principales
- **4 documentos nuevos** Fase 2 (Búsqueda, Cambios, Guía Rápida, Índice)
- **100%** de funcionalidades documentadas

---

**Última actualización:** 13 de Febrero, 2026  
**Mantenido por:** Equipo de Desarrollo ATINET / GitHub Copilot  
**Versión:** 2.0.0

🚀 **Desarrollado con excelencia para ATINET Compliance Hub**
