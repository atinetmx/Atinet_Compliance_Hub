<?php

namespace App\Http\Controllers;

use App\Services\ControlNotarialApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ControlNotarialController extends Controller
{
    /**
     * Display Control Notarial dashboard
     */
    public function index(): Response
    {
        return Inertia::render('ControlNotarial/Index', [
            'status' => 'development',
            'message' => 'Módulo Control Notarial en desarrollo - Fase 0',
            'docs' => [
                'analysis' => 'docs/ANALISIS_SISTEMA_VB6_CONTROL_NOTARIAL.md',
                'quickStart' => 'docs/FASE_0_CONTROL_NOTARIAL_QUICK_START.md',
                'workspace' => 'docs/control-notarial/README.md',
            ],
            'phase' => [
                'current' => 0,
                'name' => 'Preparación y Análisis',
                'duration' => '12 semanas',
                'start_date' => '2026-03-13',
                'end_date' => '2026-06-05',
                'progress' => 0,
            ],
            'tasks' => [
                'setup' => ['total' => 4, 'completed' => 0],
                'db_exploration' => ['total' => 4, 'completed' => 0],
                'vb6_analysis' => ['total' => 4, 'completed' => 0],
                'workflows' => ['total' => 4, 'completed' => 0],
                'reports' => ['total' => 3, 'completed' => 0],
                'prototypes' => ['total' => 4, 'completed' => 0],
            ],
        ]);
    }

    /**
     * Display expedientes module (Phase 1+)
     */
    public function expedientes(): Response
    {
        return Inertia::render('ControlNotarial/Expedientes/Index', [
            'expedientes' => [],
            'phase' => 'development',
            'message' => 'Módulo Expedientes en desarrollo',
        ]);
    }

    /**
     * Display presupuesto previo module within expedientes
     */
    public function presupuestoPrevio(): Response
    {
        return Inertia::render('ControlNotarial/Expedientes/PresupuestoPrevio/Index', [
            'presupuestos' => [],
            'phase' => 'development',
            'message' => 'Módulo Presupuesto Previo en desarrollo',
        ]);
    }

    /**
     * Display expedientes module within expedientes
     */
    public function expedientesExpedientes(): Response
    {
        return Inertia::render('ControlNotarial/Expedientes/AltaExpedientes/Index', [
            'expedientes' => [],
            'phase' => 'development',
            'message' => 'Módulo Expedientes en desarrollo',
        ]);
    }

    /**
     * Display escrituras module (Phase 1+)
     */
    public function escrituras(): Response
    {
        return Inertia::render('ControlNotarial/Escrituras/Index', [
            'message' => 'Disponible en Fase 7 - Escrituras (meses 20-28)',
        ]);
    }

    /**
     * Display presupuestos module (Phase 1+)
     */
    public function presupuestos(): Response
    {
        return Inertia::render('ControlNotarial/Presupuestos/Index', [
            'message' => 'Disponible en Fase 4 - Presupuestos (meses 8-13)',
        ]);
    }

    /**
     * Display configuración module (Dashboard)
     */
    public function configuracion(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/Index');
    }

    /**
     * Display notaría data within configuración
     */
    public function notaria(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/Notaria/Index');
    }

    /**
     * Display usuarios module within configuración
     */
    public function usuarios(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/Usuarios/Index');
    }

    /**
     * Display alta catalogos module within configuración
     */
    public function altaCatalogos(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/AltaCatalogos/Index');
    }

    /**
     * Display reporte de usuarios module within configuración
     */
    public function reporteUsuarios(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/ReporteUsuarios/Index');
    }

    /**
     * Display configuración de operaciones module
     */
    public function configuracionOperaciones(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/ConfiguracionOperaciones/Index');
    }

    /**
     * Display configuraciones tarifarias module
     */
    public function configuracionesTarifarias(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/ConfiguracionesTarifarias/Index');
    }

    /**
     * Display clientes module within configuración
     */
    public function clientes(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/Clientes/Index');
    }

    /**
     * Auto-login gateway: obtiene JWT de C# para el usuario autenticado en Laravel.
     * El frontend lo llama al entrar a cualquier módulo CN, y cada ~10 min como heartbeat.
     *
     * Parámetro ?force=1 → descarta el JWT cacheado y fuerza re-autenticación (se usa
     * cuando C# devuelve 401, lo que indica que la sesión murió por inactividad).
     *
     * El JWT se cachea 12 minutos (ligeramente menos que el timeout de 15 min de C#)
     * para garantizar que siempre haya una sesión activa en C# antes de que expire.
     */
    public function autoLogin(): JsonResponse
    {
        $user = Auth::user();

        if (! $user->cn_usuario_id || ! $user->cn_password) {
            return response()->json([
                'success' => false,
                'error' => 'El usuario no tiene cuenta en Control Notarial.',
            ], 403);
        }

        $cacheKey = 'cn_jwt_user_'.$user->cn_usuario_id;
        $lockKey = 'cn_jwt_lock_'.$user->cn_usuario_id;
        $force = request()->boolean('force');

        // Si force=1 (por 401 del frontend), descartar el JWT cacheado que ya no sirve
        if ($force) {
            Cache::forget($cacheKey);
        }

        // Si hay un JWT válido en caché, devolverlo directamente
        $cached = Cache::get($cacheKey);
        if ($cached) {
            return response()->json(['success' => true, 'token' => $cached]);
        }

        // Resolver la BD tenant del usuario
        $notaria = $user->notaria;
        $cnService = app(ControlNotarialApiService::class);
        if ($notaria) {
            $cnService = $cnService->forNotaria($notaria);
        }

        try {
            $token = Cache::lock($lockKey, 15)->block(10, function () use ($user, $cacheKey, $notaria, $cnService) {
                // Doble-check tras adquirir el lock (otro proceso pudo haberlo llenado)
                if ($cached = Cache::get($cacheKey)) {
                    return $cached;
                }

                // Usar la conexión de la BD tenant cuando hay notaría en contexto
                $conn = $notaria
                    ? 'cn_tenant_'.$notaria->id
                    : 'mysql';

                // Registrar la conexión dinámica si es tenant
                if ($notaria && Config::get("database.connections.{$conn}") === null) {
                    Config::set("database.connections.{$conn}", [
                        'driver' => 'mysql',
                        'host' => config('database.connections.mysql.host'),
                        'port' => config('database.connections.mysql.port'),
                        'database' => $notaria->tenantDatabaseName(),
                        'username' => config('database.connections.mysql.username'),
                        'password' => config('database.connections.mysql.password'),
                        'charset' => 'utf8mb4',
                        'collation' => 'utf8mb4_unicode_ci',
                        'prefix' => '',
                        'strict' => false,
                    ]);
                }

                $cnUsuario = DB::connection($conn)
                    ->table('tbl_cat_usuarios')
                    ->where('Id', $user->cn_usuario_id)
                    ->value('Usuario');

                if (! $cnUsuario) {
                    throw new \RuntimeException('Usuario Control Notarial no encontrado.');
                }

                // Resetear sesión activa para evitar "Ya hay una sesion iniciada" de C#.
                DB::connection($conn)
                    ->table('tbl_cat_usuarios')
                    ->where('Id', $user->cn_usuario_id)
                    ->update(['Sesion_Iniciada' => 0]);

                DB::connection($conn)
                    ->table('tbl_log_sesiones_activas')
                    ->where('Usuario_Id', $user->cn_usuario_id)
                    ->delete();

                $plainPassword = decrypt($user->cn_password);

                $jwt = $cnService->loginUser($cnUsuario, $plainPassword);

                if (! $jwt) {
                    throw new \RuntimeException('No se pudo autenticar en Control Notarial.');
                }

                // Cachear 12 min: garantiza re-login antes del timeout de 15 min de C#
                Cache::put($cacheKey, $jwt, now()->addMinutes(12));

                return $jwt;
            });

            return response()->json(['success' => true, 'token' => $token]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage() ?: 'Error interno al obtener token CN.',
            ], 502);
        }
    }
}
