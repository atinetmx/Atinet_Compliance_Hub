# ✅ Checklist de Actualización del Servidor

**Fecha:** 15 de Abril, 2026  
**Proyecto:** Atinet Compliance Hub  
**Cambios:** 16 migraciones + Control Notarial

---

## 📋 PRE-ACTUALIZACIÓN (ANTES de ir al servidor)

### Local - Tu PC

- [ ] **Verificar git status limpio**
  ```bash
  git status
  # Debe decir: "nothing to commit, working tree clean"
  ```

- [ ] **Confirmar push completado**
  ```bash
  git log --oneline -5
  # Verificar que dice: (HEAD -> master, origin/master)
  ```

- [ ] **Probar build local**
  ```bash
  npm run build
  # Debe completar sin errores
  ```

- [ ] **Listar migraciones**
  ```bash
  Get-ChildItem database\migrations\*.php | Measure-Object
  # Debe mostrar: Count = 48
  ```

- [ ] **Copiar script al servidor**
  ```bash
  # Opción 1: SCP
  scp SCRIPT_ACTUALIZACION_SERVIDOR.sh usuario@servidor:/tmp/
  
  # Opción 2: Copiar y pegar contenido manualmente
  ```

---

## 🚀 EN EL SERVIDOR

### Paso 1: Preparación

- [ ] **SSH al servidor**
  ```bash
  ssh usuario@srvatinet.atinet.com.mx
  ```

- [ ] **Verificar usuario tiene permisos sudo**
  ```bash
  sudo whoami
  # Debe mostrar: root
  ```

- [ ] **Navegar al directorio del proyecto**
  ```bash
  cd /var/www/Atinet_Compliance_Hub  # AJUSTAR ruta
  pwd
  ```

- [ ] **Verificar rama actual**
  ```bash
  git branch --show-current
  # Debe mostrar: master
  ```

- [ ] **Contar migraciones actuales**
  ```bash
  ls -1 database/migrations/*.php | wc -l
  # Debe mostrar: 36 (o similar)
  ```

---

### Paso 2: Ejecutar Script

- [ ] **Copiar script a directorio del proyecto**
  ```bash
  cp /tmp/SCRIPT_ACTUALIZACION_SERVIDOR.sh .
  chmod +x SCRIPT_ACTUALIZACION_SERVIDOR.sh
  ```

- [ ] **Revisar y ajustar variables del script**
  ```bash
  nano SCRIPT_ACTUALIZACION_SERVIDOR.sh
  
  # Verificar/ajustar:
  PROJECT_DIR="/var/www/Atinet_Compliance_Hub"
  DB_NAME="Atinet_Compliance_Hub"
  DB_USER="root"  # o tu usuario MySQL
  ```

- [ ] **Ejecutar script**
  ```bash
  ./SCRIPT_ACTUALIZACION_SERVIDOR.sh
  ```

- [ ] **Seguir prompts del script**
  - Ingresar contraseña MySQL cuando la pida
  - Confirmar git pull (s)
  - Confirmar ejecutar migraciones (s)
  - Confirmar ejecutar seeders (s)

---

### Paso 3: Verificación Manual .env

- [ ] **Abrir .env**
  ```bash
  nano .env
  ```

- [ ] **Verificar/agregar variable Control Notarial**
  ```env
  # Buscar o agregar al final:
  
  # API CONTROL NOTARIAL (C# - Sistema Legacy)
  CONTROL_NOTARIAL_API_URL=https://srvatinet.atinet.com.mx:7443/api
  
  # Futuras (comentadas por ahora):
  # CONTROL_NOTARIAL_SERVER_USER=LARAVEL_SERVER
  # CONTROL_NOTARIAL_SERVER_PASSWORD=...
  # CONTROL_NOTARIAL_TOKEN_CACHE=3600
  ```

- [ ] **Guardar y cerrar** (Ctrl+O, Enter, Ctrl+X)

- [ ] **Verificar otras variables críticas**
  ```bash
  grep -E "(APP_ENV|APP_DEBUG|DB_DATABASE)" .env
  
  # Debe mostrar:
  APP_ENV=production
  APP_DEBUG=false
  DB_DATABASE=Atinet_Compliance_Hub
  ```

---

### Paso 4: Verificaciones Post-Script

- [ ] **Verificar migraciones actualizadas**
  ```bash
  ls -1 database/migrations/*.php | wc -l
  # Debe mostrar: 48 (igual que tu local)
  ```

- [ ] **Verificar seeders existen**
  ```bash
  ls -la database/seeders/Catalogos*.php
  # Debe listar:
  # CatalogosGeografiaSeeder.php
  # CatalogosNegocioSeeder.php
  ```

- [ ] **Verificar config actualizada**
  ```bash
  grep -A 5 "control_notarial" config/services.php
  # Debe mostrar el bloque de configuración
  ```

- [ ] **Verificar archivos frontend compilados**
  ```bash
  ls -lh public/build/manifest.json
  # Debe existir y ser reciente (fecha de hoy)
  ```

- [ ] **Verificar permisos**
  ```bash
  ls -ld storage bootstrap/cache
  # Debe mostrar: drwxrwxr-x ... www-data www-data
  ```

---

## 🧪 TESTING POST-ACTUALIZACIÓN

### En el Navegador

- [ ] **Abrir URL principal**
  ```
  https://srvatinet.atinet.com.mx
  o
  http://tudominio.com
  ```

- [ ] **Login Laravel (Fortify)**
  - [ ] Página de login carga correctamente
  - [ ] Ingresar credenciales de usuario existente
  - [ ] Login exitoso
  - [ ] Dashboard principal carga

- [ ] **Verificar servicios básicos**
  - [ ] Búsquedas OFAC funciona
  - [ ] Búsquedas SAT funciona
  - [ ] Suscripciones carga

- [ ] **Control Notarial - Primera Prueba**
  - [ ] Ir a /admin/control-notarial
  - [ ] Página debe cargar (puede estar vacía)
  - [ ] **LoginModal debe aparecer** ← CRÍTICO
  - [ ] LoginModal tiene campos: usuario, contraseña

- [ ] **Control Notarial - Autenticación**
  - [ ] Ingresar credenciales de API C# (usuario/contraseña)
  - [ ] Click en "Iniciar Sesión"
  - [ ] **Modal debe cerrarse** (autenticación exitosa)
  - [ ] Datos deben cargar (expedientes, clientes, etc.)

- [ ] **Control Notarial - Funcionalidad**
  - [ ] Expedientes → Lista carga
  - [ ] Alta Expedientes → Formulario funciona
  - [ ] Presupuesto Previo → Carga correctamente
  - [ ] Configuración → Notaria, Clientes, etc.

---

### En la Consola del Navegador (F12)

- [ ] **No hay errores JavaScript críticos**
  ```
  F12 → Console
  Buscar líneas rojas (errors)
  Ignorar warnings (amarillo)
  ```

- [ ] **No hay errores 404 de assets**
  ```
  F12 → Network
  Recargar página
  Verificar que todos los archivos .js, .css cargan (200 OK)
  ```

- [ ] **API calls funcionan**
  ```
  F12 → Network → XHR/Fetch
  Después de login en Control Notarial:
  - Debe haber llamadas a srvatinet.atinet.com.mx:7443
  - Deben retornar 200 OK
  - Deben tener Authorization: Bearer {token}
  ```

---

### En el Servidor - Logs

- [ ] **Verificar Laravel logs**
  ```bash
  tail -f storage/logs/laravel.log
  # No debe haber errores críticos
  ```

- [ ] **Verificar Nginx/Apache logs**
  ```bash
  # Nginx:
  tail -f /var/log/nginx/error.log
  
  # Apache:
  tail -f /var/log/apache2/error.log
  ```

- [ ] **Verificar PHP-FPM logs**
  ```bash
  tail -f /var/log/php8.2-fpm.log
  ```

---

### Base de Datos

- [ ] **Verificar nuevas tablas existen**
  ```bash
  mysql -u root -p Atinet_Compliance_Hub
  
  SHOW TABLES LIKE 'cat_%';
  # Debe mostrar:
  # cat_estado_civil
  # cat_regimen_conyugal
  # cat_tipos_cliente
  
  SHOW TABLES LIKE '%geo%';
  # Debe mostrar:
  # estados
  # municipios
  # ciudades
  # colonias
  ```

- [ ] **Verificar datos cargados (SEPOMEX)**
  ```sql
  SELECT COUNT(*) FROM estados;       -- Debe: 32
  SELECT COUNT(*) FROM municipios;    -- Debe: ~2,500
  SELECT COUNT(*) FROM ciudades;      -- Debe: ~10,000
  SELECT COUNT(*) FROM colonias;      -- Debe: ~60,000
  ```

- [ ] **Verificar catálogos de negocio**
  ```sql
  SELECT * FROM cat_tipos_cliente;    -- Debe: 13 registros
  SELECT * FROM cat_estado_civil;     -- Debe: 6 registros
  SELECT * FROM cat_regimen_conyugal; -- Debe: 6 registros
  ```

- [ ] **Verificar migraciones ejecutadas**
  ```sql
  SELECT COUNT(*) FROM migrations;
  -- Debe estar cerca de 48 (algunas migraciones pueden ser batcheadas)
  
  SELECT migration FROM migrations ORDER BY id DESC LIMIT 10;
  -- Últimas 10 migraciones deben incluir las del 15 de abril
  ```

---

## ⚠️ TROUBLESHOOTING

### Problema 1: Error en Migración

**Síntoma:** `SQLSTATE[42S01]: Base table or view already exists`

**Solución:**
```bash
# Ver qué migración falló
php artisan migrate:status

# Rollback última migración
php artisan migrate:rollback --step=1

# O restaurar backup
mysql -u root -p Atinet_Compliance_Hub < /var/backups/atinet/db_backup_YYYYMMDD.sql
```

---

### Problema 2: Control Notarial 500 Error

**Síntoma:** Página de Control Notarial da error 500

**Verificar:**
```bash
# 1. Variable .env existe
grep CONTROL_NOTARIAL_API_URL .env

# 2. Config está cacheada
php artisan config:clear
php artisan config:cache

# 3. Ver error específico
tail -100 storage/logs/laravel.log
```

---

### Problema 3: LoginModal No Aparece

**Síntoma:** Página de Control Notarial carga pero no hay modal de login

**Verificar:**
```bash
# 1. Frontend compiló correctamente
ls -lh public/build/manifest.json
cat public/build/manifest.json | grep -i login

# 2. Recompilar frontend
npm run build

# 3. Limpiar cache del navegador
# F12 → Application → Clear storage
```

---

### Problema 4: JWT Authentication Falla

**Síntoma:** LoginModal aparece pero login falla

**Verificar:**
```bash
# 1. API C# está accesible desde servidor
curl -k https://srvatinet.atinet.com.mx:7443/api/Login/Authentication

# 2. Ver error específico en Network (F12)
# Authorization, CORS, SSL certificate issues

# 3. Verificar credenciales son correctas
```

---

### Problema 5: Assets No Cargan (404)

**Síntoma:** Estilos rotos, JavaScript no funciona

**Verificar:**
```bash
# 1. APP_URL correcto en .env
grep APP_URL .env
# Debe coincidir con tu dominio

# 2. Manifest existe
ls public/build/manifest.json

# 3. Permisos correctos
chmod -R 755 public/build
```

---

## 🔄 ROLLBACK (Si todo falla)

### Opción 1: Rollback Solo Base de Datos

```bash
mysql -u root -p Atinet_Compliance_Hub < /var/backups/atinet/db_backup_YYYYMMDD.sql
```

### Opción 2: Rollback Completo (BD + Código)

```bash
# 1. Restaurar código
cd /var/www
rm -rf Atinet_Compliance_Hub/*
tar -xzf /var/backups/atinet/code_backup_YYYYMMDD.tar.gz -C Atinet_Compliance_Hub/

# 2. Restaurar BD
mysql -u root -p Atinet_Compliance_Hub < /var/backups/atinet/db_backup_YYYYMMDD.sql

# 3. Restaurar .env
cp /var/backups/atinet/.env_backup_YYYYMMDD Atinet_Compliance_Hub/.env

# 4. Limpiar cache
cd Atinet_Compliance_Hub
php artisan optimize:clear

# 5. Reiniciar servicios
sudo systemctl restart php8.2-fpm nginx
```

---

## ✅ CHECKLIST FINAL

### ✅ Actualización Completada

- [ ] Script ejecutado sin errores
- [ ] Migraciones: 48 archivos en disco
- [ ] Seeders ejecutados (73,161 registros)
- [ ] .env actualizado con CONTROL_NOTARIAL_API_URL
- [ ] Frontend compilado exitosamente
- [ ] Cachés limpiados y regenerados
- [ ] Servicios reiniciados

### ✅ Testing Completado

- [ ] Login Laravel funciona
- [ ] Dashboard carga correctamente
- [ ] Control Notarial → LoginModal aparece
- [ ] Autenticación API C# exitosa
- [ ] Datos de Control Notarial cargan
- [ ] No hay errores en Console (F12)
- [ ] Logs limpios (sin errores críticos)

### ✅ Verificación BD

- [ ] Nuevas tablas existen (cat_*, estados, municipios, etc.)
- [ ] SEPOMEX cargado (~73k registros)
- [ ] Catálogos de negocio cargados (25 registros)
- [ ] Migraciones ejecutadas correctamente

### ✅ Backups Guardados

- [ ] Backup BD: `/var/backups/atinet/db_backup_YYYYMMDD.sql`
- [ ] Backup Código: `/var/backups/atinet/code_backup_YYYYMMDD.tar.gz`
- [ ] Backup .env: `/var/backups/atinet/.env_backup_YYYYMMDD`
- [ ] Ubicación de backups documentada

---

## 📞 Soporte

Si encuentras problemas que no están en troubleshooting, documenta:

1. **Mensaje de error exacto** (captura de pantalla)
2. **Logs relevantes** (últimas 50 líneas de laravel.log)
3. **Paso donde falló** (referencia a este checklist)
4. **Consola del navegador** (F12 → Console, captura)
5. **Network requests fallidos** (F12 → Network → XHR, captura)

---

**Última actualización:** 15 de Abril, 2026  
**Versión:** 1.0  
**Estado:** ✅ LISTO PARA USAR
