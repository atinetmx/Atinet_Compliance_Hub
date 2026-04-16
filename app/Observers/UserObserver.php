<?php

namespace App\Observers;

use App\Models\Notaria;
use App\Models\User;
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
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        $this->updateNotariaUserCount($user->notaria_id);
        $this->sincronizarEnCN($user);
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
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        $this->updateNotariaUserCount($user->notaria_id);
        $this->desactivarEnCN($user);
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
     * Crea o actualiza el registro en tbl_cat_usuarios manteniendo sincronía.
     */
    protected function sincronizarEnCN(User $user): void
    {
        try {
            $rolId = $this->resolverRolCN($user);
            $numeroNotaria = $this->resolverNumeroNotaria($user->notaria_id);
            $usuario = strtoupper(explode('@', $user->email)[0]);

            $datos = [
                'Nombre' => $user->name,
                'Correo' => $user->email,
                'Usuario' => $usuario,
                'Contrasena' => $user->getRawOriginal('password') ?? $user->password,
                'Rol_Id' => $rolId,
                'Numero_Notaria' => $numeroNotaria,
                'Activo' => 1,
                'Sesion_Iniciada' => 0,
            ];

            if ($user->cn_usuario_id) {
                // Actualizar registro existente
                DB::table('tbl_cat_usuarios')
                    ->where('Id', $user->cn_usuario_id)
                    ->update($datos);
            } else {
                // Crear nuevo y guardar el ID de vuelta en users
                $datos['Fecha_Creacion'] = now();
                $cnId = DB::table('tbl_cat_usuarios')->insertGetId($datos);

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
            DB::table('tbl_cat_usuarios')
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
