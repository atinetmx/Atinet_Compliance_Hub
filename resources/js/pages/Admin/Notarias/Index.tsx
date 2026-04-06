import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Plus,
    Search,
    Edit,
    Eye,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';

import DeleteNotariaDialog from '@/components/Admin/DeleteNotariaDialog';
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


interface Plan {
    id: number;
    nombre: string;
    precio_mensual: number;
}

interface Subscription {
    id: number;
    status: string;
}

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
    activa: boolean;
    contacto_principal: string;
    email_contacto: string;
    telefono: string | null;
    fecha_registro: string;
    users_count: number;
    total_usuarios?: number;
    busquedas_mes_actual?: number;
    plan: Plan | null;
    subscripcion_activa: Subscription | null;
}

interface NotariaIndexProps {
    notarias: Notaria[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Gestión de Notarías',
        href: '/admin/notarias',
        icon: Building2,
    },
];

export default function NotariaIndex({ notarias }: NotariaIndexProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedNotaria, setSelectedNotaria] = useState<Notaria | null>(null);

    const filteredNotarias = notarias.filter(
        (notaria) =>
            notaria.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            notaria.numero_notaria.includes(searchTerm) ||
            notaria.contacto_principal
                .toLowerCase()
                .includes(searchTerm.toLowerCase()),
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Gestión de Notarías" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="mb-6 flex items-center justify-end">
                    <Link href="/admin/notarias/create">
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Notaría
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="mb-6 grid auto-rows-min gap-4 md:grid-cols-4">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Notarías
                            </p>
                            <p className="text-2xl font-bold">
                                {notarias.length}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Activas
                            </p>
                            <p className="text-2xl font-bold text-green-600">
                                {notarias.filter((n) => n.activa).length}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Inactivas
                            </p>
                            <p className="text-2xl font-bold text-red-600">
                                {notarias.filter((n) => !n.activa).length}
                            </p>
                        </div>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-muted-foreground">
                                Total Usuarios
                            </p>
                            <p className="text-2xl font-bold">
                                {notarias.reduce(
                                    (acc, n) => acc + n.users_count,
                                    0,
                                )}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="mb-4 rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <div className="flex items-center gap-4">
                        <div className="relative max-w-md flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre, número o contacto..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            {filteredNotarias.length} de {notarias.length}{' '}
                            notarías
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Notaría</TableHead>
                                <TableHead>Contacto</TableHead>
                                <TableHead>Plan</TableHead>
                                <TableHead>Usuarios</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Registro</TableHead>
                                <TableHead className="text-right">
                                    Acciones
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredNotarias.map((notaria) => (
                                <TableRow key={notaria.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">
                                                {notaria.nombre}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                Notaría No.{' '}
                                                {notaria.numero_notaria}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">
                                                {notaria.contacto_principal}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {notaria.email_contacto}
                                            </p>
                                            {notaria.telefono && (
                                                <p className="text-sm text-muted-foreground">
                                                    {notaria.telefono}
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {notaria.plan ? (
                                            <div>
                                                <p className="font-medium">
                                                    {notaria.plan.nombre}
                                                </p>
                                                <p className="text-sm text-muted-foreground">
                                                    $
                                                    {
                                                        notaria.plan
                                                            .precio_mensual
                                                    }
                                                    /mes
                                                </p>
                                            </div>
                                        ) : (
                                            <span className="text-muted-foreground">
                                                Sin plan
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span>{notaria.users_count}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                notaria.activa
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {notaria.activa
                                                ? 'Activa'
                                                : 'Inactiva'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <span className="text-sm text-muted-foreground">
                                            {new Date(
                                                notaria.fecha_registro,
                                            ).toLocaleDateString('es-ES')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/admin/notarias/${notaria.id}`}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link
                                                href={`/admin/notarias/${notaria.id}/edit`}
                                            >
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => {
                                                    setSelectedNotaria(notaria);
                                                    setDeleteDialogOpen(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    {filteredNotarias.length === 0 && (
                        <div className="py-8 text-center">
                            <p className="text-muted-foreground">
                                {searchTerm
                                    ? 'No se encontraron notarías que coincidan con la búsqueda.'
                                    : 'No hay notarías registradas.'}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de confirmación de eliminación */}
            <DeleteNotariaDialog
                notaria={selectedNotaria}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </AppLayout>
    );
}
