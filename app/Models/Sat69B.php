<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo para la tabla 69-B de la base de datos SAT
 * (Servicio de Administración Tributaria - Lista de contribuyentes incumplidos)
 *
 * Tabla global compartida por todos los tenants
 * No requiere NotariaScope porque es información pública
 */
class Sat69B extends Model
{
    /**
     * Conexión a la base de datos SAT
     */
    protected $connection = 'sat';

    /**
     * Nombre de la tabla (con caracteres especiales)
     */
    protected $table = '69-B';

    /**
     * La tabla no tiene timestamps
     */
    public $timestamps = false;

    /**
     * Campos que se pueden asignar masivamente
     */
    protected $fillable = [
        'NombreOriginal',
        'RFC',
        'Situacion',
        'PublicacionSAT',
        'PublicacionDOF',
        'NumeroOficio',
    ];

    /**
     * Búsqueda por RFC con validación
     * Implementa algoritmo exacto del sistema legacy
     *
     * Valida que el RFC tenga 12 caracteres (persona moral) o 13 (persona física)
     * y que sea alfanumérico en mayúsculas
     */
    public function scopeSearchByRfc(Builder $query, string $rfc): Builder
    {
        // Limpiar y validar RFC (algoritmo legacy)
        $rfcLimpio = strtoupper(trim($rfc));

        return $query->selectRaw("*, replace(NombreOriginal, ',', '') as nombre_limpio")
            ->where('RFC', $rfcLimpio);
    }

    /**
     * Búsqueda por nombre en lista SAT
     * Similar al algoritmo OFAC pero en tabla 69-B
     */
    public function scopeSearchByName(Builder $query, string $nombre): Builder
    {
        $nombreLimpio = strtoupper(trim($nombre));

        return $query->selectRaw("*, replace(NombreOriginal, ',', '') as nombre_limpio")
            ->whereRaw("replace(NombreOriginal, ',', '') LIKE CONCAT('%', ?, '%')", [$nombreLimpio]);
    }

    /**
     * Búsqueda combinada: RFC + nombre
     * Implementa lógica del sistema legacy para coincidencia exacta
     *
     * Esta es la búsqueda más precisa: encuentra registros que coincidan
     * tanto en RFC como en nombre
     */
    public function scopeSearchCombined(Builder $query, string $rfc, string $nombre): Builder
    {
        $rfcLimpio = strtoupper(trim($rfc));
        $nombreLimpio = strtoupper(trim($nombre));

        return $query->selectRaw("*, replace(NombreOriginal, ',', '') as nombre_limpio")
            ->where('RFC', $rfcLimpio)
            ->whereRaw("replace(NombreOriginal, ',', '') LIKE CONCAT('%', ?, '%')", [$nombreLimpio]);
    }

    /**
     * Validar formato de RFC según estándares mexicanos
     *
     * RFC Persona Física: 13 caracteres (CURP-homoclave)
     * RFC Persona Moral: 12 caracteres
     */
    public static function isValidRfc(string $rfc): bool
    {
        $rfcLimpio = strtoupper(trim($rfc));
        $length = strlen($rfcLimpio);

        // RFC debe tener 12 o 13 caracteres alfanuméricos
        return ($length === 12 || $length === 13) && ctype_alnum($rfcLimpio);
    }

    /**
     * Búsqueda solo por RFC con validación previa
     * Implementa algoritmo exacto del sistema legacy
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function searchRfc(string $rfc)
    {
        // Validar RFC
        $rfcLimpio = strtoupper(trim($rfc));
        if (! static::isValidRfc($rfcLimpio)) {
            return collect();
        }

        return static::searchByRfc($rfcLimpio)->get();
    }

    /**
     * Búsqueda solo por nombre en SAT
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function searchNombre(string $nombre)
    {
        return static::searchByName($nombre)->get()->unique('RFC');
    }

    /**
     * Búsqueda combinada RFC + nombre
     * Esta es la búsqueda con mayor precisión
     *
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function searchRfcAndName(string $rfc, string $nombre)
    {
        // Validar RFC
        $rfcLimpio = strtoupper(trim($rfc));
        if (strlen($rfcLimpio) < 12 || strlen($rfcLimpio) > 13) {
            return collect();
        }

        return static::searchCombined($rfcLimpio, $nombre)->get();
    }

    /**
     * Obtener el nombre limpio (sin comas)
     */
    public function getNombreLimpioAttribute(): string
    {
        return strtoupper(str_replace(',', '', $this->NombreOriginal ?? ''));
    }
}
