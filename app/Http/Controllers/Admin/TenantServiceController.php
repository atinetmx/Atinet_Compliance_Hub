<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notaria;
use App\Models\Service;
use App\Models\TenantService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantServiceController extends Controller
{
    /**
     * Display a listing of tenant services.
     * Muestra los servicios disponibles del plan + servicios personalizados
     */
    public function index(Notaria $notaria): Response
    {
        // Cargar el plan con sus servicios
        $notaria->load(['plan.services']);

        // Obtener servicios del plan
        $planServices = $notaria->plan->services->map(function ($service) {
            return [
                'id' => $service->id,
                'code' => $service->code,
                'name' => $service->name,
                'description' => $service->description,
                'category' => $service->category,
                'billing_model' => $service->billing_model,
                'unit_price' => $service->unit_price,
                'is_active' => $service->is_active,
                // Configuración del plan
                'plan_config' => [
                    'is_included' => $service->pivot->is_included,
                    'usage_limit' => $service->pivot->usage_limit,
                    'extra_price' => $service->pivot->extra_price,
                    'priority' => $service->pivot->priority,
                ],
            ];
        });

        // Obtener servicios personalizados de la notaría
        $tenantServices = TenantService::with('service')
            ->where('notaria_id', $notaria->id)
            ->get()
            ->map(function ($ts) {
                return [
                    'id' => $ts->id,
                    'service_id' => $ts->service_id,
                    'is_enabled' => $ts->is_enabled,
                    'custom_limit' => $ts->custom_limit,
                    'custom_price' => $ts->custom_price,
                    'activation_date' => $ts->activation_date?->format('Y-m-d'),
                    'expiration_date' => $ts->expiration_date?->format('Y-m-d'),
                    'notes' => $ts->notes,
                    'service' => [
                        'id' => $ts->service->id,
                        'code' => $ts->service->code,
                        'name' => $ts->service->name,
                        'category' => $ts->service->category,
                    ],
                ];
            });

        return Inertia::render('Admin/Notarias/Services', [
            'notaria' => $notaria,
            'planServices' => $planServices,
            'tenantServices' => $tenantServices,
        ]);
    }

    /**
     * Store a newly created tenant service.
     * Activa/configura un servicio para la notaría
     */
    public function store(Request $request, Notaria $notaria)
    {
        $validated = $request->validate([
            'service_id' => 'required|exists:services,id',
            'is_enabled' => 'boolean',
            'custom_limit' => 'nullable|integer|min:0',
            'custom_price' => 'nullable|numeric|min:0|max:999999.99',
            'activation_date' => 'nullable|date',
            'expiration_date' => 'nullable|date|after_or_equal:activation_date',
            'notes' => 'nullable|string|max:1000',
        ]);

        // Verificar que el servicio pertenece al plan de la notaría
        $serviceInPlan = $notaria->plan->services()->where('services.id', $validated['service_id'])->exists();

        if (! $serviceInPlan) {
            return back()->withErrors([
                'service_id' => 'El servicio no está disponible en el plan de esta notaría.',
            ]);
        }

        // Crear o actualizar configuración del servicio
        $tenantService = TenantService::updateOrCreate(
            [
                'notaria_id' => $notaria->id,
                'service_id' => $validated['service_id'],
            ],
            array_merge($validated, [
                'is_enabled' => $validated['is_enabled'] ?? true,
            ])
        );

        return back()->with('success', 'Servicio configurado exitosamente.');
    }

    /**
     * Update the specified tenant service.
     * Modifica la configuración de un servicio
     */
    public function update(Request $request, Notaria $notaria, TenantService $tenantService)
    {
        // Verificar que el tenant service pertenece a la notaría
        if ($tenantService->notaria_id !== $notaria->id) {
            abort(403, 'Este servicio no pertenece a la notaría especificada.');
        }

        $validated = $request->validate([
            'is_enabled' => 'boolean',
            'custom_limit' => 'nullable|integer|min:0',
            'custom_price' => 'nullable|numeric|min:0|max:999999.99',
            'activation_date' => 'nullable|date',
            'expiration_date' => 'nullable|date|after_or_equal:activation_date',
            'notes' => 'nullable|string|max:1000',
        ]);

        $tenantService->update($validated);

        return back()->with('success', 'Configuración actualizada exitosamente.');
    }

    /**
     * Remove the specified tenant service.
     * Elimina la configuración personalizada (vuelve a configuración del plan)
     */
    public function destroy(Notaria $notaria, TenantService $tenantService)
    {
        // Verificar que el tenant service pertenece a la notaría
        if ($tenantService->notaria_id !== $notaria->id) {
            abort(403, 'Este servicio no pertenece a la notaría especificada.');
        }

        $tenantService->delete();

        return back()->with('success', 'Configuración personalizada eliminada. Se usará la configuración del plan.');
    }

    /**
     * Toggle service enabled status
     */
    public function toggleEnabled(Notaria $notaria, TenantService $tenantService)
    {
        // Verificar que el tenant service pertenece a la notaría
        if ($tenantService->notaria_id !== $notaria->id) {
            abort(403, 'Este servicio no pertenece a la notaría especificada.');
        }

        $tenantService->update([
            'is_enabled' => ! $tenantService->is_enabled,
        ]);

        $status = $tenantService->is_enabled ? 'activado' : 'desactivado';

        return back()->with('success', "Servicio {$status} exitosamente.");
    }
}
