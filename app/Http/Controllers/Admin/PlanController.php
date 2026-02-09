<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StorePlanRequest;
use App\Http\Requests\Admin\UpdatePlanRequest;
use App\Models\Plan;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlanController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Plan::query();

        // Filtro por estado activo/inactivo
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Búsqueda por nombre o descripción
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('nombre', 'like', '%'.$request->search.'%')
                    ->orWhere('descripcion', 'like', '%'.$request->search.'%');
            });
        }

        $plans = $query
            ->withCount(['notarias', 'subscriptions', 'services'])
            ->orderBy('orden')
            ->orderBy('nombre')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Plans/Index', [
            'plans' => $plans,
            'filters' => $request->only(['is_active', 'search']),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $services = \App\Models\Service::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'category', 'billing_model']);

        // Obtener el siguiente orden disponible
        $nextOrden = Plan::max('orden') + 1;

        return Inertia::render('Admin/Plans/Create', [
            'availableServices' => $services,
            'suggestedOrden' => $nextOrden,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StorePlanRequest $request)
    {
        $plan = Plan::create($request->validated());

        return redirect()
            ->route('admin.plans.show', $plan)
            ->with('success', 'Plan creado exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Plan $plan): Response
    {
        $plan->load(['services' => function ($query) {
            $query->withPivot(['is_included', 'usage_limit', 'extra_price', 'priority']);
        }]);

        // Obtener estadísticas del plan
        $stats = [
            'total_notarias' => $plan->notarias()->count(),
            'active_subscriptions' => $plan->subscriptions()->where('status', 'activa')->count(),
            'total_services' => $plan->services()->count(),
            'monthly_revenue' => $plan->subscriptions()
                ->where('status', 'activa')
                ->where('ciclo_facturacion', 'mensual')
                ->count() * $plan->precio_mensual,
            'annual_revenue' => $plan->subscriptions()
                ->where('status', 'activa')
                ->where('ciclo_facturacion', 'anual')
                ->count() * $plan->precio_anual,
        ];

        return Inertia::render('Admin/Plans/Show', [
            'plan' => $plan,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Plan $plan): Response
    {
        $services = \App\Models\Service::where('is_active', true)
            ->orderBy('category')
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'category', 'billing_model']);

        return Inertia::render('Admin/Plans/Edit', [
            'plan' => $plan,
            'availableServices' => $services,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdatePlanRequest $request, Plan $plan)
    {
        $plan->update($request->validated());

        return redirect()
            ->route('admin.plans.show', $plan)
            ->with('success', 'Plan actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Plan $plan)
    {
        // Verificar si hay suscripciones activas
        $activeSubscriptions = $plan->subscriptions()->where('status', 'active')->count();

        if ($activeSubscriptions > 0) {
            return back()->with('error', "No se puede eliminar el plan porque tiene {$activeSubscriptions} suscripciones activas.");
        }

        // Verificar si hay notarías asignadas
        $notariasCount = $plan->notarias()->count();

        if ($notariasCount > 0) {
            return back()->with('error', "No se puede eliminar el plan porque tiene {$notariasCount} notarías asignadas.");
        }

        $plan->delete();

        return redirect()
            ->route('admin.plans.index')
            ->with('success', 'Plan eliminado exitosamente.');
    }

    /**
     * Toggle active status of the plan.
     */
    public function toggleActive(Plan $plan)
    {
        $plan->update(['is_active' => ! $plan->is_active]);

        $status = $plan->is_active ? 'activado' : 'desactivado';

        return back()->with('success', "Plan {$status} exitosamente.");
    }
}
