#!/bin/bash
#============================================
# Script de Actualización Segura - Servidor
# Fecha: 15 de Abril, 2026
# Proyecto: Atinet Compliance Hub
#============================================

set -e  # Detener en cualquier error

echo "============================================"
echo "INICIO: Actualización Servidor Producción"
echo "============================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
PROJECT_DIR="/var/www/Atinet_Compliance_Hub"  # AJUSTAR según tu servidor
BACKUP_DIR="/var/backups/atinet"
DATE=$(date +%Y%m%d_%H%M%S)

echo -e "${BLUE}[INFO]${NC} Fecha/Hora: $(date)"
echo -e "${BLUE}[INFO]${NC} Usuario: $(whoami)"
echo -e "${BLUE}[INFO]${NC} Directorio: $PROJECT_DIR"
echo ""

#============================================
# PASO 1: Verificaciones Pre-Actualización
#============================================
echo -e "${YELLOW}=== PASO 1: Verificaciones Pre-Actualización ===${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -d "$PROJECT_DIR" ]; then
    echo -e "${RED}[ERROR]${NC} Directorio $PROJECT_DIR no existe"
    exit 1
fi

cd "$PROJECT_DIR"

# Verificar rama actual
CURRENT_BRANCH=$(git branch --show-current)
echo -e "${BLUE}[INFO]${NC} Rama actual: $CURRENT_BRANCH"

if [ "$CURRENT_BRANCH" != "master" ]; then
    echo -e "${YELLOW}[WARN]${NC} No estás en master, cambiando..."
    git checkout master
fi

# Verificar estado de git
if ! git diff --quiet; then
    echo -e "${RED}[ERROR]${NC} Hay cambios sin commitear"
    echo "Ejecuta: git status"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Verificaciones pre-actualización completadas"
echo ""

#============================================
# PASO 2: Backups
#============================================
echo -e "${YELLOW}=== PASO 2: Crear Backups ===${NC}"

# Crear directorio de backup si no existe
mkdir -p "$BACKUP_DIR"

# Backup de Base de Datos
echo -e "${BLUE}[INFO]${NC} Creando backup de base de datos..."
DB_NAME="Atinet_Compliance_Hub"  # AJUSTAR según tu BD
DB_USER="root"                    # AJUSTAR según tu usuario
DB_BACKUP="$BACKUP_DIR/db_backup_$DATE.sql"

# Opción 1: Con contraseña en variable de entorno
# export MYSQL_PWD='tu_password'
# mysqldump -u $DB_USER $DB_NAME > "$DB_BACKUP"

# Opción 2: Pedir contraseña interactivamente
echo -e "${BLUE}[INFO]${NC} Ingresa contraseña de MySQL:"
mysqldump -u $DB_USER -p $DB_NAME > "$DB_BACKUP"

if [ -f "$DB_BACKUP" ]; then
    DB_SIZE=$(du -h "$DB_BACKUP" | cut -f1)
    echo -e "${GREEN}[OK]${NC} Backup BD creado: $DB_BACKUP ($DB_SIZE)"
else
    echo -e "${RED}[ERROR]${NC} Falló backup de BD"
    exit 1
fi

# Backup de Código
echo -e "${BLUE}[INFO]${NC} Creando backup de código..."
CODE_BACKUP="$BACKUP_DIR/code_backup_$DATE.tar.gz"
tar -czf "$CODE_BACKUP" \
    --exclude='node_modules' \
    --exclude='vendor' \
    --exclude='storage/logs' \
    --exclude='.git' \
    .

if [ -f "$CODE_BACKUP" ]; then
    CODE_SIZE=$(du -h "$CODE_BACKUP" | cut -f1)
    echo -e "${GREEN}[OK]${NC} Backup código creado: $CODE_BACKUP ($CODE_SIZE)"
else
    echo -e "${RED}[ERROR]${NC} Falló backup de código"
    exit 1
fi

# Backup de .env
cp .env "$BACKUP_DIR/.env_backup_$DATE"
echo -e "${GREEN}[OK]${NC} Backup .env creado"

echo -e "${GREEN}[OK]${NC} Todos los backups completados"
echo ""

#============================================
# PASO 3: Contar Migraciones Antes
#============================================
echo -e "${YELLOW}=== PASO 3: Estado Actual de Migraciones ===${NC}"

MIGRATIONS_BEFORE=$(ls -1 database/migrations/*.php 2>/dev/null | wc -l)
echo -e "${BLUE}[INFO]${NC} Migraciones actuales: $MIGRATIONS_BEFORE"

# Verificar tablas migrations en BD
echo -e "${BLUE}[INFO]${NC} Migraciones ejecutadas en BD:"
mysql -u $DB_USER -p $DB_NAME -e "SELECT COUNT(*) as total FROM migrations;" 2>/dev/null || echo "No se pudo consultar"

echo ""

#============================================
# PASO 4: Git Pull
#============================================
echo -e "${YELLOW}=== PASO 4: Actualizar Código desde Git ===${NC}"

# Fetch primero
echo -e "${BLUE}[INFO]${NC} Obteniendo cambios remotos..."
git fetch origin

# Verificar cuántos commits atrás estamos
COMMITS_BEHIND=$(git rev-list HEAD..origin/master --count)
echo -e "${BLUE}[INFO]${NC} Commits pendientes: $COMMITS_BEHIND"

if [ "$COMMITS_BEHIND" -eq 0 ]; then
    echo -e "${GREEN}[OK]${NC} Ya estás actualizado"
else
    echo -e "${YELLOW}[WARN]${NC} Hay $COMMITS_BEHIND commits nuevos"

    # Mostrar commits que se van a aplicar
    echo -e "${BLUE}[INFO]${NC} Commits que se aplicarán:"
    git log --oneline HEAD..origin/master

    # Confirmar actualización
    read -p "¿Continuar con git pull? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${RED}[ABORT]${NC} Actualización cancelada por usuario"
        exit 1
    fi

    # Pull
    echo -e "${BLUE}[INFO]${NC} Ejecutando git pull..."
    git pull origin master

    echo -e "${GREEN}[OK]${NC} Código actualizado"
fi

echo ""

#============================================
# PASO 5: Verificar Nuevas Migraciones
#============================================
echo -e "${YELLOW}=== PASO 5: Verificar Nuevas Migraciones ===${NC}"

MIGRATIONS_AFTER=$(ls -1 database/migrations/*.php 2>/dev/null | wc -l)
MIGRATIONS_NEW=$((MIGRATIONS_AFTER - MIGRATIONS_BEFORE))

echo -e "${BLUE}[INFO]${NC} Migraciones después: $MIGRATIONS_AFTER"
echo -e "${BLUE}[INFO]${NC} Migraciones nuevas: $MIGRATIONS_NEW"

if [ "$MIGRATIONS_NEW" -gt 0 ]; then
    echo -e "${YELLOW}[WARN]${NC} Se agregaron $MIGRATIONS_NEW migraciones nuevas:"
    ls -1t database/migrations/*.php | head -n $MIGRATIONS_NEW
fi

echo ""

#============================================
# PASO 6: Actualizar .env (Manual)
#============================================
echo -e "${YELLOW}=== PASO 6: Verificar .env ===${NC}"

echo -e "${BLUE}[INFO]${NC} Verificando variable CONTROL_NOTARIAL_API_URL..."

if grep -q "CONTROL_NOTARIAL_API_URL" .env; then
    echo -e "${GREEN}[OK]${NC} Variable CONTROL_NOTARIAL_API_URL existe"
    grep "CONTROL_NOTARIAL_API_URL" .env
else
    echo -e "${RED}[WARN]${NC} Variable CONTROL_NOTARIAL_API_URL NO existe"
    echo -e "${YELLOW}[ACTION]${NC} Debes agregar manualmente a .env:"
    echo ""
    echo "# API CONTROL NOTARIAL (C# - Sistema Legacy)"
    echo "CONTROL_NOTARIAL_API_URL=https://srvatinet.atinet.com.mx:7443/api"
    echo ""
    read -p "¿Ya agregaste la variable? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${RED}[ABORT]${NC} Actualiza .env antes de continuar"
        exit 1
    fi
fi

echo ""

#============================================
# PASO 7: Dependencias Backend
#============================================
echo -e "${YELLOW}=== PASO 7: Actualizar Dependencias Backend ===${NC}"

echo -e "${BLUE}[INFO]${NC} Ejecutando composer install..."
composer install --no-dev --optimize-autoloader

echo -e "${GREEN}[OK]${NC} Dependencias backend actualizadas"
echo ""

#============================================
# PASO 8: Dependencias Frontend
#============================================
echo -e "${YELLOW}=== PASO 8: Actualizar Dependencias Frontend ===${NC}"

echo -e "${BLUE}[INFO]${NC} Ejecutando npm install..."
npm install

echo -e "${GREEN}[OK]${NC} Dependencias frontend actualizadas"
echo ""

#============================================
# PASO 9: Compilar Frontend
#============================================
echo -e "${YELLOW}=== PASO 9: Compilar Assets Frontend ===${NC}"

echo -e "${BLUE}[INFO]${NC} Ejecutando npm run build..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}[OK]${NC} Frontend compilado exitosamente"
else
    echo -e "${RED}[ERROR]${NC} Falló compilación de frontend"
    echo -e "${YELLOW}[INFO]${NC} Revisa errores arriba. ¿Continuar de todos modos? (s/n)"
    read -p "Continuar: " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
fi

echo ""

#============================================
# PASO 10: Ejecutar Migraciones
#============================================
echo -e "${YELLOW}=== PASO 10: Ejecutar Migraciones ===${NC}"

if [ "$MIGRATIONS_NEW" -gt 0 ]; then
    echo -e "${YELLOW}[WARN]${NC} Se ejecutarán $MIGRATIONS_NEW migraciones nuevas"
    echo -e "${BLUE}[INFO]${NC} ANTES de continuar, verifica que no haya migraciones duplicadas"

    # Mostrar últimas migraciones ejecutadas
    echo -e "${BLUE}[INFO]${NC} Últimas 5 migraciones ejecutadas en BD:"
    mysql -u $DB_USER -p $DB_NAME -e "SELECT migration FROM migrations ORDER BY id DESC LIMIT 5;" 2>/dev/null || echo "No se pudo consultar"

    read -p "¿Ejecutar migraciones? (s/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Ss]$ ]]; then
        echo -e "${BLUE}[INFO]${NC} Ejecutando php artisan migrate..."
        php artisan migrate --force

        if [ $? -eq 0 ]; then
            echo -e "${GREEN}[OK]${NC} Migraciones ejecutadas exitosamente"
        else
            echo -e "${RED}[ERROR]${NC} Falló ejecución de migraciones"
            echo -e "${YELLOW}[INFO]${NC} Revisa errores. Puedes restaurar BD con:"
            echo "mysql -u $DB_USER -p $DB_NAME < $DB_BACKUP"
            exit 1
        fi
    else
        echo -e "${YELLOW}[SKIP]${NC} Migraciones omitidas por usuario"
    fi
else
    echo -e "${BLUE}[INFO]${NC} No hay migraciones nuevas"
fi

echo ""

#============================================
# PASO 11: Ejecutar Seeders
#============================================
echo -e "${YELLOW}=== PASO 11: Ejecutar Seeders ===${NC}"

echo -e "${YELLOW}[WARN]${NC} Seeders nuevos a ejecutar:"
echo "  1. CatalogosGeografiaSeeder (73,136 registros)"
echo "  2. CatalogosNegocioSeeder (25 registros)"
echo ""

read -p "¿Ejecutar seeders? (s/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Ss]$ ]]; then
    echo -e "${BLUE}[INFO]${NC} Ejecutando CatalogosGeografiaSeeder..."
    php artisan db:seed --class=CatalogosGeografiaSeeder --force

    echo -e "${BLUE}[INFO]${NC} Ejecutando CatalogosNegocioSeeder..."
    php artisan db:seed --class=CatalogosNegocioSeeder --force

    echo -e "${GREEN}[OK]${NC} Seeders ejecutados"
else
    echo -e "${YELLOW}[SKIP]${NC} Seeders omitidos por usuario"
fi

echo ""

#============================================
# PASO 12: Limpiar Cachés
#============================================
echo -e "${YELLOW}=== PASO 12: Limpiar Cachés ===${NC}"

echo -e "${BLUE}[INFO]${NC} Limpiando cachés de Laravel..."
php artisan optimize:clear

echo -e "${BLUE}[INFO]${NC} Regenerando cachés optimizados..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo -e "${GREEN}[OK]${NC} Cachés actualizados"
echo ""

#============================================
# PASO 13: Reiniciar Servicios
#============================================
echo -e "${YELLOW}=== PASO 13: Reiniciar Servicios ===${NC}"

# Detectar si PHP-FPM está corriendo
if systemctl is-active --quiet php8.2-fpm; then
    echo -e "${BLUE}[INFO]${NC} Reiniciando PHP-FPM..."
    sudo systemctl restart php8.2-fpm
    echo -e "${GREEN}[OK]${NC} PHP-FPM reiniciado"
else
    echo -e "${YELLOW}[WARN]${NC} PHP-FPM no está activo o usa otra versión"
fi

# Detectar si Nginx está corriendo
if systemctl is-active --quiet nginx; then
    echo -e "${BLUE}[INFO]${NC} Reiniciando Nginx..."
    sudo systemctl restart nginx
    echo -e "${GREEN}[OK]${NC} Nginx reiniciado"
else
    echo -e "${YELLOW}[WARN]${NC} Nginx no está activo"
fi

# Si usas Apache
if systemctl is-active --quiet apache2; then
    echo -e "${BLUE}[INFO]${NC} Reiniciando Apache..."
    sudo systemctl restart apache2
    echo -e "${GREEN}[OK]${NC} Apache reiniciado"
fi

echo ""

#============================================
# PASO 14: Verificaciones Post-Actualización
#============================================
echo -e "${YELLOW}=== PASO 14: Verificaciones Post-Actualización ===${NC}"

# Verificar migraciones ejecutadas
echo -e "${BLUE}[INFO]${NC} Verificando estado de migraciones..."
MIGRATIONS_DB=$(mysql -u $DB_USER -p $DB_NAME -se "SELECT COUNT(*) FROM migrations;" 2>/dev/null)
echo -e "${BLUE}[INFO]${NC} Migraciones en BD: $MIGRATIONS_DB"
echo -e "${BLUE}[INFO]${NC} Archivos de migración: $MIGRATIONS_AFTER"

# Verificar permisos
echo -e "${BLUE}[INFO]${NC} Verificando permisos..."
chown -R www-data:www-data storage bootstrap/cache
chmod -R 775 storage bootstrap/cache

echo -e "${GREEN}[OK]${NC} Verificaciones completadas"
echo ""

#============================================
# PASO 15: Resumen Final
#============================================
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}ACTUALIZACIÓN COMPLETADA EXITOSAMENTE${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

echo -e "${BLUE}[RESUMEN]${NC}"
echo "  • Commits actualizados: $COMMITS_BEHIND"
echo "  • Migraciones nuevas: $MIGRATIONS_NEW"
echo "  • Migraciones en BD: $MIGRATIONS_DB"
echo "  • Backup BD: $DB_BACKUP"
echo "  • Backup Código: $CODE_BACKUP"
echo ""

echo -e "${YELLOW}[NEXT STEPS]${NC}"
echo "  1. Prueba el sistema en el navegador"
echo "  2. Verifica que Control Notarial carga"
echo "  3. Verifica que LoginModal aparece"
echo "  4. Prueba login con usuario de API C#"
echo "  5. Revisa logs: tail -f storage/logs/laravel.log"
echo ""

echo -e "${BLUE}[ROLLBACK]${NC} Si algo falla, restaura con:"
echo "  mysql -u $DB_USER -p $DB_NAME < $DB_BACKUP"
echo "  cd $PROJECT_DIR && rm -rf * && tar -xzf $CODE_BACKUP"
echo ""

echo -e "${GREEN}[DONE]${NC} Actualización completada: $(date)"
