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

        // Derivar datos del CURP (más confiable que OCR para fecha y género)
        if (! empty($parsed['curp']) && strlen($parsed['curp']) === 18) {
            $curp = $parsed['curp'];

            // 1. Género desde posición 10 del CURP (H/M)
            $genFromCurp = strtoupper($curp[10]);
            if (in_array($genFromCurp, ['H', 'M'])) {
                $parsed['genero'] = $genFromCurp;
            }

            // 2. Validar orden de apellidos usando la primera letra del CURP
            // Si la inicial del apellido paterno no coincide con el CURP[0], están invertidos
            if (! empty($parsed['apellidopat']) && ! empty($parsed['apellidomat'])) {
                $inicialCurp = $curp[0];
                $inicialPaterno = strtoupper($parsed['apellidopat'][0] ?? '');
                $inicialMaterno = strtoupper($parsed['apellidomat'][0] ?? '');

                if ($inicialPaterno !== $inicialCurp && $inicialMaterno === $inicialCurp) {
                    // OCR invirtió los apellidos — corregir
                    [$parsed['apellidopat'], $parsed['apellidomat']] = [$parsed['apellidomat'], $parsed['apellidopat']];
                }
            }

            // 3. Fecha de nacimiento desde CURP si falta o es inválida
            $yy = substr($curp, 4, 2);
            $mm = substr($curp, 6, 2);
            $dd = substr($curp, 8, 2);
            $yyInt = (int) $yy;
            $currentYear = (int) date('Y');
            // Si 2000+yy tendría al menos 18 años hoy → siglo XXI, sino → siglo XX
            $year = ((2000 + $yyInt + 18) <= $currentYear) ? '20'.$yy : '19'.$yy;
            $fechaFromCurp = "{$year}-{$mm}-{$dd}";

            $diaActual = $parsed['dia'] ?? '';
            if (empty($diaActual) || ! preg_match('/^\d{4}-\d{2}-\d{2}$/', (string) $diaActual)) {
                $parsed['dia'] = $fechaFromCurp;
            }
        }

        // Validar y normalizar RFC (si existe)
        if (! empty($parsed['rfc'])) {
            $parsed['rfc'] = $this->normalizeRFC($parsed['rfc']);
        }

        // Normalizar CP a string de 5 dígitos (preservar ceros iniciales, ej: 01000 CDMX)
        if (isset($parsed['cp']) && ! empty($parsed['cp'])) {
            $cpDigits = preg_replace('/\D/', '', $parsed['cp']);
            $parsed['cp'] = str_pad($cpDigits, 5, '0', STR_PAD_LEFT);
        }

        // Normalizar número de identificación (13 dígitos)
        if (isset($parsed['no_identificacion']) && ! empty($parsed['no_identificacion'])) {
            $parsed['no_identificacion'] = preg_replace('/\D/', '', $parsed['no_identificacion']);
        }

        // Normalizar fecha de nacimiento
        if (isset($parsed['dia']) && ! empty($parsed['dia'])) {
            $parsed['dia'] = $this->normalizeDate($parsed['dia']);
        }

        // Normalizar vigencia (corregir typo vigiencia_de_ine → vigencia)
        // Aceptar cualquiera de los dos por compatibilidad hacia atrás
        $vigenciaRaw = $parsed['vigencia'] ?? $parsed['vigiencia_de_ine'] ?? null;
        if (! empty($vigenciaRaw)) {
            // Normalizar: si viene solo el año (4 dígitos) dejarlo como está
            // Si viene YYYY-MM-DD extraer solo el año
            if (preg_match('/^(\d{4})-\d{2}-\d{2}$/', $vigenciaRaw, $m)) {
                $vigenciaRaw = $m[1];
            }
            $parsed['vigencia'] = $vigenciaRaw;
        }
        // Limpiar el campo con typo si existía
        unset($parsed['vigiencia_de_ine']);

        // Normalizar genero a H/M (igual que PHP legacy)
        if (isset($parsed['genero']) && ! empty($parsed['genero'])) {
            $parsed['genero'] = $this->normalizeGenero($parsed['genero']);
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

        // Normalizar genero a H/M (igual que PHP legacy)
        if (isset($parsed['genero']) && ! empty($parsed['genero'])) {
            $parsed['genero'] = $this->normalizeGenero($parsed['genero']);
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

        // Normalizar genero a H/M (igual que PHP legacy)
        if (isset($parsed['genero']) && ! empty($parsed['genero'])) {
            $parsed['genero'] = $this->normalizeGenero($parsed['genero']);
        }

        // Normalizar fecha de nacimiento
        if (isset($parsed['dia']) && ! empty($parsed['dia'])) {
            $parsed['dia'] = $this->normalizeDate($parsed['dia']);
        }

        // Normalizar fecha de registro (puede diferir de la de nacimiento)
        if (isset($parsed['fecha_registro']) && ! empty($parsed['fecha_registro'])) {
            $parsed['fecha_registro'] = $this->normalizeDate($parsed['fecha_registro']);
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
     * Normalizar género a H/M (igual que en el sistema PHP legacy)
     *
     * Acepta: H, HOMBRE, MASCULINO, MALE, M, MUJER, FEMENINO, FEMALE
     *
     * @param  string  $genero  Género en cualquier formato
     * @return string "H" o "M"
     */
    protected function normalizeGenero(string $genero): string
    {
        $g = mb_strtoupper(trim($genero), 'UTF-8');

        if (in_array($g, ['H', 'HOMBRE', 'MASCULINO', 'MALE', 'MASC'])) {
            return 'H';
        }

        if (in_array($g, ['M', 'MUJER', 'FEMENINO', 'FEMALE', 'FEM'])) {
            return 'M';
        }

        // Si viene directo "H" o "M" del CURP (posición 10)
        return $g === 'H' ? 'H' : 'M';
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

        // Formato DD/MM/YYYY
        if (preg_match('/^(\d{2})\/(\d{2})\/(\d{4})$/', $date, $m)) {
            return "{$m[3]}-{$m[2]}-{$m[1]}";
        }

        // Formato compacto YYYYMMDD
        if (preg_match('/^(\d{8})$/', $date)) {
            return substr($date, 0, 4).'-'.substr($date, 4, 2).'-'.substr($date, 6, 2);
        }

        // Formato "01 ENE 1990" o "1 ENERO 1990" (meses en español — común en INE)
        $meses = [
            'ENE' => '01', 'FEB' => '02', 'MAR' => '03', 'ABR' => '04',
            'MAY' => '05', 'JUN' => '06', 'JUL' => '07', 'AGO' => '08',
            'SEP' => '09', 'OCT' => '10', 'NOV' => '11', 'DIC' => '12',
            'ENERO' => '01', 'FEBRERO' => '02', 'MARZO' => '03', 'ABRIL' => '04',
            'MAYO' => '05', 'JUNIO' => '06', 'JULIO' => '07', 'AGOSTO' => '08',
            'SEPTIEMBRE' => '09', 'OCTUBRE' => '10', 'NOVIEMBRE' => '11', 'DICIEMBRE' => '12',
        ];
        if (preg_match('/^(\d{1,2})\s+([A-ZÁÉÍÓÚÜ]+)\s+(\d{4})$/i', $date, $m)) {
            $mesNum = $meses[strtoupper($m[2])] ?? null;
            if ($mesNum) {
                return "{$m[3]}-{$mesNum}-".str_pad($m[1], 2, '0', STR_PAD_LEFT);
            }
        }

        // Intentar parsear con DateTime como último recurso
        try {
            $parsedDate = new \DateTime($date);

            return $parsedDate->format('Y-m-d');
        } catch (\Exception $e) {
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
