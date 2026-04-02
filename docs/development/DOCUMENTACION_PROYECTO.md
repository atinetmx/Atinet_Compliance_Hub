# 📋 Sistema de Listas Negras V2 - Documentación Técnica Completa

## 📅 Fecha de Última Actualización: 2 de Abril, 2026

> **📌 PROPÓSITO DE ESTE DOCUMENTO:**  
> Esta es la documentación **master** del proyecto. Contiene TODA la información necesaria para que cualquier desarrollador (nuevo o existente) pueda entender, desarrollar y mantener el sistema sin necesidad de contexto adicional. Se actualiza constantemente durante el desarrollo.

---

## � **Cambios Recientes - 2 de Abril, 2026**

### 🗑️ Flujo de Eliminación de Notarías

**Componente: `DeleteNotariaDialog.tsx`**
- Modal inteligente con dos opciones: Inhabilitar (recomendado) vs Eliminar Permanentemente
- Bloqueo automático de eliminación si la notaría tiene usuarios activos
- Alerta ámbar con número de usuarios y botón directo a "Gestionar Usuarios" filtrado
- Opción "Eliminar Permanentemente" se deshabilita visualmente cuando hay usuarios
- Requiere contraseña de super_admin y razón mínima de 10 caracteres
- Toda eliminación se registra en logs (Log::critical)

**Backend: `NotariaController::destroy()`**
- Validación de contraseña con `Hash::check()`
- Bloqueo de eliminación si `$notaria->users()->count() > 0`
- Logging completo: IP, usuario responsable, razón, timestamp

### 👥 Eliminación de Usuarios (nueva funcionalidad)

**Frontend: `Users/Index.tsx`**
- Botón Trash2 ahora tiene `onClick` con confirmación nativa del navegador
- Usa method spoofing: `router.post(url, { _method: 'DELETE' })`

**Backend: `UserController::destroy()`**
- Bloquea eliminación de `super_admin`
- Redirige con mensaje de éxito

### 🔄 Sincronización Automática de `total_usuarios`

**Problema resuelto:** La columna `notarias.total_usuarios` se desincronizaba al crear/eliminar/reasignar usuarios porque era un dato estático.

**Solución: `UserObserver`** (`app/Observers/UserObserver.php`)
```php
// Se registra en AppServiceProvider::boot()
User::observe(UserObserver::class);

// Eventos que disparan la actualización:
// - created  → actualiza la notaría del nuevo usuario
// - updated  → si cambió notaria_id, actualiza ambas notarías
// - deleted  → recuenta usuarios de la notaría del usuario eliminado
```

**Migración de resincronización:** `2026_04_02_195256_ensure_total_usuarios_column_in_notarias_table`
- Verifica si la columna existe, si no la crea
- Recalcula `total_usuarios` para todas las notarías existentes con el conteo real

**Factory actualizado:** `NotariaFactory` ahora incluye `total_usuarios: 0` para que los tests arranquen con estado consistente.

### 🧪 Tests Añadidos

**`tests/Feature/UserDestroyTest.php`** — 5 tests, 23 assertions:
- `super_admin_puede_eliminar_usuarios_regulares`
- `no_se_puede_eliminar_super_admin`
- `puede_eliminar_admin_de_notaria` + verifica decremento de contador
- `actualiza_contador_al_crear_usuario`
- `actualiza_contador_al_cambiar_usuario_de_notaria`

### 📚 Manual de Usuario Actualizado

Agregada subsección **"Eliminar / Inhabilitar Notaría"** en `Documentation/Index.tsx`:
- Explica las dos opciones y cuándo usar cada una
- Documenta el sistema de bloqueo inteligente por usuarios activos
- Flujo completo paso a paso (12 pasos)
- Sección sobre base de datos tenant y auditoría de logs

Corregida **entrada duplicada** de "Gestión de Notarías" en la navegación del manual.

---

## �🎯 **Estado Actual del Proyecto - ACTUALIZADO**

### ✅ **Funcionalidades Implementadas**

#### 🔐 **Sistema de Autenticación**
- ✅ Laravel Fortify configurado
- ✅ Autenticación por email (corregido desde username)
- ✅ Migración completa de 308 usuarios desde sistema anterior
- ✅ Sincronización de contraseñas desde tabla `usuario`
- ✅ Login funcional con credenciales originales

#### 🏗️ **Infraestructura Técnica**
- ✅ Laravel 12.49.0 + React + Inertia.js
- ✅ Base de datos MySQL configurada (3 bases)
- ✅ Vite para desarrollo frontend
- ✅ TypeScript configurado (warnings solucionados)
- ✅ TailwindCSS + Shadcn/ui components
- ✅ Migraciones ejecutadas correctamente

#### 🗄️ **Base de Datos**
- ✅ Base principal: `atinet65_aplicativos` (usuarios, cache, jobs)
- ✅ Base OFAC: `atinet65_listasofac` (listas negras OFAC)
- ✅ Base SAT: `atinet65_listassat` (listas negras SAT)

---

## 🏛️ **Arquitectura Técnica**

### **Stack Tecnológico Completo**
```
Frontend:    React 19.2.0 + TypeScript + TailwindCSS + Inertia.js v2
Backend:     Laravel 12.49.0 + PHP 8.2.12
Base Datos:  MySQL (Shared Database - Multi-Tenant)
Build Tool:  Vite 7.0.4
UI:          Shadcn/ui + Radix UI + OKLCH Colors (Atinet Branding)
Auth:        Laravel Fortify + Two-Factor (2FA)
Testing:     Pest 3 + PHPUnit 11
Code Style:  Laravel Pint
Animations:  Framer Motion + Glassmorphism
```

### **🏢 Arquitectura Multi-Tenant: Shared Database**

**Decisión Arquitectónica (29 Enero 2026):**  
Se eligió **Shared Database con `notaria_id`** en lugar de Database per Tenant.

#### ✅ **Razones:**
- Escala actual: **21 notarías** (no requiere complejidad de multi-DB)
- Volumen: **18,586 búsquedas** totales es perfectamente manejable
- Naturaleza de los datos: Búsquedas en listas **públicas** (OFAC, SAT)
- Laravel tiene soporte nativo con **Global Scopes**
- Reportes del super_admin: Fácil acceso a datos agregados
- Costos: Infraestructura más económica
- Mantenimiento: Una sola BD, un solo backup

#### 🔒 **Mecanismos de Aislamiento Implementados:**

**1. NotariaScope (Global Scope)**
```php
// app/Models/Scopes/NotariaScope.php
// Filtra automáticamente TODOS los queries por notaria_id del usuario
// Super_admin de Atinet puede ver TODO sin filtros
```

**2. BelongsToNotaria Trait**
```php
// app/Concerns/BelongsToNotaria.php
// Se aplica a modelos: Busqueda, Ticket, Reporte, etc.
// Funcionalidades:
// - Aplica NotariaScope automáticamente
// - Asigna notaria_id al crear registros
// - Define relación belongsTo(Notaria)
// - Previene data leakage entre notarías
```

**3. EnsureNotariaAccess Middleware**
```php
// app/Http/Middleware/EnsureNotariaAccess.php
// Garantiza que usuarios normales tengan notaria_id asignada
// Super_admin exento de esta validación
```

#### 📊 **Estructura Multi-Tenant:**
```
┌─────────────────────────────────────┐
│      Base de Datos Compartida       │
├─────────────────────────────────────┤
│ busquedas                           │
│  - id                               │
│  - notaria_id ← FK (CASCADE DELETE) │
│  - user_id                          │
│  - nombre_buscado                   │
│  - resultado                        │
│  └─ INDEX(notaria_id, created_at)  │
│                                     │
│ tickets                             │
│  - id                               │
│  - notaria_id ← FK                  │
│  - user_id                          │
│  - asunto                           │
│  └─ INDEX(notaria_id, estado)      │
└─────────────────────────────────────┘

Tablas Globales (sin notaria_id):
- herramientas (catálogo Atinet)
- planes (planes de suscripción)
- notarias (clientes de Atinet)
- users (incluye notaria_id)
```

#### 🛡️ **Prevención de Data Leakage:**
```php
// ✅ CORRECTO - Usa Eloquent (aplica scope automáticamente)
$busquedas = Busqueda::where('resultado', 'coincidencia')->get();

// ❌ INCORRECTO - Bypasea scopes
$busquedas = DB::table('busquedas')->where('resultado', 'coincidencia')->get();

// Super_admin acceso total
$todas = Busqueda::withoutGlobalScope(NotariaScope::class)->get();

// Super_admin filtra por notaría específica
$notaria5 = Busqueda::deNotaria(5)->get();
```

#### 📈 **Escalabilidad:**
- **Actual:** 21 notarías, 18,586 búsquedas → Shared DB óptimo
- **Futuro (500+ notarías):** Considerar Database per Tenant
- **Regulatorio total:** Considerar si llegan clientes bancarios

**Documentación completa:** Ver `ARQUITECTURA_MULTI_TENANT.md`

### **Estructura de Carpetas Completa**
```
Listas_negrasV2/
├── app/
│   ├── Actions/          # Acciones reutilizables (Fortify)
│   ├── Concerns/         # Traits (BelongsToNotaria)
│   ├── Console/          # Comandos Artisan (MigrateLegacySearches)
│   ├── Http/
│   │   ├── Controllers/  # Controladores API y Web
│   │   └── Middleware/   # EnsureNotariaAccess
│   ├── Models/           # Eloquent Models
│   │   ├── Scopes/       # NotariaScope (Global Scope)
│   │   ├── User.php      # Usuario con multi-tenant
│   │   ├── Notaria.php   # Cliente de Atinet
│   │   ├── Plan.php      # Planes de suscripción
│   │   ├── Herramienta.php  # Catálogo de servicios
│   │   ├── Busqueda.php  # Búsquedas (usa BelongsToNotaria)
│   │   ├── OfacNombres.php  # Tabla Nombres OFAC
│   │   └── Sat69B.php    # Tabla 69-B SAT
│   └── Providers/        # Service Providers
├── bootstrap/
│   ├── app.php           # Configuración middleware y rutas
│   └── providers.php     # Providers registrados
├── config/
│   ├── auth.php          # Autenticación
│   ├── fortify.php       # Configuración Fortify (email)
│   ├── database.php      # 3 conexiones MySQL
│   ├── inertia.php       # Inertia.js config
│   └── session.php       # Sesiones
├── database/
│   ├── migrations/       # 15+ migraciones (multi-tenant incluido)
│   │   ├── 2026_01_29_ - Migración Multi-Tenant**

### **Usuarios Migrados (245 usuarios activos)**
- **Tabla origen:** `usuario` (308 registros)
- **Tabla destino:** `users` (245 registros válidos)
- **Mapeo:** `usuario.USER` → `users.username`
- **Passwords:** Sincronizadas y hasheadas correctamente
- **Notarías:** 21 notarías únicas identificadas desde campo `notaria`

### **Búsquedas Migradas (18,586 registros)**
- **Tablas origen:** `busquedassat`, `busquedasofac`, `busquedasprueba` (23,524 registros)
- **Tabla destino:** `busquedas` (18,586 registros = 86.75% migrados exitosamente)
- **Comando:** `php artisan migrate:legacy-searches`
- **Audit trail preservado:** Campo `notaria` mantenido para análisis histórico
- **Estado:** ✅ Migración completa, esperando asignación de `notaria_id`

### **Estructura de Usuario (Actualizada - Multi-Tenant)**
```php
// Campos legacy preservados
'username'         // Usuario del sistema original
'notaria'          // Nombre notaría (legacy - DEPRECADO)
'permiso_usuario'  // Permisos originales
'tipo_usuario'     // Tipo de usuario original
'sesion_listas'    // Sesiones del sistema legacy
'is_active'        // Control de estado

// Campos Laravel estándar
'name', 'email', 'password', 'email_verified_at'

// Campos multi-tenant (NUEVOS)
'notaria_id'       // FK a tabla notarias (CASCADE DELETE)
'tipo_cuenta'      // Enum: super_admin, admin_notaria, usuario_notaria, invitado

// Métodos multi-tenant
isSuperAdmin()     // Verifica si es administrador Atinet
isAdminNotaria()   // Verifica si es admin de notaría
tieneAccesoA()     // Verifica acceso a herramienta
puedeRealizarBusquedas()  // Verifica permisos de búsqueda
notaria()          // Relación con Notaria
```

### **Herramientas del Sistema (34 servicios reales Atinet)**
```php
// Creadas en HerramientasSeeder.php basadas en sitio web oficial Atinet
Categorías:
✅ BÚSQUEDAS (4):       OFAC, SAT, Cruzada, Avanzada
✅ REPORTES (4):        PDF básico, avanzados, exportación, programados
✅ API/INTEGRACIONES (3): REST API, Webhooks, Integración sistema notarial
✅ SOPORTE (4):         Tickets, email, prioritario, 24/7
✅ MANTENIMIENTO (4):   Auto-update, BD, respaldo, monitoreo
✅ SERVICIOS ATINET (6): Web, dominio, imagen corporativa, QR, equipo, registro
✅ PAQUETES PLD (4):    Asesoría total, manual, EBR, capacitación
✅ AVANZADAS (4):       Usuarios ilimitados, dashboard custom, alertas, auditoría
```

### **Planes de Suscripción (Pendiente - Siguiente paso)**
```php
// PlanesSeeder.php (por crear)
1. Legacy:        Búsquedas básicas OFAC + SAT (21 notarías actuales)
2. Básico:        Búsquedas + reportes básicos + tickets
3. Profesional:   Todo lo básico + API + reportes avanzados + soporte prioritario
4. Enterprise:    Todo + soporte 24/7 + usuarios ilimitados + monitoreo(glassmorphism)
│   │       ├── AnimatedStatsCard.tsx  # 183 líneas (counter animation)
│   │       └── ui/                # Shadcn components
│   └── views/
│       └── app.blade.php # Layout principal Inertia
├── routes/
│   ├── web.php           # Rutas principales
│   ├── console.php       # Rutas de consola
│   └── settings.php      # Rutas de configuración
├── tests/
│   ├── Feature/          # Tests de integración
│   ├── Unit/             # Tests unitarios
│   └── Pest.php          # Configuración Pest
├── DOCUMENTACION_PROYECTO.md        # Este archivo (MASTER)
├── ARQUITECTURA_MULTI_TENANT.md     # Documentación multi-tenant
├── SISTEMA_DINAMICO_HERRAMIENTAS.md # Sistema de herramientas
├── FASE_1_ESTRUCTURA_MULTI_TENANT.md
├── PRUEBAS_BUSQUEDAS.md
└── .github/
    └── copilot-instructions.md      # Laravel Boost Guidelines
```

### **Configuración de Base de Datos**
```php
// .env
DB_CONNECTION=mysql
DB_DATABASE=atinet65_aplicativos      // Principal
DB_OFAC_DATABASE=atinet65_listasofac  // OFAC
DB_SAT_DATABASE=atinet65_listassat    // SAT
```
⚡ Setup Inicial (Primera vez)**
```bash
# 1. Instalar dependencias
composer install
npm install

# 2. Configurar entorno
cp .env.example .env
php artisan key:generate

# 3. Configurar base de datos en .env
DB_CONNECTION=mysql
DB_DATABASE=atinet65_aplicativos
DB_OFAC_DATABASE=atinet65_listasofac
DB_SAT_DATABASE=atinet65_listassat

# 4. Ejecutar migraciones (incluye multi-tenant)
php artisan migrate

# 5. Poblar catálogos
php artisan db:seed --class=HerramientasSeeder
php artisan db:seed --class=PlanesSeeder
php artisan db:seed --class=NotariasMigrationSeeder

# 6. Compilar assets
npm run build
```

### **🔄 Desarrollo Diario**
```bash
# Opción 1: Todo en uno (Laravel + Vite)
npm run serve    # Laravel + Vite simultáneamente
# o
npm start       # Alias de serve

# Opción 2: Separado
php artisan serve     # Terminal 1 - Backend
npm run dev          # Terminal 2 - Frontend
```

### **📦 Comandos Útiles**
```bash
# Limpiar caché completo
php artisan optimize:clear  # Limpia: config, routes, views, cache

# O individualmente:
php artisan config:clear
php artisan route:clear
php artisan cache:clear
php artisan view:clear

# Base de datos
php artisan migrate:status              # Ver estado migraciones
php artisan migrate:fresh --seed        # Resetear BD + seeders
php artisan migrate:legacy-searches     # Migrar búsquedas legacy

# Testing
php artisan test                        # Ejecutar todos los tests
php artisan test --filter=MultiTenancy  # Tests específicos de multi-tenant
vendor/bin/pest                         # Tests con Pest

# Code Style
vendor/bin/pint                         # Formatear código según Laravel
vendor/bin/pint --dirty                 # Formatear solo archivos modificados

# Compilar assets
npm run build    # Producción (optimizado)
npm run dev      # Desarrollo (hot reload)
```

### **🔍 Comandos de Debug**
```bash
# Ver rutas
php artisan route:list

# Ver configuración
php artisan config:show database
php artisan config:show auth

# Ver modelos con relaciones
php artisan model:show User
php artisan model:show Notaria

# Tinker (REPL)
php artisan tinker
>>> User::count();
>>> Notaria::with('users')->get();
>>> Busqueda::deNotaria(1)->count();
// Campos estándar Laravel
'name', 'email', 'password', 'email_verified_at'
```

### **Tablas de Listas Negras Existentes**
```sql
-- Base atinet65_listasofac
blacklist_ofac_sdn       // Lista SDN (principales)
blacklist_ofac_alt       // Nombres alternativos
blacklist_ofac_add       // Direcciones
blacklist_updates        // Control de actualizaciones

-- Base atinet65_listassat  
blacklist_sat_69b        // Lista 69-B del SAT
blacklist_updates        // Control de actualizaciones
```

---

## 🚀 **Comandos de Desarrollo**

### **Iniciar Desarrollo**
```bash
npm run serve    # Laravel + Vite simultáneamente
# o
npm start       # Alias de serve
```

### **Comandos Útiles**
```bash
# Limpiar caché
php artisan config:clear
php artisan route:clear
php artisan cache:clear

# Base de datos
php artisan migrate:status
php artisan db:seed --class=TestUserSeeder

# Compilar assets
npm run build    # Producción
npm run dev      # Desarrollo
```

---

## 📋 **Planificación de Desarrollo**

### 🔍 **ANÁLISIS DEL SISTEMA LEGACY**

#### **Sistema de Referencia Analizado:** `LISTAS NEGRAS PHP`
El sistema anterior nos proporciona la base completa de funcionalidades que debemos implementar:

#### 🎯 **Funcionalidades Identificadas**

**1. Motor de Búsqueda Multi-Tipo:**
```php
// Tipos de búsqueda implementados en el sistema anterior:
- Personas Físicas: Búsqueda por nombre en base OFAC
- Personas Morales: Búsqueda por denominación social en base OFAC  
- RFC: Búsqueda en base SAT (Artículo 69-B)
- Búsqueda Combinada: OFAC + SAT cuando se proporciona RFC
```

**2. Generación de PDFs Oficiales:**
```php
// Documentos que genera el sistema:
- PDF Lista Negra OFAC (con información legal completa)
- PDF Lista SAT (con resultados del contribuyente)
- Formato oficial con logos de notaría
- Fecha/hora de consulta + resultados
```

**3. Sistema de Reportes Excel:**
```php
// Funcionalidad de exportación:
- Reportes por rango de fechas
- Filtros por notaría específica
- Vista previa antes de descarga
- Formato Excel con estilos profesionales
```

**4. Logging Completo de Búsquedas:**
```sql
-- Tabla: busquedas (en atinet65_aplicativos)
- user: Usuario que realizó la búsqueda
- tipo_busqueda: 'Lista Negra' o 'SAT'
- nombre: Término buscado
- n_estatus / r_estatus: Resultados encontrados
- fecha: Timestamp de la búsqueda
- notaria: Notaría del usuario
```

#### 🗄️ **Estructura de Datos Legacy**

**Base `atinet65_listasofac`:**
```sql
- Tabla: Nombres (lista principal OFAC)
  - NombreOriginal: Nombres y entidades sancionadas
  - Algoritmo: LIKE con wildcards para coincidencias
```

**Base `atinet65_listassat`:**
```sql  
- Tabla: `69-B` (lista SAT México)
  - NombreOriginal: Razón social del contribuyente
  - RFC: Registro Federal de Contribuyentes
  - Situación, fechas de publicación
```

#### 🎮 **Flujos de Usuario Identificados**

**1. Flujo de Búsqueda Persona Física:**
```
Login → Dashboard → Seleccionar "Física" → 
Ingresar nombre → Buscar → Mostrar coincidencias clickeables →
Click en resultado → Generar PDF oficial
```

**2. Flujo de Búsqueda con RFC:**
```
Login → Dashboard → Ingresar nombre + RFC → Buscar →
Mostrar resultados OFAC + SAT → Seleccionar coincidencia →
Generar PDF combinado
```

**3. Flujo de Reportes:**
```
Dashboard → Botón "Reporte" → Modal de fechas →
Seleccionar rango → Vista previa → Descargar Excel
```

---

### 🎯 **PLAN DE DESARROLLO EFICIENTE**

### **FASE 1A: Motor de Búsqueda Completo (PRIORITARIO)**
**Estimado: 3-4 días** | **Base para toda la funcionalidad**

#### 📋 **Tareas Específicas:**

**1.1 Modelos Eloquent Completos**
```php
// app/Models/OfacRecord.php - Lista OFAC principal
// app/Models/SatRecord.php - Lista SAT 69-B  
// app/Models/SearchLog.php - Logging de búsquedas
// Incluir: relaciones, scopes, conexiones DB
```

**1.2 Controlador de Búsqueda Avanzado**
```php
// app/Http/Controllers/BlacklistSearchController.php
public function searchPerson()      // Personas físicas/morales
public function searchRfc()         // Búsqueda por RFC
public function searchCombined()    // OFAC + SAT simultáneo
public function getSearchHistory()  // Historial usuario
public function logSearch()         // Registro de búsquedas
```

**1.3 Componentes React Especializados**
```tsx
// resources/js/pages/Search.tsx - Interfaz principal
// Incluir: formulario multi-tipo, resultados clickeables,
// historial lateral, estadísticas de uso
```

**1.4 Algoritmos de Búsqueda**
```php
// Implementar lógica exacta del sistema legacy:
- LIKE con wildcards para coincidencias parciales
- Validación RFC (12-13 caracteres)
- Eliminación de comas y caracteres especiales
- Prevención de duplicados en resultados
```

---

### **FASE 1B: Generación de PDFs Oficiales**
**Estimado: 2-3 días** | **Funcionalidad crítica del negocio**

#### 📋 **Tareas Específicas:**

**1.5 Sistema de PDFs Laravel**
```php
// composer require barryvdh/laravel-dompdf
// app/Services/PdfGenerator.php
public function generateOfacPdf()   // PDF Lista Negra OFAC
public function generateSatPdf()    // PDF Lista SAT
public function generateCombinedPdf() // PDF combinado
```

**1.6 Templates de PDF**
```blade
// resources/views/pdf/ofac-report.blade.php
// resources/views/pdf/sat-report.blade.php
// Incluir: logos notaría, información legal completa,
// formato oficial idéntico al sistema anterior
```

**1.7 Controladores de Descarga**
```php
// Rutas para generar PDFs desde resultados de búsqueda
Route::get('/pdf/ofac/{id}', [PdfController::class, 'generateOfac']);
Route::get('/pdf/sat/{id}', [PdfController::class, 'generateSat']);
```

---

### **FASE 1C: Sistema de Reportes Excel**
**Estimado: 2-3 días** | **Funcionalidad administrativa**

#### 📋 **Tareas Específicas:**

**1.8 Exportación Excel Laravel**
```php
// composer require maatwebsite/excel
// app/Exports/SearchReportExport.php
// Filtros: fecha, notaría, tipo búsqueda
// Formato: idéntico al sistema legacy
```

**1.9 Interfaz de Reportes**
```tsx
// resources/js/components/ReportsModal.tsx
// Modal con selección de fechas y filtros
// Vista previa antes de descarga
```

**1.10 Controlador de Reportes**
```php
// app/Http/Controllers/ReportController.php
public function generateExcel()     // Generar Excel
public function previewReport()     // Vista previa
public function getReportStats()    // Estadísticas
```

---

### **FASE 2: Sistema de Actualización Automática**
**Estimado: 3-4 días** | **Mantenimiento de datos**

#### 📋 **Tareas Específicas:**

**2.1 Comandos de Actualización**
```php
php artisan make:command UpdateOfacLists
php artisan make:command UpdateSatLists
// Descarga automática de fuentes oficiales
// Procesamiento y carga masiva
```

**2.2 Jobs en Cola**
```php
// app/Jobs/ProcessOfacUpdate.php
// app/Jobs/ProcessSatUpdate.php
// Procesamiento en background
// Notificaciones de actualización
```

**2.3 Programación Automática**
```php
// app/Console/Kernel.php
$schedule->command('lists:update-ofac')->daily();
$schedule->command('lists:update-sat')->weekly();
```

---

### **FASE 3: Dashboard Administrativo**
**Estimado: 3-4 días** | **Gestión y métricas**

#### 📋 **Tareas Específicas:**

**3.1 Dashboard con Métricas**
```tsx
// resources/js/pages/Dashboard.tsx mejorado
// Estadísticas de uso por notaría
// Gráficas de búsquedas por período
// Métricas de tipos de consulta
```

**3.2 Gestión de Usuarios**
```php
// app/Http/Controllers/AdminController.php
// Panel para administrar usuarios por notaría
// Configuración de permisos
// Logs de actividad
```

**3.3 Configuración del Sistema**
```php
// Configuración de frecuencias de actualización
// Gestión de logos por notaría
// Configuración de reportes
```

---

### **🎯 CRONOGRAMA EFICIENTE**

#### **Semana 1: Motor de Búsqueda (FASE 1A)**
- Días 1-2: Modelos y controladores
- Días 3-4: Componentes React y algoritmos
- Día 5: Testing y refinamiento

#### **Semana 2: PDFs y Reportes (FASE 1B-1C)**
- Días 1-2: Sistema de PDFs
- Días 3-4: Sistema Excel
- Día 5: Integración y testing

#### **Semana 3: Actualización y Admin (FASE 2-3)**
- Días 1-3: Sistema de actualización
- Días 4-5: Dashboard administrativo

---

### **🔧 CONSIDERACIONES TÉCNICAS CLAVE**

#### **Rendimiento:**
```php
// Índices optimizados para búsqueda
DB::statement('CREATE INDEX idx_nombre ON Nombres(NombreOriginal)');
DB::statement('CREATE INDEX idx_rfc ON `69-B`(RFC)');
// Cache de búsquedas frecuentes con Redis
```

#### **Seguridad:**
```php
// Rate limiting específico por usuario
// Validación estricta de inputs RFC
// Sanitización de nombres para PDFs
// Logs de auditoría completos
```

#### **Escalabilidad:**
```php
// Queue workers para PDFs pesados
// Particionado de logs por fecha
// Cache distribuido para búsquedas
```

---

### 🎯 **FASE 1A: Motor de Búsqueda Completo (COMPLETADO ✅)**
**Prioridad: ALTA** | **Estado: COMPLETADO** | **Fecha: 28 de Enero, 2026**

#### 📌 **Objetivos Completados:**
- ✅ **Búsqueda básica implementada** (OFAC y SAT)
- ✅ **Motor con tipos múltiples implementado** (Persona física, moral, RFC, combinada)
- ✅ **Algoritmos exactos del sistema legacy** (LIKE con wildcards, limpieza de comas)
- ✅ **Logging completo de búsquedas** (tabla busquedas con formato legacy)
- ✅ **Interfaz con resultados clickeables** (botones para generar PDFs)

#### 🛠️ **Implementación Completada:**

**1. ✅ BlacklistSearchController.php expandido**
   ```php
   // Métodos especializados implementados:
   ✅ searchPersonaFisica()    // Búsqueda por nombre OFAC
   ✅ searchPersonaMoral()     // Búsqueda denominación social  
   ✅ searchRfc()              // Búsqueda RFC en SAT
   ✅ searchCombined()         // OFAC + SAT simultáneo
   ✅ calculateMatch()         // Cálculo de coincidencias
   ✅ logLegacySearch()        // Logging formato legacy
   ```

**2. ✅ Modelos Eloquent optimizados**
   ```php
   // app/Models/OfacNombres.php - Tabla Nombres OFAC
   // app/Models/Sat69B.php - Tabla 69-B SAT
   // Scopes: searchByName, searchByRfc, searchCombined
   // Métodos estáticos: searchPersonaFisica, searchPersonaMoral, searchRfcAndName
   ```

**3. ✅ Componente Search.tsx completo**
   ```tsx
   // Funcionalidades implementadas:
   ✅ Selector tipo persona (física/moral/rfc/combinada)
   ✅ Validación RFC (12-13 caracteres)
   ✅ Resultados clickeables con botones PDF
   ✅ Historial de búsquedas lateral
   ✅ Estadísticas de uso en sidebar
   ✅ Colores diferenciados por tipo de coincidencia
   ```

**4. ✅ API Endpoints implementados**
   ```php
   ✅ POST /api/search/persona-fisica
   ✅ POST /api/search/persona-moral
   ✅ POST /api/search/rfc
   ✅ POST /api/search/combined
   ✅ GET  /api/search/history
   ✅ GET  /api/search/stats
   ```

#### 📊 **Algoritmos Implementados:**
```php
✅ Búsqueda LIKE con wildcards: CONCAT('%', ?, '%')
✅ Limpieza de comas: replace(NombreOriginal, ',', '')
✅ Conversión a mayúsculas: strtoupper()
✅ Prevención duplicados: unique('nombre_limpio')
✅ Validación RFC: strlen($RFC) >= 12 && <= 13
✅ Cálculo de coincidencias: similar_text()
```

---

### 🔄 **FASE 1B: Generación de PDFs Oficiales (SIGUIENTE)**
**Prioridad: ALTA** | **Estimado: 2-3 días** | **FUNCIONALIDAD CRÍTICA DEL NEGOCIO**

#### 📌 **Objetivos:**
- Generar PDFs oficiales idénticos al sistema legacy
- Templates con logos de notaría y formato legal
- Descarga directa desde resultados de búsqueda
- Información legal completa según normativas

#### 🛠️ **Tareas Técnicas:**
1. **Instalación y configuración**
   ```bash
   composer require barryvdh/laravel-dompdf
   # O alternativamente: composer require tecnickcom/tcpdf
   ```

2. **Servicio generador de PDFs**
   ```php
   // app/Services/PdfGeneratorService.php
   public function generateOfacPdf($searchData, $results, $user)
   public function generateSatPdf($searchData, $results, $user)  
   public function generateCombinedPdf($searchData, $results, $user)
   ```

3. **Templates Blade para PDFs**
   ```blade
   // resources/views/pdf/ofac-report.blade.php
   // resources/views/pdf/sat-report.blade.php
   // Incluir: logos, fecha/hora, información legal completa
   ```

4. **Controlador de PDFs**
   ```php
   // app/Http/Controllers/PdfController.php
   Route::get('/pdf/ofac/{searchId}', [PdfController::class, 'generateOfac']);
   Route::get('/pdf/sat/{searchId}', [PdfController::class, 'generateSat']);
   ```

#### 📄 **Especificaciones del PDF (Basadas en Sistema Legacy):**
```php
// Contenido exacto a implementar:
// 1. Header: Logo notaría + fecha/hora consulta
// 2. Título: "RESULTADO DE CONSULTA EN LAS LISTAS NEGRAS"
// 3. Tabla: Nombre buscado + resultado (Afirmativo/Negativo)
// 4. Texto legal: Información sobre OFAC/SAT
// 5. Footer: Disclaimers legales obligatorios
```

---

### 📊 **FASE 3: Sistema de Reportes Excel (NUEVA - PRIORITARIA)**
**Prioridad: ALTA** | **Estimado: 2-3 días** | **FUNCIONALIDAD ADMINISTRATIVA**

#### 📌 **Objetivos:**
- Reportes Excel por rango de fechas
- Filtros por notaría y tipo de búsqueda
- Vista previa antes de descarga
- Formato profesional con estilos

#### 🛠️ **Tareas Técnicas:**
1. **Instalación de Laravel Excel**
   ```bash
   composer require maatwebsite/excel
   ```

2. **Export Class**
   ```php
   // app/Exports/SearchReportExport.php
   // Incluir filtros: fecha_inicio, fecha_fin, notaria, tipo_busqueda
   ```

3. **Controlador de reportes**
   ```php
   // app/Http/Controllers/ReportController.php
   public function generateExcel(Request $request)
   public function previewReport(Request $request)
   public function downloadExcel($reportId)
   ```

4. **Modal de reportes React**
   ```tsx
   // resources/js/components/ReportsModal.tsx
   // Selector de fechas + filtros + vista previa
   ```

#### 📊 **Estructura del Excel (Basada en Sistema Legacy):**
```php
// Columnas exactas:
// ID, Usuario, Tipo_Busqueda, Nombre, RFC, Estatus_Nombre, 
// Estatus_RFC, Fecha, Notaria, Origen_Consulta
```

---

### 🔄 **FASE 4: Actualización Automática (Medio Plazo)**
**Prioridad: MEDIA** | **Estimado: 3-4 días**

#### 📌 **Objetivos:**
- Scripts para descargar listas actualizadas desde fuentes oficiales
- Procesamiento automático de archivos CSV/XML
- Programación de tareas con Laravel Scheduler  
- Notificaciones de actualizaciones completadas

#### 🛠️ **Tareas Técnicas:**
1. **Comandos Artisan**
   ```php
   php artisan make:command UpdateOfacLists
   php artisan make:command UpdateSatLists
   // Descarga desde: treasury.gov, sat.gob.mx
   ```

2. **Jobs en Cola**
   ```php
   // app/Jobs/ProcessOfacUpdate.php
   // app/Jobs/ProcessSatUpdate.php
   // Procesamiento masivo en background
   ```

3. **Programación Automática**
   ```php
   // app/Console/Kernel.php
   $schedule->command('lists:update-ofac')->daily();
   $schedule->command('lists:update-sat')->weekly();
   ```

4. **Manejo de Archivos de Actualización**
   ```php
   // Revisión de estructura actual en legacy:
   // ListasOfac/: alt.csv, cons_alt.csv, cons_prim.csv, sdn.csv
   // ListasSat/: Listado_Completo_69-B.csv
   ```

---

### 👥 **FASE 5: Gestión de Usuarios (Largo Plazo)**
**Prioridad: BAJA** | **Estimado: 2-3 días**

#### 📌 **Objetivos:**
- Panel administrativo completo
- Gestión de roles y permisos por notaría  
- Estadísticas de uso detalladas
- Configuración por usuario y notaría

#### 🛠️ **Tareas Técnicas:**
1. **Sistema de Roles Avanzado**
   ```php
   // Implementar con Spatie Permission:
   // 'admin' - Acceso total al sistema
   // 'notario' - Gestión de su notaría  
   // 'operador' - Solo búsquedas
   ```

2. **Panel Administrativo**
   ```tsx
   // resources/js/pages/admin/Dashboard.tsx
   // Gestión usuarios, configuración logos, estadísticas
   ```

3. **Métricas y Reportes de Uso**
   ```php
   // Estadísticas por notaría:
   // - Búsquedas por día/mes/año
   // - Tipos de consulta más frecuentes  
   // - Usuarios más activos
   ```

---

### 📊 **FASE 6: Dashboard Avanzado (Futuro)**
**Prioridad: BAJA** | **Estimado: 3-4 días**

#### 📌 **Objetivos:**
- Dashboard con métricas en tiempo real
- Gráficas de uso y tendencias
- Alertas de sistema
- Configuración avanzada

#### 🛠️ **Tareas Técnicas:** - ACTUALIZADO 29 Enero 2026**

### **✅ COMPLETADO (Fase Fundacional)**

#### 🏗️ Infraestructura
- [x] Instalación y configuración de Laravel 12
- [x] Configuración de 3 bases de datos MySQL
- [x] Frontend React 19 + TypeScript + Inertia v2
- [x] Build system Vite + TailwindCSS configurado
- [x] Corrección de todos los warnings TypeScript
- [x] Sistema de autenticación Laravel Fortify
- [x] Migraciones ejecutadas correctamente (15+ migraciones)

#### 👥 Migración de Datos Legacy
- [x] Migración de 245 usuarios desde sistema anterior
- [x] Sincronización de contraseñas hasheadas
- [x] Migración de 18,586 búsquedas históricas (86.75%)
- [x] Preservación de audit trail (campo `notaria`)
- [x] Identificación de 21 notarías únicas

#### 🎨 Diseño Visual Atinet
- [x] Implementación de colorimetría Atinet (OKLCH)
- [x] Sistema de glassmorphism con backdrop-blur
- [x] Dashboard con 15+ widgets animados (449 líneas)
- [x] WidgetCard component (117 líneas)
- [x] AnimatedStatsCard component (183 líneas)
- [x] CSS completo con dark mode (365 líneas)
- [x] Animaciones GSAP-style con Framer Motion

#### 🔍 Motor de Búsqueda
- [x] Sistema de búsquedas básico (OFAC y SAT)
- [x] BlacklistSearchController expandido con tipos múltiples
- [x] Algoritmos exactos del sistema legacy (LIKE, wildcards)
- [x] Logging completo de búsquedas en tabla `busquedas`
- [x] Interfaz Search.tsx con resultados clickeables

#### 🏢 Arquitectura Multi-Tenant
- [x] Decisión arquitectónica: Shared Database con `notaria_id`
- [x] NotariaScope (Global Scope) implementado
- [x] BelongsToNotaria trait creado
- [x] EnsureNotariaAccess middleware implementado
- [x] Migraciones para agregar `notaria_id` a `busquedas`
- [x] Migración para asignar `notaria_id` a datos existentes
- [x] Documentación completa en ARQUITECTURA_MULTI_TENANT.md

#### 🛠️ Sistema Dinámico de Herramientas
- [x] Tabla `herramientas` (catálogo global de 34 servicios)
- [x] Tabla `plan_herramienta` (pivot: planes ↔ herramientas)
- [x] Tabla `notaria_herramienta` (pivot: overrides por notaría)
- [x] HerramientasSeeder.php con 34 servicios reales Atinet
- [x] Modelo Herramienta con relaciones y métodos
- [x] Modelo Plan con herramientas dinámicas
- [x] Modelo Notaria con sistema de overrides
- [x] Documentación completa en SISTEMA_DINAMICO_HERRAMIENTAS.md

### **🚧 EN DESARROLLO (Prioridad ALTA)**

#### 🔄 Próximos Pasos Inmediatos
- [ ] 🔄 Crear PlanesSeeder con 4 planes y asociaciones
- [ ] 🔄 Crear NotariasMigrationSeeder (migrar 21 notarías)
- [ ] 🔄 Ejecutar migraciones multi-tenant pendientes
- [ ] 🔄 Actualizar modelo Busqueda con trait BelongsToNotaria
- [ ] 🔄 Registrar middleware EnsureNotariaAccess en bootstrap/app.php
- [ ] 🔄 Crear policies para autorización por notaría
- [ ] 🔄 Tests de aislamiento multi-tenant

#### 📄 Generación de PDFs (FASE 1B)
- [ ] Instalación de barryvdh/laravel-dompdf
- [ ] Servicio PdfGeneratorService
- [ ] Templates Blade: ofac-report.blade.php, sat-report.blade.php
- [ ] PdfController con rutas de descarga
- [ ] Integración con resultados de búsqueda

#### 📊 Sistema de Reportes Excel (FASE 1C)
- [ ] Instalación de maatwebsite/excel
- [ ] SearchReportExport con filtros
- [ ] ReportController con preview y descarga
- [ ] Modal de reportes en React (ReportsModal.tsx)
- [ ] Integración con sistema de búsquedas

### **📋 PENDIENTE (Planificado)**

#### 🔄 Actualización Automática de Listas (FASE 2)
- [ ] Comandos Artisan: UpdateOfacLists, UpdateSatLists
- [ ] Jobs en cola: ProcessOfacUpdate, ProcessSatUpdate
- [ ] Scheduler configuration en Console/Kernel.php
- [ ] Sistema de notificaciones de actualización

#### 🎛️ Panel Administrativo (FASE 3)
- [ ] Controllers para super_admin: HerramientaController, PlanController
- [ ] Panel de gestión de notarías
- [ ] Sistema de overrides de herramientas por notaría
- [ ] Interfaz para habilitar/deshabilitar herramientas
- [ ] Logs de auditoría de cambios administrativos

#### 🎫 Sistema de Tickets (FASE 4)
- [ ] Instalación Laravel Reverb + Echo + Pusher
- [ ] Modelo Ticket con BelongsToNotaria trait
- [ ] Sistema WebSocket para tiempo real
- [ ] Interfaz de tickets para usuarios
- [ ] Panel de gestión de tick9 de Enero, 2026  
**📊 Progreso Estimado:** 55% completado  
**🎯 Próxima Meta:** Ejecutar migraciones multi-tenant + crear seeders de planes/notarías  
**⏰ ETA MVP:** Finales de Febrero 2026  
**🏗️ Arquitectura:** Multi-tenant Shared Database confirmada

---

## 🚀 **Guía para Nuevos Desarrolladores**

### **📖 Bienvenido al Proyecto**
Este es un sistema SaaS multi-tenant para consulta de listas negras (OFAC y SAT 69-B) desarrollado para Atinet. El sistema tiene una jerarquía de 3 niveles:
1. **Super Admin (Atinet):** Gestiona todas las notarías y servicios
2. **Admin Notaría:** Gestiona su notaría y usuarios
3. **Usuario Notaría:** Realiza búsquedas según permisos

### **🎯 Flujo de Onboarding (30 minutos)**

#### 1️⃣ **Lectura de Documentación (10 min)**
Leer en orden:
1. Este archivo (`DOCUMENTACION_PROYECTO.md`) - contexto completo
2. `ARQUITECTURA_MULTI_TENANT.md` - arquitectura Shared Database
3. `SISTEMA_DINAMICO_HERRAMIENTAS.md` - sistema de herramientas flexible
4. `.github/copilot-instructions.md` - Laravel Boost Guidelines

#### 2️⃣ **Setup del Proyecto (10 min)**
```bash
# Clone y setup
git clone [repositorio]
cd Listas_negrasV2
composer install
npm install
cp .env.example .env
php artisan key:generate

# Configurar BD en .env (usar tus credenciales locales)
DB_CONNECTION=mysql
DB_DATABASE=atinet65_aplicativos
DB_OFAC_DATABASE=atinet65_listasofac
DB_SAT_DATABASE=atinet65_listassat

# Migraciones + seeders
php artisan migrate
php artisan db:seed --class=HerramientasSeeder

# Compilar y ejecutar
npm run build
npm run serve
```

#### 3️⃣ **Exploración del Sistema (10 min)**
```bash
# Abrir en VS Code
code .

# Archivos clave para entender:
app/Models/User.php                    # Usuario multi-tenant
app/Models/Notaria.php                 # Cliente de Atinet
app/Models/Herramienta.php             # Catálogo de servicios
app/Concerns/BelongsToNotaria.php      # Trait de aislamiento
app/Models/Scopes/NotariaScope.php     # Global Scope multi-tenant
resources/js/pages/dashboard.tsx       # Dashboard con widgets animados

# Testing
php artisan test
vendor/bin/pest
```

### **🧠 Conceptos Clave para Entender**

#### **Multi-Tenancy:**
- Usamos **Shared Database** con `notaria_id` (no DB per tenant)
- **NotariaScope** filtra automáticamente TODOS los queries
- **BelongsToNotaria trait** se aplica a modelos: Busqueda, Ticket, etc.
- Super_admin puede ver todo usando `withoutGlobalScope(NotariaScope::class)`

#### **Sistema de Herramientas:**
- **herramientas:** Catálogo global (34 servicios reales Atinet)
- **plan_herramienta:** Qué incluye cada plan
- **notaria_herramienta:** Overrides específicos por notaría
- Lógica: `Plan herramientas + enabled overrides - disabled overrides = herramientas activas`

#### **Jerarquía de Permisos:**
```php
tipo_cuenta:
- super_admin:       Atinet (ve todo, gestiona todo)
- admin_notaria:     Admin de notaría (gestiona su notaría)
- usuario_notaria:   Usuario normal (solo búsquedas)
- invitado:          Solo lectura
```

### **🔧 Tareas Comunes de Desarrollo**

#### **Crear un modelo multi-tenant:**
```php
<?php

namespace App\Models;

use App\Concerns\BelongsToNotaria;
use Illuminate\Database\Eloquent\Model;

class MiModelo extends Model
{
    use BelongsToNotaria; // ← Activa multi-tenancy automáticamente
    
    protected $fillable = [/* no incluir notaria_id */];
}
```

#### **Crear una migración:**
```bash
php artisan make:migration create_mi_tabla_table

# En la migración:
Schema::create('mi_tabla', function (Blueprint $table) {
    $table->id();
    $table->foreignId('notaria_id')->constrained()->cascadeOnDelete();
    $table->foreignId('user_id')->constrained();
    // ... más campos
    
    // Índices multi-tenant
    $table->index(['notaria_id', 'created_at']);
});
```

#### **Crear un controller con multi-tenancy:**
```php
public function index()
{
    // ✅ Automáticamente filtra por notaria_id del usuario
    $items = MiModelo::with('user')
        ->latest()
        ->paginate(20);
    
    return inertia('MiPagina/Index', ['items' => $items]);
}

// Para super_admin ver todas las notarías:
public function adminIndex()
{
    $this->authorize('viewAny', MiModelo::class); // Policy
    
    $items = MiModelo::withoutGlobalScope(NotariaScope::class)
        ->with('notaria', 'user')
        ->paginate(50);
    
    return inertia('Admin/MiPagina/Index', ['items' => $items]);
}
```

### **🧪 Testing Multi-Tenancy**

Siempre crear tests de aislamiento:
```php
test('usuarios no ven datos de otras notarías', function () {
    $notaria1 = Notaria::factory()->create();
    $notaria2 = Notaria::factory()->create();
    
    $user1 = User::factory()->for($notaria1)->create();
    $item2 = MiModelo::factory()->for($notaria2)->create();
    
    actingAs($user1);
    
    expect(MiModelo::count())->toBe(0); // No ve datos de notaria2
    expect(fn() => MiModelo::findOrFail($item2->id))
        ->toThrow(ModelNotFoundException::class);
});
```

### **📚 Recursos de Aprendizaje**

#### **Stack Principal:**
- Laravel 12: https://laravel.com/docs/12.x
- React 19: https://react.dev
- Inertia.js v2: https://inertiajs.com
- TailwindCSS v4: https://tailwindcss.com
- Pest Testing: https://pestphp.com

#### **Patrones Atinet:**
- Usar `search-docs` tool para documentación específica de versión
- Seguir Laravel Boost Guidelines en `.github/copilot-instructions.md`
- Ejecutar `vendor/bin/pint --dirty` antes de cada commit
- Crear tests Pest para toda funcionalidad nueva

### **🐛 Debugging Tips**

```bash
# Ver queries SQL ejecutados
DB::enableQueryLog();
// ... código
dd(DB::getQueryLog());

# Ver scope aplicado
dd(MiModelo::toSql());

# Tinker para explorar
php artisan tinker
>>> $user = User::find(1);
>>> $user->notaria;
>>> Busqueda::count(); // Ve solo su notaría
>>> Busqueda::withoutGlobalScope(NotariaScope::class)->count(); // Ve todo
```

### **❓ FAQs para Nuevos Desarrolladores**

**Q: ¿Por qué no veo datos de otras notarías?**  
A: El `NotariaScope` filtra automáticamente. Usa `withoutGlobalScope()` solo si eres super_admin.

**Q: ¿Cómo creo un super_admin para testing?**  
A: `User::factory()->superAdmin()->create()` o `$user->tipo_cuenta = 'super_admin';`

**Q: ¿Qué es BelongsToNotaria trait?**  
A: Aplica el scope multi-tenant automáticamente y asigna `notaria_id` al crear registros.

**Q: ¿Puedo usar DB::table() para queries?**  
A: ❌ NO. Siempre usar Eloquent. `DB::table()` bypasea los scopes de seguridad.

**Q: ¿Cómo ejecuto código sin filtro multi-tenant?**  
A: Solo para super_admin: `Model::withoutGlobalScope(NotariaScope::class)->get()`

---

## 👨‍💻 **Información del Proyecto**

**Desarrollado con:** Laravel 12 + React 19 + TypeScript + Inertia v2  
**Arquitectura:** Multi-tenant Shared Database con Global Scopes  
**Estado:** En desarrollo activo  
**Última actualización:** 29 de Enero, 2026  
**Repositorio:** [URL del repositorio]  
**Equipo:** Desarrollo colaborativo (onboarding-ready)

---

## 📝 **Changelog**

### [29 Enero 2026] - Arquitectura Multi-Tenant
- ✅ Decisión arquitectónica: Shared Database confirmada
- ✅ NotariaScope implementado (Global Scope)
- ✅ BelongsToNotaria trait creado
- ✅ EnsureNotariaAccess middleware implementado
- ✅ Migraciones para `notaria_id` en `busquedas`
- ✅ HerramientasSeeder con 34 servicios reales Atinet
- ✅ Documentación completa para onboarding
- 📄 Documentos creados: ARQUITECTURA_MULTI_TENANT.md

### [28 Enero 2026] - Sistema Dinámico de Herramientas
- ✅ Tabla herramientas (catálogo global)
- ✅ Tabla plan_herramienta (pivot planes ↔ herramientas)
- ✅ Tabla notaria_herramienta (overrides por notaría)
- ✅ Modelos actualizados con relaciones dinámicas
- ✅ Sistema de estados: habilitada, deshabilitada, suspendida, prueba
- 📄 Documentos creados: SISTEMA_DINAMICO_HERRAMIENTAS.md

### [27 Enero 2026] - Diseño Visual Atinet
- ✅ Implementación colorimetría Atinet (OKLCH)
- ✅ Dashboard con glassmorphism y 15+ widgets animados
- ✅ WidgetCard y AnimatedStatsCard components
- ✅ CSS completo con dark mode (365 líneas)

### [26 Enero 2026] - Migración de Datos Legacy
- ✅ Migración de 245 usuarios desde sistema anterior
- ✅ Migración de 18,586 búsquedas (86.75% éxito)
- ✅ Comando MigrateLegacySearches creado
- ✅ Preservación de audit trail

---

*Esta documentación es el **punto de entrada único** para el proyecto. Se actualiza constantemente y contiene TODO el contexto necesari
- **Días 4-5:** Testing integral y optimización

### **Sprint 4 (Semana 4): Funcionalidades Avanzadas** 
- **Días 1-3:** Panel administrativo
- **Días 4-5:** Dashboard con métricas

---

## 🔧 **Consideraciones Técnicas Actualizadas**

### **Rendimiento Optimizado:**
```php
// Índices específicos basados en el sistema legacy:
CREATE INDEX idx_nombres_original ON Nombres(NombreOriginal);
CREATE INDEX idx_69b_rfc ON `69-B`(RFC);  
CREATE INDEX idx_69b_nombre ON `69-B`(NombreOriginal);

// Cache de búsquedas frecuentes:
Cache::remember("search_ofac_{$nombre}", 3600, function() use ($nombre) {
    return OfacNombres::searchByName($nombre)->get();
});
```

### **Seguridad Reforzada:**
```php
// Rate limiting específico por funcionalidad:
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/api/search/*');  // 60 búsquedas por minuto
});

Route::middleware('throttle:10,1')->group(function () {
    Route::get('/pdf/*');  // 10 PDFs por minuto
});

// Validación estricta RFC:
$rfc = preg_replace('/[^A-Z0-9]/', '', strtoupper($rfc));
if (!preg_match('/^[A-ZÑ]{3,4}[0-9]{6}[A-Z0-9]{3}$/', $rfc)) {
    throw new ValidationException('RFC inválido');
}
```

### **Logging y Auditoría Completa:**
```php
// Tabla search_logs expandida:
Schema::create('search_logs', function (Blueprint $table) {
    $table->id();
    $table->foreignId('user_id')->constrained();
    $table->enum('tipo_busqueda', ['Lista Negra', 'SAT', 'Combinada']);
    $table->string('termino_busqueda');
    $table->string('rfc')->nullable();
    $table->boolean('encontrado_ofac')->default(false);
    $table->boolean('encontrado_sat')->default(false);
    $table->integer('total_resultados')->default(0);
    $table->json('resultados_detalle')->nullable();
    $table->string('notaria');
    $table->string('ip_address');
    $table->timestamps();
});
```

---

## 📝 **Notas de Migración**

### **Datos Preservados del Sistema Anterior**
- ✅ Usuarios y contraseñas
- ✅ Asignaciones por notaría
- ✅ Permisos de usuario
- ❓ Historial de búsquedas (verificar si existe)

### **URLs de Acceso**
- **Desarrollo:** http://127.0.0.1:8000
- **Login:** http://127.0.0.1:8000/login
- **API Base:** http://127.0.0.1:8000/api/

---

## ✅ **Checklist de Estado Actual**

### **✅ Completado**
- [x] Instalación y configuración de Laravel
- [x] Configuración de base de datos
- [x] Migración de usuarios
- [x] Sistema de autenticación
- [x] Frontend React + Inertia
- [x] Build system (Vite)
- [x] Corrección de warnings TypeScript

### **🚧 En Desarrollo**
- [x] ✅ **Sistema de búsquedas básico** (OFAC y SAT implementado)
- [ ] 🔄 **Motor de búsqueda multi-tipo** (persona física/moral/RFC)
- [ ] 🔄 **Generación de PDFs oficiales** (templates y descarga)
- [ ] 🔄 **Sistema de reportes Excel** (exportación por fechas)

### **📋 Pendiente (Planificado)**
- [ ] **Algoritmos exactos del sistema legacy** (coincidencias parciales)
- [ ] **Logging completo de búsquedas** (tabla search_logs expandida)
- [ ] **Actualización automática de listas** (comandos artisan programados)
- [ ] **Panel administrativo completo** (gestión usuarios/notarías)
- [ ] **Dashboard con métricas avanzadas** (gráficas y estadísticas)

---

## 🎯 **CONCLUSIONES DEL ANÁLISIS LEGACY**

### **✅ Ventajas del Nuevo Sistema Laravel:**
1. **Arquitectura Moderna:** React + Inertia.js vs PHP procedural
2. **Seguridad Mejorada:** Autenticación Laravel Fortify vs sesiones básicas  
3. **Escalabilidad:** Queue workers y cache vs procesamiento directo
4. **Mantenibilidad:** Código estructurado vs archivos PHP dispersos
5. **Performance:** Eloquent ORM vs consultas MySQL directas

### **📋 Funcionalidades Críticas Identificadas:**
1. **Motor de búsqueda con 4 tipos:** Física, Moral, RFC, Combinada
2. **PDFs oficiales:** Templates exactos con información legal
3. **Reportes Excel:** Filtros por fecha y notaría  
4. **Logging completo:** Auditoría de todas las búsquedas
5. **Actualización automática:** Mantener listas actualizadas

### **🚀 Próximos Pasos Inmediatos:**
1. **Expandir motor de búsqueda actual** con tipos múltiples
2. **Implementar generación de PDFs** con templates oficiales
3. **Crear sistema de reportes Excel** para administradores
4. **Optimizar rendimiento** con índices y cache

### **⏱️ Timeline Realista:**
- **Semana 1:** Completar funcionalidad de búsqueda avanzada
- **Semana 2:** Implementar PDFs y reportes Excel  
- **Semana 3:** Sistema de actualización automática
- **Semana 4:** Panel administrativo y refinamiento

---

## 📞 **Estado de Desarrollo Actual**

**🔄 Última Actualización:** 28 de Enero, 2026  
**📊 Progreso Estimado:** 40% completado  
**🎯 Próxima Meta:** Completar motor de búsqueda multi-tipo  
**⏰ ETA MVP:** Mediados de Febrero 2026

---

## 👨‍💻 **Contacto y Mantenimiento**

**Desarrollado con:** Laravel 12 + React 19 + TypeScript  
**Estado:** En desarrollo activo  
**Última actualización:** 28 de Enero, 2026  

---

*Esta documentación se actualiza conforme avanza el desarrollo del proyecto.*
