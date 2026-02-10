<?php

namespace App\Http\Controllers\Examples;

use App\Http\Controllers\Controller;
use App\Models\Busqueda;
use App\Models\Notaria;
use App\Models\User;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador de ejemplos para mostrar cómo funcionan los diferentes roles de usuario
 * Este controlador muestra las diferencias entre super_admin, admin_notaria, usuario_notaria e invitado
 *
 * IMPORTANTE: Este es un controlador de EJEMPLO - NO usar en producción
 */
class UserRoleExamplesController extends Controller
{
    /**
     * 🔥 EJEMPLO 1: SUPER_ADMIN (Empleado de Atinet)
     *
     * Un super_admin puede ver TODOS los datos del sistema
     * No tiene restricciones de notaría
     */
    public function superAdminExample()
    {
        $user = Auth::user();

        // ✅ SUPER_ADMIN: Ve TODAS las notarías (21 notarías)
        if ($user->tipo_cuenta === 'super_admin') {

            // 🌍 Dashboard global con métricas de todas las notarías
            $notarias = Notaria::all(); // Ve las 21 notarías
            $totalNotarias = $notarias->count();

            // 🔍 Ve búsquedas de TODAS las notarías
            $busquedas = Busqueda::withoutGlobalScopes()->get(); // Elimina el filtro de tenant
            $totalBusquedas = $busquedas->count();
            $busquedasPorNotaria = $busquedas->groupBy('notaria_id');

            // 📊 Métricas globales
            $usuarios = User::all(); // Todos los usuarios del sistema
            $notariasActivas = Notaria::where('activa', true)->count();
            $busquedasHoy = Busqueda::withoutGlobalScopes()
                ->whereDate('created_at', today())
                ->count();

            // 💰 Gestión de facturación y planes
            $suscripcionesVenciendoProximamente = \App\Models\Subscription::vencenPronto(7)->get();
            $facturacionMensual = $this->calcularFacturacionMensual();

            return [
                'tipo_usuario' => 'SUPER_ADMIN - Ve TODO el sistema',
                'notarias_totales' => $totalNotarias,
                'busquedas_totales' => $totalBusquedas,
                'usuarios_totales' => $usuarios->count(),
                'notarias_activas' => $notariasActivas,
                'busquedas_hoy' => $busquedasHoy,
                'suscripciones_venciendo' => $suscripcionesVenciendoProximamente->count(),
                'facturacion_mensual' => $facturacionMensual,
                'busquedas_por_notaria' => $busquedasPorNotaria->map->count(),
                'puede_actuar_como_cualquier_usuario' => true,
                'acceso_a_facturacion' => true,
                'puede_gestionar_planes' => true,
            ];
        }

        return ['error' => 'Solo super_admin puede acceder a este endpoint'];
    }

    /**
     * 🏢 EJEMPLO 2: ADMIN_NOTARIA (Notario o Administrador)
     *
     * Un admin_notaria solo ve datos de SU notaría específica
     * El Global Scope automáticamente filtra por notaria_id
     */
    public function adminNotariaExample()
    {
        $user = Auth::user();

        // ✅ ADMIN_NOTARIA: Solo ve datos de SU notaría
        if ($user->tipo_cuenta === 'admin_notaria') {

            // 🏢 Dashboard de su notaría únicamente
            $miNotaria = $user->notaria; // Solo SU notaría

            // 🔍 Solo búsquedas de su notaría (Global Scope aplica automáticamente)
            $busquedasDeMiNotaria = Busqueda::all(); // ← Global Scope filtra automáticamente
            $totalBusquedas = $busquedasDeMiNotaria->count();

            // 👥 Solo usuarios de su notaría
            $usuariosDeMiNotaria = User::where('notaria_id', $user->notaria_id)->get();
            $totalUsuarios = $usuariosDeMiNotaria->count();

            // 📈 Métricas de su notaría
            $busquedasEsteMes = Busqueda::whereMonth('created_at', now()->month)->count();
            $busquedasHoy = Busqueda::whereDate('created_at', today())->count();

            // 📊 Verificar límites del plan
            $plan = $miNotaria->plan;
            $limiteUsuarios = $miNotaria->limite_usuarios; // Custom o del plan
            $limiteBusquedasMes = $miNotaria->limite_busquedas_mes; // Custom o del plan

            // 🛠️ Herramientas disponibles para su notaría
            $herramientasActivas = $miNotaria->herramientas_activas;

            return [
                'tipo_usuario' => 'ADMIN_NOTARIA - Solo su notaría',
                'notaria' => $miNotaria->nombre,
                'notaria_id' => $miNotaria->id,
                'busquedas_totales' => $totalBusquedas,
                'busquedas_este_mes' => $busquedasEsteMes,
                'busquedas_hoy' => $busquedasHoy,
                'usuarios_totales' => $totalUsuarios,
                'limite_usuarios' => $limiteUsuarios,
                'limite_busquedas_mes' => $limiteBusquedasMes,
                'herramientas_activas' => $herramientasActivas,
                'plan_actual' => $plan?->nombre,
                'puede_gestionar_usuarios_notaria' => true,
                'puede_ver_otras_notarias' => false,
                'acceso_a_facturacion' => false,
            ];
        }

        return ['error' => 'Solo admin_notaria puede acceder a este endpoint'];
    }

    /**
     * 👤 EJEMPLO 3: USUARIO_NOTARIA (Usuario Regular)
     *
     * Un usuario regular solo ve datos de su notaría y principalmente sus propios datos
     */
    public function usuarioNotariaExample()
    {
        $user = Auth::user();

        // ✅ USUARIO_NOTARIA: Ve datos de su notaría, enfocado en sus propios registros
        if ($user->tipo_cuenta === 'usuario_notaria') {

            // 🔍 Sus propias búsquedas (filtradas por Global Scope + user_id)
            $misBusquedas = Busqueda::where('user_id', $user->id)->get();
            $totalMisBusquedas = $misBusquedas->count();

            // 📊 Algunas búsquedas compartidas de su notaría (según políticas)
            $busquedasCompartidas = Busqueda::where('es_compartida', true)->get(); // Global Scope aplica

            // 📈 Estadísticas personales
            $busquedasEsteMes = Busqueda::where('user_id', $user->id)
                ->whereMonth('created_at', now()->month)
                ->count();

            $busquedasHoy = Busqueda::where('user_id', $user->id)
                ->whereDate('created_at', today())
                ->count();

            // 🏢 Información limitada de su notaría
            $miNotaria = $user->notaria;
            $herramientasDisponibles = $miNotaria->herramientas_activas;

            return [
                'tipo_usuario' => 'USUARIO_NOTARIA - Datos propios + notaría',
                'notaria' => $miNotaria->nombre,
                'mis_busquedas_totales' => $totalMisBusquedas,
                'mis_busquedas_este_mes' => $busquedasEsteMes,
                'mis_busquedas_hoy' => $busquedasHoy,
                'busquedas_compartidas_notaria' => $busquedasCompartidas->count(),
                'herramientas_disponibles' => $herramientasDisponibles,
                'puede_hacer_busquedas' => true,
                'puede_ver_reportes_propios' => true,
                'puede_gestionar_usuarios' => false,
                'puede_ver_otras_notarias' => false,
                'acceso_limitado_a_datos_notaria' => true,
            ];
        }

        return ['error' => 'Solo usuario_notaria puede acceder a este endpoint'];
    }

    /**
     * 👥 EJEMPLO 4: INVITADO (Acceso Muy Limitado)
     *
     * Un invitado tiene acceso muy restringido, principalmente solo lectura
     */
    public function invitadoExample()
    {
        $user = Auth::user();

        // ✅ INVITADO: Acceso muy limitado, solo lectura
        if ($user->tipo_cuenta === 'invitado') {

            // 📋 Solo reportes públicos de su notaría
            // $reportesPublicos = Reporte::where('es_publico', true)->get(); // Global Scope aplica

            // 🏢 Información muy básica de su notaría
            $miNotaria = $user->notaria;

            // 📊 Solo estadísticas muy generales (sin detalles)
            $totalBusquedasNotaria = Busqueda::count(); // Solo cuenta, no puede ver detalles

            return [
                'tipo_usuario' => 'INVITADO - Solo lectura limitada',
                'notaria' => $miNotaria->nombre,
                'estadisticas_generales' => [
                    'busquedas_totales_notaria' => $totalBusquedasNotaria, // Solo números
                ],
                // 'reportes_publicos' => $reportesPublicos->count(),
                'puede_hacer_busquedas' => false,
                'puede_crear_datos' => false,
                'puede_modificar_datos' => false,
                'solo_lectura' => true,
                'acceso_temporal' => true,
            ];
        }

        return ['error' => 'Solo invitado puede acceder a este endpoint'];
    }

    /**
     * 🔍 EJEMPLO PRÁCTICO: Demostración del Global Scope en acción
     *
     * Este método muestra cómo el mismo código se comporta diferente según el tipo de usuario
     */
    public function globalScopeDemo()
    {
        $user = Auth::user();

        // 🎯 EL MISMO CÓDIGO, DIFERENTES RESULTADOS según el usuario autenticado
        $busquedas = Busqueda::all(); // ← Esta línea se comporta diferente para cada tipo de usuario
        $notarias = Notaria::all();   // ← Las notarías no tienen Global Scope (solo super_admin las ve todas)

        $resultados = [
            'usuario_actual' => [
                'nombre' => $user->name,
                'tipo_cuenta' => $user->tipo_cuenta,
                'notaria_id' => $user->notaria_id,
                'notaria_nombre' => $user->notaria?->nombre,
            ],
            'resultados_busqueda' => [
                'total_busquedas' => $busquedas->count(),
                'notarias_ids_en_busquedas' => $busquedas->pluck('notaria_id')->unique()->values(),
            ],
            'explicacion' => $this->explicarComportamientoGlobalScope($user->tipo_cuenta),
        ];

        // 🔬 Agregar detalles técnicos de cómo funciona el scope
        if ($user->tipo_cuenta === 'super_admin') {
            $resultados['sin_global_scope'] = [
                'busquedas_todas_notarias' => Busqueda::withoutGlobalScopes()->count(),
                'notarias_todas' => $notarias->count(),
            ];
        }

        return $resultados;
    }

    /**
     * Explicar cómo se comporta el Global Scope para cada tipo de usuario
     */
    private function explicarComportamientoGlobalScope(string $tipoCuenta): string
    {
        return match ($tipoCuenta) {
            'super_admin' => '🌍 Global Scope NO APLICA - Ve todos los datos de todas las notarías',
            'admin_notaria' => '🏢 Global Scope APLICA - Solo ve datos de su notaría (ID: '.auth()->user()->notaria_id.')',
            'usuario_notaria' => '👤 Global Scope APLICA - Solo ve datos de su notaría (ID: '.auth()->user()->notaria_id.')',
            'invitado' => '👥 Global Scope APLICA - Solo ve datos de su notaría (ID: '.auth()->user()->notaria_id.') con restricciones adicionales',
            default => 'Usuario sin tipo de cuenta definido'
        };
    }

    /**
     * Método auxiliar para calcular facturación mensual (solo para super_admin)
     */
    private function calcularFacturacionMensual(): array
    {
        // Este método solo debería ser accesible por super_admin
        if (Auth::user()->tipo_cuenta !== 'super_admin') {
            return ['error' => 'No autorizado'];
        }

        // Cálculo de ejemplo - en producción sería más complejo
        $suscripcionesActivas = \App\Models\Subscription::activas()->with('plan')->get();

        $facturacionMensual = $suscripcionesActivas->sum(function ($suscripcion) {
            return $suscripcion->ciclo_facturacion === 'mensual'
                ? $suscripcion->precio_pagado
                : $suscripcion->precio_pagado / 12;
        });

        return [
            'suscripciones_activas' => $suscripcionesActivas->count(),
            'facturacion_mensual_estimada' => round($facturacionMensual, 2),
            'moneda' => 'MXN',
        ];
    }
}
