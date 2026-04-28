import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Building2, Calendar, Edit, Package } from 'lucide-react';

import { SubscriptionStatusBadge } from '@/components/subscription-status-badge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

import * as SubscriptionController from '@/actions/App/Http/Controllers/Admin/SubscriptionController';

interface Subscription {
    id: number;
    status: 'trial' | 'activa' | 'vencida' | 'suspendida' | 'cancelada';
    fecha_inicio: string;
    fecha_vencimiento: string;
    precio_pagado: number;
    ciclo_facturacion: string;
    auto_renovacion: boolean;
    razon_suspension?: string;
    razon_cancelacion?: string;
    fecha_cancelacion?: string;
    created_at: string;
    updated_at: string;
    notaria: {
        id: number;
        nombre: string;
        numero_notaria: string;
        email: string;
        telefono?: string;
        // Campos de ubicación normalizados
        estado?: string;
        municipio?: string;
        codigo_postal?: string;
        colonia?: string;
        calle?: string;
        direccion?: string; // Fallback
    };
    plan: {
        id: number;
        nombre: string;
        descripcion?: string;
        precio_mensual: number;
        precio_anual: number;
        limite_usuarios: number;
        limite_busquedas: number;
    };
    dias_restantes?: number;
    dias_vencido?: number;
    is_expiring_soon: boolean;
    is_in_grace_period: boolean;
}

interface SubscriptionShowProps {
    subscription: Subscription;
}

export default function Show({ subscription }: SubscriptionShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Suscripciones',
            href: '/admin/subscriptions',
        },
        {
            title: subscription.notaria.nombre,
            href: '#',
            icon: Package,
        },
    ];

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
        }).format(amount);
    };

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(new Date(date));
    };

    const formatDateTime = (date: string) => {
        return new Intl.DateTimeFormat('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Suscripción #${subscription.id}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Botones de acción */}
                <div className="flex items-center justify-between">
                    <Link href={SubscriptionController.index().url}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </Link>
                    <div className="flex items-center gap-2">
                        <SubscriptionStatusBadge status={subscription.status} />
                        <Link href={`/admin/subscriptions/${subscription.id}/edit`}>
                            <Button variant="outline" size="sm">
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Alertas */}
                {subscription.is_expiring_soon &&
                    subscription.status === 'activa' && (
                        <div className="flex items-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-3 text-sm">
                            <Calendar className="h-4 w-4 text-yellow-600" />
                            <span>
                                Esta suscripción vence en{' '}
                                <strong>
                                    {subscription.dias_restantes} días
                                </strong>
                            </span>
                        </div>
                    )}

                {subscription.is_in_grace_period &&
                    subscription.status === 'vencida' && (
                        <div className="flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/10 p-3 text-sm">
                            <Calendar className="h-4 w-4 text-orange-600" />
                            <span>
                                Suscripción vencida hace{' '}
                                <strong>
                                    {subscription.dias_vencido} días
                                </strong>{' '}
                                (período de gracia)
                            </span>
                        </div>
                    )}

                <div className="grid gap-6 md:grid-cols-3">
                    {/* Información de la Suscripción */}
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>Información de la Suscripción</CardTitle>
                            <CardDescription>
                                Detalles del estado y configuración
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Fecha de Inicio
                                    </p>
                                    <p className="text-base">
                                        {formatDate(subscription.fecha_inicio)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Fecha de Vencimiento
                                    </p>
                                    <p className="text-base">
                                        {formatDate(
                                            subscription.fecha_vencimiento,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Precio Pagado
                                    </p>
                                    <p className="text-base">
                                        {formatCurrency(
                                            subscription.precio_pagado,
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Ciclo de Facturación
                                    </p>
                                    <p className="text-base capitalize">
                                        {subscription.ciclo_facturacion}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Auto-renovación
                                    </p>
                                    <p className="text-base">
                                        {subscription.auto_renovacion ? (
                                            <Badge variant="default">
                                                Activada
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                Desactivada
                                            </Badge>
                                        )}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Creada
                                    </p>
                                    <p className="text-base">
                                        {formatDateTime(
                                            subscription.created_at,
                                        )}
                                    </p>
                                </div>
                            </div>

                            {subscription.razon_suspension && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Razón de Suspensión
                                    </p>
                                    <p className="text-base text-orange-600">
                                        {subscription.razon_suspension}
                                    </p>
                                </div>
                            )}

                            {subscription.razon_cancelacion && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Razón de Cancelación
                                    </p>
                                    <p className="text-base text-red-600">
                                        {subscription.razon_cancelacion}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        Cancelada el{' '}
                                        {subscription.fecha_cancelacion &&
                                            formatDate(
                                                subscription.fecha_cancelacion,
                                            )}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Información de la Notaría */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Building2 className="h-5 w-5" />
                                Notaría
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Nombre
                                </p>
                                <Link
                                    href={`/admin/notarias/${subscription.notaria.id}`}
                                    className="text-base font-medium hover:underline"
                                >
                                    {subscription.notaria.nombre}
                                </Link>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Número
                                </p>
                                <p className="text-base">
                                    #{subscription.notaria.numero_notaria}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Email
                                </p>
                                <p className="text-sm">
                                    {subscription.notaria.email}
                                </p>
                            </div>
                            {subscription.notaria.telefono && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Teléfono
                                    </p>
                                    <p className="text-base">
                                        {subscription.notaria.telefono}
                                    </p>
                                </div>
                            )}
                            {(subscription.notaria.estado ||
                                subscription.notaria.municipio ||
                                subscription.notaria.direccion) && (
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">
                                        Ubicación
                                    </p>
                                    {subscription.notaria.municipio &&
                                    subscription.notaria.estado ? (
                                        <>
                                            <p className="text-base">
                                                {subscription.notaria.municipio},{' '}
                                                {subscription.notaria.estado}
                                            </p>
                                            {subscription.notaria.codigo_postal && (
                                                <p className="text-sm text-muted-foreground">
                                                    C.P.{' '}
                                                    {
                                                        subscription.notaria
                                                            .codigo_postal
                                                    }
                                                </p>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-base">
                                            {subscription.notaria.direccion ||
                                                'No especificada'}
                                        </p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Información del Plan */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Plan Contratado
                        </CardTitle>
                        <CardDescription>
                            Características y límites del plan
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-4">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Nombre del Plan
                                </p>
                                <p className="text-base font-semibold">
                                    {subscription.plan.nombre}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Precio Mensual
                                </p>
                                <p className="text-base">
                                    {formatCurrency(
                                        subscription.plan.precio_mensual,
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Precio Anual
                                </p>
                                <p className="text-base">
                                    {formatCurrency(
                                        subscription.plan.precio_anual,
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Límite de Usuarios
                                </p>
                                <p className="text-base">
                                    {subscription.plan.limite_usuarios === -1 || subscription.plan.limite_usuarios === null
                                        ? 'Ilimitado'
                                        : subscription.plan.limite_usuarios}
                                </p>
                            </div>
                        </div>

                        {subscription.plan.descripcion && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Descripción
                                </p>
                                <p className="text-base">
                                    {subscription.plan.descripcion}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
