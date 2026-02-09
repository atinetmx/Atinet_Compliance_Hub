import { Head, Link, router } from '@inertiajs/react';
import {
    Package,
    Plus,
    Search,
    Edit,
    Eye,
    Trash2,
    Power,
    PowerOff,
    Filter,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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

interface Plan {
    id: number;
    nombre: string;
    slug: string;
    descripcion?: string;
    precio_mensual: number | string;
    precio_anual: number | string;
    limite_usuarios: number | null;
    limite_busquedas_mes: number | null;
    herramientas_activas: string[];
    caracteristicas: string[];
    is_active: boolean;
    orden: number;
    created_at: string;
    updated_at: string;
    notarias_count?: number;
    subscriptions_count?: number;
    services_count?: number;
}

interface Pagination {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    data: Plan[];
}

interface Filters {
    search?: string;
    is_active?: boolean;
}

interface PlansIndexProps {
    plans: Pagination;
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inicio',
        href: '/dashboard',
    },
    {
        title: 'Planes',
        href: '/admin/plans',
    },
];

export default function PlansIndex({ plans, filters }: PlansIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(
        filters.is_active !== undefined ? String(filters.is_active) : 'all',
    );

    const handleSearch = () => {
        router.get(
            '/admin/plans',
            {
                search: searchTerm || undefined,
                is_active: selectedStatus !== 'all' ? selectedStatus : undefined,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedStatus('all');
        router.get('/admin/plans');
    };

    const handleToggleActive = (plan: Plan) => {
        if (
            confirm(
                `¿Estás seguro de ${plan.is_active ? 'desactivar' : 'activar'} el plan "${plan.nombre}"?`,
            )
        ) {
            router.post(`/admin/plans/${plan.id}/toggle-active`);
        }
    };

    const handleDelete = (plan: Plan) => {
        if (
            confirm(
                `¿Estás seguro de eliminar el plan "${plan.nombre}"? Esta acción no se puede deshacer.`,
            )
        ) {
            router.delete(`/admin/plans/${plan.id}`);
        }
    };

    const formatCurrency = (amount: number | string) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return `$${numAmount.toFixed(2)}`;
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Planes" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Package className="h-6 w-6 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">
                                Gestión de Planes
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {plans.total} planes disponibles
                            </p>
                        </div>
                    </div>
                    <Link href="/admin/plans/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Plan
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <div className="mb-4 flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">Filtros</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                            <Input
                                placeholder="Buscar por nombre o descripción..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>

                        <Select
                            value={selectedStatus}
                            onValueChange={setSelectedStatus}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                <SelectItem value="true">Activos</SelectItem>
                                <SelectItem value="false">Inactivos</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <Button onClick={handleSearch} size="sm">
                            <Search className="mr-2 h-4 w-4" />
                            Buscar
                        </Button>
                        <Button
                            onClick={handleClearFilters}
                            size="sm"
                            variant="outline"
                        >
                            Limpiar filtros
                        </Button>
                    </div>
                </div>

                {/* Table */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Precio Mensual</TableHead>
                                <TableHead>Precio Anual</TableHead>
                                <TableHead>Notarías</TableHead>
                                <TableHead>Suscripciones</TableHead>
                                <TableHead>Servicios</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {plans.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={8}
                                        className="text-center text-muted-foreground"
                                    >
                                        No se encontraron planes
                                    </TableCell>
                                </TableRow>
                            ) : (
                                plans.data.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {plan.nombre}
                                                </p>
                                                {plan.descripcion && (
                                                    <p className="text-sm text-muted-foreground">
                                                        {plan.descripcion.substring(
                                                            0,
                                                            50,
                                                        )}
                                                        {plan.descripcion
                                                            .length > 50
                                                            ? '...'
                                                            : ''}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(
                                                plan.precio_mensual,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {formatCurrency(plan.precio_anual)}
                                        </TableCell>
                                        <TableCell>
                                            {plan.notarias_count || 0}
                                        </TableCell>
                                        <TableCell>
                                            {plan.subscriptions_count || 0}
                                        </TableCell>
                                        <TableCell>
                                            {plan.services_count || 0}
                                        </TableCell>
                                        <TableCell>
                                            {plan.is_active ? (
                                                <Badge
                                                    variant="default"
                                                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                                >
                                                    Activo
                                                </Badge>
                                            ) : (
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                                >
                                                    Inactivo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/plans/${plan.id}`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link
                                                    href={`/admin/plans/${plan.id}/edit`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleToggleActive(plan)
                                                    }
                                                >
                                                    {plan.is_active ? (
                                                        <PowerOff className="h-4 w-4 text-orange-500" />
                                                    ) : (
                                                        <Power className="h-4 w-4 text-green-500" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleDelete(plan)
                                                    }
                                                >
                                                    <Trash2 className="h-4 w-4 text-red-500" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {plans.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {plans.from} a {plans.to} de{' '}
                            {plans.total} planes
                        </p>
                        <div className="flex gap-2">
                            {Array.from(
                                { length: plans.last_page },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <Link
                                    key={page}
                                    href={`/admin/plans?page=${page}`}
                                    preserveState
                                    preserveScroll
                                >
                                    <Button
                                        variant={
                                            page === plans.current_page
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size="sm"
                                    >
                                        {page}
                                    </Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
