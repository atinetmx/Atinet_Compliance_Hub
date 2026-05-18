# Implementación: Registro Web (Réplica 1:1 del sistema PHP)

## 📋 Objetivo
Replicar **exactamente** el sistema de Registro Web existente en PHP (`notariosatinet.com.mx/atinet/`) en Laravel 12 + Inertia.js + React, manteniendo:
- **Diseño idéntico** (100% Tailwind CSS, mismos colores, estilos)
- **Misma funcionalidad** (4 scanners, formulario 85 campos, accordion)
- **Mismas librerías** (TensorFlow.js, html5-qrcode, SweetAlert2)
- **Mismas APIs** (Gemini Vision para OCR)

---

## 🗂️ Estructura del Sistema PHP Actual

### **Archivo Principal**
```
notariosatinet.com.mx/atinet/index.php (1493 líneas)
├── Header (Logo Atinet + Logo Notaría)
├── 5 Botones Flotantes (OCR INE, CURP, Acta, QR, Manual)
├── Tabs (Persona Física / Moral)
└── Formulario con 5 Secciones Accordion:
    ├── 1. Datos Generales (18 campos)
    ├── 2. Datos del Cónyuge (11 campos) [condicional]
    ├── 3. Domicilio (30+ campos: particular + fiscal + notificaciones)
    ├── 4. Datos de Contacto (emails, teléfonos, redes sociales)
    └── 5. Datos del Testador (herederos, beneficiarios)
```

### **JavaScript Modules (ES6)**
```
utilerias_appliweb/assets/js/modules/
├── form-manager.js      → Gestión del formulario principal
├── api-client.js        → Cliente HTTP para APIs
├── ocr-processor.js     → Scanner OCR INE (TensorFlow.js)
├── qr-processor.js      → Scanner QR (html5-qrcode)
├── curp-scanner.js      → Scanner CURP (Gemini Vision)
├── acta-scanner.js      → Scanner Acta Nacimiento (Gemini Vision)
├── atinet-loader.js     → Loader animado
└── intro-animation.js   → Animación de entrada
```

### **Librerías Externas**
- **Tailwind CSS** (CDN)
- **SweetAlert2** (alertas/modales)
- **Font Awesome** (iconos)
- **TensorFlow.js + COCO-SSD** (detección de objetos)
- **html5-qrcode** (escaneo QR)
- **Gemini Vision API** (OCR avanzado)

---

## 🏗️ Arquitectura Laravel + React

### **1. Backend Laravel**

#### **Rutas (`routes/web.php`)**
```php
// Grupo protegido por autenticación
Route::middleware(['auth'])->group(function () {
    Route::prefix('admin/registro-web')->group(function () {
        Route::get('/', [RegistroWebController::class, 'index'])->name('registro-web.index');
        Route::post('/store', [RegistroWebController::class, 'store'])->name('registro-web.store');
        Route::get('/search-curp', [RegistroWebController::class, 'searchCurp'])->name('registro-web.search-curp');
        Route::get('/search-rfc', [RegistroWebController::class, 'searchRfc'])->name('registro-web.search-rfc');
    });
    
    // APIs para OCR
    Route::prefix('api/ocr')->group(function () {
        Route::post('/ine', [OCRController::class, 'processINE'])->name('api.ocr.ine');
        Route::post('/curp', [OCRController::class, 'processCURP'])->name('api.ocr.curp');
        Route::post('/acta', [OCRController::class, 'processActa'])->name('api.ocr.acta');
        Route::post('/qr', [OCRController::class, 'processQR'])->name('api.ocr.qr');
    });
});
```

#### **Controladores**
```
app/Http/Controllers/Admin/
├── RegistroWebController.php    → CRUD principal, renderiza página Inertia
└── OCRController.php             → Procesa imágenes, llama Gemini API
```

#### **Modelos**
```
app/Models/
├── RegistroPersona.php           → Modelo principal (85 campos)
├── RegistroConyuge.php           → Datos del cónyuge
└── RegistroTestador.php          → Datos testamentarios
```

#### **Migraciones**
```
database/migrations/
├── xxxx_create_registro_personas_table.php
├── xxxx_create_registro_conyuges_table.php
└── xxxx_create_registro_testadores_table.php
```

#### **Servicios**
```
app/Services/
├── GeminiVisionService.php       → Cliente para Gemini Vision API
└── OCRParserService.php          → Parseo de respuestas OCR
```

---

### **2. Frontend React + Inertia**

#### **Estructura de Archivos**
```
resources/js/
├── pages/
│   └── admin/
│       └── RegistroWeb/
│           └── Index.tsx                    → Página principal (1 solo archivo)
│
├── components/
│   └── registro-web/
│       ├── RegistroHeader.tsx               → Header con logos
│       ├── RegistroTabs.tsx                 → Tabs Física/Moral
│       ├── RegistroAccordion.tsx            → Componente accordion reutilizable
│       ├── FormSection1_DatosGenerales.tsx  → Sección 1
│       ├── FormSection2_Conyuge.tsx         → Sección 2
│       ├── FormSection3_Domicilio.tsx       → Sección 3
│       ├── FormSection4_Contacto.tsx        → Sección 4
│       ├── FormSection5_Testador.tsx        → Sección 5
│       ├── FloatingButtons.tsx              → 5 botones flotantes
│       └── scanners/
│           ├── ScannerINE.tsx               → Modal + lógica OCR INE
│           ├── ScannerCURP.tsx              → Modal + lógica CURP
│           ├── ScannerActa.tsx              → Modal + lógica Acta
│           ├── ScannerQR.tsx                → Modal + lógica QR
│           └── hooks/
│               ├── useCamera.ts             → Hook para acceso a cámara
│               ├── useOCR.ts                → Hook para TensorFlow.js
│               └── useQRScanner.ts          → Hook para html5-qrcode
│
└── lib/
    └── registro-web/
        ├── gemini-client.ts                 → Cliente Gemini (llama API Laravel)
        └── form-validation.ts               → Validación Zod
```

---

## 📦 Instalación de Dependencias

### **NPM Packages**
```bash
cd "c:\Users\Dev pc\Desktop\LARAVEL\Atinet_Compliance_Hub"

# React Hook Form + Validación
npm install react-hook-form zod @hookform/resolvers

# TensorFlow.js + COCO-SSD (detección de objetos)
npm install @tensorflow/tfjs @tensorflow-models/coco-ssd

# html5-qrcode (escaneo QR)
npm install html5-qrcode

# SweetAlert2 para React
npm install sweetalert2 sweetalert2-react-content

# Tipos TypeScript
npm install -D @types/react-hook-form
```

### **CDNs a mantener en `app.blade.php`**
```html
<!-- Font Awesome (ya está) -->
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
```

---

## 🎨 Migración de Estilos (Copy-Paste)

### **De PHP a React: Estilos Accordion**
El CSS del accordion en `index.php` (líneas 73-168) se puede copiar **directamente** a:

**Opción 1: Archivo CSS separado**
```
resources/css/registro-web.css
```

**Opción 2: Tailwind Config (preferido)**
Usar las mismas clases en componentes React:
```tsx
// FormSection.tsx
<div className="accordion-section active">
  <div className="accordion-header" onClick={toggle}>
    <h2 className="flex items-center gap-3 text-lg font-semibold">
      <i className="fas fa-user-circle" />
      <span>Datos Generales</span>
    </h2>
    <i className={`fas fa-chevron-down toggle-icon ${isOpen ? 'rotate-180' : ''}`} />
  </div>
  <div className={`accordion-content ${isOpen ? 'max-h-[5000px] p-8' : 'max-h-0'}`}>
    {children}
  </div>
</div>
```

**CSS a agregar en `resources/css/app.css`:**
```css
/* Copiar exactamente desde index.php líneas 73-168 */
.accordion-section {
    margin-bottom: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    overflow: hidden;
    background: white;
}

.accordion-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.25rem 1.5rem;
    background: linear-gradient(to right, #0284c7, #0369a1);
    color: white;
    cursor: pointer;
    user-select: none;
    transition: background 0.3s;
}

.accordion-header:hover {
    background: linear-gradient(to right, #0369a1, #075985);
}

.toggle-icon {
    transition: transform 0.3s;
}

.accordion-section.active .toggle-icon {
    transform: rotate(180deg);
}

.accordion-content {
    max-height: 0;
    overflow: hidden;
    transition: max-height 0.3s ease-out;
}

.accordion-section.active .accordion-content {
    max-height: 5000px;
    padding: 2rem 1.5rem;
}

.form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
}

.subsection-title {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 2rem 0 1.5rem 0;
    padding-bottom: 0.5rem;
    border-bottom: 2px solid #0284c7;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.required {
    color: #ef4444;
}
```

---

## 🔄 Migración de Lógica JavaScript

### **1. Scanner OCR INE → React Component**

**PHP Original (`ocr-processor.js`, líneas 1-100)**
```javascript
export class ScannerOCR {
    constructor(formManager) {
        this.formManager = formManager;
        this.modal = null;
        this.video = null;
        this.canvas = null;
        this.stream = null;
    }
    
    async abrir() {
        // Crear modal, iniciar cámara
    }
    
    async capturarINE() {
        // Capturar frame, enviar a API
    }
}
```

**React + TypeScript equivalente:**
```tsx
// components/registro-web/scanners/ScannerINE.tsx
import { useState, useRef } from 'react';
import { useCamera } from './hooks/useCamera';
import { useOCR } from './hooks/useOCR';

interface ScannerINEProps {
    isOpen: boolean;
    onClose: () => void;
    onDataExtracted: (data: any) => void;
}

export default function ScannerINE({ isOpen, onClose, onDataExtracted }: ScannerINEProps) {
    const [mode, setMode] = useState<'choice' | 'camera'>('choice');
    const { videoRef, canvasRef, startCamera, stopCamera, captureFrame } = useCamera();
    const { processImage, isProcessing } = useOCR();
    
    const handleCapture = async () => {
        const imageData = captureFrame();
        const result = await processImage(imageData, 'ine');
        onDataExtracted(result);
        onClose();
    };
    
    return (
        <div className={`scanner-modal ${isOpen ? 'active' : ''}`}>
            {mode === 'choice' ? (
                <div id="ocrChoicePanel">
                    <button onClick={() => { setMode('camera'); startCamera(); }}>
                        <i className="fas fa-camera mr-2" />
                        Escanear con cámara
                    </button>
                    <label>
                        <i className="fas fa-folder-open mr-2" />
                        Cargar desde dispositivo
                        <input type="file" onChange={handleFileUpload} />
                    </label>
                </div>
            ) : (
                <div id="ocrCameraPanel">
                    <video ref={videoRef} autoPlay playsInline />
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                    <button onClick={handleCapture} disabled={isProcessing}>
                        Capturar
                    </button>
                </div>
            )}
        </div>
    );
}
```

### **2. Hook para Cámara (Reutilizable)**
```tsx
// hooks/useCamera.ts
import { useRef, useCallback } from 'react';

export function useCamera() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    
    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: 1920, height: 1080 }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (error) {
            console.error('Error al acceder a la cámara:', error);
        }
    }, []);
    
    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(track => track.stop());
        streamRef.current = null;
    }, []);
    
    const captureFrame = useCallback((): string => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return '';
        
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);
        
        return canvas.toDataURL('image/jpeg', 0.95);
    }, []);
    
    return { videoRef, canvasRef, startCamera, stopCamera, captureFrame };
}
```

### **3. Hook para OCR (TensorFlow + API Laravel)**
```tsx
// hooks/useOCR.ts
import { useState } from 'react';
import axios from 'axios';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export function useOCR() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [model, setModel] = useState<cocoSsd.ObjectDetection | null>(null);
    
    const loadModel = async () => {
        if (!model) {
            const loaded = await cocoSsd.load();
            setModel(loaded);
        }
    };
    
    const processImage = async (imageData: string, type: 'ine' | 'curp' | 'acta') => {
        setIsProcessing(true);
        try {
            // 1. Detectar con TensorFlow si es documento válido
            await loadModel();
            // ... lógica de detección ...
            
            // 2. Enviar a API Laravel para OCR con Gemini
            const response = await axios.post(`/api/ocr/${type}`, {
                image: imageData
            });
            
            return response.data;
        } catch (error) {
            console.error('Error en OCR:', error);
            throw error;
        } finally {
            setIsProcessing(false);
        }
    };
    
    return { processImage, isProcessing };
}
```

---

## 📝 Formulario Principal con React Hook Form

### **Structure**
```tsx
// pages/admin/RegistroWeb/Index.tsx
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registroSchema } from '@/lib/registro-web/form-validation';

export default function RegistroWebIndex() {
    const methods = useForm({
        resolver: zodResolver(registroSchema),
        defaultValues: {
            Persona: 'FISICA',
            notaria: '',
            curp: '',
            rfc: '',
            nombre: '',
            apellidopat: '',
            apellidomat: '',
            // ... 85 campos
        }
    });
    
    const [personaType, setPersonaType] = useState<'FISICA' | 'MORAL'>('FISICA');
    const [scannerOpen, setScannerOpen] = useState<'ine' | 'curp' | 'acta' | 'qr' | null>(null);
    
    const onSubmit = async (data: any) => {
        try {
            await axios.post('/admin/registro-web/store', data);
            Swal.fire('¡Éxito!', 'Registro guardado correctamente', 'success');
        } catch (error) {
            Swal.fire('Error', 'No se pudo guardar el registro', 'error');
        }
    };
    
    return (
        <FormProvider {...methods}>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
                <RegistroHeader />
                
                <FloatingButtons onScannerOpen={setScannerOpen} />
                
                <main className="max-w-[1920px] mx-auto px-[50px] py-2.5">
                    <RegistroTabs 
                        activeTab={personaType}
                        onChange={setPersonaType}
                    />
                    
                    <form onSubmit={methods.handleSubmit(onSubmit)} className="bg-white shadow-lg rounded-b-xl p-8">
                        <FormSection1_DatosGenerales personaType={personaType} />
                        {personaType === 'FISICA' && <FormSection2_Conyuge />}
                        <FormSection3_Domicilio />
                        <FormSection4_Contacto />
                        <FormSection5_Testador />
                        
                        <div className="mt-8 flex gap-4">
                            <button type="submit" className="btn-primary">Guardar</button>
                            <button type="button" onClick={() => methods.reset()} className="btn-secondary">
                                Limpiar
                            </button>
                        </div>
                    </form>
                </main>
                
                {/* Scanners Modals */}
                <ScannerINE 
                    isOpen={scannerOpen === 'ine'}
                    onClose={() => setScannerOpen(null)}
                    onDataExtracted={(data) => {
                        methods.setValue('nombre', data.nombre);
                        methods.setValue('apellidopat', data.apellidoPaterno);
                        // ... autollenar campos
                    }}
                />
                {/* ... otros scanners */}
            </div>
        </FormProvider>
    );
}
```

---

## 🔐 Backend: Controller + Service

### **OCRController.php**
```php
<?php

namespace App\Http\Controllers\Admin;

use App\Services\GeminiVisionService;
use App\Services\OCRParserService;
use Illuminate\Http\Request;

class OCRController extends Controller
{
    public function __construct(
        private GeminiVisionService $gemini,
        private OCRParserService $parser
    ) {}
    
    public function processINE(Request $request)
    {
        $request->validate([
            'image' => 'required|string' // base64
        ]);
        
        // Decodificar base64
        $imageData = $request->input('image');
        $imageData = preg_replace('/^data:image\/\w+;base64,/', '', $imageData);
        $imageData = base64_decode($imageData);
        
        // Enviar a Gemini Vision
        $prompt = "Extrae los siguientes datos de esta INE mexicana: nombre completo, CURP, fecha de nacimiento, dirección, clave electoral...";
        $ocrText = $this->gemini->analyzeImage($imageData, $prompt);
        
        // Parsear respuesta
        $parsedData = $this->parser->parseINE($ocrText);
        
        return response()->json($parsedData);
    }
    
    public function processCURP(Request $request)
    {
        // Similar a processINE pero para constancia CURP
    }
    
    public function processActa(Request $request)
    {
        // Similar pero para acta de nacimiento
    }
    
    public function processQR(Request $request)
    {
        // Decodificar QR y extraer datos
    }
}
```

### **GeminiVisionService.php**
```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GeminiVisionService
{
    private string $apiKey;
    private string $apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key');
    }
    
    public function analyzeImage(string $imageData, string $prompt): string
    {
        $response = Http::withHeaders([
            'Content-Type' => 'application/json',
        ])->post($this->apiUrl . '?key=' . $this->apiKey, [
            'contents' => [
                [
                    'parts' => [
                        ['text' => $prompt],
                        [
                            'inline_data' => [
                                'mime_type' => 'image/jpeg',
                                'data' => base64_encode($imageData)
                            ]
                        ]
                    ]
                ]
            ]
        ]);
        
        if ($response->failed()) {
            throw new \Exception('Error al llamar a Gemini API');
        }
        
        $result = $response->json();
        return $result['candidates'][0]['content']['parts'][0]['text'] ?? '';
    }
}
```

---

## 📊 Base de Datos

### **✅ Arquitectura: Nueva Tabla + Legacy Read-Only**

El sistema sigue el patrón arquitectónico establecido:
- **Datos NUEVOS** → Se escriben en `registro_web` (Atinet_Compliance_Hub)
- **Datos LEGACY** → Se leen desde `atinet65_aplicativos.registro` (READ ONLY)
- **Visualización** → Se combinan ambas fuentes para mostrar historial completo

**Documentación completa:** Ver [INTEGRACION_BD_LEGACY_REGISTRO.md](./INTEGRACION_BD_LEGACY_REGISTRO.md)

### **Tabla NUEVA: `registro_web`** (Atinet_Compliance_Hub)

```sql
-- Migración creada: xxxx_create_registro_web_table.php
-- ✅ Tabla nueva con features modernas de Laravel

CREATE TABLE `registro_web` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `dia_registro` date NOT NULL COMMENT 'Fecha de registro',
  `notaria` varchar(30) NOT NULL,
  `persona` enum('fisica','moral') DEFAULT 'fisica',
  `nombre` varchar(30) NOT NULL,
  `apellidopat` varchar(30) NOT NULL,
  `apellidomat` varchar(30) NOT NULL,
  `curp` varchar(50) NOT NULL,
  `rfc` varchar(50) NOT NULL,
  `correo` varchar(150) DEFAULT NULL,
  -- ... 75 campos más (85 total)
  `created_at` timestamp NULL,
  `updated_at` timestamp NULL,
  `deleted_at` timestamp NULL,
  PRIMARY KEY (`id`),
  KEY `registro_web_notaria_index` (`notaria`),
  KEY `registro_web_curp_index` (`curp`),
  KEY `registro_web_rfc_index` (`rfc`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### **Tabla LEGACY: `registro`** (atinet65_aplicativos - READ ONLY)

```sql
-- Tabla existente en sistema PHP
-- ⚠️ READ ONLY - NO se modifica desde Laravel

CREATE TABLE `registro` (
  `idregistro` int(11) NOT NULL AUTO_INCREMENT,
  `dia_registro` date NOT NULL,
  `notaria` varchar(30) NOT NULL,
  `Persona` varchar(10) DEFAULT 'fisica',
  `nombre` varchar(30) NOT NULL,
  -- ... 81 campos más (85 total)
  PRIMARY KEY (`idregistro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
```

### **Modelos Laravel**

```php
// app/Models/RegistroPersona.php
// ✅ ESCRIBE en la tabla NUEVA
class RegistroPersona extends Model
{
    use SoftDeletes;
    
    protected $connection = 'mysql';        // BD nueva
    protected $table = 'registro_web';      // Tabla nueva
    protected $primaryKey = 'id';           // Estándar Laravel
    public $timestamps = true;              // ✅ Con timestamps
    
    // 85 campos fillable
}

// app/Models/LegacyRegistro.php  
// ✅ LEE de la tabla LEGACY (read-only)
class LegacyRegistro extends Model
{
    protected $connection = 'aplicativos'; // BD legacy
    protected $table = 'registro';          // Tabla legacy
    protected $primaryKey = 'idregistro';
    public $timestamps = false;
    protected $guarded = ['*'];             // ⚠️ READ ONLY
    
    // Previene save(), update(), delete()
    // Método: migrateToNew() para migrar registros
}
```

### **Conexiones de Base de Datos**

Ya configuradas en `config/database.php`:

```php
'mysql' => [
    'driver' => 'mysql',
    'database' => env('DB_DATABASE', 'Atinet_Compliance_Hub'), // BD NUEVA
],

'aplicativos' => [
    'driver' => 'mysql',
    'database' => env('DB_APLICATIVOS_DATABASE', 'atinet65_aplicativos'), // BD LEGACY (read-only)
    'strict' => false,
],

'catalogos' => [
    'driver' => 'mysql',
    'database' => env('DB_CATALOGOS_DATABASE', 'atinet65_catalogos'), // BD LEGACY (read-only)
    'strict' => false,
],
```

---

## 🚀 Plan de Implementación

### **✅ Fase 0: Integración con BD** (COMPLETADO)
1. ✅ Analizar estructura de `atinet65_aplicativos.registro` (85 campos)
2. ✅ Crear migración para tabla nueva `registro_web`
3. ✅ Crear modelo `RegistroPersona` que escribe en BD nueva
4. ✅ Crear modelo `LegacyRegistro` read-only para BD legacy
5. ✅ Documentar esquema de integración (ver [INTEGRACION_BD_LEGACY_REGISTRO.md](./INTEGRACION_BD_LEGACY_REGISTRO.md))

### **Fase 1: Estructura Base** ✅ COMPLETADA (31 Marzo 2026)
1. ✅ Ejecutar migración (`php artisan migrate`) - tabla `registro_web` creada
2. ✅ Crear comando de migración de datos legacy - `php artisan registro:migrate-legacy` (1,118 registros detectados)
3. ✅ Crear rutas en `web.php` - grupos `registro-web.*` y `ocr.*`
4. ✅ Crear `RegistroWebController` (métodos: index, store, searchCurp, searchRfc, show, update, destroy)
5. ✅ Crear `OCRController` (métodos placeholder: processINE, processCURP, processActa, processQR)
6. ✅ Crear página Inertia `Admin/RegistroWeb/Index.tsx` con tabs, historial, y botones flotantes
7. ⏳ Copiar CSS accordion a `resources/css/app.css` (Pendiente Fase 2 - no necesario aún)

### **Fase 2: Formulario Accordion** (3-4 horas)
1. ⏳ Crear componente `RegistroAccordion.tsx` (reutilizable)
2. ⏳ Crear 5 secciones de formulario:
   - FormSection1_DatosGenerales.tsx (18 campos)
   - FormSection2_Conyuge.tsx (6 campos)
   - FormSection3_Domicilio.tsx (33 campos: particular + fiscal + notificaciones)
   - FormSection4_Contacto.tsx (6 campos)
   - FormSection5_Testador.tsx (19 campos)
3. ⏳ Implementar React Hook Form
4. ⏳ Crear schema Zod para validación (85 campos)
5. ⏳ Conectar submit con API Laravel (guardar en BD nueva)

### **Fase 3: Scanners Básicos** (4-5 horas)
1. ⏳ Instalar dependencias (TensorFlow, html5-qrcode)
2. ⏳ Crear hooks: `useCamera`, `useOCR`, `useQRScanner`
3. ⏳ Crear 4 componentes de scanner:
   - ScannerINE.tsx (OCR con TensorFlow + Gemini)
   - ScannerCURP.tsx (Gemini Vision)
   - ScannerActa.tsx (Gemini Vision)
   - ScannerQR.tsx (html5-qrcode)
4. ⏳ Implementar modales con diseño idéntico al PHP
5. ⏳ Conectar con APIs Laravel Backend

### **Fase 4: Backend OCR** (3-4 horas)
1. ⏳ Crear `OCRController` con 4 endpoints:
   - POST /api/ocr/ine
   - POST /api/ocr/curp
   - POST /api/ocr/acta
   - POST /api/ocr/qr
2. ⏳ Crear `GeminiVisionService` (cliente API)
3. ⏳ Crear `OCRParserService` (parseo de respuestas)
4. ⏳ Configurar API key de Gemini en `.env`
5. ⏳ Testing de cada endpoint con imágenes reales

### **Fase 5: Features Avanzadas** (2-3 horas)
1. ⏳ Búsqueda por CURP/RFC (APIs Laravel usando modelo `RegistroPersona`)
2. ⏳ Botón "Copiar dirección" (particular ↔ fiscal)
3. ⏳ Lógica condicional (mostrar/ocultar sección cónyuge si casado)
4. ⏳ SweetAlert2 integrado
5. ⏳ Loader animado (copiar de PHP)

### **Fase 6: Testing & Deploy** (2 horas)
1. ⏳ Testing: Guardar desde Laravel → Leer desde PHP
2. ⏳ Testing: Guardar desde PHP → Leer desde Laravel
3. ⏳ Testing en móvil (responsive, cámara)
4. ⏳ Commit a Git
5. ⏳ Deploy

---

## ✅ Checklist de Réplica 1:1

### **Diseño Visual**
- [ ] Header con 2 logos (Atinet + Notaría)
- [ ] 5 botones flotantes con tooltips
- [ ] Tabs Física/Moral con estilo idéntico
- [ ] Accordion con gradiente azul
- [ ] Form grid responsivo (auto-fit, minmax(250px, 1fr))
- [ ] Iconos Font Awesome en labels
- [ ] Colores exactos (#0284c7, #0369a1, etc.)
- [ ] Transiciones suaves (0.3s)

### **Funcionalidad**
- [ ] 85 campos del formulario
- [ ] Validación en cliente y servidor
- [ ] Scanner OCR INE (TensorFlow + Gemini)
- [ ] Scanner CURP (Gemini)
- [ ] Scanner Acta (Gemini)
- [ ] Scanner QR (html5-qrcode)
- [ ] Búsqueda CURP -> autollenar
- [ ] Búsqueda RFC -> autollenar
- [ ] Copiar dirección particular ↔ fiscal
- [ ] Mostrar/ocultar sección cónyuge según estado civil
- [ ] SweetAlert2 para confirmaciones
- [ ] Botón limpiar formulario

### **Técnico**
- [ ] Mismo HTML structure
- [ ] Mismas clases CSS
- [ ] Mismas transiciones CSS
- [ ] Mismas librerías JS
- [ ] Mismos endpoints de API
- [ ] Misma lógica de validación
- [ ] Mismo flujo de datos

---

## 📌 Notas Importantes

1. **Copy-Paste del CSS**: Se puede copiar **literalmente** el CSS del accordion (líneas 73-168 de `index.php`) a `resources/css/app.css`.

2. **Librerías JS**: Las mismas librerías del PHP (TensorFlow, html5-qrcode) funcionan en React sin cambios.

3. **Modales**: Los 4 scanners usan la misma estructura HTML, solo cambian títulos y configuraciones.

4. **Gemini API**: La API key debe estar en `.env` de Laravel:
   ```env
   GEMINI_API_KEY=tu_api_key_aqui
   ```

5. **Testing Local**: Se puede testear sin API key real usando mock data.

---

## 🎯 Resultado Final

Una réplica **pixel-perfect** del sistema PHP en Laravel + React, con:
- ✅ Diseño idéntico
- ✅ Misma funcionalidad
- ✅ Mejor organización de código
- ✅ Type safety con TypeScript
- ✅ Validación más robusta
- ✅ Mejor mantenibilidad

**Tiempo estimado total: 16-20 horas de desarrollo**
