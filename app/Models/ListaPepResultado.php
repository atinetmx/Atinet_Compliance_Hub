<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListaPepResultado extends Model
{
    protected $table = 'listas_pep_resultados';

    protected $fillable = [
        'busqueda_id',
        'codigo_individuo',
        'denominacion',
        'identificacion',
        'id_tributaria',
        'otra_identificacion',
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
        'exactitud_denominacion',
        'exactitud_identificacion',
        'enlace',
        'orden_relevancia',
        'hash_registro',
        'es_coincidencia_exacta',
        'accion_tomada',
        'justificacion',
    ];

    public function casts(): array
    {
        return [
            'es_coincidencia_exacta' => 'boolean',
        ];
    }

    public function busqueda(): BelongsTo
    {
        return $this->belongsTo(ListaPepBusqueda::class, 'busqueda_id');
    }

    /**
     * Solo resultados con exactitud ALTA.
     *
     * @param  Builder<ListaPepResultado>  $query
     */
    public function scopeAltaExactitud(Builder $query): Builder
    {
        return $query->where('exactitud_denominacion', 'LIKE', 'ALTO%');
    }

    /**
     * Solo personas PEP activas.
     *
     * @param  Builder<ListaPepResultado>  $query
     */
    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('estado', 'ACTIVO');
    }

    /**
     * Construye el hash SHA256 del contenido de un resultado de API
     * para detectar cambios en re-consultas futuras.
     *
     * @param  array<string, mixed>  $datos
     */
    public static function calcularHash(array $datos): string
    {
        $campos = [
            $datos['denominacion'] ?? '',
            $datos['estado'] ?? '',
            $datos['cargo'] ?? '',
            $datos['lugar_trabajo'] ?? '',
            $datos['lista'] ?? '',
            $datos['supuesto'] ?? '',
            $datos['situacion'] ?? '',
        ];

        return hash('sha256', implode('|', $campos));
    }
}
