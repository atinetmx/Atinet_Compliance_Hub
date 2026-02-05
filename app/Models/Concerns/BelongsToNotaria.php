<?php

namespace App\Models\Concerns;

use App\Models\Scopes\NotariaScope;
use App\Models\Notaria;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Trait para modelos que pertenecen a una notaría
 * Aplica automáticamente el Global Scope de multi-tenancy
 */
trait BelongsToNotaria
{
    /**
     * Boot the trait
     */
    protected static function bootBelongsToNotaria(): void
    {
        static::addGlobalScope(new NotariaScope);

        // Asignar automáticamente la notaría del usuario autenticado al crear
        static::creating(function ($model) {
            if (!$model->notaria_id && auth()->check() && auth()->user()->notaria_id) {
                $model->notaria_id = auth()->user()->notaria_id;
            }
        });
    }

    /**
     * Relación con la notaría
     */
    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    /**
     * Scope para filtrar por notaría específica
     */
    public function scopeForNotaria($query, int $notariaId)
    {
        return $query->where('notaria_id', $notariaId);
    }

    /**
     * Scope para obtener registros sin Global Scope (solo para super_admin)
     */
    public function scopeWithoutTenantScope($query)
    {
        return $query->withoutGlobalScope(NotariaScope::class);
    }

    /**
     * Verificar si el registro pertenece a la notaría del usuario actual
     */
    public function belongsToCurrentUserNotaria(): bool
    {
        if (!auth()->check() || !auth()->user()->notaria_id) {
            return false;
        }

        return $this->notaria_id === auth()->user()->notaria_id;
    }

    /**
     * Verificar si el usuario puede acceder a este registro
     */
    public function canAccess(?int $userNotariaId = null): bool
    {
        // Super admin puede acceder a todo
        if (auth()->check() && auth()->user()->tipo_cuenta === 'super_admin') {
            return true;
        }

        $userNotariaId = $userNotariaId ?? auth()->user()?->notaria_id;

        return $this->notaria_id === $userNotariaId;
    }
}
