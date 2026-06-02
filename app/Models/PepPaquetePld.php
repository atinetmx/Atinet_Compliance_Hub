<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PepPaquetePld extends Model
{
    protected $table = 'pep_paquetes_pld';

    protected $fillable = [
        'nombre_plan',
        'total_busquedas',
        'busquedas_demo',
        'busquedas_asignadas',
        'periodo_inicio',
        'periodo_fin',
        'activo',
        'notas',
    ];

    public function casts(): array
    {
        return [
            'periodo_inicio' => 'date',
            'periodo_fin' => 'date',
            'activo' => 'boolean',
        ];
    }

    public function cuotasNotaria(): HasMany
    {
        return $this->hasMany(PepCuotaNotaria::class, 'paquete_id');
    }

    /**
     * Búsquedas disponibles para uso interno de Atinet.
     * Implícitas: total - asignadas_a_notarías.
     */
    public function reservaAtinet(): int
    {
        return max(0, $this->total_busquedas - $this->busquedas_asignadas);
    }

    /** @param Builder<PepPaquetePld> $query */
    public function scopeActivo(Builder $query): Builder
    {
        return $query->where('activo', true);
    }

    /**
     * Paquete activo con mayor reserva disponible para Atinet.
     */
    public static function paqueteActivo(): ?self
    {
        /** @var Collection<int, self> $paquetes */
        $paquetes = self::activo()
            ->orderBy('periodo_inicio', 'desc')
            ->get();

        return $paquetes->sortByDesc(fn (self $p) => $p->reservaAtinet())->first();
    }
}
