import { Head } from '@inertiajs/react';
import { AlertCircle, Search, Loader2, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApi } from '@/services/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import type { BreadcrumbItem } from '@/types';

interface Expediente {
    id: number;
    expediente: string;
    referencia: string;
    fecha_Creacion: string;
    vulnerable?: boolean;
}

interface BusquedaResultado {
    expediente: Expediente;
    operaciones: Array<{
        descripcion: string;
    }>;
    clientes: Array<{
        nombre: string;
        compareciente: string;
    }>;
}

export default function RecibosExpedienteIndex() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Control Notarial',
            href: '/admin/control-notarial',
        },
        {
            title: 'Recibos',
            href: '/admin/control-notarial/recibos',
        },
        {
            title: 'Expediente',
            href: '/admin/control-notarial/recibos/expediente',
        },
    ];

    const api = useApi();
    useAuthGuard();

    const [filtro, setFiltro] = useState('');
    const [resultados, setResultados] = useState<BusquedaResultado[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Función para obtener expedientes
    const fetchExpedientes = async (filtroValue: string = '') => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const response = await api.get('/Expediente/GetExpedientes');

            // useAuthGuard maneja el toast en caso de 401
            if (response?.isUnauthorized) {
                setResultados([]);
                return;
            }

            const data = response?.dataResponse;
            if (response?.success !== false && data) {
                setResultados(data);
            } else {
                setSearchError(response?.message || 'No se pudieron cargar los expedientes.');
                setResultados([]);
            }

        } catch (error) {
            console.error('Error buscando expedientes:', error);
            setSearchError('No se pudieron cargar los expedientes. Verifica la conexión con el servidor.');
        } finally {
            setIsSearching(false);
        }
    };

    // Filtrar resultados localmente
    const filteredResultados = resultados.filter((item) =>
        item.expediente.expediente.toLowerCase().includes(filtro.toLowerCase()) ||
        item.expediente.referencia.toLowerCase().includes(filtro.toLowerCase()) ||
        item.clientes.some(c => c.nombre.toLowerCase().includes(filtro.toLowerCase()))
    );

    const handleClear = () => {
        setFiltro('');
        setSearchError(null);
        setResultados([]);
        fetchExpedientes('');
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchExpedientes(filtro);
    };

    const handleSelectExpediente = (id: number) => {
        console.log('Expediente seleccionado:', id);
        // Aquí puedes agregar la lógica para manejar el expediente seleccionado
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recibos por Expediente - Control Notarial" />

            <div className="min-h-screen space-y-6 p-6">
                {/* Search Section */}
                <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-950">
                    <div className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSearch(e as any);
                                        }
                                    }}
                                    placeholder="Buscar por referencia, cliente, operación..."
                                    className="pr-10"
                                />
                                {filtro && (
                                    <button
                                        type="button"
                                        onClick={handleClear}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Button
                                disabled={isSearching}
                                className="bg-blue-600 hover:bg-blue-700"
                                onClick={handleSearch}
                            >
                                {isSearching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                <span className="ml-2">Buscar</span>
                            </Button>
                        </div>

                        {searchError && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-md border bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{searchError}</span>
                            </div>
                        )}

                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold w-16">ID</th>
                                            <th className="px-4 py-2 text-left font-semibold">Expediente</th>
                                            <th className="px-4 py-2 text-left font-semibold">Operación</th>
                                            <th className="px-4 py-2 text-left font-semibold">Cliente</th>
                                            <th className="px-4 py-2 text-left font-semibold">Fecha Creación</th>
                                            <th className="px-4 py-2 text-center font-semibold">Vulnerable</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isSearching ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-muted-foreground px-4">
                                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                    Cargando expedientes...
                                                </td>
                                            </tr>
                                        ) : filteredResultados.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="text-center py-8 text-muted-foreground px-4">
                                                    No se encontraron expedientes.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredResultados.map((item) => (
                                                <tr
                                                    key={item.expediente.id}
                                                    className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                                    onClick={() => handleSelectExpediente(item.expediente.id)}
                                                >
                                                    <td className="px-4 py-2 font-mono text-sm">{item.expediente.id}</td>
                                                    <td className="px-4 py-2">{item.expediente.expediente || '-'}</td>
                                                    <td className="px-4 py-2">
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                                {item.operaciones?.[0]?.descripcion || '-'}
                                                            </span>
                                                            {item.operaciones && item.operaciones.length > 1 && (
                                                                <span
                                                                    className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 whitespace-nowrap cursor-help hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                                                                    title={item.operaciones.map(op => op.descripcion).join('\n')}
                                                                >
                                                                    +{item.operaciones.length - 1} más
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2">{item.clientes?.[0]?.nombre || '-'}</td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {item.expediente.fecha_Creacion
                                                            ? new Date(item.expediente.fecha_Creacion).toLocaleDateString('es-MX')
                                                            : '-'}
                                                    </td>
                                                    <td className="px-4 py-2 text-center">
                                                        {item.expediente.vulnerable ? (
                                                            <div className="flex items-center justify-center gap-2">
                                                                <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {!isSearching && resultados.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {filteredResultados.length} de {resultados.length} expediente(s) — <span className="text-blue-600">selecciona uno para ver recibos</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
