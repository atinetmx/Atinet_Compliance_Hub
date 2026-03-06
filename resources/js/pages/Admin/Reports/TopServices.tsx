import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, BarChart3, DollarSign, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';

import * as ReportsController from '@/actions/App/Http/Controllers/Admin/ReportsController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface TopServiceItem {
    service_id: number;
    service_code: string;
    service_name: string;
    service_category: string;
    billing_model: string;
    total_requests: number;
    total_quantity: number;
    total_cost: number;
    total_notarias: number;
}

interface TopServicesProps {
    topServices: TopServiceItem[];
    totals: {
        total_requests: number;
        total_quantity: number;
        total_cost: number;
        unique_services: number;
    };
    filters: {
        period: string;
        limit: number;
        sort_by: string;
    };
}

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
        title: 'Top Servicios',
        href: ReportsController.topServices.url(),
    },
];

const COLORS = [
    '#3b82f6',
    '#8b5cf6',
    '#ec4899',
    '#f59e0b',
    '#10b981',
    '#ef4444',
    '#06b6d4',
    '#8b5cf6',
    '#f97316',
    '#14b8a6',
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    }).format(amount);
};

const getCategoryBadgeVariant = (category: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
        'Lista Negra': 'destructive',
        'Validación': 'default',
        'Verificación': 'secondary',
    };
    return variants[category] || 'outline';
};

const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
        week: 'Esta semana',
        month: 'Este mes',
        year: 'Este año',
    };
    return labels[period] || period;
};

export default function TopServices({ topServices, totals, filters }: TopServicesProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period);
    const [selectedLimit, setSelectedLimit] = useState(filters.limit.toString());
    const [selectedSortBy, setSelectedSortBy] = useState(filters.sort_by);

    const applyFilters = () => {
        router.get(
            ReportsController.topServices.url(),
            {
                period: selectedPeriod,
                limit: selectedLimit,
                sort_by: selectedSortBy,
            },
            {
                preserveState: true,
            },
        );
    };

    // Preparar datos para gráfico de barras (ranking)
    const barChartData = topServices.map((service) => ({
        name: service.service_name,
        solicitudes: service.total_requests,
        costo: service.total_cost,
        cantidad: service.total_quantity,
    }));

    // Preparar datos para pie chart (distribución por costo)
    const pieChartData = topServices
        .filter((service) => service.total_cost > 0)
        .map((service, index) => ({
            name: service.service_name,
            value: service.total_cost,
            color: COLORS[index % COLORS.length],
        }));



    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Top Servicios" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                                Top Servicios Más Utilizados
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Ranking de servicios por uso, costo y cantidad consumida
                            </p>
                        </div>
                        <Link href={ReportsController.index.url()}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver a Reportes
                            </Button>
                        </Link>
                    </div>

                    {/* Filtros */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Período</label>
                                    <Select
                                        value={selectedPeriod}
                                        onValueChange={setSelectedPeriod}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="week">Esta semana</SelectItem>
                                            <SelectItem value="month">Este mes</SelectItem>
                                            <SelectItem value="year">Este año</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Top</label>
                                    <Select
                                        value={selectedLimit}
                                        onValueChange={setSelectedLimit}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="5">Top 5</SelectItem>
                                            <SelectItem value="10">Top 10</SelectItem>
                                            <SelectItem value="15">Top 15</SelectItem>
                                            <SelectItem value="20">Top 20</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Ordenar por</label>
                                    <Select
                                        value={selectedSortBy}
                                        onValueChange={setSelectedSortBy}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="requests">Solicitudes</SelectItem>
                                            <SelectItem value="cost">Costo</SelectItem>
                                            <SelectItem value="quantity">Cantidad</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end">
                                    <Button onClick={applyFilters} className="w-full">
                                        <BarChart3 className="mr-2 h-4 w-4" />
                                        Aplicar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {totals.total_requests.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Total Solicitudes
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                        <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(totals.total_cost)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Costo Total
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                                        <BarChart3 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {totals.total_quantity.toLocaleString()}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Cantidad Total
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                                        <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {totals.unique_services}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Servicios Únicos
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Ranking por solicitudes */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Ranking de Servicios</CardTitle>
                                <CardDescription>
                                    Ordenado por {selectedSortBy === 'requests' ? 'solicitudes' : selectedSortBy === 'cost' ? 'costo' : 'cantidad'} -{' '}
                                    {getPeriodLabel(selectedPeriod)}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {barChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart
                                            data={barChartData}
                                            layout="vertical"
                                            margin={{ left: 120, right: 20, top: 5, bottom: 5 }}
                                        >
                                            <XAxis type="number" />
                                            <YAxis
                                                type="category"
                                                dataKey="name"
                                                width={110}
                                                tick={{ fontSize: 12 }}
                                            />
                                            <Tooltip
                                                formatter={(value: number | undefined) =>
                                                    value
                                                        ? selectedSortBy === 'cost'
                                                            ? formatCurrency(value)
                                                            : value.toLocaleString()
                                                        : 'N/A'
                                                }
                                            />
                                            <Bar
                                                dataKey={
                                                    selectedSortBy === 'cost'
                                                        ? 'costo'
                                                        : selectedSortBy === 'quantity'
                                                          ? 'cantidad'
                                                          : 'solicitudes'
                                                }
                                                radius={[0, 8, 8, 0]}
                                            >
                                                {barChartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={COLORS[index % COLORS.length]}
                                                    />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
                                        No hay datos disponibles para el período seleccionado
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Distribución por costo */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribución de Costos</CardTitle>
                                <CardDescription>
                                    Porcentaje del costo total por servicio
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {pieChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={400}>
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) => {
                                                    const percent = (
                                                        (entry.value / totals.total_cost) *
                                                        100
                                                    ).toFixed(1);
                                                    return `${percent}%`;
                                                }}
                                                outerRadius={120}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number | undefined) =>
                                                    value ? formatCurrency(value) : 'N/A'
                                                }
                                            />
                                            <Legend
                                                wrapperStyle={{ fontSize: '12px' }}
                                                formatter={(value) => {
                                                    const service = pieChartData.find(
                                                        (s) => s.name === value,
                                                    );
                                                    return service
                                                        ? `${value} (${formatCurrency(service.value)})`
                                                        : value;
                                                }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-96 items-center justify-center text-sm text-muted-foreground">
                                        No hay datos de costos disponibles
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabla detallada */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalle de Servicios</CardTitle>
                            <CardDescription>
                                Información completa de los {topServices.length} servicios más utilizados
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {topServices.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>#</TableHead>
                                            <TableHead>Servicio</TableHead>
                                            <TableHead>Categoría</TableHead>
                                            <TableHead className="text-right">
                                                Solicitudes
                                            </TableHead>
                                            <TableHead className="text-right">Cantidad</TableHead>
                                            <TableHead className="text-right">Costo</TableHead>
                                            <TableHead className="text-right">
                                                Notarías
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Promedio/Sol
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {topServices.map((service, index) => (
                                            <TableRow key={service.service_id}>
                                                <TableCell>
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted font-bold">
                                                        {index + 1}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="space-y-1">
                                                        <div className="font-medium">
                                                            {service.service_name}
                                                        </div>
                                                        <code className="text-xs text-muted-foreground">
                                                            {service.service_code}
                                                        </code>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={getCategoryBadgeVariant(
                                                            service.service_category,
                                                        )}
                                                    >
                                                        {service.service_category}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-medium">
                                                        {service.total_requests.toLocaleString()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {service.total_quantity.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="font-medium">
                                                        {formatCurrency(service.total_cost)}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {service.total_notarias}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatCurrency(
                                                            service.total_cost /
                                                                service.total_requests,
                                                        )}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <div className="flex h-40 items-center justify-center text-muted-foreground">
                                    No hay datos disponibles para el período seleccionado
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
