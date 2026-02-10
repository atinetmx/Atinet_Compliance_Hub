import { Head } from '@inertiajs/react';
import {
    Building2,
    Users,
    Search,
    Calendar,
    DollarSign,
    ArrowLeft,
    Edit,
} from 'lucide-react';

import PasswordManager from '@/components/PasswordManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    nombre: string;
    descripcion: string;
    precio_mensual: number;
    limite_usuarios: number;
    limite_busquedas_mes: number;
    herramientas_activas: string[];
}

interface Subscription {
    id: number;
    status: string;
    fecha_inicio: string;
    fecha_vencimiento: string;
    precio_pagado: number;
    moneda: string;
    ciclo_facturacion: string;
    auto_renovacion: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
    tipo_cuenta: string;
    created_at: string;
}

interface Busqueda {
    id: number;
    tipo_busqueda: string;
    estado: string;
    created_at: string;
}

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
    plan_id: number;
    contacto_principal: string;
    email_contacto: string;
    telefono: string;
    direccion: string;
    // Campos de ubicación normalizados
    estado?: string;
    municipio?: string;
    codigo_postal?: string;
    colonia?: string;
    calle?: string;
    notas_internas: string;
    activa: boolean;
    fecha_registro: string;
    total_usuarios: number;
    busquedas_mes_actual: number;
    limite_usuarios_custom: number | null;
    limite_busquedas_mes_custom: number | null;
    herramientas_activas_custom: string[] | null;
    plan: Plan;
    subscripcionActiva: Subscription;
    users: User[];
    busquedas: Busqueda[];
}

interface NotariaShowProps {
    notaria: Notaria;
}

export default function NotariaShow({ notaria }: NotariaShowProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Notarías',
            href: '/admin/notarias',
        },
        {
            title: notaria.nombre,
            href: `/admin/notarias/${notaria.id}`,
        },
    ];

    const getStatusBadge = (status: string) => {
        const variants: {
            [key: string]: 'default' | 'secondary' | 'destructive' | 'outline';
        } = {
            activa: 'default',
            trial: 'secondary',
            vencida: 'destructive',
            cancelada: 'outline',
            suspendida: 'destructive',
        };

        return (
            <Badge variant={variants[status] || 'outline'}>
                {status.toUpperCase()}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Notaría - ${notaria.nombre}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
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
                        <Building2 className="h-6 w-6 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">
                                {notaria.nombre}
                            </h1>
                            <p className="text-muted-foreground">
                                Notaría No. {notaria.numero_notaria}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {getStatusBadge(notaria.activa ? 'activa' : 'inactiva')}
                        <Button variant="outline" size="sm" asChild>
                            <a href={`/admin/notarias/${notaria.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Editar
                            </a>
                        </Button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Usuarios
                            </span>
                        </div>
                        <div className="text-2xl font-bold">
                            {notaria.total_usuarios}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Límite:{' '}
                            {notaria.limite_usuarios_custom ||
                                notaria.plan.limite_usuarios}
                        </p>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Búsquedas este mes
                            </span>
                        </div>
                        <div className="text-2xl font-bold">
                            {notaria.busquedas_mes_actual}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Límite:{' '}
                            {notaria.limite_busquedas_mes_custom ||
                                notaria.plan.limite_busquedas_mes}
                        </p>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Registro
                            </span>
                        </div>
                        <div className="text-sm font-medium">
                            {new Date(
                                notaria.fecha_registro,
                            ).toLocaleDateString()}
                        </div>
                    </div>

                    <div className="rounded-lg border bg-card p-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                                Plan Actual
                            </span>
                        </div>
                        <div className="text-sm font-medium">
                            {notaria.plan.nombre}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            ${notaria.plan.precio_mensual}/
                            {notaria.subscripcionActiva?.ciclo_facturacion ||
                                'mes'}
                        </p>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    {/* Información Básica */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Información Básica
                        </h3>
                        <div className="space-y-3">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    Contacto Principal
                                </label>
                                <p className="font-medium">
                                    {notaria.contacto_principal}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">
                                    Email de Contacto
                                </label>
                                <p className="font-medium">
                                    {notaria.email_contacto}
                                </p>
                            </div>
                            {notaria.telefono && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Teléfono
                                    </label>
                                    <p className="font-medium">
                                        {notaria.telefono}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ubicación */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Ubicación
                        </h3>
                        <div className="space-y-3">
                            {notaria.calle && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Calle
                                    </label>
                                    <p className="font-medium">
                                        {notaria.calle}
                                    </p>
                                </div>
                            )}
                            {notaria.colonia && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Colonia
                                    </label>
                                    <p className="font-medium">
                                        {notaria.colonia}
                                    </p>
                                </div>
                            )}
                            <div className="grid gap-3 md:grid-cols-2">
                                {notaria.municipio && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Municipio
                                        </label>
                                        <p className="font-medium">
                                            {notaria.municipio}
                                        </p>
                                    </div>
                                )}
                                {notaria.estado && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Estado
                                        </label>
                                        <p className="font-medium">
                                            {notaria.estado}
                                        </p>
                                    </div>
                                )}
                            </div>
                            {notaria.codigo_postal && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Código Postal
                                    </label>
                                    <p className="font-medium">
                                        {notaria.codigo_postal}
                                    </p>
                                </div>
                            )}
                            {!notaria.estado &&
                                !notaria.municipio &&
                                notaria.direccion && (
                                    <div>
                                        <label className="text-sm font-medium text-muted-foreground">
                                            Dirección
                                        </label>
                                        <p className="font-medium">
                                            {notaria.direccion}
                                        </p>
                                    </div>
                                )}
                            {!notaria.estado &&
                                !notaria.municipio &&
                                !notaria.direccion && (
                                    <p className="text-muted-foreground">
                                        No hay información de ubicación
                                    </p>
                                )}
                        </div>
                    </div>

                    {/* Suscripción Actual */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Suscripción Actual
                        </h3>
                        {notaria.subscripcionActiva ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Estado
                                    </span>
                                    {getStatusBadge(
                                        notaria.subscripcionActiva.status,
                                    )}
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Fecha de Inicio
                                    </label>
                                    <p className="font-medium">
                                        {new Date(
                                            notaria.subscripcionActiva
                                                .fecha_inicio,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Fecha de Vencimiento
                                    </label>
                                    <p className="font-medium">
                                        {new Date(
                                            notaria.subscripcionActiva
                                                .fecha_vencimiento,
                                        ).toLocaleDateString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">
                                        Precio Pagado
                                    </label>
                                    <p className="font-medium">
                                        $
                                        {
                                            notaria.subscripcionActiva
                                                .precio_pagado
                                        }{' '}
                                        {notaria.subscripcionActiva.moneda}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-muted-foreground">
                                        Auto Renovación
                                    </span>
                                    <Badge
                                        variant={
                                            notaria.subscripcionActiva
                                                .auto_renovacion
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {notaria.subscripcionActiva
                                            .auto_renovacion
                                            ? 'Activa'
                                            : 'Inactiva'}
                                    </Badge>
                                </div>
                            </div>
                        ) : (
                            <p className="text-muted-foreground">
                                No hay suscripción activa
                            </p>
                        )}
                    </div>

                    {/* Usuarios */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Usuarios ({notaria.users?.length || 0})
                        </h3>
                        <div className="max-h-60 space-y-3 overflow-y-auto">
                            {notaria.users && notaria.users.length > 0 ? (
                                notaria.users.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between rounded border bg-card p-3 transition-colors hover:bg-accent/50"
                                    >
                                        <div className="flex-1">
                                            <p className="font-medium">
                                                {user.name}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {user.email}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                Registrado:{' '}
                                                {new Date(
                                                    user.created_at,
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline">
                                                {user.tipo_cuenta}
                                            </Badge>
                                            <PasswordManager
                                                user={user}
                                                onPasswordRevealed={(
                                                    password,
                                                ) => {
                                                    console.log(
                                                        `Contraseña revelada para ${user.name}:`,
                                                        password,
                                                    );
                                                }}
                                                onPasswordReset={(
                                                    newPassword,
                                                ) => {
                                                    console.log(
                                                        `Contraseña restablecida para ${user.name}:`,
                                                        newPassword,
                                                    );
                                                }}
                                            />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-muted-foreground">
                                    No hay usuarios registrados
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Búsquedas Recientes */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Búsquedas Recientes
                        </h3>
                        <div className="max-h-60 space-y-3 overflow-y-auto">
                            {notaria.busquedas &&
                            notaria.busquedas.length > 0 ? (
                                notaria.busquedas
                                    .slice(0, 10)
                                    .map((busqueda) => (
                                        <div
                                            key={busqueda.id}
                                            className="flex items-center justify-between rounded border p-2"
                                        >
                                            <div>
                                                <p className="font-medium capitalize">
                                                    {busqueda.tipo_busqueda}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {new Date(
                                                        busqueda.created_at,
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {busqueda.estado}
                                            </Badge>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-muted-foreground">
                                    No hay búsquedas registradas
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Notas Internas */}
                {notaria.notas_internas && (
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                        <h3 className="mb-4 text-lg font-semibold">
                            Notas Internas
                        </h3>
                        <p className="text-muted-foreground">
                            {notaria.notas_internas}
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
