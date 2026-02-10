import { Head, Link } from '@inertiajs/react';
import { AlertCircle, Clock, CreditCard, XCircle } from 'lucide-react';
import * as NotariaController from '@/actions/App/Http/Controllers/Admin/NotariaController';
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Suscripciones" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Suscripciones</h1>
                        <p className="text-muted-foreground">
                            Gestiona todas las suscripciones del sistema
                        </p>
                    </div>
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
                                {stats.vencidas + stats.suspendidas}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Requieren acción
                            </p>
                        </CardContent>
                    </Card>
                </div>

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
                                    suscripciones vencen en las próximas 48
                                    horas
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
                                    suscripciones suspendidas hace más de 30
                                    días
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
                                                href={
                                                    NotariaController.show({
                                                        notaria:
                                                            subscription.notaria
                                                                .id,
                                                    }).url
                                                }
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
