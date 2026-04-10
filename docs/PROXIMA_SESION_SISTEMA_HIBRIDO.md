# 🚀 Próxima Sesión: Sistema Híbrido Multitenant

**Fecha Planificada:** Próxima sesión de desarrollo  
**Objetivo:** Implementar sistema híbrido multitenant para Registro Web  
**Prioridad:** 🔴 ALTA - Requerido para producción

---

## 📋 Contexto de la Sesión Actual

### ✅ Logros de Hoy (10 Abril 2026):

#### **Registro Web - Implementaciones Completas:**
1. ✅ **Scanner QR con cámara** (270 líneas)
   - Protección contra frames caché (warm-up 800ms)
   - Soporte multi-formato (SAT, CURP, Acta)
   - Prevención de duplicados

2. ✅ **Sistema 3D Loader con precarga** (450 líneas)
   - Modelo Three.js (8.9 MB) cargado al inicio
   - Aparición instantánea (0ms vs 3-4s)

3. ✅ **Detección automática de tipo de persona**
   - Reconoce Física/Moral desde QR/SAT
   - Bloqueo de selector (no permite cambio manual)
   - Icono 🔒 visual en tab bloqueado

4. ✅ **Integración Gemini AI con retry**
   - 3 reintentos automáticos (exponential backoff)
   - Tasa de éxito: 70-80% vs 30% sin retry
   - Mensajes amigables al usuario

5. ✅ **Búsqueda dual BD nueva + legacy**
   - Auto-completado con SAT si campos faltantes
   - Merge inteligente (solo campos vacíos)

6. ✅ **Parser multi-formato QR** (550 líneas)
   - Soporta: SAT, CURP, Acta, JSON, pipe-delimited, URL

#### **Progreso Global Registro Web:**
- Backend API: 90%
- Frontend: 75%
- **Total: ~78% completado**

### ⏳ Pendiente para Registro Web:
- ❌ Scanner INE (OCR con TensorFlow.js)
- ❌ Scanner CURP (OCR con Gemini)
- ❌ Scanner Acta (OCR con Gemini)
- ❌ Sección de Cónyuge (11 campos)
- 🟡 Validación completa (68 campos restantes)

**📄 Documentación completa:** Ver [REGISTRO_WEB_ESTADO_ACTUAL.md](./REGISTRO_WEB_ESTADO_ACTUAL.md)

---

## 🎯 Objetivo de la Próxima Sesión

### **Meta Principal:**
Implementar **sistema híbrido multitenant** que permita:
- ✅ Registro Web escribe en BD tenant de cada notaría
- ✅ Sistema legacy (VB6) sigue leyendo de BD central
- ✅ Sincronización automática bidireccional
- ✅ Migración gradual sin "bandera de día"

### **Resultado Esperado:**
```
Usuario en Notaría X registra persona en Registro Web
    ↓
Datos se guardan en BD tenant (atinet_edomex_notaria_1)
    ↓
Job sincroniza a BD legacy (atinet65_aplicativos.registro)
    ↓
Sistema VB6 puede leer datos inmediatamente
    ↓
Ambos sistemas funcionan en paralelo
```

---

## 📚 Documentación Clave a Revisar

### 1. **Arquitectura Multitenant**
**Archivo:** `docs/architecture/ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md`

**Puntos Clave:**
- Modelo Database-per-Tenant (cada notaría = 1 BD)
- Nomenclatura: `atinet_{estado}_notaria_{numero}`
- BD Master: metadata + datos agregados
- BD Tenant: operación local + datos sensibles

```
SERVIDOR MYSQL
├── atinet_compliance_hub (MASTER)
│   ├── notarias (50+ registros)
│   ├── plans, subscriptions
│   ├── users (solo super_admin)
│   └── busquedas (agregadas)
│
├── atinet65_aplicativos (LEGACY - Read-only)
│   ├── registro (personas - sistema VB6)
│   ├── agenda (eventos - sistema VB6)
│   └── [10 tablas más]
│
└── atinet_edomex_notaria_1 (TENANT)
    ├── users (admin + usuarios locales)
    ├── registro_web (personas - nuevo sistema)
    ├── agenda_events (eventos - nuevo sistema)
    ├── busquedas (datos locales)
    └── [25+ tablas]
```

### 2. **Plan de Sincronización**
**Archivo:** `docs/PLAN_SINCRONIZACION_BD_MASTER_TENANT.md`

**Problemas Identificados:**
- ❌ Cambios en BD Master sin migraciones
- ❌ Tenants no tienen todas las tablas actualizadas
- ❌ Falta sistema de sincronización automática

**Solución Propuesta:**
1. Auditar diferencias Master vs Tenant
2. Crear migraciones faltantes
3. Script de sincronización retroactiva
4. Implementar Jobs de sync continua

### 3. **Controller de Notarías**
**Archivo:** `docs/development/ACTUALIZACION_NOTARIA_CONTROLLER.md`

**Métodos Clave:**
```php
// app/Http/Controllers/Admin/NotariaController.php

// Crea BD tenant + tablas + usuario admin
public function store(Request $request)

// Crea estructura de BD del tenant
protected function createNotariaDatabase(Notaria $notaria)

// Ejecuta migraciones en BD tenant
protected function runTenantMigrations(string $dbName)

// Copia datos iniciales (planes, servicios)
protected function seedTenantDefaults(string $dbName, Notaria $notaria)
```

---

## 🛠️ Tareas de la Próxima Sesión

### **Fase 1: Auditoría y Preparación** (2-3 horas)

#### 1.1 Verificar Estructura BD Master
```sql
-- Conectar a BD master
USE atinet_compliance_hub;

-- Listar todas las tablas
SHOW TABLES;

-- Verificar estructura de tablas críticas
DESCRIBE users;
DESCRIBE notarias;
DESCRIBE plans;
DESCRIBE services;
DESCRIBE busquedas;
DESCRIBE configuracion;
```

#### 1.2 Comparar con BD Tenant Reciente
```sql
-- Conectar a último tenant creado
USE atinet_bcs_notaria_21; -- o el más reciente

-- Listar tablas (comparar con master)
SHOW TABLES;

-- Identificar tablas FALTANTES
-- Identificar COLUMNAS faltantes en tablas existentes
```

#### 1.3 Documentar Diferencias
Crear lista de:
- Tablas en master que NO están en tenant
- Columnas agregadas manualmente (sin migración)
- Índices faltantes
- Datos seed faltantes

### **Fase 2: Crear Migraciones Faltantes** (1-2 horas)

#### 2.1 Generar Migraciones para Cambios Encontrados
```bash
# Ejemplos según lo que se encuentre:
php artisan make:migration add_additional_fields_to_busquedas_table
php artisan make:migration create_missing_tenant_tables
php artisan make:migration add_indexes_to_tenant_tables
```

#### 2.2 Escribir Migraciones
```php
// database/migrations/XXXX_add_field_to_table.php
public function up()
{
    Schema::table('tabla', function (Blueprint $table) {
        $table->string('nuevo_campo')->nullable();
    });
}
```

#### 2.3 Probar Migraciones en BD Fresh
```bash
# Crear BD de prueba
php artisan migrate:fresh --seed

# Verificar estructura
# Comparar con master
```

### **Fase 3: Script de Sincronización Retroactiva** (2-3 horas)

#### 3.1 Crear Command para Actualizar Tenants
```bash
php artisan make:command SyncTenantDatabases
```

#### 3.2 Implementar Lógica
```php
// app/Console/Commands/SyncTenantDatabases.php
class SyncTenantDatabases extends Command
{
    protected $signature = 'tenants:sync {--dry-run} {--tenant=}';
    
    public function handle()
    {
        // 1. Obtener lista de todos los tenants
        $tenants = $this->getTenantDatabases();
        
        foreach ($tenants as $tenantDb) {
            $this->syncTenant($tenantDb);
        }
    }
    
    protected function syncTenant(string $dbName)
    {
        // 1. Conectar a tenant
        DB::purge('tenant_temp');
        Config::set('database.connections.tenant_temp.database', $dbName);
        DB::connection('tenant_temp')->reconnect();
        
        // 2. Ejecutar migraciones faltantes
        $this->call('migrate', [
            '--database' => 'tenant_temp',
            '--force' => true,
        ]);
        
        // 3. Verificar integridad
        $this->verifyTenantStructure($dbName);
    }
}
```

#### 3.3 Ejecutar Sincronización
```bash
# Ver qué se haría (sin cambios)
php artisan tenants:sync --dry-run

# Ejecutar en tenant específico
php artisan tenants:sync --tenant=atinet_edomex_notaria_1

# Ejecutar en TODOS los tenants
php artisan tenants:sync
```

### **Fase 4: Adaptar Registro Web para Tenant** (2-3 horas)

#### 4.1 Modificar RegistroWebController
```php
// app/Http/Controllers/Admin/RegistroWebController.php

public function store(Request $request)
{
    $user = Auth::user();
    
    // Determinar BD tenant según usuario
    if ($user->tipo_cuenta === 'admin_notaria' || $user->tipo_cuenta === 'usuario_notaria') {
        $notaria = $user->notaria;
        $tenantDb = $notaria->tenant_database_name;
        
        // Cambiar conexión a tenant
        DB::purge('tenant');
        Config::set('database.connections.tenant.database', $tenantDb);
        DB::connection('tenant')->reconnect();
        
        // Guardar en BD tenant
        $registro = RegistroPersona::on('tenant')->create($validated);
        
        // Disparar evento para sincronización
        event(new RegistroCreado($registro, $notaria));
        
    } else {
        // Super admin: guardar en master
        $registro = RegistroPersona::create($validated);
    }
    
    return redirect()->route('registro-web.index')
        ->with('success', 'Registro guardado correctamente');
}
```

#### 4.2 Crear Evento de Sincronización
```php
// app/Events/RegistroCreado.php
class RegistroCreado implements ShouldBroadcast
{
    public function __construct(
        public RegistroPersona $registro,
        public Notaria $notaria
    ) {}
}
```

#### 4.3 Crear Job de Sincronización a Legacy
```php
// app/Jobs/SyncRegistroToLegacy.php
class SyncRegistroToLegacy implements ShouldQueue
{
    public function handle()
    {
        // Conectar a BD legacy
        DB::connection('mysql_legacy')->table('registro')->insert([
            'notaria' => $this->registro->notaria,
            'curp' => $this->registro->curp,
            'rfc' => $this->registro->rfc,
            // ... mapear campos
            'sincronizado_de_tenant' => true,
            'tenant_source_id' => $this->registro->id,
        ]);
    }
}
```

#### 4.4 Registrar Listener
```php
// app/Providers/EventServiceProvider.php
protected $listen = [
    RegistroCreado::class => [
        SyncRegistroToLegacyListener::class,
    ],
];
```

### **Fase 5: Testing del Sistema Híbrido** (2 horas)

#### 5.1 Test de Escritura en Tenant
```bash
# 1. Login como admin_notaria de Notaría 1
# 2. Crear nuevo registro en Registro Web
# 3. Verificar que se guardó en atinet_edomex_notaria_1
# 4. Verificar que NO se guardó en master
```

```sql
-- Verificar en tenant
USE atinet_edomex_notaria_1;
SELECT * FROM registro_web ORDER BY created_at DESC LIMIT 5;

-- Verificar que NO está en master
USE atinet_compliance_hub;
SELECT * FROM registro_web WHERE id = [el_nuevo_id]; -- Debería estar vacío
```

#### 5.2 Test de Sincronización a Legacy
```sql
-- Verificar sincronización a BD legacy
USE atinet65_aplicativos;
SELECT * FROM registro WHERE sincronizado_de_tenant = 1 ORDER BY id DESC LIMIT 5;

-- Verificar que sistema VB6 puede leerlo
-- (probar en aplicación VB6)
```

#### 5.3 Test de Búsqueda Dual
```bash
# 1. Buscar RFC desde frontend
# 2. Debería encontrar en BD tenant primero
# 3. Si no existe, buscar en legacy
# 4. Mostrar source: 'tenant' o 'legacy'
```

---

## 🔍 Puntos Críticos a Considerar

### 1. **Conexiones de BD Dinámicas**
```php
// NO usar:
RegistroPersona::create($data); // Siempre usa master

// SÍ usar:
RegistroPersona::on('tenant')->create($data); // Usa tenant
```

### 2. **Preservar Compatibilidad con Legacy**
```php
// Mapeo de campos nuevo → legacy
[
    'apellidopat' => 'ape_paterno',
    'apellidomat' => 'ape_materno',
    'dia' => 'fecha_nacimiento',
    // ... etc
]
```

### 3. **Manejo de Errores en Sincronización**
```php
try {
    DB::connection('mysql_legacy')->table('registro')->insert($data);
} catch (\Exception $e) {
    // Registrar en log pero NO fallar el request principal
    Log::error('Fallo sincronización legacy', [
        'registro_id' => $registro->id,
        'error' => $e->getMessage(),
    ]);
    
    // Reintentar después con queue
    SyncRegistroToLegacy::dispatch($registro)->delay(now()->addMinutes(5));
}
```

### 4. **Performance**
- Sincronización debe ser **asíncrona** (jobs)
- No bloquear respuesta al usuario
- Usar Redis para queue si está disponible

### 5. **Integridad de Datos**
- Validar que campos obligatorios legacy existan
- Truncar campos si legacy tiene límites menores
- Convertir encoding (UTF-8 → Latin1 si es necesario)

---

## 📊 Checklist de Completitud

### Pre-requisitos:
- [ ] Backup completo de BD master
- [ ] Backup de al menos 2 BDs tenant
- [ ] Entorno de desarrollo separado para testing
- [ ] Acceso a sistema VB6 para validación

### Fase 1 - Auditoría:
- [ ] Listar todas las tablas master
- [ ] Listar todas las tablas tenant de referencia
- [ ] Documentar diferencias de estructura
- [ ] Identificar columnas agregadas manualmente
- [ ] Verificar índices y constraints

### Fase 2 - Migraciones:
- [ ] Crear migraciones faltantes
- [ ] Probar migraciones en BD fresh
- [ ] Documentar cada migración
- [ ] Versionar en Git

### Fase 3 - Sincronización:
- [ ] Crear command `tenants:sync`
- [ ] Implementar lógica de sincronización
- [ ] Probar en 1 tenant de prueba
- [ ] Ejecutar en todos los tenants
- [ ] Verificar integridad post-sync

### Fase 4 - Adaptación Registro Web:
- [ ] Modificar `RegistroWebController::store()`
- [ ] Crear evento `RegistroCreado`
- [ ] Crear job `SyncRegistroToLegacy`
- [ ] Registrar listeners
- [ ] Modificar modelo `RegistroPersona` si necesario

### Fase 5 - Testing:
- [ ] Test escritura en tenant
- [ ] Test NO escritura en master
- [ ] Test sincronización a legacy
- [ ] Test lectura desde VB6
- [ ] Test búsqueda dual (tenant + legacy)
- [ ] Test con 3+ notarías diferentes

### Post-implementación:
- [ ] Documentar cambios
- [ ] Crear guía de troubleshooting
- [ ] Configurar monitoring de sync jobs
- [ ] Entrenar equipo sobre flujo híbrido

---

## 📖 Recursos Adicionales

### Documentos a Consultar:
1. **[REGISTRO_WEB_ESTADO_ACTUAL.md](./REGISTRO_WEB_ESTADO_ACTUAL.md)** - Estado actual completo
2. **[ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md](./architecture/ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md)** - Arquitectura multitenant
3. **[PLAN_SINCRONIZACION_BD_MASTER_TENANT.md](./PLAN_SINCRONIZACION_BD_MASTER_TENANT.md)** - Plan de sincronización
4. **[ACTUALIZACION_NOTARIA_CONTROLLER.md](./development/ACTUALIZACION_NOTARIA_CONTROLLER.md)** - Controller de notarías

### Código de Referencia:
- `app/Http/Controllers/Admin/NotariaController.php` - Creación de tenants
- `app/Http/Controllers/Admin/RegistroWebController.php` - CRUD registro
- `config/database.php` - Configuración de conexiones
- `app/Models/RegistroPersona.php` - Modelo principal
- `app/Models/LegacyRegistro.php` - Modelo legacy

### Laravel Tenancy:
- Documentación oficial: https://tenancyforlaravel.com/
- Paquete: `stancl/tenancy` (considerar instalar)
- Alternativa: Sistema custom (actual)

---

## 🎯 Resultado Esperado de la Sesión

Al final de la próxima sesión deberías tener:

1. ✅ **Sistema de sincronización funcionando:**
   - Datos escritos en BD tenant
   - Sincronización automática a legacy
   - VB6 puede leer datos inmediatamente

2. ✅ **Migraciones completas:**
   - Todos los tenants con estructura actualizada
   - Sin diferencias entre master y tenants

3. ✅ **Registro Web adaptado:**
   - Escribe en tenant según usuario
   - No afecta BD master (solo lectura)
   - Mantiene búsqueda dual

4. ✅ **Testing validado:**
   - Flujo completo probado en 3+ notarías
   - Sistema VB6 validado
   - Sin regressions

5. ✅ **Documentación actualizada:**
   - Guía de arquitectura híbrida
   - Troubleshooting común
   - Diagramas de flujo

---

## ⚠️ Warnings & Troubleshooting

### Problema Común 1: "Connection not configured"
```php
// Solución: Purge + reconnect
DB::purge('tenant');
Config::set('database.connections.tenant.database', $tenantDb);
DB::connection('tenant')->reconnect();
```

### Problema Común 2: "Table doesn't exist in tenant"
```bash
# Solución: Ejecutar migraciones faltantes
php artisan migrate --database=tenant --force
```

### Problema Común 3: "Encoding issues en legacy"
```php
// Solución: Convertir antes de insertar
$data['nombre'] = mb_convert_encoding($data['nombre'], 'ISO-8859-1', 'UTF-8');
```

### Problema Común 4: "Job failures en sincronización"
```bash
# Ver jobs fallidos
php artisan queue:failed

# Reintentar
php artisan queue:retry all
```

---

**📌 Documento preparado para continuidad**  
**Próxima sesión:** Sistema Híbrido Multitenant  
**Estimado:** 8-12 horas de desarrollo  
**Prioridad:** 🔴 ALTA
