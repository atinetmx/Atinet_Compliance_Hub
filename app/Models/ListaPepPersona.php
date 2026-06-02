<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListaPepPersona extends Model
{
    protected $table = 'listas_pep_personas';

    protected $fillable = [
        'codigo_individuo',
        'denominacion',
        'identificacion',
        'id_tributaria',
        'otra_identificacion',
        'relaciones',
        'fecha_nacimiento',
        'tipo',
        'sub_tipo',
        'estado',
        'cargo',
        'finalizacion_cargo',
        'lugar_trabajo',
        'direccion',
        'lista',
        'pais_lista',
        'supuesto',
        'situacion',
        'enlace',
        'hash_registro',
        'primera_busqueda_id',
        'ultima_busqueda_id',
        'ultima_verificacion_online',
        'ultima_verificacion_scraper',
    ];

    public function casts(): array
    {
        return [
            'ultima_verificacion_online' => 'datetime',
            'ultima_verificacion_scraper' => 'datetime',
        ];
    }

    public function primeraBusqueda(): BelongsTo
    {
        return $this->belongsTo(ListaPepBusqueda::class, 'primera_busqueda_id');
    }

    public function ultimaBusqueda(): BelongsTo
    {
        return $this->belongsTo(ListaPepBusqueda::class, 'ultima_busqueda_id');
    }

    /**
     * Búsqueda offline por denominación, identificación o RFC.
     *
     * @param  Builder<ListaPepPersona>  $query
     */
    public function scopeBuscar(Builder $query, string $termino): Builder
    {
        return $query->where(function (Builder $q) use ($termino): void {
            $q->where('denominacion', 'LIKE', "%{$termino}%")
                ->orWhere('identificacion', 'LIKE', "%{$termino}%")
                ->orWhere('id_tributaria', 'LIKE', "%{$termino}%");
        });
    }

    /**
     * Solo registros pendientes de verificación por el scraper.
     *
     * @param  Builder<ListaPepPersona>  $query
     */
    public function scopePendientesVerificacion(Builder $query, int $diasAntiguedad = 30): Builder
    {
        return $query->where(function (Builder $q) use ($diasAntiguedad): void {
            $q->whereNull('ultima_verificacion_scraper')
                ->orWhere('ultima_verificacion_scraper', '<', now()->subDays($diasAntiguedad));
        });
    }

    /**
     * Inserta o actualiza desde un resultado de la API PLD.
     *
     * @param  array<string, mixed>  $datos
     */
    public static function upsertDesdeApi(array $datos, int $busquedaId): self
    {
        /** @var self $persona */
        $persona = self::firstOrNew(['codigo_individuo' => $datos['codigo_individuo']]);

        $esNueva = ! $persona->exists;

        $persona->fill($datos);
        $persona->ultima_verificacion_online = now();
        $persona->ultima_busqueda_id = $busquedaId;

        if ($esNueva) {
            $persona->primera_busqueda_id = $busquedaId;
        }

        $persona->save();

        return $persona;
    }
}
