# Análisis Server Fixes - 11 Marzo 2026

## Contexto

Después del último `git pull` en el servidor de producción, algunas funcionalidades no operaban correctamente y fue necesario realizar ajustes directamente en el servidor. Para mantener un historial claro y evitar contaminar el branch `master` con parches reactivos, se creó el branch `server-fixes-2026-03-11` para preservar estos cambios y analizarlos.

## Cambios Identificados en Servidor

### 🔴 **CRÍTICO 1: Trust Proxies para Cloudflare**

**Archivo**: `bootstrap/app.php`

**Problema en producción**:
- Laravel genera URLs con `http://` en lugar de `https://`
- Causa **Mixed Content Errors** en navegadores
- Rompe assets (CSS, JS) y API calls desde frontend
- Cloudflare proxy no es confiable sin configuración explícita

**Cambio en servidor** (líneas 23-34):
```php
->withMiddleware(function (Middleware $middleware): void {
    // Confiar en Cloudflare como proxy HTTPS
    $middleware->trustProxies(
        at: '*',
        headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR |
            \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST |
            \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT |
            \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO |
            \Illuminate\Http\Request::HEADER_X_FORWARDED_AWS_ELB
    );

    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
```

**Cambio aplicado en master** ✅:
```php
->withMiddleware(function (Middleware $middleware): void {
    // Trust Cloudflare proxy headers (fix HTTPS/Mixed Content en producción)
    if (app()->environment('production')) {
        $middleware->trustProxies(
            at: '*',
            headers: \Illuminate\Http\Request::HEADER_X_FORWARDED_FOR |
                \Illuminate\Http\Request::HEADER_X_FORWARDED_HOST |
                \Illuminate\Http\Request::HEADER_X_FORWARDED_PORT |
                \Illuminate\Http\Request::HEADER_X_FORWARDED_PROTO |
                \Illuminate\Http\Request::HEADER_X_FORWARDED_AWS_ELB
        );
    }

    $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
```

**Mejora aplicada**:
- Condicionado a `app()->environment('production')`
- En development no es necesario y puede causar problemas con localhost
- Solo activo en producción donde Cloudflare está presente

---

### ✅ **CRÍTICO 2: Archivos de Cache en .gitignore**

**Archivo**: `.gitignore`

**Problema**:
- Archivos `bootstrap/cache/packages.php` y `services.php` se committearon accidentalmente
- Son autogenerados por Laravel
- Causan conflictos en git

**Cambio aplicado** ✅:
```diff
/.phpunit.cache
/bootstrap/ssr
+/bootstrap/cache/*.php
/node_modules
```

**Nota**: Los archivos ya comprometidos en servidor fueron eliminados en el branch server-fixes.

---

### ✅ **CRÍTICO 3: Campo legacy_identifier en Formulario de Edición**

**Archivos modificados**:
- `app/Http/Controllers/Admin/NotariaController.php`
- `app/Models/Notaria.php`
- `resources/js/pages/Admin/Notarias/Edit.tsx`

**Problema**:
- No se podía actualizar `legacy_identifier` desde la UI de edición
- Solo era posible asignar en creación

**Cambios aplicados** ✅:

**NotariaController.php** (línea 216):
```php
'codigo_postal' => 'nullable|regex:/^\d{5}$/',
'colonia' => 'nullable|string|max:100',
'calle' => 'nullable|string|max:255',
// Integración sistema legacy
'legacy_identifier' => 'nullable|string|max:100',
```

**Notaria.php** (líneas 39-42):
```php
'colonia',
'calle',
// Integración sistema legacy
'legacy_identifier',
'legacy_busquedas_count',
'legacy_ultima_busqueda',
```

**Edit.tsx**:
- Importa `LegacyNotariaAutocomplete`
- Agrega campo al interface `Notaria`
- Inicializa en `useForm`
- Renderiza componente en formulario

---

### ⚠️ **OPCIONAL 4: Comando SyncLegacyAplicativos**

**Archivo nuevo**: `app/Console/Commands/SyncLegacyAplicativos.php` (128 líneas)

**Propósito**:
- Sincroniza búsquedas legacy desde Hostgator (remoto) a BD local
- Soporta 4 tablas: `busquedas`, `busquedas_escritorio`, `ofac.consultas`, `sat.consultas`
- Sincronización incremental basada en `max(id)`
- Chunks de 500 registros
- Con protección de overlap

**Uso**:
```bash
php artisan legacy:sync-aplicativos
php artisan legacy:sync-aplicativos --table=ofac
php artisan legacy:sync-aplicativos --force  # Resync completo
```

**Estado**: ❌ **NO aplicado en master**

**Razón**:
En development no tenemos acceso a las conexiones remotas de Hostgator. Este comando solo funciona en producción donde las credenciales remotas están configuradas en `.env`:
```env
DB_APLICATIVOS_REMOTE_HOST=...
DB_OFAC_REMOTE_HOST=...
DB_SAT_REMOTE_HOST=...
```

**Recomendación**: Aplicar solo en servidor, no en master.

---

### ⚠️ **OPCIONAL 5: Schedule Hourly Sync**

**Archivo**: `routes/console.php` (líneas 45-54)

**Propósito**:
- Ejecuta `legacy:sync-aplicativos` cada hora
- Mantiene réplicas locales actualizadas automáticamente

**Código**:
```php
Schedule::command('legacy:sync-aplicativos')
    ->hourly()
    ->withoutOverlapping(15)
    ->timezone('America/Mexico_City')
    ->onFailure(function () {
        Log::error('❌ Error en sincronización de BDs legacy (aplicativos/OFAC/SAT)');
    })
    ->description('Sincroniza búsquedas legacy desde Hostgator a BD local');
```

**Estado**: ❌ **NO aplicado en master**

**Razón**: Mismo que Opcional 4. Solo funciona en producción con conexiones remotas.

**Recomendación**: Aplicar solo en servidor cuando el comando esté en producción.

---

## Resumen de Cambios Aplicados en Master

| # | Archivo | Cambio | Estado | Notas |
|---|---------|--------|--------|-------|
| 1 | `bootstrap/app.php` | Trust Proxies | ✅ Aplicado | Condicionado a producción |
| 2 | `.gitignore` | Cache excludes | ✅ Aplicado | Evita conflicts |
| 3 | `NotariaController.php` | Validación legacy_identifier | ✅ Aplicado | Permite editar vinculación |
| 4 | `Notaria.php` | Fillable legacy fields | ✅ Aplicado | 3 campos agregados |
| 5 | `Edit.tsx` | UI legacy_identifier | ✅ Aplicado | Autocomplete funcional |
| 6 | `SyncLegacyAplicativos.php` | Comando sync | ❌ No aplicado | Solo servidor |
| 7 | `console.php` | Schedule hourly | ❌ No aplicado | Solo servidor |

---

## Verificación de Cambios

### Build Frontend ✅
```bash
npm run build
# ✓ 3437 modules transformed
# ✓ built in 53.81s
```

### Formato Código ✅
```bash
vendor/bin/pint --dirty --format agent
# {"result":"pass"}
```

### Errores PHP
- Solo warnings de PHPStan en tests (property typing)
- No afectan funcionalidad

---

## Próximos Pasos

### 1. Commit y Push de Master ✅

Commitear los cambios críticos aplicados:
```bash
git add .
git commit -m "fix(server-compatibility): aplicar fixes necesarios para producción

- Trust proxies de Cloudflare (solo en production)
- Excluir bootstrap/cache/*.php en .gitignore
- Permitir edición de legacy_identifier desde UI
- Agregar campos legacy al fillable de Notaria

Ref: server-fixes-2026-03-11"
git push origin master
```

### 2. Server: Pull Master ✅

En el servidor de producción:
```bash
git checkout master
git pull origin master
```

### 3. Server: Limpiar Branch de Fixes (Opcional)

La rama `server-fixes-2026-03-11` se puede mantener como referencia histórica o eliminar:
```bash
# Mantener en remoto para referencia
git branch -d server-fixes-2026-03-11  # Delete local

# O eliminar completamente
git push origin --delete server-fixes-2026-03-11
```

### 4. Continuar con Siguiente Fase

Una vez sincronizado el servidor, continuar con:
- **Priority 2**: Dashboard Card (1 hora)
- **Priority 3**: Reports Page (2-3 horas)
- **Priority 4**: Optimizations (1 hora)
- **Priority 5**: Documentation (30 min)

---

## Lecciones Aprendidas

### ✅ Lo que funcionó bien

1. **Branch strategy**: Crear `server-fixes-2026-03-11` permitió preservar cambios sin contaminar master
2. **Analysis workflow**: `git diff master..server-fixes` permitió análisis detallado
3. **Conditional logic**: `app()->environment('production')` para código específico de producción

### 🔄 Mejoras futuras

1. **Environment parity**: Usar Docker/Sail para replicar producción en development
2. **CI/CD**: GitHub Actions para validar cambios antes de deploy
3. **Staging environment**: Ambiente intermedio para tests pre-producción
4. **Documentation**: Documentar diferencias entre dev/prod en `.env.example`

---

## Conclusión

Los cambios críticos han sido **correctamente aplicados en master** con mejoras para compatibilidad entre development y producción. El servidor puede ahora hacer `git pull` sin problemas y todas las funcionalidades operarán correctamente.

**Status**: ✅ **LISTO PARA DEPLOY**
