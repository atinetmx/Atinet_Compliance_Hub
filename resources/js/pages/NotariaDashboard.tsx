import { Head, Link } from '@inertiajs/react';
import { gsap } from 'gsap';
import {
    Search,
    Users,
    Calendar,
    Shield,
    Package,
    Clock,
    CheckCircle2,
    AlertTriangle,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import type { User, BreadcrumbItem } from '@/types';

interface Service {
    code: string;
    name: string;
    description: string;
    is_included: boolean;
}

interface Subscription {
    status: string;
    fecha_inicio: string;
    fecha_vencimiento: string;
    ciclo_facturacion: string;
    plan: {
        nombre: string;
        descripcion: string;
        limite_usuarios: number;
        limite_busquedas_mes: number;
        servicios: Service[];
    } | null;
}

interface NotariaDashboardProps {
    auth: {
        user: User;
    };
    notaria: {
        id: number;
        nombre: string;
        numero_notaria: string;
        activa: boolean;
    };
    subscription: Subscription | null;
    stats: {
        busquedas_mes: number;
        busquedas_hoy: number;
        usuarios_notaria: number;
    };
}

export default function NotariaDashboard({
    auth,
    notaria,
    subscription,
    stats,
}: NotariaDashboardProps) {
    const isAdmin = auth.user.tipo_cuenta === 'admin_notaria';
    const headerCardRef = useRef<HTMLDivElement>(null);
    const statsCardsRef = useRef<HTMLDivElement>(null);
    const actionCardsRef = useRef<HTMLDivElement>(null);
    const mainCardRef = useRef<HTMLDivElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: notaria.nombre,
            href: '/dashboard',
        },
    ];

    const getSubscriptionBadge = () => {
        if (!subscription) {
            return (
                <Badge variant="destructive" className="flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    Sin Suscripción
                </Badge>
            );
        }

        const statusConfig: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', label: string, icon: React.ReactNode }> = {
            trial: {
                variant: 'secondary',
                label: 'Prueba',
                icon: <Clock className="h-3 w-3" />
            },
            activa: {
                variant: 'default',
                label: 'Activa',
                icon: <CheckCircle2 className="h-3 w-3" />
            },
            vencida: {
                variant: 'destructive',
                label: 'Vencida',
                icon: <AlertTriangle className="h-3 w-3" />
            },
        };

        const config = statusConfig[subscription.status] || {
            variant: 'outline' as const,
            label: subscription.status,
            icon: null,
        };

        return (
            <Badge variant={config.variant} className="flex items-center gap-1">
                {config.icon}
                {config.label}
            </Badge>
        );
    };

    const usagePercentage = subscription?.plan
        ? Math.round((stats.busquedas_mes / subscription.plan.limite_busquedas_mes) * 100)
        : 0;

    useEffect(() => {
        // Animación de entrada para el header
        if (headerCardRef.current) {
            gsap.fromTo(
                headerCardRef.current,
                {
                    y: -40,
                    opacity: 0,
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 0.6,
                    ease: 'power2.out',
                },
            );
        }

        // Animación de entrada para las tarjetas de estadísticas
        if (statsCardsRef.current) {
            const statsCards = statsCardsRef.current.children;
            gsap.fromTo(
                statsCards,
                {
                    y: 60,
                    opacity: 0,
                    scale: 0.8,
                },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 0.8,
                    delay: 0.2,
                    stagger: 0.1,
                    ease: 'back.out(1.4)',
                    snap: {
                        y: 1,
                    },
                },
            );
        }

        // Animación de entrada para las tarjetas de acción
        if (actionCardsRef.current) {
            const actionCards = actionCardsRef.current.children;
            gsap.fromTo(
                actionCards,
                {
                    x: -60,
                    opacity: 0,
                    rotationY: -15,
                },
                {
                    x: 0,
                    opacity: 1,
                    rotationY: 0,
                    duration: 0.9,
                    delay: 0.5,
                    stagger: 0.15,
                    ease: 'power3.out',
                    snap: {
                        x: 1,
                    },
                },
            );
        }

        // Animación de entrada para la tarjeta principal
        if (mainCardRef.current) {
            gsap.fromTo(
                mainCardRef.current,
                {
                    y: 40,
                    opacity: 0,
                },
                {
                    y: 0,
                    opacity: 1,
                    duration: 1,
                    delay: 0.8,
                    ease: 'power2.out',
                },
            );
        }

        // Agregar efectos hover a todas las tarjetas
        const allCards = document.querySelectorAll('.dashboard-card');
        allCards.forEach((card) => {
            card.addEventListener('mouseenter', () => {
                gsap.to(card, {
                    y: -8,
                    scale: 1.02,
                    duration: 0.3,
                    ease: 'power2.out',
                });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, {
                    y: 0,
                    scale: 1,
                    duration: 0.3,
                    ease: 'power2.in',
                });
            });
        });
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Dashboard - ${notaria.nombre}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header Info */}
                <div
                    ref={headerCardRef}
                    className="dashboard-card rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border"
                >
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">
                                {notaria.nombre}
                            </h1>
                            <p className="text-muted-foreground">
                                Notaría No. {notaria.numero_notaria}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {getSubscriptionBadge()}
                            {isAdmin && (
                                <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-primary">
                                    <Shield className="h-4 w-4" />
                                    <span className="text-sm font-medium">
                                        Administrador
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                <div
                    ref={statsCardsRef}
                    className="grid auto-rows-min gap-4 md:grid-cols-3"
                >
                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Búsquedas Este Mes
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.busquedas_mes}
                                    {subscription?.plan && (
                                        <span className="text-sm text-muted-foreground ml-1">
                                            / {subscription.plan.limite_busquedas_mes}
                                        </span>
                                    )}
                                </p>
                                {subscription?.plan && (
                                    <div className="space-y-1">
                                        <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all ${
                                                    usagePercentage > 90 ? 'bg-destructive' :
                                                    usagePercentage > 75 ? 'bg-yellow-500' :
                                                    'bg-primary'
                                                }`}
                                                style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {usagePercentage}% utilizado
                                        </p>
                                    </div>
                                )}
                            </div>
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Búsquedas Hoy
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.busquedas_hoy}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Búsquedas de hoy
                                </p>
                            </div>
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Usuarios
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.usuarios_notaria}
                                    {subscription?.plan && (
                                        <span className="text-sm text-muted-foreground ml-1">
                                            / {subscription.plan.limite_usuarios}
                                        </span>
                                    )}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {isAdmin ? 'En la notaría' : 'Usuario de la notaría'}
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <div
                    ref={actionCardsRef}
                    className="grid auto-rows-min gap-4 md:grid-cols-3"
                >
                    <Link
                        href="/admin/listas-negras"
                        className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border transition-all hover:border-primary/50"
                    >
                        <div className="mb-4 flex items-center gap-4">
                            <div className="rounded-lg bg-primary/10 p-3">
                                <Search className="h-6 w-6 text-primary" />
                            </div>
                            <h3 className="text-lg font-semibold">Listas Negras</h3>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Realiza búsquedas en listas OFAC y SAT para verificar personas y empresas.
                            </p>
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-xs text-muted-foreground">
                                    {stats.busquedas_hoy} búsquedas hoy
                                </span>
                                <span className="text-xs font-medium text-primary">
                                    Acceder →
                                </span>
                            </div>
                        </div>
                    </Link>

                    {isAdmin ? (
                        <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                            <div className="mb-4 flex items-center gap-4">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">Usuarios de la Notaría</h3>
                            </div>
                            <div className="space-y-3">
                                <p className="text-xs text-muted-foreground mb-2">
                                    Gestiona los usuarios de {notaria.nombre}
                                </p>
                                <Link href="/notaria/users">
                                    <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                        Gestionar Usuarios
                                    </button>
                                </Link>
                                <Link href="/notaria/users/create">
                                    <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                        + Crear Usuario
                                    </button>
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <Link
                            href="/settings/profile"
                            className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border transition-all hover:border-primary/50"
                        >
                            <div className="mb-4 flex items-center gap-4">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <Users className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">Mi Perfil</h3>
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    Actualiza tu información personal y preferencias de cuenta.
                                </p>
                                <span className="text-xs font-medium text-primary pt-2 inline-block">
                                    Ver perfil →
                                </span>
                            </div>
                        </Link>
                    )}

                    {subscription && (
                        <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                            <div className="mb-4 flex items-center gap-4">
                                <div className="rounded-lg bg-primary/10 p-3">
                                    <Package className="h-6 w-6 text-primary" />
                                </div>
                                <h3 className="text-lg font-semibold">Plan Actual</h3>
                            </div>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm font-medium">{subscription.plan?.nombre || 'Sin Plan'}</p>
                                    <p className="text-xs text-muted-foreground">{subscription.plan?.descripcion}</p>
                                </div>
                                <div className="space-y-1 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Estado:</span>
                                        <span className="font-medium">{getSubscriptionBadge()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Vence:</span>
                                        <span className="font-medium">
                                            {new Date(subscription.fecha_vencimiento).toLocaleDateString('es-MX')}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Ciclo:</span>
                                        <span className="font-medium capitalize">{subscription.ciclo_facturacion}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Dashboard Area */}
                <div
                    ref={mainCardRef}
                    className="dashboard-card relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg md:min-h-min dark:border-sidebar-border"
                >
                    <div className="mb-6 flex items-center gap-4">
                        <Package className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold">
                            {subscription ? 'Servicios Incluidos en tu Plan' : 'Información de la Notaría'}
                        </h3>
                    </div>

                    {subscription && subscription.plan ? (
                        <div className="space-y-6">
                            <div className="rounded-lg bg-muted/50 p-4">
                                <p className="text-sm text-muted-foreground">
                                    Tu notaría cuenta con el plan <strong>{subscription.plan.nombre}</strong>.{' '}
                                    {isAdmin
                                        ? 'Como administrador, puedes gestionar el acceso de los usuarios a estos servicios.'
                                        : 'Puedes acceder a los siguientes servicios:'
                                    }
                                </p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                {subscription.plan.servicios.map((servicio) => (
                                    <div
                                        key={servicio.code}
                                        className="rounded-lg border border-sidebar-border/50 bg-card p-4 transition-colors hover:border-primary/50"
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className="rounded-md bg-primary/10 p-2">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <h4 className="font-medium leading-none">{servicio.name}</h4>
                                                <p className="text-xs text-muted-foreground">
                                                    {servicio.description}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Límites del Plan</h4>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Búsquedas por mes:</span>
                                            <span className="font-medium text-foreground">
                                                {subscription.plan.limite_busquedas_mes === null ? 'Ilimitadas' : subscription.plan.limite_busquedas_mes}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Usuarios permitidos:</span>
                                            <span className="font-medium text-foreground">
                                                {subscription.plan.limite_usuarios === null ? 'Ilimitados' : subscription.plan.limite_usuarios}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium text-sm">Información de la Suscripción</h4>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <div className="flex justify-between">
                                            <span>Fecha de inicio:</span>
                                            <span className="font-medium text-foreground">
                                                {new Date(subscription.fecha_inicio).toLocaleDateString('es-MX')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Fecha de vencimiento:</span>
                                            <span className="font-medium text-foreground">
                                                {new Date(subscription.fecha_vencimiento).toLocaleDateString('es-MX')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="rounded-lg bg-muted/50 p-4">
                                <p className="text-sm text-muted-foreground">
                                    Panel de control para la gestión y operación de{' '}
                                    {notaria.nombre}.
                                    {isAdmin
                                        ? ' Como administrador, tienes acceso completo a todas las funciones.'
                                        : ' Acceso de usuario para realizar búsquedas y consultar documentos.'}
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <h4 className="font-medium">Información de la Notaría</h4>
                                    <div className="space-y-1 text-sm text-muted-foreground">
                                        <p>
                                            <strong>Número:</strong>{' '}
                                            {notaria.numero_notaria}
                                        </p>
                                        <p>
                                            <strong>Estado:</strong>{' '}
                                            {notaria.activa ? 'Activa' : 'Inactiva'}
                                        </p>
                                        <p>
                                            <strong>Usuarios:</strong>{' '}
                                            {stats.usuarios_notaria}
                                        </p>
                                        <p>
                                            <strong>Búsquedas del mes:</strong>{' '}
                                            {stats.busquedas_mes}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
