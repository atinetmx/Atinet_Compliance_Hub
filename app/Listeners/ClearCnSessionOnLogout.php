<?php

namespace App\Listeners;

use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Facades\Cache;
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

        // Resetear solo por Id para no afectar a otros usuarios con el mismo nombre
        DB::table('tbl_cat_usuarios')
            ->where('Id', $user->cn_usuario_id)
            ->update(['Sesion_Iniciada' => 0]);

        DB::table('tbl_log_sesiones_activas')
            ->where('Usuario_Id', $user->cn_usuario_id)
            ->delete();
    }
}
