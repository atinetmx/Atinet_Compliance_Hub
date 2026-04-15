# Plan de Implementación: QR Scanner (Botón 1)

## 📋 Resumen Ejecutivo

Este es el primer botón a implementar siguiendo la estrategia **Opción D** (proceso controlado, un botón completo antes de replicar). El QR Scanner es el más complejo porque:

1. **Decodifica QR automáticamente** con html5-qrcode
2. **Identifica tipo de documento** (SAT, CURP, Acta, INE, JSON)
3. **Procesa localmente** (sin backend) EXCEPTO QR del SAT
4. **Soporta múltiples formatos**: URL, pipe-delimited, JSON, KV

---

## 🔍 Análisis del Código PHP (Reutilización)

### **Código 100% Reutilizable (Copiar y pegar con ajustes de sintaxis)**

#### **1. `procesarDatosQR()` - Detección de tipos** ✅
**Ubicación PHP**: `qr-processor.js` líneas 230-270

```javascript
procesarDatosQR(textoQR) {
    try {
        const datos = JSON.parse(textoQR);
        return datos;
    } catch {
        if (textoQR.includes('|')) {
            if (this.esQRdeActaNacimientoKV(textoQR)) {
                return this.parsearQRActaNacimientoKV(textoQR);
            }
            return this.parsearQRPipeDelimited(textoQR);
        }
        
        if (textoQR.startsWith('http') || textoQR.includes('=')) {
            if (this.esQRdeActaNacimiento(textoQR)) {
                return this.parsearQRActaNacimiento(textoQR);
            }
            if (this.esQRdeRENAPO(textoQR)) {
                return this.parsearQRRENAPO(textoQR);
            }
            return this.parsearQRURLEncoded(textoQR);
        }
        
        const curpMatch = textoQR.match(/[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d/);
        if (curpMatch) {
            return { curp: curpMatch[0] };
        }
        
        return {};
    }
}
```

**🔄 Adaptación a TypeScript**: Cambiar `this.` por funciones puras, agregar tipos.

---

#### **2. `parsearQRActaNacimientoKV()` - Parser de Acta formato Registro Civil** ✅
**Ubicación PHP**: `qr-processor.js` líneas 286-360

**Lógica reutilizable**:
- Mapa de códigos de estados (líneas 289-296) → **Copiar directo**
- Parseo KV pipe-delimited (líneas 299-307) → **Copiar directo**
- Extracción CURP (líneas 309-312) → **Copiar directo**
- Heurística nombres (líneas 314-327) → **Copiar directo**
- Conversión género F→M, M→H (líneas 333-336) → **Copiar directo**

**📂 Código a extraer**:
```javascript
const estadosCodigo = {
    '1':'AGUASCALIENTES', '2':'BAJA CALIFORNIA', '3':'BAJA CALIFORNIA SUR',
    '4':'CAMPECHE', '5':'COAHUILA', '6':'COLIMA', '7':'CHIAPAS',
    '8':'CHIHUAHUA', '9':'CIUDAD DE MEXICO', '10':'DURANGO',
    '11':'GUANAJUATO', '12':'GUERRERO', '13':'HIDALGO', '14':'JALISCO',
    '15':'ESTADO DE MEXICO', '16':'MICHOACAN', '17':'MORELOS', '18':'NAYARIT',
    '19':'NUEVO LEON', '20':'OAXACA', '21':'PUEBLA', '22':'QUERETARO',
    '23':'QUINTANA ROO', '24':'SAN LUIS POTOSI', '25':'SINALOA',
    '26':'SONORA', '27':'TABASCO', '28':'TAMAULIPAS', '29':'TLAXCALA',
    '30':'VERACRUZ', '31':'YUCATAN', '32':'ZACATECAS'
};
```

**🔄 Adaptación**: Crear constante `ESTADOS_CODIGO` en utils/qr-parser.ts

---

#### **3. `parsearQRActaNacimiento()` - Parser Acta URL** ✅
**Ubicación PHP**: `qr-processor.js` líneas 393-435

**100% reutilizable**: URL parsing con URLSearchParams (API estándar)

---

#### **4. `parsearQRRENAPO()` - Parser CURP URL** ✅
**Ubicación PHP**: `qr-processor.js` líneas 469-503

**100% reutilizable**: URL parsing estándar

---

#### **5. `parsearQRPipeDelimited()` - Parser formato pipe** ✅
**Ubicación PHP**: `qr-processor.js` líneas 509-590

**Lógica compleja pero reutilizable**:
- Detección posición CURP como ancla (línea 516)
- Lectura posiciones relativas (líneas 518-542)
- Conversión fechas múltiples formatos (líneas 544-555)

---

#### **6. `_normalizarFecha()` - Utilidad conversión fechas** ✅
**Ubicación PHP**: `qr-processor.js` líneas 445-459

```javascript
_normalizarFecha(fecha) {
    if (!fecha) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fecha)) {
        const [d, m, a] = fecha.split('/');
        return `${a}-${m}-${d}`;
    }
    if (/^\d{8}$/.test(fecha)) {
        return `${fecha.slice(0,4)}-${fecha.slice(4,6)}-${fecha.slice(6,8)}`;
    }
    return fecha;
}
```

**🔄 Adaptación**: Función pura en utils/date-helpers.ts

---

#### **7. Detectores de tipo** ✅
```javascript
esQRdeActaNacimientoKV(texto) {
    return texto.includes('Padre1:') || texto.includes('Padre2:') ||
           (texto.includes('Registrado:') && texto.includes('Acta:'));
}

esQRdeActaNacimiento(texto) {
    const dominios = [
        'cevar.registrocivil.gob.mx',
        'registrocivil.gob.mx',
        'miregistrocivil.gob.mx',
        'gob.mx/ActaNacimiento',
        'gob.mx/acta'
    ];
    return dominios.some(d => texto.toLowerCase().includes(d.toLowerCase()));
}

esQRdeRENAPO(texto) {
    const dominiosRENAPO = [
        'consultas.curp.gob.mx',
        'curp.gob.mx',
        'renapo.gob.mx',
        'www.gob.mx/curp'
    ];
    return dominiosRENAPO.some(d => texto.includes(d));
}
```

**100% reutilizable** como funciones puras.

---

### **Código que NO se reutiliza (específico del contexto)**

#### **1. Modal HTML y DOM manipulation** ❌
**Ubicación PHP**: `qr-processor.js` líneas 30-100

**Razón**: Laravel usa Inertia + React, no manipulación DOM directa.

**Reemplazo**: Componente React `<ScannerQR />` con Tailwind CSS.

---

#### **2. Registro de funciones globales** ❌
**Ubicación PHP**: `qr-processor.js` líneas 102-109

```javascript
window.cerrarScannerQR  = () => this.cerrar();
window.iniciarCamaraQR  = () => this._mostrarCamara();
```

**Razón**: No necesitamos `window` global en React.

**Reemplazo**: Event handlers directos en componente React.

---

#### **3. Integración con FormManager** ❌
**Ubicación PHP**: `qr-processor.js` línea 182

```javascript
await this.formManager.cargarDatosQR(datos);
```

**Razón**: En Laravel usamos Inertia forms, no clase FormManager.

**Reemplazo**: Hook `useForm` de Inertia + método `setData()`.

---

### **Código Backend Nuevo (NO existe en PHP frontend)**

#### **1. SATScraperService** 🆕
**API PHP original**: `/sat/procesar.php` líneas 1-300

**Necesita portarse a Laravel**:
```php
class SATScraperService {
    public function processQRUrl(string $qrUrl): array
    protected function fetchSATHTML(string $url): string
    protected function extractDataFromHTML(string $html): array
    protected function structureWithGemini(array $rawData): array
}
```

**Reutilizable del PHP**:
- Configuración cURL (líneas 48-52): `CURLOPT_SSL_CIPHER_LIST = 'DEFAULT@SECLEVEL=1'`
- XPath para extraer `<td>` y `<ul>` (líneas 89-108)
- Prompt para Gemini Text (líneas 130-170)
- Normalización tipo Persona (líneas 260-267)

---

## 📁 Estructura de Archivos Propuesta

```
app/
├── Services/
│   └── SATScraperService.php           # NUEVO - Scraping + Gemini Text
├── Http/
│   └── Controllers/Admin/
│       └── OCRController.php           # Actualizar: agregar processSATQR()
config/
└── services.php                        # ACTUALIZAR: agregar gemini config

resources/js/
├── components/Admin/RegistroWeb/
│   ├── ScannerQR.tsx                   # NUEVO - Componente modal
│   └── QRCameraView.tsx                # OPCIONAL - Vista cámara separada
├── utils/
│   ├── qr-parser.ts                    # NUEVO - Toda la lógica de parseo
│   ├── qr-detectors.ts                 # NUEVO - Funciones de detección
│   └── date-helpers.ts                 # NUEVO - Normalización fechas
└── pages/Admin/RegistroWeb/
    └── Index.tsx                       # ACTUALIZAR: agregar botón QR

tests/Feature/
└── OCR/
    └── SATQRProcessingTest.php         # NUEVO - Tests para SAT QR
```

---

## 🎯 Plan de Ejecución DETALLADO

### **FASE 1: Backend - SAT QR Processing** (2-3 horas)

#### **Tarea 1.1: Configurar Gemini API**
```bash
# .env
GEMINI_API_KEY=AIzaSyAyMBXqBvB9TSFKe7ptFMNYtdlbDx8jPtk
GEMINI_MODEL=gemini-2.5-pro
GEMINI_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent
```

```php
// config/services.php
'gemini' => [
    'api_key' => env('GEMINI_API_KEY'),
    'model' => env('GEMINI_MODEL', 'gemini-2.5-pro'),
    'endpoint' => env('GEMINI_ENDPOINT'),
    'timeout' => 60,
    'temperature' => 0.1, // Baja para consistencia
],
```

---

#### **Tarea 1.2: Crear SATScraperService**
**Archivo**: `app/Services/SATScraperService.php`

**Métodos a implementar**:
1. `processQRUrl(string $qrUrl): array`
   - Validar URL SAT
   - Llamar fetchSATHTML()
   - Llamar extractDataFromHTML()
   - Llamar structureWithGemini()
   - Retornar datos normalizados

2. `fetchSATHTML(string $url): string`
   - **COPIAR de PHP**: Configuración cURL con `CURLOPT_SSL_CIPHER_LIST`
   - Validar respuesta HTTP 200
   - Detectar "no se le ha emitido su Cédula"
   - Retornar HTML

3. `extractDataFromHTML(string $html): array`
   - **COPIAR de PHP**: DOMDocument + XPath
   - Extraer elementos `<td>` pares
   - Extraer elementos `<ul>` pares
   - Retornar array de strings

4. `structureWithGemini(array $rawData): array`
   - **COPIAR de PHP**: Prompt de Gemini (líneas 130-170)
   - Llamar HTTP client a Gemini API
   - Parsear JSON response
   - Normalizar `Persona` a MAYÚSCULAS
   - Retornar array estructurado

**Código PHP a reutilizar** (sat/procesar.php):
```php
// Líneas 48-75 - Configuración cURL
curl_setopt($ch, CURLOPT_SSL_CIPHER_LIST, 'DEFAULT@SECLEVEL=1');
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 30);

// Líneas 79-82 - Validación contenido
if (stripos($response, 'no se le ha emitido su Cédula') !== false) {
    throw new Exception('RFC sin cédula fiscal emitida');
}

// Líneas 89-108 - XPath extracción
$xpath = new DOMXPath($dom);
$tdNodes = $xpath->query("//td");
foreach ($tdNodes as $index => $node) {
    if ($index % 2 == 0) {
        $tdArray[] = trim($node->nodeValue);
    }
}
$ulNodes = $xpath->query("//ul");
foreach ($ulNodes as $index => $node) {
    if ($index % 2 == 0 && !empty($node->nodeValue)) {
        $tdArray[] = trim($node->nodeValue);
    }
}

// Líneas 130-170 - Prompt Gemini
$prompt = "Extrae y estructura los siguientes datos de una constancia fiscal del SAT...
- Persona: 'FISICA' o 'MORAL' (según si tiene CURP o no)
- genero: 'HOMBRE' o 'MUJER' (solo si es persona física)
- nombre: nombre completo...
[COPIAR PROMPT COMPLETO]
";

// Líneas 260-267 - Normalización Persona
if (isset($datosEstructurados['persona'])) {
    $datosEstructurados['Persona'] = strtoupper($datosEstructurados['persona']);
    unset($datosEstructurados['persona']);
}
```

---

#### **Tarea 1.3: Actualizar OCRController**
**Archivo**: `app/Http/Controllers/Admin/OCRController.php`

**Nuevo método**:
```php
public function processSATQR(Request $request): JsonResponse
{
    $request->validate([
        'url' => 'required|url|string|max:500',
    ]);
    
    $qrUrl = $request->input('url');
    
    // Validar que sea URL del SAT
    if (!str_contains($qrUrl, 'siat.sat.gob.mx')) {
        return response()->json([
            'success' => false,
            'message' => 'La URL no corresponde a una constancia del SAT',
        ], 400);
    }
    
    try {
        $scraper = app(SATScraperService::class);
        $data = $scraper->processQRUrl($qrUrl);
        
        return response()->json([
            'success' => true,
            'data' => $data,
            'message' => 'Datos de constancia fiscal extraídos correctamente',
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error procesando QR SAT', [
            'url' => $qrUrl,
            'error' => $e->getMessage()
        ]);
        
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
        ], 500);
    }
}
```

**Ruta**:
```php
Route::post('sat-qr', [OCRController::class, 'processSATQR'])->name('sat-qr');
```

---

#### **Tarea 1.4: Crear Tests**
**Archivo**: `tests/Feature/OCR/SATQRProcessingTest.php`

**Tests a crear**:
1. `test_procesa_qr_sat_valido()`
   - Mock HTTP response del SAT
   - Mock Gemini API response
   - Verificar estructura datos

2. `test_rechaza_url_no_sat()`
   - URL de otro dominio
   - Verificar error 400

3. `test_maneja_error_curl_sat()`
   - Mock cURL error
   - Verificar error 500

4. `test_maneja_error_gemini()`
   - Mock Gemini 429 rate limit
   - Verificar mensaje específico

5. `test_normaliza_tipo_persona()`
   - Verificar conversión 'persona' → 'Persona'
   - Verificar MAYÚSCULAS

---

### **FASE 2: Frontend - QR Scanner Component** (3-4 horas)

#### **Tarea 2.1: Instalar html5-qrcode**
```bash
npm install html5-qrcode
npm install --save-dev @types/html5-qrcode
```

---

#### **Tarea 2.2: Crear utils/qr-parser.ts**
**Archivo**: `resources/js/utils/qr-parser.ts`

**Contenido**: **COPIAR Y ADAPTAR** todo el código JS de `qr-processor.js` líneas 230-650

**Funciones a exportar**:
```typescript
export function parseQRData(qrText: string): QRData | null
export function isActaNacimientoKV(text: string): boolean
export function parseActaNacimientoKV(text: string): QRData
export function isActaNacimiento(text: string): boolean
export function parseActaNacimiento(text: string): QRData
export function isRENAPO(text: string): boolean
export function parseRENAPO(text: string): QRData
export function parsePipeDelimited(text: string): QRData
export function normalizeDate(date: string): string | null
```

**Tipos**:
```typescript
interface QRData {
    _tipoDocumento?: 'acta_nacimiento' | 'curp' | 'sat' | 'ine';
    urlSAT?: string;
    curp?: string;
    rfc?: string;
    nombre?: string;
    apellidopat?: string;
    apellidomat?: string;
    dia?: string;
    genero?: 'H' | 'M';
    estado_nac?: string;
    municipio_nac?: string;
    padre_nombre?: string;
    madre_nombre?: string;
    folio_acta?: string;
    // ... más campos según necesidad
}
```

**Constantes a extraer**:
```typescript
export const ESTADOS_CODIGO: Record<string, string> = {
    '1': 'AGUASCALIENTES',
    '2': 'BAJA CALIFORNIA',
    // ... copiar del PHP
};

export const DOMINIOS_ACTA = [
    'cevar.registrocivil.gob.mx',
    'registrocivil.gob.mx',
    // ... copiar del PHP
];

export const DOMINIOS_RENAPO = [
    'consultas.curp.gob.mx',
    'curp.gob.mx',
    // ... copiar del PHP
];
```

---

#### **Tarea 2.3: Crear ScannerQR.tsx**
**Archivo**: `resources/js/components/Admin/RegistroWeb/ScannerQR.tsx`

**Props**:
```typescript
interface ScannerQRProps {
    isOpen: boolean;
    onClose: () => void;
    onDataExtracted: (data: QRData) => void;
}
```

**Estado**:
```typescript
const [mode, setMode] = useState<'choice' | 'camera'>('choice');
const [isScanning, setIsScanning] = useState(false);
const [scanner, setScanner] = useState<Html5Qrcode | null>(null);
```

**Estructura**:
```tsx
return (
    <Modal open={isOpen} onClose={onClose}>
        {mode === 'choice' && (
            <div>
                <button onClick={() => startCamera()}>Escanear con cámara</button>
                <input type="file" onChange={scanFromFile} accept="image/*" />
            </div>
        )}
        
        {mode === 'camera' && (
            <div>
                <div id="qr-reader" />
                <button onClick={onClose}>Cancelar</button>
            </div>
        )}
    </Modal>
);
```

**Lógica cámara**:
```typescript
const startCamera = async () => {
    setMode('camera');
    
    const html5QrCode = new Html5Qrcode("qr-reader");
    setScanner(html5QrCode);
    
    try {
        await html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 230, height: 230 } },
            (decodedText) => handleQRDetected(decodedText),
            () => {} // Error silencioso
        );
        setIsScanning(true);
    } catch (err) {
        console.error('Error iniciando cámara:', err);
    }
};
```

**Lógica detección**:
```typescript
const handleQRDetected = async (qrText: string) => {
    if (!isScanning) return;
    setIsScanning(false);
    
    // Cerrar scanner
    await scanner?.stop();
    onClose();
    
    // Parsear QR
    const data = parseQRData(qrText);
    
    if (!data) {
        // Mostrar QR raw si no se pudo parsear
        alert(`QR escaneado: ${qrText}`);
        return;
    }
    
    // Si es SAT, llamar backend
    if (data.urlSAT) {
        try {
            const response = await router.post('/admin/ocr/sat-qr', {
                url: data.urlSAT
            }, { preserveScroll: true });
            
            if (response.props.flash?.success) {
                onDataExtracted(response.props.flash.data);
            }
        } catch (err) {
            console.error('Error procesando QR SAT:', err);
        }
    } else {
        // Otros QR se procesan localmente
        onDataExtracted(data);
    }
};
```

---

#### **Tarea 2.4: Actualizar Index.tsx**
**Archivo**: `resources/js/pages/Admin/RegistroWeb/Index.tsx`

**Estado**:
```typescript
const [qrScannerOpen, setQrScannerOpen] = useState(false);
```

**Botón flotante** (línea ~150):
```tsx
{/* Botón QR Scanner - Ya existe visualmente, agregar onClick */}
<button
    onClick={() => setQrScannerOpen(true)}
    className="bg-green-600 hover:bg-green-700 text-white rounded-full p-4 shadow-lg"
    title="Escanear QR"
>
    <QrCodeIcon className="w-6 h-6" />
</button>
```

**Modal**:
```tsx
<ScannerQR
    isOpen={qrScannerOpen}
    onClose={() => setQrScannerOpen(false)}
    onDataExtracted={handleQRData}
/>
```

**Handler**:
```typescript
const handleQRData = (data: QRData) => {
    // Mapear datos a form
    form.setData({
        ...form.data,
        curp: data.curp || form.data.curp,
        rfc: data.rfc || form.data.rfc,
        nombre: data.nombre || form.data.nombre,
        apellidopat: data.apellidopat || form.data.apellidopat,
        apellidomat: data.apellidomat || form.data.apellidomat,
        dia: data.dia || form.data.dia,
        genero: data.genero || form.data.genero,
        // ... resto de campos
    });
    
    // Mostrar notificación
    toast.success('Datos cargados desde QR');
};
```

---

### **FASE 3: Testing E2E** (1 hora)

#### **Tarea 3.1: Test manual con QR real**
1. Generar QR de prueba SAT: https://siat.sat.gob.mx/...
2. Escanear con cámara
3. Verificar que llama al backend
4. Verificar que llena el formulario

#### **Tarea 3.2: Test con archivo imagen**
1. Imagen PNG con QR
2. Subir desde input file
3. Verificar parseo correcto

#### **Tarea 3.3: Test con diferentes formatos QR**
1. QR JSON directo
2. QR pipe-delimited
3. QR URL RENAPO
4. QR URL Acta
5. QR KV Registro Civil

---

## ✅ Criterios de Aceptación

- [ ] Backend procesa QR SAT correctamente (extrae 18 campos)
- [ ] Frontend decodifica QR con html5-qrcode
- [ ] Frontend identifica tipo automáticamente
- [ ] QR SAT llama al backend, otros se procesan localmente
- [ ] Formulario se llena con datos del QR
- [ ] Tests backend pasan 100%
- [ ] Manual usuario actualizado con GIF del flujo

---

## 🔄 Siguientes Botones (Replicar Patrón)

Una vez completado QR Scanner, el patrón se replica para:
1. **Acta Scanner** (más simple, solo OCR sin QR)
2. **CURP Scanner** (igual que Acta)
3. **INE Scanner** (dual side: frontal + reverso)

**Ventaja**: 70% del código ya estará listo (utils, servicios base, estructura componentes).

---

## 📊 Estimación de Tiempo

| Fase | Tiempo | Razón |
|------|--------|-------|
| Backend SAT | 2-3h | Código PHP existente se copia directo |
| Frontend Utils | 1-2h | Código JS se porta a TS directo |
| Componente React | 2h | Estructura similar a otros modals |
| Integración | 1h | Conectar botón + form |
| Testing | 1h | Manual + ajustes |
| **TOTAL** | **7-9h** | Primera implementación completa |

**Botones subsiguientes**: 2-3h cada uno (replicar patrón).
