import { Head } from '@inertiajs/react';
import { X, AlertCircle, Search, Loader2, Building2, Save, Settings, SettingsIcon } from 'lucide-react';
import React, { useState, useEffect } from 'react';

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
    const { addToast } = useToast();

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

    // Cargar operaciones al montar (filtro vacío = todas)
    useEffect(() => {
        fetchOperaciones('');
    }, []);

    const fetchOperaciones = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const response = await fetch('http://192.168.1.1:5000/api/Catalogos/GetOperaciones', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok) {
                const todos = data.dataResponse || data || [];
                // Filtrar si hay texto de búsqueda
                if (filtroValue.trim()) {
                    const filtradas = todos.filter((op: Operacion) =>
                        op.descripcion.toLowerCase().includes(filtroValue.toLowerCase())
                    );
                    setOperaciones(filtradas);
                } else {
                    setOperaciones(todos);
                }
            } else {
                setSearchError(data.message || 'No se pudieron cargar las operaciones.');
                setOperaciones([]);
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
            const responseEtapasConfiguradasURL = `http://192.168.1.1:5000/api/ConfiguracionOperacion/GetEtapasOperacion?idOperacion=${operacion.id}`;
            const responseEtapasConfiguradas = await fetch(responseEtapasConfiguradasURL, {
                headers: { 'Content-Type': 'application/json' },
            });
            const dataEtapasConfiguradas = await responseEtapasConfiguradas.json();
            // Si la respuesta es exitosa, usar los datos; si no, usar array vacío
            if (responseEtapasConfiguradas.ok && dataEtapasConfiguradas.dataResponse) {
                setEtapasConfiguradasOperacion(dataEtapasConfiguradas.dataResponse);
            } else {
                // No hay etapas configuradas (estado normal al inicio)
                setEtapasConfiguradasOperacion([]);
            }

            // Cargar etapas disponibles
            const responseEtapasDisponibles = await fetch('http://192.168.1.1:5000/api/Catalogos/GetEtapas', {
                headers: { 'Content-Type': 'application/json' },
            });
            const dataEtapasDisponibles = await responseEtapasDisponibles.json();
            setEtapasDisponibles(dataEtapasDisponibles.dataResponse || dataEtapasDisponibles || []);
            setEtapasSeleccionadas([]);
            setEtapasRemovidasOperacion([]);

            // Cargar documentos configurados
            const responseDocumentosConfiguradosURL = `http://192.168.1.1:5000/api/ConfiguracionOperacion/GetDocumentoOperacion?idOperacion=${operacion.id}`;
            const responseDocumentosConfigurados = await fetch(responseDocumentosConfiguradosURL, {
                headers: { 'Content-Type': 'application/json' },
            });
            const dataDocumentosConfigurados = await responseDocumentosConfigurados.json();
            if (responseDocumentosConfigurados.ok && dataDocumentosConfigurados.dataResponse) {
                setDocumentosConfiguradosOperacion(dataDocumentosConfigurados.dataResponse);
            } else {
                setDocumentosConfiguradosOperacion([]);
            }

            // Cargar documentos disponibles
            const responseDocumentosDisponibles = await fetch('http://192.168.1.1:5000/api/Catalogos/GetDocumentos', {
                headers: { 'Content-Type': 'application/json' },
            });
            const dataDocumentosDisponibles = await responseDocumentosDisponibles.json();
            setDocumentosDisponibles(dataDocumentosDisponibles.dataResponse || dataDocumentosDisponibles || []);
            setDocumentosSeleccionados([]);
            setDocumentosRemovidosOperacion([]);

            // Cargar impuestos configurados
            const responseImpuestosConfiguradosURL = `http://192.168.1.1:5000/api/ConfiguracionOperacion/GetImpuestoDerechoOperacion?idOperacion=${operacion.id}`;
            const responseImpuestosConfigurados = await fetch(responseImpuestosConfiguradosURL, {
                headers: { 'Content-Type': 'application/json' },
            });
            const dataImpuestosConfigurados = await responseImpuestosConfigurados.json();
            console.log('Impuestos Configurados:', dataImpuestosConfigurados.dataResponse);
            if (dataImpuestosConfigurados.dataResponse && dataImpuestosConfigurados.dataResponse.length > 0) {
                console.log('Primer impuesto configurado (estructura):', dataImpuestosConfigurados.dataResponse[0]);
            }
            if (responseImpuestosConfigurados.ok && dataImpuestosConfigurados.dataResponse) {
                setImpuestosConfiguradosOperacion(dataImpuestosConfigurados.dataResponse);
            } else {
                setImpuestosConfiguradosOperacion([]);
            }

            // Cargar impuestos disponibles
            const responseImpuestosDisponibles = await fetch('http://192.168.1.1:5000/api/Catalogos/GetImpuestosDerechos', {
                headers: { 'Content-Type': 'application/json' },
            });
            const dataImpuestosDisponibles = await responseImpuestosDisponibles.json();
            console.log('Impuestos Disponibles:', dataImpuestosDisponibles.dataResponse);
            if (dataImpuestosDisponibles.dataResponse && dataImpuestosDisponibles.dataResponse.length > 0) {
                console.log('Primer impuesto disponible (estructura):', dataImpuestosDisponibles.dataResponse[0]);
            }
            setImpuestosDisponibles(dataImpuestosDisponibles.dataResponse || dataImpuestosDisponibles || []);
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

            url = 'http://192.168.1.1:5000/api/ConfiguracionOperacion/AddEtapasOperacion';
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

            url = 'http://192.168.1.1:5000/api/ConfiguracionOperacion/AddDocumentoOperacion';
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

            url = 'http://192.168.1.1:5000/api/ConfiguracionOperacion/AddImpuestoDerechoOperacion';
        }

        setIsSavingConfig(true);
        try {
            const payload = {
                id: 0,
                operacion_Id: operacionSeleccionada.id,
                lista_N: listaFinal,
            };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (response.ok) {
                addToast(data.message || 'Configuración guardada correctamente', 'success');

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
                addToast(data.message || 'Error al guardar la configuración', 'error');
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
                <div className="pb-2 border-b">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-amber-500 p-3 text-white">
                            <Building2 className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Configuración Operaciones</h1>
                            <p className="text-muted-foreground text-xs">Gestión de operaciones y elementos asociados</p>
                        </div>
                    </div>
                </div>

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

                        <div className="border rounded-lg bg-background/50 backdrop-blur-sm flex flex-col max-h-[500px]">
                            <div className="overflow-y-auto flex-1">
                                <Table>
                                    <TableHeader className="sticky top-0 bg-background z-10">
                                        <TableRow>
                                            <TableHead className="w-16">ID</TableHead>
                                            <TableHead>Descripción</TableHead>
                                            <TableHead className="w-20 text-center">Activa</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isSearching ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                    Cargando operaciones...
                                                </TableCell>
                                            </TableRow>
                                        ) : operaciones.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                                                    No se encontraron operaciones.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            operaciones.map((op) => (
                                                <TableRow
                                                    key={op.id}
                                                    className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                                                    onClick={() => handleSelectOperacion(op)}
                                                >
                                                    <TableCell className="font-mono text-sm">{op.id}</TableCell>
                                                    <TableCell>{op.descripcion}</TableCell>
                                                    <TableCell className="text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                            op.activo
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {op.activo ? 'Sí' : 'No'}
                                                        </span>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
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
                                <div className="border rounded-lg p-4 space-y-2 bg-background/50 backdrop-blur-sm">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <RequiredLabel className="text-xs font-medium text-muted-foreground">Descripción</RequiredLabel>
                                            <div className="text-sm font-medium">{operacionSeleccionada.descripcion}</div>
                                        </div>
                                        <div className="flex items-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    setOperacionSeleccionada(null);
                                                    setActiveTab('busqueda');
                                                }}
                                                className="w-full"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cambiar Operación
                                            </Button>
                                        </div>
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
                                                <div className="border rounded-lg p-4 space-y-3 bg-background/50 backdrop-blur-sm">
                                                    <h3 className="font-semibold text-sm">Etapas Asignadas</h3>
                                                    {etapasConfiguradasOperacion.length === 0 && etapasSeleccionadas.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground text-center py-4">
                                                            Selecciona etapas del catálogo →
                                                        </p>
                                                    ) : (
                                                        <div className="max-h-64 overflow-y-auto space-y-1">
                                                            {/* Mostrar etapas ya configuradas */}
                                                            {etapasConfiguradasOperacion
                                                                .filter((etapa) => !etapasRemovidasOperacion.includes(etapa.etapa_Id))
                                                                .map((etapa) => (
                                                                    <div
                                                                        key={`config-${etapa.id}`}
                                                                        className="px-3 py-2 rounded border border-green-300 bg-green-50 dark:bg-green-950/40 text-xs text-green-800 dark:text-green-300 font-medium flex items-center justify-between"
                                                                    >
                                                                        <span>✓ {etapa.descripcion || 'Sin descripción'}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleEtapaRemovida(etapa.etapa_Id)}
                                                                            className="text-green-600 hover:text-green-800 ml-2"
                                                                            title="Remover"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                            {/* Mostrar etapas recientemente seleccionadas */}
                                                            {etapasSeleccionadas.map((etapaId) => {
                                                                const etapa = etapasDisponibles.find((e) => e.id === etapaId);
                                                                return etapa ? (
                                                                    <div
                                                                        key={`new-${etapa.id}`}
                                                                        className="px-3 py-2 rounded border border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between"
                                                                    >
                                                                        <span>+ {etapa.descripcion}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleEtapaSeleccion(etapa.id)}
                                                                            className="text-amber-600 hover:text-amber-800 ml-2"
                                                                            title="Quitar"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tabla derecha: Disponibles sin seleccionados */}
                                                <div className="border rounded-lg p-4 space-y-3 bg-background/50 backdrop-blur-sm">
                                                    <h3 className="font-semibold text-sm">Catálogo de Etapas</h3>
                                                    {etapasDisponibles.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground text-center py-4">
                                                            No hay etapas disponibles
                                                        </p>
                                                    ) : (
                                                        <div className="max-h-64 overflow-y-auto space-y-1">
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
                                                                        className="flex items-center gap-2 px-3 py-2 rounded border border-sidebar-border/30 bg-background/30 cursor-pointer hover:bg-accent/50 transition-colors"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={etapasSeleccionadas.includes(etapa.id)}
                                                                            onChange={() => toggleEtapaSeleccion(etapa.id)}
                                                                            className="h-3 w-3 rounded"
                                                                        />
                                                                        <span className="text-xs flex-1">{etapa.descripcion}</span>
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
                                                <div className="border rounded-lg p-4 space-y-3 bg-background/50 backdrop-blur-sm">
                                                    <h3 className="font-semibold text-sm">Documentos Asignados</h3>
                                                    {documentosConfiguradosOperacion.length === 0 && documentosSeleccionados.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground text-center py-4">
                                                            Selecciona documentos del catálogo →
                                                        </p>
                                                    ) : (
                                                        <div className="max-h-64 overflow-y-auto space-y-1">
                                                            {/* Mostrar documentos ya configurados */}
                                                            {documentosConfiguradosOperacion
                                                                .filter((doc) => !documentosRemovidosOperacion.includes(doc.documento_Id))
                                                                .map((doc) => (
                                                                    <div
                                                                        key={`config-${doc.id}`}
                                                                        className="px-3 py-2 rounded border border-green-300 bg-green-50 dark:bg-green-950/40 text-xs text-green-800 dark:text-green-300 font-medium flex items-center justify-between"
                                                                    >
                                                                        <span>✓ {doc.descripcion || 'Sin descripción'}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleDocumentoRemovido(doc.documento_Id)}
                                                                            className="text-green-600 hover:text-green-800 ml-2"
                                                                            title="Remover"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                            {/* Mostrar documentos recientemente seleccionados */}
                                                            {documentosSeleccionados.map((docId) => {
                                                                const doc = documentosDisponibles.find((d) => d.id === docId);
                                                                return doc ? (
                                                                    <div
                                                                        key={`new-${doc.id}`}
                                                                        className="px-3 py-2 rounded border border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between"
                                                                    >
                                                                        <span>+ {doc.descripcion}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleDocumentoSeleccion(doc.id)}
                                                                            className="text-amber-600 hover:text-amber-800 ml-2"
                                                                            title="Quitar"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tabla derecha: Disponibles sin seleccionados */}
                                                <div className="border rounded-lg p-4 space-y-3 bg-background/50 backdrop-blur-sm">
                                                    <h3 className="font-semibold text-sm">Catálogo de Documentos</h3>
                                                    {documentosDisponibles.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground text-center py-4">
                                                            No hay documentos disponibles
                                                        </p>
                                                    ) : (
                                                        <div className="max-h-64 overflow-y-auto space-y-1">
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
                                                                        className="flex items-center gap-2 px-3 py-2 rounded border border-sidebar-border/30 bg-background/30 cursor-pointer hover:bg-accent/50 transition-colors"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={documentosSeleccionados.includes(doc.id)}
                                                                            onChange={() => toggleDocumentoSeleccion(doc.id)}
                                                                            className="h-3 w-3 rounded"
                                                                        />
                                                                        <span className="text-xs flex-1">{doc.descripcion}</span>
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
                                                <div className="border rounded-lg p-4 space-y-3 bg-background/50 backdrop-blur-sm">
                                                    <h3 className="font-semibold text-sm">Impuestos y Derechos Asignados</h3>
                                                    {impuestosConfiguradosOperacion.length === 0 && impuestosSeleccionados.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground text-center py-4">
                                                            Selecciona impuestos y derechos del catálogo →
                                                        </p>
                                                    ) : (
                                                        <div className="max-h-64 overflow-y-auto space-y-1">
                                                            {/* Mostrar impuestos ya configurados */}
                                                            {impuestosConfiguradosOperacion
                                                                .filter((imp) => !impuestosRemovidosOperacion.includes(imp.impuestos_derechos_Id))
                                                                .map((imp) => (
                                                                    <div
                                                                        key={`config-${imp.id}`}
                                                                        className="px-3 py-2 rounded border border-green-300 bg-green-50 dark:bg-green-950/40 text-xs text-green-800 dark:text-green-300 font-medium flex items-center justify-between"
                                                                    >
                                                                        <span>✓ {imp.descripcion || 'Sin descripción'}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleImpuestoRemovido(imp.impuestos_derechos_Id)}
                                                                            className="text-green-600 hover:text-green-800 ml-2"
                                                                            title="Remover"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}

                                                            {/* Mostrar impuestos recientemente seleccionados */}
                                                            {impuestosSeleccionados.map((impId) => {
                                                                const imp = impuestosDisponibles.find((i) => i.id === impId);
                                                                return imp ? (
                                                                    <div
                                                                        key={`new-${imp.id}`}
                                                                        className="px-3 py-2 rounded border border-amber-300/50 bg-amber-50/30 dark:bg-amber-950/20 text-xs text-amber-700 dark:text-amber-400 flex items-center justify-between"
                                                                    >
                                                                        <span>+ {imp.descripcion}</span>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => toggleImpuestoSeleccion(imp.id)}
                                                                            className="text-amber-600 hover:text-amber-800 ml-2"
                                                                            title="Quitar"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    </div>
                                                                ) : null;
                                                            })}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tabla derecha: Disponibles sin seleccionados */}
                                                <div className="border rounded-lg p-4 space-y-3 bg-background/50 backdrop-blur-sm">
                                                    <h3 className="font-semibold text-sm">Catálogo de Impuestos y Derechos</h3>
                                                    {impuestosDisponibles.length === 0 ? (
                                                        <p className="text-xs text-muted-foreground text-center py-4">
                                                            No hay impuestos y derechos disponibles
                                                        </p>
                                                    ) : (
                                                        <div className="max-h-64 overflow-y-auto space-y-1">
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
                                                                        className="flex items-center gap-2 px-3 py-2 rounded border border-sidebar-border/30 bg-background/30 cursor-pointer hover:bg-accent/50 transition-colors"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={impuestosSeleccionados.includes(imp.id)}
                                                                            onChange={() => toggleImpuestoSeleccion(imp.id)}
                                                                            className="h-3 w-3 rounded"
                                                                        />
                                                                        <span className="text-xs flex-1">{imp.descripcion}</span>
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
