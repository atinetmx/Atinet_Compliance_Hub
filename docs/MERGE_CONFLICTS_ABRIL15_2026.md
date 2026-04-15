# 🔀 Guía de Resolución de Conflictos - Merge Alex (dev-alex)

**Fecha:** 15 de Abril, 2026  
**Branch Origen:** dev-alex (Alex)  
**Branch Destino:** master (Tu trabajo)  
**Archivos en Conflicto:** 8

---

## ⚠️ IMPORTANTE: Sistema Híbrido - Decisión Arquitectónica

**🔍 Contexto Descubierto:**

Alex implementó **JWT para conectar con API C# existente** (VB6 migrado a C# antes de Laravel).

```
✅ Sistema Híbrido Confirmado

Laravel (Puerta de Entrada)         API C# Control Notarial (Alex)
├─ Autenticación: Fortify          ├─ Autenticación: JWT
├─ Guard: 'web' (session)          ├─ Storage: localStorage  
├─ Multitenant: ✅                 ├─ Base datos: Separada
├─ Servicios: Web, búsquedas       ├─ APIs: Swagger tested ✅
└─ Backend: Laravel (PHP)          └─ URL: srvatinet.com.mx:7443

Arquitectura:
- 🚪 Laravel = Puerta de entrada + servicios web
- 🎫 API C# = Control Notarial (ya en producción)
```

### 🚨 Problema Identificado

**Con el sistema actual de Alex (JWT en cliente):**
```
❌ Usuario se loguea DOS veces (confuso)
❌ JWT expuesto en localStorage (menos seguro)
❌ Multitenant NO funciona en Control Notarial
❌ Auth::user() NO disponible en APIs C#
❌ Difícil auditar y hacer logging
```

### ✅ Solución Propuesta: Laravel como Gateway/Proxy

**En lugar de JWT directo, Laravel actúa como intermediario:**
```
Frontend (React)
    ↓ Session de Laravel (Cookie) - UN solo login
Laravel Backend (Proxy)
    ├─ Auth::user() ✅
    ├─ Multitenant ✅
    ├─ Obtiene JWT del servidor (cached)
    └─ Hace requests a API C#
        ↓ JWT Server-to-Server
API C# Control Notarial
```

**📖 Documentación completa:** Ver [ARQUITECTURA_HIBRIDA_SISTEMA.md](ARQUITECTURA_HIBRIDA_SISTEMA.md)

---

## 🎯 DOS OPCIONES DISPONIBLES

### **Opción A: Aceptar Merge de Alex (Rápido - 1 hora)**

✅ **Ventajas:**
- Rápido de implementar (1 hora)
- APIs C# ya funcionan
- Control Notarial operativo YA
- Continúas con normalización

❌ **Desventajas:**
- Doble login (UX confusa)
- JWT en localStorage (menos seguro)
- Multitenant NO funciona
- Auth::user() NO disponible

**Cuándo elegir:** Necesitas Control Notarial funcionando YA y puedes vivir con doble login temporalmente.

---

### **Opción B: Laravel Gateway (Recomendado - 2 semanas)**

✅ **Ventajas:**
- UN solo login (mejor UX)
- JWT solo server-side (más seguro)
- Multitenant en TODO el sistema
- Auth::user() disponible
- Logging centralizado
- Arquitectura correcta

❌ **Desventajas:**
- Requiere 2 semanas desarrollo
- Refactorizar frontend
- Latencia adicional (+50-100ms)

**Cuándo elegir:** Quieres arquitectura correcta, multitenant es crítico, tienes 2 semanas disponibles.

---

### 💡 Mi Recomendación Profesional

**Enfoque Híbrido (Best of Both Worlds):**

1. **AHORA (1 hora):** Acepta merge de Alex → Sistema funciona con doble login
2. **DESPUÉS (2 semanas):** Implementa Laravel Gateway → Unifica autenticación

**Justificación:**
- No bloquea tu trabajo actual (normalización)
- Alex no pierde su trabajo
- Tiempo para implementar arquitectura correcta
- Sistema funciona mientras migras

---

## 📊 Resumen Ejecutivo

**Estado del Merge:**
```bash
Auto-merging app/Http/Controllers/ControlNotarialController.php
CONFLICT (content): Merge conflict in app/Http/Controllers/ControlNotarialController.php

Auto-merging app/Http/Middleware/InertiaMiddleware.php
CONFLICT (add/add): Merge conflict in app/Http/Middleware/InertiaMiddleware.php

Auto-merging resources/js/components/nav-main.tsx
CONFLICT (content): Merge conflict in resources/js/components/nav-main.tsx

Auto-merging resources/js/pages/ControlNotarial/Configuracion/Notaria/Index.tsx
CONFLICT (add/add): Merge conflict in resources/js/pages/ControlNotarial/Configuracion/Notaria/Index.tsx

Auto-merging resources/js/pages/ControlNotarial/Expedientes/AltaExpedientes/Index.tsx
CONFLICT (add/add): Merge conflict in resources/js/pages/ControlNotarial/Expedientes/AltaExpedientes/Index.tsx

Auto-merging resources/js/pages/ControlNotarial/Expedientes/Index.tsx
CONFLICT (content): Merge conflict in resources/js/pages/ControlNotarial/Expedientes/Index.tsx

Auto-merging resources/js/pages/ControlNotarial/Index.tsx
CONFLICT (content): Merge conflict in resources/js/pages/ControlNotarial/Index.tsx

Auto-merging resources/js/services/api.ts
CONFLICT (add/add): Merge conflict in resources/js/services/api.ts
```

---

## 🎯 Cambios de Alex (dev-alex)

### ✨ Nuevas Funcionalidades

**1. Sistema de Autenticación JWT**
- 🔐 JWT token en localStorage
- 🪝 `useAuthGuard` hook personalizado
- 📝 `LoginModal` component
- 🔄 Refresh token automático
- 🚪 Logout funcionalidad

**2. Manejo de Respuestas API Centralizado**
- ✅ `handleControlNotarialResponse` helper
- 📡 Normalización de respuestas (`ApiResponse<T>`)
- ⚠️ Detección automática de 401 Unauthorized
- 🔔 Toast notifications integradas

**3. UI/UX Mejoradas**
- 🎨 Gradientes modernos (from-X-50 to-X-100)
- 🖼️ Cards con shadow hover effects
- 🎯 Mejores tooltips y feedback visual
- 📱 Responsive design mejorado

**4. Validaciones Mejoradas**
- ✅ Validación de número de escritura con debounce
- 🔍 Búsqueda de clientes en modal
- ⏱️ Loading states en todas las operaciones
- 🚫 Prevención de duplicados

**5. Control Notarial Enhancements**
- 📑 Tabs internas con navegación mejorada
- 🔄 Update de expedientes (antes solo create)
- 👥 Modal de búsqueda de clientes para comparecientes
- 📊 Mejor visualización de operaciones múltiples

---

## 🛠️ Estrategia de Resolución

### Opción A: Aceptar TODO de Alex (Recomendado ⭐)

**Ventajas:**
- ✅ Sistema de autenticación completo
- ✅ UI/UX moderna y profesional
- ✅ Manejo robusto de errores
- ✅ Validaciones en tiempo real
- ✅ Menos bugs futuros

**Desventajas:**
- ⚠️ Necesitas configurar JWT en backend
- ⚠️ Testing adicional requerido
- ⚠️ Cambios significativos en flujo

**Comandos:**
```bash
# Aceptar todos los cambios de Alex
git checkout --theirs app/Http/Controllers/ControlNotarialController.php
git checkout --theirs app/Http/Middleware/InertiaMiddleware.php
git checkout --theirs resources/js/components/nav-main.tsx
git checkout --theirs resources/js/pages/ControlNotarial/Configuracion/Notaria/Index.tsx
git checkout --theirs resources/js/pages/ControlNotarial/Expedientes/AltaExpedientes/Index.tsx
git checkout --theirs resources/js/pages/ControlNotarial/Expedientes/Index.tsx
git checkout --theirs resources/js/pages/ControlNotarial/Index.tsx
git checkout --theirs resources/js/services/api.ts

# Marcar como resueltos
git add app/Http/Controllers/ControlNotarialController.php
git add app/Http/Middleware/InertiaMiddleware.php
git add resources/js/components/nav-main.tsx
git add resources/js/pages/ControlNotarial/Configuracion/Notaria/Index.tsx
git add resources/js/pages/ControlNotarial/Expedientes/AltaExpedientes/Index.tsx
git add resources/js/pages/ControlNotarial/Expedientes/Index.tsx
git add resources/js/pages/ControlNotarial/Index.tsx
git add resources/js/services/api.ts

# Commit del merge
git commit -m "chore: Merge dev-alex - Accept all Alex changes (JWT auth, UI improvements, validations)"
```

---

### Opción B: Aceptar TODO Tuyo (No Recomendado ❌)

**Ventajas:**
- ✅ Mantiene tu trabajo intacto
- ✅ Sin cambios de autenticación

**Desventajas:**
- ❌ Pierdes sistema de autenticación
- ❌ UI/UX menos moderna
- ❌ Sin validaciones mejoradas
- ❌ Alex tendrá que rehacer trabajo

**Comandos:**
```bash
# Aceptar todos TUS cambios (NO RECOMENDADO)
git checkout --ours app/Http/Controllers/ControlNotarialController.php
git checkout --ours app/Http/Middleware/InertiaMiddleware.php
# ... (resto de archivos)
```

---

### Opción C: Merge Manual (Avanzado 🧙)

Resolver conflicto por conflicto usando herramientas:
```bash
# Usar VS Code Merge Editor
code --merge resources/js/services/api.ts resources/js/services/api.ts resources/js/services/api.ts output.ts
```

O con herramienta visual:
```bash
# GitKraken, SourceTree, etc.
```

---

## 📋 Checklist Post-Merge

**Si elegiste Opción A (Alex):**

### ⚠️ IMPORTANTE: NO necesitas instalar JWT en Laravel

El sistema de Alex usa JWT **solo para el API externo** (.NET). Tu Laravel Fortify sigue manejando la autenticación principal.

### 1. Configurar URLs del API Legacy (~10 minutos)

**Archivo: `.env`**
```env
# URL del API de Control Notarial (sistema legacy .NET)
AUTH_API_BASE_URL=https://localhost:44327

# En producción, ajustar a:
# AUTH_API_BASE_URL=https://srvatinet.atinet.com.mx:7443
```

**Archivo: `config/services.php`**
```php
return [
    // ... servicios existentes ...
    
    'control_notarial' => [
        'api_url' => env('AUTH_API_BASE_URL', 'https://localhost:44327'),
    ],
];
```

**Archivo: `app/Http/Middleware/HandleInertiaRequests.php`**
```php
public function share(Request $request): array
{
    return array_merge(parent::share($request), [
        // ... tus shares existentes ...
        
        // URL del API legacy Control Notarial
        'authApiBaseUrl' => config('services.control_notarial.api_url'),
    ]);
}
```

### 2. Verificar que Archivos Helper Existen

Alex ya creó estos archivos. Solo verifica que existan:

✅ `resources/js/services/authService.ts` (maneja JWT del API legacy)
✅ `resources/js/hooks/useAuthGuard.ts` (valida token en páginas)
✅ `resources/js/helpers/controlNotarialResponse.ts` (maneja respuestas)
✅ `resources/js/components/Modals/LoginModal.tsx` (modal de login)

**Si faltan, cópialos desde la rama de Alex:**
```bash
# Ver archivos en dev-alex
git show origin/dev-alex:resources/js/services/authService.ts > resources/js/services/authService.ts
git show origin/dev-alex:resources/js/hooks/useAuthGuard.ts > resources/js/hooks/useAuthGuard.ts
git show origin/dev-alex:resources/js/helpers/controlNotarialResponse.ts > resources/js/helpers/controlNotarialResponse.ts
git show origin/dev-alex:resources/js/components/Modals/LoginModal.tsx > resources/js/components/Modals/LoginModal.tsx
```

**Tests Esenciales:**
```bash
# Backend
php artisan test --filter=AuthControllerTest

# Frontend (manual)
1. ✅ Modal de login aparece en /admin/control-notarial
2. ✅ Login con credenciales correctas
3. ✅ Token guardado en localStorage
4. ✅ Requests incluyen Authorization header
5. ✅ 401 muestra modal de login
6. ✅ Logout limpia token
```

### 5. Deploy a Producción

**Pasos:**
```bash
# 1. Finalizar merge
git commit -m "chore: Merge dev-alex with JWT authentication system"

# 2. Push a master
git push origin master

# 3. Servidor - Pull cambios
git pull origin master

# 4. Instalar dependencias
composer install --no-dev --optimize-autoloader
npm install && npm run build

# 5. Ejecutar migraciones (si hay nuevas)
php artisan migrate --force

# 6. Limpiar caches
php artisan config:cache
php artisan route:cache
php artisan view:cache

# 7. Reiniciar servicios
# IIS: Restart Application Pool
# Nginx: sudo systemctl restart nginx
# Apache: sudo systemctl restart apache2
```

---

## 🚨 Problemas Comunes Post-Merge

### Error: "auth_token is not defined"
**Solución:**
```typescript
// En todas las páginas de Control Notarial:
import LoginModal from '@/components/Modals/LoginModal';

const [loginModalOpen, setLoginModalOpen] = useState(false);

useAuthGuard({
    onUnauthorized: () => setLoginModalOpen(true),
});

return (
    <>
        {/* ... tu contenido ... */}
        <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
);
```

### Error: "JWT secret not set"
**Solución:**
```bash
php artisan jwt:secret
```

### Error: "401 Unauthorized" en todas las requests
**Solución:**
```typescript
// Verificar que el token se está guardando:
console.log('Token:', localStorage.getItem('auth_token'));

// Verificar headers en requests:
console.log('Headers:', response.headers);
```

### Error: "CORS policy" en login
**Solución (config/cors.php):**
```php
'paths' => ['api/*', 'auth/*'],
'allowed_methods' => ['*'],
'allowed_origins' => ['*'], // En producción, especificar dominio
'allowed_headers' => ['*'],
'supports_credentials' => true,
```

---

## 📊 Impacto en Trabajo de Normalización

**✅ NO HAY CONFLICTOS CON:**
- Migraciones (11 archivos)
- Seeders (CatalogosGeografiaSeeder, CatalogosNegocioSeeder)
- Documentación de avance
- Scripts Python de análisis

**🎯 Tu trabajo de normalización está intacto:**
```
✅ database/migrations/*
✅ database/seeders/*
✅ docs/AVANCE_NORMALIZACION_ABRIL_2026.md
✅ ANALISIS_CAMPOS_UTILES_CRM.txt
✅ RESUMEN_NORMALIZACION_FASE1.md
✅ analizar_*.py (scripts Python)
```

**🔄 Cambios de Alex solo afectan:**
- Frontend de Control Notarial
- Sistema de autenticación
- API service layer

**No necesitas rehacer nada de la normalización ✨**

---

## 📝 Recomendación Final

### Opción A (Aceptar Alex) ⭐⭐⭐⭐⭐

**Razones:**
1. Sistema de autenticación es **esencial** para producción
2. UI/UX mejoradas aumentan satisfacción del usuario
3. Validaciones previenen errores de datos
4. Manejo robusto de errores reduce bugs
5. Alex ha invertido **significativo tiempo** en estos cambios
6. Tu trabajo de normalización **NO se pierde**

**Tiempo Estimado (Actualizado):**
- Resolver merge: **5 minutos** (comandos automáticos)
- Configurar URLs del API legacy: **10 minutos** (solo .env y config)
- Verificar archivos helper existen: **5 minutos**
- Testing: **30 minutos**
- **TOTAL: ~50 minutos** ✨ (Más rápido porque NO necesitas JWT en Laravel)

**Ejecutar ahora:**
```bash
# Pasos rápidos (copiar y pegar):
git checkout --theirs app/Http/Controllers/ControlNotarialController.php app/Http/Middleware/InertiaMiddleware.php resources/js/components/nav-main.tsx resources/js/pages/ControlNotarial/Configuracion/Notaria/Index.tsx resources/js/pages/ControlNotarial/Expedientes/AltaExpedientes/Index.tsx resources/js/pages/ControlNotarial/Expedientes/Index.tsx resources/js/pages/ControlNotarial/Index.tsx resources/js/services/api.ts

git add .

git commit -m "chore: Merge dev-alex - Dual auth (Fortify + JWT for legacy API)

- Add JWT authentication for Control Notarial legacy API (.NET)
- Fortify authentication remains unchanged for Laravel app
- Add LoginModal for Control Notarial module
- Add useAuthGuard hook for token validation
- Centralize API response handling with handleControlNotarialResponse
- Improve UI/UX with modern gradients and hover effects
- Add número escritura validation with debounce
- Add cliente search modal for comparecientes
- Enable expediente update (was create-only)
- All normalization work (migrations, seeders, docs) preserved

IMPORTANT: This implements DUAL authentication:
- Laravel Fortify (session/cookie) for main app
- JWT (localStorage) for Control Notarial legacy API only
See docs/ANALISIS_AUTENTICACION_DUAL.md for details"

# Ya puedes hacer push:
git push origin master
```

---

## 🎉 Siguiente Paso

Después del merge exitoso:
1. ✅ Documentación de avance lista → **Enviar al equipo**
2. ✅ Catálogos poblados (73k registros) → **Validar en producción**
3. ⏳ Configurar URLs del API legacy (.env + config)
4. ⏳ Testing de autenticación dual
5. ⏳ Migrar datos VB → Laravel
6. ⏳ Implementar Fase 1 features

**Todo el trabajo de normalización está completo y documentado ✨**
