<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

class ClearCnSessionOnLogout
{
    /**
     * Handle the event.
     */
    public function handle(Logout $event): void
    {
        $user = $event->user;

        if (! $user || ! $user->cn_usuario_id) {
            return;
        }

        // Limpiar JWT cacheado para este usuario
        Cache::forget('cn_jwt_user_'.$user->cn_usuario_id);

        // Resolver la conexión tenant del usuario
        $notaria = $user->notaria;
        $conn = 'mysql';

        if ($notaria) {
            $conn = 'cn_tenant_'.$notaria->id;

            if (Config::get("database.connections.{$conn}") === null) {
                Config::set("database.connections.{$conn}", [
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
        }

        // Resetear solo por Id para no afectar a otros usuarios con el mismo nombre
        DB::connection($conn)
            ->table('tbl_cat_usuarios')
            ->where('Id', $user->cn_usuario_id)
            ->update(['Sesion_Iniciada' => 0]);

        DB::connection($conn)
            ->table('tbl_log_sesiones_activas')
            ->where('Usuario_Id', $user->cn_usuario_id)
            ->delete();
    }
}
