import { Head, router } from '@inertiajs/react';
import { Shield, History as HistoryIcon, Search, Calendar, Filter, RefreshCw, ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

interface HistorialItem {
    id: number;
    user_id: number;
    notaria_id: number | null;
    apellido_denominacion: string;
    nombres: string;
    identificacion: string | null;
    total_aciertos: number;
    consumo_id: string | null; // ID de referencia en la API del proveedor
    created_at: string;
    updated_at: string;
    user: {
        id: number;
        name: string;
        email: string;
    };
    notaria?: {
        id: number;
        nombre: string;
    } | null;
}

interface PaginatedHistorial {
    data: HistorialItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface PaqueteInfo {
    total_contratado: number;
    consumidas: number;
    disponibles: number;
}

interface Props {
    historial?: PaginatedHistorial;
    paquete?: PaqueteInfo;
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function ListasPEPHistory({ historial: historialProp, paquete }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Listas PEP', href: '/admin/listas-pep', icon: Shield },
        { title: 'Historial', href: '/admin/listas-pep/historial', icon: HistoryIcon },
    ];

    // TODO: Cuando el endpoint esté implementado, pasar los datos via Inertia props
    const [historial, setHistorial] = useState<PaginatedHistorial | null>(historialProp ?? null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        termino: '',
        dias: '30',
    });

    // ---- Cargar historial ----
    // TODO: Activar este método cuando se implemente ListasPEPController y el
    // endpoint GET /admin/listas-pep/historial/data esté disponible.
    const cargarHistorial = async (_page = 1) => {
        // Pendiente de implementación — la API del proveedor aún no ha sido entregada.
        console.info('[ListasPEP] cargarHistorial: endpoint pendiente de implementación.');
    };

    useEffect(() => {
        // TODO: Descomentar cuando el endpoint esté disponible
        // if (!historialProp) cargarHistorial();
    }, []);

    const handleFilterChange = () => {
        cargarHistorial(1);
    };

    const limpiarFiltros = () => {
        setFilters({ termino: '', dias: '30' });
        setTimeout(() => cargarHistorial(1), 0);
    };

    const paqueteLocal = paquete ?? {
        total_contratado: 600,
        consumidas: 0,
        disponibles: 600,
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Listas PEP — Historial" />

            <div className="space-y-6 p-6">
                {/* ── Encabezado ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <HistoryIcon className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                Historial de Búsquedas PEP
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Registro de todas las consultas realizadas al módulo PEPs y Listas de Interés
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit('/admin/listas-pep')}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Nueva búsqueda
                    </Button>
                </div>

                {/* ── Stats del paquete ── */}
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-xs text-muted-foreground">Total contratado</p>
                            <p className="mt-1 text-2xl font-bold text-foreground">
                                {paqueteLocal.total_contratado.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-xs text-muted-foreground">Búsquedas consumidas</p>
                            <p className="mt-1 text-2xl font-bold text-orange-600">
                                {paqueteLocal.consumidas.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-xs text-muted-foreground">Disponibles</p>
                            <p className={`mt-1 text-2xl font-bold ${paqueteLocal.disponibles <= 50 ? 'text-red-600' : paqueteLocal.disponibles <= 100 ? 'text-yellow-600' : 'text-green-600'}`}>
                                {paqueteLocal.disponibles.toLocaleString()}
                            </p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="pt-5">
                            <p className="text-xs text-muted-foreground">% Consumido</p>
                            <p className="mt-1 text-2xl font-bold text-blue-600">
                                {Math.round((paqueteLocal.consumidas / paqueteLocal.total_contratado) * 100)}%
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Filtros ── */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Filter className="h-4 w-4 text-blue-600" />
                            Filtros
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap items-end gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="termino">Buscar por nombre / identificación</Label>
                                <div className="relative">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="termino"
                                        placeholder="Ingrese término..."
                                        className="pl-8"
                                        value={filters.termino}
                                        onChange={(e) => setFilters({ ...filters, termino: e.target.value })}
                                        onKeyDown={(e) => e.key === 'Enter' && handleFilterChange()}
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="dias">Período</Label>
                                <Select
                                    value={filters.dias}
                                    onValueChange={(value) => setFilters({ ...filters, dias: value })}
                                >
                                    <SelectTrigger id="dias" className="w-40">
                                        <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">Últimos 7 días</SelectItem>
                                        <SelectItem value="30">Últimos 30 días</SelectItem>
                                        <SelectItem value="90">Últimos 90 días</SelectItem>
                                        <SelectItem value="365">Último año</SelectItem>
                                        <SelectItem value="0">Todo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button size="sm" onClick={handleFilterChange} disabled={loading}>
                                <Search className="mr-2 h-4 w-4" />
                                Filtrar
                            </Button>
                            <Button size="sm" variant="outline" onClick={limpiarFiltros} disabled={loading}>
                                Limpiar
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => cargarHistorial(historial?.current_page ?? 1)}
                                disabled={loading}
                            >
                                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* ── Error ── */}
                {error && (
                    <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* ── Tabla ── */}
                <Card>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base">Resultados</CardTitle>
                            {historial && (
                                <CardDescription>
                                    {historial.from}–{historial.to} de {historial.total} registros
                                </CardDescription>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        {loading ? (
                            <div className="flex items-center justify-center py-16 text-muted-foreground">
                                <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                                Cargando historial...
                            </div>
                        ) : !historial || historial.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <HistoryIcon className="mb-3 h-10 w-10 text-muted-foreground/40" />
                                <p className="font-medium text-muted-foreground">Sin registros</p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    No se encontraron búsquedas con los filtros aplicados.
                                </p>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="mt-3"
                                    onClick={() => router.visit('/admin/listas-pep')}
                                >
                                    Realizar primera búsqueda
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-14">#</TableHead>
                                        <TableHead>Apellido / Denominación</TableHead>
                                        <TableHead>Nombres</TableHead>
                                        <TableHead>Identificación</TableHead>
                                        <TableHead className="w-24 text-center">Aciertos</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Notaría</TableHead>
                                        <TableHead>Fecha</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {historial.data.map((item) => (
                                        <TableRow key={item.id} className="hover:bg-muted/50">
                                            <TableCell className="text-xs text-muted-foreground">
                                                {item.id}
                                            </TableCell>
                                            <TableCell className="font-medium uppercase">
                                                {item.apellido_denominacion}
                                            </TableCell>
                                            <TableCell className="uppercase">
                                                {item.nombres || '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {item.identificacion ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={item.total_aciertos > 0 ? 'destructive' : 'outline'}
                                                    className={item.total_aciertos === 0 ? 'text-green-700 border-green-400' : ''}
                                                >
                                                    {item.total_aciertos}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {item.user.name}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {item.notaria?.nombre ?? '—'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {format(new Date(item.created_at), "d 'de' MMMM yyyy 'a las' HH:mm", { locale: es })}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>

                    {/* Paginación */}
                    {historial && historial.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={historial.current_page <= 1 || loading}
                                onClick={() => cargarHistorial(historial.current_page - 1)}
                            >
                                Anterior
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Página {historial.current_page} de {historial.last_page}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={historial.current_page >= historial.last_page || loading}
                                onClick={() => cargarHistorial(historial.current_page + 1)}
                            >
                                Siguiente
                            </Button>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
