<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Gemini Vision Service
 *
 * Servicio para analizar imágenes de documentos usando Google Gemini Vision API.
 * Soporta documentos mexicanos: INE, CURP, Acta de Nacimiento.
 *
 * API Reference: https://ai.google.dev/gemini-api/docs/vision
 */
class GeminiVisionService
{
    protected string $apiKey;

    protected string $model;

    protected string $endpoint;

    protected float $temperature;

    protected int $timeout;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', '');
        $this->model = config('services.gemini.model', 'gemini-2.5-pro');
        $this->endpoint = config('services.gemini.endpoint', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent');
        $this->temperature = config('services.gemini.temperature', 0.1);
        $this->timeout = config('services.gemini.timeout', 60);

        if (empty($this->apiKey) && ! app()->environment('testing')) {
            throw new Exception('Gemini API key not configured. Set GEMINI_API_KEY in .env');
        }
    }

    /**
     * Analizar INE (Credencial de Elector)
     *
     * Extrae datos de la credencial para votar mexicana.
     * Procesa frente o reverso según el parámetro $side.
     *
     * @param  UploadedFile  $image  Imagen de la INE
     * @param  string  $side  'front' (frente) o 'back' (reverso)
     * @return array Datos estructurados de la INE
     *
     * @throws Exception
     */
    public function analyzeINE(UploadedFile $image, string $side): array
    {
        $this->validateImage($image);

        $prompt = $this->buildINEPrompt($side);

        return $this->analyzeImage($image, $prompt);
    }

    /**
     * Analizar documento CURP
     *
     * Extrae datos de la Clave Única de Registro de Población.
     *
     * @param  UploadedFile  $image  Imagen del documento CURP
     * @return array Datos estructurados del CURP
     *
     * @throws Exception
     */
    public function analyzeCURP(UploadedFile $image): array
    {
        $this->validateImage($image);

        $prompt = $this->buildCURPPrompt();

        return $this->analyzeImage($image, $prompt);
    }

    /**
     * Analizar Acta de Nacimiento
     *
     * Extrae datos del acta de nacimiento mexicana.
     *
     * @param  UploadedFile  $image  Imagen del acta
     * @return array Datos estructurados del acta
     *
     * @throws Exception
     */
    public function analyzeActaNacimiento(UploadedFile $image): array
    {
        $this->validateImage($image);

        $prompt = $this->buildActaPrompt();

        return $this->analyzeImage($image, $prompt);
    }

    /**
     * Analizar imagen con prompt específico
     *
     * Método genérico que envía la imagen + prompt a Gemini Vision API.
     *
     * @param  UploadedFile  $image  Imagen a analizar
     * @param  string  $prompt  Instrucciones para Gemini
     * @return array Datos estructurados
     *
     * @throws Exception
     */
    protected function analyzeImage(UploadedFile $image, string $prompt): array
    {
        try {
            // Convertir imagen a base64
            $imageData = base64_encode(file_get_contents($image->getRealPath()));
            $mimeType = $image->getMimeType();

            // Construir request para Gemini Vision API
            $requestData = [
                'contents' => [
                    [
                        'parts' => [
                            [
                                'text' => $prompt,
                            ],
                            [
                                'inline_data' => [
                                    'mime_type' => $mimeType,
                                    'data' => $imageData,
                                ],
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'temperature' => $this->temperature,
                    'responseMimeType' => 'application/json',
                ],
            ];

            // Llamar a Gemini Vision API
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($this->endpoint.'?key='.$this->apiKey, $requestData);

            // Procesar respuesta
            $geminiResponse = $response->json();

            // Manejar errores de Gemini
            if (isset($geminiResponse['error'])) {
                $this->handleGeminiError($geminiResponse['error']);
            }

            if (! $response->successful()) {
                throw new Exception('Error al conectar con Gemini Vision API: '.$response->status());
            }

            // Extraer JSON de la respuesta
            if (isset($geminiResponse['candidates'][0]['content']['parts'][0]['text'])) {
                $jsonText = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];
                $structuredData = json_decode($jsonText, true);

                if (json_last_error() === JSON_ERROR_NONE && is_array($structuredData)) {
                    return $structuredData;
                }

                // Log para debug si el JSON no es válido
                Log::warning('Invalid JSON from Gemini Vision', [
                    'json_error' => json_last_error_msg(),
                    'response_text' => substr($jsonText, 0, 500),
                ]);
            }

            throw new Exception('No se pudo procesar la respuesta de Gemini Vision API');
        } catch (Exception $e) {
            Log::error('Error analyzing image with Gemini Vision', [
                'error' => $e->getMessage(),
                'image_size' => $image->getSize(),
                'mime_type' => $image->getMimeType(),
            ]);
            throw $e;
        }
    }

    /**
     * Validar imagen antes de procesarla
     *
     * @param  UploadedFile  $image  Imagen a validar
     *
     * @throws Exception
     */
    protected function validateImage(UploadedFile $image): void
    {
        // Validar tipo MIME
        $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (! in_array($image->getMimeType(), $allowedMimes)) {
            throw new Exception('Formato de imagen no soportado. Use JPEG, PNG o WebP.');
        }

        // Validar tamaño (máximo 10MB)
        $maxSize = 10 * 1024 * 1024; // 10MB en bytes
        if ($image->getSize() > $maxSize) {
            throw new Exception('La imagen es demasiado grande. Máximo 10MB.');
        }

        // Validar que el archivo sea accesible
        if (! file_exists($image->getRealPath())) {
            throw new Exception('No se pudo acceder al archivo de imagen.');
        }
    }

    /**
     * Manejar errores de Gemini API
     *
     * @param  array  $error  Error retornado por Gemini
     *
     * @throws Exception
     */
    protected function handleGeminiError(array $error): void
    {
        $errorCode = $error['code'] ?? 'unknown';
        $errorMessage = $error['message'] ?? 'Error desconocido';

        // Errores específicos
        if ($errorCode == 429) {
            throw new Exception('Límite de uso de Gemini alcanzado. Intente más tarde.');
        }

        if ($errorCode == 400) {
            throw new Exception('Imagen inválida o corrupta: '.$errorMessage);
        }

        if ($errorCode == 401 || $errorCode == 403) {
            throw new Exception('API Key de Gemini inválida o sin permisos.');
        }

        throw new Exception('Error de Gemini Vision API: '.$errorMessage);
    }

    /**
     * Construir prompt para análisis de INE
     *
     * @param  string  $side  'front' o 'back'
     * @return string Prompt formateado
     */
    protected function buildINEPrompt(string $side): string
    {
        if ($side === 'front') {
            return <<<'PROMPT'
Analiza esta imagen de la CREDENCIAL PARA VOTAR (INE) mexicana - LADO FRONTAL.

Extrae y estructura los siguientes datos en formato JSON con estas claves exactas:

- nombre: nombre(s) de pila (MAYÚSCULAS)
- apellidopat: apellido paterno (MAYÚSCULAS)
- apellidomat: apellido materno (MAYÚSCULAS)
- curp: CURP completo (18 caracteres alfanuméricos)
- no_identificacion: número de credencial (13 dígitos)
- clave_elector: clave de elector (18 caracteres alfanuméricos, opcional)
- vigiencia_de_ine: vigencia de la credencial (formato: "YYYY" o "YYYY-MM-DD")
- dia: fecha de nacimiento (formato: "YYYY-MM-DD")
- genero: "HOMBRE" o "MUJER"
- calle: nombre completo de la calle/vialidad (MAYÚSCULAS)
- no_exterior: número exterior (puede ser número o alfanumérico como "15-A")
- no_interior: número interior o depto (opcional, vacío si no existe)
- colonia: colonia o asentamiento (MAYÚSCULAS)
- municipio: municipio o delegación (MAYÚSCULAS)
- estado: estado (abreviatura de 2-3 letras, ej: "CDMX", "JAL", "NL")
- cp: código postal (5 dígitos como número)

REGLAS IMPORTANTES:
1. Todos los textos deben estar en MAYÚSCULAS
2. Si un campo no es visible o legible, devuelve una cadena vacía ""
3. La dirección está en la parte inferior de la credencial
4. El CURP está en la parte trasera (reverso), si no lo ves devuelve ""
5. Asegúrate de que el no_identificacion tenga 13 dígitos
6. La vigencia aparece abajo como "VIGENCIA XXXX"
7. Devuelve SOLO el JSON, sin texto adicional
PROMPT;
        }

        // side === 'back'
        return <<<'PROMPT'
Analiza esta imagen de la CREDENCIAL PARA VOTAR (INE) mexicana - LADO REVERSO.

Extrae y estructura los siguientes datos en formato JSON con estas claves exactas:

- curp: CURP completo (18 caracteres alfanuméricos, visible en el código de barras o texto)
- rfc: RFC si está visible (12-13 caracteres, opcional, puede estar vacío)
- clave_elector: clave de elector si es visible (18 caracteres alfanuméricos)

REGLAS IMPORTANTES:
1. El CURP suele estar en un código de barras con texto debajo
2. Si un campo no es visible, devuelve una cadena vacía ""
3. Devuelve SOLO el JSON, sin texto adicional
PROMPT;
    }

    /**
     * Construir prompt para análisis de CURP
     *
     * @return string Prompt formateado
     */
    protected function buildCURPPrompt(): string
    {
        return <<<'PROMPT'
Analiza esta imagen de un DOCUMENTO DE CURP (Clave Única de Registro de Población) mexicano.

Extrae y estructura los siguientes datos en formato JSON con estas claves exactas:

- curp: CURP completo (18 caracteres alfanuméricos, ej: "ROMC850315HJCLRR09")
- nombre: nombre(s) completo (MAYÚSCULAS)
- apellidopat: apellido paterno (MAYÚSCULAS)
- apellidomat: apellido materno (MAYÚSCULAS)
- dia: fecha de nacimiento (formato: "YYYY-MM-DD", ej: "1985-03-15")
- genero: "HOMBRE" o "MUJER"
- estado_nac: estado de nacimiento (nombre completo, MAYÚSCULAS, ej: "JALISCO")
- paisnac: país de nacimiento (generalmente "MEXICO" en MAYÚSCULAS)
- nacionalidad: nacionalidad (generalmente "MEXICANA" en MAYÚSCULAS)

REGLAS IMPORTANTES:
1. El formato del CURP es: 4 letras (apellidos+nombre) + 6 dígitos (fecha nacimiento AAMMDD) + 1 letra (sexo) + 2 letras (estado) + 3 consonantes + 1 dígito verificador
2. Todos los textos deben estar en MAYÚSCULAS
3. Si un campo no es visible o legible, devuelve una cadena vacía ""
4. La fecha debe extraerse del CURP (posiciones 5-10: AAMMDD) y convertirse a formato YYYY-MM-DD
5. Devuelve SOLO el JSON, sin texto adicional
PROMPT;
    }

    /**
     * Construir prompt para análisis de Acta de Nacimiento
     *
     * @return string Prompt formateado
     */
    protected function buildActaPrompt(): string
    {
        return <<<'PROMPT'
Analiza esta imagen de un ACTA DE NACIMIENTO mexicana.

Extrae y estructura los siguientes datos en formato JSON con estas claves exactas:

- nombre: nombre(s) completo del registrado (MAYÚSCULAS)
- apellidopat: apellido paterno (MAYÚSCULAS)
- apellidomat: apellido materno (MAYÚSCULAS)
- dia: fecha de nacimiento (formato: "YYYY-MM-DD")
- genero: "HOMBRE" o "MUJER"
- ciudad_nac: ciudad de nacimiento (MAYÚSCULAS)
- municipio_nac: municipio de nacimiento (MAYÚSCULAS)
- estado_nac: estado de nacimiento (MAYÚSCULAS)
- paisnac: país de nacimiento (generalmente "MEXICO")
- nacionalidad: nacionalidad (generalmente "MEXICANA")
- padre_nombre: nombre completo del padre (MAYÚSCULAS, opcional si no aparece)
- madre_nombre: nombre completo de la madre (MAYÚSCULAS, opcional si no aparece)
- curp: CURP si está visible en el documeto (18 caracteres, opcional)
- no_acta: número de acta (opcional)
- libro: libro (opcional)
- foja: foja (opcional)

REGLAS IMPORTANTES:
1. Todos los textos deben estar en MAYÚSCULAS
2. Si un campo no es visible o legible, devuelve una cadena vacía ""
3. Los nombres de padres aparecen en secciones específicas del acta
4. El formato de fecha debe ser YYYY-MM-DD
5. Busca el CURP en el código de barras o en una sección específica
6. Devuelve SOLO el JSON, sin texto adicional
PROMPT;
    }
}
