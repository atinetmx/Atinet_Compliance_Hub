<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

/**
 * Controlador para acceder a los catálogos de SEPOMEX
 * (estados, municipios, códigos postales)
 *
 * BD: atinet65_catalogos (sistema legacy "registro web")
 */
class CatalogosController extends Controller
{
    /**
     * Obtener todos los estados de México
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEstados()
    {
        try {
            // Cache por 24 horas (los estados no cambian)
            $estados = Cache::remember('catalogos:estados', 86400, function () {
                return DB::connection('catalogos')
                    ->table('cat_cp')
                    ->select('d_estado', 'c_estado')
                    ->distinct()
                    ->orderBy('d_estado')
                    ->get()
                    ->map(function ($estado) {
                        return [
                            'nombre' => $estado->d_estado,
                            'codigo' => (int) $estado->c_estado,
                        ];
                    });
            });

            return response()->json([
                'success' => true,
                'data' => $estados,
                'total' => $estados->count(),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estados',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener municipios filtrados por estado
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getMunicipios(Request $request)
    {
        $request->validate([
            'estado' => 'required|string',
        ]);

        try {
            $estado = $request->input('estado');

            // Cache por estado (24 horas)
            $cacheKey = 'catalogos:municipios:'.md5($estado);

            $municipios = Cache::remember($cacheKey, 86400, function () use ($estado) {
                return DB::connection('catalogos')
                    ->table('cat_cp')
                    ->select('D_mnpio', 'c_mnpio')
                    ->where('d_estado', $estado)
                    ->distinct()
                    ->orderBy('D_mnpio')
                    ->get()
                    ->map(function ($municipio) {
                        return [
                            'nombre' => $municipio->D_mnpio,
                            'codigo' => (int) $municipio->c_mnpio,
                        ];
                    });
            });

            return response()->json([
                'success' => true,
                'data' => $municipios,
                'total' => $municipios->count(),
                'estado' => $estado,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener municipios',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar información por código postal
     * Permite auto-completar estado, municipio, colonias
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function buscarCodigoPostal(Request $request)
    {
        $request->validate([
            'cp' => 'required|string|min:5|max:5',
        ]);

        try {
            $cp = $request->input('cp');

            // Cache por CP (24 horas)
            $cacheKey = 'catalogos:cp:'.$cp;

            $resultado = Cache::remember($cacheKey, 86400, function () use ($cp) {
                // Buscar todas las colonias/asentamientos para este CP
                $registros = DB::connection('catalogos')
                    ->table('cat_cp')
                    ->where('d_codigo', (int) $cp)
                    ->orWhere('d_CP', (int) $cp)
                    ->get();

                if ($registros->isEmpty()) {
                    return null;
                }

                // Tomar el primer registro para datos generales
                $primero = $registros->first();

                // Extraer todas las colonias únicas
                $colonias = $registros->map(function ($reg) {
                    return [
                        'nombre' => $reg->d_asenta,
                        'tipo' => $reg->d_tipo_asenta,
                        'zona' => $reg->d_zona,
                    ];
                })->sortBy('nombre')->values();

                return [
                    'estado' => $primero->d_estado,
                    'codigo_estado' => (int) $primero->c_estado,
                    'municipio' => $primero->D_mnpio,
                    'codigo_municipio' => (int) $primero->c_mnpio,
                    'ciudad' => $primero->d_ciudad,
                    'codigo_postal' => (int) $primero->d_codigo,
                    'colonias' => $colonias,
                    'total_colonias' => $colonias->count(),
                ];
            });

            if (! $resultado) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código postal no encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $resultado,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al buscar código postal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Buscar colonias/asentamientos por estado y municipio
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getColonias(Request $request)
    {
        $request->validate([
            'estado' => 'required|string',
            'municipio' => 'required|string',
        ]);

        try {
            $estado = $request->input('estado');
            $municipio = $request->input('municipio');

            // Cache por combinación (24 horas)
            $cacheKey = 'catalogos:colonias:'.md5($estado.$municipio);

            $colonias = Cache::remember($cacheKey, 86400, function () use ($estado, $municipio) {
                return DB::connection('catalogos')
                    ->table('cat_cp')
                    ->select('d_asenta', 'd_tipo_asenta', 'd_codigo', 'd_CP')
                    ->where('d_estado', $estado)
                    ->where('D_mnpio', $municipio)
                    ->distinct()
                    ->orderBy('d_asenta')
                    ->limit(500) // Limitar para no sobrecargar
                    ->get()
                    ->map(function ($colonia) {
                        return [
                            'nombre' => $colonia->d_asenta,
                            'tipo' => $colonia->d_tipo_asenta,
                            'codigo_postal' => (int) ($colonia->d_codigo ?? $colonia->d_CP),
                        ];
                    });
            });

            return response()->json([
                'success' => true,
                'data' => $colonias,
                'total' => $colonias->count(),
                'estado' => $estado,
                'municipio' => $municipio,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener colonias',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener descripción de un Régimen Fiscal por código
     *
     * Equivalente a: utilerias_appliweb/api/catalogos/regimen-fiscal.php
     * BD: atinet65_catalogos.catregimenfiscal
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getRegimenFiscal(Request $request)
    {
        $codigo = $request->query('codigo') ?? $request->input('codigo');

        try {
            // Sin código: devolver listado completo
            if (empty($codigo)) {
                $lista = Cache::remember('catalogos:regimen_fiscal', 86400, function () {
                    return DB::connection('catalogos')
                        ->table('catregimenfiscal')
                        ->select('codigo', 'descripcion')
                        ->orderBy('codigo')
                        ->get()
                        ->map(fn ($r) => [
                            'codigo' => (string) $r->codigo,
                            'descripcion' => $r->descripcion,
                        ]);
                });

                return response()->json([
                    'success' => true,
                    'data' => $lista,
                    'total' => $lista->count(),
                ]);
            }

            // Validar formato: 2-3 dígitos
            $codigo = trim($codigo);
            if (! preg_match('/^\d{2,3}$/', $codigo)) {
                return response()->json([
                    'success' => false,
                    'message' => 'Código de régimen fiscal inválido',
                ], 400);
            }

            $cacheKey = 'catalogos:regimen_fiscal:'.$codigo;
            $regimen = Cache::remember($cacheKey, 86400, function () use ($codigo) {
                return DB::connection('catalogos')
                    ->table('catregimenfiscal')
                    ->where('codigo', $codigo)
                    ->first();
            });

            if (! $regimen) {
                return response()->json([
                    'success' => false,
                    'message' => 'Régimen fiscal no encontrado',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'codigo' => (string) $regimen->codigo,
                    'descripcion' => $regimen->descripcion,
                ],
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener régimen fiscal',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Estadísticas generales de los catálogos
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function getEstadisticas()
    {
        try {
            $stats = Cache::remember('catalogos:estadisticas', 3600, function () {
                return [
                    'total_registros' => DB::connection('catalogos')->table('cat_cp')->count(),
                    'total_estados' => DB::connection('catalogos')->table('cat_cp')->distinct('d_estado')->count(),
                    'total_municipios' => DB::connection('catalogos')->table('cat_cp')->distinct('D_mnpio')->count(),
                    'total_colonias' => DB::connection('catalogos')->table('cat_cp')->distinct('d_asenta')->count(),
                    'fuente' => 'SEPOMEX (Servicio Postal Mexicano)',
                    'ultima_actualizacion' => DB::connection('catalogos')->table('cat_cp')->max('id_asenta_cpcons'),
                ];
            });

            return response()->json([
                'success' => true,
                'data' => $stats,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener estadísticas',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
