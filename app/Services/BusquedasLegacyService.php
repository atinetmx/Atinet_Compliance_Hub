<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class BusquedasLegacyService
{
    /**
     * Obtener búsquedas consolidadas de una notaría desde sistema legacy
     *
     * @param  string  $legacyIdentifier  Identificador de notaría en sistema legacy (ej: "10Cuernavaca")
     * @param  array  $options  Opciones: limit, fuente, fecha_desde, fecha_hasta
     */
    public function getBusquedasConsolidadas(string $legacyIdentifier, array $options = []): array
    {
        $limit = $options['limit'] ?? 100;
        $fuente = $options['fuente'] ?? null; // 'web', 'desktop', 'ofac', 'sat', null = todas
        $fechaDesde = $options['fecha_desde'] ?? null;
        $fechaHasta = $options['fecha_hasta'] ?? null;

        $busquedas = [];

        // 1. Búsquedas Web (aplicativos.busquedas)
        if (! $fuente || $fuente === 'web') {
            $busquedas = array_merge($busquedas, $this->getBusquedasWeb($legacyIdentifier, $fechaDesde, $fechaHasta));
        }

        // 2. Búsquedas Desktop VB6 (aplicativos.busquedas_escritorio)
        if (! $fuente || $fuente === 'desktop') {
            $busquedas = array_merge($busquedas, $this->getBusquedasDesktop($legacyIdentifier, $fechaDesde, $fechaHasta));
        }

        // 3. Búsquedas OFAC (listasofac.consultas)
        if (! $fuente || $fuente === 'ofac') {
            $busquedas = array_merge($busquedas, $this->getBusquedasOfac($legacyIdentifier, $fechaDesde, $fechaHasta));
        }

        // 4. Búsquedas SAT (listassat.consultas)
        if (! $fuente || $fuente === 'sat') {
            $busquedas = array_merge($busquedas, $this->getBusquedasSat($legacyIdentifier, $fechaDesde, $fechaHasta));
        }

        // Ordenar por fecha descendente y aplicar límite
        usort($busquedas, fn ($a, $b) => strtotime($b['fecha']) - strtotime($a['fecha']));

        return [
            'total' => count($busquedas),
            'busquedas' => array_slice($busquedas, 0, $limit),
            'legacy_identifier' => $legacyIdentifier,
            'has_more' => count($busquedas) > $limit,
        ];
    }

    /**
     * Obtener estadísticas de búsquedas legacy
     */
    public function getEstadisticas(string $legacyIdentifier): array
    {
        // Cache por 1 hora
        return Cache::remember("legacy-stats-{$legacyIdentifier}", 3600, function () use ($legacyIdentifier) {
            $totalWeb = $this->countBusquedasWeb($legacyIdentifier);
            $totalDesktop = $this->countBusquedasDesktop($legacyIdentifier);
            $totalOfac = $this->countBusquedasOfac($legacyIdentifier);
            $totalSat = $this->countBusquedasSat($legacyIdentifier);

            return [
                'total' => $totalWeb + $totalDesktop + $totalOfac + $totalSat,
                'por_fuente' => [
                    'web' => $totalWeb,
                    'desktop' => $totalDesktop,
                    'ofac' => $totalOfac,
                    'sat' => $totalSat,
                ],
                'primera_busqueda' => $this->getPrimeraBusqueda($legacyIdentifier),
                'ultima_busqueda' => $this->getUltimaBusqueda($legacyIdentifier),
            ];
        });
    }

    /**
     * Búsquedas desde interfaz web
     */
    private function getBusquedasWeb(string $notariaId, ?string $fechaDesde, ?string $fechaHasta): array
    {
        $query = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('NOTARIA', $notariaId)
            ->where('ORIGEN_CONSULTA', 'WEB');

        if ($fechaDesde) {
            $query->where('FECHA', '>=', $fechaDesde);
        }
        if ($fechaHasta) {
            $query->where('FECHA', '<=', $fechaHasta);
        }

        $results = $query->select('id', 'NOMBRE', 'RFC', 'FECHA', 'USER', 'TIPO_BUSQUEDA', 'N_ESTATUS', 'R_ESTATUS')
            ->orderBy('FECHA', 'desc')
            ->limit(500)
            ->get();

        return $results->map(function ($row) {
            return [
                'id' => $row->id,
                'tipo_busqueda' => $row->TIPO_BUSQUEDA ?? 'RFC',
                'termino_busqueda' => $row->RFC ?? $row->NOMBRE,
                'nombre_completo' => $row->NOMBRE,
                'rfc' => $row->RFC,
                'resultado_nombre' => $row->N_ESTATUS,
                'resultado_rfc' => $row->R_ESTATUS,
                'fecha' => $row->FECHA,
                'usuario' => $row->USER,
                'fuente' => 'Web',
                'sistema' => 'Legacy',
            ];
        })->toArray();
    }

    /**
     * Búsquedas desde aplicación Desktop VB6
     */
    private function getBusquedasDesktop(string $notariaId, ?string $fechaDesde, ?string $fechaHasta): array
    {
        $query = DB::connection('aplicativos')
            ->table('busquedas_escritorio')
            ->where('NOTARIA', $notariaId);

        if ($fechaDesde) {
            $query->where('FECHA', '>=', $fechaDesde);
        }
        if ($fechaHasta) {
            $query->where('FECHA', '<=', $fechaHasta);
        }

        $results = $query->select('id', 'NOMBRE', 'RFC', 'FECHA', 'USER', 'TIPO_BUSQUEDA', 'N_ESTATUS', 'R_ESTATUS')
            ->orderBy('FECHA', 'desc')
            ->limit(500)
            ->get();

        return $results->map(function ($row) {
            return [
                'id' => $row->id,
                'tipo_busqueda' => $row->TIPO_BUSQUEDA ?? 'RFC',
                'termino_busqueda' => $row->RFC ?? $row->NOMBRE,
                'nombre_completo' => $row->NOMBRE,
                'rfc' => $row->RFC,
                'resultado_nombre' => $row->N_ESTATUS,
                'resultado_rfc' => $row->R_ESTATUS,
                'fecha' => $row->FECHA,
                'usuario' => $row->USER,
                'fuente' => 'Desktop',
                'sistema' => 'Legacy',
            ];
        })->toArray();
    }

    /**
     * Búsquedas en lista OFAC (Lista Negra)
     */
    private function getBusquedasOfac(string $notariaId, ?string $fechaDesde, ?string $fechaHasta): array
    {
        $query = DB::connection('ofac')
            ->table('consultas')
            ->where('proyecto', $notariaId);

        if ($fechaDesde) {
            $query->where('fecha', '>=', $fechaDesde);
        }
        if ($fechaHasta) {
            $query->where('fecha', '<=', $fechaHasta);
        }

        $results = $query->select('id', 'tipoconsulta', 'fecha', 'proyecto')
            ->orderBy('fecha', 'desc')
            ->limit(500)
            ->get();

        return $results->map(function ($row) {
            return [
                'id' => $row->id,
                'tipo_busqueda' => 'Lista Negra',
                'termino_busqueda' => 'Consulta OFAC',
                'nombre_completo' => 'Consulta '.$row->tipoconsulta,
                'rfc' => null,
                'resultado_nombre' => null,
                'resultado_rfc' => null,
                'fecha' => $row->fecha,
                'usuario' => 'N/A',
                'fuente' => 'OFAC',
                'sistema' => 'Legacy',
            ];
        })->toArray();
    }

    /**
     * Búsquedas en lista SAT
     */
    private function getBusquedasSat(string $notariaId, ?string $fechaDesde, ?string $fechaHasta): array
    {
        $query = DB::connection('sat')
            ->table('consultas')
            ->where('proyecto', $notariaId);

        if ($fechaDesde) {
            $query->where('fecha', '>=', $fechaDesde);
        }
        if ($fechaHasta) {
            $query->where('fecha', '<=', $fechaHasta);
        }

        $results = $query->select('id', 'tipoconsulta', 'fecha', 'proyecto')
            ->orderBy('fecha', 'desc')
            ->limit(500)
            ->get();

        return $results->map(function ($row) {
            return [
                'id' => $row->id,
                'tipo_busqueda' => 'Lista SAT',
                'termino_busqueda' => 'Consulta SAT',
                'nombre_completo' => 'Consulta '.$row->tipoconsulta,
                'rfc' => null,
                'resultado_nombre' => null,
                'resultado_rfc' => null,
                'fecha' => $row->fecha,
                'usuario' => 'N/A',
                'fuente' => 'SAT',
                'sistema' => 'Legacy',
            ];
        })->toArray();
    }

    // Métodos de conteo para estadísticas

    private function countBusquedasWeb(string $notariaId): int
    {
        return DB::connection('aplicativos')
            ->table('busquedas')
            ->where('NOTARIA', $notariaId)
            ->where('ORIGEN_CONSULTA', 'WEB')
            ->count();
    }

    private function countBusquedasDesktop(string $notariaId): int
    {
        return DB::connection('aplicativos')
            ->table('busquedas_escritorio')
            ->where('NOTARIA', $notariaId)
            ->count();
    }

    private function countBusquedasOfac(string $notariaId): int
    {
        return DB::connection('ofac')
            ->table('consultas')
            ->where('proyecto', $notariaId)
            ->count();
    }

    private function countBusquedasSat(string $notariaId): int
    {
        return DB::connection('sat')
            ->table('consultas')
            ->where('proyecto', $notariaId)
            ->count();
    }

    private function getPrimeraBusqueda(string $notariaId): ?string
    {
        // Verificar en las 4 tablas y obtener la más antigua
        $fechas = [];

        $fechaWeb = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('NOTARIA', $notariaId)
            ->where('ORIGEN_CONSULTA', 'WEB')
            ->min('FECHA');
        if ($fechaWeb) {
            $fechas[] = $fechaWeb;
        }

        $fechaDesktop = DB::connection('aplicativos')
            ->table('busquedas_escritorio')
            ->where('NOTARIA', $notariaId)
            ->min('FECHA');
        if ($fechaDesktop) {
            $fechas[] = $fechaDesktop;
        }

        $fechaOfac = DB::connection('ofac')
            ->table('consultas')
            ->where('proyecto', $notariaId)
            ->min('fecha');
        if ($fechaOfac) {
            $fechas[] = $fechaOfac;
        }

        $fechaSat = DB::connection('sat')
            ->table('consultas')
            ->where('proyecto', $notariaId)
            ->min('fecha');
        if ($fechaSat) {
            $fechas[] = $fechaSat;
        }

        return count($fechas) > 0 ? min($fechas) : null;
    }

    private function getUltimaBusqueda(string $notariaId): ?string
    {
        // Verificar en las 4 tablas y obtener la más reciente
        $fechas = [];

        $fechaWeb = DB::connection('aplicativos')
            ->table('busquedas')
            ->where('NOTARIA', $notariaId)
            ->where('ORIGEN_CONSULTA', 'WEB')
            ->max('FECHA');
        if ($fechaWeb) {
            $fechas[] = $fechaWeb;
        }

        $fechaDesktop = DB::connection('aplicativos')
            ->table('busquedas_escritorio')
            ->where('NOTARIA', $notariaId)
            ->max('FECHA');
        if ($fechaDesktop) {
            $fechas[] = $fechaDesktop;
        }

        $fechaOfac = DB::connection('ofac')
            ->table('consultas')
            ->where('proyecto', $notariaId)
            ->max('fecha');
        if ($fechaOfac) {
            $fechas[] = $fechaOfac;
        }

        $fechaSat = DB::connection('sat')
            ->table('consultas')
            ->where('proyecto', $notariaId)
            ->max('fecha');
        if ($fechaSat) {
            $fechas[] = $fechaSat;
        }

        return count($fechas) > 0 ? max($fechas) : null;
    }
}
