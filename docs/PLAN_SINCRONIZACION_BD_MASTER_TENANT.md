# 🔧 Plan de Sincronización BD Master → Tenant
## Problema: Cambios en BD Master sin Migraciones

**Fecha:** 20 de Marzo, 2026  
**Criticidad:** 🔴 **ALTA** - Bloquea producción  
**Status:** 📝 Análisis en progreso

---

## 🎯 Problema Identificado

### Situación Actual:
1. **BD Master** tiene cambios importantes desde la última `migrate:fresh`
2. Esos cambios **NO están en migraciones**  
3. Al crear un tenant (notaría nueva), su BD **NO incluye esos cambios**
4. **Riesgo:** Faltan tablas/columnas en BDs de tenants en producción

### Arquitectura Multi-Tenant del Sistema:
```
BD MASTER (atinet_compliance_hub)
├── Tablas centrales: notarias, plans, subscriptions, users (super_admin)
├── Datos globales: services, service_usage
└── Historial combinado: busquedas

BD TENANT (atinet_{estado}_notaria_{numero})
├── Tablas locales: users (admin_notaria, usuario_notaria)
├── Datos offline: configuracion, plans (copia), services (copia)
├── Operación local: agenda_events, aplicativos_agenda
└── Registros locales: busquedas (sincroniza a master)
```

---

## 📊 Análisis de Migraciones Existentes

### ✅ Migraciones Actuales (25 archivos):

#### **Core Tables (Laravel):**
- `0001_01_01_000000_create_users_table.php`
- `0001_01_01_000001_create_cache_table.php`
- `0001_01_01_000002_create_jobs_table.php`
- `2025_08_14_170933_add_two_factor_columns_to_users_table.php`

#### **Core Business (Fase 1):**
- `2026_02_05_200235_create_notarias_table.php`
- `2026_02_05_200252_create_busquedas_table.php`
- `2026_02_05_201051_add_notaria_id_to_users_table.php`
- `2026_02_05_210450_create_plans_table.php`
- `2026_02_05_210500_create_subscriptions_table.php`
- `2026_02_05_212550_add_plan_fields_to_notarias_table.php`
- `2026_02_05_215714_rename_codigo_to_numero_notaria_in_notarias_table.php`

#### **Services System (Fase 1.5 - 9 Feb):**
- `2026_02_09_042447_add_plain_password_to_users_table.php`
- `2026_02_09_182402_create_services_table.php`
- `2026_02_09_182531_create_plan_services_table.php`
- `2026_02_09_182641_create_tenant_services_table.php`
- `2026_02_09_182645_create_service_usage_table.php`
- `2026_02_09_194207_create_configuracion_table.php`
- `2026_02_09_215542_add_location_fields_to_notarias_table.php`

#### **Blacklists Improvements (Feb-Mar):**
- `2026_02_19_050006_make_notaria_id_nullable_in_busquedas_table.php`
- `2026_03_20_171918_create_search_histories_table.php` ← **DUPLICADA** (busquedas = search_histories)

#### **Legacy Integration (Mar):**
- `2026_03_09_231456_add_legacy_identifier_to_notarias_table.php`
- `2026_03_11_155847_change_notarias_unique_constraint.php`

#### **Agenda System (Mar):**
- `2026_03_13_192940_create_agenda_events_table.php`
- `2026_03_13_200528_add_rrule_to_agenda_events_table.php`
- `2026_03_17_205654_add_id_usuario_creador_to_aplicativos_agenda_table.php`

---

## ❌ Cambios en BD Master SIN Migraciones

### 🔍 **A Verificar con Query:**
Conectar a BD master y ejecutar:

```sql
-- 1. Listar TODAS las tablas en BD master
SHOW TABLES;

-- 2. Comparar con tablas en última BD tenant creada
USE atinet_bcs_notaria_21; -- o la última creada
SHOW TABLES;

-- 3. Identificar tablas FALTANTES en tenant
-- (ejecutar ambos queries y comparar manualmente)

-- 4. Verificar columnas de tablas críticas (pueden tener cambios)
DESCRIBE users;
DESCRIBE notarias;
DESCRIBE plans;
DESCRIBE services;
DESCRIBE busquedas;
DESCRIBE configuracion;
DESCRIBE plan_services;
DESCRIBE tenant_services;
DESCRIBE service_usage;
DESCRIBE agenda_events;
DESCRIBE aplicativos_agenda;
```

### 🚨 **Cambios Conocidos Probables (Documentados pero sin migración):**

#### 1. **Tabla `busquedas`** (cambios post-Feb 19):
- ✅ `notaria_id` nullable (migración existe)
- ❓ `tipo_busqueda` - cambios recientes?
- ❓ `resultados_ofac` - JSON con estructura específica?
- ❓ `resultados_sat` - JSON con estructura específica?
- ❓ `metadata` - campos adicionales?

#### 2. **Tabla `aplicativos_agenda`** (Mar 17):
- ✅ `id_usuario_creador` (migración existe)
- ❓ Otras columnas agregadas manualmente?

#### 3. **Tabla `agenda_events`** (Mar 13):
- ✅ `rrule` (migración existe)
- ❓ Otros campos agregados?

#### 4. **Tabla `notarias`** (múltiples cambios):
- ✅ `legacy_identifier` (migración existe)
- ✅ Unique constraint cambiado (migración existe)
- ✅ Campos de ubicación (migración existe)
- ❓ Otros campos custom?

#### 5. **Tabla `plans`**:
- ❓ Cambios en `herramientas_activas` (tipo de dato, valores)?
- ❓ Nuevas columnas?

#### 6. **Tabla `services`**:
- ❓ Nuevos servicios agregados manualmente (INSERT)?
- ❓ Cambios en estructura?

#### 7. **Tablas Legacy (si se integraron):**
- ❓ `usuarios_atinet_legacy` - tabla de mapeo?
- ❓ `notarias_legacy` - catálogo legacy?
- ❓ Otras tablas de integración?

---

## 🔧 Problemas en NotariaController.php

### 📍 Método `createMinimalTables()`:
**Ubicación:** Línea ~360  
**Problema:** Solo crea 6 tablas si fallan las migraciones:
- ✅ `users`
- ✅ `configuracion`
- ✅ `services`
- ✅ `plan_services`
- ✅ `tenant_services`
- ✅ `service_usage`

**Faltan:**
- ❌ `plans`
- ❌ `subscriptions` (?)
- ❌ `busquedas`
- ❌ `agenda_events`
- ❌ `aplicativos_agenda`
- ❌ Cualquier tabla agregada manualmente post-migración

### 📍 Método `runMigrationsForTenant()`:
**Ubicación:** Línea ~330  
**Problema:** Ejecuta `php artisan migrate --database=tenant_temp`
- ✅ Funciona SI todas las migraciones están completas
- ❌ NO funciona si hay cambios directos en BD master sin migración

### 📍 Método `copyEssentialData()`:
**Ubicación:** Línea ~560  
**Problema:** Solo copia:
- ✅ Configuración básica (4 valores)
- ✅ Plan contratado (1 registro)
- ✅ Servicios activos (todos los services)

**Faltan:**
- ❌ Plan-Services relationships
- ❌ Catálogos legacy (si existen)
- ❌ Datos esenciales de integración

---

## 📋 Plan de Acción (3 Fases)

### **FASE 1: AUDITORÍA Y DOCUMENTACIÓN** 🔍
**Duración:** 1-2 horas  
**Prioridad:** 🔴 INMEDIATA

#### Task 1.1: Auditoría de BD Master
- [ ] Conectar a BD master de desarrollo
- [ ] Ejecutar `SHOW TABLES` y documentar todas las tablas
- [ ] Para cada tabla, ejecutar `DESCRIBE {tabla}` y documentar estructura
- [ ] Comparar con migraciones existentes
- [ ] Identificar tablas/columnas SIN migración

#### Task 1.2: Auditoría de BD Tenant Ejemplo
- [ ] Conectar a última BD tenant creada (ej: `atinet_bcs_notaria_21`)
- [ ] Ejecutar `SHOW TABLES` y documentar
- [ ] Comparar con BD master
- [ ] **Listar diferencias específicas**

#### Task 1.3: Revisar Comandos Legacy
- [ ] Listar todos los comandos Artisan custom: `php artisan list`
- [ ] Identificar comandos de carga legacy:
  - Usuarios legacy: `php artisan import:usuarios-legacy`?
  - Notarías legacy: `php artisan import:notarias-legacy`?
  - Otros datos: ?
- [ ] Documentar qué hace cada comando
- [ ] Verificar si insertan datos en tablas que deben existir en tenant

#### **ENTREGABLE FASE 1:**
- Documento `AUDITORIA_BD_MASTER_TENANT.md` con:
  - Lista completa de tablas en master
  - Lista completa de tablas en tenant
  - Diferencias identificadas (tabla por tabla)
  - Lista de comandos legacy y su función
  - Prioridad de cada cambio faltante

---

### **FASE 2: CREAR MIGRACIONES FALTANTES** ⚙️
**Duración:** 2-4 horas  
**Prioridad:** 🟡 ALTA (después de Fase 1)

#### Task 2.1: Generar Migraciones para Cambios Directos
Para cada cambio identificado en Fase 1:

```bash
# Ejemplo: si falta una columna en busquedas
php artisan make:migration add_missing_columns_to_busquedas_table

# Ejemplo: si falta una tabla completa
php artisan make:migration create_missing_table_name
```

#### Task 2.2: Validar Migraciones en Fresh
- [ ] En ambiente de desarrollo, hacer backup de BD
- [ ] Ejecutar `php artisan migrate:fresh`
- [ ] Comparar estructura resultante con BD master actual
- [ ] Ajustar migraciones hasta que sean idénticas

#### Task 2.3: Actualizar `createMinimalTables()`
- [ ] Agregar ALL tablas críticas para fallback
- [ ] Incluir: `plans`, `busquedas`, `agenda_events`, `aplicativos_agenda`
- [ ] Verificar relaciones (foreign keys pueden fallar en fallback)

#### **ENTREGABLE FASE 2:**
- Nuevas migraciones creadas y validadas
- NotariaController.php actualizado con tablas completas
- Script de prueba: crear notaría test y verificar BD completa

---

### **FASE 3: AUTOMATIZAR CARGA DE DATOS LEGACY** 🤖
**Duración:** 2-3 horas  
**Prioridad:** 🟢 MEDIA (antes de producción)

#### Task 3.1: Consolidar Comandos Legacy

Crear UN solo comando maestro:
```bash
php artisan make:command SetupProductionData
```

Que ejecute en orden:
1. Seeders de catálogos (estados, municipios, etc.)
2. Import de usuarios legacy
3. Import de notarías legacy
4. Validación de integridad

#### Task 3.2: Agregar a Post-Deploy Script

Crear `scripts/post-deploy.sh`:
```bash
#!/bin/bash
# Post-deployment setup

echo "🚀 Ejecutando configuración post-deploy..."

# 1. Ejecutar migraciones pendientes
php artisan migrate --force

# 2. Cargar datos esenciales
php artisan db:seed --class=EssentialDataSeeder --force

# 3. Cargar datos legacy (solo si no existen)
php artisan setup:production-data --safe

# 4. Optimizar
php artisan optimize

echo "✅ Post-deploy completado"
```

#### Task 3.3: Documentar en README

Agregar sección "🔧 Deployment Checklist":
- Pre-requisitos
- Orden de comandos
- Verificación post-deploy
- Troubleshooting común

#### **ENTREGABLE FASE 3:**
- Comando `setup:production-data` funcional
- Script `post-deploy.sh` listo
- Documentación actualizada en README.md

---

## 🎯 Riesgos y Mitigaciones

### Riesgo 1: **Tenants Existentes Incompletos**
**Descripción:** Si ya hay tenants creados en desarrollo/staging, les faltan tablas  
**Impacto:** 🔴 CRÍTICO - Sistema no funcionará para esos tenants  
**Mitigación:**
- [ ] Identificar todos los tenants existentes: `SHOW DATABASES LIKE 'atinet_%'`
- [ ] Para cada uno, ejecutar migraciones faltantes manualmente
- [ ] Crear comando de "reparación": `php artisan repair:tenant-database {notaria_id}`

### Riesgo 2: **Migraciones con Dependencias de Datos**
**Descripción:** Algunas tablas requieren datos existentes (ej: foreign keys)  
**Impacto:** 🟡 ALTO - Migraciones pueden fallar  
**Mitigación:**
- [ ] Ordenar migraciones correctamente (dependencias primero)
- [ ] Usar `->nullable()` en foreign keys inicialmente
- [ ] Seed data esencial ANTES de relaciones

### Riesgo 3: **Comandos Legacy No Idempotentes**
**Descripción:** Re-ejecutar comandos legacy puede duplicar datos  
**Impacto:** 🟢 MEDIO - Datos sucios pero no rompe sistema  
**Mitigación:**
- [ ] Agregar checks de existencia en comandos: `if (User::where(...)->exists()) return;`
- [ ] Flag `--safe` para saltear si ya existen datos
- [ ] Logs claros de qué se insertó vs qué se salteo

---

## ✅ Checklist de Validación Pre-Producción

### 🧪 Test 1: Crear Notaría Completa
- [ ] Crear notaría de prueba
- [ ] Verificar que su BD tiene TODAS las tablas
- [ ] No debe ejecutarse `createMinimalTables()` (migraciones deben funcionar)
- [ ] Logs limpios sin errores

### 🧪 Test 2: Migración Fresh Completa
- [ ] En ambiente limpio: `php artisan migrate:fresh`
- [ ] Ejecutar seeders: `php artisan db:seed`
- [ ] Crear notaría test
- [ ] Verificar BD tenant === BD master (estructura)

### 🧪 Test 3: Comandos Legacy
- [ ] Ejecutar todos los comandos legacy en orden
- [ ] Verificar datos insertados correctamente
- [ ] Re-ejecutar comandos, verificar idempotencia
- [ ] Sin duplicados ni errores

### 🧪 Test 4: Edgecases
- [ ] Crear notaría sin estado (debe usar 'default')
- [ ] Crear 2 notarías mismo estado/municipio/número (debe fallar unique)
- [ ] Eliminar notaría (debe limpiar todo correctamente)

---

## 📞 Siguiente Paso INMEDIATO

1. **AHORA:** Ejecutar queries de auditoría en BD master y documentar resultado
2. **Mañana:** Completar Fase 1 (auditoría completa)
3. **Esta semana:** Completar Fase 2 (migraciones faltantes)
4. **Antes de producción:** Completar Fase 3 (automatización)

---

## 📝 Notas Adicionales

### Observaciones del Código Actual:
- ✅ `runMigrationsForTenant()` usa `--force` (correcto para producción)
- ✅ Manejo de errores con try/catch y logs
- ⚠️ `createMinimalTables()` como fallback está bien, pero incompleto
- ⚠️ `copyEssentialData()` solo copia servicios, NO plan_services relationships
- 🔴 NO hay validación de que el tenant se creó correctamente

### Recomendaciones Arquitecturales:
1. **Short-term:** Completar migraciones faltantes (Fase 1-2)
2. **Medium-term:** Crear comando `validate:tenant-database {notaria_id}`
3. **Long-term:** Considerar herramienta como `spatie/laravel-multitenancy` para gestionar mejor

---

**Documento creado por:** Equipo de desarrollo  
**Próxima revisión:** Después de auditoría de BD (Fase 1)  
**Bloqueador para:** Paso a producción completa
