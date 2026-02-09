# 📋 PLAN DE DESARROLLO - ATINET_COMPLIANCE_HUB

**Versión:** 1.0  
**Fecha:** 5 de Febrero, 2026  
**Estado:** En Planificación  
**Última actualización:** 5 Feb 2026

---

## 🎯 VISIÓN DEL PROYECTO

### Objetivo General
Construir **ATINET_COMPLIANCE_HUB** desde cero: una **plataforma SaaS multi-tenant integral** que centralice todas las herramientas y servicios de Atinet en un único ecosistema robusto, escalable y completamente funcional.

### Características Clave
- ✅ **Multi-tenant:** 21 notarías como clientes independientes
- ✅ **Híbrida:** Operación local en notarías + sincronización central
- ✅ **Integral:** Todas las herramientas de Atinet en una plataforma
- ✅ **Escalable:** Preparada para crecimiento futuro
- ✅ **Moderna:** Stack tech actual (Laravel 12, React, TypeScript)

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                               │
├─────────────────────────────────────────────────────────────────┤
│ • React 19 + TypeScript + Inertia.js v2                         │
│ • TailwindCSS v4 + Paleta Atinet (Azul #0066cc + Dorado)      │
│ • shadcn/ui + Radix UI                                          │
│ • Framer Motion (animaciones)                                   │
│ • Recharts (gráficas)                                           │
│ • Laravel Echo + WebSockets (real-time)                         │
└─────────────────────────────────────────────────────────────────┘
                           ↕️
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│ • Laravel 12 + PHP 8.2.12                                        │
│ • Laravel Fortify (autenticación + 2FA)                         │
│ • Laravel Reverb (WebSockets nativo)                            │
│ • Laravel Queue (jobs async)                                    │
│ • Laravel Notifications (broadcast + database)                  │
│ • Global Scopes (multi-tenancy)                                 │
└─────────────────────────────────────────────────────────────────┘
                           ↕️
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER                                   │
├─────────────────────────────────────────────────────────────────┤
│ • MySQL 8.0+ (base de datos principal)                          │
│ • Redis (cache + queue + sessions)                              │
│ • Storage (archivos y adjuntos)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Arquitectura Multi-Tenant Híbrida

```
┌──────────────────────────────────────────────────────────────┐
│                    NOTARÍA 1 (On-Premise)                     │
├──────────────────────────────────────────────────────────────┤
│  • Laravel local                                              │
│  • MySQL local                                                │
│  • Funcionamiento completo SIN internet                       │
│  • Usuarios internos (admin, usuarios, invitados)             │
└──────────────────────────────────────────────────────────────┘
                              ↓
                    (Sincronización API REST)
                              ↓
┌──────────────────────────────────────────────────────────────┐
│              ATINET CENTRAL (Servidor Central)                │
├──────────────────────────────────────────────────────────────┤
│  • Laravel central                                            │
│  • MySQL centralizado                                         │
│  • Panel administrativo (Super Admin)                         │
│  • Monitoreo de todas las notarías                            │
│  • Gestión de tickets y soporte                               │
│  • Reportes y estadísticas globales                           │
│  • Facturación y planes de suscripción                        │
│  • Gestión de usuarios y permisos                             │
└──────────────────────────────────────────────────────────────┘
```

### Modelo de Datos Multi-Tenant

```
TABLAS GLOBALES (sin notaria_id):
├── planes                    (planes de suscripción)
├── herramientas             (catálogo de servicios)
├── roles                    (roles del sistema)
└── permisos                 (permisos granulares)

TABLAS MULTI-TENANT (con notaria_id):
├── notarias                 (clientes de Atinet)
├── users                    (usuarios, incluye notaria_id)
├── tickets                  (soporte y gestión)
├── ticket_messages          (chat de tickets)
├── busquedas               (búsquedas en listas)
├── reportes                (reportes generados)
├── facturas                (facturación)
├── notificaciones          (notificaciones por tenant)
└── actividades             (audit trail)
```

---

## 📅 FASES DE DESARROLLO

### FASE 0: PREPARACIÓN (1-2 semanas)
**Objetivo:** Establecer la base sólida del proyecto

#### Tareas
- [x] Setup inicial de Laravel 12
- [x] Configurar estructura de carpetas según convenciones
- [x] Configurar autenticación base con Fortify
- [x] Crear estructura de componentes React
- [x] Implementar paleta de colores Atinet (TailwindCSS)
- [x] Configurar rutas base (web.php, console.php)
- [x] Setup de testing framework (Pest)
- [x] Documentación de convenciones

#### Deliverables
- ✅ Proyecto limpio y estructurado
- ✅ Convenciones de código establecidas
- ✅ Autenticación funcionando
- ✅ Paleta de colores implementada

---

### FASE 1: ARQUITECTURA MULTI-TENANT (2-3 semanas)
**Objetivo:** Implementar la estructura base de multi-tenancy

#### Tareas
- [x] Crear models: `Notaria`, `Plan`, `Subscription`
- [x] Crear migrations de tablas multi-tenant
- [x] Implementar `Global Scope` para filtrado automático
- [x] Crear trait `BelongsToNotaria` para modelos tenant
- [x] Crear middleware `EnsureTenantAccess`
- [x] Implementar policies de autorización
- [x] Crear factories y seeders
- [x] Tests de aislamiento de datos
- [x] Panel Super Admin para gestión de notarías
- [x] Creación automática de usuario admin por notaría
- [x] Creación automática de BD específica por tenant

#### Modelos a Crear
```php
// app/Models/
Notaria.php          // Cliente de Atinet ✅
Plan.php             // Plan de suscripción ✅
Subscription.php     // Suscripción activa de notaría ✅
```

#### Migrations a Crear
```php
// database/migrations/
2026_02_XX_create_notarias_table.php ✅
2026_02_XX_create_planes_table.php ✅
2026_02_XX_create_subscriptions_table.php ✅
2026_02_XX_add_notaria_id_to_users.php ✅
```

#### Deliverables
- ✅ Estructura multi-tenant funcional
- ✅ Aislamiento de datos garantizado
- ✅ Tests de seguridad pasando
- ✅ Panel administrativo super admin
- ✅ Gestión completa de tenants (crear/editar/listar)
- ✅ Creación automática de usuarios admin
- ✅ Creación automática de BD por tenant

---

### FASE 2: MODELO DE DATOS COMPLETO (2 semanas)
**Objetivo:** Implementar todas las tablas necesarias

#### Tareas
- [ ] Crear models: `Ticket`, `TicketMessage`, `Busqueda`, `Reporte`, `Factura`
- [ ] Crear migrations de todas las tablas
- [ ] Definir relaciones entre modelos
- [ ] Crear factories para testing
- [ ] Crear seeders para datos iniciales
- [ ] Documentar estructura ER

#### Modelos a Crear
```php
// Soporte
Ticket.php
TicketMessage.php
TicketAttachment.php
TicketHistory.php

// Búsquedas y Reportes
Busqueda.php
Reporte.php

// Facturación
Factura.php
FacturaItem.php

// Sistema
Notificacion.php
Actividad.php (audit trail)
```

#### Deliverables
- ✅ Todas las tablas creadas
- ✅ Relaciones implementadas
- ✅ Datos de prueba disponibles

---

### FASE 3: AUTENTICACIÓN Y AUTORIZACIÓN (1-2 semanas)
**Objetivo:** Sistema robusto de auth y permisos

#### Tareas
- [ ] Mejorar Fortify con configuración avanzada
- [ ] Implementar roles: super_admin, admin_notaria, usuario, invitado
- [ ] Crear sistema de permisos granulares por herramienta
- [ ] Implementar 2FA (two-factor authentication)
- [ ] Crear políticas (Policies) para cada modelo
- [ ] Crear middleware de validación de permisos
- [ ] Tests de autenticación

#### Roles del Sistema
```php
// Super Admin (Atinet)
- super_admin          → Acceso total a todo

// Admin Notaría
- admin_notaria        → Gestiona su notaría

// Usuario Regular
- usuario_notaria      → Acceso a herramientas asignadas

// Invitado
- invitado             → Acceso limitado
```

#### Deliverables
- ✅ Sistema de roles funcionando
- ✅ Permisos granulares implementados
- ✅ 2FA configurado

---

### FASE 4: PANEL ADMINISTRATIVO - NOTARÍA (2-3 semanas)
**Objetivo:** Dashboard para administradores de notaría

#### Tareas
- [ ] Crear layout administrativo (Inertia)
- [ ] Dashboard con métricas key (búsquedas, usuarios, tickets)
- [ ] CRUD de usuarios de la notaría
- [ ] Gestión de herramientas activas
- [ ] Vista de suscripción y facturación
- [ ] Logs de auditoría
- [ ] Componentes React para admin

#### Páginas a Crear
```
/admin
├── dashboard              (métricas y overview)
├── usuarios               (CRUD usuarios)
├── herramientas           (activar/desactivar)
├── suscripcion            (ver plan, renovar)
├── facturas               (ver historial)
├── tickets                (solo de su notaría)
├── reportes               (de su notaría)
└── auditoria              (logs)
```

#### Deliverables
- ✅ Panel administrativo funcional
- ✅ Gestión de usuarios
- ✅ Métricas en tiempo real

---

### FASE 5: SISTEMA DE TICKETS (2-3 semanas)
**Objetivo:** Soporte y chat en tiempo real

#### Tareas
- [ ] Crear modelo y migración de Tickets
- [ ] Implementar WebSockets (Laravel Reverb)
- [ ] Chat en tiempo real (ticket messages)
- [ ] Sistema de prioridades y estados
- [ ] Notificaciones en tiempo real (broadcast)
- [ ] Componentes React para tickets
- [ ] Asignación automática a soportistas

#### Flujo de Tickets
```
Cliente abre ticket
    ↓
Sistema notifica a soportista (broadcast)
    ↓
Chat en tiempo real (WebSocket)
    ↓
Resolución y cierre
    ↓
Notificación al cliente
```

#### Deliverables
- ✅ Sistema de tickets completo
- ✅ Chat en tiempo real
- ✅ Notificaciones en vivo

---

### FASE 6: PANEL ADMINISTRATIVO - ATINET (2-3 semanas)
**Objetivo:** Dashboard centralizado para Atinet

#### Tareas
- [ ] Super admin dashboard (todas las notarías)
- [ ] Gestión de planes y suscripciones
- [ ] Gestión de notarías (CRUD)
- [ ] Vista de tickets globales
- [ ] Reportes y analíticas globales
- [ ] Facturación y cobro
- [ ] Monitoreo de sincronización

#### Páginas a Crear
```
/superadmin
├── dashboard              (estadísticas globales)
├── notarias               (CRUD de clientes)
├── planes                 (gestionar planes)
├── subscripciones         (renovaciones, cancelaciones)
├── tickets                (todos los tickets)
├── facturas               (facturación global)
├── reportes               (analíticas avanzadas)
├── usuarios               (buscar/bloquear usuarios)
└── herramientas           (catálogo y acceso)
```

#### Deliverables
- ✅ Panel super admin funcional
- ✅ Gestión de suscripciones
- ✅ Reportes globales

---

### FASE 7: HERRAMIENTAS Y BÚSQUEDAS (2-3 semanas)
**Objetivo:** Implementar búsquedas en listas negras

#### Tareas
- [ ] Crear modelo `Busqueda`
- [ ] Implementar búsquedas OFAC
- [ ] Implementar búsquedas SAT
- [ ] Búsquedas cruzadas
- [ ] Búsquedas avanzadas
- [ ] Historial de búsquedas
- [ ] Componentes React para búsquedas

#### Tipos de Búsqueda
```
- OFAC              → Listas negras OFAC (USA)
- SAT               → Listas negras SAT (México)
- Cruzada           → Búsqueda en múltiples listas
- Avanzada          → Filtros y criterios complejos
```

#### Deliverables
- ✅ Búsquedas funcionando
- ✅ Resultados persistidos
- ✅ Historial disponible

---

### FASE 8: REPORTES Y EXPORTACIÓN (1-2 semanas)
**Objetivo:** Generación y exportación de reportes

#### Tareas
- [ ] Crear modelo `Reporte`
- [ ] Generación de reportes PDF
- [ ] Exportación a Excel/CSV
- [ ] Reportes programados (jobs)
- [ ] Envío de reportes por email
- [ ] Componentes React para reportes

#### Tipos de Reporte
```
- Búsquedas diarias
- Búsquedas mensuales
- Coincidencias encontradas
- Uso de herramientas
- Actividad de usuarios
- Facturación
```

#### Deliverables
- ✅ Generación de reportes
- ✅ Múltiples formatos
- ✅ Email automático

---

### FASE 9: API REST DE SINCRONIZACIÓN (2-3 semanas)
**Objetivo:** Comunicación entre notarías y central

#### Tareas
- [ ] Crear endpoints de API REST
- [ ] Implementar autenticación por token (Sanctum)
- [ ] Sincronización de datos
- [ ] Manejo de errores y reintentos
- [ ] Logging de sincronización
- [ ] Jobs para sync automático

#### Endpoints Base
```
POST   /api/auth/login              → Token
POST   /api/auth/logout             → Logout
GET    /api/notaria/status          → Estado de notaría
POST   /api/busquedas               → Registrar búsqueda
GET    /api/facturas                → Ver facturas
POST   /api/tickets                 → Crear ticket
GET    /api/notificaciones          → Notificaciones
```

#### Deliverables
- ✅ API REST funcional
- ✅ Autenticación segura
- ✅ Sincronización automática

---

### FASE 10: NOTIFICACIONES Y BROADCAST (1-2 semanas)
**Objetivo:** Sistema integral de notificaciones

#### Tareas
- [ ] Crear modelo `Notificacion`
- [ ] Implementar broadcast (WebSocket)
- [ ] Notificaciones por email
- [ ] Notificaciones por database
- [ ] Centro de notificaciones (UI)
- [ ] Preferencias de notificación

#### Tipos de Notificación
```
- Ticket creado/respondido
- Búsqueda completada
- Reporte generado
- Suscripción expirando
- Factura disponible
- Alerta del sistema
```

#### Deliverables
- ✅ Notificaciones en tiempo real
- ✅ Centro de notificaciones
- ✅ Email automático

---

### FASE 11: FACTURACIÓN Y PAGOS (1-2 semanas)
**Objetivo:** Sistema de facturación automático

#### Tareas
- [ ] Crear modelos `Factura`, `FacturaItem`
- [ ] Generación automática de facturas
- [ ] Cálculo de costos por plan
- [ ] Renovación automática de suscripciones
- [ ] Jobs para generación mensual
- [ ] PDF de factura
- [ ] Historial de pagos

#### Deliverables
- ✅ Facturación automática
- ✅ PDF de facturas
- ✅ Historial disponible

---

### FASE 12: TESTING Y QA (2 semanas)
**Objetivo:** Validación completa del sistema

#### Tareas
- [ ] Tests unitarios para todos los modelos
- [ ] Tests de integración (Pest)
- [ ] Tests de API REST
- [ ] Tests de multi-tenancy
- [ ] Tests de seguridad
- [ ] Tests de UI (componentes React)
- [ ] Coverage mínimo 80%

#### Deliverables
- ✅ Suite de tests completa
- ✅ Coverage > 80%
- ✅ Todos los tests pasando

---

### FASE 13: DOCUMENTACIÓN (1 semana)
**Objetivo:** Documentación completa para developers

#### Tareas
- [ ] API documentation (Swagger)
- [ ] Setup guide (instalación local)
- [ ] Architecture documentation
- [ ] Database schema diagram
- [ ] User guide (admin y usuario)
- [ ] Troubleshooting guide

#### Deliverables
- ✅ Documentación técnica
- ✅ Guías de usuario
- ✅ API docs

---

### FASE 14: DESPLIEGUE Y PRODUCCIÓN (1-2 semanas)
**Objetivo:** Deployment a producción

#### Tareas
- [ ] Configurar servidor de producción
- [ ] Setup de base de datos
- [ ] SSL/HTTPS
- [ ] Configurar Redis y Queue
- [ ] Monitoring y logs
- [ ] Backup strategy
- [ ] Disaster recovery plan

#### Deliverables
- ✅ Sistema en producción
- ✅ Monitoring activo
- ✅ Backups configurados

---

## 📊 TIMELINE ESTIMADO

```
FASE 0  (Prep)              → 2 semanas
FASE 1  (Multi-tenant)      → 3 semanas
FASE 2  (Modelo de datos)   → 2 semanas
FASE 3  (Auth)              → 2 semanas
FASE 4  (Admin Notaría)     → 3 semanas
FASE 5  (Tickets)           → 3 semanas
FASE 6  (Admin Atinet)      → 3 semanas
FASE 7  (Búsquedas)         → 3 semanas
FASE 8  (Reportes)          → 2 semanas
FASE 9  (API)               → 3 semanas
FASE 10 (Notificaciones)    → 2 semanas
FASE 11 (Facturación)       → 2 semanas
FASE 12 (Testing)           → 2 semanas
FASE 13 (Documentación)     → 1 semana
FASE 14 (Despliegue)        → 1-2 semanas

─────────────────────────────────────────
TOTAL: ~36-38 semanas (8-9 meses)
```

---

## 🎨 PALETA DE COLORES

### Colores Principales
- **Primary (Azul Atinet):** `#0066cc` / `oklch(0.45 0.12 240)`
- **Secondary (Dorado):** `#f5d06c` / `oklch(0.85 0.12 85)`
- **Accent (Dorado Brillante):** `#ffc107` / `oklch(0.80 0.15 85)`
- **Destructive (Rojo):** `oklch(0.577 0.245 27.325)`

### Modo Dark
- **Primary:** `#4d9fff` / `oklch(0.60 0.15 240)`
- **Secondary:** `#f9d45e` / `oklch(0.75 0.15 85)`
- **Background:** `oklch(0.18 0.015 240)`

---

## 🚀 CÓMO EMPEZAR

### Paso 1: Clonar y Setup
```bash
cd Atinet_Compliance_Hub
composer install
npm install
cp .env.example .env
php artisan key:generate
```

### Paso 2: Configurar BD
```bash
php artisan migrate
php artisan db:seed
```

### Paso 3: Desarrollo
```bash
# Terminal 1
npm run dev

# Terminal 2
php artisan serve

# Terminal 3 (opcional)
php artisan queue:listen
```

---

## 📝 CONVENCIONES

### Nombres de Archivos
- **Controllers:** `NombresPluralesController.php` (e.g., `NotariasController.php`)
- **Models:** `NombresSingularPascal.php` (e.g., `Notaria.php`)
- **Migrations:** `YYYY_MM_DD_HHMMSS_descripcion_table.php`
- **Views/Pages:** `PascalCase.tsx` (e.g., `NotariaDetail.tsx`)

### Estilo de Código
- PHP: Pint formatter (`vendor/bin/pint`)
- JavaScript/TypeScript: ESLint + Prettier
- Tests: Pest 3 con nomenclatura `test('descripción')`

---

## ✅ CHECKLIST FINAL

- [ ] Documentación leída y entendida
- [ ] Stack tecnológico confirmado
- [ ] Fases de desarrollo aprobadas
- [ ] Timeline acordado
- [ ] Equipo de desarrollo asignado
- [ ] Infraestructura de despliegue lista

---

**Siguiente paso:** Iniciar FASE 0 ✨
