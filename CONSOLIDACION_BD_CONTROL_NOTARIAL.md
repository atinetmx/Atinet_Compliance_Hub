# CONSOLIDACIÓN BD CONTROL NOTARIAL — Sesión Servidor 15/04/2026

**Rama:** `server-fixes-2026-03-26`  
**Fecha:** 15 de abril de 2026  
**Responsable:** GitHub Copilot (asistente IA)  
**Destinatarios:** Equipo Dev (máquina de desarrollo), Desarrollador Alex

---

## Resumen Ejecutivo

Se consolidaron las 57 tablas `tbl_*` del sistema **Control Notarial** (antes en `bd_sistemacontrolnotarial_principal`) como migraciones Laravel en la base de datos maestra `atinet_compliance_hub`. También se corrigió la URL del API C# en el archivo `.env`.

---

## Cambios Realizados

### 1. Nuevas Migraciones Laravel (5 archivos)

Ubicación: `database/migrations/`

| Archivo | Descripción | Tablas |
|---|---|---|
| `2026_04_15_200000_create_cn_catalogos_base.php` | Catálogos sin dependencias | 21 tablas `tbl_cat_*` |
| `2026_04_15_200001_create_cn_catalogos_dependientes.php` | Catálogos con FK a otros catálogos | `tbl_cat_impuestos_derechos`, `tbl_cat_operaciones`, `tbl_cat_usuarios` |
| `2026_04_15_200002_create_cn_configuracion.php` | Configuración de notaría | 4 tablas `tbl_cfg_*` |
| `2026_04_15_200003_create_cn_logs_y_operaciones.php` | Logs y operaciones | 3 `tbl_log_*` + 8 `tbl_ope_*` |
| `2026_04_15_200004_create_cn_relaciones.php` | Tablas pivote/relación | 18 tablas `tbl_rel_*` |

**Total tablas creadas:** 57 (57 `tbl_*` del módulo Control Notarial)

### 2. Corrección URL API C# en `.env`

**Antes (incorrecto):**
```
API_BASE_URL=http://api.atinet.com.mx:5000/api
VITE_API_BASE_URL=http://api.atinet.com.mx:5000/api
```

**Después (correcto):**
```
API_BASE_URL=https://srvatinet.atinet.com.mx:7443/api
CONTROL_NOTARIAL_API_URL=https://srvatinet.atinet.com.mx:7443/api
VITE_API_BASE_URL=https://srvatinet.atinet.com.mx:7443/api
```

---

## Arquitectura del Módulo Control Notarial

### Grupos de tablas

```
tbl_cat_*  (24 tablas)  — Catálogos maestros
tbl_cfg_*  ( 4 tablas)  — Configuración de notaría
tbl_log_*  ( 3 tablas)  — Auditoría y sesiones
tbl_ope_*  ( 8 tablas)  — Operaciones / expedientes
tbl_rel_*  (18 tablas)  — Relaciones N:M y detalles
```

### Diagrama simplificado de dependencias

```
tbl_cat_roles
  └──► tbl_cat_usuarios ──► tbl_log_bitacora
  │                          tbl_log_general
  │                          tbl_log_sesiones_activas
  │                          tbl_ope_expedientes
  │                          tbl_ope_recibos_provisionales
  │
tbl_cat_actividades_vulnerables
  └──► tbl_cat_operaciones ──► tbl_ope_presupuesto
  │                             tbl_ope_presupuesto_previo
  │                             tbl_cfg_tarifaria_honorarios
  │
tbl_cat_dependencias_publicas
  └──► tbl_cat_impuestos_derechos ──► tbl_cfg_tarifaria_tramites_derechos
  │
tbl_cat_zonas_municipios ──► tbl_ope_expedientes
                              tbl_cfg_tarifaria_honorarios
                              tbl_cfg_tarifaria_tramites_derechos
```

### Tabla de autenticación: `tbl_cat_usuarios`

Contiene los usuarios del sistema Control Notarial (independiente de `users` de Laravel).  
Contraseñas en formato `bcrypt $2b$10$...` (60 chars).

Roles disponibles: `ADMINISTRADOR`, `NOTARIOS`, `RESPONSABLES`, `SECRETARIAS`, `AUTORIZADOS`, `GESTORES`, `PASANTES`.

---

## Instrucciones para Aplicar en Máquina de Desarrollo / Servidor de Alex

### 1. Pull de la rama

```bash
git fetch origin
git checkout server-fixes-2026-03-26
git pull origin server-fixes-2026-03-26
```

### 2. Ejecutar migraciones

```bash
php artisan migrate --force
```

> **IMPORTANTE:** Si la BD destino ya contiene las tablas `tbl_*` (legacy), las migraciones fallarán por tabla ya existente. En ese caso, omitir la migración o hacer un rollback previo con `php artisan migrate:rollback`.

### 3. Actualizar `.env`

Asegurarse de que `.env` tenga las URLs correctas del API C#:
```
CONTROL_NOTARIAL_API_URL=https://srvatinet.atinet.com.mx:7443/api
API_BASE_URL=https://srvatinet.atinet.com.mx:7443/api
```

### 4. Limpiar caché

```bash
php artisan optimize:clear
```

---

## Notas para el Desarrollador Alex

### Cambio de BD objetivo — COMPLETADO (Sesión 4)

El API C# en `C:\SCN` fue actualizado exitosamente para apuntar a `atinet_compliance_hub`:

- **Archivo modificado:** `C:\SCN\appsettings.json`
- **Backup creado:** `C:\SCN\appsettings.json.bak`
- **Sitio IIS:** `SCN` (reiniciado para aplicar cambios)

```json
// ANTES:
"mySqlConnectionRelease": "Server=localhost;Database=bd_SistemaControlNotarial_Principal;User= atinet_app;Password=Atinet2026#Secure;Port=3307;"

// DESPUÉS:
"mySqlConnectionRelease": "Server=localhost;Database=atinet_compliance_hub;User=atinet_app;Password=Atinet2026#Secure;Port=3307;"
```

> ✅ El API .NET ya opera sobre `atinet_compliance_hub` con los 23,981 registros migrados (`tbl_*`).

---

## Estado de Pendientes (Post esta Sesión)

| Tarea | Estado |
|---|---|
| Migraciones `tbl_*` Laravel creadas y aplicadas | ✅ Completado |
| URL API C# corregida en `.env` | ✅ Completado |
| Commit en `server-fixes-2026-03-26` | ✅ Completado |
| Migración de datos de `bd_sistemacontrolnotarial_principal` | ✅ Completado (23,981 registros) |
| Cambio `ConnectionString` API C# a BD maestra | ✅ Completado (C:\SCN\appsettings.json) |
| Implementación Gateway para eliminar doble login | ⏳ Pendiente |
| Merge de `server-fixes-2026-03-26` a `master` | ⏳ Pendiente |

---

## Flujo de Login C# — Análisis Completo (Validado 14/05/2026)

> Esta sección documenta el comportamiento **confirmado en producción** del endpoint `POST /api/Login/Authentication`.

### Request

```json
POST http://192.168.1.1:5000/api/Login/Authentication
Content-Type: application/json

{
  "notaria":   "11",      // notarias.id (PK de Laravel) — NO es numero_notaria
  "usuario":   "ADMIN",   // tbl_cat_usuarios.Usuario  (case-sensitive)
  "contrasena":"ADMIN",   // contraseña en texto plano — C# compara contra BCrypt
  "equipo":    "string"   // nombre del equipo / origen de la llamada
}
```

> ⚠️ **Crítico**: el campo `notaria` es el **`id`** de la tabla `notarias` (PK), **no** el `numero_notaria`.  
> Ejemplo: notaría "Atinet Master" → `notarias.id = 11` → se envía `"notaria": "11"`.

---

### Resolución de BD tenant (cómo C# encuentra al usuario)

```
notaria = "11"
  → SELECT tenant_db_name FROM notarias WHERE id = 11
  → tenant_db_name = "atinet_compliance_hub"
  → C# se conecta a esa BD via MasterConnection / TenantBaseConnection
  → SELECT * FROM tbl_cat_usuarios
      WHERE Usuario = 'ADMIN'
      AND Numero_Notaria = (SELECT numero_notaria FROM notarias WHERE id = 11)
      -- numero_notaria de notarias.id=11 es 1
      -- tbl_cat_usuarios.Numero_Notaria = 1 ← coincide con ADMIN
  → Verifica BCrypt(contrasena) vs tbl_cat_usuarios.Contrasena
```

---

### Hash de contraseñas

| Campo | Valor |
|---|---|
| Tabla | `tbl_cat_usuarios.Contrasena` |
| Algoritmo | BCrypt |
| Prefijo | `$2a$` (variante C# — **no** `$2y$` de PHP) |
| Cost factor | `12` |
| Longitud | 60 caracteres |
| Ejemplo | `$2a$12$OV4LXgpX4Sc/1ERO2sKmx./HnzLFP2vZaTuYPsO0eJ0WjP.PkTSce` |

> ⚠️ PHP por defecto genera `$2y$`. Para que C# acepte hashes generados por PHP, se debe reemplazar el prefijo `$2y$` → `$2a$` antes de guardarlo en la BD.

---

### Response exitosa (HTTP 200)

```json
{
  "operationStatus": "Success",
  "message": "El usuario inicio sesion.",
  "dataResponse": {
    "user": "ADMIN",
    "accessToken": "<JWE token>",
    "refreshToken": "<base64>",
    "modulos": { "modulo_id": [1] }
  }
}
```

---

### JWT — Algoritmo y Claims

El `accessToken` usa **JWE con algoritmo `A256CBC-HS512`** (token cifrado, no solo firmado).

Claims decodificados:

| Claim | Descripción | Ejemplo |
|---|---|---|
| `jti` | ID único de sesión — se almacena en `tbl_log_sesiones_activas.Token_Jti` | `bfa46da2-...` |
| `client_id` | `tbl_cat_usuarios.Id` | `"1"` |
| `client_username` | `tbl_cat_usuarios.Usuario` | `"ADMIN"` |
| `client_name` | Nombre completo del usuario | `"Super Administrador Atinet NAS NAS"` |
| `client_Ip` | IP o equipo enviado en el request | `"string"` |
| `client_notaria` | `notarias.tenant_db_name` de la notaría del login | `"atinet_compliance_hub"` |
| `exp` | Unix timestamp de expiración (15 min) | `1778857500` |
| `iss` / `aud` | Configurado en `appsettings.json` → `Jwt.Issuer` / `Jwt.Audience` | `"https://miservidor.com"` |

---

### Efecto en BD tras login exitoso

1. `tbl_cat_usuarios.Sesion_Iniciada` → se pone en `1`
2. Se inserta un registro en `tbl_log_sesiones_activas`:

| Columna | Valor |
|---|---|
| `Usuario_Id` | `tbl_cat_usuarios.Id` |
| `Token_Jti` | claim `jti` del JWT |
| `Nombre_Equipo` | campo `equipo` del request |
| `Es_Activa` | `1` |
| `Fecha_Creacion` | timestamp actual |
| `Fecha_Expiracion` | now + 15 min |

> ⚠️ Si `Sesion_Iniciada = 1` ya está activo, C# **bloquea el login** ("Ya hay sesión activa"). Para forzar re-login hay que hacer `UPDATE tbl_cat_usuarios SET Sesion_Iniciada = 0 WHERE Id = ?` y `DELETE FROM tbl_log_sesiones_activas WHERE Usuario_Id = ?`.

---

### appsettings.json — Estado correcto en producción

```json
{
  "ConnectionStrings": {
    "mySqlConnectionRelease": "Server=localhost;Database=atinet_compliance_hub;User=atinet_app;Password=Atinet2026#Secure;Port=3307;",
    "MasterConnection":       "Server=localhost;Database=atinet_compliance_hub;User=atinet_app;Password=Atinet2026#Secure;Port=3307;",
    "TenantBaseConnection":   "Server=localhost;Database=IGNORAR;User=atinet_app;Password=Atinet2026#Secure;Port=3307;"
  },
  "Jwt": {
    "Issuer":             "https://miservidor.com",
    "Audience":           "https://miservidor.com",
    "Key":                "74Av348euKnbnYi8cfbzPgiX7SjM3FPX",
    "AccessTokenMinutes": 15
  }
}
```

> `TenantBaseConnection` tiene `Database=IGNORAR` porque C# construye el connection string dinámicamente usando `notarias.tenant_db_name` en cada request.  
> Los campos `sqlConnectionRelease` / `sqlConnectionDebug` son del SQL Server legacy de Alex — **no se usan** en producción MySQL.

---

### Errores comunes y su causa

| Error HTTP 500 | Causa | Solución |
|---|---|---|
| `Table 'bd_sistemacontrolnotarial_principal.notarias' doesn't exist` | `MasterConnection` apunta a BD equivocada | Cambiar a `atinet_compliance_hub` y reiniciar IIS |
| `Column 'Usuario_Id' cannot be null` | C# no encontró al usuario en `tbl_cat_usuarios` (usuario incorrecto, notaria.id incorrecto, o `Numero_Notaria` no coincide) | Verificar que `notaria` = `notarias.id` correcto y que el usuario existe con `Numero_Notaria` = `notarias.numero_notaria` de esa fila |
| `Ya hay una sesión activa` | `Sesion_Iniciada = 1` en la BD | Resetear sesión: `UPDATE tbl_cat_usuarios SET Sesion_Iniciada=0 WHERE Id=?` + borrar `tbl_log_sesiones_activas` |

---

*Sección agregada 14/05/2026 — validada con login exitoso en Swagger.*
