# Guía Rápida: Desplegar Office Add-in en tu servidor

## 1. Preparar archivos

Tu servidor web debe tener esta estructura:

```
/public/word-addon/
├── manifest.xml
├── taskpane.html
├── taskpane.css
├── taskpane.js
└── [tus iconos .png aquí]
```

## 2. Configurar manifest.xml

Antes de desplegar, **EDIT REQUERIDO** en `manifest.xml`:

```xml
<!-- CAMBIAR ESTO: -->
<bt:Url id="taskpane" DefaultValue="https://your-app-domain.com/word-addon/taskpane.html"/>

<!-- A ESTO (tu dominio real): -->
<bt:Url id="taskpane" DefaultValue="https://atinet.example.com/word-addon/taskpane.html"/>
```

## 3. Configurar taskpane.js

En `taskpane.js`, línea 5-8:

```javascript
const CONFIG = {
    API_BASE_URL: 'https://atinet.example.com', // ← TU DOMINIO AQUÍ
    LOGOUT_URL: 'https://atinet.example.com/logout',
};
```

## 4. Subir archivos al servidor

```bash
scp -r word-addon/ usuario@tu-servidor:/ruta/a/public/
```

O manual (FTP/Panel de control):
1. Conectar por FTP
2. Navegar a `/public/`
3. Crear carpeta `word-addon`
4. Subir todos los archivos

## 5. Verificar URLs

Abre en navegador y confirma que funcionan:

```
https://tu-dominio.com/word-addon/taskpane.html
https://tu-dominio.com/word-addon/manifest.xml
https://tu-dominio.com/api/Marcadores/GetMarcadores
```

## 6. Instalar en Word

**Para usuarios:**

1. Abrir Microsoft Word (Desktop o Online)
2. Ir a `Insertar` (Insert)
3. Hacer clic en `Obtener complementos` (Get Add-ins)
4. Elegir `Mis complementos` (My Add-ins)
5. Seleccionar `Administrar mis complementos` (Manage My Add-ins)
6. Hacer clic en botón `+` o `Cargar complemento` (Upload My Add-in)
7. Ingresar: `https://tu-dominio.com/word-addon/manifest.xml`
8. Hacer clic en `Cargar` (Upload)

El add-in aparecerá en la pestaña `Inicio` → panel `Atinet`

## 7. Crear endpoint en Laravel (OBLIGATORIO)

Agregar a `routes/api.php`:

```php
Route::middleware('auth:sanctum')->group(function () {
    // Obtener marcadores
    Route::get('/Marcadores/GetMarcadores', function () {
        return Marcador::all(); // Usar tu modelo real
    });
    
    // Usuario autenticado
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
});
```

O en tu controller existente:

```php
namespace App\Http\Controllers\Api;

class MarcadorController extends Controller
{
    public function getMarcadores()
    {
        return Marcador::all(['id', 'marcador', 'descripcion', 'tipo', 'ejemplo']);
    }
}
```

## 8. Configurar CORS (si falla)

En `config/cors.php`:

```php
'paths' => ['api/*', 'word-addon/*'],
'allowed_origins' => ['*'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'allow_credentials' => true,
```

O en middleware:

```php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
```

## 9. Testing

**En consola de Word:**

Presiona `F12` mientras Word está abierto y el add-in cargado. Verás errores si hay problemas.

**Errores comunes:**

| Error | Solución |
|-------|----------|
| `404 manifest.xml` | URL incorrecta en campo "Cargar complemento" |
| `CORS error` | Agregar headers CORS al servidor |
| `No se carga panel` | taskpane.html URL incorrecto en manifest |
| `API no responde` | Verificar endpoint en `/api/Marcadores/GetMarcadores` |
| `Selección no funciona` | Word Online tiene limitaciones, usar Desktop |

## 10. Troubleshooting

**¿El add-in no aparece después de instalar?**
```
1. Cerrar y reabrertodos los documentos Word
2. Ir a Inicio → Mis complementos
3. Verificar si aparece en "Complementos deshabilitados"
4. Si está, hacer clic derecho → Habilitar
```

**¿Marcadores no se cargan?**
```
1. Abrir devtools (F12)
2. Verificar errores de red
3. Confirmar que endpoint /api/Marcadores/GetMarcadores existe
4. Revisar que usuario está autenticado
```

**¿Text replacement no funciona?**
```
1. En Word Desktop funciona (Online tiene limitaciones)
2. Seleccionar texto ANTES de hacer clic en marcador
3. Si el error persiste, revisar consola F12
```

## 11. Distribución (Para empresas)

Si quieres distribuir automáticamente a todos los usuarios:

**Opción 1: Microsoft 365 Admin Center**
1. Ir a https://admin.microsoft.com
2. Configuración → Aplicaciones integradas
3. Cargar manifest.xml
4. Asignar a usuarios/grupos

**Opción 2: SharePoint (Para organizaciones)**
1. Subir manifest.xml a catálogo de complementos
2. Usuarios lo verán automáticamente en "Mis complementos"

## URLs de referencia

- Documentación Office: https://learn.microsoft.com/en-us/office/dev/add-ins/
- Word JavaScript API: https://learn.microsoft.com/en-us/javascript/api/word/
- Manifest schema: https://learn.microsoft.com/en-us/openspecs/office_standards/ms-owemxml/

---

**¿Necesitas ayuda?** Contactar a equipo técnico
