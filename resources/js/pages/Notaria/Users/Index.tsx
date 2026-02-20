import { Head, Link, router } from '@inertiajs/react';
import { Users, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    tipo_cuenta: string;
    created_at: string;
}

interface Props {
    users: User[];
    notaria: {
        id: number;
        nombre: string;
        numero_notaria: string;
    };
    limits: {
        current: number;
        max: number;
        can_delete: boolean;
    };
    plan: {
        nombre: string;
        tiene_dashboard_avanzado: boolean;
    };
}

export default function Index({ users, notaria, limits, plan }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Usuarios', href: '/notaria/users' },
    ];

    const handleDelete = (id: number, name: string) => {
        if (!limits.can_delete) {
            alert('Tu plan no permite eliminar usuarios. Contacta a soporte de Atinet o actualiza a Dashboard Avanzado.');
            return;
        }

        if (confirm(`¿Estás seguro de eliminar al usuario ${name}?`)) {
            router.delete(`/notaria/users/${id}`);
        }
    };

    const getTipoCuentaBadge = (tipo: string) => {
        const badges = {
            admin_notaria: 'bg-primary/10 text-primary',
            usuario_notaria: 'bg-blue-500/10 text-blue-600',
            invitado: 'bg-gray-500/10 text-gray-600',
        };
        const labels = {
            admin_notaria: 'Administrador',
            usuario_notaria: 'Usuario',
            invitado: 'Invitado',
        };

        return (
            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${badges[tipo as keyof typeof badges] || badges.invitado}`}>
                {labels[tipo as keyof typeof labels] || tipo}
            </span>
        );
    };

    const isNearLimit = limits.max !== -1 && limits.current >= limits.max * 0.8;
    const atLimit = limits.max !== -1 && limits.current >= limits.max;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Usuarios - ${notaria.nombre}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold">Usuarios de la Notaría</h1>
                        <p className="text-muted-foreground">
                            Gestiona los usuarios de {notaria.nombre}
                        </p>
                    </div>
                    <Link href="/notaria/users/create">
                        <Button disabled={atLimit}>
                            <Plus className="mr-2 h-4 w-4" />
                            Crear Usuario
                        </Button>
                    </Link>
                </div>

                {/* Límite de usuarios */}
                <div className="rounded-lg border border-sidebar-border/70 bg-background p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium">Plan: {plan.nombre}</p>
                            <p className="text-xs text-muted-foreground">
                                {limits.current} de {limits.max === -1 ? '∞' : limits.max} usuarios
                            </p>
                        </div>
                        {isNearLimit && (
                            <Alert variant={atLimit ? "destructive" : "default"} className="w-auto">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                    {atLimit
                                        ? 'Has alcanzado el límite de usuarios de tu plan'
                                        : 'Te estás acercando al límite de usuarios'}
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                </div>

                {!limits.can_delete && (
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            Tu plan no permite eliminar usuarios. Para eliminar usuarios, contacta a soporte o actualiza a Dashboard Avanzado.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Tabla de usuarios */}
                <div className="rounded-lg border border-sidebar-border/70 bg-background">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-sidebar-border/70">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Nombre
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Correo
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Rol
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Fecha de Creación
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-sidebar-border/70">
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                                            <Users className="mx-auto h-12 w-12 mb-2 opacity-20" />
                                            <p>No hay usuarios registrados</p>
                                            <Link href="/notaria/users/create" className="text-primary hover:underline text-sm mt-2 inline-block">
                                                Crear primer usuario
                                            </Link>
                                        </td>
                                    </tr>
                                ) : (
                                    users.map((user) => (
                                        <tr key={user.id} className="hover:bg-accent/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium">{user.name}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {user.email}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {getTipoCuentaBadge(user.tipo_cuenta)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString('es-MX')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/notaria/users/${user.id}/edit`}>
                                                        <Button variant="ghost" size="sm">
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    {limits.can_delete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(user.id, user.name)}
                                                            className="text-destructive hover:text-destructive"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
