## 🔧 Solución al Error 419 CSRF

### El Problema
Tu navegador guarda una cookie con un ID de sesión que YA NO EXISTE en la base de datos (la limpiamos). Por eso Laravel rechaza el token CSRF.

### Solución (3 opciones):

#### ✅ Opción 1: Limpiar Cookies (RECOMENDADO)
1. Abre DevTools (F12)
2. Ve a **Application** (o **Almacenamiento**)
3. En el menú izquierdo: **Cookies** → `http://127.0.0.1:8000`
4. Haz clic derecho → **Clear** (Limpiar todo)
5. Recarga la página (F5)
6. Haz login nuevamente

#### ✅ Opción 2: Modo Incógnito
1. Cierra TODAS las ventanas del navegador actual
2. Abre una ventana de incógnito (Ctrl+Shift+N en Chrome)
3. Ve a http://127.0.0.1:8000/login
4. Haz login con admin@atinet.mx / password123

#### ✅ Opción 3: Reiniciar Navegador
1. Cierra COMPLETAMENTE el navegador (todas las ventanas)
2. Espera 5 segundos
3. Abre nuevamente
4. Ve a http://127.0.0.1:8000/login

---

### ⚙️ Ahora reinicia el servidor de desarrollo:

```powershell
composer run dev
```

Esto iniciará:
- PHP Server en http://127.0.0.1:8000
- Vite en http://localhost:5173 (hot reload)
- Queue listener

Después de limpiar las cookies y reiniciar el servidor, el error 419 desaparecerá.
