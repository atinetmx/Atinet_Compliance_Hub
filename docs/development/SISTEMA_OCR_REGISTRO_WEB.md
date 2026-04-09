# 📸 Sistema OCR - Registro Web

**Fecha:** 8 de Abril, 2026  
**Estado:** ✅ COMPLETADO  
**Fase:** Fase 4 - OCR con Gemini Vision API

---

## 📋 RESUMEN EJECUTIVO

Sistema completo de OCR (Optical Character Recognition) para automatizar la captura de datos desde documentos oficiales mexicanos usando Google Gemini Vision API.

**Documentos soportados:**
- ✅ **INE** (Credencial de Elector) - frente y reverso
- ✅ **CURP** (Clave Única de Registro de Población)
- ✅ **Acta de Nacimiento** mexicana
- ✅ **QR del SAT** (ya existía, validado)

---

## 🎯 OBJETIVO

Eliminar la captura manual de datos al escanear documentos con la cámara del dispositivo o subir imágenes. El sistema:

1. **Captura** imagen del documento (cámara o galería)
2. **Analiza** con Gemini Vision API (extrae texto y datos)
3. **Parsea** y valida los datos extraídos (normaliza CURP, RFC, fechas)
4. **Carga** automáticamente al formulario de Registro Web

---

## 🏗️ ARQUITECTURA

### Backend (Laravel)

```
app/
├── Services/
│   ├── GeminiVisionService.php        ← Servicio de análisis de imágenes (NUEVO)
│   ├── OCRParserService.php           ← Parser y normalización de datos (NUEVO)
│   └── SATScraperService.php          ← Scraping QR SAT (existente)
│
└── Http/Controllers/Admin/
    └── OCRController.php               ← Endpoints OCR actualizados


Routes (routes/web.php):
POST /admin/ocr/ine        → processINE()
POST /admin/ocr/curp       → processCURP()
POST /admin/ocr/acta       → processActa()
POST /admin/ocr/sat-qr     → processSATQR()    ← Ya existía
```

### Frontend (React + Inertia)

```
resources/js/
├── components/Admin/RegistroWeb/
│   ├── ScannerQR.tsx              ← Scanner QR (existente)
│   └── ImageOCRScanner.tsx        ← Componente OCR genérico (NUEVO)
│
└── Pages/Admin/RegistroWeb/
    └── Index.tsx                  ← Página actualizada con 4 scanners
```

---

## 🔧 COMPONENTES IMPLEMENTADOS

### 1. **GeminiVisionService** (Backend)

**Ubicación:** `app/Services/GeminiVisionService.php`

**Responsabilidades:**
- Conectar con Google Gemini Vision API
- Enviar imágenes en base64 + prompts específicos
- Manejar errores de API (límites, permisos, imágenes corruptas)
- Retornar JSON estructurado con datos extraídos

**Métodos principales:**
```php
public function analyzeINE(UploadedFile $image, string $side): array
public function analyzeCURP(UploadedFile $image): array
public function analyzeActaNacimiento(UploadedFile $image): array
protected function analyzeImage(UploadedFile $image, string $prompt): array
```

**Características:**
- ✅ Validación de imágenes (tipo MIME, tamaño máximo 10MB)
- ✅ Prompts especializados para cada documento mexicano
- ✅ Respuesta en JSON estructurado
- ✅ Manejo robusto de errores de Gemini (429, 400, 401)
- ✅ Configuración desde `config/services.php`

**Ejemplo de prompt (INE frente):**
```
Analiza esta imagen de la CREDENCIAL PARA VOTAR (INE) mexicana - LADO FRONTAL.

Extrae y estructura los siguientes datos en formato JSON:
- nombre: nombre(s) de pila (MAYÚSCULAS)
- apellidopat: apellido paterno (MAYÚSCULAS)
- curp: CURP completo (18 caracteres)
- no_identificacion: número de credencial (13 dígitos)
- calle: nombre completo de la calle/vialidad
- cp: código postal (5 dígitos como número)
...
```

---

### 2. **OCRParserService** (Backend)

**Ubicación:** `app/Services/OCRParserService.php`

**Responsabilidades:**
- Normalizar datos extraídos por Gemini (MAYÚSCULAS, formatos)
- Validar CURP y RFC con regex
- Extraer información derivada (RFC desde CURP, género desde CURP)
- Estandarizar fechas a formato `YYYY-MM-DD`
- Convertir CPs a enteros

**Métodos principales:**
```php
public function parseINE(array $rawData, string $side): array
public function parseCURP(array $rawData): array
public function parseActa(array $rawData): array
protected function normalizeCURP(string $curp): string
protected function normalizeRFC(string $rfc): string
protected function extractDataFromCURP(string $curp): array
```

**Validaciones implementadas:**
```php
// CURP: 18 caracteres
/^[A-Z]{4}\d{6}[HM][A-Z]{2}[A-Z]{3}[A-Z0-9]{2}$/

// RFC: 12-13 caracteres
/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/
```

**Extracción inteligente desde CURP:**
- Fecha de nacimiento (posiciones 5-10: AAMMDD)
- Género (posición 11: H/M)
- Estado de nacimiento (posiciones 12-13: código)
- RFC base (primeros 10 caracteres)

---

### 3. **OCRController** (Backend)

**Ubicación:** `app/Http/Controllers/Admin/OCRController.php`

**Endpoints actualizados:**

#### `POST /admin/ocr/ine`
```php
Request: 
{
  "image": UploadedFile,
  "side": "front" | "back"
}

Response:
{
  "success": true,
  "message": "INE procesada correctamente",
  "data": {
    "nombre": "JUAN",
    "apellidopat": "PEREZ",
    "curp": "PEPJ850315HJCLRN09",
    "rfc": "PEPJ850315",
    "calle": "AV INSURGENTES",
    "cp": 54000,
    ...
  }
}
```

#### `POST /admin/ocr/curp`
```php
Request: 
{
  "image": UploadedFile
}

Response:
{
  "success": true,
  "data": {
    "curp": "PEPJ850315HJCLRN09",
    "nombre": "JUAN",
    "dia": "1985-03-15",
    "genero": "HOMBRE",
    "estado_nac": "JALISCO",
    ...
  }
}
```

#### `POST /admin/ocr/acta`
```php
Request: 
{
  "image": UploadedFile
}

Response:
{
  "success": true,
  "data": {
    "nombre": "JUAN",
    "apellidopat": "PEREZ",
    "dia": "1985-03-15",
    "padre_nombre": "CARLOS PEREZ",
    "madre_nombre": "MARIA GARCIA",
    ...
  }
}
```

---

### 4. **ImageOCRScanner** (Frontend)

**Ubicación:** `resources/js/components/Admin/RegistroWeb/ImageOCRScanner.tsx`

**Componente genérico reutilizable** para capturar y procesar imágenes.

**Props:**
```typescript
interface ImageOCRScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onDataExtracted: (data: Record<string, any>) => void;
    endpoint: string;              // ej: '/admin/ocr/ine'
    title: string;                 // ej: 'Escanear INE'
    documentType: 'INE' | 'CURP' | 'ACTA';
    requiresSide?: boolean;        // Solo para INE (frente/reverso)
}
```

**Características:**
- ✅ **Tomar foto** con cámara del dispositivo (mobile-friendly)
- ✅ **Subir imagen** desde galería
- ✅ **Preview** de imagen antes de procesar
- ✅ **Selector de lado** (frente/reverso) para INE
- ✅ **Estados visuales** (idle, uploading, processing, success, error)
- ✅ **Validación** de tipo de archivo y tamaño (máx 10MB)
- ✅ **Consejos de captura** para mejor OCR
- ✅ **Auto-cierre** tras éxito (1 segundo)

**Estados del componente:**
```typescript
type ScannerStatus = 'idle' | 'uploading' | 'processing' | 'success' | 'error';
```

**Ejemplo de uso (INE):**
```tsx
<ImageOCRScanner
    isOpen={ineScannerOpen}
    onClose={() => setIneScannerOpen(false)}
    onDataExtracted={handleOCRDataExtracted}
    endpoint="/admin/ocr/ine"
    title="Escanear INE (Credencial de Elector)"
    documentType="INE"
    requiresSide={true}
/>
```

---

### 5. **Integración en Index.tsx** (Frontend)

**Ubicación:** `resources/js/Pages/Admin/RegistroWeb/Index.tsx`

**Cambios realizados:**

1. **Importaciones actualizadas:**
```tsx
import { ImageOCRScanner } from '@/components/Admin/RegistroWeb/ImageOCRScanner';
```

2. **Estados agregados:**
```tsx
const [ineScannerOpen, setIneScannerOpen] = useState(false);
const [curpScannerOpen, setCurpScannerOpen] = useState(false);
const [actaScannerOpen, setActaScannerOpen] = useState(false);
```

3. **Handlers reemplazados:**
```tsx
// ANTES (stub):
const handleScanINE = () => alert('Scanner INE - Pendiente Fase 3');

// AHORA (funcional):
const handleScanINE = () => setIneScannerOpen(true);
```

4. **Handler de datos OCR:**
```tsx
const handleOCRDataExtracted = (datos: Record<string, any>) => {
    // Detectar tipo de persona
    if (datos.curp) setActiveTab('fisica');
    if (datos.Persona === 'MORAL') setActiveTab('moral');

    // Mapear 47 campos diferentes al formulario
    const fieldMapping = { ... };
    
    // Actualizar formulario
    Object.entries(datos).forEach(([key, value]) => {
        setData(formField, String(value));
    });

    // Abrir sección de datos generales
    setOpenSections(prev => ({ ...prev, generales: true }));

    toast.success('✅ Datos cargados desde el documento');
};
```

5. **Componentes agregados al final:**
```tsx
{/* Scanner INE */}
<ImageOCRScanner
    isOpen={ineScannerOpen}
    onClose={() => setIneScannerOpen(false)}
    onDataExtracted={handleOCRDataExtracted}
    endpoint="/admin/ocr/ine"
    title="Escanear INE"
    documentType="INE"
    requiresSide={true}
/>

{/* Scanner CURP */}
<ImageOCRScanner ... />

{/* Scanner Acta */}
<ImageOCRScanner ... />
```

---

## ⚙️ CONFIGURACIÓN

### 1. Variables de entorno

**Archivo:** `.env`

```bash
# Google Gemini Vision API
GEMINI_API_KEY=AIzaSyAyMBXqBvB9TSFKe7ptFMNYtdlbDx8jPtk
GEMINI_MODEL=gemini-2.5-pro
GEMINI_ENDPOINT="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent"
GEMINI_TIMEOUT=60
GEMINI_TEMPERATURE=0.1
```

**Nota:** La configuración ya existe en `.env.example`.

### 2. Configuración de servicios

**Archivo:** `config/services.php`

```php
'gemini' => [
    'api_key' => env('GEMINI_API_KEY'),
    'model' => env('GEMINI_MODEL', 'gemini-2.5-pro'),
    'endpoint' => env('GEMINI_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent'),
    'timeout' => (int) env('GEMINI_TIMEOUT', 60),
    'temperature' => (float) env('GEMINI_TEMPERATURE', 0.1),
],
```

---

## 🧪 TESTING

### Comandos de prueba

```bash
# Ejecutar tests de OCR
php artisan test --filter=OCR

# Ejecutar tests de RegistroWeb completo
php artisan test --filter=RegistroWeb

# Testing manual desde navegador
# 1. Acceder a /admin/registro-web
# 2. Click en botones laterales (INE, CURP, Acta)
# 3. Tomar foto o subir imagen
# 4. Verificar que datos se carguen al formulario
```

### Casos de prueba

**INE (frente):**
- ✅ Extrae: nombre, apellidos, CURP, RFC, dirección, CP, vigencia
- ✅ Valida: CURP 18 caracteres, número identificación 13 dígitos
- ✅ Genera RFC base desde CURP si no existe

**INE (reverso):**
- ✅ Extrae: CURP, clave de elector
- ✅ Complementa datos del frente

**CURP:**
- ✅ Extrae: CURP completo, nombre, apellidos
- ✅ Deriva: fecha nacimiento, género, estado desde CURP
- ✅ Genera RFC desde CURP

**Acta de Nacimiento:**
- ✅ Extrae: nombre, fecha nacimiento, lugar, padres
- ✅ Valida: CURP si está visible
- ✅ Normaliza ubicación (ciudad, municipio, estado)

---

## 🚀 USO DEL SISTEMA

### Flujo de usuario

1. **Abrir Registro Web:** `/admin/registro-web`

2. **Seleccionar tipo de escaneo:**
   - 📷 **Botón azul** (Camera) → Escanear INE
   - 🪪 **Botón naranja** (IdCard) → Escanear CURP
   - 📄 **Botón morado** (FileText) → Escanear Acta
   - 📱 **Botón verde** (QrCode) → Escanear QR SAT

3. **Capturar documento:**
   - **Tomar Foto:** Usa cámara del dispositivo
   - **Subir Imagen:** Selecciona desde galería

4. **Esperar procesamiento:**
   - ⏳ "Procesando imagen con IA..." (2-5 segundos)
   - ✅ "¡Datos extraídos correctamente!"

5. **Verificar datos:**
   - Formulario se llena automáticamente
   - Sección "Datos Generales" se expande
   - Campos con datos extraídos se marcan

6. **Completar y guardar:**
   - Agregar datos faltantes manualmente
   - Click en "Guardar Registro"

### Consejos para mejor OCR

📸 **Captura óptima:**
- Buena iluminación (evitar sombras y reflejos)
- Documento completo en el encuadre
- Imagen enfocada y nítida
- Contraste adecuado (fondo claro, texto oscuro)

🚫 **Evitar:**
- Imágenes borrosas o movidas
- Documentos doblados o arrugados
- Reflejos de flash directo
- Texto cortado o parcial

---

## 📊 RENDIMIENTO

### Tiempos de respuesta

| Operación | Tiempo promedio | Notas |
|-----------|----------------|-------|
| Subir imagen | < 1s | Depende de conexión |
| Análisis Gemini | 2-4s | Depende de complejidad |
| Parsing + validación | < 0.5s | Local |
| **TOTAL** | **3-5s** | Experiencia fluida |

### Límites

- **Tamaño imagen:** Máximo 10MB
- **Formatos:** JPG, PNG, WebP
- **Rate limit Gemini:** Según plan de API
- **Concurrent requests:** Sin límite (backend asíncrono)

---

## ✅ CHECKLIST DE COMPLETADO

### Backend
- [x] GeminiVisionService.php creado
- [x] OCRParserService.php creado
- [x] OCRController.php actualizado
- [x] Endpoints /admin/ocr/* implementados
- [x] Validaciones de CURP y RFC
- [x] Extracción inteligente desde CURP
- [x] Manejo de errores robusto
- [x] Logging de operaciones

### Frontend
- [x] ImageOCRScanner.tsx creado
- [x] Integración en Index.tsx
- [x] Handlers de escaneo actualizados
- [x] Estados de carga (idle, processing, success, error)
- [x] Preview de imágenes
- [x] Selector de lado (INE frente/reverso)
- [x] Validación client-side
- [x] Toasts de feedback

### Configuración
- [x] config/services.php validado
- [x] .env.example actualizado
- [x] Rutas configuradas en routes/web.php
- [x] CORS habilitado para POST /admin/ocr/*

### Documentación
- [x] Este archivo (SISTEMA_OCR_REGISTRO_WEB.md)
- [x] Comentarios en código
- [x] Ejemplos de uso
- [x] Guía de configuración

---

## 🔄 PRÓXIMOS PASOS SUGERIDOS

### Mejoras futuras (opcionales)

1. **Cache de resultados OCR** (evitar re-procesar misma imagen):
   ```php
   Cache::remember("ocr:{$imageHash}", 3600, fn() => $gemini->analyze($image));
   ```

2. **OCR offline con Tesseract** (fallback si Gemini falla):
   ```bash
   composer require thiagoalessio/tesseract_ocr
   ```

3. **Batch OCR** (procesar múltiples documentos):
   ```php
   POST /admin/ocr/batch
   { "images": [file1, file2, file3] }
   ```

4. **Histórico de escaneos** (auditoría):
   ```sql
   CREATE TABLE ocr_scans (
       id, user_id, document_type, image_path, extracted_data, created_at
   );
   ```

5. **Confidence score** (mostrar confianza de extracción):
   ```json
   {
     "curp": "PEPJ850315...",
     "confidence": 0.98
   }
   ```

---

## 📞 SOPORTE

### Errores comunes

**1. "API Key de Gemini inválida"**
```
Solución: Verificar GEMINI_API_KEY en .env
```

**2. "Límite de uso de Gemini alcanzado"**
```
Solución: Esperar 1 minuto o cambiar a plan pagado
Error: 429 Too Many Requests
```

**3. "Imagen corrupta o inválida"**
```
Solución: Verificar formato (JPG/PNG) y tamaño < 10MB
Error: 400 Bad Request
```

**4. "CURP con formato inválido"**
```
Solución: Revisar que OCR haya leído correctamente (18 caracteres)
Formato: PEPJ850315HJCLRN09
```

### Logs útiles

```bash
# Ver logs de OCR
tail -f storage/logs/laravel.log | grep "OCR\|Gemini"

# Ver errores de procesamiento
tail -f storage/logs/laravel.log | grep "ERROR"
```

---

## 📝 CHANGELOG

### v1.0.0 - 8 de Abril 2026
- ✅ Sistema OCR completo implementado
- ✅ 3 tipos de documentos soportados (INE, CURP, Acta)
- ✅ Gemini Vision API integrada
- ✅ Parser y validación de datos
- ✅ UI completa con preview y estados
- ✅ Auto-fill del formulario de registro

---

## 👨‍💻 AUTOR

**Equipo:** Atinet Compliance Hub  
**Fecha implementación:** 8 de Abril, 2026  
**Tecnologías:** Laravel 12, React 19, Inertia v2, Gemini Vision API
