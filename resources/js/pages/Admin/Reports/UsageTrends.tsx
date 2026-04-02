import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BarChart3, Calendar, Package, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Brush, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import * as ReportsController from '@/actions/App/Http/Controllers/Admin/ReportsController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

interface Service {
    id: number;
    code: string;
    name: string;
    category: string;
}

interface Notaria {
    id: number;
    name: string;
    number: string;
}

interface TrendData {
    period: string; // '2025-10' (monthly) | '2025-W42' (weekly) | '2025-10-15' (daily)
    [key: string]: string | number; // service_1, service_2, etc.
}

interface BreadcrumbItem {
    title: string;
    href: string;
}

interface Props {
    trends: TrendData[];
    services: Service[];
    granularity: 'monthly' | 'weekly' | 'daily';
    totals: {
        total_requests: number;
        total_quantity: number;
        total_cost: number;
    };
    averages: {
        avg_requests: number;
        avg_quantity: number;
        avg_cost: number;
    };
    peakPeriod: {
        period: string;
        value: number;
    } | null;
    notarias: Notaria[];
    allServices: Service[];
    filters: {
        months: number;
        notaria_id?: number;
        service_code?: string;
        metric: string;
        date_from: string;
        date_to: string;
    };
}

// Colores para las líneas del gráfico
const COLORS = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // amber
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#14b8a6', // teal
    '#f97316', // orange
    '#6366f1', // indigo
    '#84cc16', // lime
];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/admin/dashboard',
    },
    {
        title: 'Reportes',
        href: ReportsController.index.url(),
    },
    {
        title: 'Tendencias de Uso',
        href: ReportsController.usageTrends.url(),
    },
];

export default function UsageTrends({
    trends,
    services,
    granularity,
    totals,
    averages,
    peakPeriod,
    notarias,
    allServices,
    filters,
}: Props) {
    const [selectedMonths, setSelectedMonths] = useState(filters.months.toString());
    const [selectedNotaria, setSelectedNotaria] = useState(filters.notaria_id?.toString() || 'all');
    const [selectedService, setSelectedService] = useState(filters.service_code || 'all');
    const [selectedMetric, setSelectedMetric] = useState(filters.metric);
    const [currentGranularity, setCurrentGranularity] = useState<'monthly' | 'weekly' | 'daily'>(granularity);

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value);
    };

    // ============================================================
    // 📅 FORMATEADOR DE PERÍODOS según granularidad
    // ============================================================
    const formatPeriodLabel = (period: string): string => {
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
                           'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        if (currentGranularity === 'monthly') {
            // '2025-10' → 'Oct 2025'
            const [year, month] = period.split('-');
            return `${monthNames[parseInt(month) - 1]} ${year}`;
        } else if (currentGranularity === 'weekly') {
            // '2025-W42' → 'Sem 42 2025'
            const [year, week] = period.split('-W');
            return `Sem ${week} ${year}`;
        } else {
            // '2025-10-15' → '15 Oct'
            const date = new Date(period);
            return `${date.getDate()} ${monthNames[date.getMonth()]}`;
        }
    };

    // ============================================================
    // 🔍 ZOOM HANDLER - Carga din\u00e1mica bajo demanda
    // ============================================================
    const handleBrushChange = (brushArea: { startIndex?: number; endIndex?: number }) => {
        if (!brushArea || brushArea.startIndex === undefined || brushArea.endIndex === undefined) {
            return;
        }

        const visiblePoints = brushArea.endIndex - brushArea.startIndex + 1;

        // Decidir granularidad seg\u00fan puntos visibles
        let newGranularity: 'monthly' | 'weekly' | 'daily' = currentGranularity;

        if (currentGranularity === 'monthly' && visiblePoints <= 2) {
            // Si solo se ven 2 meses o menos, cambiar a semanal
            newGranularity = 'weekly';
        } else if (currentGranularity === 'weekly' && visiblePoints <= 3) {
            // Si solo se ven 3 semanas o menos, cambiar a diario
            newGranularity = 'daily';
        } else if (currentGranularity === 'daily' && visiblePoints >= 40) {
            // Si se ven m\u00e1s de 40 d\u00edas, volver a semanal
            newGranularity = 'weekly';
        } else if (currentGranularity === 'weekly' && visiblePoints >= 10) {
            // Si se ven m\u00e1s de 10 semanas, volver a mensual
            newGranularity = 'monthly';
        }

        // Si cambi\u00f3 la granularidad, recargar datos
        if (newGranularity !== currentGranularity) {

            setCurrentGranularity(newGranularity);

            // Calcular rango de fechas visibles
            const startPeriod = trends[brushArea.startIndex]?.period;
            const endPeriod = trends[brushArea.endIndex]?.period;

            if (startPeriod && endPeriod) {
                // Recargar datos con nueva granularidad
                router.reload({
                    data: {
                        granularity: newGranularity,
                        date_from: startPeriod,
                        date_to: endPeriod,
                        notaria_id: selectedNotaria !== 'all' ? selectedNotaria : undefined,
                        service_code: selectedService !== 'all' ? selectedService : undefined,
                        metric: selectedMetric,
                    },
                });
            }
        }
    };

    const getMetricLabel = (): string => {
        switch (selectedMetric) {
            case 'cost':
                return 'Costo';
            case 'quantity':
                return 'Cantidad';
            default:
                return 'Solicitudes';
        }
    };

    const formatTooltipValue = (value: number | undefined): string => {
        if (value === undefined) return 'N/A';

        switch (selectedMetric) {
            case 'cost':
                return formatCurrency(value);
            case 'quantity':
                return `${value.toLocaleString()} unidades`;
            default:
                return `${value.toLocaleString()} solicitudes`;
        }
    };

    const getCurrentTotal = (): number => {
        switch (selectedMetric) {
            case 'cost':
                return totals.total_cost;
            case 'quantity':
                return totals.total_quantity;
            default:
                return totals.total_requests;
        }
    };

    const getCurrentAverage = (): number => {
        switch (selectedMetric) {
            case 'cost':
                return averages.avg_cost;
            case 'quantity':
                return averages.avg_quantity;
            default:
                return averages.avg_requests;
        }
    };

    const applyFilters = () => {
        const params: Record<string, string | number> = {
            months: selectedMonths,
            metric: selectedMetric,
        };

        if (selectedNotaria !== 'all') {
            params.notaria_id = selectedNotaria;
        }

        if (selectedService !== 'all') {
            params.service_code = selectedService;
        }

        router.get(ReportsController.usageTrends.url(), params, {
            preserveState: true,
        });
    };

    const resetFilters = () => {
        setSelectedMonths('6');
        setSelectedNotaria('all');
        setSelectedService('all');
        setSelectedMetric('requests');

        router.get(ReportsController.usageTrends.url(), { months: 6, metric: 'requests' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Tendencias de Uso" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                                Tendencias de Uso
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Análisis histórico del consumo de servicios
                            </p>
                        </div>
                        <Link href={ReportsController.index.url()}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver a Reportes
                            </Button>
                        </Link>
                    </div>
                {/* Panel de Filtros */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros</CardTitle>
                        <CardDescription>
                            Selecciona los parámetros para ver las tendencias de uso
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <label className="mb-2 block text-sm font-medium">Período</label>
                                <Select value={selectedMonths} onValueChange={setSelectedMonths}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar período" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="3">Últimos 3 meses</SelectItem>
                                        <SelectItem value="6">Últimos 6 meses</SelectItem>
                                        <SelectItem value="12">Últimos 12 meses</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Notaría</label>
                                <Select value={selectedNotaria} onValueChange={setSelectedNotaria}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todas las notarías" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las notarías</SelectItem>
                                        {notarias.map((notaria) => (
                                            <SelectItem key={notaria.id} value={notaria.id.toString()}>
                                                Notaría {notaria.number} - {notaria.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Servicio</label>
                                <Select value={selectedService} onValueChange={setSelectedService}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los servicios" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los servicios</SelectItem>
                                        {allServices.map((service) => (
                                            <SelectItem key={service.id} value={service.code}>
                                                {service.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">Métrica</label>
                                <Select value={selectedMetric} onValueChange={setSelectedMetric}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Seleccionar métrica" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="requests">Solicitudes</SelectItem>
                                        <SelectItem value="cost">Costo</SelectItem>
                                        <SelectItem value="quantity">Cantidad</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="mt-4 flex gap-2">
                            <Button onClick={applyFilters}>Aplicar Filtros</Button>
                            <Button variant="outline" onClick={resetFilters}>
                                Limpiar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Control de Granularidad */}
                <Card className="bg-linear-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            {/* Botones de granularidad */}
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    📊 Nivel de detalle:
                                </span>
                                <div className="flex gap-2 rounded-lg bg-white dark:bg-gray-800 p-1 shadow-sm">
                                    <Button
                                        variant={currentGranularity === 'monthly' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => {
                                            router.reload({
                                                data: {
                                                    granularity: 'monthly',
                                                    months: selectedMonths,
                                                    notaria_id: selectedNotaria !== 'all' ? selectedNotaria : undefined,
                                                    service_code: selectedService !== 'all' ? selectedService : undefined,
                                                    metric: selectedMetric,
                                                },
                                            });
                                        }}
                                        className="text-xs"
                                    >
                                        📅 Mensual
                                    </Button>
                                    <Button
                                        variant={currentGranularity === 'weekly' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => {
                                            router.reload({
                                                data: {
                                                    granularity: 'weekly',
                                                    months: selectedMonths,
                                                    notaria_id: selectedNotaria !== 'all' ? selectedNotaria : undefined,
                                                    service_code: selectedService !== 'all' ? selectedService : undefined,
                                                    metric: selectedMetric,
                                                },
                                            });
                                        }}
                                        className="text-xs"
                                    >
                                        📊 Semanal
                                    </Button>
                                    <Button
                                        variant={currentGranularity === 'daily' ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => {
                                            router.reload({
                                                data: {
                                                    granularity: 'daily',
                                                    months: selectedMonths,
                                                    notaria_id: selectedNotaria !== 'all' ? selectedNotaria : undefined,
                                                    service_code: selectedService !== 'all' ? selectedService : undefined,
                                                    metric: selectedMetric,
                                                },
                                            });
                                        }}
                                        className="text-xs"
                                    >
                                        📈 Diario
                                    </Button>
                                </div>
                            </div>

                            {/* Métricas de reducción */}
                            <div className="flex items-center gap-4">
                                <div className="text-right">
                                    <div className="text-xs text-gray-600 dark:text-gray-400">
                                        {currentGranularity === 'monthly'
                                            ? 'Vista panorámica - Máxima compresión'
                                            : currentGranularity === 'weekly'
                                            ? 'Vista intermedia - Tendencias semanales'
                                            : 'Vista detallada - Datos diarios'}
                                    </div>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="rounded-full bg-blue-100 dark:bg-blue-900 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-300">
                                            {trends.length} período{trends.length !== 1 ? 's' : ''}
                                        </span>
                                        {currentGranularity === 'monthly' && (
                                            <span className="rounded-full bg-green-100 dark:bg-green-900 px-3 py-1 text-xs font-semibold text-green-700 dark:text-green-300">
                                                ⚡ Óptimo para rangos largos
                                            </span>
                                        )}
                                        {currentGranularity === 'daily' && (
                                            <span className="rounded-full bg-orange-100 dark:bg-orange-900 px-3 py-1 text-xs font-semibold text-orange-700 dark:text-orange-300">
                                                🔍 Máximo detalle
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Barra de ayuda */}
                        <div className="mt-4 rounded-lg bg-white/50 dark:bg-gray-800/50 p-3 text-xs text-gray-600 dark:text-gray-400">
                            <p>
                                💡 <strong>Tip:</strong> También puedes hacer zoom en el gráfico arrastrando los controles
                                deslizantes. La granularidad {currentGranularity === 'monthly' ? 'mensual' : currentGranularity === 'weekly' ? 'semanal' : 'diaria'} te
                                permite ver
                                {currentGranularity === 'monthly'
                                    ? ' tendencias generales en períodos largos'
                                    : currentGranularity === 'weekly'
                                    ? ' patrones semanales de uso'
                                    : ' cada día individual en detalle'}.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Tarjetas de Estadísticas */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total {getMetricLabel()}</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {selectedMetric === 'cost'
                                    ? formatCurrency(getCurrentTotal())
                                    : getCurrentTotal().toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                En los últimos {selectedMonths} meses
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Promedio Mensual</CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {selectedMetric === 'cost'
                                    ? formatCurrency(getCurrentAverage())
                                    : getCurrentAverage().toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">Por mes</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Período Pico</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {peakPeriod ? formatPeriodLabel(peakPeriod.period) : 'N/A'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {peakPeriod
                                    ? selectedMetric === 'cost'
                                        ? formatCurrency(peakPeriod.value)
                                        : `${peakPeriod.value.toLocaleString()} ${
                                              selectedMetric === 'quantity' ? 'unidades' : 'solicitudes'
                                          }`
                                    : 'Sin datos'}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Servicios</CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{services.length}</div>
                            <p className="text-xs text-muted-foreground">
                                {services.length === 1 ? 'Servicio activo' : 'Servicios activos'}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Gráfico de Líneas */}
                <Card>
                    <CardHeader>
                        <CardTitle>Tendencias por Servicio</CardTitle>
                        <CardDescription>
                            Evolución de {getMetricLabel().toLowerCase()} a lo largo del tiempo.
                            Usa el control deslizante inferior para hacer zoom en períodos específicos.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {trends.length > 0 && services.length > 0 ? (
                            <ResponsiveContainer width="100%" height={450}>
                                <LineChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    {/* ============================================================
                                        📊 EJE X (Fechas/Tiempo)
                                        ============================================================
                                        dataKey="month" - Campo que contiene las etiquetas del eje X
                                        tickFormatter={formatMonthLabel} - Función que formatea las etiquetas

                                        ✅ AJUSTAR SI CAMBIAS LA GRANULARIDAD:
                                        - El dataKey debe coincidir con el campo del backend
                                        - El tickFormatter debe manejar el formato correcto
                                        ============================================================ */}
                                    <XAxis
                                        dataKey="period"
                                        tickFormatter={formatPeriodLabel}
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        labelFormatter={(label) => formatPeriodLabel(label as string)}
                                        formatter={(value: number | undefined) => formatTooltipValue(value)}
                                    />
                                    <Legend
                                        wrapperStyle={{ fontSize: '14px' }}
                                        formatter={(value) => {
                                            const serviceId = value.replace('service_', '');
                                            const service = services.find((s) => s.id.toString() === serviceId);
                                            return service ? service.name : value;
                                        }}
                                    />
                                    {services.map((service, index) => (
                                        <Line
                                            key={service.id}
                                            type="monotone"
                                            dataKey={`service_${service.id}`}
                                            stroke={COLORS[index % COLORS.length]}
                                            strokeWidth={2}
                                            name={`service_${service.id}`}
                                            dot={{ r: 4 }}
                                            activeDot={{ r: 6 }}
                                            connectNulls
                                        />
                                    ))}
                                    {/* ============================================================
                                        🔍 CONTROL DE ZOOM/PAN (Brush)
                                        ============================================================
                                        Permite al usuario:
                                        - Hacer zoom arrastrando los bordes
                                        - Desplazarse arrastrando el centro
                                        - Ver una mini-vista previa de todos los datos

                                        ✅ PROPIEDADES AJUSTABLES:
                                        - height: Altura del control (30px)
                                        - stroke: Color del borde (#8884d8)
                                        - startIndex/endIndex: Para definir el rango inicial

                                        Ejemplo para mostrar solo los últimos 3 meses al cargar:
                                        startIndex={trends.length - 3}
                                        endIndex={trends.length - 1}
                                        ============================================================ */}
                                    <Brush
                                        dataKey="period"
                                        height={30}
                                        stroke="#8884d8"
                                        tickFormatter={formatPeriodLabel}
                                        onChange={handleBrushChange}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-100 items-center justify-center">
                                <div className="text-center text-muted-foreground">
                                    <BarChart3 className="mx-auto mb-2 h-12 w-12 opacity-50" />
                                    <p>No hay datos para mostrar con los filtros seleccionados</p>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Tabla Detallada - Agrupada por Mes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen Mensual por Servicio</CardTitle>
                        <CardDescription>
                            Valores agregados de {getMetricLabel().toLowerCase()} por servicio y mes
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <p className="text-sm text-muted-foreground mb-4">
                                ℹ️ Mostrando datos con granularidad: <strong>{currentGranularity === 'monthly' ? 'Mensual' : currentGranularity === 'weekly' ? 'Semanal' : 'Diaria'}</strong>
                            </p>
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left text-sm font-medium">Servicio</th>
                                        {trends.map((trend) => (
                                            <th
                                                key={trend.period}
                                                className="px-4 py-2 text-right text-sm font-medium"
                                            >
                                                {formatPeriodLabel(trend.period as string)}
                                            </th>
                                        ))}
                                        <th className="px-4 py-2 text-right text-sm font-medium">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {services.map((service) => {
                                        const serviceKey = `service_${service.id}`;
                                        const total = trends.reduce((sum, trend) => {
                                            const value = trend[serviceKey];
                                            return sum + (typeof value === 'number' ? value : 0);
                                        }, 0);

                                        return (
                                            <tr key={service.id} className="border-b hover:bg-muted/50">
                                                <td className="px-4 py-2 text-sm font-medium">
                                                    <div>{service.name}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {service.code}
                                                    </div>
                                                </td>
                                                {trends.map((trend) => {
                                                    const value = trend[serviceKey];
                                                    return (
                                                        <td
                                                            key={`${service.id}-${trend.period}`}
                                                            className="px-4 py-2 text-right text-sm"
                                                        >
                                                            {typeof value === 'number' && value > 0
                                                                ? selectedMetric === 'cost'
                                                                    ? formatCurrency(value)
                                                                    : value.toLocaleString()
                                                                : '-'}
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-4 py-2 text-right text-sm font-bold">
                                                    {total > 0
                                                        ? selectedMetric === 'cost'
                                                            ? formatCurrency(total)
                                                            : total.toLocaleString()
                                                        : '-'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
                </div>
            </div>
        </AppLayout>
    );
}
