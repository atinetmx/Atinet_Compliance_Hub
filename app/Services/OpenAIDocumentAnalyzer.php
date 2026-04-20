<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

/**
 * OpenAI Document Analyzer Service
 *
 * Servicio para analizar documentos usando OpenAI GPT-4o con Vision.
 * Soporta extracción de datos estructurados de escrituras, contratos, poderes, etc.
 *
 * API Reference: https://platform.openai.com/docs/guides/vision
 */
class OpenAIDocumentAnalyzer
{
    protected string $apiKey;

    protected string $model;

    protected string $endpoint;

    protected float $temperature;

    protected int $timeout;

    protected int $maxTokens;

    public function __construct()
    {
        $this->apiKey = config('services.openai.api_key') ?? '';
        $this->model = config('services.openai.model') ?? 'gpt-4o';
        $this->endpoint = config('services.openai.endpoint') ?? 'https://api.openai.com/v1/chat/completions';
        $this->temperature = (float) (config('services.openai.temperature') ?? 0.1);
        $this->timeout = (int) (config('services.openai.timeout') ?? 120);
        $this->maxTokens = (int) (config('services.openai.max_tokens') ?? 4096);

    }

    /**
     * Verifica que la API key esté configurada antes de llamar a OpenAI.
     * Se llama sólo cuando se va a hacer una petición real, no en el constructor.
     */
    protected function assertApiKeyConfigured(): void
    {
        if (empty($this->apiKey) && ! app()->environment('testing')) {
            throw new Exception('OpenAI API key not configured. Set OPENAI_API_KEY in .env');
        }
    }

    /**
     * Analizar documento genérico
     *
     * Extrae datos estructurados de cualquier tipo de documento.
     *
     * @param  UploadedFile|string  $document  Archivo subido o ruta del archivo
     * @param  string|null  $tipoDocumento  Tipo específico de documento (escritura, contrato, poder, etc.)
     * @return array Datos estructurados extraídos
     *
     * @throws Exception
     */
    public function analyzeDocument(UploadedFile|string $document, ?string $tipoDocumento = null): array
    {
        $base64Image = $this->prepareImage($document);

        $prompt = $this->buildGenericPrompt($tipoDocumento);

        return $this->callOpenAI($base64Image, $prompt);
    }

    /**
     * Analizar escritura pública notarial
     *
     * Extrae datos específicos de escrituras públicas.
     *
     * @param  UploadedFile|string  $document  Archivo de la escritura
     * @return array Datos estructurados de la escritura
     *
     * @throws Exception
     */
    public function analyzeEscritura(UploadedFile|string $document): array
    {
        $base64Image = $this->prepareImage($document);

        $prompt = $this->buildEscrituraPrompt();

        return $this->callOpenAI($base64Image, $prompt);
    }

    /**
     * Analizar contrato
     *
     * Extrae datos de contratos civiles o mercantiles.
     *
     * @param  UploadedFile|string  $document  Archivo del contrato
     * @return array Datos estructurados del contrato
     *
     * @throws Exception
     */
    public function analyzeContrato(UploadedFile|string $document): array
    {
        $base64Image = $this->prepareImage($document);

        $prompt = $this->buildContratoPrompt();

        return $this->callOpenAI($base64Image, $prompt);
    }

    /**
     * Analizar poder notarial
     *
     * Extrae datos de poderes notariales.
     *
     * @param  UploadedFile|string  $document  Archivo del poder
     * @return array Datos estructurados del poder
     *
     * @throws Exception
     */
    public function analyzePoder(UploadedFile|string $document): array
    {
        $base64Image = $this->prepareImage($document);

        $prompt = $this->buildPoderPrompt();

        return $this->callOpenAI($base64Image, $prompt);
    }

    /**
     * Generar resumen del documento
     *
     * Crea un resumen ejecutivo del documento analizado.
     *
     * @param  UploadedFile|string  $document  Archivo del documento
     * @return string Resumen del documento
     *
     * @throws Exception
     */
    public function generateSummary(UploadedFile|string $document): string
    {
        $base64Image = $this->prepareImage($document);

        $prompt = 'Por favor, lee este documento legal y genera un resumen ejecutivo conciso (máximo 500 palabras) que incluya: '.
            '1) Tipo de documento, 2) Partes involucradas, 3) Objeto o propósito principal, '.
            '4) Fechas relevantes, 5) Montos o valores (si aplica), 6) Puntos clave o cláusulas importantes.';

        $response = $this->callOpenAI($base64Image, $prompt, false);

        return $response['summary'] ?? '';
    }

    /**
     * Detectar tipo de documento
     *
     * Identifica automáticamente el tipo de documento.
     *
     * @param  UploadedFile|string  $document  Archivo del documento
     * @return string Tipo de documento detectado
     *
     * @throws Exception
     */
    public function detectDocumentType(UploadedFile|string $document): string
    {
        $base64Image = $this->prepareImage($document);

        $prompt = 'Analiza este documento legal mexicano e identifica su tipo. '.
            'Responde ÚNICAMENTE con una de estas opciones: '.
            'escritura_publica, contrato_compraventa, contrato_arrendamiento, poder_notarial, '.
            'testamento, acta_constitutiva, convenio, carta_poder, otro. '.
            'Si no puedes identificarlo con certeza, responde "otro".';

        $response = $this->callOpenAI($base64Image, $prompt, false);

        return $response['tipo'] ?? 'otro';
    }

    /**
     * Preparar imagen para envío a OpenAI
     */
    protected function prepareImage(UploadedFile|string $document): string
    {
        if ($document instanceof UploadedFile) {
            $content = file_get_contents($document->getRealPath());
        } else {
            // Es una ruta en storage
            if (Storage::exists($document)) {
                $content = Storage::get($document);
            } elseif (file_exists($document)) {
                $content = file_get_contents($document);
            } else {
                throw new Exception("Archivo no encontrado: {$document}");
            }
        }

        return base64_encode($content);
    }

    /**
     * Llamar a OpenAI API
     */
    protected function callOpenAI(string $base64Image, string $prompt, bool $structuredResponse = true): array
    {
        $this->assertApiKeyConfigured();

        $maxRetries = 3;
        $baseDelay = 2; // segundos

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                $messages = [
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'text',
                                'text' => $prompt,
                            ],
                            [
                                'type' => 'image_url',
                                'image_url' => [
                                    'url' => "data:image/jpeg;base64,{$base64Image}",
                                ],
                            ],
                        ],
                    ],
                ];

                $payload = [
                    'model' => $this->model,
                    'messages' => $messages,
                    'temperature' => $this->temperature,
                    'max_tokens' => $this->maxTokens,
                ];

                if ($structuredResponse) {
                    $payload['response_format'] = ['type' => 'json_object'];
                }

                Log::info('OpenAI Document Analysis Request', [
                    'model' => $this->model,
                    'attempt' => $attempt,
                ]);

                $response = Http::timeout($this->timeout)
                    ->withHeaders([
                        'Authorization' => "Bearer {$this->apiKey}",
                        'Content-Type' => 'application/json',
                    ])
                    ->post($this->endpoint, $payload);

                if ($response->failed()) {
                    $statusCode = $response->status();
                    $errorBody = $response->json();

                    // Detectar errores de saturación/límite de tasa
                    $isRateLimit = $statusCode === 429 ||
                        ($statusCode === 500 && isset($errorBody['error']['message']) &&
                            str_contains(strtolower($errorBody['error']['message']), 'rate limit'));

                    if ($isRateLimit && $attempt < $maxRetries) {
                        $delay = $baseDelay * pow(2, $attempt - 1); // Exponential backoff: 2s, 4s, 8s
                        Log::warning("OpenAI rate limit alcanzado, reintentando en {$delay}s...", [
                            'attempt' => $attempt,
                            'status' => $statusCode,
                        ]);
                        sleep($delay);

                        continue;
                    }

                    throw new Exception(
                        "Error de OpenAI API ({$statusCode}): ".
                        ($errorBody['error']['message'] ?? 'Error desconocido')
                    );
                }

                $result = $response->json();

                if (! isset($result['choices'][0]['message']['content'])) {
                    throw new Exception('Respuesta inválida de OpenAI API');
                }

                $content = $result['choices'][0]['message']['content'];

                // Si esperamos JSON estructurado, parsearlo
                if ($structuredResponse) {
                    $data = json_decode($content, true);

                    if (json_last_error() !== JSON_ERROR_NONE) {
                        throw new Exception('Error al parsear respuesta JSON de OpenAI: '.json_last_error_msg());
                    }

                    return $data;
                }

                // Respuesta de texto plano
                return ['summary' => $content, 'tipo' => $content];

            } catch (Exception $e) {
                Log::error('OpenAI Document Analysis Error', [
                    'error' => $e->getMessage(),
                    'attempt' => $attempt,
                ]);

                if ($attempt >= $maxRetries) {
                    throw new Exception(
                        'Error al analizar documento con OpenAI después de '.$maxRetries.' intentos: '.$e->getMessage()
                    );
                }

                // Esperar antes del siguiente intento
                $delay = $baseDelay * pow(2, $attempt - 1);
                sleep($delay);
            }
        }

        throw new Exception('Error inesperado en análisis de documento');
    }

    /**
     * Construir prompt genérico
     */
    protected function buildGenericPrompt(?string $tipoDocumento = null): string
    {
        $tipoInfo = $tipoDocumento ? " El documento es un {$tipoDocumento}." : '';

        return "Analiza este documento legal mexicano y extrae la siguiente información en formato JSON.{$tipoInfo}\n\n".
            "Devuelve un objeto JSON con esta estructura:\n".
            "{\n".
            '  "tipo_documento": "tipo detectado",'."\n".
            '  "partes": ["parte 1", "parte 2", ...],'."\n".
            '  "fecha_documento": "YYYY-MM-DD o null",'."\n".
            '  "lugar": "ciudad, estado",'."\n".
            '  "objeto": "descripción del objeto o propósito",'."\n".
            '  "montos": [{"concepto": "...", "cantidad": "...", "moneda": "MXN"}],'."\n".
            '  "datos_notariales": {"notaria": "...", "numero": "...", "estado": "...", "notario": "..."},'."\n".
            '  "clausulas_importantes": ["cláusula 1", "cláusula 2", ...],'."\n".
            '  "datos_adicionales": {"campo_custom": "valor"},'."\n".
            '  "confianza": 0.95'."\n".
            "}\n\n".
            'Si algún campo no está disponible, usa null. El campo "confianza" debe ser un número entre 0 y 1 '.
            'indicando qué tan seguro estás de la extracción.';
    }

    /**
     * Construir prompt para escritura pública
     */
    protected function buildEscrituraPrompt(): string
    {
        return "Analiza esta escritura pública notarial mexicana y extrae la información en formato JSON.\n\n".
            "Devuelve un objeto JSON con esta estructura:\n".
            "{\n".
            '  "tipo_documento": "escritura_publica",'."\n".
            '  "numero_escritura": "número",'."\n".
            '  "volumen": "volumen",'."\n".
            '  "fecha_otorgamiento": "YYYY-MM-DD",'."\n".
            '  "notaria": {"numero": "...", "estado": "...", "titular": "..."},'."\n".
            '  "comparecientes": [{"nombre": "...", "tipo": "otorgante/apoderado/testigo", "identificacion": "..."}],'."\n".
            '  "acto_juridico": "compraventa/constitución/poder/testamento/etc",'."\n".
            '  "objeto": "descripción detallada",'."\n".
            '  "inmuebles": [{"descripcion": "...", "ubicacion": "...", "superficie": "...", "linderos": "..."}],'."\n".
            '  "precio_contraprestacion": {"cantidad": "...", "moneda": "MXN"},'."\n".
            '  "gravamenes": ["gravamen 1", "gravamen 2"],'."\n".
            '  "inscripcion_registro": {"folio": "...", "fecha": "YYYY-MM-DD"},'."\n".
            '  "confianza": 0.95'."\n".
            "}\n\n".
            'Si algún campo no está disponible, usa null.';
    }

    /**
     * Construir prompt para contrato
     */
    protected function buildContratoPrompt(): string
    {
        return "Analiza este contrato y extrae la información en formato JSON.\n\n".
            "Devuelve un objeto JSON con esta estructura:\n".
            "{\n".
            '  "tipo_documento": "contrato",'."\n".
            '  "tipo_contrato": "compraventa/arrendamiento/servicios/etc",'."\n".
            '  "fecha_contrato": "YYYY-MM-DD",'."\n".
            '  "vigencia": {"inicio": "YYYY-MM-DD", "fin": "YYYY-MM-DD o null"},'."\n".
            '  "partes": [{"nombre": "...", "rol": "vendedor/comprador/arrendador/arrendatario", "domicilio": "..."}],'."\n".
            '  "objeto": "descripción del objeto del contrato",'."\n".
            '  "precio_renta": {"cantidad": "...", "moneda": "MXN", "periodicidad": "mensual/anual/unico"},'."\n".
            '  "forma_pago": "descripción",'."\n".
            '  "clausulas_importantes": ["cláusula 1", "cláusula 2"],'."\n".
            '  "penas_convencionales": "descripción o null",'."\n".
            '  "garantias": ["garantía 1", "garantía 2"],'."\n".
            '  "confianza": 0.95'."\n".
            "}\n\n".
            'Si algún campo no está disponible, usa null.';
    }

    /**
     * Construir prompt para poder notarial
     */
    protected function buildPoderPrompt(): string
    {
        return "Analiza este poder notarial y extrae la información en formato JSON.\n\n".
            "Devuelve un objeto JSON con esta estructura:\n".
            "{\n".
            '  "tipo_documento": "poder_notarial",'."\n".
            '  "tipo_poder": "general/especial/limitado",'."\n".
            '  "alcance": "actos_dominio/actos_administracion/pleitos_cobranzas",'."\n".
            '  "fecha_otorgamiento": "YYYY-MM-DD",'."\n".
            '  "otorgante": {"nombre": "...", "identificacion": "..."},'."\n".
            '  "apoderado": {"nombre": "...", "identificacion": "..."},'."\n".
            '  "facultades": ["facultad 1", "facultad 2", ...],'."\n".
            '  "limitaciones": ["limitación 1" o null],'."\n".
            '  "vigencia": "indefinida/hasta fecha/etc",'."\n".
            '  "revocable": true/false,'."\n".
            '  "notaria": {"numero": "...", "estado": "...", "titular": "..."},'."\n".
            '  "confianza": 0.95'."\n".
            "}\n\n".
            'Si algún campo no está disponible, usa null.';
    }
}
