import { Head, Link } from '@inertiajs/react';
import { AlertCircle, AlertTriangle, CheckCircle, ChevronRight, Info } from 'lucide-react';
import {
    Bar,
    BarChart,
    Cell,
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
}

interface Service {
    name: string;
    code: string;
    usage_percentage: number;
    used: number;
    limit: number;
    remaining: number;
    is_unlimited: boolean;
    usage_count?: number;  // Alias para compatibilidad
    usage_limit?: number;  // Alias para compatibilidad
}

interface NearLimitItem {
    notaria: Notaria;
    service: Service;
    alert_type?: 'usage' | 'subscription';
    days_remaining?: number;
    expiration_date?: string;
    subscription_status?: string;
}

interface NotariasNearLimitProps {
    near_limit: NearLimitItem[];
    threshold: number;
}

interface ChartDataItem {
    notaria: string;
    servicio: string;
    porcentaje: number;
    usado: number;
    limite: number;
    notaria_id: number;
}

interface TooltipPayload {
    payload: ChartDataItem;
}

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
        icon: AlertCircle,
    },
];

// Colores según severidad
const getSeverityColor = (percentage: number): string => {
    if (percentage >= 95) return '#ef4444'; // Rojo crítico
    if (percentage >= 90) return '#f97316'; // Naranja
    if (percentage >= 80) return '#f59e0b'; // Amarillo
    if (percentage >= 70) return '#eab308'; // Amarillo claro
    return '#10b981'; // Verde
};

const getSeverityBadge = (percentage: number) => {
    if (percentage >= 95) {
        return (
            <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                Crítico
            </Badge>
        );
    }
    if (percentage >= 90) {
        return (
            <Badge className="gap-1 bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400">
                <AlertCircle className="h-3 w-3" />
                Muy Alto
            </Badge>
        );
    }
    if (percentage >= 80) {
        return (
            <Badge className="gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">
                <AlertTriangle className="h-3 w-3" />
                Alto
            </Badge>
        );
    }
    if (percentage >= 70) {
        return (
            <Badge className="gap-1 bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                <Info className="h-3 w-3" />
                Precaución
            </Badge>
        );
    }
    return (
        <Badge variant="outline" className="gap-1 text-green-600">
            <CheckCircle className="h-3 w-3" />
            Normal
        </Badge>
    );
};

const getSeverityIcon = (percentage: number) => {
    if (percentage >= 95) {
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (percentage >= 90) {
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
    }
    if (percentage >= 80) {
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
    if (percentage >= 70) {
        return <Info className="h-5 w-5 text-yellow-400" />;
    }
    return <CheckCircle className="h-5 w-5 text-green-500" />;
};

// Tooltip personalizado para el gráfico
const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: TooltipPayload[] }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="rounded-lg border bg-background p-3 shadow-lg">
                <p className="font-semibold">{data.notaria}</p>
                <p className="text-sm text-muted-foreground">{data.servicio}</p>
                <div className="mt-2 space-y-1 text-sm">
                    <p>
                        Usado:{' '}
                        <span className="font-medium">
                            {data.usado.toLocaleString()} / {data.limite.toLocaleString()}
                        </span>
                    </p>
                    <p>
                        Porcentaje:{' '}
                        <span
                            className="font-bold"
                            style={{ color: getSeverityColor(data.porcentaje) }}
                        >
                            {data.porcentaje.toFixed(1)}%
                        </span>
                    </p>
                </div>
            </div>
        );
    }
    return null;
};

export default function NotariasNearLimit({
    near_limit,
    threshold,
}: NotariasNearLimitProps) {

    // Preparar datos para el gráfico (excluir alertas de suscripción)
    const chartData = near_limit
        .filter(item => item.alert_type !== 'subscription')
        .map((item) => ({
            name: `${item.notaria.nombre} - ${item.service.name}`,
            notaria: item.notaria.nombre,
            servicio: item.service.name,
            porcentaje: item.service.usage_percentage,
            usado: item.service.used,
            limite: item.service.limit,
        }))
        .sort((a, b) => b.porcentaje - a.porcentaje)
        .slice(0, 10); // Top 10 para el gráfico

    // Calcular estadísticas
    const stats = {
        total: near_limit.length,
        critico: near_limit.filter((item) => item.service.usage_percentage >= 95).length,
        muyAlto: near_limit.filter(
            (item) =>
                item.service.usage_percentage >= 90 &&
                item.service.usage_percentage < 95,
        ).length,
        alto: near_limit.filter(
            (item) =>
                item.service.usage_percentage >= 80 &&
                item.service.usage_percentage < 90,
        ).length,
        notariasAfectadas: new Set(near_limit.map((item) => item.notaria.id)).size,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Notarías Cerca del Límite" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Servicios cercanos al límite y suscripciones próximas a vencer
                            </p>
                        </div>
                        <Link href={ReportsController.index.url()}>
                            <Button variant="outline">Volver a Reportes</Button>
                        </Link>
                    </div>

                    {/* Estadísticas rápidas */}
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <p className="text-xs text-muted-foreground">
                                    Total Alertas
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-red-600">
                                    {stats.critico}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Crítico (≥95%)
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-orange-600">
                                    {stats.muyAlto}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Muy Alto (90-95%)
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {stats.alto}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Alto (80-90%)
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-2xl font-bold">{stats.notariasAfectadas}</div>
                                <p className="text-xs text-muted-foreground">
                                    Notarías Afectadas
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Gráfico de barras horizontales */}
                    {chartData.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Top 10 Servicios Cerca del Límite</CardTitle>
                                <CardDescription>
                                    Visualización de los servicios con mayor porcentaje de uso
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={400}>
                                    <BarChart
                                        data={chartData}
                                        layout="vertical"
                                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                    >
                                        <XAxis type="number" domain={[0, 100]} />
                                        <YAxis
                                            type="category"
                                            dataKey="name"
                                            width={200}
                                            tick={{ fontSize: 12 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar
                                            dataKey="porcentaje"
                                            radius={[0, 8, 8, 0]}
                                            label={{
                                                position: 'right',
                                                formatter: (value: unknown) => `${Number(value).toFixed(1)}%`,
                                                fontSize: 12,
                                            }}
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={getSeverityColor(entry.porcentaje)}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    )}

                    {/* Tabla detallada */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Detalle de Alertas</CardTitle>
                            <CardDescription>
                                Lista completa de servicios por notaría cercanos al límite
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {near_limit.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <CheckCircle className="mb-4 h-12 w-12 text-green-500" />
                                    <p className="text-lg font-medium">
                                        ¡No hay alertas de límite!
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Ninguna notaría ha alcanzado el {threshold}% de uso en
                                        sus servicios
                                    </p>
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Notaría</TableHead>
                                            <TableHead>Servicio</TableHead>
                                            <TableHead>Usado</TableHead>
                                            <TableHead>Límite</TableHead>
                                            <TableHead>Restante</TableHead>
                                            <TableHead>Progreso</TableHead>
                                            <TableHead>Estado</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {near_limit
                                            .sort(
                                                (a, b) =>
                                                    b.service.usage_percentage -
                                                    a.service.usage_percentage,
                                            )
                                            .map((item, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            {getSeverityIcon(
                                                                item.service.usage_percentage,
                                                            )}
                                                            <div>
                                                                <div className="font-medium">
                                                                    {item.notaria.nombre}
                                                                </div>
                                                                <div className="text-xs text-muted-foreground">
                                                                    #{item.notaria.numero_notaria}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="font-medium">
                                                            {item.service.name}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {item.service.code}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.alert_type === 'subscription' ? (
                                                            <span className="text-sm text-muted-foreground">
                                                                {item.days_remaining} días restantes
                                                            </span>
                                                        ) : (
                                                            <span className="font-medium">
                                                                {item.service.used.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.alert_type === 'subscription' ? (
                                                            <span className="text-sm">
                                                                {item.expiration_date}
                                                            </span>
                                                        ) : (
                                                            item.service.limit.toLocaleString()
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {item.alert_type === 'subscription' ? (
                                                            <Badge variant={item.subscription_status === 'trial' ? 'secondary' : 'default'}>
                                                                {item.subscription_status}
                                                            </Badge>
                                                        ) : (
                                                            <span
                                                                className={
                                                                    item.service.remaining <= 10
                                                                        ? 'font-bold text-red-600'
                                                                        : item.service.remaining <= 50
                                                                          ? 'font-medium text-yellow-600'
                                                                          : ''
                                                                }
                                                            >
                                                                {item.service.remaining.toLocaleString()}
                                                            </span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                                                                <div
                                                                    className="h-full rounded-full transition-all"
                                                                    style={{
                                                                        width: `${item.service.usage_percentage}%`,
                                                                        backgroundColor:
                                                                            getSeverityColor(
                                                                                item.service
                                                                                    .usage_percentage,
                                                                            ),
                                                                    }}
                                                                />
                                                            </div>
                                                            <span
                                                                className="text-sm font-bold"
                                                                style={{
                                                                    color: getSeverityColor(
                                                                        item.service
                                                                            .usage_percentage,
                                                                    ),
                                                                }}
                                                            >
                                                                {item.service.usage_percentage.toFixed(
                                                                    1,
                                                                )}
                                                                %
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {getSeverityBadge(
                                                            item.service.usage_percentage,
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Link
                                                            href={ReportsController.notariaStats.url(
                                                                item.notaria.id,
                                                            )}
                                                        >
                                                            <Button variant="ghost" size="sm">
                                                                Ver Detalle
                                                                <ChevronRight className="ml-1 h-4 w-4" />
                                                            </Button>
                                                        </Link>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
