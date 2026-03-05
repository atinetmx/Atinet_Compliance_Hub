import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Calendar, CreditCard, TrendingUp } from 'lucide-react';
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import type { BreadcrumbItem } from '@/types';

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    activa: boolean;
    subscripciones?: Subscription[];
}

interface Subscription {
    id: number;
    status: string;
    fecha_inicio: string;
    fecha_vencimiento: string;
    precio_pagado: number;
    moneda: string;
    ciclo_facturacion: string;
    plan: Plan;
}

interface Plan {
    id: number;
    name: string;
    description?: string;
}

interface Service {
    service_code: string;
    service_name: string;
    service_category: string;
    has_access: boolean;
    limit: number | null;
    used: number;
    remaining: number | null;
    is_unlimited: boolean;
    usage_percentage: number;
    current_month_usage: number;
    last_usage: string | null;
    total_cost: number;
    billing_model: string;
}

interface MonthlyUsage {
    service_id: number;
    total_quantity: number;
    total_cost: number;
    total_requests: number;
    service: {
        id: number;
        code: string;
        name: string;
    };
}

interface NotariaStatsProps {
    notaria: Notaria;
    services: Service[];
    monthlyUsage: MonthlyUsage[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444'];

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard.url(),
    },
    {
        title: 'Reportes',
        href: ReportsController.index.url(),
    },
    {
        title: 'Notarías Cerca del Límite',
        href: ReportsController.notariasNearLimit.url(),
    },
];

const getStatusBadgeVariant = (status: string) => {
    switch (status) {
        case 'activa':
            return 'default';
        case 'trial':
            return 'secondary';
        case 'vencida':
            return 'destructive';
        case 'cancelada':
            return 'outline';
        default:
            return 'secondary';
    }
};

const formatCurrency = (amount: number, currency: string = 'MXN') => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

export default function NotariaStats({
    notaria,
    services,
    monthlyUsage,
}: NotariaStatsProps) {
    const activeSubscription = notaria.subscripciones?.find(
        (sub) => sub.status === 'activa' || sub.status === 'trial',
    );

    // Preparar datos para gráfico de uso por servicio
    const usageChartData = monthlyUsage
        .map((usage) => ({
            name: usage.service.name,
            requests: usage.total_requests,
            costo: usage.total_cost,
        }))
        .sort((a, b) => b.requests - a.requests);

    // Preparar datos para gráfico de distribución de costos
    const costChartData = monthlyUsage
        .filter((usage) => usage.total_cost > 0)
        .map((usage, index) => ({
            name: usage.service.name,
            value: usage.total_cost,
            color: COLORS[index % COLORS.length],
        }));

    // Calcular totales
    const totalRequests = monthlyUsage.reduce(
        (sum, usage) => sum + usage.total_requests,
        0,
    );
    const totalCost = monthlyUsage.reduce((sum, usage) => sum + usage.total_cost, 0);
    const servicesWithAccess = services.filter((s) => s.has_access).length;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Estadísticas - ${notaria.nombre}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-2xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                                    {notaria.nombre}
                                </h2>
                                <Badge variant={notaria.activa ? 'default' : 'destructive'}>
                                    {notaria.activa ? 'Activa' : 'Inactiva'}
                                </Badge>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Notaría #{notaria.numero_notaria} - Estadísticas del mes actual
                            </p>
                        </div>
                        <Link href={ReportsController.notariasNearLimit.url()}>
                            <Button variant="outline">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Button>
                        </Link>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{totalRequests}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Solicitudes este mes
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                        <CreditCard className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(totalCost)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Costo total
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900">
                                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{servicesWithAccess}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Servicios activos
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900">
                                        <Calendar className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {monthlyUsage.length}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Servicios usados
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Suscripción activa */}
                    {activeSubscription && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Suscripción Actual</CardTitle>
                                <CardDescription>
                                    Información del plan activo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Plan
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {activeSubscription.plan.name}
                                        </p>
                                        <Badge
                                            variant={getStatusBadgeVariant(
                                                activeSubscription.status,
                                            )}
                                            className="mt-1"
                                        >
                                            {activeSubscription.status}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Período
                                        </p>
                                        <p className="text-sm">
                                            {formatDate(activeSubscription.fecha_inicio)}
                                        </p>
                                        <p className="text-sm text-muted-foreground">hasta</p>
                                        <p className="text-sm">
                                            {formatDate(activeSubscription.fecha_vencimiento)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">
                                            Facturación
                                        </p>
                                        <p className="text-lg font-semibold">
                                            {formatCurrency(
                                                activeSubscription.precio_pagado,
                                                activeSubscription.moneda,
                                            )}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {activeSubscription.ciclo_facturacion}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Gráficos */}
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        {/* Uso por servicio */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Uso por Servicio</CardTitle>
                                <CardDescription>
                                    Número de solicitudes por servicio este mes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {usageChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <BarChart data={usageChartData}>
                                            <XAxis
                                                dataKey="name"
                                                tick={{ fontSize: 12 }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={100}
                                            />
                                            <YAxis />
                                            <Tooltip />
                                            <Bar dataKey="requests" fill="#3b82f6" />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-75 items-center justify-center text-sm text-muted-foreground">
                                        Sin datos de uso este mes
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Distribución de costos */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Distribución de Costos</CardTitle>
                                <CardDescription>
                                    Costo por servicio este mes
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {costChartData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <PieChart>
                                            <Pie
                                                data={costChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                label={(entry) =>
                                                    `${formatCurrency(entry.value)}`
                                                }
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                            >
                                                {costChartData.map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={entry.color}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: number | undefined) =>
                                                    value ? formatCurrency(value) : 'N/A'
                                                }
                                            />
                                            <Legend />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-75 items-center justify-center text-sm text-muted-foreground">
                                        Sin costos registrados este mes
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabla de servicios */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Estado de Servicios</CardTitle>
                            <CardDescription>
                                Límites y uso de todos los servicios disponibles
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Servicio</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="text-right">Usado</TableHead>
                                        <TableHead className="text-right">Límite</TableHead>
                                        <TableHead className="text-right">
                                            Restante
                                        </TableHead>
                                        <TableHead>Uso</TableHead>
                                        <TableHead className="text-right">Costo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.map((service) => (
                                        <TableRow key={service.service_code}>
                                            <TableCell className="font-medium">
                                                {service.service_name}
                                                <div className="text-xs text-muted-foreground">
                                                    {service.service_code}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">
                                                    {service.service_category}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {service.used.toLocaleString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {service.is_unlimited
                                                    ? '∞'
                                                    : service.limit?.toLocaleString() ?? 'N/A'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {service.is_unlimited
                                                    ? '∞'
                                                    : service.remaining?.toLocaleString() ??
                                                      'N/A'}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-2 w-24 overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-blue-500"
                                                            style={{
                                                                width: `${Math.min(100, service.usage_percentage)}%`,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-sm">
                                                        {service.usage_percentage.toFixed(0)}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {formatCurrency(service.total_cost)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
