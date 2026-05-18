import { Head } from '@inertiajs/react';
import { Activity, AlertCircle, BarChart3, DollarSign, FileDown, TrendingUp, Users, Package, Clock } from 'lucide-react';
import { useState } from 'react';

import * as ReportsController from '@/actions/App/Http/Controllers/Admin/ReportsController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface ReportsStats {
    total_requests: number;
    total_quantity: number;
    total_cost: number;
    active_notarias: number;
    unique_services: number;
    avg_cost_per_request: number;
}

interface CategoryStat {
    category: string;
    label: string;
    icon: string;
    total_requests: number;
    percentage: number;
    total_cost: number;
    total_quantity: number;
    unique_notarias: number;
    services_count: number;
}

interface ServiceDetail {
    name: string;
    code: string;
    requests: number;
    cost: number;
}

interface LimitAlert {
    notaria_id: number;
    notaria_nombre: string;
    service_name: string;
    service_code: string;
    usage_percentage: number;
    used: number;
    limit: number;
    remaining: number;
    alert_level: 'warning' | 'critical';
}

interface BillingModelStat {
    billing_model: string;
    label: string;
    icon: string;
    total_requests: number;
    total_cost: number;
    total_quantity: number;
    services: ServiceDetail[];
    near_limit?: LimitAlert[];
}

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
}

interface ReportsProps {
    stats: ReportsStats;
    categoryStats: CategoryStat[];
    billingModelStats: BillingModelStat[];
    period: string;
    notarias: Notaria[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Reportes',
        href: ReportsController.index.url(),
        icon: BarChart3,
    },
];

export default function Index({ stats, categoryStats, billingModelStats, period, notarias }: ReportsProps) {
    const [selectedPeriod, setSelectedPeriod] = useState(period);
    const [selectedNotaria, setSelectedNotaria] = useState<string>('all');

    const handlePeriodChange = (value: string) => {
        setSelectedPeriod(value);
        window.location.href = ReportsController.index.url({
            query: {
                period: value,
                notaria_id: selectedNotaria !== 'all' ? selectedNotaria : undefined
            }
        });
    };

    const handleNotariaChange = (value: string) => {
        setSelectedNotaria(value);
        window.location.href = ReportsController.index.url({
            query: {
                period: selectedPeriod,
                notaria_id: value !== 'all' ? value : undefined
            }
        });
    };

    const handleExport = async (type: string) => {
        try {
            const response = await fetch(ReportsController.exportMethod.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    type,
                    period: selectedPeriod,
                    notaria_id: selectedNotaria !== 'all' ? selectedNotaria : undefined,
                }),
            });

            if (!response.ok) throw new Error('Error al exportar reporte');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al exportar reporte:', error);
            alert('Error al generar el archivo Excel. Por favor intente nuevamente.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reportes de Uso" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

                    {/* Tarjetas de estadísticas generales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total de Solicitudes</CardTitle>
                                <Activity className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.total_requests.toLocaleString()}</div>
                                <p className="text-xs text-muted-foreground">
                                    Cantidad total: {stats.total_quantity.toLocaleString()}
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Costo Total</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">${Number(stats.total_cost ?? 0).toFixed(2)}</div>
                                <p className="text-xs text-muted-foreground">
                                    Promedio: ${Number(stats.avg_cost_per_request ?? 0).toFixed(2)} por solicitud
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Notarías Activas</CardTitle>
                                <Users className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stats.active_notarias}</div>
                                <p className="text-xs text-muted-foreground">
                                    {stats.active_notarias === 0 ? '0 servicios utilizados' : `${stats.unique_services} servicios disponibles`}
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filtros y controles */}
                    <div className="flex items-center justify-end gap-2">
                        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
                            <SelectTrigger className="w-45">
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="week">Esta Semana</SelectItem>
                                <SelectItem value="month">Este Mes</SelectItem>
                                <SelectItem value="year">Este Año</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={selectedNotaria} onValueChange={handleNotariaChange}>
                            <SelectTrigger className="w-50">
                                <SelectValue placeholder="Todas las notarías" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas las notarías</SelectItem>
                                {notarias.map((notaria) => (
                                    <SelectItem key={notaria.id} value={notaria.id.toString()}>
                                        {notaria.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Button variant="outline" onClick={() => handleExport('usage')}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Exportar
                        </Button>
                    </div>

                    {/* Estadísticas por Categoría y Modelo de Facturación */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Distribución por Categoría */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-blue-600" />
                                    Distribución por Categoría
                                </CardTitle>
                                <CardDescription>
                                    Uso y costo por tipo de servicio
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {categoryStats && categoryStats.length > 0 ? (
                                    categoryStats.map((category) => (
                                        <div key={category.category} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{category.icon}</span>
                                                    <div>
                                                        <p className="text-sm font-medium">{category.label}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {category.services_count} {category.services_count === 1 ? 'servicio' : 'servicios'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold">
                                                        {category.total_requests.toLocaleString()} ({category.percentage}%)
                                                    </p>
                                                    <p className="text-xs font-medium text-green-600">
                                                        ${category.total_cost.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                            <Progress value={category.percentage} className="h-2" />
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay datos disponibles para el período seleccionado
                                    </p>
                                )}
                            </CardContent>
                        </Card>

                        {/* Impacto por Modelo de Facturación */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Impacto por Modelo de Facturación
                                </CardTitle>
                                <CardDescription>
                                    Análisis de costos por tipo de cobro
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {billingModelStats && billingModelStats.length > 0 ? (
                                    billingModelStats.map((model) => (
                                        <div key={model.billing_model} className="space-y-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xl">{model.icon}</span>
                                                    <div>
                                                        <p className="text-sm font-medium">{model.label}</p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {model.services.length} {model.services.length === 1 ? 'servicio' : 'servicios'}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-sm font-semibold">
                                                        {model.total_requests.toLocaleString()} req.
                                                    </p>
                                                    <p className={`text-xs font-medium ${model.total_cost > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                                                        ${model.total_cost.toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Alertas de límite para servicios LIMITED */}
                                            {model.billing_model === 'limited' && model.near_limit && model.near_limit.length > 0 && (
                                                <div className="mt-2 space-y-1">
                                                    {model.near_limit.map((alert, idx) => (
                                                        <div
                                                            key={idx}
                                                            className={`p-2 rounded text-xs ${
                                                                alert.alert_level === 'critical'
                                                                    ? 'bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-900'
                                                                    : 'bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-400 border border-orange-200 dark:border-orange-900'
                                                            }`}
                                                        >
                                                            <div className="flex items-center justify-between">
                                                                <span className="font-medium">{alert.notaria_nombre}</span>
                                                                <Badge
                                                                    variant={alert.alert_level === 'critical' ? 'destructive' : 'secondary'}
                                                                    className="text-xs"
                                                                >
                                                                    {alert.usage_percentage.toFixed(0)}% usado
                                                                </Badge>
                                                            </div>
                                                            <p className="mt-1">
                                                                {alert.service_name}: {alert.used}/{alert.limit} ({alert.remaining} restantes)
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Detalles de servicios */}
                                            {model.services.length > 0 && (
                                                <div className="mt-2 pl-6 space-y-1">
                                                    {model.services.slice(0, 3).map((service) => (
                                                        <div key={service.code} className="flex justify-between text-xs text-muted-foreground">
                                                            <span>• {service.name}</span>
                                                            <span>{service.requests} req. (${service.cost.toFixed(2)})</span>
                                                        </div>
                                                    ))}
                                                    {model.services.length > 3 && (
                                                        <p className="text-xs text-muted-foreground italic">
                                                            + {model.services.length - 3} más
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay datos disponibles para el período seleccionado
                                    </p>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Sección de acceso rápido */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Accesos Rápidos</CardTitle>
                                <CardDescription>
                                    Navega a diferentes reportes y análisis
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <a
                                    href={ReportsController.serviceUsage.url()}
                                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <div className="font-medium">Uso por Servicio</div>
                                    <div className="text-sm text-muted-foreground">
                                        Detalles de uso de cada servicio
                                    </div>
                                </a>
                                <a
                                    href={ReportsController.topServices.url()}
                                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        <div className="font-medium">Top Servicios</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Ranking de servicios más utilizados
                                    </div>
                                </a>
                                <a
                                    href={ReportsController.notariasComparison.url()}
                                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <div className="font-medium">Comparativa de Notarías</div>
                                    <div className="text-sm text-muted-foreground">
                                        Compara el uso entre notarías
                                    </div>
                                </a>
                                <a
                                    href={ReportsController.usageTrends.url()}
                                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4" />
                                        <div className="font-medium">Tendencias de Uso</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Análisis histórico de consumo
                                    </div>
                                </a>
                                <a
                                    href={ReportsController.notariasNearLimit.url()}
                                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <AlertCircle className="h-4 w-4 text-orange-500" />
                                        <div className="font-medium">Notarías Cerca del Límite</div>
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                        Alertas de uso próximo a límites
                                    </div>
                                </a>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileDown className="h-5 w-5 text-green-600" />
                                    Exportar Reportes a Excel
                                </CardTitle>
                                <CardDescription>
                                    Descarga datos con formato profesional y logo de Atinet
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {/* Info sobre filtros aplicados */}
                                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-900">
                                    <p className="text-xs font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                        📊 Filtros Activos:
                                    </p>
                                    <div className="flex flex-wrap gap-1">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-400">
                                            {selectedPeriod === 'week' && '📅 Esta Semana'}
                                            {selectedPeriod === 'month' && '📅 Este Mes'}
                                            {selectedPeriod === 'year' && '📅 Este Año'}
                                        </span>
                                        {selectedNotaria !== 'all' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-400">
                                                🏢 {notarias.find(n => n.id.toString() === selectedNotaria)?.nombre}
                                            </span>
                                        )}
                                        {selectedNotaria === 'all' && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400">
                                                🏢 Todas las notarías
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        ℹ️ Los archivos Excel solo incluirán datos que cumplan con estos filtros
                                    </p>
                                </div>

                                {/* Botón 1: Uso Detallado */}
                                <div className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-auto py-2"
                                        onClick={() => handleExport('usage')}
                                    >
                                        <div className="flex items-start gap-3 w-full">
                                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                                                <FileDown className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium">Uso Detallado</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Cada fila = 1 solicitud | Incluye: Fecha, Notaría, Servicio, Usuario, Cantidad, Costo
                                                </div>
                                            </div>
                                        </div>
                                    </Button>
                                </div>

                                {/* Botón 2: Por Notarías */}
                                <div className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-auto py-2"
                                        onClick={() => handleExport('notarias')}
                                    >
                                        <div className="flex items-start gap-3 w-full">
                                            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded">
                                                <FileDown className="h-4 w-4 text-green-600 dark:text-green-400" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium">Resumen por Notarías</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Totales agrupados | Incluye: Notaría, Total Solicitudes, Cantidad, Costo
                                                </div>
                                            </div>
                                        </div>
                                    </Button>
                                </div>

                                {/* Botón 3: Por Servicios */}
                                <div className="border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                                    <Button
                                        variant="outline"
                                        className="w-full justify-start h-auto py-2"
                                        onClick={() => handleExport('services')}
                                    >
                                        <div className="flex items-start gap-3 w-full">
                                            <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded">
                                                <FileDown className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <div className="flex-1 text-left">
                                                <div className="font-medium">Resumen por Servicios</div>
                                                <div className="text-xs text-muted-foreground mt-0.5">
                                                    Análisis de popularidad | Incluye: Servicio, Totales, Notarías Únicas
                                                </div>
                                            </div>
                                        </div>
                                    </Button>
                                </div>

                                {/* Nota final */}
                                <div className="text-xs text-muted-foreground text-center pt-2 border-t">
                                    💾 Todos los archivos incluyen logo de Atinet y formato profesional
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </AppLayout>
    );
}
