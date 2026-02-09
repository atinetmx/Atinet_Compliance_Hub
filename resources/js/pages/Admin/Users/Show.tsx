import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Mail,
    Briefcase,
    Building2,
    Calendar,
    Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    tipo_cuenta: string;
    notaria_id: number | null;
    notaria?: {
        id: number;
        nombre: string;
        numero_notaria: string;
    };
    email_verified_at: string | null;
    created_at: string;
}

interface Props {
    user: User;
    stats: {
        total_busquedas: number;
        busquedas_mes: number;
    };
}

const getTipoCuentaBadgeColor = (tipo: string): string => {
    const colors: Record<string, string> = {
        super_admin:
            'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400',
        admin_notaria:
            'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400',
        usuario_notaria:
            'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400',
        invitado:
            'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400',
    };
    return colors[tipo] || colors.invitado;
};

const getTipoCuentaLabel = (tipo: string): string => {
    const labels: Record<string, string> = {
        super_admin: 'Super Administrador',
        admin_notaria: 'Admin Notaría',
        usuario_notaria: 'Usuario Notaría',
        invitado: 'Invitado',
    };
    return labels[tipo] || tipo;
};

export default function Show({ user, stats }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Administración', href: '/admin' },
        { title: 'Usuarios', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}` },
    ];

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(date));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`${user.name} - Usuario`} />

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
                        <div>
                            <h1 className="text-3xl font-bold">{user.name}</h1>
                            <p className="text-gray-500">ID: {user.id}</p>
                        </div>
                    </div>
                    <Link href={`/admin/users/${user.id}/edit`}>
                        <Button>Editar Usuario</Button>
                    </Link>
                </div>

                {/* Content */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Main Info */}
                    <div className="space-y-6 lg:col-span-2">
                        {/* User Details */}
                        <div className="rounded-lg border bg-background p-6">
                            <h3 className="mb-4 text-lg font-semibold">
                                Información del Usuario
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b pb-4">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500">
                                            Email
                                        </p>
                                        <p className="font-medium">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 border-b pb-4">
                                    <Shield className="h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500">
                                            Tipo de Cuenta
                                        </p>
                                        <Badge
                                            className={getTipoCuentaBadgeColor(
                                                user.tipo_cuenta,
                                            )}
                                        >
                                            {getTipoCuentaLabel(
                                                user.tipo_cuenta,
                                            )}
                                        </Badge>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 border-b pb-4">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500">
                                            Email Verificado
                                        </p>
                                        <p className="font-medium">
                                            {user.email_verified_at ? (
                                                <span className="text-green-600">
                                                    {formatDate(
                                                        user.email_verified_at,
                                                    )}
                                                </span>
                                            ) : (
                                                <span className="text-yellow-600">
                                                    Pendiente de verificación
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-gray-400" />
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-500">
                                            Fecha de Creación
                                        </p>
                                        <p className="font-medium">
                                            {formatDate(user.created_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Notaria Info */}
                        {user.notaria && (
                            <div className="rounded-lg border bg-background p-6">
                                <div className="mb-4 flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    <h3 className="text-lg font-semibold">
                                        Notaría Asignada
                                    </h3>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Nombre
                                        </p>
                                        <p className="font-medium">
                                            {user.notaria.nombre}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">
                                            Número de Notaría
                                        </p>
                                        <p className="font-medium">
                                            {user.notaria.numero_notaria}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Stats Sidebar */}
                    <div className="space-y-4">
                        {/* Búsquedas Stats */}
                        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Total de Búsquedas
                                    </p>
                                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                                        {stats.total_busquedas}
                                    </p>
                                </div>
                                <Briefcase className="h-8 w-8 text-blue-300 dark:text-blue-700" />
                            </div>
                        </div>

                        {/* Búsquedas Este Mes */}
                        <div className="rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-900 dark:bg-green-950/30">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Búsquedas Este Mes
                                    </p>
                                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                                        {stats.busquedas_mes}
                                    </p>
                                </div>
                                <Calendar className="h-8 w-8 text-green-300 dark:text-green-700" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
