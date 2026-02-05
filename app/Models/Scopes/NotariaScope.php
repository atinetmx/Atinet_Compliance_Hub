<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;
use Illuminate\Support\Facades\Auth;

class NotariaScope implements Scope
{
    /**
     * Apply the scope to a given Eloquent query builder.
     */
    public function apply(Builder $builder, Model $model): void
    {
        // Solo aplicar el scope si hay un usuario autenticado
        if (Auth::check()) {
            $user = Auth::user();

            // Si el usuario no es super_admin, filtrar por su notaría
            if ($user->tipo_cuenta !== 'super_admin' && $user->notaria_id) {
                $builder->where('notaria_id', $user->notaria_id);
            }
        }
    }
}
