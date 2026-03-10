import { Calendar, Database, Filter, Loader2, Search } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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

interface BusquedaLegacy {
    id: number;
    tipo_busqueda: string;
    termino_busqueda: string;
    nombre_completo: string | null;
    rfc: string | null;
    fecha: string;
    usuario: string;
    fuente: string;
    sistema: string;
}

interface EstadisticasLegacy {
    total: number;
    por_fuente: {
        web: number;
        desktop: number;
        ofac: number;
        sat: number;
    };
    primera_busqueda: string | null;
    ultima_busqueda: string | null;
}

interface BusquedasResponse {
    total: number;
    busquedas: BusquedaLegacy[];
    legacy_identifier: string;
    has_more: boolean;
}

interface HistorialBusquedasLegacyProps {
    legacyIdentifier: string;
    limit?: number;
}

export default function HistorialBusquedasLegacy({
    legacyIdentifier,
    limit = 100,
}: HistorialBusquedasLegacyProps) {
    const [busquedas, setBusquedas] = useState<BusquedaLegacy[]>([]);
    const [estadisticas, setEstadisticas] =
        useState<EstadisticasLegacy | null>(null);
    const [loading, setLoading] = useState(true);
    const [loadingBusquedas, setLoadingBusquedas] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtros
    const [fuente, setFuente] = useState<string>('all');
    const [fechaDesde, setFechaDesde] = useState<string>('');
    const [fechaHasta, setFechaHasta] = useState<string>('');
    const [currentLimit, setCurrentLimit] = useState(limit);

    // Cargar estadísticas al montar
    useEffect(() => {
        fetchEstadisticas();
    }, [legacyIdentifier]);

    // Cargar búsquedas cuando cambian los filtros
    useEffect(() => {
        fetchBusquedas();
    }, [legacyIdentifier, fuente, fechaDesde, fechaHasta, currentLimit]);

    const fetchEstadisticas = async () => {
        try {
            const response = await fetch(
                `/admin/legacy/notarias/${legacyIdentifier}/estadisticas`,
            );

            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }

            const data = await response.json();
            setEstadisticas(data);
        } catch (err) {
            console.error('Error fetching stats:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al cargar estadísticas',
            );
        } finally {
            setLoading(false);
        }
    };

    const fetchBusquedas = async () => {
        setLoadingBusquedas(true);
        try {
            const params = new URLSearchParams({
                limit: currentLimit.toString(),
            });

            if (fuente && fuente !== 'all') params.append('fuente', fuente);
            if (fechaDesde) params.append('fecha_desde', fechaDesde);
            if (fechaHasta) params.append('fecha_hasta', fechaHasta);

            const response = await fetch(
                `/admin/legacy/notarias/${legacyIdentifier}/busquedas?${params}`,
            );

            if (!response.ok) {
                throw new Error('Error al cargar búsquedas');
            }

            const data: BusquedasResponse = await response.json();
            setBusquedas(data.busquedas);
        } catch (err) {
            console.error('Error fetching busquedas:', err);
            setError(
                err instanceof Error
                    ? err.message
                    : 'Error al cargar búsquedas',
            );
        } finally {
            setLoadingBusquedas(false);
        }
    };

    const handleResetFilters = () => {
        setFuente('all');
        setFechaDesde('');
        setFechaHasta('');
        setCurrentLimit(limit);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return new Intl.DateTimeFormat('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const getBadgeVariant = (
        fuente: string,
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (fuente.toLowerCase()) {
            case 'web':
                return 'default';
            case 'desktop':
                return 'secondary';
            case 'ofac':
                return 'destructive';
            case 'sat':
                return 'outline';
            default:
                return 'default';
        }
    };

    const getTipoBusquedaBadgeVariant = (
        tipo: string,
    ): 'default' | 'secondary' | 'destructive' | 'outline' => {
        switch (tipo.toUpperCase()) {
            case 'RFC':
                return 'default';
            case 'SAT':
                return 'destructive';
            case 'OFAC':
                return 'outline';
            default:
                return 'secondary';
        }
    };

    if (loading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-destructive">{error}</div>
                </CardContent>
            </Card>
        );
    }

    if (!estadisticas) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Tarjetas de Estadísticas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Búsquedas
                        </CardTitle>
                        <Database className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {estadisticas.total.toLocaleString('es-MX')}
                        </div>
                        {estadisticas.primera_busqueda && (
                            <p className="text-xs text-muted-foreground">
                                Desde{' '}
                                {new Date(
                                    estadisticas.primera_busqueda,
                                ).toLocaleDateString('es-MX')}
                            </p>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Web
                        </CardTitle>
                        <Search className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {estadisticas.por_fuente.web.toLocaleString(
                                'es-MX',
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Interfaz web
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Desktop
                        </CardTitle>
                        <Database className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {estadisticas.por_fuente.desktop.toLocaleString(
                                'es-MX',
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Sistema VB6
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            OFAC
                        </CardTitle>
                        <Search className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {estadisticas.por_fuente.ofac.toLocaleString(
                                'es-MX',
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Listas OFAC
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            SAT
                        </CardTitle>
                        <Search className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {estadisticas.por_fuente.sat.toLocaleString(
                                'es-MX',
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Listas SAT
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtros
                    </CardTitle>
                    <CardDescription>
                        Filtra el historial de búsquedas por fuente y rango de
                        fechas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-5">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">
                                Fuente
                            </label>
                            <Select value={fuente} onValueChange={setFuente}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Todas las fuentes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Todas las fuentes
                                    </SelectItem>
                                    <SelectItem value="web">Web</SelectItem>
                                    <SelectItem value="desktop">
                                        Desktop
                                    </SelectItem>
                                    <SelectItem value="ofac">OFAC</SelectItem>
                                    <SelectItem value="sat">SAT</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="fecha-desde"
                                className="text-sm font-medium"
                            >
                                Fecha desde
                            </label>
                            <Input
                                id="fecha-desde"
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => setFechaDesde(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="fecha-hasta"
                                className="text-sm font-medium"
                            >
                                Fecha hasta
                            </label>
                            <Input
                                id="fecha-hasta"
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => setFechaHasta(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label
                                htmlFor="limit"
                                className="text-sm font-medium"
                            >
                                Límite
                            </label>
                            <Select
                                value={currentLimit.toString()}
                                onValueChange={(val) =>
                                    setCurrentLimit(parseInt(val))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="50">50</SelectItem>
                                    <SelectItem value="100">100</SelectItem>
                                    <SelectItem value="250">250</SelectItem>
                                    <SelectItem value="500">500</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-end">
                            <Button
                                variant="outline"
                                onClick={handleResetFilters}
                                className="w-full"
                            >
                                Restablecer
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tabla de Búsquedas */}
            <Card>
                <CardHeader>
                    <CardTitle>Historial de Búsquedas</CardTitle>
                    <CardDescription>
                        Mostrando {busquedas.length} de{' '}
                        {estadisticas.total.toLocaleString('es-MX')} búsquedas
                        totales
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loadingBusquedas ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                        </div>
                    ) : busquedas.length === 0 ? (
                        <div className="py-12 text-center text-muted-foreground">
                            No se encontraron búsquedas con los filtros
                            seleccionados
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Término de Búsqueda</TableHead>
                                        <TableHead>RFC</TableHead>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Fuente</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {busquedas.map((busqueda) => (
                                        <TableRow key={busqueda.id}>
                                            <TableCell className="whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                                    {formatDate(busqueda.fecha)}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getTipoBusquedaBadgeVariant(
                                                        busqueda.tipo_busqueda,
                                                    )}
                                                >
                                                    {busqueda.tipo_busqueda}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="max-w-xs">
                                                    <div className="truncate font-medium">
                                                        {busqueda.termino_busqueda}
                                                    </div>
                                                    {busqueda.nombre_completo &&
                                                        busqueda.nombre_completo !==
                                                            busqueda.termino_busqueda && (
                                                            <div className="truncate text-xs text-muted-foreground">
                                                                {
                                                                    busqueda.nombre_completo
                                                                }
                                                            </div>
                                                        )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {busqueda.rfc ? (
                                                    <code className="rounded bg-muted px-1 py-0.5 text-xs">
                                                        {busqueda.rfc}
                                                    </code>
                                                ) : (
                                                    <span className="text-muted-foreground">
                                                        -
                                                    </span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {busqueda.usuario}
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getBadgeVariant(
                                                        busqueda.fuente,
                                                    )}
                                                >
                                                    {busqueda.fuente}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
