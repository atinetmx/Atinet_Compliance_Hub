import { Head, Link } from '@inertiajs/react';
import { AlertCircle, Clock, CreditCard, Plus, XCircle } from 'lucide-react';
import { useState } from 'react';
import {
    Bar,
    BarChart,
    Cell,
    Legend,
    Pie,
    PieChart,
    RadialBar,
    RadialBarChart,
    ResponsiveContainer,
    Tooltip,
    Treemap,
    XAxis,
    YAxis,
} from 'recharts';

import * as SubscriptionController from '@/actions/App/Http/Controllers/Admin/SubscriptionController';

import { SubscriptionStatusBadge } from '@/components/subscription-status-badge';
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



interface Subscription {
    id: number;
    status: 'trial' | 'activa' | 'vencida' | 'suspendida' | 'cancelada';
    fecha_inicio: string;
    fecha_vencimiento: string;
    precio_pagado: number;
    ciclo_facturacion: string;
    notaria: {
        id: number;
        nombre: string;
        numero_notaria: string;
    };
    plan: {
        id: number;
        nombre: string;
    };
}

interface SubscriptionsIndexProps {
    subscriptions: {
        data: Subscription[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: {
        total: number;
        activas: number;
        trial: number;
        vencidas: number;
        suspendidas: number;
        canceladas: number;
        mrr: number;
    };
    alerts: {
        expiring_soon: number;
        grace_period: number;
        needs_attention: number;
    };
    filters: {
        status?: string;
        plan_id?: number;
        search?: string;
        expiring_soon?: boolean;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Suscripciones',
        href: '/admin/subscriptions',
        icon: CreditCard,
    },
];

export default function Index({
    subscriptions,
    stats,
    alerts,
}: SubscriptionsIndexProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(date));
    };

    // Datos para el gráfico de distribución por estado
    const chartData = [
        { name: 'Trial', value: stats.trial, color: '#3b82f6' },
        { name: 'Activas', value: stats.activas, color: '#10b981' },
        { name: 'Vencidas', value: stats.vencidas, color: '#f59e0b' },
        { name: 'Suspendidas', value: stats.suspendidas, color: '#ef4444' },
        { name: 'Canceladas', value: stats.canceladas, color: '#6b7280' },
    ].filter((item) => item.value > 0);

    const COLORS = chartData.map((item) => item.color);

    // Estado para el tipo de gráfico
    const [chartType, setChartType] = useState<string>(
        () => localStorage.getItem('subscriptions-chart-type') || 'pie',
    );

    // Guardar preferencia en localStorage
    const handleChartTypeChange = (value: string) => {
        setChartType(value);
        localStorage.setItem('subscriptions-chart-type', value);
    };

    // Componente para TreeMap
    const CustomTreeMapContent = (props: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
        name?: string;
        value?: number;
        color?: string;
    }) => {
        const { x = 0, y = 0, width = 0, height = 0, name = '', value = 0, color = '#000' } = props;
        return (
            <g>
                <rect
                    x={x}
                    y={y}
                    width={width}
                    height={height}
                    style={{
                        fill: color,
                        stroke: '#fff',
                        strokeWidth: 2,
                    }}
                />
                {width > 60 && height > 30 && (
                    <>
                        <text
                            x={x + width / 2}
                            y={y + height / 2 - 10}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="14"
                            fontWeight="bold"
                        >
                            {name}
                        </text>
                        <text
                            x={x + width / 2}
                            y={y + height / 2 + 10}
                            textAnchor="middle"
                            fill="#fff"
                            fontSize="16"
                        >
                            {value}
                        </text>
                    </>
                )}
            </g>
        );
    };

    // Renderizar gráfico según tipo seleccionado
    const renderChart = () => {
        if (chartData.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
                    <h3 className="text-lg font-semibold">
                        No hay datos disponibles
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Aún no hay suscripciones para mostrar en el gráfico
                    </p>
                </div>
            );
        }

        switch (chartType) {
            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) =>
                                    `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`
                                }
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [
                                    value ?? 0,
                                    'Suscripciones',
                                ]}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'bar':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                formatter={(value) => [
                                    value ?? 0,
                                    'Suscripciones',
                                ]}
                            />
                            <Legend />
                            <Bar dataKey="value" name="Suscripciones">
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                );

            case 'radial':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <RadialBarChart
                            cx="50%"
                            cy="50%"
                            innerRadius="10%"
                            outerRadius="90%"
                            data={chartData.map((item, index) => ({
                                ...item,
                                fill: COLORS[index],
                            }))}
                        >
                            <RadialBar
                                label={{ position: 'insideStart', fill: '#fff' }}
                                background
                                dataKey="value"
                            />
                            <Legend
                                iconSize={10}
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                            />
                            <Tooltip
                                formatter={(value) => [
                                    value ?? 0,
                                    'Suscripciones',
                                ]}
                            />
                        </RadialBarChart>
                    </ResponsiveContainer>
                );

            case 'treemap':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <Treemap
                            data={chartData}
                            dataKey="value"
                            aspectRatio={4 / 3}
                            stroke="#fff"
                            content={<CustomTreeMapContent />}
                        />
                    </ResponsiveContainer>
                );

            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suscripciones" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Botón de acción */}
                <div className="flex justify-end">
                    <Link href="/admin/subscriptions/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Suscripción
                        </Button>
                    </Link>
                </div>

                {/* Estadísticas */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Total
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {stats.activas} activas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                MRR
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.mrr)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Ingreso mensual recurrente
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Trial
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.trial}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Período de prueba
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-sm font-medium">
                                Atención
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {alerts.needs_attention}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Requieren acción
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Gráfico de Distribución por Estado */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <CardTitle>Distribución por Estado</CardTitle>
                                <CardDescription>
                                    Visualización de suscripciones por estado actual
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    Tipo de gráfico:
                                </span>
                                <Select
                                    value={chartType}
                                    onValueChange={handleChartTypeChange}
                                >
                                    <SelectTrigger className="w-45">
                                        <SelectValue placeholder="Selecciona tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pie">
                                            🥧 Circular (Pie)
                                        </SelectItem>
                                        <SelectItem value="bar">
                                            📊 Barras (Bar)
                                        </SelectItem>
                                        <SelectItem value="radial">
                                            🎯 Radial
                                        </SelectItem>
                                        <SelectItem value="treemap">
                                            🗺️ Mapa de Árbol
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center gap-6 lg:flex-row lg:justify-center">
                            <div className="w-full max-w-2xl">
                                {renderChart()}
                            </div>
                            {chartData.length > 0 && (
                                <div className="grid grid-cols-2 gap-4 lg:grid-cols-1">
                                    {chartData.map((item, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center gap-3"
                                        >
                                            <div
                                                className="h-4 w-4 rounded-sm"
                                                style={{
                                                    backgroundColor: item.color,
                                                }}
                                            />
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">
                                                    {item.name}
                                                </span>
                                                <span className="text-2xl font-bold">
                                                    {item.value}
                                                </span>
                                                <span className="text-xs text-muted-foreground">
                                                    {((item.value / stats.total) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Alertas */}
                {(alerts.expiring_soon > 0 ||
                    alerts.grace_period > 0 ||
                    alerts.needs_attention > 0) && (
                    <div className="space-y-2">
                        {alerts.expiring_soon > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm">
                                <Clock className="h-4 w-4 text-yellow-600" />
                                <span>
                                    <strong>{alerts.expiring_soon}</strong>{' '}
                                    suscripciones vencen en los próximos 7
                                    días
                                </span>
                            </div>
                        )}

                        {alerts.grace_period > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 p-3 text-sm">
                                <AlertCircle className="h-4 w-4 text-orange-600" />
                                <span>
                                    <strong>{alerts.grace_period}</strong>{' '}
                                    suscripciones en período de gracia
                                </span>
                            </div>
                        )}

                        {alerts.needs_attention > 0 && (
                            <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm">
                                <XCircle className="h-4 w-4 text-red-600" />
                                <span>
                                    <strong>{alerts.needs_attention}</strong>{' '}
                                    suscripciones requieren atención inmediata
                                    (vencidas o suspendidas)
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Tabla de Suscripciones */}
                <Card>
                    <CardHeader>
                        <CardTitle>Todas las Suscripciones</CardTitle>
                        <CardDescription>
                            Lista completa de suscripciones registradas
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Notaría</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Vencimiento</TableHead>
                                    <TableHead>Precio</TableHead>
                                    <TableHead>Ciclo</TableHead>
                                    <TableHead className="text-right">
                                        Acciones
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {subscriptions.data.map((subscription) => (
                                    <TableRow key={subscription.id}>
                                        <TableCell>
                                            <Link
                                                href={`/admin/notarias/${subscription.notaria.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {subscription.notaria.nombre}
                                            </Link>
                                            <div className="text-xs text-muted-foreground">
                                                #
                                                {
                                                    subscription.notaria
                                                        .numero_notaria
                                                }
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {subscription.plan.nombre}
                                        </TableCell>
                                        <TableCell>
                                            <SubscriptionStatusBadge
                                                status={subscription.status}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(
                                                subscription.fecha_vencimiento,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(
                                                subscription.precio_pagado,
                                            )}
                                        </TableCell>
                                        <TableCell className="capitalize">
                                            {subscription.ciclo_facturacion}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link
                                                href={
                                                    SubscriptionController.show(
                                                        {
                                                            subscription:
                                                                subscription.id,
                                                        },
                                                    ).url
                                                }
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    Ver Detalle
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>

                        {subscriptions.data.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <CreditCard className="mb-4 h-12 w-12 text-muted-foreground" />
                                <h3 className="text-lg font-semibold">
                                    No hay suscripciones
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Aún no se han creado suscripciones en el
                                    sistema
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
