# 🔄 Comparación Backend: PHP Original vs Laravel

**Fecha:** 7 Abril 2026  
**Sistema Origen:** notariosatinet.com.mx/atinet/index.php (1,493 líneas)  
**Sistema Destino:** Laravel Atinet_Compliance_Hub  
**Frontend Destino:** ✅ [Index.tsx](c:\Users\Dev pc\Desktop\LARAVEL\Atinet_Compliance_Hub\resources\js\pages\Admin\RegistroWeb\Index.tsx) COMPLETO  

---

## 📋 Resumen Ejecutivo

### ✅ Lo que SÍ existe:
- **Frontend completo en React** (Index.tsx con 85 campos en accordion)
- **Rutas Laravel definidas** (7 CRUD + 4 OCR endpoints)
- **Modelos duales** (RegistroPersona + LegacyRegistro)
- **Métodos básicos** en RegistroWebController

### ❌ Lo que FALTA implementar:
- **Validaciones completas** (solo 17/85 campos validados)
- **Lógica de negocio** (detección duplicados, conversión mayúsculas, diferenciación FISICA/MORAL)
- **OCR Backend funcional** (Gemini Vision API integration)
- **Validación de formatos** (CURP 18 chars, RFC 12-13 chars)
- **Auto-actualización** en lugar de error 409 por duplicados

---

## 🗂️ Arquitectura de APIs

### **Sistema PHP Original** (`c:\xampp\htdocs\notariosatinet.com.mx\utilerias_appliweb\api\`)

| API Endpoint | Archivo | Funcionalidad | Estado Laravel |
|--------------|---------|---------------|----------------|
| `POST /api/registrar/guardar.php` | guardar.php | Insertar/actualizar registro completo | 🟡 PARCIAL |
| `POST /api/registrar/borrar.php` | borrar.php | Soft delete de registro | ✅ EXISTE (`destroy`) |
| `POST /api/curp/buscar.php` | buscar.php | Buscar por CURP, retorna 43 campos | 🟡 PARCIAL |
| `POST /api/curp/procesar-ocr.php` | procesar-ocr.php | OCR Gemini Vision para CURP | ❌ FALTA |
| `POST /api/rfc/buscar.php` | buscar.php | Buscar por RFC, retorna 46 campos | 🟡 PARCIAL |
| `POST /api/ocr/procesar.php` | procesar.php | OCR general INE/Acta | ❌ FALTA |

### **Sistema Laravel Actual** (`app/Http/Controllers/Admin/`)

| Ruta Laravel | Método Controller | Estado | Gap |
|--------------|-------------------|--------|-----|
| `POST /admin/registro-web` | `store()` | 🟡 PARCIAL | Validación incompleta |
| `GET /admin/registro-web/search-curp` | `searchCurp()` | 🟡 PARCIAL | Sin validación formato |
| `GET /admin/registro-web/search-rfc` | `searchRfc()` | 🟡 PARCIAL | Sin validación formato |
| `DELETE /admin/registro-web/{id}` | `destroy()` | ✅ COMPLETO | ✅ OK |
| `POST /api/ocr/ine` | `OCRController::processINE()` | ❌ PLACEHOLDER | 501 Not Implemented |
| `POST /api/ocr/curp` | `OCRController::processCURP()` | ❌ PLACEHOLDER | 501 Not Implemented |
| `POST /api/ocr/acta` | `OCRController::processActa()` | ❌ PLACEHOLDER | 501 Not Implemented |
| `POST /api/ocr/qr` | `OCRController::processQR()` | ❌ PLACEHOLDER | 501 Not Implemented |

---

## 🔬 Análisis Detallado por Funcionalidad

---

### **1. Guardar Registro** 

#### 📄 **PHP Original** (`/api/registrar/guardar.php` líneas 1-260)

**Funcionalidades implementadas:**

```php
// 1. Detección de duplicados (INSERT o UPDATE)
$esActualizacion = false;
if (isset($data['idregistro'])) {
    $esActualizacion = true;
} else {
    // Buscar por CURP
    $sql = "SELECT idregistro FROM registro WHERE curp = ? LIMIT 1";
    // Si existe → actualizar, si no → insertar
}

// 2. Validación diferenciada por tipo persona
if ($tipoPersona === 'FISICA') {
    if (empty($data['nombre']) || empty($data['apellidopat']) || empty($data['rfc'])) {
        jsonResponse(false, null, 'Faltan campos requeridos...', 400);
    }
} else {
    if (empty($data['nombre']) || empty($data['rfc'])) {
        jsonResponse(false, null, 'Faltan campos requeridos: razón social y RFC', 400);
    }
}

// 3. Normalización de datos
'nombre' => strtoupper($data['nombre'] ?? ''),
'apellidopat' => strtoupper($data['apellidopat'] ?? ''),
'curp' => strtoupper($data['curp'] ?? ''),
'rfc' => strtoupper($data['rfc'] ?? ''),

// 4. Valores por defecto
'paisnac' => strtoupper($data['paisnac'] ?? 'MEXICO'),
'nacionalidad' => strtoupper($data['nacionalidad'] ?? 'MEXICANA'),
'pais' => strtoupper($data['pais'] ?? 'MEXICO'),
'pais_fiscal' => strtoupper($data['pais_fiscal'] ?? 'MEXICO'),

// 5. Conversión de tipos
'cp' => !empty($data['cp']) ? intval($data['cp']) : 0,
'num_doc_identificacion' => !empty($data['num_doc_identificacion']) ? intval($data['num_doc_identificacion']) : null,

// 6. Saneamiento
$data = sanitize($data); // Previene inyección SQL

// 7. Respuesta JSON estructurada
jsonResponse(true, $registroGuardado, "Registro #{$id} guardado correctamente");
```

**Campos procesados:** 85 campos completos con validaciones específicas

---

#### 🔷 **Laravel Actual** ([RegistroWebController.php](c:\Users\Dev pc\Desktop\LARAVEL\Atinet_Compliance_Hub\app\Http\Controllers\Admin\RegistroWebController.php) líneas 55-180)

**Funcionalidades implementadas:**

```php
public function store(Request $request): JsonResponse
{
    $validated = $request->validate([
        'persona' => 'required|in:fisica,moral',
        'nombre' => 'required|string|max:30',
        'apellidopat' => 'required|string|max:30',
        'apellidomat' => 'required|string|max:30',
        'curp' => 'nullable|string|max:50',
        'rfc' => 'required|string|max:50',
        'dia' => 'nullable|date',
        'genero' => 'nullable|string|max:10',
        // ... solo 17 campos validados
    ]);

    // Metadata automática
    $validated['dia_registro'] = now()->toDateString();
    $validated['notaria'] = Auth::user()->notaria_code ?? '';
    $validated['envio_de_correo'] = false;

    // Valores por defecto
    $validated['alias'] = $validated['alias'] ?? '';
    $validated['pais'] = $validated['pais'] ?? 'MEXICO';
    $validated['pais_fiscal'] = $validated['pais_fiscal'] ?? 'MEXICO';
    $validated['paisnac'] = $validated['paisnac'] ?? 'MEXICO';
    $validated['nacionalidad'] = $validated['nacionalidad'] ?? 'MEXICANA';

    // Guardar
    $registro = RegistroPersona::create($validated);

    return response()->json([
        'success' => true,
        'message' => "Registro #{$registro->id} creado correctamente",
        'data' => $registro,
    ]);
}
```

**Campos validados:** Solo 17 de 85 campos

---

#### ❌ **GAPS IDENTIFICADOS:**

| # | Funcionalidad PHP | Laravel Actual | Gap |
|---|-------------------|----------------|-----|
| **1** | Detección duplicados CURP antes de insertar | ❌ NO EXISTE | **CRÍTICO** - Permite duplicados |
| **2** | Detección duplicados RFC antes de insertar | ❌ NO EXISTE | **CRÍTICO** - Permite duplicados |
| **3** | Auto-UPDATE si existe CURP/RFC | ❌ NO EXISTE | **ALTA** - Solo hace INSERT |
| **4** | Validación diferenciada FISICA vs MORAL | ❌ NO EXISTE | **ALTA** - Valida igual |
| **5** | Conversión a MAYÚSCULAS (nombre, apellidos, CURP, RFC) | ❌ NO EXISTE | **MEDIA** - Inconsistencia datos |
| **6** | Validación 85 campos completos | ❌ Solo 17 validados | **ALTA** - 68 campos sin validar |
| **7** | Conversión tipos (int para CP, teléfonos) | ❌ NO EXISTE | **BAJA** - Todo string |
| **8** | Saneamiento anti-inyección SQL | ✅ Laravel escapa automático | ✅ OK |

---

### **2. Buscar por CURP**

#### 📄 **PHP Original** (`/api/curp/buscar.php`)

```php
// 1. Validación formato CURP
if (!preg_match('/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/', $curp)) {
    jsonResponse(false, null, 'Formato de CURP inválido', 400);
}

// 2. Normalización
$curp = strtoupper(trim($data['curp']));

// 3. Consulta específica con 43 campos
$sql = "SELECT 
            idregistro, Persona, curp, rfc, nombre, apellidopat, apellidomat,
            alias, dia, genero, paisnac, nacionalidad, estado_nac, ciudad_nac,
            municipio_nac, edo_civil, ocupacion, telefono, telefono_movil,
            correo, calle, no_exterior, no_interior, colonia, cp, municipio,
            estado, ciudad, pais, calle_fiscal, ...[43 campos totales]
        FROM registro 
        WHERE curp = ? 
        LIMIT 1";

// 4. Respuesta estructurada
if ($result && count($result) > 0) {
    jsonResponse(true, $result[0], 'Registro encontrado');
} else {
    jsonResponse(false, null, 'No se encontró registro con ese CURP', 404);
}
```

---

#### 🔷 **Laravel Actual** ([RegistroWebController.php](c:\Users\Dev pc\Desktop\LARAVEL\Atinet_Compliance_Hub\app\Http\Controllers\Admin\RegistroWebController.php) líneas 267-310)

```php
public function searchCurp(Request $request): JsonResponse
{
    $curp = strtoupper($request->query('curp', ''));

    if (empty($curp)) {
        return response()->json([
            'found' => false,
            'message' => 'CURP no proporcionado',
        ], 400);
    }

    // Buscar en BD nueva
    $persona = RegistroPersona::where('curp', $curp)->first();

    if ($persona) {
        return response()->json([
            'found' => true,
            'source' => 'nuevo',
            'data' => $persona,
            'message' => 'Registro encontrado en base de datos nueva',
        ]);
    }

    // Buscar en legacy
    $legacyPersona = LegacyRegistro::where('curp', $curp)->first();

    if ($legacyPersona) {
        return response()->json([
            'found' => true,
            'source' => 'legacy',
            'data' => $legacyPersona,
            'message' => 'Registro encontrado en sistema legacy (solo lectura)',
        ]);
    }

    return response()->json([
        'found' => false,
        'message' => 'No se encontró ningún registro con ese CURP',
    ]);
}
```

---

#### ❌ **GAPS IDENTIFICADOS:**

| # | Funcionalidad PHP | Laravel Actual | Gap |
|---|-------------------|----------------|-----|
| **1** | Validación regex formato CURP (18 caracteres) | ❌ NO VALIDA | **CRÍTICO** - Acepta cualquier string |
| **2** | Retorna 43 campos específicos | ✅ Retorna todos los campos | ✅ OK (mejor inclusivo) |
| **3** | Búsqueda dual (nueva + legacy) | ✅ IMPLEMENTADO | ✅ OK |
| **4** | Respuesta HTTP 404 si no existe | ❌ Retorna 200 con found=false | **BAJA** - Inconsistencia REST |

---

### **3. Buscar por RFC**

#### 📄 **PHP Original** (`/api/rfc/buscar.php`)

```php
// Validación formato RFC (12 o 13 caracteres)
if (!preg_match('/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{2,3}$/', $rfc)) {
    jsonResponse(false, null, 'Formato de RFC inválido', 400);
}
```

#### 🔷 **Laravel Actual** 

```php
public function searchRfc(Request $request): JsonResponse
{
    $rfc = strtoupper($request->query('rfc', ''));

    if (empty($rfc)) {
        return response()->json([
            'found' => false,
            'message' => 'RFC no proporcionado',
        ], 400);
    }

    // NO HAY VALIDACIÓN DE FORMATO ❌
    
    // ... (búsqueda similar a searchCurp)
}
```

---

#### ❌ **GAPS IDENTIFICADOS:**

| # | Funcionalidad PHP | Laravel Actual | Gap |
|---|-------------------|----------------|-----|
| **1** | Validación regex formato RFC (12-13 caracteres + patrón) | ❌ NO VALIDA | **CRÍTICO** - Acepta cualquier string |
| **2** | Búsqueda dual (nueva + legacy) | ✅ IMPLEMENTADO | ✅ OK |

---

### **4. OCR de Constancia CURP** 

#### 📄 **PHP Original** (`/api/curp/procesar-ocr.php`)

**Funcionalidades completas:**

```php
// 1. Configuración Gemini
$GEMINI_API_KEY  = "AIzaSyAyMBXqBvB9TSFKe7ptFMNYtdlbDx8jPtk";
$GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=$GEMINI_API_KEY";

// 2. Validación de imagen
$tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
$mimeType = mime_content_type($_FILES['imagen']['tmp_name']);

// 3. Conversión base64
$imageData = base64_encode(file_get_contents($_FILES['imagen']['tmp_name']));

// 4. Prompt específico Gemini
$prompt = <<<PROMPT
Analiza esta imagen de una Constancia de CURP del RENAPO.

Extrae los datos visibles y retorna ÚNICAMENTE un objeto JSON con estas claves:

{
  "curp": "CURP completo de 18 caracteres",
  "nombre": "nombre(s) de pila",
  "apellidopat": "apellido paterno",
  "apellidomat": "apellido materno",
  "dia": "fecha de nacimiento en formato YYYY-MM-DD",
  "genero": "H para Hombre o M para Mujer",
  "estado_nac": "nombre completo del estado mexicano",
  "municipio_nac": "municipio o alcaldía de nacimiento",
  "nacionalidad": "MEXICANA u otra si se indica"
}

REGLAS:
- Devuelve SOLO el JSON puro, sin texto adicional
- CURP: exactamente 18 caracteres
- Fecha SIEMPRE en formato YYYY-MM-DD
- Nombres en MAYÚSCULAS
PROMPT;

// 5. Llamada API Gemini
$requestData = [
    'contents' => [[
        'parts' => [
            ['text' => $prompt],
            [
                'inline_data' => [
                    'mime_type' => $mimeType,
                    'data' => $imageData
                ]
            ]
        ]
    ]],
    'generationConfig' => [
        'temperature' => 0.2,
        'topP' => 0.8,
        'maxOutputTokens' => 1024
    ]
];

// 6. Procesar respuesta
$ch = curl_init($endpoint);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($requestData));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);

// 7. Parsear JSON extraído
$result = json_decode($response, true);
$jsonText = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
$datos = json_decode($jsonText, true);

// 8. Validación post-procesamiento
if (empty($datos['curp']) || strlen($datos['curp']) !== 18) {
    throw new Exception('CURP extraído inválido');
}

return $datos;
```

---

#### 🔷 **Laravel Actual** ([OCRController.php](c:\Users\Dev pc\Desktop\LARAVEL\Atinet_Compliance_Hub\app\Http\Controllers\Admin\OCRController.php) líneas 60-91)

```php
public function processCURP(Request $request): JsonResponse
{
    $request->validate([
        'image' => 'required|image|max:10240',
    ]);

    // TODO: Implementar en Fase 4
    // $image = $request->file('image');
    //
    // $geminiService = new GeminiVisionService();
    // $rawData = $geminiService->analyzeCURP($image);
    //
    // $parser = new OCRParserService();
    // $parsedData = $parser->parseCURP($rawData);

    return response()->json([
        'success' => true,
        'message' => 'OCR para CURP pendiente de implementación (Fase 4)',
        'data' => [
            'curp' => '',
            'nombre' => '',
            'apellidopat' => '',
            'apellidomat' => '',
            'dia' => '',
            'genero' => '',
            'estado_nac' => '',
        ],
    ], 501); // Not Implemented
}
```

---

#### ❌ **GAPS IDENTIFICADOS:**

| # | Funcionalidad PHP | Laravel Actual | Gap |
|---|-------------------|----------------|-----|
| **1** | Integración Gemini Vision API completa | ❌ NO EXISTE | **CRÍTICA** - Placeholder 501 |
| **2** | Validación de tipo MIME imagen | ❌ NO EXISTE | **ALTA** - Solo valida "image" genérico |
| **3** | Conversión base64 | ❌ NO EXISTE | **ALTA** - Requerido por Gemini |
| **4** | Prompt estructurado específico para CURP | ❌ NO EXISTE | **CRÍTICA** - Sin prompt |
| **5** | Parseo JSON de respuesta Gemini | ❌ NO EXISTE | **CRÍTICA** - Sin procesamiento |
| **6** | Validación post-procesamiento (18 chars CURP) | ❌ NO EXISTE | **MEDIA** - Sin validación |
| **7** | Manejo de errores API externa | ❌ NO EXISTE | **ALTA** - Sin try-catch |

**Servicios faltantes necesarios:**
- ❌ `app/Services/GeminiVisionService.php` - Cliente API
- ❌ `app/Services/OCRParserService.php` - Parseo respuestas
- ❌ Config `config/services.php` - API key Gemini

---

### **5. OCR de INE** (Similar a CURP)

#### 🔷 **Laravel Actual** 

```php
public function processINE(Request $request): JsonResponse
{
    // TODO: Implementar en Fase 4
    return response()->json([...], 501);
}
```

**Gap:** Idéntico a OCR CURP (no implementado)

---

### **6. OCR de Acta de Nacimiento** (Similar a CURP)

**Gap:** Idéntico a OCR CURP (no implementado)

---

### **7. OCR de QR INE**

#### 🔷 **Laravel Actual**

```php
public function processQR(Request $request): JsonResponse
{
    $request->validate([
        'qr_data' => 'required|string|max:500',
    ]);

    // TODO: Implementar en Fase 4
    return response()->json([...], 501);
}
```

**Gap:** Decodificación QR MRZ no implementada

---

## 📊 Tabla Resumen de Gaps

| Categoría | Funcionalidad | PHP | Laravel | Prioridad | Esfuerzo |
|-----------|---------------|-----|---------|-----------|----------|
| **Validaciones** | Formato CURP (regex 18 chars) | ✅ | ❌ | 🔴 CRÍTICA | 1h |
| **Validaciones** | Formato RFC (regex 12-13 chars) | ✅ | ❌ | 🔴 CRÍTICA | 1h |
| **Validaciones** | 68 campos sin validar en store() | ✅ | ❌ | 🟠 ALTA | 3h |
| **Lógica** | Detección duplicados CURP/RFC | ✅ | ❌ | 🔴 CRÍTICA | 2h |
| **Lógica** | Auto-UPDATE vs INSERT | ✅ | ❌ | 🟠 ALTA | 2h |
| **Lógica** | Validación diferenciada FISICA/MORAL | ✅ | ❌ | 🟠 ALTA | 1h |
| **Normalización** | Conversión MAYÚSCULAS | ✅ | ❌ | 🟡 MEDIA | 1h |
| **Normalización** | Conversión tipos (int CP) | ✅ | ❌ | 🟢 BAJA | 0.5h |
| **OCR** | GeminiVisionService | ✅ | ❌ | 🔴 CRÍTICA | 4h |
| **OCR** | OCRParserService | ✅ | ❌ | 🔴 CRÍTICA | 3h |
| **OCR** | Procesamiento CURP | ✅ | ❌ | 🔴 CRÍTICA | 2h |
| **OCR** | Procesamiento INE | ✅ | ❌ | 🟠 ALTA | 3h |
| **OCR** | Procesamiento Acta | ✅ | ❌ | 🟡 MEDIA | 2h |
| **OCR** | Procesamiento QR | ✅ | ❌ | 🟡 MEDIA | 2h |

**Total estimado:** ~27 horas de desarrollo backend

---

## 🚀 Plan de Implementación Priorizado

### **Fase 2B: Completar Backend CRUD** (8-10 horas) 🔴 CRÍTICA

#### **Paso 1: Validaciones Formatos** (2h)
```php
// Form Request: StoreRegistroRequest.php

public function rules(): array
{
    return [
        // Validación CURP (18 caracteres exactos)
        'curp' => [
            'required_if:persona,fisica',
            'nullable',
            'string',
            'size:18',
            'regex:/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/',
            Rule::unique('registro_web', 'curp')->ignore($this->route('registro'))
        ],
        
        // Validación RFC (12-13 caracteres)
        'rfc' => [
            'required',
            'string',
            'between:12,13',
            'regex:/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{2,3}$/',
            Rule::unique('registro_web', 'rfc')->ignore($this->route('registro'))
        ],
        
        // ... 85 campos con validaciones específicas
    ];
}

public function messages(): array
{
    return [
        'curp.regex' => 'El formato del CURP es inválido. Debe tener 18 caracteres alfanuméricos.',
        'rfc.regex' => 'El formato del RFC es inválido.',
        // ...
    ];
}
```

**Comando:** `php artisan make:request StoreRegistroRequest`

---

#### **Paso 2: Detección Duplicados + Auto-UPDATE** (3h)
```php
// RegistroWebController.php

public function store(StoreRegistroRequest $request): JsonResponse
{
    $validated = $request->validated();
    
    // 1. Normalizar datos
    $validated = $this->normalizeData($validated);
    
    // 2. Buscar duplicados
    $existente = null;
    
    if (!empty($validated['curp'])) {
        $existente = RegistroPersona::where('curp', $validated['curp'])->first();
    }
    
    if (!$existente && !empty($validated['rfc'])) {
        $existente = RegistroPersona::where('rfc', $validated['rfc'])->first();
    }
    
    // 3. INSERT o UPDATE
    if ($existente) {
        $existente->update($validated);
        $accion = 'actualizado';
        $registro = $existente;
    } else {
        $registro = RegistroPersona::create($validated);
        $accion = 'creado';
    }
    
    return response()->json([
        'success' => true,
        'message' => "Registro #{$registro->id} {$accion} correctamente",
        'data' => $registro,
        'action' => $accion, // 'creado' o 'actualizado'
    ]);
}

protected function normalizeData(array $data): array
{
    // Conversión MAYÚSCULAS
    $camposMayusculas = [
        'nombre', 'apellidopat', 'apellidomat', 'curp', 'rfc',
        'nombre_conyuge', 'Apellido_paterno_conyuge', 'Apellido_materno_conyuge',
        'calle', 'colonia', 'municipio', 'estado', 'ciudad', 'pais',
        'calle_fiscal', 'colonia_fiscal', 'municipio_fiscal', 'estado_fiscal',
        'paisnac', 'nacionalidad', 'estado_nac', 'ciudad_nac', 'municipio_nac'
    ];
    
    foreach ($camposMayusculas as $campo) {
        if (isset($data[$campo])) {
            $data[$campo] = strtoupper($data[$campo]);
        }
    }
    
    // Conversión tipos
    if (isset($data['cp'])) {
        $data['cp'] = (int) $data['cp'];
    }
    if (isset($data['cp_fiscal'])) {
        $data['cp_fiscal'] = (int) $data['cp_fiscal'];
    }
    
    // Valores por defecto
    $data['pais'] = $data['pais'] ?? 'MEXICO';
    $data['pais_fiscal'] = $data['pais_fiscal'] ?? 'MEXICO';
    $data['paisnac'] = $data['paisnac'] ?? 'MEXICO';
    $data['nacionalidad'] = $data['nacionalidad'] ?? 'MEXICANA';
    
    return $data;
}
```

---

#### **Paso 3: Validación Diferenciada FISICA/MORAL** (1h)
```php
// StoreRegistroRequest.php

public function rules(): array
{
    $persona = $this->input('persona', 'fisica');
    
    $rules = [
        'persona' => 'required|in:fisica,moral',
        'rfc' => 'required|string|between:12,13|regex:/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{2,3}$/',
        'correo' => 'required|email|max:150',
    ];
    
    if ($persona === 'fisica') {
        // Persona FÍSICA: apellidos obligatorios
        $rules['nombre'] = 'required|string|max:30';
        $rules['apellidopat'] = 'required|string|max:30';
        $rules['apellidomat'] = 'required|string|max:30';
        $rules['curp'] = 'required|string|size:18|regex:/^[A-Z]{4}\d{6}[HM][A-Z]{5}[0-9A-Z]\d$/';
    } else {
        // Persona MORAL: solo razón social
        $rules['nombre'] = 'required|string|max:255'; // Razón social completa
        $rules['apellidopat'] = 'nullable|string|max:30';
        $rules['apellidomat'] = 'nullable|string|max:30';
        $rules['curp'] = 'nullable|string|size:18';
    }
    
    return $rules;
}
```

---

#### **Paso 4: Validación 85 Campos Completos** (2-3h)
Ver archivo completo en: [VALIDACIONES_COMPLETAS_85_CAMPOS.md](./VALIDACIONES_COMPLETAS_85_CAMPOS.md)

---

### **Fase 4: Implementar OCR Backend** (10-12 horas) 🟠 ALTA

#### **Paso 1: Crear GeminiVisionService** (4h)

```php
// app/Services/GeminiVisionService.php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiVisionService
{
    private string $apiKey;
    private string $endpoint;
    
    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
        $this->endpoint = config('services.gemini.endpoint');
    }
    
    /**
     * Analizar imagen con Gemini Vision
     */
    public function analyzeImage(string $imageBase64, string $mimeType, string $prompt): array
    {
        $requestData = [
            'contents' => [[
                'parts' => [
                    ['text' => $prompt],
                    [
                        'inline_data' => [
                            'mime_type' => $mimeType,
                            'data' => $imageBase64
                        ]
                    ]
                ]
            ]],
            'generationConfig' => [
                'temperature' => 0.2,
                'topP' => 0.8,
                'maxOutputTokens' => 1024
            ]
        ];
        
        $response = Http::withHeaders([
            'Content-Type' => 'application/json'
        ])->post($this->endpoint . '?key=' . $this->apiKey, $requestData);
        
        if ($response->failed()) {
            Log::error('Gemini API Error', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            throw new \Exception('Error al procesar imagen con Gemini Vision');
        }
        
        $result = $response->json();
        $jsonText = $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
        
        // Limpiar respuesta (puede venir con ```json o texto extra)
        $jsonText = preg_replace('/```json\s*|\s*```/', '', $jsonText);
        $jsonText = trim($jsonText);
        
        $data = json_decode($jsonText, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Respuesta de Gemini no es JSON válido: ' . $jsonText);
        }
        
        return $data;
    }
    
    /**
     * Procesar constancia CURP
     */
    public function analyzeCURP(string $imageBase64, string $mimeType): array
    {
        $prompt = <<<PROMPT
Analiza esta imagen de una Constancia de CURP del RENAPO.

Extrae los datos visibles y retorna ÚNICAMENTE un objeto JSON:

{
  "curp": "CURP completo de 18 caracteres",
  "nombre": "nombre(s) de pila",
  "apellidopat": "apellido paterno",
  "apellidomat": "apellido materno",
  "dia": "fecha de nacimiento en formato YYYY-MM-DD",
  "genero": "H para Hombre o M para Mujer",
  "estado_nac": "nombre completo del estado mexicano",
  "municipio_nac": "municipio o alcaldía",
  "nacionalidad": "MEXICANA u otra",
  "paisnac": "MEXICO u otro país"
}

REGLAS:
- Devuelve SOLO el JSON puro, sin texto adicional
- CURP: exactamente 18 caracteres
- Fecha SIEMPRE en formato YYYY-MM-DD
- Nombres en MAYÚSCULAS
PROMPT;
        
        return $this->analyzeImage($imageBase64, $mimeType, $prompt);
    }
    
    /**
     * Procesar INE (frente o reverso)
     */
    public function analyzeINE(string $imageBase64, string $mimeType, string $side = 'front'): array
    {
        $prompt = $side === 'front' 
            ? $this->getPromptINEFront() 
            : $this->getPromptINEBack();
        
        return $this->analyzeImage($imageBase64, $mimeType, $prompt);
    }
    
    private function getPromptINEFront(): string
    {
        return <<<PROMPT
Analiza esta imagen del FRENTE de una credencial INE mexicana.

Extrae ÚNICAMENTE JSON:

{
  "nombre": "nombre(s)",
  "apellidopat": "apellido paterno",
  "apellidomat": "apellido materno",
  "calle": "calle del domicilio",
  "no_exterior": "número exterior",
  "colonia": "colonia",
  "municipio": "municipio o alcaldía",
  "estado": "estado",
  "cp": "código postal (5 dígitos)",
  "no_identificacion": "clave electoral",
  "vigiencia_de_ine": "vigencia en formato YYYY-MM-DD"
}
PROMPT;
    }
    
    private function getPromptINEBack(): string
    {
        return <<<PROMPT
Analiza esta imagen del REVERSO de una credencial INE mexicana.

Extrae ÚNICAMENTE JSON:

{
  "curp": "CURP de 18 caracteres",
  "dia": "fecha de nacimiento en formato YYYY-MM-DD",
  "genero": "H o M",
  "estado_nac": "estado de nacimiento"
}
PROMPT;
    }
}
```

**Comando:** `php artisan make:class Services/GeminiVisionService`

---

#### **Paso 2: Configurar API Key Gemini** (0.5h)

```php
// config/services.php

return [
    // ... otros servicios
    
    'gemini' => [
        'api_key' => env('GEMINI_API_KEY'),
        'endpoint' => env('GEMINI_API_ENDPOINT', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent'),
        'model' => env('GEMINI_MODEL', 'gemini-2.0-flash-exp'),
    ],
];
```

```bash
# .env
GEMINI_API_KEY=AIzaSyAyMBXqBvB9TSFKe7ptFMNYtdlbDx8jPtk
GEMINI_API_ENDPOINT=https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent
```

---

#### **Paso 3: Implementar OCRController Completo** (3h)

```php
// app/Http/Controllers/Admin/OCRController.php

public function processCURP(Request $request): JsonResponse
{
    $request->validate([
        'image' => 'required|file|mimes:jpeg,jpg,png,webp|max:10240',
    ]);
    
    try {
        $image = $request->file('image');
        $imageBase64 = base64_encode($image->get());
        $mimeType = $image->getMimeType();
        
        // Procesar con Gemini
        $gemini = new GeminiVisionService();
        $data = $gemini->analyzeCURP($imageBase64, $mimeType);
        
        // Validar CURP extraído
        if (empty($data['curp']) || strlen($data['curp']) !== 18) {
            return response()->json([
                'success' => false,
                'message' => 'No se pudo extraer un CURP válido de la imagen',
                'data' => $data
            ], 422);
        }
        
        return response()->json([
            'success' => true,
            'message' => 'Constancia CURP procesada exitosamente',
            'data' => $data
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error en OCR CURP', [
            'message' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'success' => false,
            'message' => 'Error al procesar imagen: ' . $e->getMessage()
        ], 500);
    }
}

// Implementar processINE, processActa, processQR de forma similar
```

---

#### **Paso 4: Testing OCR** (2h)

```php
// tests/Feature/OCRTest.php

class OCRTest extends TestCase
{
    public function test_procesar_curp_con_imagen_valida()
    {
        Storage::fake('local');
        
        $response = $this->post('/api/ocr/curp', [
            'image' => UploadedFile::fake()->image('curp.jpg')
        ]);
        
        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'success',
                     'data' => [
                         'curp',
                         'nombre',
                         'apellidopat',
                         'dia',
                         'genero'
                     ]
                 ]);
        
        $this->assertEquals(18, strlen($response->json('data.curp')));
    }
}
```

---

## ✅ Checklist Completo Backend

### **Validaciones**
- [ ] Validación regex CURP (18 caracteres)
- [ ] Validación regex RFC (12-13 caracteres)
- [ ] Validación 85 campos completos en StoreRegistroRequest
- [ ] Validación diferenciada FISICA vs MORAL
- [ ] Mensajes de error personalizados en español

### **Lógica de Negocio**
- [ ] Detección duplicados por CURP antes de insertar
- [ ] Detección duplicados por RFC antes de insertar
- [ ] Auto-UPDATE si existe CURP/RFC duplicado
- [ ] Normalización MAYÚSCULAS (nombre, apellidos, CURP, RFC, direcciones)
- [ ] Conversión tipos (int para CP, teléfonos)
- [ ] Valores por defecto (MEXICO, MEXICANA)

### **Búsquedas**
- [ ] searchCurp() con validación formato
- [ ] searchRfc() con validación formato
- [ ] Búsqueda dual (nueva + legacy) funcionando
- [ ] Respuestas HTTP codes correctos (404, 400)

### **OCR Backend**
- [ ] GeminiVisionService implementado
- [ ] Config Gemini API key en services.php
- [ ] OCRController::processCURP() completo
- [ ] OCRController::processINE() completo (frente + reverso)
- [ ] OCRController::processActa() completo
- [ ] OCRController::processQR() completo
- [ ] Manejo de errores API externa
- [ ] Logs de debugging
- [ ] Tests unitarios OCR

### **Testing**
- [ ] Tests Feature para store() (INSERT + UPDATE)
- [ ] Tests Feature para searchCurp()
- [ ] Tests Feature para searchRfc()
- [ ] Tests Feature para OCR endpoints
- [ ] Tests de validación (campos requeridos, formatos)

---

## 🎯 Resumen Final

| Aspecto | PHP Original | Laravel Actual | Gap |
|---------|--------------|----------------|-----|
| **Frontend** | ✅ index.php completo | ✅ Index.tsx completo | ✅ OK |
| **Backend CRUD** | ✅ 100% funcional | 🟡 40% funcional | ❌ 60% FALTA |
| **Validaciones** | ✅ 85 campos + formatos | 🟡 17 campos básicos | ❌ 68 FALTA |
| **OCR Backend** | ✅ 4 scanners funcionales | ❌ 0% implementado | ❌ 100% FALTA |
| **Lógica Negocio** | ✅ Completa | 🟡 Básica | ❌ 70% FALTA |

**Progreso Backend estimado:** ~40%  
**Tiempo para completar:** ~27 horas (3-4 días laborables)

---

## 📚 Referencias

- **PHP Original:** `c:\xampp\htdocs\notariosatinet.com.mx\atinet\index.php`
- **API PHP:** `c:\xampp\htdocs\notariosatinet.com.mx\utilerias_appliweb\api\`
- **Laravel Controller:** [RegistroWebController.php](c:\Users\Dev pc\Desktop\LARAVEL\Atinet_Compliance_Hub\app\Http\Controllers\Admin\RegistroWebController.php)
- **Laravel OCR:** [OCRController.php](c:\Users\Dev pc\Desktop\LARAVEL\Atinet_Compliance_Hub\app\Http\Controllers\Admin\OCRController.php)
- **Frontend React:** [Index.tsx](c:\Users\Dev pc\Desktop\LARAVEL\Atinet_Compliance_Hub\resources\js\pages\Admin\RegistroWeb\Index.tsx)
- **Análisis Gap Original:** [ANALISIS_GAP_REGISTRO_WEB.md](./ANALISIS_GAP_REGISTRO_WEB.md)

---

**Próximo Paso Recomendado:** Comenzar con **Fase 2B: Completar Backend CRUD** (validaciones + lógica de negocio) antes de implementar OCR, ya que el frontend necesita CRUD funcional primero.
