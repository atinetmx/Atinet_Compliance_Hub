import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Calendar, Filter, Search, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { Line, LineChart, ResponsiveContainer } from 'recharts';

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

interface Service {
    id: number;
    code: string;
    name: string;
    category?: string;
}

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
}

interface User {
    id: number;
    name: string;
}

interface UsageRecord {
    id: number;
    service_id: number;
    notaria_id: number;
    user_id: number | null;
    quantity: number;
    cost: number;
    consumed_at: string;
    metadata: Record<string, unknown> | null;
    service: Service;
    notaria: Notaria;
    user: User | null;
}

interface PaginatedUsage {
    data: UsageRecord[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
}

interface ServiceUsageProps {
    usage: PaginatedUsage;
    sparklineData: Record<number, number[]>;
    services: Service[];
    notarias: Notaria[];
    filters: {
        service_code?: string;
        period: string;
        notaria_id?: number;
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
        title: 'Uso de Servicios',
        href: ReportsController.serviceUsage.url(),
    },
];

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
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

// Mini sparkline component
function Sparkline({ data }: { data: number[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="flex h-10 w-24 items-center justify-center text-xs text-muted-foreground">
                Sin datos
            </div>
        );
    }

    const chartData = data.map((value, index) => ({ value, index }));
    const max = Math.max(...data);
    const hasData = max > 0;

    return (
        <ResponsiveContainer width={96} height={40}>
            <LineChart data={chartData}>
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={hasData ? '#3b82f6' : '#cbd5e1'}
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}

export default function ServiceUsage({
    usage,
    sparklineData,
    services,
    notarias,
    filters,
}: ServiceUsageProps) {
    const [selectedService, setSelectedService] = useState(filters.service_code || 'all');
    const [selectedNotaria, setSelectedNotaria] = useState(
        filters.notaria_id?.toString() || 'all',
    );
    const [selectedPeriod, setSelectedPeriod] = useState(filters.period);

    const applyFilters = () => {
        router.get(
            ReportsController.serviceUsage.url(),
            {
                service_code: selectedService !== 'all' ? selectedService : undefined,
                notaria_id: selectedNotaria !== 'all' ? selectedNotaria : undefined,
                period: selectedPeriod,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const resetFilters = () => {
        setSelectedService('all');
        setSelectedNotaria('all');
        setSelectedPeriod('month');
        router.get(ReportsController.serviceUsage.url(), { period: 'month' });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Uso de Servicios" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-semibold leading-tight text-gray-800 dark:text-gray-200">
                                Uso de Servicios
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Historial detallado de consumo de servicios por notaría
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
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5" />
                                Filtros
                            </CardTitle>
                            <CardDescription>
                                Filtra los registros por servicio, notaría y período
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Servicio</label>
                                    <Select
                                        value={selectedService}
                                        onValueChange={setSelectedService}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todos los servicios" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Todos los servicios
                                            </SelectItem>
                                            {services.map((service) => (
                                                <SelectItem
                                                    key={service.id}
                                                    value={service.code}
                                                >
                                                    {service.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Notaría</label>
                                    <Select
                                        value={selectedNotaria}
                                        onValueChange={setSelectedNotaria}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Todas las notarías" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">
                                                Todas las notarías
                                            </SelectItem>
                                            {notarias.map((notaria) => (
                                                <SelectItem
                                                    key={notaria.id}
                                                    value={notaria.id.toString()}
                                                >
                                                    {notaria.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

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

                                <div className="flex items-end gap-2">
                                    <Button onClick={applyFilters} className="flex-1">
                                        <Search className="mr-2 h-4 w-4" />
                                        Aplicar
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={resetFilters}
                                        className="flex-1"
                                    >
                                        Limpiar
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900">
                                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">{usage.total}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Total de registros
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900">
                                        <Calendar className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-bold">
                                            {formatCurrency(
                                                usage.data.reduce(
                                                    (sum, record) => sum + record.cost,
                                                    0,
                                                ),
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Costo en esta página
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
                                        <p className="text-2xl font-bold">
                                            {usage.data.reduce(
                                                (sum, record) => sum + record.quantity,
                                                0,
                                            )}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Cantidad consumida
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Tabla de uso */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Registros de Uso</CardTitle>
                            <CardDescription>
                                Mostrando {usage.data.length} de {usage.total} registros (página{' '}
                                {usage.current_page} de {usage.last_page})
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {usage.data.length > 0 ? (
                                <>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Fecha</TableHead>
                                                <TableHead>Servicio</TableHead>
                                                <TableHead>Notaría</TableHead>
                                                <TableHead>Usuario</TableHead>
                                                <TableHead className="text-right">
                                                    Cantidad
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Costo
                                                </TableHead>
                                                <TableHead>Tendencia (7d)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {usage.data.map((record) => (
                                                <TableRow key={record.id}>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {formatDate(record.consumed_at)}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="space-y-1">
                                                            <div className="font-medium">
                                                                {record.service.name}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <code className="text-xs text-muted-foreground">
                                                                    {record.service.code}
                                                                </code>
                                                                {record.service.category && (
                                                                    <Badge
                                                                        variant={getCategoryBadgeVariant(
                                                                            record.service
                                                                                .category,
                                                                        )}
                                                                        className="text-xs"
                                                                    >
                                                                        {record.service.category}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">
                                                                {record.notaria.nombre}
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                #{record.notaria.numero_notaria}
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-sm">
                                                            {record.user?.name || (
                                                                <span className="text-muted-foreground">
                                                                    N/A
                                                                </span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-medium">
                                                            {record.quantity}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <span className="font-medium">
                                                            {formatCurrency(record.cost)}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Sparkline
                                                            data={
                                                                sparklineData[
                                                                    record.service_id
                                                                ] || []
                                                            }
                                                        />
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>

                                    {/* Paginación */}
                                    {usage.last_page > 1 && (
                                        <div className="mt-4 flex items-center justify-between">
                                            <div className="text-sm text-muted-foreground">
                                                Mostrando {(usage.current_page - 1) * usage.per_page + 1} a{' '}
                                                {Math.min(
                                                    usage.current_page * usage.per_page,
                                                    usage.total,
                                                )}{' '}
                                                de {usage.total} registros
                                            </div>
                                            <div className="flex gap-2">
                                                {usage.links.map((link, index) => {
                                                    if (!link.url) return null;

                                                    const isActive = link.active;
                                                    const isNextOrPrev =
                                                        link.label.includes('Previous') ||
                                                        link.label.includes('Next');

                                                    return (
                                                        <Button
                                                            key={index}
                                                            variant={
                                                                isActive ? 'default' : 'outline'
                                                            }
                                                            size="sm"
                                                            onClick={() =>
                                                                router.get(link.url!)
                                                            }
                                                            disabled={isActive}
                                                        >
                                                            {isNextOrPrev
                                                                ? link.label
                                                                      .replace('&laquo;', '«')
                                                                      .replace('&raquo;', '»')
                                                                : link.label}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="flex h-40 items-center justify-center text-muted-foreground">
                                    No se encontraron registros con los filtros seleccionados
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
