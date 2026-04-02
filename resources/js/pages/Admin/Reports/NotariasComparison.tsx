import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Building2, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import {
    Bar,
    BarChart,
    CartesianGrid,
    Legend,
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

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
    service_usages_count: number;
    total_cost: number;
    total_quantity: number;
}

interface Service {
    id: number;
    code: string;
    name: string;
    category: string;
}

interface NotariasComparisonProps {
    notarias: Notaria[];
    services: Service[];
    filters: {
        period: string;
        service_code?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Reportes',
        href: ReportsController.index.url(),
    },
    {
        title: 'Comparación de Notarías',
        href: '#',
        icon: Building2,
    },
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    }).format(amount);
};

const getPeriodLabel = (period: string) => {
    const labels: Record<string, string> = {
        week: 'Esta semana',
        month: 'Este mes',
        year: 'Este año',
    };
    return labels[period] || period;
};

export default function NotariasComparison({
    notarias,
    services,
    filters,
}: NotariasComparisonProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period);
    const [selectedService, setSelectedService] = useState(filters.service_code || 'all');

    const handleFilterChange = () => {
        router.get('/admin/reports/notarias-comparison', {
            period: selectedPeriod,
            service_code: selectedService !== 'all' ? selectedService : undefined,
        });
    };

    // Preparar datos para gráfico de barras
    const chartData = notarias.map((notaria) => ({
        name: `N${notaria.numero_notaria}`,
        solicitudes: notaria.service_usages_count,
        costo: notaria.total_cost,
        cantidad: notaria.total_quantity,
    }));

    // Calcular totales
    const totals = {
        requests: notarias.reduce((sum, n) => sum + n.service_usages_count, 0),
        cost: notarias.reduce((sum, n) => sum + n.total_cost, 0),
        quantity: notarias.reduce((sum, n) => sum + n.total_quantity, 0),
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Comparación de Notarías" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Comparación de uso de servicios entre notarías activas
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
                        <CardHeader>
                            <CardTitle>Filtros</CardTitle>
                            <CardDescription>
                                Selecciona el período y servicio para comparar
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="mb-2 block text-sm font-medium">
                                        Período
                                    </label>
                                    <Select
                                        value={selectedPeriod}
                                        onValueChange={setSelectedPeriod}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="week">Esta Semana</SelectItem>
                                            <SelectItem value="month">Este Mes</SelectItem>
                                            <SelectItem value="year">Este Año</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex-1">
                                    <label className="mb-2 block text-sm font-medium">
                                        Servicio
                                    </label>
                                    <Select
                                        value={selectedService}
                                        onValueChange={setSelectedService}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">Todos los Servicios</SelectItem>
                                            {services.map((service) => (
                                                <SelectItem key={service.id} value={service.code}>
                                                    {service.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="flex items-end">
                                    <Button onClick={handleFilterChange}>
                                        Aplicar Filtros
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resumen General */}
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total de Solicitudes
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {totals.requests.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {getPeriodLabel(selectedPeriod)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Costo Total
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(totals.cost)}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {getPeriodLabel(selectedPeriod)}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Cantidad Total
                                </CardTitle>
                                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {totals.quantity.toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {getPeriodLabel(selectedPeriod)}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráfico de Comparación */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Comparación por Notaría</CardTitle>
                            <CardDescription>
                                Uso de servicios por notaría - {getPeriodLabel(selectedPeriod)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={400}>
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip
                                        formatter={(value: number | undefined, name: string) => {
                                            if (value === undefined) {
                                                return '-';
                                            }
                                            if (name === 'costo') {
                                                return formatCurrency(value);
                                            }
                                            return value.toLocaleString();
                                        }}
                                        labelFormatter={(label) => `Notaría ${label}`}
                                    />
                                    <Legend />
                                    <Bar
                                        dataKey="solicitudes"
                                        fill="#3b82f6"
                                        name="Solicitudes"
                                    />
                                    <Bar dataKey="cantidad" fill="#10b981" name="Cantidad" />
                                    <Bar dataKey="costo" fill="#f59e0b" name="Costo (MXN)" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Tabla Detallada */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalle por Notaría</CardTitle>
                            <CardDescription>
                                Ranking de notarías por uso de servicios
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>#</TableHead>
                                        <TableHead>Notaría</TableHead>
                                        <TableHead className="text-right">Solicitudes</TableHead>
                                        <TableHead className="text-right">Cantidad</TableHead>
                                        <TableHead className="text-right">Costo Total</TableHead>
                                        <TableHead className="text-right">
                                            Costo Promedio
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {notarias.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={6}
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                No hay datos para el período seleccionado
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        notarias.map((notaria, index) => (
                                            <TableRow key={notaria.id}>
                                                <TableCell className="font-medium">
                                                    {index + 1}
                                                </TableCell>
                                                <TableCell>
                                                    <div>
                                                        <div className="font-medium">
                                                            {notaria.nombre}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Notaría #{notaria.numero_notaria}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {notaria.service_usages_count.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {notaria.total_quantity.toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(notaria.total_cost)}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    {notaria.service_usages_count > 0
                                                        ? formatCurrency(
                                                              notaria.total_cost /
                                                                  notaria.service_usages_count,
                                                          )
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
