import { Head, Link, router } from '@inertiajs/react';
import {
    Eye,
    Package,
    Edit,
    ArrowLeft,
    Power,
    PowerOff,
    Building2,
    UserCheck,
    DollarSign,
    Settings,
} from 'lucide-react';

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

import type { BreadcrumbItem } from '@/types';

interface Service {
    id: number;
    code: string;
    name: string;
    pivot: {
        is_included: boolean;
        usage_limit: number | null;
        extra_price: number | null;
    };
}

interface Plan {
    id: number;
    nombre: string;
    slug: string;
    descripcion?: string;
    precio_mensual: number | string;
    precio_anual: number | string;
    limite_usuarios: number | null;
    limite_busquedas_mes: number | null;
    herramientas_activas: string[];
    caracteristicas: string[];
    is_active: boolean;
    orden: number;
    created_at: string;
    updated_at: string;
    services?: Service[];
}

interface Stats {
    total_notarias: number;
    active_subscriptions: number;
    total_services: number;
    monthly_revenue: number | string;
    annual_revenue: number | string;
}

interface PlansShowProps {
    plan: Plan;
    stats: Stats;
}

export default function PlansShow({ plan, stats }: PlansShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Inicio',
            href: '/dashboard',
        },
        {
            title: 'Planes',
            href: '/admin/plans',
        },
        {
            title: plan.nombre,
            href: '#',
            icon: Eye,
        },
    ];

    const handleToggleStatus = () => {
        if (
            confirm(
                `¿Estás seguro de ${plan.is_active ? 'desactivar' : 'activar'} este plan?`,
            )
        ) {
            router.post(`/admin/plans/${plan.id}/toggle-active`);
        }
    };

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `$${numAmount.toFixed(2)}`;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const monthlyRev = typeof stats.monthly_revenue === 'string' ? parseFloat(stats.monthly_revenue) : stats.monthly_revenue;
    const annualRev = typeof stats.annual_revenue === 'string' ? parseFloat(stats.annual_revenue) : stats.annual_revenue;
    const totalRevenue = monthlyRev + annualRev;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Plan - ${plan.nombre}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header Actions */}
                <div className="flex items-center justify-end gap-2">
                    <Badge
                        variant={
                            plan.is_active ? 'default' : 'secondary'
                        }
                        className={
                            plan.is_active
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                        }
                    >\n                        {plan.is_active ? 'Activo' : 'Inactivo'}
                    </Badge>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleToggleStatus}
                            className={
                                plan.is_active
                                    ? 'text-red-600 hover:text-red-700'
                                    : 'text-green-600 hover:text-green-700'
                            }
                        >
                            {plan.is_active ? (
                                <>
                                    <PowerOff className="mr-2 h-4 w-4" />
                                    Desactivar
                                </>
                            ) : (
                                <>
                                    <Power className="mr-2 h-4 w-4" />
                                    Activar
                                </>
                            )}
                        </Button>
                        <Link href={`/admin/plans/${plan.id}/edit`}>
                            <Button>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Notarías
                            </CardTitle>
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_notarias}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                notarías con este plan
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Suscripciones Activas
                            </CardTitle>
                            <UserCheck className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.active_subscriptions}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                suscripciones activas
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Total Servicios
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_services}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                servicios incluidos
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ingresos Mensuales
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(totalRevenue)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                ingresos del mes
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Botón Gestionar Servicios */}
                <Link href={`/admin/plans/${plan.id}/services`}>
                    <Button className="w-full" size="lg" variant="default">
                        <Settings className="mr-2 h-5 w-5" />
                        Gestionar Servicios
                    </Button>
                </Link>

                {/* Detalles del Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detalles del Plan</CardTitle>
                        <CardDescription>
                            Información general del plan
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Nombre
                                </p>
                                <p className="text-base font-medium">
                                    {plan.nombre}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Slug
                                </p>
                                <p className="font-mono text-base">
                                    {plan.slug}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Precio Mensual
                                </p>
                                <p className="text-lg font-semibold">
                                    {formatCurrency(plan.precio_mensual)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Precio Anual
                                </p>
                                <p className="text-lg font-semibold">
                                    {formatCurrency(plan.precio_anual)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Límite de Usuarios
                                </p>
                                <p className="text-base">
                                    {plan.limite_usuarios !== null
                                        ? plan.limite_usuarios
                                        : 'Ilimitado'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Límite de Búsquedas/Mes
                                </p>
                                <p className="text-base">
                                    {plan.limite_busquedas_mes !== null
                                        ? plan.limite_busquedas_mes
                                        : 'Ilimitado'}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Orden
                                </p>
                                <p className="text-base">{plan.orden}</p>
                            </div>
                        </div>

                        {plan.herramientas_activas &&
                            plan.herramientas_activas.length > 0 && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                                        Herramientas Activas
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {plan.herramientas_activas.map(
                                            (herramienta, index) => (
                                                <Badge
                                                    key={index}
                                                    variant="outline"
                                                >
                                                    {herramienta}
                                                </Badge>
                                            ),
                                        )}
                                    </div>
                                </div>
                            )}

                        {plan.caracteristicas &&
                            plan.caracteristicas.length > 0 && (
                                <div>
                                    <p className="mb-2 text-sm font-medium text-muted-foreground">
                                        Características
                                    </p>
                                    <ul className="list-inside list-disc space-y-1">
                                        {plan.caracteristicas.map(
                                            (caracteristica, index) => (
                                                <li
                                                    key={index}
                                                    className="text-sm"
                                                >
                                                    {caracteristica}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                </div>
                            )}

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Fecha de Creación
                                </p>
                                <p className="text-base">
                                    {formatDate(plan.created_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Última Actualización
                                </p>
                                <p className="text-base">
                                    {formatDate(plan.updated_at)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Servicios Asignados */}
                {plan.services && plan.services.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Package className="h-5 w-5" />
                                Servicios Asignados
                            </CardTitle>
                            <CardDescription>
                                Lista de servicios incluidos en este plan
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Código</TableHead>
                                            <TableHead>Nombre</TableHead>
                                            <TableHead>Incluido</TableHead>
                                            <TableHead>Límite</TableHead>
                                            <TableHead>
                                                Precio Extra
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {plan.services.map((service) => (
                                            <TableRow key={service.id}>
                                                <TableCell className="font-mono text-sm">
                                                    {service.code}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={`/admin/services/${service.id}`}
                                                        className="hover:underline"
                                                    >
                                                        {service.name}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            service.pivot
                                                                .is_included
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {service.pivot
                                                            .is_included
                                                            ? 'Sí'
                                                            : 'No'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {service.pivot
                                                        .usage_limit !== null
                                                        ? service.pivot.usage_limit.toLocaleString()
                                                        : 'Ilimitado'}
                                                </TableCell>
                                                <TableCell>
                                                    {service.pivot
                                                        .extra_price !== null
                                                        ? formatCurrency(
                                                              service.pivot
                                                                  .extra_price,
                                                          )
                                                        : '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
