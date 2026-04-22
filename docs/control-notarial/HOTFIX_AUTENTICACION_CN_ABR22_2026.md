# Hotfix: Autenticación Control Notarial — 22 abril 2026

## Resumen Ejecutivo

Se diagnosticaron y corrigieron múltiples causas raíz que impedían el correcto funcionamiento del flujo de autenticación del módulo Control Notarial: errores 401 persistentes, `Sesion_Iniciada` que nunca cambiaba en BD, y nombres de usuario que revertían solos a valores incorrectos.

---

## Síntomas Reportados

- Al entrar a la sección de Control Notarial aparecía en consola "token vencido / restaurando" y se recargaba la pestaña.
- `Sesion_Iniciada` nunca cambiaba a `1` en `tbl_cat_usuarios`.
- C# devolvía `401 Unauthorized` a todas las llamadas desde el frontend.
- El usuario `admin@atinet.mx` (CN Id=9) tenía `Usuario=ADMIN` en vez de `SUPERUSUARIO` aunque se corregía manualmente.

---

## Arquitectura Involucrada

```
Browser → /admin/cn-api/{path} → CnProxyController (Laravel)
                                        ↓
                                C# API (http://192.168.1.1:5000/api)
                                        ↓
                                MySQL atinet_compliance_hub
                                (tbl_cat_usuarios, tbl_log_sesiones_activas)
```

- **JWT del usuario**: cacheado en Laravel (`cn_jwt_user_{cn_usuario_id}`) por 12 minutos.
- **Sesiones activas**: escritas por C# en MySQL (`tbl_log_sesiones_activas`).
- **C# en producción**: usa MySQL (`mySqlConnectionRelease`), no SQL Server (legacy dev).

---

## Causas Raíz Identificadas

### 1. `UserObserver` destruía `Usuario` y `Contrasena` en cada update del usuario Laravel

**Archivo**: `app/Observers/UserObserver.php`

El método `sincronizarEnCN()` se disparaba en **todo** evento `updated` del modelo `User` (incluyendo el update del campo `last_seen` en cada login). Hacía dos cosas destructivas:

| Campo sobreescrito | Valor asignado | Problema |
|---|---|---|
| `Usuario` | `strtoupper(explode('@', $user->email)[0])` | `admin@atinet.mx` → `ADMIN`, borrando el `SUPERUSUARIO` configurado |
| `Contrasena` | `$user->password` (hash PHP) | Hash `$2y$12$` incompatible con BCrypt.Net de C# (`$2b$`) |
| `Sesion_Iniciada` | `0` | Mataba cualquier sesión activa en cada update |

**Fix aplicado**: en UPDATE solo se sincronizan `Nombre`, `Correo`, `Rol_Id`, `Numero_Notaria` y `Activo`. `Usuario` nunca se sobreescribe en updates. `Contrasena` solo se actualiza si el campo `password` cambió (`wasChanged('password')`), y siempre en formato `$2b$10$`. `Sesion_Iniciada` jamás se toca.

```php
// ANTES (destructivo)
$datos = [
    'Usuario'          => strtoupper(explode('@', $user->email)[0]),  // ← revertía el nombre
    'Contrasena'       => $user->password,                            // ← $2y$ incompatible
    'Sesion_Iniciada'  => 0,                                          // ← mataba sesión activa
    ...
];
DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->update($datos);

// DESPUÉS (seguro)
$datos = [
    'Nombre'         => $user->name,
    'Correo'         => $user->email,
    'Rol_Id'         => $rolId,
    'Numero_Notaria' => $numeroNotaria,
    'Activo'         => 1,
];
if ($user->wasChanged('password')) {
    $datos['Contrasena'] = str_replace('$2y$', '$2b$', $user->password);
}
DB::table('tbl_cat_usuarios')->where('Id', $user->cn_usuario_id)->update($datos);
```

---

### 2. Hash `$2y$12$` incompatible con BCrypt.Net de C#

**Contexto**: PHP genera hashes `$2y$` con `password_hash()`. C# usa `BCrypt.Net` que solo acepta el prefijo `$2b$`. Algorítmicamente son idénticos, pero BCrypt.Net hace validación de string prefix.

**Afectados**: `Id=9 (SUPERUSUARIO)` — tenía `$2y$12$` porque el script `_fix_all_bad_hashes.php` generaba hash con PHP y el observer volteaba a escribirlo sin conversión.

**Fix**: el script `_fix_all_bad_hashes.php` y el observer ahora siempre convierten `$2y$` → `$2b$` antes de escribir en `tbl_cat_usuarios`:
```php
$hash2b = str_replace('$2y$', '$2b$', password_hash($plain, PASSWORD_BCRYPT, ['cost' => 10]));
```

**Verificación final**: el script `_verify_all_users_cn.php` confirma todos los usuarios:
```
Resumen: 17 OK, 0 FALLIDOS, 0 SIN REGISTRO CN
```

---

### 3. `autoLogin()` y `ClearCnSessionOnLogout` usaban reset por nombre (`WHERE Usuario=`)

**Archivos**: `app/Http/Controllers/ControlNotarialController.php`, `app/Listeners/ClearCnSessionOnLogout.php`

Al resetear `Sesion_Iniciada=0` usando `WHERE Usuario = 'ADMIN'`, se reseteaban **ambos** registros (Id=1 y Id=9) cuando compartían nombre. Esto causaba que la sesión del otro usuario se cerrara.

**Fix**: ambos archivos usan ahora `WHERE Id = $user->cn_usuario_id`.

---

### 4. `getUsuarioCN()` permitía que C# sobreescribiera el campo `usuario` desde su SQL Server legacy

**Archivo**: `app/Services/ControlNotarialApiService.php`

`GET /User/GetUsuarioById?usuarioId=9` consultado desde C# puede devolver `usuario=ADMIN` (del SQL Server legacy `bd_SistemaControlNotarial_Principal`). Al usarlo directamente en el `PUT /User/UpdateUsuario`, se sobreescribía el nombre en MySQL.

**Fix**: después de obtener la respuesta de C#, se reemplaza el campo `usuario` con el valor de MySQL:
```php
$mysqlUsuario = DB::table('tbl_cat_usuarios')
    ->where('Id', $cnUsuarioId)
    ->value('Usuario');
if ($mysqlUsuario) {
    $data['usuario'] = $mysqlUsuario;  // MySQL siempre gana sobre SQL Server legacy
}
```

---

## Archivos Modificados

| Archivo | Cambio |
|---|---|
| `app/Observers/UserObserver.php` | No sobreescribir `Usuario`/`Sesion_Iniciada` en update; `Contrasena` solo si `wasChanged('password')` en formato `$2b$` |
| `app/Services/ControlNotarialApiService.php` | `getUsuarioCN()` usa MySQL como autoridad del campo `usuario`; `getGatewayToken()` simplificado sin queries extra |
| `app/Http/Controllers/ControlNotarialController.php` | `autoLogin()` reset por `WHERE Id` no por `WHERE Usuario` |
| `app/Listeners/ClearCnSessionOnLogout.php` | Reset por `WHERE Id`, eliminada consulta intermedia por nombre |
| `resources/js/components/user-menu-content.tsx` | Logout usa `method="post"` (antes era GET, Fortify lo ignoraba) |
| `resources/js/pages/auth/verify-email.tsx` | Mismo fix de `method="post"` en logout |
| `config/database.php` | Conexión `controlnotarial` corregida a mismo MySQL que default (documentada) |

## Scripts de Diagnóstico Creados

| Script | Propósito |
|---|---|
| `_diag_autologin.php` | Verifica decrypt, login C#, `Sesion_Iniciada` y JWT completo para `admin@atinet.mx` |
| `_fix_all_bad_hashes.php` | Detecta y corrige hashes `$2y$` → `$2b$` consultando `cn_password` de `users` |
| `_verify_all_users_cn.php` | Login real en C# para todos los usuarios con `cn_usuario_id`, reset preventivo de sesión |
| `_rename_superusuario.php` | Util: fija `tbl_cat_usuarios` Id=9 `Usuario='SUPERUSUARIO'` |

---

## Estado Final Verificado

```
17 usuarios verificados — 17 JWT OK, 0 fallidos
Sesion_Iniciada cambia correctamente: 0 → login → 1 → logout → 0
UserObserver ya no revierte nombres ni corrompe hashes
```

---

## Notas de Mantenimiento

- Los hashes `$2b$12$` (cost=12) son válidos en BCrypt.Net igual que `$2b$10$`.
- `Usuario=KARCER` para `karla@atinet.com.mx` es intencional (nombre diferente al prefijo del email).
- El cache de JWT tiene TTL de 12 min (< 15 min timeout de C#). El heartbeat del frontend lo renueva cada 10 min.
- Si un usuario no puede entrar a CN, correr `php _fix_all_bad_hashes.php` y `php artisan cache:clear`.
