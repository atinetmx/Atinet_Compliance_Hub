# API Centralization Documentation

## Overview

This document outlines the centralized API configuration system implemented for the Atinet Compliance Hub application. This system allows seamless switching between development and production APIs without modifying component code.

## Architecture

### Components

1. **Config File** (`config/api.php`)
   - Defines the API base URL from environment variables
   - Default: `https://localhost:44327/api` (development)
   - Production: `http://api.atinet.com.mx:5000/api`

2. **Middleware** (`app/Http/Middleware/HandleInertiaRequests.php`)
   - Shares `apiBaseUrl` to all Inertia components via props
   - Automatically makes the URL available to React components

3. **API Service** (`resources/js/services/api.ts`)
   - `ApiService` class with methods: `get()`, `post()`, `put()`, `delete()`
   - `useApi()` React hook that retrieves the base URL from Inertia props
   - Handles JSON serialization and error responses
   - All methods return response structure: `{dataResponse?: T, message?: string}`

4. **Vite Configuration** (`vite.config.ts`)
   - Defines path alias `@` → `resources/js`
   - Enables `import { useApi } from '@/services/api'`

5. **TypeScript Configuration** (`tsconfig.json`)
   - Configures TypeScript path mapping for the `@` alias

## Environment Configuration

### Development

**.env** (local development):
```env
API_BASE_URL=https://localhost:44327/api
```

### Production

**.env.production** (to be created):
```env
API_BASE_URL=http://api.atinet.com.mx:5000/api
```

## Usage

### In React Components

```tsx
import { useApi } from '@/services/api';

export default function MyComponent() {
    const api = useApi();

    // GET request
    const data = await api.get('/Catalogos/GetOperaciones');

    // POST request
    const result = await api.post('/User/CreateUsuario', { name: 'John' });

    // PUT request
    const updated = await api.put(`/User/UpdateUsuario?usuarioId=${id}`, payload);

    // DELETE request
    const deleted = await api.delete(`/Catalogos/DeleteOperacion?id=${id}`);

    // Handle responses
    if (data && data.dataResponse) {
        // Success
    } else {
        // Error
    }
}
```

## Refactored Components

The following components have been refactored to use the centralized API service:

1. ✅ **AltaExpedientes/Index.tsx** - 23 endpoints refactored
2. ✅ **Clientes/Index.tsx** - 3 endpoints refactored
3. ✅ **AltaCatalogos/Index.tsx** - 1 endpoint refactored
4. ✅ **Notaria/Index.tsx** - 3 endpoints refactored
5. ✅ **ReporteUsuarios/Index.tsx** - 1 endpoint refactored
6. ✅ **Usuarios/Index.tsx** - 4 endpoints refactored
7. ✅ **ConfiguracionOperaciones/Index.tsx** - 6 endpoints refactored

### Total Endpoints Refactored
- **41 hardcoded API URLs** → **Dynamic service calls**

## Migration Pattern

### Before (Old Pattern)
```tsx
const response = await fetch('https://localhost:44327/api/Catalogos/GetOperaciones', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
});
const data = await response.json();
if (response.ok && data.dataResponse) {
    // handle success
}
```

### After (New Pattern)
```tsx
const api = useApi();
const data = await api.get('/Catalogos/GetOperaciones');
if (data && data.dataResponse) {
    // handle success
}
```

## Deployment Instructions

### Local/Development Setup
1. Ensure `.env` has:
   ```
   API_BASE_URL=https://localhost:44327/api
   ```
2. Start development servers (Laravel and API)
3. Run: `npm run dev` or `composer run dev`

### Production Deployment
1. Create/update `.env.production`:
   ```
   API_BASE_URL=http://api.atinet.com.mx:5000/api
   ```
2. Deploy application
3. No component code changes needed - configuration change only

## Benefits

✅ **Single source of truth** - API URL configured in one place  
✅ **Environment-aware** - Automatically switches based on `.env`  
✅ **No code changes needed** - Update `.env` to switch environments  
✅ **Type-safe** - Full TypeScript support  
✅ **Consistent error handling** - Centralized response validation  
✅ **Reduced duplication** - No hardcoded URLs scattered across components  
✅ **Easier maintenance** - Future API changes require minimal modifications  

## Troubleshooting

### Module Import Errors
If you see "Cannot find module '@/services/api'":
1. Ensure `resources/js/services/api.ts` exists
2. Run: `npm run build` or `npm run dev`
3. Clear cache: `rm -rf node_modules/.vite`

### API Not Responding
1. Verify `API_BASE_URL` in `.env`
2. Check that the backend API service is running
3. Verify network connectivity and CORS settings

### Response Errors
- Always check for `data && data.dataResponse` before accessing response data
- API service automatically handles JSON parsing
- Empty or non-JSON responses are handled gracefully

## Future Enhancements

- [ ] Add request/response interceptors
- [ ] Add retry logic for failed requests
- [ ] Add request timeout configuration
- [ ] Add authentication header injection
- [ ] Add request logging/debugging
