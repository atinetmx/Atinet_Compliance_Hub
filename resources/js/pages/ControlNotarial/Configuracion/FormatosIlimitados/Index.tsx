import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, FileText } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useApi } from '@/services/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { handleControlNotarialResponse } from '@/helpers/controlNotarialResponse';
import LoginModal from '@/components/Modals/LoginModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';

interface FormatoData {
    id?: string | number;
    nombre: string;
    tipo_Formato: string;
    programa: string;
    descripcion?: string;
    activo?: boolean;
}

interface FormatoBusqueda {
    id: number;
    nombre: string;
    tipo_Formato: string;
    programa: string;
}

interface TipoCompareciente {
    id: string;
    tipo: string;
}

interface Marcador {
    id: number;
    tipo: string;
    marcador: string;
    descripcion: string;
    ejemplo: string;
}

const defaultFormatoData: FormatoData = {
    nombre: '',
    tipo_Formato: 'EXPEDIENTE',
    programa: '',
    descripcion: '',
    activo: true,
};

const tiposFormatoDisponibles = [
    'EXPEDIENTE',
    'CERTIFICACIONES',
    'COTEJOS',
    'RATIFICACIONES',
];

// Componente interno que usa los hooks dentro del contexto de AppLayout
function FormatosIlimitadosContent() {
    // --- Estado Autenticación ---
    const [loginModalOpen, setLoginModalOpen] = useState(false);

    // --- Estado pestaña Búsqueda ---
    const [filtro, setFiltro] = useState('');
    const [resultados, setResultados] = useState<FormatoBusqueda[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // --- Control de pestaña activa ---
    const [activeTab, setActiveTab] = useState('busqueda');

    // --- Estado pestaña Formulario ---
    const [formData, setFormData] = useState<FormatoData>(defaultFormatoData);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isLoadingFormato, setIsLoadingFormato] = useState(false);
    const [tiposComparecientes, setTiposComparecientes] = useState<TipoCompareciente[]>([
        { id: 'compareciente-default-1', tipo: 'COMPRADOR' },
        { id: 'compareciente-default-2', tipo: 'VENDEDOR' },
    ]);
    const [marcadores, setMarcadores] = useState<Marcador[]>([]);
    const [isLoadingMarcadores, setIsLoadingMarcadores] = useState(false);
    const [formatosDisponibles, setFormatosDisponibles] = useState<FormatoBusqueda[]>([]);
    const [numeroComparecientes, setNumeroComparecientes] = useState(1);
    const [filtroMarcadores, setFiltroMarcadores] = useState('');
    const [selectedMarcadorIds, setSelectedMarcadorIds] = useState<number[]>([]);
    const { addToast } = useToast();
    const api = useApi();

    // Validar autenticación al montar
    useAuthGuard({
        onUnauthorized: () => {
            setLoginModalOpen(true);
            addToast('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.', 'error');
        },
    });

    // Cargar formatos al montar (sin marcadores)
    useEffect(() => {
        fetchFormatos('');
    }, [api]);

    // Validar reglas y cargar/limpiar marcadores según se cumplen
    useEffect(() => {
        const rutasValidas =
            formData.nombre &&
            formData.tipo_Formato &&
            tiposComparecientes.length > 0 &&
            tiposComparecientes.every(tc => tc.tipo.trim());

        if (!rutasValidas) {
            setMarcadores([]);
            return;
        }

        // Si las reglas son válidas y no hay marcadores cargados, cargar
        if (marcadores.length === 0) {
            (async () => {
                setIsLoadingMarcadores(true);
                try {
                    const response = await api.get('/Marcadores/GetMarcadores');
                    const data = await handleControlNotarialResponse(response, {
                        onError: (msg) => console.error('Error cargando marcadores:', msg),
                        onUnauthorized: () => setLoginModalOpen(true),
                    });
                    if (data && Array.isArray(data)) {
                        setMarcadores(data);
                    }
                } catch (error) {
                    console.error('Error buscando marcadores:', error);
                } finally {
                    setIsLoadingMarcadores(false);
                }
            })();
        }
    }, [formData.nombre, formData.tipo_Formato, formData.programa, tiposComparecientes, marcadores.length, api]);

    const fetchMarcadores = async () => {
        setIsLoadingMarcadores(true);
        try {
            const response = await api.get('/Marcadores/GetMarcadores');
            const data = await handleControlNotarialResponse(response, {
                onError: (msg) => console.error('Error cargando marcadores:', msg),
                onUnauthorized: () => setLoginModalOpen(true),
            });

            if (data && Array.isArray(data)) {
                setMarcadores(data);
            }
        } catch (error) {
            console.error('Error buscando marcadores:', error);
        } finally {
            setIsLoadingMarcadores(false);
        }
    };

    const agregarTipoCompareciente = () => {
        const nuevoId = `compareciente-${Date.now()}`;
        setTiposComparecientes([
            ...tiposComparecientes,
            { id: nuevoId, tipo: '' }
        ]);
    };

    const eliminarTipoCompareciente = (id: string) => {
        setTiposComparecientes(tiposComparecientes.filter(tc => tc.id !== id));
    };

    const actualizarTipoCompareciente = (id: string, valor: string) => {
        setTiposComparecientes(
            tiposComparecientes.map(tc =>
                tc.id === id ? { ...tc, tipo: valor } : tc
            )
        );
    };

    const fetchFormatos = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            let endpoint = '/FormatosIlimitados/GetFormatos';
            if (filtroValue.trim()) {
                endpoint += `?filtro=${encodeURIComponent(filtroValue)}`;
            }

            const response = await api.get(endpoint);
            const data = await handleControlNotarialResponse(response, {
                onError: (msg) => setSearchError(msg || 'No se pudieron cargar los formatos'),
                onUnauthorized: () => setLoginModalOpen(true),
            });

            if (!data) return;

            // Mapear respuesta API a FormatoBusqueda
            const formatosList: FormatoBusqueda[] = data.map((formato: any) => ({
                id: formato.id,
                nombre: formato.nombre || '',
                tipo_Formato: formato.tipo_Formato || '',
                programa: formato.programa || '',
            }));

            setResultados(formatosList);
        } catch (error) {
            console.error('Error buscando formatos:', error);
            setSearchError('No se pudieron cargar los formatos. Verifica la conexión con el servidor.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchFormatos(filtro);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleMarcadorSelection = (marcadorId: number) => {
        setSelectedMarcadorIds((prev) =>
            prev.includes(marcadorId)
                ? prev.filter(id => id !== marcadorId)
                : [...prev, marcadorId]
        );
    };

    const handleSelectFormato = async (formato: FormatoBusqueda) => {
        setSaveError(null);
        setIsLoadingFormato(true);
        try {
            // Llamar a la API para obtener los datos completos del formato
            const response = await api.get(`/FormatosIlimitados/GetFormatById?formatoId=${formato.id}`);
            const data = await handleControlNotarialResponse(response, {
                onUnauthorized: () => setLoginModalOpen(true),
            });

            if (!data) return;

            const formatoData = Array.isArray(data) ? data[0] : data;

            setFormData({
                id: formatoData.id,
                nombre: formatoData.nombre || '',
                tipo_Formato: formatoData.tipo_Formato || '',
                programa: formatoData.programa || '',
                descripcion: formatoData.descripcion || '',
                activo: formatoData.activo ?? true,
            });

            setIsEditing(true);
            setActiveTab('formulario');
        } catch (error) {
            console.error('Error al cargar formato:', error);
            const message = error instanceof Error ? error.message : 'Error al cargar el formato';
            addToast(message, 'error');
            setIsEditing(false);
            setActiveTab('busqueda');
        } finally {
            setIsLoadingFormato(false);
        }
    };

    const handleAddFormato = async () => {
        // Validar Formato, Nombre
        if (!formData.nombre || !formData.tipo_Formato) {
            addToast(
                'Completa los campos obligatorios: Nombre y Tipo de Formato',
                'error'
            );
            return;
        }

        // Validar que haya al menos 1 tipo de compareciente
        if (tiposComparecientes.length === 0) {
            addToast(
                'Debe haber al menos 1 tipo de compareciente agregado',
                'error'
            );
            return;
        }

        // Validar que todos los tipos de comparecientes tengan texto
        const tiposVacios = tiposComparecientes.some(tc => !tc.tipo.trim());
        if (tiposVacios) {
            addToast(
                'Todos los tipos de comparecientes deben tener un valor escrito',
                'error'
            );
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);

            // Estructura diferente para CREATE vs UPDATE
            let payload: any;
            let endpoint: string;
            let method: 'post' | 'put';

            if (!formData.id) {
                // CREATE: Nuevo formato con estructura especial
                payload = {
                    nombre: formData.nombre || '',
                    tipo_Formato: formData.tipo_Formato || '',
                    tipos_Compareciente: tiposComparecientes.map(tc => tc.tipo),
                    num_Comparecientes_Enlistados: numeroComparecientes,
                    marcadores_Ids: selectedMarcadorIds,
                    archivo_Nombre: formData.nombre || '',
                    tipo_Contenido: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    tamaño_Archivo: 10240, // 10 KB simulado
                };
                endpoint = '/FormatosIlimitados/CreateFormato';
                method = 'post';
            } else {
                // UPDATE: Estructura tradicional
                payload = {
                    id: parseInt(String(formData.id)),
                    nombre: formData.nombre || '',
                    tipo_Formato: formData.tipo_Formato || '',
                    programa: formData.programa || '',
                    descripcion: formData.descripcion || '',
                    activo: formData.activo ?? true,
                };
                endpoint = `/FormatosIlimitados/UpdateFormat`;
                method = 'put';
            }

            const response = await api[method](endpoint, payload);

            // Log completo de la respuesta
            console.log('Response completo:', response);
            console.log('Response status:', response.status);
            console.log('Response data:', response.data);

            const result = await handleControlNotarialResponse(response, {
                onUnauthorized: () => setLoginModalOpen(true),
            });

            console.log('Resultado procesado:', result);

            if (result) {
                addToast(
                    formData.id
                        ? 'Formato actualizado correctamente'
                        : 'Formato creado correctamente',
                    'success'
                );
                setFormData(defaultFormatoData);
                setTiposComparecientes([
                    { id: 'compareciente-default-1', tipo: 'COMPRADOR' },
                    { id: 'compareciente-default-2', tipo: 'VENDEDOR' },
                ]);
                setSelectedMarcadorIds([]);
                setIsEditing(false);
                setActiveTab('busqueda');
                fetchFormatos('');
            } else {
                // Si result es null/false, mostrar la respuesta del servidor
                const errorMsg = response?.data?.message || 'Error al guardar el formato';
                console.error('Error en respuesta:', errorMsg);
                addToast(errorMsg, 'error');
            }
        } catch (error) {
            console.error('Error guardando formato:', error);
            console.error('Error completo:', JSON.stringify(error, null, 2));
            const message = error instanceof Error ? error.message : 'Error al guardar el formato';
            setSaveError(message);
            addToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData(defaultFormatoData);
        setIsEditing(false);
        setSaveError(null);
        setTiposComparecientes([
            { id: 'compareciente-default-1', tipo: 'COMPRADOR' },
            { id: 'compareciente-default-2', tipo: 'VENDEDOR' },
        ]);
        setSelectedMarcadorIds([]);
        setNumeroComparecientes(1);
        setActiveTab('busqueda');
    };

    const handleTabChange = (tabValue: string) => {
        setSaveError(null);
        setActiveTab(tabValue);
    };

    // Generar variaciones de marcadores
    const generarVariacionesMarcador = (marcadorBase: string): string[] => {
        if (tiposComparecientes.length === 0 || numeroComparecientes === 0) {
            return [];
        }

        const variaciones: string[] = [];

        // Extraer el prefijo y sufijo del marcador (ej: {{c_alias}} -> {{ y }})
        const match = marcadorBase.match(/^(.*?)([a-zA-Z_]+)(\}\})$/);
        if (!match) return [];

        const prefix = match[1]; // {{
        const variable = match[2]; // c_alias
        const suffix = match[3]; // }}

        // Generar para cada tipo de compareciente
        tiposComparecientes.forEach((tc) => {
            const tipo = tc.tipo.toUpperCase().replace(/\s+/g, '_');
            // Generar para cada número de compareciente
            for (let i = 1; i <= numeroComparecientes; i++) {
                variaciones.push(`${prefix}${variable}_${tipo}_${i}${suffix}`);
            }
        });

        return variaciones;
    };

    // Copiar al clipboard
    const copiarAlClipboard = (texto: string) => {
        navigator.clipboard.writeText(texto).then(() => {
            addToast(`Copiado: ${texto}`, 'success');
        }).catch(() => {
            addToast('Error al copiar', 'error');
        });
    };

    return (
        <>
            <div className="space-y-6 px-6 pt-6">
                <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-2 bg-transparent">
                        <TabsTrigger value="busqueda" className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Search className="size-4" />
                            <span className="hidden sm:inline">Búsqueda</span>
                        </TabsTrigger>
                        <TabsTrigger value="formulario" className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Plus className="size-4" />
                            <span className="hidden sm:inline">
                                {isEditing ? 'Editar Formato' : 'Crear Formato'}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ── PESTAÑA 1: BÚSQUEDA ── */}
                    <TabsContent value="busqueda" className="space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                    placeholder="Buscar por nombre, tipo de formato..."
                                    className="pr-10"
                                />
                                {filtro && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFiltro('');
                                            setSearchError(null);
                                            setResultados([]);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Button
                                type="submit"
                                disabled={isSearching}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
                                {isSearching ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Search className="h-4 w-4" />
                                )}
                                <span className="ml-2">Buscar</span>
                            </Button>
                        </form>

                        {searchError && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-md border bg-red-50 border-red-200 text-red-800">
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{searchError}</span>
                            </div>
                        )}

                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-[670px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold">ID</th>
                                            <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                                            <th className="px-4 py-2 text-left font-semibold">Tipo de Formato</th>
                                            <th className="px-4 py-2 text-left font-semibold">Programa</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isSearching ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-muted-foreground px-4">
                                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                    Cargando formatos...
                                                </td>
                                            </tr>
                                        ) : resultados.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="text-center py-8 text-muted-foreground px-4">
                                                    No se encontraron formatos.
                                                </td>
                                            </tr>
                                        ) : (
                                            resultados.map((formato) => (
                                                <tr
                                                    key={formato.id}
                                                    className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                                    onClick={() => handleSelectFormato(formato)}
                                                >
                                                    <td className="px-4 py-2 font-mono text-sm text-blue-500 dark:text-blue-400">
                                                        {formato.id}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        {formato.nombre}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {formato.tipo_Formato}
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">
                                                        {formato.programa}
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
                                {resultados.length} formato(s) encontrado(s) —{' '}
                                <span className="text-amber-600">haz clic en un formato para editarlo</span>
                            </p>
                        )}
                    </TabsContent>

                    {/* ── PESTAÑA 2: FORMULARIO ── */}
                    <TabsContent value="formulario">
                        {isLoadingFormato ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <p className="text-muted-foreground">Cargando datos del formato...</p>
                            </div>
                        ) : (
                            <div className="w-full space-y-4">
                                {saveError && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                                        {saveError}
                                    </div>
                                )}

                                {/* Main 2-column layout: 30% left, 70% right */}
                                <div className="grid grid-cols-1 lg:grid-cols-[3fr_7fr] gap-6">
                                    {/* COLUMNA IZQUIERDA: Información + Tipos de Comparecientes */}
                                    <div className="space-y-4 flex flex-col">
                                        {/* Sección 1: Información del Formato */}
                                        <div className="border rounded-lg p-6 space-y-3 flex-shrink-0">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Información del Formato</h3>

                                            {/* Row 1: Formato + Nombre (1 column) */}
                                            <div className="grid grid-cols-1 gap-4">
                                                {/* Selector de Formato */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Formato <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        name="tipo_Formato"
                                                        value={formData.tipo_Formato}
                                                        onChange={handleInputChange}
                                                        className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700"
                                                    >
                                                        {tiposFormatoDisponibles.map((tipo) => (
                                                            <option key={tipo} value={tipo}>
                                                                {tipo}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                {/* Nombre del Formato */}
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                        Nombre Formato <span className="text-red-500">*</span>
                                                    </label>
                                                    <Input
                                                        name="nombre"
                                                        value={formData.nombre}
                                                        onChange={handleInputChange}
                                                        placeholder="Ej: COMPRAVENTAS"
                                                        className="w-full"
                                                    />
                                                </div>
                                            </div>

                                            {/* Row 2: Número de Comparecientes (1 column) */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                    Número de Comparecientes <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    max="50"
                                                    value={numeroComparecientes}
                                                    onChange={(e) => setNumeroComparecientes(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                                                    className="w-full px-3 py-2 border rounded-md dark:bg-gray-900 dark:border-gray-700"
                                                />
                                            </div>
                                        </div>

                                        {/* Sección 2: Tipos de Comparecientes */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tipos de Comparecientes</h3>
                                                <Button
                                                    onClick={agregarTipoCompareciente}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                                    size="sm"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Agregar
                                                </Button>
                                            </div>

                                            <div className="border rounded-lg overflow-hidden">
                                                <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                                            <tr>
                                                                <th className="px-4 py-2 text-center font-semibold w-16">Tipo</th>
                                                                <th className="px-4 py-2 text-left font-semibold">Compareciente</th>
                                                                <th className="px-4 py-2 text-center font-semibold">Acción</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {tiposComparecientes.length === 0 ? (
                                                                <tr>
                                                                    <td colSpan={3} className="text-center py-4 text-muted-foreground">
                                                                        No hay tipos de comparecientes agregados
                                                                    </td>
                                                                </tr>
                                                            ) : (
                                                                tiposComparecientes.map((tc, index) => (
                                                                    <tr key={tc.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50">
                                                                        <td className="px-4 py-2 text-center font-semibold">
                                                                            {index + 1}
                                                                        </td>
                                                                        <td className="px-4 py-2">
                                                                            <Input
                                                                                type="text"
                                                                                value={tc.tipo}
                                                                                onChange={(e) => actualizarTipoCompareciente(tc.id, e.target.value)}
                                                                                placeholder="Ej: COMPRADOR, VENDEDOR"
                                                                                className="w-full"
                                                                            />
                                                                        </td>
                                                                        <td className="px-4 py-2 text-center">
                                                                            <button
                                                                                onClick={() => eliminarTipoCompareciente(tc.id)}
                                                                                className="text-red-500 hover:text-red-700 transition-colors"
                                                                                title="Eliminar"
                                                                            >
                                                                                <X className="h-4 w-4" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* COLUMNA DERECHA: Marcadores Disponibles */}
                                    <div className="space-y-3 flex flex-col">
                                        <div className="flex-shrink-0">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Marcadores Disponibles</h3>
                                            <div className="relative">
                                                <Input
                                                    type="text"
                                                    value={filtroMarcadores}
                                                    onChange={(e) => setFiltroMarcadores(e.target.value)}
                                                    placeholder="Buscar marcadores..."
                                                    className="w-full pr-10"
                                                />
                                                {filtroMarcadores && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setFiltroMarcadores('')}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                        title="Limpiar filtro"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <div className="border rounded-lg overflow-hidden flex-1">
                                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                                <table className="w-full text-xs">
                                                    <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                                        <tr>
                                                            <th className="px-2 py-2 text-center font-semibold w-10">Sel.</th>
                                                            <th className="px-2 py-2 text-left font-semibold">ID</th>
                                                            <th className="px-2 py-2 text-left font-semibold">Tipo</th>
                                                            <th className="px-2 py-2 text-left font-semibold">Marcador</th>
                                                            <th className="px-2 py-2 text-left font-semibold">Variaciones</th>
                                                            <th className="px-2 py-2 text-left font-semibold">Descripción</th>
                                                            <th className="px-2 py-2 text-left font-semibold">Ejemplo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {isLoadingMarcadores ? (
                                                            <tr>
                                                                <td colSpan={7} className="text-center py-8 text-muted-foreground px-2">
                                                                    <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                                                    Cargando...
                                                                </td>
                                                            </tr>
                                                        ) : marcadores.filter(m =>
                                                            m.descripcion.toLowerCase().includes(filtroMarcadores.toLowerCase())
                                                        ).length === 0 ? (
                                                            <tr>
                                                                <td colSpan={7} className="text-center py-4 text-muted-foreground px-2">
                                                                    {filtroMarcadores ? 'No hay coincidencias' : 'No hay marcadores'}
                                                                </td>
                                                            </tr>
                                                        ) : (
                                                            marcadores.filter(m =>
                                                                m.descripcion.toLowerCase().includes(filtroMarcadores.toLowerCase())
                                                            ).map((marcador) => {
                                                                const variaciones = generarVariacionesMarcador(marcador.marcador);
                                                                const isSelected = selectedMarcadorIds.includes(marcador.id);
                                                                return (
                                                                    <tr key={marcador.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors">
                                                                        <td className="px-2 py-2 text-center">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={isSelected}
                                                                                onChange={() => toggleMarcadorSelection(marcador.id)}
                                                                                className="w-4 h-4 cursor-pointer"
                                                                            />
                                                                        </td>
                                                                        <td className="px-2 py-2 font-mono text-blue-500 dark:text-blue-400">{marcador.id}</td>
                                                                        <td className="px-2 py-2">{marcador.tipo}</td>
                                                                        <td className="px-2 py-2 font-mono text-sm bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">{marcador.marcador}</td>
                                                                        <td className="px-2 py-2">
                                                                            {variaciones.length > 0 ? (
                                                                                <div className="space-y-1">
                                                                                    {variaciones.map((v, idx) => (
                                                                                        <div key={idx} className="flex items-center gap-1">
                                                                                            <div className="font-mono text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded text-blue-700 dark:text-blue-300 flex-1">
                                                                                                {v}
                                                                                            </div>
                                                                                            <button
                                                                                                onClick={() => {
                                                                                                    // Agregar ID a la lista si no está ya
                                                                                                    if (!selectedMarcadorIds.includes(marcador.id)) {
                                                                                                        setSelectedMarcadorIds([...selectedMarcadorIds, marcador.id]);
                                                                                                    }
                                                                                                    // Insertar en Word
                                                                                                    window.location.href = `marcador://${encodeURIComponent(v)}`;
                                                                                                }}
                                                                                                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded transition-colors"
                                                                                                title="Insertar en Word"
                                                                                            >
                                                                                                Insertar
                                                                                            </button>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-gray-400 text-xs">--</span>
                                                                            )}
                                                                        </td>
                                                                        <td className="px-2 py-2">{marcador.descripcion}</td>
                                                                        <td className="px-2 py-2 text-gray-500 dark:text-gray-400">{marcador.ejemplo}</td>
                                                                    </tr>
                                                                );
                                                            })
                                                        )}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botones de Acción */}
                                <div className="flex gap-3 pt-3 border-t justify-end">
                                    <Button
                                        onClick={handleAddFormato}
                                        disabled={isSaving}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <FileText className="h-4 w-4 mr-2" />
                                        )}
                                        {isEditing ? 'Actualizar' : 'Crear'} Formato
                                    </Button>
                                    <Button
                                        onClick={handleCancelEdit}
                                        variant="outline"
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

export default function ControlNotarialFormatosIlimitados() {
    return (
        <>
            <Head title="Formatos Ilimitados - Control Notarial" />
            <LoginModal open={false} onOpenChange={() => {}} />

            <AppLayout breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Control Notarial', href: '/admin/control-notarial' },
                { title: 'Configuración', href: '/admin/control-notarial/configuracion' },
                { title: 'Formatos Ilimitados', href: '/admin/control-notarial/configuracion/formatos-ilimitados' },
            ]}>
                <FormatosIlimitadosContent />
            </AppLayout>
        </>
    );
}
