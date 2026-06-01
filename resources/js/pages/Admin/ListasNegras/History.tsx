import { Head, router } from '@inertiajs/react';
import { AlertCircle, History as HistoryIcon, Search, Trash2, RefreshCw, Download, Calendar, Filter, X, Shield } from 'lucide-react';
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

interface SearchHistoryItem {
    id: number;
    user_id: number;
    notaria_id: number | null;
    tipo_busqueda: string;
    termino_busqueda: string;
    resultados: unknown;
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
        numero_notaria?: number | null;
    } | null;
}

interface NotariaFilterOption {
    id: number;
    nombre: string;
    numero_notaria?: number | null;
}

interface PaginatedHistory {
    data: SearchHistoryItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface HistoryResponse {
    success: boolean;
    data: PaginatedHistory;
    filters?: {
        notarias_disponibles?: NotariaFilterOption[];
    };
}

export default function ListasNegrasHistory() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Listas Negras',
            href: '/admin/listas-negras',
        },
        {
            title: 'Historial de Búsquedas',
            href: '/admin/search-history',
            icon: HistoryIcon,
        },
    ];

    const [history, setHistory] = useState<PaginatedHistory | null>(null);
    const [availableNotarias, setAvailableNotarias] = useState<NotariaFilterOption[]>([]);
    const [loading, setLoading] = useState(true);

    // Filtros
    const [filters, setFilters] = useState({
        tipo_busqueda: 'all',
        notaria_id: 'all',
        dias: '30',
        termino: '',
    });

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        loadHistory();
    }, [currentPage, filters]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                page: currentPage.toString(),
                ...(filters.tipo_busqueda && filters.tipo_busqueda !== 'all' && { tipo_busqueda: filters.tipo_busqueda }),
                ...(filters.notaria_id && filters.notaria_id !== 'all' && { notaria_id: filters.notaria_id }),
                ...(filters.dias && filters.dias !== 'all' && { dias: filters.dias }),
                ...(filters.termino && { termino: filters.termino }),
            });

            const res = await fetch(`/admin/search-history?${params}`, {
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (res.ok) {
                const json: HistoryResponse = await res.json();
                if (json.success) {
                    setHistory(json.data);
                    setAvailableNotarias(json.filters?.notarias_disponibles ?? []);
                }
            }
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSearch = async (id: number) => {
        if (!confirm('¿Estás seguro de eliminar esta búsqueda del historial?')) {
            return;
        }

        try {
            const res = await fetch(`/admin/search-history/${id}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            if (res.ok) {
                loadHistory();
            }
        } catch (error) {
            console.error('Error deleting search:', error);
        }
    };

    const handleRepeatSearch = (item: SearchHistoryItem) => {
        // Navegar a la página de búsqueda con el término precargado
        router.visit('/admin/listas-negras', {
            data: {
                tipo: item.tipo_busqueda,
                termino: item.termino_busqueda,
            },
        });
    };

    const handleClearFilters = () => {
        setFilters({
            tipo_busqueda: 'all',
            notaria_id: 'all',
            dias: '30',
            termino: '',
        });
        setCurrentPage(1);
    };

    const formatNotariaLabel = (notaria?: NotariaFilterOption | SearchHistoryItem['notaria'] | null): string => {
        if (!notaria) {
            return 'Sin notaría';
        }

        return notaria.numero_notaria ? `${notaria.nombre} (#${notaria.numero_notaria})` : notaria.nombre;
    };

    const getResultsCount = (item: SearchHistoryItem): number => {
        const resultados = item.resultados as { data?: unknown[] } | unknown[] | null;

        if (!resultados) return 0;
        if (Array.isArray(resultados)) return resultados.length;
        if (typeof resultados === 'object' && 'data' in resultados) {
            return Array.isArray(resultados.data) ? resultados.data.length : 0;
        }
        return 0;
    };

    const getTipoColor = (tipo: string): string => {
        const colors: Record<string, string> = {
            'Persona Física': 'bg-blue-100 text-blue-700 border-blue-300',
            'Persona Moral': 'bg-purple-100 text-purple-700 border-purple-300',
            'RFC': 'bg-green-100 text-green-700 border-green-300',
            'Búsqueda Combinada': 'bg-orange-100 text-orange-700 border-orange-300',
        };
        return colors[tipo] || 'bg-gray-100 text-gray-700 border-gray-300';
    };

    const handleExportHistory = async () => {
        if (!history || history.data.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        try {
            const selectedNotaria = availableNotarias.find((notaria) => String(notaria.id) === filters.notaria_id);
            const payload = {
                history: history.data,
                filters: {
                    ...filters,
                    notaria_label: selectedNotaria ? formatNotariaLabel(selectedNotaria) : undefined,
                },
            };

            const response = await fetch('/admin/export/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) throw new Error('Error al exportar historial');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `historial_busquedas_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al exportar historial:', error);
            alert('Error al generar el archivo Excel. Por favor intente nuevamente.');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Historial de Búsquedas - Listas Negras" />

            <div className="space-y-6">
                {/* Botones de acción */}
                <div className="flex justify-between items-center gap-4">
                    <div>
                        {history && history.total > 0 && (
                            <p className="text-sm text-muted-foreground">
                                Mostrando <strong>{history.from}</strong> a <strong>{history.to}</strong> de <strong>{history.total}</strong> registros
                            </p>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleExportHistory}
                            variant="outline"
                            disabled={!history || history.data.length === 0}
                            className="bg-green-50 hover:bg-green-100 text-green-700 border-green-300"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Exportar a Excel
                        </Button>
                        <Button
                            onClick={() => router.visit('/admin/listas-negras')}
                            variant="outline"
                        >
                            <Search className="w-4 h-4 mr-2" />
                            Nueva Búsqueda
                        </Button>
                    </div>
                </div>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>
                            Este historial guarda todas las búsquedas que has realizado en OFAC y SAT.
                            Puedes filtrar, repetir o eliminar búsquedas anteriores.
                        </span>
                        <Button
                            variant="link"
                            size="sm"
                            onClick={() => router.visit('/admin/listas-negras')}
                            className="text-xs h-auto p-0"
                        >
                            Ver estadísticas y dashboard →
                        </Button>
                    </AlertDescription>
                </Alert>

                {/* Filtros */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filtros
                        </CardTitle>
                        <CardDescription>Filtra el historial por tipo, notaría, fecha o término de búsqueda</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-5">
                            <div className="space-y-2">
                                <Label htmlFor="tipo-filter">Tipo de búsqueda</Label>
                                <Select
                                    value={filters.tipo_busqueda}
                                    onValueChange={(value) => {
                                        setFilters(prev => ({ ...prev, tipo_busqueda: value }));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger id="tipo-filter">
                                        <SelectValue placeholder="Todos los tipos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los tipos</SelectItem>
                                        <SelectItem value="Persona Física">Persona Física</SelectItem>
                                        <SelectItem value="Persona Moral">Persona Moral</SelectItem>
                                        <SelectItem value="RFC">RFC</SelectItem>
                                        <SelectItem value="Búsqueda Combinada">Búsqueda Combinada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notaria-filter">Notaría</Label>
                                <Select
                                    value={filters.notaria_id}
                                    onValueChange={(value) => {
                                        setFilters(prev => ({ ...prev, notaria_id: value }));
                                        setCurrentPage(1);
                                    }}
                                    disabled={availableNotarias.length <= 1}
                                >
                                    <SelectTrigger id="notaria-filter">
                                        <SelectValue placeholder="Todas las notarías" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todas las notarías</SelectItem>
                                        {availableNotarias.map((notaria) => (
                                            <SelectItem key={notaria.id} value={String(notaria.id)}>
                                                {formatNotariaLabel(notaria)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="dias-filter">Período</Label>
                                <Select
                                    value={filters.dias}
                                    onValueChange={(value) => {
                                        setFilters(prev => ({ ...prev, dias: value }));
                                        setCurrentPage(1);
                                    }}
                                >
                                    <SelectTrigger id="dias-filter">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="7">Últimos 7 días</SelectItem>
                                        <SelectItem value="30">Últimos 30 días</SelectItem>
                                        <SelectItem value="90">Últimos 3 meses</SelectItem>
                                        <SelectItem value="365">Último año</SelectItem>
                                        <SelectItem value="all">Todo el historial</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="termino-filter">Buscar término</Label>
                                <Input
                                    id="termino-filter"
                                    placeholder="Ej: Juan Pérez"
                                    value={filters.termino}
                                    onChange={(e) => {
                                        setFilters(prev => ({ ...prev, termino: e.target.value }));
                                        setCurrentPage(1);
                                    }}
                                />
                            </div>

                            <div className="flex items-end">
                                <Button
                                    onClick={handleClearFilters}
                                    variant="outline"
                                    className="w-full"
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Limpiar filtros
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de Historial */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Búsquedas Realizadas</CardTitle>
                                <CardDescription>
                                    {history ? `Mostrando ${history.from} - ${history.to} de ${history.total} resultados` : 'Cargando...'}
                                </CardDescription>
                            </div>
                            <Button
                                onClick={loadHistory}
                                variant="outline"
                                size="sm"
                                disabled={loading}
                            >
                                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Actualizar
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <div className="text-center">
                                    <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                    <p className="mt-2 text-sm text-muted-foreground">Cargando historial...</p>
                                </div>
                            </div>
                        ) : !history || history.data.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                                <HistoryIcon className="w-12 h-12 text-muted-foreground mb-4" />
                                <p className="text-lg font-medium">No hay búsquedas en el historial</p>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Realiza búsquedas en Listas Negras para ver tu historial aquí
                                </p>
                                <Button
                                    onClick={() => router.visit('/admin/listas-negras')}
                                    className="mt-4"
                                >
                                    <Search className="w-4 h-4 mr-2" />
                                    Nueva Búsqueda
                                </Button>
                            </div>
                        ) : (
                            <>
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Tipo</TableHead>
                                            <TableHead>Término de búsqueda</TableHead>
                                            <TableHead className="text-center">Resultados</TableHead>
                                            <TableHead>Notaría</TableHead>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead className="text-right">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {history.data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    <Badge variant="outline" className={getTipoColor(item.tipo_busqueda)}>
                                                        {item.tipo_busqueda}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {item.termino_busqueda}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <Badge variant={getResultsCount(item) > 0 ? 'destructive' : 'secondary'}>
                                                        {getResultsCount(item)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    <span className="text-sm text-muted-foreground">
                                                        {formatNotariaLabel(item.notaria)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                        <Calendar className="w-3 h-3" />
                                                        {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button
                                                            onClick={() => handleRepeatSearch(item)}
                                                            variant="ghost"
                                                            size="sm"
                                                            title="Repetir búsqueda"
                                                        >
                                                            <RefreshCw className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDeleteSearch(item.id)}
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>

                                {/* Paginación */}
                                {history.last_page > 1 && (
                                    <div className="flex items-center justify-between mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            Página {history.current_page} de {history.last_page}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                disabled={history.current_page === 1}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Anterior
                                            </Button>
                                            <Button
                                                onClick={() => setCurrentPage(prev => Math.min(history.last_page, prev + 1))}
                                                disabled={history.current_page === history.last_page}
                                                variant="outline"
                                                size="sm"
                                            >
                                                Siguiente
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
