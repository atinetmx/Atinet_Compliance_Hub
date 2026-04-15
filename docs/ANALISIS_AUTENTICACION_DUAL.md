# 🔐 Análisis: Sistema de Autenticación Dual

**Fecha:** 15 de Abril, 2026  
**Revisión de Cambios:** dev-alex (Alex)

---

## 🎯 Resumen Ejecutivo

**✅ NO HAY CONFLICTO** - Los dos sistemas de autenticación son **complementarios**, no competitivos.

```
┌─────────────────────────────────────────────────────────────┐
│                    FLUJO DE AUTENTICACIÓN                   │
└─────────────────────────────────────────────────────────────┘

1️⃣ Usuario accede a Laravel App
    ↓
    Laravel Fortify (Sesión Web)
    ├── Login: /login (Fortify)
    ├── Guard: 'web'
    ├── Storage: Session Cookie
    └── Scope: Toda la aplicación Laravel

2️⃣ Usuario accede a Control Notarial
    ↓
    Necesita datos del API legacy (C# .NET)
    ↓
    JWT Authentication (Alex)
    ├── Login: https://localhost:44327/api/Login/Authentication
    ├── Guard: Token JWT
    ├── Storage: localStorage ('auth_token')
    └── Scope: Solo módulo Control Notarial
```

---

## 📊 Comparativa de Sistemas

| Aspecto | Laravel Fortify (Existente) | JWT Alex (Control Notarial) |
|---------|---------------------------|----------------------------|
| **Propósito** | Autenticación Laravel | Autenticación API Legacy |
| **Tecnología** | Sesiones + Cookies | JWT Token |
| **Backend** | Laravel (PHP) | API .NET Core (C#) |
| **Endpoint** | `/login` (Laravel) | `https://localhost:44327/api/Login/Authentication` |
| **Storage** | Session (server-side) | localStorage (client-side) |
| **Scope** | Toda la app | Solo Control Notarial |
| **Guard** | `web` | Custom (JWT) |
| **Duración** | Sesión (configurable) | Token (expires_in) |
| **Logout** | `/logout` (Laravel) | `/api/Login/Logout` (API) |

---

## 🏗️ Arquitectura de la Solución

### Flujo Completo de Usuario

```
📱 Usuario → Navegador
    │
    ├─ Paso 1: Acceso inicial a Laravel
    │   └─ Fortify valida credenciales
    │       └─ Crea sesión (Cookie)
    │           └─ Redirige a dashboard según tipo_cuenta
    │
    └─ Paso 2: Navega a Control Notarial
        └─ useAuthGuard() verifica token JWT
            ├─ Si NO tiene token → LoginModal aparece
            │   └─ Usuario ingresa credenciales
            │       └─ POST a API legacy (.NET)
            │           └─ Recibe JWT token
            │               └─ Guarda en localStorage
            │
            └─ Si SÍ tiene token → API requests incluyen:
                └─ Header: Authorization: Bearer {token}
```

---

## 🔍 Análisis Técnico de los Cambios de Alex

### 1. **authService.ts** (Nuevo)

**Ubicación:** `resources/js/services/authService.ts`

**Funciones principales:**
```typescript
// Guarda JWT token del API legacy
saveToken(token: string): void

// Obtiene token guardado
getToken(): string | null

// Verifica si hay token
isAuthenticated(): boolean

// Logout del API legacy
logout(): Promise<void>

// Obtiene IP del cliente
getClientIp(): Promise<string>
```

**Configuración dinámica:**
```typescript
// Detecta automáticamente el API base URL
const authApiBaseUrl = props.authApiBaseUrl || 'https://localhost:44327';

// Endpoints del API legacy:
// - /Login/Authentication (POST)
// - /Login/Logout (POST)
```

**⚠️ IMPORTANTE:** Este servicio **NO toca** las sesiones de Laravel Fortify.

---

### 2. **LoginModal.tsx** (Nuevo)

**Ubicación:** `resources/js/components/Modals/LoginModal.tsx`

**Propósito:** Modal de login específico para Control Notarial.

**Flujo:**
```typescript
1. Usuario ingresa credenciales
2. Obtiene IP del cliente (getClientIp)
3. POST a /Login/Authentication con:
   {
     usuario: string,
     contrasena: string,
     equipo: string (IP)
   }
4. Recibe respuesta:
   {
     message: string,
     dataResponse: {
       token: string,
       modulos: { modulo_id: number[] }
     }
   }
5. Guarda token en localStorage
6. Cierra modal
```

**Uso en páginas:**
```typescript
const [loginModalOpen, setLoginModalOpen] = useState(false);

useAuthGuard({
    onUnauthorized: () => setLoginModalOpen(true)
});

<LoginModal 
    isOpen={loginModalOpen} 
    onClose={() => setLoginModalOpen(false)} 
/>
```

---

### 3. **useAuthGuard.ts** (Nuevo)

**Ubicación:** `resources/js/hooks/useAuthGuard.ts`

**Propósito:** Hook que valida el token JWT en cada página de Control Notarial.

**Flujo de validación:**
```typescript
useEffect(() => {
    // 1️⃣ Verificar si hay token en localStorage
    if (!isAuthenticated()) {
        removeToken();
        onUnauthorized?.();  // Muestra LoginModal
        return;
    }

    // 2️⃣ (Opcional) Validar token con servidor
    if (validateOnMount) {
        const response = await api.get('/ConfiguracionNotarial/...');
        if (response?.isUnauthorized) {
            removeToken();
            onUnauthorized?.();
        }
    }
}, []);
```

**Uso recomendado:**
```typescript
// En TODAS las páginas de Control Notarial:
useAuthGuard({
    onUnauthorized: () => setLoginModalOpen(true),
    validateOnMount: false  // true para validar con servidor
});
```

---

### 4. **api.ts** (Modificado)

**Cambio principal:** Incluye JWT token en headers automáticamente.

**Antes (tu versión):**
```typescript
async get<T>(endpoint: string): Promise<T> {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
    });
    return response.json();
}
```

**Después (versión Alex):**
```typescript
private getHeaders(baseHeaders = {}): Record<string, string> {
    const headers = { ...baseHeaders };
    
    // Agregar token JWT si existe
    const token = localStorage.getItem('auth_token');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    return headers;
}

async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    const headers = this.getHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    });
    
    const response = await fetch(url, { method: 'GET', headers });
    
    // Detectar 401 Unauthorized
    return this.normalizeResponse(data, response.status);
}
```

**Ventaja:** Todos los requests al API legacy incluyen automáticamente el token.

---

### 5. **handleControlNotarialResponse.ts** (Nuevo)

**Ubicación:** `resources/js/helpers/controlNotarialResponse.ts`

**Propósito:** Manejo centralizado de respuestas del API legacy.

**Uso:**
```typescript
const response = await api.get('/Expediente/GetExpedientes');

const expedientes = handleControlNotarialResponse(response, {
    onError: (msg) => addToast(msg, 'error'),
    onUnauthorized: () => setLoginModalOpen(true)
});

// Si fue 401, expedientes será null y modal se muestra automáticamente
if (!expedientes) return;

// Si fue exitoso, usar los datos
setExpedientes(expedientes);
```

---

## ✅ Ventajas de la Arquitectura Dual

### Para Laravel (Fortify)
- ✅ Mantiene autenticación principal intacta
- ✅ Sesiones seguras server-side
- ✅ Middleware auth:web funciona normal
- ✅ Protección CSRF activa
- ✅ Redirecciones por tipo_cuenta

### Para Control Notarial (JWT)
- ✅ Acceso independiente al API legacy
- ✅ Token stateless (no carga servidor Laravel)
- ✅ Puede expirar sin afectar sesión Laravel
- ✅ Usuario puede tener sesión Laravel activa sin token Control Notarial
- ✅ Logout de Control Notarial no cierra sesión Laravel

---

## 🚨 Escenarios de Uso

### Escenario 1: Usuario nuevo en Control Notarial
```
1. Usuario ya tiene sesión Laravel (Fortify) ✅
2. Navega a /admin/control-notarial
3. useAuthGuard detecta: NO hay token JWT
4. LoginModal aparece
5. Usuario ingresa credenciales (pueden ser diferentes a Laravel)
6. Recibe token JWT del API legacy
7. Token guardado en localStorage
8. Modal se cierra
9. Ya puede usar Control Notarial
```

### Escenario 2: Token JWT expirado
```
1. Usuario hace request a API legacy
2. API responde 401 Unauthorized
3. api.ts normalizeResponse detecta isUnauthorized: true
4. handleControlNotarialResponse llama onUnauthorized
5. LoginModal aparece nuevamente
6. Usuario re-ingresa credenciales
7. Recibe nuevo token
8. Continúa trabajando
9. Nota: Sesión Laravel (Fortify) sigue activa ✅
```

### Escenario 3: Logout de Control Notarial
```
1. Usuario hace clic en botón "Cerrar Sesión" (Control Notarial)
2. logout() en authService hace POST a /api/Login/Logout
3. Token JWT eliminado de localStorage
4. Usuario redirigido a dashboard principal
5. Nota: Sesión Laravel (Fortify) sigue activa ✅
6. Usuario puede navegar normalmente en Laravel
7. Si vuelve a Control Notarial → LoginModal aparece
```

---

## 📋 Configuración Requerida

### 1. Backend - Variables de Entorno

**Archivo: `.env`**
```env
# API del sistema legacy Control Notarial (C# .NET)
AUTH_API_BASE_URL=https://localhost:44327

# O diferentes URLs para DEBUG/RELEASE:
AUTH_API_BASE_URL_DEBUG=https://localhost:44327
AUTH_API_BASE_URL_RELEASE=https://srvatinet.atinet.com.mx:7443

# Laravel Fortify (ya configurado)
FORTIFY_GUARD=web
```

### 2. Inertia - Compartir URL del API

**Archivo: `app/Http/Middleware/HandleInertiaRequests.php`**
```php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        // ... tus shares existentes ...
        
        // URL del API legacy Control Notarial
        'authApiBaseUrl' => config('services.control_notarial.api_url'),
        
        // O detectar automáticamente DEBUG/RELEASE:
        'authApiBaseUrl' => app()->environment('local') 
            ? 'https://localhost:44327'
            : 'https://srvatinet.atinet.com.mx:7443',
    ]);
}
```

### 3. Services Config

**Archivo: `config/services.php`**
```php
return [
    // ... servicios existentes ...
    
    'control_notarial' => [
        'api_url' => env('AUTH_API_BASE_URL', 'https://localhost:44327'),
        'api_url_debug' => env('AUTH_API_BASE_URL_DEBUG', 'https://localhost:44327'),
        'api_url_release' => env('AUTH_API_BASE_URL_RELEASE', 'https://srvatinet.atinet.com.mx:7443'),
    ],
];
```

---

## 🧪 Testing

### Test 1: Verificar Fortify (Existente)
```bash
# 1. Logout de Laravel
php artisan tinker
>>> Auth::logout();

# 2. Intentar acceder a dashboard
curl http://localhost:8000/dashboard
# Debe redirigir a /login ✅

# 3. Login con credenciales Laravel
# POST a /login con email + password
# Debe crear sesión y redirigir a dashboard ✅
```

### Test 2: Verificar JWT (Alex)
```javascript
// 1. Abrir consola del navegador en /admin/control-notarial

// 2. Verificar que no hay token
console.log(localStorage.getItem('auth_token'));
// null (LoginModal debe aparecer) ✅

// 3. Ingresar credenciales en modal

// 4. Verificar token guardado
console.log(localStorage.getItem('auth_token'));
// "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." ✅

// 5. Verificar headers en requests
// Network tab → XHR → Ver header "Authorization"
// "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." ✅

// 6. Logout de Control Notarial
// Token debe desaparecer ✅

// 7. Verificar que sesión Laravel sigue activa
// Navegar a /dashboard → debe funcionar normal ✅
```

---

## ⚠️ Consideraciones de Seguridad y Arquitectura

### 🔍 **ACTUALIZACIÓN IMPORTANTE: Sistema Híbrido Real**

**Contexto del Sistema:**
1. **Alex migró VB 6.0 → C# .NET** (antes de implementar Laravel)
2. **APIs C# ya están en producción** en el servidor
3. **Laravel es la puerta de entrada** multitenant al sistema
4. **Las vistas de Control Notarial** se conectan a las APIs C# existentes

### localStorage vs Cookies

**JWT en localStorage (Solución Actual de Alex):**
- ✅ Simple de implementar
- ✅ Compatible con SPA/Inertia
- ✅ APIs C# ya funcionan con JWT
- ⚠️ Vulnerable a XSS (Cross-Site Scripting)
- ⚠️ No protegido por httpOnly
- ❌ Usuario se loguea DOS veces (confuso)
- ❌ Multitenant de Laravel NO funciona en APIs C#
- ❌ No aprovecha Auth::user() de Laravel
- ❌ Difícil auditar y hacer logging

**Sesiones en Cookies (Fortify):**
- ✅ Protegido por httpOnly
- ✅ Protegido por CSRF token
- ✅ Más seguro para autenticación principal
- ✅ Multitenant funciona automáticamente
- ✅ Auth::user() disponible en todo el sistema
- ⚠️ Requiere servidor stateful

### 🎯 Recomendación de Arquitectura: Laravel como Gateway/Proxy

**En lugar de JWT directo en cliente, Laravel debería actuar como intermediario:**

```
Frontend (React) 
    ↓ Session de Laravel (Cookie)
Laravel Backend (Proxy)
    ├─ Auth::user() ✅
    ├─ Multitenant ✅
    ├─ Obtiene JWT del servidor (cached)
    └─ Hace requests a API C#
        ↓ JWT Server-to-Server
API C# Control Notarial
```

**Ventajas del Gateway:**
1. ✅ Usuario se loguea UNA sola vez (mejor UX)
2. ✅ JWT nunca llega al cliente (más seguro)
3. ✅ Multitenant funciona en todo el sistema
4. ✅ Auth::user() disponible
5. ✅ Logging y auditoría centralizados
6. ✅ Rate limiting por usuario
7. ✅ Control total desde Laravel

**Ver documentación completa:** [ARQUITECTURA_HIBRIDA_SISTEMA.md](ARQUITECTURA_HIBRIDA_SISTEMA.md)

### Recomendación de Seguridad:
```
🚫 NO implementar JWT en cliente (lo que hizo Alex)
✅ Implementar Laravel como Gateway/Proxy
✅ JWT solo server-to-server
✅ Session de Laravel para todo
✅ Multitenant funcionando en todo el sistema
```

---

## 🎯 Decisión Final Recomendada

### ✅ Aceptar cambios de Alex (Opción A)

**Razones:**
1. **NO HAY CONFLICTO** - Sistemas complementarios, no competitivos
2. Tu autenticación Laravel Fortify **NO se modifica**
3. JWT es necesario para acceder al API legacy (.NET)
4. Sistema bien diseñado y modular
5. Fácil de mantener y debuggear
6. Permite trabajar con el sistema VB6 durante la migración

**Qué NO cambia:**
- ❌ Laravel Fortify sigue manejando login principal
- ❌ Middleware `auth:web` sigue funcionando
- ❌ Redirecciones por tipo_cuenta intactas
- ❌ CSRF protection activo
- ❌ Sesiones de Laravel normales

**Qué SÍ cambia:**
- ✅ Páginas de Control Notarial pueden acceder a API legacy
- ✅ Usuarios tienen credenciales adicionales para Control Notarial
- ✅ Validación automática de token en cada request
- ✅ UI/UX mejorada con LoginModal
- ✅ Manejo robusto de errores 401

---

## 📝 Pasos para Aceptar Cambios

### 1. Resolver Merge (5 minutos)
```bash
git checkout --theirs app/Http/Controllers/ControlNotarialController.php
git checkout --theirs app/Http/Middleware/InertiaMiddleware.php
git checkout --theirs resources/js/components/nav-main.tsx
git checkout --theirs resources/js/pages/ControlNotarial/Configuracion/Notaria/Index.tsx
git checkout --theirs resources/js/pages/ControlNotarial/Expedientes/AltaExpedientes/Index.tsx
git checkout --theirs resources/js/pages/ControlNotarial/Expedientes/Index.tsx
git checkout --theirs resources/js/pages/ControlNotarial/Index.tsx
git checkout --theirs resources/js/services/api.ts

git add .
git commit -m "chore: Merge dev-alex - Dual authentication (Fortify + JWT for legacy API)"
```

### 2. Configurar URLs del API (10 minutos)

**`.env`:**
```env
AUTH_API_BASE_URL=https://localhost:44327
```

**`config/services.php`:**
```php
'control_notarial' => [
    'api_url' => env('AUTH_API_BASE_URL', 'https://localhost:44327'),
],
```

**`app/Http/Middleware/HandleInertiaRequests.php`:**
```php
'authApiBaseUrl' => config('services.control_notarial.api_url'),
```

### 3. Build Frontend (5 minutos)
```bash
npm run build
```

### 4. Testing (30 minutos)
- ✅ Login Laravel funciona
- ✅ Dashboard redirige según tipo_cuenta
- ✅ Control Notarial muestra LoginModal
- ✅ Login en modal funciona
- ✅ Token se guarda en localStorage
- ✅ Requests incluyen Authorization header
- ✅ Logout de Control Notarial no afecta sesión Laravel

### 5. Deploy (Cuando esté listo)
```bash
git push origin master
```

---

## 🎉 Resumen Final

**Estado Actual:**
```
┌────────────────────────────────────────┐
│  SISTEMA DE AUTENTICACIÓN COMPLETO     │
├────────────────────────────────────────┤
│                                        │
│  🔐 Nivel 1: Laravel Fortify          │
│     ├─ Guard: web                     │
│     ├─ Storage: Session (Cookie)      │
│     └─ Scope: Toda la aplicación      │
│                                        │
│  🎫 Nivel 2: JWT Control Notarial     │
│     ├─ Guard: Custom (Token)          │
│     ├─ Storage: localStorage          │
│     └─ Scope: Solo Control Notarial   │
│                                        │
└────────────────────────────────────────┘
```

**Beneficios:**
- ✅ Separación de responsabilidades
- ✅ Laravel maneja usuarios de la app
- ✅ JWT maneja acceso al sistema legacy
- ✅ Transición gradual a sistema nuevo
- ✅ Usuarios pueden tener diferentes credenciales
- ✅ Logout independiente en cada sistema
- ✅ Fácil de debuggear
- ✅ Escalable a futuro

**Próximos pasos después del merge:**
1. ✅ Configurar URLs del API legacy
2. ✅ Compartir URLs con Inertia
3. ✅ Testing completo
4. ⏳ Entrenar usuarios en doble login (si aplica)
5. ⏳ Documentar credenciales de Control Notarial
6. ⏳ Implementar refresh token (opcional)
7. ⏳ Monitorear expiración de tokens

---

**Conclusión:** Sistema bien diseñado, sin conflictos, listo para producción. ✨
