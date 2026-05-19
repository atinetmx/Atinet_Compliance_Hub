# Office Add-in: Inyector de Marcadores

Panel lateral para Microsoft Word que permite insertar marcadores dinámicos desde Atinet Compliance Hub directamente en documentos Word.

## Características

✅ Seleccionar texto en Word y reemplazarlo con marcadores  
✅ Búsqueda de marcadores en tiempo real  
✅ Autenticación integrada con Atinet Compliance Hub  
✅ Panel lateral (Task Pane) no invasivo  
✅ Compatible con Word Desktop, Web y Mac  

## Archivos

```
word-addon/
├── manifest.xml          # Configuración del Add-in
├── taskpane.html         # Interfaz HTML
├── taskpane.css          # Estilos
├── taskpane.js           # Lógica principal
└── README.md             # Este archivo
```

## Instalación y Configuración

### Paso 1: Actualizar manifest.xml

Editar `manifest.xml` y reemplazar:
- `your-app-domain.com` → Tu dominio real (ej: `https://atinet.example.com`)
- URL de los iconos (16x16, 32x32, 80x80 PNG)

Ejemplo:
```xml
<bt:Url id="taskpane" DefaultValue="https://atinet.example.com/word-addon/taskpane.html"/>
```

### Paso 2: Alojar archivos en tu servidor

Subir a tu servidor web:
- `taskpane.html`
- `taskpane.css`
- `taskpane.js`
- `manifest.xml`

Ubicación recomendada: `/public/word-addon/`

### Paso 3: Desplegar en Word

**Opción A: Administrador de complementos (Recomendado)**

1. Abrir Word → `Insertar` → `Obtener complementos`
2. Ir a `Mis complementos` → `Administrar mis complementos`
3. Hacer clic en `Cargar mi complemento`
4. Seleccionar `manifest.xml` de tu servidor (URL completa)
5. Hacer clic en `Cargar`

**Opción B: SharePoint (Para empresas)**

1. Subir `manifest.xml` a catálogo de complementos de SharePoint
2. Los usuarios verán el complemento disponible en `Mis complementos`

**Opción C: Instalación centralizada (Microsoft 365)**

```powershell
# PowerShell - Para administradores
Connect-ExchangeOnline
New-OrganizationAddIn -ManifestUrl "https://tu-dominio.com/word-addon/manifest.xml"
```

### Paso 4: Configurar CORS en Laravel

En `app/Http/Middleware/HandleCors.php` o similar:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

O en `.htaccess`:

```apache
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
</IfModule>
```

### Paso 5: Crear endpoint de API para autenticación

En `routes/api.php`:

```php
Route::get('/user', function (Request $request) {
    return auth()->check() ? auth()->user() : response('Unauthorized', 401);
});

Route::get('/Marcadores/GetMarcadores', 'MarcadorController@getMarcadores');
```

## Flujo de uso

1. **Usuario abre Word** → complemento se carga automáticamente
2. **Verifica autenticación** → si no está autenticado, muestra opción de login
3. **Carga marcadores** → obtiene lista de `/api/Marcadores/GetMarcadores`
4. **Usuario selecciona texto** en el documento
5. **Usuario clic en marcador** → reemplaza el texto seleccionado
6. **Documento se actualiza** → listo para guardar

## Configuración de dominio

En `taskpane.js`, actualizar:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://tu-dominio.com', // Tu dominio real
    LOGOUT_URL: 'https://tu-dominio.com/logout',
};
```

## Testing

### En desarrollo (localhost)

1. Subir archivos a servidor local (ej: `http://localhost:8000/word-addon/`)
2. Actualizar `CONFIG.API_BASE_URL` en `taskpane.js`
3. En Word: `Insertar` → `Obtener complementos` → `Cargar complemento`
4. Ingresar: `http://localhost:8000/word-addon/manifest.xml`

### Troubleshooting

**"Complemento no aparece"**
- Verificar que `manifest.xml` está accesible
- Ver consola de Word (F12 en Word Online)
- Revisar que URLs en manifest estén correctas

**"Error de CORS"**
- Asegurar que servidor permite CORS
- Verificar headers en respuestas API

**"No se carga taskpane.html"**
- Verificar acceso al archivo (permisos de lectura)
- Ver logs del servidor web
- Comprobar que rutas en HTML son absolutas

## API Endpoints requeridos

Tu Laravel debe proporcionar:

```
GET /api/user                          # Usuario actual (para auth)
GET /api/Marcadores/GetMarcadores      # Lista de marcadores
POST /api/user/logout                  # Cierre de sesión (opcional)
```

## Seguridad

⚠️ El add-in usa cookies para autenticación. Asegurar:

- HTTPS en producción (obligatorio)
- `SameSite=Lax` en cookies de sesión
- CSRF protection en Laravel
- Validar origen de requests

## Actualizaciones

Para actualizar el add-in:

1. Modificar `taskpane.html/css/js`
2. Recargar la página en Word (F5 o cerrar/abrir)
3. Si cambias `manifest.xml`, reiniciar Word

## Soporte

Contactar a soporte técnico de Atinet Compliance Hub para:
- Cambios de dominio
- Configuración de CORS
- Troubleshooting de integración

## Licencia

Atinet Compliance Hub © 2026
