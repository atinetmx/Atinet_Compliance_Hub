<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Notaria;
use App\Models\Service;
use App\Models\ServiceUsage;
use App\Services\ServiceAccessManager;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

/**
 * Controlador para reportes y estadísticas de uso de servicios
 */
class ReportsController extends Controller
{
    public function __construct(
        protected ServiceAccessManager $accessManager
    ) {}

    /**
     * Dashboard principal de reportes
     */
    public function index(Request $request)
    {
        $period = $request->input('period', 'month'); // month, week, year
        $notariaId = $request->input('notaria_id');

        $stats = $this->getGeneralStats($period, $notariaId);

        return Inertia::render('Admin/Reports/Index', [
            'stats' => $stats,
            'period' => $period,
            'notarias' => Notaria::select('id', 'nombre', 'numero_notaria')
                ->where('activa', true)
                ->orderBy('nombre')
                ->get(),
        ]);
    }

    /**
     * Estadísticas de uso por servicio
     */
    public function serviceUsage(Request $request)
    {
        $serviceCode = $request->input('service_code');
        $period = $request->input('period', 'month');
        $notariaId = $request->input('notaria_id');

        $query = ServiceUsage::with(['service', 'notaria', 'user'])
            ->when($serviceCode, fn($q) => $q->whereHas('service', fn($sq) => $sq->where('code', $serviceCode)))
            ->when($notariaId, fn($q) => $q->where('notaria_id', $notariaId))
            ->when($period === 'month', fn($q) => $q->whereMonth('consumed_at', now()->month))
            ->when($period === 'week', fn($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
            ->when($period === 'year', fn($q) => $q->whereYear('consumed_at', now()->year))
            ->orderBy('consumed_at', 'desc');

        $usage = $query->paginate(50);

        return Inertia::render('Admin/Reports/ServiceUsage', [
            'usage' => $usage,
            'services' => Service::select('id', 'code', 'name')->where('is_active', true)->get(),
            'notarias' => Notaria::select('id', 'nombre')->where('activa', true)->get(),
        ]);
    }

    /**
     * Estadísticas por notaría
     */
    public function notariaStats(Notaria $notaria)
    {
        $services = $this->accessManager->getAvailableServices($notaria);

        $monthlyUsage = ServiceUsage::where('notaria_id', $notaria->id)
            ->whereMonth('consumed_at', now()->month)
            ->whereYear('consumed_at', now()->year)
            ->selectRaw('service_id, SUM(quantity) as total_quantity, SUM(cost) as total_cost, COUNT(*) as total_requests')
            ->groupBy('service_id')
            ->with('service:id,code,name')
            ->get();

        return Inertia::render('Admin/Reports/NotariaStats', [
            'notaria' => $notaria->load(['subscripciones' => fn($q) => $q->latest()->with('plan')]),
            'services' => $services,
            'monthlyUsage' => $monthlyUsage,
        ]);
    }

    /**
     * Comparativa entre notarías
     */
    public function notariasComparison(Request $request)
    {
        $period = $request->input('period', 'month');
        $serviceCode = $request->input('service_code');

        $notarias = Notaria::where('activa', true)
            ->withCount([
                'serviceUsages' => function ($query) use ($period, $serviceCode) {
                    $this->applyPeriodFilter($query, $period);
                    if ($serviceCode) {
                        $query->whereHas('service', fn($q) => $q->where('code', $serviceCode));
                    }
                }
            ])
            ->withSum([
                'serviceUsages as total_cost' => function ($query) use ($period, $serviceCode) {
                    $this->applyPeriodFilter($query, $period);
                    if ($serviceCode) {
                        $query->whereHas('service', fn($q) => $q->where('code', $serviceCode));
                    }
                }
            ], 'cost')
            ->withSum([
                'serviceUsages as total_quantity' => function ($query) use ($period, $serviceCode) {
                    $this->applyPeriodFilter($query, $period);
                    if ($serviceCode) {
                        $query->whereHas('service', fn($q) => $q->where('code', $serviceCode));
                    }
                }
            ], 'quantity')
            ->orderBy('service_usages_count', 'desc')
            ->get();

        return response()->json([
            'notarias' => $notarias,
            'period' => $period,
            'service_code' => $serviceCode,
        ]);
    }

    /**
     * Tendencias de uso (histórico)
     */
    public function usageTrends(Request $request)
    {
        $months = $request->input('months', 6); // Últimos 6 meses por defecto
        $notariaId = $request->input('notaria_id');
        $serviceCode = $request->input('service_code');

        $startDate = now()->subMonths($months)->startOfMonth();

        $trends = ServiceUsage::selectRaw("
                DATE_FORMAT(consumed_at, '%Y-%m') as month,
                service_id,
                COUNT(*) as total_requests,
                SUM(quantity) as total_quantity,
                SUM(cost) as total_cost
            ")
            ->where('consumed_at', '>=', $startDate)
            ->when($notariaId, fn($q) => $q->where('notaria_id', $notariaId))
            ->when($serviceCode, fn($q) => $q->whereHas('service', fn($sq) => $sq->where('code', $serviceCode)))
            ->groupBy('month', 'service_id')
            ->orderBy('month')
            ->with('service:id,code,name')
            ->get()
            ->groupBy('month');

        return response()->json([
            'trends' => $trends,
            'months' => $months,
            'start_date' => $startDate->format('Y-m-d'),
        ]);
    }

    /**
     * Top servicios más utilizados
     */
    public function topServices(Request $request)
    {
        $period = $request->input('period', 'month');
        $limit = $request->input('limit', 10);

        $topServices = ServiceUsage::selectRaw('
                service_id,
                COUNT(*) as total_requests,
                SUM(quantity) as total_quantity,
                SUM(cost) as total_cost,
                COUNT(DISTINCT notaria_id) as total_notarias
            ')
            ->when($period === 'month', fn($q) => $q->whereMonth('consumed_at', now()->month))
            ->when($period === 'week', fn($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
            ->when($period === 'year', fn($q) => $q->whereYear('consumed_at', now()->year))
            ->groupBy('service_id')
            ->orderBy('total_requests', 'desc')
            ->limit($limit)
            ->with('service:id,code,name,category,billing_model')
            ->get();

        return response()->json([
            'top_services' => $topServices,
            'period' => $period,
        ]);
    }

    /**
     * Notarías cercanas a límite
     */
    public function notariasNearLimit(Request $request)
    {
        $threshold = $request->input('threshold', 80); // 80% por defecto

        $notarias = Notaria::where('activa', true)->get();
        $nearLimit = [];

        foreach ($notarias as $notaria) {
            $services = $this->accessManager->getAvailableServices($notaria);

            foreach ($services as $service) {
                if (!$service['is_unlimited'] && $service['usage_percentage'] >= $threshold) {
                    $nearLimit[] = [
                        'notaria' => $notaria->only(['id', 'nombre', 'numero_notaria']),
                        'service' => $service,
                    ];
                }
            }
        }

        return response()->json([
            'near_limit' => $nearLimit,
            'threshold' => $threshold,
        ]);
    }

    /**
     * Exportar reporte a CSV
     */
    public function export(Request $request)
    {
        $type = $request->input('type', 'usage'); // usage, notarias, services
        $period = $request->input('period', 'month');

        $filename = "reporte_{$type}_" . now()->format('Ymd_His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($type, $period) {
            $file = fopen('php://output', 'w');

            switch ($type) {
                case 'usage':
                    $this->exportUsageReport($file, $period);
                    break;
                case 'notarias':
                    $this->exportNotariasReport($file, $period);
                    break;
                case 'services':
                    $this->exportServicesReport($file, $period);
                    break;
            }

            fclose($file);
        };

        return response()->stream($callback, 200, $headers);
    }

    // ========== MÉTODOS PRIVADOS ==========

    /**
     * Obtener estadísticas generales
     */
    protected function getGeneralStats(string $period, ?int $notariaId = null): array
    {
        $query = ServiceUsage::query();
        $this->applyPeriodFilter($query, $period);

        if ($notariaId) {
            $query->where('notaria_id', $notariaId);
        }

        return [
            'total_requests' => (clone $query)->count(),
            'total_quantity' => (clone $query)->sum('quantity') ?? 0,
            'total_cost' => (clone $query)->sum('cost') ?? 0,
            'unique_notarias' => (clone $query)->distinct('notaria_id')->count('notaria_id'),
            'unique_services' => (clone $query)->distinct('service_id')->count('service_id'),
            'avg_cost_per_request' => (clone $query)->avg('cost') ?? 0,
        ];
    }

    /**
     * Aplicar filtro de período a query
     */
    protected function applyPeriodFilter($query, string $period): void
    {
        match ($period) {
            'week' => $query->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]),
            'month' => $query->whereMonth('consumed_at', now()->month)->whereYear('consumed_at', now()->year),
            'year' => $query->whereYear('consumed_at', now()->year),
            default => null,
        };
    }

    /**
     * Exportar reporte de uso
     */
    protected function exportUsageReport($file, string $period): void
    {
        fputcsv($file, ['Fecha', 'Notaría', 'Servicio', 'Usuario', 'Cantidad', 'Costo']);

        ServiceUsage::with(['notaria:id,nombre', 'service:id,name', 'user:id,name'])
            ->when($period === 'month', fn($q) => $q->whereMonth('consumed_at', now()->month))
            ->when($period === 'week', fn($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
            ->when($period === 'year', fn($q) => $q->whereYear('consumed_at', now()->year))
            ->orderBy('consumed_at', 'desc')
            ->chunk(1000, function ($usages) use ($file) {
                foreach ($usages as $usage) {
                    fputcsv($file, [
                        $usage->consumed_at->format('Y-m-d H:i:s'),
                        $usage->notaria->nombre,
                        $usage->service->name,
                        $usage->user->name,
                        $usage->quantity,
                        $usage->cost,
                    ]);
                }
            });
    }

    /**
     * Exportar reporte de notarías
     */
    protected function exportNotariasReport($file, string $period): void
    {
        fputcsv($file, ['Notaría', 'Total Solicitudes', 'Total Cantidad', 'Total Costo']);

        Notaria::withCount([
                'serviceUsages' => fn($q) => $this->applyPeriodFilter($q, $period)
            ])
            ->withSum([
                'serviceUsages as total_quantity' => fn($q) => $this->applyPeriodFilter($q, $period)
            ], 'quantity')
            ->withSum([
                'serviceUsages as total_cost' => fn($q) => $this->applyPeriodFilter($q, $period)
            ], 'cost')
            ->where('activa', true)
            ->chunk(100, function ($notarias) use ($file) {
                foreach ($notarias as $notaria) {
                    fputcsv($file, [
                        $notaria->nombre,
                        $notaria->service_usages_count ?? 0,
                        $notaria->total_quantity ?? 0,
                        $notaria->total_cost ?? 0,
                    ]);
                }
            });
    }

    /**
     * Exportar reporte de servicios
     */
    protected function exportServicesReport($file, string $period): void
    {
        fputcsv($file, ['Servicio', 'Total Solicitudes', 'Total Cantidad', 'Total Costo', 'Notarías Únicas']);

        Service::withCount([
                'serviceUsages' => fn($q) => $this->applyPeriodFilter($q, $period)
            ])
            ->withSum([
                'serviceUsages as total_quantity' => fn($q) => $this->applyPeriodFilter($q, $period)
            ], 'quantity')
            ->withSum([
                'serviceUsages as total_cost' => fn($q) => $this->applyPeriodFilter($q, $period)
            ], 'cost')
            ->where('is_active', true)
            ->chunk(100, function ($services) use ($file, $period) {
                foreach ($services as $service) {
                    $uniqueNotarias = ServiceUsage::where('service_id', $service->id)
                        ->when($period === 'month', fn($q) => $q->whereMonth('consumed_at', now()->month))
                        ->when($period === 'week', fn($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
                        ->when($period === 'year', fn($q) => $q->whereYear('consumed_at', now()->year))
                        ->distinct('notaria_id')
                        ->count('notaria_id');

                    fputcsv($file, [
                        $service->name,
                        $service->service_usages_count ?? 0,
                        $service->total_quantity ?? 0,
                        $service->total_cost ?? 0,
                        $uniqueNotarias,
                    ]);
                }
            });
    }
}
