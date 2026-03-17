<?php

namespace App\Http\Controllers;

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
            'message' => 'Disponible en Fase 6 - Expedientes (meses 12-20)',
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
     * Display configuración module
     */
    public function configuracion(): Response
    {
        return Inertia::render('ControlNotarial/Configuracion/Index');
    }
}
