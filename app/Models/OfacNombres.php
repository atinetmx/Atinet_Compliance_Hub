<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo para la tabla Nombres de la base de datos OFAC
 * (Office of Foreign Assets Control - Lista de sanciones de EE.UU.)
 *
 * Tabla global compartida por todos los tenants
 * No requiere NotariaScope porque es información pública
 */
class OfacNombres extends Model
{
    /**
     * Conexión a la base de datos OFAC
     */
    protected $connection = 'ofac';

    /**
     * Nombre de la tabla
     */
    protected $table = 'Nombres';

    /**
     * La tabla no tiene timestamps
     */
    public $timestamps = false;

    /**
     * Campos que se pueden asignar masivamente
     */
    protected $fillable = [
        'NombreOriginal',
    ];

    /**
     * Búsqueda por nombre con algoritmo del sistema legacy
     * Implementa: LIKE con wildcards + limpieza de comas
     *
     * Algoritmo: Divide el nombre en palabras y busca cada palabra individualmente.
     * Ejemplo: "BIN LADEN Osama" → encuentra "Osama BIN LADEN" y "BIN LADEN, Osama"
     */
    public function scopeSearchByName(Builder $query, string $nombre): Builder
    {
        // Limpiar el término de búsqueda (algoritmo legacy mejorado)
        $nombreLimpio = strtoupper(trim($nombre));

        // Remover caracteres especiales que interfieren con la búsqueda
        $nombreLimpio = preg_replace('/[,\.\-]/', ' ', $nombreLimpio);

        // Dividir el nombre en palabras para búsqueda flexible
        // Esto permite encontrar "BIN LADEN, Osama" con búsqueda "OSAMA BIN LADEN"
        $palabras = array_filter(explode(' ', $nombreLimpio), function ($palabra) {
            return strlen(trim($palabra)) > 1; // Solo palabras de más de 1 carácter
        });

        $query->selectRaw("id, NombreOriginal, REPLACE(REPLACE(REPLACE(NombreOriginal, ',', ''), '.', ''), '-', ' ') as nombre_limpio");

        // Agregar condición WHERE para cada palabra
        foreach ($palabras as $palabra) {
            $palabraLimpia = trim($palabra);
            if (strlen($palabraLimpia) > 1) {
                $query->whereRaw("REPLACE(REPLACE(REPLACE(NombreOriginal, ',', ''), '.', ''), '-', ' ') LIKE ?", ["%{$palabraLimpia}%"]);
            }
        }

        return $query->limit(100); // Limitar resultados para no sobrecargar
    }

    /**
     * Búsqueda para persona física
     * Implementa lógica específica del sistema legacy
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function searchPersonaFisica(string $nombre)
    {
        return static::searchByName($nombre)->get()->unique('nombre_limpio');
    }

    /**
     * Búsqueda para persona moral (denominación social)
     * Misma lógica que persona física pero con contexto diferente
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function searchPersonaMoral(string $denominacion)
    {
        return static::searchByName($denominacion)->get()->unique('nombre_limpio');
    }

    /**
     * Obtener el nombre limpio (sin caracteres especiales)
     */
    public function getNombreLimpioAttribute(): string
    {
        return strtoupper(preg_replace('/[,\.\-]/', ' ', $this->NombreOriginal ?? ''));
    }
}
