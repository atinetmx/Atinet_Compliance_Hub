import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, Database, FileText, AlertTriangle, Building2, File, Briefcase, DollarSign, Users, MapPin } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useApi } from '@/services/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { handleControlNotarialResponse } from '@/helpers/controlNotarialResponse';

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
    const api = useApi();

    // Validar token al montar la página — esperar isReady antes de fetching
    const { isReady } = useAuthGuard();

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

    // Cargar datos cuando cambia la pestaña activa (o cuando isReady cambia a true)
    useEffect(() => {
        if (!isReady) return;
        cargarCatalogoActual();

        // Cargar solo las dependencias del catálogo que se necesita
        if (activeTab === 'operaciones') {
            fetchActividadesVulnerables();
        }
        if (activeTab === 'impuestos_derechos') {
            fetchDependenciasPublicas();
        }
    }, [isReady, activeTab]);

    const fetchActividadesVulnerables = async () => {
        try {
            const response = await api.get('/Catalogos/GetActividadesVulnerables');
            const datos = handleControlNotarialResponse(response, {
                onError: (msg) => addToast(msg, 'error'),
            });
            if (datos) {
                setActividadesVulnerablesLista(datos);
            }
        } catch (error) {
            console.error('Error cargando actividades vulnerables:', error);
        }
    };

    const fetchDependenciasPublicas = async () => {
        try {
            const response = await api.get('/Catalogos/GetDependenciasPublicas');
            const datos = handleControlNotarialResponse(response, {
                onError: (msg) => addToast(msg, 'error'),
            });
            if (datos) {
                setDependenciasLista(datos);
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
            const response = await api.get(`/Catalogos/${endpoint}`);

            const datos = handleControlNotarialResponse(response, {
                onError: (msg) => setSearchError(msg),
            });

            if (response?.isUnauthorized) {
                setTodosLosResultados([]);
                setResultados([]);
                return;
            }

            if (datos && Array.isArray(datos)) {
                setTodosLosResultados(datos);
                setResultados(datos);
                setSearchError(null);
            } else {
                setSearchError('No se pudieron cargar los datos.');
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

    const handleCatalogChange = (value: string) => {
        setActiveTab(value);
        setActiveSubTab('busqueda');
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
            // Buscar la descripción de la dependencia seleccionada por ID
            const dependenciaSeleccionada = dependenciasLista.find(dep => String(dep.id) === String(state.dependencia));
            payload.dependencia = dependenciaSeleccionada?.descripcion || '';
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
            const payload = buildPayload(currentState);

            console.log(`[DEBUG] Enviando ${isEditing ? 'PUT' : 'POST'} a Catalogos/${endpoint}`, payload);

            const response = isEditing
                ? await api.put(`/Catalogos/${endpoint}`, payload)
                : await api.post(`/Catalogos/${endpoint}`, payload);

            console.log(`[DEBUG] Response:`, response);

            if (response?.isUnauthorized) {
                return;
            }

            // Verificar si fue éxito (success puede no estar definido, entonces asumir true si no hay error)
            const isSuccess = response?.success !== false;

            if (isSuccess) {
                addToast(response?.message || `Catálogo guardado correctamente`, 'success');
                handleCancelEdit();
                cargarCatalogoActual();
            } else {
                setSaveError(response?.message || 'Error al guardar el catálogo');
                addToast(response?.message || 'Error al guardar el catálogo', 'error');
            }
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
                    <div className="bg-red-50 dark:bg-red-950/30 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                        <p className="text-red-700 dark:text-red-300 text-sm">{saveError}</p>
                    </div>
                )}

                {/* Sección: Información General */}
                <div className="border-b-2 border-blue-100 dark:border-blue-900/50 pb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Información General
                    </h3>

                    {/* Descripción - No se muestra en impuestos_derechos */}
                    {activeTab !== 'impuestos_derechos' && (
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="descripcion">Descripción *</RequiredLabel>
                            <textarea
                                id="descripcion"
                                name="descripcion"
                                value={currentState.descripcion}
                                onChange={handleInputChange}
                                placeholder="Ingresa la descripción del catálogo..."
                                rows={4}
                                className="w-full px-4 py-2 border border-blue-200 dark:border-blue-800 rounded-lg bg-white dark:bg-slate-900/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                    )}
                </div>

                {/* Campos adicionales según el tipo de catálogo */}
                {activeTab === 'actividades_vulnerables' && (
                    <div className="border-b-2 border-green-100 dark:border-green-900/50 pb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-green-600 dark:text-green-400" />
                            Detalles de Actividad
                        </h3>
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
                                    className="mt-2 bg-white dark:bg-slate-900/50 border-green-200 dark:border-green-800 focus:ring-green-500"
                                />
                            </div>
                            <div className="flex items-end pb-1">
                                <label className="flex items-center space-x-3 cursor-pointer p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800/50 hover:bg-green-100/50 dark:hover:bg-green-950/40 transition-colors flex-1">
                                    <input
                                        id="siempre"
                                        name="siempre"
                                        type="checkbox"
                                        checked={(currentState as ActividadVulnerable).siempre || false}
                                        onChange={handleInputChange}
                                        className="h-5 w-5 border-2 border-green-300 dark:border-green-700 rounded cursor-pointer accent-green-600"
                                    />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Siempre Reportable</span>
                                </label>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'operaciones' && (
                    <div className="border-b-2 border-purple-100 dark:border-purple-900/50 pb-6">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Briefcase className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            Clasificación de Operación
                        </h3>
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="actividad_Vulnerable_Id">Actividad Vulnerable *</RequiredLabel>
                            <Select
                                value={(currentState as Operacion).actividad_Vulnerable_Id ? String((currentState as Operacion).actividad_Vulnerable_Id) : ''}
                                onValueChange={(value) => handleSelectChange('actividad_Vulnerable_Id', value)}
                            >
                                <SelectTrigger id="actividad_Vulnerable_Id" className="mt-2 border-purple-200 dark:border-purple-800 bg-white/80 dark:bg-slate-900/50 focus:ring-purple-500">
                                    <SelectValue placeholder="Selecciona una actividad vulnerable..." />
                                </SelectTrigger>
                                <SelectContent className="bg-white dark:bg-slate-900">
                                    {actividadesVulnerablesLista.map((actividad) => (
                                        <SelectItem key={actividad.id} value={String(actividad.id)}>
                                            {actividad.descripcion}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                )}

                {activeTab === 'impuestos_derechos' && (
                    <div className="space-y-6">
                        <div className="border-b-2 border-orange-100 dark:border-orange-900/50 pb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                Información del Impuesto o Derecho
                            </h3>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="descripcion">Descripción *</RequiredLabel>
                                <textarea
                                    id="descripcion"
                                    name="descripcion"
                                    value={currentState.descripcion}
                                    onChange={handleInputChange}
                                    placeholder="Ingresa la descripción del impuesto o derecho..."
                                    rows={4}
                                    className="w-full px-4 py-2 border border-orange-200 dark:border-orange-800 rounded-lg bg-white dark:bg-slate-900/50 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                        <div className="border-b-2 border-orange-100 dark:border-orange-900/50 pb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                Clasificación
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="dependencia">Dependencia Pública *</RequiredLabel>
                                    <Select
                                        value={(currentState as ImpuestoDerecho).dependencia ? String((currentState as ImpuestoDerecho).dependencia) : ''}
                                        onValueChange={(value) => handleSelectChange('dependencia', value)}
                                    >
                                        <SelectTrigger id="dependencia" className="mt-2 border-orange-200 dark:border-orange-800 bg-white/80 dark:bg-slate-900/50 focus:ring-orange-500">
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-900">
                                            {dependenciasLista.map((dependencia) => (
                                                <SelectItem key={dependencia.id} value={String(dependencia.id)}>
                                                    {dependencia.descripcion}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="tipo">Tipo *</RequiredLabel>
                                    <Select
                                        value={(currentState as ImpuestoDerecho).tipo || ''}
                                        onValueChange={(value) => handleSelectChange('tipo', value)}
                                    >
                                        <SelectTrigger id="tipo" className="mt-2 border-orange-200 dark:border-orange-800 bg-white/80 dark:bg-slate-900/50 focus:ring-orange-500">
                                            <SelectValue placeholder="Selecciona..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white dark:bg-slate-900">
                                            <SelectItem value="Posterior">Posterior</SelectItem>
                                            <SelectItem value="Previo">Previo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Sección: Estado */}
                <div className="border-t-2 border-blue-100 dark:border-blue-900/50 pt-6">
                    <div className="flex items-center p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800/50 hover:bg-blue-100/50 dark:hover:bg-blue-950/40 transition-colors">
                        <label className="flex items-center space-x-3 cursor-pointer flex-1">
                            <input
                                id="activo"
                                name="activo"
                                type="checkbox"
                                checked={currentState.activo}
                                onChange={handleInputChange}
                                className="h-5 w-5 border-2 border-blue-300 dark:border-blue-700 rounded cursor-pointer accent-blue-600"
                            />
                            <span className={`font-medium ${currentState.activo ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'}`}>
                                {currentState.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </label>
                    </div>
                </div>

                {/* Botones */}
                <div className="flex gap-3 justify-end pt-6 border-t-2 border-blue-100 dark:border-blue-900/50">
                    {isEditing && (
                        <Button
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Cancelar
                        </Button>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6"
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

                {/* Seleccionar Catálogo */}
                <div className="border-2 border-blue-200 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-blue-50/50 dark:from-blue-950/30 dark:to-slate-950 shadow-md hover:shadow-lg transition-shadow dark:border-blue-800">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Catálogo</p>

                        </div>
                    </div>
                    <Select value={activeTab} onValueChange={handleCatalogChange}>
                        <SelectTrigger className="mt-3 border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-slate-900/50 focus:ring-blue-500">
                            <SelectValue placeholder="Selecciona un catálogo" />
                        </SelectTrigger>
                        <SelectContent className="bg-white dark:bg-slate-900">
                            <SelectItem value="etapas_expediente">Etapas Expediente</SelectItem>
                            <SelectItem value="actividades_vulnerables">Actividades Vulnerables</SelectItem>
                            <SelectItem value="dependencias_publicas">Dependencias Públicas</SelectItem>
                            <SelectItem value="recibos_documentos">Documentos</SelectItem>
                            <SelectItem value="operaciones">Operaciones</SelectItem>
                            <SelectItem value="impuestos_derechos">Impuestos y Derechos</SelectItem>
                            <SelectItem value="tipos_comparecientes">Tipos Comparecientes</SelectItem>
                            <SelectItem value="zonas_municipios">Zonas - Municipios</SelectItem>
                        </SelectContent>
                    </Select>
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
                                <div className="overflow-x-auto max-h-[670px] overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
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
                                                <th className="px-4 py-2 text-center font-semibold w-20">ESTATUS</th>
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
                                                        <td className="px-4 py-2 font-mono text-sm text-blue-500 dark:text-blue-400">{item.id}</td>
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
                                                                {item.activo ? 'Activo' : 'Inactivo'}
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
                            <div className="border-2 border-blue-200 rounded-lg p-6 bg-gradient-to-br from-blue-50 to-white shadow-md hover:shadow-lg transition-shadow dark:border-blue-800 dark:from-blue-950/30 dark:to-slate-950">
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
