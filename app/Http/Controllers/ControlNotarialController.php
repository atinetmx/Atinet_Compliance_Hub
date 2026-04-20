<?php

namespace App\Http\Controllers;

use App\Services\ControlNotarialApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
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
     * El frontend lo llama al entrar a cualquier módulo CN, evitando el doble login.
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

        try {
            $cnUsuario = DB::table('tbl_cat_usuarios')
                ->where('Id', $user->cn_usuario_id)
                ->value('Usuario');

            if (! $cnUsuario) {
                return response()->json([
                    'success' => false,
                    'error' => 'Usuario Control Notarial no encontrado.',
                ], 404);
            }

            // Resetear sesión activa tanto en DB como vía C# API (gateway)
            // para evitar "Ya hay una sesion iniciada con este usuario"
            DB::table('tbl_cat_usuarios')
                ->where('Id', $user->cn_usuario_id)
                ->update(['Sesion_Iniciada' => 0]);

            app(ControlNotarialApiService::class)->resetSesionCN($user->cn_usuario_id);

            $plainPassword = decrypt($user->cn_password);

            $token = app(ControlNotarialApiService::class)->loginUser($cnUsuario, $plainPassword);

            if (! $token) {
                return response()->json([
                    'success' => false,
                    'error' => 'No se pudo autenticar en Control Notarial.',
                ], 502);
            }

            return response()->json([
                'success' => true,
                'token' => $token,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'error' => 'Error interno al obtener token CN.',
            ], 500);
        }
    }
}
