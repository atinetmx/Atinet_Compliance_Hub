import { Head, Link } from '@inertiajs/react';
import { gsap } from 'gsap';
import {
    Users,
    Building2,
    Search,
    CreditCard,
    Plus,
    Settings,
    FileText,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import * as SubscriptionController from '@/actions/App/Http/Controllers/Admin/SubscriptionController';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface SuperAdminDashboardProps {
    stats: {
        total_notarias: number;
        total_usuarios: number;
        total_busquedas: number;
        suscripciones_activas: number;
        suscripciones_trial: number;
        suscripciones_vencidas: number;
        suscripciones_suspendidas: number;
    };
    recent_subscriptions: Array<{
        id: number;
        status: string;
        fecha_vencimiento: string;
        notaria: {
            nombre: string;
            numero_notaria: string;
        };
        plan: {
            nombre: string;
        };
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Super Administrador',
        href: '/dashboard',
    },
];

export default function SuperAdminDashboard({
    stats,
}: SuperAdminDashboardProps) {
    const statsCardsRef = useRef<HTMLDivElement>(null);
    const actionCardsRef = useRef<HTMLDivElement>(null);
    const mainCardRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
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
                    stagger: 0.1,
                    ease: 'back.out(1.4)',
                    snap: {
                        y: 1, // snap to nearest pixel
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
                    delay: 0.4,
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
                    delay: 0.7,
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

        // Cleanup
        return () => {
            allCards.forEach((card) => {
                card.removeEventListener('mouseenter', () => {});
                card.removeEventListener('mouseleave', () => {});
            });
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Super Administrador" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Stats Cards */}
                <div
                    ref={statsCardsRef}
                    className="grid auto-rows-min gap-4 md:grid-cols-4"
                >
                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Notarías
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total_notarias}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Notarías registradas
                                </p>
                            </div>
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Usuarios
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total_usuarios}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Usuarios activos
                                </p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Búsquedas
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total_busquedas}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Búsquedas realizadas
                                </p>
                            </div>
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <Link
                        href={SubscriptionController.index().url}
                        className="dashboard-card group relative aspect-video cursor-pointer overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg dark:border-sidebar-border"
                    >
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">
                                    Suscripciones
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.suscripciones_activas}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {stats.suscripciones_trial > 0 &&
                                        `${stats.suscripciones_trial} trial`}
                                    {stats.suscripciones_vencidas > 0 &&
                                        ` · ${stats.suscripciones_vencidas} vencidas`}
                                    {stats.suscripciones_suspendidas > 0 &&
                                        ` · ${stats.suscripciones_suspendidas} suspendidas`}
                                    {stats.suscripciones_trial === 0 &&
                                        stats.suscripciones_vencidas === 0 &&
                                        stats.suscripciones_suspendidas === 0 &&
                                        'Todas activas'}
                                </p>
                            </div>
                            <CreditCard className="h-8 w-8 text-muted-foreground transition-colors group-hover:text-foreground" />
                        </div>
                    </Link>
                </div>

                {/* Action Cards */}
                <div
                    ref={actionCardsRef}
                    className="grid auto-rows-min gap-4 md:grid-cols-3"
                >
                    <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg dark:border-sidebar-border">
                        <div className="mb-4 flex items-center gap-4">
                            <Plus className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">
                                Gestión de Notarías
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <Link href="/admin/notarias/create">
                                <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                    Crear Nueva Notaría
                                </button>
                            </Link>
                            <Link href="/admin/notarias">
                                <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                    Ver Todas las Notarías
                                </button>
                            </Link>
                        </div>
                    </div>

                    <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg dark:border-sidebar-border">
                        <div className="mb-4 flex items-center gap-4">
                            <Users className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">
                                Usuarios del Sistema
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <Link href="/admin/users">
                                <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                    Gestionar Usuarios
                                </button>
                            </Link>
                            <Link href="/admin/users/reports">
                                <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                    Reportes de Usuarios
                                </button>
                            </Link>
                        </div>
                    </div>

                    <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg dark:border-sidebar-border">
                        <div className="mb-4 flex items-center gap-4">
                            <Settings className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">
                                Configuración
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <Link href="/admin/settings">
                                <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                    Configuración Global
                                </button>
                            </Link>
                            <Link href="/admin/settings/logs">
                                <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                    Logs del Sistema
                                </button>
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Area */}
                <div
                    ref={mainCardRef}
                    className="dashboard-card relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg md:min-h-min dark:border-sidebar-border"
                >
                    <div className="mb-6 flex items-center gap-4">
                        <FileText className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold">
                            Actividad Reciente del Sistema
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">
                                Panel de administración global para supervisar
                                todas las notarías y usuarios del sistema.
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <h4 className="font-medium">
                                    Vista Global del Sistema
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>
                                        • Monitoreo de todas las notarías
                                        registradas
                                    </li>
                                    <li>• Gestión centralizada de usuarios</li>
                                    <li>• Estadísticas globales de uso</li>
                                    <li>
                                        • Configuración de parámetros del
                                        sistema
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">
                                    Acciones Disponibles
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Crear y gestionar notarías</li>
                                    <li>• Administrar cuentas de usuarios</li>
                                    <li>
                                        • Revisar logs y actividad del sistema
                                    </li>
                                    <li>• Configurar ajustes globales</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
