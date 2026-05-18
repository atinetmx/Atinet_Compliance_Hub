<?php

/**
 * EJEMPLO DE CONTROLADOR DE DASHBOARD
 *
 * Este archivo muestra cómo usar los métodos del modelo Notaria
 * para detectar y mostrar servicios disponibles en el dashboard.
 *
 * NO es código de producción, es un ejemplo educativo.
 */

namespace App\Http\Controllers\Example;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardExampleController extends Controller
{
    /**
     * Dashboard principal de la notaría
     * Muestra solo los servicios disponibles según su suscripción
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $notaria = $user->notaria; // Notaría del usuario logueado

        // 1️⃣ Obtener servicios disponibles (solo implemented + active)
        $serviciosDisponibles = $notaria->getAllAvailableServices();

        // 2️⃣ Agrupar servicios por categoría para mejor UX
        $serviciosPorCategoria = $notaria->getServiciosPorCategoria();

        // 3️⃣ Obtener información detallada de uso para cada servicio
        $serviciosConLimites = $serviciosDisponibles->map(function ($servicio) use ($notaria) {
            $limite = $notaria->getLimiteServicio($servicio->code);
            $usoActual = $notaria->getUsoServicioMesActual($servicio->code);
            $puedeUsar = $notaria->puedeUsarServicio($servicio->code);

            return [
                'code' => $servicio->code,
                'name' => $servicio->name,
                'description' => $servicio->description,
                'category' => $servicio->category->value,
                'billing_model' => $servicio->billing_model->value,

                // Límites y uso
                'limite' => $limite, // null = ilimitado
                'uso_actual' => $usoActual,
                'disponible_mes' => $limite ? ($limite - $usoActual) : null,
                'puede_usar' => $puedeUsar,

                // Porcentaje de uso (para progress bars)
                'porcentaje_uso' => $limite && $limite > 0
                    ? round(($usoActual / $limite) * 100, 2)
                    : 0,

                // Estado visual
                'estado' => match (true) {
                    ! $puedeUsar => 'agotado',
                    $limite && ($usoActual / $limite) > 0.8 => 'advertencia',
                    default => 'disponible',
                },
            ];
        });

        // 4️⃣ Información de la suscripción
        $suscripcion = $notaria->subscripcionActiva;

        return Inertia::render('Dashboard/Index', [
            'notaria' => [
                'id' => $notaria->id,
                'nombre' => $notaria->nombre,
                'numero' => $notaria->numero_notaria,
                'estado' => $notaria->estado,
                'activa' => $notaria->activa,
            ],

            'suscripcion' => $suscripcion ? [
                'plan_nombre' => $suscripcion->plan->nombre,
                'plan_slug' => $suscripcion->plan->slug,
                'status' => $suscripcion->status,
                'fecha_vencimiento' => $suscripcion->fecha_vencimiento->format('d/m/Y'),
                'dias_restantes' => now()->diffInDays($suscripcion->fecha_vencimiento),
                'auto_renovacion' => $suscripcion->auto_renovacion,
            ] : null,

            'servicios' => [
                'por_categoria' => $serviciosPorCategoria,
                'con_limites' => $serviciosConLimites,
                'total' => $serviciosDisponibles->count(),
            ],

            // Estadísticas generales
            'estadisticas' => [
                'usuarios_totales' => $notaria->users()->count(),
                'usuarios_limite' => $notaria->limite_usuarios,
                'busquedas_mes' => $notaria->busquedas_mes_actual,
                'busquedas_limite' => $notaria->limite_busquedas_mes,
            ],
        ]);
    }

    /**
     * Verificar acceso a un servicio específico antes de renderizar módulo
     */
    public function verificarAcceso(Request $request, string $serviceCode): \Illuminate\Http\JsonResponse
    {
        $notaria = $request->user()->notaria;

        $tieneAcceso = $notaria->tieneAccesoServicio($serviceCode);
        $puedeUsar = $notaria->puedeUsarServicio($serviceCode);

        return response()->json([
            'tiene_acceso' => $tieneAcceso,
            'puede_usar' => $puedeUsar,
            'limite' => $notaria->getLimiteServicio($serviceCode),
            'uso_actual' => $notaria->getUsoServicioMesActual($serviceCode),
        ]);
    }

    /**
     * Ejemplo: Mostrar módulo solo si tiene acceso
     */
    public function escanerInteligente(Request $request): Response
    {
        $notaria = $request->user()->notaria;

        // Verificar acceso al servicio
        if (! $notaria->tieneAccesoServicio('ESCANER_INTELIGENTE')) {
            abort(403, 'No tienes acceso al Escáner Inteligente. Actualiza tu plan.');
        }

        // Verificar límite mensual
        if (! $notaria->puedeUsarServicio('ESCANER_INTELIGENTE')) {
            return Inertia::render('EscanerInteligente/LimiteAlcanzado', [
                'limite' => $notaria->getLimiteServicio('ESCANER_INTELIGENTE'),
                'uso_actual' => $notaria->getUsoServicioMesActual('ESCANER_INTELIGENTE'),
            ]);
        }

        // Renderizar módulo normalmente
        return Inertia::render('EscanerInteligente/Index', [
            'limite' => $notaria->getLimiteServicio('ESCANER_INTELIGENTE'),
            'uso_actual' => $notaria->getUsoServicioMesActual('ESCANER_INTELIGENTE'),
        ]);
    }

    /**
     * Ejemplo: Menú dinámico basado en servicios disponibles
     */
    public function obtenerMenu(Request $request): \Illuminate\Http\JsonResponse
    {
        $notaria = $request->user()->notaria;
        $servicios = $notaria->getAllAvailableServices();

        $menuItems = [];

        // Módulos Core
        if ($servicios->contains('code', 'CONTROL_NOTARIAL')) {
            $menuItems[] = [
                'label' => 'Control Notarial',
                'icon' => 'folder',
                'route' => 'control-notarial.index',
            ];
        }

        if ($servicios->contains('code', 'AGENDA_WEB')) {
            $menuItems[] = [
                'label' => 'Agenda',
                'icon' => 'calendar',
                'route' => 'agenda.index',
            ];
        }

        if ($servicios->contains('code', 'REGISTRO_WEB')) {
            $menuItems[] = [
                'label' => 'Registro Web',
                'icon' => 'clipboard',
                'route' => 'registro-web.index',
            ];
        }

        // Búsquedas
        $busquedas = $servicios->whereIn('code', ['BLACKLIST_SAT', 'BLACKLIST_OFAC'])->count();
        if ($busquedas > 0) {
            $menuItems[] = [
                'label' => 'Búsquedas',
                'icon' => 'search',
                'route' => 'busquedas.index',
                'badge' => $busquedas,
            ];
        }

        // Escáner Inteligente
        if ($servicios->contains('code', 'ESCANER_INTELIGENTE')) {
            $limiteEscaner = $notaria->getLimiteServicio('ESCANER_INTELIGENTE');
            $usoEscaner = $notaria->getUsoServicioMesActual('ESCANER_INTELIGENTE');

            $menuItems[] = [
                'label' => 'Escáner Inteligente',
                'icon' => 'scan',
                'route' => 'escaner-inteligente.index',
                'badge' => $limiteEscaner ? "{$usoEscaner}/{$limiteEscaner}" : null,
            ];
        }

        return response()->json($menuItems);
    }
}
