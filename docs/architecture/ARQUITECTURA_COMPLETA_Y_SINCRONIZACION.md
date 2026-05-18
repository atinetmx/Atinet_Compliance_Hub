# 🏗️ Arquitectura Completa: Multi-Tenant + Sincronización + Roadmap

**Fecha:** 8 de Abril, 2026  
**Versión:** 2.0  
**Status:** 📋 Documentación Actualizada

---

## 📊 TABLA DE CONTENIDOS

1. [Arquitectura Multi-Tenant Actual](#1-arquitectura-multi-tenant-actual)
2. [Sistema de Sincronización](#2-sistema-de-sincronización)
3. [Migraciones y Estructura de BD](#3-migraciones-y-estructura-de-bd)
4. [Problemas Identificados](#4-problemas-identificados)
5. [Roadmap de Implementación](#5-roadmap-de-implementación)

---

## 1. ARQUITECTURA MULTI-TENANT ACTUAL

### 1.1. Modelo Database-per-Tenant

Cada notaría tiene su **propia base de datos MySQL local** en un único servidor centralizado.

```
┌─────────────────────────────────────────────────────────┐
│          SERVIDOR MYSQL (127.0.0.1:3306)                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  BD MASTER: atinet_compliance_hub                       │
│  ├── notarias (metadata: 50+ notarías)                  │
│  ├── plans, subscriptions                               │
│  ├── services (catálogo global)                         │
│  ├── plan_services (relaciones)                         │
│  ├── users (solo super_admin)                           │
│  └── busquedas (agregadas de todos los tenants)         │
│                                                          │
│  BDs de DATOS COMPARTIDOS (solo lectura):               │
│  ├── atinet65_listasofac (11 tablas OFAC)              │
│  ├── atinet65_listassat (4 tablas SAT)                 │
│  ├── atinet65_aplicativos (10 tablas legacy)           │
│  └── atinet65_catalogos (estados, municipios, CPs)     │
│                                                          │
│  BDs TENANT (una por notaría):                          │
│  ├── atinet_edomex_notaria_1                           │
│  │   ├── users (admin_notaria + usuarios locales)      │
│  │   ├── busquedas (datos sensibles locales)           │
│  │   ├── registro_web (personas registradas)           │
│  │   ├── agenda_events                                 │
│  │   ├── aplicativos_agenda                            │
│  │   ├── configuracion                                 │
│  │   ├── services (copia local)                        │
│  │   ├── plans (copia local)                           │
│  │   └── [25+ tablas más]                              │
│  │                                                       │
│  ├── atinet_jal_notaria_15                             │
│  │   └── [misma estructura]                            │
│  │                                                       │
│  └── atinet_bcs_notaria_21                             │
│      └── [misma estructura]                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 1.2. Nomenclatura de BDs Tenant

**Formato:** `atinet_{estado}_notaria_{numero}`

**Ejemplos:**
- `atinet_edomex_notaria_1` (Estado de México, Notaría 1)
- `atinet_bcs_notaria_21` (Baja California Sur, Notaría 21)
- `atinet_jal_notaria_15` (Jalisco, Notaría 15)
- `atinet_default_notaria_99` (Sin estado definido)

**Mapeo de códigos de estado:**
```php
// app/Enums/EstadoMexico.php
AGUASCALIENTES → ags
BAJA CALIFORNIA → bc
BAJA CALIFORNIA SUR → bcs
CAMPECHE → camp
CHIAPAS → chis
CHIHUAHUA → chih
COAHUILA → coah
COLIMA → col
CDMX → cdmx
DURANGO → dgo
GUANAJUATO → gto
GUERRERO → gro
HIDALGO → hgo
JALISCO → jal
ESTADO DE MÉXICO → edomex
MICHOACÁN → mich
MORELOS → mor
NAYARIT → nay
NUEVO LEÓN → nl
OAXACA → oax
PUEBLA → pue
QUERÉTARO → qro
QUINTANA ROO → qroo
SAN LUIS POTOSÍ → slp
SINALOA → sin
SONORA → son
TABASCO → tab
TAMAULIPAS → tamps
TLAXCALA → tlax
VERACRUZ → ver
YUCATÁN → yuc
ZACATECAS → zac
```

### 1.3. Proceso de Creación de Notaría

**Ubicación:** `app/Http/Controllers/Admin/NotariaController.php`

**Flujo:**
```php
public function store(Request $request)
{
    // 1. Validar datos
    $validated = $request->validate([...]);
    
    // 2. Crear registro en BD Master
    $notaria = Notaria::create([
        'nombre' => $validated['nombre'],
        'numero_notaria' => $validated['numero_notaria'],
        'estado' => $validated['estado'],
        'plan_id' => $validated['plan_id'],
        // ...
    ]);
    
    // 3. Crear usuario administrador de la notaría
    $adminUser = User::create([
        'name' => $validated['contacto_principal'],
        'email' => $validated['email_contacto'],
        'password' => Hash::make('admin123'),
        'tipo_cuenta' => 'admin_notaria',
        'notaria_id' => $notaria->id,
    ]);
    
    // 4. ✅ CREAR BD ESPECÍFICA PARA LA NOTARÍA
    $this->createNotariaDatabase($notaria);
    
    // 5. Crear suscripción inicial (trial)
    Subscription::create([
        'notaria_id' => $notaria->id,
        'plan_id' => $validated['plan_id'],
        'status' => 'trial',
        'fecha_inicio' => now(),
        'fecha_vencimiento' => now()->addMonth(),
    ]);
    
    // 6. Actualizar contador de usuarios
    $notaria->increment('total_usuarios');
}
```

**Método de creación de BD:**
```php
private function createNotariaDatabase(Notaria $notaria): void
{
    $estadoCodigo = EstadoMexico::getCodeFromName($notaria->estado);
    $databaseName = "atinet_{$estadoCodigo}_notaria_{$notaria->numero_notaria}";
    
    // Crear BD
    DB::statement("CREATE DATABASE IF NOT EXISTS `{$databaseName}` 
                   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    
    // Ejecutar migraciones en la nueva BD
    $this->seedNotariaDatabase($databaseName, $notaria);
}
```

---

## 2. SISTEMA DE SINCRONIZACIÓN

### 2.1. Conexiones a Hostgator

**Servidor Remoto:** `162.144.6.1:3306`

**Bases de datos sincronizadas:**

| BD Remota | BD Local | Propósito | Tablas |
|-----------|----------|-----------|--------|
| `atinet65_listasofac` | `atinet65_listasofac` | Listas OFAC (sanciones internacionales) | 11 |
| `atinet65_listassat` | `atinet65_listassat` | Listas SAT (69-B, 69-C) | 4 |
| `atinet65_aplicativos` | `atinet65_aplicativos` | Sistema legacy (usuarios, búsquedas) | 10+ |
| `atinet65_catalogos` | `atinet65_catalogos` | Catálogos geográficos (estados, municipios) | 3 |

**Configuración en `config/database.php`:**

```php
'connections' => [
    // ===== LOCALES (rápidas, para búsquedas) =====
    'ofac' => [
        'host' => '127.0.0.1',
        'database' => 'atinet65_listasofac',
        // ... credenciales locales
    ],
    'sat' => [
        'host' => '127.0.0.1',
        'database' => 'atinet65_listassat',
    ],
    'aplicativos' => [
        'host' => '127.0.0.1',
        'database' => 'atinet65_aplicativos',
    ],
    'catalogos' => [
        'host' => '127.0.0.1',
        'database' => 'atinet65_catalogos',
    ],
    
    // ===== REMOTAS (solo sincronización) =====
    'ofac_remote' => [
        'host' => '162.144.6.1',
        'database' => 'atinet65_listasofac',
        'username' => 'atinet65_ucompliance',
        // ... credenciales remotas
    ],
    'sat_remote' => [
        'host' => '162.144.6.1',
        'database' => 'atinet65_listassat',
        'username' => 'atinet65_ucompliance',
    ],
    'aplicativos_remote' => [
        'host' => '162.144.6.1',
        'database' => 'atinet65_aplicativos',
        'username' => 'atinet65_ucompliance',
    ],
    'catalogos_remote' => [
        'host' => '162.144.6.1',
        'database' => 'atinet65_catalogos',
        'username' => 'atinet65_ucompliance',
    ],
],
```

### 2.2. Comando de Sincronización

**Comando Artisan:** `php artisan blacklists:sync`

**Ubicación:** `app/Console/Commands/SyncBlacklistsCommand.php`  
**Servicio:** `app/Services/BlacklistSyncService.php`

**Opciones:**
```bash
# Sincronización completa (producción)
php artisan blacklists:sync

# Modo dry-run (sin modificar BD)
php artisan blacklists:sync --dry-run

# Solo verificar conexiones
php artisan blacklists:sync --test
```

**Funcionamiento:**

1. **Detección automática de tablas:** El comando detecta TODAS las tablas de cada BD remota usando `SHOW TABLES`
2. **Sincronización incremental:** Solo trae registros nuevos (no duplicados)
3. **Comparación por ID:** Compara IDs primarios entre BD local y remota
4. **Lotes de 100:** Inserta registros en chunks de 100 para optimizar

**Algoritmo de Sincronización:**
```php
// 1. Obtener IDs locales
$localIds = DB::connection('ofac')->table('SDN')->pluck('ID')->toArray();

// 2. Obtener IDs remotos
$remoteIds = DB::connection('ofac_remote')->table('SDN')->pluck('ID')->toArray();

// 3. Calcular diferencia (solo IDs nuevos)
$newIds = array_diff($remoteIds, $localIds);

// 4. Traer registros nuevos en lotes
$chunks = array_chunk($newIds, 100);
foreach ($chunks as $chunk) {
    $newRecords = DB::connection('ofac_remote')
        ->table('SDN')
        ->whereIn('ID', $chunk)
        ->get();
    
    DB::connection('ofac')->table('SDN')->insert($newRecords);
}
```

### 2.3. Programación Automática

**Producción (Windows Server):**
- **Herramienta:** Programador de Tareas de Windows
- **Frecuencia:** Cada 15 minutos
- **Comando:** `php artisan blacklists:sync`
- **Log:** `storage/logs/laravel.log`

**Desarrollo (Local):**
- **Manual:** Ejecutar `php artisan blacklists:sync` cuando se necesite
- **Scripts de verificación:**
  - `verify_all_tables_synced.php` - Verificar conteos de registros
  - `sync_notaria_status.php` - Sincronizar estados de notarías

### 2.4. Tablas Sincronizadas

#### OFAC (11 tablas):
```
SDN              → Specially Designated Nationals
ALT              → Nombres alternativos
CONS_SDN         → Consolidados SDN
CONS_ALT         → Consolidados alternativos
Nombres          → Base de nombres
Address          → Direcciones
Aircraft         → Aeronaves
Vessel           → Embarcaciones
Identity         → Documentos identidad
Nationality      → Nacionalidades
DateOfBirth      → Fechas nacimiento
```

#### SAT (4 tablas):
```
69-B             → Lista 69-B (empresas incumplidas)
69-C             → Lista 69-C (facturas falsas) ⚠️ Crítica
Version          → Control de versiones
consultas        → Histórico de consultas
```

#### Aplicativos (10+ tablas):
```
usuario          → Usuarios legacy
registro         → Registros históricos
agenda           → Agenda legacy
busquedas        → Búsquedas históricas
notaria          → Catálogo de notarías
... (más tablas según necesidad)
```

### 2.5. Scripts de Sincronización Legacy

**Ubicación:** Raíz del proyecto

| Script | Propósito |
|--------|-----------|
| `sync_notaria_status.php` | Sincronizar estado activo/inactivo según suscripciones |
| `verify_all_tables_synced.php` | Verificar conteo de registros en todas las tablas |
| `remote_db_connector.php` | Probar conexión a Hostgator |
| `verify_remote_connection.php` | Verificar conectividad remota |

---

## 3. MIGRACIONES Y ESTRUCTURA DE BD

### 3.1. Migraciones Actuales (30 archivos)

**Ubicación:** `database/migrations/`

#### Core Laravel (4):
```
0001_01_01_000000_create_users_table.php
0001_01_01_000001_create_cache_table.php
0001_01_01_000002_create_jobs_table.php
2025_08_14_170933_add_two_factor_columns_to_users_table.php
```

#### Fase 1 - Core Business (7):
```
2026_02_05_200235_create_notarias_table.php
2026_02_05_200252_create_busquedas_table.php
2026_02_05_201051_add_notaria_id_to_users_table.php
2026_02_05_210450_create_plans_table.php
2026_02_05_210500_create_subscriptions_table.php
2026_02_05_212550_add_plan_fields_to_notarias_table.php
2026_02_05_215714_rename_codigo_to_numero_notaria_in_notarias_table.php
```

#### Fase 1.5 - Sistema de Servicios (7):
```
2026_02_09_042447_add_plain_password_to_users_table.php
2026_02_09_182402_create_services_table.php
2026_02_09_182531_create_plan_services_table.php
2026_02_09_182641_create_tenant_services_table.php
2026_02_09_182645_create_service_usage_table.php
2026_02_09_194207_create_configuracion_table.php
2026_02_09_215542_add_location_fields_to_notarias_table.php
```

#### Fase 2 - Listas Negras (2):
```
2026_02_19_050006_make_notaria_id_nullable_in_busquedas_table.php
2026_03_20_171918_create_search_histories_table.php
```

#### Fase 3 - Integración Legacy (3):
```
2026_03_09_231456_add_legacy_identifier_to_notarias_table.php
2026_03_11_155847_change_notarias_unique_constraint.php
2026_03_17_205654_add_id_usuario_creador_to_aplicativos_agenda_table.php
```

#### Fase 4 - Agenda (2):
```
2026_03_13_192940_create_agenda_events_table.php
2026_03_13_200528_add_rrule_to_agenda_events_table.php
```

#### Fase 5 - Activity Log (3):
```
2026_03_30_092331_create_activity_log_table.php
2026_03_30_092411_add_batch_uuid_column_to_activity_log_table.php
2026_03_30_092413_add_event_column_to_activity_log_table.php
```

#### Fase 6 - Registro Web (3) ⚠️ **RECIENTES**:
```
2026_03_31_212959_create_registro_web_table.php
2026_04_02_195256_ensure_total_usuarios_column_in_notarias_table.php
2026_04_07_214608_hacer_nullable_campos_persona_moral_registro_web.php
```

### 3.2. ℹ️ NOTA: Modelo Híbrido Legacy + Moderno

El método `createMinimalTables()` en `NotariaController.php` (línea ~400) crea tablas esenciales como fallback.

**Tablas incluidas en createMinimalTables():**
```php
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

**Tablas opcionales (no críticas en fallback):**
```php
⚠️ registro_web → Se usa atinet65_aplicativos.registro (legacy)
⚠️ search_histories → Historial agregado
⚠️ activity_log → Auditoría (se puede agregar después)
⚠️ subscriptions → Manejada en BD Master
```

**Modelo de Datos para Registro Web:**
```
📊 REGISTROS HISTÓRICOS + LEGACY ACTIVOS:
└── atinet65_aplicativos.registro (compartida)
    ├── Registros pasados (años anteriores)
    ├── Registros actuales del sistema legacy
    └── Sincronización: Lectura directa (no copia)

📝 REGISTROS NUEVOS (Sistema Moderno):
└── {tenant}.registro_web (opcional)
    ├── Solo registros del nuevo sistema
    └── QR Scanner + 4 botones de escaneo
```

**Implicación:**
- La tabla `registro_web` NO es crítica para el funcionamiento inicial
- Los usuarios pueden ver registros históricos desde `atinet65_aplicativos.registro`
- Los nuevos registros del sistema moderno irán a `registro_web` (tenant)
- Similar al modelo de OFAC/SAT: BD compartida + copia local opcional

---

## 4. ARQUITECTURA DE DATOS - MODELO HÍBRIDO

### 4.1. ✅ Sistema de Registro Web (Modelo Híbrido)

**Estado:** En desarrollo activo (6-7 April 2026)

**Arquitectura Correcta:**
```
┌─────────────────────────────────────────────────┐
│  BD LEGACY (atinet65_aplicativos)               │
│  Tabla: registro                                 │
│  ├── Registros históricos (años 2020-2025)     │
│  ├── Registros actuales del sistema legacy     │
│  └── Continúa recibiendo registros legacy      │
└─────────────────────────────────────────────────┘
              ↓ Lectura directa
┌─────────────────────────────────────────────────┐
│  SISTEMA MODERNO (Atinet Compliance Hub)        │
│  ├── Lee: atinet65_aplicativos.registro        │
│  │   (todos los registros legacy)               │
│  └── Escribe: {tenant}.registro_web             │
│      (solo registros nuevos QR Scanner)         │
└─────────────────────────────────────────────────┘
```

**Funcionamiento:**
1. **Lectura:** Sistema lee TODOS los registros desde `atinet65_aplicativos.registro`
2. **Escritura Moderna:** Nuevos registros vía QR Scanner → `{tenant}.registro_web`
3. **Coexistencia:** Sistema legacy sigue operando, ambos sistemas alimentan el pool
4. **Transición Gradual:** Similar a OFAC/SAT, se mantiene BD legacy como fuente

**Implicación:**
- ✅ Tabla `registro_web` en tenant es OPCIONAL
- ✅ QR Scanner puede escribir directamente a `atinet65_aplicativos.registro` si no existe tenant table
- ✅ No hay pérdida de funcionalidad para nuevas notarías
- ✅ Continuidad con sistema legacy garantizada

### 4.2. ⚠️ MEDIO: Falta Activity Log

**Problema:**
- No se crea tabla `activity_log` en tenants
- Auditoría no funciona por notaría
- No hay tracking de cambios locales

**Solución:**
Agregar tablas de Spatie Activity Log a `createMinimalTables()`

### 4.3. ⚠️ MEDIO: Search Histories Duplicada

**Problema:**
- `search_histories` es prácticamente igual a `busquedas`
- Posible duplicación de datos
- Confusión en el modelo de datos

**Solución:**
- Decidir si consolidar en una sola tabla
- O definir propósitos distintos claramente
- Documentar diferencias

### 4.4. 🔄 PROCESO: Sincronización Manual en Dev

**Problema:**
- En desarrollo, sincronización es manual
- Fácil olvidar ejecutar `php artisan blacklists:sync`
- Datos desactualizados al probar búsquedas

**Solución:**
- Crear script `.bat` de sincronización rápida
- Agregar recordatorio en `README.md`
- Considerar sincronización automática local cada hora

---

## 5. ROADMAP DE IMPLEMENTACIÓN

### 5.1. PRIORIDAD 1: Terminar Registro Web (1-2 semanas)

#### Objetivo:
Completar los 4 botones del sistema de Registro Web antes de arquitectura distribuida.

#### Tareas:
- [x] Button 1: QR Scanner (COMPLETADO - 8 April)
  - [x] ScannerQR component
  - [x] QR Parser (6 formatos)
  - [x] SAT Scraper backend
  - [x] Auto-fill form
  - [x] Tests passing
- [ ] Button 2: Escaner INE (pendiente)
- [ ] Button 3: Escaner CURP (pendiente)
- [ ] Button 4: Escaner Acta (pendiente)
- [ ] Integración completa con `registro_web` table
- [ ] Testing end-to-end de flujo completo

### 5.2. PRIORIDAD 2: Actualizar NotariaController (3-5 días)

#### Objetivo:
Garantizar que TODAS las migraciones se ejecutan en BDs de nuevas notarías.

#### Tareas:
- [ ] Agregar SQL completo de `registro_web` a `createMinimalTables()`
- [ ] Agregar tablas de `activity_log` (3 tablas)
- [ ] Agregar `search_histories` si se mantiene
- [ ] Verificar que `createMinimalTables()` es fallback, no primario
- [ ] Asegurar que `runMigrationsForTenant()` es el método principal
- [ ] Agregar logging detallado de qué tablas se crean
- [ ] Testing: Crear notaría de prueba y verificar 100% de tablas

#### Checklist de Tablas Críticas:
```sql
✅ users
✅ configuracion
✅ services
✅ plan_services
✅ tenant_services
✅ service_usage
✅ plans
✅ busquedas
✅ agenda_events
✅ aplicativos_agenda
⬜ registro_web ← AGREGAR
⬜ activity_log ← AGREGAR
⬜ activity_log (batch_uuid) ← AGREGAR
⬜ activity_log (event) ← AGREGAR
⬜ search_histories ← DECIDIR
⬜ subscriptions ← VERIFICAR SI NECESARIA
```

### 5.3. PRIORIDAD 3: Documentar Sincronización (2-3 días)

#### Objetivo:
Facilitar sincronización en desarrollo y producción.

#### Tareas:
- [ ] Crear `docs/SINCRONIZACION_COMPLETA.md`
  - [ ] Guía paso a paso para desarrollo
  - [ ] Configuración de Programador de Tareas (Windows)
  - [ ] Troubleshooting de conexiones remotas
  - [ ] Tiempos estimados de sincronización
- [ ] Crear script `.bat` para sincronización rápida en dev
  ```batch
  @echo off
  echo Sincronizando listas negras...
  php artisan blacklists:sync --dry-run
  php artisan blacklists:sync
  echo Verificando sincronizacion...
  php verify_all_tables_synced.php
  pause
  ```
- [ ] Agregar sección en `README.md` sobre sincronización
- [ ] Documentar credenciales necesarias en `.env.example`

### 5.4. PRIORIDAD 4: Servidores Dedicados (2-3 meses) - FUTURO

#### Objetivo:
Permitir que cada notaría tenga su propia BD en su propio servidor físico.

#### Contexto del Cliente:
- **50+ notarías activas**
- **Cada una con su propio servidor Windows/Linux**
- **Datos notariales sensibles** (requisito legal)
- **Demo en 2 semanas, producción en 2 meses**

#### Arquitectura Propuesta:

```
┌───────────────────────────────────────────────────────────┐
│       SERVIDOR CENTRAL ATINET (Master BD)                 │
│       Host: atinet-central.com                            │
├───────────────────────────────────────────────────────────┤
│  BD MASTER: atinet_compliance_hub                         │
│  ├── notarias (metadata + server_config):                 │
│  │   ├── id, nombre, numero_notaria                       │
│  │   ├── db_host (IP del servidor de la notaría)        │
│  │   ├── db_port (3306)                                   │
│  │   ├── db_name (atinet_xxx_notaria_yy)                 │
│  │   ├── db_username (encriptado)                         │
│  │   ├── db_password (encriptado)                         │
│  │   ├── servidor_dedicado (boolean)                      │
│  │   ├── conexion_status (verificada/error)              │
│  │   └── ultima_sincronizacion (timestamp)               │
│  ├── plans, services (catálogos globales)                 │
│  └── aggregated_metrics (cache de métricas)              │
└───────────────────────────────────────────────────────────┘
                             ↓
                    Sincronización cada 15 min
                             ↓
┌───────────────────────────────────────────────────────────┐
│  SERVIDOR NOTARÍA 1 (192.168.1.10 - Estado México #1)    │
│  ├── atinet_edomex_notaria_1                             │
│  │   ├── users (admin + usuarios locales)                │
│  │   ├── busquedas                                        │
│  │   ├── registro_web                                     │
│  │   └── [datos sensibles completos]                     │
│  └── Sincroniza métricas ← Master                        │
└───────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────┐
│  SERVIDOR NOTARÍA 15 (192.168.1.25 - Jalisco #15)        │
│  ├── atinet_jal_notaria_15                                │
│  │   └── [misma estructura]                              │
│  └── Sincroniza métricas ← Master                        │
└───────────────────────────────────────────────────────────┘

... (50+ servidores más)
```

#### Fases de Implementación:

**Mes 1 - Demo (2 semanas):**
1. Migrar tabla `notarias` (agregar campos de servidor)
2. Crear middleware `SetTenantDatabaseConnection`
3. Actualizar `NotariaController` (servidor dedicado)
4. Probar con 3 notarías en 3 servidores diferentes
5. UI para configurar conexión de servidor

**Mes 2-3 - Producción Completa:**
1. Job de sincronización bidireccional (`SyncTenantDataJob`)
2. Dashboard de monitoreo de servidores (status, latencia)
3. Sistema de fallback (si servidor cae, redirigir a central)
4. Migración gradual: 5 notarías por semana
5. Testing exhaustivo de conectividad
6. Documentación para IT de cada notaría
7. Capacitación a administradores

#### Componentes Nuevos Requeridos:

**1. Migración (campos nuevos):**
```php
Schema::table('notarias', function (Blueprint $table) {
    $table->string('db_host')->nullable();
    $table->integer('db_port')->default(3306);
    $table->string('db_name')->nullable();
    $table->string('db_username')->nullable();
    $table->string('db_password')->nullable(); // Encriptado
    $table->boolean('servidor_dedicado')->default(false);
    $table->string('conexion_status')->default('no_verificada');
    $table->timestamp('ultima_sincronizacion')->nullable();
});
```

**2. Middleware:**
```php
// app/Http/Middleware/SetTenantDatabaseConnection.php
```

**3. Job de Sincronización:**
```php
// app/Jobs/SyncTenantDataJob.php
// Ejecutar cada 15 minutos para cada notaría
```

**4. Dashboard de Monitoreo:**
```tsx
// resources/js/pages/Admin/ServidoresMonitoreo.tsx
```

**5. Tests:**
```php
// tests/Feature/MultiServerTenantTest.php
```

---

## 6. SCRIPTS ÚTILES

### 6.1. Sincronización Completa
```bash
# Producción
php artisan blacklists:sync

# Desarrollo
php artisan blacklists:sync --dry-run  # Primero verificar
php artisan blacklists:sync            # Luego ejecutar
php verify_all_tables_synced.php       # Verificar resultado
```

### 6.2. Verificación de Sistema
```bash
# Verificar conexiones
php artisan blacklists:sync --test

# Estado de notarías
php sync_notaria_status.php

# Verificar tablas
php verify_all_tables_synced.php

# Conexión remota
php verify_remote_connection.php
```

### 6.3. Debugging
```bash
# Verificar subscripciones
php verify_all_subscriptions.php

# Verificar usuarios
php check_user_access.php

# Verificar busquedas
php verify_busquedas_breakdown.php
```

---

## 7. CONCLUSIONES

### Estado Actual: ✅ FUNCIONAL
- Sistema multi-tenant con database-per-tenant **FUNCIONA**
- Sincronización incremental con Hostgator **OPERATIVA**
- 50+ notarías funcionando en servidor local

### Problemas Urgentes: ⚠️
1. **CRÍTICO:** Tabla `registro_web` faltante en `createMinimalTables()`
2. **MEDIO:** Activity Log no se crea en tenants nuevos
3. **PROCESO:** Sincronización manual en desarrollo es propensa a olvidos

### Próximos Pasos:
1. ✅ **Terminar Registro Web** (1-2 semanas)
2. 🔧 **Actualizar NotariaController** (3-5 días)
3. 📚 **Documentar Sincronización** (2-3 días)
4. 🏗️ **Servidores Dedicados** (2-3 meses) - FUTURO

---

**Última Actualización:** 8 de Abril, 2026  
**Responsable:** Equipo de Desarrollo Atinet  
**Versión:** 2.0
