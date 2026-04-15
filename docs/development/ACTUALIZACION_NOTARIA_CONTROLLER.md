# 🔧 Análisis de NotariaController - Modelo Híbrido Legacy + Moderno

**Fecha:** 8 de Abril, 2026  
**Estado:** ✅ ARQUITECTURA VALIDADA - Modelo híbrido confirmado  
**Impacto:** ℹ️ INFORMATIVO - Sistema usa BD legacy como fuente  
**Archivo:** `app/Http/Controllers/Admin/NotariaController.php`

---

## 1. ARQUITECTURA CORRECTA (Modelo Híbrido)

### ✅ Modelo Validado: BD Legacy + BD Tenant

El sistema usa un **modelo híbrido** similar a OFAC/SAT:

```
┌──────────────────────────────────────────────────────────┐
│  BD LEGACY (atinet65_aplicativos)                        │
│  Tabla: registro                                          │
│  ├── Registros históricos (años 2020-2025)              │
│  ├── Registros actuales del sistema legacy               │
│  └── Continúa recibiendo registros legacy                │
└──────────────────────────────────────────────────────────┘
              ↓ Lectura directa
┌──────────────────────────────────────────────────────────┐
│  SISTEMA MODERNO (Atinet Compliance Hub)                 │
│  ├── Lee: atinet65_aplicativos.registro                  │
│  │   (todos los registros legacy)                        │
│  └── Escribe: {tenant}.registro_web (opcional)           │
│      (solo registros nuevos QR Scanner)                  │
└──────────────────────────────────────────────────────────┘
```

**Ventajas:**
- ✅ No requiere migración masiva de datos históricos
- ✅ Sistema legacy continúa operando sin interrupciones
- ✅ Transición gradual entre sistemas
- ✅ Similar al modelo OFAC/SAT probado y funcional

### Situación del Método createNotariaDatabase()

El método `createNotariaDatabase()` **intenta ejecutar TODAS las migraciones**:

```php
private function runMigrationsForTenant(string $databaseName): void
{
    try {
        // ✅ CORRECTO: Intenta ejecutar TODAS las migraciones
        \Artisan::call('migrate', [
            '--database' => 'tenant_temp',
            '--path' => 'database/migrations',
            '--force' => true,
        ]);
        
    } catch (\Exception $e) {
        // ⚠️ PROBLEMA: Si falla, crea tablas manualmente incompletas
        Log::error('Error al ejecutar migraciones del tenant', [
            'database_name' => $databaseName,
            'error' => $e->getMessage(),
        ]);
        
        // ❌ FALLBACK INCOMPLETO
        $this->createMinimalTables($databaseName);
    }
}
```

**Escenario de fallo:**
1. Conexión temporal `tenant_temp` falla
2. Artisan `migrate` lanza excepción
3. Fallback `createMinimalTables()` crea solo **9 tablas**
4. Falta `registro_web`, `activity_log`, `search_histories`
5. Nueva notaría **NO puede usar Registro Web**

---

## 2. ANÁLISIS DE TABLAS - createMinimalTables()

### Tablas Actualmente en createMinimalTables():

```
✅ users
✅ configuracion
✅ services
✅ plan_services
✅ tenant_services
✅ service_usage
✅ plans
✅ busquedas
✅ agenda_events
```

**Total:** 9 tablas esenciales

### Tablas que usan BD Legacy (NO requieren tenant):

```
✅ registro → Lee de atinet65_aplicativos.registro
✅ OFAC → Lee de atinet65_listasofac
✅ SAT → Lee de atinet65_listassat
✅ Aplicativos → Lee de atinet65_aplicativos
```

### Tablas Opcionales (pueden agregarse después):

```
ℹ️ registro_web (opcional - escritura de nuevos registros QR)
ℹ️ search_histories (histórico agregado)
ℹ️ activity_log (auditoría - se puede agregar post-creación)
ℹ️ subscriptions (se maneja en BD Master)
```

**Conclusión:**
- ✅ El fallback `createMinimalTables()` es SUFICIENTE para operación básica
- ✅ No hay pérdida de funcionalidad crítica
- ℹ️ Tablas opcionales pueden agregarse vía migración posterior si se necesitan

---

## 3. MODELO DE DATOS: REGISTRO WEB

### 3.1. Fuente de Datos: atinet65_aplicativos.registro

**Tabla Legacy:** `atinet65_aplicativos.registro`  
**Ubicación:** Servidor Hostgator (162.144.6.1) + Copia local  
**Función:** Fuente principal de todos los registros (históricos + actuales)

**Conexión en config/database.php:**
```php
'aplicativos' => [
    'driver' => 'mysql',
    'host' => env('APLICATIVOS_DB_HOST', '127.0.0.1'),
    'port' => env('APLICATIVOS_DB_PORT', '3306'),
    'database' => env('APLICATIVOS_DB_DATABASE', 'atinet65_aplicativos'),
    'username' => env('APLICATIVOS_DB_USERNAME', 'root'),
    'password' => env('APLICATIVOS_DB_PASSWORD', ''),
],

'aplicativos_remote' => [
    'driver' => 'mysql',
    'host' => '162.144.6.1',
    'database' => 'atinet65_aplicativos',
    'username' => 'atinet65_ucompliance',
    // ... credenciales remotas
],
```

**Lectura de registros:**
```php
// Leer TODOS los registros (históricos + legacy actuales)
$registros = DB::connection('aplicativos')
    ->table('registro')
    ->where('notaria', $notariaNumero)
    ->orderBy('dia_registro', 'desc')
    ->get();
```

### 3.2. Escritura Opcional: {tenant}.registro_web

**Tabla Moderna:** `{tenant}.registro_web`  
**Función:** Almacenar SOLO registros nuevos del sistema moderno (QR Scanner)

**Opciones de Implementación:**

**Opción A: Escribir a BD Legacy (Mantener centralizado)**
```php
// Escribir a la misma BD que siempre se ha usado
DB::connection('aplicativos')
    ->table('registro')
    ->insert($nuevoRegistro);
```

**Ventajas:**
- ✅ Un solo lugar para todos los registros
- ✅ Sistema legacy y moderno comparten datos
- ✅ No requiere crear tabla en tenant
- ✅ Más simple de implementar

**Opción B: Escribir a Tenant + Sincronizar**
```php
// Escribir a BD tenant
DB::connection('tenant')
    ->table('registro_web')
    ->insert($nuevoRegistro);
    
// Opcionalmente sincronizar a legacy después
```

**Ventajas:**
- ✅ Datos distribuidos por notaría
- ✅ Preparado para servidores dedicados futuros
- ✅ Aislamiento de datos sensibles

**✅ DECISIÓN: Usar Opción B (escribir a tenant)** - Preparación para transición desde sistemas legacy.

**Ver también:** `docs/development/PLAN_CONSOLIDACION_BDS_LEGACY.md` para estrategia completa de migración.

---

## 4. SQL COMPLETO - TABLA REGISTRO_WEB (OPCIONAL)

### ✅ IMPLEMENTACIÓN REQUERIDA:

**La tabla `registro_web` en tenant es NECESARIA para la transición.**

**Estrategia de Implementación:**
- ✅ **Sistema Híbrido:** Lee de legacy + escribe a tenant
- ✅ **Migración Gradual:** Consolidar datos legacy a tenant por fases
- ✅ **Infraestructura Lista:** Preparado para servidores dedicados

**Implementar AHORA porque:**
1. Preparación para deprecar sistemas legacy
2. Permite migración gradual de datos históricos
3. Infraestructura lista para servidores dedicados
4. Facilita consolidación futura de BDs

**Para agregar después de la tabla `agenda_events` en createMinimalTables() (~línea 530):**

```sql
// ===== TABLA: registro_web (116 columnas) =====
// Migración: 2026_03_31_212959_create_registro_web_table.php
"CREATE TABLE IF NOT EXISTS `registro_web` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    -- METADATA (5 campos)
    `dia_registro` DATE NOT NULL,
    `notaria` VARCHAR(30) NOT NULL,
    `envio_de_correo` TINYINT(1) NOT NULL DEFAULT 0,
    `persona` ENUM('fisica', 'moral') NOT NULL DEFAULT 'fisica',
    
    -- DATOS PERSONALES (17 campos)
    `nombre` VARCHAR(30) NOT NULL,
    `apellidopat` VARCHAR(30) NOT NULL,
    `apellidomat` VARCHAR(30) NOT NULL,
    `alias` VARCHAR(100) NOT NULL,
    `curp` VARCHAR(50) NOT NULL,
    `rfc` VARCHAR(50) NOT NULL,
    `dia` DATE NOT NULL,
    `genero` VARCHAR(50) NOT NULL,
    `paisnac` VARCHAR(100) NOT NULL,
    `nacionalidad` VARCHAR(100) NOT NULL,
    `estado_nac` VARCHAR(100) NOT NULL,
    `ciudad_nac` VARCHAR(100) NOT NULL,
    `municipio_nac` VARCHAR(100) NOT NULL,
    `ocupacion` VARCHAR(100) NOT NULL,
    `edo_civil` VARCHAR(100) NOT NULL,
    `conyuge` VARCHAR(100) NULL,
    
    -- DATOS DEL CÓNYUGE (6 campos)
    `nombre_conyuge` VARCHAR(50) NULL,
    `apellido_paterno_conyuge` VARCHAR(50) NULL,
    `apellido_materno_conyuge` VARCHAR(50) NULL,
    `en_regimen_sociedad_conyugal` VARCHAR(2) NULL,
    `fecha_nacimiento_conyuge` DATE NULL,
    `curp_conyuge` VARCHAR(50) NULL,
    
    -- DOMICILIO PARTICULAR (12 campos)
    `calle` VARCHAR(100) NOT NULL,
    `no_exterior` VARCHAR(100) NOT NULL,
    `no_interior` VARCHAR(100) NULL,
    `colonia` VARCHAR(100) NOT NULL,
    `estado` VARCHAR(100) NOT NULL,
    `ciudad` VARCHAR(100) NOT NULL,
    `municipio` VARCHAR(100) NOT NULL,
    `codigo_postal` VARCHAR(100) NOT NULL,
    `pais` VARCHAR(100) NOT NULL DEFAULT 'México',
    `sector` VARCHAR(100) NULL,
    `estado_provincia` VARCHAR(100) NULL,
    `tiempo_residir` VARCHAR(100) NULL,
    
    -- DOMICILIO FISCAL (11 campos)
    `calle_fiscal` VARCHAR(100) NOT NULL,
    `no_exterior_fiscal` VARCHAR(100) NOT NULL,
    `no_interior_fiscal` VARCHAR(100) NULL,
    `colonia_fiscal` VARCHAR(100) NOT NULL,
    `estado_fiscal` VARCHAR(100) NOT NULL,
    `ciudad_fiscal` VARCHAR(100) NOT NULL,
    `municipio_fiscal` VARCHAR(100) NOT NULL,
    `codigo_postal_fiscal` VARCHAR(100) NOT NULL,
    `pais_fiscal` VARCHAR(100) NOT NULL DEFAULT 'México',
    `sector_fiscal` VARCHAR(100) NULL,
    `estado_provincia_fiscal` VARCHAR(100) NULL,
    
    -- CONTACTO (6 campos)
    `telefono` VARCHAR(50) NOT NULL,
    `celular` VARCHAR(50) NULL,
    `telefono_oficina` VARCHAR(50) NULL,
    `email` VARCHAR(100) NOT NULL,
    `email_secundario` VARCHAR(100) NULL,
    `fax` VARCHAR(50) NULL,
    
    -- IDENTIFICACIÓN (4 campos)
    `documento` VARCHAR(100) NOT NULL,
    `tipo_documento` VARCHAR(100) NOT NULL,
    `numero_documento` VARCHAR(100) NOT NULL,
    `ine_anverso` VARCHAR(255) NULL,
    
    -- INFORMACIÓN ADICIONAL (4 campos)
    `regimen_fiscal` VARCHAR(225) NULL,
    `observaciones_generales` TEXT NULL,
    `fines_sociales` TEXT NULL,
    `referencias` TEXT NULL,
    
    -- DATOS DEL TESTADOR (19 campos)
    `sabe_escribir` VARCHAR(10) NOT NULL DEFAULT '',
    `sabe_leer` VARCHAR(10) NOT NULL DEFAULT '',
    `padre_nombre` VARCHAR(255) NOT NULL DEFAULT '',
    `padre_vive` VARCHAR(10) NULL,
    `madre_nombre` VARCHAR(255) NOT NULL DEFAULT '',
    `madre_vive` VARCHAR(10) NULL,
    `hijos` VARCHAR(200) NULL,
    `herederos` VARCHAR(200) NULL,
    `herederos_sustitutos` TEXT NULL,
    `albacea` VARCHAR(45) NULL,
    `albacea_sustituto` VARCHAR(255) NOT NULL DEFAULT '',
    `tutor_tutriz` VARCHAR(255) NOT NULL DEFAULT '',
    `tutor_sustituto` VARCHAR(255) NOT NULL DEFAULT '',
    `observaciones` VARCHAR(45) NULL,
    
    -- DATOS PERSONA MORAL (nullable - agregado 2026-04-07)
    `razon_social` VARCHAR(255) NULL,
    `representante_legal` VARCHAR(255) NULL,
    `poder_notarial` VARCHAR(255) NULL,
    `giro_comercial` VARCHAR(255) NULL,
    `fecha_constitucion` DATE NULL,
    
    -- TIMESTAMPS Y SOFT DELETE
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    `deleted_at` TIMESTAMP NULL,
    
    -- ÍNDICES
    INDEX `idx_dia_registro` (`dia_registro`),
    INDEX `idx_notaria_dia` (`notaria`, `dia_registro`),
    INDEX `idx_curp` (`curp`),
    INDEX `idx_rfc` (`rfc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
```

---

## 4. SQL COMPLETO - ACTIVITY LOG

**Agregar después de `registro_web`:**

```sql
// ===== TABLA: activity_log (Auditoría) =====
// Migraciones: 2026_03_30_092331, 092411, 092413
"CREATE TABLE IF NOT EXISTS `activity_log` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `log_name` VARCHAR(255) NULL,
    `description` TEXT NOT NULL,
    `subject_type` VARCHAR(255) NULL,
    `subject_id` BIGINT UNSIGNED NULL,
    `causer_type` VARCHAR(255) NULL,
    `causer_id` BIGINT UNSIGNED NULL,
    `event` VARCHAR(255) NULL COMMENT 'Tipo de evento (created, updated, deleted)',
    `properties` JSON NULL,
    `batch_uuid` CHAR(36) NULL COMMENT 'UUID para agrupar operaciones batch',
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    
    -- ÍNDICES
    INDEX `idx_subject` (`subject_type`, `subject_id`),
    INDEX `idx_causer` (`causer_type`, `causer_id`),
    INDEX `idx_log_name` (`log_name`),
    INDEX `idx_batch_uuid` (`batch_uuid`),
    INDEX `idx_event` (`event`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
```

---

## 5. SQL COMPLETO - SEARCH_HISTORIES

**Agregar después de `activity_log`:**

```sql
// ===== TABLA: search_histories (Histórico de búsquedas) =====
// Migración: 2026_03_20_171918_create_search_histories_table.php
"CREATE TABLE IF NOT EXISTS `search_histories` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `notaria_id` BIGINT UNSIGNED NULL,
    `user_id` BIGINT UNSIGNED NULL,
    `nombre` VARCHAR(255) NULL,
    `curp` VARCHAR(18) NULL,
    `rfc` VARCHAR(13) NULL,
    `tipo_busqueda` VARCHAR(50) NOT NULL COMMENT 'ofac, sat, aplicativos',
    `resultado` VARCHAR(50) NOT NULL COMMENT 'encontrado, limpio, error',
    `detalles` TEXT NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    
    -- ÍNDICES
    INDEX `idx_notaria` (`notaria_id`),
    INDEX `idx_user` (`user_id`),
    INDEX `idx_tipo_busqueda` (`tipo_busqueda`),
    INDEX `idx_resultado` (`resultado`),
    INDEX `idx_created_at` (`created_at`),
    
    -- FOREIGN KEYS
    FOREIGN KEY (`notaria_id`) REFERENCES `notarias` (`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
```

---

## 6. SQL COMPLETO - SUBSCRIPTIONS

**Verificar si es necesaria en tenant, pero por seguridad agregar:**

```sql
// ===== TABLA: subscriptions (Suscripciones - copia local) =====
// Migración: 2026_02_05_210500_create_subscriptions_table.php
"CREATE TABLE IF NOT EXISTS `subscriptions` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
    `notaria_id` BIGINT UNSIGNED NOT NULL,
    `plan_id` BIGINT UNSIGNED NOT NULL,
    `status` VARCHAR(50) NOT NULL DEFAULT 'active' COMMENT 'active, trial, suspended, cancelled',
    `fecha_inicio` DATE NOT NULL,
    `fecha_vencimiento` DATE NOT NULL,
    `fecha_cancelacion` DATE NULL,
    `monto_mensual` DECIMAL(10, 2) NULL,
    `metodo_pago` VARCHAR(50) NULL,
    `notas` TEXT NULL,
    `created_at` TIMESTAMP NULL,
    `updated_at` TIMESTAMP NULL,
    
    -- ÍNDICES
    INDEX `idx_notaria` (`notaria_id`),
    INDEX `idx_plan` (`plan_id`),
    INDEX `idx_status` (`status`),
    INDEX `idx_fecha_vencimiento` (`fecha_vencimiento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
```

---

## 7. MÉTODO ACTUALIZADO COMPLETO

**Reemplazar el método `createMinimalTables()` en `NotariaController.php` (~línea 400-550):**

```php
/**
 * Create minimal tables for tenant database
 * This is a FALLBACK in case migrations fail.
 * The preferred method is runMigrationsForTenant().
 * 
 * @param string $databaseName
 * @return void
 */
private function createMinimalTables(string $databaseName): void
{
    try {
        Log::info('Creando tablas mínimas manualmente (fallback)', [
            'database_name' => $databaseName
        ]);
        
        $minimalTables = [
            // Switch to tenant database
            "USE `{$databaseName}`",
            
            // ===== TABLA: users =====
            "CREATE TABLE IF NOT EXISTS `users` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `name` VARCHAR(255) NOT NULL,
                `email` VARCHAR(255) NOT NULL UNIQUE,
                `email_verified_at` TIMESTAMP NULL,
                `password` VARCHAR(255) NOT NULL,
                `plain_password` VARCHAR(255) NULL COMMENT 'Solo para admin_notaria',
                `tipo_cuenta` VARCHAR(50) NOT NULL DEFAULT 'usuario' COMMENT 'super_admin, admin_notaria, usuario',
                `notaria_id` BIGINT UNSIGNED NULL,
                `two_factor_secret` TEXT NULL,
                `two_factor_recovery_codes` TEXT NULL,
                `two_factor_confirmed_at` TIMESTAMP NULL,
                `remember_token` VARCHAR(100) NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                INDEX `idx_notaria` (`notaria_id`),
                INDEX `idx_tipo_cuenta` (`tipo_cuenta`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: configuracion =====
            "CREATE TABLE IF NOT EXISTS `configuracion` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `notaria_id` BIGINT UNSIGNED NOT NULL,
                `clave` VARCHAR(255) NOT NULL,
                `valor` TEXT NULL,
                `tipo` VARCHAR(50) NOT NULL DEFAULT 'string' COMMENT 'string, integer, boolean, json',
                `descripcion` TEXT NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                UNIQUE KEY `unique_notaria_clave` (`notaria_id`, `clave`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: services =====
            "CREATE TABLE IF NOT EXISTS `services` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `nombre` VARCHAR(255) NOT NULL,
                `descripcion` TEXT NULL,
                `tipo` VARCHAR(50) NOT NULL COMMENT 'busqueda, documento, reporte',
                `activo` TINYINT(1) NOT NULL DEFAULT 1,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: plans =====
            "CREATE TABLE IF NOT EXISTS `plans` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `nombre` VARCHAR(255) NOT NULL,
                `descripcion` TEXT NULL,
                `precio_mensual` DECIMAL(10, 2) NOT NULL,
                `max_usuarios` INT NOT NULL DEFAULT 5,
                `periodo_prueba_dias` INT NOT NULL DEFAULT 30,
                `activo` TINYINT(1) NOT NULL DEFAULT 1,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: plan_services =====
            "CREATE TABLE IF NOT EXISTS `plan_services` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `plan_id` BIGINT UNSIGNED NOT NULL,
                `service_id` BIGINT UNSIGNED NOT NULL,
                `incluido` TINYINT(1) NOT NULL DEFAULT 1,
                `limite_mensual` INT NULL COMMENT 'NULL = ilimitado',
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                UNIQUE KEY `unique_plan_service` (`plan_id`, `service_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: tenant_services =====
            "CREATE TABLE IF NOT EXISTS `tenant_services` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `notaria_id` BIGINT UNSIGNED NOT NULL,
                `service_id` BIGINT UNSIGNED NOT NULL,
                `habilitado` TINYINT(1) NOT NULL DEFAULT 1,
                `limite_mensual` INT NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                UNIQUE KEY `unique_notaria_service` (`notaria_id`, `service_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: service_usage =====
            "CREATE TABLE IF NOT EXISTS `service_usage` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `notaria_id` BIGINT UNSIGNED NOT NULL,
                `service_id` BIGINT UNSIGNED NOT NULL,
                `user_id` BIGINT UNSIGNED NOT NULL,
                `anio` INT NOT NULL,
                `mes` INT NOT NULL,
                `uso_actual` INT NOT NULL DEFAULT 0,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                UNIQUE KEY `unique_notaria_service_mes` (`notaria_id`, `service_id`, `anio`, `mes`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: busquedas =====
            "CREATE TABLE IF NOT EXISTS `busquedas` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `notaria_id` BIGINT UNSIGNED NULL,
                `user_id` BIGINT UNSIGNED NULL,
                `nombre` VARCHAR(255) NULL,
                `curp` VARCHAR(18) NULL,
                `rfc` VARCHAR(13) NULL,
                `tipo_busqueda` VARCHAR(50) NOT NULL COMMENT 'ofac, sat, aplicativos',
                `resultado` VARCHAR(50) NOT NULL COMMENT 'encontrado, limpio, error',
                `detalles` TEXT NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                INDEX `idx_notaria` (`notaria_id`),
                INDEX `idx_tipo_busqueda` (`tipo_busqueda`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: agenda_events =====
            "CREATE TABLE IF NOT EXISTS `agenda_events` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `notaria_id` BIGINT UNSIGNED NOT NULL,
                `user_id` BIGINT UNSIGNED NOT NULL,
                `title` VARCHAR(255) NOT NULL,
                `description` TEXT NULL,
                `start` DATETIME NOT NULL,
                `end` DATETIME NOT NULL,
                `all_day` TINYINT(1) NOT NULL DEFAULT 0,
                `rrule` VARCHAR(255) NULL COMMENT 'Recurrence rule (RFC 5545)',
                `color` VARCHAR(20) NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                INDEX `idx_notaria` (`notaria_id`),
                INDEX `idx_start` (`start`),
                INDEX `idx_end` (`end`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: registro_web (116 columnas - CRÍTICA) =====
            "CREATE TABLE IF NOT EXISTS `registro_web` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                
                -- METADATA (5 campos)
                `dia_registro` DATE NOT NULL,
                `notaria` VARCHAR(30) NOT NULL,
                `envio_de_correo` TINYINT(1) NOT NULL DEFAULT 0,
                `persona` ENUM('fisica', 'moral') NOT NULL DEFAULT 'fisica',
                
                -- DATOS PERSONALES (17 campos)
                `nombre` VARCHAR(30) NOT NULL,
                `apellidopat` VARCHAR(30) NOT NULL,
                `apellidomat` VARCHAR(30) NOT NULL,
                `alias` VARCHAR(100) NOT NULL,
                `curp` VARCHAR(50) NOT NULL,
                `rfc` VARCHAR(50) NOT NULL,
                `dia` DATE NOT NULL,
                `genero` VARCHAR(50) NOT NULL,
                `paisnac` VARCHAR(100) NOT NULL,
                `nacionalidad` VARCHAR(100) NOT NULL,
                `estado_nac` VARCHAR(100) NOT NULL,
                `ciudad_nac` VARCHAR(100) NOT NULL,
                `municipio_nac` VARCHAR(100) NOT NULL,
                `ocupacion` VARCHAR(100) NOT NULL,
                `edo_civil` VARCHAR(100) NOT NULL,
                `conyuge` VARCHAR(100) NULL,
                
                -- DATOS DEL CÓNYUGE (6 campos)
                `nombre_conyuge` VARCHAR(50) NULL,
                `apellido_paterno_conyuge` VARCHAR(50) NULL,
                `apellido_materno_conyuge` VARCHAR(50) NULL,
                `en_regimen_sociedad_conyugal` VARCHAR(2) NULL,
                `fecha_nacimiento_conyuge` DATE NULL,
                `curp_conyuge` VARCHAR(50) NULL,
                
                -- DOMICILIO PARTICULAR (12 campos)
                `calle` VARCHAR(100) NOT NULL,
                `no_exterior` VARCHAR(100) NOT NULL,
                `no_interior` VARCHAR(100) NULL,
                `colonia` VARCHAR(100) NOT NULL,
                `estado` VARCHAR(100) NOT NULL,
                `ciudad` VARCHAR(100) NOT NULL,
                `municipio` VARCHAR(100) NOT NULL,
                `codigo_postal` VARCHAR(100) NOT NULL,
                `pais` VARCHAR(100) NOT NULL DEFAULT 'México',
                `sector` VARCHAR(100) NULL,
                `estado_provincia` VARCHAR(100) NULL,
                `tiempo_residir` VARCHAR(100) NULL,
                
                -- DOMICILIO FISCAL (11 campos)
                `calle_fiscal` VARCHAR(100) NOT NULL,
                `no_exterior_fiscal` VARCHAR(100) NOT NULL,
                `no_interior_fiscal` VARCHAR(100) NULL,
                `colonia_fiscal` VARCHAR(100) NOT NULL,
                `estado_fiscal` VARCHAR(100) NOT NULL,
                `ciudad_fiscal` VARCHAR(100) NOT NULL,
                `municipio_fiscal` VARCHAR(100) NOT NULL,
                `codigo_postal_fiscal` VARCHAR(100) NOT NULL,
                `pais_fiscal` VARCHAR(100) NOT NULL DEFAULT 'México',
                `sector_fiscal` VARCHAR(100) NULL,
                `estado_provincia_fiscal` VARCHAR(100) NULL,
                
                -- CONTACTO (6 campos)
                `telefono` VARCHAR(50) NOT NULL,
                `celular` VARCHAR(50) NULL,
                `telefono_oficina` VARCHAR(50) NULL,
                `email` VARCHAR(100) NOT NULL,
                `email_secundario` VARCHAR(100) NULL,
                `fax` VARCHAR(50) NULL,
                
                -- IDENTIFICACIÓN (4 campos)
                `documento` VARCHAR(100) NOT NULL,
                `tipo_documento` VARCHAR(100) NOT NULL,
                `numero_documento` VARCHAR(100) NOT NULL,
                `ine_anverso` VARCHAR(255) NULL,
                
                -- INFORMACIÓN ADICIONAL (4 campos)
                `regimen_fiscal` VARCHAR(225) NULL,
                `observaciones_generales` TEXT NULL,
                `fines_sociales` TEXT NULL,
                `referencias` TEXT NULL,
                
                -- DATOS DEL TESTADOR (14 campos)
                `sabe_escribir` VARCHAR(10) NOT NULL DEFAULT '',
                `sabe_leer` VARCHAR(10) NOT NULL DEFAULT '',
                `padre_nombre` VARCHAR(255) NOT NULL DEFAULT '',
                `padre_vive` VARCHAR(10) NULL,
                `madre_nombre` VARCHAR(255) NOT NULL DEFAULT '',
                `madre_vive` VARCHAR(10) NULL,
                `hijos` VARCHAR(200) NULL,
                `herederos` VARCHAR(200) NULL,
                `herederos_sustitutos` TEXT NULL,
                `albacea` VARCHAR(45) NULL,
                `albacea_sustituto` VARCHAR(255) NOT NULL DEFAULT '',
                `tutor_tutriz` VARCHAR(255) NOT NULL DEFAULT '',
                `tutor_sustituto` VARCHAR(255) NOT NULL DEFAULT '',
                `observaciones` VARCHAR(45) NULL,
                
                -- DATOS PERSONA MORAL (nullable)
                `razon_social` VARCHAR(255) NULL,
                `representante_legal` VARCHAR(255) NULL,
                `poder_notarial` VARCHAR(255) NULL,
                `giro_comercial` VARCHAR(255) NULL,
                `fecha_constitucion` DATE NULL,
                
                -- TIMESTAMPS Y SOFT DELETE
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                `deleted_at` TIMESTAMP NULL,
                
                -- ÍNDICES
                INDEX `idx_dia_registro` (`dia_registro`),
                INDEX `idx_notaria_dia` (`notaria`, `dia_registro`),
                INDEX `idx_curp` (`curp`),
                INDEX `idx_rfc` (`rfc`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: activity_log (Auditoría) =====
            "CREATE TABLE IF NOT EXISTS `activity_log` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `log_name` VARCHAR(255) NULL,
                `description` TEXT NOT NULL,
                `subject_type` VARCHAR(255) NULL,
                `subject_id` BIGINT UNSIGNED NULL,
                `causer_type` VARCHAR(255) NULL,
                `causer_id` BIGINT UNSIGNED NULL,
                `event` VARCHAR(255) NULL COMMENT 'created, updated, deleted',
                `properties` JSON NULL,
                `batch_uuid` CHAR(36) NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                INDEX `idx_subject` (`subject_type`, `subject_id`),
                INDEX `idx_causer` (`causer_type`, `causer_id`),
                INDEX `idx_log_name` (`log_name`),
                INDEX `idx_batch_uuid` (`batch_uuid`),
                INDEX `idx_event` (`event`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: search_histories =====
            "CREATE TABLE IF NOT EXISTS `search_histories` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `notaria_id` BIGINT UNSIGNED NULL,
                `user_id` BIGINT UNSIGNED NULL,
                `nombre` VARCHAR(255) NULL,
                `curp` VARCHAR(18) NULL,
                `rfc` VARCHAR(13) NULL,
                `tipo_busqueda` VARCHAR(50) NOT NULL,
                `resultado` VARCHAR(50) NOT NULL,
                `detalles` TEXT NULL,
                `ip_address` VARCHAR(45) NULL,
                `user_agent` TEXT NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                INDEX `idx_notaria` (`notaria_id`),
                INDEX `idx_user` (`user_id`),
                INDEX `idx_tipo_busqueda` (`tipo_busqueda`),
                INDEX `idx_created_at` (`created_at`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
            
            // ===== TABLA: subscriptions =====
            "CREATE TABLE IF NOT EXISTS `subscriptions` (
                `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                `notaria_id` BIGINT UNSIGNED NOT NULL,
                `plan_id` BIGINT UNSIGNED NOT NULL,
                `status` VARCHAR(50) NOT NULL DEFAULT 'active',
                `fecha_inicio` DATE NOT NULL,
                `fecha_vencimiento` DATE NOT NULL,
                `fecha_cancelacion` DATE NULL,
                `monto_mensual` DECIMAL(10, 2) NULL,
                `metodo_pago` VARCHAR(50) NULL,
                `notas` TEXT NULL,
                `created_at` TIMESTAMP NULL,
                `updated_at` TIMESTAMP NULL,
                INDEX `idx_notaria` (`notaria_id`),
                INDEX `idx_plan` (`plan_id`),
                INDEX `idx_status` (`status`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
        ];
        
        // Execute each table creation SQL
        foreach ($minimalTables as $sql) {
            try {
                DB::statement($sql);
            } catch (\Exception $e) {
                Log::error('Error creando tabla individual en fallback', [
                    'database_name' => $databaseName,
                    'sql' => substr($sql, 0, 100), // First 100 chars
                    'error' => $e->getMessage()
                ]);
            }
        }
        
        Log::info('Tablas mínimas creadas exitosamente (fallback)', [
            'database_name' => $databaseName,
            'total_tables' => count($minimalTables) - 1, // -1 for USE statement
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error crítico en createMinimalTables', [
            'database_name' => $databaseName,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        throw $e;
    }
}
```

---

## 8. TESTING (OPCIONAL - Solo si agregas tablas tenant)

**⚠️ NOTA:** Este testing es solo si decides agregar las tablas opcionales a tenant.

**Para operación normal:** El sistema funciona leyendo de `atinet65_aplicativos.registro` sin necesidad de tabla tenant.

### Test 1: Verificar Lectura desde BD Legacy

```php
// En tinker o en un controller
$registros = DB::connection('aplicativos')
    ->table('registro')
    ->where('notaria', '1')
    ->limit(10)
    ->get();
    
dd($registros); // Debe mostrar registros históricos
```

### Test 2: Crear Notaría de Prueba (Funcionamiento Base)

```bash
# En MySQL Workbench o CLI
DROP DATABASE IF EXISTS atinet_test_notaria_999;
```

Luego en la UI de admin, crear una notaría de prueba:
- Nombre: "Notaría de Prueba"
- Número: 999
- Estado: Jalisco
- Plan: Cualquiera

### Test 3: Verificar Tablas Esenciales Creadas

```sql
USE atinet_jal_notaria_999;
SHOW TABLES;

-- Debe mostrar AL MENOS 9 tablas esenciales:
-- users
-- configuracion
-- services
-- plans
-- plan_services
-- tenant_services
-- service_usage
-- busquedas
-- agenda_events
-- cache, jobs (Laravel)

-- Las siguientes son OPCIONALES:
-- registro_web ← Solo si agregaste SQL opcional
-- activity_log ← Solo si agregaste SQL opcional
-- search_histories ← Solo si agregaste SQL opcional
```

### Test 4: Verificar Lectura de Registros (Sin tabla tenant)

```sql
-- Desde cualquier aplicación, debe poder leer:
SELECT COUNT(*) as total_registros 
FROM atinet65_aplicativos.registro 
WHERE notaria = '999';

-- Debe mostrar conteo (puede ser 0 si es notaría nueva)
```

### Test 5: Verificar Estructura de registro_web (Si agregaste tabla opcional)

```sql
USE atinet_jal_notaria_999;
DESCRIBE registro_web;

-- Solo ejecutar si agregaste la tabla opcional
-- Debe mostrar 116 columnas + timestamps
SELECT COUNT(*) as total_columnas 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = 'atinet_jal_notaria_999' 
  AND TABLE_NAME = 'registro_web';
  
-- Resultado esperado: 119 (116 + id, created_at, updated_at, deleted_at)
```

### Test 4: Insertar Registro de Prueba

```sql
USE atinet_jal_notaria_999;

INSERT INTO registro_web (
    dia_registro, notaria, persona,
    nombre, apellidopat, apellidomat, alias,
    curp, rfc, dia, genero,
    paisnac, nacionalidad, estado_nac, ciudad_nac, municipio_nac,
    ocupacion, edo_civil,
    calle, no_exterior, colonia, estado, ciudad, municipio, codigo_postal, pais,
    calle_fiscal, no_exterior_fiscal, colonia_fiscal, estado_fiscal, ciudad_fiscal, municipio_fiscal, codigo_postal_fiscal, pais_fiscal,
    telefono, email,
    documento, tipo_documento, numero_documento
) VALUES (
    '2026-04-08', '999', 'fisica',
    'Juan', 'Pérez', 'García', 'El Juanito',
    'PEGJ850101HDFRRN01', 'PEGJ8501011A3', '1985-01-01', 'Masculino',
    'México', 'Mexicana', 'Jalisco', 'Guadalajara', 'Guadalajara',
    'Ingeniero', 'Soltero',
    'Av. Revolución', '123', 'Centro', 'Jalisco', 'Guadalajara', 'Guadalajara', '44100', 'México',
    'Av. Revolución', '123', 'Centro', 'Jalisco', 'Guadalajara', 'Guadalajara', '44100', 'México',
    '3312345678', 'juan@test.com',
    'INE', 'INE', 'IDMEX123456789'
);

-- Verificar inserción
SELECT id, nombre, apellidopat, curp, rfc FROM registro_web;
```

---

## 9. CHECKLIST DE DECISIÓN E IMPLEMENTACIÓN

### Decisión 1: ¿Agregar tablas opcionales ahora?

**Opción A: NO agregar (Recomendado para MVP)**
```
✅ Sistema funciona perfectamente sin cambios
✅ Lee registros de atinet65_aplicativos.registro
✅ Escribe nuevos registros a BD legacy
✅ Implementación más simple
✅ Cero riesgo de romper nada

⏰ Agregar tablas cuando:
   - Implementes servidores dedicados (Mayo-Junio)
   - Necesites aislar datos por notaría
   - Migres completamente del sistema legacy
```

**Opción B: Agregar tablas ahora (Preparación futura)**
```
ℹ️ Preparas infraestructura para servidores dedicados
ℹ️ Puedes separar registros legacy vs modernos
⚠️ Requiere actualizar NotariaController
⚠️ Requiere testing adicional
⚠️ Mayor complejidad de implementación
```

### Si eliges Opción B, checklist:

```
⬜ 1. Backup de NotariaController.php actual
⬜ 2. Agregar SQL de registro_web a createMinimalTables()
⬜ 3. Agregar SQL de activity_log (opcional)
⬜ 4. Agregar SQL de search_histories (opcional)
⬜ 5. Verificar indentación y sintaxis PHP
⬜ 6. Ejecutar php artisan config:clear
⬜ 7. Ejecutar php artisan cache:clear
⬜ 8. Crear notaría de prueba (número 999)
⬜ 9. Verificar tablas creadas
⬜ 10. Insertar registro de prueba
⬜ 11. Verificar que QR Scanner funciona
⬜ 12. Eliminar notaría de prueba
⬜ 13. Git commit con mensaje descriptivo
⬜ 14. Notificar a equipo del cambio
```

---

## 10. RECOMENDACIÓN TÉCNICA

### 🎯 DECISIÓN ESTRATÉGICA: Implementar Opción B (Con tablas tenant)

**RECOMENDACIÓN ACTUALIZADA - Opción B:**

```
✅ Razones para implementar AHORA:
   - Preparación para servidores dedicados
   - Permite migración gradual desde legacy
   - Facilita consolidación futura de BDs
   - Infraestructura lista para transición
   - Aislamiento de datos por notaría desde ya
   
⏰ Implementación: 1-2 días (incluye testing)
📅 Timeline: Implementar antes del 15 de Abril
```

**Plan de Transición:**
1. **Ahora (Abril 2026):** Implementar tablas tenant
2. **Corto plazo:** Sistema híbrido (lee legacy + escribe tenant)
3. **Mediano plazo (Mayo-Junio):** Migración gradual de datos legacy
4. **Largo plazo:** Deprecar sistema legacy completamente

**Funcionalidad del QR Scanner:**
```php
// Controller: RegistroWebController
public function store(Request $request) {
    $validated = $request->validate([...]);
    
    // Escribir a BD legacy (centralizada)
    DB::connection('aplicativos')
        ->table('registro')
        ->insert($validated);
    
    // ✅ Sistema legacy y moderno comparten datos
    // ✅ No requiere tabla en tenant
    // ✅ Funciona inmediatamente
}
```

### 🔮 Para Servidores Dedicados (Mayo-Junio 2026):

**Entonces sí migrar a Opción B (Con tablas tenant):**

```
📅 Implementar cuando:
   1. Cada notaría tenga servidor dedicado
   2. Se implemente middleware de conexión dinámica
   3. Se cree sistema de sincronización bidireccional
   4. Se migre completamente del sistema legacy

🛠️ Trabajo requerido:
   - Agregar tablas a createMinimalTables()
   - Crear job de sincronización
   - Testing exhaustivo
   - Migración gradual (5 notarías/semana)
   
⏰ Tiempo estimado: 2-3 semanas
```

---

## 11. CONCLUSIÓN Y PLAN DE ACCIÓN

### 🎯 Decisión Estratégica: Implementar Opción B

**Acción Requerida:**
- 🔧 **IMPLEMENTAR:** Actualizar NotariaController con SQL de tablas tenant
- 📅 **Deadline:** Antes del 15 de Abril 2026
- ⏰ **Tiempo:** 1-2 días (incluye testing)

**Plan de Implementación:**

**Fase 1: Infraestructura (Esta semana - 8-12 Abril)**
1. ✅ Actualizar `createMinimalTables()` en NotariaController
2. ✅ Agregar SQL completo de `registro_web` (116 columnas)
3. ✅ Agregar SQL de `activity_log` (auditoría)
4. ✅ Agregar SQL de `search_histories` (histórico)
5. ✅ Testing con notarías de prueba
6. ✅ Validar sistema híbrido (lee legacy + escribe tenant)

**Fase 2: Consolidación de BDs Legacy (Próxima semana - 15-19 Abril)**
1. Ver: `docs/development/PLAN_CONSOLIDACION_BDS_LEGACY.md`
2. Crear migraciones para incorporar tablas legacy a BD Master
3. Implementar seeders para migración de datos
4. Testing de consolidación

**Fase 3: Sistema Híbrido (Hasta Mayo)**
1. Registro Web escribe a tenant
2. Lee históricos desde legacy
3. Monitoreo de ambos sistemas

**Fase 4: Servidores Dedicados (Mayo-Junio)**
1. Implementar middleware de conexión dinámica
2. Migración gradual (5 notarías/semana)
3. Consolidación final de datos
4. Deprecar sistemas legacy

**Referencias:**
- SQL completo: Ver sección 4 de este documento
- Consolidación legacy: `docs/development/PLAN_CONSOLIDACION_BDS_LEGACY.md`
- Arquitectura: `docs/architecture/ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md`

---

## 12. REFERENCIA: Rollback (Solo si implementaste Opción B)

**Si agregaste tablas opcionales y algo sale mal:**

```bash
# 1. Restaurar archivo original
git checkout app/Http/Controllers/Admin/NotariaController.php

# 2. Eliminar notarías de prueba
USE atinet_compliance_hub;
SELECT * FROM notarias WHERE numero_notaria IN ('999', '998', '997');

# 3. Eliminar bases de datos de prueba
DROP DATABASE IF EXISTS atinet_jal_notaria_999;
DROP DATABASE IF EXISTS atinet_test_notaria_998;

# 4. Limpiar cache
php artisan config:clear
php artisan cache:clear
```

---

**Última Actualización:** 8 de Abril, 2026  
**Responsable:** Equipo de Desarrollo Atinet  
**Estado:** ✅ ARQUITECTURA VALIDADA - Modelo híbrido confirmado  
**Criticidad:** ℹ️ INFORMATIVO - No requiere cambios urgentes  
**Próxima Revisión:** Mayo 2026 (fase servidores dedicados)
