import { Head, Link, router } from '@inertiajs/react';
import { Search, Trash2, Users, X, CalendarDays } from 'lucide-react';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Registro {
    id: number;
    notaria: string;
    persona: string;
    nombre: string;
    apellidopat: string;
    apellidomat: string | null;
    curp: string | null;
    rfc: string | null;
    dia_registro: string;
    created_at: string;
}

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
    legacy_identifier: string | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface PaginatedRegistros {
    data: Registro[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    links: PaginationLink[];
}

interface Filters {
    notaria: string | null;
    nombre: string | null;
    fecha_desde: string | null;
    fecha_hasta: string | null;
}

interface Props {
    registros: PaginatedRegistros;
    notarias: Notaria[];
    can_delete: boolean;
    is_super_admin: boolean;
    filters: Filters;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Registro Web', href: '/admin/registro-web' },
    { title: 'Listado', href: '/admin/registro-web/listado' },
];

export default function RegistroWebListado({ registros, notarias, can_delete, is_super_admin, filters }: Props) {
    const [nombre, setNombre] = useState(filters.nombre ?? '');
    const [notaria, setNotaria] = useState(filters.notaria ?? 'all');
    const [fechaDesde, setFechaDesde] = useState(filters.fecha_desde ?? '');
    const [fechaHasta, setFechaHasta] = useState(filters.fecha_hasta ?? '');
    const [recordToDelete, setRecordToDelete] = useState<Registro | null>(null);
    const [deleting, setDeleting] = useState(false);

    const nombreCompleto = (r: Registro) =>
        [r.nombre, r.apellidopat, r.apellidomat].filter(Boolean).join(' ');

    function applyFilters() {
        router.get(
            '/admin/registro-web/listado',
            {
                ...(nombre ? { nombre } : {}),
                ...(notaria && notaria !== 'all' ? { notaria } : {}),
                ...(fechaDesde ? { fecha_desde: fechaDesde } : {}),
                ...(fechaHasta ? { fecha_hasta: fechaHasta } : {}),
            },
            { preserveState: true, replace: true },
        );
    }

    function clearFilters() {
        setNombre('');
        setNotaria('all');
        setFechaDesde('');
        setFechaHasta('');
        router.get('/admin/registro-web/listado', {}, { preserveState: false, replace: true });
    }

    function confirmDelete(r: Registro) {
        setRecordToDelete(r);
    }

    function handleDelete() {
        if (!recordToDelete) return;
        setDeleting(true);
        router.delete(`/admin/registro-web/${recordToDelete.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setRecordToDelete(null);
            },
        });
    }

    const hasActiveFilters = !!(nombre || (notaria && notaria !== 'all') || fechaDesde || fechaHasta);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Listado de Registros Web" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="mb-2 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-semibold">Listado de Registros Web</h1>
                        <p className="text-sm text-muted-foreground">
                            {registros.total} registro{registros.total !== 1 ? 's' : ''} encontrado{registros.total !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <Link href="/admin/registro-web">
                        <Button variant="outline">
                            <Users className="mr-2 h-4 w-4" />
                            Nuevo Registro
                        </Button>
                    </Link>
                </div>

                {/* Stats Cards */}
                <div className="grid auto-rows-min gap-4 md:grid-cols-3 mb-2">
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <p className="text-sm font-medium text-muted-foreground">Total registros</p>
                        <p className="text-2xl font-bold">{registros.total}</p>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <p className="text-sm font-medium text-muted-foreground">Página actual</p>
                        <p className="text-2xl font-bold">{registros.current_page} / {registros.last_page}</p>
                    </div>
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                        <p className="text-sm font-medium text-muted-foreground">Por página</p>
                        <p className="text-2xl font-bold">{registros.per_page}</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-4 dark:border-sidebar-border">
                    <div className="flex flex-wrap items-end gap-3">
                        {/* Búsqueda por nombre / CURP / RFC */}
                        <div className="relative min-w-55 flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Nombre, CURP o RFC..."
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
                                className="pl-10"
                            />
                        </div>

                        {/* Filtro por notaría (solo super_admin) */}
                        {is_super_admin && (
                            <Select value={notaria} onValueChange={setNotaria}>
                                <SelectTrigger className="min-w-50">
                                    <SelectValue placeholder="Todas las notarías" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todas las notarías</SelectItem>
                                    {notarias.map((n) => (
                                        <SelectItem
                                            key={n.id}
                                            value={n.legacy_identifier ?? String(n.id)}
                                        >
                                            No. {n.numero_notaria} — {n.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        {/* Fecha desde */}
                        <div className="flex items-center gap-1">
                            <CalendarDays className="h-4 w-4 text-muted-foreground" />
                            <Input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                                className="w-37.5"
                                title="Fecha desde"
                            />
                        </div>

                        {/* Fecha hasta */}
                        <div className="flex items-center gap-1">
                            <span className="text-sm text-muted-foreground">hasta</span>
                            <Input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                                className="w-37.5"
                                title="Fecha hasta"
                            />
                        </div>

                        <Button onClick={applyFilters}>
                            <Search className="mr-2 h-4 w-4" />
                            Buscar
                        </Button>

                        {hasActiveFilters && (
                            <Button variant="ghost" onClick={clearFilters}>
                                <X className="mr-2 h-4 w-4" />
                                Limpiar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-sidebar-border/70 bg-background dark:border-sidebar-border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre completo</TableHead>
                                <TableHead>CURP</TableHead>
                                <TableHead>RFC</TableHead>
                                {is_super_admin && <TableHead>Notaría</TableHead>}
                                <TableHead>Tipo</TableHead>
                                <TableHead>Fecha registro</TableHead>
                                {can_delete && <TableHead className="text-right">Acciones</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {registros.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={can_delete ? (is_super_admin ? 7 : 6) : (is_super_admin ? 6 : 5)}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        No se encontraron registros con los filtros aplicados.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                registros.data.map((r) => (
                                    <TableRow key={r.id}>
                                        <TableCell>
                                            <p className="font-medium">{nombreCompleto(r)}</p>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">{r.curp ?? '—'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="font-mono text-sm">{r.rfc ?? '—'}</span>
                                        </TableCell>
                                        {is_super_admin && (
                                            <TableCell>
                                                <span className="text-sm">{r.notaria}</span>
                                            </TableCell>
                                        )}
                                        <TableCell>
                                            <Badge variant={r.persona === 'moral' ? 'secondary' : 'outline'}>
                                                {r.persona === 'moral' ? 'Moral' : 'Física'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-muted-foreground">
                                                {r.dia_registro ?? r.created_at?.slice(0, 10)}
                                            </span>
                                        </TableCell>
                                        {can_delete && (
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                    onClick={() => confirmDelete(r)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {registros.last_page > 1 && (
                    <div className="flex items-center justify-center gap-1 pt-2">
                        {registros.links.map((link, idx) => (
                            link.url ? (
                                <Link
                                    key={idx}
                                    href={link.url}
                                    preserveState
                                    className={`rounded px-3 py-1 text-sm border transition-colors ${
                                        link.active
                                            ? 'bg-amber-600 text-white border-amber-600'
                                            : 'border-sidebar-border/70 hover:bg-amber-500/10'
                                    }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ) : (
                                <span
                                    key={idx}
                                    className="rounded px-3 py-1 text-sm border border-sidebar-border/70 text-muted-foreground"
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            )
                        ))}
                    </div>
                )}
            </div>

            {/* Delete confirmation dialog */}
            <Dialog open={!!recordToDelete} onOpenChange={(open: boolean) => !open && setRecordToDelete(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Eliminar este registro?</DialogTitle>
                        <DialogDescription>
                            {recordToDelete && (
                                <>
                                    Estás a punto de eliminar el registro de{' '}
                                    <strong>{nombreCompleto(recordToDelete)}</strong>
                                    {recordToDelete.curp ? ` (CURP: ${recordToDelete.curp})` : ''}.
                                    <br />
                                    <span className="text-destructive font-medium">Esta acción no se puede deshacer.</span>
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" disabled={deleting} onClick={() => setRecordToDelete(null)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={deleting}
                        >
                            {deleting ? 'Eliminando...' : 'Sí, eliminar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
