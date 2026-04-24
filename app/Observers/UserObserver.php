<?php

namespace App\Observers;

use App\Models\Notaria;
use App\Models\User;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserObserver
{
    /**
     * Mapeo de tipo_cuenta → Rol_Id en tbl_cat_usuarios.
     * Para usuario_notaria se usa cn_rol_id del propio usuario (default 4=SECRETARIAS).
     */
    private const TIPO_A_ROL = [
        'super_admin' => 1, // ADMINISTRADOR
        'admin_notaria' => 2, // NOTARIOS
        'usuario_notaria' => null, // usa cn_rol_id
    ];

    /**
     * Devuelve el nombre de la conexión de BD tenant para el usuario dado.
     * Registra dinámicamente la conexión si todavía no existe.
     */
    private function tenantConnectionForUser(User $user): string
    {
        $notaria = $user->notaria;

        if (! $notaria) {
            return 'mysql';
        }

        $key = 'cn_tenant_'.$notaria->id;

        if (Config::get("database.connections.{$key}") === null) {
            Config::set("database.connections.{$key}", [
                'driver' => 'mysql',
                'host' => config('database.connections.mysql.host'),
                'port' => config('database.connections.mysql.port'),
                'database' => $notaria->tenantDatabaseName(),
                'username' => config('database.connections.mysql.username'),
                'password' => config('database.connections.mysql.password'),
                'charset' => 'utf8mb4',
                'collation' => 'utf8mb4_unicode_ci',
                'prefix' => '',
                'strict' => false,
            ]);
        }

        return $key;
    }

    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        $this->updateNotariaUserCount($user->notaria_id);
        $this->sincronizarEnCN($user);
        $this->sincronizarUsersEnTenant($user);
    }

    /**
     * Handle the User "updated" event.
     */
    public function updated(User $user): void
    {
        // Si cambió la notaría, actualizar ambos contadores
        if ($user->isDirty('notaria_id')) {
            $this->updateNotariaUserCount($user->getOriginal('notaria_id'));
            $this->updateNotariaUserCount($user->notaria_id);
        }

        $this->sincronizarEnCN($user);
        $this->sincronizarUsersEnTenant($user);
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        $this->updateNotariaUserCount($user->notaria_id);
        $this->desactivarEnCN($user);
        $this->eliminarUsersEnTenant($user);
    }

    /**
     * Actualiza el contador total_usuarios de una notaría
     */
    protected function updateNotariaUserCount(?int $notariaId): void
    {
        if (! $notariaId) {
            return;
        }

        $count = User::where('notaria_id', $notariaId)->count();
        Notaria::where('id', $notariaId)->update(['total_usuarios' => $count]);
    }

    /**
     * Crea o actualiza el registro en la tabla `users` del tenant BD.
     * Garantiza que el usuario esté disponible tanto en master como en su BD tenant.
     */
    protected function sincronizarUsersEnTenant(User $user): void
    {
        $conn = $this->tenantConnectionForUser($user);

        if ($conn === 'mysql') {
            return; // sin tenant BD configurado
        }

        try {
            DB::connection($conn)->statement('SET FOREIGN_KEY_CHECKS=0');

            $existe = DB::connection($conn)->table('users')->where('email', $user->email)->exists();

            if ($existe) {
                DB::connection($conn)->table('users')->where('email', $user->email)->update([
                    'name' => $user->name,
                    'email' => $user->email,
                    'password' => $user->password,
                    'notaria_id' => $user->notaria_id,
                    'cn_usuario_id' => $user->cn_usuario_id,
                    'cn_rol_id' => $user->cn_rol_id,
                    'cn_password' => $user->cn_password,
                    'tipo_cuenta' => $user->tipo_cuenta,
                    'updated_at' => now(),
                ]);
            } else {
                DB::connection($conn)->table('users')->insert([
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'email_verified_at' => $user->email_verified_at,
                    'password' => $user->password,
                    'recoverable_password' => $user->recoverable_password,
                    'notaria_id' => $user->notaria_id,
                    'cn_usuario_id' => $user->cn_usuario_id,
                    'cn_rol_id' => $user->cn_rol_id,
                    'cn_password' => $user->cn_password,
                    'tipo_cuenta' => $user->tipo_cuenta,
                    'created_at' => $user->created_at,
                    'updated_at' => $user->updated_at,
                ]);
            }

            DB::connection($conn)->statement('SET FOREIGN_KEY_CHECKS=1');
        } catch (\Throwable $e) {
            DB::connection($conn)->statement('SET FOREIGN_KEY_CHECKS=1');
            Log::error('UserObserver: error al sincronizar users en tenant', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Elimina el registro de la tabla `users` del tenant cuando el usuario es borrado.
     */
    protected function eliminarUsersEnTenant(User $user): void
    {
        $conn = $this->tenantConnectionForUser($user);

        if ($conn === 'mysql') {
            return;
        }

        try {
            DB::connection($conn)->statement('SET FOREIGN_KEY_CHECKS=0');
            DB::connection($conn)->table('users')->where('email', $user->email)->delete();
            DB::connection($conn)->statement('SET FOREIGN_KEY_CHECKS=1');
        } catch (\Throwable $e) {
            DB::connection($conn)->statement('SET FOREIGN_KEY_CHECKS=1');
            Log::error('UserObserver: error al eliminar users en tenant', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Crea o actualiza el registro en tbl_cat_usuarios manteniendo sincronía.
     *
     * IMPORTANTE — reglas de sincronización:
     *
     * En UPDATE:
     *   - Solo se sincronizan Nombre, Correo, Rol_Id, Numero_Notaria y Activo.
     *   - NO se toca Usuario: el nombre en CN puede ser distinto al prefijo del email
     *     y C# lo gestiona de forma independiente.
     *   - NO se toca Sesion_Iniciada: resetearlo en cada update mataría sesiones activas.
     *   - Contrasena SOLO se actualiza si el password del usuario Laravel cambió en este
     *     evento; y cuando se actualiza se convierte a formato $2b$ (BCrypt.Net) para
     *     mantener compatibilidad con la API C#.
     *
     * En CREATE:
     *   - Se fija Usuario desde el prefijo del email (único momento).
     *   - Contrasena se genera en formato $2b$ desde el hash inicial de Laravel.
     */
    protected function sincronizarEnCN(User $user): void
    {
        try {
            $rolId = $this->resolverRolCN($user);
            $numeroNotaria = $this->resolverNumeroNotaria($user->notaria_id);
            $conn = $this->tenantConnectionForUser($user);

            if ($user->cn_usuario_id) {
                // ── UPDATE ──────────────────────────────────────────────────
                // Campos seguros de sincronizar en cualquier actualización
                $datos = [
                    'Nombre' => $user->name,
                    'Correo' => $user->email,
                    'Rol_Id' => $rolId,
                    'Numero_Notaria' => $numeroNotaria,
                    'Activo' => 1,
                ];

                // Solo sincronizar contraseña si cambió en este evento
                if ($user->wasChanged('password')) {
                    // Convertir $2y$ (PHP/Argon2) a $2b$ (BCrypt.Net de C#)
                    $datos['Contrasena'] = str_replace('$2y$', '$2b$', $user->password);
                }

                DB::connection($conn)
                    ->table('tbl_cat_usuarios')
                    ->where('Id', $user->cn_usuario_id)
                    ->update($datos);
            } else {
                // ── CREATE ──────────────────────────────────────────────────
                $usuario = strtoupper(explode('@', $user->email)[0]);

                $datos = [
                    'Nombre' => $user->name,
                    'Correo' => $user->email,
                    'Usuario' => $usuario,
                    'Contrasena' => str_replace('$2y$', '$2b$', $user->password),
                    'Rol_Id' => $rolId,
                    'Numero_Notaria' => $numeroNotaria,
                    'Activo' => 1,
                    'Sesion_Iniciada' => 0,
                    'Fecha_Creacion' => now(),
                ];

                $cnId = DB::connection($conn)->table('tbl_cat_usuarios')->insertGetId($datos);

                // Evitar recursión: actualizar sin disparar observer
                User::withoutEvents(fn () => $user->updateQuietly(['cn_usuario_id' => $cnId]));
            }
        } catch (\Throwable $e) {
            Log::error('UserObserver: error al sincronizar usuario en CN', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Marca como inactivo en tbl_cat_usuarios cuando el usuario es eliminado en Laravel.
     */
    protected function desactivarEnCN(User $user): void
    {
        if (! $user->cn_usuario_id) {
            return;
        }

        try {
            DB::connection($this->tenantConnectionForUser($user))
                ->table('tbl_cat_usuarios')
                ->where('Id', $user->cn_usuario_id)
                ->update(['Activo' => 0]);
        } catch (\Throwable $e) {
            Log::error('UserObserver: error al desactivar usuario en CN', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Resuelve el Rol_Id de CN a partir del tipo_cuenta y cn_rol_id del usuario.
     */
    protected function resolverRolCN(User $user): int
    {
        if ($user->tipo_cuenta === 'usuario_notaria') {
            return $user->cn_rol_id ?? 4; // default: SECRETARIAS
        }

        return self::TIPO_A_ROL[$user->tipo_cuenta] ?? 4;
    }

    /**
     * Obtiene el número de notaría (string) a partir del ID relacional.
     */
    protected function resolverNumeroNotaria(?int $notariaId): ?string
    {
        if (! $notariaId) {
            return null;
        }

        return Notaria::where('id', $notariaId)->value('numero_notaria');
    }
}
