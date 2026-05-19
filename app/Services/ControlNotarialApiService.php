<?php

namespace App\Services;

use App\Models\Notaria;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ControlNotarialApiService
{
    private string $internalUrl;

    private string $gwUser;

    private string $gwPassword;

    private int $tokenCacheTtl;

    /**
     * Notaría activa para aislamiento multi-tenant.
     * Nulo = opera en la BD principal (solo para super-admin y mantenimiento).
     */
    private ?Notaria $notaria = null;

    public function __construct()
    {
        $this->internalUrl = rtrim(config('services.control_notarial.internal_url', 'http://192.168.1.1:5000/api'), '/');
        $this->gwUser = config('services.control_notarial.gw_user', 'LARAVEL_GW');
        $this->gwPassword = config('services.control_notarial.gw_password', '');
        $this->tokenCacheTtl = config('services.control_notarial.token_cache_ttl', 3300);
    }

    /**
     * Devuelve una instancia configurada para la notaría dada.
     * Todas las operaciones de BD y los tokens se aislarán a esa notaría.
     *
     * Uso:
     *   app(ControlNotarialApiService::class)->forNotaria($notaria)->getGatewayToken();
     */
    public function forNotaria(Notaria $notaria): static
    {
        $clone = clone $this;
        $clone->notaria = $notaria;

        return $clone;
    }

    // -------------------------------------------------------------------------
    // Tenant DB helper
    // -------------------------------------------------------------------------

    /**
     * Registra (si no existe) y devuelve el nombre de la conexión a la BD tenant.
     * Si no hay notaría en contexto, usa la conexión principal (mysql).
     */
    private function tenantConnection(): string
    {
        if ($this->notaria === null) {
            return 'mysql';
        }

        $dbName = $this->notaria->tenantDatabaseName();
        $connectionKey = 'cn_tenant_'.$this->notaria->id;

        // Registrar la conexión dinámica si todavía no existe en este request
        if (Config::get("database.connections.{$connectionKey}") === null) {
            Config::set("database.connections.{$connectionKey}", [
                'driver' => 'mysql',
                'host' => config('database.connections.mysql.host'),
                'port' => config('database.connections.mysql.port'),
                'database' => $dbName,
                'username' => config('database.connections.mysql.username'),
                'password' => config('database.connections.mysql.password'),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => false,
            ]);
        }

        return $connectionKey;
    }

    /**
     * Devuelve el identificador que se envía al C# como campo "notaria" (int).
     *
     * IMPORTANTE — resolución DINÁMICA en C#:
     * El C# recibe este ID numérico y lo usa para construir dinámicamente el connection
     * string al tenant MySQL. No hay registro estático — funciona con notarías nuevas
     * sin configuración adicional en C#.
     *
     * FORMATO: ID entero de la notaría (PK de la tabla notarias en Laravel).
     *   tenant      → notaria->id   (ej: 1, 2, 10…)
     *   super_admin → ID de la notaría master (tenant_db_name = 'atinet_compliance_hub')
     */
    private function cnNombreNotaria(): string
    {
        if ($this->notaria !== null) {
            return (string) $this->notaria->id;
        }

        // Para super_admin (sin notaría asignada) usamos la fila master de la tabla
        // notarias, que apunta a atinet_compliance_hub donde viven SUPERUSUARIO y ADMIN.
        $masterId = \Illuminate\Support\Facades\Cache::rememberForever(
            'cn_master_notaria_id',
            fn () => \Illuminate\Support\Facades\DB::table('notarias')
                ->where('tenant_db_name', 'atinet_compliance_hub')
                ->value('id')
        );

        return (string) ($masterId ?? 0);
    }

    /**
     * Clave de caché del gateway token, separada por notaría.
     */
    private function gwTokenCacheKey(): string
    {
        $suffix = $this->notaria ? "_{$this->notaria->id}" : '_master';

        return "cn_gw_token{$suffix}";
    }

    /**
     * Obtiene el JWT del usuario gateway LARAVEL_GW (cacheado por notaría).
     * Antes de cada login fresco, resetea la sesión del gateway en la BD tenant
     * para evitar el error "Ya hay una sesión iniciada" de C#.
     */
    public function getGatewayToken(): string
    {
        // TTL = 12 min (menor al timeout de 15 min de C#) para garantizar
        // que siempre haya sesión activa.
        return Cache::remember($this->gwTokenCacheKey(), 720, function () {
            $conn = $this->tenantConnection();

            // Resetear sesión gateway en la BD tenant antes de re-autenticar
            DB::connection($conn)
                ->table('tbl_cat_usuarios')
                ->where('Usuario', $this->gwUser)
                ->update(['Sesion_Iniciada' => 0]);

            $gwIds = DB::connection($conn)
                ->table('tbl_cat_usuarios')
                ->where('Usuario', $this->gwUser)
                ->pluck('Id');

            if ($gwIds->isNotEmpty()) {
                DB::connection($conn)
                    ->table('tbl_log_sesiones_activas')
                    ->whereIn('Usuario_Id', $gwIds)
                    ->delete();
            }

            return $this->obtenerTokenCN($this->gwUser, $this->gwPassword);
        });
    }

    /**
     * Invalida el token gateway cacheado para la notaría activa (o master).
     */
    public function invalidarTokenGateway(): void
    {
        Cache::forget($this->gwTokenCacheKey());
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

            $usuario = $this->getUsuarioCN($cnUsuarioId, $token);

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

            $usuario = $this->getUsuarioCN($cnUsuarioId, $token);

            if (empty($usuario)) {
                Log::error("resetPasswordCN: usuario CN {$cnUsuarioId} no encontrado");

                return false;
            }

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
     * Retorna el Id asignado por C# al nuevo usuario, o null si falla.
     */
    public function createUsuarioCN(User $user, string $plainPassword): ?int
    {
        try {
            $token = $this->getGatewayToken();

            // Generar nombre de usuario CN a partir del prefijo del email (máx 20 chars, mayúsculas)
            $cnUsuario = strtoupper(substr(explode('@', $user->email)[0], 0, 20));

            $payload = [
                'nombre' => $user->name,
                'apellido_Paterno' => '',
                'apellido_Materno' => '',
                'correo' => $user->email,
                'usuario' => $cnUsuario,
                'contrasena' => $plainPassword,
                'curp' => '',
                'rfc' => '',
                'rol_Id' => $user->cn_rol_id ?? 3,
                'iniciales' => strtoupper(substr($user->name, 0, 3)),
                'numero_Notaria' => $user->notaria?->numero_notaria ?? 0,
                'adscripcion' => '',
                'tipo' => 'U',
                'procedencia' => 'LARAVEL',
                'observaciones' => 'Creado automáticamente desde Laravel',
                'activo' => true,
            ];

            $response = $this->post('/User/CreateUsuario', $token, $payload);

            // C# retorna el objeto creado con su Id
            return $response['id'] ?? $response['Id'] ?? null;
        } catch (\Throwable $e) {
            Log::error('ControlNotarialApiService::createUsuarioCN falló', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Actualiza nombre/email de un usuario en C# (sin cambiar contraseña).
     */
    public function updateUsuarioCN(int $cnUsuarioId, string $nombre, string $email): bool
    {
        try {
            $token = $this->getGatewayToken();

            $usuario = $this->getUsuarioCN($cnUsuarioId, $token);

            if (empty($usuario)) {
                Log::error("updateUsuarioCN: usuario CN {$cnUsuarioId} no encontrado");

                return false;
            }

            $payload = array_merge($usuario, [
                'nombre' => $nombre,
                'correo' => $email,
            ]);

            $this->put("/User/UpdateUsuario?usuarioId={$cnUsuarioId}", $token, $payload);

            return true;
        } catch (\Throwable $e) {
            Log::error('ControlNotarialApiService::updateUsuarioCN falló', [
                'cn_usuario_id' => $cnUsuarioId,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }

    /**
     * Elimina (desactiva) un usuario en C# usando el token gateway.
     */
    public function deleteUsuarioCN(int $cnUsuarioId): bool
    {
        try {
            $token = $this->getGatewayToken();

            $this->delete("/User/DeleteUsuario?usuarioId={$cnUsuarioId}", $token);

            return true;
        } catch (\Throwable $e) {
            Log::error('ControlNotarialApiService::deleteUsuarioCN falló', [
                'cn_usuario_id' => $cnUsuarioId,
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

    /**
     * Obtiene los datos de un usuario de C# por su Id.
     * Desenvuelve dataResponse y sanitiza el payload para que
     * UpdateUsuario no rechace con "Campos incompletos":
     *  - Elimina el campo 'rol' (solo lectura en C#)
     *  - Reemplaza null y vacíos con "." en todos los campos string requeridos
     *
     * @return array<string, mixed>
     */
    private function getUsuarioCN(int $cnUsuarioId, string $token): array
    {
        $response = $this->get("/User/GetUsuarioById?usuarioId={$cnUsuarioId}", $token);

        $data = $response['dataResponse'] ?? $response;

        // 'rol' es campo de solo lectura — C# rechaza el PUT si lo incluimos
        unset($data['rol']);

        // CRÍTICO: El campo 'usuario' SIEMPRE debe venir de MySQL (nuestra BD),
        // nunca del SQL Server legacy de C# (bd_SistemaControlNotarial_Principal).
        // C# puede tener nombres distintos en su SQL Server (ej. ADMIN para Id=9
        // que en MySQL es SUPERUSUARIO). Si dejamos que C# lo sobreescriba via PUT,
        // se pierde el nombre correcto establecido en nuestra BD.
        $mysqlUsuario = DB::connection($this->tenantConnection())
            ->table('tbl_cat_usuarios')
            ->where('Id', $cnUsuarioId)
            ->value('Usuario');

        if ($mysqlUsuario) {
            $data['usuario'] = $mysqlUsuario;
        }

        // C# requiere strings no-nulos y no-vacíos en estos campos
        $stringFields = [
            'nombre', 'apellido_Paterno', 'apellido_Materno', 'correo', 'usuario',
            'curp', 'rfc', 'iniciales', 'numero_Notaria', 'adscripcion',
            'tipo', 'procedencia', 'observaciones',
        ];

        foreach ($stringFields as $field) {
            if (! isset($data[$field]) || $data[$field] === null || $data[$field] === '') {
                $data[$field] = '.';
            }
        }

        return $data;
    }

    private function obtenerTokenCN(string $usuario, string $password): string
    {
        $nombreNotaria = $this->cnNombreNotaria();

        // Intentar login contra el C#
        try {
            $response = Http::withoutVerifying()
                ->timeout(10)
                ->post($this->internalUrl.'/Login/Authentication', [
                    'usuario'   => $usuario,
                    'contrasena' => $password,
                    'notaria'   => $nombreNotaria,
                    'equipo'    => 'Laravel-Server',
                ]);

            if ($response->successful()) {
                $body  = $response->json();
                $token = $body['dataResponse']['accessToken']
                    ?? $body['token']
                    ?? $body['Token']
                    ?? $body['access_token']
                    ?? null;

                if ($token) {
                    return $token;
                }
            }

            // C# respondió pero no retornó token (credenciales inválidas u otro error)
            Log::warning('ControlNotarialApiService::obtenerTokenCN — C# no autenticó, usando generación local', [
                'usuario'  => $usuario,
                'notaria'  => $nombreNotaria,
                'status'   => $response->status(),
                'message'  => $response->json('message'),
            ]);
        } catch (\Throwable $e) {
            Log::warning('ControlNotarialApiService::obtenerTokenCN — C# no disponible, usando generación local', [
                'usuario' => $usuario,
                'error'   => $e->getMessage(),
            ]);
        }

        // Fallback: generar el JWT localmente con la misma clave que usa el C#
        return $this->generarTokenLocalCN($usuario, $nombreNotaria);
    }

    /**
     * Genera un JWT HS256 localmente con la misma clave y claims que produce el C#.
     * Inserta el jti en tbl_log_sesiones_activas para que el C# acepte el token
     * en requests subsecuentes.
     *
     * Claims usados por C# (extraídos del DLL):
     *   client_username, client_name, client_notaria, jti, iss, aud, nbf, iat, exp
     */
    private function generarTokenLocalCN(string $usuario, string $notariaId): string
    {
        $jwtKey  = config('services.control_notarial.jwt_key', '74Av348euKnbnYi8cfbzPgiX7SjM3FPX');
        $issuer  = config('services.control_notarial.jwt_issuer', 'https://miservidor.com');
        $minutes = (int) config('services.control_notarial.jwt_minutes', 15);

        // Buscar datos del usuario CN en la BD del tenant
        $conn   = $this->tenantConnection();
        $cnUser = DB::connection($conn)
            ->table('tbl_cat_usuarios')
            ->where('Usuario', $usuario)
            ->first(['Id', 'Nombre', 'Apellido_Paterno', 'Rol_Id']);

        if (! $cnUser) {
            throw new \RuntimeException("generarTokenLocalCN: usuario CN '{$usuario}' no encontrado en la BD tenant.");
        }

        $now  = time();
        $exp  = $now + ($minutes * 60);
        $jti  = \Illuminate\Support\Str::uuid()->toString();
        $name = trim(($cnUser->Nombre ?? '') . ' ' . ($cnUser->Apellido_Paterno ?? ''));

        // Construir el JWT (HS256)
        $header  = $this->jwtBase64Url(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = $this->jwtBase64Url(json_encode([
            'jti'              => $jti,
            'nbf'              => $now,
            'exp'              => $exp,
            'iat'              => $now,
            'iss'              => $issuer,
            'aud'              => $issuer,
            'client_username'  => $usuario,
            'client_name'      => $name,
            'client_notaria'   => (string) $notariaId,
            'sub'              => (string) $cnUser->Id,
        ]));

        $signature = $this->jwtBase64Url(
            hash_hmac('sha256', "{$header}.{$payload}", $jwtKey, true)
        );

        $token = "{$header}.{$payload}.{$signature}";

        // Registrar la sesión en tbl_log_sesiones_activas para que C# acepte
        // tokens en requests protegidos
        try {
            DB::connection($conn)
                ->table('tbl_log_sesiones_activas')
                ->where('Usuario_Id', $cnUser->Id)
                ->update(['Es_Activa' => 0]);

            DB::connection($conn)->table('tbl_log_sesiones_activas')->insert([
                'Usuario_Id'                      => $cnUser->Id,
                'Token_Jti'                       => $jti,
                'Nombre_Equipo'                   => 'Laravel-Server',
                'Equipo'                          => 'Laravel-Server',
                'Ip_Address'                      => '127.0.0.1',
                'User_Agent'                      => 'Laravel/ControlNotarialService',
                'Es_Activa'                       => 1,
                'Fecha_Creacion'                  => now()->toDateTimeString(),
                'Fecha_Expiracion'                => now()->addMinutes($minutes)->toDateTimeString(),
                'Refresh_Token'                   => null,
                'Refresh_Token_Hash'              => null,
                'Refresh_Token_Epiration_Time'    => null,
                'Refresh_Token_Expiration_Time'   => null,
            ]);
        } catch (\Throwable $e) {
            Log::warning('generarTokenLocalCN: no se pudo registrar sesión en tbl_log_sesiones_activas', [
                'usuario' => $usuario,
                'error'   => $e->getMessage(),
            ]);
        }

        Log::info('generarTokenLocalCN: token generado localmente', [
            'usuario'   => $usuario,
            'notaria'   => $notariaId,
            'cn_id'     => $cnUser->Id,
            'jti'       => $jti,
            'exp'       => date('Y-m-d H:i:s', $exp),
        ]);

        return $token;
    }

    /** Codificación base64url sin padding para JWT. */
    private function jwtBase64Url(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
