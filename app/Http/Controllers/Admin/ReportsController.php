<?php

namespace App\Http\Controllers\Admin;

use App\Exports\NotariasReportExport;
use App\Exports\ServicesReportExport;
use App\Exports\UsageReportExport;
use App\Http\Controllers\Controller;
use App\Models\Notaria;
use App\Models\Service;
use App\Models\ServiceUsage;
use App\Services\ServiceAccessManager;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Maatwebsite\Excel\Facades\Excel;

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
        $categoryStats = $this->getCategoryStats($period, $notariaId);
        $billingModelStats = $this->getBillingModelStats($period, $notariaId);

        return Inertia::render('Admin/Reports/Index', [
            'stats' => $stats,
            'categoryStats' => $categoryStats,
            'billingModelStats' => $billingModelStats,
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

        $query = ServiceUsage::with(['service:id,code,name,category', 'notaria:id,nombre,numero_notaria', 'user:id,name'])
            ->when($serviceCode, fn ($q) => $q->whereHas('service', fn ($sq) => $sq->where('code', $serviceCode)))
            ->when($notariaId, fn ($q) => $q->where('notaria_id', $notariaId))
            ->when($period === 'month', fn ($q) => $q->whereMonth('consumed_at', now()->month)->whereYear('consumed_at', now()->year))
            ->when($period === 'week', fn ($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
            ->when($period === 'year', fn ($q) => $q->whereYear('consumed_at', now()->year))
            ->orderBy('consumed_at', 'desc');

        $usage = $query->paginate(50);

        // Obtener tendencia de últimos 7 días por servicio (para sparklines)
        $sparklineData = ServiceUsage::selectRaw('
                service_id,
                DATE(consumed_at) as date,
                COUNT(*) as count
            ')
            ->whereBetween('consumed_at', [now()->subDays(6)->startOfDay(), now()->endOfDay()])
            ->groupBy('service_id', 'date')
            ->orderBy('date')
            ->get()
            ->groupBy('service_id')
            ->map(function ($serviceData) {
                // Crear array con todos los días (rellenar con 0 si no hay datos)
                $last7Days = collect(range(6, 0))->map(fn ($daysAgo) => now()->subDays($daysAgo)->format('Y-m-d'));

                return $last7Days->map(function ($date) use ($serviceData) {
                    $dayData = $serviceData->firstWhere('date', $date);

                    return $dayData ? (int) $dayData->count : 0;
                })->values();
            });

        return Inertia::render('Admin/Reports/ServiceUsage', [
            'usage' => $usage,
            'sparklineData' => $sparklineData,
            'services' => Service::select('id', 'code', 'name')->where('is_active', true)->orderBy('name')->get(),
            'notarias' => Notaria::select('id', 'nombre', 'numero_notaria')->where('activa', true)->orderBy('nombre')->get(),
            'filters' => [
                'service_code' => $serviceCode,
                'period' => $period,
                'notaria_id' => $notariaId,
            ],
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
            'notaria' => $notaria->load(['subscripciones' => fn ($q) => $q->latest()->with('plan')]),
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
                        $query->whereHas('service', fn ($q) => $q->where('code', $serviceCode));
                    }
                },
            ])
            ->withSum([
                'serviceUsages as total_cost' => function ($query) use ($period, $serviceCode) {
                    $this->applyPeriodFilter($query, $period);
                    if ($serviceCode) {
                        $query->whereHas('service', fn ($q) => $q->where('code', $serviceCode));
                    }
                },
            ], 'cost')
            ->withSum([
                'serviceUsages as total_quantity' => function ($query) use ($period, $serviceCode) {
                    $this->applyPeriodFilter($query, $period);
                    if ($serviceCode) {
                        $query->whereHas('service', fn ($q) => $q->where('code', $serviceCode));
                    }
                },
            ], 'quantity')
            ->orderBy('service_usages_count', 'desc')
            ->get();

        $services = Service::where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'code', 'name', 'category']);

        return Inertia::render('Admin/Reports/NotariasComparison', [
            'notarias' => $notarias,
            'services' => $services,
            'filters' => [
                'period' => $period,
                'service_code' => $serviceCode,
            ],
        ]);
    }

    /**
     * Tendencias de uso (histórico)
     */
    public function usageTrends(Request $request)
    {
        // ============================================================
        // � GRANULARIDAD DINÁMICA - Carga Bajo Demanda
        // ============================================================
        // Vista inicial: 'monthly' (solo 6 puntos para 6 meses)
        // Zoom medio: 'weekly' (carga semanas del rango visible)
        // Zoom cercano: 'daily' (carga días del rango visible)
        // ============================================================
        $granularity = $request->input('granularity', 'monthly');
        $months = (int) $request->input('months', 6);
        $notariaId = $request->input('notaria_id');
        $serviceCode = $request->input('service_code');
        $metric = $request->input('metric', 'requests');

        // Rango de fechas (puede ser específico para zoom o general)
        $dateFrom = $request->input('date_from')
            ? \Carbon\Carbon::parse($request->input('date_from'))
            : now()->subMonths($months)->startOfMonth();
        $dateTo = $request->input('date_to')
            ? \Carbon\Carbon::parse($request->input('date_to'))
            : now();

        // ============================================================
        // 📅 SQL DINÁMICO según granularidad
        // ============================================================
        $periodFormat = match ($granularity) {
            'daily' => 'DATE(consumed_at)',
            'weekly' => "DATE_FORMAT(consumed_at, '%Y-W%U')",
            default => "DATE_FORMAT(consumed_at, '%Y-%m')", // monthly
        };

        $rawTrends = ServiceUsage::selectRaw("
                {$periodFormat} as period,
                service_id,
                COUNT(*) as total_requests,
                SUM(quantity) as total_quantity,
                SUM(cost) as total_cost
            ")
            ->whereBetween('consumed_at', [$dateFrom, $dateTo])
            ->when($notariaId, fn ($q) => $q->where('notaria_id', $notariaId))
            ->when($serviceCode, fn ($q) => $q->whereHas('service', fn ($sq) => $sq->where('code', $serviceCode)))
            ->groupBy('period', 'service_id')
            ->orderBy('period')
            ->with('service:id,code,name,category')
            ->get();

        // ============================================================
        // 📅 OBTENER PERÍODOS ÚNICOS (solo los que tienen datos)
        // ============================================================
        // No generamos todos los períodos vacíos - solo mostramos los que tienen datos
        $allPeriods = $rawTrends->pluck('period')->unique()->sort()->values();

        // Obtener servicios únicos
        $services = $rawTrends->pluck('service')->unique('id')->values()->map(function ($service) {
            return [
                'id' => $service->id,
                'code' => $service->code,
                'name' => $service->name,
                'category' => $service->category,
            ];
        });

        // Agrupar por período
        $groupedByPeriod = $rawTrends->groupBy('period');

        // Transformar datos: [{ period: '2025-10', service_1: 10, service_2: 20 }]
        $trends = $allPeriods->map(function ($period) use ($groupedByPeriod, $metric) {
            $periodData = ['period' => $period];
            $periodRecords = $groupedByPeriod->get($period, collect());

            foreach ($periodRecords as $record) {
                $value = match ($metric) {
                    'cost' => (float) $record->total_cost,
                    'quantity' => (int) $record->total_quantity,
                    default => (int) $record->total_requests,
                };
                $periodData["service_{$record->service_id}"] = $value;
            }

            return $periodData;
        })->values();

        // Calcular totales y estadísticas
        $totals = [
            'total_requests' => (int) $rawTrends->sum('total_requests'),
            'total_quantity' => (int) $rawTrends->sum('total_quantity'),
            'total_cost' => (float) $rawTrends->sum('total_cost'),
        ];

        $periodCount = $allPeriods->count();
        $averages = [
            'avg_requests' => $periodCount > 0 ? round($totals['total_requests'] / $periodCount, 2) : 0,
            'avg_quantity' => $periodCount > 0 ? round($totals['total_quantity'] / $periodCount, 2) : 0,
            'avg_cost' => $periodCount > 0 ? round($totals['total_cost'] / $periodCount, 2) : 0,
        ];

        // Obtener período pico
        $peakPeriod = $rawTrends->groupBy('period')->map(function ($records, $period) use ($metric) {
            $value = match ($metric) {
                'cost' => $records->sum('total_cost'),
                'quantity' => $records->sum('total_quantity'),
                default => $records->sum('total_requests'),
            };

            return ['period' => $period, 'value' => $value];
        })->sortByDesc('value')->first();

        // Obtener notarías para filtro
        $notarias = Notaria::select('id', 'nombre as name', 'numero_notaria as number')
            ->orderBy('numero_notaria')
            ->get();

        // Obtener servicios para filtro
        $allServices = Service::select('id', 'code', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/Reports/UsageTrends', [
            'trends' => $trends,
            'services' => $services,
            'totals' => $totals,
            'averages' => $averages,
            'peakPeriod' => $peakPeriod,
            'granularity' => $granularity,
            'notarias' => $notarias,
            'allServices' => $allServices,
            'filters' => [
                'months' => $months,
                'notaria_id' => $notariaId,
                'service_code' => $serviceCode,
                'metric' => $metric,
                'date_from' => $dateFrom->format('Y-m-d'),
                'date_to' => $dateTo->format('Y-m-d'),
            ],
        ]);
    }

    /**
     * Top servicios más utilizados
     */
    public function topServices(Request $request)
    {
        $period = $request->input('period', 'month');
        $limit = $request->input('limit', 10);
        $sortBy = $request->input('sort_by', 'requests'); // requests, cost, quantity

        $query = ServiceUsage::selectRaw('
                service_id,
                COUNT(*) as total_requests,
                SUM(quantity) as total_quantity,
                SUM(cost) as total_cost,
                COUNT(DISTINCT notaria_id) as total_notarias
            ')
            ->when($period === 'month', fn ($q) => $q->whereMonth('consumed_at', now()->month)->whereYear('consumed_at', now()->year))
            ->when($period === 'week', fn ($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
            ->when($period === 'year', fn ($q) => $q->whereYear('consumed_at', now()->year))
            ->groupBy('service_id');

        // Aplicar ordenamiento según el criterio seleccionado
        $orderColumn = match ($sortBy) {
            'cost' => 'total_cost',
            'quantity' => 'total_quantity',
            default => 'total_requests',
        };

        $topServices = $query->orderBy($orderColumn, 'desc')
            ->limit($limit)
            ->with('service:id,code,name,category,billing_model')
            ->get()
            ->map(function ($item) {
                return [
                    'service_id' => $item->service_id,
                    'service_code' => $item->service->code,
                    'service_name' => $item->service->name,
                    'service_category' => $item->service->category,
                    'billing_model' => $item->service->billing_model,
                    'total_requests' => (int) $item->total_requests,
                    'total_quantity' => (int) $item->total_quantity,
                    'total_cost' => (float) $item->total_cost,
                    'total_notarias' => (int) $item->total_notarias,
                ];
            });

        // Calcular totales generales del período
        $totals = ServiceUsage::selectRaw('
                COUNT(*) as total_requests,
                SUM(quantity) as total_quantity,
                SUM(cost) as total_cost,
                COUNT(DISTINCT service_id) as unique_services
            ')
            ->when($period === 'month', fn ($q) => $q->whereMonth('consumed_at', now()->month)->whereYear('consumed_at', now()->year))
            ->when($period === 'week', fn ($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
            ->when($period === 'year', fn ($q) => $q->whereYear('consumed_at', now()->year))
            ->first();

        return Inertia::render('Admin/Reports/TopServices', [
            'topServices' => $topServices,
            'totals' => [
                'total_requests' => (int) ($totals->total_requests ?? 0),
                'total_quantity' => (int) ($totals->total_quantity ?? 0),
                'total_cost' => (float) ($totals->total_cost ?? 0),
                'unique_services' => (int) ($totals->unique_services ?? 0),
            ],
            'filters' => [
                'period' => $period,
                'limit' => $limit,
                'sort_by' => $sortBy,
            ],
        ]);
    }

    /**
     * Notarías cercanas a límite
     */
    public function notariasNearLimit(Request $request)
    {
        $threshold = $request->input('threshold', 80); // 80% por defecto

        $notarias = Notaria::where('activa', true)
            ->with('subscripcionActiva.plan')
            ->get();
        $nearLimit = [];

        foreach ($notarias as $notaria) {
            // 1. Verificar límites de uso de servicios
            $services = $this->accessManager->getAvailableServices($notaria);

            foreach ($services as $service) {
                if (! $service['is_unlimited'] && $service['usage_percentage'] >= $threshold) {
                    $nearLimit[] = [
                        'notaria' => $notaria->only(['id', 'nombre', 'numero_notaria']),
                        'service' => $service,
                        'alert_type' => 'usage', // Alerta por uso
                    ];
                }
            }

            // 2. Verificar fecha de expiración de suscripción (alerta si quedan <= 7 días)
            $subscription = $notaria->subscripcionActiva;
            if ($subscription && $subscription->fecha_vencimiento) {
                $daysRemaining = now()->diffInDays($subscription->fecha_vencimiento, false);

                // Alertar si quedan 7 días o menos
                if ($daysRemaining >= 0 && $daysRemaining <= 7) {
                    // Calcular porcentaje real basado en tiempo transcurrido
                    $totalDays = $subscription->fecha_inicio->diffInDays($subscription->fecha_vencimiento);
                    $elapsedDays = $subscription->fecha_inicio->diffInDays(now());
                    $timePercentage = $totalDays > 0 ? min(100, round(($elapsedDays / $totalDays) * 100, 2)) : 100;

                    $nearLimit[] = [
                        'notaria' => $notaria->only(['id', 'nombre', 'numero_notaria']),
                        'service' => [
                            'name' => 'Suscripción '.$subscription->plan->name,
                            'code' => 'SUBSCRIPTION',
                            'usage_count' => 0,
                            'usage_limit' => 0,
                            'used' => 0,
                            'limit' => 0,
                            'remaining' => 0,
                            'usage_percentage' => $timePercentage,
                            'is_unlimited' => false,
                        ],
                        'alert_type' => 'subscription', // Alerta por vencimiento
                        'days_remaining' => (int) $daysRemaining,
                        'expiration_date' => $subscription->fecha_vencimiento->format('Y-m-d'),
                        'subscription_status' => $subscription->status,
                        'total_days' => $totalDays,
                        'elapsed_days' => $elapsedDays,
                    ];
                }
            }
        }

        return Inertia::render('Admin/Reports/NotariasNearLimit', [
            'near_limit' => $nearLimit,
            'threshold' => $threshold,
        ]);
    }

    /**
     * Exportar reporte a Excel
     */
    public function export(Request $request)
    {
        $request->validate([
            'type' => 'required|in:usage,notarias,services',
            'period' => 'required|in:week,month,year',
            'notaria_id' => 'nullable|exists:notarias,id',
        ]);

        $type = $request->input('type');
        $period = $request->input('period');
        $notariaId = $request->input('notaria_id');

        $date = now()->format('Y-m-d_His');
        $filename = "reporte_{$type}_{$date}.xlsx";

        return match ($type) {
            'usage' => Excel::download(
                new UsageReportExport(
                    $this->getUsageData($period, $notariaId),
                    $period,
                    $notariaId ? Notaria::find($notariaId)?->nombre : null
                ),
                $filename
            ),
            'notarias' => Excel::download(
                new NotariasReportExport(
                    $this->getNotariasData($period),
                    $period
                ),
                $filename
            ),
            'services' => Excel::download(
                new ServicesReportExport(
                    $this->getServicesData($period),
                    $period
                ),
                $filename
            ),
        };
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

        // Contar notarías con suscripción activa (no solo las que tienen uso)
        $activeNotarias = Notaria::whereHas('subscripcionActiva')
            ->where('activa', true)
            ->count();

        return [
            'total_requests' => (clone $query)->count(),
            'total_quantity' => (int) ((clone $query)->sum('quantity') ?? 0),
            'total_cost' => (float) ((clone $query)->sum('cost') ?? 0),
            'active_notarias' => $activeNotarias,
            'unique_services' => (clone $query)->distinct('service_id')->count('service_id'),
            'avg_cost_per_request' => (float) ((clone $query)->avg('cost') ?? 0),
        ];
    }

    /**
     * Obtener estadísticas por categoría de servicio
     */
    protected function getCategoryStats(string $period, ?int $notariaId = null): array
    {
        $query = ServiceUsage::with('service:id,name,code,category,billing_model')
            ->when($notariaId, fn ($q) => $q->where('notaria_id', $notariaId));

        $this->applyPeriodFilter($query, $period);

        $usages = $query->get();

        if ($usages->isEmpty()) {
            return [];
        }

        $total = $usages->count();

        return $usages->groupBy('service.category')
            ->map(function ($categoryUsages, $category) use ($total) {
                $count = $categoryUsages->count();

                return [
                    'category' => $category,
                    'label' => $this->getCategoryLabel($category),
                    'icon' => $this->getCategoryIcon($category),
                    'total_requests' => $count,
                    'percentage' => $total > 0 ? round(($count / $total) * 100, 1) : 0,
                    'total_cost' => round($categoryUsages->sum('cost'), 2),
                    'total_quantity' => $categoryUsages->sum('quantity'),
                    'unique_notarias' => $categoryUsages->pluck('notaria_id')->unique()->count(),
                    'services_count' => $categoryUsages->pluck('service_id')->unique()->count(),
                ];
            })
            ->sortByDesc('total_requests')
            ->values()
            ->toArray();
    }

    /**
     * Obtener estadísticas por modelo de facturación
     */
    protected function getBillingModelStats(string $period, ?int $notariaId = null): array
    {
        $query = ServiceUsage::with('service:id,name,code,billing_model,unit_price')
            ->when($notariaId, fn ($q) => $q->where('notaria_id', $notariaId));

        $this->applyPeriodFilter($query, $period);

        $usages = $query->get();

        if ($usages->isEmpty()) {
            return [];
        }

        return $usages->groupBy('service.billing_model')
            ->map(function ($modelUsages, $model) {
                $stats = [
                    'billing_model' => $model,
                    'label' => $this->getBillingModelLabel($model),
                    'icon' => $this->getBillingModelIcon($model),
                    'total_requests' => $modelUsages->count(),
                    'total_cost' => round($modelUsages->sum('cost'), 2),
                    'total_quantity' => $modelUsages->sum('quantity'),
                    'services' => $modelUsages->groupBy('service_id')->map(function ($serviceUsages) {
                        $service = $serviceUsages->first()->service;

                        return [
                            'name' => $service->name,
                            'code' => $service->code,
                            'requests' => $serviceUsages->count(),
                            'cost' => round($serviceUsages->sum('cost'), 2),
                        ];
                    })->values()->toArray(),
                ];

                // Para servicios LIMITED, calcular porcentaje de uso
                if ($model === 'limited') {
                    $stats['near_limit'] = $this->checkLimitedServices($modelUsages);
                }

                return $stats;
            })
            ->sortByDesc('total_cost')
            ->values()
            ->toArray();
    }

    /**
     * Verificar servicios LIMITED cerca del límite
     */
    protected function checkLimitedServices($usages): array
    {
        $nearLimit = [];

        foreach ($usages->groupBy('notaria_id') as $notariaId => $notariaUsages) {
            $notaria = Notaria::find($notariaId);
            if (! $notaria) {
                continue;
            }

            foreach ($notariaUsages->groupBy('service_id') as $serviceId => $serviceUsages) {
                $service = $serviceUsages->first()->service;
                if (! $service) {
                    continue;
                }

                // Obtener estadísticas de uso con el AccessManager
                $usageStats = $this->accessManager->getUsageStats($notaria, $service->code);

                if (isset($usageStats['usage_percentage']) && $usageStats['usage_percentage'] >= 60) {
                    $nearLimit[] = [
                        'notaria_id' => $notariaId,
                        'notaria_nombre' => $notaria->nombre,
                        'service_name' => $service->name,
                        'service_code' => $service->code,
                        'usage_percentage' => $usageStats['usage_percentage'],
                        'used' => $usageStats['used'] ?? 0,
                        'limit' => $usageStats['limit'] ?? 0,
                        'remaining' => $usageStats['remaining'] ?? 0,
                        'alert_level' => $usageStats['usage_percentage'] >= 80 ? 'critical' : 'warning',
                    ];
                }
            }
        }

        return $nearLimit;
    }

    /**
     * Obtener etiqueta legible para categoría
     */
    protected function getCategoryLabel(string $category): string
    {
        return match ($category) {
            'consulta' => 'Consulta',
            'api' => 'API',
            'sistema' => 'Sistema',
            'analisis' => 'Análisis',
            'storage' => 'Almacenamiento',
            'integration' => 'Integración',
            default => ucfirst($category),
        };
    }

    /**
     * Obtener icono emoji para categoría
     */
    protected function getCategoryIcon(string $category): string
    {
        return match ($category) {
            'consulta' => '🔍',
            'api' => '🔌',
            'sistema' => '⚙️',
            'analisis' => '📊',
            'storage' => '💾',
            'integration' => '🔗',
            default => '📦',
        };
    }

    /**
     * Obtener etiqueta legible para modelo de facturación
     */
    protected function getBillingModelLabel(string $model): string
    {
        return match ($model) {
            'included' => 'Incluido',
            'limited' => 'Con Límite',
            'per_use' => 'Por Uso',
            'unlimited' => 'Ilimitado',
            default => ucfirst($model),
        };
    }

    /**
     * Obtener icono emoji para modelo de facturación
     */
    protected function getBillingModelIcon(string $model): string
    {
        return match ($model) {
            'included' => '✅',
            'limited' => '🔢',
            'per_use' => '💰',
            'unlimited' => '♾️',
            default => '❓',
        };
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
     * Obtener datos de uso para exportación
     */
    protected function getUsageData(string $period, ?int $notariaId = null): array
    {
        $query = ServiceUsage::with(['notaria:id,nombre', 'service:id,name', 'user:id,name'])
            ->when($period === 'month', fn ($q) => $q->whereMonth('consumed_at', now()->month)->whereYear('consumed_at', now()->year))
            ->when($period === 'week', fn ($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
            ->when($period === 'year', fn ($q) => $q->whereYear('consumed_at', now()->year))
            ->when($notariaId, fn ($q) => $q->where('notaria_id', $notariaId))
            ->orderBy('consumed_at', 'desc')
            ->get();

        return $query->map(function ($usage) {
            return [
                'consumed_at' => $usage->consumed_at->format('Y-m-d H:i:s'),
                'notaria_nombre' => $usage->notaria->nombre,
                'service_name' => $usage->service->name,
                'user_name' => $usage->user->name,
                'quantity' => $usage->quantity,
                'cost' => $usage->cost,
            ];
        })->toArray();
    }

    /**
     * Obtener datos de notarías para exportación
     */
    protected function getNotariasData(string $period): array
    {
        $notarias = Notaria::withCount([
            'serviceUsages' => fn ($q) => $this->applyPeriodFilter($q, $period),
        ])
            ->withSum([
                'serviceUsages as total_quantity' => fn ($q) => $this->applyPeriodFilter($q, $period),
            ], 'quantity')
            ->withSum([
                'serviceUsages as total_cost' => fn ($q) => $this->applyPeriodFilter($q, $period),
            ], 'cost')
            ->where('activa', true)
            ->get();

        return $notarias->map(function ($notaria) {
            return [
                'nombre' => $notaria->nombre,
                'total_requests' => $notaria->service_usages_count ?? 0,
                'total_quantity' => $notaria->total_quantity ?? 0,
                'total_cost' => $notaria->total_cost ?? 0,
            ];
        })->toArray();
    }

    /**
     * Obtener datos de servicios para exportación
     */
    protected function getServicesData(string $period): array
    {
        $services = Service::withCount([
            'serviceUsages' => fn ($q) => $this->applyPeriodFilter($q, $period),
        ])
            ->withSum([
                'serviceUsages as total_quantity' => fn ($q) => $this->applyPeriodFilter($q, $period),
            ], 'quantity')
            ->withSum([
                'serviceUsages as total_cost' => fn ($q) => $this->applyPeriodFilter($q, $period),
            ], 'cost')
            ->where('is_active', true)
            ->get();

        return $services->map(function ($service) use ($period) {
            $uniqueNotarias = ServiceUsage::where('service_id', $service->id)
                ->when($period === 'month', fn ($q) => $q->whereMonth('consumed_at', now()->month)->whereYear('consumed_at', now()->year))
                ->when($period === 'week', fn ($q) => $q->whereBetween('consumed_at', [now()->startOfWeek(), now()->endOfWeek()]))
                ->when($period === 'year', fn ($q) => $q->whereYear('consumed_at', now()->year))
                ->distinct('notaria_id')
                ->count('notaria_id');

            return [
                'name' => $service->name,
                'total_requests' => $service->service_usages_count ?? 0,
                'total_quantity' => $service->total_quantity ?? 0,
                'total_cost' => $service->total_cost ?? 0,
                'unique_notarias' => $uniqueNotarias,
            ];
        })->toArray();
    }
}
