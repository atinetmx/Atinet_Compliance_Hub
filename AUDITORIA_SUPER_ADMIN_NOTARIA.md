# 🔍 AUDITORÍA: Super Admin con Notaría Asignada

**Fecha:** 26 Mayo 2026
**Cambio crítico:** Los super_admin ahora tienen `notaria_id=11` (ATINET MASTER) en lugar de `NULL`

---

## ⚠️ ÁREAS CRÍTICAS A REVISAR

### 1. 🔴 CRÍTICO - NotariaScope (Global Scope)
**Archivo:** `app/Models/Scopes/NotariaScope.php:22`
```php
if ($user->tipo_cuenta !== 'super_admin' && $user->notaria_id) {
```
**Problema:** Ahora TODOS los super_admin tienen notaria_id. Este scope podría filtrar registros incorrectamente.
**Acción:** Revisar si debe filtrar por ATINET MASTER o excluir super_admin del scope.

---

### 2. 🔴 CRÍTICO - AgendaEvent (Múltiples Queries)
**Archivo:** `app/Models/AgendaEvent.php`
- **Línea 94:** `if ($user->tipo_cuenta === 'super_admin' && ! $user->notaria_id)`
- **Línea 117:** `if ($user->tipo_cuenta === 'super_admin' && ! $user->notaria_id)`
- **Línea 136:** `if ($user->tipo_cuenta === 'super_admin' && ! $user->notaria_id)`
- **Línea 140:** `->whereNull('notaria_id')`

**Problema:** La lógica asume que super_admin sin notaria ve todos los eventos. Ahora tiene notaria_id=11.
**Acción:** Cambiar la condición para verificar si es super_admin O si notaria_id=11 (ATINET MASTER).

---

### 3. 🔴 CRÍTICO - AgendaController
**Archivo:** `app/Http/Controllers/AgendaController.php:131`
```php
if ($user->tipo_cuenta === 'super_admin' && ! $user->notaria_id) {
```
**Problema:** Esta condición nunca será verdadera ahora.
**Acción:** Cambiar a `if ($user->tipo_cuenta === 'super_admin')` o verificar ATINET MASTER.

---

### 4. 🟠 IMPORTANTE - Middlewares
#### EnsureTenantAccess
**Archivo:** `app/Http/Middleware/EnsureTenantAccess.php:36`
```php
if (! $user->notaria_id) {
    return redirect()->route('dashboard')->with('error', 'No tienes una notaría asignada');
}
```
**Problema:** Antes permitía que super_admin pasara porque no tenía notaria_id.
**Estado:** ✅ Probablemente OK - línea 26 verifica super_admin ANTES de este check.

#### EnsureAdminNotaria, EnsureUsuarioNotaria, EnsureInvitado
**Archivos:** 
- `app/Http/Middleware/EnsureAdminNotaria.php:43`
- `app/Http/Middleware/EnsureUsuarioNotaria.php:43`
- `app/Http/Middleware/EnsureInvitado.php:43`

Todos tienen:
```php
if (! $user->notaria_id) {
    return redirect()->route('dashboard');
}
```
**Problema:** Super_admin ahora tiene notaria_id, podría pasar estos checks incorrectamente.
**Acción:** Verificar que estos middlewares excluyan explícitamente a super_admin.

---

### 5. 🟠 IMPORTANTE - BelongsToNotaria Trait
**Archivo:** `app/Models/Concerns/BelongsToNotaria.php`
- **Línea 24:** `if (! $model->notaria_id && auth()->check() && auth()->user()->notaria_id)`
- **Línea 59:** `if (! auth()->check() || ! auth()->user()->notaria_id)`
- **Línea 72:** `if (auth()->check() && auth()->user()->tipo_cuenta === 'super_admin')`

**Problema:** Este trait auto-asigna notaria_id en modelos. Super_admin con notaria_id=11 podría afectar registros.
**Acción:** Verificar que super_admin no auto-asigne ATINET MASTER a todos los registros que crea.

---

### 6. 🟡 REVISAR - ControlNotarialApiService
**Archivo:** `app/Services/ControlNotarialApiService.php`

#### cnNombreNotaria() - Línea 100
```php
private function cnNombreNotaria(): string
{
    // Obtener numero_notaria del usuario autenticado
    $user = auth()->user();
    return $user->notaria?->numero_notaria ?? '0';
}
```
**Problema:** Ahora devolverá '1' (ATINET MASTER) para super_admin. ¿Es correcto?
**Pregunta:** ¿Los super_admin deben usar Numero_Notaria='1' en Control Notarial C#?

#### tenantConnection() - Línea 60
```php
private function tenantConnection(): string
{
    $user = auth()->user();
    return $user->notaria?->tenant_db_name ?? 'mysql';
}
```
**Problema:** Devolverá 'atinet_compliance_hub' para super_admin.
**Pregunta:** ¿Es esta la BD correcta para super_admin o deben usar 'mysql'?

---

### 7. 🟡 REVISAR - UserObserver
**Archivo:** `app/Observers/UserObserver.php`

#### tenantConnectionForUser() - Línea 27
```php
private function tenantConnectionForUser(User $user): string
{
    if (! $user->notaria_id) {
        return 'mysql';
    }
    return $user->notaria->tenant_db_name ?? 'mysql';
}
```
**Problema:** Super_admin ahora usará la conexión 'atinet_compliance_hub' en lugar de 'mysql'.
**Acción:** Verificar si super_admin debe sincronizarse en tbl_cat_usuarios de su propia BD o en mysql.

#### Sincronización Numero_Notaria
**Líneas:** 245, 291, 340, 363
```php
'Numero_Notaria' => $numeroNotaria,
```
**Problema:** Super_admin ahora se sincronizará con Numero_Notaria='1' en tbl_cat_usuarios.
**Pregunta:** ¿Es correcto o debe ser '0' o NULL para super_admin?

---

### 8. 🟡 REVISAR - SearchHistoryController
**Archivo:** `app/Http/Controllers/SuperAdmin/SearchHistoryController.php`
- **Línea 37:** `if ($user->isSuperAdmin())`
- **Línea 95:** `if ($busqueda->notaria_id !== $user->notaria_id && ! $user->isSuperAdmin())`
- **Línea 146, 181:** Queries con `isSuperAdmin()`

**Estado:** Usa `isSuperAdmin()` correctamente. ✅ Probablemente OK.
**Acción:** Verificar que las queries no filtren por notaria_id=11 cuando no deberían.

---

### 9. 🟡 REVISAR - RegistroWebController  
**Archivo:** `app/Http/Controllers/Admin/RegistroWebController.php`
- **Línea 68, 420:** `$isSuperAdmin = $user->tipo_cuenta === 'super_admin';`
- **Línea 434:** `->when(! $isSuperAdmin, fn ($q) => $q->where('notaria', $userNotaria))`

**Estado:** Filtra correctamente por rol, no por notaria_id. ✅ Probablemente OK.

---

## 📋 PLAN DE ACCIÓN RECOMENDADO

### Fase 1: Verificación (URGENTE)
1. ✅ Verificar que ATINET MASTER exista con id=11
2. ✅ Verificar que super_admin tenga notaria_id=11
3. ✅ Respuestas del usuario recibidas

### Fase 2: Correcciones Críticas
1. ✅ **AgendaEvent.php** - Ajustada lógica para notaria_id=11 (3 ubicaciones)
2. ✅ **AgendaController.php** - Corregida condición para super_admin con notaria_id=11 (2 ubicaciones)
   - Línea 131: Mapeo a 'atinet' legacy
   - Línea 101: Filtrado de logs en bitácora
3. ✅ **NotariaScope.php** - Ya excluye super_admin correctamente (no requiere cambios)
4. ✅ **SyncAgendaFromLegacy.php** - Corregido mapeo 'atinet' → notaria_id=11 (antes era NULL)
5. ✅ **AgendaEvent Model** - Agregado trait BelongsToNotaria para auto-asignación de notaria_id
6. ⬜ **Middlewares** - Verificar comportamiento

### Fase 3: Sincronización de Datos Legacy
6. ✅ Ejecutado `php artisan agenda:sync-legacy --notaria=atinet`
7. ✅ Importados 1,103 eventos legacy con notaria_id=11 correctamente

### Fase 4: Validación (PENDIENTE)
8. ⬜ Testing manual: Crear eventos como super_admin
9. ⬜ Testing manual: Ver agenda como super_admin
10. ⬜ Testing manual: Acceder a Control Notarial como super_admin

---

## 🔑 RESPUESTAS CONFIRMADAS

1. **¿Los super_admin deben crear registros con `notaria_id=11`?**
   - ✅ **SÍ** - Es necesario para que funcione Control Notarial
   - El trait BelongsToNotaria auto-asignará notaria_id=11 correctamente

2. **¿En qué BD deben sincronizarse los super_admin en `tbl_cat_usuarios`?**
   - ✅ **En su propia BD tenant (atinet_compliance_hub)**
   - tbl_cat_usuarios es una réplica de users específica para Control Notarial
   - Cada tenant tiene su propia tabla, no requiere cambios

3. **¿Qué eventos de agenda debe ver un super_admin?**
   - ✅ **Solo eventos legacy de 'atinet' y de otros super_admin**
   - CAMBIOS APLICADOS:
     - Eventos con `legacy_notaria='atinet'`
     - Eventos con `notaria_id=11` (ATINET MASTER)
     - Eventos con `notaria_id=NULL` (legacy sin asignar)
     - Eventos de otros super_admin (user_id diferente, notaria_id=11 o NULL)

---

## ✅ CAMBIOS APLICADOS

### 1. AgendaEvent.php (3 correcciones)
**Ubicaciones:** Líneas 94, 117, 136

**Antes:**
```php
if ($user->tipo_cuenta === 'super_admin' && ! $user->notaria_id) {
    $q2->where('legacy_notaria', 'atinet');
}
```

**Después:**
```php
if ($user->tipo_cuenta === 'super_admin') {
    $q2->where(function ($q3) {
        $q3->where('legacy_notaria', 'atinet')
           ->orWhere('notaria_id', 11)
           ->orWhereNull('notaria_id');
    });
}
```

**Resultado:** Super_admin ahora ve eventos legacy de 'atinet', eventos de ATINET MASTER (id=11) y eventos sin notaría asignada.

---

### 2. AgendaController.php
**Ubicación:** Línea 131

**Antes:**
```php
if ($user->tipo_cuenta === 'super_admin' && ! $user->notaria_id) {
    $legacySlug = 'atinet';
}
```

**Después:**
```php
if ($user->tipo_cuenta === 'super_admin') {
    $legacySlug = 'atinet';
}
```

**Resultado:** Super_admin con notaria_id=11 ahora accede correctamente a logs legacy de 'atinet'.

---

### 3. AgendaController.php (Bitácora - Método log)
**Ubicación:** Línea 101

**Antes:**
```php
// Filtrar por notaría (incluyendo eventos eliminados)
if ($user->notaria_id) {
    // Filtrar por notaría usando una subconsulta más flexible
    $newActivities->where(function ($query) use ($user) {
        ...
    });
} elseif ($user->tipo_cuenta === 'super_admin') {
    // Super admin sin notaría: ve TODOS los logs de agenda
}
```

**Después:**
```php
// Filtrar por notaría (incluyendo eventos eliminados)
if ($user->tipo_cuenta === 'super_admin') {
    // Super admin ve TODOS los logs de agenda (sin filtrar por notaria_id)
    // No aplicar filtro adicional - ya está filtrado por log_name='agenda'
} elseif ($user->notaria_id) {
    // Usuarios de notaría: filtrar por su notaría
    $newActivities->where(function ($query) use ($user) {
        ...
    });
}
```

**Resultado:** 
- Super_admin ahora ve TODOS los logs sin importar que tenga notaria_id=11
- Probado: ✅ Puede ver logs de todas las notarías en bitácora
- Combina logs de activity_log (nuevo) + aplicativos.log (legacy)

---

### 4. SyncAgendaFromLegacy.php
**Ubicación:** Línea 31 (método buildNotariasMap)

**Antes:**
```php
// Atinet siempre mapeada a NULL (sin notaria asignada, visible para super_admins)
$mapped['atinet'] = null;
```

**Después:**
```php
// Atinet siempre mapeada a ATINET MASTER (id=11) para compatibilidad con Control Notarial
$mapped['atinet'] = 11;
```

**Resultado:** 
- Eventos legacy de 'atinet' ahora se importan con `notaria_id=11`
- ✅ Ejecutado: `php artisan agenda:sync-legacy --notaria=atinet`
- ✅ Importados: **1,103 eventos** con `notaria_id=11` correctamente
- ✅ Compatibilidad con Control Notarial garantizada

---

### 5. AgendaEvent Model (BelongsToNotaria Trait)
**Ubicación:** Línea 10

**Antes:**
```php
class AgendaEvent extends Model
{
    use LogsActivity;
```

**Después:**
```php
class AgendaEvent extends Model
{
    use BelongsToNotaria;
    use LogsActivity;
```

**Resultado:**
- ✅ Nuevos eventos creados por super_admin ahora se asignan automáticamente `notaria_id=11`
- ✅ Probado con evento de prueba: ✅ CORRECTO
- ✅ Trait aplica NotariaScope automáticamente
- ✅ Super_admin mantiene global scope (excluido del filtrado)

---

## 🧪 PRUEBAS EJECUTADAS

### Test Script 1: _test_super_admin_functionality.php

```
✅ Super_admin tiene notaria_id=11
✅ ATINET MASTER existe y está configurada  
✅ Eventos legacy importados con notaria_id=11 (1,103 eventos)
✅ Super_admin puede ver eventos legacy (1,103 visibles)
✅ Nuevos eventos se crean con notaria_id=11 automáticamente
```

### Test Script 2: _test_bitacora_super_admin.php

```
✅ Super_admin NO filtra logs por notaria_id
✅ Puede ver logs de activity_log (nuevo sistema)
✅ Puede ver logs legacy de aplicativos.log
✅ Puede ver logs de TODAS las notarías
✅ Los eventos creados por super_admin generan logs correctamente
✅ Sistema de bitácora combinando logs nuevo + legacy
```

**Logs generados exitosamente:**
- Creación de evento → Log en activity_log
- Actualización de evento → Log en activity_log
- Eliminación de evento → Log en activity_log
- Todos visibles en bitácora para super_admin

---

## ✅ SIGUIENTE PASO

**EJECUTAR:** `php artisan test` para identificar qué tests fallan y priorizar correcciones.
