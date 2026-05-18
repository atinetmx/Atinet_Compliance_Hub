<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CnModulo extends Model
{
    use HasFactory;

    protected $fillable = [
        'code',
        'nombre',
        'descripcion',
        'grupo',
        'orden',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'orden' => 'integer',
        ];
    }

    /**
     * Notarías que tienen este módulo asignado.
     */
    public function notarias(): BelongsToMany
    {
        return $this->belongsToMany(Notaria::class, 'notaria_cn_modulos', 'cn_modulo_id', 'notaria_id')
            ->withPivot(['is_enabled', 'configuracion'])
            ->withTimestamps();
    }

    /**
     * Scope: Solo módulos activos.
     */
    public function scopeActivo($query): void
    {
        $query->where('is_active', true);
    }
}
