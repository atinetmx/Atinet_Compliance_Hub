# Guía: Ejecutar Office Add-in Localmente

## Opción 1: Servir desde Laravel (RECOMENDADO)

### Paso 1: Copiar archivos a Laravel

```bash
# Desde tu proyecto Laravel
cp -r d:\Users\PC-Developer\Documents\SCN_Web\word-addon\* public\word-addon\
```

O manualmente:
```
Atinet_Compliance_Hub/
└── public/
    └── word-addon/
        ├── manifest.xml
        ├── taskpane.html
        ├── taskpane.css
        └── taskpane.js
```

### Paso 2: Iniciar servidor Laravel

```bash
cd d:\Users\PC-Developer\Documents\SCN_Web\Atinet_Compliance_Hub
php artisan serve
```

Esto levanta en: `http://localhost:8000`

### Paso 3: Verificar acceso

Abre en navegador y confirma que funciona:
```
http://localhost:8000/word-addon/manifest.xml
http://localhost:8000/word-addon/taskpane.html
```

---

## Opción 2: Servidor HTTP independiente

Si prefieres servir solo el add-in desde otra carpeta:

```bash
cd d:\Users\PC-Developer\Documents\SCN_Web\word-addon

# Con Python (si tienes instalado)
python -m http.server 8001

# O con Node.js
npx http-server -p 8001
```

Luego actualizar `manifest.xml`:
```xml
<bt:Url id="taskpane" DefaultValue="http://localhost:8001/taskpane.html"/>
```

---

## Paso 4: Instalar en Word Desktop

1. **Abrir Word Desktop** (no Word Online)
2. Ir a `Insertar` → `Obtener complementos` → `Mis complementos`
3. Seleccionar `Administrar mis complementos`
4. Hacer clic en botón `+`
5. Ingresar: `http://localhost:8000/word-addon/manifest.xml`
6. Hacer clic en `Cargar`

El panel debe aparecer en `Inicio` → sección `Atinet`

---

## Paso 5: Crear endpoint en Laravel (SI NO EXISTE)

Agregar a `routes/api.php`:

```php
<?php

use Illuminate\Support\Facades\Route;
use App\Models\Marcador;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/Marcadores/GetMarcadores', function () {
        return Marcador::all(['id', 'marcador', 'descripcion', 'tipo', 'ejemplo']);
    });
    
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
```

O si prefieres sin autenticación (solo desarrollo):

```php
Route::get('/Marcadores/GetMarcadores', function () {
    return Marcador::all(['id', 'marcador', 'descripcion', 'tipo', 'ejemplo']);
});
```

---

## Troubleshooting Local

### Error: "No se puede cargar manifest.xml"

**Causa:** URL incorrecto o servidor no está corriendo

**Solución:**
```bash
# Verificar que servidor Laravel está activo
php artisan serve

# Probar URL en navegador
http://localhost:8000/word-addon/manifest.xml
# Debe descargar el archivo XML
```

### Error: "CORS error" o "blocked by CORS policy"

**Causa:** Navegador bloquea requests desde diferente origen

**Solución en `config/cors.php`:**
```php
'paths' => ['api/*', 'word-addon/*'],
'allowed_origins' => ['*'],
'allow_credentials' => true,
```

O agregar a `routes/api.php`:
```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

### Error: "API no responde" en panel

**Causa:** Endpoint `/api/Marcadores/GetMarcadores` no existe

**Solución:**
1. Verificar que ruta existe en `routes/api.php`
2. Abrir `http://localhost:8000/api/Marcadores/GetMarcadores` en navegador
3. Debe devolver JSON con marcadores

### Word dice "complemento no disponible"

**Solución:**
1. Cerrar Word completamente
2. Reabrirlo
3. Ir a `Inicio` → `Mis complementos`
4. Buscar "Inyector de Marcadores"
5. Si está deshabilitado, click derecho → Habilitar

---

## Desarrollo y debugging

### Ver errores en el panel

Presiona `Ctrl+F12` mientras Word está abierto con el add-in activo:
- Abrirá DevTools
- Puedes ver errores de JavaScript
- Revisar Network tab para requests API

### Recargar cambios

Después de editar `taskpane.html/css/js`:
1. Presionar `F5` en Word
2. O cerrar y reabrira documento

Si cambias `manifest.xml`:
1. Desinstalar complemento
2. Cerrar Word
3. Reinstalar con nueva URL

---

## Checklist para desarrollo local

- [ ] Servidor Laravel corriendo: `php artisan serve`
- [ ] Archivos en `public/word-addon/`
- [ ] URLs en `manifest.xml` usan `http://localhost:8000`
- [ ] API endpoint `/api/Marcadores/GetMarcadores` existe
- [ ] CORS configurado (si es necesario)
- [ ] Word Desktop (no Online)
- [ ] Complemento instalado desde `http://localhost:8000/word-addon/manifest.xml`

---

## Cambiar a producción después

Cuando termines desarrollo y quieras pasar a producción:

1. Cambiar `manifest.xml`:
```xml
<!-- DE -->
<bt:Url id="taskpane" DefaultValue="http://localhost:8000/word-addon/taskpane.html"/>

<!-- A -->
<bt:Url id="taskpane" DefaultValue="https://tu-dominio-real.com/word-addon/taskpane.html"/>
```

2. Cambiar `taskpane.js`:
```javascript
// DE
API_BASE_URL: 'http://localhost:8000',

// A
API_BASE_URL: 'https://tu-dominio-real.com',
```

3. Subir archivos a servidor de producción
4. Los usuarios instalarán desde manifest en producción

---

¿Necesitas ayuda con algún paso específico?
