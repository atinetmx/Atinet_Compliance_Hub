# 🚀 Workflow de Deployment - Atinet Compliance Hub

**Última actualización:** 3 de Marzo de 2026

---

## 📋 Resumen del Workflow

```
[PC Local] --push--> [GitHub] --pull--> [Servidor Windows]
   ↓                    ↓                      ↓
Desarrollo          Repositorio            Producción
VSCode              Git Remote             IIS + MySQL 8.0
```

---

## 🛠️ Configuración Inicial del Servidor

### 1. Instalar Git en el Servidor

```powershell
# Descargar Git para Windows desde:
# https://git-scm.com/download/win

# O usar winget (si está disponible)
winget install --id Git.Git -e --source winget

# Verificar instalación
git --version
```

### 2. Instalar Visual Studio Code en el Servidor

```powershell
# Descargar VSCode desde:
# https://code.visualstudio.com/download

# O usar winget
winget install -e --id Microsoft.VisualStudioCode

# Verificar instalación
code --version
```

### 3. Configurar Git en el Servidor

```powershell
# Configurar identidad
git config --global user.name "Atinet Server"
git config --global user.email "server@atinet.com.mx"

# Configurar CRLF para Windows
git config --global core.autocrlf true

# Opcional: Guardar credenciales de GitHub
git config --global credential.helper manager-core
```

### 4. Clonar Repositorio en el Servidor (Primera vez)

```powershell
# Navegar al directorio de IIS
cd C:\inetpub\wwwroot

# Si ya existe Atinet_Compliance_Hub, hacer backup
Rename-Item -Path "Atinet_Compliance_Hub" -NewName "Atinet_Compliance_Hub_backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

# Clonar repositorio
git clone https://github.com/spartha1/Atinet_Compliance_Hub.git

# Entrar al directorio
cd Atinet_Compliance_Hub
```

### 5. Configurar .env en Servidor

```powershell
# Copiar .env.example a .env
copy .env.example .env

# Editar .env con VSCode
code .env
```

**Cambios requeridos para PRODUCCIÓN en .env:**

```ini
APP_ENV=production
APP_DEBUG=false
APP_URL=http://192.168.1.1:8080

DB_PORT=3307
DB_USERNAME=atinet_app
DB_PASSWORD="Atinet2026#Secure"

CACHE_STORE=file
```

Guarda el archivo (`Ctrl+S`) y cierra VSCode.

### 6. Instalar Dependencias

```powershell
# Instalar dependencias PHP (sin dev)
composer install --no-dev --optimize-autoloader

# Instalar dependencias Node
npm install --legacy-peer-deps

# Compilar assets
npm run build

# Optimizar Laravel
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 🔄 Workflow Diario de Desarrollo

### En tu PC Local (Desarrollo)

#### 1. Actualizar repositorio local
```powershell
# Asegúrate de estar en la rama master
git checkout master

# Obtener últimos cambios
git pull origin master
```

#### 2. Hacer cambios y probar localmente
```powershell
# Editar archivos en VSCode
code .

# Probar en local
php artisan serve
# O usar XAMPP: http://localhost/Atinet_Compliance_Hub
```

#### 3. Commit y push
```powershell
# Ver archivos modificados
git status

# Agregar cambios
git add .

# Commit con mensaje descriptivo
git commit -m "feat: agregar funcionalidad X"

# Push a GitHub
git push origin master
```

---

### En el Servidor (Producción)

#### Opción A: Actualización Manual

```powershell
# Conectarse al servidor (RDP o AnyDesk)
# Abrir PowerShell como Administrador

# Navegar al proyecto
cd C:\inetpub\wwwroot\Atinet_Compliance_Hub

# Obtener cambios de GitHub
git pull origin master

# Si hay cambios en composer.json
composer install --no-dev --optimize-autoloader

# Si hay cambios en package.json
npm install --legacy-peer-deps

# Si hay cambios en assets (JS/CSS)
npm run build

# Si hay nuevas migraciones
php artisan migrate --force

# Limpiar cachés
php artisan config:clear
php artisan route:clear
php artisan view:clear

# Recompilar cachés
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Reiniciar sitio IIS
Restart-Website -Name "Atinet_Laravel"
```

#### Opción B: Script de Deployment Automatizado

Crea un archivo `deploy.ps1` en el servidor:

```powershell
# C:\inetpub\wwwroot\Atinet_Compliance_Hub\deploy.ps1

$ErrorActionPreference = "Stop"

Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "  DEPLOYMENT - Atinet Compliance Hub" -ForegroundColor Cyan
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host ""

# Navegar al proyecto
Set-Location "C:\inetpub\wwwroot\Atinet_Compliance_Hub"

Write-Host "[1/8] Obteniendo cambios de GitHub..." -ForegroundColor Yellow
git pull origin master

Write-Host "[2/8] Verificando dependencias PHP..." -ForegroundColor Yellow
composer install --no-dev --optimize-autoloader --no-interaction

Write-Host "[3/8] Verificando dependencias Node..." -ForegroundColor Yellow
npm install --legacy-peer-deps

Write-Host "[4/8] Compilando assets..." -ForegroundColor Yellow
npm run build

Write-Host "[5/8] Ejecutando migraciones..." -ForegroundColor Yellow
php artisan migrate --force

Write-Host "[6/8] Limpiando cachés..." -ForegroundColor Yellow
php artisan config:clear
php artisan route:clear
php artisan view:clear

Write-Host "[7/8] Recompilando cachés..." -ForegroundColor Yellow
php artisan config:cache
php artisan route:cache
php artisan view:cache

Write-Host "[8/8] Reiniciando sitio IIS..." -ForegroundColor Yellow
Restart-Website -Name "Atinet_Laravel"

Write-Host ""
Write-Host "✅ Deployment completado exitosamente!" -ForegroundColor Green
Write-Host "📍 Sitio: http://192.168.1.1:8080" -ForegroundColor Cyan
```

**Uso del script:**
```powershell
# Ejecutar desde PowerShell como Administrador
cd C:\inetpub\wwwroot\Atinet_Compliance_Hub
.\deploy.ps1
```

---

## 📝 Convenciones de Commits

Usa mensajes descriptivos siguiendo convenciones:

```bash
# Nuevas características
git commit -m "feat: agregar búsqueda de OFAC"

# Corrección de bugs
git commit -m "fix: corregir validación de RFC"

# Refactorización
git commit -m "refactor: optimizar consulta de notarías"

# Documentación
git commit -m "docs: actualizar README con instrucciones"

# Estilos (no afecta lógica)
git commit -m "style: formatear código según PSR-12"

# Tests
git commit -m "test: agregar tests para búsqueda SAT"

# Configuración
git commit -m "chore: actualizar dependencias"
```

---

## 🔧 Mantenimiento del Servidor

### Ver Logs de Git

```powershell
# Ver últimos commits
git log --oneline -10

# Ver cambios del último pull
git log HEAD@{1}..HEAD --oneline

# Ver archivos modificados
git diff --name-only HEAD@{1} HEAD
```

### Ver Estado del Repositorio

```powershell
# Estado actual
git status

# Branch actual
git branch

# Remoto configurado
git remote -v
```

### Resolver Conflictos

Si hay conflictos durante `git pull`:

```powershell
# Opción 1: Descartar cambios locales y usar GitHub
git reset --hard origin/master

# Opción 2: Guardar cambios locales temporalmente
git stash
git pull origin master
git stash pop

# Opción 3: Crear backup y forzar pull
git branch backup-$(Get-Date -Format 'yyyyMMdd-HHmmss')
git reset --hard origin/master
```

---

## 🚨 Rollback en Caso de Error

Si el deployment causa problemas:

```powershell
# Ver últimos commits
git log --oneline -5

# Volver al commit anterior
git reset --hard HEAD~1

# O volver a un commit específico
git reset --hard abc1234

# Recompilar
npm run build
php artisan config:cache
php artisan route:cache

# Reiniciar IIS
Restart-Website -Name "Atinet_Laravel"
```

---

## 📊 Checklist de Deployment

Antes de hacer push desde tu PC:

- [ ] Código probado localmente
- [ ] Tests ejecutados (`php artisan test`)
- [ ] Sin errores de sintaxis
- [ ] .env.example actualizado si agregaste variables
- [ ] Migraciones probadas
- [ ] Assets compilados sin errores
- [ ] Commit con mensaje descriptivo

Después de pull en servidor:

- [ ] `git pull` ejecutado sin conflictos
- [ ] Dependencias instaladas
- [ ] Assets compilados
- [ ] Migraciones ejecutadas
- [ ] Cachés limpiados y recompilados
- [ ] Sitio IIS reiniciado
- [ ] Probar acceso: http://192.168.1.1:8080
- [ ] Login funcional
- [ ] Funcionalidad principal probada

---

## 🔐 Seguridad

### Archivos que NO deben estar en Git

Ya están en `.gitignore`:
- `.env` (credenciales de producción)
- `vendor/` (dependencias PHP)
- `node_modules/` (dependencias Node)
- `storage/` (logs, cache)
- `bootstrap/cache/*.php` (cachés de Laravel)

### Proteger Credenciales

**NUNCA** hagas commit del archivo `.env` de producción.

Si accidentalmente hiciste commit de credenciales:

```powershell
# Remover archivo del historial
git rm --cached .env
git commit -m "chore: remover .env del repositorio"
git push origin master

# IMPORTANTE: Cambiar todas las credenciales comprometidas
```

---

## 📞 Soporte y Troubleshooting

### Error: "git pull" no funciona

```powershell
# Verificar conexión a GitHub
git remote -v

# Verificar internet
Test-Connection github.com

# Verificar credenciales
git config --global --list
```

### Error: "npm run build" falla

```powershell
# Limpiar caché de npm
npm cache clean --force

# Reinstalar dependencias
Remove-Item node_modules -Recurse -Force
npm install --legacy-peer-deps
```

### Error: Sitio IIS no refleja cambios

```powershell
# Limpiar TODO
php artisan optimize:clear

# Recompilar
npm run build
php artisan optimize

# Reiniciar IIS completamente
iisreset /restart
```

### Error: Permisos en storage/

```powershell
# Dar permisos completos a IIS
icacls "C:\inetpub\wwwroot\Atinet_Compliance_Hub\storage" /grant "IIS_IUSRS:(OI)(CI)F" /T
icacls "C:\inetpub\wwwroot\Atinet_Compliance_Hub\bootstrap\cache" /grant "IIS_IUSRS:(OI)(CI)F" /T
```

---

## 📚 Recursos Adicionales

- **Git Documentation**: https://git-scm.com/doc
- **GitHub Desktop** (alternativa GUI): https://desktop.github.com/
- **Laravel Deployment**: https://laravel.com/docs/12.x/deployment
- **IIS + Laravel**: https://laravel.com/docs/12.x/deployment#server-requirements

---

**Fin del Documento**

*Para preguntas o soporte: contactar al equipo de desarrollo*
