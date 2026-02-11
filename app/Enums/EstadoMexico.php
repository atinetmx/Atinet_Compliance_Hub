<?php

namespace App\Enums;

enum EstadoMexico: string
{
    case AGUASCALIENTES = 'Aguascalientes';
    case BAJA_CALIFORNIA = 'Baja California';
    case BAJA_CALIFORNIA_SUR = 'Baja California Sur';
    case CAMPECHE = 'Campeche';
    case CHIAPAS = 'Chiapas';
    case CHIHUAHUA = 'Chihuahua';
    case CDMX = 'Ciudad de México';
    case COAHUILA = 'Coahuila';
    case COLIMA = 'Colima';
    case DURANGO = 'Durango';
    case GUANAJUATO = 'Guanajuato';
    case GUERRERO = 'Guerrero';
    case HIDALGO = 'Hidalgo';
    case JALISCO = 'Jalisco';
    case MEXICO = 'Estado de México';
    case MICHOACAN = 'Michoacán';
    case MORELOS = 'Morelos';
    case NAYARIT = 'Nayarit';
    case NUEVO_LEON = 'Nuevo León';
    case OAXACA = 'Oaxaca';
    case PUEBLA = 'Puebla';
    case QUERETARO = 'Querétaro';
    case QUINTANA_ROO = 'Quintana Roo';
    case SAN_LUIS_POTOSI = 'San Luis Potosí';
    case SINALOA = 'Sinaloa';
    case SONORA = 'Sonora';
    case TABASCO = 'Tabasco';
    case TAMAULIPAS = 'Tamaulipas';
    case TLAXCALA = 'Tlaxcala';
    case VERACRUZ = 'Veracruz';
    case YUCATAN = 'Yucatán';
    case ZACATECAS = 'Zacatecas';

    /**
     * Get all estado values as an array
     */
    public static function toArray(): array
    {
        return array_column(self::cases(), 'value');
    }

    /**
     * Get estados for select options
     */
    public static function options(): array
    {
        $options = [];
        foreach (self::cases() as $estado) {
            $options[$estado->value] = $estado->value;
        }

        return $options;
    }

    /**
     * Obtiene el código corto del estado (para nombres de BD, etc.)
     * Ejemplo: "Baja California Sur" => "bcs"
     */
    public function getCode(): string
    {
        return match ($this) {
            self::AGUASCALIENTES => 'ags',
            self::BAJA_CALIFORNIA => 'bc',
            self::BAJA_CALIFORNIA_SUR => 'bcs',
            self::CAMPECHE => 'camp',
            self::CHIAPAS => 'chis',
            self::CHIHUAHUA => 'chih',
            self::CDMX => 'cdmx',
            self::COAHUILA => 'coah',
            self::COLIMA => 'col',
            self::DURANGO => 'dgo',
            self::GUANAJUATO => 'gto',
            self::GUERRERO => 'gro',
            self::HIDALGO => 'hgo',
            self::JALISCO => 'jal',
            self::MEXICO => 'edomex',
            self::MICHOACAN => 'mich',
            self::MORELOS => 'mor',
            self::NAYARIT => 'nay',
            self::NUEVO_LEON => 'nl',
            self::OAXACA => 'oax',
            self::PUEBLA => 'pue',
            self::QUERETARO => 'qro',
            self::QUINTANA_ROO => 'qroo',
            self::SAN_LUIS_POTOSI => 'slp',
            self::SINALOA => 'sin',
            self::SONORA => 'son',
            self::TABASCO => 'tab',
            self::TAMAULIPAS => 'tamps',
            self::TLAXCALA => 'tlax',
            self::VERACRUZ => 'ver',
            self::YUCATAN => 'yuc',
            self::ZACATECAS => 'zac',
        };
    }

    /**
     * Obtiene el código corto del estado a partir del nombre (string)
     * Ejemplo: "Baja California Sur" => "bcs"
     *
     * @param  string|null  $estadoNombre  Nombre del estado
     * @return string Código del estado o 'default' si no se encuentra
     */
    public static function getCodeFromName(?string $estadoNombre): string
    {
        if (! $estadoNombre) {
            return 'default';
        }

        foreach (self::cases() as $estado) {
            if ($estado->value === $estadoNombre) {
                return $estado->getCode();
            }
        }

        // Si no se encuentra, retornar 'default'
        return 'default';
    }
}
