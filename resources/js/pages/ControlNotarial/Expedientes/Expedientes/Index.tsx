import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, FileText, ChevronDown, DollarSign,Eye } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
// Opciones de ejemplo para los dropdowns
const TIPO_FACTURA_OPCIONES = [
    { value: 'factura', label: 'Factura' },
    { value: 'complemento', label: 'Complemento' },
];
const TIPO_VULNERABLES_OPCIONES = [
    { value: 'ninguno', label: 'Ninguno' },
    { value: 'vulnerable1', label: 'Vulnerable 1' },
    { value: 'vulnerable2', label: 'Vulnerable 2' },
];
const TIPO_DECLARANOT_OPCIONES = [
    { value: 'casa', label: 'Casa' },
    { value: 'departamento', label: 'Departamento' },
    { value: 'terreno', label: 'Terreno' },
];

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import type { BreadcrumbItem } from '@/types';

interface BusquedaResultado {
    expediente: {
        id: number;
        expediente: string;
        referencia: string;
        fecha_Creacion: string;
    };
    operaciones: Array<{
        descripcion: string;
    }>;
    clientes: Array<{
        nombre: string;
        compareciente: string;
    }>;
}

interface Operacion {
    id: number;
    descripcion: string;
    actividad_Vulnerable_Id: null | number;
    activo: boolean;
}

interface Dependencia {
    id: number;
    descripcion: string;
    activo: boolean;
}

interface Cliente {
    id: number;
    tipo_Cliente: string;
    alias: string;
    nombre: string;
    apellido_Paterno: string;
    apellido_Materno: string;
    rfc: string;
    curp: string;
    activo: boolean;
}

interface Compareciente {
    id: number;
    descripcion: string;
    activo: boolean;
}

interface Documento {
    id: number;
    descripcion: string;
    activo: boolean;
}

interface FilaCompareciente {
    id: string;
    cliente_Id: number;
    nombreCompareciente: string;
    tipoCompareciente: string;
    firmaRequerida: boolean;
    fechaFirma: string;
}

interface DatosDepedencia {
    dependencia: string;
    folioReal: string;
    volumen: string;
    fojas: string;
    seccion: string;
    libro: string;
    observaciones: string;
    fechaIngreso: string;
    folio: string;
    partida: string;
    estatus: string;
    fechaRechazo: string;
    fechaSubsanado: string;
    fechaReingreso: string;
    fechaRegistro: string;
    fechaRecogerDependencia: string;
    fechaConclusión: string;
}

interface Usuario {
    id: number;
    nombre: string;
    apellido_Paterno: string;
    apellido_Materno: string;
    rol: 'NOTARIOS' | 'RESPONSABLES' | 'SECRETARIAS' | 'AUTORIZADOS';
}

interface ExpedienteFormData {
    id?: number;
    expediente: string;
    fecha_creacion: string;
    referencia: string;
    municipio: string;
    operaciones: string[];
    dependencias: string[];
    observaciones: string;
    notario: string;
    responsable: string;
    secretaria: string;
    autorizado: string;
    estatus: string;
    motivoCancelacion: string;
    ultima_etapa: string;
    financiamiento_con: boolean;
    financiamiento_monto: number;
    tipoEscritura: string;
    numeroEscritura: string;
    foliosRequeridos: number;
    folioInicial: number;
    folioFinal: number;
    volumen: number;
    tomo: number;
    foliosInutilizados: number;
    fechaEscritura: string;
    fechaFirma: string;
    fechaElaboracion: string;
    fechaRevision: string;
    fechaImpresion: string;
    firmarTodos: string;
    noPaso: boolean;
    nopasoMotivo: string;
}

// Componente de Label para campos requeridos
const RequiredLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
    <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-medium">
        {children}
        <span className="text-red-500">*</span>
    </label>
);

export default function ExpedientesIndex() {
    // --- Estado pestaña Búsqueda ---
    const [filtro, setFiltro] = useState('');
    const [resultados, setResultados] = useState<BusquedaResultado[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // --- Control de pestaña activa ---
    const [activeTab, setActiveTab] = useState('busqueda');

    // --- Estado pestaña Formulario ---
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [formData, setFormData] = useState<ExpedienteFormData>({
        expediente: '',
        fecha_creacion: new Date().toISOString().split('T')[0],
        referencia: '',
        municipio: '',
        operaciones: [],
        dependencias: [],
        observaciones: '',
        notario: '',
        responsable: '',
        secretaria: '',
        autorizado: '',
        estatus: '',
        motivoCancelacion: '',
        ultima_etapa: '',
        financiamiento_con: false,
        financiamiento_monto: 0,
        tipoEscritura: '',
        numeroEscritura: '',
        foliosRequeridos: 0,
        folioInicial: 0,
        folioFinal: 0,
        volumen: 0,
        tomo: 0,
        foliosInutilizados: 0,
        fechaEscritura: '',
        fechaFirma: '',
        fechaElaboracion: '',
        fechaRevision: '',
        fechaImpresion: '',
        firmarTodos: '',
        noPaso: false,
        nopasoMotivo: '',
    });

    // --- Estado Combobox Operaciones ---
    const [operacionesDisponibles, setOperacionesDisponibles] = useState<Operacion[]>([]);
    const [operacionesFiltradas, setOperacionesFiltradas] = useState<Operacion[]>([]);
    const [operacionBusqueda, setOperacionBusqueda] = useState('');
    const [mostrarDropdownOperaciones, setMostrarDropdownOperaciones] = useState(false);
    const [cargandoOperaciones, setCargandoOperaciones] = useState(false);
    const refDropdownOperaciones = useRef<HTMLDivElement>(null);

    // --- Estado Combobox Municipios ---
    const [municipiosDisponibles, setMunicipiosDisponibles] = useState<Dependencia[]>([]);
    const [municipiosFiltrados, setMunicipiosFiltrados] = useState<Dependencia[]>([]);
    const [municipioBusqueda, setMunicipioBusqueda] = useState('');
    const [mostrarDropdownMunicipios, setMostrarDropdownMunicipios] = useState(false);
    const [cargandoMunicipios, setCargandoMunicipios] = useState(false);
    const refDropdownMunicipios = useRef<HTMLDivElement>(null);

    // --- Estado Combobox Dependencias ---
    const [dependenciasDisponibles, setDependenciasDisponibles] = useState<Dependencia[]>([]);
    const [dependenciasFiltradas, setDependenciasFiltradas] = useState<Dependencia[]>([]);
    const [dependenciaBusqueda, setDependenciaBusqueda] = useState('');
    const [mostrarDropdownDependencias, setMostrarDropdownDependencias] = useState(false);
    const [cargandoDependencias, setCargandoDependencias] = useState(false);
    const refDropdownDependencias = useRef<HTMLDivElement>(null);
    const [datosDepdencias, setDatosDepdencias] = useState<Record<string, DatosDepedencia>>({});
    const [dependenciaSeleccionada, setDependenciaSeleccionada] = useState<string | null>(null);
    const [checkboxesFecha, setCheckboxesFecha] = useState<Record<string, Record<string, boolean>>>({});

    // Estados para Comparecientes
    const [clientesDisponibles, setClientesDisponibles] = useState<Cliente[]>([]);
    const [clientesFiltrados, setClientesFiltrados] = useState<Cliente[]>([]);
    const [clienteBusqueda, setClienteBusqueda] = useState('');
    const [mostrarDropdownClientes, setMostrarDropdownClientes] = useState(false);
    const [cargandoClientes, setCargandoClientes] = useState(false);
    const refDropdownClientes = useRef<HTMLDivElement>(null);
    const [comparecientesDisponibles, setComparecientesDisponibles] = useState<Compareciente[]>([]);
    const [filasComparecientes, setFilasComparecientes] = useState<FilaCompareciente[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<Cliente | null>(null);
    const [dropdownTipoAbierto, setDropdownTipoAbierto] = useState<Record<string, boolean>>({});
    const [busquedaTipo, setBusquedaTipo] = useState<Record<string, string>>({});

    // --- Estados para Documentos ---
    const [mostrarDropdownOtorgante, setMostrarDropdownOtorgante] = useState(false);
    const [busquedaOtorgante, setBusquedaOtorgante] = useState('');
    const [otorganteSeleccionado, setOtorganteSeleccionado] = useState<Cliente | null>(null);
    const [filasDocumentos, setFilasDocumentos] = useState<Record<number, {
        descripcion: string;
        entregaCheck: boolean;
        entregaFecha: string;
        usuRecibe: boolean;
        copia: boolean;
        original: boolean;
        recepcionCheck: boolean;
        recepcionFecha: string;
        abogadoRec: boolean;
        observaciones: string;
    }>>({});

    // --- Estado Fechas Habilitadas en Datos Escritura ---
    const [enabledDates, setEnabledDates] = useState({
        fechaEscritura: false,
        fechaFirma: false,
        fechaElaboracion: false,
        fechaRevision: false,
        fechaImpresion: false,
        firmarTodos: false,
    });

    // --- Estado Usuarios y Dropdowns ---
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [notariosFiltrados, setNotariosFiltrados] = useState<Usuario[]>([]);
    const [responsablesFiltrados, setResponsablesFiltrados] = useState<Usuario[]>([]);
    const [secretariasFiltradas, setSecretariasFiltradas] = useState<Usuario[]>([]);
    const [autorizadosFiltrados, setAutorizadosFiltrados] = useState<Usuario[]>([]);

    const [busquedaNotario, setBusquedaNotario] = useState('');
    const [busquedaResponsable, setBusquedaResponsable] = useState('');
    const [busquedaSecretaria, setBusquedaSecretaria] = useState('');
    const [busquedaAutorizado, setBusquedaAutorizado] = useState('');

    const [mostrarDropdownNotario, setMostrarDropdownNotario] = useState(false);
    const [mostrarDropdownResponsable, setMostrarDropdownResponsable] = useState(false);
    const [mostrarDropdownSecretaria, setMostrarDropdownSecretaria] = useState(false);
    const [mostrarDropdownAutorizado, setMostrarDropdownAutorizado] = useState(false);

    const [cargandoUsuarios, setCargandoUsuarios] = useState(false);
    const refDropdownNotario = useRef<HTMLDivElement>(null);
    const refDropdownResponsable = useRef<HTMLDivElement>(null);
    const refDropdownSecretaria = useRef<HTMLDivElement>(null);
    const refDropdownAutorizado = useRef<HTMLDivElement>(null);
    const initializedUsers = useRef(false);

    // --- Estados para guardar IDs de usuarios ---
    const [notarioId, setNotarioId] = useState<number | null>(null);
    const [responsableId, setResponsableId] = useState<number | null>(null);
    const [secretariaId, setSecretariaId] = useState<number | null>(null);
    const [autorizadoId, setAutorizadoId] = useState<number | null>(null);
    const [municipioId, setMunicipioId] = useState<number | null>(null);
    const [operacionesIds, setOperacionesIds] = useState<number[]>([]);

    // --- Estado para guardar ID del expediente actual ---
    const [currentExpedienteId, setCurrentExpedienteId] = useState<number | null>(null);

    // --- Estados para Documentos por Cliente (Expediente) ---
    const [documentosPorCliente, setDocumentosPorCliente] = useState<Array<{
        expediente: string;
        id_Cliente: number;
        cliente: string;
        documentos: Array<{
            id: number;
            cliente_Id: number;
            documento_Id: number;
            documento: string;
            fecha_Entrega: string | null;
            usuario_Recibe: string | null;
            fecha_Recepcion: string | null;
            usuario_Recepcion: string | null;
            observaciones: string | null;
            copia: boolean;
            original: boolean;
        }>;
    }>>([]);
    const [cargandoDocumentosExpediente, setCargandoDocumentosExpediente] = useState(false);
    const [clienteSeleccionadoDocumentos, setClienteSeleccionadoDocumentos] = useState<number | null>(null);
    const [documentosEditados, setDocumentosEditados] = useState<Record<number, {
        cliente_Id: number;
        documento_Id: number;
        fecha_Entrega: string | null;
        usuario_Recibe: string | null;
        fecha_Recepcion: string | null;
        usuario_Recepcion: string | null;
        observaciones: string | null;
        copia: boolean;
        original: boolean;
    }>>({})

    // --- Estados para Inmuebles (Documentos tab) ---
    const [selectedInmueble, setSelectedInmueble] = useState<number | null>(null);
    const [formInmueble, setFormInmueble] = useState({
        tipoFactura: '',
        tipoVulnerable: '',
        tipoDeclaranot: '',
        medidas: '',
        antecedentes: '',
        descripcion: '',
    });

    // --- Estados para Documentos Disponibles ---
    const [documentosDisponibles, setDocumentosDisponibles] = useState<Documento[]>([]);
    const [cargandoDocumentosDisponibles, setCargandoDocumentosDisponibles] = useState(false);
    const [mostrarModalAgregarDocumento, setMostrarModalAgregarDocumento] = useState(false);
    const [documentoSeleccionadoParaAgregar, setDocumentoSeleccionadoParaAgregar] = useState<Documento | null>(null);
    const [documentosSeleccionados, setDocumentosSeleccionados] = useState<Record<number, boolean>>({});

    // Estado para modal de recibo de documentos
    const [showReciboModal, setShowReciboModal] = useState(false);
    const [reciboUrl, setReciboUrl] = useState<string | null>(null);
    const [isLoadingRecibo, setIsLoadingRecibo] = useState(false);

    // Ref para debounce de actualización de documentos individuales
    const debounceTimersRef = useRef<Record<number, NodeJS.Timeout>>({});

    const { addToast } = useToast();

    // Cargar expedientes al montar (filtro vacío = todos)
    useEffect(() => {
        fetchExpedientes('');
        fetchOperaciones();
        fetchMunicipios();
        fetchUsuarios();
        fetchDependencias();
        fetchClientes();
        fetchComparecientes();

        // Cleanup de timers al desmontar
        return () => {
            Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

    // Cargar operaciones disponibles desde API
    const fetchOperaciones = async () => {
        setCargandoOperaciones(true);
        try {
            const response = await fetch('https://localhost:44327/api/Catalogos/GetOperaciones', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok && data.dataResponse) {
                setOperacionesDisponibles(data.dataResponse);
                setOperacionesFiltradas(data.dataResponse);
            }
        } catch (error) {
            console.error('Error cargando operaciones:', error);
        } finally {
            setCargandoOperaciones(false);
        }
    };

    // Cargar municipios disponibles desde API
    const fetchMunicipios = async () => {
        setCargandoMunicipios(true);
        try {
            const response = await fetch('https://localhost:44327/api/Catalogos/GetZonasMunicipios', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok && data.dataResponse) {
                setMunicipiosDisponibles(data.dataResponse);
                setMunicipiosFiltrados(data.dataResponse);
            }
        } catch (error) {
            console.error('Error cargando municipios:', error);
        } finally {
            setCargandoMunicipios(false);
        }
    };

    // Cargar usuarios disponibles desde API
    const fetchUsuarios = async () => {
        setCargandoUsuarios(true);
        try {
            const response = await fetch('https://localhost:44327/api/User/GetRolesUsuarios', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok && data.dataResponse) {
                setUsuarios(data.dataResponse);
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
        } finally {
            setCargandoUsuarios(false);
        }
    };

    // Cargar dependencias disponibles desde API
    const fetchDependencias = async () => {
        setCargandoDependencias(true);
        try {
            const response = await fetch('https://localhost:44327/api/Catalogos/GetDependenciasPublicas', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok && data.dataResponse) {
                setDependenciasDisponibles(data.dataResponse);
                setDependenciasFiltradas(data.dataResponse);
            }
        } catch (error) {
            console.error('Error cargando dependencias:', error);
        } finally {
            setCargandoDependencias(false);
        }
    };

    const fetchClientes = async () => {
        setCargandoClientes(true);
        try {
            const response = await fetch('https://localhost:44327/api/Clientes/GetClientes', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok && data.dataResponse) {
                setClientesDisponibles(data.dataResponse);
                setClientesFiltrados(data.dataResponse);
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
        } finally {
            setCargandoClientes(false);
        }
    };

    const fetchComparecientes = async () => {
        try {
            const response = await fetch('https://localhost:44327/api/Catalogos/GetComparecientes', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            console.log('Respuesta Comparecientes:', data);

            if (response.ok) {
                // Manejar diferentes formatos de respuesta
                const comparecientes = data.dataResponse || data.data || data;
                if (Array.isArray(comparecientes)) {
                    setComparecientesDisponibles(comparecientes);
                    console.log('Comparecientes cargados:', comparecientes);
                } else {
                    console.warn('Formato de respuesta inesperado para comparecientes');
                }
            } else {
                console.error('Error en respuesta del servidor:', data);
            }
        } catch (error) {
            console.error('Error cargando comparecientes:', error);
            addToast('No se pudieron cargar los comparecientes', 'error');
        }
    };

    // Cargar documentos disponibles desde API
    const fetchDocumentosDisponibles = async () => {
        setCargandoDocumentosDisponibles(true);
        try {
            const response = await fetch('https://localhost:44327/api/Catalogos/GetDocumentos', {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok && data.dataResponse) {
                setDocumentosDisponibles(data.dataResponse);
                setMostrarModalAgregarDocumento(true);
            } else {
                addToast('No se pudieron cargar los documentos disponibles', 'error');
            }
        } catch (error) {
            console.error('Error cargando documentos disponibles:', error);
            addToast('Error cargando documentos', 'error');
        } finally {
            setCargandoDocumentosDisponibles(false);
        }
    };

    // Obtener nombres de documentos ya agregados en todas las tablas
    const obtenerDocumentosAgregados = (): Set<string> => {
        const documentosAgregados = new Set<string>();
        documentosPorCliente.forEach(grupoCliente => {
            grupoCliente.documentos.forEach(doc => {
                documentosAgregados.add(doc.documento);
            });
        });
        return documentosAgregados;
    };

    // Agregar un documento a todas las tablas de clientes
    const handleAgregarDocumentoATodas = (documento: Documento) => {
        setDocumentosPorCliente(prevDocumentos =>
            prevDocumentos.map(grupoCliente => ({
                ...grupoCliente,
                documentos: [
                    ...grupoCliente.documentos,
                    {
                        id: Date.now() + Math.floor(Math.random() * 1000000),
                        cliente_Id: grupoCliente.id_Cliente,
                        documento_Id: documento.id,
                        documento: documento.descripcion,
                        fecha_Entrega: null,
                        usuario_Recibe: null,
                        fecha_Recepcion: null,
                        usuario_Recepcion: null,
                        observaciones: null,
                        copia: false,
                        original: false,
                    }
                ]
            }))
        );
        addToast(`Documento "${documento.descripcion}" agregado a todas las tablas`, 'success');
    };

    // Agregar múltiples documentos seleccionados
    const handleAgregarDocumentosSeleccionados = async () => {
        const documentosAgregar = documentosDisponibles.filter(doc => documentosSeleccionados[doc.id]);

        if (documentosAgregar.length === 0) {
            addToast('Selecciona al menos un documento', 'warning');
            return;
        }

        // Calcular el nuevo estado con los documentos agregados
        let nuevoEstadoDocumentos = documentosPorCliente.map(grupoCliente => ({
            ...grupoCliente,
            documentos: [...grupoCliente.documentos]
        }));

        // Agregar cada documento a todos los grupos de клиentes
        documentosAgregar.forEach(doc => {
            nuevoEstadoDocumentos = nuevoEstadoDocumentos.map(grupoCliente => ({
                ...grupoCliente,
                documentos: [
                    ...grupoCliente.documentos,
                    {
                        id: Date.now() + Math.floor(Math.random() * 1000000),
                        cliente_Id: grupoCliente.id_Cliente,
                        documento_Id: doc.id,
                        documento: doc.descripcion,
                        fecha_Entrega: null,
                        usuario_Recibe: null,
                        fecha_Recepcion: null,
                        usuario_Recepcion: null,
                        observaciones: null,
                        copia: false,
                        original: false,
                    }
                ]
            }));
        });

        // Actualizar el state
        setDocumentosPorCliente(nuevoEstadoDocumentos);

        // Limpiar selección y cerrar modal
        setDocumentosSeleccionados({});
        setMostrarModalAgregarDocumento(false);

        // Si existe un expedienteId, actualizar en la API con los documentos ya agregados
        if (currentExpedienteId) {
            // Pasar el nuevo estado directamente como override
            setTimeout(async () => {
                await handleActualizarDocumentosExpediente(currentExpedienteId, nuevoEstadoDocumentos);
                // Recargar los documentos desde la API para obtener los IDs correctos
                await fetchDocumentosExpediente(currentExpedienteId);
            }, 100);
        }
    };

    // Eliminar un documento de todas las tablas de clientes
    const handleEliminarDocumentoDeAll = async (nombreDocumento: string) => {
        // Crear los nuevos documentos filtrados
        const nuevosDocs = documentosPorCliente.map(grupoCliente => ({
            ...grupoCliente,
            documentos: grupoCliente.documentos.filter(doc => doc.documento !== nombreDocumento)
        }));

        // Actualizar el estado
        setDocumentosPorCliente(nuevosDocs);
        // addToast(`Documento "${nombreDocumento}" eliminado de todas las tablas`, 'success');

        // Si existe un expedienteId, actualizar en la API con los documentos ya filtrados
        if (currentExpedienteId) {
            await handleActualizarDocumentosExpediente(currentExpedienteId, nuevosDocs);
            // Recargar la lista de documentos desde la API
            await fetchDocumentosExpediente(currentExpedienteId);
        }
    };

    // Abrir modal y cargar recibo de documentos
    const handleAbrirReciboDocumentos = async () => {
        if (!currentExpedienteId || !clienteSeleccionadoDocumentos) {
            addToast('Selecciona un cliente para visualizar el recibo', 'warning');
            return;
        }

        try {
            setIsLoadingRecibo(true);
            const response = await fetch(
                `https://localhost:44327/api/Expediente/GenerateReciboDocumentosExpediente?expedienteId=${currentExpedienteId}&clienteId=${clienteSeleccionadoDocumentos}`,
                { method: 'GET' }
            );

            if (!response.ok) {
                throw new Error('Error al generar el recibo');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setReciboUrl(url);
            setShowReciboModal(true);
            addToast('Recibo cargado correctamente', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al generar el recibo';
            addToast(message, 'error');
            console.error('Error:', error);
        } finally {
            setIsLoadingRecibo(false);
        }
    };

    // Cerrar modal de recibo
    const closeReciboModal = () => {
        setShowReciboModal(false);
        if (reciboUrl) {
            URL.revokeObjectURL(reciboUrl);
            setReciboUrl(null);
        }
    };

    // Actualizar documentos del expediente en la API
    const handleActualizarDocumentosExpediente = async (
        expedienteId: number,
        docsOverride?: typeof documentosPorCliente
    ) => {
        try {
            // Usar los documentos pasados como parámetro o los del state
            const docsToUse = docsOverride || documentosPorCliente;

            // Construir el payload con todos los documentos de todas las tablas
            const documentosPayload: Array<{
                cliente_Id: number;
                documento_Id: number;
                fecha_Entrega: string | null;
                usuario_Recibe_Id: number | null;
                fecha_Recepcion: string | null;
                usuario_Recepcion_Id: number | null;
                observaciones: string | null;
                copia: boolean;
                original: boolean;
            }> = [];

            docsToUse.forEach(grupoCliente => {
                grupoCliente.documentos.forEach(doc => {
                    const docEditado = documentosEditados[doc.id] || {
                        fecha_Entrega: doc.fecha_Entrega,
                        usuario_Recibe: doc.usuario_Recibe,
                        fecha_Recepcion: doc.fecha_Recepcion,
                        usuario_Recepcion: doc.usuario_Recepcion,
                        observaciones: doc.observaciones,
                        copia: doc.copia,
                        original: doc.original,
                    };

                    documentosPayload.push({
                        cliente_Id: doc.cliente_Id,
                        documento_Id: doc.documento_Id,
                        fecha_Entrega: docEditado.fecha_Entrega || null,
                        usuario_Recibe_Id: docEditado.usuario_Recibe ? parseInt(docEditado.usuario_Recibe) || 0 : null,
                        fecha_Recepcion: docEditado.fecha_Recepcion || null,
                        usuario_Recepcion_Id: docEditado.usuario_Recepcion ? parseInt(docEditado.usuario_Recepcion) || 0 : null,
                        observaciones: docEditado.observaciones || null,
                        copia: docEditado.copia,
                        original: docEditado.original,
                    });
                });
            });

            const response = await fetch(
                `https://localhost:44327/api/Expediente/UpdateDocumentoClienteXExpediente?expedienteId=${expedienteId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(documentosPayload),
                }
            );

            if (response.ok) {
                addToast('Documentos actualizados exitosamente', 'success');
            } else {
                const errorData = await response.json();
                console.error('Error al actualizar documentos:', errorData);
                addToast('Error al actualizar documentos: ' + (errorData.message || 'Error desconocido'), 'error');
            }
        } catch (error) {
            console.error('Error actualizando documentos:', error);
            addToast('Error actualizando documentos', 'error');
        }
    };

    // Actualizar un documento individual
    const handleActualizarDocumentoIndividual = async (
        docsId: number,
        cambios: {
            fecha_Entrega: string | null;
            usuario_Recibe: string | null;
            fecha_Recepcion: string | null;
            usuario_Recepcion: string | null;
            observaciones: string | null;
            copia: boolean;
            original: boolean;
        }
    ) => {
        try {
            const payload = {
                fecha_Entrega: cambios.fecha_Entrega || null,
                usuario_Recibe_Id: cambios.usuario_Recibe ? parseInt(cambios.usuario_Recibe) || 0 : 0,
                fecha_Recepcion: cambios.fecha_Recepcion || null,
                usuario_Recepcion_Id: cambios.usuario_Recepcion ? parseInt(cambios.usuario_Recepcion) || 0 : 0,
                observaciones: cambios.observaciones || null,
                copia: cambios.copia,
                original: cambios.original,
            };

            const response = await fetch(
                `https://localhost:44327/api/Expediente/UpdateDocumentoXExpediente?documentoId=${docsId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(payload),
                }
            );

            if (response.ok) {
                  addToast('Documento actualizado exitosamente', 'success');
                console.log(`Documento ${docsId} actualizado exitosamente`);
            } else {
                const errorData = await response.json();
                console.error(`Error al actualizar documento ${docsId}:`, errorData);
            }
        } catch (error) {
            console.error(`Error actualizando documento ${docsId}:`, error);
        }
    };

    // Handler para cambios de documento con debounce por documento específico
    const handleDocumentoChange = (docId: number, field: string, value: any) => {
        // Actualizar el estado local
        setDocumentosEditados(prev => ({
            ...prev,
            [docId]: {
                ...prev[docId],
                [field]: value
            }
        }));

        // Si no hay expediente ID aún, no ejecutar API
        if (!currentExpedienteId) return;

        // Limpiar timer anterior para este documento específico
        if (debounceTimersRef.current[docId]) {
            clearTimeout(debounceTimersRef.current[docId]);
        }

        // Crear nuevo timer para este documento
        debounceTimersRef.current[docId] = setTimeout(() => {
            const docEditado = documentosEditados[docId] || {
                fecha_Entrega: null,
                usuario_Recibe: null,
                fecha_Recepcion: null,
                usuario_Recepcion: null,
                observaciones: null,
                copia: false,
                original: false,
            };

            handleActualizarDocumentoIndividual(docId, {
                ...docEditado,
                [field]: value
            });

            // Limpiar timer del registro
            delete debounceTimersRef.current[docId];
        }, 1000);
    };

    // Filtrar usuarios por búsqueda
    const filtrarUsuarios = (usuariosList: Usuario[], busqueda: string) => {
        if (!busqueda.trim()) return usuariosList;
        const searchLower = busqueda.toLowerCase();
        return usuariosList.filter(u =>
            `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}`.toLowerCase().includes(searchLower)
        );
    };

    // Seleccionar automáticamente el primer resultado de cada rol al cargar
    useEffect(() => {
        if (usuarios.length > 0 && !initializedUsers.current) {
            const notarios = usuarios.filter(u => u.rol === 'NOTARIOS');
            const responsables = usuarios.filter(u => u.rol === 'RESPONSABLES');
            const secretarias = usuarios.filter(u => u.rol === 'SECRETARIAS');
            const autorizados = usuarios.filter(u => u.rol === 'AUTORIZADOS');

            if (notarios.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    notario: `${notarios[0].nombre} ${notarios[0].apellido_Paterno} ${notarios[0].apellido_Materno}`,
                }));
                setNotarioId(notarios[0].id);
            }

            if (responsables.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    responsable: `${responsables[0].nombre} ${responsables[0].apellido_Paterno} ${responsables[0].apellido_Materno}`,
                }));
                setResponsableId(responsables[0].id);
            }

            if (secretarias.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    secretaria: `${secretarias[0].nombre} ${secretarias[0].apellido_Paterno} ${secretarias[0].apellido_Materno}`,
                }));
                setSecretariaId(secretarias[0].id);
            }

            if (autorizados.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    autorizado: `${autorizados[0].nombre} ${autorizados[0].apellido_Paterno} ${autorizados[0].apellido_Materno}`,
                }));
                setAutorizadoId(autorizados[0].id);
            }

            initializedUsers.current = true;
        }
    }, [usuarios]);

    // Manejar búsqueda de notarios
    useEffect(() => {
        const notarios = usuarios.filter(u => u.rol === 'NOTARIOS');
        setNotariosFiltrados(filtrarUsuarios(notarios, busquedaNotario));
    }, [busquedaNotario, usuarios]);

    // Manejar búsqueda de responsables
    useEffect(() => {
        const responsables = usuarios.filter(u => u.rol === 'RESPONSABLES');
        setResponsablesFiltrados(filtrarUsuarios(responsables, busquedaResponsable));
    }, [busquedaResponsable, usuarios]);

    // Manejar búsqueda de secretarias
    useEffect(() => {
        const secretarias = usuarios.filter(u => u.rol === 'SECRETARIAS');
        setSecretariasFiltradas(filtrarUsuarios(secretarias, busquedaSecretaria));
    }, [busquedaSecretaria, usuarios]);

    // Manejar búsqueda de autorizados
    useEffect(() => {
        const autorizados = usuarios.filter(u => u.rol === 'AUTORIZADOS');
        setAutorizadosFiltrados(filtrarUsuarios(autorizados, busquedaAutorizado));
    }, [busquedaAutorizado, usuarios]);

    // Filtrar operaciones mientras se escribe
    useEffect(() => {
        if (operacionBusqueda.trim() === '') {
            setOperacionesFiltradas(operacionesDisponibles);
        } else {
            const filtradas = operacionesDisponibles.filter(op =>
                op.descripcion.toLowerCase().includes(operacionBusqueda.toLowerCase())
            );
            setOperacionesFiltradas(filtradas);
        }
    }, [operacionBusqueda, operacionesDisponibles]);

    // Filtrar municipios mientras se escribe
    useEffect(() => {
        if (municipioBusqueda.trim() === '') {
            setMunicipiosFiltrados(municipiosDisponibles);
        } else {
            const filtrados = municipiosDisponibles.filter(mun =>
                mun.descripcion.toLowerCase().includes(municipioBusqueda.toLowerCase())
            );
            setMunicipiosFiltrados(filtrados);
        }
    }, [municipioBusqueda, municipiosDisponibles]);

    // Filtrar dependencias mientras se escribe
    useEffect(() => {
        if (dependenciaBusqueda.trim() === '') {
            setDependenciasFiltradas(dependenciasDisponibles);
        } else {
            const filtradas = dependenciasDisponibles.filter(dep =>
                dep.descripcion.toLowerCase().includes(dependenciaBusqueda.toLowerCase())
            );
            setDependenciasFiltradas(filtradas);
        }
    }, [dependenciaBusqueda, dependenciasDisponibles]);

    // Filtrar clientes por búsqueda
    useEffect(() => {
        if (clienteBusqueda.trim() === '') {
            setClientesFiltrados(clientesDisponibles);
        } else {
            const filtrados = clientesDisponibles.filter(cliente => {
                const nombreCompleto = `${cliente.nombre} ${cliente.apellido_Paterno} ${cliente.apellido_Materno}`.toLowerCase();
                const alias = cliente.alias.toLowerCase();
                const rfc = cliente.rfc.toLowerCase();
                return nombreCompleto.includes(clienteBusqueda.toLowerCase()) ||
                       alias.includes(clienteBusqueda.toLowerCase()) ||
                       rfc.includes(clienteBusqueda.toLowerCase());
            });
            setClientesFiltrados(filtrados);
        }
    }, [clienteBusqueda, clientesDisponibles]);

    // Búsqueda dinámica: actualizar resultados cuando cambia el filtro
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchExpedientes(filtro);
        }, 300); // Esperar 300ms después de que el usuario deje de escribir

        return () => clearTimeout(debounceTimer);
    }, [filtro]);

    // Auto-seleccionar el primer cliente cuando se cargan los documentos
    useEffect(() => {
        if (documentosPorCliente && documentosPorCliente.length > 0 && !clienteSeleccionadoDocumentos) {
            setClienteSeleccionadoDocumentos(documentosPorCliente[0].id_Cliente);
        }
    }, [documentosPorCliente]);

    // Inicializar documentosEditados con valores del documento cuando se cargan
    useEffect(() => {
        const nuevosEditados: Record<number, any> = {};
        documentosPorCliente.forEach(grupoCliente => {
            grupoCliente.documentos.forEach(doc => {
                if (!documentosEditados[doc.id]) {
                    nuevosEditados[doc.id] = {
                        cliente_Id: doc.cliente_Id,
                        documento_Id: doc.documento_Id,
                        fecha_Entrega: doc.fecha_Entrega,
                        usuario_Recibe: doc.usuario_Recibe,
                        fecha_Recepcion: doc.fecha_Recepcion,
                        usuario_Recepcion: doc.usuario_Recepcion,
                        observaciones: doc.observaciones,
                        copia: doc.copia,
                        original: doc.original,
                    };
                }
            });
        });
        if (Object.keys(nuevosEditados).length > 0) {
            setDocumentosEditados(prev => ({ ...prev, ...nuevosEditados }));
        }
    }, [documentosPorCliente]);

    const fetchDocumentosExpediente = async (expedienteId: number) => {
        setCargandoDocumentosExpediente(true);
        try {
            const response = await fetch(`https://localhost:44327/api/Expediente/GetDocumentosClienteXExpediente?expedienteId=${expedienteId}`, {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok && data.dataResponse) {
                setDocumentosPorCliente(data.dataResponse);
            } else {
                console.error('Error al cargar documentos:', data.message);
                setDocumentosPorCliente([]);
            }
        } catch (error) {
            console.error('Error cargando documentos:', error);
            setDocumentosPorCliente([]);
        } finally {
            setCargandoDocumentosExpediente(false);
        }
    };

    const fetchExpedientes = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const url = new URL('https://localhost:44327/api/Expediente/GetExpediente');
            if (filtroValue) {
                url.searchParams.append('filtro', filtroValue);
            }
            const response = await fetch(url.toString(), {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok) {
                setResultados(data.dataResponse || []);
            } else {
                setSearchError(data.message || 'No se pudieron cargar los expedientes.');
                setResultados([]);
            }
        } catch (error) {
            console.error('Error buscando expedientes:', error);
            setSearchError('No se pudieron cargar los expedientes. Verifica la conexión con el servidor.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchExpedientes(filtro);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleCancelEdit = () => {
        setFormData({
            expediente: '',
            fecha_creacion: new Date().toISOString().split('T')[0],
            referencia: '',
            municipio: '',
            operaciones: [],
            dependencias: [],
            observaciones: '',
            notario: '',
            responsable: '',
            secretaria: '',
            autorizado: '',
            estatus: '',
            motivoCancelacion: '',
            ultima_etapa: '',
            financiamiento_con: false,
            financiamiento_monto: 0,
            tipoEscritura: '',
            numeroEscritura: '',
            foliosRequeridos: 0,
            folioInicial: 0,
            folioFinal: 0,
            volumen: 0,
            tomo: 0,
            foliosInutilizados: 0,
            fechaEscritura: '',
            fechaFirma: '',
            fechaElaboracion: '',
            fechaRevision: '',
            fechaImpresion: '',
            firmarTodos: '',
            noPaso: false,
            nopasoMotivo: '',
        });
        setOperacionBusqueda('');
        setMostrarDropdownOperaciones(false);
        setMunicipioBusqueda('');
        setMostrarDropdownMunicipios(false);
        setDependenciaBusqueda('');
        setMostrarDropdownDependencias(false);
        setDatosDepdencias({});
        setDependenciaSeleccionada(null);
        setIsEditing(false);
        setSaveError(null);
        setActiveTab('busqueda');
        setNotarioId(null);
        setResponsableId(null);
        setSecretariaId(null);
        setAutorizadoId(null);
        setOperacionesIds([]);
    };

    const handleLoadExpediente = async (expedienteId: number) => {
        try {
            const response = await fetch(`https://localhost:44327/api/Expediente/GetExpedienteById?expedienteId=${expedienteId}`);
            const data = await response.json();

            if (!response.ok || !data.dataResponse || data.dataResponse.length === 0) {
                setSaveError('Error al cargar el expediente');
                return;
            }

            const fullData = data.dataResponse[0];
            const expediente = fullData.expediente;

            // Cargar datos principales del formulario
            setFormData(prev => ({
                ...prev,
                expediente: expediente.expediente || '',
                referencia: expediente.referencia || '',
                municipio: expediente.municipio || '',
                observaciones: expediente.observaciones || '',
                notario: expediente.notario || '',
                responsable: expediente.responsable || '',
                secretaria: expediente.secretaria || '',
                autorizado: expediente.autorizado || '',
                estatus: expediente.estatus || '',
                tipoEscritura: expediente.tipo_Escritura || '',
                numeroEscritura: expediente.escritura_Numero?.toString() || '',
                folioInicial: expediente.folio_Inicial || 0,
                folioFinal: expediente.folio_Final || 0,
                volumen: expediente.volumen || 0,
                tomo: expediente.tomo || 0,
                fechaEscritura: expediente.fecha_Escritura ? expediente.fecha_Escritura.split('T')[0] : '',
                fechaFirma: expediente.fecha_Firma ? expediente.fecha_Firma.split('T')[0] : '',
                fechaElaboracion: expediente.fecha_Elaboracion ? expediente.fecha_Elaboracion.split('T')[0] : '',
                fechaRevision: expediente.fecha_Revision ? expediente.fecha_Revision.split('T')[0] : '',
                fechaImpresion: expediente.fecha_Impresion ? expediente.fecha_Impresion.split('T')[0] : '',
                firmarTodos: expediente.fecha_Firma_Todos ? expediente.fecha_Firma_Todos.split('T')[0] : '',
            }));

            // Buscar y establecer IDs de usuarios
            const notarioEncontrado = usuarios.find(u => u.nombre + ' ' + u.apellido_Paterno + ' ' + u.apellido_Materno === expediente.notario);
            if (notarioEncontrado) setNotarioId(notarioEncontrado.id);

            const responsableEncontrado = usuarios.find(u => u.nombre + ' ' + u.apellido_Paterno + ' ' + u.apellido_Materno === expediente.responsable);
            if (responsableEncontrado) setResponsableId(responsableEncontrado.id);

            const secretariaEncontrada = usuarios.find(u => u.nombre + ' ' + u.apellido_Paterno + ' ' + u.apellido_Materno === expediente.secretaria);
            if (secretariaEncontrada) setSecretariaId(secretariaEncontrada.id);

            const autorizadoEncontrado = usuarios.find(u => u.nombre + ' ' + u.apellido_Paterno + ' ' + u.apellido_Materno === expediente.autorizado);
            if (autorizadoEncontrado) setAutorizadoId(autorizadoEncontrado.id);

            // Cargar operaciones
            if (fullData.operaciones && fullData.operaciones.length > 0) {
                const operacionesDescripciones = fullData.operaciones.map((op: any) => op.descripcion);
                setFormData(prev => ({ ...prev, operaciones: operacionesDescripciones }));

                // Obtener IDs de operaciones
                const opsIds = operacionesDisponibles
                    .filter(op => operacionesDescripciones.includes(op.descripcion))
                    .map(op => op.id);
                setOperacionesIds(opsIds);
            }

            // Cargar comparecientes (clientes)
            if (fullData.clientes && fullData.clientes.length > 0) {
                const comparecientes = fullData.clientes.map((cliente: any, idx: number) => {
                    // Buscar el cliente en la lista disponible para obtener su ID
                    const clienteEncontrado = clientesDisponibles.find(c =>
                        `${c.nombre} ${c.apellido_Paterno} ${c.apellido_Materno}`.trim() === cliente.nombre.trim()
                    );
                    return {
                        id: `${Date.now()}-${idx}`,
                        cliente_Id: clienteEncontrado?.id || 0,
                        nombreCompareciente: cliente.nombre,
                        tipoCompareciente: cliente.compareciente,
                        firmaRequerida: cliente.firma,
                        fechaFirma: cliente.fecha_Firma ? cliente.fecha_Firma.split('T')[0] : ''
                    };
                });
                setFilasComparecientes(comparecientes);

                // Inicializar busquedaTipo con los tipos de comparecientes cargados
                const busquedaTipoInicial: Record<string, string> = {};
                comparecientes.forEach(comp => {
                    busquedaTipoInicial[comp.id] = comp.tipoCompareciente;
                });
                setBusquedaTipo(busquedaTipoInicial);
            }

            // Cargar dependencias
            if (fullData.dependencias && fullData.dependencias.length > 0) {
                const dependenciasDesc = fullData.dependencias.map((dep: any) => dep.descripcion.trim());
                setFormData(prev => ({ ...prev, dependencias: dependenciasDesc }));

                // Cargar datos detallados de dependencias
                const datosDepdenciasNuevos: Record<string, DatosDepedencia> = {};
                fullData.dependencias.forEach((dep: any) => {
                    datosDepdenciasNuevos[dep.descripcion.trim()] = {
                        dependencia: dep.descripcion.trim(),
                        folioReal: dep.folio_Real || '',
                        volumen: dep.volumen || '',
                        fojas: dep.fojas || '',
                        seccion: dep.seccion || '',
                        libro: dep.libro || '',
                        observaciones: dep.observaciones || '',
                        fechaIngreso: dep.fecha_Ingreso ? dep.fecha_Ingreso.split('T')[0] : '',
                        folio: dep.folio || '',
                        partida: dep.partida || '',
                        estatus: dep.estatus || '',
                        fechaRechazo: dep.fecha_Rechazo ? dep.fecha_Rechazo.split('T')[0] : '',
                        fechaSubsanado: dep.fecha_Subsanado ? dep.fecha_Subsanado.split('T')[0] : '',
                        fechaReingreso: dep.fecha_Reingreso ? dep.fecha_Reingreso.split('T')[0] : '',
                        fechaRegistro: dep.fecha_Registro ? dep.fecha_Registro.split('T')[0] : '',
                        fechaRecogerDependencia: dep.fecha_Recoger_Dependencia ? dep.fecha_Recoger_Dependencia.split('T')[0] : '',
                        fechaConclusión: dep.fecha_Conclusion ? dep.fecha_Conclusion.split('T')[0] : ''
                    };
                });
                setDatosDepdencias(datosDepdenciasNuevos);
            }

            // Activar modo edición y navegación
            setCurrentExpedienteId(expedienteId);
            setIsEditing(true);
            setActiveTab('formulario');
            setSaveError(null);

            // Cargar documentos del expediente
            await fetchDocumentosExpediente(expedienteId);
        } catch (error) {
            setSaveError('Error al cargar el expediente');
            console.error('Error:', error);
        }
    };

    const handleSaveExpediente = async () => {
        // Validaciones básicas
        if (!formData.referencia.trim()) {
            setSaveError('La referencia es requerida');
            return;
        }
        if (!notarioId) {
            setSaveError('Debe seleccionar un notario');
            return;
        }
        if (operacionesIds.length === 0) {
            setSaveError('Debe seleccionar al menos una operación');
            return;
        }
        if (filasComparecientes.length === 0) {
            setSaveError('Debe agregar al menos un compareciente');
            return;
        }
        if (filasComparecientes.some(comp => !comp.tipoCompareciente.trim())) {
            setSaveError('Todos los comparecientes deben tener un tipo seleccionado');
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            // Construir el payload según la estructura esperada por la API
            const requestPayload = {
                expediente: {
                    tipo_Expediente: 'EXPEDIENTE',
                    observaciones: formData.observaciones || 'NA',
                    fecha_Apertura: new Date().toISOString(),
                    referencia: formData.referencia,
                    municipio_Id: municipioId || 1,
                    notario_Id: notarioId,
                    responsable_Id: responsableId || 0,
                    secretaria_Id: secretariaId || 0,
                    autorizado_Id: autorizadoId || 0,
                    credito: 0,
                    tipo_Escritura: formData.tipoEscritura || '',
                    escritura_Numero: parseInt(formData.numeroEscritura) || 0,
                    folio_Inicial: formData.folioInicial || 0,
                    folio_Final: formData.folioFinal || 0,
                    volumen: formData.volumen || 0,
                    tomo: formData.tomo || 0,
                    fojas: 0,
                    monto: 0,
                    fecha_Escritura: formData.fechaEscritura || new Date().toISOString(),
                    fecha_Firma: formData.fechaFirma || new Date().toISOString(),
                    fecha_Elaboracion: formData.fechaElaboracion || new Date().toISOString(),
                    fecha_Revision: formData.fechaRevision || new Date().toISOString(),
                    fecha_Impresion: formData.fechaImpresion || new Date().toISOString(),
                    fecha_Firma_Todos: formData.firmarTodos || new Date().toISOString(),
                    motivo: formData.motivoCancelacion || 'string'
                },
                operacion: operacionesIds.map(opId => ({ operacion_Id: opId })),
                clientes: filasComparecientes.map(comp => ({
                    cliente_Id: comp.cliente_Id,
                    compareciente_Id: comparecientesDisponibles.find(c =>
                        c.descripcion.toLowerCase() === comp.tipoCompareciente.toLowerCase()
                    )?.id || 1,
                    firma: comp.firmaRequerida,
                    fecha_Firma: comp.fechaFirma || new Date().toISOString()
                })),
                dependencia: formData.dependencias.map(depNombre => {
                    const depEncontrada = dependenciasDisponibles.find(d => d.descripcion.trim() === depNombre);
                    const datos = datosDepdencias[depNombre] || {};
                    return {
                        dependencia_Id: depEncontrada?.id || 0,
                        folio_Real: datos.folioReal || '',
                        volumen: datos.volumen || '',
                        seccion: datos.seccion || '',
                        libro: datos.libro || '',
                        folio: datos.folio || '',
                        fojas: datos.fojas || '',
                        partida: datos.partida || '',
                        estatus: datos.estatus || '',
                        fecha_Ingreso: datos.fechaIngreso || new Date().toISOString(),
                        fecha_Rechazo: datos.fechaRechazo || new Date().toISOString(),
                        fecha_Subsanado: datos.fechaSubsanado || new Date().toISOString(),
                        fecha_Reingreso: datos.fechaReingreso || new Date().toISOString(),
                        fecha_Registro: datos.fechaRegistro || new Date().toISOString(),
                        fecha_Recoger_Dependencia: datos.fechaRecogerDependencia || new Date().toISOString(),
                        fecha_Conclusion: datos.fechaConclusión || new Date().toISOString(),
                        observaciones: datos.observaciones || ''
                    };
                })
            };

            const response = await fetch('https://localhost:44327/api/Expediente/CreateExpediente', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload),
            });

            const data = await response.json();

            if (response.ok) {
                addToast('Expediente creado exitosamente', 'success');

                // Obtener el ID del expediente creado
                const expedienteId = data.dataResponse?.id || currentExpedienteId;

                // Actualizar documentos si hay
                if (expedienteId && documentosPorCliente.length > 0) {
                    await handleActualizarDocumentosExpediente(expedienteId);
                }

                // Resetear todo en un paso
                const nuevoFormData = {
                    expediente: '',
                    fecha_creacion: new Date().toISOString().split('T')[0],
                    referencia: '',
                    municipio: '',
                    operaciones: [],
                    dependencias: [],
                    observaciones: '',
                    notario: '',
                    responsable: '',
                    secretaria: '',
                    autorizado: '',
                    estatus: '',
                    motivoCancelacion: '',
                    ultima_etapa: '',
                    financiamiento_con: false,
                    financiamiento_monto: 0,
                    tipoEscritura: '',
                    numeroEscritura: '',
                    foliosRequeridos: 0,
                    folioInicial: 0,
                    folioFinal: 0,
                    volumen: 0,
                    tomo: 0,
                    foliosInutilizados: 0,
                    fechaEscritura: '',
                    fechaFirma: '',
                    fechaElaboracion: '',
                    fechaRevision: '',
                    fechaImpresion: '',
                    firmarTodos: '',
                    noPaso: false,
                    nopasoMotivo: '',
                };

                // Batch de updates para evitar render issues
                setFormData(nuevoFormData);
                setNotarioId(null);
                setResponsableId(null);
                setSecretariaId(null);
                setAutorizadoId(null);
                setOperacionesIds([]);
                setFilasComparecientes([]);
                setDatosDepdencias({});
                setDependenciaSeleccionada(null);
                setSaveError(null);
                setCheckboxesFecha({});
                setFilasDocumentos({});
                setClienteSeleccionado(null);
                setOtorganteSeleccionado(null);
                setClienteBusqueda('');
                setBusquedaOtorgante('');
                setOperacionBusqueda('');
                setMostrarDropdownOperaciones(false);
                setMunicipioBusqueda('');
                setMostrarDropdownMunicipios(false);
                setDependenciaBusqueda('');
                setMostrarDropdownDependencias(false);
                setBusquedaNotario('');
                setMostrarDropdownNotario(false);
                setBusquedaResponsable('');
                setMostrarDropdownResponsable(false);
                setBusquedaSecretaria('');
                setMostrarDropdownSecretaria(false);
                setBusquedaAutorizado('');
                setMostrarDropdownAutorizado(false);
                setMostrarDropdownClientes(false);
                setMostrarDropdownOtorgante(false);
                setDropdownTipoAbierto({});
                setBusquedaTipo({});
                setEnabledDates({
                    fechaEscritura: false,
                    fechaFirma: false,
                    fechaElaboracion: false,
                    fechaRevision: false,
                    fechaImpresion: false,
                    firmarTodos: false,
                });
                setActiveTab('busqueda');

                // Recargar expedientes en el siguiente ciclo
                setTimeout(() => {
                    fetchExpedientes('');
                }, 100);
            } else {
                setSaveError(data.message || 'Error al crear el expediente');
                addToast(data.message || 'Error al crear el expediente', 'error');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            setSaveError(`Error al crear expediente: ${errorMessage}`);
            addToast(`Error al crear expediente: ${errorMessage}`, 'error');
            console.error('Error al guardar expediente:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSeleccionarOperacion = (operacion: Operacion) => {
        setFormData(prev => ({
            ...prev,
            operaciones: [...prev.operaciones, operacion.descripcion]
        }));
        setOperacionesIds(prev => [...prev, operacion.id]);
        setOperacionBusqueda('');
        setMostrarDropdownOperaciones(false);
    };

    const handleEliminarOperacion = (indice: number) => {
        setFormData(prev => ({
            ...prev,
            operaciones: prev.operaciones.filter((_, i) => i !== indice)
        }));
        setOperacionesIds(prev => prev.filter((_, i) => i !== indice));
    };

    const handleSeleccionarMunicipio = (municipio: Dependencia) => {
        setFormData(prev => ({
            ...prev,
            municipio: municipio.descripcion
        }));
        setMunicipioId(municipio.id);
        setMunicipioBusqueda('');
        setMostrarDropdownMunicipios(false);
    };

    const handleEliminarMunicipio = () => {
        setFormData(prev => ({
            ...prev,
            municipio: ''
        }));
        setMunicipioId(null);
    };

    const handleSeleccionarDependencia = (dependencia: Dependencia) => {
        const nomDependencia = dependencia.descripcion.trim();
        setFormData(prev => ({
            ...prev,
            dependencias: [...prev.dependencias, nomDependencia]
        }));
        setDependenciaSeleccionada(nomDependencia);

        // Inicializar datos del formulario si no existen
        if (!datosDepdencias[nomDependencia]) {
            setDatosDepdencias(prev => ({
                ...prev,
                [nomDependencia]: {
                    dependencia: nomDependencia,
                    folioReal: '',
                    volumen: '',
                    fojas: '',
                    seccion: '',
                    libro: '',
                    observaciones: '',
                    fechaIngreso: '',
                    folio: '',
                    partida: '',
                    estatus: '',
                    fechaRechazo: '',
                    fechaSubsanado: '',
                    fechaReingreso: '',
                    fechaRegistro: '',
                    fechaRecogerDependencia: '',
                    fechaConclusión: ''
                }
            }));

            // Inicializar checkboxes de fechas
            setCheckboxesFecha(prev => ({
                ...prev,
                [nomDependencia]: {
                    fechaIngreso: false,
                    fechaRechazo: false,
                    fechaSubsanado: false,
                    fechaReingreso: false,
                    fechaRegistro: false,
                    fechaRecogerDependencia: false,
                    fechaConclusión: false
                }
            }));
        }

        setDependenciaBusqueda('');
        setMostrarDropdownDependencias(false);
    };

    const handleEliminarDependencia = (indice: number) => {
        const nombreDependencia = formData.dependencias[indice];
        setFormData(prev => ({
            ...prev,
            dependencias: prev.dependencias.filter((_, i) => i !== indice)
        }));

        // Limpiar datos de la dependencia eliminada
        setDatosDepdencias(prev => {
            const newDatos = { ...prev };
            delete newDatos[nombreDependencia];
            return newDatos;
        });

        // Si la dependencia eliminada estaba seleccionada, deseleccionar
        if (dependenciaSeleccionada === nombreDependencia) {
            setDependenciaSeleccionada(null);
        }
    };

    const handleActualizarDatosDependencia = (campo: keyof DatosDepedencia, valor: string) => {
        if (dependenciaSeleccionada) {
            setDatosDepdencias(prev => ({
                ...prev,
                [dependenciaSeleccionada]: {
                    ...prev[dependenciaSeleccionada],
                    [campo]: valor
                }
            }));
        }
    };

    const handleToggleCheckboxFecha = (campo: string) => {
        if (dependenciaSeleccionada) {
            setCheckboxesFecha(prev => ({
                ...prev,
                [dependenciaSeleccionada]: {
                    ...prev[dependenciaSeleccionada],
                    [campo]: !prev[dependenciaSeleccionada]?.[campo]
                }
            }));
            // Si se desactiva el checkbox, limpiar la fecha
            if (checkboxesFecha[dependenciaSeleccionada]?.[campo]) {
                handleActualizarDatosDependencia(campo as keyof DatosDepedencia, '');
            }
        }
    };

    const handleAgregarCompareciente = async () => {
        if (clienteSeleccionado && comparecientesDisponibles.length === 0) {
            // Cargar comparecientes si no están cargados
            await fetchComparecientes();
        }
        if (clienteSeleccionado) {
            const nuevoCompareciente: FilaCompareciente = {
                id: Date.now().toString(),
                cliente_Id: clienteSeleccionado.id,
                nombreCompareciente: `${clienteSeleccionado.nombre} ${clienteSeleccionado.apellido_Paterno} ${clienteSeleccionado.apellido_Materno}`,
                tipoCompareciente: '',
                firmaRequerida: false,
                fechaFirma: ''
            };
            setFilasComparecientes(prev => [...prev, nuevoCompareciente]);
            setClienteSeleccionado(null);
            setClienteBusqueda('');
            setMostrarDropdownClientes(false);
        }
    };

    const handleEliminarCompareciente = (id: string) => {
        setFilasComparecientes(prev => prev.filter(row => row.id !== id));
    };

    const handleActualizarCompareciente = (id: string, campo: keyof FilaCompareciente, valor: any) => {
        setFilasComparecientes(prev =>
            prev.map(row =>
                row.id === id ? { ...row, [campo]: valor } : row
            )
        );
    };

    const handleToggleCheckboxCompareciente = (id: string) => {
        setFilasComparecientes(prev =>
            prev.map(row =>
                row.id === id
                    ? { ...row, firmaRequerida: !row.firmaRequerida, fechaFirma: !row.firmaRequerida ? row.fechaFirma : '' }
                    : row
            )
        );
    };

    return (
        <>
            <Head title="Expedientes - Control Notarial" />

            <div className="space-y-6 px-6 pt-6">
                {/* <div className="pb-2 border-b">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-blue-600 p-3 text-white">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Expedientes</h1>
                            <p className="text-muted-foreground text-xs">Gestión de expedientes</p>
                        </div>
                    </div>
                </div> */}

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 bg-transparent">
                        <TabsTrigger value="busqueda" className="gap-1 data-[state=active]:shadow-neutral-800">
                            <Search className="size-4" />
                            <span className="hidden sm:inline">Búsqueda</span>
                        </TabsTrigger>
                        <TabsTrigger value="formulario" className="gap-1 data-[state=active]:shadow-neutral-800">
                            <Plus className="size-4" />
                            <span className="hidden sm:inline">
                                {isEditing ? 'Editar Expediente' : 'Crear Expediente'}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ── PESTAÑA: BÚSQUEDA ── */}
                    <TabsContent value="busqueda" className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                    placeholder="Buscar por referencia, cliente, operación..."
                                    className="pr-10"
                                    autoFocus
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
                            <Button disabled={isSearching} className="bg-blue-600 hover:bg-blue-700" onClick={() => fetchExpedientes(filtro)}>
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

                        <div className="border rounded-lg overflow-hidden bg-background/50 backdrop-blur-sm">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">ID</TableHead>
                                        <TableHead>Expediente</TableHead>
                                        <TableHead>Operación</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead>Fecha Creación</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isSearching ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                Cargando expedientes...
                                            </TableCell>
                                        </TableRow>
                                    ) : resultados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No se encontraron expedientes.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        resultados.map((item) => (
                                            <TableRow
                                                key={item.expediente.id}
                                                className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
                                                onClick={() => handleLoadExpediente(item.expediente.id)}
                                            >
                                                <TableCell className="font-mono text-sm">{item.expediente.id}</TableCell>
                                                <TableCell className="font-medium">{item.expediente.expediente || '-'}</TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {item.operaciones?.[0]?.descripcion || '-'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{item.clientes?.[0]?.nombre || '-'}</TableCell>
                                                <TableCell className="text-sm">{item.expediente.fecha_Creacion ? new Date(item.expediente.fecha_Creacion).toLocaleDateString('es-MX') : '-'}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {!isSearching && resultados.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {resultados.length} expediente(s) encontrado(s) — <span className="text-blue-600">selecciona uno para ver detalles</span>
                            </p>
                        )}
                    </TabsContent>

                    {/* ── PESTAÑA 2: FORMULARIO ── */}
                    <TabsContent value="formulario" className="space-y-6">
                        <div className="border rounded-lg p-6 bg-background/50 backdrop-blur-sm">
                            {saveError && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6">
                                    {saveError}
                                </div>
                            )}

                            {/* TABS INTERNOS: 4 CATEGORÍAS TEMÁTICAS */}
                            <Tabs defaultValue="info-general" className="w-full">
                                <TabsList className="grid w-full grid-cols-4 gap-2 bg-transparent mb-4 p-0">
                                    {/* GRUPO 1: INFORMACIÓN GENERAL */}
                                    <TabsTrigger value="info-general" className="gap-1 data-[state=active]:shadow-neutral-800">
                                        <FileText className="h-4 w-4" />
                                        <span className="hidden sm:inline">Info General</span>
                                    </TabsTrigger>

                                    {/* GRUPO 2: DOCUMENTOS & INMUEBLES */}
                                    <TabsTrigger
                                        value="docs-inmuebles"
                                        className="gap-1 data-[state=active]:shadow-neutral-800"
                                        disabled={!isEditing}
                                        title={!isEditing ? "Guarda el expediente primero para acceder a esta sección" : ""}
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span className="hidden sm:inline">Documentos</span>
                                    </TabsTrigger>

                                    {/* GRUPO 3: FINANCIERO & CONTROL */}
                                    <TabsTrigger
                                        value="financiero-control"
                                        className="gap-1 data-[state=active]:shadow-neutral-800"
                                        disabled={!isEditing}
                                        title={!isEditing ? "Guarda el expediente primero para acceder a esta sección" : ""}
                                    >
                                        <DollarSign className="h-4 w-4" />
                                        <span className="hidden sm:inline">Financiero</span>
                                    </TabsTrigger>

                                    {/* GRUPO 4: PROCESO & TRÁMITES */}
                                    <TabsTrigger
                                        value="proceso-tramites"
                                        className="gap-1 data-[state=active]:shadow-neutral-800"
                                        disabled={!isEditing}
                                        title={!isEditing ? "Guarda el expediente primero para acceder a esta sección" : ""}
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span className="hidden sm:inline">Proceso</span>
                                    </TabsTrigger>
                                </TabsList>

                                {/* GRUPO 1: INFORMACIÓN GENERAL */}
                                <TabsContent value="info-general" className="space-y-6">
                                    <Tabs defaultValue="datos-expediente" className="w-full">
                                        <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 mb-3">
                                            <TabsTrigger value="datos-expediente" className="text-xs sm:text-sm">Datos Expediente</TabsTrigger>
                                            <TabsTrigger value="datos-escritura" className="text-xs sm:text-sm">Datos Escritura</TabsTrigger>
                                            <TabsTrigger value="comparecientes" className="text-xs sm:text-sm">Comparecientes</TabsTrigger>
                                            <TabsTrigger value="dependencias" className="text-xs sm:text-sm">Dependencias</TabsTrigger>
                                        </TabsList>

                                        {/* SubTab: Datos Expediente */}
                                        <TabsContent value="datos-expediente" className="border-t pt-6  space-y-4">
                                            <div className="grid grid-cols-4 gap-4 mb-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Expediente</label>
                                                    <Input name="expediente" value={formData.expediente} readOnly className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                                                </div>
                                                <div className="space-y-2">
                                                    <RequiredLabel htmlFor="referencia">Referencia</RequiredLabel>
                                                    <Input id="referencia" name="referencia" value={formData.referencia} onChange={handleInputChange} placeholder="Referencia" className="text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <RequiredLabel htmlFor="municipio">Municipio</RequiredLabel>
                                                    <div ref={refDropdownMunicipios} className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder="Buscar municipio..."
                                                                value={formData.municipio || municipioBusqueda}
                                                                onChange={(e) => {
                                                                    setMunicipioBusqueda(e.target.value);
                                                                    if (formData.municipio) setFormData(prev => ({ ...prev, municipio: '' }));
                                                                }}
                                                                onFocus={() => setMostrarDropdownMunicipios(true)}
                                                                className="text-sm pr-12"
                                                            />
                                                            {(formData.municipio || municipioBusqueda).length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        setMunicipioBusqueda('');
                                                                        setFormData(prev => ({ ...prev, municipio: '' }));
                                                                        setMunicipioId(null);
                                                                    }}
                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                                                    aria-label="Limpiar"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownMunicipios && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                                                {cargandoMunicipios && <div className="px-3 py-2 text-sm text-muted-foreground">Cargando...</div>}
                                                                {!cargandoMunicipios && municipiosFiltrados.filter(mun => mun.descripcion !== formData.municipio).length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>}
                                                                {municipiosFiltrados.filter(mun => mun.descripcion !== formData.municipio).map(mun => (
                                                                    <div
                                                                        key={mun.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, municipio: mun.descripcion }));
                                                                            setMunicipioId(mun.id);
                                                                            setMunicipioBusqueda('');
                                                                            setMostrarDropdownMunicipios(false);
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
                                                    <select name="estatus" value={formData.estatus} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                                        <option value="">Selecciona un estatus</option>
                                                        <option value="EN PROCESO">EN PROCESO</option>
                                                        <option value="COMPLETADO">COMPLETADO</option>
                                                        <option value="CANCELADO">CANCELADO</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {formData.estatus === 'CANCELADO' && (
                                                <div className="mb-6">
                                                    <label className="text-sm font-medium">Motivo de Cancelación</label>
                                                    <textarea name="motivoCancelacion" value={formData.motivoCancelacion} onChange={handleInputChange} placeholder="Describe el motivo de la cancelación..." rows={3} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm mt-2" />
                                                </div>
                                            )}

                                            {isEditing && (
                                                <div className="mb-6">
                                                    <label className="text-sm font-medium">Primer Otorgante</label>
                                                    <Input type="text" readOnly value={filasComparecientes[0]?.nombreCompareciente || ''} className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                                                </div>
                                            )}

                                            <div className="mb-6">
                                                <RequiredLabel htmlFor="operaciones" className="block mb-2">Operaciones</RequiredLabel>
                                                <div ref={refDropdownOperaciones} className="relative">
                                                    <div className="relative">
                                                        <Input type="text" placeholder="Buscar operación..." value={operacionBusqueda} onChange={(e) => setOperacionBusqueda(e.target.value)} onFocus={() => setMostrarDropdownOperaciones(true)} className="text-sm pr-8" />
                                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                    </div>
                                                    {mostrarDropdownOperaciones && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                                                            {cargandoOperaciones && <div className="px-3 py-2 text-sm text-muted-foreground">Cargando...</div>}
                                                            {!cargandoOperaciones && operacionesFiltradas.filter(op => !formData.operaciones.includes(op.descripcion)).length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>}
                                                            {operacionesFiltradas.filter(op => !formData.operaciones.includes(op.descripcion)).map(op => (
                                                                <div key={op.id} onClick={() => handleSeleccionarOperacion(op)} className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0">{op.descripcion}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {formData.operaciones.length > 0 && (
                                                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-2">
                                                        {formData.operaciones.map((op, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">
                                                                <span className="text-sm">{op}</span>
                                                                <button onClick={() => handleEliminarOperacion(idx)} className="text-red-600 hover:text-red-800 dark:text-red-400">
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-6">
                                                <label className="text-sm font-medium block mb-2">Observaciones</label>
                                                <textarea name="observaciones" value={formData.observaciones} onChange={handleInputChange} placeholder="Observaciones..." rows={3} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                                            </div>

                                            <div className="grid grid-cols-4 gap-4 mb-6">
                                                <div className="space-y-2">
                                                    <RequiredLabel htmlFor="notario">Notario</RequiredLabel>
                                                    <div ref={refDropdownNotario} className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder={notariosFiltrados.length === 0 ? 'Sin notarios disponibles' : 'Buscar notario...'}
                                                                value={formData.notario || busquedaNotario}
                                                                onChange={(e) => {
                                                                    setBusquedaNotario(e.target.value);
                                                                    if (formData.notario) setFormData(prev => ({ ...prev, notario: '' }));
                                                                }}
                                                                onFocus={() => setMostrarDropdownNotario(true)}
                                                                className={`text-sm pr-12 ${notariosFiltrados.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                readOnly={notariosFiltrados.length === 0}
                                                            />
                                                            {(formData.notario || busquedaNotario).length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        setBusquedaNotario('');
                                                                        setFormData(prev => ({ ...prev, notario: '' }));
                                                                        setNotarioId(null);
                                                                    }}
                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                                                    aria-label="Limpiar"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownNotario && notariosFiltrados.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                                                {notariosFiltrados.map(u => (
                                                                    <div
                                                                        key={u.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, notario: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
                                                                            setNotarioId(u.id);
                                                                            setBusquedaNotario('');
                                                                            setMostrarDropdownNotario(false);
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
                                                    <div ref={refDropdownResponsable} className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder={responsablesFiltrados.length === 0 ? 'Sin responsables disponibles' : 'Buscar responsable...'}
                                                                value={formData.responsable || busquedaResponsable}
                                                                onChange={(e) => {
                                                                    setBusquedaResponsable(e.target.value);
                                                                    if (formData.responsable) setFormData(prev => ({ ...prev, responsable: '' }));
                                                                }}
                                                                onFocus={() => setMostrarDropdownResponsable(true)}
                                                                className={`text-sm pr-12 ${responsablesFiltrados.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                readOnly={responsablesFiltrados.length === 0}
                                                            />
                                                            {(formData.responsable || busquedaResponsable).length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        setBusquedaResponsable('');
                                                                        setFormData(prev => ({ ...prev, responsable: '' }));
                                                                        setResponsableId(null);
                                                                    }}
                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                                                    aria-label="Limpiar"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownResponsable && responsablesFiltrados.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                                                {responsablesFiltrados.map(u => (
                                                                    <div
                                                                        key={u.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, responsable: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
                                                                            setResponsableId(u.id);
                                                                            setBusquedaResponsable('');
                                                                            setMostrarDropdownResponsable(false);
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
                                                    <div ref={refDropdownSecretaria} className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder={secretariasFiltradas.length === 0 ? 'Sin secretarias disponibles' : 'Buscar secretaria...'}
                                                                value={formData.secretaria || busquedaSecretaria}
                                                                onChange={(e) => {
                                                                    setBusquedaSecretaria(e.target.value);
                                                                    if (formData.secretaria) setFormData(prev => ({ ...prev, secretaria: '' }));
                                                                }}
                                                                onFocus={() => setMostrarDropdownSecretaria(true)}
                                                                className={`text-sm pr-12 ${secretariasFiltradas.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                readOnly={secretariasFiltradas.length === 0}
                                                            />
                                                            {(formData.secretaria || busquedaSecretaria).length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        setBusquedaSecretaria('');
                                                                        setFormData(prev => ({ ...prev, secretaria: '' }));
                                                                        setSecretariaId(null);
                                                                    }}
                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                                                    aria-label="Limpiar"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownSecretaria && secretariasFiltradas.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                                                {secretariasFiltradas.map(u => (
                                                                    <div
                                                                        key={u.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, secretaria: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
                                                                            setSecretariaId(u.id);
                                                                            setBusquedaSecretaria('');
                                                                            setMostrarDropdownSecretaria(false);
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
                                                    <div ref={refDropdownAutorizado} className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder={autorizadosFiltrados.length === 0 ? 'Sin autorizados disponibles' : 'Buscar autorizado...'}
                                                                value={formData.autorizado || busquedaAutorizado}
                                                                onChange={(e) => {
                                                                    setBusquedaAutorizado(e.target.value);
                                                                    if (formData.autorizado) setFormData(prev => ({ ...prev, autorizado: '' }));
                                                                }}
                                                                onFocus={() => setMostrarDropdownAutorizado(true)}
                                                                className={`text-sm pr-12 ${autorizadosFiltrados.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                readOnly={autorizadosFiltrados.length === 0}
                                                            />
                                                            {(formData.autorizado || busquedaAutorizado).length > 0 && (
                                                                <button
                                                                    onClick={() => {
                                                                        setBusquedaAutorizado('');
                                                                        setFormData(prev => ({ ...prev, autorizado: '' }));
                                                                        setAutorizadoId(null);
                                                                    }}
                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                                                    aria-label="Limpiar"
                                                                >
                                                                    ×
                                                                </button>
                                                            )}
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownAutorizado && autorizadosFiltrados.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                                                {autorizadosFiltrados.map(u => (
                                                                    <div
                                                                        key={u.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, autorizado: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
                                                                            setAutorizadoId(u.id);
                                                                            setBusquedaAutorizado('');
                                                                            setMostrarDropdownAutorizado(false);
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
                                                <textarea name="ultima_etapa" value={formData.ultima_etapa} onChange={handleInputChange} placeholder="Última etapa..." rows={2} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                                            </div>
                                        </TabsContent>

                                        {/* SubTab: Datos Escritura */}
                                        <TabsContent value="datos-escritura" className="space-y-6">
                                            {/* TIPO Y NÚMERO DE ESCRITURA */}
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Tipo de Escritura</label>
                                                    <select name="tipoEscritura" value={formData.tipoEscritura} onChange={handleInputChange} className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                                        <option value="">Selecciona tipo</option>
                                                        <option value="protocolo-abierto">Protocolo Abierto</option>
                                                        <option value="protocolo-cerrado">Protocolo Cerrado</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Número de Escritura</label>
                                                    <Input type="text" name="numeroEscritura" value={formData.numeroEscritura} onChange={handleInputChange} placeholder="Número de escritura" className="text-sm" />
                                                </div>
                                            </div>

                                            {/* APARTADO DE FOLIOS */}
                                            <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/20">
                                                <h4 className="font-semibold text-sm mb-4 text-blue-900 dark:text-blue-100">Gestión de Folios</h4>
                                                <div className="space-y-4">
                                                    {/* Fila 1: Folios requeridos, botón, vacío */}
                                                    <div className="grid grid-cols-4 gap-4 items-end">
                                                        <div className="space-y-2 w-full">
                                                            <label className="text-sm font-medium">Folios Requeridos</label>
                                                            <Input type="number" name="foliosRequeridos" value={formData.foliosRequeridos} onChange={handleInputChange} placeholder="0" className="text-sm w-full" />
                                                        </div>
                                                        <div className="flex items-end w-full pt-5">
                                                            <Button className="bg-blue-600 hover:bg-blue-700 h-10 w-24 min-w-0">Asignar</Button>
                                                        </div>
                                                        <div className="w-full"></div>
                                                    </div>
                                                    {/* Fila 2: Folio inicial, folio final, vacío, vacío */}
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <div className="space-y-2 w-full">
                                                            <label className="text-sm font-medium">Folio Inicial</label>
                                                            <Input type="number" name="folioInicial" value={formData.folioInicial} onChange={handleInputChange} placeholder="0" className="text-sm w-full" />
                                                        </div>
                                                        <div className="space-y-2 w-full">
                                                            <label className="text-sm font-medium">Folio Final</label>
                                                            <Input type="number" name="folioFinal" value={formData.folioFinal} onChange={handleInputChange} placeholder="0" className="text-sm w-full" />
                                                        </div>
                                                        <div className="w-full"></div>
                                                        <div className="w-full"></div>
                                                    </div>
                                                    {/* Fila 3: Volumen, tomo, folios inutilizados, vacío */}
                                                    <div className="grid grid-cols-4 gap-4">
                                                        <div className="space-y-2 w-full">
                                                            <label className="text-sm font-medium">Volumen</label>
                                                            <Input type="number" name="volumen" value={formData.volumen} onChange={handleInputChange} placeholder="0" className="text-sm w-full" />
                                                        </div>
                                                        <div className="space-y-2 w-full">
                                                            <label className="text-sm font-medium">Tomo</label>
                                                            <Input type="number" name="tomo" value={formData.tomo} onChange={handleInputChange} placeholder="0" className="text-sm w-full" />
                                                        </div>
                                                        <div className="space-y-2 w-full">
                                                            <label className="text-sm font-medium">Folios Inutilizados</label>
                                                            <Input type="number" name="foliosInutilizados" value={formData.foliosInutilizados} onChange={handleInputChange} placeholder="0" className="text-sm w-full" />
                                                        </div>
                                                        <div className="w-full"></div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* APARTADO DE FECHAS CON CHECKBOXES */}
                                            <div className="border rounded-lg p-4 bg-purple-50 dark:bg-purple-950/20">
                                                <h4 className="font-semibold text-sm mb-4 text-purple-900 dark:text-purple-100">Fechas de Proceso</h4>
                                                <div className="space-y-3">
                                                    <div className="text-xs text-muted-foreground mb-3">*Para modificar las fechas, activa el checkbox correspondiente</div>

                                                    <div className="grid grid-cols-2 gap-4">
                                                        {/* Fecha Escritura */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="fecha-escritura"
                                                                    className="w-4 h-4"
                                                                    checked={enabledDates.fechaEscritura}
                                                                    onChange={(e) => setEnabledDates(prev => ({ ...prev, fechaEscritura: e.target.checked }))}
                                                                />
                                                                <label htmlFor="fecha-escritura" className="text-sm font-medium">Fecha Escritura</label>
                                                            </div>
                                                            <input
                                                                type="date"
                                                                name="fechaEscritura"
                                                                value={formData.fechaEscritura}
                                                                onChange={handleInputChange}
                                                                readOnly={!enabledDates.fechaEscritura}
                                                                className={`w-full px-3 py-2 border rounded-md bg-background border-input text-sm ${!enabledDates.fechaEscritura ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            />
                                                        </div>

                                                        {/* Fecha Firma */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="fecha-firma"
                                                                    className="w-4 h-4"
                                                                    checked={enabledDates.fechaFirma}
                                                                    onChange={(e) => setEnabledDates(prev => ({ ...prev, fechaFirma: e.target.checked }))}
                                                                />
                                                                <label htmlFor="fecha-firma" className="text-sm font-medium">Fecha Firma</label>
                                                            </div>
                                                            <input
                                                                type="date"
                                                                name="fechaFirma"
                                                                value={formData.fechaFirma}
                                                                onChange={handleInputChange}
                                                                readOnly={!enabledDates.fechaFirma}
                                                                className={`w-full px-3 py-2 border rounded-md bg-background border-input text-sm ${!enabledDates.fechaFirma ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            />
                                                        </div>

                                                        {/* Fecha Elaboración */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="fecha-elaboracion"
                                                                    className="w-4 h-4"
                                                                    checked={enabledDates.fechaElaboracion}
                                                                    onChange={(e) => setEnabledDates(prev => ({ ...prev, fechaElaboracion: e.target.checked }))}
                                                                />
                                                                <label htmlFor="fecha-elaboracion" className="text-sm font-medium">Fecha Elaboración</label>
                                                            </div>
                                                            <input
                                                                type="date"
                                                                name="fechaElaboracion"
                                                                value={formData.fechaElaboracion}
                                                                onChange={handleInputChange}
                                                                readOnly={!enabledDates.fechaElaboracion}
                                                                className={`w-full px-3 py-2 border rounded-md bg-background border-input text-sm ${!enabledDates.fechaElaboracion ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            />
                                                        </div>

                                                        {/* Fecha Revisión */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="fecha-revision"
                                                                    className="w-4 h-4"
                                                                    checked={enabledDates.fechaRevision}
                                                                    onChange={(e) => setEnabledDates(prev => ({ ...prev, fechaRevision: e.target.checked }))}
                                                                />
                                                                <label htmlFor="fecha-revision" className="text-sm font-medium">Fecha Revisión</label>
                                                            </div>
                                                            <input
                                                                type="date"
                                                                name="fechaRevision"
                                                                value={formData.fechaRevision}
                                                                onChange={handleInputChange}
                                                                readOnly={!enabledDates.fechaRevision}
                                                                className={`w-full px-3 py-2 border rounded-md bg-background border-input text-sm ${!enabledDates.fechaRevision ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            />
                                                        </div>

                                                        {/* Fecha Impresión */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="fecha-impresion"
                                                                    className="w-4 h-4"
                                                                    checked={enabledDates.fechaImpresion}
                                                                    onChange={(e) => setEnabledDates(prev => ({ ...prev, fechaImpresion: e.target.checked }))}
                                                                />
                                                                <label htmlFor="fecha-impresion" className="text-sm font-medium">Fecha Impresión</label>
                                                            </div>
                                                            <input
                                                                type="date"
                                                                name="fechaImpresion"
                                                                value={formData.fechaImpresion}
                                                                onChange={handleInputChange}
                                                                readOnly={!enabledDates.fechaImpresion}
                                                                className={`w-full px-3 py-2 border rounded-md bg-background border-input text-sm ${!enabledDates.fechaImpresion ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            />
                                                        </div>

                                                        {/* Firma Todos */}
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="checkbox"
                                                                    id="firma-todos"
                                                                    className="w-4 h-4"
                                                                    checked={enabledDates.firmarTodos}
                                                                    onChange={(e) => setEnabledDates(prev => ({ ...prev, firmarTodos: e.target.checked }))}
                                                                />
                                                                <label htmlFor="firma-todos" className="text-sm font-medium">Firma Todos</label>
                                                            </div>
                                                            <input
                                                                type="date"
                                                                name="firmarTodos"
                                                                value={formData.firmarTodos}
                                                                onChange={handleInputChange}
                                                                readOnly={!enabledDates.firmarTodos}
                                                                className={`w-full px-3 py-2 border rounded-md bg-background border-input text-sm ${!enabledDates.firmarTodos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                                            />
                                                        </div>
                                                    </div>
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
                                                            checked={formData.noPaso}
                                                            onChange={(e) => setFormData(prev => ({ ...prev, noPaso: e.target.checked }))}
                                                        />
                                                        <label htmlFor="no-paso" className="text-sm font-medium cursor-pointer">No Pasó</label>
                                                    </div>
                                                    {formData.noPaso && (
                                                        <div>
                                                            <label className="text-sm font-medium block mb-2">Motivo</label>
                                                            <textarea
                                                                name="nopasoMotivo"
                                                                value={formData.nopasoMotivo}
                                                                onChange={handleInputChange}
                                                                placeholder="Explica el motivo por el cual no pasó..."
                                                                rows={3}
                                                                className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                        </TabsContent>

                                        {/* SubTab: Comparecientes */}
                                        <TabsContent value="comparecientes" className="space-y-4">
                                            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md mb-6">
                                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Agregar Compareciente(s)</h3>

                                                {/* Dropdown de Clientes */}
                                                <div ref={refDropdownClientes} className="relative mb-4">
                                                    <div className="relative">
                                                        <Input
                                                            type="text"
                                                            placeholder="Buscar compareciente..."
                                                            value={clienteBusqueda}
                                                            onChange={(e) => setClienteBusqueda(e.target.value)}
                                                            onFocus={() => setMostrarDropdownClientes(true)}
                                                            className="text-sm pr-8"
                                                        />
                                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                    </div>
                                                    {mostrarDropdownClientes && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                                                            {cargandoClientes && <div className="px-3 py-2 text-sm text-muted-foreground">Cargando...</div>}
                                                            {!cargandoClientes && clientesFiltrados.filter(c => !filasComparecientes.some(f => f.nombreCompareciente === `${c.nombre} ${c.apellido_Paterno} ${c.apellido_Materno}`)).length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>}
                                                            {clientesFiltrados.filter(c => !filasComparecientes.some(f => f.nombreCompareciente === `${c.nombre} ${c.apellido_Paterno} ${c.apellido_Materno}`)).map(cliente => (
                                                                <div
                                                                    key={cliente.id}
                                                                    onClick={() => {
                                                                        setClienteSeleccionado(cliente);
                                                                        // Agregar directamente a la tabla
                                                                        const nuevoCompareciente: FilaCompareciente = {
                                                                            id: Date.now().toString(),
                                                                            cliente_Id: cliente.id,
                                                                            nombreCompareciente: `${cliente.nombre} ${cliente.apellido_Paterno} ${cliente.apellido_Materno}`,
                                                                            tipoCompareciente: '',
                                                                            firmaRequerida: false,
                                                                            fechaFirma: ''
                                                                        };
                                                                        setFilasComparecientes(prev => [...prev, nuevoCompareciente]);
                                                                        setClienteBusqueda('');
                                                                        setMostrarDropdownClientes(false);
                                                                    }}
                                                                    className="px-3 py-3 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0"
                                                                >
                                                                    <div className="font-medium">{cliente.nombre} {cliente.apellido_Paterno} {cliente.apellido_Materno}</div>
                                                                    <div className="text-xs text-muted-foreground mt-1">{cliente.tipo_Cliente} - {cliente.curp} - {cliente.rfc}</div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tabla de Comparecientes Agregados */}
                                            {filasComparecientes.length > 0 && (
                                                <div className="border rounded-lg overflow-hidden" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
                                                    <div className="overflow-x-auto overflow-y-auto flex-1">
                                                        <table className="w-full text-sm">
                                                        <thead className="bg-slate-200 dark:bg-slate-700 border-b">
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
                                                            {filasComparecientes.map((fila, index) => (
                                                                <>
                                                                    <tr key={fila.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                                    <td className="px-4 py-3">{fila.nombreCompareciente}</td>
                                                                    <td className="px-4 py-3">
                                                                        <div className="relative w-full">
                                                                            <Input
                                                                                type="text"
                                                                                placeholder="Buscar tipo..."
                                                                                value={busquedaTipo[fila.id] || ''}
                                                                                onChange={(e) => setBusquedaTipo(prev => ({
                                                                                    ...prev,
                                                                                    [fila.id]: e.target.value
                                                                                }))}
                                                                                onFocus={() => setDropdownTipoAbierto(prev => ({
                                                                                    ...prev,
                                                                                    [fila.id]: true
                                                                                }))}
                                                                                className="text-sm pr-12"
                                                                            />
                                                                            {(busquedaTipo[fila.id] || '').length > 0 && (
                                                                                <button
                                                                                    onClick={() => setBusquedaTipo(prev => ({
                                                                                        ...prev,
                                                                                        [fila.id]: ''
                                                                                    }))}
                                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground text-lg font-bold"
                                                                                    aria-label="Limpiar"
                                                                                >
                                                                                    ×
                                                                                </button>
                                                                            )}
                                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />

                                                                            {dropdownTipoAbierto[fila.id] && (
                                                                                <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-50 max-h-48 overflow-y-auto min-w-max">
                                                                                    {comparecientesDisponibles.filter(c => {
                                                                                        if (!c.activo) return false;
                                                                                        const busqueda = (busquedaTipo[fila.id] || '').toLowerCase().trim();
                                                                                        if (busqueda === '') return true;
                                                                                        return c.descripcion.toLowerCase().includes(busqueda);
                                                                                    }).length === 0 ? (
                                                                                        <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
                                                                                    ) : null}
                                                                                    {comparecientesDisponibles.filter(c => {
                                                                                        if (!c.activo) return false;
                                                                                        const busqueda = (busquedaTipo[fila.id] || '').toLowerCase().trim();
                                                                                        if (busqueda === '') return true;
                                                                                        return c.descripcion.toLowerCase().includes(busqueda);
                                                                                    }).map(comp => (
                                                                                        <div
                                                                                            key={comp.id}
                                                                                            onClick={() => {
                                                                                                handleActualizarCompareciente(fila.id, 'tipoCompareciente', comp.descripcion);
                                                                                                setBusquedaTipo(prev => ({
                                                                                                    ...prev,
                                                                                                    [fila.id]: comp.descripcion
                                                                                                }));
                                                                                                setDropdownTipoAbierto(prev => ({
                                                                                                    ...prev,
                                                                                                    [fila.id]: false
                                                                                                }));
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
                                                                            onChange={() => handleToggleCheckboxCompareciente(fila.id)}
                                                                            className="rounded"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-3">
                                                                        <Input
                                                                            type="date"
                                                                            disabled={!fila.firmaRequerida}
                                                                            value={fila.fechaFirma}
                                                                            onChange={(e) => handleActualizarCompareciente(fila.id, 'fechaFirma', e.target.value)}
                                                                            className="text-sm"
                                                                        />
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="text-sm font-medium gap-2"
                                                                        >
                                                                            <Search className="h-4 w-4" />
                                                                            BUSQUEDA
                                                                        </Button>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center flex items-center justify-center">
                                                                        <button
                                                                            onClick={() => handleEliminarCompareciente(fila.id)}
                                                                            className="text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 text-2xl font-bold rounded-md w-8 h-8 flex items-center justify-center leading-none"
                                                                            aria-label="Eliminar"
                                                                        >
                                                                            ×
                                                                        </button>
                                                                    </td>
                                                                </tr>

                                                            </>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    </div>
                                                </div>
                                            )}

                                            {filasComparecientes.length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <p>No hay comparecientes agregados. Selecciona un cliente para comenzar.</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        {/* SubTab: Dependencias */}
                                        <TabsContent value="dependencias" className="space-y-4">
                                            <div className="mb-6">
                                                <label className="text-sm font-medium block mb-2">Dependencias Públicas</label>
                                                <div ref={refDropdownDependencias} className="relative">
                                                    <div className="relative">
                                                        <Input type="text" placeholder="Buscar dependencia..." value={dependenciaBusqueda} onChange={(e) => setDependenciaBusqueda(e.target.value)} onFocus={() => setMostrarDropdownDependencias(true)} className="text-sm pr-8" />
                                                        <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                    </div>
                                                    {mostrarDropdownDependencias && (
                                                        <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                                                            {cargandoDependencias && <div className="px-3 py-2 text-sm text-muted-foreground">Cargando...</div>}
                                                            {!cargandoDependencias && dependenciasFiltradas.filter(dep => !formData.dependencias.includes(dep.descripcion.trim())).length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>}
                                                            {dependenciasFiltradas.filter(dep => !formData.dependencias.includes(dep.descripcion.trim())).map(dep => (
                                                                <div key={dep.id} onClick={() => handleSeleccionarDependencia(dep)} className="px-3 py-2 cursor-pointer hover:bg-blue-100 dark:hover:bg-blue-900/30 text-sm border-b last:border-b-0">{dep.descripcion.trim()}</div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                {formData.dependencias.length > 0 && (
                                                    <div className="mt-3 space-y-2 max-h-64 overflow-y-auto pr-2">
                                                        {formData.dependencias.map((dep, idx) => (
                                                            <div key={idx} className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">
                                                                <button onClick={() => setDependenciaSeleccionada(dep)} className="text-sm flex-1 text-left hover:underline">{dep}</button>
                                                                <button onClick={() => handleEliminarDependencia(idx)} className="text-red-600 hover:text-red-800 dark:text-red-400 ml-2">
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Formulario de Datos de la Dependencia */}
                                            {dependenciaSeleccionada && datosDepdencias[dependenciaSeleccionada] && (
                                                <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-900/30 mt-2">
                                                    <h3 className="text-lg font-semibold mb-6">Datos de la Dependencia</h3>

                                                    <div className="space-y-4">
                                                        {/* FILA 1: Dependencia */}
                                                        <div>
                                                            <label className="text-sm font-medium block mb-1">Dependencia</label>
                                                            <Input type="text" value={dependenciaSeleccionada} readOnly className="text-sm bg-background/50" />
                                                        </div>

                                                        {/* FILA 2: Folio Real, Folio, Volumen, Fojas */}
                                                        <div className="grid grid-cols-4 gap-4">
                                                            <div>
                                                                <label className="text-sm font-medium block mb-1">Folio Real</label>
                                                                <Input type="text" placeholder="Folio real" value={datosDepdencias[dependenciaSeleccionada].folioReal} onChange={(e) => handleActualizarDatosDependencia('folioReal', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium block mb-1">Folio</label>
                                                                <Input type="text" placeholder="Folio" value={datosDepdencias[dependenciaSeleccionada].folio} onChange={(e) => handleActualizarDatosDependencia('folio', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium block mb-1">Volumen</label>
                                                                <Input type="text" placeholder="Volumen" value={datosDepdencias[dependenciaSeleccionada].volumen} onChange={(e) => handleActualizarDatosDependencia('volumen', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium block mb-1">Fojas</label>
                                                                <Input type="text" placeholder="Fojas" value={datosDepdencias[dependenciaSeleccionada].fojas} onChange={(e) => handleActualizarDatosDependencia('fojas', e.target.value)} className="text-sm" />
                                                            </div>
                                                        </div>

                                                        {/* FILA 3: Sección, Partida, Libro, Estatus */}
                                                        <div className="grid grid-cols-4 gap-4">
                                                            <div>
                                                                <label className="text-sm font-medium block mb-1">Sección</label>
                                                                <Input type="text" placeholder="Sección" value={datosDepdencias[dependenciaSeleccionada].seccion} onChange={(e) => handleActualizarDatosDependencia('seccion', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium block mb-1">Partida</label>
                                                                <Input type="text" placeholder="Partida" value={datosDepdencias[dependenciaSeleccionada].partida} onChange={(e) => handleActualizarDatosDependencia('partida', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium block mb-1">Libro</label>
                                                                <Input type="text" placeholder="Libro" value={datosDepdencias[dependenciaSeleccionada].libro} onChange={(e) => handleActualizarDatosDependencia('libro', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium block mb-1">Estatus</label>
                                                                <Input type="text" placeholder="Estatus" value={datosDepdencias[dependenciaSeleccionada].estatus} onChange={(e) => handleActualizarDatosDependencia('estatus', e.target.value)} className="text-sm" />
                                                            </div>
                                                        </div>

                                                        {/* FILA 4: Observaciones */}
                                                        <div>
                                                            <label className="text-sm font-medium block mb-1">Observaciones</label>
                                                            <textarea placeholder="Observaciones..." value={datosDepdencias[dependenciaSeleccionada].observaciones} onChange={(e) => handleActualizarDatosDependencia('observaciones', e.target.value)} rows={3} className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                                                        </div>

                                                        {/* FILA 5: F. Ingreso, F. Rechazo, F. Subsanado, F. Reingreso */}
                                                        <div className="grid grid-cols-4 gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <input type="checkbox" id="ckFechaIngreso" checked={checkboxesFecha[dependenciaSeleccionada]?.fechaIngreso || false} onChange={() => handleToggleCheckboxFecha('fechaIngreso')} className="rounded" />
                                                                    <label htmlFor="ckFechaIngreso" className="text-sm font-medium">F. Ingreso</label>
                                                                </div>
                                                                <Input type="date" disabled={!checkboxesFecha[dependenciaSeleccionada]?.fechaIngreso} value={datosDepdencias[dependenciaSeleccionada].fechaIngreso} onChange={(e) => handleActualizarDatosDependencia('fechaIngreso', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <input type="checkbox" id="ckFechaRechazo" checked={checkboxesFecha[dependenciaSeleccionada]?.fechaRechazo || false} onChange={() => handleToggleCheckboxFecha('fechaRechazo')} className="rounded" />
                                                                    <label htmlFor="ckFechaRechazo" className="text-sm font-medium">F. Rechazo</label>
                                                                </div>
                                                                <Input type="date" disabled={!checkboxesFecha[dependenciaSeleccionada]?.fechaRechazo} value={datosDepdencias[dependenciaSeleccionada].fechaRechazo} onChange={(e) => handleActualizarDatosDependencia('fechaRechazo', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <input type="checkbox" id="ckFechaSubsanado" checked={checkboxesFecha[dependenciaSeleccionada]?.fechaSubsanado || false} onChange={() => handleToggleCheckboxFecha('fechaSubsanado')} className="rounded" />
                                                                    <label htmlFor="ckFechaSubsanado" className="text-sm font-medium">F. Subsanado</label>
                                                                </div>
                                                                <Input type="date" disabled={!checkboxesFecha[dependenciaSeleccionada]?.fechaSubsanado} value={datosDepdencias[dependenciaSeleccionada].fechaSubsanado} onChange={(e) => handleActualizarDatosDependencia('fechaSubsanado', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <input type="checkbox" id="ckFechaReingreso" checked={checkboxesFecha[dependenciaSeleccionada]?.fechaReingreso || false} onChange={() => handleToggleCheckboxFecha('fechaReingreso')} className="rounded" />
                                                                    <label htmlFor="ckFechaReingreso" className="text-sm font-medium">F. Reingreso</label>
                                                                </div>
                                                                <Input type="date" disabled={!checkboxesFecha[dependenciaSeleccionada]?.fechaReingreso} value={datosDepdencias[dependenciaSeleccionada].fechaReingreso} onChange={(e) => handleActualizarDatosDependencia('fechaReingreso', e.target.value)} className="text-sm" />
                                                            </div>
                                                        </div>

                                                        {/* FILA 6: F. Registro, F. Recoger Dependencia, F. Conclusión, (vacío) */}
                                                        <div className="grid grid-cols-4 gap-4">
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <input type="checkbox" id="ckFechaRegistro" checked={checkboxesFecha[dependenciaSeleccionada]?.fechaRegistro || false} onChange={() => handleToggleCheckboxFecha('fechaRegistro')} className="rounded" />
                                                                    <label htmlFor="ckFechaRegistro" className="text-sm font-medium">F. Registro</label>
                                                                </div>
                                                                <Input type="date" disabled={!checkboxesFecha[dependenciaSeleccionada]?.fechaRegistro} value={datosDepdencias[dependenciaSeleccionada].fechaRegistro} onChange={(e) => handleActualizarDatosDependencia('fechaRegistro', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <input type="checkbox" id="ckFechaRecogerD" checked={checkboxesFecha[dependenciaSeleccionada]?.fechaRecogerDependencia || false} onChange={() => handleToggleCheckboxFecha('fechaRecogerDependencia')} className="rounded" />
                                                                    <label htmlFor="ckFechaRecogerD" className="text-sm font-medium">F. Recoger D.</label>
                                                                </div>
                                                                <Input type="date" disabled={!checkboxesFecha[dependenciaSeleccionada]?.fechaRecogerDependencia} value={datosDepdencias[dependenciaSeleccionada].fechaRecogerDependencia} onChange={(e) => handleActualizarDatosDependencia('fechaRecogerDependencia', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <input type="checkbox" id="ckFechaConclusión" checked={checkboxesFecha[dependenciaSeleccionada]?.fechaConclusión || false} onChange={() => handleToggleCheckboxFecha('fechaConclusión')} className="rounded" />
                                                                    <label htmlFor="ckFechaConclusión" className="text-sm font-medium">F. Conclusión</label>
                                                                </div>
                                                                <Input type="date" disabled={!checkboxesFecha[dependenciaSeleccionada]?.fechaConclusión} value={datosDepdencias[dependenciaSeleccionada].fechaConclusión} onChange={(e) => handleActualizarDatosDependencia('fechaConclusión', e.target.value)} className="text-sm" />
                                                            </div>
                                                            <div />
                                                        </div>
                                                    </div>

                                                    {/* Botones de Acción */}
                                                    <div className="flex gap-3 mt-6">
                                                        <Button onClick={() => setDependenciaSeleccionada(null)} variant="outline" className="text-sm">Cerrar</Button>
                                                    </div>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </TabsContent>


                                {/* GRUPO 2: DOCUMENTOS & INMUEBLES - Solo disponible al editar */}
                                {isEditing && (
                                <TabsContent value="docs-inmuebles" className="space-y-6">
                                    <Tabs defaultValue="recibo-documentos" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 mb-3">
                                            <TabsTrigger value="recibo-documentos" className="text-xs sm:text-sm">Recibo Documentos</TabsTrigger>
                                            <TabsTrigger value="inmuebles" className="text-xs sm:text-sm">Inmuebles</TabsTrigger>
                                            <TabsTrigger value="presupuesto" className="text-xs sm:text-sm">Presupuesto</TabsTrigger>
                                        </TabsList>

                                        {/* SubTab: Recibo de Documentos */}
                                        <TabsContent value="recibo-documentos" className="space-y-4">
                                            <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md mb-6">
                                                <div className="flex items-center justify-between gap-2">
                                                    <h3 className="font-semibold text-blue-900 dark:text-blue-100">Documentos del Expediente</h3>
                                                    <div className="flex gap-2">
                                                       <Button
                                                variant="outline"
                                                onClick={handleAbrirReciboDocumentos}
                                                 disabled={isLoadingRecibo || !currentExpedienteId || !clienteSeleccionadoDocumentos}
                                            >
                                                {isLoadingRecibo ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Eye className="h-4 w-4 mr-2" />
                                                )}
                                                Ver Recibo
                                            </Button>
                                                        <Button
                                                            size="sm"
                                                            className="bg-blue-600 hover:bg-blue-700"
                                                            onClick={fetchDocumentosDisponibles}
                                                            disabled={cargandoDocumentosDisponibles}
                                                        >
                                                            {cargandoDocumentosDisponibles ? (
                                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            ) : (
                                                                <Plus className="h-4 w-4 mr-2" />
                                                            )}
                                                            Agregar Documento
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>

                                            {mostrarModalAgregarDocumento && (
                                                <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
                                                    <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
                                                        <h3 className="text-lg font-semibold mb-4">Selecciona Documentos para Agregar</h3>
                                                        <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
                                                            {(() => {
                                                                const documentosAgregados = obtenerDocumentosAgregados();
                                                                const documentosFiltrados = documentosDisponibles.filter(
                                                                    d => d.activo && !documentosAgregados.has(d.descripcion)
                                                                );

                                                                if (documentosFiltrados.length === 0) {
                                                                    return (
                                                                        <p className="text-sm text-muted-foreground text-center py-4">
                                                                            Todos los documentos disponibles ya han sido agregados.
                                                                        </p>
                                                                    );
                                                                }

                                                                return documentosFiltrados.map((doc) => (
                                                                    <div
                                                                        key={doc.id}
                                                                        className="flex items-center gap-2 px-4 py-2 rounded border border-input hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                    >
                                                                        <input
                                                                            type="checkbox"
                                                                            id={`doc-${doc.id}`}
                                                                            checked={documentosSeleccionados[doc.id] || false}
                                                                            onChange={(e) => setDocumentosSeleccionados(prev => ({
                                                                                ...prev,
                                                                                [doc.id]: e.target.checked
                                                                            }))}
                                                                            className="w-4 h-4 cursor-pointer"
                                                                        />
                                                                        <label
                                                                            htmlFor={`doc-${doc.id}`}
                                                                            className="text-sm cursor-pointer flex-1"
                                                                        >
                                                                            {doc.descripcion}
                                                                        </label>
                                                                    </div>
                                                                ));
                                                            })()}
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <Button
                                                                variant="outline"
                                                                onClick={() => {
                                                                    setMostrarModalAgregarDocumento(false);
                                                                    setDocumentosSeleccionados({});
                                                                }}
                                                                className="flex-1"
                                                            >
                                                                Cancelar
                                                            </Button>
                                                            <Button
                                                                className="flex-1 bg-blue-600 hover:bg-blue-700"
                                                                onClick={handleAgregarDocumentosSeleccionados}
                                                            >
                                                                Agregar Seleccionados
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {cargandoDocumentosExpediente && (
                                                <div className="flex items-center justify-center py-8">
                                                    <div className="flex items-center gap-2">
                                                        <Loader2 className="h-5 w-5 animate-spin" />
                                                        <span className="text-sm text-muted-foreground">Cargando documentos...</span>
                                                    </div>
                                                </div>
                                            )}

                                            {!cargandoDocumentosExpediente && documentosPorCliente && documentosPorCliente.length === 0 && (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <p>No hay documentos disponibles para este expediente.</p>
                                                </div>
                                            )}

                                            {!cargandoDocumentosExpediente && documentosPorCliente && documentosPorCliente.length > 0 && (
                                                <div className="space-y-4">
                                                    {/* Dropdown para seleccionar cliente */}
                                                    <div className="flex items-center gap-3">
                                                        <label className="text-sm font-medium">Cliente:</label>
                                                        <select
                                                            value={String(clienteSeleccionadoDocumentos || '')}
                                                            onChange={(e) => setClienteSeleccionadoDocumentos(parseInt(e.target.value))}
                                                            className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
                                                        >
                                                            {documentosPorCliente.map((grupoCliente) => (
                                                                <option key={grupoCliente.id_Cliente} value={String(grupoCliente.id_Cliente)}>
                                                                    {grupoCliente.cliente}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>

                                                    {/* Mostrar tabla del cliente seleccionado */}
                                                    {clienteSeleccionadoDocumentos && (
                                                        <div className="border rounded-lg overflow-hidden">
                                                            <div className="overflow-x-auto">
                                                                <table className="w-full text-sm">
                                                                    <thead className="bg-slate-200 dark:bg-slate-700 border-b">
                                                                        <tr>
                                                                            <th className="px-3 py-2 text-left">Documento</th>
                                                                            <th className="px-2 py-2 text-center">Copia</th>
                                                                            <th className="px-2 py-2 text-center">Original</th>
                                                                            <th className="px-2 py-2 text-center">Fecha Entrega</th>
                                                                            <th className="px-2 py-2 text-center">Usuario Recibe</th>
                                                                            <th className="px-2 py-2 text-center">Fecha Recepción</th>
                                                                            <th className="px-2 py-2 text-center">Usuario Recepción</th>
                                                                            <th className="px-3 py-2 text-left">Observaciones</th>
                                                                            <th className="px-2 py-2 text-center"></th>
                                                                        </tr>
                                                                    </thead>
                                                                    <tbody>
                                                                        {documentosPorCliente
                                                                            .find(gc => gc.id_Cliente === clienteSeleccionadoDocumentos)
                                                                            ?.documentos.map((doc, docIdx) => {
                                                                            const docEditado = documentosEditados[doc.id] || {
                                                                                cliente_Id: doc.cliente_Id,
                                                                                documento_Id: doc.documento_Id,
                                                                                fecha_Entrega: doc.fecha_Entrega,
                                                                                usuario_Recibe: doc.usuario_Recibe,
                                                                                fecha_Recepcion: doc.fecha_Recepcion,
                                                                                usuario_Recepcion: doc.usuario_Recepcion,
                                                                                observaciones: doc.observaciones,
                                                                                copia: doc.copia,
                                                                                original: doc.original,
                                                                            };
                                                                            return (
                                                                                <tr key={docIdx} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                                                    <td className="px-3 py-2">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={doc.documento}
                                                                                            readOnly
                                                                                            className="w-full px-2 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={docEditado.copia}
                                                                                            onChange={(e) => handleDocumentoChange(doc.id, 'copia', e.target.checked)}
                                                                                            className="rounded w-5 h-5 cursor-pointer"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <input
                                                                                            type="checkbox"
                                                                                            checked={docEditado.original}
                                                                                            onChange={(e) => handleDocumentoChange(doc.id, 'original', e.target.checked)}
                                                                                            className="rounded w-5 h-5 cursor-pointer"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <input
                                                                                            type="date"
                                                                                            value={docEditado.fecha_Entrega || ''}
                                                                                            onChange={(e) => handleDocumentoChange(doc.id, 'fecha_Entrega', e.target.value || null)}
                                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={docEditado.usuario_Recibe || ''}
                                                                                            onChange={(e) => handleDocumentoChange(doc.id, 'usuario_Recibe', e.target.value || null)}
                                                                                            placeholder="-"
                                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <input
                                                                                            type="date"
                                                                                            value={docEditado.fecha_Recepcion || ''}
                                                                                            onChange={(e) => handleDocumentoChange(doc.id, 'fecha_Recepcion', e.target.value || null)}
                                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={docEditado.usuario_Recepcion || ''}
                                                                                            onChange={(e) => handleDocumentoChange(doc.id, 'usuario_Recepcion', e.target.value || null)}
                                                                                            placeholder="-"
                                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-3 py-2">
                                                                                        <input
                                                                                            type="text"
                                                                                            value={docEditado.observaciones || ''}
                                                                                            onChange={(e) => handleDocumentoChange(doc.id, 'observaciones', e.target.value || null)}
                                                                                            placeholder="-"
                                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                                        />
                                                                                    </td>
                                                                                    <td className="px-2 py-2 text-center">
                                                                                        <button
                                                                                            onClick={() => handleEliminarDocumentoDeAll(doc.documento)}
                                                                                            className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs transition-colors"
                                                                                            title="Eliminar documento de todas las tablas"
                                                                                        >
                                                                                            <X className="h-4 w-4" />
                                                                                        </button>
                                                                                    </td>
                                                                                </tr>
                                                                            );
                                                                        })}
                                                                    </tbody>
                                                                </table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </TabsContent>

                                        {/* SubTab: Inmuebles */}
                                        <TabsContent value="inmuebles" className="space-y-4">
                                            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-md mb-6">
                                                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Gestión de Inmuebles</h3>
                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">+ Agregar Inmueble</Button>
                                            </div>
                                            {/* Tabla de resultados de inmuebles con selección */}
                                            {(() => {
                                                // Estado local para demo, reemplaza por tu estado real
                                                const inmueblesDemo = [
                                                    { numero: 1, tipo: 'Casa', catastral: '123-ABC' },
                                                    { numero: 2, tipo: 'Departamento', catastral: '456-DEF' },
                                                ];
                                                return <>
                                                    <div className="border rounded-lg overflow-hidden" style={{ height: '300px', display: 'flex', flexDirection: 'column' }}>
                                                        <div className="overflow-x-auto overflow-y-auto flex-1">
                                                            <table className="w-full text-sm">
                                                                <thead className="bg-slate-200 dark:bg-slate-700 border-b sticky top-0">
                                                                    <tr>
                                                                        <th className="px-3 py-2 text-left">#</th>
                                                                        <th className="px-3 py-2 text-left">Tipo de Inmueble</th>
                                                                        <th className="px-3 py-2 text-left">Clave Catastral</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody>
                                                                    {inmueblesDemo.map((inmueble, idx) => (
                                                                        <tr
                                                                            key={idx}
                                                                            className={`border-b hover:bg-blue-100 dark:hover:bg-blue-900/30 cursor-pointer ${selectedInmueble === idx ? 'bg-blue-100 dark:bg-blue-900/30' : ''}`}
                                                                            onClick={() => setSelectedInmueble(idx)}
                                                                        >
                                                                            <td className="px-3 py-2">{inmueble.numero}</td>
                                                                            <td className="px-3 py-2">{inmueble.tipo}</td>
                                                                            <td className="px-3 py-2">{inmueble.catastral}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                    {/* Formulario de datos del inmueble seleccionado */}
                                                    {selectedInmueble !== null && (
                                                        <div className="border rounded-lg bg-background/50 p-6 mt-4">
                                                            <h4 className="font-semibold mb-4 text-blue-900 dark:text-blue-100">Datos del Inmueble</h4>
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-medium">Tipo (Factura/Complemento)</label>
                                                                    <select
                                                                        className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                                        value={formInmueble.tipoFactura}
                                                                        onChange={e => setFormInmueble(f => ({ ...f, tipoFactura: e.target.value }))}
                                                                    >
                                                                        <option value="">Selecciona</option>
                                                                        {TIPO_FACTURA_OPCIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-medium">Tipo (Vulnerables)</label>
                                                                    <select
                                                                        className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                                        value={formInmueble.tipoVulnerable}
                                                                        onChange={e => setFormInmueble(f => ({ ...f, tipoVulnerable: e.target.value }))}
                                                                    >
                                                                        <option value="">Selecciona</option>
                                                                        {TIPO_VULNERABLES_OPCIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                                    </select>
                                                                </div>
                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-medium">Tipo Inmueble (Declaranot)</label>
                                                                    <select
                                                                        className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                                        value={formInmueble.tipoDeclaranot}
                                                                        onChange={e => setFormInmueble(f => ({ ...f, tipoDeclaranot: e.target.value }))}
                                                                    >
                                                                        <option value="">Selecciona</option>
                                                                        {TIPO_DECLARANOT_OPCIONES.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                                                    </select>
                                                                </div>
                                                            </div>
                                                            <div className="mb-6">
                                                                <label className="text-sm font-medium block mb-2">Medidas y colindancias</label>
                                                                <textarea
                                                                    className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm min-h-[70px]"
                                                                    value={formInmueble.medidas}
                                                                    onChange={e => setFormInmueble(f => ({ ...f, medidas: e.target.value }))}
                                                                    placeholder="Medidas y colindancias"
                                                                />
                                                            </div>
                                                            <div className="mb-6">
                                                                <label className="text-sm font-medium block mb-2">Antecedentes</label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                                    value={formInmueble.antecedentes}
                                                                    onChange={e => setFormInmueble(f => ({ ...f, antecedentes: e.target.value }))}
                                                                    placeholder="Antecedentes"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium block mb-2">Descripción del inmueble</label>
                                                                <input
                                                                    type="text"
                                                                    className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                                                    value={formInmueble.descripcion}
                                                                    onChange={e => setFormInmueble(f => ({ ...f, descripcion: e.target.value }))}
                                                                    placeholder="Descripción del inmueble"
                                                                />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>;
                                            })()}
                                        </TabsContent>

                                        {/* SubTab: Presupuesto */}
                                        <TabsContent value="presupuesto" className="space-y-4">
                                            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-md mb-6">
                                                <h3 className="font-semibold text-indigo-900 dark:text-indigo-100 mb-2">Presupuesto de la Operación</h3>
                                            </div>
                                            <div className="border rounded-lg p-6 bg-background/50 mb-6">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center p-3 border-b">
                                                        <span className="text-sm font-medium">Arancel Notarial</span>
                                                        <Input type="number" step="0.01" placeholder="0.00" className="text-sm w-32" />
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 border-b">
                                                        <span className="text-sm font-medium">Impuestos Municipales</span>
                                                        <Input type="number" step="0.01" placeholder="0.00" className="text-sm w-32" />
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 border-b">
                                                        <span className="text-sm font-medium">Derechos Federales</span>
                                                        <Input type="number" step="0.01" placeholder="0.00" className="text-sm w-32" />
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded font-semibold">
                                                        <span className="text-sm">TOTAL PRESUPUESTO</span>
                                                        <span className="text-lg">$0.00</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </TabsContent>
                                )}

                                {/* GRUPO 3: FINANCIERO & CONTROL - Solo disponible al editar */}
                                {isEditing && (
                                <TabsContent value="financiero-control" className="space-y-6">
                                    <Tabs defaultValue="estado-cuenta" className="w-full">
                                        <TabsList className="grid w-full grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 mb-4 p-1">
                                            <TabsTrigger value="estado-cuenta" className="text-xs">Estado Cuenta</TabsTrigger>
                                            <TabsTrigger value="pld" className="text-xs">PLD</TabsTrigger>
                                            <TabsTrigger value="operaciones-lavado" className="text-xs">Op. Lavado</TabsTrigger>
                                            <TabsTrigger value="exportaciones" className="text-xs">Exportaciones</TabsTrigger>
                                        </TabsList>

                                        {/* SubTab: Estado de Cuenta */}
                                        <TabsContent value="estado-cuenta" className="space-y-4">
                                            <div className="grid grid-cols-3 gap-4 mb-6">
                                                <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950/30">
                                                    <p className="text-xs text-muted-foreground mb-1">Saldo Pendiente</p>
                                                    <p className="text-2xl font-bold text-green-600">$0.00</p>
                                                </div>
                                                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950/30">
                                                    <p className="text-xs text-muted-foreground mb-1">Total Pagado</p>
                                                    <p className="text-2xl font-bold text-blue-600">$0.00</p>
                                                </div>
                                                <div className="border rounded-lg p-4 bg-amber-50 dark:bg-amber-950/30">
                                                    <p className="text-xs text-muted-foreground mb-1">Total Adeudado</p>
                                                    <p className="text-2xl font-bold text-amber-600">$0.00</p>
                                                </div>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h4 className="font-semibold mb-4">Histórico de Movimientos</h4>
                                                <div className="text-sm text-muted-foreground text-center py-8">No hay movimientos registrados</div>
                                            </div>
                                        </TabsContent>

                                        {/* SubTab: PLD (Prevención de Lavado de Dinero) */}
                                        <TabsContent value="pld" className="space-y-4">
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Revisión PLD Realizada</label>
                                                    <select className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                                        <option value="">Selecciona</option>
                                                        <option value="SI">Sí</option>
                                                        <option value="NO">No</option>
                                                        <option value="PENDIENTE">Pendiente</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Fecha Revisión</label>
                                                    <Input type="date" className="text-sm" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Observaciones PLD</label>
                                                <textarea placeholder="Resultado de la revisión PLD..." rows={4} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                                            </div>
                                        </TabsContent>

                                        {/* SubTab: Operaciones de Lavado */}
                                        <TabsContent value="operaciones-lavado" className="space-y-4">
                                            <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-md mb-6">
                                                <h3 className="font-semibold text-red-900 dark:text-red-100 mb-2">Registro de Operaciones Sospechosas</h3>
                                                <Button size="sm" className="bg-red-600 hover:bg-red-700">+ Registrar Operación</Button>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="border rounded-lg p-4 bg-background/50">
                                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Tipo de Operación</label>
                                                            <Input type="text" placeholder="Tipo" className="text-sm" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Monto</label>
                                                            <Input type="number" step="0.01" placeholder="0.00" className="text-sm" />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Descripción/Justificación</label>
                                                        <textarea placeholder="Justificación de la operación..." rows={3} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* SubTab: Exportaciones */}
                                        <TabsContent value="exportaciones" className="space-y-4">
                                            <div className="space-y-4 mb-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Requiere Exportación</label>
                                                    <select className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                                        <option value="">Selecciona</option>
                                                        <option value="SI">Sí, requiere exportación</option>
                                                        <option value="NO">No requiere</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Tipo de Exportación</label>
                                                    <select className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                                        <option value="">Selecciona tipo</option>
                                                        <option value="SAT">SAT</option>
                                                        <option value="BANCO">Sistema Bancario</option>
                                                        <option value="OTRA">Otra</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Estatus de Exportación</label>
                                                    <select className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                                        <option value="">Selecciona</option>
                                                        <option value="PENDIENTE">Pendiente</option>
                                                        <option value="En_PROCESO">En Proceso</option>
                                                        <option value="COMPLETADA">Completada</option>
                                                        <option value="RECHAZADA">Rechazada</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </TabsContent>
                                )}

                                {/* GRUPO 4: PROCESO & TRÁMITES - Solo disponible al editar */}
                                {isEditing && (
                                <TabsContent value="proceso-tramites" className="space-y-6">
                                    <Tabs defaultValue="etapas-expediente" className="w-full">
                                        <TabsList className="grid w-full grid-cols-3 gap-1 bg-slate-100 dark:bg-slate-800 mb-4 p-1">
                                            <TabsTrigger value="etapas-expediente" className="text-xs">Etapas</TabsTrigger>
                                            <TabsTrigger value="solicitud-seguimiento" className="text-xs">Solicitud</TabsTrigger>
                                            <TabsTrigger value="recibo-general" className="text-xs">Recibo General</TabsTrigger>
                                        </TabsList>

                                        {/* SubTab: Etapas del Expediente */}
                                        <TabsContent value="etapas-expediente" className="space-y-4">
                                            <div className="space-y-4">
                                                {[
                                                    { nombre: 'Recepción de Documentos', estatus: 'completada', fecha: '2024-01-15' },
                                                    { nombre: 'Revisión Inicial', estatus: 'completada', fecha: '2024-01-16' },
                                                    { nombre: 'Análisis Jurídico', estatus: 'completada', fecha: '2024-01-17' },
                                                    { nombre: 'Validación PLD', estatus: 'en_proceso', fecha: null },
                                                    { nombre: 'Firma de Escritura', estatus: 'pendiente', fecha: null },
                                                    { nombre: 'Registro en RPC', estatus: 'pendiente', fecha: null }
                                                ].map((etapa, idx) => (
                                                    <div key={idx} className="border rounded-lg p-4">
                                                        <div className="flex items-center justify-between">
                                                            <div>
                                                                <h4 className="font-semibold text-sm">{etapa.nombre}</h4>
                                                                {etapa.fecha && <p className="text-xs text-muted-foreground mt-1">Completado: {etapa.fecha}</p>}
                                                            </div>
                                                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                                etapa.estatus === 'completada' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-100' :
                                                                etapa.estatus === 'en_proceso' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-100' :
                                                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-100'
                                                            }`}>
                                                                {etapa.estatus.replace('_', ' ').toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </TabsContent>

                                        {/* SubTab: Solicitud y Seguimiento de Trámites */}
                                        <TabsContent value="solicitud-seguimiento" className="space-y-4">
                                            <div className="space-y-4">
                                                <div className="space-y-2 mb-6">
                                                    <label className="text-sm font-medium">Tipo de Solicitud</label>
                                                    <Input type="text" placeholder="Tipo de solicitud tramitada" className="text-sm" />
                                                </div>
                                                <div className="grid grid-cols-2 gap-4 mb-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Fecha de Solicitud</label>
                                                        <Input type="date" className="text-sm" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Instancia</label>
                                                        <Input type="text" placeholder="Dependencia tramitadora" className="text-sm" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Estatus Actual</label>
                                                    <select className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                                        <option value="">Selecciona estatus</option>
                                                        <option value="PRETRÁMITE">Pretrámite</option>
                                                        <option value="EN_TRAMITE">En Trámite</option>
                                                        <option value="RESUELTO">Resuelto</option>
                                                        <option value="RECHAZADO">Rechazado</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Observaciones</label>
                                                    <textarea placeholder="Seguimiento y observaciones..." rows={4} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* SubTab: Recibo General */}
                                        <TabsContent value="recibo-general" className="space-y-4">
                                            <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-900">
                                                <div className="text-center mb-6">
                                                    <h3 className="text-2xl font-bold mb-2">RECIBO GENERAL</h3>
                                                    <p className="text-sm text-muted-foreground">Expediente Control Notarial</p>
                                                </div>
                                                <div className="space-y-3 text-sm">
                                                    <div className="flex justify-between border-b pb-2">
                                                        <span>Número de Expediente:</span>
                                                        <span className="font-semibold">-</span>
                                                    </div>
                                                    <div className="flex justify-between border-b pb-2">
                                                        <span>Fecha de Emisión:</span>
                                                        <span className="font-semibold">-</span>
                                                    </div>
                                                    <div className="flex justify-between border-b pb-2">
                                                        <span>Notario:</span>
                                                        <span className="font-semibold">-</span>
                                                    </div>
                                                    <div className="flex justify-between border-b pb-2">
                                                        <span>Monto Total:</span>
                                                        <span className="font-semibold">$0.00</span>
                                                    </div>
                                                    <div className="flex justify-between font-bold pt-2">
                                                        <span>TOTAL A PAGAR:</span>
                                                        <span className="text-lg text-green-600">$0.00</span>
                                                    </div>
                                                </div>
                                                <Button className="w-full mt-6 bg-blue-600 hover:bg-blue-700">Descargar Recibo</Button>
                                            </div>
                                        </TabsContent>


                                    </Tabs>
                                </TabsContent>
                                )}

                            </Tabs>

                        {/* BOTONES DE ACCIÓN */}
                        <div className="flex gap-2 justify-end pt-6 border-t mt-6">
                            <Button variant="outline" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveExpediente}
                                disabled={isSaving}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isSaving ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Plus className="h-4 w-4 mr-2" />
                                )}
                                {isEditing ? 'Actualizar' : 'Guardar'} Expediente
                            </Button>
                        </div>
                    </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* MODAL DE RECIBO DE DOCUMENTOS */}
            {showReciboModal && reciboUrl && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
                    <div className="bg-white rounded-lg shadow-lg w-[95vw] h-[95vh] flex flex-col">
                        <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                            <h2 className="text-lg font-bold">Recibo de Documentos</h2>
                            <button
                                onClick={closeReciboModal}
                                className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                            >
                                ×
                            </button>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <iframe
                                src={reciboUrl}
                                width="100%"
                                height="100%"
                                style={{ border: 'none' }}
                                title="PDF Recibo"
                            />
                        </div>
                        <div className="flex gap-2 justify-end p-3 border-t bg-gray-50">
                            <a
                                href={reciboUrl}
                                download={`Recibo_Documentos_${currentExpedienteId}_${clienteSeleccionadoDocumentos}.pdf`}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                            >
                                Descargar PDF
                            </a>
                            <button
                                onClick={closeReciboModal}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

ExpedientesIndex.layout = (page: React.ReactNode) => (
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
            title: 'Expedientes',
            href: '/admin/control-notarial/expedientes',
        },
        {
            title: 'Expedientes',
            href: '/admin/control-notarial/expedientes/expedientes',
        },
    ]}>
        {page}
    </AppLayout>
);


