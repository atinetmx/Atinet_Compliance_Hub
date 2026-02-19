# ⚡ Guía Rápida - Listas Negras OFAC + SAT
## Comandos, Troubleshooting y FAQ

**Última actualización:** 13 de Febrero, 2026  
**Para:** Desarrolladores, QA, DevOps

---

## 🚀 Inicio Rápido

### Verificación de Setup
```bash
# 1. Verificar dependencia tFPDF
composer show setasign/tfpdf
# → Debe mostrar "* v1.33"

# 2. Verificar rutas
php artisan route:list | grep pdf
# Debe mostrar:
#   /admin/pdf/ofac
#   /admin/pdf/sat

# 3. Verificar permisos
ls -la app/Http/Controllers/SuperAdmin/PdfController.php
# → -rw-r--r-- (legible)

# 4. Build frontend
npm run build
# → Debe compilar exitosamente
```

### Acceso a la Interfaz
```
URL: https://atinet.test/admin/listas-negras

Prerequisitos:
✅ Estar logueado como SuperAdmin
✅ Tener suscripción activa
✅ Tener servicio BLACKLIST_OFAC o BLACKLIST_SAT habilitado
```

---

## 📋 Tareas Comunes

### 1. Generar PDF OFAC Manualmente

```bash
# URL con parámetros
http://atinet.test/admin/pdf/ofac?nombre=JUAN%20PEREZ&rfc=&resultados=[]

# Parámetros:
# - nombre: string (URL encoded)
# - rfc: string (URL encoded, opcional)
# - resultados: JSON array string

# Con resultados
# resultados=[{"name":"JUAN PEREZ SMITH","similarity":95}]
```

### 2. Verificar Encoding UTF-8
```php
// tinker
php artisan tinker

// Ejecutar en Tinker:
$text = "México, São Paulo, Año 2026";
$encoded = iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
echo $encoded;
// → México, Sao Paulo, Ano 2026 ✅
```

### 3. Verificar Rutas Protegidas
```bash
# Sin autenticación (debe fallar)
curl -X GET http://atinet.test/admin/pdf/ofac?nombre=test
# → 302 Redirect to /login

# Con token válido
curl -X GET http://atinet.test/admin/pdf/ofac?nombre=test \
  -H "Authorization: Bearer YOUR_TOKEN"
# → PDF descargado
```

### 4. Recompilar Frontend
```bash
# Desarrollo
npm run dev
# → Watch de cambios en tiempo real

# Producción
npm run build
# → Minificado y optimizado

# Verify
ls public/build/
# Debe haber: index.html y .js/.css files
```

### 5. Formatear Código PHP
```bash
# Verificar qué falta formatear
vendor/bin/pint --dirty

# Aplicar formato
vendor/bin/pint app/Http/Controllers/SuperAdmin/PdfController.php

# Verificar cambios
git diff app/Http/Controllers/SuperAdmin/PdfController.php
```

---

## 🐛 Troubleshooting

### ❌ Error: "404 Not Found" en PDF

**Síntoma:**
```
GET /admin/pdf/ofac → 404 Not Found
```

**Checklist:**
1. ✅ Rutas registradas en `routes/web.php`?
   ```bash
   php artisan route:list | grep pdf
   ```

2. ✅ Controlador existe?
   ```bash
   ls app/Http/Controllers/SuperAdmin/PdfController.php
   ```

3. ✅ URL contiene `/admin/` prefix?
   ```javascript
   // ❌ MALO: /pdf/ofac
   // ✅ BUENO: /admin/pdf/ofac
   ```

4. ✅ Middleware activo?
   ```bash
   php artisan route:list | grep pdf
   # Debe mostrar "subscription" en Middleware column
   ```

---

### ❌ Error: "FPDF Class Not Found"

**Síntoma:**
```
Class 'FPDF' not found
```

**Solución:**
```bash
# Verificar que tFPDF está instalado
composer require setasign/tfpdf:1.33

# Actualizar autoload
composer dump-autoload

# Reintentar
php artisan route:list | grep pdf
```

---

### ❌ Error: "Undefined variable: $encontrado"

**Síntoma:**
```
Undefined variable: $encontrado in PdfController.php:123
```

**Solución:**
```php
// ANTES (❌ Incorrecto)
$pdf->generarPdf($nombre);

// DESPUÉS (✅ Correcto)
$encontrado = !empty($resultados);
$pdf->generarPdf($nombre, $encontrado);
```

---

### ❌ PDF con caracteres rotos: "Mëxico" en lugar de "México"

**Síntoma:**
```
Mëxico en lugar de México
Año 2026 → A¤o 2026
```

**Solución:**
```php
// Verificar encodeText()
private function encodeText($text)
{
    // ✅ CORRECTO
    return iconv('UTF-8', 'ISO-8859-1//TRANSLIT', $text);
    
    // ❌ VIEJO (Deprecated)
    // return utf8_encode($text);
}

// Usar en todo texto:
$pdf->Cell(0, 8, $this->encodeText("México"), 0, 1);
```

---

### ❌ Frontend no ve cambios en PDF

**Síntoma:**
```
Cambié código de PDF pero en navegador sigue igual
```

**Solución:**
```bash
# 1. Recompilar frontend
npm run build

# 2. Limpiar cache del navegador
Ctrl+Shift+R (hard refresh)

# 3. Limpiar cache Laravel
php artisan cache:clear
php artisan view:clear

# 4. Si sigue igual, revisar en browser console
F12 → Console → Verificar errores
```

---

### ❌ Error: "Subscription middleware rejected"

**Síntoma:**
```
401 Unauthorized - Subscription required
```

**Checklist:**
1. ✅ Usuario logueado?
   ```bash
   Auth::check() ← Debe ser true
   ```

2. ✅ Notaría tiene suscripción activa?
   ```bash
   php artisan tinker
   >>> Auth::user()->notaria->subscription->status
   # Debe ser 'activa' o 'trial'
   ```

3. ✅ Servicio habilitado en plan?
   ```bash
   >>> Auth::user()->notaria->subscription->plan->services->contains('code', 'BLACKLIST_OFAC')
   # Debe ser true
   ```

---

## 📊 Pruebas Manuales

### Test 1: Búsqueda OFAC Persona Física

```
1. Navegar a: /admin/listas-negras
2. Click en Tab "Persona Física"
3. Ingresar: "JUAN PEREZ"
4. Click "Buscar"
   ✓ Debe mostrar resultados (si existen)
5. Para cada resultado, click "PDF"
   ✓ Debe descargar PDF con nombre incorrecto
6. Abrir PDF
   ✓ Logo visible
   ✓ Fecha en español
   ✓ Tabla con datos
   ✓ Legal disclaimer
   ✓ Anexos (A, B, C, D)
```

### Test 2: Búsqueda SAT por RFC

```
1. Click en Tab "RFC"
2. Ingresar: "RFC123456ABC01"
3. Click "Buscar"
   ✓ Debe mostrar resultados de SAT
4. Click "PDF"
   ✓ PDF generado correctamente
5. Abrir PDF
   ✓ Título menciona "Artículo 69-B"
   ✓ RFC visible en tabla
   ✓ Estado (Afirmativo/Negativo)
```

### Test 3: Búsqueda Combinada

```
1. Click en Tab "Combinada"
2. Ingresar Nombre: "JUAN PEREZ"
3. Ingresar RFC: "RFC123456ABC01"
4. Click "Buscar"
   ✓ Debe mostrar resultados OFAC + SAT
5. Verificar separación visual
   ✓ Resultados OFAC (rojo)
   ✓ Resultados SAT (azul)
```

### Test 4: Sin Coincidencias

```
1. Buscar nombre que NO existe: "ZZZZZZZZ"
2. Debe mostrar: "SIN COINCIDENCIAS"
3. Click "PDF de búsqueda sin resultados"
4. Abrir PDF
   ✓ Marque "Negativo"
   ✓ No hay anexos
```

---

## 🔧 Variables de Configuración

### `.env`
```
# Configuración de PDF (No requerida, usa defaults)
PDF_FONT_SIZE=11
PDF_PAPER_SIZE=A4

# Rutas
APP_URL=https://atinet.test
```

### `config/app.php`
```php
'locale' => 'es', // ✅ Para fechas en español
'locale_fallback' => 'es',
'timezone' => 'America/Mexico_City', // ✅ Zona horaria
```

### `bootstrap/app.php`
```php
// Middleware de protección para rutas /admin/pdf/*
Route::middleware(['auth', 'subscription'])->group(function () {
    // PDFs protegidas
});
```

---

## 📈 Monitoreo

### Logs
```bash
# Ver logs en tiempo real
tail -f storage/logs/laravel.log

# Filtrar errores de PDF
grep -i pdf storage/logs/laravel.log

# Ver última línea
tail -1 storage/logs/laravel.log
```

### Estadísticas de Búsqueda
```bash
# Contar búsquedas hoy
php artisan statistics:searches --from=today --group=day

# Top búsquedas
php artisan statistics:searches --limit=10 --order=desc
```

### Verificar Performance
```bash
# Tiempo de generación de PDF
php artisan debugbar:enable

# En navegador:
# F12 → Debugbar → Queries → Tiempo total
# (Debe ser < 500ms)
```

---

## 💡 Tips y Trucos

### Tip 1: Forzar Descarga vs. Mostrar en Navegador
```php
// Para descargar automáticamente
$pdf->Output('D', 'OFAC_' . date('YmdHis') . '.pdf');

// Para mostrar en navegador
$pdf->Output('I', null);
```

### Tip 2: Depurar Encoding
```php
// Verificar si texto tiene UTF-8
mb_detect_encoding($text);

// Convertir a otro encoding
mb_convert_encoding($text, 'ISO-8859-1', 'UTF-8');
```

### Tip 3: Generar PDF de Prueba
```bash
# Tinker para probar directamente
php artisan tinker

>>> $pdf = new \App\Http\Controllers\SuperAdmin\PdfOfac();
>>> $pdf->generarPdf('TEST NOMBRE', true);
>>> $pdf->Output('F', 'test.pdf');
# → Genera test.pdf en raíz
```

### Tip 4: Verificar Archivos de Logo
```bash
# Verificar si existe logo
ls -la public/images/logo-notaria.jpg

# Si no existe, copiar de legacy
cp ../Listas_negrasV2/public/images/logo.png public/images/logo-notaria.jpg
```

---

## 📞 FAQs

### ¿Qué pasa si usuario no tiene suscripción activa?

```
❌ Acceso denegado a /admin/listas-negras
❌ Mensaje: "Tu suscripción ha expirado"
✅ Debe renovar suscripción
```

### ¿Los PDFs consumen límite de búsquedas?

```
❌ NO, PDFs no consumen límite
✅ Búsquedas SÍ consumen límite
✅ PDFs son generación del resultado previo
```

### ¿Cuántas búsquedas puedo hacer?

```
Depende del plan:
- FREE: 10/mes
- PRO: 100/mes
- ENTERPRISE: Ilimitado

Ver en Dashboard → Mi Suscripción → Límites
```

### ¿Puedo exportar a Excel en lugar de PDF?

```
Actualmente NO, solo PDF está implementado
Puede ser mejora futura en el roadmap
Crear issue: github.com/spartha1/Atinet_Compliance_Hub/issues
```

### ¿Cada PDF está autenticado?

```
✅ SÍ, protegido por middleware 'auth'
✅ Solo usuarios logueados pueden acceder
✅ Solo si suscripción está activa
```

---

## 📚 Referencias

| Documento | Ubicación |
|-----------|-----------|
| Documentación completa | [LISTAS_NEGRAS_OFAC_SAT.md](LISTAS_NEGRAS_OFAC_SAT.md) |
| Cambios técnicos | [CAMBIOS_TECNICOS_FASE_2.md](CAMBIOS_TECNICOS_FASE_2.md) |
| tFPDF Docs | https://www.setasign.com/products/tfpdf/ |
| Laravel Docs | https://laravel.com/docs/12 |

---

**Guía creada:** 13 de Febrero, 2026  
**Mantenida por:** GitHub Copilot  
**Última revisión:** Completa ✅
