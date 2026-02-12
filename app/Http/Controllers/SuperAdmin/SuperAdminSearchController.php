<?php

namespace App\Http\Controllers\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\OfacNombres;
use App\Models\Sat69B;
use App\Models\Service;
use App\Services\ServiceUsageRecorder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Controlador de búsquedas en listas negras OFAC y SAT para SuperAdmin
 *
 * Este controlador permite a los superadministradores realizar búsquedas
 * en las listas negras sin restricciones de servicios (acceso completo).
 *
 * Métodos de búsqueda:
 * - searchPersonaFisica: Búsqueda por nombre de persona física (OFAC + SAT)
 * - searchPersonaMoral: Búsqueda por razón social (OFAC + SAT)
 * - searchRfc: Búsqueda exclusiva por RFC en SAT
 * - searchCombined: Búsqueda combinada RFC + nombre (OFAC + SAT)
 */
class SuperAdminSearchController extends Controller
{
    public function __construct(
        protected ServiceUsageRecorder $usageRecorder
    ) {}

    /**
     * Búsqueda de persona física en listas OFAC + SAT
     * Implementa algoritmo exacto del sistema legacy con búsqueda extendida
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchPersonaFisica(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|min:3|max:255',
        ]);

        $nombre = trim($request->nombre);
        $user = Auth::user();

        try {
            // 1. Búsqueda en OFAC
            $resultadosOfac = OfacNombres::searchPersonaFisica($nombre);

            // Log para debugging
            Log::info('SuperAdmin - Búsqueda OFAC', [
                'nombre' => $nombre,
                'count_ofac' => $resultadosOfac->count(),
                'user_id' => $user->id,
            ]);

            // 2. Búsqueda adicional en SAT por nombre
            $resultadosSat = Sat69B::searchNombre($nombre);

            $response = [
                'success' => true,
                'data' => [
                    'tipo_busqueda' => 'Persona Física (OFAC + SAT)',
                    'termino_busqueda' => $nombre,
                    'total_resultados' => $resultadosOfac->count() + $resultadosSat->count(),
                    'encontrado' => $resultadosOfac->isNotEmpty() || $resultadosSat->isNotEmpty(),
                    'ofac_resultados' => $resultadosOfac->map(function ($item) use ($nombre) {
                        return [
                            'nombre_original' => $item->NombreOriginal,
                            'nombre_limpio' => $item->nombre_limpio,
                            'coincidencia' => $this->calculateMatch($item->nombre_limpio, $nombre),
                            'fuente' => 'OFAC',
                        ];
                    })->toArray(),
                    'sat_resultados' => $resultadosSat->map(function ($item) use ($nombre) {
                        return [
                            'nombre_original' => $item->NombreOriginal,
                            'nombre_limpio' => $item->nombre_limpio,
                            'rfc' => $item->RFC,
                            'situacion' => $item->Situacion ?? 'No especificada',
                            'publicacion_sat' => $item->PublicacionSAT ?? null,
                            'publicacion_dof' => $item->PublicacionDOF ?? null,
                            'coincidencia' => $this->calculateMatch($item->nombre_limpio, $nombre),
                            'fuente' => 'SAT',
                        ];
                    })->toArray(),
                ],
            ];

            // Registrar uso del servicio OFAC
            $notaria = $user->notaria;
            if ($notaria) {
                $this->usageRecorder->record(
                    notaria: $notaria,
                    service: 'BLACKLIST_OFAC',
                    user: $user,
                    quantity: 1,
                    metadata: [
                        'termino' => $nombre,
                        'resultados' => $resultadosOfac->count(),
                        'tipo' => 'persona_fisica',
                    ]
                );
            }

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error en searchPersonaFisica', [
                'mensaje' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error en búsqueda de persona física: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Búsqueda de persona moral en listas OFAC + SAT
     * Implementa algoritmo exacto del sistema legacy con búsqueda extendida
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchPersonaMoral(Request $request)
    {
        $request->validate([
            'razon_social' => 'required|string|min:3|max:255',
        ]);

        $denominacion = trim($request->razon_social);
        $user = Auth::user();

        try {
            // 1. Búsqueda en OFAC
            $resultadosOfac = OfacNombres::searchPersonaMoral($denominacion);

            // 2. Búsqueda adicional en SAT por nombre
            $resultadosSat = Sat69B::searchNombre($denominacion);

            $response = [
                'success' => true,
                'data' => [
                    'tipo_busqueda' => 'Persona Moral (OFAC + SAT)',
                    'termino_busqueda' => $denominacion,
                    'total_resultados' => $resultadosOfac->count() + $resultadosSat->count(),
                    'encontrado' => $resultadosOfac->isNotEmpty() || $resultadosSat->isNotEmpty(),
                    'ofac_resultados' => $resultadosOfac->map(function ($item) use ($denominacion) {
                        return [
                            'nombre_original' => $item->NombreOriginal,
                            'nombre_limpio' => $item->nombre_limpio,
                            'coincidencia' => $this->calculateMatch($item->nombre_limpio, $denominacion),
                            'fuente' => 'OFAC',
                        ];
                    })->toArray(),
                    'sat_resultados' => $resultadosSat->map(function ($item) use ($denominacion) {
                        return [
                            'nombre_original' => $item->NombreOriginal,
                            'nombre_limpio' => $item->nombre_limpio,
                            'rfc' => $item->RFC,
                            'situacion' => $item->Situacion ?? 'No especificada',
                            'publicacion_sat' => $item->PublicacionSAT ?? null,
                            'publicacion_dof' => $item->PublicacionDOF ?? null,
                            'coincidencia' => $this->calculateMatch($item->nombre_limpio, $denominacion),
                            'fuente' => 'SAT',
                        ];
                    })->toArray(),
                ],
            ];

            // Registrar uso del servicio SAT
            $notaria = $user->notaria;
            if ($notaria) {
                $this->usageRecorder->record(
                    notaria: $notaria,
                    service: 'BLACKLIST_OFAC',
                    user: $user,
                    quantity: 1,
                    metadata: [
                        'termino' => $denominacion,
                        'resultados' => $resultadosSat->count(),
                        'tipo' => 'persona_moral',
                    ]
                );
            }

            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error en búsqueda de persona moral: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Búsqueda por RFC en lista SAT
     * Implementa algoritmo exacto del sistema legacy
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchRfc(Request $request)
    {
        $request->validate([
            'rfc' => 'required|string|min:12|max:13|alpha_num',
        ]);

        $rfc = strtoupper(trim($request->rfc));
        $user = Auth::user();

        try {
            // Validar formato RFC (12 caracteres para morales, 13 para físicas)
            if (! Sat69B::isValidRfc($rfc)) {
                return response()->json([
                    'success' => false,
                    'error' => 'RFC debe tener 12 o 13 caracteres alfanuméricos',
                ], 422);
            }

            // Búsqueda usando el modelo
            $resultados = Sat69B::searchRfc($rfc);

            $response = [
                'success' => true,
                'data' => [
                    'tipo_busqueda' => 'Lista SAT - RFC',
                    'termino_busqueda' => $rfc,
                    'total_resultados' => $resultados->count(),
                    'encontrado' => $resultados->isNotEmpty(),
                    'sat_resultados' => $resultados->map(function ($item) use ($rfc) {
                        return [
                            'nombre_original' => $item->NombreOriginal,
                            'nombre_limpio' => $item->nombre_limpio,
                            'rfc' => $item->RFC,
                            'situacion' => $item->Situacion ?? 'No especificada',
                            'numero_oficio' => $item->NumeroOficio ?? null,
                            'publicacion_sat' => $item->PublicacionSAT ?? null,
                            'publicacion_dof' => $item->PublicacionDOF ?? null,
                            'coincidencia' => 100, // Coincidencia exacta por RFC
                        ];
                    })->toArray(),
                ],
            ];

            // Registrar uso del servicio SAT
            $notaria = $user->notaria;
            if ($notaria) {
                $this->usageRecorder->record(
                    notaria: $notaria,
                    service: 'BLACKLIST_SAT',
                    user: $user,
                    quantity: 1,
                    metadata: [
                        'termino' => $rfc,
                        'resultados' => $resultados->count(),
                        'tipo' => 'rfc',
                    ]
                );
            }

            return response()->json($response);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error en búsqueda por RFC: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Búsqueda combinada: nombre + RFC
     * Implementa algoritmo exacto del sistema legacy
     *
     * Esta es la búsqueda más completa: busca en OFAC por nombre
     * y en SAT con tres niveles de precisión (combinado, RFC, nombre)
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function searchCombined(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|min:3|max:255',
            'rfc' => 'required|string|min:12|max:13|alpha_num',
            'tipo_persona' => 'required|in:fisica,moral',
        ]);

        $nombre = trim($request->nombre);
        $rfc = strtoupper(trim($request->rfc));
        $tipoPersona = $request->tipo_persona;
        $user = Auth::user();

        try {
            $response = [
                'success' => true,
                'data' => [
                    'tipo_busqueda' => 'Combinada - OFAC + SAT',
                    'termino_busqueda' => $nombre,
                    'termino_rfc' => $rfc,
                    'tipo_persona' => $tipoPersona,
                    'ofac_resultados' => [],
                    'sat_resultados' => [],
                    'total_resultados' => 0,
                ],
            ];

            // 1. Búsqueda en OFAC según tipo de persona
            if ($tipoPersona === 'fisica') {
                $resultadosOfac = OfacNombres::searchPersonaFisica($nombre);
            } else {
                $resultadosOfac = OfacNombres::searchPersonaMoral($nombre);
            }

            $response['data']['ofac_resultados'] = $resultadosOfac->map(function ($item) use ($nombre) {
                return [
                    'nombre_original' => $item->NombreOriginal,
                    'nombre_limpio' => $item->nombre_limpio,
                    'coincidencia' => $this->calculateMatch($item->nombre_limpio, $nombre),
                ];
            })->toArray();

            // 2. Búsqueda combinada en SAT (RFC + nombre)
            $resultadosSatCombinados = Sat69B::searchRfcAndName($rfc, $nombre);
            $resultadosSatRfc = Sat69B::searchRfc($rfc);
            $resultadosSatNombre = Sat69B::searchNombre($nombre);

            // Estructurar resultados SAT según prioridad del sistema legacy
            $response['data']['sat_resultados'] = [
                'combinados' => $resultadosSatCombinados->map(function ($item) {
                    return [
                        'nombre_original' => $item->NombreOriginal,
                        'nombre_limpio' => $item->nombre_limpio,
                        'rfc' => $item->RFC,
                        'situacion' => $item->Situacion ?? 'No especificada',
                        'publicacion_sat' => $item->PublicacionSAT ?? null,
                        'publicacion_dof' => $item->PublicacionDOF ?? null,
                        'tipo_coincidencia' => 'RFC + Nombre',
                        'coincidencia' => 100,
                    ];
                })->toArray(),

                'por_rfc' => $resultadosSatRfc->map(function ($item) {
                    return [
                        'nombre_original' => $item->NombreOriginal,
                        'nombre_limpio' => $item->nombre_limpio,
                        'rfc' => $item->RFC,
                        'situacion' => $item->Situacion ?? 'No especificada',
                        'publicacion_sat' => $item->PublicacionSAT ?? null,
                        'publicacion_dof' => $item->PublicacionDOF ?? null,
                        'tipo_coincidencia' => 'Solo RFC',
                        'coincidencia' => 100,
                    ];
                })->toArray(),

                'por_nombre' => $resultadosSatNombre->map(function ($item) use ($nombre) {
                    return [
                        'nombre_original' => $item->NombreOriginal,
                        'nombre_limpio' => $item->nombre_limpio,
                        'rfc' => $item->RFC,
                        'situacion' => $item->Situacion ?? 'No especificada',
                        'publicacion_sat' => $item->PublicacionSAT ?? null,
                        'publicacion_dof' => $item->PublicacionDOF ?? null,
                        'tipo_coincidencia' => 'Solo Nombre',
                        'coincidencia' => $this->calculateMatch($item->nombre_limpio, $nombre),
                    ];
                })->toArray(),
            ];

            $response['data']['total_resultados'] = $resultadosOfac->count() +
                $resultadosSatCombinados->count() +
                $resultadosSatRfc->count() +
                $resultadosSatNombre->count();

            // Registrar uso del servicio OFAC (servicio principal para búsqueda combinada)
            $notaria = $user->notaria;
            if ($notaria) {
                $this->usageRecorder->record(
                    notaria: $notaria,
                    service: 'BLACKLIST_OFAC',
                    user: $user,
                    quantity: 1,
                    metadata: [
                        'termino_nombre' => $nombre,
                        'termino_rfc' => $rfc,
                        'tipo_persona' => $tipoPersona,
                        'resultados' => $response['data']['total_resultados'],
                        'tipo' => 'busqueda_combinada',
                    ]
                );
            }

            return response()->json($response);
        } catch (\Exception $e) {
            Log::error('Error en searchCombined', [
                'mensaje' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'nombre' => $nombre ?? 'N/A',
                'rfc' => $rfc ?? 'N/A',
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Error en búsqueda combinada: '.$e->getMessage(),
            ], 500);
        }
    }

    /**
     * Calcular porcentaje de coincidencia entre dos strings
     * Utiliza similar_text() nativo de PHP (algoritmo Levenshtein simplificado)
     *
     * @param string $string1
     * @param string $string2
     * @return float
     */
    protected function calculateMatch(string $string1, string $string2): float
    {
        $string1 = strtoupper(trim($string1));
        $string2 = strtoupper(trim($string2));

        similar_text($string1, $string2, $porcentaje);

        return round($porcentaje, 2);
    }
}
