#!/usr/bin/env bash

# Script para deployment en producción
# Ejecuta todos los comandos necesarios para un deploy limpio

set -e

echo "🚀 Iniciando deployment..."

echo "📦 1/7 - Instalando dependencias PHP..."
composer install --no-dev --optimize-autoloader

echo "📦 2/7 - Instalando dependencias Node..."
npm ci --production=false

echo "🏗️  3/7 - Compilando assets..."
npm run build

echo "🗑️  4/7 - Limpiando cachés..."
php artisan optimize:clear

echo "⚙️  5/7 - Ejecutando migraciones..."
php artisan migrate --force

echo "💾 6/7 - Cacheando configuración..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "🔄 7/7 - Reiniciando workers..."
php artisan queue:restart || echo "⚠️  No queue workers running"

echo ""
echo "✅ Deployment completado exitosamente"
echo ""
echo "📋 Verificaciones recomendadas:"
echo "  - Visitar la aplicación y verificar login"
echo "  - Revisar logs: tail -f storage/logs/laravel.log"
echo "  - Verificar que el CSRF handler esté activo (consola del navegador)"
echo ""
