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
    month: string;
    [key: string]: string | number; // service_1, service_2, etc.
}

interface BreadcrumbItem {
    title: string;
    href: string;
}

interface Props {
    trends: TrendData[];
    services: Service[];
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
    peakMonth: {
        month: string;
        value: number;
    } | null;
    notarias: Notaria[];
    allServices: Service[];
    filters: {
        months: number;
        notaria_id?: number;
        service_code?: string;
        metric: string;
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
    totals,
    averages,
    peakMonth,
    notarias,
    allServices,
    filters,
}: Props) {
    const [selectedMonths, setSelectedMonths] = useState(filters.months.toString());
    const [selectedNotaria, setSelectedNotaria] = useState(filters.notaria_id?.toString() || 'all');
    const [selectedService, setSelectedService] = useState(filters.service_code || 'all');
    const [selectedMetric, setSelectedMetric] = useState(filters.metric);

    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(value);
    };

    const formatMonthLabel = (month: string): string => {
        const [year, monthNum] = month.split('-');
        const monthNames = [
            'Ene',
            'Feb',
            'Mar',
            'Abr',
            'May',
            'Jun',
            'Jul',
            'Ago',
            'Sep',
            'Oct',
            'Nov',
            'Dic',
        ];
        return `${monthNames[parseInt(monthNum) - 1]} ${year}`;
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
                            <CardTitle className="text-sm font-medium">Mes Pico</CardTitle>
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {peakMonth ? formatMonthLabel(peakMonth.month) : 'N/A'}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {peakMonth
                                    ? selectedMetric === 'cost'
                                        ? formatCurrency(peakMonth.value)
                                        : `${peakMonth.value.toLocaleString()} ${
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
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={formatMonthLabel}
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis style={{ fontSize: '12px' }} />
                                    <Tooltip
                                        labelFormatter={(label) => formatMonthLabel(label as string)}
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
                                    <Brush
                                        dataKey="month"
                                        height={30}
                                        stroke="#8884d8"
                                        tickFormatter={formatMonthLabel}
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

                {/* Tabla Detallada */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detalle por Servicio y Mes</CardTitle>
                        <CardDescription>
                            Valores específicos de {getMetricLabel().toLowerCase()} por servicio
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b">
                                        <th className="px-4 py-2 text-left text-sm font-medium">Servicio</th>
                                        {trends.map((trend) => (
                                            <th
                                                key={trend.month}
                                                className="px-4 py-2 text-right text-sm font-medium"
                                            >
                                                {formatMonthLabel(trend.month as string)}
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
                                                            key={`${service.id}-${trend.month}`}
                                                            className="px-4 py-2 text-right text-sm"
                                                        >
                                                            {value !== undefined && typeof value === 'number'
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
