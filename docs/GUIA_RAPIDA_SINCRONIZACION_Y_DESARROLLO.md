# ⚡ Guía Rápida: Sincronización y Desarrollo

**Última Actualización:** 8 de Abril, 2026  
**Propósito:** Comandos y procesos frecuentes en el día a día

---

## 🔄 SINCRONIZACIÓN DE LISTAS NEGRAS

### Producción (Automática)

```
✅ Configurado en Programador de Tareas de Windows
✅ Se ejecuta cada 15 minutos automáticamente
✅ Comando: php artisan blacklists:sync
✅ No requiere intervención manual
```

### Desarrollo (Manual)

**Antes de probar búsquedas OFAC/SAT, SIEMPRE ejecutar:**

```bash
# 1. Ir a la raíz del proyecto
cd C:\Users\Dev pc\Desktop\LARAVEL\Atinet_Compliance_Hub

# 2. Verificar qué se sincronizaría (dry-run)
php artisan blacklists:sync --dry-run

# 3. Ejecutar sincronización real
php artisan blacklists:sync

# 4. Verificar que sincronizó correctamente
php verify_all_tables_synced.php
```

**Frecuencia recomendada en desarrollo:**
- **Diario:** Si trabajas con búsquedas OFAC/SAT
- **Semanal:** Si NO trabajas con búsquedas
- **Antes de demo/testing:** Siempre sincronizar

---

## 📊 COMANDOS DE VERIFICACIÓN

### Verificar Conexión a Hostgator

```bash
# Solo verificar conexiones (sin sincronizar)
php artisan blacklists:sync --test
```

**Output esperado:**
```
✅ OFAC: Conectado (162.144.6.1)
✅ SAT: Conectado (162.144.6.1)
✅ APLICATIVOS: Conectado (162.144.6.1)
✅ CATALOGOS: Conectado (162.144.6.1)
```

### Verificar Conteos de Tablas

```bash
# Ver cuántos registros hay en cada BD
php verify_all_tables_synced.php
```

**Output esperado:**
```
=== OFAC (11 tablas) ===
SDN: 15,234 registros
ALT: 8,921 registros
...
Total OFAC: 45,678 registros

=== SAT (4 tablas) ===
69-B: 1,234 registros
69-C: 5,678 registros
...
Total SAT: 8,901 registros
```

### Verificar Estados de Notarías

```bash
# Sincronizar estado activo/inactivo según suscripciones
php sync_notaria_status.php
```

---

## 🏗️ CREAR NUEVA NOTARÍA (Testing)

### Via UI (Recomendado)

1. Login como super_admin
2. Ir a `/admin/notarias`
3. Click "Nueva Notaría"
4. Llenar formulario:
   - Nombre: "Notaría de Prueba X"
   - Número: 990-999 (rango de testing)
   - Estado: Seleccionar
   - Plan: Seleccionar
   - Email: test@ejemplo.com
5. Guardar

**Verificar BD creada:**
```sql
USE atinet_{estado}_notaria_{numero};
SHOW TABLES;
-- Debe tener 14+ tablas
```

### Via Comando (Avanzado)

```bash
# NO recomendado - usar solo para debugging
php artisan tinker

# Dentro de tinker:
$notaria = App\Models\Notaria::create([
    'nombre' => 'Notaría de Prueba',
    'numero_notaria' => '999',
    'estado' => 'Jalisco',
    'plan_id' => 1,
    // ... más campos
]);
```

---

## 🗄️ COMANDOS DE BASE DE DATOS

### Listar BDs de Notarías

```sql
-- En MySQL Workbench o CLI
SHOW DATABASES LIKE 'atinet_%';
```

**Output esperado:**
```
atinet_compliance_hub (Master)
atinet65_listasofac
atinet65_listassat
atinet65_aplicativos
atinet65_catalogos
atinet_edomex_notaria_1
atinet_edomex_notaria_2
atinet_jal_notaria_15
... (50+ BDs tenant)
```

### Verificar Tablas de una Notaría

```sql
USE atinet_edomex_notaria_1;
SHOW TABLES;

-- Output esperado (14 tablas):
-- activity_log
-- agenda_events
-- busquedas
-- cache
-- configuracion
-- jobs
-- plan_services
-- plans
-- registro_web ← CRÍTICA
-- search_histories
-- service_usage
-- services
-- subscriptions
-- tenant_services
-- users
```

### Contar Registros por Tabla

```sql
USE atinet_edomex_notaria_1;

SELECT 
    (SELECT COUNT(*) FROM users) as usuarios,
    (SELECT COUNT(*) FROM busquedas) as busquedas,
    (SELECT COUNT(*) FROM registro_web) as registros_web,
    (SELECT COUNT(*) FROM agenda_events) as eventos,
    (SELECT COUNT(*) FROM activity_log) as logs;
```

---

## 🧪 TESTING RÁPIDO

### Test 1: Verificar QR Scanner

```bash
# 1. Ir a frontend
cd resources/js

# 2. Buscar componente
grep -r "ScannerQR" pages/

# 3. Verificar imports
grep -r "qr-parser" components/
```

### Test 2: Probar Búsqueda OFAC

```bash
# 1. Sincronizar primero
php artisan blacklists:sync

# 2. En navegador:
# - Login a cualquier notaría
# - Ir a "Listas Negras"
# - Buscar: "PUTIN" (debe aparecer en OFAC)
# - Buscar: "MADURO" (debe aparecer en OFAC)
```

### Test 3: Probar Búsqueda SAT

```bash
# 1. Sincronizar
php artisan blacklists:sync

# 2. En navegador:
# - Ir a "Listas Negras"
# - Buscar RFC de lista 69-C
# - Debe mostrar "Encontrado en SAT 69-C"
```

---

## 🔑 CREDENCIALES Y CONFIGURACIÓN

### .env Variables Críticas

```env
# === Database Master ===
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=atinet_compliance_hub
DB_USERNAME=root
DB_PASSWORD=your_password

# === Hostgator Remote (Sincronización) ===
REMOTE_DB_HOST=162.144.6.1
REMOTE_DB_PORT=3306
REMOTE_DB_USERNAME=atinet65_ucompliance
REMOTE_DB_PASSWORD=[OBTENER DE config/database.php]

# === OFAC Local ===
OFAC_DB_DATABASE=atinet65_listasofac
OFAC_DB_USERNAME=root
OFAC_DB_PASSWORD=your_password

# === SAT Local ===
SAT_DB_DATABASE=atinet65_listassat
SAT_DB_USERNAME=root
SAT_DB_PASSWORD=your_password

# === Aplicativos Local ===
APLICATIVOS_DB_DATABASE=atinet65_aplicativos
APLICATIVOS_DB_USERNAME=root
APLICATIVOS_DB_PASSWORD=your_password

# === Catalogos Local ===
CATALOGOS_DB_DATABASE=atinet65_catalogos
CATALOGOS_DB_USERNAME=root
CATALOGOS_DB_PASSWORD=your_password
```

---

## 📦 MIGRACIONES

### Crear Nueva Migración

```bash
# Sintaxis
php artisan make:migration nombre_descriptivo

# Ejemplos
php artisan make:migration add_campo_to_notarias_table
php artisan make:migration create_nueva_tabla_table
```

### Ejecutar Migraciones

```bash
# En BD Master (atinet_compliance_hub)
php artisan migrate

# En BD Tenant específica (requiere código)
# Ver NotariaController::runMigrationsForTenant()
```

### Rollback Migraciones

```bash
# Deshacer última migración
php artisan migrate:rollback

# Deshacer últimas 3 migraciones
php artisan migrate:rollback --step=3

# Deshacer TODAS (cuidado en producción)
php artisan migrate:reset
```

---

## 🛠️ TROUBLESHOOTING COMÚN

### Problema: "Connection refused" al sincronizar

**Síntomas:**
```
❌ Error: SQLSTATE[HY000] [2002] Connection refused
```

**Soluciones:**
```bash
# 1. Verificar que MySQL está corriendo
# Windows:
services.msc → MySQL80 → Iniciar

# 2. Verificar .env
cat .env | grep REMOTE_DB_HOST
# Debe ser: 162.144.6.1

# 3. Verificar firewall (raro)
ping 162.144.6.1
```

### Problema: Tabla "registro_web" no existe

**Síntomas:**
```
SQLSTATE[42S02]: Table 'atinet_jal_notaria_15.registro_web' doesn't exist
```

**Causa:**
Notaría creada antes de la actualización de NotariaController

**Solución:**
```bash
# Opción 1: Ejecutar migración manual en esa BD
# Ver docs/development/ACTUALIZACION_NOTARIA_CONTROLLER.md

# Opción 2: Re-crear la notaría (solo en desarrollo)
DROP DATABASE atinet_jal_notaria_15;
# Luego crear de nuevo desde UI
```

### Problema: Sincronización muy lenta

**Síntomas:**
```
php artisan blacklists:sync tarda 10+ minutos
```

**Causas y Soluciones:**
```bash
# 1. Conexión lenta a Hostgator
# → Esperar, es normal la primera vez (miles de registros)

# 2. Verificar que es incremental
php artisan blacklists:sync --dry-run
# Debe mostrar "0 nuevos registros" si ya sincronizaste antes

# 3. Limpiar cache
php artisan cache:clear
php artisan config:clear
```

### Problema: "Class not found" después de crear archivo

**Síntomas:**
```
Class 'App\Services\MiNuevoServicio' not found
```

**Solución:**
```bash
# Regenerar autoload de Composer
composer dump-autoload

# Limpiar cache de Laravel
php artisan cache:clear
php artisan config:clear
php artisan route:clear
php artisan view:clear
```

---

## 🚀 FLUJO DE TRABAJO DIARIO

### Inicio del Día

```bash
# 1. Pull últimos cambios
git pull origin main

# 2. Instalar dependencias (si hubo cambios)
composer install
npm install

# 3. Migrar BD (si hay nuevas migraciones)
php artisan migrate

# 4. Sincronizar listas (si trabajas con búsquedas)
php artisan blacklists:sync

# 5. Levantar servidor
php artisan serve
# o
composer run dev
```

### Durante Desarrollo

```bash
# Frontend (un terminal)
npm run dev

# Backend (otro terminal)
php artisan serve

# Tests (tercer terminal, opcional)
php artisan test --filter=NombreDelTest
```

### Antes de Commit

```bash
# 1. Formatear código PHP
vendor/bin/pint

# 2. Limpiar código JS/TS
npm run lint

# 3. Ejecutar tests
php artisan test

# 4. Verificar que compila frontend
npm run build

# 5. Git add + commit
git add .
git commit -m "feat: descripción del cambio"
git push origin main
```

---

## 📝 LOGS ÚTILES

### Ver Logs en Tiempo Real

```bash
# Laravel logs
tail -f storage/logs/laravel.log

# Filtrar solo errores
tail -f storage/logs/laravel.log | grep ERROR

# Filtrar sincronización
tail -f storage/logs/laravel.log | grep "BlacklistSync"
```

### Limpiar Logs Antiguos

```bash
# Limpiar todo (cuidado)
rm storage/logs/*.log

# Limpiar logs > 7 días (Windows PowerShell)
Get-ChildItem storage/logs/*.log | Where-Object {$_.LastWriteTime -lt (Get-Date).AddDays(-7)} | Remove-Item
```

---

## 🎯 ATAJOS DE TESTING VIA CLI

### Crear Usuario de Prueba

```bash
php artisan tinker

# Dentro de tinker:
$user = App\Models\User::create([
    'name' => 'Test User',
    'email' => 'test@test.com',
    'password' => Hash::make('password'),
    'tipo_cuenta' => 'usuario',
    'notaria_id' => 1
]);
```

### Crear Búsqueda de Prueba

```bash
php artisan tinker

# Dentro de tinker:
$busqueda = App\Models\Busqueda::create([
    'notaria_id' => 1,
    'user_id' => 1,
    'nombre' => 'VLADIMIR PUTIN',
    'tipo_busqueda' => 'ofac',
    'resultado' => 'encontrado',
    'detalles' => 'Encontrado en SDN List'
]);
```

### Verificar Suscripción

```bash
php artisan tinker

# Dentro de tinker:
$notaria = App\Models\Notaria::find(1);
$notaria->subscriptions; // Ver suscripciones
$notaria->isActive(); // true/false
```

---

## 📚 DOCUMENTACIÓN ADICIONAL

- **Arquitectura Completa:** `docs/architecture/ARQUITECTURA_COMPLETA_Y_SINCRONIZACION.md`
- **Actualizar NotariaController:** `docs/development/ACTUALIZACION_NOTARIA_CONTROLLER.md`
- **Listas Negras:** `docs/LISTAS_NEGRAS_OFAC_SAT.md`
- **Historial Búsquedas:** `docs/PROPUESTA_HISTORIAL_BUSQUEDAS.md`

---

## 🆘 CONTACTOS DE SOPORTE

**Desarrollo:**
- Lead: [Nombre del lead]
- Backend: [Equipo PHP/Laravel]
- Frontend: [Equipo React/Inertia]

**Infraestructura:**
- IT Atinet: [Responsable de servidores]
- Hostgator: soporte@hostgator.com

**Urgencias:**
- Slack: #atinet-compliance-urgente
- Teléfono: [Número de emergencia]

---

**Recuerda:**
- ✅ Siempre sincronizar ANTES de probar búsquedas
- ✅ Crear notarías de prueba con número 990-999
- ✅ No modificar BDs de producción en desarrollo local
- ✅ Hacer commit frecuentemente (pequeños cambios)
- ✅ Documentar cambios complejos en README

**Última Actualización:** 8 de Abril, 2026  
**Mantenido por:** Equipo de Desarrollo Atinet
