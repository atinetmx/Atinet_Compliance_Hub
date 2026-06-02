<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Servicio para la API de PrevencionDeLavado.com (MBA Systems).
 *
 * Flujo de autenticación:
 *   POST /Login → JWT cacheado 55 minutos en 'pld_api_token'.
 *
 * Flujo de búsqueda:
 *   POST /listas con Bearer JWT → resultados de personas PEP.
 *
 * Los booleanos del frontend ('pepsOtrosPaises', etc.) se convierten a 'S'/'N'
 * tal como exige la API.
 */
class PrevencionDeLavadoService
{
    private string $baseUrl;

    private string $usuario;

    private string $clave;

    private int $timeout;

    public function __construct()
    {
        $this->baseUrl = rtrim(config('services.prevencion_lavado.url') ?? 'https://mbalistas.prevenciondelavado.com', '/');
        $this->usuario = config('services.prevencion_lavado.user') ?? '';
        $this->clave = config('services.prevencion_lavado.password') ?? '';
        $this->timeout = config('services.prevencion_lavado.timeout') ?? 30;
    }

    /**
     * Obtiene el JWT de autenticación, cacheado 55 minutos.
     *
     * Retorna null si el login falla (credenciales incorrectas o API caída).
     */
    public function getToken(): ?string
    {
        return Cache::remember('pld_api_token', 3300, function (): ?string {
            try {
                $response = Http::withOptions([
                    'verify' => app()->environment('production'),
                ])
                    ->timeout($this->timeout)
                    ->post($this->baseUrl.'/Login', [
                        'usuario' => $this->usuario,
                        'clave' => $this->clave,
                    ]);

                if ($response->successful()) {
                    $token = $response->json('token');

                    if (is_string($token) && $token !== '') {
                        return $token;
                    }

                    Log::error('PrevencionDeLavado: login exitoso pero token vacío o inválido', [
                        'response' => $response->json(),
                    ]);

                    return null;
                }

                Log::error('PrevencionDeLavado: login fallido', [
                    'status' => $response->status(),
                    'response' => $response->json(),
                ]);

                return null;

            } catch (\Exception $e) {
                Log::error('PrevencionDeLavado: excepción en login', [
                    'message' => $e->getMessage(),
                ]);

                return null;
            }
        });
    }

    /**
     * Realiza una búsqueda en las listas PEP.
     *
     * @param  array<string, mixed>  $parametros  Campos: apellido_denominacion, nombres?,
     *                                            identificacion?, pepsOtrosPaises?, satXDenominacion?,
     *                                            documentosSimilares?, forzarApellidos?, generarCertificados?
     * @return array{success: bool, data?: array<string, mixed>, message?: string, http_status?: int}
     */
    public function buscarEnListas(array $parametros): array
    {
        $token = $this->getToken();

        if ($token === null) {
            return [
                'success' => false,
                'message' => 'No se pudo autenticar con el servicio externo de listas PEP.',
            ];
        }

        $payload = [
            'apellido' => $parametros['apellido_denominacion'] ?? '',
            'nombre' => $parametros['nombres'] ?? '',
            'identificacion' => $parametros['identificacion'] ?? '',
            'pepsOtrosPaises' => ($parametros['pepsOtrosPaises'] ?? false) ? 'S' : 'N',
            'satXDenominacion' => ($parametros['satXDenominacion'] ?? false) ? 'S' : 'N',
            'documentosSimilares' => ($parametros['documentosSimilares'] ?? false) ? 'S' : 'N',
            'forzarApellidos' => ($parametros['forzarApellidos'] ?? false) ? 'S' : 'N',
            'generarCertificados' => ($parametros['generarCertificados'] ?? true) ? 'S' : 'N',
        ];

        try {
            $response = Http::withOptions([
                'verify' => app()->environment('production'),
            ])
                ->withHeaders([
                    'Authorization' => "Bearer {$token}",
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->timeout($this->timeout)
                ->post($this->baseUrl.'/listas', $payload);

            if ($response->successful()) {
                $json = $response->json();

                return [
                    'success' => true,
                    'data' => [
                        'codigo_certificado' => $json['codigoCertificadoBusqueda'] ?? null,
                        'fecha_consulta' => $json['fechaConsulta'] ?? now()->toISOString(),
                        'resultados' => $json['resultados'] ?? [],
                    ],
                ];
            }

            // Token expirado → limpiar caché para forzar re-login en la próxima llamada
            if ($response->status() === 401) {
                Cache::forget('pld_api_token');
            }

            Log::warning('PrevencionDeLavado: búsqueda fallida', [
                'status' => $response->status(),
                'response' => $response->json(),
                'payload' => $payload,
            ]);

            return [
                'success' => false,
                'http_status' => $response->status(),
                'message' => 'Error al consultar el servicio externo de listas PEP.',
            ];

        } catch (\Exception $e) {
            Log::error('PrevencionDeLavado: excepción en búsqueda', [
                'message' => $e->getMessage(),
                'payload' => $payload,
            ]);

            return [
                'success' => false,
                'message' => 'Error de conexión con el servicio externo de listas PEP.',
            ];
        }
    }

    /**
     * Obtiene el consumo actual del plan contratado (GET /Listas/Consumos).
     *
     * Retorna un array con los campos del primer período activo:
     *   periodo, plan, consultasDisponibles, consultasContratadas, importante, tipoPlan
     *
     * @return array{success: bool, data?: array<string, mixed>, message?: string}
     */
    public function getConsumos(): array
    {
        $token = $this->getToken();

        if ($token === null) {
            return [
                'success' => false,
                'message' => 'No se pudo autenticar con el servicio externo de listas PEP.',
            ];
        }

        try {
            $response = Http::withOptions([
                'verify' => app()->environment('production'),
            ])
                ->withToken($token)
                ->timeout($this->timeout)
                ->get($this->baseUrl.'/Listas/Consumos');

            if ($response->successful()) {
                $resultados = $response->json('resultados') ?? [];

                return [
                    'success' => true,
                    'data' => [
                        'resultados' => $resultados,
                        'resumen' => count($resultados) > 0 ? $resultados[0] : null,
                    ],
                ];
            }

            if ($response->status() === 401) {
                Cache::forget('pld_api_token');
            }

            Log::warning('PrevencionDeLavado: error al obtener consumos', [
                'status' => $response->status(),
            ]);

            return [
                'success' => false,
                'message' => 'Error al obtener datos de consumo del plan.',
            ];

        } catch (\Exception $e) {
            Log::error('PrevencionDeLavado: excepción en getConsumos', [
                'message' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'message' => 'Error de conexión al obtener consumos.',
            ];
        }
    }

    /**
     * Fuerza la invalidación del token cacheado.
     * Útil cuando se detecta un 401 o se cambian las credenciales.
     */
    public function invalidarToken(): void
    {
        Cache::forget('pld_api_token');
    }
}
