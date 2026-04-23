import { Head } from '@inertiajs/react';
import { X, AlertCircle, Search, Loader2, Building2, Save, Settings, SettingsIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useApi } from '@/services/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { handleControlNotarialResponse } from '@/helpers/controlNotarialResponse';
import { getCatalogoCacheado } from '@/services/cnCatalogCache';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';

interface Operacion {
    id: number;
    descripcion: string;
    activo: boolean;
}

interface Etapa {
    id: number;
    descripcion: string;
    activo: boolean;
}

interface EtapaOperacion {
    id: number;
    operacion_Id: number;
    etapa_Id: number;
    descripcion: string;
}

interface Documento {
    id: number;
    descripcion: string;
    activo: boolean;
}

interface DocumentoOperacion {
    id: number;
    operacion_Id: number;
    documento_Id: number;
    descripcion: string;
}

interface ImpuestoDerecho {
    id: number;
    descripcion: string;
    activo: boolean;
}

interface ImpuestoDerechoOperacion {
    id: number;
    operacion_Id: number;
    impuestos_derechos_Id: number;
    descripcion: string;
}

export default function ControlNotarialConfiguracionOperacionesIndex() {
    // --- Estado Autenticación ---

    const { addToast } = useToast();
    const api = useApi();

    // --- Estado pestaña Búsqueda ---
    const [filtro, setFiltro] = useState('');
    const [operaciones, setOperaciones] = useState<Operacion[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // --- Control de pestaña activa ---
    const [activeTab, setActiveTab] = useState('busqueda');
    const [activeSubTab, setActiveSubTab] = useState('etapas');

    // --- Estado pestaña Configuración ---
    const [operacionSeleccionada, setOperacionSeleccionada] = useState<Operacion | null>(null);
    const [isLoadingOperacion, setIsLoadingOperacion] = useState(false);

    // Etapas
    const [etapasConfiguradasOperacion, setEtapasConfiguradasOperacion] = useState<EtapaOperacion[]>([]);
    const [etapasDisponibles, setEtapasDisponibles] = useState<Etapa[]>([]);
    const [etapasSeleccionadas, setEtapasSeleccionadas] = useState<number[]>([]);
    const [etapasRemovidasOperacion, setEtapasRemovidasOperacion] = useState<number[]>([]);

    // Documentos
    const [documentosConfiguradosOperacion, setDocumentosConfiguradosOperacion] = useState<DocumentoOperacion[]>([]);
    const [documentosDisponibles, setDocumentosDisponibles] = useState<Documento[]>([]);
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState<number[]>([]);
    const [documentosRemovidosOperacion, setDocumentosRemovidosOperacion] = useState<number[]>([]);

    // Impuestos y Derechos
    const [impuestosConfiguradosOperacion, setImpuestosConfiguradosOperacion] = useState<ImpuestoDerechoOperacion[]>([]);
    const [impuestosDisponibles, setImpuestosDisponibles] = useState<ImpuestoDerecho[]>([]);
    const [impuestosSeleccionados, setImpuestosSeleccionados] = useState<number[]>([]);
    const [impuestosRemovidosOperacion, setImpuestosRemovidosOperacion] = useState<number[]>([]);

    const [isLoadingSubTab, setIsLoadingSubTab] = useState(false);
    const [isSavingConfig, setIsSavingConfig] = useState(false);

    // Validar autenticación al montar — esperar isReady antes de fetching
    const { isReady } = useAuthGuard();

    // Cargar operaciones al montar (filtro vacío = todas)
    useEffect(() => {
        if (!isReady) return;
        fetchOperaciones('');
    }, [isReady]);

    const fetchOperaciones = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const response = await getCatalogoCacheado('/Catalogos/GetOperaciones', () => api.get('/Catalogos/GetOperaciones'));

            await handleControlNotarialResponse(response, {
            });

            if (response?.isUnauthorized) {
                // useAuthGuard maneja el toast, no mostrar searchError
                setOperaciones([]);
            } else {
                const data = response?.dataResponse || [];
                if (response?.success !== false && data) {
                    // Filtrar si hay texto de búsqueda
                    if (filtroValue.trim()) {
                        const filtradas = data.filter((op: Operacion) =>
                            op.descripcion.toLowerCase().includes(filtroValue.toLowerCase())
                        );
                        setOperaciones(filtradas);
                    } else {
                        setOperaciones(data);
                    }
                } else {
                    setSearchError(response?.message || 'No se pudieron cargar las operaciones.');
                    setOperaciones([]);
                }
            }
        } catch (error) {
            console.error('Error buscando operaciones:', error);
            setSearchError('No se pudieron cargar las operaciones. Verifica la conexión con el servidor.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchOperaciones(filtro);
    };

    const handleSelectOperacion = async (operacion: Operacion) => {
        setIsLoadingOperacion(true);
        setOperacionSeleccionada(operacion);
        setActiveTab('configuracion');
        setActiveSubTab('etapas');

        // Limpiar búsqueda
        setFiltro('');

        try {
            // Cargar etapas configuradas
            const responseEtapasConfiguradas = await api.get(`/ConfiguracionOperacion/GetEtapasOperacion?idOperacion=${operacion.id}`);
            await handleControlNotarialResponse(responseEtapasConfiguradas, {
            });
            if (!responseEtapasConfiguradas?.isUnauthorized && responseEtapasConfiguradas?.success !== false && responseEtapasConfiguradas?.dataResponse) {
                setEtapasConfiguradasOperacion(responseEtapasConfiguradas.dataResponse);
            } else {
                setEtapasConfiguradasOperacion([]);
            }

            // Cargar etapas disponibles
            const responseEtapasDisponibles = await getCatalogoCacheado('/Catalogos/GetEtapas', () => api.get('/Catalogos/GetEtapas'));
            await handleControlNotarialResponse(responseEtapasDisponibles, {
            });
            setEtapasDisponibles(responseEtapasDisponibles?.dataResponse || []);
            setEtapasSeleccionadas([]);
            setEtapasRemovidasOperacion([]);

            // Cargar documentos configurados
            const responseDocumentosConfigurados = await api.get(`/ConfiguracionOperacion/GetDocumentoOperacion?idOperacion=${operacion.id}`);
            await handleControlNotarialResponse(responseDocumentosConfigurados, {
            });
            if (!responseDocumentosConfigurados?.isUnauthorized && responseDocumentosConfigurados?.success !== false && responseDocumentosConfigurados?.dataResponse) {
                setDocumentosConfiguradosOperacion(responseDocumentosConfigurados.dataResponse);
            } else {
                setDocumentosConfiguradosOperacion([]);
            }

            // Cargar documentos disponibles
            const responseDocumentosDisponibles = await getCatalogoCacheado('/Catalogos/GetDocumentos', () => api.get('/Catalogos/GetDocumentos'));
            await handleControlNotarialResponse(responseDocumentosDisponibles, {
            });
            setDocumentosDisponibles(responseDocumentosDisponibles?.dataResponse || []);
            setDocumentosSeleccionados([]);
            setDocumentosRemovidosOperacion([]);

            // Cargar impuestos configurados
            const responseImpuestosConfigurados = await api.get(`/ConfiguracionOperacion/GetImpuestoDerechoOperacion?idOperacion=${operacion.id}`);
            await handleControlNotarialResponse(responseImpuestosConfigurados, {
            });
            console.log('Impuestos Configurados:', responseImpuestosConfigurados?.dataResponse);
            if (responseImpuestosConfigurados?.dataResponse && responseImpuestosConfigurados.dataResponse.length > 0) {
                console.log('Primer impuesto configurado (estructura):', responseImpuestosConfigurados.dataResponse[0]);
            }
            if (!responseImpuestosConfigurados?.isUnauthorized && responseImpuestosConfigurados?.success !== false && responseImpuestosConfigurados?.dataResponse) {
                setImpuestosConfiguradosOperacion(responseImpuestosConfigurados.dataResponse);
            } else {
                setImpuestosConfiguradosOperacion([]);
            }

            // Cargar impuestos disponibles
            const responseImpuestosDisponibles = await getCatalogoCacheado('/Catalogos/GetImpuestosDerechos', () => api.get('/Catalogos/GetImpuestosDerechos'));
            await handleControlNotarialResponse(responseImpuestosDisponibles, {
            });
            console.log('Impuestos Disponibles:', responseImpuestosDisponibles?.dataResponse);
            if (responseImpuestosDisponibles?.dataResponse && responseImpuestosDisponibles.dataResponse.length > 0) {
                console.log('Primer impuesto disponible (estructura):', responseImpuestosDisponibles.dataResponse[0]);
            }
            setImpuestosDisponibles(responseImpuestosDisponibles?.dataResponse || []);
            setImpuestosSeleccionados([]);
            setImpuestosRemovidosOperacion([]);
        } catch (error) {
            console.error('Error cargando datos de la operación:', error);
            addToast('Error al cargar los datos de la operación', 'error');
        } finally {
            setIsLoadingOperacion(false);
        }
    };

    const handleChangeSubTab = async (subtab: string) => {
        if (!operacionSeleccionada) return;

        setActiveSubTab(subtab);
        setIsLoadingSubTab(true);
        setEtapasSeleccionadas([]);
        setEtapasRemovidasOperacion([]);
        setDocumentosSeleccionados([]);
        setDocumentosRemovidosOperacion([]);

        try {
            if (subtab === 'etapas' || subtab === 'documentos') {
                // Ya están precargadas
                setIsLoadingSubTab(false);
            }
        } catch (error) {
            console.error('Error al cambiar de pestaña:', error);
            addToast('Error al cargar los datos', 'error');
        } finally {
            setIsLoadingSubTab(false);
        }
    };

    const toggleEtapaSeleccion = (id: number) => {
        setEtapasSeleccionadas((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleEtapaRemovida = (etapaId: number) => {
        setEtapasRemovidasOperacion((prev) =>
            prev.includes(etapaId) ? prev.filter((x) => x !== etapaId) : [...prev, etapaId]
        );
    };

    const toggleDocumentoSeleccion = (id: number) => {
        setDocumentosSeleccionados((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleDocumentoRemovido = (documentoId: number) => {
        setDocumentosRemovidosOperacion((prev) =>
            prev.includes(documentoId) ? prev.filter((x) => x !== documentoId) : [...prev, documentoId]
        );
    };

    const toggleImpuestoSeleccion = (id: number) => {
        setImpuestosSeleccionados((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const toggleImpuestoRemovido = (impuestoId: number) => {
        setImpuestosRemovidosOperacion((prev) =>
            prev.includes(impuestoId) ? prev.filter((x) => x !== impuestoId) : [...prev, impuestoId]
        );
    };

    const handleGuardarConfiguracion = async () => {
        if (!operacionSeleccionada) {
            addToast('Selecciona una operación primero', 'error');
            return;
        }

        // Determinar qué tab está activa y preparar datos
        let url = '';
        let listaFinal: number[] = [];

        if (activeSubTab === 'etapas') {
            const etapasMantenidas = etapasConfiguradasOperacion
                .filter((e) => !etapasRemovidasOperacion.includes(e.etapa_Id))
                .map((e) => e.etapa_Id);
            listaFinal = [...new Set([...etapasMantenidas, ...etapasSeleccionadas])];

            const hayNuevasSelecciones = etapasSeleccionadas.length > 0;
            const hayRemociones = etapasRemovidasOperacion.length > 0;

            if (!hayNuevasSelecciones && !hayRemociones) {
                addToast('No hay cambios que guardar', 'error');
                return;
            }

            url = '/ConfiguracionOperacion/AddEtapasOperacion';
        } else if (activeSubTab === 'documentos') {
            const documentosMantenidos = documentosConfiguradosOperacion
                .filter((d) => !documentosRemovidosOperacion.includes(d.documento_Id))
                .map((d) => d.documento_Id);
            listaFinal = [...new Set([...documentosMantenidos, ...documentosSeleccionados])];

            const hayNuevasSelecciones = documentosSeleccionados.length > 0;
            const hayRemociones = documentosRemovidosOperacion.length > 0;

            if (!hayNuevasSelecciones && !hayRemociones) {
                addToast('No hay cambios que guardar', 'error');
                return;
            }

            url = '/ConfiguracionOperacion/AddDocumentoOperacion';
        } else if (activeSubTab === 'impuestos') {
            const impuestosMantenidos = impuestosConfiguradosOperacion
                .filter((i) => !impuestosRemovidosOperacion.includes(i.impuestos_derechos_Id))
                .map((i) => i.impuestos_derechos_Id)
                .filter((id) => id !== null && id !== undefined);
            listaFinal = [...new Set([...impuestosMantenidos, ...impuestosSeleccionados])];

            console.log('Debug Impuestos - impuestosConfiguradosOperacion:', impuestosConfiguradosOperacion);
            console.log('Debug Impuestos - impuestosMantenidos:', impuestosMantenidos);
            console.log('Debug Impuestos - impuestosSeleccionados:', impuestosSeleccionados);
            console.log('Debug Impuestos - listaFinal:', listaFinal);

            const hayNuevasSelecciones = impuestosSeleccionados.length > 0;
            const hayRemociones = impuestosRemovidosOperacion.length > 0;

            if (!hayNuevasSelecciones && !hayRemociones) {
                addToast('No hay cambios que guardar', 'error');
                return;
            }

            url = '/ConfiguracionOperacion/AddImpuestoDerechoOperacion';
        }

        setIsSavingConfig(true);
        try {
            const payload = {
                id: 0,
                operacion_Id: operacionSeleccionada.id,
                lista_N: listaFinal,
            };

            const response = await api.post(url, payload);

            await handleControlNotarialResponse(response, {
            });

            // Si es 401, useAuthGuard maneja el toast, no mostrar nada más
            if (response?.isUnauthorized) {
                return;
            }

            const isSuccess = response?.success !== false;
            if (isSuccess) {
                addToast(response?.message || 'Configuración guardada correctamente', 'success');

                // Actualizar estado local inmediatamente
                if (activeSubTab === 'etapas') {
                    const etapasMantenidas = etapasConfiguradasOperacion.filter(
                        (e) => !etapasRemovidasOperacion.includes(e.etapa_Id)
                    );
                    const nuevasEtapas = etapasSeleccionadas.map((id) => {
                        const etapa = etapasDisponibles.find((e) => e.id === id);
                        return {
                            id: 0,
                            operacion_Id: operacionSeleccionada.id,
                            etapa_Id: id,
                            descripcion: etapa?.descripcion || '',
                        };
                    });
                    setEtapasConfiguradasOperacion([...etapasMantenidas, ...nuevasEtapas]);
                } else if (activeSubTab === 'documentos') {
                    const documentosMantenidos = documentosConfiguradosOperacion.filter(
                        (d) => !documentosRemovidosOperacion.includes(d.documento_Id)
                    );
                    const nuevosDocumentos = documentosSeleccionados.map((id) => {
                        const doc = documentosDisponibles.find((d) => d.id === id);
                        return {
                            id: 0,
                            operacion_Id: operacionSeleccionada.id,
                            documento_Id: id,
                            descripcion: doc?.descripcion || '',
                        };
                    });
                    setDocumentosConfiguradosOperacion([...documentosMantenidos, ...nuevosDocumentos]);
                } else if (activeSubTab === 'impuestos') {
                    const impuestosMantenidos = impuestosConfiguradosOperacion.filter(
                        (i) => !impuestosRemovidosOperacion.includes(i.impuestos_derechos_Id)
                    );
                    const nuevosImpuestos = impuestosSeleccionados.map((id) => {
                        const imp = impuestosDisponibles.find((i) => i.id === id);
                        return {
                            id: 0,
                            operacion_Id: operacionSeleccionada.id,
                            impuestos_derechos_Id: id,
                            descripcion: imp?.descripcion || '',
                        };
                    });
                    setImpuestosConfiguradosOperacion([...impuestosMantenidos, ...nuevosImpuestos]);
                }

                // Resetear selecciones y removidas
                setEtapasSeleccionadas([]);
                setEtapasRemovidasOperacion([]);
                setDocumentosSeleccionados([]);
                setDocumentosRemovidosOperacion([]);
                setImpuestosSeleccionados([]);
                setImpuestosRemovidosOperacion([]);
            } else {
                addToast(response?.message || 'Error al guardar la configuración', 'error');
            }
        } catch (error) {
            console.error('Error guardando configuración:', error);
            addToast('Error al guardar la configuración', 'error');
        } finally {
            setIsSavingConfig(false);
        }
    };

    return (
        <>
            <Head title="Configuración Operaciones - Control Notarial" />
            <div className="space-y-6 px-6 pt-6">


                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 bg-transparent">
                        <TabsTrigger value="busqueda" className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Search className="size-4" />
                            <span className="hidden sm:inline">Búsqueda</span>
                        </TabsTrigger>
                        <TabsTrigger value="configuracion" disabled={!operacionSeleccionada} className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Settings className="size-4" />
                            <span className="hidden sm:inline">Configuración</span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ── PESTAÑA 1: BÚSQUEDA ── */}
                    <TabsContent value="busqueda" className="space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                    placeholder="Buscar por operación..."
                                    className="pr-10"
                                />
                                {filtro && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setFiltro('');
                                            setSearchError(null);
                                            setOperaciones([]);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                        title="Limpiar búsqueda"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                            <Button type="submit" disabled={isSearching} className="bg-amber-600 hover:bg-amber-700">
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
                            <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold">ID</th>
                                            <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                                            <th className="px-4 py-2 text-center font-semibold">Estatus</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isSearching ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8 text-muted-foreground px-4">
                                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                    Cargando operaciones...
                                                </td>
                                            </tr>
                                        ) : operaciones.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="text-center py-8 text-muted-foreground px-4">
                                                    No se encontraron operaciones.
                                                </td>
                                            </tr>
                                        ) : (
                                            operaciones.map((op) => (
                                                <tr
                                                    key={op.id}
                                                    className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                                    onClick={() => handleSelectOperacion(op)}
                                                >
                                                    <td className="px-4 py-3 font-mono text-sm text-blue-500 dark:text-blue-400">{op.id}</td>
                                                    <td className="px-4 py-3">{op.descripcion}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            op.activo
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        }`}>
                                                            {op.activo ? 'ACTIVO' : 'INACTIVO'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {!isSearching && operaciones.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {operaciones.length} operación(es) encontrada(s) — <span className="text-amber-600">haz clic en una operación para configurarla</span>
                            </p>
                        )}
                    </TabsContent>

                    {/* ── PESTAÑA 2: CONFIGURACIÓN ── */}
                    <TabsContent value="configuracion" className="space-y-4">
                        {isLoadingOperacion ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <p className="text-muted-foreground">Cargando datos de la operación...</p>
                            </div>
                        ) : operacionSeleccionada ? (
                            <div className="space-y-6">
                                {/* Datos de la operación seleccionada */}
                                <div className="border-2 rounded-lg p-5 space-y-3 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-slate-950 shadow-md hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-800">
                                    <div className="flex items-center justify-between pb-3 border-b-2 border-blue-300 dark:border-blue-700">
                                        <div className="space-y-1">
                                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Operación Seleccionada</p>
                                            <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100">{operacionSeleccionada.descripcion}</h2>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setOperacionSeleccionada(null);
                                                setActiveTab('busqueda');
                                            }}
                                            className="border-blue-300 hover:bg-blue-100 dark:border-blue-700 dark:hover:bg-blue-900/40"
                                        >
                                            <X className="h-4 w-4 mr-2" />
                                            Cambiar
                                        </Button>
                                    </div>
                                </div>

                                {/* Sub-pestañas: Etapas */}
                                <Tabs value={activeSubTab} onValueChange={handleChangeSubTab} className="w-full">
                                    <TabsList className="grid w-full grid-cols-3 bg-transparent">
                                        <TabsTrigger value="etapas" className="gap-2 data-[state=active]:shadow-neutral-800">
                                            <SettingsIcon className="size-4" />
                                            <span className="hidden sm:inline">Etapas</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="documentos" className="gap-2 data-[state=active]:shadow-neutral-800">
                                            <Search className="size-4" />
                                            <span className="hidden sm:inline">Documentos</span>
                                        </TabsTrigger>
                                        <TabsTrigger value="impuestos" className="gap-2 data-[state=active]:shadow-neutral-800">
                                            <AlertCircle className="size-4" />
                                            <span className="hidden sm:inline">Impuestos y Derechos</span>
                                        </TabsTrigger>
                                    </TabsList>

                                    {/* ── SUB-PESTAÑA: ETAPAS ── */}
                                    <TabsContent value="etapas" className="space-y-4">
                                        {isLoadingSubTab ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                <p className="text-muted-foreground">Cargando etapas...</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Tabla izquierda: Configuradas + Seleccionadas */}
                                                <div className="border-2 rounded-lg p-4 space-y-3 bg-gradient-to-br from-background to-background/80 dark:from-slate-950 dark:to-slate-900 shadow-md hover:shadow-lg transition-shadow">
                                                    <div className="flex items-center justify-between pb-3 border-b-2 border-green-500">
                                                        <h3 className="uppercase font-bold text-sm text-slate-700 dark:text-slate-300">Etapas Asignadas</h3>
                                                        <span className="text-xs bg-green-600 text-white rounded-full px-2.5 py-1 font-medium">
                                                            {etapasConfiguradasOperacion.filter((e) => !etapasRemovidasOperacion.includes(e.etapa_Id)).length + etapasSeleccionadas.length}
                                                        </span>
                                                    </div>
                                                    {etapasConfiguradasOperacion.length === 0 && etapasSeleccionadas.length === 0 ? (
                                                        <div className="text-center py-8 space-y-2">
                                                            <SettingsIcon className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                Selecciona elementos del catálogo →
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-[400px] overflow-y-auto space-y-2">
                                                            {/* Mostrar etapas ya configuradas */}
                                                            {etapasConfiguradasOperacion
                                                                .filter((etapa) => !etapasRemovidasOperacion.includes(etapa.etapa_Id))
                                                                .map((etapa) => (
                                                                    <div
                                                                        key={`config-${etapa.id}`}
                                                                        className="group px-4 py-2.5 rounded-lg border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/30 text-xs text-green-800 dark:text-green-300 font-medium flex items-center justify-between hover:bg-green-100/50 dark:hover:bg-green-900/40 transition-colors"
                                                                    >
                                                                        <span>✓ {etapa.descripcion || 'Sin descripción'}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleEtapaRemovida(etapa.etapa_Id)}
                                                                            className="text-green-600 hover:text-red-600 hover:bg-red-100/30 rounded-full p-1 transition-all ml-2 opacity-0 group-hover:opacity-100"
                                                                            title="Remover"
                                                                        >
                                                                            <X className="h-6 w-6" />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                            {/* Mostrar etapas recientemente seleccionadas */}
                                                            {etapasSeleccionadas.map((etapaId) => {
                                                                const etapa = etapasDisponibles.find((e) => e.id === etapaId);
                                                                return etapa ? (
                                                                    <div
                                                                        key={`new-${etapa.id}`}
                                                                        className="group px-4 py-2.5 rounded-lg border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors"
                                                                    >
                                                                        <span>+ {etapa.descripcion}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleEtapaSeleccion(etapa.id)}
                                                                            className="text-amber-600 hover:text-red-600 hover:bg-red-100/30 rounded-full p-1 transition-all ml-2 opacity-0 group-hover:opacity-100"
                                                                            title="Quitar"
                                                                        >
                                                                            <X className="h-6 w-6" />
                                                                        </button>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tabla derecha: Disponibles sin seleccionados */}
                                                <div className="border-2 rounded-lg p-4 space-y-3 bg-gradient-to-br from-background to-background/80 dark:from-slate-950 dark:to-slate-900 shadow-md hover:shadow-lg transition-shadow">
                                                    <div className="flex items-center justify-between pb-3 border-b-2 border-blue-500">
                                                        <h3 className="uppercase font-bold text-sm text-slate-700 dark:text-slate-300">Catálogo de Etapas</h3>
                                                        <span className="text-xs bg-blue-600 text-white rounded-full px-2.5 py-1 font-medium">
                                                            {etapasDisponibles.filter((e) => {
                                                                const isNewlySelected = etapasSeleccionadas.includes(e.id);
                                                                const isConfigured = etapasConfiguradasOperacion.some((et) => et.etapa_Id === e.id);
                                                                const isRemoved = etapasRemovidasOperacion.includes(e.id);
                                                                return !isNewlySelected && (!isConfigured || isRemoved);
                                                            }).length}
                                                        </span>
                                                    </div>
                                                    {etapasDisponibles.length === 0 ? (
                                                        <div className="text-center py-8 space-y-2">
                                                            <SettingsIcon className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                No hay etapas disponibles
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-[400px] overflow-y-auto space-y-2">
                                                            {etapasDisponibles
                                                                .filter((etapa) => {
                                                                    const isNewlySelected = etapasSeleccionadas.includes(etapa.id);
                                                                    const isConfigured = etapasConfiguradasOperacion.some((e) => e.etapa_Id === etapa.id);
                                                                    const isRemoved = etapasRemovidasOperacion.includes(etapa.id);
                                                                    return !isNewlySelected && (!isConfigured || isRemoved);
                                                                })
                                                                .map((etapa) => (
                                                                    <label
                                                                        key={etapa.id}
                                                                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={etapasSeleccionadas.includes(etapa.id)}
                                                                            onChange={() => toggleEtapaSeleccion(etapa.id)}
                                                                            className="h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                                                                        />
                                                                        <span className="text-xs flex-1 group-hover:text-blue-700 dark:group-hover:text-blue-300">{etapa.descripcion}</span>
                                                                    </label>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* ── SUB-PESTAÑA: DOCUMENTOS ── */}
                                    <TabsContent value="documentos" className="space-y-4">
                                        {isLoadingSubTab ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                <p className="text-muted-foreground">Cargando documentos...</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Tabla izquierda: Configurados + Seleccionados */}
                                                <div className="border-2 rounded-lg p-4 space-y-3 bg-gradient-to-br from-background to-background/80 dark:from-slate-950 dark:to-slate-900 shadow-md hover:shadow-lg transition-shadow">
                                                    <div className="flex items-center justify-between pb-3 border-b-2 border-green-500">
                                                        <h3 className="uppercase font-bold text-sm text-slate-700 dark:text-slate-300">Documentos Asignados</h3>
                                                        <span className="text-xs bg-green-600 text-white rounded-full px-2.5 py-1 font-medium">
                                                            {documentosConfiguradosOperacion.filter((d) => !documentosRemovidosOperacion.includes(d.documento_Id)).length + documentosSeleccionados.length}
                                                        </span>
                                                    </div>
                                                    {documentosConfiguradosOperacion.length === 0 && documentosSeleccionados.length === 0 ? (
                                                        <div className="text-center py-8 space-y-2">
                                                            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                Selecciona elementos del catálogo →
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-[400px] overflow-y-auto space-y-2">
                                                            {/* Mostrar documentos ya configurados */}
                                                            {documentosConfiguradosOperacion
                                                                .filter((doc) => !documentosRemovidosOperacion.includes(doc.documento_Id))
                                                                .map((doc) => (
                                                                    <div
                                                                        key={`config-${doc.id}`}
                                                                        className="group px-4 py-2.5 rounded-lg border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/30 text-xs text-green-800 dark:text-green-300 font-medium flex items-center justify-between hover:bg-green-100/50 dark:hover:bg-green-900/40 transition-colors"
                                                                    >
                                                                        <span>✓ {doc.descripcion || 'Sin descripción'}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleDocumentoRemovido(doc.documento_Id)}
                                                                            className="text-green-600 hover:text-red-600 hover:bg-red-100/30 rounded-full p-1 transition-all ml-2 opacity-0 group-hover:opacity-100"
                                                                            title="Remover"
                                                                        >
                                                                            <X className="h-6 w-6" />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                            {/* Mostrar documentos recientemente seleccionados */}
                                                            {documentosSeleccionados.map((docId) => {
                                                                const doc = documentosDisponibles.find((d) => d.id === docId);
                                                                return doc ? (
                                                                    <div
                                                                        key={`new-${doc.id}`}
                                                                        className="group px-4 py-2.5 rounded-lg border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors"
                                                                    >
                                                                        <span>+ {doc.descripcion}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleDocumentoSeleccion(doc.id)}
                                                                            className="text-amber-600 hover:text-red-600 hover:bg-red-100/30 rounded-full p-1 transition-all ml-2 opacity-0 group-hover:opacity-100"
                                                                            title="Quitar"
                                                                        >
                                                                            <X className="h-6 w-6" />
                                                                        </button>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tabla derecha: Disponibles sin seleccionados */}
                                                <div className="border-2 rounded-lg p-4 space-y-3 bg-gradient-to-br from-background to-background/80 dark:from-slate-950 dark:to-slate-900 shadow-md hover:shadow-lg transition-shadow">
                                                    <div className="flex items-center justify-between pb-3 border-b-2 border-blue-500">
                                                        <h3 className="uppercase font-bold text-base text-slate-700 dark:text-slate-300">Catálogo de Documentos</h3>
                                                        <span className="text-sm bg-blue-600 text-white rounded-full px-2.5 py-1 font-medium">
                                                            {documentosDisponibles.filter((d) => {
                                                                const isNewlySelected = documentosSeleccionados.includes(d.id);
                                                                const isConfigured = documentosConfiguradosOperacion.some((doc) => doc.documento_Id === d.id);
                                                                const isRemoved = documentosRemovidosOperacion.includes(d.id);
                                                                return !isNewlySelected && (!isConfigured || isRemoved);
                                                            }).length}
                                                        </span>
                                                    </div>
                                                    {documentosDisponibles.length === 0 ? (
                                                        <div className="text-center py-8 space-y-2">
                                                            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                                                            <p className="text-sm text-muted-foreground font-medium">
                                                                No hay documentos disponibles
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-[400px] overflow-y-auto space-y-2">
                                                            {documentosDisponibles
                                                                .filter((doc) => {
                                                                    const isNewlySelected = documentosSeleccionados.includes(doc.id);
                                                                    const isConfigured = documentosConfiguradosOperacion.some((d) => d.documento_Id === doc.id);
                                                                    const isRemoved = documentosRemovidosOperacion.includes(doc.id);
                                                                    return !isNewlySelected && (!isConfigured || isRemoved);
                                                                })
                                                                .map((doc) => (
                                                                    <label
                                                                        key={doc.id}
                                                                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={documentosSeleccionados.includes(doc.id)}
                                                                            onChange={() => toggleDocumentoSeleccion(doc.id)}
                                                                            className="h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                                                                        />
                                                                        <span className="text-xs flex-1 group-hover:text-blue-700 dark:group-hover:text-blue-300">{doc.descripcion}</span>
                                                                    </label>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                    {/* ── SUB-PESTAÑA: IMPUESTOS Y DERECHOS ── */}
                                    <TabsContent value="impuestos" className="space-y-4">
                                        {isLoadingSubTab ? (
                                            <div className="flex items-center justify-center py-8">
                                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                                <p className="text-muted-foreground">Cargando impuestos y derechos...</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 gap-4">
                                                {/* Tabla izquierda: Configurados + Seleccionados */}
                                                <div className="border-2 rounded-lg p-4 space-y-3 bg-gradient-to-br from-background to-background/80 dark:from-slate-950 dark:to-slate-900 shadow-md hover:shadow-lg transition-shadow">
                                                    <div className="flex items-center justify-between pb-3 border-b-2 border-green-500">
                                                        <h3 className="uppercase font-bold text-sm text-slate-700 dark:text-slate-300">Impuestos y Derechos Asignados</h3>
                                                        <span className="text-xs bg-green-600 text-white rounded-full px-2.5 py-1 font-medium">
                                                            {impuestosConfiguradosOperacion.filter((i) => !impuestosRemovidosOperacion.includes(i.impuestos_derechos_Id)).length + impuestosSeleccionados.length}
                                                        </span>
                                                    </div>
                                                    {impuestosConfiguradosOperacion.length === 0 && impuestosSeleccionados.length === 0 ? (
                                                        <div className="text-center py-8 space-y-2">
                                                            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                Selecciona elementos del catálogo →
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-[400px] overflow-y-auto space-y-2">
                                                            {/* Mostrar impuestos ya configurados */}
                                                            {impuestosConfiguradosOperacion
                                                                .filter((imp) => !impuestosRemovidosOperacion.includes(imp.impuestos_derechos_Id))
                                                                .map((imp) => (
                                                                    <div
                                                                        key={`config-${imp.id}`}
                                                                        className="group px-4 py-2.5 rounded-lg border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/30 text-xs text-green-800 dark:text-green-300 font-medium flex items-center justify-between hover:bg-green-100/50 dark:hover:bg-green-900/40 transition-colors"
                                                                    >
                                                                        <span>✓ {imp.descripcion || 'Sin descripción'}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleImpuestoRemovido(imp.impuestos_derechos_Id)}
                                                                            className="text-green-600 hover:text-red-600 hover:bg-red-100/30 rounded-full p-1 transition-all ml-2 opacity-0 group-hover:opacity-100"
                                                                            title="Remover"
                                                                        >
                                                                            <X className="h-6 w-6" />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                            {/* Mostrar impuestos recientemente seleccionados */}
                                                            {impuestosSeleccionados.map((impId) => {
                                                                const imp = impuestosDisponibles.find((i) => i.id === impId);
                                                                return imp ? (
                                                                    <div
                                                                        key={`new-${imp.id}`}
                                                                        className="group px-4 py-2.5 rounded-lg border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/30 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between hover:bg-amber-100/50 dark:hover:bg-amber-900/40 transition-colors"
                                                                    >
                                                                        <span>+ {imp.descripcion}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleImpuestoSeleccion(imp.id)}
                                                                            className="text-amber-600 hover:text-red-600 hover:bg-red-100/30 rounded-full p-1 transition-all ml-2 opacity-0 group-hover:opacity-100"
                                                                            title="Quitar"
                                                                        >
                                                                            <X className="h-6 w-6" />
                                                                        </button>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tabla derecha: Disponibles sin seleccionados */}
                                                <div className="border-2 rounded-lg p-4 space-y-3 bg-gradient-to-br from-background to-background/80 dark:from-slate-950 dark:to-slate-900 shadow-md hover:shadow-lg transition-shadow">
                                                    <div className="flex items-center justify-between pb-3 border-b-2 border-blue-500">
                                                        <h3 className="uppercase font-bold text-sm text-slate-700 dark:text-slate-300">Catálogo de Impuestos y Derechos</h3>
                                                        <span className="text-xs bg-blue-600 text-white rounded-full px-2.5 py-1 font-medium">
                                                            {impuestosDisponibles.filter((imp) => {
                                                                const isNewlySelected = impuestosSeleccionados.includes(imp.id);
                                                                const isConfigured = impuestosConfiguradosOperacion.some((i) => i.impuestos_derechos_Id === imp.id);
                                                                const isRemoved = impuestosRemovidosOperacion.includes(imp.id);
                                                                return !isNewlySelected && (!isConfigured || isRemoved);
                                                            }).length}
                                                        </span>
                                                    </div>
                                                    {impuestosDisponibles.length === 0 ? (
                                                        <div className="text-center py-8 space-y-2">
                                                            <AlertCircle className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                                                            <p className="text-xs text-muted-foreground font-medium">
                                                                No hay impuestos y derechos disponibles
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <div className="h-[400px] overflow-y-auto space-y-2">
                                                            {impuestosDisponibles
                                                                .filter((imp) => {
                                                                    const isNewlySelected = impuestosSeleccionados.includes(imp.id);
                                                                    const isConfigured = impuestosConfiguradosOperacion.some((i) => i.impuestos_derechos_Id === imp.id);
                                                                    const isRemoved = impuestosRemovidosOperacion.includes(imp.id);
                                                                    return !isNewlySelected && (!isConfigured || isRemoved);
                                                                })
                                                                .map((imp) => (
                                                                    <label
                                                                        key={imp.id}
                                                                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors group"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={impuestosSeleccionados.includes(imp.id)}
                                                                            onChange={() => toggleImpuestoSeleccion(imp.id)}
                                                                            className="h-4 w-4 rounded border-slate-300 accent-blue-600 cursor-pointer"
                                                                        />
                                                                        <span className="text-xs flex-1 group-hover:text-blue-700 dark:group-hover:text-blue-300">{imp.descripcion}</span>
                                                                    </label>
                                                                ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </TabsContent>

                                </Tabs>

                                <div className="flex justify-end gap-2 pt-4 border-t border-sidebar-border/50">
                                    <Button
                                        onClick={handleGuardarConfiguracion}
                                        disabled={isSavingConfig || (
                                            (activeSubTab === 'etapas' && etapasSeleccionadas.length === 0 && etapasRemovidasOperacion.length === 0) ||
                                            (activeSubTab === 'documentos' && documentosSeleccionados.length === 0 && documentosRemovidosOperacion.length === 0) ||
                                            (activeSubTab === 'impuestos' && impuestosSeleccionados.length === 0 && impuestosRemovidosOperacion.length === 0)
                                        )}
                                        className="bg-amber-600 hover:bg-amber-700"
                                    >
                                        {isSavingConfig ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="h-4 w-4 mr-2" />
                                                Guardar Configuración
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : null}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

ControlNotarialConfiguracionOperacionesIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Control Notarial',
            href: '/admin/control-notarial',
        },
        {
            title: 'Configuración Operaciones',
            href: '/admin/control-notarial/configuracion-operaciones',
        },
    ]}>
        {page}
    </AppLayout>
);

