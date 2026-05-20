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
            'message' => 'MÃ³dulo Control Notarial en desarrollo - Fase 0',
            'docs' => [
                'analysis' => 'docs/ANALISIS_SISTEMA_VB6_CONTROL_NOTARIAL.md',
                'quickStart' => 'docs/FASE_0_CONTROL_NOTARIAL_QUICK_START.md',
                'workspace' => 'docs/control-notarial/README.md',
            ],
            'phase' => [
                'current' => 0,
                'name' => 'PreparaciÃ³n y AnÃ¡lisis',
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
            'message' => 'MÃ³dulo Expedientes en desarrollo',
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
            'message' => 'MÃ³dulo Presupuesto Previo en desarrollo',
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
            'message' => 'MÃ³dulo Expedientes en desarrollo',
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
     * Display configuraciÃ³n module (Dashboard)
     */
    public function configuracion(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/Index');
    }

    /**
     * Display notarÃ­a data within configuraciÃ³n
     */
    public function notaria(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/Notaria/Index');
    }

    /**
     * Display usuarios module within configuraciÃ³n
     */
    public function usuarios(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/Usuarios/Index');
    }

    /**
     * Display alta catalogos module within configuraciÃ³n
     */
    public function altaCatalogos(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/AltaCatalogos/Index');
    }

    /**
     * Display reporte de usuarios module within configuraciÃ³n
     */
    public function reporteUsuarios(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/ReporteUsuarios/Index');
    }

    /**
     * Display configuraciÃ³n de operaciones module
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
     * Display clientes module within configuraciÃ³n
     */
    public function clientes(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/Clientes/Index');
    }

    /**
     * Display formatos ilimitados module within configuraciÃ³n
     */
    public function formatosIlimitados(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/FormatosIlimitados/Index');
    }

    /**
     * Display recibos module
     */
    public function recibos(): Response
    {
        return Inertia::render('ControlNotarial/Recibos/Index');
    }

    /**
     * Display recibos expediente module
     */
    public function recibosExpediente(): Response
    {
        return Inertia::render('ControlNotarial/Recibos/Expediente/Index');
    }

    /**
     * Display reportes del sistema module
     */
    public function reportes(): Response
    {
        return Inertia::render('ControlNotarial/Reportes/Index');
    }


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

        // Si hay un JWT vÃ¡lido en cachÃ©, devolverlo directamente
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

                // Usar la conexiÃ³n de la BD tenant cuando hay notarÃ­a en contexto
                $conn = $notaria
                    ? 'cn_tenant_'.$notaria->id
                    : 'mysql';

                // Registrar la conexiÃ³n dinÃ¡mica si es tenant
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

                // cn_usuario_id siempre referencia el ID del master (atinet_compliance_hub).
                // Los tenants tienen sus propios auto-incrementos, por lo que el mismo ID
                // no existe en la BD tenant. El nombre de usuario (Usuario) es igual en ambas BDs,
                // asÃ­ que lo obtenemos del master y C# lo buscarÃ¡ en el tenant por nombre_Notaria.
                $cnUsuario = DB::connection('mysql')
                    ->table('tbl_cat_usuarios')
                    ->where('Id', $user->cn_usuario_id)
                    ->value('Usuario');

                if (! $cnUsuario) {
                    throw new \RuntimeException('Usuario Control Notarial no encontrado.');
                }

                // Resetear sesiÃ³n activa en AMBAS BDs para evitar "Ya hay una sesion iniciada" de C#.
                $resetWhere = ['Id' => $user->cn_usuario_id];

                DB::connection('mysql')
                    ->table('tbl_cat_usuarios')
                    ->where($resetWhere)
                    ->update(['Sesion_Iniciada' => 0]);

                DB::connection('mysql')
                    ->table('tbl_log_sesiones_activas')
                    ->where('Usuario_Id', $user->cn_usuario_id)
                    ->delete();

                // Resetear tambiÃ©n en la BD tenant para mantener consistencia.
                // Los tenants tienen auto-incremento propio, asÃ­ que el Id del tenant
                // es distinto al del master: resolverlo buscando por Usuario (username).
                if ($conn !== 'mysql') {
                    $tenantUsuarioId = DB::connection($conn)
                        ->table('tbl_cat_usuarios')
                        ->where('Usuario', $cnUsuario)
                        ->value('Id');

                    if ($tenantUsuarioId) {
                        DB::connection($conn)
                            ->table('tbl_cat_usuarios')
                            ->where('Id', $tenantUsuarioId)
                            ->update(['Sesion_Iniciada' => 0]);

                        DB::connection($conn)
                            ->table('tbl_log_sesiones_activas')
                            ->where('Usuario_Id', $tenantUsuarioId)
                            ->delete();
                    }
                }

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
