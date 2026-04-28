import { X, AlertCircle, Search, Loader2, AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface BusquedaResultado {
    expediente: {
        id: number;
        expediente: string;
        referencia: string;
        fecha_Creacion: string;
        vulnerable?: boolean;
    };
    operaciones: Array<{
        descripcion: string;
    }>;
    clientes: Array<{
        nombre: string;
        compareciente: string;
    }>;
}

interface SearchExpedientesProps {
    filtro: string;
    setFiltro: (value: string) => void;
    resultados: BusquedaResultado[];
    isSearching: boolean;
    searchError: string | null;
    setSearchError: (value: string | null) => void;
    setResultados: (value: BusquedaResultado[]) => void;
    onSelectExpediente: (id: number) => void;
    onFetch: (filtro: string) => Promise<void>;
}

export default function SearchExpedientes({
    filtro,
    setFiltro,
    resultados,
    isSearching,
    searchError,
    setSearchError,
    setResultados,
    onSelectExpediente,
    onFetch,
}: SearchExpedientesProps) {
    const handleClear = () => {
        setFiltro('');
        setSearchError(null);
        setResultados([]);
        onFetch('');
    };

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <div className="relative flex-1 max-w-sm">
                    <Input
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onFetch(filtro);
                            }
                        }}
                        placeholder="Buscar por referencia, cliente, operación..."
                        className="pr-10"
                        autoFocus
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
                <Button disabled={isSearching} className="bg-blue-600 hover:bg-blue-700" onClick={() => onFetch(filtro)}>
                    {isSearching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                    <span className="ml-2">Buscar</span>
                </Button>
            </div>

            {searchError && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-md border bg-red-50 border-red-200 text-red-800">
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
                                    <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                        Cargando expedientes...
                                    </td>
                                </tr>
                            ) : resultados.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                        No se encontraron expedientes.
                                    </td>
                                </tr>
                            ) : (
                                resultados.map((item) => (
                                    <tr
                                        key={item.expediente.id}
                                        className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                        onClick={() => onSelectExpediente(item.expediente.id)}
                                    >
                                        <td className="px-4 py-2 font-mono text-sm">{item.expediente.id}</td>
                                        <td className="px-4 py-2">{item.expediente.expediente || '-'}</td>
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                    {item.operaciones?.[0]?.descripcion || '-'}
                                                </span>
                                                {item.operaciones && item.operaciones.length > 1 && (
                                                    <span
                                                        className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-800 whitespace-nowrap cursor-help hover:bg-amber-200 transition-colors"
                                                        title={item.operaciones.map(op => op.descripcion).join('\n')}
                                                    >
                                                        +{item.operaciones.length - 1} más
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-2">{item.clientes?.[0]?.nombre || '-'}</td>
                                        <td className="px-4 py-2 text-sm">{item.expediente.fecha_Creacion ? new Date(item.expediente.fecha_Creacion).toLocaleDateString('es-MX') : '-'}</td>
                                        <td className="px-4 py-2 text-center">
                                            {item.expediente.vulnerable ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <AlertTriangle className="h-4 w-4 text-red-600" />
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
                    {resultados.length} expediente(s) encontrado(s) — <span className="text-blue-600">selecciona uno para ver detalles</span>
                </p>
            )}
        </div>
    );
}
