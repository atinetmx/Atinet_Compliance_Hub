<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Plan;
use App\Models\Service;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlanServiceController extends Controller
{
    /**
     * Display services for a plan.
     */
    public function index(Plan $plan): Response
    {
        $plan->load(['services' => function ($query) {
            $query->orderBy('plan_services.priority')
                ->withPivot(['is_included', 'usage_limit', 'extra_price', 'priority']);
        }]);

        // Servicios disponibles que NO están asignados al plan
        $availableServices = Service::where('is_active', true)
            ->whereNotIn('id', $plan->services->pluck('id'))
            ->orderBy('category')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Plans/Services', [
            'plan' => $plan,
            'assignedServices' => $plan->services,
            'availableServices' => $availableServices,
        ]);
    }

    /**
     * Assign a service to a plan.
     */
    public function store(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'is_included' => 'boolean',
            'usage_limit' => 'nullable|integer|min:1',
            'extra_price' => 'nullable|numeric|min:0',
            'priority' => 'nullable|integer|min:0',
        ]);

        // Verificar que el servicio no esté ya asignado
        if ($plan->services()->where('service_id', $validated['service_id'])->exists()) {
            return back()->with('error', 'Este servicio ya está asignado al plan.');
        }

        // Calcular prioridad si no se proporciona
        if (! isset($validated['priority'])) {
            $maxPriority = $plan->services()->max('priority') ?? 0;
            $validated['priority'] = $maxPriority + 1;
        }

        // Asignar servicio al plan
        $plan->services()->attach($validated['service_id'], [
            'is_included' => $validated['is_included'] ?? true,
            'usage_limit' => $validated['usage_limit'] ?? null,
            'extra_price' => $validated['extra_price'] ?? null,
            'priority' => $validated['priority'],
        ]);

        return back()->with('success', 'Servicio asignado exitosamente al plan.');
    }

    /**
     * Update service configuration for a plan.
     */
    public function update(Request $request, Plan $plan, Service $service)
    {
        $validated = $request->validate([
            'is_included' => 'boolean',
            'usage_limit' => 'nullable|integer|min:1',
            'extra_price' => 'nullable|numeric|min:0',
            'priority' => 'nullable|integer|min:0',
        ]);

        // Verificar que el servicio esté asignado al plan
        if (! $plan->services()->where('service_id', $service->id)->exists()) {
            return back()->with('error', 'Este servicio no está asignado al plan.');
        }

        // Actualizar configuración
        $plan->services()->updateExistingPivot($service->id, [
            'is_included' => $validated['is_included'] ?? true,
            'usage_limit' => $validated['usage_limit'] ?? null,
            'extra_price' => $validated['extra_price'] ?? null,
            'priority' => $validated['priority'] ?? null,
        ]);

        return back()->with('success', 'Configuración actualizada exitosamente.');
    }

    /**
     * Remove a service from a plan.
     */
    public function destroy(Plan $plan, Service $service)
    {
        // Verificar que el servicio esté asignado
        if (! $plan->services()->where('service_id', $service->id)->exists()) {
            return back()->with('error', 'Este servicio no está asignado al plan.');
        }

        // Verificar si hay notarías usando este servicio a través del plan
        $notariasUsandoServicio = $plan->notarias()
            ->whereHas('subscripcionActiva', function ($query) {
                $query->where('status', 'activa');
            })
            ->count();

        if ($notariasUsandoServicio > 0) {
            return back()->with('error', "No se puede quitar el servicio. Hay {$notariasUsandoServicio} notarías con suscripción activa usando este plan.");
        }

        // Quitar servicio
        $plan->services()->detach($service->id);

        return back()->with('success', 'Servicio removido exitosamente del plan.');
    }

    /**
     * Reorder services priority for a plan.
     */
    public function reorder(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'services' => 'required|array',
            'services.*.service_id' => 'required|exists:services,id',
            'services.*.priority' => 'required|integer|min:0',
        ]);

        foreach ($validated['services'] as $serviceData) {
            $plan->services()->updateExistingPivot($serviceData['service_id'], [
                'priority' => $serviceData['priority'],
            ]);
        }

        return back()->with('success', 'Orden actualizado exitosamente.');
    }

    /**
     * Bulk assign services to plan.
     */
    public function bulkAssign(Request $request, Plan $plan)
    {
        $validated = $request->validate([
            'service_ids' => 'required|array',
            'service_ids.*' => 'exists:services,id',
            'defaults' => 'nullable|array',
            'defaults.is_included' => 'boolean',
            'defaults.usage_limit' => 'nullable|integer|min:1',
            'defaults.extra_price' => 'nullable|numeric|min:0',
        ]);

        $defaults = $validated['defaults'] ?? [];
        $maxPriority = $plan->services()->max('priority') ?? 0;

        $attachData = [];
        foreach ($validated['service_ids'] as $index => $serviceId) {
            // Solo asignar si no existe
            if (! $plan->services()->where('service_id', $serviceId)->exists()) {
                $attachData[$serviceId] = [
                    'is_included' => $defaults['is_included'] ?? true,
                    'usage_limit' => $defaults['usage_limit'] ?? null,
                    'extra_price' => $defaults['extra_price'] ?? null,
                    'priority' => $maxPriority + $index + 1,
                ];
            }
        }

        if (! empty($attachData)) {
            $plan->services()->attach($attachData);
            $count = count($attachData);

            return back()->with('success', "{$count} servicios asignados exitosamente.");
        }

        return back()->with('info', 'No se asignaron nuevos servicios.');
    }
}
