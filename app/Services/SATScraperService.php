<?php

namespace App\Services;

use DOMDocument;
use DOMXPath;
use Exception;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * SAT Scraper Service
 *
 * Extrae datos de la constancia fiscal del SAT usando la URL del QR
 * y los estructura usando Google Gemini AI.
 *
 * Portado desde: utilerias_appliweb/api/sat/procesar.php
 */
class SATScraperService
{
    protected string $geminiApiKey;

    protected string $geminiEndpoint;

    protected float $temperature;

    protected int $timeout;

    public function __construct()
    {
        $this->geminiApiKey = config('services.gemini.api_key') ?? '';
        $this->geminiEndpoint = config('services.gemini.endpoint') ?? 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
        $this->temperature = (float) (config('services.gemini.temperature') ?? 0.1);
        $this->timeout = (int) (config('services.gemini.timeout') ?? 60);
    }

    /**
     * Procesar URL del QR del SAT
     *
     * @param  string  $qrUrl  URL extraída del QR de la constancia fiscal
     * @return array Datos estructurados de la constancia
     *
     * @throws Exception
     */
    public function processQRUrl(string $qrUrl): array
    {
        // Validar que sea URL del SAT
        if (! str_contains($qrUrl, 'siat.sat.gob.mx')) {
            throw new Exception('La URL no corresponde a una constancia del SAT');
        }

        // Paso 1: Obtener HTML del SAT
        $html = $this->fetchSATHTML($qrUrl);
        $rawData = $this->extractDataFromHTML($html);

        if (empty($rawData)) {
            throw new Exception('No se encontraron datos en la constancia fiscal');
        }

        // Paso 2: Estructurar datos — Gemini si hay key, parser directo si no
        if (! empty($this->geminiApiKey)) {
            $structuredData = $this->structureWithGemini($rawData);
        } else {
            Log::info('Gemini key no configurada, usando parser directo de HTML del SAT');
            $structuredData = $this->structureDirectlyFromHTML($html, $rawData);
        }

        // Validar datos mínimos
        if (empty($structuredData['rfc'])) {
            throw new Exception('No se pudo extraer el RFC de la constancia');
        }

        // Normalizar tipo de persona (Gemini puede retornar "persona" o "Persona")
        if (isset($structuredData['persona'])) {
            $structuredData['Persona'] = strtoupper($structuredData['persona']);
            unset($structuredData['persona']);
        } elseif (isset($structuredData['Persona'])) {
            $structuredData['Persona'] = strtoupper($structuredData['Persona']);
        }

        // Fallback: derivar Persona del RFC si Gemini no lo determinó o es inválido
        // RFC Moral:  12 chars (3 letras + 6 dígitos + 3 homoclave), 4to char es dígito
        // RFC Física: 13 chars (4 letras + 6 dígitos + 3 homoclave), 4to char es letra
        if (! isset($structuredData['Persona']) || ! in_array($structuredData['Persona'], ['FISICA', 'MORAL'])) {
            $rfc = $structuredData['rfc'] ?? '';
            $structuredData['Persona'] = (strlen($rfc) >= 4 && ! is_numeric($rfc[3])) ? 'FISICA' : 'MORAL';
        }

        // Normalizar cp_fiscal: siempre string de 5 dígitos con ceros iniciales
        if (! empty($structuredData['cp_fiscal'])) {
            $structuredData['cp_fiscal'] = str_pad(
                preg_replace('/\D/', '', (string) $structuredData['cp_fiscal']),
                5,
                '0',
                STR_PAD_LEFT
            );
        }

        return $structuredData;
    }

    /**
     * Extraer datos HTML del SAT usando HTTP client
     *
     * NOTA IMPORTANTE: PHP 8.1+ / OpenSSL 3 requiere reducir nivel de seguridad
     * para aceptar claves DH del servidor del SAT (antiguas).
     *
     * @param  string  $url  URL de la constancia en siat.sat.gob.mx
     * @return string HTML de la página
     *
     * @throws Exception
     */
    protected function fetchSATHTML(string $url): string
    {
        try {
            // Usar Http facade para permitir testing con mocks
            // verify=false: siat.sat.gob.mx usa certificados intermedios no incluidos en el bundle
            // del servidor Windows. La URL ya fue validada como proveniente de un QR del SAT.
            $response = Http::withOptions([
                'verify' => false,
                'curl' => [
                    CURLOPT_SSL_CIPHER_LIST => 'DEFAULT@SECLEVEL=1', // PHP 8.1+ / OpenSSL 3
                ],
            ])
                ->timeout(30)
                ->get($url);

            // Verificar código HTTP
            if (! $response->successful()) {
                throw new Exception('El servidor del SAT respondió con código: '.$response->status());
            }

            $html = $response->body();

            // Validar contenido
            if (stripos($html, 'no se le ha emitido su Cédula') !== false) {
                throw new Exception('RFC sin cédula fiscal emitida o datos inválidos');
            }

            return $html;

        } catch (Exception $e) {
            Log::error('Error fetching SAT HTML', [
                'url' => $url,
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Extraer datos del HTML usando XPath
     *
     * Extrae elementos <td> y <ul> que contienen los datos de la constancia.
     * Se toman solo los elementos en posiciones pares (índices 0, 2, 4...).
     *
     * @param  string  $html  HTML de la constancia del SAT
     * @return array Array de strings con los datos crudos
     *
     * @throws Exception
     */
    protected function extractDataFromHTML(string $html): array
    {
        try {
            // Cargar HTML en DOMDocument
            $dom = new DOMDocument;
            libxml_use_internal_errors(true);
            $loaded = $dom->loadHTML($html);
            libxml_clear_errors();

            if (! $loaded) {
                throw new Exception('Error al procesar HTML del SAT');
            }

            // Extraer elementos <td> con XPath
            $xpath = new DOMXPath($dom);
            $tdNodes = $xpath->query('//td');
            $dataArray = [];

            foreach ($tdNodes as $index => $node) {
                // Tomar solo elementos en posiciones pares (evita duplicados)
                if ($index % 2 === 0) {
                    $value = trim($node->nodeValue);
                    if (! empty($value)) {
                        $dataArray[] = $value;
                    }
                }
            }

            // Extraer elementos <ul>
            $ulNodes = $xpath->query('//ul');
            foreach ($ulNodes as $index => $node) {
                if ($index % 2 === 0 && ! empty($node->nodeValue)) {
                    $value = trim($node->nodeValue);
                    if (! empty($value)) {
                        $dataArray[] = $value;
                    }
                }
            }

            return $dataArray;

        } catch (Exception $e) {
            Log::error('Error extracting data from SAT HTML', [
                'error' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    /**
     * Procesar datos con Gemini AI para estructurar
     *
     * Envía los datos crudos extraídos del HTML a Gemini para que los
     * estructure en formato JSON con claves específicas.
     *
     * @param  array  $rawData  Array de strings con datos crudos
     * @return array Datos estructurados
     *
     * @throws Exception
     */
    protected function structureWithGemini(array $rawData): array
    {
        if (empty($this->geminiApiKey)) {
            throw new Exception('Gemini API key not configured');
        }

        $maxRetries = 3;
        $baseDelay = 1; // segundo

        for ($attempt = 1; $attempt <= $maxRetries; $attempt++) {
            try {
                // Preparar texto para Gemini
                $fullText = implode(' ', $rawData);

                // Construir request para Gemini
                $requestData = [
                    'contents' => [
                        [
                            'parts' => [
                                [
                                    'text' => $this->buildPrompt($fullText),
                                ],
                            ],
                        ],
                    ],
                    'generationConfig' => [
                        'temperature' => $this->temperature,
                        'responseMimeType' => 'application/json',
                    ],
                ];

                Log::info('Llamando a Gemini API', ['attempt' => $attempt, 'max_retries' => $maxRetries]);

                // Llamar a Gemini API
                $response = Http::withOptions(['verify' => false])
                    ->timeout($this->timeout)
                    ->withHeaders([
                        'Content-Type' => 'application/json',
                    ])
                    ->post($this->geminiEndpoint.'?key='.$this->geminiApiKey, $requestData);

                // Verificar errores de Gemini (incluso en respuestas no exitosas)
                $geminiResponse = $response->json();

                if (isset($geminiResponse['error'])) {
                    $errorCode = $geminiResponse['error']['code'] ?? 'unknown';
                    $errorMessage = $geminiResponse['error']['message'] ?? 'Error desconocido';

                    // Detectar errores de sobrecarga (429, 503, o mensajes de "high demand")
                    $isOverloaded = $errorCode == 429 ||
                                    $errorCode == 503 ||
                                    str_contains(strtolower($errorMessage), 'high demand') ||
                                    str_contains(strtolower($errorMessage), 'overloaded') ||
                                    str_contains(strtolower($errorMessage), 'rate limit');

                    if ($isOverloaded && $attempt < $maxRetries) {
                        // Retry con exponential backoff
                        $delay = $baseDelay * pow(2, $attempt - 1); // 1s, 2s, 4s...
                        Log::warning('Gemini sobrecargado, reintentando en '.$delay.'s', [
                            'attempt' => $attempt,
                            'error_code' => $errorCode,
                            'error_message' => $errorMessage,
                        ]);
                        sleep($delay);

                        continue; // Retry
                    }

                    if ($isOverloaded) {
                        throw new Exception('El servicio de análisis está temporalmente saturado. Por favor intenta de nuevo en unos momentos.');
                    }

                    throw new Exception('Error de Gemini: '.$errorMessage);
                }

                // Verificar respuesta HTTP
                if (! $response->successful()) {
                    $statusCode = $response->status();

                    // Retry en errores de servidor (500, 503)
                    if (in_array($statusCode, [500, 503]) && $attempt < $maxRetries) {
                        $delay = $baseDelay * pow(2, $attempt - 1);
                        Log::warning('Error HTTP '.$statusCode.' de Gemini, reintentando en '.$delay.'s', [
                            'attempt' => $attempt,
                            'status' => $statusCode,
                        ]);
                        sleep($delay);

                        continue; // Retry
                    }

                    throw new Exception('Error al conectar con Gemini: '.$response->body());
                }

                // Extraer contenido JSON de la respuesta
                if (isset($geminiResponse['candidates'][0]['content']['parts'][0]['text'])) {
                    $jsonText = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];
                    $structuredData = json_decode($jsonText, true);

                    if (json_last_error() === JSON_ERROR_NONE && is_array($structuredData)) {
                        Log::info('Gemini procesó exitosamente', ['attempt' => $attempt]);

                        return $structuredData;
                    }
                }

                throw new Exception('No se pudo procesar la respuesta de Gemini');
            } catch (Exception $e) {
                // Si es el último intento o no es un error de sobrecarga, lanzar error
                if ($attempt >= $maxRetries || ! str_contains($e->getMessage(), 'saturado')) {
                    Log::error('Error structuring data with Gemini', [
                        'error' => $e->getMessage(),
                        'raw_data_count' => count($rawData),
                        'attempts' => $attempt,
                    ]);
                    throw $e;
                }
                // Si es error de sobrecarga y no es el último intento, continuar el loop
            }
        }

        // Fallback (no debería llegar aquí)
        throw new Exception('No se pudo procesar la constancia después de '.$maxRetries.' intentos');
    }

    /**
     * Parser directo del HTML del SAT sin IA.
     *
     * El HTML de siat.sat.gob.mx tiene estructura de tabla consistente:
     * filas con celda-etiqueta y celda-valor adyacentes.
     *
     * @param  string  $html  HTML completo de la constancia
     * @param  array  $rawData  Valores ya extraídos (fallback de texto plano)
     * @return array Datos estructurados con las mismas claves que usa Gemini
     */
    protected function structureDirectlyFromHTML(string $html, array $rawData): array
    {
        $dom = new DOMDocument;
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="UTF-8">'.$html);
        libxml_clear_errors();
        $xpath = new DOMXPath($dom);

        // Construir mapa etiqueta => valor a partir de pares de <td>
        $map = [];
        $rows = $xpath->query('//tr');
        foreach ($rows as $row) {
            $cells = $xpath->query('td', $row);
            if ($cells->length >= 2) {
                $label = mb_strtolower(trim(preg_replace('/[:\s]+$/', '', $cells->item(0)->nodeValue)));
                $value = trim($cells->item(1)->nodeValue);
                if ($label !== '' && $value !== '') {
                    $map[$label] = $value;
                }
            }
        }

        // Texto plano para búsquedas con regex
        $fullText = implode(' ', $rawData);

        // Helper: buscar valor en el mapa con varias claves posibles
        $get = function (array $keys) use ($map): string {
            foreach ($keys as $key) {
                foreach ($map as $label => $value) {
                    if (str_contains($label, $key)) {
                        return $value;
                    }
                }
            }

            return '';
        };

        // RFC — también intentar regex en texto plano
        $rfc = $get(['rfc']);
        if (empty($rfc)) {
            preg_match('/\b([A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3})\b/', $fullText, $m);
            $rfc = $m[1] ?? '';
        }

        // CURP
        $curp = $get(['curp']);
        if (empty($curp)) {
            preg_match('/\b([A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]{2})\b/', $fullText, $m);
            $curp = $m[1] ?? '';
        }

        // Persona: física si tiene CURP (13 chars RFC), moral si no
        $persona = '';
        if (! empty($curp)) {
            $persona = 'FISICA';
        } elseif (! empty($rfc)) {
            $persona = strlen($rfc) === 12 ? 'MORAL' : 'FISICA';
        }

        // Nombre y apellidos
        $nombreCompleto = $get(['nombre', 'denominaci', 'razón social', 'razon social']);
        $apellidoPat = $get(['apellido paterno', 'primer apellido']);
        $apellidoMat = $get(['apellido materno', 'segundo apellido']);
        $nombre = $get(['nombre(s)', 'nombres']);

        // Si solo hay nombre completo y es persona física, intentar separar
        if ($persona === 'FISICA' && ! empty($nombreCompleto) && empty($apellidoPat)) {
            $partes = preg_split('/\s+/', trim($nombreCompleto));
            if (count($partes) >= 3) {
                $apellidoPat = $partes[0];
                $apellidoMat = $partes[1];
                $nombre = implode(' ', array_slice($partes, 2));
            } elseif (count($partes) === 2) {
                $apellidoPat = $partes[0];
                $nombre = $partes[1];
            } else {
                $nombre = $nombreCompleto;
            }
        }

        // Fecha de nacimiento / constitución
        $fecha = $get(['fecha de nacimiento', 'fecha nacimiento', 'fecha de constitución', 'fecha constitucion']);
        if (! empty($fecha)) {
            // Normalizar a YYYY-MM-DD
            if (preg_match('/(\d{2})\/(\d{2})\/(\d{4})/', $fecha, $m)) {
                $fecha = "{$m[3]}-{$m[2]}-{$m[1]}";
            } elseif (preg_match('/(\d{4})-(\d{2})-(\d{2})/', $fecha, $m)) {
                $fecha = $m[0];
            }
        }

        // Régimen fiscal — buscar código numérico
        $regimenRaw = $get(['régimen', 'regimen']);
        preg_match('/\b(6\d{2})\b/', $regimenRaw ?: $fullText, $rm);
        $regimenCodigo = $rm[1] ?? '';

        // Domicilio fiscal
        $calle = $get(['vialidad', 'calle', 'tipo vialidad']);
        $noExt = $get(['número exterior', 'numero exterior', 'no. exterior', 'no exterior']);
        $noInt = $get(['número interior', 'numero interior', 'no. interior', 'no interior']);
        $colonia = $get(['colonia', 'asentamiento']);
        $municipio = $get(['municipio', 'delegación', 'delegacion', 'alcaldía']);
        $estado = $get(['entidad federativa', 'estado']);
        $cpRaw = $get(['código postal', 'codigo postal', 'cp']);
        $correo = $get(['correo electrónico', 'correo electronico', 'e-mail', 'email']);

        // Normalizar CP a 5 dígitos
        $cp = str_pad(preg_replace('/\D/', '', $cpRaw), 5, '0', STR_PAD_LEFT);
        if (strlen($cp) > 5) {
            $cp = substr($cp, -5);
        }

        // Género por CURP (posición 10: H/M)
        $genero = '';
        if (! empty($curp) && strlen($curp) >= 11) {
            $genero = strtoupper($curp[10]) === 'H' ? 'H' : 'M';
        }

        $result = [
            'Persona' => $persona,
            'genero' => $genero,
            'nombre' => $persona === 'MORAL' ? $nombreCompleto : $nombre,
            'apellidopat' => $persona === 'MORAL' ? '' : $apellidoPat,
            'apellidomat' => $persona === 'MORAL' ? '' : $apellidoMat,
            'rfc' => $rfc,
            'curp' => $curp,
            'dia' => $fecha,
            'correo' => $correo,
            'regimen_fiscal' => $regimenCodigo,
            'calle_fiscal' => $calle,
            'no_exterior_fiscal' => $noExt,
            'no_interior_fiscal' => $noInt,
            'colonia_fiscal' => $colonia,
            'cp_fiscal' => $cp,
            'municipio_fiscal' => $municipio,
            'estado_fiscal' => $estado,
            'pais_fiscal' => 'MEXICO',
        ];

        Log::info('SAT parseado directamente (sin Gemini)', [
            'rfc' => $rfc,
            'curp' => $curp,
            'campos' => count(array_filter($result)),
        ]);

        return $result;
    }

    /**
     * Construir prompt para Gemini
     *
     * Prompt copiado exactamente del sistema PHP original.
     *
     * @param  string  $fullText  Texto completo extraído del HTML
     * @return string Prompt formateado
     */
    protected function buildPrompt(string $fullText): string
    {
        return <<<PROMPT
Extrae y estructura los siguientes datos de una constancia fiscal del SAT en formato JSON con estas claves exactas (todas en minúsculas):

- Persona: 'FISICA' o 'MORAL' (según si tiene CURP o no)
- genero: 'H' o 'M' (solo si es persona física, H=Hombre, M=Mujer según notación CURP)
- nombre: nombre completo (en personas morales) o nombre de pila (en personas físicas)
- apellidopat: apellido paterno (solo personas físicas, vacío en morales)
- apellidomat: apellido materno (solo personas físicas, vacío en morales)
- rfc: RFC completo
- curp: CURP (solo personas físicas, vacío en morales)
- dia: fecha de nacimiento o constitución en formato YYYY-MM-DD
- correo: correo electrónico
- regimen_fiscal: código del régimen (solo el número, ej: '612')
- calle_fiscal: nombre de la vialidad/calle (incluye tipo como 'CALLE', 'AVENIDA', etc)
- no_exterior_fiscal: número exterior
- no_interior_fiscal: número interior (vacío si no existe)
- colonia_fiscal: colonia
- cp_fiscal: código postal como string de exactamente 5 dígitos con ceros iniciales si aplica (ej: "01000", "06600")
- municipio_fiscal: municipio o delegación
- estado_fiscal: estado
- pais_fiscal: país (generalmente 'MEXICO')

IMPORTANTE:
- Si es persona moral, los apellidos van vacíos
- El régimen fiscal solo el código numérico
- La fecha en formato YYYY-MM-DD
- cp_fiscal SIEMPRE como string de 5 dígitos, con ceros a la izquierda si es necesario (NUNCA como entero)
- Si un dato no existe, usar cadena vacía ""

Datos a procesar: {$fullText}
PROMPT;
    }
}
