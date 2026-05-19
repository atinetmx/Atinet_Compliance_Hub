<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Proxy transparente hacia la API C# de Control Notarial.
 *
 * El browser NO puede resolver srvatinet.atinet.com.mx directamente.
 * El frontend llama a /cn-api/{path} → Laravel recibe, reenvía a C# server-to-server
 * con el token JWT del request, y regresa la respuesta al browser.
 *
 * Rutas afectadas: GET|POST|PUT|DELETE /cn-api/{path}
 */
class CnProxyController extends Controller
{
    /**
     * Reenvía cualquier request al endpoint equivalente en la API C# de Control Notarial.
     */
    public function proxy(Request $request, string $path): JsonResponse|Response
    {
        $cnBaseUrl = rtrim(config('api.base_url'), '/');
        $targetUrl = "{$cnBaseUrl}/{$path}";

        // Pasar query string original
        $queryString = $request->getQueryString();
        if ($queryString) {
            $targetUrl .= "?{$queryString}";
        }

        // Construir headers a reenviar (incluye Authorization con JWT de C#)
        $headers = [
            'Accept' => 'application/json',
            'Content-Type' => $request->header('Content-Type', 'application/json'),
        ];

        if ($request->hasHeader('Authorization')) {
            $headers['Authorization'] = $request->header('Authorization');
        }

        // Determinar el tenant a partir del usuario Laravel autenticado.
        // El JWT de C# siempre devuelve 'NOTARIA' (master); el routing multitenant
        // se resuelve con el notaria_id del usuario en sesión, no con el JWT claim.
        $notaria = Auth::user()?->notaria;
        if ($notaria) {
            $headers['X-Cn-Tenant'] = $notaria->cnIdentifier();
            $headers['X-Cn-Database'] = $notaria->tenantDatabaseName();
            $headers['tenantDb'] = $notaria->tenantDatabaseName();
        }

        try {
            $httpClient = Http::withHeaders($headers)
                ->withoutVerifying()  // Necesario para certificados autofirmados en dev
                ->timeout(30);

            $method = strtolower($request->method());
            $body = $request->getContent();
            $isJson = str_contains($request->header('Content-Type', ''), 'application/json');

            $response = match ($method) {
                'get' => $httpClient->get($targetUrl),
                'post' => $isJson
                    ? $httpClient->withBody($body, 'application/json')->post($targetUrl)
                    : $httpClient->post($targetUrl, $request->all()),
                'put' => $isJson
                    ? $httpClient->withBody($body, 'application/json')->put($targetUrl)
                    : $httpClient->put($targetUrl, $request->all()),
                'patch' => $isJson
                    ? $httpClient->withBody($body, 'application/json')->patch($targetUrl)
                    : $httpClient->patch($targetUrl, $request->all()),
                'delete' => $httpClient->delete($targetUrl),
                default => $httpClient->get($targetUrl),
            };

            // Loguear respuestas de error de C# para diagnóstico
            if ($response->status() >= 400) {
                Log::warning('CnProxy respuesta de error desde C#', [
                    'url' => $targetUrl,
                    'method' => strtoupper($method),
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }

            return response($response->body(), $response->status())
                ->header('Content-Type', $response->header('Content-Type') ?? 'application/json');

        } catch (\Throwable $e) {
            Log::error('CnProxy error', [
                'url' => $targetUrl,
                'method' => $method ?? $request->method(),
                'message' => $e->getMessage(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'No se pudo conectar con el servicio de Control Notarial.',
                'endpoint' => $path,
            ], 503);
        }
    }
}
