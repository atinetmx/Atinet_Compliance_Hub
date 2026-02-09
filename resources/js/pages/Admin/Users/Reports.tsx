import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Users,
    Building2,
    Shield,
    UserCheck,
    Calendar,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Props {
    stats: {
        total_usuarios: number;
        por_tipo_cuenta: Record<string, number>;
        por_notaria: Record<string, number>;
        usuarios_activos: number;
        registros_recientes: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administración', href: '/admin' },
    { title: 'Usuarios', href: '/admin/users' },
    { title: 'Reportes', href: '/admin/users/reports' },
];

const tiposCuentaLabels: Record<string, string> = {
    super_admin: 'Super Administrador',
    admin_notaria: 'Admin Notaría',
    usuario_notaria: 'Usuario Notaría',
    invitado: 'Invitado',
};

export default function Reports({ stats }: Props) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reportes de Usuarios" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/users">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Users className="h-6 w-6 text-primary" />
                            <h1 className="text-2xl font-bold">
                                Reportes de Usuarios
                            </h1>
                        </div>
                    </div>
                </div>

                {/* Stats Overview */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-lg border bg-background p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/50">
                                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Total Usuarios
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.total_usuarios}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-green-100 p-2 dark:bg-green-900/50">
                                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Usuarios Activos
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.usuarios_activos}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/50">
                                <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Registros Recientes
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    (30 días)
                                </p>
                                <p className="text-2xl font-bold">
                                    {stats.registros_recientes}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border bg-background p-4">
                        <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-yellow-100 p-2 dark:bg-yellow-900/50">
                                <Shield className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    Tipos de Cuenta
                                </p>
                                <p className="text-2xl font-bold">
                                    {Object.keys(stats.por_tipo_cuenta).length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Users by Account Type */}
                <div className="rounded-lg border bg-background p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <Shield className="h-5 w-5 text-primary" />
                        Usuarios por Tipo de Cuenta
                    </h3>
                    <div className="space-y-3">
                        {Object.entries(stats.por_tipo_cuenta).map(
                            ([tipo, cantidad]) => (
                                <div
                                    key={tipo}
                                    className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <Badge
                                            className={
                                                tipo === 'super_admin'
                                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400'
                                                    : tipo === 'admin_notaria'
                                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400'
                                                      : tipo ===
                                                          'usuario_notaria'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400'
                                            }
                                        >
                                            {tiposCuentaLabels[tipo] || tipo}
                                        </Badge>
                                        <span className="text-sm text-muted-foreground">
                                            (
                                            {Math.round(
                                                (cantidad /
                                                    stats.total_usuarios) *
                                                    100,
                                            )}
                                            %)
                                        </span>
                                    </div>
                                    <span className="text-lg font-semibold">
                                        {cantidad}
                                    </span>
                                </div>
                            ),
                        )}
                    </div>
                </div>

                {/* Users by Notaria */}
                <div className="rounded-lg border bg-background p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <Building2 className="h-5 w-5 text-primary" />
                        Usuarios por Notaría
                    </h3>
                    {Object.keys(stats.por_notaria).length > 0 ? (
                        <div className="space-y-3">
                            {Object.entries(stats.por_notaria)
                                .sort(([, a], [, b]) => b - a)
                                .map(([notaria, cantidad]) => (
                                    <div
                                        key={notaria}
                                        className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">
                                                {notaria}
                                            </span>
                                            <span className="text-sm text-muted-foreground">
                                                (
                                                {Math.round(
                                                    (cantidad /
                                                        stats.total_usuarios) *
                                                        100,
                                                )}
                                                %)
                                            </span>
                                        </div>
                                        <span className="text-lg font-semibold">
                                            {cantidad}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            No hay usuarios asignados a notarías
                        </div>
                    )}
                </div>

                {/* Activity Summary */}
                <div className="rounded-lg border bg-background p-6">
                    <h3 className="mb-4 text-lg font-semibold">
                        Resumen de Actividad
                    </h3>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <h4 className="mb-3 font-medium">
                                Estado de Verificación
                            </h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm">
                                        Usuarios Verificados:
                                    </span>
                                    <span className="font-medium">
                                        {stats.usuarios_activos}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">
                                        Usuarios Pendientes:
                                    </span>
                                    <span className="font-medium">
                                        {stats.total_usuarios -
                                            stats.usuarios_activos}
                                    </span>
                                </div>
                                <div className="h-2 w-full rounded-full bg-muted">
                                    <div
                                        className="h-2 rounded-full bg-green-600 transition-all"
                                        style={{
                                            width: `${(stats.usuarios_activos / stats.total_usuarios) * 100}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="mb-3 font-medium">Crecimiento</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-sm">
                                        Últimos 30 días:
                                    </span>
                                    <span className="font-medium text-green-600">
                                        +{stats.registros_recientes}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-sm">
                                        Promedio mensual:
                                    </span>
                                    <span className="font-medium">
                                        {(
                                            (stats.registros_recientes / 30) *
                                            30
                                        ).toFixed(1)}
                                    </span>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    {stats.registros_recientes > 0
                                        ? 'Crecimiento positivo'
                                        : 'Sin nuevos registros'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
