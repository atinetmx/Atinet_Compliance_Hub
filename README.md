# 📚 Índice de Documentación - Atinet Compliance Hub

**Última actualización:** 10 de Febrero, 2026

Este documento sirve como índice central de toda la documentación del proyecto. Aquí encontrarás referencias organizadas a todos los documentos técnicos, guías y recursos disponibles.

---

## 📖 Documentación Principal

### 🎯 Planificación y Arquitectura

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [PLAN_DESARROLLO_ATINET_COMPLIANCE_HUB.md](PLAN_DESARROLLO_ATINET_COMPLIANCE_HUB.md) | Plan general de desarrollo del proyecto | 📘 Actualizado |
| [PROPUESTA_TECNICA_SISTEMA_ATINET.md](PROPUESTA_TECNICA_SISTEMA_ATINET.md) | Propuesta técnica completa del sistema | 📘 Actualizado |
| [ARQUITECTURA_MULTI_TENANT.md](ARQUITECTURA_MULTI_TENANT.md) | Diseño de arquitectura multi-tenant | 📘 Actualizado |
| [DOCUMENTACION_PROYECTO.md](DOCUMENTACION_PROYECTO.md) | Documentación técnica master del proyecto | 📘 Actualizado |

### 🚀 Fases de Implementación

#### Fase 0 - Infraestructura Base
| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [FASE_0_COMPLETADO.md](FASE_0_COMPLETADO.md) | Resumen de infraestructura implementada | ✅ Completado |

#### Fase 1 - Multi-Tenant
| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [FASE_1_ESTRUCTURA_MULTI_TENANT.md](FASE_1_ESTRUCTURA_MULTI_TENANT.md) | Implementación de arquitectura multi-tenant | ✅ Completado |

#### Fase 1.5 - Servicios y Suscripciones
| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [FASE_1.5_SERVICIOS_Y_PLANES.md](FASE_1.5_SERVICIOS_Y_PLANES.md) | Sistema de servicios y planes de suscripción | 🚀 En Progreso (82%) |
| [RESUMEN_EJECUTIVO_FASE_1.5.md](RESUMEN_EJECUTIVO_FASE_1.5.md) | Resumen ejecutivo para gerencia | 📊 En Progreso |
| [CHECKLIST_FASE_1.5.md](CHECKLIST_FASE_1.5.md) | Checklist de tareas de la fase | ✅ Completado |
| [GESTION_SUSCRIPCIONES.md](GESTION_SUSCRIPCIONES.md) | Sistema completo de gestión de suscripciones | ✅ Completado |
| **[SISTEMA_VISUALIZACION_SUSCRIPCIONES.md](SISTEMA_VISUALIZACION_SUSCRIPCIONES.md)** | **📊 Sistema de gráficos interactivos** | **✅ Completado** |

---

## 🎨 Diseño y UX/UI

| Documento | Descripción | Estado |
|-----------|-------------|--------|
| [PALETA_COLORES_ATINET.md](PALETA_COLORES_ATINET.md) | Paleta de colores corporativa OKLCH | 🎨 Referencia |
| [CONVENCIONES.md](CONVENCIONES.md) | Convenciones de código y estilo | 📘 Actualizado |

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
- ✅ CRUD de servicios con categorías
- ✅ CRUD de planes con auto-sincronización
- ✅ Asignación de servicios a planes
- ✅ Servicios personalizados por notaría
- ✅ Sistema de límites y cuotas
- ✅ **Gestión completa de suscripciones**
- ✅ **Sistema automático de verificación de suscripciones vencidas**
- ✅ **Dashboard con visualización de datos interactiva**

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

**Documentación completa:** [SISTEMA_VISUALIZACION_SUSCRIPCIONES.md](SISTEMA_VISUALIZACION_SUSCRIPCIONES.md)

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

**Documentación completa:** [GESTION_SUSCRIPCIONES.md](GESTION_SUSCRIPCIONES.md)

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
- **Fase 1.5:** 🚀 82% Completada
- **Fase 2:** 📅 0% (No iniciada)

### Cobertura de Tests
- **15 tests** implementados
- **34 assertions** ejecutándose
- **100%** de tests pasando

### Documentación
- **12 documentos** principales
- **1 documento nuevo** de visualización
- **100%** de funcionalidades documentadas

---

**Última actualización:** 10 de Febrero, 2026  
**Mantenido por:** Equipo de Desarrollo ATINET  
**Versión:** 1.5.0

🚀 **Desarrollado con excelencia para ATINET Compliance Hub**
