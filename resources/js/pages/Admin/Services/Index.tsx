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

interface Service {
    id: number;
    code: string;
    name: string;
    description: string;
    category: string;
    billing_model: string;
    unit_price: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Pagination {
    current_page: number;
    from: number;
    last_page: number;
    per_page: number;
    to: number;
    total: number;
    data: Service[];
}

interface Category {
    value: string;
    label: string;
}

interface BillingModel {
    value: string;
    label: string;
}

interface Filters {
    search?: string;
    category?: string;
    billing_model?: string;
    is_active?: boolean;
}

interface ServicesIndexProps {
    services: Pagination;
    filters: Filters;
    categories: Category[];
    billingModels: BillingModel[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Gestión de Servicios',
        href: '/admin/services',
        icon: Package,
    },
];

export default function ServicesIndex({
    services,
    filters,
    categories,
    billingModels,
}: ServicesIndexProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [selectedCategory, setSelectedCategory] = useState(
        filters.category || 'all',
    );
    const [selectedBillingModel, setSelectedBillingModel] = useState(
        filters.billing_model || 'all',
    );
    const [selectedStatus, setSelectedStatus] = useState(
        filters.is_active !== undefined ? String(filters.is_active) : 'all',
    );

    const handleSearch = () => {
        router.get(
            '/admin/services',
            {
                search: searchTerm || undefined,
                category: selectedCategory !== 'all' ? selectedCategory : undefined,
                billing_model: selectedBillingModel !== 'all' ? selectedBillingModel : undefined,
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
        setSelectedCategory('all');
        setSelectedBillingModel('all');
        setSelectedStatus('all');
        router.get('/admin/services');
    };

    const handleToggleActive = (service: Service) => {
        if (
            confirm(
                `¿Estás seguro de ${service.is_active ? 'desactivar' : 'activar'} el servicio "${service.name}"?`,
            )
        ) {
            router.post(`/admin/services/${service.id}/toggle-active`);
        }
    };

    const handleDelete = (service: Service) => {
        if (
            confirm(
                `¿Estás seguro de eliminar el servicio "${service.name}"? Esta acción no se puede deshacer.`,
            )
        ) {
            router.delete(`/admin/services/${service.id}`);
        }
    };

    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            consulta: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            api: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            sistema: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            analisis: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            storage: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            integration: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
        };

        return (
            <Badge className={colors[category] || 'bg-gray-100 text-gray-800'}>
                {categories.find((c) => c.value === category)?.label ||
                    category}
            </Badge>
        );
    };

    const getBillingBadge = (billingModel: string) => {
        const variants: Record<
            string,
            'default' | 'secondary' | 'destructive' | 'outline'
        > = {
            included: 'default',
            limited: 'secondary',
            per_use: 'destructive',
            unlimited: 'outline',
        };

        return (
            <Badge variant={variants[billingModel] || 'outline'}>
                {billingModels.find((b) => b.value === billingModel)?.label ||
                    billingModel}
            </Badge>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Servicios" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="mb-6 flex items-center justify-end">
                    <Link href="/admin/services/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Servicio
                        </Button>
                    </Link>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4">
                    <div className="mb-4 flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold">Filtros</h3>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                        <div>
                            <Input
                                placeholder="Buscar por nombre o código..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSearch();
                                }}
                            />
                        </div>

                        <Select
                            value={selectedCategory}
                            onValueChange={setSelectedCategory}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas</SelectItem>
                                {categories.map((cat) => (
                                    <SelectItem
                                        key={cat.value}
                                        value={cat.value}
                                    >
                                        {cat.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Select
                            value={selectedBillingModel}
                            onValueChange={setSelectedBillingModel}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Modelo de facturación" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos</SelectItem>
                                {billingModels.map((model) => (
                                    <SelectItem
                                        key={model.value}
                                        value={model.value}
                                    >
                                        {model.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

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
                                <TableHead>Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Modelo Facturación</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center text-muted-foreground"
                                    >
                                        No se encontraron servicios
                                    </TableCell>
                                </TableRow>
                            ) : (
                                services.data.map((service) => (
                                    <TableRow key={service.id}>
                                        <TableCell className="font-mono text-sm">
                                            {service.code}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium">
                                                    {service.name}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    {service.description.substring(
                                                        0,
                                                        50,
                                                    )}
                                                    {service.description
                                                        .length > 50
                                                        ? '...'
                                                        : ''}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {getCategoryBadge(service.category)}
                                        </TableCell>
                                        <TableCell>
                                            {getBillingBadge(
                                                service.billing_model,
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {service.unit_price !== null
                                                ? `$${service.unit_price}`
                                                : '-'}
                                        </TableCell>
                                        <TableCell>
                                            {service.is_active ? (
                                                <Badge variant="default">
                                                    Activo
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">
                                                    Inactivo
                                                </Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Link
                                                    href={`/admin/services/${service.id}`}
                                                >
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Link
                                                    href={`/admin/services/${service.id}/edit`}
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
                                                        handleToggleActive(
                                                            service,
                                                        )
                                                    }
                                                >
                                                    {service.is_active ? (
                                                        <PowerOff className="h-4 w-4 text-orange-500" />
                                                    ) : (
                                                        <Power className="h-4 w-4 text-green-500" />
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleDelete(service)
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
                {services.last_page > 1 && (
                    <div className="mt-4 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {services.from} a {services.to} de{' '}
                            {services.total} servicios
                        </p>
                        <div className="flex gap-2">
                            {Array.from(
                                { length: services.last_page },
                                (_, i) => i + 1,
                            ).map((page) => (
                                <Link
                                    key={page}
                                    href={`/admin/services?page=${page}`}
                                    preserveState
                                    preserveScroll
                                >
                                    <Button
                                        variant={
                                            page === services.current_page
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
