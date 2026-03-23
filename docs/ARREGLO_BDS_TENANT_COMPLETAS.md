# Arreglo: BDs Tenant Completas

**Fecha:** 20 de Marzo, 2026  
**Problema:** BDs tenant creadas con tablas faltantes  
**Solución:** Actualizar `NotariaController` para crear todas las tablas críticas

---

## 🎯 Problema Identificado

Cuando se creaban notarías (tenants), la BD tenant se generaba **incompleta**:
- ❌ Le faltaba tabla `plans`
- ❌ Le faltaba tabla `busquedas` 
- ❌ Le faltaba tabla `agenda_events`

Esto ocurría cuando las migraciones fallaban y se ejecutaba el fallback `createMinimalTables()`.

---

## ✅ Solución Implementada

### Archivo Modificado:
`app/Http/Controllers/Admin/NotariaController.php`

### Cambios en `createMinimalTables()`:

**ANTES (6 tablas):**
- users
- configuracion
- services
- plan_services
- tenant_services
- service_usage

**DESPUÉS (9 tablas):**
- users
- configuracion
- services
- plan_services
- tenant_services
- service_usage
- **✨ plans** (catálogo de planes)
- **✨ busquedas** (historial de búsquedas)
- **✨ agenda_events** (eventos de agenda)

### `copyEssentialData()` ya incluía:
✅ Plan contratado  
✅ Plan_services (relaciones plan-servicio con límites)  
✅ Tenant_services (customizaciones si existen)

---

## 🧪 Próximos Pasos (Validación)

### 1. Borrar BDs Tenant Existentes (Desarrollo)
```sql
-- Listar todas las BDs tenant
SHOW DATABASES LIKE 'atinet_%_notaria_%';

-- Borrar cada una (ejemplo)
DROP DATABASE IF EXISTS atinet_bcs_notaria_21;
DROP DATABASE IF EXISTS atinet_son_notaria_15;
-- etc.
```

### 2. Borrar Notarías en BD Master
```sql
USE atinet_compliance_hub;
DELETE FROM notarias WHERE id > 0; -- O usar WHERE específico
```

### 3. Crear Notaría de Prueba
- Ir a la UI: `/superadmin/notarias/create`
- Crear notaría con:
  - Estado: Baja California Sur (BCS)
  - Número: 99 (de prueba)
  - Plan: Básico (o el que esté activo)
  - Email: test@prueba.com
- Guardar

### 4. Verificar BD Tenant Completa
```sql
-- Conectar a la nueva BD tenant
USE atinet_bcs_notaria_99;

-- Verificar que tenga TODAS las tablas
SHOW TABLES;

-- Debe mostrar (al menos):
-- - users
-- - configuracion
-- - services
-- - plan_services
-- - tenant_services
-- - service_usage
-- - plans (✨ nueva)
-- - busquedas (✨ nueva)
-- - agenda_events (✨ nueva)

-- Verificar que tenga datos copiados
SELECT * FROM plans;           -- Debe tener el plan contratado
SELECT * FROM services;        -- Debe tener servicios activos
SELECT * FROM plan_services;   -- Debe tener relaciones plan-servicio
SELECT * FROM configuracion;   -- Debe tener 4 valores
SELECT * FROM users;           -- Debe tener usuario admin creado
```

### 5. Validar Login en Tenant
- Email: test@prueba.com
- Password temporal: admin123
- Debe poder hacer login exitoso
- Debe poder ver:
  - ✅ Dashboard
  - ✅ Agenda (vacía pero tabla existe)
  - ✅ Listas Negras (puede hacer búsquedas)
  - ✅ Configuración

---

## 📋 Checklist de Validación

- [ ] BDs tenant legacy borradas
- [ ] Notarías borradas de BD master
- [ ] Nueva notaría de prueba creada vía UI
- [ ] BD tenant `atinet_bcs_notaria_99` creada automáticamente
- [ ] SHOW TABLES muestra las 9 tablas mínimas
- [ ] Tabla `plans` tiene 1 registro (plan contratado)
- [ ] Tabla `services` tiene múltiples registros (catálogo)
- [ ] Tabla `plan_services` tiene relaciones
- [ ] Tabla `configuracion` tiene 4 valores
- [ ] Tabla `users` tiene 1 admin
- [ ] Login funcional con admin@prueba.com
- [ ] Dashboard visible sin errores
- [ ] Búsquedas OFAC/SAT funcionan (tabla `busquedas` existe)
- [ ] Agenda visible (tabla `agenda_events` existe)

---

## 🔄 Migración de Datos Legacy

Las tablas están listas, los **datos legacy** se cargarán después con:

```bash
# Migrar eventos de agenda (aplicativos.agenda → agenda_events)
php migrate_agenda_to_new_system.php --dry-run  # Revisar primero
php migrate_agenda_to_new_system.php            # Ejecutar migración

# Otros comandos legacy (si existen)
php artisan import:usuarios-legacy --dry-run
php artisan import:usuarios-legacy
```

Las BDs legacy se **actualizan remotamente desde Gator**, por eso no es crítico tener esos datos en desarrollo inmediatamente.

---

## 🎓 Aprendizajes

1. **Siempre agregar tablas críticas al fallback** (`createMinimalTables()`)
2. **Validar estructura completa** antes de migrar datos
3. **En desarrollo: borrar y recrear** es más rápido que reparar
4. **Documentar flujo de creación** para evitar inconsistencias futuras

---

## 📝 Notas Adicionales

### Tabla `aplicativos_agenda` NO existe
- **Legacy:** `atinet65_aplicativos.agenda` (Gator)
- **Nuevo:** `atinet_compliance_hub.agenda_events`
- **Migración:** Script `migrate_agenda_to_new_system.php`

### Tablas SOLO en Master (NO en tenant)
- `notarias` (solo existe en master, cada tenant no puede ver otras notarías)
- `subscriptions` (gestión central de suscripciones)

### Tablas sincronizadas Master ↔ Tenant
- `busquedas`: Se guardan local y se sincronizan al master
- `service_usage`: Registro local, consolidación en master

---

**Resultado Esperado:** Crear una notaría desde la UI genera automáticamente una BD tenant con **todas las tablas necesarias** para operar de forma completa, sin dependencia del master.
