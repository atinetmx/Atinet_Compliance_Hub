# Guía de Despliegue — Atinet Compliance Hub

Este documento debe seguirse en **cada versión** que se suba a producción.
El flujo es: desarrollar en local → commit → push → desplegar en cPanel.

---

## Bases de datos en producción

| Conexión Laravel | BD cPanel           | Propósito                              |
|-----------------|---------------------|----------------------------------------|
| `mysql` (main)  | `atinet65_compliance` | BD principal del sistema nuevo        |
| `ofac`          | `atinet65_listasofac` | Lista de sanciones OFAC (EE.UU.)      |
| `sat`           | `atinet65_listassat`  | Lista SAT 69-B (México)               |
| `aplicativos`   | `atinet65_aplicativos`| Usuarios/notarías del sistema legacy  |

**Usuario unificado:** `atinet65_hub` con ALL PRIVILEGES en las 4 BDs.

---

## Primera vez (configuración inicial del servidor)

### 1. cPanel → MySQL → Crear base de datos

Crear: `atinet65_compliance`

### 2. cPanel → MySQL → Crear usuario

- Usuario: `atinet65_hub`
- Contraseña: *(contraseña segura, anótala para el .env)*

### 3. cPanel → MySQL → Asignar usuario a bases de datos

Asignar `atinet65_hub` con **ALL PRIVILEGES** a:
- `atinet65_compliance`
- `atinet65_listasofac`
- `atinet65_listassat`
- `atinet65_aplicativos`

### 4. cPanel → Git™ Version Control → Clonar repositorio

- **Clone URL:** `https://github.com/spartha1/Atinet_Compliance_Hub.git`
- **Repository Path:** `/home/atinet65/compliance_hub`

### 5. cPanel → MultiPHP Manager

Asignar **PHP 8.2** al subdominio/dominio del sistema.

### 6. cPanel → Dominios → Subdominio

Crear subdominio (ej. `hub.atinet.com.mx`) con document root:
`/home/atinet65/compliance_hub/public`

### 7. SSH → Configuración inicial

```bash
cd ~/compliance_hub

# Instalar dependencias PHP (sin paquetes de desarrollo)
composer install --no-dev --optimize-autoloader

# Copiar y editar el archivo de entorno
cp .env.example .env
nano .env
```

**Valores del `.env` de producción:**

```env
APP_NAME="Atinet Compliance Hub"
APP_ENV=production
APP_KEY=          # Se genera en el paso siguiente
APP_DEBUG=false
APP_URL=https://hub.atinet.com.mx

# Base de datos principal
DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=atinet65_compliance
DB_USERNAME=atinet65_hub
DB_PASSWORD=TU_PASSWORD_SEGURO

# OFAC y SAT usan el mismo DB_HOST/DB_USERNAME/DB_PASSWORD
# Solo necesitan el nombre de la BD (ya configurado en config/database.php)
DB_OFAC_DATABASE=atinet65_listasofac
DB_SAT_DATABASE=atinet65_listassat

# Aplicativos (sistema legacy, mismo usuario unificado)
DB_APLICATIVOS_DATABASE=atinet65_aplicativos

# Mail (configurar con el SMTP de Atinet)
MAIL_MAILER=smtp
MAIL_HOST=mail.atinet.com.mx
MAIL_PORT=465
MAIL_USERNAME=noreply@atinet.com.mx
MAIL_PASSWORD=TU_PASSWORD_CORREO
MAIL_ENCRYPTION=ssl
MAIL_FROM_ADDRESS=noreply@atinet.com.mx
MAIL_FROM_NAME="Atinet Compliance Hub"

# Sesiones y caché
SESSION_DRIVER=database
CACHE_STORE=file
QUEUE_CONNECTION=database
```

```bash
# Generar clave de aplicación
php artisan key:generate

# Ejecutar migraciones
php artisan migrate --force

# Ejecutar seeders (solo primera vez)
php artisan db:seed --force

# Optimizar para producción
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 8. Subir assets compilados (FTP o SCP)

En tu máquina local, ejecutar:
```bash
npm run build
```

Luego subir la carpeta `public/build/` al servidor en la misma ruta
`~/compliance_hub/public/build/` via **FTP** o el **Administrador de archivos** de cPanel.

> **Nota:** El servidor compartido no tiene Node.js, por eso los assets
> se compilan localmente y se suben compilados.

---

## Actualizaciones (cada nueva versión)

Seguir estos pasos en orden en cada deploy:

### Paso 1 — Local: compilar y hacer push

```bash
# Asegurarse de que todo pasa
php artisan test --compact

# Compilar assets
npm run build

# Commit y push (incluye public/build si está en .gitignore, subirlo por FTP)
git add .
git commit -m "vX.X.X: descripción de cambios"
git push origin master
```

### Paso 2 — Servidor SSH: actualizar código

```bash
cd ~/compliance_hub

# Modo mantenimiento ON (los usuarios verán una página de mantenimiento)
php artisan down

# Bajar cambios del repositorio
git pull origin master

# Actualizar dependencias PHP (si hubo cambios en composer.json)
composer install --no-dev --optimize-autoloader

# Ejecutar migraciones nuevas
php artisan migrate --force

# Limpiar y re-generar cachés
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Modo mantenimiento OFF
php artisan up
```

### Paso 3 — FTP: subir assets (si hubo cambios de frontend)

Si se modificaron archivos en `resources/js/` o `resources/css/`:
1. Correr `npm run build` en local
2. Subir `public/build/` al servidor via FTP

> **Tip:** Si no hubieron cambios de frontend en esta versión, omitir el Paso 3.

---

## Checklist rápido por versión

```
[ ] php artisan test --compact  →  todos pasan
[ ] npm run build               →  sin errores
[ ] git push origin master
[ ] SSH: php artisan down
[ ] SSH: git pull
[ ] SSH: composer install --no-dev --optimize-autoloader  (si aplica)
[ ] SSH: php artisan migrate --force
[ ] SSH: php artisan config:cache && route:cache && view:cache
[ ] SSH: php artisan up
[ ] FTP: subir public/build/  (si hubo cambios de frontend)
[ ] Verificar en https://hub.atinet.com.mx que todo funciona
```

---

## Troubleshooting común

### Error 500 al subir
```bash
# Ver el error exacto
tail -50 ~/compliance_hub/storage/logs/laravel.log

# Permisos de storage
chmod -R 775 ~/compliance_hub/storage
chmod -R 775 ~/compliance_hub/bootstrap/cache
```

### Las migraciones fallan
```bash
# Ver estado de migraciones
php artisan migrate:status

# Si hay conflicto, revisar primero
php artisan migrate --pretend
```

### Los assets no cargan (CSS/JS)
- Verificar que `public/build/` fue subido correctamente
- Limpiar caché del navegador
- Revisar que `APP_URL` en `.env` coincide con el dominio exacto

### Sesiones o caché con datos viejos
```bash
php artisan cache:clear
php artisan session:flush  # Solo si es urgente, cierra todas las sesiones activas
```

---

## Variables de entorno — Diferencias local vs producción

| Variable | Local | Producción |
|---|---|---|
| `APP_ENV` | `local` | `production` |
| `APP_DEBUG` | `true` | `false` |
| `APP_URL` | `http://localhost` | `https://hub.atinet.com.mx` |
| `DB_HOST` | `127.0.0.1` | `localhost` |
| `DB_DATABASE` | `Atinet_Compliance_Hub` | `atinet65_compliance` |
| `DB_USERNAME` | `root` | `atinet65_hub` |
| `DB_PASSWORD` | *(vacío)* | *(contraseña segura)* |
| `MAIL_MAILER` | `log` | `smtp` |
| `QUEUE_CONNECTION` | `database` | `database` |
