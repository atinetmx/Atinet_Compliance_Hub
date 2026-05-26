import { Head, Link, useForm, router } from '@inertiajs/react';
import {
    Search,
    Plus,
    Filter,
    Eye,
    Edit,
    Trash2,
    Users,
    Building2,
} from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
    users: {
        data: User[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
    };
    notarias: Array<{
        id: number;
        nombre: string;
        numero_notaria: string;
    }>;
    filters: {
        search?: string;
        tipo_cuenta?: string;
        notaria_id?: string;
    };
    tiposCuenta: Record<string, string>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administración', href: '/admin' },
    { title: 'Gestión de Usuarios', href: '/admin/users', icon: Users },
];

export default function Index({
    users,
    notarias,
    filters,
    tiposCuenta,
}: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const isFirstRender = useRef(true);
    const { data, setData } = useForm({
        search: filters.search || '',
        tipo_cuenta: filters.tipo_cuenta || '',
        notaria_id: filters.notaria_id || '',
    });

    const handlePaginationClick = (url: string | null) => {
        if (!url) return;
        const urlObj = new URL(url, window.location.origin);
        const params: Record<string, string | undefined> = {
            page: urlObj.searchParams.get('page') ?? undefined,
            search: data.search || undefined,
            tipo_cuenta: data.tipo_cuenta || undefined,
            notaria_id: data.notaria_id || undefined,
        };
        router.get('/admin/users', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const clearFilters = () => {
        setData({ search: '', tipo_cuenta: '', notaria_id: '' });
        router.get('/admin/users');
    };

    // Búsqueda dinámica con debounce — no disparar en el primer render
    useEffect(() => {
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        const delayDebounceFn = setTimeout(() => {
            const params = {
                search: data.search || undefined,
                tipo_cuenta: data.tipo_cuenta || undefined,
                notaria_id: data.notaria_id || undefined,
            };
            router.get('/admin/users', params, {
                preserveState: true,
                preserveScroll: true,
            });
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [data.search, data.tipo_cuenta, data.notaria_id]);

    const getTipoCuentaBadgeColor = (tipo: string) => {
        switch (tipo) {
            case 'super_admin':
                return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
            case 'admin_notaria':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400';
            case 'usuario_notaria':
                return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
            case 'invitado':
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
        }
    };

    const handleDelete = (user: User) => {
        if (
            confirm(
                `¿Estás seguro de eliminar al usuario "${user.name}" (${user.email})? Esta acción no se puede deshacer.`,
            )
        ) {
            router.post(
                `/admin/users/${user.id}`,
                {
                    _method: 'DELETE',
                },
                {
                    onSuccess: () => {
                        // El mensaje de éxito lo maneja el backend
                    },
                    preserveScroll: true,
                },
            );
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Usuarios" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header con botones de acción */}
                <div className="mb-6 flex items-center justify-end gap-2">
                    <Link href="/admin/users/reports">
                        <Button variant="outline">Ver Reportes</Button>
                    </Link>
                    <Link href="/admin/users/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Usuario
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid auto-rows-min gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Usuarios
                            </p>
                            <p className="text-2xl font-bold">
                                {users.total}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Verificados
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {users.data.filter((u) => u.email_verified_at).length}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Pendientes
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                                {users.data.filter((u) => !u.email_verified_at).length}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Super Admins
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {users.data.filter((u) => u.tipo_cuenta === 'super_admin').length}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-4 rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <div className="mb-4 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar usuarios..."
                                value={data.search}
                                onChange={(e) =>
                                    setData('search', e.target.value)
                                }
                                className="pl-10"
                            />
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="mr-2 h-4 w-4" />
                            Filtros
                        </Button>
                        {(filters.search ||
                            filters.tipo_cuenta ||
                            filters.notaria_id) && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={clearFilters}
                            >
                                Limpiar
                            </Button>
                        )}
                    </div>

                    {showFilters && (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Tipo de Cuenta
                                </label>
                                <select
                                    value={data.tipo_cuenta}
                                    onChange={(e) =>
                                        setData('tipo_cuenta', e.target.value)
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                >
                                    <option value="">Todos los tipos</option>
                                    {Object.entries(tiposCuenta).map(
                                        ([key, value]) => (
                                            <option key={key} value={key}>
                                                {value}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </div>
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Notaría
                                </label>
                                <select
                                    value={data.notaria_id}
                                    onChange={(e) =>
                                        setData('notaria_id', e.target.value)
                                    }
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                >
                                    <option value="">Todas las notarías</option>
                                    {notarias.map((notaria) => (
                                        <option
                                            key={notaria.id}
                                            value={notaria.id}
                                        >
                                            {notaria.numero_notaria} -{' '}
                                            {notaria.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Users Table */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Usuario</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Tipo de Cuenta</TableHead>
                                <TableHead>Notaría</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.data.length > 0 ? (
                                users.data.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-muted-foreground">
                                                    ID: {user.id}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            {user.email}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={getTipoCuentaBadgeColor(
                                                    user.tipo_cuenta,
                                                )}
                                            >
                                                {tiposCuenta[user.tipo_cuenta]}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {user.notaria ? (
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <div className="text-sm font-medium">
                                                            {
                                                                user.notaria
                                                                    .numero_notaria
                                                            }
                                                        </div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {user.notaria.nombre}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">
                                                    Sin asignar
                                                </span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={
                                                    user.email_verified_at
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {user.email_verified_at
                                                    ? 'Verificado'
                                                    : 'Pendiente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Link
                                                    href={`/admin/users/${user.id}`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link
                                                    href={`/admin/users/${user.id}/edit`}
                                                >
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                {user.tipo_cuenta !==
                                                    'super_admin' && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="text-red-600 hover:text-red-700"
                                                        onClick={() =>
                                                            handleDelete(user)
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={6}
                                        className="h-24 text-center"
                                    >
                                        <p className="text-muted-foreground">
                                            {data.search || data.tipo_cuenta || data.notaria_id
                                                ? 'No se encontraron usuarios que coincidan con los filtros.'
                                                : 'No hay usuarios registrados.'}
                                        </p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {users.links && users.links.length > 3 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {users.from ?? 0} a {users.to ?? 0} de{' '}
                            {users.total} usuarios
                        </div>
                        <div className="flex items-center gap-2">
                            {users.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() =>
                                        handlePaginationClick(link.url)
                                    }
                                    disabled={!link.url}
                                    className={`rounded-md px-3 py-2 text-sm ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : link.url
                                              ? 'cursor-pointer border bg-background hover:bg-muted'
                                              : 'cursor-not-allowed text-muted-foreground opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
