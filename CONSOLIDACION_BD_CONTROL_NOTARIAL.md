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

*Documento generado automáticamente por el asistente IA durante la sesión de trabajo del servidor.*
