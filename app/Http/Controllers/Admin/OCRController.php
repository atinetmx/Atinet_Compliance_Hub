<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\GeminiVisionService;
use App\Services\OCRParserService;
use App\Services\SATScraperService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * OCR Controller
 *
 * Procesa imágenes de documentos y extrae datos usando Gemini Vision API.
 * Soporta: INE, CURP, Acta de Nacimiento, y QR del SAT.
 */
class OCRController extends Controller
{
    /**
     * Procesar INE (Credencial de Elector)
     *
     * Extrae: CURP, RFC, Nombre completo, Dirección, Fecha de nacimiento, etc.
     */
    public function processINE(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:10240', // Max 10MB
            'side' => 'required|in:front,back', // frente o reverso
        ]);

        try {
            $image = $request->file('image');
            $side = $request->input('side');

            // Analizar imagen con Gemini Vision
            $visionService = app(GeminiVisionService::class);
            $rawData = $visionService->analyzeINE($image, $side);

            // Parsear y normalizar datos
            $parser = app(OCRParserService::class);
            $parsedData = $parser->parseINE($rawData, $side);

            Log::info('INE procesada exitosamente', [
                'side' => $side,
                'curp' => $parsedData['curp'] ?? 'N/A',
                'nombre' => $parsedData['nombre'] ?? 'N/A',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'INE procesada correctamente',
                'data' => $parsedData,
            ]);

        } catch (\Exception $e) {
            Log::error('Error procesando INE', [
                'side' => $request->input('side'),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar INE: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Procesar CURP (Documento de CURP)
     *
     * Extrae: CURP completo y datos de nacimiento
     */
    public function processCURP(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:10240',
        ]);

        try {
            $image = $request->file('image');

            // Analizar imagen con Gemini Vision
            $visionService = app(GeminiVisionService::class);
            $rawData = $visionService->analyzeCURP($image);

            // Parsear y normalizar datos
            $parser = app(OCRParserService::class);
            $parsedData = $parser->parseCURP($rawData);

            Log::info('CURP procesado exitosamente', [
                'curp' => $parsedData['curp'] ?? 'N/A',
                'nombre' => $parsedData['nombre'] ?? 'N/A',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'CURP procesado correctamente',
                'data' => $parsedData,
            ]);

        } catch (\Exception $e) {
            Log::error('Error procesando CURP', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar CURP: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Procesar Acta de Nacimiento
     *
     * Extrae: Nombre completo, fecha de nacimiento, lugar de nacimiento, padres
     */
    public function processActa(Request $request): JsonResponse
    {
        $request->validate([
            'image' => 'required|image|max:10240',
        ]);

        try {
            $image = $request->file('image');

            // Analizar imagen con Gemini Vision
            $visionService = app(GeminiVisionService::class);
            $rawData = $visionService->analyzeActaNacimiento($image);

            // Parsear y normalizar datos
            $parser = app(OCRParserService::class);
            $parsedData = $parser->parseActa($rawData);

            Log::info('Acta de Nacimiento procesada exitosamente', [
                'nombre' => $parsedData['nombre'] ?? 'N/A',
                'curp' => $parsedData['curp'] ?? 'N/A',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Acta de Nacimiento procesada correctamente',
                'data' => $parsedData,
            ]);

        } catch (\Exception $e) {
            Log::error('Error procesando Acta de Nacimiento', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al procesar Acta de Nacimiento: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Procesar QR del SAT (Constancia Fiscal)
     *
     * Extrae datos de la constancia fiscal del SAT a partir de la URL del QR.
     * Este endpoint hace scraping del sitio del SAT y usa Gemini para estructurar
     * los datos extraídos.
     */
    public function processSATQR(Request $request): JsonResponse
    {
        $request->validate([
            'url' => 'required|url|string|max:500',
        ]);

        $qrUrl = $request->input('url');

        // Validar que sea URL del SAT
        if (! str_contains($qrUrl, 'siat.sat.gob.mx')) {
            return response()->json([
                'success' => false,
                'message' => 'La URL no corresponde a una constancia del SAT',
            ], 400);
        }

        try {
            $scraper = app(SATScraperService::class);
            $data = $scraper->processQRUrl($qrUrl);

            Log::info('QR SAT procesado exitosamente', [
                'url' => $qrUrl,
                'rfc' => $data['rfc'] ?? 'N/A',
                'persona' => $data['Persona'] ?? 'N/A',
            ]);

            return response()->json([
                'success' => true,
                'data' => $data,
                'message' => 'Datos de constancia fiscal extraídos correctamente',
            ]);

        } catch (\Exception $e) {
            Log::error('Error procesando QR SAT', [
                'url' => $qrUrl,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Procesar QR Code genérico (CURP, Acta, INE)
     *
     * Extrae datos de QR codes con formatos estándar mexicanos.
     * Nota: Este método es diferente de processSATQR() que requiere scraping.
     */
    public function processQR(Request $request): JsonResponse
    {
        $request->validate([
            'qr_data' => 'required|string|max:500',
        ]);

        // TODO: Implementar en Fase 4
        // $qrData = $request->input('qr_data');
        //
        // $parser = new OCRParserService();
        // $parsedData = $parser->parseQRCode($qrData);

        return response()->json([
            'success' => true,
            'message' => 'Parser de QR Code pendiente de implementación (Fase 4)',
            'data' => [
                'curp' => '',
                'nombre' => '',
                'apellidopat' => '',
                'apellidomat' => '',
                'dia' => '',
                'no_identificacion' => '',
            ],
        ], 501);
    }
}
