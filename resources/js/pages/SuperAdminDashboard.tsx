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
    Database,
    Calendar,
    ArrowRight,
} from 'lucide-react';
import { useEffect, useRef } from 'react';

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
    legacy_stats: {
        notarias_count: number;
        total_busquedas: number;
        periodo: {
            inicio: string;
            fin: string;
        } | null;
        top_notarias: Array<{
            legacy_identifier: string;
            nombre: string;
            numero_notaria: string;
            busquedas: number;
        }>;
        fuentes: {
            ofac: number;
            sat: number;
        };
        error?: string;
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
    legacy_stats,
}: SuperAdminDashboardProps) {
    const statsCardsRef = useRef<HTMLDivElement>(null);
    const actionCardsRef = useRef<HTMLDivElement>(null);
    const mainCardRef = useRef<HTMLDivElement>(null);
    const backgroundRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // 🎨 EFECTOS INSPIRADOS EN TU CSS DASHBOARD

        // 1. Fondo animado con gradientes (similar a tu ::before)
        if (backgroundRef.current) {
            gsap.set(backgroundRef.current, {
                background: "linear-gradient(135deg, rgba(8, 27, 41, 0.1), rgba(0, 238, 255, 0.05), rgba(8, 27, 41, 0.1))",
                backgroundSize: "400% 400%"
            });

            gsap.to(backgroundRef.current, {
                backgroundPosition: "100% 0%",
                duration: 8,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
            });
        }

        // 2. Animación de entrada espectacular para las tarjetas de estadísticas
        if (statsCardsRef.current) {
            const statsCards = statsCardsRef.current.children;
            gsap.fromTo(
                statsCards,
                {
                    y: 100,
                    opacity: 0,
                    scale: 0.6,
                    rotationX: 90,
                    transformOrigin: "center bottom",
                },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    rotationX: 0,
                    duration: 1.2,
                    stagger: 0.15,
                    ease: 'elastic.out(1, 0.4)',
                    clearProps: "transform"
                },
            );
        }

        // 3. Entrada con efecto 3D para las tarjetas de acción
        if (actionCardsRef.current) {
            const actionCards = actionCardsRef.current.children;
            gsap.fromTo(
                actionCards,
                {
                    x: -120,
                    opacity: 0,
                    rotationY: -45,
                    z: -100,
                    transformOrigin: "right center",
                },
                {
                    x: 0,
                    opacity: 1,
                    rotationY: 0,
                    z: 0,
                    duration: 1.4,
                    delay: 0.8,
                    stagger: 0.2,
                    ease: 'power3.out',
                    clearProps: "transform"
                },
            );
        }

        // 4. Entrada fluida para la tarjeta principal
        if (mainCardRef.current) {
            gsap.fromTo(
                mainCardRef.current,
                {
                    y: 80,
                    opacity: 0,
                    scale: 0.95,
                },
                {
                    y: 0,
                    opacity: 1,
                    scale: 1,
                    duration: 1.6,
                    delay: 1.5,
                    ease: 'power2.out',
                },
            );
        }

        // 5. Efectos hover avanzados para todas las tarjetas
        const allCards = document.querySelectorAll('.dashboard-card');
        allCards.forEach((card) => {
            // Crear elemento de gradiente para cada tarjeta (similar a tu ::before)
            const gradientEl = document.createElement('div');
            gradientEl.className = 'absolute inset-0 opacity-0 pointer-events-none z-0 rounded-xl';
            gradientEl.style.background = 'linear-gradient(45deg, transparent, rgba(0, 238, 255, 0.1), transparent, rgba(0, 238, 255, 0.15))';
            card.appendChild(gradientEl);

            // Hover enter - inspirado en tu efecto de gradiente animado
            card.addEventListener('mouseenter', () => {
                gsap.timeline()
                    .to(card, {
                        y: -12,
                        scale: 1.03,
                        rotationX: 5,
                        z: 50,
                        duration: 0.4,
                        ease: 'power2.out',
                    })
                    .to(gradientEl, {
                        opacity: 1,
                        scale: 1.1,
                        duration: 0.6,
                        ease: 'power2.out'
                    }, '-=0.2')
                    .to(card.querySelectorAll('.text-2xl, .text-lg'), {
                        scale: 1.05,
                        color: 'rgba(255, 174, 0, 0.9)',
                        duration: 0.15,
                        ease: 'power2.out'
                    }, '-=0.4');
            });

            // Hover leave
            card.addEventListener('mouseleave', () => {
                gsap.timeline()
                    .to(card, {
                        y: 0,
                        scale: 1,
                        rotationX: 0,
                        z: 0,
                        duration: 0.2,
                        ease: 'power2.in',
                    })
                    .to(gradientEl, {
                        opacity: 0,
                        scale: 1,
                        duration: 0.3,
                        ease: 'power2.in'
                    }, '-=0.2')
                    .to(card.querySelectorAll('.text-2xl, .text-lg'), {
                        scale: 1,
                        color: 'inherit',
                        duration: 0.15,
                        ease: 'power2.in'
                    }, '-=0.3');
            });

            // Efecto click inspirado en tu CSS (efecto rebote)
            card.addEventListener('click', () => {
                gsap.timeline()
                    .to(card, {
                        scale: 0.98,
                        duration: 0.1,
                        ease: 'power2.in'
                    })
                    .to(card, {
                        scale: 1.05,
                        duration: 0.2,
                        ease: 'elastic.out(1, 0.3)'
                    })
                    .to(card, {
                        scale: 1,
                        duration: 0.2,
                        ease: 'power2.out'
                    });
            });
        });

        // 6. Animación de partículas flotantes de fondo
        const createFloatingElements = () => {
            for (let i = 0; i < 8; i++) {
                const floatingEl = document.createElement('div');
                floatingEl.className = 'fixed w-2 h-2 rounded-full pointer-events-none z-0';
                floatingEl.style.background = 'radial-gradient(circle, rgba(0, 238, 255, 0.3), transparent)';
                floatingEl.style.left = Math.random() * 100 + '%';
                floatingEl.style.top = Math.random() * 100 + '%';
                document.body.appendChild(floatingEl);

                gsap.to(floatingEl, {
                    y: `random(-100, 100)`,
                    x: `random(-50, 50)`,
                    rotation: 360,
                    scale: `random(0.5, 1.5)`,
                    opacity: `random(0.1, 0.4)`,
                    duration: `random(8, 15)`,
                    repeat: -1,
                    yoyo: true,
                    delay: i * 0.5,
                    ease: 'sine.inOut'
                });
            }
        };

        createFloatingElements();

        // Cleanup
        return () => {
            allCards.forEach((card) => {
                const gradientEl = card.querySelector('.absolute.inset-0');
                if (gradientEl) gradientEl.remove();

                card.removeEventListener('mouseenter', () => {});
                card.removeEventListener('mouseleave', () => {});
                card.removeEventListener('click', () => {});
            });

            // Limpiar elementos flotantes
            document.querySelectorAll('.fixed.w-2.h-2').forEach(el => el.remove());
        };
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Super Administrador" />
            {/* Fondo animado inspirado en tu CSS */}
            <div
                ref={backgroundRef}
                className="fixed inset-0 pointer-events-none z-0 opacity-30"
                style={{
                    background: "linear-gradient(135deg, rgba(8, 27, 41, 0.1), rgba(0, 238, 255, 0.05), rgba(8, 27, 41, 0.1))",
                    backgroundSize: "400% 400%"
                }}
            />
            <div className="relative flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4 z-10">
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
                        href="/admin/subscriptions"
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

                    {/* Sistema Legacy Card - Span full width on mobile, 2 columns on tablet, 3 on desktop */}
                    <div className="dashboard-card col-span-full relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg md:col-span-4 dark:border-sidebar-border">
                        <div className="mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Database className="h-6 w-6 text-primary" />
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Sistema Legacy
                                    </h3>
                                    <p className="text-xs text-muted-foreground">
                                        Historial importado del sistema anterior
                                    </p>
                                </div>
                            </div>
                            {legacy_stats.periodo && (
                                <div className="hidden items-center gap-2 text-xs text-muted-foreground sm:flex">
                                    <Calendar className="h-4 w-4" />
                                    <span>
                                        {new Date(legacy_stats.periodo.inicio).toLocaleDateString('es-MX')}
                                        {' - '}
                                        {new Date(legacy_stats.periodo.fin).toLocaleDateString('es-MX')}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                            {/* Left: Main stats */}
                            <div className="space-y-4">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Notarías con Historial
                                    </p>
                                    <p className="text-3xl font-bold text-primary">
                                        {legacy_stats.notarias_count}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground">
                                        Total Búsquedas Legacy
                                    </p>
                                    <p className="text-2xl font-bold">
                                        {legacy_stats.total_busquedas.toLocaleString('es-MX')}
                                    </p>
                                    <div className="mt-1 flex gap-3 text-xs text-muted-foreground">
                                        <span>
                                            OFAC: {legacy_stats.fuentes.ofac.toLocaleString('es-MX')}
                                        </span>
                                        <span>·</span>
                                        <span>
                                            SAT: {legacy_stats.fuentes.sat.toLocaleString('es-MX')}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Right: Top 5 notarías */}
                            <div className="md:col-span-2">
                                <h4 className="mb-3 text-sm font-semibold">
                                    Top 5 Notarías por Búsquedas Legacy
                                </h4>
                                {legacy_stats.top_notarias.length > 0 ? (
                                    <ol className="space-y-2">
                                        {legacy_stats.top_notarias.map((notaria, i) => (
                                            <li
                                                key={notaria.legacy_identifier}
                                                className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                                        {i + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium">
                                                            {notaria.numero_notaria} - {notaria.nombre}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            {notaria.legacy_identifier}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-semibold text-primary">
                                                    {notaria.busquedas.toLocaleString('es-MX')}
                                                </span>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <div className="flex h-32 items-center justify-center rounded-lg bg-muted/30 text-sm text-muted-foreground">
                                        No hay datos disponibles
                                    </div>
                                )}

                                {/* Link to full reports */}
                                <Link
                                    href="/admin/legacy/reports"
                                    className="mt-4 flex items-center justify-center gap-2 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/10"
                                >
                                    <span>Ver Análisis Completo</span>
                                    <ArrowRight className="h-4 w-4" />
                                </Link>
                            </div>
                        </div>

                        {legacy_stats.error && (
                            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                                ⚠️ Error al cargar estadísticas: {legacy_stats.error}
                            </div>
                        )}
                    </div>
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
                    className="dashboard-card relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 transition-shadow hover:shadow-lg md:min-h-min dark:border-sidebar-border"
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
