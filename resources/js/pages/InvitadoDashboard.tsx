import { Head } from '@inertiajs/react';
import { gsap } from 'gsap';
import { AlertTriangle, MapPin, Lock, Info } from 'lucide-react';
import { useEffect, useRef } from 'react';
import AppLayout from '@/layouts/app-layout';
import type { User, BreadcrumbItem } from '@/types';

interface InvitadoDashboardProps {
    auth: {
        user: User;
    };
    notaria: {
        id: number;
        nombre: string;
        numero_notaria: string;
    };
}

export default function InvitadoDashboard({
    auth,
    notaria,
}: InvitadoDashboardProps) {
    const warningHeaderRef = useRef<HTMLDivElement>(null);
    const infoCardsRef = useRef<HTMLDivElement>(null);
    const restrictedCardsRef = useRef<HTMLDivElement>(null);
    const mainCardRef = useRef<HTMLDivElement>(null);

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Acceso de Invitado',
            href: '/dashboard',
        },
    ];

    useEffect(() => {
        // Animación de entrada para el warning header
        if (warningHeaderRef.current) {
            gsap.fromTo(
                warningHeaderRef.current,
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

        // Animación de entrada para las tarjetas de información
        if (infoCardsRef.current) {
            const infoCards = infoCardsRef.current.children;
            gsap.fromTo(
                infoCards,
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
                    stagger: 0.15,
                    ease: 'back.out(1.4)',
                    snap: {
                        y: 1,
                    },
                },
            );
        }

        // Animación de entrada para las tarjetas de acceso restringido
        if (restrictedCardsRef.current) {
            const restrictedCards = restrictedCardsRef.current.children;
            gsap.fromTo(
                restrictedCards,
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
            <Head title={`Acceso Restringido - ${notaria.nombre}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Warning Header */}
                <div
                    ref={warningHeaderRef}
                    className="dashboard-card rounded-xl border border-yellow-200 bg-yellow-50 p-6 hover:shadow-lg dark:border-yellow-800 dark:bg-yellow-900/20"
                >
                    <div className="mb-4 flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        <h1 className="text-xl font-bold">
                            Acceso de Invitado - {notaria.nombre}
                        </h1>
                    </div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Nota:</strong> Tienes acceso limitado al
                        sistema. Para obtener acceso completo, contacta al
                        administrador de la notaría.
                    </p>
                </div>

                {/* Information Cards */}
                <div
                    ref={infoCardsRef}
                    className="grid auto-rows-min gap-4 md:grid-cols-2"
                >
                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="mb-4 flex items-center gap-4">
                            <MapPin className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">
                                Información de la Notaría
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="font-semibold">
                                    {notaria.nombre}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Notaría No. {notaria.numero_notaria}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Contacta al administrador para obtener más
                                    información sobre los servicios disponibles.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="mb-4 flex items-center gap-4">
                            <Info className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">
                                Tu Información
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm">
                                    <strong>Nombre:</strong> {auth.user.name}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">
                                    <strong>Email:</strong> {auth.user.email}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-yellow-600">
                                    <strong>Tipo de acceso:</strong> Invitado
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Restricted Access Cards */}
                <div
                    ref={restrictedCardsRef}
                    className="grid auto-rows-min gap-4 md:grid-cols-2"
                >
                    <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="mb-4 flex items-center gap-4">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-muted-foreground">
                                Solicitar Acceso
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Para obtener acceso completo al sistema, puedes
                                solicitar permisos al administrador.
                            </p>
                            <button
                                disabled
                                className="w-full cursor-not-allowed rounded-lg border border-input px-4 py-2 text-sm font-medium opacity-50"
                            >
                                <Lock className="mr-2 inline h-4 w-4" />
                                Función No Disponible
                            </button>
                        </div>
                    </div>

                    <div className="dashboard-card relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg dark:border-sidebar-border">
                        <div className="mb-4 flex items-center gap-4">
                            <Info className="h-6 w-6 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-muted-foreground">
                                Información General
                            </h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Puedes consultar información general sobre los
                                servicios de la notaría.
                            </p>
                            <button
                                disabled
                                className="w-full cursor-not-allowed rounded-lg border border-input px-4 py-2 text-sm font-medium opacity-50"
                            >
                                <Lock className="mr-2 inline h-4 w-4" />
                                Ver Servicios (Próximamente)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Area */}
                <div
                    ref={mainCardRef}
                    className="dashboard-card relative min-h-screen flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 hover:shadow-lg md:min-h-min dark:border-sidebar-border"
                >
                    <div className="mb-6 flex items-center gap-4">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">
                            Acceso Restringido
                        </h3>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-lg border border-dashed border-muted-foreground/30 bg-muted/30 p-4">
                            <div className="space-y-3 text-center">
                                <Lock className="mx-auto h-12 w-12 text-muted-foreground/50" />
                                <h4 className="font-medium text-muted-foreground">
                                    Funciones Limitadas
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                    Como invitado, tienes acceso limitado al
                                    sistema. La mayoría de las funciones
                                    requieren permisos especiales.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <h4 className="font-medium">Acceso Actual</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>
                                        • Consultar información de la notaría
                                    </li>
                                    <li>• Ver datos de contacto</li>
                                    <li>• Acceso a información general</li>
                                    <li>• Panel básico de navegación</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">
                                    Para Obtener Más Acceso
                                </h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>
                                        • Contacta al administrador de la
                                        notaría
                                    </li>
                                    <li>• Solicita permisos específicos</li>
                                    <li>
                                        • Proporciona información de
                                        identificación
                                    </li>
                                    <li>
                                        • Espera la aprobación del administrador
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
