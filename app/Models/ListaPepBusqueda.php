<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListaPepBusqueda extends Model
{
    use HasFactory;

    protected $table = 'listas_pep_busquedas';

    protected $fillable = [
        'user_id',
        'notaria_id',
        'apellido_denominacion',
        'nombres',
        'identificacion',
        'opciones',
        'total_resultados',
        'codigo_certificado',
        'fecha_consulta',
        'ip_address',
        'estado_busqueda',
        'expediente_id',
    ];

    public function casts(): array
    {
        return [
            'opciones' => 'array',
            'fecha_consulta' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notaria(): BelongsTo
    {
        return $this->belongsTo(Notaria::class);
    }

    /** @param Builder<ListaPepBusqueda> $query */
    public function scopeDeNotaria(Builder $query, int $notariaId): Builder
    {
        return $query->where('notaria_id', $notariaId);
    }

    /** @param Builder<ListaPepBusqueda> $query */
    public function scopeUltimosDias(Builder $query, int $dias): Builder
    {
        return $query->where('fecha_consulta', '>=', now()->subDays($dias));
    }

    /** @param Builder<ListaPepBusqueda> $query */
    public function scopeBuscar(Builder $query, string $termino): Builder
    {
        return $query->where(function (Builder $q) use ($termino) {
            $q->where('apellido_denominacion', 'like', "%{$termino}%")
                ->orWhere('nombres', 'like', "%{$termino}%")
                ->orWhere('identificacion', 'like', "%{$termino}%");
        });
    }
}
