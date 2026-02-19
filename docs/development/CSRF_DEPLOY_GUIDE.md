# Deployment Best Practices - Prevención de Errores CSRF

## Problema
Después de un deployment, los usuarios con la aplicación cargada pueden experimentar errores 419 (CSRF token mismatch) porque su navegador tiene cached el bundle antiguo con un token CSRF obsoleto.

## Soluciones Implementadas

### 1. Auto-reload en errores 419 (Frontend)
- **Archivo**: `resources/js/utils/csrf-handler.ts`
- **Función**: Intercepta errores 419 y recarga la página automáticamente
- **Protección**: Rate limiting para evitar loops infinitos de recarga
- **Inicialización**: Se activa automáticamente en `app.tsx`

```typescript
// El handler intercepta window.fetch globalmente
initializeCsrfHandler();
```

### 2. Comandos de Deploy Recomendados

```bash
# Después de cada deployment en producción, ejecutar:

# 1. Limpiar todas las cachés de Laravel
php artisan optimize:clear

# 2. Recompilar assets con versioning
npm run build

# 3. Reiniciar cache de configuración (producción)
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 4. Reiniciar workers de queue (si aplica)
php artisan queue:restart
```

### 3. Headers de Cache (Nginx/Apache)

**Nginx** - Agregar al bloque `location ~ ^/build/`:
```nginx
location ~ ^/build/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

**Apache** - Agregar al `.htaccess`:
```apache
<IfModule mod_expires.c>
    <FilesMatch "\.(js|css)$">
        ExpiresActive On
        ExpiresDefault "access plus 1 year"
        Header set Cache-Control "public, immutable"
    </FilesMatch>
</IfModule>
```

### 4. Versionado de Assets

Laravel Vite ya maneja esto automáticamente:
- Cada build genera hashes únicos: `app-D8fKUb93.js`
- El `manifest.json` mapea los archivos originales a sus versiones hasheadas
- Los navegadores siempre obtienen la versión correcta después del deploy

### 5. Sesión Persistente

Configuración en `.env`:
```env
SESSION_LIFETIME=120          # Duración de sesión en minutos
SESSION_EXPIRE_ON_CLOSE=false # Mantener sesión al cerrar navegador
SESSION_SECURE_COOKIE=true    # Solo HTTPS en producción
SESSION_SAME_SITE=lax         # Protección CSRF
```

## Testing

### Probar el auto-reload local:
1. Iniciar sesión en la aplicación
2. En consola del navegador: `document.querySelector('meta[name="csrf-token"]').content = 'invalid'`
3. Hacer una búsqueda
4. ✅ La página debería recargar automáticamente

### Simular deploy:
```bash
# Terminal 1: Build nuevo
npm run build

# Terminal 2: Probar sin cerrar sesión
# La aplicación debe continuar funcionando o recargar automáticamente
```

## Monitoreo

Revisar logs de Laravel para errores 419:
```bash
tail -f storage/logs/laravel.log | grep 419
```

Si hay muchos 419s después de un deploy:
- ✅ Normal: Los usuarios recibirán auto-reload
- ❌ Anormal: Verificar que el CSRF handler esté inicializado

## Notas

- El auto-reload solo se ejecuta UNA VEZ cada 5 segundos (rate limiting)
- Solo intercepta requests a la misma origin (no APIs externas)
- El mensaje en consola ayuda a debugging: "🔄 Token CSRF expirado. Recargando página..."
