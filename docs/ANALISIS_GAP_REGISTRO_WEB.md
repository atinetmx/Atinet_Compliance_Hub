# 📊 Análisis de Gap - Servicio Registro Web

**Fecha:** 6 Abril 2026  
**Status:** ✅ Backend Básico Implementado | ❌ Frontend Completo Pendiente  
**Progreso Global:** ~40% completado  

---

## 📋 Resumen Ejecutivo

El servicio **Registro Web** tiene backend funcional con arquitectura dual (nueva + legacy), pero **falta implementación completa del frontend**, scanners OCR, y servicios Gemini Vision. Este análisis compara lo documentado vs lo implementado para crear un plan de acción claro.

### Arquitectura Actual
```
✅ Backend CRUD         → RegistroWebController (7 métodos completos)
✅ Modelos Duales       → RegistroPersona (escribe) + LegacyRegistro (lee)
✅ Migración BD         → Tabla registro_web (85 campos) creada
✅ Rutas API            → 7 endpoints CRUD + 4 OCR definidos
⏳ OCR Backend          → OCRController con placeholders (501 Not Implemented)
❌ Frontend Completo    → No existe Index.tsx ni componentes
❌ Scanners OCR         → 0 de 4 implementados
❌ Servicios Gemini     → GeminiVisionService no existe
❌ Dependencias NPM     → TensorFlow, html5-qrcode, react-hook-form faltantes
```

---

## 🎯 Estado por Componente

### 1. **Base de Datos** ✅ COMPLETO (100%)

| Elemento | Documentado | Implementado | Estado |
|----------|-------------|--------------|--------|
| Tabla `registro_web` (nueva) | 85 campos | ✅ 85 campos migrados | ✅ COMPLETO |
| Índices (notaria, curp, rfc) | Sí | ✅ Creados | ✅ COMPLETO |
| Conexión `aplicativos` (legacy) | Sí | ✅ Configurada | ✅ COMPLETO |
| Modelo `RegistroPersona` | 85 campos fillable | ✅ 85 campos | ✅ COMPLETO |
| Modelo `LegacyRegistro` | Read-only | ✅ Guarded all | ✅ COMPLETO |

**Migración:** `2026_03_31_212959_create_registro_web_table.php`

---

### 2. **Backend API** 🟡 PARCIALMENTE COMPLETO (65%)

#### ✅ **Rutas** (100% implementadas)

**Archivo:** `routes/web.php` líneas 204-220

```php
Route::prefix('registro-web')->name('registro-web.')->group(function () {
    Route::get('/', [RegistroWebController::class, 'index'])->name('index');
    Route::post('/', [RegistroWebController::class, 'store'])->name('store');
    Route::get('search-curp', [RegistroWebController::class, 'searchCurp'])->name('search-curp');
    Route::get('search-rfc', [RegistroWebController::class, 'searchRfc'])->name('search-rfc');
    Route::get('{registro}', [RegistroWebController::class, 'show'])->name('show');
    Route::put('{registro}', [RegistroWebController::class, 'update'])->name('update');
    Route::delete('{registro}', [RegistroWebController::class, 'destroy'])->name('destroy');
});

Route::prefix('ocr')->name('ocr.')->group(function () {
    Route::post('ine', [OCRController::class, 'processINE'])->name('ine');
    Route::post('curp', [OCRController::class, 'processCURP'])->name('curp');
    Route::post('acta', [OCRController::class, 'processActa'])->name('acta');
    Route::post('qr', [OCRController::class, 'processQR'])->name('qr');
});
```

#### ✅ **RegistroWebController** (100% completo)

**Archivo:** `app/Http/Controllers/Admin/RegistroWebController.php` (300 líneas)

| Método | Estado | Funcionalidad |
|--------|--------|---------------|
| `index()` | ✅ COMPLETO | Combina nuevo + legacy, stats, historial |
| `store()` | 🟡 PARCIAL | Valida ~17/85 campos, guarda en BD nueva |
| `show()` | ✅ COMPLETO | Muestra registro (source: nuevo/legacy) |
| `update()` | ✅ COMPLETO | Actualiza solo registros nuevos |
| `destroy()` | ✅ COMPLETO | Soft delete solo registros nuevos |
| `searchCurp()` | ✅ COMPLETO | Busca en ambas BDs |
| `searchRfc()` | ✅ COMPLETO | Busca en ambas BDs |

**Gap ID 1: Validación incompleta en store()**
- ✅ Validados: 17 campos básicos (nombre, CURP, RFC, género, etc.)
- ❌ Falta validar: 68 campos (domicilio completo, cónyuge, testador, etc.)
- **Impacto:** Datos sin validar pueden causar inconsistencias
- **Prioridad:** Media (funciona, pero incompleto)

#### ⏳ **OCRController** (Placeholders implementados)

**Archivo:** `app/Http/Controllers/Admin/OCRController.php` (150 líneas)

| Método | Estado | Respuesta Actual |
|--------|--------|------------------|
| `processINE()` | ⏳ PLACEHOLDER | 501 Not Implemented + estructura vacía |
| `processCURP()` | ⏳ PLACEHOLDER | 501 Not Implemented + estructura vacía |
| `processActa()` | ⏳ PLACEHOLDER | 501 Not Implemented + estructura vacía |
| `processQR()` | ⏳ PLACEHOLDER | 501 Not Implemented + estructura vacía |

**Gap ID 2: Servicios OCR Backend**
- ❌ `GeminiVisionService`: No existe (debe crearse en `app/Services/`)
- ❌ `OCRParserService`: No existe (debe crearse en `app/Services/`)
- ❌ Config Gemini API: No configurado en `config/services.php`
- **Impacto:** Scanners frontend no funcionarán hasta implementar backend
- **Prioridad:** ALTA (bloquea toda funcionalidad OCR)

---

### 3. **Frontend** ❌ NO IMPLEMENTADO (0%)

#### ❌ **Página Principal** (0%)

**Esperado:** `resources/js/pages/Admin/RegistroWeb/Index.tsx`

```typescript
// Estructura planificada (documentada en IMPLEMENTACION_REGISTRO_WEB.md):
- Header azul con logo + título
- Tabs: PERSONA FÍSICA | PERSONA MORAL
- Formulario accordion con 5 secciones
- Historial de registros (tabla con últimos 50 nuevos + 50 legacy)
- 5 botones flotantes laterales (scanners)
```

**Estado Actual:** ❌ Archivo no existe

**Gap ID 3: Página principal faltante**
- **Elementos faltantes:** Header, Tabs, Formulario, Historial, Botones
- **Impacto:** Servicio completamente inaccesible desde UI
- **Prioridad:** CRÍTICA (bloquea todo el servicio)

#### ❌ **Componentes de Formulario** (0%)

**Esperados:** `resources/js/components/registro-web/`

| Componente | Campos | Estado | Prioridad |
|------------|--------|--------|-----------|
| `RegistroAccordion.tsx` | Framework | ❌ No existe | CRÍTICA |
| `FormSection1_DatosGenerales.tsx` | 18 | ❌ No existe | CRÍTICA |
| `FormSection2_Conyuge.tsx` | 6 | ❌ No existe | ALTA |
| `FormSection3_Domicilio.tsx` | 33 | ❌ No existe | CRÍTICA |
| `FormSection4_Contacto.tsx` | 6 | ❌ No existe | ALTA |
| `FormSection5_Testador.tsx` | 19 | ❌ No existe | MEDIA |
| **TOTAL** | **85** | **0 implementados** | — |

**Gap ID 4: Formularios completos faltantes**
- **Tamaño:** 85 campos distribuidos en 5 secciones
- **Complejidad:** Campos condicionales (cónyuge solo si edo_civil=CASADO)
- **Impacto:** No se pueden crear/editar registros desde UI
- **Prioridad:** CRÍTICA

#### ❌ **Componentes de Scanner** (0%)

**Esperados:** `resources/js/components/registro-web/scanners/`

| Scanner | Tecnología | Estado | Prioridad |
|---------|------------|--------|-----------|
| `ScannerINE.tsx` | TensorFlow.js + Gemini | ❌ No existe | ALTA |
| `ScannerCURP.tsx` | Gemini Vision | ❌ No existe | ALTA |
| `ScannerActa.tsx` | Gemini Vision | ❌ No existe | MEDIA |
| `ScannerQR.tsx` | html5-qrcode | ❌ No existe | MEDIA |

**Gap ID 5: Scanners OCR frontend faltantes**
- **Funcionalidad:** Captura cámara/archivo → OCR → autollenar formulario
- **Tamaño:** 4 componentes + 3 hooks (useCamera, useOCR, useQRScanner)
- **Impacto:** Usuarios deben llenar 85 campos manualmente (ineficiente)
- **Prioridad:** ALTA (feature diferenciador del sistema legacy)

#### ❌ **Hooks Reutilizables** (0%)

**Esperados:** `resources/js/components/registro-web/scanners/hooks/`

| Hook | Propósito | Estado |
|------|-----------|--------|
| `useCamera.ts` | Acceso a cámara, captura frames | ❌ No existe |
| `useOCR.ts` | Llamadas API OCR, TensorFlow | ❌ No existe |
| `useQRScanner.ts` | Decodificador QR | ❌ No existe |

**Gap ID 6: Hooks para scanners faltantes**
- **Impacto:** Sin hooks, cada scanner duplica lógica de cámara/OCR
- **Prioridad:** ALTA (evita duplicación de código)

---

### 4. **Dependencias NPM** ❌ NO INSTALADAS (0%)

| Dependencia | Uso | Instalada | Prioridad |
|-------------|-----|-----------|-----------|
| `react-hook-form` | Manejo de formulario 85 campos | ❌ | CRÍTICA |
| `@hookform/resolvers` | Integración Zod + RHF | ❌ | CRÍTICA |
| `zod` | Validación esquema TypeScript | ❌ | CRÍTICA |
| `@tensorflow/tfjs` | OCR INE (detección objetos) | ❌ | ALTA |
| `@tensorflow-models/coco-ssd` | Modelo detección documentos | ❌ | ALTA |
| `html5-qrcode` | Scanner QR INE | ❌ | MEDIA |
| `sweetalert2` | Alertas estilo PHP legacy | ❌ | MEDIA |
| `sweetalert2-react-content` | Integración React SweetAlert2 | ❌ | MEDIA |

**Gap ID 7: Dependencias NPM faltantes**
- **Comando instalación:**
  ```bash
  npm install react-hook-form @hookform/resolvers zod \
               @tensorflow/tfjs @tensorflow-models/coco-ssd \
               html5-qrcode sweetalert2 sweetalert2-react-content
  ```
- **Impacto:** Build fallará sin estas dependencias
- **Prioridad:** CRÍTICA (bloqueante para desarrollo frontend)

---

### 5. **Estilos CSS** ❌ NO IMPLEMENTADOS (0%)

**Gap ID 8: CSS Accordion faltante**

**Esperado:** `resources/css/app.css` (copiar de PHP legacy)

```css
/* 95 líneas de CSS de index.php (líneas 73-168) */
.accordion-section { ... }
.accordion-header { ... }
.accordion-content { ... }
.form-grid { ... }
.subsection-title { ... }
```

**Estado:** ❌ No copiado

**Impacto:** Acordeones no tendrán animaciones ni diseño correcto
**Prioridad:** MEDIA (funcional sin CSS, pero UX pobre)

---

## 📊 Priorización de Gaps

### 🔴 **CRÍTICO** (Bloquean funcionalidad básica)

1. **Gap ID 3:** Crear página `Index.tsx` principal
2. **Gap ID 4:** Implementar formularios (5 secciones, 85 campos)
3. **Gap ID 7:** Instalar dependencias NPM
4. **Gap ID 1:** Completar validación backend (68 campos faltantes)

### 🟠 **ALTA** (Features importantes)

5. **Gap ID 2:** Implementar servicios OCR backend (GeminiVisionService + OCRParserService)
6. **Gap ID 5:** Crear 4 scanners OCR frontend
7. **Gap ID 6:** Crear 3 hooks reutilizables

### 🟡 **MEDIA** (Mejoras de UX)

8. **Gap ID 8:** Copiar CSS accordion desde PHP legacy

---

## 🚀 Plan de Implementación Recomendado

### **Fase 2A: Base Frontend** (4-6 horas)
```bash
# Paso 1: Instalar dependencias
npm install react-hook-form @hookform/resolvers zod

# Paso 2: Crear estructura de carpetas
mkdir -p resources/js/pages/Admin/RegistroWeb
mkdir -p resources/js/components/registro-web/scanners/hooks

# Paso 3: Crear Index.tsx básico (header + tabs + historial)
# Paso 4: Crear RegistroAccordion.tsx (framework reutilizable)
# Paso 5: Crear FormSection1_DatosGenerales.tsx (18 campos)
# Paso 6: Crear schema Zod para validación
# Paso 7: Conectar submit con API Laravel
```

**Resultado:** Usuarios pueden ver historial y crear registros básicos (sin scanners aún)

---

### **Fase 2B: Formularios Completos** (6-8 horas)
```bash
# Paso 1: FormSection2_Conyuge.tsx (6 campos, condicional)
# Paso 2: FormSection3_Domicilio.tsx (33 campos, 3 subsecciones)
# Paso 3: FormSection4_Contacto.tsx (6 campos)
# Paso 4: FormSection5_Testador.tsx (19 campos)
# Paso 5: Expandir schema Zod para 85 campos completos
# Paso 6: Validación backend completa (store() método)
# Paso 7: Copiar CSS accordion
```

**Resultado:** Formulario completo funcional (85 campos), pero llenado manual

---

### **Fase 3: Scanners OCR** (10-12 horas)
```bash
# Paso 1: Instalar deps TensorFlow + QR
npm install @tensorflow/tfjs @tensorflow-models/coco-ssd html5-qrcode

# Paso 2: Crear useCamera.ts hook (acceso cámara)
# Paso 3: Crear useOCR.ts hook (TensorFlow + API)
# Paso 4: Crear useQRScanner.ts hook (html5-qrcode)
# Paso 5: ScannerINE.tsx (modal + cámara + captura)
# Paso 6: ScannerCURP.tsx (modal + cámara + captura)
# Paso 7: ScannerActa.tsx (modal + cámara + captura)
# Paso 8: ScannerQR.tsx (modal + cámara + decodificador)
```

**Resultado:** 4 scanners frontend funcionales (pero backend devuelve 501)

---

### **Fase 4: Backend OCR** (8-10 horas)
```bash
# Paso 1: Configurar Gemini API key
# config/services.php:
'gemini' => [
    'api_key' => env('GEMINI_API_KEY'),
    'model' => 'gemini-1.5-flash',
],

# Paso 2: Crear GeminiVisionService.php
php artisan make:class Services/GeminiVisionService

# Paso 3: Crear OCRParserService.php
php artisan make:class Services/OCRParserService

# Paso 4: Implementar 4 métodos en OCRController
# - processINE() → extraer 15 campos INE
# - processCURP() → extraer 7 campos CURP
# - processActa() → extraer 10 campos Acta
# - processQR() → decodificar QR INE MRZ

# Paso 5: Testing con imágenes reales
```

**Resultado:** Sistema completo funcional end-to-end con OCR

---

## 📈 Progreso Estimado

| Fase | Horas | Progreso Global Después |
|------|-------|-----------------------|
| **Estado Actual** | — | 40% (backend CRUD + modelos) |
| Fase 2A: Base Frontend | 4-6h | 55% |
| Fase 2B: Formularios | 6-8h | 75% |
| Fase 3: Scanners OCR | 10-12h | 90% |
| Fase 4: Backend OCR | 8-10h | 100% |
| **TOTAL ESTIMADO** | **28-36h** | **100%** |

---

## ✅ Checklist de Verificación

### **Backend**
- [x] Migración `registro_web` ejecutada
- [x] Modelos `RegistroPersona` y `LegacyRegistro` creados
- [x] Rutas CRUD definidas
- [x] RegistroWebController completo (7 métodos)
- [x] OCRController con placeholders
- [ ] Validación completa 85 campos en `store()`
- [ ] `GeminiVisionService` implementado
- [ ] `OCRParserService` implementado
- [ ] Gemini API key configurada

### **Frontend**
- [ ] Dependencias NPM instaladas (react-hook-form, zod, TensorFlow, qrcode)
- [ ] `Index.tsx` creado (header + tabs + historial)
- [ ] `RegistroAccordion.tsx` implementado
- [ ] `FormSection1_DatosGenerales.tsx` (18 campos)
- [ ] `FormSection2_Conyuge.tsx` (6 campos)
- [ ] `FormSection3_Domicilio.tsx` (33 campos)
- [ ] `FormSection4_Contacto.tsx` (6 campos)
- [ ] `FormSection5_Testador.tsx` (19 campos)
- [ ] Schema Zod 85 campos validado
- [ ] `useCamera.ts` hook implementado
- [ ] `useOCR.ts` hook implementado
- [ ] `useQRScanner.ts` hook implementado
- [ ] `ScannerINE.tsx` completo
- [ ] `ScannerCURP.tsx` completo
- [ ] `ScannerActa.tsx` completo
- [ ] `ScannerQR.tsx` completo
- [ ] CSS accordion copiado

### **Testing**
- [ ] CRUD funciona (crear/leer/actualizar/eliminar)
- [ ] Búsqueda CURP funciona (nuevo + legacy)
- [ ] Búsqueda RFC funciona (nuevo + legacy)
- [ ] Historial combina registros nuevo + legacy
- [ ] Scanner INE extrae todos los campos
- [ ] Scanner CURP extrae todos los campos
- [ ] Scanner Acta extrae todos los campos
- [ ] Scanner QR decodifica correctamente
- [ ] Validación frontend previene envíos incorrectos
- [ ] Validación backend rechaza datos inválidos

---

## 📚 Referencias

- **Documentación Principal:** [IMPLEMENTACION_REGISTRO_WEB.md](./IMPLEMENTACION_REGISTRO_WEB.md)
- **Integración Legacy:** [INTEGRACION_BD_LEGACY_REGISTRO.md](./INTEGRACION_BD_LEGACY_REGISTRO.md)
- **Sistema Origen:** notariosatinet.com.mx/atinet/index.php (1,493 líneas PHP)
- **Migración:** `database/migrations/2026_03_31_212959_create_registro_web_table.php`
- **Controlador:** `app/Http/Controllers/Admin/RegistroWebController.php`
- **Modelos:** `app/Models/RegistroPersona.php` + `app/Models/LegacyRegistro.php`

---

## 🎯 Conclusión

**Registro Web tiene una base sólida backend (40% completo), pero necesita implementación completa del frontend para ser funcional.** La prioridad debe ser:

1. **Fase 2A (CRÍTICO):** Crear Index.tsx + formulario básico → Servicio mínimamente viable
2. **Fase 2B (ALTA):** Formularios completos 85 campos → Paridad con PHP legacy
3. **Fase 3 (ALTA):** Scanners OCR frontend → Feature diferenciador
4. **Fase 4 (MEDIA):** Backend OCR funcional → Sistema completo

**Tiempo estimado total:** 28-36 horas de desarrollo (3-5 días laborables)

---

**Próximo Paso Recomendado:** Comenzar con `Fase 2A: Base Frontend` instalando dependencias y creando Index.tsx con historial funcional.
