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
        $this->geminiApiKey = config('services.gemini.api_key', '');
        $this->geminiEndpoint = config('services.gemini.endpoint', 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent');
        $this->temperature = config('services.gemini.temperature', 0.1);
        $this->timeout = config('services.gemini.timeout', 60);

        // Solo validar API key si no estamos en modo testing con mocks
        if (empty($this->geminiApiKey) && ! app()->environment('testing')) {
            throw new Exception('Gemini API key not configured');
        }
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

        // Paso 1: Extraer datos crudos del HTML del SAT
        $html = $this->fetchSATHTML($qrUrl);
        $rawData = $this->extractDataFromHTML($html);

        if (empty($rawData)) {
            throw new Exception('No se encontraron datos en la constancia fiscal');
        }

        // Paso 2: Procesar con Gemini para estructurar
        $structuredData = $this->structureWithGemini($rawData);

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
            $response = Http::withOptions([
                'verify' => true,
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

            // Llamar a Gemini API
            $response = Http::timeout($this->timeout)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                ])
                ->post($this->geminiEndpoint.'?key='.$this->geminiApiKey, $requestData);

            // Verificar errores de Gemini (incluso en respuestas no exitosas)
            $geminiResponse = $response->json();

            if (isset($geminiResponse['error'])) {
                $errorCode = $geminiResponse['error']['code'] ?? 'unknown';
                $errorMessage = $geminiResponse['error']['message'] ?? 'Error desconocido';

                if ($errorCode == 429) {
                    throw new Exception('Límite de uso de Gemini alcanzado. Intente más tarde.');
                }
                throw new Exception('Error de Gemini: '.$errorMessage);
            }

            if (! $response->successful()) {
                throw new Exception('Error al conectar con Gemini: '.$response->body());
            }

            // Extraer contenido JSON de la respuesta
            if (isset($geminiResponse['candidates'][0]['content']['parts'][0]['text'])) {
                $jsonText = $geminiResponse['candidates'][0]['content']['parts'][0]['text'];
                $structuredData = json_decode($jsonText, true);

                if (json_last_error() === JSON_ERROR_NONE && is_array($structuredData)) {
                    return $structuredData;
                }
            }

            throw new Exception('No se pudo procesar la respuesta de Gemini');
        } catch (Exception $e) {
            Log::error('Error structuring data with Gemini', [
                'error' => $e->getMessage(),
                'raw_data_count' => count($rawData),
            ]);
            throw $e;
        }
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
- genero: 'HOMBRE' o 'MUJER' (solo si es persona física)
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
- cp_fiscal: código postal (como número)
- municipio_fiscal: municipio o delegación
- estado_fiscal: estado
- pais_fiscal: país (generalmente 'MEXICO')

IMPORTANTE:
- Si es persona moral, los apellidos van vacíos
- El régimen fiscal solo el código numérico
- La fecha en formato YYYY-MM-DD
- CP como número entero
- Si un dato no existe, usar cadena vacía "" o 0 para números

Datos a procesar: {$fullText}
PROMPT;
    }
}
