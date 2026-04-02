<?php

namespace App\Observers;

use App\Models\Notaria;
use App\Models\User;

class UserObserver
{
    /**
     * Handle the User "created" event.
     */
    public function created(User $user): void
    {
        $this->updateNotariaUserCount($user->notaria_id);
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
    }

    /**
     * Handle the User "deleted" event.
     */
    public function deleted(User $user): void
    {
        $this->updateNotariaUserCount($user->notaria_id);
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
}
