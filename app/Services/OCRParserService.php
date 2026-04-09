<?php

namespace App\Services;

use Exception;

/**
 * OCR Parser Service
 *
 * Procesa y normaliza los datos extraídos por GeminiVisionService.
 * Aplica validaciones, transformaciones y limpieza de datos.
 */
class OCRParserService
{
    /**
     * Parsear datos de INE
     *
     * @param  array  $rawData  Datos crudos de Gemini Vision
     * @param  string  $side  'front' o 'back'
     * @return array Datos normalizados
     */
    public function parseINE(array $rawData, string $side): array
    {
        // Normalizar textos a MAYÚSCULAS
        $parsed = array_map(function ($value) {
            return is_string($value) ? mb_strtoupper(trim($value), 'UTF-8') : $value;
        }, $rawData);

        // Validar y normalizar CURP (si existe)
        if (! empty($parsed['curp'])) {
            $parsed['curp'] = $this->normalizeCURP($parsed['curp']);
        }

        // Validar y normalizar RFC (si existe)
        if (! empty($parsed['rfc'])) {
            $parsed['rfc'] = $this->normalizeRFC($parsed['rfc']);
        }

        // Normalizar CP a entero
        if (isset($parsed['cp']) && ! empty($parsed['cp'])) {
            $parsed['cp'] = (int) preg_replace('/\D/', '', $parsed['cp']);
        }

        // Normalizar número de identificación (13 dígitos)
        if (isset($parsed['no_identificacion']) && ! empty($parsed['no_identificacion'])) {
            $parsed['no_identificacion'] = preg_replace('/\D/', '', $parsed['no_identificacion']);
        }

        // Normalizar fecha de nacimiento
        if (isset($parsed['dia']) && ! empty($parsed['dia'])) {
            $parsed['dia'] = $this->normalizeDate($parsed['dia']);
        }

        // Normalizar vigencia
        if (isset($parsed['vigiencia_de_ine']) && ! empty($parsed['vigiencia_de_ine'])) {
            // Si solo es año (4 dígitos), convertir a fecha YYYY-12-31
            if (preg_match('/^\d{4}$/', $parsed['vigiencia_de_ine'])) {
                $parsed['vigiencia_de_ine'] = $parsed['vigiencia_de_ine'].'-12-31';
            }
        }

        // Generar RFC desde CURP si no existe (solo personas físicas)
        if (empty($parsed['rfc']) && ! empty($parsed['curp']) && strlen($parsed['curp']) === 18) {
            $parsed['rfc'] = $this->generateRFCFromCURP($parsed['curp']);
        }

        // Establecer valores por defecto
        $parsed['pais'] = $parsed['pais'] ?? 'MEXICO';
        $parsed['paisnac'] = $parsed['paisnac'] ?? 'MEXICO';
        $parsed['nacionalidad'] = $parsed['nacionalidad'] ?? 'MEXICANA';
        $parsed['persona'] = 'fisica'; // INE siempre es persona física

        return $parsed;
    }

    /**
     * Parsear datos de CURP
     *
     * @param  array  $rawData  Datos crudos de Gemini Vision
     * @return array Datos normalizados
     */
    public function parseCURP(array $rawData): array
    {
        // Normalizar textos a MAYÚSCULAS
        $parsed = array_map(function ($value) {
            return is_string($value) ? mb_strtoupper(trim($value), 'UTF-8') : $value;
        }, $rawData);

        // Validar y normalizar CURP
        if (! empty($parsed['curp'])) {
            $parsed['curp'] = $this->normalizeCURP($parsed['curp']);

            // Extraer información adicional del CURP si falta
            $curpData = $this->extractDataFromCURP($parsed['curp']);

            // Completar datos faltantes con info del CURP
            $parsed['dia'] = $parsed['dia'] ?? $curpData['fecha_nacimiento'];
            $parsed['genero'] = $parsed['genero'] ?? $curpData['genero'];
            $parsed['estado_nac'] = $parsed['estado_nac'] ?? $curpData['estado_nacimiento'];
        }

        // Normalizar fecha de nacimiento
        if (isset($parsed['dia']) && ! empty($parsed['dia'])) {
            $parsed['dia'] = $this->normalizeDate($parsed['dia']);
        }

        // Generar RFC desde CURP
        if (! empty($parsed['curp']) && strlen($parsed['curp']) === 18) {
            $parsed['rfc'] = $this->generateRFCFromCURP($parsed['curp']);
        }

        // Establecer valores por defecto
        $parsed['paisnac'] = $parsed['paisnac'] ?? 'MEXICO';
        $parsed['nacionalidad'] = $parsed['nacionalidad'] ?? 'MEXICANA';
        $parsed['pais'] = 'MEXICO';
        $parsed['persona'] = 'fisica';

        return $parsed;
    }

    /**
     * Parsear datos de Acta de Nacimiento
     *
     * @param  array  $rawData  Datos crudos de Gemini Vision
     * @return array Datos normalizados
     */
    public function parseActa(array $rawData): array
    {
        // Normalizar textos a MAYÚSCULAS
        $parsed = array_map(function ($value) {
            return is_string($value) ? mb_strtoupper(trim($value), 'UTF-8') : $value;
        }, $rawData);

        // Validar y normalizar CURP (si existe)
        if (! empty($parsed['curp'])) {
            $parsed['curp'] = $this->normalizeCURP($parsed['curp']);

            // Generar RFC desde CURP
            if (strlen($parsed['curp']) === 18) {
                $parsed['rfc'] = $this->generateRFCFromCURP($parsed['curp']);
            }
        }

        // Normalizar fecha de nacimiento
        if (isset($parsed['dia']) && ! empty($parsed['dia'])) {
            $parsed['dia'] = $this->normalizeDate($parsed['dia']);
        }

        // Establecer valores por defecto
        $parsed['paisnac'] = $parsed['paisnac'] ?? 'MEXICO';
        $parsed['nacionalidad'] = $parsed['nacionalidad'] ?? 'MEXICANA';
        $parsed['pais'] = 'MEXICO';
        $parsed['persona'] = 'fisica';

        return $parsed;
    }

    /**
     * Normalizar CURP
     *
     * Valida formato y limpia caracteres no válidos.
     *
     * @param  string  $curp  CURP crudo
     * @return string CURP normalizado
     *
     * @throws Exception
     */
    protected function normalizeCURP(string $curp): string
    {
        // Limpiar y convertir a MAYÚSCULAS
        $curp = mb_strtoupper(trim($curp), 'UTF-8');
        $curp = preg_replace('/[^A-Z0-9]/', '', $curp);

        // Validar longitud
        if (strlen($curp) !== 18) {
            throw new Exception("CURP inválido: debe tener 18 caracteres (recibido: {$curp})");
        }

        // Validar formato básico: 4 letras + 6 dígitos + 1 letra + 2 letras + 3 consonantes + 2 caracteres
        if (! preg_match('/^[A-Z]{4}\d{6}[HM][A-Z]{2}[A-Z]{3}[A-Z0-9]{2}$/', $curp)) {
            throw new Exception("CURP con formato inválido: {$curp}");
        }

        return $curp;
    }

    /**
     * Normalizar RFC
     *
     * Valida formato y limpia caracteres no válidos.
     *
     * @param  string  $rfc  RFC crudo
     * @return string RFC normalizado
     *
     * @throws Exception
     */
    protected function normalizeRFC(string $rfc): string
    {
        // Limpiar y convertir a MAYÚSCULAS
        $rfc = mb_strtoupper(trim($rfc), 'UTF-8');
        $rfc = preg_replace('/[^A-Z0-9]/', '', $rfc);

        // Validar longitud (12 para PF, 13 con homoclave)
        if (strlen($rfc) < 12 || strlen($rfc) > 13) {
            throw new Exception("RFC inválido: debe tener 12 o 13 caracteres (recibido: {$rfc})");
        }

        // Validar formato: 3-4 letras + 6 dígitos + 3 caracteres homoclave
        if (! preg_match('/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/', $rfc)) {
            throw new Exception("RFC con formato inválido: {$rfc}");
        }

        return $rfc;
    }

    /**
     * Normalizar fecha
     *
     * Convierte diferentes formatos a YYYY-MM-DD.
     *
     * @param  string  $date  Fecha en cualquier formato
     * @return string Fecha normalizada YYYY-MM-DD
     */
    protected function normalizeDate(string $date): string
    {
        $date = trim($date);

        // Ya está en formato correcto
        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $date)) {
            return $date;
        }

        // Intentar parsear fecha
        try {
            $parsedDate = new \DateTime($date);

            return $parsedDate->format('Y-m-d');
        } catch (\Exception $e) {
            // Si falla, retornar original
            return $date;
        }
    }

    /**
     * Generar RFC desde CURP
     *
     * El RFC de persona física son los primeros 10 caracteres del CURP + homoclave (3 caracteres).
     * Como no tenemos la homoclave, generamos un RFC básico de 10 caracteres.
     *
     * @param  string  $curp  CURP válido de 18 caracteres
     * @return string RFC de 10 caracteres (sin homoclave)
     */
    protected function generateRFCFromCURP(string $curp): string
    {
        if (strlen($curp) !== 18) {
            return '';
        }

        // RFC = Primeros 10 caracteres del CURP (4 letras + 6 dígitos de fecha)
        return substr($curp, 0, 10);
    }

    /**
     * Extraer datos del CURP
     *
     * El CURP contiene información codificada:
     * - Posiciones 1-4: Iniciales (apellido paterno, materno, nombre)
     * - Posiciones 5-10: Fecha nacimiento (AAMMDD)
     * - Posición 11: Sexo (H/M)
     * - Posiciones 12-13: Estado de nacimiento
     *
     * @param  string  $curp  CURP válido
     * @return array Datos extraídos
     */
    protected function extractDataFromCURP(string $curp): array
    {
        if (strlen($curp) !== 18) {
            return [];
        }

        // Extraer fecha de nacimiento (posiciones 5-10: AAMMDD)
        $year = (int) substr($curp, 4, 2);
        $month = substr($curp, 6, 2);
        $day = substr($curp, 8, 2);

        // Determinar siglo (año < 25 = 2000s, año >= 25 = 1900s)
        $year = $year < 25 ? 2000 + $year : 1900 + $year;

        $fechaNacimiento = "{$year}-{$month}-{$day}";

        // Extraer sexo (posición 11: H=hombre, M=mujer)
        $sexo = substr($curp, 10, 1);
        $genero = $sexo === 'H' ? 'HOMBRE' : 'MUJER';

        // Extraer código de estado (posiciones 12-13)
        $codigoEstado = substr($curp, 11, 2);
        $estadoNacimiento = $this->getEstadoFromCodigo($codigoEstado);

        return [
            'fecha_nacimiento' => $fechaNacimiento,
            'genero' => $genero,
            'estado_nacimiento' => $estadoNacimiento,
        ];
    }

    /**
     * Obtener nombre de estado desde código CURP
     *
     * @param  string  $codigo  Código de 2 letras
     * @return string Nombre del estado
     */
    protected function getEstadoFromCodigo(string $codigo): string
    {
        $estados = [
            'AS' => 'AGUASCALIENTES',
            'BC' => 'BAJA CALIFORNIA',
            'BS' => 'BAJA CALIFORNIA SUR',
            'CC' => 'CAMPECHE',
            'CL' => 'COAHUILA',
            'CM' => 'COLIMA',
            'CS' => 'CHIAPAS',
            'CH' => 'CHIHUAHUA',
            'DF' => 'CIUDAD DE MEXICO',
            'DG' => 'DURANGO',
            'GT' => 'GUANAJUATO',
            'GR' => 'GUERRERO',
            'HG' => 'HIDALGO',
            'JC' => 'JALISCO',
            'MC' => 'ESTADO DE MEXICO',
            'MN' => 'MICHOACAN',
            'MS' => 'MORELOS',
            'NT' => 'NAYARIT',
            'NL' => 'NUEVO LEON',
            'OC' => 'OAXACA',
            'PL' => 'PUEBLA',
            'QT' => 'QUERETARO',
            'QR' => 'QUINTANA ROO',
            'SP' => 'SAN LUIS POTOSI',
            'SL' => 'SINALOA',
            'SR' => 'SONORA',
            'TC' => 'TABASCO',
            'TS' => 'TAMAULIPAS',
            'TL' => 'TLAXCALA',
            'VZ' => 'VERACRUZ',
            'YN' => 'YUCATAN',
            'ZS' => 'ZACATECAS',
            'NE' => 'NACIDO EN EL EXTRANJERO',
        ];

        return $estados[$codigo] ?? '';
    }
}
