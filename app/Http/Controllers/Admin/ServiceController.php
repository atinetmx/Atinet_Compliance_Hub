<?php

namespace App\Http\Controllers\Admin;

use App\BillingModel;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreServiceRequest;
use App\Http\Requests\Admin\UpdateServiceRequest;
use App\Models\Service;
use App\ServiceCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ServiceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Service::query();

        // Filtro por categoría
        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        // Filtro por billing model
        if ($request->filled('billing_model')) {
            $query->where('billing_model', $request->billing_model);
        }

        // Filtro por estado activo/inactivo
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        // Búsqueda por nombre o código
        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                    ->orWhere('code', 'like', '%'.$request->search.'%')
                    ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }

        $services = $query
            ->orderBy('category')
            ->orderBy('name')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('Admin/Services/Index', [
            'services' => $services,
            'filters' => $request->only(['category', 'billing_model', 'is_active', 'search']),
            'categories' => $this->getCategoriesOptions(),
            'billingModels' => $this->getBillingModelsOptions(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Admin/Services/Create', [
            'categories' => $this->getCategoriesOptions(),
            'billingModels' => $this->getBillingModelsOptions(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreServiceRequest $request)
    {
        $service = Service::create($request->validated());

        return redirect()
            ->route('admin.services.show', $service)
            ->with('success', 'Servicio creado exitosamente.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Service $service): Response
    {
        $service->load(['plans' => function ($query) {
            $query->withPivot(['is_included', 'usage_limit', 'extra_price', 'priority']);
        }]);

        // Obtener estadísticas de uso del servicio
        $stats = [
            'total_plans' => $service->plans()->count(),
            'active_tenants' => $service->notarias()->where('is_enabled', true)->count(),
            'total_usage_month' => $service->usage()
                ->whereMonth('consumed_at', now()->month)
                ->whereYear('consumed_at', now()->year)
                ->count(),
            'total_revenue_month' => $service->usage()
                ->whereMonth('consumed_at', now()->month)
                ->whereYear('consumed_at', now()->year)
                ->where('billable', true)
                ->sum('cost'),
        ];

        return Inertia::render('Admin/Services/Show', [
            'service' => $service,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Service $service): Response
    {
        return Inertia::render('Admin/Services/Edit', [
            'service' => $service,
            'categories' => $this->getCategoriesOptions(),
            'billingModels' => $this->getBillingModelsOptions(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateServiceRequest $request, Service $service)
    {
        $service->update($request->validated());

        return redirect()
            ->route('admin.services.show', $service)
            ->with('success', 'Servicio actualizado exitosamente.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Service $service)
    {
        // Verificar que el servicio no esté en uso
        if ($service->plans()->exists() || $service->notarias()->exists()) {
            return back()->with('error', 'No se puede eliminar un servicio que está asignado a planes o notarías. Desactívalo en su lugar.');
        }

        $service->delete();

        return redirect()
            ->route('admin.services.index')
            ->with('success', 'Servicio eliminado exitosamente.');
    }

    /**
     * Toggle service active status.
     */
    public function toggleActive(Service $service)
    {
        $service->update(['is_active' => ! $service->is_active]);

        $message = $service->is_active
            ? 'Servicio activado exitosamente.'
            : 'Servicio desactivado exitosamente.';

        return back()->with('success', $message);
    }

    /**
     * Get categories options for select.
     */
    private function getCategoriesOptions(): array
    {
        return collect(ServiceCategory::cases())
            ->map(fn ($case) => [
                'value' => $case->value,
                'label' => $this->translateCategory($case->value),
            ])->toArray();
    }

    /**
     * Get billing models options for select.
     */
    private function getBillingModelsOptions(): array
    {
        return collect(BillingModel::cases())
            ->map(fn ($case) => [
                'value' => $case->value,
                'label' => $this->translateBillingModel($case->value),
            ])->toArray();
    }

    /**
     * Translate category to Spanish.
     */
    private function translateCategory(string $category): string
    {
        return match ($category) {
            'consulta' => 'Consultas / Búsquedas',
            'api' => 'APIs y Conectores',
            'sistema' => 'Sistema Base',
            'analisis' => 'Análisis y Reportes',
            'storage' => 'Almacenamiento',
            'integration' => 'Integraciones',
            default => $category,
        };
    }

    /**
     * Translate billing model to Spanish.
     */
    private function translateBillingModel(string $model): string
    {
        return match ($model) {
            'included' => 'Incluido sin límite',
            'limited' => 'Incluido con límite',
            'per_use' => 'Pago por uso',
            'unlimited' => 'Ilimitado',
            default => $model,
        };
    }
}
