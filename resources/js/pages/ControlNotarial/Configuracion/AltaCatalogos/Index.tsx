import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, Database, FileText, AlertTriangle, Building2, File, Briefcase, DollarSign, Users, MapPin } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';

// Interfaces para cada tipo de catálogo
interface CatalogoItem {
    id?: string | number;
    descripcion: string;
    activo: boolean;
}

interface ActividadVulnerable extends CatalogoItem {
    monto: number;
    siempre: boolean;
}

interface Operacion extends CatalogoItem {
    actividad_Vulnerable_Id?: number | string;
}

interface ImpuestoDerecho extends CatalogoItem {
    tipo: string;
    dependencia: string;
}

interface Compareciente extends CatalogoItem {
    // Solo descripcion y activo
}

interface ZonaMunicipio extends CatalogoItem {
    // Solo descripcion y activo
}

interface BusquedaResultado {
    id: number;
    descripcion: string;
    activo: boolean;
    monto?: number;
    siempre?: boolean;
    actividad_Vulnerable_Id?: number | string;
    tipo?: string;
    dependencia?: string;
}

// Estados por defecto
const defaultCatalogo: CatalogoItem = {
    descripcion: '',
    activo: true,
};

const defaultActividadVulnerable: ActividadVulnerable = {
    descripcion: '',
    monto: 0,
    siempre: false,
    activo: true,
};

const defaultOperacion: Operacion = {
    descripcion: '',
    actividad_Vulnerable_Id: undefined,
    activo: true,
};

const defaultImpuestoDerecho: ImpuestoDerecho = {
    descripcion: '',
    tipo: '',
    dependencia: '',
    activo: true,
};

const defaultCompareciente: Compareciente = {
    descripcion: '',
    activo: true,
};

const defaultZonaMunicipio: ZonaMunicipio = {
    descripcion: '',
    activo: true,
};

export default function ControlNotarialAltaCatalogos() {
    // --- Control de pestaña activa ---
    const [activeTab, setActiveTab] = useState('etapas_expediente');
    const [activeSubTab, setActiveSubTab] = useState('busqueda');

    // --- Estados generales ---
    const [filtro, setFiltro] = useState('');
    const [resultados, setResultados] = useState<BusquedaResultado[]>([]);
    const [todosLosResultados, setTodosLosResultados] = useState<BusquedaResultado[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const { addToast } = useToast();

    // --- Estados por tipo de catálogo ---
    const [etapasExpediente, setEtapasExpediente] = useState<CatalogoItem>(defaultCatalogo);
    const [actividadesVulnerables, setActividadesVulnerables] = useState<ActividadVulnerable>(defaultActividadVulnerable);
    const [dependenciasPublicas, setDependenciasPublicas] = useState<CatalogoItem>(defaultCatalogo);
    const [recibosDocumentos, setRecibosDocumentos] = useState<CatalogoItem>(defaultCatalogo);
    const [operaciones, setOperaciones] = useState<Operacion>(defaultOperacion);
    const [impuestosDerechos, setImpuestosDerechos] = useState<ImpuestoDerecho>(defaultImpuestoDerecho);
    const [tiposComparecientes, setTiposComparecientes] = useState<Compareciente>(defaultCompareciente);
    const [zonasMunicipios, setZonasMunicipios] = useState<ZonaMunicipio>(defaultZonaMunicipio);

    // --- Listas para combobox ---
    const [actividadesVulnerablesLista, setActividadesVulnerablesLista] = useState<BusquedaResultado[]>([]);
    const [dependenciasLista, setDependenciasLista] = useState<BusquedaResultado[]>([]);

    // Obtener el estado actual según la pestaña activa
    const getCurrentFormState = () => {
        switch (activeTab) {
            case 'etapas_expediente':
                return etapasExpediente;
            case 'actividades_vulnerables':
                return actividadesVulnerables;
            case 'dependencias_publicas':
                return dependenciasPublicas;
            case 'recibos_documentos':
                return recibosDocumentos;
            case 'operaciones':
                return operaciones;
            case 'impuestos_derechos':
                return impuestosDerechos;
            case 'tipos_comparecientes':
                return tiposComparecientes;
            case 'zonas_municipios':
                return zonasMunicipios;
            default:
                return defaultCatalogo;
        }
    };

    // Actualizar el estado actual
    const setCurrentFormState = (data: any) => {
        switch (activeTab) {
            case 'etapas_expediente':
                setEtapasExpediente(data);
                break;
            case 'actividades_vulnerables':
                setActividadesVulnerables(data);
                break;
            case 'dependencias_publicas':
                setDependenciasPublicas(data);
                break;
            case 'recibos_documentos':
                setRecibosDocumentos(data);
                break;
            case 'operaciones':
                setOperaciones(data);
                break;
            case 'impuestos_derechos':
                setImpuestosDerechos(data);
                break;
            case 'tipos_comparecientes':
                setTiposComparecientes(data);
                break;
            case 'zonas_municipios':
                setZonasMunicipios(data);
                break;
        }
    };

    // Cargar datos al montar y cuando cambia la pestaña activa
    useEffect(() => {
        fetchActividadesVulnerables();
        fetchDependenciasPublicas();
        cargarCatalogoActual();
    }, [activeTab]);

    const fetchActividadesVulnerables = async () => {
        try {
            const response = await fetch('https://localhost:44327/api/Catalogos/GetActividadesVulnerables', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok) {
                setActividadesVulnerablesLista(data.dataResponse || []);
            }
        } catch (error) {
            console.error('Error cargando actividades vulnerables:', error);
        }
    };

    const fetchDependenciasPublicas = async () => {
        try {
            const response = await fetch('https://localhost:44327/api/Catalogos/GetDependenciasPublicas', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (response.ok) {
                setDependenciasLista(data.dataResponse || []);
            }
        } catch (error) {
            console.error('Error cargando dependencias públicas:', error);
        }
    };

    const cargarCatalogoActual = async () => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const endpoint = getCatalogoEndpoint();
            const response = await fetch(`https://localhost:44327/api/Catalogos/${endpoint}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            // Mostrar resultados si existen en dataResponse, o mostrar el mensaje si no (incluso en 400)
            if (data.dataResponse && Array.isArray(data.dataResponse)) {
                setTodosLosResultados(data.dataResponse);
                setResultados(data.dataResponse);
                setSearchError(null);
            } else {
                setSearchError(data.message || 'No se pudieron cargar los datos.');
                setTodosLosResultados([]);
                setResultados([]);
            }
        } catch (error) {
            console.error('Error cargando catálogo:', error);
            setSearchError('No se pudieron cargar los datos. Verifica la conexión con el servidor.');
            setTodosLosResultados([]);
            setResultados([]);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        cargarCatalogoActual();
    };

    const handleFiltroChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoFiltro = e.target.value;
        setFiltro(nuevoFiltro);

        // Filtrar los resultados localmente basándose en el filtro
        if (nuevoFiltro.trim() === '') {
            setResultados(todosLosResultados);
        } else {
            const filtrado = todosLosResultados.filter(item => {
                const descripcion = item.descripcion?.toLowerCase() || '';
                const busqueda = nuevoFiltro.toLowerCase();
                return descripcion.includes(busqueda);
            });
            setResultados(filtrado);
        }
    };

    const getCatalogoEndpoint = () => {
        switch (activeTab) {
            case 'etapas_expediente':
                return 'GetEtapas';
            case 'actividades_vulnerables':
                return 'GetActividadesVulnerables';
            case 'dependencias_publicas':
                return 'GetDependenciasPublicas';
            case 'recibos_documentos':
                return 'GetDocumentos';
            case 'operaciones':
                return 'GetOperaciones';
            case 'impuestos_derechos':
                return 'GetImpuestosDerechos';
            case 'tipos_comparecientes':
                return 'GetComparecientes';
            case 'zonas_municipios':
                return 'GetZonasMunicipios';
            default:
                return 'GetEtapas';
        }
    };

    const getCreateEndpoint = () => {
        switch (activeTab) {
            case 'etapas_expediente':
                return 'CreateEtapas';
            case 'actividades_vulnerables':
                return 'CreateActividadesVulnerables';
            case 'dependencias_publicas':
                return 'CreateDependenciaPublica';
            case 'recibos_documentos':
                return 'CreateDocumento';
            case 'operaciones':
                return 'CreateOperaciones';
            case 'impuestos_derechos':
                return 'CreateImpuestoDerecho';
            case 'tipos_comparecientes':
                return 'CreateCompareciente';
            case 'zonas_municipios':
                return 'CreateZonasMunicipios';
            default:
                return 'CreateEtapas';
        }
    };

    const getUpdateEndpoint = () => {
        switch (activeTab) {
            case 'etapas_expediente':
                return 'UpdateEtapas';
            case 'actividades_vulnerables':
                return 'UpdateActividadesVulnerables';
            case 'dependencias_publicas':
                return 'UpdateDependenciaPublica';
            case 'recibos_documentos':
                return 'UpdateDocumento';
            case 'operaciones':
                return 'UpdateOperaciones';
            case 'impuestos_derechos':
                return 'UpdateImpuestoDerecho';
            case 'tipos_comparecientes':
                return 'UpdateComparecientes';
            case 'zonas_municipios':
                return 'UpdateZonaMunicipio';
            default:
                return 'UpdateEtapas';
        }
    };

    const buildPayload = (state: any) => {
        const payload: any = {
            descripcion: state.descripcion,
            activo: state.activo,
        };

        // Agregar campos específicos según el tipo
        if (activeTab === 'actividades_vulnerables') {
            payload.monto = state.monto || 0;
            payload.siempre = state.siempre || false;
        } else if (activeTab === 'operaciones') {
            payload.actividad_Vulnerable_Id = state.actividad_Vulnerable_Id || 0;
        } else if (activeTab === 'impuestos_derechos') {
            payload.tipo = state.tipo || '';
            payload.dependencia = state.dependencia || '';
        }

        // Agregar ID si estamos editando
        if (isEditing && state.id) {
            payload.id = state.id;
        }

        return payload;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const currentState = getCurrentFormState();
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setCurrentFormState({
            ...currentState,
            [name]: val,
        });
    };

    const handleSelectChange = (name: string, value: string) => {
        const currentState = getCurrentFormState();
        setCurrentFormState({
            ...currentState,
            [name]: value,
        });
    };

    const handleSelectItem = async (item: BusquedaResultado) => {
        setIsEditing(true);
        setSaveError(null);
        setActiveSubTab('formulario');

        const currentState = getCurrentFormState();
        setCurrentFormState({
            ...currentState,
            ...item,
            id: item.id,
        });
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setSaveError(null);
        setActiveSubTab('busqueda');

        switch (activeTab) {
            case 'etapas_expediente':
                setEtapasExpediente(defaultCatalogo);
                break;
            case 'actividades_vulnerables':
                setActividadesVulnerables(defaultActividadVulnerable);
                break;
            case 'dependencias_publicas':
                setDependenciasPublicas(defaultCatalogo);
                break;
            case 'recibos_documentos':
                setRecibosDocumentos(defaultCatalogo);
                break;
            case 'operaciones':
                setOperaciones(defaultOperacion);
                break;
            case 'impuestos_derechos':
                setImpuestosDerechos(defaultImpuestoDerecho);
                break;
            case 'tipos_comparecientes':
                setTiposComparecientes(defaultCompareciente);
                break;
            case 'zonas_municipios':
                setZonasMunicipios(defaultZonaMunicipio);
                break;
        }
    };

    const handleSave = async () => {
        const currentState = getCurrentFormState();

        if (!currentState.descripcion) {
            addToast('La descripción es obligatoria', 'error');
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);

            const endpoint = isEditing ? getUpdateEndpoint() : getCreateEndpoint();
            const method = isEditing ? 'PUT' : 'POST';
            const payload = buildPayload(currentState);

            console.log(`[DEBUG] Enviando ${method} a ${endpoint}`, payload);

            const response = await fetch(`https://localhost:44327/api/Catalogos/${endpoint}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            console.log(`[DEBUG] Status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);

            // Intentar parsear como JSON, pero manejar respuestas vacías
            let data;
            const contentType = response.headers.get('content-type');
            const text = await response.text();

            if (text && contentType?.includes('application/json')) {
                data = JSON.parse(text);
            } else {
                console.warn(`[DEBUG] Respuesta no-JSON o vacía:`, text);
                data = { message: text || 'Operación completada' };
            }

            if (!response.ok) {
                throw new Error(data?.message || `Error al guardar el catálogo (${response.status})`);
            }

            addToast(data?.message || `Catálogo guardado correctamente`, 'success');
            handleCancelEdit();
            cargarCatalogoActual();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al guardar';
            console.error('[DEBUG] Error:', message);
            setSaveError(message);
            addToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const renderFormContent = () => {
        const currentState = getCurrentFormState();

        return (
            <div className="space-y-6">
                {saveError && (
                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                        {saveError}
                    </div>
                )}

                {/* Descripción */}
                <div className="space-y-2">
                    <RequiredLabel htmlFor="descripcion">Descripción *</RequiredLabel>
                    <textarea
                        id="descripcion"
                        name="descripcion"
                        value={currentState.descripcion}
                        onChange={handleInputChange}
                        placeholder="Descripción"
                        rows={6}
                        className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                {/* Campos adicionales según el tipo de catálogo */}
                {activeTab === 'actividades_vulnerables' && (
                    <>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="monto">Monto ($)</RequiredLabel>
                                <Input
                                    id="monto"
                                    name="monto"
                                    type="number"
                                    step="0.01"
                                    value={(currentState as ActividadVulnerable).monto || 0}
                                    onChange={handleInputChange}
                                    placeholder="0.00"
                                />
                            </div>
                            <div className="flex items-end">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input
                                        id="siempre"
                                        name="siempre"
                                        type="checkbox"
                                        checked={(currentState as ActividadVulnerable).siempre || false}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 border border-primary rounded"
                                    />
                                    <span>Siempre</span>
                                </label>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'operaciones' && (
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="actividad_Vulnerable_Id">Actividad Vulnerable</RequiredLabel>
                        <Select
                            value={(currentState as Operacion).actividad_Vulnerable_Id ? String((currentState as Operacion).actividad_Vulnerable_Id) : ''}
                            onValueChange={(value) => handleSelectChange('actividad_Vulnerable_Id', value)}
                        >
                            <SelectTrigger id="actividad_Vulnerable_Id">
                                <SelectValue placeholder="Selecciona una actividad" />
                            </SelectTrigger>
                            <SelectContent>
                                {actividadesVulnerablesLista.map((actividad) => (
                                    <SelectItem key={actividad.id} value={String(actividad.id)}>
                                        {actividad.descripcion}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}

                {activeTab === 'impuestos_derechos' && (
                    <>
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="tipo">Tipo *</RequiredLabel>
                            <Input
                                id="tipo"
                                name="tipo"
                                value={(currentState as ImpuestoDerecho).tipo || ''}
                                onChange={handleInputChange}
                                placeholder="Tipo de impuesto o derecho"
                            />
                        </div>
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="dependencia">Dependencia *</RequiredLabel>
                            <Input
                                id="dependencia"
                                name="dependencia"
                                value={(currentState as ImpuestoDerecho).dependencia || ''}
                                onChange={handleInputChange}
                                placeholder="Dependencia relacionada"
                            />
                        </div>
                    </>
                )}

                {/* Activo */}
                <div className="flex items-center space-x-2">
                    <input
                        id="activo"
                        name="activo"
                        type="checkbox"
                        checked={currentState.activo}
                        onChange={handleInputChange}
                        className="h-4 w-4 border border-primary rounded"
                    />
                    <RequiredLabel htmlFor="activo" className="cursor-pointer">
                        Activo
                    </RequiredLabel>
                </div>

                {/* Botones */}
                <div className="flex gap-2 justify-end pt-4 border-t">
                    {isEditing && (
                        <Button variant="outline" onClick={handleCancelEdit}>
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        {isSaving ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Plus className="h-4 w-4 mr-2" />
                        )}
                        {isEditing ? 'Actualizar' : 'Guardar'}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <>
            <Head title="Alta de Catálogos - Control Notarial" />

            <div className="space-y-6 px-6 pt-6">

                {/* Pestañas principales - Con Scroll - ARRIBA */}
                <div>
                    <div className="border-b mb-4">
                        <div className="overflow-x-auto">
                            <Tabs value={activeTab} onValueChange={setActiveTab}>
                                <TabsList className="inline-flex h-10 w-max items-center justify-start rounded-none border-0 bg-transparent p-0 text-muted-foreground">
                                    <TabsTrigger value="etapas_expediente" className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-b-amber-600 data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap">
                                        Etapas Expediente
                                    </TabsTrigger>
                                    <TabsTrigger value="actividades_vulnerables" className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-b-amber-600 data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap">
                                        Actividades Vulnerables
                                    </TabsTrigger>
                                    <TabsTrigger value="dependencias_publicas" className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-b-amber-600 data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap">
                                        Dependencias Públicas
                                    </TabsTrigger>
                                    <TabsTrigger value="recibos_documentos" className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-b-amber-600 data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap">
                                        Documentos
                                    </TabsTrigger>
                                    <TabsTrigger value="operaciones" className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-b-amber-600 data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap">
                                        Operaciones
                                    </TabsTrigger>
                                    <TabsTrigger value="impuestos_derechos" className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-b-amber-600 data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap">
                                        Impuestos y Derechos
                                    </TabsTrigger>
                                    <TabsTrigger value="tipos_comparecientes" className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-b-amber-600 data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap">
                                        Tipos Comparecientes
                                    </TabsTrigger>
                                    <TabsTrigger value="zonas_municipios" className="rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-2 pt-2 font-medium data-[state=active]:border-b-amber-600 data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap">
                                        Zonas - Municipios
                                    </TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </div>
                    </div>
                </div>

                {/* Pestañas de Búsqueda/Crear - ABAJO */}
                <div>
                    <Tabs value={activeSubTab} onValueChange={setActiveSubTab}>
                        <TabsList className="grid w-full grid-cols-2 bg-transparent">
                            <TabsTrigger value="busqueda" className="gap-2 data-[state=active]:shadow-neutral-800">
                                <Search className="size-4" />
                                <span className="hidden sm:inline">Búsqueda</span>
                            </TabsTrigger>
                            <TabsTrigger value="formulario" className="gap-2 data-[state=active]:shadow-neutral-800">
                                <Plus className="size-4" />
                                <span className="hidden sm:inline">
                                    {isEditing ? 'Editar Catálogo' : 'Agregar'}
                                </span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Pestaña Búsqueda */}
                        <TabsContent value="busqueda" className="space-y-4">
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative flex-1 max-w-sm">
                                    <Input
                                        value={filtro}
                                        onChange={handleFiltroChange}
                                        placeholder="Filtrar resultados..."
                                        className="pr-10"
                                    />
                                    {filtro && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFiltro('');
                                                setResultados(todosLosResultados);
                                                setSearchError(null);
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
                                    <span className="ml-2">Refrescar</span>
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
                                        <thead className="bg-slate-200 dark:bg-slate-700 border-b">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-semibold w-16">ID</th>
                                                {activeTab === 'actividades_vulnerables' && (
                                                    <>
                                                        <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                                                        <th className="px-4 py-2 text-left font-semibold">Monto</th>
                                                        <th className="px-4 py-2 text-left font-semibold">Siempre</th>
                                                    </>
                                                )}
                                                {activeTab === 'operaciones' && (
                                                    <>
                                                        <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                                                        <th className="px-4 py-2 text-left font-semibold">Actividad Vulnerable</th>
                                                    </>
                                                )}
                                                {activeTab === 'impuestos_derechos' && (
                                                    <>
                                                        <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                                                        <th className="px-4 py-2 text-left font-semibold">Tipo</th>
                                                        <th className="px-4 py-2 text-left font-semibold">Dependencia</th>
                                                    </>
                                                )}
                                                {!['actividades_vulnerables', 'operaciones', 'impuestos_derechos'].includes(activeTab) && (
                                                    <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                                                )}
                                                <th className="px-4 py-2 text-center font-semibold w-20">Activo</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isSearching ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                        Cargando...
                                                    </td>
                                                </tr>
                                            ) : resultados.length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                        No se encontraron resultados.
                                                    </td>
                                                </tr>
                                            ) : (
                                                resultados.map((item) => (
                                                    <tr
                                                        key={item.id}
                                                        className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                                        onClick={() => handleSelectItem(item)}
                                                    >
                                                        <td className="px-4 py-2 font-mono text-sm">{item.id}</td>
                                                        {activeTab === 'actividades_vulnerables' && (
                                                            <>
                                                                <td className="px-4 py-2">{item.descripcion}</td>
                                                                <td className="px-4 py-2">${item.monto?.toFixed(2)}</td>
                                                                <td className="px-4 py-2">
                                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                        item.siempre
                                                                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                            : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
                                                                    }`}>
                                                                        {item.siempre ? 'Sí' : 'No'}
                                                                    </span>
                                                                </td>
                                                            </>
                                                        )}
                                                        {activeTab === 'operaciones' && (
                                                            <>
                                                                <td className="px-4 py-2">{item.descripcion}</td>
                                                                <td className="px-4 py-2">{item.actividad_Vulnerable_Id}</td>
                                                            </>
                                                        )}
                                                        {activeTab === 'impuestos_derechos' && (
                                                            <>
                                                                <td className="px-4 py-2">{item.descripcion}</td>
                                                                <td className="px-4 py-2">{item.tipo}</td>
                                                                <td className="px-4 py-2">{item.dependencia}</td>
                                                            </>
                                                        )}
                                                        {!['actividades_vulnerables', 'operaciones', 'impuestos_derechos'].includes(activeTab) && (
                                                            <td className="px-4 py-2">{item.descripcion}</td>
                                                        )}
                                                        <td className="px-4 py-2 text-center">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                item.activo
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                            }`}>
                                                                {item.activo ? 'Sí' : 'No'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {!isSearching && resultados.length > 0 && (
                                <p className="text-sm text-muted-foreground pb-4">
                                    {resultados.length} resultado(s) encontrado(s) — <span className="text-amber-600">haz clic para editar</span>
                                </p>
                            )}
                        </TabsContent>

                        {/* Pestaña Formulario */}
                        <TabsContent value="formulario">
                            <div className="border rounded-lg p-6 space-y-6 bg-background/50 backdrop-blur-sm">
                                {renderFormContent()}
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </>
    );
}

ControlNotarialAltaCatalogos.layout = (page: React.ReactNode) => (
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
            title: 'Configuración',
            href: '/admin/control-notarial/configuracion',
        },
        {
            title: 'Alta de Catálogos',
            href: '/admin/control-notarial/alta-catalogos',
        },
    ]}>
        {page}
    </AppLayout>
);
