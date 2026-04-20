<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ControlNotarialApiService
{
    private string $internalUrl;

    private string $gwUser;

    private string $gwPassword;

    private int $tokenCacheTtl;

    public function __construct()
    {
        $this->internalUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');
        $this->gwUser = config('services.control_notarial.gw_user', 'LARAVEL_GW');
        $this->gwPassword = config('services.control_notarial.gw_password', '');
        $this->tokenCacheTtl = config('services.control_notarial.token_cache_ttl', 3300);
    }

    /**
     * Obtiene el JWT del usuario gateway LARAVEL_GW (cacheado).
     */
    public function getGatewayToken(): string
    {
        return Cache::remember('cn_gw_token', $this->tokenCacheTtl, function () {
            return $this->obtenerTokenCN($this->gwUser, $this->gwPassword);
        });
    }

    /**
     * Invalida el token gateway cacheado (útil al rotar contraseña).
     */
    public function invalidarTokenGateway(): void
    {
        Cache::forget('cn_gw_token');
    }

    /**
     * Hace login en C# con las credenciales dadas y retorna el JWT, o null si falla.
     */
    public function loginUser(string $usuario, string $password): ?string
    {
        try {
            return $this->obtenerTokenCN($usuario, $password);
        } catch (\Throwable $e) {
            Log::error('ControlNotarialApiService::loginUser falló', [
                'usuario' => $usuario,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Fuerza el cierre de sesión de un usuario en C# actualizando Sesion_Iniciada = 0
     * vía la API (usando el token gateway).
     * Se llama antes de autoLogin para evitar el error "Ya hay una sesion iniciada".
     */
    public function resetSesionCN(int $cnUsuarioId): bool
    {
        try {
            $token = $this->getGatewayToken();

            $usuario = $this->get("/User/GetUsuarioById?usuarioId={$cnUsuarioId}", $token);

            if (empty($usuario)) {
                return false;
            }

            $payload = array_merge($usuario, ['sesion_Iniciada' => 0]);

            $this->put("/User/UpdateUsuario?usuarioId={$cnUsuarioId}", $token, $payload);

            return true;
        } catch (\Throwable $e) {
            Log::error('ControlNotarialApiService::resetSesionCN falló', [
                'cn_usuario_id' => $cnUsuarioId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Cambia la contraseña de un usuario en C# (usando el token gateway).
     * Obtiene primero los datos actuales del usuario para no perder ningún campo.
     * Retorna true si el cambio fue exitoso.
     */
    public function resetPasswordCN(int $cnUsuarioId, string $newPassword): bool
    {
        try {
            $token = $this->getGatewayToken();

            // 1. Obtener datos actuales del usuario en CN
            $usuario = $this->get("/User/GetUsuarioById?usuarioId={$cnUsuarioId}", $token);

            if (empty($usuario)) {
                Log::error("resetPasswordCN: usuario CN {$cnUsuarioId} no encontrado");

                return false;
            }

            // 2. Actualizar solo la contraseña, conservando el resto de los datos
            $payload = array_merge($usuario, ['contrasena' => $newPassword]);

            $this->put("/User/UpdateUsuario?usuarioId={$cnUsuarioId}", $token, $payload);

            return true;
        } catch (\Throwable $e) {
            Log::error('ControlNotarialApiService::resetPasswordCN falló', [
                'cn_usuario_id' => $cnUsuarioId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Crea un usuario en C# usando el token gateway.
     * Retorna true si fue creado exitosamente.
     */
    public function createUsuarioCN(User $user, string $plainPassword): bool
    {
        try {
            $token = $this->getGatewayToken();

            $payload = [
                'nombre' => $user->name,
                'apellido_Paterno' => '',
                'apellido_Materno' => '',
                'correo' => $user->email,
                'usuario' => $user->cn_usuario ?? $user->email,
                'contrasena' => $plainPassword,
                'curp' => '',
                'rfc' => '',
                'rol_Id' => $user->cn_rol_id ?? 3,
                'iniciales' => strtoupper(substr($user->name, 0, 3)),
                'numero_Notaria' => $user->notaria?->numero ?? 0,
                'adscripcion' => '',
                'tipo' => 'U',
                'procedencia' => 'LARAVEL',
                'observaciones' => 'Creado automáticamente desde Laravel',
                'activo' => true,
            ];

            $response = $this->post('/User/CreateUsuario', $token, $payload);

            return isset($response['id']) || isset($response['success']) || isset($response['Id']);
        } catch (\Throwable $e) {
            Log::error('ControlNotarialApiService::createUsuarioCN falló', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    // ----------------------------------------------------------------
    // Métodos HTTP genéricos
    // ----------------------------------------------------------------

    /** @param array<string, mixed> $params */
    public function get(string $endpoint, string $token, array $params = []): array
    {
        $response = Http::withToken($token)
            ->withoutVerifying()
            ->timeout(15)
            ->get($this->internalUrl.$endpoint, $params);

        $response->throw();

        return $response->json() ?? [];
    }

    /** @param array<string, mixed> $data */
    public function post(string $endpoint, string $token, array $data = []): array
    {
        $response = Http::withToken($token)
            ->withoutVerifying()
            ->timeout(15)
            ->post($this->internalUrl.$endpoint, $data);

        $response->throw();

        return $response->json() ?? [];
    }

    /** @param array<string, mixed> $data */
    public function put(string $endpoint, string $token, array $data = []): array
    {
        $response = Http::withToken($token)
            ->withoutVerifying()
            ->timeout(15)
            ->put($this->internalUrl.$endpoint, $data);

        $response->throw();

        return $response->json() ?? [];
    }

    public function delete(string $endpoint, string $token): array
    {
        $response = Http::withToken($token)
            ->withoutVerifying()
            ->timeout(15)
            ->delete($this->internalUrl.$endpoint);

        $response->throw();

        return $response->json() ?? [];
    }

    // ----------------------------------------------------------------
    // Helpers internos
    // ----------------------------------------------------------------

    private function obtenerTokenCN(string $usuario, string $password): string
    {
        $response = Http::withoutVerifying()
            ->timeout(15)
            ->post($this->internalUrl.'/Login/Authentication', [
                'usuario' => $usuario,
                'contrasena' => $password,
                'nombre_Notaria' => 'NOTARIA',
                'equipo' => 'Laravel-Server',
            ]);

        $response->throw();

        $body = $response->json();

        $token = $body['token'] ?? $body['Token'] ?? $body['access_token'] ?? null;

        if (! $token) {
            throw new \RuntimeException('C# no retornó token JWT. Respuesta: '.json_encode($body));
        }

        return $token;
    }
}
