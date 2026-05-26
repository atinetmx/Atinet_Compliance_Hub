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

    /** @var string[] Modelos a intentar en orden (fallback si hay 429/503) */
    protected array $models;

    public function __construct()
    {
        $this->apiKey = config('services.gemini.api_key', '');
        $this->temperature = config('services.gemini.temperature', 0.1);
        $this->timeout = config('services.gemini.timeout', 60);

        // Modelos con fallback (igual que el sistema PHP legacy)
        $this->models = [
            'gemini-2.5-flash',   // Principal: más rápido y estable
            'gemini-2.5-pro',     // Fallback: más potente
        ];

        // Para compatibilidad con código que usa $this->model / $this->endpoint
        $this->model = $this->models[0];
        $this->endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/'.$this->models[0].':generateContent';

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

            // Intentar con cada modelo en orden (fallback igual que PHP legacy)
            $lastError = null;
            foreach ($this->models as $model) {
                $endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/'.$model.':generateContent';

                $response = Http::withOptions(['verify' => false])
                    ->timeout($this->timeout)
                    ->withHeaders(['Content-Type' => 'application/json'])
                    ->post($endpoint.'?key='.$this->apiKey, $requestData);

                $geminiResponse = $response->json();

                // 429 / 503 → intentar siguiente modelo
                if (in_array($response->status(), [429, 503])) {
                    $lastError = $geminiResponse['error']['message'] ?? 'Servicio saturado ('.$response->status().')';
                    usleep(300000); // 300ms

                    continue;
                }

                if (isset($geminiResponse['error'])) {
                    $this->handleGeminiError($geminiResponse['error']);
                }

                if (! $response->successful()) {
                    throw new Exception('Error al conectar con Gemini Vision API: '.$response->status());
                }

                if (isset($geminiResponse['candidates'][0]['content']['parts'][0]['text'])) {
                    $jsonText = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];
                    // Limpiar markdown si Gemini lo agrega
                    $jsonText = preg_replace('/^```json\s*/m', '', $jsonText);
                    $jsonText = preg_replace('/^```\s*/m', '', $jsonText);
                    $jsonText = trim($jsonText);

                    $structuredData = json_decode($jsonText, true);

                    if (json_last_error() === JSON_ERROR_NONE && is_array($structuredData)) {
                        return $structuredData;
                    }

                    Log::warning('Invalid JSON from Gemini Vision', [
                        'model' => $model,
                        'json_error' => json_last_error_msg(),
                        'response_text' => substr($jsonText, 0, 500),
                    ]);
                }

                throw new Exception('No se pudo procesar la respuesta de Gemini Vision API');
            }

            throw new Exception('Todos los modelos Gemini fallaron: '.($lastError ?? 'Error desconocido'));
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
- vigencia: año de vigencia de la credencial (solo 4 dígitos, ej: "2027"). NO confundir con la fecha de nacimiento
- dia: fecha de nacimiento (formato: "YYYY-MM-DD")
- genero: "H" para Hombre o "M" para Mujer (UN solo carácter)
- calle: nombre completo de la calle/vialidad (MAYÚSCULAS)
- no_exterior: número exterior (puede ser número o alfanumérico como "15-A")
- no_interior: número interior o depto (vacío si no existe)
- colonia: colonia o asentamiento (MAYÚSCULAS)
- municipio: municipio o delegación (MAYÚSCULAS)
- estado: nombre completo del estado (MAYÚSCULAS, ej: "JALISCO", "CIUDAD DE MEXICO")
- cp: código postal (5 dígitos como número)

REGLAS IMPORTANTES:
1. Todos los textos deben estar en MAYÚSCULAS
2. Si un campo no es visible o legible, devuelve cadena vacía "" (o null para opcionales)
3. La dirección está en la parte inferior de la credencial
4. El CURP puede aparecer en el anverso (modelos antiguos) o en el reverso (modelos recientes) — extráelo si es visible
5. Asegúrate de que el no_identificacion tenga 13 dígitos
6. "vigencia" es el AÑO de vencimiento de la credencial (4 dígitos, ej: "2027"), NO la fecha de nacimiento
7. Devuelve SOLO el JSON puro, sin texto adicional ni bloques ```json
8. Fecha de nacimiento puede aparecer como DD/MM/AAAA o "01 ENE 1990". Meses: ENE=01, FEB=02, MAR=03, ABR=04, MAY=05, JUN=06, JUL=07, AGO=08, SEP=09, OCT=10, NOV=11, DIC=12
PROMPT;
        }

        // side === 'back'
        return <<<'PROMPT'
Analiza esta imagen de la cara REVERSO/TRASERA de una Credencial para Votar (INE/IFE) mexicana.

IMPORTANTE: Este lado contiene el código MRZ (Machine Readable Zone) en la parte inferior.
El código MRZ son 3 líneas de texto con caracteres especiales (<< y números/letras). Ejemplo:
  IDMEX1490660998<<0668075350190
  8804215H2612317MEX<01<<23337<5
  VALDEZ<RODRIGUEZ<<DANIEL<IVAN<

Extrae y estructura los siguientes datos en formato JSON con estas claves exactas:

- idm: número que aparece inmediatamente después de "IDMEX" en la primera línea del MRZ (generalmente 10 dígitos)
- ocr_code: las 3 líneas completas del MRZ tal como aparecen, separadas por saltos de línea \n (incluye todos los caracteres << y <)
- vigencia: año de vigencia si aparece visible (4 dígitos), vacío si no se ve
- clave_elector: CLAVE DE ELECTOR de 18 caracteres alfanuméricos si aparece (solo en versiones anteriores de INE, cerca del código de barras o QR). Vacío si no existe.

REGLAS CRÍTICAS:
1. Devuelve SOLO el JSON puro, sin texto adicional, sin bloques ```json
2. idm: extrae SOLO el número que viene después de "IDMEX" en la primera línea del MRZ
3. ocr_code: copia las 3 líneas completas del MRZ incluyendo todos los caracteres especiales << y <
4. Si un campo no es visible, usa cadena vacía ""
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
- genero: "H" para Hombre o "M" para Mujer (UN solo carácter)
- estado_nac: estado de nacimiento (nombre completo, MAYÚSCULAS, ej: "JALISCO")
- municipio_nac: municipio o alcaldía de nacimiento (MAYÚSCULAS)
- ciudad_nac: ciudad de nacimiento si aparece diferente al municipio, si no null
- paisnac: país de nacimiento (generalmente "MEXICO" en MAYÚSCULAS)
- nacionalidad: nacionalidad (generalmente "MEXICANA" en MAYÚSCULAS)

REGLAS IMPORTANTES:
1. El formato del CURP es: 4 letras (apellidos+nombre) + 6 dígitos (fecha nacimiento AAMMDD) + 1 letra (sexo H/M) + 2 letras (estado) + 3 consonantes + 1 alfanumérico + 1 dígito verificador (total 18 caracteres)
2. Todos los textos deben estar en MAYÚSCULAS
3. Si un campo no es visible o legible, devuelve null para campos opcionales o cadena vacía "" para campos principales (nombre, curp, dia)
4. La fecha debe ser YYYY-MM-DD (extráela del CURP si no aparece explícita: posiciones 5-10 del CURP = AAMMDD)
5. Devuelve SOLO el JSON puro, sin texto adicional ni bloques ```json
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
- genero: "H" para Hombre/Masculino o "M" para Mujer/Femenino (UN solo carácter)
- ciudad_nac: ciudad de nacimiento (MAYÚSCULAS)
- municipio_nac: municipio de nacimiento (MAYÚSCULAS)
- estado_nac: estado de nacimiento (MAYÚSCULAS)
- paisnac: país de nacimiento (generalmente "MEXICO")
- nacionalidad: nacionalidad (generalmente "MEXICANA")
- padre_nombre: nombre completo del padre (MAYÚSCULAS, vacío si no aparece)
- madre_nombre: nombre completo de la madre (MAYÚSCULAS, vacío si no aparece)
- curp: CURP si está visible en el documento (18 caracteres, vacío si no está)
- num_acta: número del acta (vacío si no aparece)
- folio_acta: folio o clave digital del acta (ej: CMDX20210123A1234BC, vacío si no aparece)
- oficialía: número o nombre de la oficialía/juzgado del registro civil (vacío si no aparece)
- fecha_registro: fecha en que se registró el nacimiento en formato YYYY-MM-DD si aparece y es diferente a la fecha de nacimiento (null si no aparece)

REGLAS IMPORTANTES:
1. Todos los textos deben estar en MAYÚSCULAS
2. Si un campo no es visible o legible, devuelve cadena vacía ""
3. Los nombres de padres aparecen en secciones específicas del acta
4. El formato de fecha debe ser YYYY-MM-DD
5. Busca el CURP en el código de barras o en una sección específica del acta
6. Devuelve SOLO el JSON puro, sin texto adicional ni bloques ```json
7. En actas antiguas puede faltar CURP y folio_acta; en actas digitales nuevas puede faltar oficialía
PROMPT;
    }
}
