import { Head, Link, useForm, router } from '@inertiajs/react';
import { Search, Plus, Filter, Eye, Edit, Trash2, Users, Building2 } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
        links: Array<{url: string | null; label: string; active: boolean}>;
        meta: {
            current_page: number;
            last_page: number;
            per_page: number;
            total: number;
            from: number;
            to: number;
        };
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
    { title: 'Usuarios', href: '/admin/users' },
];

export default function Index({ users, notarias, filters, tiposCuenta }: Props) {
    const [showFilters, setShowFilters] = useState(false);
    const { data, setData, processing } = useForm({
        search: filters.search || '',
        tipo_cuenta: filters.tipo_cuenta || '',
        notaria_id: filters.notaria_id || '',
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = {
            search: data.search || undefined,
            tipo_cuenta: data.tipo_cuenta || undefined,
            notaria_id: data.notaria_id || undefined,
        };
        router.get('/admin/users', params);
    };

    const handlePaginationClick = (url: string | null) => {
        if (!url) return;
        // Extract query params from URL and merge with current filters
        const urlObj = new URL(url, window.location.origin);
        const params = {
            page: urlObj.searchParams.get('page'),
            search: data.search || undefined,
            tipo_cuenta: data.tipo_cuenta || undefined,
            notaria_id: data.notaria_id || undefined,
        };
        router.get('/admin/users', params);
    };

    const clearFilters = () => {
        setData({ search: '', tipo_cuenta: '', notaria_id: '' });
        router.get('/admin/users');
    };

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Usuarios" />

            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="h-6 w-6 text-primary" />
                        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link href="/admin/users/reports">
                            <Button variant="outline">
                                Ver Reportes
                            </Button>
                        </Link>
                        <Link href="/admin/users/create">
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Nuevo Usuario
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* Filters */}
                <div className="space-y-4">
                    <form onSubmit={handleSearch} className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar usuarios..."
                                value={data.search}
                                onChange={(e) => setData('search', e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Button type="submit" disabled={processing}>
                            Buscar
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowFilters(!showFilters)}
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            Filtros
                        </Button>
                        {(filters.search || filters.tipo_cuenta || filters.notaria_id) && (
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={clearFilters}
                            >
                                Limpiar
                            </Button>
                        )}
                    </form>

                    {showFilters && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                            <div>
                                <label className="block text-sm font-medium mb-2">Tipo de Cuenta</label>
                                <select
                                    value={data.tipo_cuenta}
                                    onChange={(e) => setData('tipo_cuenta', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                >
                                    <option value="">Todos los tipos</option>
                                    {Object.entries(tiposCuenta).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Notaría</label>
                                <select
                                    value={data.notaria_id}
                                    onChange={(e) => setData('notaria_id', e.target.value)}
                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                >
                                    <option value="">Todas las notarías</option>
                                    {notarias.map((notaria) => (
                                        <option key={notaria.id} value={notaria.id}>
                                            {notaria.numero_notaria} - {notaria.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                {/* Users Table */}
                <div className="rounded-md border">
                    <table className="w-full">
                        <thead className="border-b bg-muted/50">
                            <tr>
                                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                                <th className="px-4 py-3 text-left font-medium">Email</th>
                                <th className="px-4 py-3 text-left font-medium">Tipo de Cuenta</th>
                                <th className="px-4 py-3 text-left font-medium">Notaría</th>
                                <th className="px-4 py-3 text-left font-medium">Estado</th>
                                <th className="px-4 py-3 text-center font-medium">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((user) => (
                                <tr key={user.id} className="border-b hover:bg-muted/30">
                                    <td className="px-4 py-3">
                                        <div>
                                            <div className="font-medium">{user.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                ID: {user.id}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm">{user.email}</td>
                                    <td className="px-4 py-3">
                                        <Badge className={getTipoCuentaBadgeColor(user.tipo_cuenta)}>
                                            {tiposCuenta[user.tipo_cuenta]}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.notaria ? (
                                            <div className="flex items-center gap-2">
                                                <Building2 className="h-4 w-4 text-muted-foreground" />
                                                <div>
                                                    <div className="text-sm font-medium">
                                                        {user.notaria.numero_notaria}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {user.notaria.nombre}
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">Sin asignar</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <Badge variant={user.email_verified_at ? "default" : "secondary"}>
                                            {user.email_verified_at ? 'Verificado' : 'Pendiente'}
                                        </Badge>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Link href={`/admin/users/${user.id}`}>
                                                <Button variant="outline" size="sm">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link href={`/admin/users/${user.id}/edit`}>
                                                <Button size="sm" variant="ghost">
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            {user.tipo_cuenta !== 'super_admin' && (
                                                <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {users.links && users.links.length > 3 && (
                    <div className="flex items-center justify-between">
                        <div className="text-sm text-muted-foreground">
                            Mostrando {users.meta.from} a {users.meta.to} de {users.meta.total} usuarios
                        </div>
                        <div className="flex items-center gap-2">
                            {users.links.map((link, index) => (
                                <button
                                    key={index}
                                    onClick={() => handlePaginationClick(link.url)}
                                    disabled={!link.url}
                                    className={`px-3 py-2 text-sm rounded-md ${
                                        link.active
                                            ? 'bg-primary text-primary-foreground'
                                            : link.url
                                            ? 'bg-background border hover:bg-muted cursor-pointer'
                                            : 'text-muted-foreground cursor-not-allowed opacity-50'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
