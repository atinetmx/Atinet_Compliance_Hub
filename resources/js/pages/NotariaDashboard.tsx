import { Head } from '@inertiajs/react';
import { gsap } from 'gsap';
import { Search, Users, Calendar, FileText, Plus, Settings, Shield } from 'lucide-react';
import { useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { User, BreadcrumbItem } from '@/types';

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
    stats: {
        busquedas_mes: number;
        busquedas_hoy: number;
        usuarios_notaria: number;
    };
}

export default function NotariaDashboard({ auth, notaria, stats }: NotariaDashboardProps) {
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
                }
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
                }
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
                }
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
                }
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
                <div ref={headerCardRef} className="dashboard-card rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold">{notaria.nombre}</h1>
                            <p className="text-muted-foreground">Notaría No. {notaria.numero_notaria}</p>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-3 py-1 text-primary">
                                <Shield className="h-4 w-4" />
                                <span className="text-sm font-medium">Administrador</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Stats Cards */}
                <div ref={statsCardsRef} className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Búsquedas Este Mes</p>
                                <p className="text-2xl font-bold">{stats.busquedas_mes}</p>
                                <p className="text-xs text-muted-foreground">Búsquedas realizadas</p>
                            </div>
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Búsquedas Hoy</p>
                                <p className="text-2xl font-bold">{stats.busquedas_hoy}</p>
                                <p className="text-xs text-muted-foreground">Búsquedas de hoy</p>
                            </div>
                            <Calendar className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Usuarios</p>
                                <p className="text-2xl font-bold">{stats.usuarios_notaria}</p>
                                <p className="text-xs text-muted-foreground">En la notaría</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <div ref={actionCardsRef} className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center gap-4 mb-4">
                            <Search className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">Búsquedas</h3>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                <Plus className="mr-2 inline h-4 w-4" /> Nueva Búsqueda
                            </button>
                            <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                Historial de Búsquedas
                            </button>
                        </div>
                    </div>

                    <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="flex items-center gap-4 mb-4">
                            <FileText className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">Documentos</h3>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                Ver Documentos
                            </button>
                            <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                Reportes
                            </button>
                        </div>
                    </div>

                    {isAdmin ? (
                        <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                            <div className="flex items-center gap-4 mb-4">
                                <Settings className="h-6 w-6 text-primary" />
                                <h3 className="text-lg font-semibold">Administración</h3>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                    Gestionar Usuarios
                                </button>
                                <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                    Configuración
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                            <div className="flex items-center gap-4 mb-4">
                                <Users className="h-6 w-6 text-primary" />
                                <h3 className="text-lg font-semibold">Mi Cuenta</h3>
                            </div>
                            <div className="space-y-3">
                                <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                    Ver Perfil
                                </button>
                                <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                    Mis Búsquedas
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Main Dashboard Area */}
                <div ref={mainCardRef} className="dashboard-card relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg md:min-h-min dark:border-sidebar-border">
                    <div className="flex items-center gap-4 mb-6">
                        <FileText className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold">Actividad Reciente de la Notaría</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">
                                Panel de control para la gestión y operación de {notaria.nombre}.
                                {isAdmin ? ' Como administrador, tienes acceso completo a todas las funciones.' : ' Acceso de usuario para realizar búsquedas y consultar documentos.'}
                            </p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <h4 className="font-medium">Funciones Principales</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Realizar búsquedas en bases de datos</li>
                                    <li>• Consultar documentos y registros</li>
                                    <li>• Generar reportes de actividad</li>
                                    <li>• {isAdmin ? 'Administrar usuarios y configuración' : 'Gestionar tu perfil y preferencias'}</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">Información de la Notaría</h4>
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    <p><strong>Número:</strong> {notaria.numero_notaria}</p>
                                    <p><strong>Estado:</strong> {notaria.activa ? 'Activa' : 'Inactiva'}</p>
                                    <p><strong>Usuarios:</strong> {stats.usuarios_notaria}</p>
                                    <p><strong>Búsquedas del mes:</strong> {stats.busquedas_mes}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
