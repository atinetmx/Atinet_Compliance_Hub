# 🔄 Plan de Consolidación: BDs Legacy → BD Master

**Fecha:** 8 de Abril, 2026  
**Objetivo:** Incorporar tablas legacy a BD Master vía migraciones  
**Timeline:** 15-19 Abril (1 semana)  
**Responsable:** Backend Team

---

## 📋 ÍNDICE

1. [Objetivo Estratégico](#1-objetivo-estratégico)
2. [BDs Legacy a Consolidar](#2-bds-legacy-a-consolidar)
3. [Estrategia de Implementación](#3-estrategia-de-implementación)
4. [Migraciones Requeridas](#4-migraciones-requeridas)
5. [Seeders de Migración](#5-seeders-de-migración)
6. [Plan de Testing](#6-plan-de-testing)
7. [Roadmap de Ejecución](#7-roadmap-de-ejecución)

---

## 1. OBJETIVO ESTRATÉGICO

### 1.1. Problema Actual

```
┌──────────────────────────────────────────────────────┐
│  SITUACIÓN ACTUAL (Abril 2026)                       │
├──────────────────────────────────────────────────────┤
│                                                       │
│  BD Master (atinet_compliance_hub)                   │
│  ├── notarias, plans, subscriptions                  │
│  └── NO tiene tablas legacy                          │
│                                                       │
│  BDs Legacy (separadas - Hostgator)                  │
│  ├── atinet65_listasofac (11 tablas)                │
│  ├── atinet65_listassat (4 tablas)                  │
│  ├── atinet65_aplicativos (10+ tablas)              │
│  └── atinet65_catalogos (3 tablas)                  │
│                                                       │
│  Problema:                                            │
│  ❌ php artisan migrate:fresh NO crea tablas legacy  │
│  ❌ Dependencia de sincronización manual             │
│  ❌ Dificulta desarrollo en entornos nuevos          │
└──────────────────────────────────────────────────────┘
```

### 1.2. Objetivo Final

```
┌──────────────────────────────────────────────────────┐
│  OBJETIVO (Post-consolidación)                        │
├──────────────────────────────────────────────────────┤
│                                                       │
│  BD Master (atinet_compliance_hub)                   │
│  ├── Tablas actuales (notarias, plans, etc.)        │
│  ├── Tablas OFAC (11 tablas)                        │
│  ├── Tablas SAT (4 tablas)                          │
│  ├── Tablas Aplicativos (registro, agenda, etc.)    │
│  └── Tablas Catalogos (estados, municipios, CPs)    │
│                                                       │
│  ✅ php artisan migrate:fresh crea TODO              │
│  ✅ db:seed llena datos legacy automáticamente       │
│  ✅ Desarrollo auto-suficiente sin Hostgator         │
│  ✅ Preparado para deprecar BDs legacy               │
└──────────────────────────────────────────────────────┘
```

---

## 2. BDS LEGACY A CONSOLIDAR

### 2.1. BD: atinet65_listasofac (11 tablas)

**Propósito:** Listas de sanciones OFAC (Specially Designated Nationals)

**Tablas a migrar:**

| Tabla | Campos Clave | Registros Aprox | Migración |
|-------|--------------|-----------------|-----------|
| `SDN` | ID, LastName, FirstName, Type | ~15,000 | Alta prioridad |
| `ALT` | ID, SDN_ID, AltName | ~8,000 | Alta prioridad |
| `CONS_SDN` | ID, ConsolidatedID | ~12,000 | Media |
| `CONS_ALT` | ID, ConsolidatedID | ~6,000 | Media |
| `Nombres` | ID, Name | ~20,000 | Alta |
| `Address` | ID, SDN_ID, Address1, City, Country | ~10,000 | Media |
| `Aircraft` | ID, SDN_ID, TailNumber | ~500 | Baja |
| `Vessel` | ID, SDN_ID, VesselName | ~1,000 | Baja |
| `Identity` | ID, SDN_ID, IDType, IDNumber | ~8,000 | Media |
| `Nationality` | ID, SDN_ID, Country | ~12,000 | Media |
| `DateOfBirth` | ID, SDN_ID, DOB | ~10,000 | Media |

**Total estimado:** ~100,000 registros

### 2.2. BD: atinet65_listassat (4 tablas)

**Propósito:** Listas SAT (69-B, 69-C)

**Tablas a migrar:**

| Tabla | Campos Clave | Registros Aprox | Migración |
|-------|--------------|-----------------|-----------|
| `69-B` | ID, RFC, Nombre, Situacion | ~1,200 | Alta prioridad |
| `69-C` | ID, RFC, Nombre, Situacion | ~5,600 | Alta prioridad |
| `Version` | ID, Lista, FechaPublicacion | ~50 | Alta |
| `consultas` | ID, RFC, Resultado, Fecha | ~10,000 | Baja (histórico) |

**Total estimado:** ~17,000 registros

### 2.3. BD: atinet65_aplicativos (10+ tablas)

**Propósito:** Sistema legacy principal (usuarios, registros, agenda)

**Tablas críticas a migrar:**

| Tabla | Campos Clave | Registros Aprox | Migración |
|-------|--------------|-----------------|-----------|
| `registro` | ID, notaria, nombre, curp, rfc | ~50,000 | Alta prioridad |
| `agenda` | ID, notaria, fecha, evento | ~1,000 (migrado) | Media |
| `usuario` | ID, notaria, nombre, email | ~500 | Media |
| `busquedas` | ID, notaria, tipo, resultado | ~20,000 | Media |
| `notaria` | ID, codigo, nombre, estado | ~50 | Alta |

**Tablas adicionales:**
- `configuracion`
- `log_actividades`
- `permisos`
- Otras según análisis

**Total estimado:** ~100,000 registros

### 2.4. BD: atinet65_catalogos (3 tablas)

**Propósito:** Catálogos geográficos (estados, municipios, códigos postales)

**Tablas a migrar:**

| Tabla | Campos Clave | Registros Aprox | Migración |
|-------|--------------|-----------------|-----------|
| `estados` | ID, codigo, nombre | 32 | Alta prioridad |
| `municipios` | ID, estado_id, nombre | ~2,500 | Alta prioridad |
| `codigos_postales` | ID, municipio_id, cp | ~140,000 | Media |

**Total estimado:** ~142,000 registros

---

## 3. ESTRATEGIA DE IMPLEMENTACIÓN

### 3.1. Enfoque: Migraciones + Seeders

**Paso 1: Crear Migraciones** (estructura de tablas)
```bash
# Crear migraciones para cada BD legacy
php artisan make:migration create_ofac_tables --path=database/migrations/legacy
php artisan make:migration create_sat_tables --path=database/migrations/legacy
php artisan make:migration create_aplicativos_legacy_tables --path=database/migrations/legacy
php artisan make:migration create_catalogos_tables --path=database/migrations/legacy
```

**Paso 2: Crear Seeders** (datos históricos)
```bash
# Seeders para migrar datos
php artisan make:seeder OfacLegacySeeder
php artisan make:seeder SatLegacySeeder
php artisan make:seeder AplicativosLegacySeeder
php artisan make:seeder CatalogosLegacySeeder
```

**Paso 3: Ejecutar Consolidación**
```bash
# En entorno desarrollo
php artisan migrate:fresh
php artisan db:seed --class=LegacyConsolidationSeeder

# ✅ Resultado: BD Master con TODAS las tablas + datos
```

### 3.2. Sistema Híbrido (Transición)

**Durante transición (Abril-Junio 2026):**

1. **Lectura:** Priorizar BD Master, fallback a legacy si no existe
   ```php
   // Intentar leer de BD Master consolidada
   $ofacData = DB::connection('mysql')->table('ofac_sdn')->where(...)->first();
   
   // Si no existe, leer de legacy (compatibilidad)
   if (!$ofacData) {
       $ofacData = DB::connection('ofac')->table('SDN')->where(...)->first();
   }
   ```

2. **Escritura:** Escribir a BD Master (nueva data)
   ```php
   // Nuevos registros van a BD Master
   DB::connection('mysql')->table('registro')->insert($nuevoRegistro);
   ```

3. **Sincronización:** Job para mantener legacy actualizado (opcional)
   ```php
   // Si sistema legacy aún se usa, sincronizar cambios
   SyncToLegacyJob::dispatch($nuevoRegistro);
   ```

---

## 4. MIGRACIONES REQUERIDAS

### 4.1. Migración: OFAC Tables

**Archivo:** `database/migrations/legacy/2026_04_15_000001_create_ofac_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // ===== TABLA: ofac_sdn (Specially Designated Nationals) =====
        Schema::create('ofac_sdn', function (Blueprint $table) {
            $table->id('ent_num')->comment('Entity Number - Primary Key');
            $table->string('sdn_name', 350)->nullable()->comment('Full Name');
            $table->string('sdn_type', 12)->nullable()->comment('Individual/Entity/Vessel/Aircraft');
            $table->string('program', 200)->nullable()->comment('Sanctions Program');
            $table->string('title', 200)->nullable()->comment('Title/Position');
            $table->string('call_sign', 8)->nullable()->comment('Vessel Call Sign');
            $table->string('vess_type', 25)->nullable()->comment('Vessel Type');
            $table->string('tonnage', 14)->nullable()->comment('Vessel Tonnage');
            $table->string('grt', 8)->nullable()->comment('Gross Register Tonnage');
            $table->string('vess_flag', 40)->nullable()->comment('Vessel Flag');
            $table->string('vess_owner', 150)->nullable()->comment('Vessel Owner');
            $table->text('remarks')->nullable()->comment('Additional Notes');
            
            $table->index('sdn_name');
            $table->index('sdn_type');
            $table->index('program');
        });
        
        // ===== TABLA: ofac_alt (Alternative Names) =====
        Schema::create('ofac_alt', function (Blueprint $table) {
            $table->id('ent_num')->comment('Entity Number - Primary Key');
            $table->unsignedBigInteger('fixed_ref')->comment('Reference to SDN');
            $table->string('alt_type', 8)->nullable()->comment('Type of Alternative Name');
            $table->string('alt_name', 350)->nullable()->comment('Alternative Name');
            $table->text('alt_remarks')->nullable()->comment('Remarks');
            
            $table->index('fixed_ref');
            $table->index('alt_name');
        });
        
        // ===== TABLA: ofac_address =====
        Schema::create('ofac_address', function (Blueprint $table) {
            $table->id('ent_num');
            $table->unsignedBigInteger('fixed_ref');
            $table->string('address', 750)->nullable();
            $table->string('city_state_province_postalcode', 116)->nullable();
            $table->string('country', 250)->nullable();
            $table->text('add_remarks')->nullable();
            
            $table->index('fixed_ref');
            $table->index('country');
        });
        
        // ===== TABLA: ofac_identity (IDs: Passport, etc) =====
        Schema::create('ofac_identity', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixed_ref');
            $table->string('id_type', 50)->nullable()->comment('Passport, National ID, etc');
            $table->string('id_number', 200)->nullable();
            $table->string('id_country', 100)->nullable();
            $table->string('issue_date', 10)->nullable();
            $table->string('expiration_date', 10)->nullable();
            
            $table->index('fixed_ref');
            $table->index(['id_type', 'id_number']);
        });
        
        // ===== TABLA: ofac_nationality =====
        Schema::create('ofac_nationality', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixed_ref');
            $table->string('country', 100)->nullable();
            $table->string('main_entry', 1)->nullable()->comment('Y/N - Primary Nationality');
            
            $table->index('fixed_ref');
            $table->index('country');
        });
        
        // ===== TABLA: ofac_date_of_birth =====
        Schema::create('ofac_date_of_birth', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixed_ref');
            $table->string('date_of_birth', 50)->nullable();
            $table->string('main_entry', 1)->nullable()->comment('Y/N - Primary DOB');
            
            $table->index('fixed_ref');
        });
        
        // ===== TABLA: ofac_vessel =====
        Schema::create('ofac_vessel', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixed_ref');
            $table->string('call_sign', 50)->nullable();
            $table->string('vessel_type', 100)->nullable();
            $table->string('vessel_flag', 100)->nullable();
            $table->string('vessel_owner', 200)->nullable();
            $table->string('tonnage', 50)->nullable();
            $table->string('grt', 50)->nullable();
            
            $table->index('fixed_ref');
        });
        
        // ===== TABLA: ofac_aircraft =====
        Schema::create('ofac_aircraft', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixed_ref');
            $table->string('tail_number', 50)->nullable();
            $table->string('aircraft_manufacturer', 100)->nullable();
            $table->string('aircraft_model', 100)->nullable();
            $table->string('aircraft_operator', 200)->nullable();
            $table->string('aircraft_serial_number', 100)->nullable();
            
            $table->index('fixed_ref');
            $table->index('tail_number');
        });
        
        // ===== TABLAS CONSOLIDADAS (si se usan) =====
        Schema::create('ofac_cons_sdn', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixed_ref');
            $table->unsignedBigInteger('consolidated_id');
            
            $table->index('fixed_ref');
            $table->index('consolidated_id');
        });
        
        Schema::create('ofac_cons_alt', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('fixed_ref');
            $table->unsignedBigInteger('consolidated_id');
            
            $table->index('fixed_ref');
            $table->index('consolidated_id');
        });
        
        // ===== TABLA: ofac_nombres (auxiliar) =====
        Schema::create('ofac_nombres', function (Blueprint $table) {
            $table->id();
            $table->string('name', 500)->nullable();
            $table->string('type', 50)->nullable();
            $table->timestamps();
            
            $table->index('name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ofac_nombres');
        Schema::dropIfExists('ofac_cons_alt');
        Schema::dropIfExists('ofac_cons_sdn');
        Schema::dropIfExists('ofac_aircraft');
        Schema::dropIfExists('ofac_vessel');
        Schema::dropIfExists('ofac_date_of_birth');
        Schema::dropIfExists('ofac_nationality');
        Schema::dropIfExists('ofac_identity');
        Schema::dropIfExists('ofac_address');
        Schema::dropIfExists('ofac_alt');
        Schema::dropIfExists('ofac_sdn');
    }
};
```

### 4.2. Migración: SAT Tables

**Archivo:** `database/migrations/legacy/2026_04_15_000002_create_sat_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ===== TABLA: sat_69b (Listado 69-B) =====
        Schema::create('sat_69b', function (Blueprint $table) {
            $table->id();
            $table->string('rfc', 13)->unique()->comment('RFC de contribuyente');
            $table->string('nombre_razon_social', 255)->nullable();
            $table->string('situacion', 100)->nullable()->comment('Incumplimiento detectado');
            $table->date('fecha_publicacion')->nullable();
            $table->date('fecha_primera_publicacion')->nullable();
            $table->text('supuesto')->nullable()->comment('Artículo/Fracción');
            $table->timestamps();
            
            $table->index('rfc');
            $table->index('fecha_publicacion');
        });
        
        // ===== TABLA: sat_69c (Listado 69-C - Presuntos) =====
        Schema::create('sat_69c', function (Blueprint $table) {
            $table->id();
            $table->string('rfc', 13)->unique()->comment('RFC presunto');
            $table->string('nombre_razon_social', 255)->nullable();
            $table->string('situacion', 100)->nullable()->comment('Presunta emisión de CFDI');
            $table->date('fecha_publicacion')->nullable();
            $table->date('fecha_primera_publicacion')->nullable();
            $table->text('supuesto')->nullable();
            $table->timestamps();
            
            $table->index('rfc');
            $table->index('fecha_publicacion');
        });
        
        // ===== TABLA: sat_version (Control de actualizaciones) =====
        Schema::create('sat_version', function (Blueprint $table) {
            $table->id();
            $table->enum('lista', ['69-B', '69-C'])->comment('Tipo de lista');
            $table->date('fecha_publicacion')->comment('Fecha oficial SAT');
            $table->date('fecha_descarga')->nullable()->comment('Fecha descarga a nuestro sistema');
            $table->integer('total_registros')->default(0);
            $table->string('url_fuente', 500)->nullable();
            $table->timestamps();
            
            $table->index(['lista', 'fecha_publicacion']);
        });
        
        // ===== TABLA: sat_consultas (Histórico búsquedas) =====
        Schema::create('sat_consultas', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('notaria_id')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->string('rfc', 13);
            $table->enum('lista_consultada', ['69-B', '69-C', 'Ambas'])->default('Ambas');
            $table->enum('resultado', ['encontrado', 'limpio', 'error'])->default('limpio');
            $table->text('detalles')->nullable();
            $table->ipAddress('ip_address')->nullable();
            $table->timestamps();
            
            $table->index('rfc');
            $table->index('notaria_id');
            $table->index('created_at');
            
            $table->foreign('notaria_id')->references('id')->on('notarias')->onDelete('set null');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sat_consultas');
        Schema::dropIfExists('sat_version');
        Schema::dropIfExists('sat_69c');
        Schema::dropIfExists('sat_69b');
    }
};
```

### 4.3. Migración: Catálogos Geográficos

**Archivo:** `database/migrations/legacy/2026_04_15_000003_create_catalogos_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ===== TABLA: estados (32 estados de México) =====
        Schema::create('estados', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 10)->unique()->comment('Código ISO/INEGI');
            $table->string('nombre', 100)->unique();
            $table->string('abreviatura', 10)->nullable();
            $table->integer('orden')->default(0)->comment('Orden alfabético');
            $table->timestamps();
            
            $table->index('codigo');
            $table->index('nombre');
        });
        
        // ===== TABLA: municipios (~2,500 municipios) =====
        Schema::create('municipios', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('estado_id');
            $table->string('codigo', 10)->comment('Código INEGI');
            $table->string('nombre', 150);
            $table->timestamps();
            
            $table->foreign('estado_id')->references('id')->on('estados')->onDelete('cascade');
            $table->index(['estado_id', 'nombre']);
            $table->index('codigo');
        });
        
        // ===== TABLA: codigos_postales (~140,000 CPs) =====
        Schema::create('codigos_postales', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('municipio_id');
            $table->string('codigo_postal', 5)->comment('CP de 5 dígitos');
            $table->string('colonia', 200)->nullable();
            $table->string('tipo_asentamiento', 50)->nullable()->comment('Colonia, Fraccionamiento, etc');
            $table->string('zona', 20)->nullable()->comment('Urbano, Rural');
            $table->timestamps();
            
            $table->foreign('municipio_id')->references('id')->on('municipios')->onDelete('cascade');
            $table->index('codigo_postal');
            $table->index(['municipio_id', 'codigo_postal']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('codigos_postales');
        Schema::dropIfExists('municipios');
        Schema::dropIfExists('estados');
    }
};
```

### 4.4. Migración: Aplicativos Legacy (Registro, Agenda, etc)

**Archivo:** `database/migrations/legacy/2026_04_15_000004_create_aplicativos_legacy_tables.php`

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ===== TABLA: legacy_registro (histórico) =====
        Schema::create('legacy_registro', function (Blueprint $table) {
            $table->id();
            
            // Metadata
            $table->date('dia_registro');
            $table->string('notaria', 30)->index();
            
            // Datos personales básicos
            $table->string('nombre', 30);
            $table->string('apellidopat', 30);
            $table->string('apellidomat', 30);
            $table->string('alias', 100)->nullable();
            $table->string('curp', 50)->nullable()->index();
            $table->string('rfc', 50)->nullable()->index();
            $table->date('dia')->nullable();
            $table->string('genero', 50)->nullable();
            
            // Nacionalidad
            $table->string('paisnac', 100)->nullable();
            $table->string('nacionalidad', 100)->nullable();
            $table->string('estado_nac', 100)->nullable();
            $table->string('ciudad_nac', 100)->nullable();
            $table->string('municipio_nac', 100)->nullable();
            
            // Información adicional
            $table->string('ocupacion', 100)->nullable();
            $table->string('edo_civil', 100)->nullable();
            $table->string('conyuge', 100)->nullable();
            
            // Domicilio (simplificado - agregar campos según necesidad)
            $table->string('calle', 100)->nullable();
            $table->string('no_exterior', 100)->nullable();
            $table->string('colonia', 100)->nullable();
            $table->string('codigo_postal', 100)->nullable();
            $table->string('ciudad', 100)->nullable();
            $table->string('estado', 100)->nullable();
            
            // Contacto
            $table->string('telefono', 50)->nullable();
            $table->string('email', 100)->nullable();
            
            // Timestamps
            $table->timestamps();
            $table->softDeletes();
            
            $table->index(['notaria', 'dia_registro']);
        });
        
        // ===== TABLA: legacy_agenda (histórico) =====
        Schema::create('legacy_agenda', function (Blueprint $table) {
            $table->id();
            $table->string('notaria', 30)->index();
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->string('titulo', 255);
            $table->text('descripcion')->nullable();
            $table->dateTime('fecha_inicio');
            $table->dateTime('fecha_fin')->nullable();
            $table->enum('tipo', ['cita', 'recordatorio', 'evento', 'general'])->default('general');
            $table->string('color', 20)->nullable();
            $table->timestamps();
            
            $table->index(['notaria', 'fecha_inicio']);
        });
        
        // ===== TABLA: legacy_usuario (histórico) =====
        Schema::create('legacy_usuario', function (Blueprint $table) {
            $table->id();
            $table->string('notaria', 30)->index();
            $table->string('nombre', 255);
            $table->string('email', 255)->unique();
            $table->string('password', 255)->nullable()->comment('Hasheado del sistema legacy');
            $table->string('tipo_cuenta', 50)->default('usuario');
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
        
        // ===== TABLA: legacy_busquedas (histórico) =====
        Schema::create('legacy_busquedas', function (Blueprint $table) {
            $table->id();
            $table->string('notaria', 30)->index();
            $table->unsignedBigInteger('usuario_id')->nullable();
            $table->string('nombre', 255)->nullable();
            $table->string('curp', 18)->nullable();
            $table->string('rfc', 13)->nullable();
            $table->enum('tipo_busqueda', ['ofac', 'sat', 'aplicativos', 'combinada'])->default('combinada');
            $table->enum('resultado', ['encontrado', 'limpio', 'error'])->default('limpio');
            $table->text('detalles')->nullable();
            $table->timestamps();
            
            $table->index(['notaria', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('legacy_busquedas');
        Schema::dropIfExists('legacy_usuario');
        Schema::dropIfExists('legacy_agenda');
        Schema::dropIfExists('legacy_registro');
    }
};
```

---

## 5. SEEDERS DE MIGRACIÓN

### 5.1. Seeder Master: LegacyConsolidationSeeder

**Archivo:** `database/seeders/LegacyConsolidationSeeder.php`

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class LegacyConsolidationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('🔄 Iniciando consolidación de BDs Legacy...');
        
        // 1. Catálogos geográficos (primero - son FK para otros)
        $this->command->info('📍 Migrando catálogos geográficos...');
        $this->call(CatalogosLegacySeeder::class);
        
        // 2. OFAC (prioridad alta)
        $this->command->info('🌍 Migrando listas OFAC...');
        $this->call(OfacLegacySeeder::class);
        
        // 3. SAT (prioridad alta)
        $this->command->info('🇲🇽 Migrando listas SAT...');
        $this->call(SatLegacySeeder::class);
        
        // 4. Aplicativos (registro, agenda, usuarios)
        $this->command->info('📋 Migrando datos de Aplicativos...');
        $this->call(AplicativosLegacySeeder::class);
        
        $this->command->info('✅ Consolidación completada!');
        $this->command->newLine();
        
        // Stats
        $this->showStats();
    }
    
    private function showStats(): void
    {
        $stats = [
            'OFAC SDN' => \DB::table('ofac_sdn')->count(),
            'OFAC ALT' => \DB::table('ofac_alt')->count(),
            'SAT 69-B' => \DB::table('sat_69b')->count(),
            'SAT 69-C' => \DB::table('sat_69c')->count(),
            'Estados' => \DB::table('estados')->count(),
            'Municipios' => \DB::table('municipios')->count(),
            'CPs' => \DB::table('codigos_postales')->count(),
            'Registros Legacy' => \DB::table('legacy_registro')->count(),
            'Agenda Legacy' => \DB::table('legacy_agenda')->count(),
        ];
        
        $this->command->table(
            ['Tabla', 'Registros'],
            collect($stats)->map(fn($count, $table) => [$table, number_format($count)])->values()
        );
    }
}
```

### 5.2. Seeder: OfacLegacySeeder

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OfacLegacySeeder extends Seeder
{
    public function run(): void
    {
        // Verificar si existe conexión a BD legacy
        try {
            DB::connection('ofac_remote')->getPdo();
            $useRemote = true;
            $this->command->warn('📡 Usando BD remota (Hostgator)');
        } catch (\Exception $e) {
            // Si no hay remota, intentar local
            try {
                DB::connection('ofac')->getPdo();
                $useRemote = false;
                $this->command->info('💻 Usando BD local');
            } catch (\Exception $e) {
                $this->command->error('❌ No hay conexión OFAC disponible');
                return;
            }
        }
        
        $connection = $useRemote ? 'ofac_remote' : 'ofac';
        
        // Migrar tabla SDN
        $this->migrateSdnTable($connection);
        
        // Migrar tabla ALT
        $this->migrateAltTable($connection);
        
        // Migrar otras tablas...
        $this->migrateAddressTable($connection);
        $this->migrateIdentityTable($connection);
        // ... etc
    }
    
    private function migrateSdnTable(string $connection): void
    {
        $this->command->info('  → Migrando SDN...');
        
        $chunkSize = 1000;
        $totalMigrated = 0;
        
        DB::connection($connection)->table('SDN')->orderBy('ent_num')->chunk($chunkSize, function ($records) use (&$totalMigrated) {
            $data = $records->map(function ($record) {
                return [
                    'ent_num' => $record->ent_num,
                    'sdn_name' => $record->sdn_name,
                    'sdn_type' => $record->sdn_type,
                    'program' => $record->program,
                    'title' => $record->title,
                    'remarks' => $record->remarks,
                    // ... mapear todos los campos
                ];
            })->toArray();
            
            DB::table('ofac_sdn')->insertOrIgnore($data);
            $totalMigrated += count($data);
            
            $this->command->info("    ✓ {$totalMigrated} registros migrados...");
        });
        
        $this->command->info("  ✅ SDN: {$totalMigrated} registros totales");
    }
    
    // Métodos similares para otras tablas...
}
```

### 5.3. Seeder: CatalogosLegacySeeder

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogosLegacySeeder extends Seeder
{
    public function run(): void
    {
        // Opción A: Migrar desde BD legacy si existe
        try {
            $this->migrateFromLegacy();
        } catch (\Exception $e) {
            // Opción B: Usar datos hardcodeados si no hay legacy
            $this->seedFromHardcodedData();
        }
    }
    
    private function migrateFromLegacy(): void
    {
        $connection = 'catalogos_remote';
        
        // Migrar estados
        $estados = DB::connection($connection)->table('estados')->get();
        foreach ($estados as $estado) {
            DB::table('estados')->insertOrIgnore([
                'id' => $estado->id,
                'codigo' => $estado->codigo,
                'nombre' => $estado->nombre,
                'abreviatura' => $estado->abreviatura,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        
        // Migrar municipios (chunk por tamaño)
        $totalMunicipios = 0;
        DB::connection($connection)->table('municipios')->orderBy('id')->chunk(500, function ($municipios) use (&$totalMunicipios) {
            $data = $municipios->map(fn($m) => [
                'id' => $m->id,
                'estado_id' => $m->estado_id,
                'codigo' => $m->codigo,
                'nombre' => $m->nombre,
                'created_at' => now(),
                'updated_at' => now(),
            ])->toArray();
            
            DB::table('municipios')->insertOrIgnore($data);
            $totalMunicipios += count($data);
            $this->command->info("  ✓ Municipios: {$totalMunicipios}...");
        });
        
        // CPs (opcional - 140k registros, puede tardar)
        if ($this->command->confirm('¿Migrar códigos postales? (140k registros, puede tardar 5-10 min)', false)) {
            $this->migrateCps($connection);
        }
    }
    
    private function seedFromHardcodedData(): void
    {
        // Datos de estados hardcodeados (fallback)
        $estados = [
            ['codigo' => 'AGS', 'nombre' => 'Aguascalientes'],
            ['codigo' => 'BC', 'nombre' => 'Baja California'],
            ['codigo' => 'BCS', 'nombre' => 'Baja California Sur'],
            // ... los 32 estados
        ];
        
        foreach ($estados as $estado) {
            DB::table('estados')->insertOrIgnore([
                'codigo' => $estado['codigo'],
                'nombre' => $estado['nombre'],
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
```

---

## 6. PLAN DE TESTING

### 6.1. Testing Unitario

```bash
# Test 1: Verificar migraciones
php artisan migrate:fresh
php artisan db:seed --class=LegacyConsolidationSeeder

# Test 2: Verificar conteos
php artisan tinker
> DB::table('ofac_sdn')->count();
> DB::table('sat_69b')->count();
> DB::table('estados')->count();
```

### 6.2. Testing Funcional

**Script de verificación:** `verify_legacy_consolidation.php`

```php
<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

echo "🔍 Verificando consolidación de BDs Legacy...\n\n";

$checks = [
    'OFAC' => [
        'ofac_sdn' => ['min' => 10000, 'desc' => 'SDN List'],
        'ofac_alt' => ['min' => 5000, 'desc' => 'Alternative Names'],
    ],
    'SAT' => [
        'sat_69b' => ['min' => 1000, 'desc' => 'Lista 69-B'],
        'sat_69c' => ['min' => 5000, 'desc' => 'Lista 69-C'],
    ],
    'Catálogos' => [
        'estados' => ['min' => 32, 'desc' => 'Estados'],
        'municipios' => ['min' => 2400, 'desc' => 'Municipios'],
    ],
    'Aplicativos' => [
        'legacy_registro' => ['min' => 0, 'desc' => 'Registros (opcional)'],
    ],
];

foreach ($checks as $category => $tables) {
    echo "📊 {$category}:\n";
    foreach ($tables as $table => $config) {
        $count = DB::table($table)->count();
        $status = $count >= $config['min'] ? '✅' : '❌';
        echo "  {$status} {$config['desc']}: " . number_format($count) . " registros\n";
    }
    echo "\n";
}

echo "✅ Verificación completada!\n";
```

---

## 7. ROADMAP DE EJECUCIÓN

### Semana 1: 8-12 Abril (Preparación)

**Lunes 8:**
- [x] Documentación del plan (este documento)
- [x] Análisis de esquemas legacy

**Martes 9:**
- [ ] Crear migraciones: OFAC tables
- [ ] Crear migraciones: SAT tables

**Miércoles 10:**
- [ ] Crear migraciones: Catálogos
- [ ] Crear migraciones: Aplicativos legacy

**Jueves 11:**
- [ ] Crear seeders: OfacLegacySeeder
- [ ] Crear seeders: SatLegacySeeder

**Viernes 12:**
- [ ] Crear seeders: CatalogosLegacySeeder
- [ ] Crear seeders: AplicativosLegacySeeder
- [ ] Testing en desarrollo

### Semana 2: 15-19 Abril (Implementación)

**Lunes 15:**
- [ ] Testing completo en desarrollo
- [ ] Optimizaciones de seeders (batch insert)

**Martes 16:**
- [ ] Ejecutar consolidación en staging
- [ ] Validación de datos

**Miércoles 17:**
- [ ] Ajustes según testing
- [ ] Documentación de uso

**Jueves 18:**
- [ ] Code review
- [ ] Preparación para producción

**Viernes 19:**
- [ ] Deploy a producción (opcional)
- [ ] Monitoreo

---

## 8. COMANDOS ÚTILES

### Ejecución Completa

```bash
# Consolidación completa (desarrollo)
php artisan migrate:fresh
php artisan db:seed --class=LegacyConsolidationSeeder

# Solo catálogos
php artisan db:seed --class=CatalogosLegacySeeder

# Solo OFAC
php artisan db:seed --class=OfacLegacySeeder

# Solo SAT
php artisan db:seed --class=SatLegacySeeder
```

### Verificación

```bash
# Conteos rápidos
php artisan tinker
> \DB::table('ofac_sdn')->count();
> \DB::table('sat_69b')->count();
> \DB::table('estados')->count();

# Script de verificación completo
php verify_legacy_consolidation.php
```

### Rollback

```bash
# Deshacer migraciones legacy
php artisan migrate:rollback --path=database/migrations/legacy

# Reset completo
php artisan migrate:fresh
```

---

## 9. CONSIDERACIONES IMPORTANTES

### 9.1. Performance

- **Seeders grandes:** Usar `chunk()` y `insertOrIgnore()` para batch inserts
- **CPs (140k registros):** Opcional, puede tardar 5-10 minutos
- **Índices:** Crear después de insertar datos para mayor velocidad

### 9.2. Sincronización Continua

Durante transición, mantener datos actualizados:

```php
// Job diario para sincronizar cambios desde legacy
php artisan schedule:run

// O manual
php artisan legacy:sync --tables=ofac_sdn,sat_69b
```

### 9.3. Deprecación de Legacy

**Cuando deprecar BDs legacy:**
1. 100% de notarías en servidores dedicados
2. Sistema moderno probado en producción 3+ meses
3. Backup completo de BDs legacy
4. Plan de rollback documentado

---

**Última Actualización:** 8 de Abril, 2026  
**Responsable:** Backend Team  
**Timeline:** 15-19 Abril (1 semana)  
**Estado:** 📋 Planificado  
**Próxima Revisión:** 15 de Abril
