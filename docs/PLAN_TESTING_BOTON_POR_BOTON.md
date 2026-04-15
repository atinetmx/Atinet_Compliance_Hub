# 🧪 Plan de Testing Registro Web - Botón por Botón

**Fecha:** 8 de Abril, 2026  
**Estado:** ⚠️ TESTING EN CURSO  
**Estrategia:** Proceso controlado - un botón completo antes de seguir

---

## ⚠️ PROBLEMA IDENTIFICADO

Se implementaron los 4 botones simultáneamente (QR, INE, CURP, Acta) **SIN verificar que el Botón 1 (QR Scanner) funcionara correctamente primero**.

**Estrategia original:** Implementar **botón por botón**, verificando cada uno al 100% antes de continuar.

**Razón:** El QR Scanner es el más complejo y sirve de base para los demás.

---

## 📋 CHECKLIST DE TESTING SECUENCIAL

### ✅ **FASE 1: QR SCANNER (Botón 1)** ← PRIORIDAD CRÍTICA

**Objetivo:** Verificar que el QR Scanner funciona perfectamente antes de continuar.

#### 1.1. Testing Frontend (Componente ScannerQR.tsx)

- [ ] **Test 1: Abrir modal QR Scanner**
  - Acción: Click en botón verde (QrCode)
  - Esperado: Modal se abre con 2 opciones
  - Verificar: No errores en consola

- [ ] **Test 2: Escanear con cámara**
  - Acción: Click "Escanear con cámara"
  - Esperado: Solicita permisos de cámara
  - Verificar: Cámara se activa correctamente

- [ ] **Test 3: Cargar imagen desde galería**
  - Acción: Click "Cargar imagen con QR"
  - Esperado: Abre selector de archivos
  - Verificar: Acepta solo imágenes

- [ ] **Test 4: Decodificar QR válido (cámara)**
  - Acción: Escanear QR de prueba con cámara
  - Esperado: Detecta QR, cierra modal
  - Verificar: No errores de decodificación

- [ ] **Test 5: Decodificar QR válido (imagen)**
  - Acción: Subir imagen PNG con QR
  - Esperado: Lee QR de imagen correctamente
  - Verificar: Extrae texto del QR

- [ ] **Test 6: Manejo de errores - Sin cámara**
  - Acción: Bloquear permisos de cámara
  - Esperado: Mensaje de error claro
  - Verificar: "Permisos de cámara denegados..."

- [ ] **Test 7: Manejo de errores - Imagen sin QR**
  - Acción: Subir imagen sin QR
  - Esperado: Mensaje de error
  - Verificar: "No se pudo leer el código QR..."

- [ ] **Test 8: Limpieza al cerrar modal**
  - Acción: Abrir cámara, luego cerrar modal
  - Esperado: Cámara se detiene
  - Verificar: Sin errores en consola

#### 1.2. Testing de Parseo (utils/qr-parser.ts)

- [ ] **Test 9: QR formato JSON**
  ```json
  {"nombre":"JUAN","curp":"PEPJ850315HJCLRN09"}
  ```
  - Esperado: Parsea JSON directamente
  - Verificar: Retorna objeto con datos

- [ ] **Test 10: QR formato URL RENAPO (CURP)**
  ```
  https://consultas.curp.gob.mx/CurpSP/...?curp=PEPJ850315HJCLRN09
  ```
  - Esperado: Extrae CURP desde URL
  - Verificar: Retorna { curp: "..." }

- [ ] **Test 11: QR formato pipe-delimited**
  ```
  JUAN|PEREZ|GARCIA|PEPJ850315HJCLRN09|1985-03-15
  ```
  - Esperado: Detecta CURP como ancla, extrae campos
  - Verificar: Retorna nombre, apellidos, curp, fecha

- [ ] **Test 12: QR formato Acta Nacimiento (URL)**
  ```
  https://registrocivil.gob.mx/ActaNacimiento?nombre=JUAN&curp=...
  ```
  - Esperado: Extrae parámetros de URL
  - Verificar: Parsea todos los campos

- [ ] **Test 13: QR formato Acta (KV pipe)**
  ```
  Registrado:JUAN PEREZ|CURP:PEPJ850315...|Padre1:CARLOS|Madre1:MARIA
  ```
  - Esperado: Detecta formato KV, extrae campos
  - Verificar: Parsea padres correctamente

- [ ] **Test 14: QR formato SAT (URL)**
  ```
  https://siat.sat.gob.mx/app/qr/faces/pages/mobile/validadorqr.jsf?D1=4&D2=1&D3=...
  ```
  - Esperado: Identifica como URL SAT
  - Verificar: Retorna { urlSAT: "..." }

#### 1.3. Testing de Integración (Backend SAT)

- [ ] **Test 15: Procesar QR SAT - Backend**
  - Acción: Enviar URL SAT a `/admin/ocr/sat-qr`
  - Esperado: Respuesta con 18 campos
  - Verificar: RFC, nombre, dirección fiscal

- [ ] **Test 16: Error - URL no-SAT**
  - Acción: Enviar URL genérica
  - Esperado: Error 400
  - Verificar: "La URL no corresponde a una constancia del SAT"

- [ ] **Test 17: Error - RFC sin cédula**
  - Acción: QR SAT de RFC sin cédula emitida
  - Esperado: Error específico
  - Verificar: "RFC sin cédula fiscal emitida"

- [ ] **Test 18: Error - Límite Gemini alcanzado**
  - Acción: Muchas peticiones seguidas
  - Esperado: Error 429
  - Verificar: "Límite de uso de Gemini alcanzado"

#### 1.4. Testing de Auto-fill (Index.tsx)

- [ ] **Test 19: Cargar datos desde QR al formulario**
  - Acción: Escanear QR con CURP válido
  - Esperado: Formulario se llena automáticamente
  - Verificar: CURP, nombre, apellidos poblados

- [ ] **Test 20: Detección tipo de persona (Física)**
  - Acción: QR con CURP
  - Esperado: Tab cambia a "Persona Física"
  - Verificar: Tab activo = fisica

- [ ] **Test 21: Detección tipo de persona (Moral)**
  - Acción: QR SAT sin CURP
  - Esperado: Tab cambia a "Persona Moral"
  - Verificar: Tab activo = moral

- [ ] **Test 22: Apertura sección Datos Generales**
  - Acción: Escanear QR
  - Esperado: Acordeón "Datos Generales" se expande
  - Verificar: openSections.generales = true

- [ ] **Test 23: Toast de confirmación**
  - Acción: QR procesado exitosamente
  - Esperado: Toast verde "✅ Datos del QR cargados correctamente"
  - Verificar: Mensaje visible 3 segundos

- [ ] **Test 24: Diálogo de confirmación - QR no parseable**
  - Acción: Escanear QR desconocido
  - Esperado: Modal con texto raw del QR
  - Verificar: Botón "Copiar al portapapeles"

#### 1.5. Testing E2E (Flujo Completo)

- [ ] **Test 25: Flujo completo QR CURP**
  1. Click botón verde
  2. Escanear QR CURP
  3. Verificar auto-fill
  4. Completar campos faltantes
  5. Guardar registro
  - Esperado: Registro creado exitosamente

- [ ] **Test 26: Flujo completo QR SAT**
  1. Click botón verde
  2. Escanear QR SAT
  3. Esperar scraping (3-5s)
  4. Verificar datos fiscales
  5. Guardar registro
  - Esperado: Datos SAT guardados

- [ ] **Test 27: Flujo completo QR Acta**
  1. Click botón verde
  2. Subir imagen QR Acta
  3. Verificar nombres padres
  4. Guardar
  - Esperado: Padres poblados correctamente

---

### ⏸️ **FASE 2: SCANNER INE (Botón 2)** ← PAUSAR HASTA FASE 1 OK

**Condición:** Solo continuar cuando **TODOS los tests de Fase 1 pasen**.

#### 2.1. Testing Frontend (ImageOCRScanner - INE)

- [ ] **Test 28: Abrir modal INE**
  - Acción: Click botón azul (Camera)
  - Esperado: Modal se abre con selector de lado
  - Verificar: Opciones "Frente" y "Reverso"

- [ ] **Test 29: Selector de lado**
  - Acción: Cambiar entre frente/reverso
  - Esperado: Selector visual cambia
  - Verificar: selectedSide actualizado

- [ ] **Test 30: Capturar INE frente**
  - Acción: Lado=Frente, tomar foto
  - Esperado: Preview de imagen
  - Verificar: Imagen cargada correctamente

- [ ] **Test 31: Enviar INE al backend**
  - Acción: Procesar imagen INE frente
  - Esperado: POST /admin/ocr/ine con FormData
  - Verificar: 200 OK + datos JSON

- [ ] **Test 32: Verificar datos extraídos (frente)**
  - Esperado: nombre, apellidopat, apellidomat, curp, dirección, CP
  - Verificar: Mínimo 10 campos poblados

- [ ] **Test 33: Capturar INE reverso**
  - Acción: Lado=Reverso, tomar foto
  - Esperado: Extrae CURP del reverso
  - Verificar: CURP complementado

- [ ] **Test 34: Auto-fill desde INE**
  - Acción: INE procesada exitosamente
  - Esperado: Formulario se llena
  - Verificar: Dirección completa poblada

#### 2.2. Testing Backend (OCRController - INE)

- [ ] **Test 35: GeminiVisionService - INE frente**
  - Acción: analyzeINE($image, 'front')
  - Esperado: JSON con prompt específico INE
  - Verificar: Gemini responde en < 5s

- [ ] **Test 36: OCRParserService - Validación CURP**
  - Acción: parseINE con CURP inválido
  - Esperado: Exception "CURP inválido"
  - Verificar: Regex valida 18 caracteres

- [ ] **Test 37: Generación RFC desde CURP**
  - Acción: INE sin RFC pero con CURP
  - Esperado: RFC generado (primeros 10 del CURP)
  - Verificar: RFC = "PEPJ850315"

- [ ] **Test 38: Normalización CP a entero**
  - Acción: Gemini retorna CP="54000"
  - Esperado: Parser convierte a 54000 (int)
  - Verificar: typeof cp === 'number'

---

### ⏸️ **FASE 3: SCANNER CURP (Botón 3)** ← PAUSAR HASTA FASE 2 OK

**Condición:** Solo continuar cuando **TODOS los tests de Fase 2 pasen**.

#### 3.1. Testing CURP Scanner

- [ ] **Test 39: Abrir modal CURP**
- [ ] **Test 40: Procesar documento CURP**
- [ ] **Test 41: Extraer fecha desde CURP**
- [ ] **Test 42: Extraer género desde CURP**
- [ ] **Test 43: Extraer estado desde CURP**
- [ ] **Test 44: Mapear estados (código → nombre)**

---

### ⏸️ **FASE 4: SCANNER ACTA (Botón 4)** ← PAUSAR HASTA FASE 3 OK

**Condición:** Solo continuar cuando **TODOS los tests de Fase 3 pasen**.

#### 4.1. Testing Acta Scanner

- [ ] **Test 45: Abrir modal Acta**
- [ ] **Test 46: Procesar Acta de Nacimiento**
- [ ] **Test 47: Extraer nombres de padres**
- [ ] **Test 48: Parsear lugar de nacimiento**
- [ ] **Test 49: Normalizar fecha de nacimiento**

---

## 🐛 PROBLEMAS CONOCIDOS DEL QR SCANNER

### Issue #1: Scanner no se limpia correctamente

**Síntoma:** Al cerrar y reabrir modal, cámara sigue activa.

**Causa:** `cleanupScanner()` no espera `stop()` completamente.

**Solución:** Agregar `await` y verificar estado.

```tsx
const cleanupScanner = async () => {
    if (scannerRef.current) {
        try {
            const state = scannerRef.current.getState();
            if (state === Html5QrcodeScannerState.SCANNING) {
                await scannerRef.current.stop(); // ← AWAIT crítico
            }
        } catch (error) {
            console.error('Error al detener scanner:', error);
        } finally {
            scannerRef.current = null;
        }
    }
};
```

**Status:** ✅ Ya implementado correctamente

---

### Issue #2: Doble procesamiento de QR

**Síntoma:** Al escanear QR, se procesa 2 veces (toast duplicado).

**Causa:** `onQRDetected` ejecuta múltiples veces si no hay flag `isProcessing`.

**Solución:** Usar flag de estado.

```tsx
async (decodedText) => {
    if (!isProcessing) { // ← Prevenir doble ejecución
        setIsProcessing(true);
        setStatus('processing');
        await handleQRDetected(decodedText);
    }
}
```

**Status:** ✅ Ya implementado correctamente

---

### Issue #3: Error al leer imagen sin QR

**Síntoma:** Crash cuando imagen no tiene QR.

**Causa:** `scanFile()` lanza exception sin catch.

**Solución:** Envolver en try-catch.

```tsx
try {
    const result = await scanner.scanFile(file, true);
    await handleQRDetected(result);
} catch (error) {
    setErrorMessage('No se pudo leer el código QR de la imagen.');
}
```

**Status:** ✅ Ya implementado correctamente

---

### Issue #4: QR de SAT tarda mucho (>10s)

**Síntoma:** UX mala esperando scraping del SAT.

**Causa:** Scraping + Gemini es lento.

**Solución temporal:** Mostrar loader con mensaje específico.

```tsx
toast.loading('Consultando datos al SAT (puede tardar hasta 10s)...');
```

**Solución permanente:** ❌ PENDIENTE - Cache de resultados SAT.

---

### Issue #5: Gemini API Key no configurada

**Síntoma:** Error 401 "API Key inválida".

**Causa:** `.env` sin `GEMINI_API_KEY`.

**Solución:** Verificar configuración.

```bash
# .env
GEMINI_API_KEY=AIzaSyAyMBXqBvB9TSFKe7ptFMNYtdlbDx8jPtk
```

**Status:** ✅ Configurado en .env.example

---

## 📊 PROGRESO DE TESTING

| Fase | Tests | Completados | Pendientes | Status |
|------|-------|-------------|------------|--------|
| **Fase 1: QR Scanner** | 27 | 0 | 27 | ⏸️ INICIAR |
| **Fase 2: INE Scanner** | 11 | 0 | 11 | 🚫 BLOQUEADO |
| **Fase 3: CURP Scanner** | 6 | 0 | 6 | 🚫 BLOQUEADO |
| **Fase 4: Acta Scanner** | 5 | 0 | 5 | 🚫 BLOQUEADO |
| **TOTAL** | **49** | **0** | **49** | **0%** |

---

## 🎯 SIGUIENTE ACCIÓN INMEDIATA

### 1. **Compilar frontend** (para ver si hay errores de TypeScript)

```bash
npm run build
```

Verificar:
- ✅ Sin errores de compilación
- ✅ Sin warnings críticos

### 2. **Ejecutar testing manual - QR Scanner**

```bash
# Terminal 1: Backend
php artisan serve

# Terminal 2: Frontend
npm run dev
```

**Abrir:** http://localhost:8000/admin/registro-web

**Ejecutar Tests 1-27** (Fase 1 completa)

### 3. **Documentar resultados**

Marcar tests como:
- ✅ PASS - Funciona correctamente
- ❌ FAIL - Error encontrado (documentar detalles)
- ⚠️ PARTIAL - Funciona con limitaciones

### 4. **Fix de bugs encontrados**

Para cada test FAIL:
1. Reproducir el error
2. Identificar causa raíz
3. Implementar fix
4. Re-ejecutar test
5. Marcar como PASS

### 5. **Solo después de Fase 1 al 100%**

- Continuar con Fase 2 (Scanner INE)
- Repetir proceso

---

## ⚠️ REGLAS DE ORO

1. ✋ **NO continuar a la siguiente fase** hasta que la actual esté al 100%
2. 📝 **Documentar TODOS los bugs** encontrados
3. 🔧 **Fix inmediato** de cualquier error crítico
4. 🧪 **Re-test después de cada fix**
5. 📊 **Actualizar tabla de progreso** diariamente

---

## 🚀 TIMELINE ESTIMADO

| Fase | Duración estimada | Fecha inicio | Fecha fin |
|------|-------------------|--------------|-----------|
| **Fase 1: QR Scanner** | 1 día | 8 Abril | 9 Abril |
| **Fase 2: INE Scanner** | 4 horas | 9 Abril | 9 Abril |
| **Fase 3: CURP Scanner** | 2 horas | 9 Abril | 10 Abril |
| **Fase 4: Acta Scanner** | 2 horas | 10 Abril | 10 Abril |
| **Testing Final E2E** | 4 horas | 10 Abril | 10 Abril |
| **TOTAL** | **2.5 días** | **8 Abril** | **10 Abril** |

**Demo:** 22 Abril (12 días de margen)

---

## 📞 CONTACTO EN CASO DE BLOCKERS

- **Backend issues:** Revisar logs `storage/logs/laravel.log`
- **Frontend issues:** Consola del navegador (F12)
- **Gemini API issues:** Verificar cuota en Google Cloud Console
- **DB issues:** Verificar conexiones en `config/database.php`

---

**Última actualización:** 8 de Abril, 2026 - 18:30  
**Responsable:** Equipo Atinet  
**Estado general:** ⚠️ TESTING EN CURSO - FASE 1 PRIORITARIA
