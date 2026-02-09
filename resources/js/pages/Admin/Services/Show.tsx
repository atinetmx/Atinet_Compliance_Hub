import { Head, Link, router } from '@inertiajs/react';
import {
    Package,
    Edit,
    ArrowLeft,
    Power,
    PowerOff,
    TrendingUp,
    Users,
    DollarSign,
    BarChart3,
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

interface Plan {
    id: number;
    nombre: string;
    pivot: {
        is_included: boolean;
        usage_limit: number | null;
        extra_price: number | null;
    };
}

interface Service {
    id: number;
    code: string;
    name: string;
    description: string;
    category: string;
    billing_model: string;
    unit_price: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    plans?: Plan[];
}

interface Stats {
    total_plans: number;
    active_tenants: number;
    total_usage_month: number;
    total_revenue_month: number;
}

interface ServicesShowProps {
    service: Service;
    stats: Stats;
    categoryLabel: string;
    billingModelLabel: string;
}

export default function ServicesShow({
    service,
    stats,
    categoryLabel,
    billingModelLabel,
}: ServicesShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Servicios',
            href: '/admin/services',
        },
        {
            title: service.name,
            href: '#',
        },
    ];

    const handleToggleStatus = () => {
        if (
            confirm(
                `¿Estás seguro de ${service.is_active ? 'desactivar' : 'activar'} este servicio?`,
            )
        ) {
            router.patch(`/admin/services/${service.id}/toggle-status`);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Servicio - ${service.name}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.history.back()}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                        <Package className="h-6 w-6 text-primary" />
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold">
                                    {service.name}
                                </h1>
                                <Badge
                                    variant={
                                        service.is_active
                                            ? 'default'
                                            : 'secondary'
                                    }
                                >
                                    {service.is_active ? 'Activo' : 'Inactivo'}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                Código: {service.code}
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={handleToggleStatus}
                            className={
                                service.is_active
                                    ? 'text-red-600 hover:text-red-700'
                                    : 'text-green-600 hover:text-green-700'
                            }
                        >
                            {service.is_active ? (
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
                        <Link href={`/admin/services/${service.id}/edit`}>
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
                                Planes Asociados
                            </CardTitle>
                            <Package className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_plans}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                planes incluyen este servicio
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Tenants Activos
                            </CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.active_tenants}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                tenants usando el servicio
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Uso del Mes
                            </CardTitle>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {stats.total_usage_month.toLocaleString()}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                consultas este mes
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                Ingresos del Mes
                            </CardTitle>
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {formatCurrency(stats.total_revenue_month)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                generados este mes
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Información Básica */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información Básica</CardTitle>
                        <CardDescription>
                            Detalles del servicio
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Nombre
                                </p>
                                <p className="text-base font-medium">
                                    {service.name}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Código
                                </p>
                                <p className="font-mono text-base">
                                    {service.code}
                                </p>
                            </div>
                            <div className="md:col-span-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Descripción
                                </p>
                                <p className="text-base">
                                    {service.description}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Configuración */}
                <Card>
                    <CardHeader>
                        <CardTitle>Configuración</CardTitle>
                        <CardDescription>
                            Parámetros del servicio
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Categoría
                                </p>
                                <Badge variant="outline" className="mt-1">
                                    {categoryLabel}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Modelo de Facturación
                                </p>
                                <Badge variant="outline" className="mt-1">
                                    {billingModelLabel}
                                </Badge>
                            </div>
                            {service.unit_price !== null && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Precio Unitario
                                    </p>
                                    <p className="text-lg font-semibold">
                                        {formatCurrency(service.unit_price)}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Fecha de Creación
                                </p>
                                <p className="text-base">
                                    {formatDate(service.created_at)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Última Actualización
                                </p>
                                <p className="text-base">
                                    {formatDate(service.updated_at)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Planes Asociados */}
                {service.plans && service.plans.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Planes Asociados
                            </CardTitle>
                            <CardDescription>
                                Lista de planes que incluyen este servicio
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Plan</TableHead>
                                            <TableHead>Incluido</TableHead>
                                            <TableHead>Límite de Uso</TableHead>
                                            <TableHead>
                                                Precio Extra
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {service.plans.map((plan) => (
                                            <TableRow key={plan.id}>
                                                <TableCell className="font-medium">
                                                    <Link
                                                        href={`/admin/planes/${plan.id}`}
                                                        className="hover:underline"
                                                    >
                                                        {plan.nombre}
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant={
                                                            plan.pivot
                                                                .is_included
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {plan.pivot.is_included
                                                            ? 'Sí'
                                                            : 'No'}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {plan.pivot.usage_limit !==
                                                    null
                                                        ? plan.pivot.usage_limit.toLocaleString()
                                                        : 'Ilimitado'}
                                                </TableCell>
                                                <TableCell>
                                                    {plan.pivot.extra_price !==
                                                    null
                                                        ? formatCurrency(
                                                              plan.pivot
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
