# 🚀 Plan de Implementación: Laravel Gateway para Control Notarial

**Fecha Creación:** 15 de Abril, 2026  
**Estado:** Pendiente  
**Duración Estimada:** 2 semanas  
**Prioridad:** Media (después de completar normalización)

---

## 📋 Contexto

**Situación Actual (Merge Aceptado - CBD25F7):**
- ✅ Sistema de Alex merged exitosamente
- ✅ Doble autenticación funcionando (Laravel + API C#)
- ✅ Control Notarial operativo con JWT en localStorage
- ✅ Configuración del API completada

**Problema a Resolver:**
- ❌ Usuario se loguea DOS veces (confuso)
- ❌ JWT expuesto en localStorage (menos seguro)
- ❌ Multitenant NO funciona en Control Notarial
- ❌ Auth::user() NO disponible en APIs C#
- ❌ Difícil auditar y hacer logging

**Solución:** Implementar Laravel como Gateway/Proxy (JWT server-to-server)

---

## 🎯 Objetivos

### Funcionales
1. Usuario se loguea UNA sola vez (Laravel Fortify)
2. Multitenant funciona en TODO el sistema (incluido Control Notarial)
3. Auth::user() disponible en todos los controladores
4. Logging y auditoría centralizados
5. Rate limiting por usuario
6. Permissions granulares con Laravel

### No Funcionales
1. Latencia adicional < 200ms por request
2. JWT cached en servidor (evitar re-autenticación)
3. Manejo robusto de errores del API C#
4. Rollback fácil si hay problemas
5. Testing completo antes de deploy

---

## 📦 Fase 1: Preparación (Días 1-2)

### Día 1: Análisis y Estructura

**Tareas:**
- [ ] Mapear todos los endpoints del API C# usados actualmente
- [ ] Documentar estructura de requests/responses
- [ ] Crear estructura de controladores Gateway
- [ ] Diseñar sistema de cache para JWT

**Entregables:**
```
docs/
├── API_CONTROL_NOTARIAL_ENDPOINTS.md (mapeo completo)
└── GATEWAY_ARCHITECTURE.md (diseño técnico)

app/Http/Controllers/Gateway/
└── ControlNotarialGatewayController.php (esqueleto)
```

**Comandos:**
```bash
# Crear controlador Gateway
php artisan make:controller Gateway/ControlNotarialGatewayController

# Crear service para manejo de JWT
php artisan make:class Services/ControlNotarialApiService
```

### Día 2: Configuración de Credenciales

**Tareas:**
- [ ] Coordinar con Alex credenciales de servidor
- [ ] Crear usuario "LARAVEL_SERVER" en API C#
- [ ] Configurar variables .env en todos los ambientes
- [ ] Testing de autenticación server-to-server

**Variables .env a configurar:**
```env
# Producción
CONTROL_NOTARIAL_SERVER_USER=LARAVEL_SERVER
CONTROL_NOTARIAL_SERVER_PASSWORD=password_seguro_aqui
CONTROL_NOTARIAL_TOKEN_CACHE=3600

# Development
CONTROL_NOTARIAL_API_URL=https://localhost:44327/api
```

---

## 🔧 Fase 2: Desarrollo Backend (Días 3-7)

### Día 3: Service Layer

**Crear:** `app/Services/ControlNotarialApiService.php`

**Funcionalidades:**
```php
class ControlNotarialApiService
{
    // Obtener JWT del servidor (cached)
    public function getServerToken(): string;
    
    // Hacer request GET al API C#
    public function get(string $endpoint, array $params = []): array;
    
    // Hacer request POST al API C#
    public function post(string $endpoint, array $data = []): array;
    
    // Hacer request PUT al API C#
    public function put(string $endpoint, array $data = []): array;
    
    // Hacer request DELETE al API C#
    public function delete(string $endpoint): array;
    
    // Validar token
    public function isTokenValid(): bool;
    
    // Renovar token
    public function refreshToken(): string;
}
```

### Día 4-5: Gateway Controller - Endpoints Principales

**Crear endpoints en Laravel que proxean a API C#:**

```php
// app/Http/Controllers/Gateway/ControlNotarialGatewayController.php

public function getClientes(Request $request);
public function getOperaciones(Request $request);
public function getZonasMunicipios(Request $request);
public function getImpuestosDerechos(Request $request);
public function verificarNumeroEscritura(Request $request);
public function getPresupuestosExpediente(Request $request, int $expedienteId);
public function createPresupuesto(Request $request);
public function updatePresupuesto(Request $request, int $id);
public function createExpediente(Request $request);
public function updateExpediente(Request $request, int $id);
// ... más endpoints según mapeo
```

**Características de cada endpoint:**
- ✅ Valida autenticación Laravel (`Auth::user()`)
- ✅ Aplica multitenant (`$user->notaria`)
- ✅ Logging de requests
- ✅ Rate limiting
- ✅ Manejo de errores robusto
- ✅ Cache cuando sea apropiado

### Día 6: Rutas y Middleware

**Archivo:** `routes/web.php`

```php
Route::prefix('api/control-notarial')
    ->name('api.control-notarial.')
    ->middleware(['auth', 'verified'])
    ->group(function () {
        
        // Clientes
        Route::get('/clientes', [ControlNotarialGatewayController::class, 'getClientes'])
            ->name('clientes.index');
        
        // Operaciones
        Route::get('/operaciones', [ControlNotarialGatewayController::class, 'getOperaciones'])
            ->name('operaciones.index');
        
        // Zonas/Municipios
        Route::get('/zonas-municipios', [ControlNotarialGatewayController::class, 'getZonasMunicipios'])
            ->name('zonas-municipios.index');
        
        // Expedientes
        Route::post('/expedientes/verificar-numero', [ControlNotarialGatewayController::class, 'verificarNumeroEscritura'])
            ->name('expedientes.verificar-numero');
        
        Route::get('/expedientes/{expedienteId}/presupuestos', [ControlNotarialGatewayController::class, 'getPresupuestosExpediente'])
            ->name('expedientes.presupuestos');
        
        // Presupuestos
        Route::post('/presupuestos', [ControlNotarialGatewayController::class, 'createPresupuesto'])
            ->name('presupuestos.store');
        
        Route::put('/presupuestos/{id}', [ControlNotarialGatewayController::class, 'updatePresupuesto'])
            ->name('presupuestos.update');
        
        // ... más rutas
    });
```

### Día 7: Testing Backend

**Crear tests:**
```bash
php artisan make:test ControlNotarialGateway/ClientesTest
php artisan make:test ControlNotarialGateway/OperacionesTest
php artisan make:test ControlNotarialGateway/ExpedientesTest
```

**Tests esenciales:**
- ✅ Autenticación requerida (401 sin login)
- ✅ Multitenant funciona (solo ve datos de su notaría)
- ✅ JWT se obtiene y cachea correctamente
- ✅ Requests al API C# exitosos
- ✅ Manejo de errores del API C#
- ✅ Rate limiting funciona
- ✅ Logging se genera correctamente

---

## 🎨 Fase 3: Refactorización Frontend (Días 8-11)

### Día 8: Actualizar Service Layer Frontend

**Eliminar archivos JWT:**
```bash
rm resources/js/services/authService.ts
rm resources/js/hooks/useAuthGuard.ts
rm resources/js/components/Modals/LoginModal.tsx
rm resources/js/helpers/controlNotarialResponse.ts
```

**Actualizar:** `resources/js/services/api.ts`

```typescript
// Cambiar URLs de API C# directas → Laravel Gateway
export function useApi(): ApiService {
    // Ya no necesita JWT, usa session de Laravel
    return new ApiService(''); // Base URL vacía (rutas relativas)
}

class ApiService {
    // Remover getHeaders con JWT
    // Usar fetch normal con credentials: 'include' (cookies)
    
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        const response = await fetch(endpoint, {
            method: 'GET',
            credentials: 'include', // Incluir cookies de sesión
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });
        
        return this.normalizeResponse(await response.json(), response.status);
    }
}
```

### Día 9-10: Actualizar Páginas de Control Notarial

**Por cada página, actualizar:**

**Antes (JWT directo):**
```typescript
// ❌ Llamada directa a API C#
const clientes = await api.get('/Clientes/GetClientes');

// ❌ LoginModal
const [loginModalOpen, setLoginModalOpen] = useState(false);
useAuthGuard({ onUnauthorized: () => setLoginModalOpen(true) });
```

**Después (Laravel Gateway):**
```typescript
// ✅ Llamada a Laravel Gateway
const clientes = await api.get('/api/control-notarial/clientes');

// ✅ Sin LoginModal (session de Laravel)
// Usuario ya está autenticado con Fortify
```

**Páginas a actualizar:**
- [ ] `ControlNotarial/Index.tsx`
- [ ] `ControlNotarial/Expedientes/Index.tsx`
- [ ] `ControlNotarial/Expedientes/AltaExpedientes/Index.tsx`
- [ ] `ControlNotarial/Expedientes/PresupuestoPrevio/Index.tsx`
- [ ] `ControlNotarial/Configuracion/Notaria/Index.tsx`

### Día 11: Testing Frontend

**Tests manuales:**
- [ ] Login Laravel funciona
- [ ] Control Notarial NO pide segundo login
- [ ] Datos se cargan correctamente
- [ ] Multitenant funciona (solo ve datos de su notaría)
- [ ] Crear/editar expedientes funciona
- [ ] Crear/editar presupuestos funciona
- [ ] Logout funciona correctamente
- [ ] Token expirado redirige a login (Laravel)

---

## 🚀 Fase 4: Testing y Deploy (Días 12-14)

### Día 12: Testing Integración

**Checklist:**
- [ ] Testing en desarrollo (localhost)
- [ ] Testing con API C# staging (si existe)
- [ ] Performance testing (latencia < 200ms)
- [ ] Load testing (múltiples usuarios simultáneos)
- [ ] Security testing (no exponer JWT, CSRF funciona)

### Día 13: Documentación

**Actualizar docs:**
- [ ] `ARQUITECTURA_HIBRIDA_SISTEMA.md` (marcar Gateway implementado)
- [ ] `README.md` (agregar sección Control Notarial)
- [ ] `API_GATEWAY_USAGE.md` (guía para desarrolladores)
- [ ] Changelog con cambios breaking

### Día 14: Deploy a Producción

**Checklist pre-deploy:**
- [ ] Backup de base de datos
- [ ] Backup de código actual
- [ ] Plan de rollback listo
- [ ] Credenciales de servidor configuradas
- [ ] Testing en staging exitoso
- [ ] Equipo notificado de deploy

**Comandos deploy:**
```bash
# En servidor de producción
cd /path/to/Atinet_Compliance_Hub

# Backup
mysqldump Atinet_Compliance_Hub > backup_gateway_$(date +%Y%m%d).sql
tar -czf ../backup_code_gateway_$(date +%Y%m%d).tar.gz .

# Pull cambios
git pull origin master

# Instalar dependencias
composer install --no-dev --optimize-autoloader
npm install && npm run build

# Configurar .env
nano .env
# Agregar CONTROL_NOTARIAL_SERVER_USER y SERVER_PASSWORD

# Limpiar cachés
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Restart services
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

**Post-deploy:**
- [ ] Verificar que login funciona
- [ ] Verificar que Control Notarial carga
- [ ] Verificar que multitenant funciona
- [ ] Monitorear logs por 24 horas
- [ ] Recolectar feedback de usuarios

---

## 🔄 Plan de Rollback

**Si hay problemas graves:**

```bash
# Restaurar código
cd /path/to/Atinet_Compliance_Hub
rm -rf *
tar -xzf ../backup_code_gateway_YYYYMMDD.tar.gz

# Restaurar base de datos (si hay cambios)
mysql Atinet_Compliance_Hub < backup_gateway_YYYYMMDD.sql

# Rebuild frontend
npm run build

# Limpiar cachés
php artisan optimize:clear
php artisan config:cache

# Restart services
sudo systemctl restart php8.2-fpm
sudo systemctl restart nginx
```

---

## 📊 Métricas de Éxito

### Funcionales
- ✅ Usuario se loguea solo 1 vez (vs 2 antes)
- ✅ 0 errores de multitenant en Control Notarial
- ✅ Auth::user() disponible en 100% de requests
- ✅ Logging completo en todos los endpoints

### Técnicas
- ✅ Latencia promedio < 200ms
- ✅ Cache hit rate JWT > 95%
- ✅ 0 errores de autenticación en 7 días
- ✅ 100% de tests pasando

### UX
- ✅ Reducción de 50% en soporte por problemas de login
- ✅ Feedback positivo de usuarios (encuesta)
- ✅ Tiempo de carga < 2s en Control Notarial

---

## 🎓 Aprendizajes Esperados

**Técnicos:**
- Arquitectura Gateway/Proxy en Laravel
- JWT server-to-server
- Integración con APIs legacy
- Cache strategies para tokens
- Testing de integración

**De Negocio:**
- Importancia de UX en autenticación
- Trade-offs entre rapidez y calidad
- Migración gradual vs big bang
- Comunicación con stakeholders

---

## 📝 Notas Importantes

1. **No eliminar sistema actual hasta que Gateway esté 100% probado**
2. **Mantener branches separados (gateway-dev) hasta merge final**
3. **Comunicar a usuarios cambio de flujo (solo 1 login)**
4. **Documentar todas las APIs del C# antes de empezar**
5. **Coordinar con Alex para credenciales de servidor**

---

## 🚦 Estado Actual

**Merge de Alex:** ✅ Completado (CBD25F7)  
**Configuración:** ✅ Completada  
**Gateway:** ⏳ Pendiente (iniciar después de normalización)

**Próximo Paso:** Terminar normalización BD y documentación, luego iniciar Fase 1 del Gateway.

---

**Última actualización:** 15 de Abril, 2026  
**Responsable:** Equipo Atinet  
**Revisión:** Pendiente con Alex (coordinación de credenciales)
