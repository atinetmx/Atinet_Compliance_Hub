import { Head, Link } from '@inertiajs/react';
import { Users, Building2, Search, CreditCard, Plus, Settings, FileText } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface SuperAdminDashboardProps {
    stats: {
        total_notarias: number;
        total_usuarios: number;
        total_busquedas: number;
        suscripciones_activas: number;
    };
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

export default function SuperAdminDashboard({ stats }: SuperAdminDashboardProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard - Super Administrador" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Stats Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Notarías</p>
                                <p className="text-2xl font-bold">{stats.total_notarias}</p>
                                <p className="text-xs text-muted-foreground">Notarías registradas</p>
                            </div>
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Usuarios</p>
                                <p className="text-2xl font-bold">{stats.total_usuarios}</p>
                                <p className="text-xs text-muted-foreground">Usuarios activos</p>
                            </div>
                            <Users className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Total Búsquedas</p>
                                <p className="text-2xl font-bold">{stats.total_busquedas}</p>
                                <p className="text-xs text-muted-foreground">Búsquedas realizadas</p>
                            </div>
                            <Search className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="relative aspect-video overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Suscripciones</p>
                                <p className="text-2xl font-bold">{stats.suscripciones_activas}</p>
                                <p className="text-xs text-muted-foreground">Suscripciones activas</p>
                            </div>
                            <CreditCard className="h-8 w-8 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Action Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3">
                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center gap-4 mb-4">
                            <Plus className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">Gestión de Notarías</h3>
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

                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center gap-4 mb-4">
                            <Users className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">Usuarios del Sistema</h3>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                Gestionar Usuarios
                            </button>
                            <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                Reportes de Usuarios
                            </button>
                        </div>
                    </div>

                    <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="flex items-center gap-4 mb-4">
                            <Settings className="h-6 w-6 text-primary" />
                            <h3 className="text-lg font-semibold">Configuración</h3>
                        </div>
                        <div className="space-y-3">
                            <button className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                                Configuración Global
                            </button>
                            <button className="w-full rounded-lg border border-input px-4 py-2 text-sm font-medium hover:bg-accent">
                                Logs del Sistema
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Dashboard Area */}
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 bg-background p-6 md:min-h-min dark:border-sidebar-border">
                    <div className="flex items-center gap-4 mb-6">
                        <FileText className="h-6 w-6 text-primary" />
                        <h3 className="text-lg font-semibold">Actividad Reciente del Sistema</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="rounded-lg bg-muted/50 p-4">
                            <p className="text-sm text-muted-foreground">Panel de administración global para supervisar todas las notarías y usuarios del sistema.</p>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-2">
                                <h4 className="font-medium">Vista Global del Sistema</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Monitoreo de todas las notarías registradas</li>
                                    <li>• Gestión centralizada de usuarios</li>
                                    <li>• Estadísticas globales de uso</li>
                                    <li>• Configuración de parámetros del sistema</li>
                                </ul>
                            </div>
                            <div className="space-y-2">
                                <h4 className="font-medium">Acciones Disponibles</h4>
                                <ul className="space-y-1 text-sm text-muted-foreground">
                                    <li>• Crear y gestionar notarías</li>
                                    <li>• Administrar cuentas de usuarios</li>
                                    <li>• Revisar logs y actividad del sistema</li>
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
