import { X, Plus, ChevronDown, AlertCircle, Loader2, Search, Users, Check } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface GeneralInfoFormProps {
    formData: any;
    setFormData: (value: any) => void;
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleNumeroEscrituraChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    isEditing: boolean;
    filasComparecientes: any[];
    refDropdownMunicipios: React.RefObject<any>;
    refDropdownOperaciones: React.RefObject<any>;
    refDropdownNotario: React.RefObject<any>;
    refDropdownResponsable: React.RefObject<any>;
    refDropdownSecretaria: React.RefObject<any>;
    refDropdownAutorizado: React.RefObject<any>;
    refDropdownDependencias: React.RefObject<any>;
    municipioBusqueda: string;
    setMunicipioBusqueda: (value: string) => void;
    municipiosFiltrados: any[];
    cargandoMunicipios: boolean;
    mostrarDropdownMunicipios: boolean;
    setMostrarDropdownMunicipios: (value: boolean) => void;
    setMunicipioId: (value: any) => void;
    operacionBusqueda: string;
    setOperacionBusqueda: (value: string) => void;
    operacionesFiltradas: any[];
    cargandoOperaciones: boolean;
    mostrarDropdownOperaciones: boolean;
    setMostrarDropdownOperaciones: (value: boolean) => void;
    handleSeleccionarOperacion: (op: any) => void;
    handleEliminarOperacion: (idx: number) => void;
    busquedaNotario: string;
    setBusquedaNotario: (value: string) => void;
    notariosFiltrados: any[];
    mostrarDropdownNotario: boolean;
    setMostrarDropdownNotario: (value: boolean) => void;
    setNotarioId: (value: any) => void;
    busquedaResponsable: string;
    setBusquedaResponsable: (value: string) => void;
    responsablesFiltrados: any[];
    mostrarDropdownResponsable: boolean;
    setMostrarDropdownResponsable: (value: boolean) => void;
    setResponsableId: (value: any) => void;
    busquedaSecretaria: string;
    setBusquedaSecretaria: (value: string) => void;
    secretariasFiltradas: any[];
    mostrarDropdownSecretaria: boolean;
    setMostrarDropdownSecretaria: (value: boolean) => void;
    setSecretariaId: (value: any) => void;
    busquedaAutorizado: string;
    setBusquedaAutorizado: (value: string) => void;
    autorizadosFiltrados: any[];
    mostrarDropdownAutorizado: boolean;
    setMostrarDropdownAutorizado: (value: boolean) => void;
    setAutorizadoId: (value: any) => void;
    numeroEscrituraError: string | null;
    validandoNumeroEscritura: boolean;
    enabledDates: any;
    setEnabledDates: (value: any) => void;
    dependenciaBusqueda: string;
    setDependenciaBusqueda: (value: string) => void;
    dependenciasFiltradas: any[];
    cargandoDependencias: boolean;
    mostrarDropdownDependencias: boolean;
    setMostrarDropdownDependencias: (value: boolean) => void;
    handleSeleccionarDependencia: (dep: any) => void;
    dependenciaSeleccionada: string | null;
    setDependenciaSeleccionada: (value: string | null) => void;
    datosDepdencias: any;
    handleActualizarDatosDependencia: (key: string, value: any) => void;
    checkboxesFecha: any;
    handleToggleCheckboxFecha: (key: string) => void;
    handleEliminarDependencia: (idx: number) => void;
    filasComparecientesArray: any[];
    setShowClienteModalComparecientes: (value: boolean) => void;
    busquedaTipo: any;
    setBusquedaTipo: (value: any) => void;
    dropdownTipoAbierto: any;
    setDropdownTipoAbierto: (value: any) => void;
    comparecientesDisponibles: any[];
    handleActualizarCompareciente: (id: string, key: string, value: any) => void;
    handleToggleCheckboxCompareciente: (id: string) => void;
    handleEliminarCompareciente: (id: string) => void;
    listasNegrasLoading: boolean;
    setComparecienteParaBuscar: (value: string) => void;
    buscarEnListasNegras: (nombre: string, clienteId?: number) => void;
    handleSaveExpediente: () => Promise<void>;
    handleCancelEdit: () => void;
    lastSavedTime: string | null;
    cargando?: boolean;
    showClienteModalComparecientes: boolean;
    clienteFiltroComparecientes: string;
    setClienteFiltroComparecientes: (value: string) => void;
    clienteResultadosComparecientes: any[];
    clienteErrorComparecientes: string | null;
    setClienteErrorComparecientes: (value: string | null) => void;
    isSearchingClientesComparecientes: boolean;
    fetchClientesModal: (filtro: string) => Promise<void>;
    handleSelectClienteFromModalComparecientes: (cliente: any) => void;
    clientesSeleccionadosEnModal: any[];
    handleRemoverClienteDelModal: (clienteId: number) => void;
    handleAgregarClientesSeleccionados: () => void;
    expedienteEsVulnerable?: boolean;
    cargandoAsignarFolios?: boolean;
    handleAsignarFolios?: () => Promise<void>;
    addToast?: (message: string, type: 'success' | 'error' | 'warning' | 'info', duration?: number) => void;
    operacionesIndices: string;
    setOperacionesIndices: (value: string) => void;
}

const RequiredLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-medium">
        {children}
        <span className="text-red-500">*</span>
    </label>
);

export default function GeneralInfoForm(props: GeneralInfoFormProps) {
    const [clientesFiltradosLocales, setClientesFiltradosLocales] = useState<any[]>([]);

    // Ejecutar búsqueda al abrir el modal
    useEffect(() => {
        if (props.showClienteModalComparecientes && props.clienteResultadosComparecientes.length === 0) {
            props.fetchClientesModal('');
        }
    }, [props.showClienteModalComparecientes]);

    // Filtrar clientes en tiempo real mientras se escribe
    useEffect(() => {
        const filtro = props.clienteFiltroComparecientes.toLowerCase();
        if (filtro === '') {
            setClientesFiltradosLocales(props.clienteResultadosComparecientes);
        } else {
            const resultados = props.clienteResultadosComparecientes.filter((cliente: any) => {
                const nombre = `${cliente.nombre} ${cliente.apellido_Paterno} ${cliente.apellido_Materno}`.toLowerCase();
                const rfc = cliente.rfc?.toLowerCase() || '';
                const curp = cliente.curp?.toLowerCase() || '';
                return nombre.includes(filtro) || rfc.includes(filtro) || curp.includes(filtro);
            });
            setClientesFiltradosLocales(resultados);
        }
    }, [props.clienteFiltroComparecientes, props.clienteResultadosComparecientes]);

    return (
        <div className="space-y-4">
            <Tabs defaultValue="datos-expediente" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 mb-3">
                <TabsTrigger value="datos-expediente" className="text-xs sm:text-sm">Datos Expediente</TabsTrigger>
                <TabsTrigger value="datos-escritura" className="text-xs sm:text-sm">Datos Escritura</TabsTrigger>
                <TabsTrigger value="comparecientes" className="text-xs sm:text-sm">Comparecientes</TabsTrigger>
                <TabsTrigger value="dependencias" className="text-xs sm:text-sm">Dependencias</TabsTrigger>
            </TabsList>

            {/* SubTab: Datos Expediente */}
            <TabsContent value="datos-expediente" className="border-t pt-6 space-y-4">
                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Expediente</label>
                        <Input name="expediente" value={props.formData.expediente} readOnly className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                    </div>
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="referencia">Referencia</RequiredLabel>
                        <Input id="referencia" name="referencia" value={props.formData.referencia} onChange={props.handleInputChange} placeholder="Referencia" className="text-sm" />
                    </div>
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="municipio">Municipio</RequiredLabel>
                        <div ref={props.refDropdownMunicipios} className="relative">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Buscar municipio..."
                                    value={props.formData.municipio || props.municipioBusqueda}
                                    onChange={(e) => {
                                        props.setMunicipioBusqueda(e.target.value);
                                        if (props.formData.municipio) props.setFormData((prev: any) => ({ ...prev, municipio: '' }));
                                    }}
                                    onFocus={() => props.setMostrarDropdownMunicipios(true)}
                                    onBlur={() => setTimeout(() => props.setMostrarDropdownMunicipios(false), 200)}
                                    className="text-sm pr-12"
                                />
                                {(props.formData.municipio || props.municipioBusqueda).length > 0 && (
                                    <button
                                        onClick={() => {
                                            props.setMunicipioBusqueda('');
                                            props.setFormData((prev: any) => ({ ...prev, municipio: '' }));
                                            props.setMunicipioId(null);
                                        }}
                                        className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                        aria-label="Limpiar"
                                    >
                                        ×
                                    </button>
                                )}
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                            </div>
                            {props.mostrarDropdownMunicipios && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                    {props.cargandoMunicipios && <div className="px-3 py-2 text-sm text-muted-foreground">Cargando...</div>}
                                    {!props.cargandoMunicipios && props.municipiosFiltrados.filter(mun => mun.descripcion !== props.formData.municipio).length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>}
                                    {props.municipiosFiltrados.filter(mun => mun.descripcion !== props.formData.municipio).map(mun => (
                                        <div
                                            key={mun.id}
                                            onClick={() => {
                                                props.setFormData((prev: any) => ({ ...prev, municipio: mun.descripcion }));
                                                props.setMunicipioId(mun.id);
                                                props.setMunicipioBusqueda('');
                                                props.setMostrarDropdownMunicipios(false);
                                            }}
                                            className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0"
                                        >
                                            {mun.descripcion}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Estatus</label>
                        <select name="estatus" value={props.formData.estatus} onChange={props.handleInputChange} className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                            <option value="">Selecciona un estatus</option>
                            <option value="EN PROCESO">EN PROCESO</option>
                            <option value="COMPLETADO">COMPLETADO</option>
                            <option value="CANCELADO">CANCELADO</option>
                        </select>
                    </div>
                </div>

                {props.formData.estatus === 'CANCELADO' && (
                    <div className="mb-6">
                        <label className="text-sm font-medium">Motivo de Cancelación</label>
                        <textarea name="motivoCancelacion" value={props.formData.motivoCancelacion} onChange={props.handleInputChange} placeholder="Describe el motivo de la cancelación..." rows={3} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm mt-2" />
                    </div>
                )}

                {props.isEditing && (
                    <div className="mb-6">
                        <label className="text-sm font-medium">Primer Otorgante</label>
                        <Input type="text" readOnly value={props.filasComparecientes[0]?.nombreCompareciente || ''} className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                    </div>
                )}

                <div className="mb-6">
                    <RequiredLabel htmlFor="operaciones" className="block mb-2">Operaciones</RequiredLabel>
                    <div ref={props.refDropdownOperaciones} className="relative">
                        <div className="relative">
                            <Input type="text" placeholder="Buscar operación..." value={props.operacionBusqueda} onChange={(e) => props.setOperacionBusqueda(e.target.value)} onFocus={() => props.setMostrarDropdownOperaciones(true)} onBlur={() => setTimeout(() => props.setMostrarDropdownOperaciones(false), 200)} className="text-sm pr-8" />
                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                        </div>
                        {props.mostrarDropdownOperaciones && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                                {props.cargandoOperaciones && <div className="px-3 py-2 text-sm text-muted-foreground">Cargando...</div>}
                                {!props.cargandoOperaciones && props.operacionesFiltradas.filter(op => !props.formData.operaciones.includes(op.descripcion)).length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>}
                                {props.operacionesFiltradas.filter(op => !props.formData.operaciones.includes(op.descripcion)).map(op => (
                                    <div key={op.id} onClick={() => props.handleSeleccionarOperacion(op)} className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0">{op.descripcion}</div>
                                ))}
                            </div>
                        )}
                    </div>
                    {props.formData.operaciones.length > 0 && (
                        <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-2">
                            {props.formData.operaciones.map((op: string, idx: number) => (
                                <div key={idx} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">
                                    <span className="text-sm">{op}</span>
                                    <button onClick={() => props.handleEliminarOperacion(idx)} className="text-red-600 hover:text-red-800 dark:text-red-400">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="mb-6">
                    <label className="text-sm font-medium block mb-2">Observaciones</label>
                    <textarea name="observaciones" value={props.formData.observaciones} onChange={props.handleInputChange} placeholder="Observaciones..." rows={3} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>

                <div className="grid grid-cols-4 gap-4 mb-6">
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="notario">Notario</RequiredLabel>
                        <div ref={props.refDropdownNotario} className="relative">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder={props.notariosFiltrados.length === 0 ? 'Sin notarios disponibles' : 'Buscar notario...'}
                                    value={props.formData.notario || props.busquedaNotario}
                                    onChange={(e) => {
                                        props.setBusquedaNotario(e.target.value);
                                        if (props.formData.notario) props.setFormData((prev: any) => ({ ...prev, notario: '' }));
                                    }}
                                    onFocus={() => props.setMostrarDropdownNotario(true)}
                                    onBlur={() => setTimeout(() => props.setMostrarDropdownNotario(false), 200)}
                                    className={`text-sm pr-12 ${props.notariosFiltrados.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    readOnly={props.notariosFiltrados.length === 0}
                                />
                                {(props.formData.notario || props.busquedaNotario).length > 0 && (
                                    <button
                                        onClick={() => {
                                            props.setBusquedaNotario('');
                                            props.setFormData((prev: any) => ({ ...prev, notario: '' }));
                                            props.setNotarioId(null);
                                        }}
                                        className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                        aria-label="Limpiar"
                                    >
                                        ×
                                    </button>
                                )}
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                            </div>
                            {props.mostrarDropdownNotario && props.notariosFiltrados.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                    {props.notariosFiltrados.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                                props.setFormData((prev: any) => ({ ...prev, notario: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
                                                props.setNotarioId(u.id);
                                                props.setBusquedaNotario('');
                                                props.setMostrarDropdownNotario(false);
                                            }}
                                            className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0"
                                        >
                                            {u.nombre} {u.apellido_Paterno} {u.apellido_Materno}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="responsable">Responsable</RequiredLabel>
                        <div ref={props.refDropdownResponsable} className="relative">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder={props.responsablesFiltrados.length === 0 ? 'Sin responsables disponibles' : 'Buscar responsable...'}
                                    value={props.formData.responsable || props.busquedaResponsable}
                                    onChange={(e) => {
                                        props.setBusquedaResponsable(e.target.value);
                                        if (props.formData.responsable) props.setFormData((prev: any) => ({ ...prev, responsable: '' }));
                                    }}
                                    onFocus={() => props.setMostrarDropdownResponsable(true)}
                                    onBlur={() => setTimeout(() => props.setMostrarDropdownResponsable(false), 200)}
                                    className={`text-sm pr-12 ${props.responsablesFiltrados.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    readOnly={props.responsablesFiltrados.length === 0}
                                />
                                {(props.formData.responsable || props.busquedaResponsable).length > 0 && (
                                    <button
                                        onClick={() => {
                                            props.setBusquedaResponsable('');
                                            props.setFormData((prev: any) => ({ ...prev, responsable: '' }));
                                            props.setResponsableId(null);
                                        }}
                                        className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                        aria-label="Limpiar"
                                    >
                                        ×
                                    </button>
                                )}
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                            </div>
                            {props.mostrarDropdownResponsable && props.responsablesFiltrados.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                    {props.responsablesFiltrados.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                                props.setFormData((prev: any) => ({ ...prev, responsable: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
                                                props.setResponsableId(u.id);
                                                props.setBusquedaResponsable('');
                                                props.setMostrarDropdownResponsable(false);
                                            }}
                                            className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0"
                                        >
                                            {u.nombre} {u.apellido_Paterno} {u.apellido_Materno}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="secretaria">Secretaria</RequiredLabel>
                        <div ref={props.refDropdownSecretaria} className="relative">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder={props.secretariasFiltradas.length === 0 ? 'Sin secretarias disponibles' : 'Buscar secretaria...'}
                                    value={props.formData.secretaria || props.busquedaSecretaria}
                                    onChange={(e) => {
                                        props.setBusquedaSecretaria(e.target.value);
                                        if (props.formData.secretaria) props.setFormData((prev: any) => ({ ...prev, secretaria: '' }));
                                    }}
                                    onFocus={() => props.setMostrarDropdownSecretaria(true)}
                                    onBlur={() => setTimeout(() => props.setMostrarDropdownSecretaria(false), 200)}
                                    className={`text-sm pr-12 ${props.secretariasFiltradas.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    readOnly={props.secretariasFiltradas.length === 0}
                                />
                                {(props.formData.secretaria || props.busquedaSecretaria).length > 0 && (
                                    <button
                                        onClick={() => {
                                            props.setBusquedaSecretaria('');
                                            props.setFormData((prev: any) => ({ ...prev, secretaria: '' }));
                                            props.setSecretariaId(null);
                                        }}
                                        className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                        aria-label="Limpiar"
                                    >
                                        ×
                                    </button>
                                )}
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                            </div>
                            {props.mostrarDropdownSecretaria && props.secretariasFiltradas.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                    {props.secretariasFiltradas.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                                props.setFormData((prev: any) => ({ ...prev, secretaria: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
                                                props.setSecretariaId(u.id);
                                                props.setBusquedaSecretaria('');
                                                props.setMostrarDropdownSecretaria(false);
                                            }}
                                            className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0"
                                        >
                                            {u.nombre} {u.apellido_Paterno} {u.apellido_Materno}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Autorizado</label>
                        <div ref={props.refDropdownAutorizado} className="relative">
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder={props.autorizadosFiltrados.length === 0 ? 'Sin autorizados disponibles' : 'Buscar autorizado...'}
                                    value={props.formData.autorizado || props.busquedaAutorizado}
                                    onChange={(e) => {
                                        props.setBusquedaAutorizado(e.target.value);
                                        if (props.formData.autorizado) props.setFormData((prev: any) => ({ ...prev, autorizado: '' }));
                                    }}
                                    onFocus={() => props.setMostrarDropdownAutorizado(true)}
                                    onBlur={() => setTimeout(() => props.setMostrarDropdownAutorizado(false), 200)}
                                    className={`text-sm pr-12 ${props.autorizadosFiltrados.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    readOnly={props.autorizadosFiltrados.length === 0}
                                />
                                {(props.formData.autorizado || props.busquedaAutorizado).length > 0 && (
                                    <button
                                        onClick={() => {
                                            props.setBusquedaAutorizado('');
                                            props.setFormData((prev: any) => ({ ...prev, autorizado: '' }));
                                            props.setAutorizadoId(null);
                                        }}
                                        className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                        aria-label="Limpiar"
                                    >
                                        ×
                                    </button>
                                )}
                                <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                            </div>
                            {props.mostrarDropdownAutorizado && props.autorizadosFiltrados.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                    {props.autorizadosFiltrados.map(u => (
                                        <div
                                            key={u.id}
                                            onClick={() => {
                                                props.setFormData((prev: any) => ({ ...prev, autorizado: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
                                                props.setAutorizadoId(u.id);
                                                props.setBusquedaAutorizado('');
                                                props.setMostrarDropdownAutorizado(false);
                                            }}
                                            className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0"
                                        >
                                            {u.nombre} {u.apellido_Paterno} {u.apellido_Materno}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Última Etapa</label>
                    <textarea name="ultima_etapa" value={props.formData.ultima_etapa} onChange={props.handleInputChange} placeholder="Última etapa..." rows={2} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                </div>
            </TabsContent>

            {/* SubTab: Datos Escritura - Large section, so keeping it minimal structure */}
            <TabsContent value="datos-escritura" className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de Escritura</label>
                        <select name="tipoEscritura" value={props.formData.tipoEscritura} onChange={props.handleInputChange} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-white border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                            <option value="">Selecciona tipo</option>
                            <option value="PROTOCOLO ABIERTO">Protocolo Abierto</option>
                            <option value="PROTOCOLO CERRADO">Protocolo Cerrado</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Número de Escritura</label>
                        <div className="relative">
                            <Input
                                type="text"
                                inputMode="numeric"
                                name="numeroEscritura"
                                value={props.formData.numeroEscritura}
                                onChange={props.handleNumeroEscrituraChange}
                                placeholder="Número de escritura"
                                className={`text-sm bg-white dark:bg-white ${props.numeroEscrituraError ? 'border-red-500 focus:ring-red-500' : ''}`}
                            />
                            {props.validandoNumeroEscritura && (
                                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                            )}
                        </div>
                        {props.numeroEscrituraError && (
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm mt-1">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <span>{props.numeroEscrituraError}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* APARTADO DE FOLIOS */}
                <div className="border-2 border-blue-200 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-600 text-white p-3 rounded-lg">
                            <Plus className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Gestión de Folios</h4>
                    </div>
                    <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4 items-end">
                            <div className="space-y-2 w-full">
                                <label className="text-sm font-medium">Folios Requeridos</label>
                                <Input type="number" name="foliosRequeridos" value={props.formData.foliosRequeridos} onChange={props.handleInputChange} placeholder="0" className="text-sm w-full bg-white dark:bg-white" />
                            </div>
                            <div className="flex items-end w-full pt-5">
                                <Button
                                    onClick={props.handleAsignarFolios}
                                    disabled={!props.formData.foliosRequeridos || props.formData.foliosRequeridos <= 0 || props.cargandoAsignarFolios || !props.isEditing}
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all h-10 w-24 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {props.cargandoAsignarFolios ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        'Asignar'
                                    )}
                                </Button>
                            </div>
                            <div className="w-full"></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2 w-full">
                                <label className="text-sm font-medium">Folio Inicial</label>
                                <Input type="number" name="folioInicial" value={props.formData.folioInicial} readOnly className="text-sm w-full bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2 w-full">
                                <label className="text-sm font-medium">Folio Final</label>
                                <Input type="number" name="folioFinal" value={props.formData.folioFinal} readOnly className="text-sm w-full bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                            </div>
                            <div className="w-full"></div>
                            <div className="w-full"></div>
                        </div>
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-2 w-full">
                                <label className="text-sm font-medium">Volumen</label>
                                <Input type="number" name="volumen" value={props.formData.volumen} readOnly className="text-sm w-full bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2 w-full">
                                <label className="text-sm font-medium">Tomo</label>
                                <Input type="number" name="tomo" value={props.formData.tomo} readOnly className="text-sm w-full bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                            </div>
                            <div className="space-y-2 w-full">
                                <label className="text-sm font-medium">Folios Inutilizados</label>
                                <Input type="number" name="foliosInutilizados" value={props.formData.foliosInutilizados} readOnly className="text-sm w-full bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                            </div>
                            <div className="w-full"></div>
                        </div>
                    </div>
                </div>

                {/* APARTADO DE FECHAS CON CHECKBOXES */}
                <div className="border-2 border-purple-200 rounded-lg p-5 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-md transition-shadow">
                    <h4 className="font-semibold text-sm mb-4 text-purple-900 dark:text-purple-100">Fechas de Proceso</h4>
                    <div className="space-y-3">
                        <div className="text-xs text-muted-foreground mb-3">*Para modificar las fechas, activa el checkbox correspondiente</div>
                        <div className="grid grid-cols-2 gap-4">
                            {(['fechaEscritura', 'fechaFirma', 'fechaElaboracion', 'fechaRevision', 'fechaImpresion', 'firmarTodos'] as const).map(dateField => (
                                <div key={dateField} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={dateField}
                                            className="w-4 h-4"
                                            checked={props.enabledDates[dateField]}
                                            onChange={(e) => props.setEnabledDates((prev: any) => ({ ...prev, [dateField]: e.target.checked }))}
                                        />
                                        <label htmlFor={dateField} className="text-sm font-medium">
                                            {dateField === 'fechaEscritura' && 'Fecha Escritura'}
                                            {dateField === 'fechaFirma' && 'Fecha Firma'}
                                            {dateField === 'fechaElaboracion' && 'Fecha Elaboración'}
                                            {dateField === 'fechaRevision' && 'Fecha Revisión'}
                                            {dateField === 'fechaImpresion' && 'Fecha Impresión'}
                                            {dateField === 'firmarTodos' && 'Firma Todos'}
                                        </label>
                                    </div>
                                    <input
                                        type="date"
                                        name={dateField}
                                        value={(props.formData as any)[dateField]}
                                        onChange={props.handleInputChange}
                                        readOnly={!props.enabledDates[dateField]}
                                        className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-white border-input text-sm ${!props.enabledDates[dateField] ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* APARTADO OPERACION INDICES */}
                <div className="border-2 border-amber-200 rounded-lg p-5 bg-gradient-to-br from-amber-50 to-white shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-amber-600 text-white p-3 rounded-lg">
                            <Plus className="h-5 w-5" />
                        </div>
                        <h4 className="text-lg font-bold text-gray-900">Operación Índices</h4>
                    </div>
                    <div className="space-y-4">
                        <Button
                            onClick={() => {
                                if (props.formData.operaciones.length > 0) {
                                    const operacionesText = props.formData.operaciones.join(', ');
                                    props.setOperacionesIndices(operacionesText);
                                    props.setFormData(prev => ({
                                        ...prev,
                                        operacion_Indices: operacionesText
                                    }));
                                    if (props.addToast) {
                                        props.addToast('Operaciones copiadas al textbox', 'success');
                                    }
                                } else {
                                    if (props.addToast) {
                                        props.addToast('No hay operaciones para copiar', 'warning');
                                    }
                                }
                            }}
                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold w-full"
                        >
                            📋 COPIAR DESCRIPCION DE OPERACION
                        </Button>
                        <textarea
                            placeholder="Las operaciones aparecerán aquí al hacer clic en el botón..."
                            value={props.operacionesIndices}
                            onChange={(e) => {
                                props.setOperacionesIndices(e.target.value);
                                props.setFormData(prev => ({
                                    ...prev,
                                    operacion_Indices: e.target.value
                                }));
                            }}
                            rows={4}
                            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-white border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                    </div>
                </div>

                {/* APARTADO NO PASO */}
                <div className="border rounded-lg p-4 bg-red-50 dark:bg-red-950/20">
                    <h4 className="font-semibold text-sm mb-4 text-red-900 dark:text-red-100">Estado de Paso</h4>
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="no-paso"
                                className="w-4 h-4 cursor-pointer"
                                checked={props.formData.noPaso}
                                onChange={(e) => props.setFormData((prev: any) => ({ ...prev, noPaso: e.target.checked }))}
                            />
                            <label htmlFor="no-paso" className="text-sm font-medium cursor-pointer">No Pasó</label>
                        </div>
                        {props.formData.noPaso && (
                            <div>
                                <label className="text-sm font-medium block mb-2">Motivo</label>
                                <textarea
                                    name="nopasoMotivo"
                                    value={props.formData.nopasoMotivo}
                                    onChange={props.handleInputChange}
                                    placeholder="Explica el motivo por el cual no pasó..."
                                    rows={3}
                                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-white border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </TabsContent>

            {/* SubTab: Comparecientes - Large section, kept as inline for now */}
            <TabsContent value="comparecientes" className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md mb-6">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-blue-900 dark:text-blue-100">Agregar Compareciente(s)</h3>
                        <Button
                            onClick={() => props.setShowClienteModalComparecientes(true)}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Buscar Cliente
                        </Button>
                    </div>
                </div>

                {props.filasComparecientes.length > 0 && (
                    <div className="border rounded-lg overflow-hidden" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
                        <div className="overflow-x-auto overflow-y-auto flex-1">
                            <table className="w-full text-sm">
                                 <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">

                                    <tr>
                                        <th className="px-4 py-2 text-left">Nombre Compareciente</th>
                                        <th className="px-4 py-2 text-left flex items-center gap-1">Tipo Compareciente <span className="text-red-500">*</span></th>
                                        <th className="px-4 py-2 text-center">Firma Requerida</th>
                                        <th className="px-4 py-2 text-left">Fecha Firma</th>
                                        <th className="px-4 py-2 text-center">LISTAS SAT/NEGRAS/OFAC</th>
                                        <th className="px-4 py-2 text-center"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {props.filasComparecientes.map((fila) => (
                                        <tr key={fila.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                            <td className="px-4 py-3">{fila.nombreCompareciente}</td>
                                            <td className="px-4 py-3">
                                                <div className="relative w-full">
                                                    <Input
                                                        type="text"
                                                        placeholder="Buscar tipo..."
                                                        value={props.busquedaTipo[fila.id] || ''}
                                                        onChange={(e) => props.setBusquedaTipo((prev: any) => ({ ...prev, [fila.id]: e.target.value }))}
                                                        onFocus={() => props.setDropdownTipoAbierto((prev: any) => ({ ...prev, [fila.id]: true }))}
                                                        className="text-sm pr-12"
                                                    />
                                                    {(props.busquedaTipo[fila.id] || '').length > 0 && (
                                                        <button
                                                            onClick={() => props.setBusquedaTipo((prev: any) => ({ ...prev, [fila.id]: '' }))}
                                                            className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                                        >
                                                            ×
                                                        </button>
                                                    )}
                                                    <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                    {props.dropdownTipoAbierto[fila.id] && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                                            {props.comparecientesDisponibles.filter(c => {
                                                                if (!c.activo) return false;
                                                                const busqueda = (props.busquedaTipo[fila.id] || '').toLowerCase().trim();
                                                                return busqueda === '' ? true : c.descripcion.toLowerCase().includes(busqueda);
                                                            }).map(comp => (
                                                                <div
                                                                    key={comp.id}
                                                                    onClick={() => {
                                                                        props.handleActualizarCompareciente(fila.id, 'tipoCompareciente', comp.descripcion);
                                                                        props.setBusquedaTipo((prev: any) => ({ ...prev, [fila.id]: comp.descripcion }));
                                                                        props.setDropdownTipoAbierto((prev: any) => ({ ...prev, [fila.id]: false }));
                                                                    }}
                                                                    className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0 whitespace-nowrap"
                                                                >
                                                                    {comp.descripcion}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={fila.firmaRequerida}
                                                    onChange={() => props.handleToggleCheckboxCompareciente(fila.id)}
                                                    className="rounded"
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    type="date"
                                                    disabled={!fila.firmaRequerida}
                                                    value={fila.fechaFirma}
                                                    onChange={(e) => props.handleActualizarCompareciente(fila.id, 'fechaFirma', e.target.value)}
                                                    className="text-sm"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="text-sm font-medium gap-2"
                                                    onClick={() => {
                                                        props.setComparecienteParaBuscar(fila.nombreCompareciente);
                                                        props.buscarEnListasNegras(fila.nombreCompareciente, fila.cliente_Id);
                                                    }}
                                                    disabled={props.listasNegrasLoading}
                                                >
                                                    {props.listasNegrasLoading ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Search className="h-4 w-4" />
                                                    )}
                                                    BÚSQUEDA
                                                </Button>
                                            </td>
                                            <td className="px-4 py-3 text-center flex items-center justify-center">
                                                <button
                                                    onClick={() => props.handleEliminarCompareciente(fila.id)}
                                                    className="text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-2xl font-bold rounded-md w-8 h-8 flex items-center justify-center leading-none"
                                                >
                                                    ×
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {props.filasComparecientes.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground mb-80">
                        <p>No hay comparecientes agregados. Selecciona un cliente para comenzar.</p>
                    </div>
                )}
            </TabsContent>

            {/* SubTab: Dependencias */}
            <TabsContent value="dependencias" className="space-y-4">
                <div className="bg-cyan-50 dark:bg-cyan-950/30 p-4 rounded-md mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-0">Dependencias Públicas</h3>
                </div>

                <div ref={props.refDropdownDependencias} className="relative mb-4">
                    <div className="relative">
                        <Input type="text" placeholder="Buscar dependencia..." value={props.dependenciaBusqueda} onChange={(e) => props.setDependenciaBusqueda(e.target.value)} onFocus={() => props.setMostrarDropdownDependencias(true)} onBlur={() => setTimeout(() => props.setMostrarDropdownDependencias(false), 200)} className="text-sm pr-8" />
                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                    </div>
                    {props.mostrarDropdownDependencias && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                            {props.cargandoDependencias && <div className="px-3 py-2 text-sm text-muted-foreground">Cargando...</div>}
                            {!props.cargandoDependencias && props.dependenciasFiltradas.filter(dep => !props.formData.dependencias.includes(dep.descripcion.trim())).length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>}
                            {props.dependenciasFiltradas.filter(dep => !props.formData.dependencias.includes(dep.descripcion.trim())).map(dep => (
                                <div key={dep.id} onClick={() => props.handleSeleccionarDependencia(dep)} className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0">{dep.descripcion.trim()}</div>
                            ))}
                        </div>
                    )}
                </div>

                {props.formData.dependencias.length > 0 && (
                    <div className="border rounded-lg overflow-hidden" style={{ maxHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                        <div className="overflow-x-auto overflow-y-auto flex-1">
                            <table className="w-full text-sm">
                                 <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                    <tr>
                                        <th className="px-3 py-2 text-left">#</th>
                                        <th className="px-3 py-2 text-left">Dependencia</th>
                                        <th className="px-3 py-2 text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {props.formData.dependencias.map((dep: string, idx: number) => (
                                        <tr key={idx} className="border-b hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer transition-colors">
                                            <td className="px-3 py-2">
                                                <span className="font-semibold">{idx + 1}</span>
                                            </td>
                                            <td className="px-3 py-2 text-sm">
                                                <button onClick={() => props.setDependenciaSeleccionada(dep)} className="hover:underline text-left">{dep}</button>
                                            </td>
                                            <td className="px-3 py-2 text-center">
                                                <button onClick={() => props.handleEliminarDependencia(idx)} className="text-red-600 hover:text-red-800 dark:text-red-400">
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {props.formData.dependencias.length === 0 && (
                    <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground text-center py-8">No hay dependencias agregadas</p>
                    </div>
                )}

                {/* Formulario de Datos de la Dependencia */}
                {props.dependenciaSeleccionada && props.datosDepdencias[props.dependenciaSeleccionada] && (
                    <div className="border rounded-lg p-6 bg-cyan-50 dark:bg-cyan-950/20 mt-6 border-cyan-300">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-semibold text-cyan-900 dark:text-cyan-100">Datos de la Dependencia</h3>
                            <button onClick={() => props.setDependenciaSeleccionada(null)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* FILA 1: Dependencia */}
                            <div>
                                <label className="text-sm font-medium block mb-1">Dependencia</label>
                                <Input type="text" value={props.dependenciaSeleccionada} readOnly className="text-sm bg-background/50" />
                            </div>

                            {/* FILA 2: Folio Real, Folio, Volumen, Fojas */}
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="text-sm font-medium block mb-1">Folio Real</label>
                                    <Input type="text" placeholder="Folio real" value={props.datosDepdencias[props.dependenciaSeleccionada].folioReal} onChange={(e) => props.handleActualizarDatosDependencia('folioReal', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Folio</label>
                                    <Input type="text" placeholder="Folio" value={props.datosDepdencias[props.dependenciaSeleccionada].folio} onChange={(e) => props.handleActualizarDatosDependencia('folio', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Volumen</label>
                                    <Input type="text" placeholder="Volumen" value={props.datosDepdencias[props.dependenciaSeleccionada].volumen} onChange={(e) => props.handleActualizarDatosDependencia('volumen', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Fojas</label>
                                    <Input type="text" placeholder="Fojas" value={props.datosDepdencias[props.dependenciaSeleccionada].fojas} onChange={(e) => props.handleActualizarDatosDependencia('fojas', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                            </div>

                            {/* FILA 3: Sección, Partida, Libro, Estatus */}
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <label className="text-sm font-medium block mb-1">Sección</label>
                                    <Input type="text" placeholder="Sección" value={props.datosDepdencias[props.dependenciaSeleccionada].seccion} onChange={(e) => props.handleActualizarDatosDependencia('seccion', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Partida</label>
                                    <Input type="text" placeholder="Partida" value={props.datosDepdencias[props.dependenciaSeleccionada].partida} onChange={(e) => props.handleActualizarDatosDependencia('partida', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Libro</label>
                                    <Input type="text" placeholder="Libro" value={props.datosDepdencias[props.dependenciaSeleccionada].libro} onChange={(e) => props.handleActualizarDatosDependencia('libro', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium block mb-1">Estatus</label>
                                    <Input type="text" placeholder="Estatus" value={props.datosDepdencias[props.dependenciaSeleccionada].estatus} onChange={(e) => props.handleActualizarDatosDependencia('estatus', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                            </div>

                            {/* FILA 4: Observaciones */}
                            <div>
                                <label className="text-sm font-medium block mb-1">Observaciones</label>
                                <textarea placeholder="Observaciones..." value={props.datosDepdencias[props.dependenciaSeleccionada].observaciones} onChange={(e) => props.handleActualizarDatosDependencia('observaciones', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md bg-white dark:bg-white border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                            </div>

                            {/* FILA 5: F. Ingreso, F. Rechazo, F. Subsanado, F. Reingreso */}
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="ckFechaIngreso" checked={props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaIngreso || false} onChange={() => props.handleToggleCheckboxFecha('fechaIngreso')} className="rounded" />
                                        <label htmlFor="ckFechaIngreso" className="text-sm font-medium">F. Ingreso</label>
                                    </div>
                                    <Input type="date" disabled={!props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaIngreso} value={props.datosDepdencias[props.dependenciaSeleccionada].fechaIngreso} onChange={(e) => props.handleActualizarDatosDependencia('fechaIngreso', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="ckFechaRechazo" checked={props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaRechazo || false} onChange={() => props.handleToggleCheckboxFecha('fechaRechazo')} className="rounded" />
                                        <label htmlFor="ckFechaRechazo" className="text-sm font-medium">F. Rechazo</label>
                                    </div>
                                    <Input type="date" disabled={!props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaRechazo} value={props.datosDepdencias[props.dependenciaSeleccionada].fechaRechazo} onChange={(e) => props.handleActualizarDatosDependencia('fechaRechazo', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="ckFechaSubsanado" checked={props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaSubsanado || false} onChange={() => props.handleToggleCheckboxFecha('fechaSubsanado')} className="rounded" />
                                        <label htmlFor="ckFechaSubsanado" className="text-sm font-medium">F. Subsanado</label>
                                    </div>
                                    <Input type="date" disabled={!props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaSubsanado} value={props.datosDepdencias[props.dependenciaSeleccionada].fechaSubsanado} onChange={(e) => props.handleActualizarDatosDependencia('fechaSubsanado', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="ckFechaReingreso" checked={props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaReingreso || false} onChange={() => props.handleToggleCheckboxFecha('fechaReingreso')} className="rounded" />
                                        <label htmlFor="ckFechaReingreso" className="text-sm font-medium">F. Reingreso</label>
                                    </div>
                                    <Input type="date" disabled={!props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaReingreso} value={props.datosDepdencias[props.dependenciaSeleccionada].fechaReingreso} onChange={(e) => props.handleActualizarDatosDependencia('fechaReingreso', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                            </div>

                            {/* FILA 6: F. Registro, F. Recoger Dependencia, F. Conclusión */}
                            <div className="grid grid-cols-4 gap-4">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="ckFechaRegistro" checked={props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaRegistro || false} onChange={() => props.handleToggleCheckboxFecha('fechaRegistro')} className="rounded" />
                                        <label htmlFor="ckFechaRegistro" className="text-sm font-medium">F. Registro</label>
                                    </div>
                                    <Input type="date" disabled={!props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaRegistro} value={props.datosDepdencias[props.dependenciaSeleccionada].fechaRegistro} onChange={(e) => props.handleActualizarDatosDependencia('fechaRegistro', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="ckFechaRecogerD" checked={props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaRecogerDependencia || false} onChange={() => props.handleToggleCheckboxFecha('fechaRecogerDependencia')} className="rounded" />
                                        <label htmlFor="ckFechaRecogerD" className="text-sm font-medium">F. Recoger D.</label>
                                    </div>
                                    <Input type="date" disabled={!props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaRecogerDependencia} value={props.datosDepdencias[props.dependenciaSeleccionada].fechaRecogerDependencia} onChange={(e) => props.handleActualizarDatosDependencia('fechaRecogerDependencia', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <input type="checkbox" id="ckFechaConclusión" checked={props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaConclusión || false} onChange={() => props.handleToggleCheckboxFecha('fechaConclusión')} className="rounded" />
                                        <label htmlFor="ckFechaConclusión" className="text-sm font-medium">F. Conclusión</label>
                                    </div>
                                    <Input type="date" disabled={!props.checkboxesFecha[props.dependenciaSeleccionada]?.fechaConclusión} value={props.datosDepdencias[props.dependenciaSeleccionada].fechaConclusión} onChange={(e) => props.handleActualizarDatosDependencia('fechaConclusión', e.target.value)} className="text-sm bg-white dark:bg-white" />
                                </div>
                                <div />
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex gap-3 mt-6">
                            <Button onClick={() => props.setDependenciaSeleccionada(null)} variant="outline" className="text-sm">Cerrar</Button>
                        </div>
                    </div>
                )}
            </TabsContent>
            </Tabs>

            {/* MODAL DE BÚSQUEDA DE CLIENTES PARA COMPARECIENTES */}
            {props.showClienteModalComparecientes &&
                createPortal(
                    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2">
                        <div className="bg-background border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                            {/* Header */}
                            <div className="border-b px-6 py-4 flex items-center justify-between">
                                <h2 className="text-xl font-bold flex items-center gap-2">
                                    <Users className="h-5 w-5" />
                                    Búsqueda de Clientes
                                </h2>
                                <button
                                    onClick={() => props.setShowClienteModalComparecientes(false)}
                                    className="text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Clientes Seleccionados */}
                            {props.clientesSeleccionadosEnModal.length > 0 && (
                                <div className="border-b px-4 py-2 bg-blue-50 dark:bg-blue-900/20">
                                    <h3 className="text-xs font-semibold mb-2 flex items-center gap-2">
                                        <Check className="h-4 w-4 text-green-600" />
                                        Clientes Seleccionados ({props.clientesSeleccionadosEnModal.length})
                                    </h3>
                                    <div className="flex flex-wrap gap-1.5">
                                        {props.clientesSeleccionadosEnModal.map((cliente: any) => (
                                            <div
                                                key={cliente.id}
                                                className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-800 border border-blue-300 rounded-full text-xs"
                                            >
                                                <span className="font-medium">{cliente.nombre} {cliente.apellido_Paterno}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => props.handleRemoverClienteDelModal(cliente.id)}
                                                    className="text-red-500 hover:text-red-700 font-bold"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Body - Búsqueda */}
                            <div className="border-b px-6 py-4 space-y-3">
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <Input
                                            value={props.clienteFiltroComparecientes}
                                            onChange={(e) => props.setClienteFiltroComparecientes(e.target.value)}
                                            placeholder="Buscar por nombre, RFC, CURP..."
                                            className="pr-10 bg-white dark:bg-slate-900/50"
                                            autoFocus
                                        />
                                        {props.clienteFiltroComparecientes && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    props.setClienteFiltroComparecientes('');
                                                    props.setClienteErrorComparecientes(null);
                                                }}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                {props.clienteErrorComparecientes && (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-red-50 border-red-200 text-red-800 text-sm">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{props.clienteErrorComparecientes}</span>
                                    </div>
                                )}
                            </div>

                            {/* Table */}
                            <div className="border rounded-lg overflow-hidden m-2 flex-1">
                                <div className="max-h-[300px] overflow-y-auto overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-200 dark:bg-slate-700 border-b sticky top-0">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                                                <th className="px-4 py-2 text-left font-semibold">RFC</th>
                                                <th className="px-4 py-2 text-left font-semibold">CURP</th>
                                                <th className="px-4 py-2 text-left font-semibold">Tipo</th>
                                                <th className="px-4 py-2 text-center font-semibold w-20">Seleccionar</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {props.isSearchingClientesComparecientes ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                        Cargando clientes...
                                                    </td>
                                                </tr>
                                            ) : clientesFiltradosLocales.filter(c => !props.filasComparecientes.some((f: any) => f.cliente_Id === c.id)).length === 0 ? (
                                                <tr>
                                                    <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                        {props.clienteResultadosComparecientes.length === 0 ? 'No hay clientes disponibles.' : 'No se encontraron resultados.'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                clientesFiltradosLocales.filter(c => !props.filasComparecientes.some((f: any) => f.cliente_Id === c.id)).map((cliente: any) => (
                                                    <tr key={cliente.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                                                        <td className="px-4 py-2 font-medium">{cliente.nombre} {cliente.apellido_Paterno} {cliente.apellido_Materno}</td>
                                                        <td className="px-4 py-2 font-mono text-sm">{cliente.rfc}</td>
                                                        <td className="px-4 py-2 font-mono text-sm">{cliente.curp}</td>
                                                        <td className="px-4 py-2">{cliente.tipo_Cliente}</td>
                                                        <td className="px-4 py-2 text-center">
                                                            <Button
                                                                onClick={() => props.handleSelectClienteFromModalComparecientes(cliente)}
                                                                size="sm"
                                                                disabled={props.clientesSeleccionadosEnModal.some(c => c.id === cliente.id)}
                                                                className={props.clientesSeleccionadosEnModal.some(c => c.id === cliente.id) ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
                                                            >
                                                                {props.clientesSeleccionadosEnModal.some(c => c.id === cliente.id) ? (
                                                                    <>
                                                                        <Check className="h-4 w-4" />
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Plus className="h-4 w-4" />
                                                                    </>
                                                                )}
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="border-t px-6 py-4 flex justify-end gap-2">
                                <Button
                                    onClick={() => props.setShowClienteModalComparecientes(false)}
                                    variant="outline"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={props.handleAgregarClientesSeleccionados}
                                    disabled={props.clientesSeleccionadosEnModal.length === 0}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Agregar {props.clientesSeleccionadosEnModal.length > 0 ? `(${props.clientesSeleccionadosEnModal.length})` : ''}
                                </Button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )}

            {/* BOTONES DE ACCIÓN */}
            <div className="flex justify-end items-center gap-2">
                    <Button
                        onClick={props.handleCancelEdit}
                        variant="outline"
                        className="gap-2"
                    >
                        <X className="h-4 w-4" />
                        Cerrar
                    </Button>
                    <Button
                        onClick={props.handleSaveExpediente}
                        disabled={props.cargando}
                        className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
                    >
                        {props.cargando ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4" />
                                {props.isEditing ? 'Actualizar Expediente' : 'Crear Expediente'}
                            </>
                        )}
                    </Button>
                </div>
                {props.lastSavedTime && (
                    <div className="text-sm text-muted-foreground">
                        Última actualización: {props.lastSavedTime}
                    </div>
                )}

        </div>
    );
}
