# Plan de Trabajo — Autenticación de Usuarios (Master + Tenant + C#)
**Inicio:** 18 de mayo de 2026  
**Última actualización:** 19 de mayo de 2026  
**Estado:** ✅ Login Laravel 20/20 | ✅ Login C# 20/20

---

## Contexto del problema

El sistema tiene autenticación **dual**:
1. **Laravel (Fortify)** — `POST /login` con `email` + `password` → sesión PHP
2. **C# API** — `POST /api/Login/Authentication` → JWT que el frontend usa para todas las operaciones de Control Notarial

Los usuarios viven en **tres lugares simultáneamente**:
| Tabla | BD | Uso |
|---|---|---|
| `users` | `atinet_compliance_hub` (master) | Login Laravel |
| `tbl_cat_usuarios` | `atinet_compliance_hub` (master) | Login C# vía master |
| `tbl_cat_usuarios` | `atinet_{estado}_notaria_{num}` (tenant) | Login C# vía tenant (para registrar logs) |

**Claves de sincronización:**
- `users.cn_usuario_id` → `tbl_cat_usuarios.Id` (en master y en tenant)
- `users.cn_password` → contraseña cifrada con `encrypt()`, usada por `autoLogin` para autenticar en C#
- `users.password` → hash BCrypt `$2y$12$` para Laravel
- `tbl_cat_usuarios.Contrasena` → hash BCrypt `$2a$12$` para C# (mismo algoritmo, distinto prefijo)

**Problema de prefijos BCrypt:**
- PHP genera `$2y$` → Laravel lo verifica correctamente
- C# (BCrypt.Net) requiere `$2a$` → hay que reemplazar el prefijo al guardar en `tbl_cat_usuarios`
- El `UserObserver` actualmente convierte `$2y$` → `$2b$` (**incorrecto**, debe ser `$2a$`)

---

## Estado actual de contraseñas (18/05/2026)

| users.id | email | cn_usuario (tbl_cat_usuarios) | password Laravel | cn_password | tbl_cat_usuarios.Contrasena |
|---|---|---|---|---|---|
| 1 | admin@atinet.mx | SUPERUSUARIO (Id=9) | `password123` ✓ | `password123` ✓ | pendiente auditar tenant |
| 11 | admin@atinet.com.mx | ADMIN (Id=1) | `ADMIN` ✓ | `ADMIN` ✓ | `$2a$12$` ✓ |
| 2–10, 13–19, 22–23 | varios | varios | `admin123` ✓ | `admin123` ✓ | pendiente auditar tenant |

**Master `tbl_cat_usuarios`:** todos los hashes están en `$2a$12$` ✓  
**BDs tenant:** **pendiente auditar** — probablemente tienen hashes `$2b$` o desactualizados

---

## Resultado de verificaciones

### 18/05/2026 — Estado inicial tras sincronizar master
- Laravel Auth::attempt — **20/20 ✓**
- C# API — **9/20 ✓** | FK constraint en `tbl_log_*` de tenants

### 19/05/2026 — Estado final tras correcciones en tenants
- Laravel Auth::attempt — **20/20 ✓**
- C# API — **20/20 ✓**

Correcciones aplicadas en sesión 19/05:
1. `LARAVEL_GW` movido de `Id=18` → `Id=1` en 7 tenants (`_fix_gw_id_to_1.php`)
2. Columnas `Orden_Caja`, `Orden_Pago`, `Servidor`, `Ruta_Servidor` agregadas a `tbl_cfg_configuracion_notarial` en 7 tenants
3. Hashes sincronizados completamente desde master a todos los tenants
4. `Sesion_Iniciada=0` reseteado en 8 BDs (85 sesiones + sesiones de tests)

---

## Checklist de tareas

### TAREA 1 — Auditar `tbl_cat_usuarios` en cada BD tenant ✅
- [x] Listar todos los tenants (`notarias.tenant_db_name`)
- [x] Para cada tenant: mostrar usuarios en `tbl_cat_usuarios` (Id, Usuario, prefijo hash, Sesion_Iniciada)
- [x] Comparar con master para detectar discrepancias de IDs, hashes y usuarios faltantes
- **Script:** `_audit_tenant_cn_users.php`
- **Hallazgo:** Todos los tenants tenían hashes `$2b$`, `Sesion_Iniciada=1` en varios usuarios, y `LARAVEL_GW` con `Id=18` en lugar de `Id=1`

### TAREA 2 — Sincronizar hashes `$2a$` a cada BD tenant ✅
- [x] Para cada usuario en cada tenant: actualizar `Contrasena` con hash `$2a$` correcto desde master
- [x] Resetear `Sesion_Iniciada=0` en todos los tenants
- [x] Sincronizar hash completo (no solo prefijo) para garantizar misma contraseña
- **Script:** `_sync_tenant_hashes.php`, `_fix_sessions_and_hashes.php`

### TAREA 3 — Analizar cómo C# resuelve la BD tenant ✅
- [x] C# usa el campo `notaria` del payload como `notarias.id` (PK de la tabla `notarias` en Laravel)
- [x] A partir de ese Id, C# resuelve la BD tenant y busca al usuario **por nombre** (`Usuario`) dentro del tenant
- [x] El `Usuario_Id` que C# usa para insertar en `tbl_log_*` es el `Id` del usuario **dentro del tenant** (no del master)
- [x] `LARAVEL_GW` debe tener `Id=1` en cada tenant porque C# lo usa como usuario del sistema para logs internos

### TAREA 4 — Restaurar `LARAVEL_GW` a `Id=1` en cada tenant ✅
- [x] Identificado: scripts anteriores habían insertado `LARAVEL_GW` con `Id=18` (copiando el Id del master) en lugar de dejar el auto-increment del tenant
- [x] Eliminados FK constraints temporalmente en `tbl_log_*`, actualizado `Id=18 → Id=1`, restaurados FK
- [x] Resetear `AUTO_INCREMENT` al valor correcto post-cambio
- **Script:** `_fix_gw_id_to_1.php`

### TAREA 5 — Fix columnas faltantes en schema de tenants ✅
- [x] `Orden_Caja`, `Orden_Pago` faltantes en `tbl_cfg_configuracion_notarial` de todos los tenants → `_fix_cfg_configuracion_notarial.php`
- [x] `Ruta_Servidor` faltante en `tbl_cfg_configuracion_notarial` de todos los tenants
- [x] Implementado script de comparación completa master vs tenants para detectar cualquier columna faltante futura
- **Script:** `_fix_cfg_configuracion_notarial.php`, `_find_missing_cols.php`
- **Nota:** Ejecutar `_find_missing_cols.php` después de cada deploy de C# que agregue columnas

### TAREA 6 — Corregir `UserObserver` — prefijo `$2b$` → `$2a$` ⏳
- [ ] Línea ~281: `str_replace('$2y$', '$2b$', ...)` → cambiar a `'$2a$'`
- [ ] Línea ~349: mismo cambio
- [ ] Línea ~253 (updated, password changed): mismo cambio
- **Archivo:** `app/Observers/UserObserver.php`
- **Impacto:** Si no se corrige, los nuevos usuarios creados/modificados desde Laravel tendrán hash `$2b$` y no podrán hacer login en C#

### TAREA 7 — Corregir `NotariaController` — hash al crear tenant ⏳
- [ ] Verificar que `LARAVEL_GW` se inserta con `Id=1` (primer registro) en el tenant nuevo
- [ ] Verificar que hash en `tbl_cat_usuarios` del tenant sea `$2a$` al crear notaría
- [ ] Verificar que `cn_password` del admin se guarda correctamente con `encrypt()`
- **Archivo:** `app/Http/Controllers/Admin/NotariaController.php`

### TAREA 8 — Test login completo end-to-end ✅
- [x] Laravel Auth::attempt — 20/20 ✓
- [x] C# API login — 20/20 ✓
- [ ] Auto-login desde Laravel (`/admin/control-notarial/auto-login`) — pendiente prueba en UI

---

## Situaciones detectadas durante el trabajo

| Fecha | Situación | Impacto | Resolución |
|---|---|---|---|
| 18/05 | `users.password` desincronizado de `tbl_cat_usuarios.Contrasena` | Login C# fallaba para todos excepto ADMIN | ✅ `_sync_all_passwords.php` |
| 18/05 | `users.cn_password` tenía contraseñas antiguas (2026, 110978, etc.) | Auto-login C# fallaba silenciosamente | ✅ `_sync_all_passwords.php` |
| 18/05 | Prefijo BCrypt `$2b$` en BDs tenant — C# requiere `$2a$` | Login C# falla en tenants | ✅ `_sync_tenant_hashes.php` |
| 18/05 | FK constraint en `tbl_log_*` del tenant al hacer login C# | HTTP 500 para usuarios con notaria_id ≠ 11 | ✅ Ver sesión 19/05 |
| 19/05 | `LARAVEL_GW` insertado con `Id=18` en tenants (copiando Id del master) en lugar de `Id=1` | C# usa `Usuario_Id=1` en sus logs internos → FK falla porque `Id=1` no existía | ✅ `_fix_gw_id_to_1.php` — LARAVEL_GW movido a Id=1 en 7 tenants |
| 19/05 | `tbl_cfg_configuracion_notarial` en tenants sin columnas `Orden_Caja`, `Orden_Pago` | HTTP 500 post-autenticación al cargar configuración | ✅ `_fix_cfg_configuracion_notarial.php` |
| 19/05 | `tbl_cfg_configuracion_notarial` en tenants sin columna `Ruta_Servidor` | HTTP 500 post-autenticación al cargar configuración | ✅ `_find_missing_cols.php` — comparación full schema master vs tenants |
| 19/05 | Hashes en tenants desincronizados del master (`Contrasena` diferente) | "Credenciales inválidas" para NOT1, SEC1, RES1, USUARIO | ✅ `_fix_sessions_and_hashes.php` — sincroniza hash completo desde master |

---

## Notas técnicas importantes

- `notaria_id=11` en `users` corresponde a la notaría cuya `tenant_db_name = atinet_compliance_hub` (la BD master). Por eso los usuarios con `notaria_id=11` siempre funcionaron en C# — están en la misma BD.
- El campo `notaria` en el payload de C# es un **string con el `notarias.id` (PK de Laravel)**, por ejemplo `"1"` para notaria_id=1.
- C# busca al usuario **por nombre** (`Usuario`) dentro de la BD tenant — el `Id` del usuario en master es irrelevante para C#.
- `LARAVEL_GW` **debe tener `Id=1`** en cada BD tenant. C# lo usa como usuario del sistema para insertar registros en `tbl_log_*` internamente. Si se inserta con cualquier otro Id, el FK de los log tables fallará.
- Cuando Alex actualiza el schema de C# (agrega columnas a tablas `tbl_cfg_*`), se debe ejecutar `_find_missing_cols.php` para propagar los cambios a todos los tenants.
- El `UserObserver` aún genera hashes `$2b$` (incorrecto). Mientras no se corrija, cualquier usuario **nuevo o con password cambiado desde Laravel** tendrá hash incompatible con C#. Mitigación: correr `_fix_sessions_and_hashes.php` después de cambios de contraseña.

---

## Scripts de mantenimiento creados

| Script | Propósito | Cuándo usar |
|---|---|---|
| `_sync_all_passwords.php` | Sincroniza `users.password`, `users.cn_password` y `tbl_cat_usuarios.Contrasena` en master | Corrección puntual |
| `_sync_tenant_hashes.php` | Copia hashes `$2a$` del master a todos los tenants + resetea sesiones | Después de cambios masivos de contraseña |
| `_fix_sessions_and_hashes.php` | Resetea `Sesion_Iniciada=0` y sincroniza hashes master→tenants | Después de cualquier cambio de contraseña |
| `_fix_gw_id_to_1.php` | Mueve `LARAVEL_GW` a `Id=1` en todos los tenants | Corrección única (no debería repetirse) |
| `_fix_cfg_configuracion_notarial.php` | Agrega columnas `Orden_Caja`, `Orden_Pago`, `Servidor` a todos los tenants | Corrección única |
| `_find_missing_cols.php` | Compara schema de todas las tablas `tbl_*` entre master y tenants, aplica columnas faltantes | Después de cada deploy de C# |
| `_verify_laravel_auth.php` | Verifica Laravel Auth::attempt para los 20 usuarios | Diagnóstico |
| `_verify_csharp_login.php` | Verifica C# API login para los 20 usuarios | Diagnóstico |
