# Fix: Creación de Notaría y Sincronización con Control Notarial

**Fecha:** 6 de Mayo, 2026
**Commit:** `ae25ce6`
**Estado:** ✅ Aplicado y verificado en producción
**Archivos modificados:**
- `app/Http/Controllers/Admin/NotariaController.php`
- `app/Observers/UserObserver.php`
- `database/migrations/2026_04_23_000001_create_tbl_ope_folios_table.php` *(nuevo)*
- `database/migrations/2026_04_23_000002_create_tbl_rel_expediente_pld_table.php` *(nuevo)*
- `database/migrations/2026_04_23_000003_add_session_columns_to_tbl_log_sesiones_activas.php` *(nuevo)*

---

## 1. Problema 1 — Error 500 al crear notaría (DDL en transacción)

### Causa raíz

`createNotariaDatabase()` ejecuta `CREATE DATABASE`, que en MySQL dispara un **IMPLICIT COMMIT**. Al estar dentro de `DB::transaction()`, el commit automático rompía la transacción activa, lanzando:

```
PDOException: There is no active transaction
```

Adicionalmente, `User::create()` dentro de la transacción disparaba `UserObserver::sincronizarUsersEnTenant()` que intentaba conectarse a una BD que todavía no existía, produciendo:

```
PDOException: Unknown database 'atinet_edomex_notaria_XXX'
```

### Solución

**Antes:**
```php
$notaria = DB::transaction(function () {
    $notaria = Notaria::create([...]);
    $adminUser = User::create([...]);     // observer dispara → BD no existe
    // ...
    return $notaria;
});
$this->createNotariaDatabase($notaria);  // DDL: implicit commit rompía transacción
```

**Después:**
```php
// La transacción solo maneja registros en BD principal
$result = DB::transaction(function () {
    $notaria = Notaria::create([...]);
    $adminUser = User::withoutEvents(fn() => User::create([...])); // sin observers
    Subscription::create([...]);
    $notaria->increment('total_usuarios');
    return [$notaria, $adminUser];
});

[$notaria, $adminUser] = $result;

// DDL fuera de transacción (evita implicit commit)
$this->createNotariaDatabase($notaria->fresh());

// Observer manual una vez que la BD ya existe
app(UserObserver::class)->created($adminUser->fresh());
```

---

## 2. Problema 2 — Schema diff: tablas y columnas faltantes en tenants

### Causa raíz

El desarrollador Alex importó cambios directamente en la BD master sin crear migraciones formales. Al crear tenants nuevos con `php artisan migrate`, estas tablas/columnas no existían.

### Tablas faltantes
| Tabla | Origen |
|-------|--------|
| `tbl_ope_folios` | Trabajo de Alex, importado directo |
| `tbl_rel_expediente_pld` | Trabajo de Alex, importado directo |

### Columnas faltantes en `tbl_log_sesiones_activas`
`Ip_Publica`, `Navegador`, `Sistema_Operativo`, `Pais`, `Ciudad`, `Latitud`, `Longitud`, `Isp`, `Zona_Horaria`, `Codigo_Postal`

### Solución

Creadas 3 migraciones con `IF NOT EXISTS` / `columnExists()` que son idempotentes (seguras para re-ejecutar en tenants que ya tenían las tablas):

- `2026_04_23_000001_create_tbl_ope_folios_table.php`
- `2026_04_23_000002_create_tbl_rel_expediente_pld_table.php`
- `2026_04_23_000003_add_session_columns_to_tbl_log_sesiones_activas.php`

Aplicadas manualmente a los 7 tenants existentes:

| Tenant | Estado |
|--------|--------|
| `atinet_edomex_notaria_11` | ✅ |
| `atinet_edomex_notaria_10` | ✅ |
| `atinet_mor_notaria_10` | ✅ |
| `atinet_oax_notaria_113` | ✅ |
| `atinet_edomex_notaria_60` | ✅ |
| `atinet_edomex_notaria_100` | ✅ |
| `atinet_edomex_notaria_101` | ✅ |

---

## 3. Problema 3 — `tbl_cat_usuarios` vacía al crear notaría

### Causa raíz

`User::withoutEvents()` (necesario para evitar el crash antes de que exista la BD) omite `UserObserver::sincronizarEnCN()`, el método responsable de insertar en `tbl_cat_usuarios`. Sin esa inserción, el usuario admin no existe en el sistema C# de la notaría.

Adicionalmente, `tbl_cat_roles` estaba vacía en tenants nuevos, causando un FK constraint al intentar insertar en `tbl_cat_usuarios` (`Rol_Id` → `tbl_cat_roles.Id`).

### Solución

1. `store()` invoca manualmente el observer **después** de que la BD está lista (ver Problema 1).
2. `copyEssentialData()` ahora provisiona en cada tenant nuevo:

| Dato | Motivo |
|------|--------|
| `tbl_cat_roles` (7 registros) | FK requerida por `tbl_cat_usuarios.Rol_Id` |
| `tbl_cat_modulos` (51 registros) | Requerido por la API C# |
| Usuario `LARAVEL_GW` en `tbl_cat_usuarios` | `ControlNotarialApiService` necesita este usuario para obtener JWT |

---

## 4. Mejora — Hash de contraseña generado por C#

### Problema previo

`UserObserver::sincronizarEnCN()` insertaba directamente en `tbl_cat_usuarios` con:
```php
'Contrasena' => str_replace('$2y$', '$2b$', $user->password)
```

Esto era una conversión del hash PHP (BCrypt con prefijo `$2y$`) al prefijo de C# (`$2b$`). Funcionalmente compatibles, pero el hash lo generaba PHP, no C#. El método correcto es que C# reciba la contraseña en texto plano y genere el hash con BCrypt.Net.

### Solución

`sincronizarEnCN()` ahora sigue esta lógica en el path CREATE:

```
1. Descifra recoverable_password (campo cifrado en users)
2. Si hay contraseña plana → llama ControlNotarialApiService::createUsuarioCN()
   → C# recibe texto plano → genera hash BCrypt.Net ($2b$) correctamente
3. Si la API no responde o no hay recoverable_password → fallback INSERT directo
   con conversión de hash (comportamiento anterior, compatible)
```

**Método agregado:**
```php
private function resolverContraseniaPlana(User $user): ?string
{
    if (empty($user->recoverable_password)) {
        return null;
    }
    try {
        return Crypt::decryptString($user->recoverable_password);
    } catch (\Throwable) {
        return null;
    }
}
```

---

## 5. Backfill en tenants existentes

Las notarías #100 y #101 (creadas antes de los fixes) fueron parcheadas manualmente:

| Operación | Notaría #100 | Notaría #101 |
|-----------|-------------|-------------|
| `tbl_cat_roles` (7 registros) | ✅ | ✅ |
| `tbl_cat_modulos` (51 registros) | ✅ | ✅ |
| `LARAVEL_GW` creado | ✅ Id=3 | ✅ Id=3 |
| Admin en `tbl_cat_usuarios` | ✅ cn_usuario_id=2 | ✅ cn_usuario_id=2 |

---

## 6. Flujo completo de creación de notaría (estado final)

```
store() →
  ┌─ DB::transaction() ───────────────────────────────────────┐
  │  1. Notaria::create()                                      │
  │  2. User::withoutEvents(fn() => User::create())           │
  │     (sin observers: BD tenant aún no existe)              │
  │  3. Subscription::create()                                 │
  │  4. $notaria->increment('total_usuarios')                  │
  │  return [$notaria, $adminUser]                             │
  └────────────────────────────────────────────────────────────┘
  5. createNotariaDatabase($notaria)
     ├─ runMigrationsForTenant()     → todas las migraciones
     ├─ createLocalAdminUser()       → users en tenant
     └─ copyEssentialData()
         ├─ configuracion            → nombre, numero, modo
         ├─ plans                    → plan contratado
         ├─ services                 → catálogo de servicios
         ├─ plan_services            → servicios del plan
         ├─ tbl_cat_roles            → ✅ NUEVO (FK para usuarios CN)
         ├─ tbl_cat_modulos          → ✅ NUEVO (API C#)
         ├─ LARAVEL_GW               → ✅ NUEVO (token JWT gateway)
         └─ tenant_services          → customizaciones si existen

  6. UserObserver::created($adminUser)   → ✅ NUEVO (manual)
     ├─ updateNotariaUserCount()
     ├─ sincronizarEnCN()
     │   ├─ Intenta via API C# (createUsuarioCN con contraseña plana)
     │   └─ Fallback: INSERT directo con hash $2y$→$2b$
     └─ sincronizarUsersEnTenant()       → upsert en users del tenant
```

---

## 7. Notas para desarrollo futuro

- El campo `recoverable_password` en `users` es **crítico** para que la API C# genere el hash correctamente. No debe eliminarse.
- Si se agregan tablas o catálogos al esquema CN master, deben añadirse también a `copyEssentialData()` para que los tenants nuevos los reciban.
- El script `_provision_gw_tenants.php` (en raíz, no versionado) puede usarse como referencia para provisionar tenants existentes ante cambios futuros en catálogos.
