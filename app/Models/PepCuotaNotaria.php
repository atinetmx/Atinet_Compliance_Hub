<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PepCuotaNotaria extends Model
{
    protected $table = 'pep_cuotas_notaria';

    protected $fillable = [
        'notaria_id',
        'paquete_id',
        'busquedas_asignadas',
        'busquedas_consumidas',
        'activo',
        'fecha_asignacion',
        'fecha_vencimiento',
        'notas',
    ];

    public function casts(): array
    {
        return [
            'activo' => 'boolean',
            'fecha_asignacion' => 'datetime',
            'fecha_vencimiento' => 'datetime',
        ];
    }

    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    public function paquete(): BelongsTo
    {
        return $this->belongsTo(PepPaquetePld::class, 'paquete_id');
    }

    /**
     * Búsquedas disponibles para esta notaría.
     */
    public function disponibles(): int
    {
        return max(0, $this->busquedas_asignadas - $this->busquedas_consumidas);
    }

    /**
     * Consume una búsqueda. Lanza excepción si no hay disponibles.
     */
    public function consumir(): void
    {
        if ($this->disponibles() <= 0) {
            throw new \RuntimeException('Cuota de búsquedas PEP agotada para esta notaría.');
        }

        $this->increment('busquedas_consumidas');
    }

    /** @param Builder<PepCuotaNotaria> $query */
    public function scopeActiva(Builder $query): Builder
    {
        return $query->where('activo', true)
            ->where(function (Builder $q): void {
                $q->whereNull('fecha_vencimiento')
                    ->orWhere('fecha_vencimiento', '>=', now());
            });
    }

    /**
     * Cuota activa para una notaría específica.
     */
    public static function deNotaria(int $notariaId): ?self
    {
        return self::activa()
            ->where('notaria_id', $notariaId)
            ->latest('fecha_asignacion')
            ->first();
    }
}
