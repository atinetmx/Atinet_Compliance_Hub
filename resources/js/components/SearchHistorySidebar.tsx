import { Clock, Trash2, AlertCircle, BarChart3 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SearchHistoryItem {
    id: number;
    tipo_busqueda: string;
    termino_busqueda: string;
    resultados: {
        total: number;
        data: {
            ofac: unknown[];
            sat: unknown[];
        };
    };
    created_at: string;
}

interface SearchStatistics {
    total_busquedas: number;
    busquedas_este_mes: number;
    busquedas_esta_semana: number;
    busquedas_hoy: number;
    promedio_resultados: number;
    tipo_mas_usado: string;
}

interface SearchHistorySidebarProps {
    onSelectSearch: (search: SearchHistoryItem) => void;
    refreshTrigger?: number;
}

export default function SearchHistorySidebar({ onSelectSearch, refreshTrigger = 0 }: SearchHistorySidebarProps) {
    const [history, setHistory] = useState<SearchHistoryItem[]>([]);
    const [statistics, setStatistics] = useState<SearchStatistics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<number | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        loadHistoryAndStats();
    }, [refreshTrigger]);

    const loadHistoryAndStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // Cargar historial y estadísticas en paralelo
            const [historyRes, statsRes] = await Promise.all([
                fetch('/admin/search-history?per_page=15', {
                    credentials: 'same-origin',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                }),
                fetch('/admin/search-history/statistics', {
                    credentials: 'same-origin',
                    headers: {
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                }),
            ]);

            if (!historyRes.ok || !statsRes.ok) {
                throw new Error('Error cargando datos');
            }

            const historyData = await historyRes.json();
            const statsData = await statsRes.json();

            if (historyData.success) {
                setHistory(historyData.data || []);
            }

            if (statsData.success) {
                setStatistics(statsData.data || null);
            }
        } catch (err) {
            console.error('Error loading search history:', err);
            setError('No se pudo cargar el historial de búsquedas');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteSearch = async (searchId: number) => {
        try {
            setDeleting(searchId);
            const response = await fetch(`/admin/search-history/${searchId}`, {
                method: 'DELETE',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setHistory(history.filter(s => s.id !== searchId));
            } else {
                setError('Error eliminando búsqueda');
            }
        } catch (err) {
            console.error('Error deleting search:', err);
            setError('Error al eliminar búsqueda');
        } finally {
            setDeleting(null);
        }
    };

    const handleClearHistory = async () => {
        try {
            setDeleting(-1);
            const response = await fetch('/admin/search-history/clear-notaria', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (response.ok) {
                setHistory([]);
                setShowDeleteConfirm(false);
            } else {
                setError('Error limpiando historiales');
            }
        } catch (err) {
            console.error('Error clearing history:', err);
            setError('Error limpiando histórico');
        } finally {
            setDeleting(null);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'Persona Física':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'Persona Moral':
                return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
            case 'RFC':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'Búsqueda Combinada':
                return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <Skeleton className="h-4 w-24" />
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                        <Skeleton className="h-8 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estadísticas */}
            {statistics && (
                <Card>
                    <CardHeader>
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <BarChart3 className="h-4 w-4" />
                            Estadísticas
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Total búsquedas</span>
                            <Badge variant="secondary" className="font-mono">
                                {statistics.total_busquedas}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Este mes</span>
                            <Badge variant="outline" className="font-mono">
                                {statistics.busquedas_este_mes}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Esta semana</span>
                            <Badge variant="outline" className="font-mono">
                                {statistics.busquedas_esta_semana}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">Hoy</span>
                            <Badge variant="outline" className="font-mono">
                                {statistics.busquedas_hoy}
                            </Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm pt-2 border-t">
                            <span className="text-muted-foreground text-xs">Promedio resultados</span>
                            <Badge variant="outline" className="font-mono text-xs">
                                {(statistics.promedio_resultados || 0).toFixed(1)}
                            </Badge>
                        </div>
                        {statistics.tipo_mas_usado && (
                            <div className="flex items-center justify-between text-sm pt-1">
                                <span className="text-muted-foreground text-xs">Tipo más usado</span>
                                <Badge className={`text-xs ${getTypeColor(statistics.tipo_mas_usado)}`}>
                                    {statistics.tipo_mas_usado}
                                </Badge>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Historial de Búsquedas */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Historial Reciente
                    </CardTitle>
                    <CardDescription className="text-xs">
                        Últimas {history.length} búsquedas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {history.length > 0 ? (
                        <div className="space-y-2">
                            {history.map((search) => (
                                <div
                                    key={search.id}
                                    className="group flex items-start justify-between gap-2 p-2 rounded-md hover:bg-muted/60 transition-colors border border-transparent hover:border-muted"
                                >
                                    <button
                                        onClick={() => onSelectSearch(search)}
                                        className="flex-1 text-left cursor-pointer"
                                        title="Hacer clic para repetir búsqueda"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Badge className={`text-xs whitespace-nowrap ${getTypeColor(search.tipo_busqueda)}`}>
                                                {search.tipo_busqueda}
                                            </Badge>
                                        </div>
                                        <div className="font-medium text-sm truncate mt-1 text-foreground/90 hover:text-foreground transition-colors">
                                            {search.termino_busqueda}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                            <span className="inline-flex items-center gap-1">
                                                📊 {search.resultados?.total || 0} resultado{(search.resultados?.total || 0) !== 1 ? 's' : ''}
                                            </span>
                                            <span className="inline-flex items-center gap-1">
                                                🕐 {new Date(search.created_at).toLocaleDateString('es-ES', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </span>
                                        </div>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSearch(search.id)}
                                        disabled={deleting === search.id}
                                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1.5 hover:bg-destructive/10 rounded text-destructive hover:text-destructive/80 disabled:opacity-50"
                                        title="Eliminar búsqueda"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6">
                            <Clock className="h-8 w-8 text-muted-foreground/50 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No hay búsquedas recientes</p>
                        </div>
                    )}

                    {history.length > 0 && (
                        <div className="mt-4 pt-4 border-t">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full text-destructive hover:text-destructive"
                                onClick={() => setShowDeleteConfirm(true)}
                                disabled={deleting === -1}
                            >
                                <Trash2 className="h-3.5 w-3.5 mr-2" />
                                Limpiar historial
                            </Button>

                            {showDeleteConfirm && (
                                <div className="mt-3 p-3 bg-destructive/10 border border-destructive/30 rounded-md space-y-2">
                                    <p className="text-sm text-destructive font-medium">
                                        ¿Eliminar todo el historial?
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="destructive"
                                            size="sm"
                                            onClick={handleClearHistory}
                                            disabled={deleting === -1}
                                            className="flex-1"
                                        >
                                            Confirmar
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setShowDeleteConfirm(false)}
                                            disabled={deleting === -1}
                                            className="flex-1"
                                        >
                                            Cancelar
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
