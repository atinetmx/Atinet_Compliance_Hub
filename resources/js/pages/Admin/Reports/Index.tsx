import { Head } from '@inertiajs/react';
import { Activity, AlertCircle, BarChart3, DollarSign, FileDown, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

import * as ReportsController from '@/actions/App/Http/Controllers/Admin/ReportsController';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
}

interface ReportsProps {
    stats: ReportsStats;
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

export default function Index({ stats, period, notarias }: ReportsProps) {
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

    const handleExport = (type: string) => {
        window.location.href = ReportsController.exportMethod.url({
            query: { type, period: selectedPeriod }
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reportes de Uso" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8 space-y-6">

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
                                <CardTitle>Exportar Reportes</CardTitle>
                                <CardDescription>
                                    Descarga reportes en formato CSV
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleExport('usage')}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Reporte de Uso Detallado
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleExport('notarias')}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Reporte por Notarías
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => handleExport('services')}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Reporte por Servicios
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Información del período */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-sm text-center text-muted-foreground">
                                Mostrando datos de: <span className="font-semibold">
                                    {selectedPeriod === 'week' && 'Esta Semana'}
                                    {selectedPeriod === 'month' && 'Este Mes'}
                                    {selectedPeriod === 'year' && 'Este Año'}
                                </span>
                                {selectedNotaria !== 'all' && (
                                    <> para <span className="font-semibold">
                                        {notarias.find(n => n.id.toString() === selectedNotaria)?.nombre}
                                    </span></>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </AppLayout>
    );
}
