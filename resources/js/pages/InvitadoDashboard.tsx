import { Head } from '@inertiajs/react';
import { AlertTriangle, MapPin, Lock, Info } from 'lucide-react';
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

export default function InvitadoDashboard({ auth, notaria }: InvitadoDashboardProps) {
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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Acceso Restringido - ${notaria.nombre}`} />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Warning Header */}
                <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-800 dark:bg-yellow-900/20">
                    <div className="flex items-center gap-3 mb-4">
                        <AlertTriangle className="h-6 w-6 text-yellow-600" />
                        <h1 className="text-xl font-bold">Acceso de Invitado - {notaria.nombre}</h1>
                    </div>
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        <strong>Nota:</strong> Tienes acceso limitado al sistema. Para obtener acceso completo,
                        contacta al administrador de la notaría.
                    </p>
                </div>

                {/* Information Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center gap-4 mb-4">
                            <MapPin className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">Información de la Notaría</h3>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <p className="font-semibold">{notaria.nombre}</p>
                                <p className="text-sm text-muted-foreground">Notaría No. {notaria.numero_notaria}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Contacta al administrador para obtener más información sobre los servicios disponibles.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center gap-4 mb-4">
                            <Info className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">Tu Información</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-sm"><strong>Nombre:</strong> {auth.user.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm"><strong>Email:</strong> {auth.user.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-yellow-600"><strong>Tipo de acceso:</strong> Invitado</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Restricted Access Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-2">
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center gap-4 mb-4">
                            <Lock className="h-6 w-6 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-muted-foreground">Solicitar Acceso</h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Para obtener acceso completo al sistema, puedes solicitar permisos al administrador.
                            </p>
                            <button
                                disabled
                                className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
                            >
                                <Lock className="mr-2 inline h-4 w-4" />
                                Función No Disponible
                            </button>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center gap-4 mb-4">
                            <Info className="h-6 w-6 text-muted-foreground" />
                            <h3 className="text-lg font-semibold text-muted-foreground">Información General</h3>
                        </div>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Puedes consultar información general sobre los servicios de la notaría.
                            </p>
                            <button
                                disabled
                                className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
                            >
                                <Lock className="mr-2 inline h-4 w-4" />
                                Ver Servicios (Próximamente)
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Area */}
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 md:min-h-min dark:border-sidebar-border">
                    <div className="flex items-center gap-4 mb-6">
                        <Lock className="h-6 w-6 text-muted-foreground" />
                        <h3 className="text-lg font-semibold">Acceso Restringido</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-lg bg-muted/30 p-4 border border-dashed border-muted-foreground/30">
                            <div className="text-center space-y-3">
                                <Lock className="h-12 w-12 mx-auto text-muted-foreground/50" />
                                <h4 className="font-medium text-muted-foreground">Funciones Limitadas</h4>
                                <p className="text-sm text-muted-foreground">
                                    Como invitado, tienes acceso limitado al sistema. La mayoría de las funciones requieren permisos especiales.
                                </p>
                            </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <h4 className="font-medium">Acceso Actual</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Consultar información de la notaría</li>
                                    <li>• Ver datos de contacto</li>
                                    <li>• Acceso a información general</li>
                                    <li>• Panel básico de navegación</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">Para Obtener Más Acceso</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Contacta al administrador de la notaría</li>
                                    <li>• Solicita permisos específicos</li>
                                    <li>• Proporciona información de identificación</li>
                                    <li>• Espera la aprobación del administrador</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
