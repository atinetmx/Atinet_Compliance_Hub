# 🚀 Guía de Deployment - Windows Server 2019 (Servidor Atinet)

**Fecha:** 25 de Febrero, 2026  
**Servidor:** Atinet Local (i7-4770, 12GB RAM, Windows Server 2019)  
**Status:** ✅ Hardware existente, configuración parcial completa

---

## ✅ Estado Actual del Servidor

### Hardware Disponible ✅
```
Procesador: Intel i7-4770 CPU @ 3.4GHz
RAM: 12GB DDR3
Discos: 3×1TB + 1×512GB
SO: Windows Server 2019
Red: [Por confirmar velocidad]
UPS: [Por confirmar]
```

### Software Ya Instalado ✅
```
✅ IIS (Internet Information Services)
✅ FastCGI Module
✅ PHP configurado con FastCGI
✅ SSH Server
✅ RDP (Remote Desktop)
✅ URL Rewrite Module
✅ Document Root configurado (Default Web Site)
```

**Ventaja:** Ya tienes 70% del setup completo ✅

---

## 🏗️ Arquitectura del Sistema Completa

### Diagrama de Infraestructura

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVIDOR LOCAL ATINET                          │
│                   (Windows Server 2019 - i7-4770)                   │
└─────────────────────────────────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
         ┌──────────▼──────────┐   ┌─────────▼──────────┐
         │  SISTEMA VB6.0      │   │  LARAVEL ATINET    │
         │  (Escritorio)       │   │  (Web)             │
         │                     │   │                     │
         │  ┌──────────────┐   │   │  ┌──────────────┐  │
         │  │ MySQL 5.0    │   │   │  │ MySQL 8.0    │  │
         │  │ Puerto: 3306 │   │   │  │ Puerto: 3307 │  │
         │  │              │   │   │  │              │  │
         │  │ BD Propia    │   │   │  │ 25 BDs:      │  │
         │  │ (VB6.0)      │   │   │  │ - Master     │  │
         │  └──────────────┘   │   │  │ - 21 Tenant  │  │
         │         │           │   │  │ - OFAC       │  │
         │         │           │   │  │ - SAT        │  │
         │         │ Consume   │   │  │ - Aplicativos│  │
         │         │ API       │   │  └──────────────┘  │
         │         │           │   │                     │
         │         ▼           │   │  IIS + PHP 8.2     │
         └─────────┼───────────┘   └────────────────────┘
                   │
                   │
         ┌─────────▼──────────────────────────────────────┐
         │          HOSTGATOR (cPanel)                    │
         │                                                │
         │  ┌──────────────────────────────────────────┐ │
         │  │ BD Registro Web (alimenta VB6.0 via API) │ │
         │  └──────────────────────────────────────────┘ │
         │                                                │
         │  ┌──────────────────────────────────────────┐ │
         │  │ BDs a MIGRAR a MySQL 8.0:                │ │
         │  │ - atinet_compliance_hub (master)         │ │
         │  │ - atinet65_listasofac (OFAC)             │ │
         │  │ - atinet65_listassat (SAT)               │ │
         │  │ - atinet65_aplicativos                   │ │
         │  │ - 21 BDs tenant (notarías)               │ │
         │  └──────────────────────────────────────────┘ │
         └────────────────────────────────────────────────┘
```

### 🔍 Puntos Clave de la Arquitectura

**1. Independencia Total:**
- ✅ MySQL 5.0 (VB6.0) y MySQL 8.0 (Laravel) son INDEPENDIENTES
- ✅ Usan puertos diferentes (3306 vs 3307)
- ✅ NO comparten datos ni se afectan mutuamente

**2. Sistema VB6.0 (NO SE TOCA):**
- ✅ Seguirá usando MySQL 5.0 local (puerto 3306)
- ✅ Consume API de Hostgator para registro web
- ✅ Zero cambios necesarios

**3. Laravel Atinet (NUEVO en MySQL 8.0):**
- ✅ Usará MySQL 8.0 (puerto 3307)
- ✅ Recibirá 25 BDs migradas desde Hostgator
- ✅ Creará nuevas BDs tenant dinámicamente

**4. Migración desde Hostgator:**
- ✅ Solo BDs de Laravel se migran (25 BDs)
- ✅ BD de registro web PERMANECE en Hostgator (alimenta VB6.0 vía API)
- ✅ Sitios web pueden quedarse en Hostgator o migrar después

**5. Zero Conflictos:**
- ✅ No hay dependencias cruzadas
- ✅ No hay datos compartidos
- ✅ Ambos sistemas operan independientemente

---

## 📋 Software Faltante (Necesario Instalar)

### 1. MySQL Server 8.0
**Propósito:** Base de datos principal  
**Descarga:** https://dev.mysql.com/downloads/mysql/  
**Versión:** MySQL 8.0.x Windows (x64)

### 2. Composer
**Propósito:** Gestor de dependencias PHP  
**Descarga:** https://getcomposer.org/Composer-Setup.exe

### 3. Node.js + NPM
**Propósito:** Build de assets frontend  
**Descarga:** https://nodejs.org (LTS version)

### 4. Git for Windows (opcional, si no está)
**Propósito:** Control de versiones  
**Descarga:** https://git-scm.com/download/win

### 5. Redis for Windows (opcional, recomendado)
**Propósito:** Cache y sessions  
**Descarga:** https://github.com/tporadowski/redis/releases

---

## 🔧 Paso 1: Instalar MySQL 8.0 (15-20 min)

### ⚠️ IMPORTANTE: Coexistencia con MySQL 5.0 Existente

**Situación actual del servidor:**
```
✅ MySQL 5.0 YA instalado (puerto 3306) - Sistema legacy VB6.0
🆕 MySQL 8.0 se instalará en PUERTO DIFERENTE (3307)
```

**Ambas versiones pueden coexistir sin problemas:**
- MySQL 5.0 → Puerto 3306 → Sistema notarial legacy (NO TOCAR ❌)
- MySQL 8.0 → Puerto 3307 → Laravel Atinet Compliance Hub (NUEVO ✅)

**¿Por qué MySQL 8.0?**
- ✅ Laravel 11+ requiere MySQL 5.7+ mínimo
- ✅ MySQL 5.0 es EOL (End of Life desde 2018)
- ✅ Mejor performance y características modernas
- ✅ Seguridad mejorada (autenticación, encriptación)

---

### 1.1 Descargar e Instalar MySQL 8.0 en Puerto Diferente

1. Descarga MySQL Installer desde:
   ```
   https://dev.mysql.com/downloads/installer/
   ```
   Elige: `mysql-installer-community-8.0.xx.msi` (Full)

2. **Ejecuta el instalador con estas configuraciones ESPECÍFICAS:**

   **A) Setup Type:**
   - Selecciona: **Custom** (no Developer Default)
   - Products a instalar:
     - ✅ MySQL Server 8.0.x X64
     - ✅ MySQL Workbench 8.0.x (actualización)
     - ❌ MySQL Router (no necesario)
     - ❌ MySQL for Visual Studio (opcional)

   **B) Type and Networking (CRÍTICO):**
   ```
   Config Type: Development Computer
   Port: 3307  ⚠️ (NO 3306, ese lo usa MySQL 5.0)
   Open Windows Firewall port: ✅ Sí
   Named Pipe: ❌ No (opcional)
   Shared Memory: ❌ No (opcional)
   ```

   **C) Authentication Method:**
   - Selecciona: **Use Strong Password Encryption** (recommended)

   **D) Accounts and Roles:**
   - **Root Password:** [ELIGE UNA CONTRASEÑA SEGURA Y GUÁRDALA]
   - ⚠️ **Importante:** Esta es diferente a la de MySQL 5.0

   **E) Windows Service:**
   ```
   Configure MySQL Server as a Windows Service: ✅ Sí
   Service Name: MySQL80  ⚠️ (NO "MySQL", ese es MySQL 5.0)
   Start at System Startup: ✅ Sí
   Run Windows Service as: Standard System Account
   ```

3. Completa instalación y verifica:
   ```cmd
   # Verificar versión (debe mostrar 8.0.x)
   mysql --version
   
   # Conectar a MySQL 8.0 específicamente
   mysql -u root -p --port=3307
   ```
   
   **Nota:** Sin `--port=3307` se conecta a MySQL 5.0 (puerto 3306 por defecto)

4. **Verificar ambos servicios están corriendo:**
   ```powershell
   Get-Service -Name "MySQL"     # MySQL 5.0 (legacy)
   Get-Service -Name "MySQL80"   # MySQL 8.0 (Laravel)
   ```
   
   Ambos deben mostrar: `Status: Running`

### 1.2 Configurar MySQL para Laravel

1. Abre MySQL Workbench o cmd como Administrador:
   ```cmd
   mysql -u root -p
   ```

2. Crear usuario para Laravel:
   ```sql
   -- Crear usuario
   CREATE USER 'atinet_app'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURA';
   
   -- Dar todos los permisos (necesario para CREATE DATABASE)
   GRANT ALL PRIVILEGES ON *.* TO 'atinet_app'@'localhost' WITH GRANT OPTION;
   
   -- Aplicar cambios
   FLUSH PRIVILEGES;
   
   -- Verificar
   SHOW GRANTS FOR 'atinet_app'@'localhost';
   ```

3. Crear base de datos master:
   ```sql
   CREATE DATABASE atinet_compliance_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- Salir
   exit;
   ```

### 1.3 Configurar Performance MySQL (Opcional)

Edita: `C:\ProgramData\MySQL\MySQL Server 8.0\my.ini`

```ini
[mysqld]
# Ajustes para 12GB RAM (usar ~40% = 5GB)
innodb_buffer_pool_size = 5G
max_connections = 250
innodb_log_file_size = 512M
```

Reinicia servicio MySQL:
```powershell
Restart-Service MySQL80
```

---

## ⚙️ Paso 1.4: Arquitectura de Bases de Datos - Aclaración

### 📊 Situación Real del Sistema Atinet

**Hostgator (cPanel - Actual):**
```
✅ atinet65_listasofac (OFAC)      → Sitio web consultas
✅ atinet65_listassat (SAT)        → Sitio web consultas  
✅ atinet65_aplicativos            → Sitio web consultas
✅ atinet_compliance_hub (master)  → Sistema Laravel
✅ 21 BDs tenant (notarías)        → Datos por notaría
✅ BD registro web                 → Alimenta sistema VB6.0 vía API
```

**Servidor Local (Actual):**
```
✅ MySQL 5.0 (puerto 3306)         → Sistema notarial VB6.0 (escritorio)
                                   → BD independiente, NO relacionada con Laravel
```

**Servidor Local (Después del deployment):**
```
🆕 MySQL 8.0 (puerto 3307)         → Laravel Atinet Compliance Hub
                                   → Todas las BDs migradas desde Hostgator
                                   → 22+ BDs: master + tenants + legacy
```

### ✅ Confirmación Importante

**Las BDs OFAC, SAT y Aplicativos:**
- ✅ Están en Hostgator (NO en MySQL 5.0 local)
- ✅ Son para sitios web (NO para sistema VB6.0)
- ✅ Se pueden migrar sin problema a MySQL 8.0
- ✅ **CERO conflicto con MySQL 5.0 local**

**El sistema VB6.0 (escritorio):**
- ✅ Usa MySQL 5.0 local (puerto 3306) con su propia BD
- ✅ Se alimenta de BD registro web en Hostgator vía API
- ✅ NO usa las BDs que Laravel necesita
- ✅ Seguirá funcionando sin cambios

**Conclusión:** 
- 🎉 **MySQL 5.0 y MySQL 8.0 son completamente independientes**
- ✅ **No hay interferencia ni dependencias cruzadas**
- ✅ **Migración segura: Hostgator → MySQL 8.0 local**

---

## ⚙️ Paso 1.5: Plan de Migración Simplificado

### Desde Hostgator a MySQL 8.0 Local

**Bases de datos a migrar:**
1. `atinet_compliance_hub` (master)
2. `atinet65_listasofac` (OFAC)
3. `atinet65_listassat` (SAT)
4. `atinet65_aplicativos` (Aplicativos)
5. 21 BDs tenant: `atinet_edomex_notaria_X`

**Total: 25 bases de datos**

### Proceso de Exportación (desde Hostgator/cPanel):

1. **Acceder a phpMyAdmin en cPanel**

2. **Exportar cada BD:**
   ```
   phpMyAdmin → Seleccionar BD → Exportar
   Método: Rápido
   Formato: SQL
   Descargar archivo .sql
   ```

3. **Organizar archivos:**
   ```
   C:\backups\
   ├── atinet_compliance_hub.sql
   ├── atinet65_listasofac.sql
   ├── atinet65_listassat.sql
   ├── atinet65_aplicativos.sql
   ├── atinet_edomex_notaria_1.sql
   ├── atinet_edomex_notaria_2.sql
   └── ... (resto de notarías)
   ```

### Proceso de Importación (a MySQL 8.0 Local):

1. **Conectar a MySQL 8.0:**
   ```cmd
   mysql -u root -p --port=3307
   ```

2. **Crear todas las BDs:**
   ```sql
   -- BD Master
   CREATE DATABASE atinet_compliance_hub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- BDs Legacy (listas negras)
   CREATE DATABASE atinet65_listasofac CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE atinet65_listassat CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE atinet65_aplicativos CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   
   -- BDs Tenant (ejemplo, repetir para las 21 notarías)
   CREATE DATABASE atinet_edomex_notaria_1 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE atinet_edomex_notaria_2 CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   -- ... etc
   
   exit;
   ```

3. **Importar dumps:**
   ```cmd
   # BD Master
   mysql -u atinet_app -p --port=3307 atinet_compliance_hub < C:\backups\atinet_compliance_hub.sql
   
   # BDs Legacy
   mysql -u atinet_app -p --port=3307 atinet65_listasofac < C:\backups\atinet65_listasofac.sql
   mysql -u atinet_app -p --port=3307 atinet65_listassat < C:\backups\atinet65_listassat.sql
   mysql -u atinet_app -p --port=3307 atinet65_aplicativos < C:\backups\atinet65_aplicativos.sql
   
   # BDs Tenant (script en PowerShell más abajo)
   ```

4. **Script PowerShell para importar múltiples BDs:**
   ```powershell
   # Importar todas las BDs tenant automáticamente
   $backupPath = "C:\backups"
   $mysqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
   
   Get-ChildItem "$backupPath\atinet_*.sql" | ForEach-Object {
       $dbName = $_.BaseName
       Write-Host "Importando $dbName..." -ForegroundColor Yellow
       
       & $mysqlPath -u atinet_app -p --port=3307 $dbName < $_.FullName
       
       if ($LASTEXITCODE -eq 0) {
           Write-Host "✅ $dbName importada exitosamente" -ForegroundColor Green
       } else {
           Write-Host "❌ Error importando $dbName" -ForegroundColor Red
       }
   }
   ```

### ⚠️ Notas Importantes:

1. **Sistema VB6.0 NO se afecta:**
   - Sigue usando MySQL 5.0 (puerto 3306)
   - Sigue consumiendo API de Hostgator
   - Zero cambios necesarios

2. **Sitios web pueden seguir funcionando:**
   - Opción A: Migrar sitios web también al servidor local
   - Opción B: Dejar sitios en Hostgator, migrar solo Laravel
   - Laravel funcionará independientemente

3. **Configuración Laravel (.env):**
   ```ini
   DB_HOST=127.0.0.1
   DB_PORT=3307  # MySQL 8.0 (NO 3306 que es MySQL 5.0)
   DB_DATABASE=atinet_compliance_hub
   DB_USERNAME=atinet_app
   DB_PASSWORD=tu_password
   ```

---

## 🔧 Paso 2: Instalar Composer (5 min)

1. Descarga y ejecuta: https://getcomposer.org/Composer-Setup.exe

2. Durante instalación:
   - Usa el PHP ya instalado: `C:\PHP\php.exe`
   - ✅ Add to PATH

3. Verifica en cmd:
   ```cmd
   composer --version
   ```
   Debería mostrar: `Composer version 2.x.x`

---

## 🔧 Paso 3: Instalar Node.js + NPM (5 min)

1. Descarga LTS desde: https://nodejs.org

2. Instala con opciones predeterminadas

3. Verifica:
   ```cmd
   node --version
   npm --version
   ```

---

## 🔧 Paso 4: Configurar PHP Extensions (10 min)

### 4.1 Verificar versión PHP actual

```cmd
php --version
```

Debe ser **PHP 8.2** mínimo. Si es menor, actualiza PHP.

### 4.2 Habilitar extensiones necesarias

Edita: `C:\PHP\php.ini` (o donde esté tu php.ini)

Descomenta (quitar `;` al inicio) estas líneas:

```ini
extension=curl
extension=fileinfo
extension=gd
extension=intl
extension=mbstring
extension=openssl
extension=pdo_mysql
extension=mysqli
extension=zip
extension=sodium
extension=redis  ; Si instalas Redis
```

### 4.3 Configurar PHP para Laravel

En el mismo `php.ini`:

```ini
max_execution_time = 300
max_input_time = 300
memory_limit = 512M
post_max_size = 100M
upload_max_filesize = 100M

; Para development (cambiar en producción)
display_errors = On
error_reporting = E_ALL
```

### 4.4 Reiniciar IIS

```powershell
iisreset
```

---

## 🔧 Paso 5: Configurar Aplicación Laravel en IIS (20-30 min)

### 5.1 Clonar/Copiar Proyecto

Opción A: Desde GitHub
```cmd
cd C:\inetpub\wwwroot
git clone https://github.com/spartha1/Atinet_Compliance_Hub.git
cd Atinet_Compliance_Hub
```

Opción B: Copiar desde local
```cmd
Copiar carpeta completa del proyecto a:
C:\inetpub\wwwroot\Atinet_Compliance_Hub
```

### 5.2 Instalar Dependencias

```cmd
cd C:\inetpub\wwwroot\Atinet_Compliance_Hub

# Instalar dependencias PHP
composer install --optimize-autoloader --no-dev

# Instalar dependencias Node
npm install

# Build assets
npm run build
```

### 5.3 Configurar .env

Copiar archivo de ejemplo:
```cmd
copy .env.example .env
```

Editar `C:\inetpub\wwwroot\Atinet_Compliance_Hub\.env`:

```ini
APP_NAME="Atinet Compliance Hub"
APP_ENV=production
APP_KEY=
APP_DEBUG=false
APP_TIMEZONE=America/Mexico_City
APP_URL=http://tu-dominio-o-ip.com

LOG_CHANNEL=stack
LOG_LEVEL=error

# Base de Datos Master
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3307  # ⚠️ Puerto MySQL 8.0 (NO 3306 que es MySQL 5.0)
DB_DATABASE=atinet_compliance_hub
DB_USERNAME=atinet_app
DB_PASSWORD=TU_PASSWORD_AQUI

# Bases de datos legacy (OFAC, SAT, Aplicativos)
# ⚠️ NOTA: Si estas BDs están en MySQL 5.0 (puerto 3306),
# necesitarás configurar conexiones adicionales en config/database.php
DB_OFAC_DATABASE=atinet65_listasofac
DB_SAT_DATABASE=atinet65_listassat
DB_APLICATIVOS_DATABASE=atinet65_aplicativos

# Session (importante para Laravel en IIS)
SESSION_DRIVER=file
SESSION_LIFETIME=120

CACHE_STORE=file
QUEUE_CONNECTION=database

# Broadcast, Redis (configurar después si necesario)
BROADCAST_CONNECTION=log
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

### 5.4 Generar application key

```cmd
cd C:\inetpub\wwwroot\Atinet_Compliance_Hub
php artisan key:generate
```

### 5.5 Ejecutar migraciones

```cmd
php artisan migrate --force
```

### 5.6 Crear symlink para storage

```cmd
php artisan storage:link
```

### 5.7 Configurar permisos (MUY IMPORTANTE)

```powershell
# Dar permisos a IIS_IUSRS sobre carpetas críticas
icacls "C:\inetpub\wwwroot\Atinet_Compliance_Hub\storage" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\Atinet_Compliance_Hub\bootstrap\cache" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

---

## 🔧 Paso 6: Configurar IIS Site (15 min)

### 6.1 Crear nuevo Site en IIS

1. Abre **IIS Manager**

2. Clic derecho en **Sites** → **Add Website**

3. Configura:
   ```
   Site name: Atinet_Compliance_Hub
   Physical path: C:\inetpub\wwwroot\Atinet_Compliance_Hub\public
   Binding:
     - Type: http
     - IP address: All Unassigned (o tu IP específica)
     - Port: 80 (o 8080 si 80 está ocupado)
     - Host name: [vacío o tu dominio]
   ```

4. **MUY IMPORTANTE:** El path debe apuntar a la carpeta **`public`** no a la raíz.

### 6.2 Configurar URL Rewrite (Ya instalado ✅)

Crear/editar: `C:\inetpub\wwwroot\Atinet_Compliance_Hub\public\web.config`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <system.webServer>
        <rewrite>
            <rules>
                <rule name="Laravel" stopProcessing="true">
                    <match url="^" ignoreCase="false" />
                    <conditions logicalGrouping="MatchAll">
                        <add input="{REQUEST_FILENAME}" matchType="IsDirectory" negate="true" />
                        <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
                    </conditions>
                    <action type="Rewrite" url="index.php" appendQueryString="true" />
                </rule>
            </rules>
        </rewrite>
        <defaultDocument>
            <files>
                <clear />
                <add value="index.php" />
            </files>
        </defaultDocument>
    </system.webServer>
</configuration>
```

### 6.3 Configurar FastCGI Settings

Ya configurado ✅, pero verifica:

1. IIS Manager → **FastCGI Settings**
2. Doble clic en tu configuración PHP
3. Verifica:
   ```
   Full Path: C:\PHP\php-cgi.exe
   Arguments: [vacío]
   Max Instances: 4 (ajustar según CPU)
   Instance MaxRequests: 10000
   Request Timeout: 300
   Activity Timeout: 300
   ```

### 6.4 Configurar Application Pool

1. IIS Manager → **Application Pools**
2. Busca el pool de tu site (Atinet_Compliance_Hub)
3. Clic derecho → **Advanced Settings**
4. Configura:
   ```
   .NET CLR Version: No Managed Code
   Managed Pipeline Mode: Integrated
   Identity: ApplicationPoolIdentity
   Start Mode: AlwaysRunning (para mejor performance)
   Idle Time-out (minutes): 0 (no apagar)
   ```

---

## 🔧 Paso 7: Configurar Task Scheduler para Laravel (10 min)

Laravel usa cron jobs, en Windows usamos **Task Scheduler**.

### 7.1 Crear Tarea Programada

1. Abre **Task Scheduler** (Programador de tareas)

2. **Crear tarea básica:**
   - Nombre: `Laravel Scheduler - Atinet`
   - Descripción: `Ejecuta el scheduler de Laravel cada minuto`

3. **Desencadenador:**
   - Al iniciar el equipo: ✅
   - Repetir tarea cada: **1 minuto**
   - Durante: Indefinidamente

4. **Acción:**
   - Iniciar programa:
     ```
     Programa: C:\PHP\php.exe
     Argumentos: C:\inetpub\wwwroot\Atinet_Compliance_Hub\artisan schedule:run
     Directorio: C:\inetpub\wwwroot\Atinet_Compliance_Hub
     ```

5. **Configuración avanzada:**
   - ✅ Ejecutar con los privilegios más altos
   - ✅ Ejecutar independientemente de si el usuario inició sesión
   - Si la tarea ya se está ejecutando: No iniciar nueva instancia

### 7.2 Verificar que funciona

Espera 1-2 minutos y verifica logs:
```
C:\inetpub\wwwroot\Atinet_Compliance_Hub\storage\logs\laravel.log
```

Debería aparecer ejecución del scheduler.

---

## 🔧 Paso 8: Configurar Queue Worker (Opcional pero recomendado)

Para jobs pesados como el AggregateTenantsDataJob.

### Opción A: Como Windows Service (Recomendado)

Usa **NSSM** (Non-Sucking Service Manager):

1. Descarga NSSM: https://nssm.cc/download
2. Extrae a `C:\nssm`
3. Abre cmd como Administrador:

```cmd
cd C:\nssm\win64

# Instalar servicio
nssm install LaravelQueueWorker "C:\PHP\php.exe" "C:\inetpub\wwwroot\Atinet_Compliance_Hub\artisan queue:work --sleep=3 --tries=3 --max-time=3600"

# Configurar directorio de trabajo
nssm set LaravelQueueWorker AppDirectory "C:\inetpub\wwwroot\Atinet_Compliance_Hub"

# Configurar salida de logs
nssm set LaravelQueueWorker AppStdout "C:\inetpub\wwwroot\Atinet_Compliance_Hub\storage\logs\queue-worker.log"
nssm set LaravelQueueWorker AppStderr "C:\inetpub\wwwroot\Atinet_Compliance_Hub\storage\logs\queue-worker-error.log"

# Iniciar servicio
nssm start LaravelQueueWorker
```

### Opción B: Task Scheduler (Alternativa)

Similar al scheduler pero ejecuta:
```
php artisan queue:work --once
```
Cada 1 minuto.

---

## 🔧 Paso 9: Migrar Bases de Datos (1-2 horas)

### 9.1 Exportar BDs desde Hostgator

Desde cPanel de Hostgator:
1. phpMyAdmin → Exportar
2. Método rápido → SQL
3. Descarga cada BD:
   - `atinet_compliance_hub` (BD master)
   - `atinet65_listasofac` (OFAC)
   - `atinet65_listassat` (SAT)
   - `atinet65_aplicativos` (Legacy)
   - Todas las BDs tenant: `atinet_edomex_notaria_X`

### 9.2 Importar a MySQL Local

Opción A: MySQL Workbench
1. Abre MySQL Workbench
2. Connect a localhost
3. Data Import → Import from Self-Contained File
4. Selecciona archivo .sql
5. Default Target Schema: [nombre de BD]
6. Start Import

Opción B: Línea de comandos (más rápido)
```cmd
mysql -u atinet_app -p atinet_compliance_hub < C:\backups\atinet_compliance_hub.sql
mysql -u atinet_app -p atinet65_listasofac < C:\backups\ofac.sql
mysql -u atinet_app -p atinet65_listassat < C:\backups\sat.sql

REM Para cada BD tenant:
mysql -u atinet_app -p atinet_edomex_notaria_1 < C:\backups\notaria_1.sql
mysql -u atinet_app -p atinet_edomex_notaria_2 < C:\backups\notaria_2.sql
REM ... etc para las 21 notarías
```

### 9.3 Verificar Integridad

```cmd
cd C:\inetpub\wwwroot\Atinet_Compliance_Hub

# Test conexión BD
php artisan tinker

# En tinker:
DB::connection()->getPdo();
DB::table('notarias')->count();
exit
```

---

## 🔧 Paso 10: Configurar Backups Automáticos (30 min)

### 10.1 Script PowerShell de Backup

Crear: `C:\Scripts\backup-databases.ps1`

```powershell
# Backup de todas las BDs de Atinet
$backupRoot = "D:\_BACKUPS\AtineCompliance" # Ajusta a tu disco
$date = Get-Date -Format "yyyy-MM-dd"
$mysqlBin = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysqldump.exe"
$user = "atinet_app"
$password = "TU_PASSWORD"

# Crear carpeta del día
$backupPath = Join-Path $backupRoot $date
New-Item -ItemType Directory -Force -Path $backupPath | Out-Null

# Lista de BDs a respaldar
$databases = @(
    "atinet_compliance_hub",
    "atinet65_listasofac",
    "atinet65_listassat",
    "atinet65_aplicativos"
)

# Agregar BDs tenant dinámicamente
$tenantDbs = & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u $user -p$password -e "SHOW DATABASES LIKE 'atinet_%';" -s -N
$databases += $tenantDbs

# Backup de cada BD
foreach ($db in $databases) {
    $filename = Join-Path $backupPath "$db.sql"
    Write-Host "Backing up $db..."
    
    & $mysqlBin --user=$user --password=$password --single-transaction --routines --triggers $db > $filename
    
    # Comprimir
    Compress-Archive -Path $filename -DestinationPath "$filename.zip" -Force
    Remove-Item $filename
}

Write-Host "Backup completed: $backupPath"

# Limpiar backups antiguos (mantener últimos 30 días)
Get-ChildItem $backupRoot -Directory | Where-Object { $_.CreationTime -lt (Get-Date).AddDays(-30) } | Remove-Item -Recurse -Force
```

### 10.2 Programar Backup Diario

1. Task Scheduler → Crear tarea
2. Nombre: `MySQL Backup - Atinet`
3. Desencadenador: Diariamente a las 2:00 AM
4. Acción:
   ```
   Programa: powershell.exe
   Argumentos: -ExecutionPolicy Bypass -File "C:\Scripts\backup-databases.ps1"
   ```

---

## ✅ Paso 11: Testing Final

### 11.1 Test del Sitio

1. Abre navegador:
   ```
   http://localhost
   o
   http://TU_IP_LOCAL
   ```

2. Deberías ver la página de login de Atinet Compliance Hub

3. Intenta login con usuario super_admin

### 11.2 Test de Creación de Notaría

Como super_admin:
1. Crear nueva notaría de prueba
2. Verificar que se crea BD tenant automáticamente:
   ```sql
   mysql -u atinet_app -p
   SHOW DATABASES;
   ```

3. Debería aparecer nueva BD: `atinet_{estado}_notaria_{numero}`

### 11.3 Test de Scheduler

Verificar logs:
```
C:\inetpub\wwwroot\Atinet_Compliance_Hub\storage\logs\laravel.log
```

Buscar líneas de scheduler ejecutándose cada minuto.

### 11.4 Test de Queue Worker

```cmd
php artisan tinker

# Despachar job de prueba
dispatch(function() {
    \Log::info('Test job executed!');
});

exit
```

Verificar que se ejecutó en queue-worker.log.

---

## 🔒 Paso 12: Seguridad y Producción

### 12.1 Configurar Firewall Windows

1. Windows Defender Firewall → Reglas de entrada
2. Nueva regla:
   ```
   Tipo: Puerto
   Puerto: 80, 443 (cuando tengas SSL)
   Acción: Permitir conexión
   Perfiles: Todos
   Nombre: Laravel Atinet HTTP
   ```

### 12.2 SSL/HTTPS (Opcional pero recomendado)

Opciones:
- **Certificado Let's Encrypt gratis** con win-acme
- **Certificado auto-firmado** para intranet
- **Certificado comercial** si es público

### 12.3 Hardening Básico

1. Deshabilitar `display_errors` en `php.ini`:
   ```ini
   display_errors = Off
   log_errors = On
   error_log = C:\logs\php_errors.log
   ```

2. Configurar `.env`:
   ```
   APP_DEBUG=false
   APP_ENV=production
   ```

3. Optimizar aplicación:
   ```cmd
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```

---

## 📊 Monitoreo y Mantenimiento

### Logs Importantes

```
Laravel:
C:\inetpub\wwwroot\Atinet_Compliance_Hub\storage\logs\laravel.log

IIS:
C:\inetpub\logs\LogFiles\

MySQL:
C:\ProgramData\MySQL\MySQL Server 8.0\Data\*.err

PHP:
C:\logs\php_errors.log
```

### Scripts de Mantenimiento

Crear: `C:\Scripts\maintenance.ps1`

```powershell
# Limpiar logs antiguos
$logPath = "C:\inetpub\wwwroot\Atinet_Compliance_Hub\storage\logs"
Get-ChildItem $logPath -Filter "*.log" | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item

# Limpiar cache viejo
php C:\inetpub\wwwroot\Atinet_Compliance_Hub\artisan cache:clear
php C:\inetpub\wwwroot\Atinet_Compliance_Hub\artisan view:clear

Write-Host "Maintenance completed"
```

---

## 🎯 Checklist Final de Deployment

```
Hardware:
✅ Servidor Windows Server 2019 i7-4770 12GB RAM

Software Base:
✅ IIS instalado y configurado
✅ PHP 8.2+ con extensiones
✅ MySQL 8.0 instalado
✅ Composer instalado
✅ Node.js + NPM instalado

Aplicación Laravel:
✅ Código clonado a C:\inetpub\wwwroot
✅ Dependencias instaladas (composer + npm)
✅ .env configurado
✅ Migraciones ejecutadas
✅ Permisos de storage configurados

IIS:
✅ Site creado apuntando a /public
✅ web.config con URL Rewrite
✅ FastCGI configurado
✅ Application Pool configurado

Automatización:
✅ Task Scheduler para Laravel Scheduler
✅ Queue Worker como servicio (NSSM)
✅ Backup automático configurado

Bases de Datos:
✅ BD Master importada
✅ BDs OFAC, SAT, Aplicativos importadas
✅ 21 BDs tenant importadas

Testing:
✅ Sitio accesible en navegador
✅ Login funciona
✅ Creación de notaría funciona
✅ Scheduler ejecutándose
✅ Queues procesándose

Seguridad:
✅ Firewall configurado
✅ SSL configurado (opcional)
✅ display_errors = Off
✅ APP_DEBUG = false
```

---

## 📞 Troubleshooting Común

### Error: "500 Internal Server Error"

**Solución:**
1. Verificar permisos storage/
2. Verificar php.ini extensiones habilitadas
3. Check logs: `storage/logs/laravel.log`

### Error: "SQLSTATE[HY000] [2002] No connection could be made"

**Solución:**
1. Verificar MySQL corriendo: `Get-Service MySQL80`
2. Verificar credenciales en `.env`
3. Test conexión: `mysql -u atinet_app -p`

### Error: Scheduler no ejecuta

**Solución:**
1. Task Scheduler → Historial
2. Verificar que la tarea corre cada minuto
3. Verificar logs y rutas en acción de tarea

### Error: Queue no procesa jobs

**Solución:**
1. Verificar servicio: `nssm status LaravelQueueWorker`
2. Restart: `nssm restart LaravelQueueWorker`
3. Check logs: `storage/logs/queue-worker.log`

---

## 🚀 Próximo Paso: Implementar Opción 1

Una vez el servidor esté operativo, implementar:

**Dashboard SuperAdmin con Barrido de BDs**
- Job: `AggregateTenantsDataJob`
- Controller: `SuperAdminDashboardController`
- Vista React: `SuperAdminDashboard.tsx`

Tiempo estimado: 6-8 horas adicionales

---

**Preparado por:** GitHub Copilot  
**Para:** Servidor Atinet Windows Server 2019  
**Fecha:** 25 de Febrero, 2026

