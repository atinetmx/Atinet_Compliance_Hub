# Bugs y Correcciones — Registro Web

Registro cronológico de problemas detectados durante las pruebas de replicación del sitio legacy PHP → Laravel/React.

---

## BUG-001 · Scanner QR — Archivo no detectado

**Fecha:** 25/05/2026  
**Módulo:** `ScannerQR.tsx` — botón "Cargar imagen con QR"  
**Síntoma:** Al subir una imagen, la consola mostraba:  
```
Error al leer archivo: HTML Element with id=qr-reader-file not found
```
**Causa:** El `<div id="qr-reader-file">` requerido por `html5-qrcode` solo se renderizaba cuando `showCamera === true`, pero la carga de archivos ocurre en la pantalla inicial (sin activar la cámara).  
**Solución:** Mover el `<div id="qr-reader-file" className="hidden" />` fuera del bloque condicional `{showCamera && ...}` para que siempre esté presente en el DOM.  
**Archivo:** `resources/js/components/Admin/RegistroWeb/ScannerQR.tsx`

---

## BUG-002 · Scanner QR SAT — Error SSL cURL 60 (siat.sat.gob.mx)

**Fecha:** 25/05/2026  
**Módulo:** `SATScraperService.php` — fetch del HTML del SAT  
**Síntoma:**
```
Error al procesar QR del SAT: cURL error 60: SSL certificate problem: unable to get local issuer certificate
```
URL afectada: `https://siat.sat.gob.mx/app/qr/faces/pages/mobile/validadorqr.jsf?...`  
**Causa:** El servidor Windows no tiene el bundle de CA requerido para verificar el certificado intermedio del SAT (gobierno mexicano).  
**Solución:** `'verify' => false` en la llamada HTTP. Seguro porque la URL ya fue validada al provenir de un QR firmado del SAT.  
**Archivo:** `app/Services/SATScraperService.php` → método `fetchSATHTML()`

---

## BUG-003 · Scanner QR SAT — Error 500 "Gemini API key not configured"

**Fecha:** 25/05/2026  
**Módulo:** `SATScraperService.php` → `structureWithGemini()`  
**Síntoma:**
```
Error al procesar QR del SAT: Gemini API key not configured
```
**Causa:** Las variables `GEMINI_API_KEY` y `OPENAI_API_KEY` no estaban definidas en `.env`.  
**Solución (parte 1):** Agregar las keys al `.env` tomándolas del sistema legacy:
```
GEMINI_API_KEY=AIzaSyAyMBXqBvB9TSFKe7ptFMNYtdlbDx8jPtk
GEMINI_MODEL=gemini-2.5-flash
OPENAI_API_KEY=sk-proj-CLezpCEWwA...
OPENAI_MODEL=gpt-4o-mini
```
**Solución (parte 2):** Implementar parser directo sin IA como fallback en `structureDirectlyFromHTML()`. Si no hay key de Gemini, el servicio parsea el HTML del SAT con XPath y regex sin depender de IA externa.  
**Archivo:** `app/Services/SATScraperService.php`

---

## BUG-004 · Scanner QR SAT — Error SSL cURL 60 (generativelanguage.googleapis.com)

**Fecha:** 25/05/2026  
**Módulo:** `GeminiVisionService.php`, `SATScraperService.php`, `OpenAIDocumentAnalyzer.php`  
**Síntoma:**
```
cURL error 60: SSL certificate problem: unable to get local issuer certificate
for https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent
```
**Causa:** El mismo problema de bundle CA de Windows afecta a todas las APIs externas: Gemini y OpenAI.  
**Solución:** Agregar `Http::withOptions(['verify' => false])` en las 4 llamadas HTTP a APIs externas:
- `GeminiVisionService::callGeminiAPI()` (OCR de INE, CURP, Acta)
- `SATScraperService::structureWithGemini()` (procesado SAT con Gemini)
- `OpenAIDocumentAnalyzer::analyzeDocument()` (análisis de documentos)
- `OpenAIDocumentAnalyzer::analyzeTestamento()` (análisis de testamentos)  
**Archivos:** `app/Services/GeminiVisionService.php`, `app/Services/SATScraperService.php`, `app/Services/OpenAIDocumentAnalyzer.php`

---

## BUG-005 · Scanner QR — Re-escaneo con cámara procesa el QR anterior

**Fecha:** 25/05/2026  
**Módulo:** `ScannerQR.tsx` — botón "Escanear con cámara"  
**Síntoma:** Si se usa la cámara, se cierra el modal y se vuelve a abrir para escanear, la cámara captura el frame residual del escaneo anterior y lo procesa automáticamente sin que el usuario apunte a un QR nuevo.  
**Causa (1):** `lastScannedQRRef` tenía el comentario `// NO resetear` en el cierre — se mantenía entre sesiones. Al abrir de nuevo, el frame residual era diferente al último valor guardado y se procesaba.  
**Causa (2):** El warm-up era de solo 800ms, insuficiente para que la cámara descarte el buffer anterior.  
**Solución:**
1. Resetear `lastScannedQRRef.current = null` cuando el modal se **abre** (`isOpen` cambia a `true`), no al cerrar. Así cada sesión empieza limpia y el warm-up protege contra el frame residual.
2. Aumentar warm-up de 800ms a **2000ms** para dar tiempo a que la cámara descarte completamente el buffer anterior.  
**Archivo:** `resources/js/components/Admin/RegistroWeb/ScannerQR.tsx`

---
