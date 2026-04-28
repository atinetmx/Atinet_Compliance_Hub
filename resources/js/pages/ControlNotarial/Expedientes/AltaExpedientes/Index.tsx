import { Head, usePage } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, FileText, ChevronDown, DollarSign, Building, Users, Check } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { useApi } from '@/services/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { handleControlNotarialResponse } from '@/helpers/controlNotarialResponse';

import { useToast } from '@/contexts/ToastContext';
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
import SearchExpedientes from './Components/SearchExpedientes';
import GeneralInfoForm from './Components/GeneralInfoForm';
import DocumentosForm from './Components/DocumentosForm';
import InmueblesForm from './Components/InmueblesForm';
import FinancieroControlForm from './Components/FinancieroControlForm';
import ProcesosForm from './Components/ProcesosForm';
import PDFViewerModal from '../../Modals/PDFViewerModal';
import { MessageModal, useMessageModal } from '../../Modals';

import type { BreadcrumbItem } from '@/types';

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

interface ClienteBusqueda {
    id: number;
    tipo_Cliente: string;
    alias: string;
    nombre: string;
    apellido_Paterno: string;
    apellido_Materno: string;
    rfc: string;
    curp: string;
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

interface ReciboProvisor {
    id: number;
    numero_Recibo: string;
    expediente: string;
    escritura_Numero?: string;
    nombre: string;
    operacion_Concepto: string;
    total: number;
    estatus: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
    fecha_Creacion: string;
}

interface ReciboDetalle {
    id: number;
    numero_Recibo: string;
    expediente: string;
    escritura_Numero?: string;
    nombre: string;
    operacion_Concepto: string;
    total: number;
    estatus: 'PENDIENTE' | 'PAGADO' | 'CANCELADO';
    fecha_Creacion: string;
    notario: string;
    forma_Pago: string;
    total_Gastos_Impuestos_Derechos: number;
    total_Gastos_Notariales: number;
    total_Honorarios: number;
    observacion?: string;
}

interface Presupuesto {
    id?: number;
    numero_Presupuesto: string;
    cliente: string;
    tipo_Compareciente: string;
    operacion: string;
    total_Honorarios: number;
    total_Impuestos_Derechos: number;
    total_Gastos_Notariales: number;
    total_Presupuesto: number;
    validado?: boolean;
}

interface DataPLD {
    descripcion: string;
    usuario?: string;
    clave: 'PENDIENTE' | 'REALIZADO' | 'RECHAZADO';
    fecha_Realizado?: string;
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
    const { addToast } = useToast();
    const messageModal = useMessageModal();

    // --- Estado pestaña Búsqueda ---
    const [filtro, setFiltro] = useState('');
    const [resultados, setResultados] = useState<BusquedaResultado[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // Validar autenticación al montar
    const { isReady } = useAuthGuard();

    // --- Control de pestaña activa ---
    const [activeTab, setActiveTab] = useState('busqueda');
    const [activeInternalTab, setActiveInternalTab] = useState('info-general');

    // --- Estado pestaña Formulario ---
    const [isEditing, setIsEditing] = useState(false);
    const [expedienteEsVulnerable, setExpedienteEsVulnerable] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
    const [cargandoAsignarFolios, setCargandoAsignarFolios] = useState(false);
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

    // Estados para Modal de Búsqueda de Clientes (Comparecientes)
    const [showClienteModalComparecientes, setShowClienteModalComparecientes] = useState(false);
    const [clienteResultadosComparecientes, setClienteResultadosComparecientes] = useState<ClienteBusqueda[]>([]);
    const [isSearchingClientesComparecientes, setIsSearchingClientesComparecientes] = useState(false);
    const [clienteErrorComparecientes, setClienteErrorComparecientes] = useState<string | null>(null);
    const [clienteFiltroComparecientes, setClienteFiltroComparecientes] = useState('');
    const [clientesSeleccionadosEnModal, setClientesSeleccionadosEnModal] = useState<ClienteBusqueda[]>([]);

    // --- Estado del Formulario de Recibo ---
    const [reciboData, setReciboData] = useState({
        impuestosDerechos: 0,
        gastosNotariales: 0,
        honorarios: 0,
        concepto: '',
        formaPago: '',
        observaciones: '',
        clienteId: null as number | null,
    });

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
    const [operacionesDelExpediente, setOperacionesDelExpediente] = useState<Operacion[]>([]);

    // --- Estado para guardar ID del expediente actual ---
    const [currentExpedienteId, setCurrentExpedienteId] = useState<number | null>(null);

    // --- Estado para almacenar recibos provisionales ---
    const [recibosProvisionales, setRecibosProvisionales] = useState<ReciboProvisor[]>([]);
    const [cargandoRecibos, setCargandoRecibos] = useState(false);
    const [mostrarFormularioRecibo, setMostrarFormularioRecibo] = useState(false);
    const [reciboDetalleSeleccionado, setReciboDetalleSeleccionado] = useState<ReciboDetalle | null>(null);
    const [cargandoReciboDetalle, setCargandoReciboDetalle] = useState(false);
    const [showRecibosPdfViewer, setShowRecibosPdfViewer] = useState(false);
    const [recibosPdfUrl, setRecibosPdfUrl] = useState<string | null>(null);

    // --- Estado para almacenar presupuestos ---
    const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([]);
    const [cargandoPresupuestos, setCargandoPresupuestos] = useState(false);
    const [mostrarFormularioPresupuesto, setMostrarFormularioPresupuesto] = useState(false);
    const [presupuestoEditandoId, setPresupuestoEditandoId] = useState<number | null>(null);
    const [presupuestoValidado, setPresupuestoValidado] = useState(false);

    // --- Estados para el modal de presupuestos previos ---
    const [showPresupuestoPrevioModal, setShowPresupuestoPrevioModal] = useState(false);
    const [presupuestosPrevios, setPresupuestosPrevios] = useState<any[]>([]);
    const [filtroPresupuestoPrevio, setFiltroPresupuestoPrevio] = useState('');
    const [isSearchingPresupuestoPrevio, setIsSearchingPresupuestoPrevio] = useState(false);
    const [errorPresupuestoPrevio, setErrorPresupuestoPrevio] = useState<string | null>(null);

    // --- Estado para almacenar datos PLD ---
    const [datosPLD, setDatosPLD] = useState<DataPLD[]>([]);
    const [cargandoPLD, setCargandoPLD] = useState(false);

    // --- Estados para Búsqueda en Listas Negras ---
    const [showListasNegrasModal, setShowListasNegrasModal] = useState(false);
    const [listasNegrasLoading, setListasNegrasLoading] = useState(false);
    const [listasNegrasResults, setListasNegrasResults] = useState<any[]>([]);
    const [listasNegrasError, setListasNegrasError] = useState<string | null>(null);
    const [comparecienteParaBuscar, setComparecienteParaBuscar] = useState<string | null>(null);
    const [formPresupuesto, setFormPresupuesto] = useState({
        cliente: '',
        operacion: '',
        zona_municipio: '',
        valor_operacion: 0,
        valor_avaluo: 0,
        valor_catastral: 0,
        parametro: '',
        honorarios: 0,
        descuento: 0,
        incluir_iva: false,
        iva: 0,
        retencion_isr: 0,
        retencion_iva: 0,
        impuestos_derechos: [] as Array<{id: string; descripcion: string; importe: number; observaciones?: string}>,
        gastos_notariales: [] as Array<{id: string; descripcion: string; importe: number}>,
        activo: true,
    });
    const [operacionFiltro, setOperacionFiltro] = useState('');
    const [showOperacionDropdown, setShowOperacionDropdown] = useState(false);
    const [ret_isr_check, setRetISRCheck] = useState(false);
    const [ret_iva_check, setRetIVACheck] = useState(false);
    const [clienteSelectedPresupuesto, setClienteSelectedPresupuesto] = useState<Cliente | null>(null);
    const [clienteFiltro, setClienteFiltro] = useState('');
    const [showClienteDropdown, setShowClienteDropdown] = useState(false);
    const [municipioFiltroPresupuesto, setMunicipioFiltroPresupuesto] = useState('');
    const [showMunicipioPresupuestoDropdown, setShowMunicipioPresupuestoDropdown] = useState(false);

    // --- Estados para Cálculos de Presupuesto ---
    const [isLoadingHonorarios, setIsLoadingHonorarios] = useState(false);
    const [isLoadingImpuestos, setIsLoadingImpuestos] = useState(false);
    const [impuestosCalculados, setImpuestosCalculados] = useState(false);
    const [showImpuestosModal, setShowImpuestosModal] = useState(false);
    const [impuestosFiltro, setImpuestosFiltro] = useState('');
    const [impuestosResultados, setImpuestosResultados] = useState<any[]>([]);
    const [isSearchingImpuestos, setIsSearchingImpuestos] = useState(false);
    const [impuestosError, setImpuestosError] = useState<string | null>(null);
    const [dependenciasUnicas, setDependenciasUnicas] = useState<string[]>([]);
    const [activeDependenciaTab, setActiveDependenciaTab] = useState<string>('');

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
    const [documentosEditados, setDocumentosEditados] = useState<Record<string, {
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

    // --- Estados para Inmuebles del Expediente ---
    const [inmueblesExpediente, setInmueblesExpediente] = useState<Array<{
        numero_Inmueble: number;
        descripcion: string;
        clave_Catastral: string;
    }>>([]);
    const [cargandoInmueblesExpediente, setCargandoInmueblesExpediente] = useState(false);

    // --- Estados para Inmuebles (Documentos tab) ---
    const [mostrarFormInmueble, setMostrarFormInmueble] = useState(false);
    const [cargandoGuardarInmueble, setCargandoGuardarInmueble] = useState(false);
    const [formInmueble, setFormInmueble] = useState({
        // Datos del Inmueble
        tipoFactura: '',
        tipoVulnerable: '',
        tipoDeclaranot: '',
        medidas: '',
        antecedentes: '',
        descripcion: '',
        // Especificaciones
        claveCatastral: '',
        valorAvaluo: '',
        valorCatastral: '',
        valorOperacion: '',
        superficieTerreno: '',
        superficieConstruida: '',
        ctaAgua: '',
        ctaPredial: '',
        // Domicilio
        calle: '',
        numeroExt: '',
        numeroInt: '',
        manzana: '',
        lote: '',
        pais: '',
        estado: '',
        municipio: '',
        colonia: '',
        cp: '',
        // Antecedentes
        inscripcion: '',
        folioReal: '',
        folioInicial: '',
        folioFinal: '',
        folioElectronico: '',
        partida: '',
        volumen: '',
        seccion: '',
        fechaRegistro: '',
        fechaEscritura: '',
        // Pagos Inmueble
        montoTotal: '',
        formaPago: '',
        fechaPago: '',
        referenciaPago: '',
        observacionesPago: '',
    });

    // Estado para controlar si está editando
    const [inmuebleEnEdicion, setInmuebleEnEdicion] = useState<number | null>(null);
    const [inmuebleIdEnEdicion, setInmuebleIdEnEdicion] = useState<number | null>(null);

    // --- Estados para Antecedentes (Checkboxes) ---
    const [checkboxesAntecedentes, setCheckboxesAntecedentes] = useState({
        fechaRegistro: false,
        fechaEscritura: false,
    });
    const [fechasAntecedentes, setFechasAntecedentes] = useState({
        fechaRegistro: '',
        fechaEscritura: '',
    });

    // --- Estados para Tipos de Inmuebles (API) ---
    const [tiposInmuebles, setTiposInmuebles] = useState<Array<{
        id: number;
        descripcion: string;
        categoria: string;
        activo: boolean;
    }>>([]);
    const [cargandoTiposInmuebles, setCargandoTiposInmuebles] = useState(false);
    const [tiposFactura, setTiposFactura] = useState<Array<{ id: number; descripcion: string }>>([]);
    const [tiposInmuebleFiltrados, setTiposInmuebleFiltrados] = useState<Array<{ id: number; descripcion: string }>>([]);
    const [tiposDeclaranot, setTiposDeclaranot] = useState<Array<{ id: number; descripcion: string }>>([]);

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

    // Estado para validación del número de escritura
    const [numeroEscrituraError, setNumeroEscrituraError] = useState<string | null>(null);
    const [validandoNumeroEscritura, setValidandoNumeroEscritura] = useState(false);
    const [numeroEscrituraTouched, setNumeroEscrituraTouched] = useState(false);
    const [numeroEscrituraOriginal, setNumeroEscrituraOriginal] = useState<string>('');
    const debounceNumeroEscrituraRef = useRef<NodeJS.Timeout | null>(null);

    // Ref para debounce de actualización de documentos individuales
    const debounceTimersRef = useRef<Record<string, NodeJS.Timeout>>({});
    const initializedRef = useRef(false);

    const api = useApi();
    const { props } = usePage();
    const apiBaseUrl = (props as any).apiBaseUrl || 'https://localhost:44327/api';

    // ==========================================
    // SECCIÓN: INICIALIZACIÓN
    // ==========================================
    useEffect(() => {
        if (!isReady) return;
        // Prevenir doble fetch en React Strict Mode (desarrollo)
        if (initializedRef.current) return;
        initializedRef.current = true;

        // Cargar catálogos/datos maestros
        fetchOperaciones();
        fetchMunicipios();
        fetchUsuarios();
        fetchDependencias();
        fetchClientes();
        fetchComparecientes();
        fetchTiposInmuebles();

        // Cargar expedientes
        fetchExpedientes('');

        // Cleanup de timers al desmontar
        return () => {
            Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
            if (debounceNumeroEscrituraRef.current) clearTimeout(debounceNumeroEscrituraRef.current);
        };
    }, [isReady]);

    // Validar número de escritura con debounce (EXPEDIENTES)
    useEffect(() => {
        // Limpiar timer anterior si existe
        if (debounceNumeroEscrituraRef.current) {
            clearTimeout(debounceNumeroEscrituraRef.current);
        }

        // Si el campo está vacío o no fue tocado, limpiar error
        if (!formData.numeroEscritura || !numeroEscrituraTouched) {
            setNumeroEscrituraError(null);
            return;
        }

        // Crear nuevo timer
        debounceNumeroEscrituraRef.current = setTimeout(async () => {
            setValidandoNumeroEscritura(true);
            try {
                const response = await api.post(`/Expediente/ChecarNumeroEscritura?numEscritura=${formData.numeroEscritura}`, {});
                // Si la respuesta es exitosa, no hay error
                setNumeroEscrituraError(null);

                // Mostrar toast con el mensaje de la API
                if (response?.dataResponse == true) {
                    addToast(response.message, 'success', 4000);
                }else {
                         addToast(response.message, 'warning', 4000);
                }
            } catch (error: any) {
                // Si hay error, mostrar el mensaje
                let errorMessage = 'Error al validar el número de escritura.';

                if (error?.response?.data?.message) {
                    errorMessage = error.response.data.message;
                } else if (error?.message) {
                    errorMessage = error.message;
                }

                setNumeroEscrituraError(errorMessage);
                addToast(errorMessage, 'error', 4000);
            } finally {
                setValidandoNumeroEscritura(false);
            }
        }, 500);
    }, [formData.numeroEscritura, api, numeroEscrituraTouched]);

    // ==========================================
    // SECCIÓN: CATÁLOGOS / DATOS MAESTROS
    // ==========================================

    // Cargar presupuestos cuando se carga un expediente
    const fetchPresupuestos = async (expedienteId: number) => {
        setCargandoPresupuestos(true);
        try {
            const response = await api.get(`/Presupuestos/GetPresupuestosXExpediente?expedienteId=${expedienteId}`);
            await handleControlNotarialResponse(response, {
            });
            if (response?.isUnauthorized) {
                setPresupuestos([]);
            } else {
                const data = response?.dataResponse;
                if (data) {
                    setPresupuestos(data);
                } else {
                    setPresupuestos([]);
                }
            }
        } catch (error) {
            console.error('Error cargando presupuestos:', error);
            setPresupuestos([]);
        } finally {
            setCargandoPresupuestos(false);
        }
    };

    // Función para buscar presupuestos previos
    const fetchPresupuestosPrevios = async (filtro: string = '') => {
        setIsSearchingPresupuestoPrevio(true);
        setErrorPresupuestoPrevio(null);
        try {
            const params = new URLSearchParams();
            if (filtro) params.append('filtro', filtro);

            const response = await api.get(`/Presupuestos/GetPresupuestosPrevios?${params}`);
            await handleControlNotarialResponse(response, {
            });

            if (response?.isUnauthorized) {
                setErrorPresupuestoPrevio('No autorizado. Por favor inicia sesión.');
                return;
            }

            const data = response?.dataResponse;
            setPresupuestosPrevios(Array.isArray(data) ? data : []);
        } catch (error: any) {
            console.error('Error fetching presupuestos previos:', error);
            setErrorPresupuestoPrevio(error.message || 'Error al buscar presupuestos');
        } finally {
            setIsSearchingPresupuestoPrevio(false);
        }
    };

    const handleSelectPresupuestoPrevio = async (presupuesto: any) => {
        setIsSearchingPresupuestoPrevio(true);
        setErrorPresupuestoPrevio(null);
        try {
            // Llamar a la API para obtener los detalles completos del presupuesto
            const response = await api.get(`/Presupuestos/GetPresupuestoPrevioById?presupuestoPrevioId=${presupuesto.id}`);

            // ✅ Verificar si el token expiró
            if (response?.isUnauthorized) {
                return;
            }

            if (!response || !response.dataResponse) {
                throw new Error('Error al obtener los detalles del presupuesto');
            }

            const data_response = response.dataResponse;
            const { presupuestoPrevio, impuestosDerechos, gastosNotariales } = data_response;

            // Mapear impuestos y derechos al formato DetalleItem
            const impuestosFormato = impuestosDerechos.map((item: any) => ({
                id: item.impuestos_Derechos_Id.toString(),
                descripcion: item.descripcion,
                importe: item.importe,
                observaciones: item.observaciones || ''
            }));

            // Mapear gastos notariales al formato DetalleItem
            const gastosFormato = gastosNotariales.map((item: any) => ({
                id: Date.now().toString() + Math.random(),
                descripcion: item.concepto,
                importe: item.importe
            }));

            // Solo llenar valores, honorarios e impuestos/gastos
            // Cliente y operación los selecciona el usuario del expediente
            setFormPresupuesto({
                cliente: '', // El usuario selecciona del expediente
                operacion: '', // El usuario selecciona del expediente
                zona_municipio: presupuestoPrevio.zona_Municipio_Id || '',
                valor_operacion: presupuestoPrevio.valor_Operacion,
                valor_avaluo: presupuestoPrevio.valor_Avaluo,
                valor_catastral: presupuestoPrevio.valor_Catastral,
                parametro: presupuestoPrevio.observaciones,
                honorarios: presupuestoPrevio.honorarios,
                descuento: presupuestoPrevio.descuento,
                incluir_iva: presupuestoPrevio.iva > 0,
                iva: presupuestoPrevio.iva,
                retencion_isr: presupuestoPrevio.retencion_ISR,
                retencion_iva: presupuestoPrevio.retencion_IVA,
                impuestos_derechos: impuestosFormato,
                gastos_notariales: gastosFormato,
                activo: presupuestoPrevio.activo,
            });

            // Establecer el filtro de zona/municipio con el nombre seleccionado
            const zonaSeleccionada = municipiosDisponibles.find(z => z.id === presupuestoPrevio.zona_Municipio_Id);
            if (zonaSeleccionada) {
                setMunicipioFiltroPresupuesto(zonaSeleccionada.descripcion);
            }

            // Limpiar filtros de cliente y operación
            setOperacionFiltro('');
            setClienteFiltro('');

            // Resetear validación - el presupuesto ligado no está validado aún
            setPresupuestoValidado(false);

            // Establecer el ID del presupuesto como el que se está editando
            setPresupuestoEditandoId(presupuesto.id);

            addToast('Presupuesto cargado correctamente. Por favor selecciona el cliente y la operación del expediente.', 'success');
            setShowPresupuestoPrevioModal(false);
            setMostrarFormularioPresupuesto(true);
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Error al cargar el presupuesto';
            setErrorPresupuestoPrevio(message);
            addToast(message, 'error');
        } finally {
            setIsSearchingPresupuestoPrevio(false);
        }
    };

    // Guardar Presupuesto
    const handleGuardarPresupuesto = async () => {
        if (!formPresupuesto.cliente || !formPresupuesto.operacion) {
            addToast('Completa los campos obligatorios: Cliente, Operación', 'error');
            return;
        }

        if (!currentExpedienteId) {
            addToast('No hay expediente seleccionado', 'error');
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);

            // Validar que cliente y operación tienen valores válidos
            const clienteId = Number(formPresupuesto.cliente);
            const operacionId = Number(formPresupuesto.operacion);
            const zonaMunicipioId = formPresupuesto.zona_municipio ? Number(formPresupuesto.zona_municipio) : 0;

            if (isNaN(clienteId) || clienteId === 0) {
                addToast('Cliente inválido', 'error');
                setIsSaving(false);
                return;
            }

            if (isNaN(operacionId) || operacionId === 0) {
                addToast('Operación inválida', 'error');
                setIsSaving(false);
                return;
            }

            // Calcular totales
            const subtotalHonorarios = formPresupuesto.honorarios - formPresupuesto.descuento;
            const ivaCalculado = formPresupuesto.incluir_iva ? subtotalHonorarios * 0.16 : 0;

            const payload = {
                presupuesto: {
                    expediente_Id: currentExpedienteId,
                    cliente_Id: clienteId,
                    operacion_Id: operacionId,
                    zona_Municipio_Id: zonaMunicipioId,
                    observaciones: formPresupuesto.parametro,
                    valor_Operacion: formPresupuesto.valor_operacion,
                    valor_Avaluo: formPresupuesto.valor_avaluo,
                    valor_Catastral: formPresupuesto.valor_catastral,
                    parametro: formPresupuesto.parametro,
                    honorarios: formPresupuesto.honorarios,
                    descuento: formPresupuesto.descuento,
                    subtotal_Honorarios: subtotalHonorarios,
                    iva: ivaCalculado,
                    retencion_ISR: formPresupuesto.retencion_isr,
                    retencion_IVA: formPresupuesto.retencion_iva,
                    validado: true,
                    activo: true
                },
                presupuestoImpuestosDerechos: formPresupuesto.impuestos_derechos.map(item => ({
                    impuestos_Derechos_Id: Number(item.id),
                    importe: item.importe,
                    observaciones: item.observaciones || ''
                })),
                presupuestoGastosNotariales: formPresupuesto.gastos_notariales.map(item => ({
                    concepto: item.descripcion,
                    importe: item.importe
                }))
            };

            const response = await api.post('/Presupuestos/CreatePresupuesto', payload);

            if (response?.isUnauthorized) {
                return;
            }

            if (response) {
                addToast('Presupuesto guardado correctamente', 'success');
                setMostrarFormularioPresupuesto(false);
                // Recargar presupuestos si es necesario
                if (currentExpedienteId) {
                    fetchPresupuestos(currentExpedienteId);
                }
            }
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Error al guardar el presupuesto';
            setSaveError(message);
            addToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Obtener detalles del Presupuesto
    const handleObtenerDetallesPresupuesto = async (presupuestoId: number) => {
        try {
            setIsSaving(true);
            setSaveError(null);

            const response = await api.get(`/Presupuestos/GetPresupuestoById?presupuestoId=${presupuestoId}`);

            if (response?.isUnauthorized) {
                return;
            }

            if (!response || !response.dataResponse) {
                throw new Error('Error al obtener los detalles del presupuesto');
            }

            const data_response = response.dataResponse;
            const { presupuestoPrevio, impuestosDerechos, gastosNotariales } = data_response;

            // Mapear impuestos y derechos al formato DetalleItem
            const impuestosFormato = impuestosDerechos.map((item: any) => ({
                id: item.impuestos_Derechos_Id.toString(),
                descripcion: item.descripcion,
                importe: item.importe,
                observaciones: item.observaciones || ''
            }));

            // Mapear gastos notariales al formato DetalleItem
            const gastosFormato = gastosNotariales.map((item: any) => ({
                id: Date.now().toString() + Math.random(),
                descripcion: item.concepto,
                importe: item.importe
            }));

            // Llenar el formulario con los datos del presupuesto
            setFormPresupuesto({
                cliente: presupuestoPrevio.cliente_Id,
                operacion: presupuestoPrevio.operacion_Id,
                zona_municipio: presupuestoPrevio.zona_Municipio_Id || '',
                valor_operacion: presupuestoPrevio.valor_Operacion,
                valor_avaluo: presupuestoPrevio.valor_Avaluo,
                valor_catastral: presupuestoPrevio.valor_Catastral,
                parametro: presupuestoPrevio.observaciones,
                honorarios: presupuestoPrevio.honorarios,
                descuento: presupuestoPrevio.descuento,
                incluir_iva: presupuestoPrevio.iva > 0,
                iva: presupuestoPrevio.iva,
                retencion_isr: presupuestoPrevio.retencion_ISR,
                retencion_iva: presupuestoPrevio.retencion_IVA,
                impuestos_derechos: impuestosFormato,
                gastos_notariales: gastosFormato,
                activo: presupuestoPrevio.activo,
            });

            // Establecer los filtros con los nombres de cliente y operación
            const clienteEnExpediente = filasComparecientes.find(comp => comp.cliente_Id === presupuestoPrevio.cliente_Id);
            const operacionEnExpediente = operacionesDelExpediente.find(op => op.id === presupuestoPrevio.operacion_Id);

            if (clienteEnExpediente) {
                setClienteFiltro(clienteEnExpediente.nombreCompareciente || '');
            }

            if (operacionEnExpediente) {
                setOperacionFiltro(operacionEnExpediente.descripcion);
            }

            const zonaSeleccionada = municipiosDisponibles.find(z => z.id === presupuestoPrevio.zona_Municipio_Id);
            if (zonaSeleccionada) {
                setMunicipioFiltroPresupuesto(zonaSeleccionada.descripcion);
            }

            setPresupuestoValidado(presupuestoPrevio.validado);
            setMostrarFormularioPresupuesto(true);
            setPresupuestoEditandoId(presupuestoId);
            addToast('Presupuesto cargado correctamente', 'success');
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Error al obtener el presupuesto';
            setSaveError(message);
            addToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Validar Presupuesto
    const handleValidarPresupuesto = async () => {
        if (!presupuestoEditandoId) {
            addToast('No hay presupuesto seleccionado', 'error');
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);

            const response = await api.put(`/Presupuestos/ValidateInvalidatePresupuesto?presupuestoId=${presupuestoEditandoId}`, {});

            if (response?.isUnauthorized) {
                return;
            }

            if (response) {
                addToast('Estado del presupuesto actualizado correctamente', 'success');
                // Recargar presupuestos
                if (currentExpedienteId) {
                    fetchPresupuestos(currentExpedienteId);
                }
                setMostrarFormularioPresupuesto(false);
                setPresupuestoEditandoId(null);
            }
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Error al actualizar el estado del presupuesto';
            setSaveError(message);
            addToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Eliminar Presupuesto
    const handleEliminarPresupuesto = async () => {
        if (!presupuestoEditandoId) {
            addToast('No hay presupuesto seleccionado', 'error');
            return;
        }

        const confirmed = await messageModal.confirm(
            '¿Eliminar Presupuesto?',
            'Esta acción no se puede deshacer. El presupuesto será eliminado permanentemente.',
            'error'
        );

        if (!confirmed) {
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);

            const response = await api.delete(`/Presupuestos/DeletePresupuesto?presupuestoId=${presupuestoEditandoId}`);

            if (response?.isUnauthorized) {
                return;
            }

            if (response) {
                addToast('Presupuesto eliminado correctamente', 'success');
                // Recargar presupuestos
                if (currentExpedienteId) {
                    fetchPresupuestos(currentExpedienteId);
                }
                setMostrarFormularioPresupuesto(false);
                setPresupuestoEditandoId(null);
            }
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Error al eliminar el presupuesto';
            setSaveError(message);
            addToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Calcular Honorarios
    const handleCalcularHonorarios = async () => {
        const zonaMunicipioId = formPresupuesto.zona_municipio ? Number(formPresupuesto.zona_municipio) : null;
        const operacionId = formPresupuesto.operacion ? Number(formPresupuesto.operacion) : null;

        if (!zonaMunicipioId || !operacionId) {
            addToast('Selecciona zona/municipio y operación para calcular honorarios', 'error');
            return;
        }

        try {
            setIsLoadingHonorarios(true);
            const response = await api.post(
                `/ConfiguracionTarifaria/CalcularHonorariosPrePrevio?zonaMunicipioId=${zonaMunicipioId}&operacionId=${operacionId}`,
                {}
            );

            if (response && response.dataResponse !== undefined) {
                const honorarios = response.dataResponse;
                setFormPresupuesto(prev => ({
                    ...prev,
                    honorarios: honorarios
                }));
                addToast('Honorarios calculados exitosamente', 'success');
            } else {
                addToast('No se pudieron calcular los honorarios', 'error');
            }
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Error al calcular honorarios';
            addToast(message, 'error');
        } finally {
            setIsLoadingHonorarios(false);
        }
    };

    // Calcular Impuestos y Derechos
    const handleCalcularImpuestos = async () => {
        const zonaMunicipioId = formPresupuesto.zona_municipio ? Number(formPresupuesto.zona_municipio) : null;
        const valOperacion = formPresupuesto.valor_operacion;
        const valAvaluo = formPresupuesto.valor_avaluo;
        const valCatastral = formPresupuesto.valor_catastral;

        if (!zonaMunicipioId || (valOperacion === 0 && valAvaluo === 0 && valCatastral === 0)) {
            addToast('Completa todos los datos: Zona/Municipio y al menos un valor', 'error');
            return;
        }

        if (formPresupuesto.impuestos_derechos.length === 0) {
            addToast('Agrega al menos un trámite para calcular importes', 'error');
            return;
        }

        try {
            setIsLoadingImpuestos(true);

            const listaImpuestos = formPresupuesto.impuestos_derechos.map(item => ({
                impuestos_Derechos_Id: Number(item.id),
                importe: 0
            }));

            const queryParams = new URLSearchParams({
                zonaMunicipioId: zonaMunicipioId.toString(),
                valOperacion: valOperacion.toString(),
                valAvaluo: valAvaluo.toString(),
                valCatastral: valCatastral.toString(),
            });

            const response = await api.post(
                `/ConfiguracionTarifaria/CalcularImpuestosDerechosPrePrevio?${queryParams.toString()}`,
                listaImpuestos
            );

            if (response && response.dataResponse && Array.isArray(response.dataResponse)) {
                setFormPresupuesto(prev => ({
                    ...prev,
                    impuestos_derechos: prev.impuestos_derechos.map(item => {
                        const calculado = response.dataResponse.find(
                            (calc: any) => Number(calc.impuestos_Derechos_Id) === Number(item.id)
                        );
                        return {
                            ...item,
                            importe: calculado ? calculado.importe : 0
                        };
                    })
                }));
                setImpuestosCalculados(true);
                addToast('Importes calculados exitosamente', 'success');
            } else {
                addToast('No se pudieron calcular los importes', 'info');
            }
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Error al calcular importes';
            addToast(message, 'error');
        } finally {
            setIsLoadingImpuestos(false);
        }
    };

    // Cargar impuestos y derechos disponibles
    const fetchImpuestosDerechos = async () => {
        setIsSearchingImpuestos(true);
        setImpuestosError(null);
        try {
            const response = await api.get('/Catalogos/GetImpuestosDerechos');

            if (response?.isUnauthorized) {
                return;
            }

            if (response && response.dataResponse) {
                setImpuestosResultados(response.dataResponse || []);
                const deps = Array.from(new Set(response.dataResponse.map((item: any) => item.dependencia_Publica)));
                const allDeps = ['Todas', ...deps.filter(d => d) as string[]];
                setDependenciasUnicas(allDeps);
                setActiveDependenciaTab('Todas');
            } else {
                setImpuestosError(response?.message || 'No se pudieron cargar los impuestos');
            }
        } catch (error: any) {
            const message = error instanceof Error ? error.message : 'Error al cargar los impuestos';
            setImpuestosError(message);
            addToast(message, 'error');
        } finally {
            setIsSearchingImpuestos(false);
        }
    };

    // Seleccionar/Deseleccionar Impuesto
    const handleSelectImpuesto = (impuesto: any) => {
        setFormPresupuesto(prev => {
            const existe = prev.impuestos_derechos.some(item => item.id === impuesto.id.toString());

            if (existe) {
                return {
                    ...prev,
                    impuestos_derechos: prev.impuestos_derechos.filter(item => item.id !== impuesto.id.toString())
                };
            } else {
                return {
                    ...prev,
                    impuestos_derechos: [...prev.impuestos_derechos, {
                        id: impuesto.id.toString(),
                        descripcion: impuesto.descripcion,
                        importe: 0,
                        observaciones: ''
                    }]
                };
            }
        });
    };

    // Agregar Impuesto
    const addImpuestoDerechos = () => {
        setShowImpuestosModal(true);
        fetchImpuestosDerechos();
    };

    // Eliminar Impuesto
    const removeImpuestoDerechos = (id: string) => {
        setFormPresupuesto(prev => ({
            ...prev,
            impuestos_derechos: prev.impuestos_derechos.filter(item => item.id !== id)
        }));
    };

    // Actualizar Impuesto
    const updateImpuestoDerechos = (id: string, field: 'descripcion' | 'importe' | 'observaciones', value: string | number) => {
        setFormPresupuesto(prev => ({
            ...prev,
            impuestos_derechos: prev.impuestos_derechos.map(item =>
                item.id === id ? { ...item, [field]: field === 'importe' ? Number(value) : value } : item
            )
        }));
    };

    // Agregar Gasto Notarial
    const addGastoNotarial = () => {
        setFormPresupuesto(prev => ({
            ...prev,
            gastos_notariales: [...prev.gastos_notariales, { id: Date.now().toString(), descripcion: '', importe: 0 }]
        }));
    };

    // Eliminar Gasto Notarial
    const removeGastoNotarial = (id: string) => {
        setFormPresupuesto(prev => ({
            ...prev,
            gastos_notariales: prev.gastos_notariales.filter(item => item.id !== id)
        }));
    };

    // Actualizar Gasto Notarial
    const updateGastoNotarial = (id: string, field: 'descripcion' | 'importe', value: string | number) => {
        setFormPresupuesto(prev => ({
            ...prev,
            gastos_notariales: prev.gastos_notariales.map(item =>
                item.id === id ? { ...item, [field]: field === 'importe' ? Number(value) : value } : item
            )
        }));
    };

    // Calcular Totales
    const calcularTotales = () => {
        const subtotalHonorarios = formPresupuesto.honorarios - formPresupuesto.descuento;
        const ivaCalculado = formPresupuesto.incluir_iva ? subtotalHonorarios * 0.16 : 0;

        let retISR = 0;
        let retIVA = 0;

        if (ret_isr_check) {
            retISR = subtotalHonorarios * 0.10;
        }

        if (ret_iva_check && formPresupuesto.incluir_iva) {
            retIVA = ivaCalculado * 0.6666667;
        }

        const totalImpuestos = formPresupuesto.impuestos_derechos.reduce((sum, item) => sum + item.importe, 0);
        const totalGastos = formPresupuesto.gastos_notariales.reduce((sum, item) => sum + item.importe, 0);
        const totalHonorarios = subtotalHonorarios + ivaCalculado - retISR - retIVA;
        const totalPresupuesto = totalHonorarios + totalImpuestos + totalGastos;

        return { subtotalHonorarios, ivaCalculado, retISR, retIVA, totalImpuestos, totalGastos, totalHonorarios, totalPresupuesto };
    };

    // Cargar operaciones disponibles desde API
    const fetchOperaciones = async () => {
        setCargandoOperaciones(true);
        try {
            const response = await api.get('/Catalogos/GetOperaciones');
            await handleControlNotarialResponse(response, {
            });
            if (response?.isUnauthorized) {
                return;
            }
            const data = response?.dataResponse;
            if (data) {
                setOperacionesDisponibles(data);
                setOperacionesFiltradas(data);
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
            const response = await api.get('/Catalogos/GetZonasMunicipios');
            await handleControlNotarialResponse(response, {
            });
            if (response?.isUnauthorized) {
                return;
            }
            const data = response?.dataResponse;
            if (data) {
                setMunicipiosDisponibles(data);
                setMunicipiosFiltrados(data);
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
            const response = await api.get('/User/GetRolesUsuarios');
            await handleControlNotarialResponse(response, {
            });
            if (response?.isUnauthorized) {
                return;
            }
            const data = response?.dataResponse;
            if (data) {
                setUsuarios(data);
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
            const response = await api.get('/Catalogos/GetDependenciasPublicas');
            await handleControlNotarialResponse(response, {
            });
            if (response?.isUnauthorized) {
                return;
            }
            const data = response?.dataResponse;
            if (data) {
                setDependenciasDisponibles(data);
                setDependenciasFiltradas(data);
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
            const response = await api.get('/Clientes/GetClientes');
            await handleControlNotarialResponse(response, {
            });
            if (response?.isUnauthorized) {
                return;
            }
            const data = response?.dataResponse;
            if (data) {
                setClientesDisponibles(data);
                setClientesFiltrados(data);
            }
        } catch (error) {
            console.error('Error cargando clientes:', error);
        } finally {
            setCargandoClientes(false);
        }
    };

    const fetchComparecientes = async () => {
        try {
            const response = await api.get('/Catalogos/GetComparecientes');
            await handleControlNotarialResponse(response, {
            });
            if (response?.isUnauthorized) {
                return;
            }
            console.log('Respuesta Comparecientes:', response);
            // Manejar diferentes formatos de respuesta
            const comparecientes = response?.dataResponse || response;
            if (Array.isArray(comparecientes)) {
                setComparecientesDisponibles(comparecientes);
                console.log('Comparecientes cargados:', comparecientes);
            } else {
                console.warn('Formato de respuesta inesperado para comparecientes');
            }
        } catch (error) {
            console.error('Error cargando comparecientes:', error);
        }
    };

    // Cargar Tipos de Inmuebles desde API
    const fetchTiposInmuebles = async () => {
        // (Datos maestros - parte de catálogos)
        setCargandoTiposInmuebles(true);
        try {
            const response = await api.get('/Catalogos/GetTipoInmueble');
            await handleControlNotarialResponse(response, {
            });
            if (response?.isUnauthorized) {
                return;
            }
            const data = response?.dataResponse;
            if (data) {
                setTiposInmuebles(data);

                // Filtrar por categoría
                const factura = data.filter((item: any) => item.categoria === 'FACTURA');
                const inmueble = data.filter((item: any) => item.categoria === 'INMUEBLE');
                const declaranot = data.filter((item: any) => item.categoria === 'DECLARANOT');

                setTiposFactura(factura.map((item: any) => ({ id: item.id, descripcion: item.descripcion })));
                setTiposInmuebleFiltrados(inmueble.map((item: any) => ({ id: item.id, descripcion: item.descripcion })));
                setTiposDeclaranot(declaranot.map((item: any) => ({ id: item.id, descripcion: item.descripcion })));

                console.log('Tipos de Inmuebles cargados:', { factura, inmueble, declaranot });
            }
        } catch (error) {
            console.error('Error cargando tipos de inmuebles:', error);
        } finally {
            setCargandoTiposInmuebles(false);
        }
    };

    // ==========================================
    // SECCIÓN: INMUEBLES
    // ==========================================

    // Editar Inmueble - Obtener datos y llenar formulario
    const handleEditarInmueble = async (inmuebleId: number) => {
        setCargandoGuardarInmueble(true);
        try {
            const data = await api.get(`/Expediente/GetInmueblesById?inmuebleId=${inmuebleId}`);
            if (data && data.dataResponse && data.dataResponse.length > 0) {
                const inmueblesData = data.dataResponse[0];
                const datosData = inmueblesData.datos || {};
                const especificacionesData = inmueblesData.especificaciones || {};
                const domicilioData = inmueblesData.domicilio || {};
                const antecedentesData = inmueblesData.antecedentes || {};

                // Llenar el formulario con los datos obtenidos
                setFormInmueble({
                    // Datos del Inmueble
                    tipoFactura: datosData.tipo_Factura_Id?.toString() || '',
                    tipoVulnerable: datosData.tipo_Inmueble_Id?.toString() || '',
                    tipoDeclaranot: datosData.tipo_Inmueble_DeclaraNot_Id?.toString() || '',
                    medidas: datosData.medidas_Colindancias || '',
                    antecedentes: datosData.antecedentes || '',
                    descripcion: datosData.descripcion || '',
                    // Especificaciones
                    claveCatastral: especificacionesData.clave_Catastral || '',
                    valorAvaluo: especificacionesData.valor_Avaluo?.toString() || '',
                    valorCatastral: especificacionesData.valor_Catastral?.toString() || '',
                    valorOperacion: especificacionesData.valor_Operacion?.toString() || '',
                    superficieTerreno: especificacionesData.superficie_Terreno?.toString() || '',
                    superficieConstruida: especificacionesData.superficie_Construccion?.toString() || '',
                    ctaAgua: especificacionesData.cuenta_Agua?.toString() || '',
                    ctaPredial: especificacionesData.cuenta_Predial?.toString() || '',
                    // Domicilio
                    calle: domicilioData.calle || '',
                    numeroExt: domicilioData.numero_Exterior || '',
                    numeroInt: domicilioData.numero_Interior || '',
                    manzana: domicilioData.manzana || '',
                    lote: domicilioData.lote || '',
                    pais: domicilioData.pais || '',
                    estado: domicilioData.estado || '',
                    municipio: domicilioData.municipio || '',
                    colonia: domicilioData.colonia || '',
                    cp: domicilioData.codigo_Postal || '',
                    // Antecedentes
                    inscripcion: antecedentesData.inscripcion || '',
                    folioReal: antecedentesData.folio_Real || '',
                    folioInicial: antecedentesData.folio_Inicial?.toString() || '',
                    folioFinal: antecedentesData.folio_Final?.toString() || '',
                    folioElectronico: antecedentesData.folio_Electronico?.toString() || '',
                    partida: antecedentesData.partida?.toString() || '',
                    volumen: antecedentesData.volumen?.toString() || '',
                    seccion: antecedentesData.seccion?.toString() || '',
                    fechaRegistro: antecedentesData.fecha_Registro ? antecedentesData.fecha_Registro.split('T')[0] : '',
                    fechaEscritura: '',
                    // Pagos Inmueble
                    montoTotal: '',
                    formaPago: '',
                    fechaPago: '',
                    referenciaPago: '',
                    observacionesPago: '',
                });

                // Guardar el ID del inmueble en edición
                setInmuebleEnEdicion(inmueblesData.inmueble?.numero_Inmueble || inmuebleId);
                setInmuebleIdEnEdicion(inmuebleId);

                // Mostrar el formulario
                setMostrarFormInmueble(true);
                addToast('Inmueble cargado para editar', 'success', 4000);
            } else {
                addToast('No se pudieron cargar los datos del inmueble', 'error', 4000);
            }
        } catch (error) {
            console.error('Error cargando inmueble:', error);
            addToast('Error al cargar los datos del inmueble', 'error', 4000);
        } finally {
            setCargandoGuardarInmueble(false);
        }
    };

    // Guardar Inmueble
    const handleGuardarInmueble = async () => {
        if (!currentExpedienteId) {
            addToast('No hay expediente seleccionado', 'error', 4000);
            return;
        }

        setCargandoGuardarInmueble(true);
        try {
            // Payload común para crear y actualizar
            const payload = {
                tipo_Factura_Id: parseInt(formInmueble.tipoFactura) || 0,
                tipo_Inmueble_Id: parseInt(formInmueble.tipoVulnerable) || 0,
                tipo_Inmueble_DeclaraNot_Id: parseInt(formInmueble.tipoDeclaranot) || 0,
                medidas_Colindancias: formInmueble.medidas,
                antecedentes: formInmueble.antecedentes,
                descripcion: formInmueble.descripcion,
                calle: formInmueble.calle,
                numero_Exterior: formInmueble.numeroExt,
                numero_Interior: formInmueble.numeroInt,
                manzana: formInmueble.manzana,
                lote: formInmueble.lote,
                colonia: formInmueble.colonia,
                municipio: formInmueble.municipio,
                codigo_Postal: formInmueble.cp,
                estado: formInmueble.estado,
                pais: formInmueble.pais,
                valor_Avaluo: parseFloat(formInmueble.valorAvaluo) || 0,
                valor_Operacion: parseFloat(formInmueble.valorOperacion) || 0,
                valor_Catastral: parseFloat(formInmueble.valorCatastral) || 0,
                clave_Catastral: formInmueble.claveCatastral,
                superficie_Terreno: parseFloat(formInmueble.superficieTerreno) || 0,
                superficie_Construccion: parseFloat(formInmueble.superficieConstruida) || 0,
                cuenta_Agua: formInmueble.ctaAgua || '',
                cuenta_Predial: formInmueble.ctaPredial || '',
                fecha_Registro: formInmueble.fechaRegistro ? new Date(formInmueble.fechaRegistro).toISOString() : new Date().toISOString(),
                folio_Real: formInmueble.folioReal,
                inscripcion: formInmueble.inscripcion,
                folio_Inicial: parseInt(formInmueble.folioInicial) || 0,
                folio_Final: parseInt(formInmueble.folioFinal) || 0,
                folio_Electronico: parseInt(formInmueble.folioElectronico) || 0,
                partida: parseInt(formInmueble.partida) || 0,
                volumen: parseInt(formInmueble.volumen) || 0,
                seccion: parseInt(formInmueble.seccion) || 0,
            };

            // Determinar si es creación o actualización
            const isEditing = inmuebleIdEnEdicion !== null;
            const endpoint = isEditing
                ? `/Expediente/UpdateInmuebleExpediente?inmuebleId=${inmuebleIdEnEdicion}`
                : '/Expediente/CreateInmuebleExpediente';

            // Agregar expediente_Id solo para crear
            if (!isEditing) {
                (payload as any).expediente_Id = currentExpedienteId;
            }

            const data = isEditing
                ? await api.put(endpoint, payload)
                : await api.post(endpoint, payload);

            await handleControlNotarialResponse(data, {
            });

            if (data?.isUnauthorized) {
                return;
            }

            if (data?.success !== false) {
                addToast(isEditing ? 'Inmueble actualizado exitosamente' : 'Inmueble guardado exitosamente', 'success');
            setMostrarFormInmueble(false);
            // Limpiar formulario
            setFormInmueble({
                tipoFactura: '',
                tipoVulnerable: '',
                tipoDeclaranot: '',
                medidas: '',
                antecedentes: '',
                descripcion: '',
                claveCatastral: '',
                valorAvaluo: '',
                valorCatastral: '',
                valorOperacion: '',
                superficieTerreno: '',
                superficieConstruida: '',
                ctaAgua: '',
                ctaPredial: '',
                calle: '',
                numeroExt: '',
                numeroInt: '',
                manzana: '',
                lote: '',
                pais: '',
                estado: '',
                municipio: '',
                colonia: '',
                cp: '',
                inscripcion: '',
                folioReal: '',
                folioInicial: '',
                folioFinal: '',
                folioElectronico: '',
                partida: '',
                volumen: '',
                seccion: '',
                fechaRegistro: '',
                fechaEscritura: '',
                montoTotal: '',
                formaPago: '',
                fechaPago: '',
                referenciaPago: '',
                observacionesPago: '',
            });
            // Limpiar estado de edición
            setInmuebleEnEdicion(null);
            setInmuebleIdEnEdicion(null);
            // Recargar inmuebles
            await fetchInmueblesExpediente(currentExpedienteId);
            } else {
                addToast(data?.message || 'Error al guardar el inmueble', 'error');
            }
        } catch (error) {
            console.error('Error guardando inmueble:', error);
            addToast('No se pudo guardar el inmueble', 'error');
        } finally {
            setCargandoGuardarInmueble(false);
        }
    };

    // ==========================================
    // SECCIÓN: DOCUMENTOS
    // ==========================================

    // Cargar documentos disponibles desde API
    const fetchDocumentosDisponibles = async () => {
        setCargandoDocumentosDisponibles(true);
        try {
            const { blob, response } = await api.getBlob('/Catalogos/GetDocumentos');
            if (response?.isUnauthorized) {
                addToast('No autorizado para cargar documentos', 'error');
                return;
            }

            if (blob && response?.success !== false) {
                const data = await blob.text();
                const jsonData = JSON.parse(data);
                // Asegurar que siempre sea un array
                const documentosArray = Array.isArray(jsonData)
                    ? jsonData
                    : (jsonData?.dataResponse || jsonData?.data || []);
                setDocumentosDisponibles(documentosArray);

                setMostrarModalAgregarDocumento(true);
            } else {
                addToast('No se pudieron cargar los documentos disponibles', 'error', 4000);
            }
        } catch (error) {
            console.error('Error cargando documentos disponibles:', error);
            addToast('Error cargando documentos', 'error', 4000);
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

    // Agregar múltiples documentos seleccionados
    const handleAgregarDocumentosSeleccionados = async () => {
        const documentosAgregar = documentosDisponibles.filter(doc => documentosSeleccionados[doc.id]);

        if (documentosAgregar.length === 0) {
            addToast('Selecciona al menos un documento', 'warning', 4000);
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
            addToast('Selecciona un cliente para visualizar el recibo', 'warning', 4000);
            return;
        }

        try {
            setIsLoadingRecibo(true);
            const { blob, response } = await api.getBlob(
                `/Expediente/GenerateReciboDocumentosExpediente?expedienteId=${currentExpedienteId}&clienteId=${clienteSeleccionadoDocumentos}`
            );

            if (response?.isUnauthorized) {
                addToast('No autorizado para generar el recibo', 'error');
                return;
            }

            if (blob && response?.success !== false) {
                const url = URL.createObjectURL(blob);
                setReciboUrl(url);
                setShowReciboModal(true);
                addToast('Recibo cargado correctamente', 'success', 4000);
            } else {
                addToast(response?.message || 'Error al generar el recibo', 'error', 4000);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al generar el recibo';
            addToast(message, 'error', 4000);
            console.error('Error:', error);
        } finally {
            setIsLoadingRecibo(false);
        }
    };

    // Cerrar modal de recibo (DOCUMENTOS)
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

            const data = await api.put(
                `/Expediente/UpdateDocumentoClienteXExpediente?expedienteId=${expedienteId}`,
                documentosPayload
            );

            await handleControlNotarialResponse(data, {
            });

            if (data?.isUnauthorized) {
                return;
            }

            if (data?.success !== false) {
                addToast('Documentos actualizados exitosamente', 'success', 4000);
            } else {
                console.error('Error al actualizar documentos:', data);
                addToast('Error al actualizar documentos: ' + (data?.message || 'Error desconocido'), 'error');
            }
        } catch (error) {
            console.error('Error actualizando documentos:', error);
            addToast('Error actualizando documentos', 'error');
        }
    };

    // Actualizar un documento individual
    const handleActualizarDocumentoIndividual = async (
        docsId: string,
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
                fecha_Entrega: cambios.fecha_Entrega,
                usuario_Recibe_Id: cambios.usuario_Recibe ? parseInt(cambios.usuario_Recibe) || 0 : 0,
                fecha_Recepcion: cambios.fecha_Recepcion,
                usuario_Recepcion_Id: cambios.usuario_Recepcion ? parseInt(cambios.usuario_Recepcion) || 0 : 0,
                observaciones: cambios.observaciones,
                copia: cambios.copia,
                original: cambios.original,
            };

            const data = await api.put(
                `/Expediente/UpdateDocumentoXExpediente?documentoId=${docsId}`,
                payload
            );

            await handleControlNotarialResponse(data, {
            });

            if (data?.isUnauthorized) {
                return;
            }

            if (data?.success !== false) {
                addToast('Documento actualizado exitosamente', 'success');
                console.log(`Documento ${docsId} actualizado exitosamente`);
            } else {
                addToast(data?.message || 'Error al actualizar documento', 'error');
                console.error(`Error al actualizar documento ${docsId}:`, data?.message);
            }
        } catch (error) {
            console.error(`Error actualizando documento ${docsId}:`, error);
        }
    };

    // Handler para cambios de documento con debounce por documento específico
    const handleDocumentoChange = (docId: string, field: string, value: any) => {
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
    // TAMBIÉN rellenar todos los dropdowns desde el inicio
    useEffect(() => {
        if (usuarios.length > 0 && !initializedUsers.current) {
            const notarios = usuarios.filter(u => u.rol === 'NOTARIOS');
            const responsables = usuarios.filter(u => u.rol === 'RESPONSABLES');
            const secretarias = usuarios.filter(u => u.rol === 'SECRETARIAS');
            const autorizados = usuarios.filter(u => u.rol === 'AUTORIZADOS');

            // Rellenar todos los dropdowns con todos los registros
            setNotariosFiltrados(notarios);
            setResponsablesFiltrados(responsables);
            setSecretariasFiltradas(secretarias);
            setAutorizadosFiltrados(autorizados);

            // Seleccionar el primero de cada rol
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

    // Cargar todos los datos del expediente cuando se selecciona uno
    useEffect(() => {
        if (currentExpedienteId) {
            // Cerrar formularios abiertos al cambiar de expediente
            setMostrarFormInmueble(false);
            setMostrarFormularioRecibo(false);
            setInmuebleEnEdicion(null);
            setInmuebleIdEnEdicion(null);
            setReciboDetalleSeleccionado(null);
            setClienteSeleccionadoDocumentos(null);
            setDocumentosPorCliente([]);

            // Los datos se cargarán bajo demanda cuando se acceda a cada pestaña
        }
    }, [currentExpedienteId]);

    // Cargar documentosExpediente cuando se acceda a esa pestaña
    useEffect(() => {
        if (activeInternalTab === 'documentos' && currentExpedienteId) {
            fetchDocumentosExpediente(currentExpedienteId);
        }
    }, [activeInternalTab, currentExpedienteId]);

    // Cargar inmueblesExpediente cuando se acceda a esa pestaña
    useEffect(() => {
        if (activeInternalTab === 'inmuebles' && currentExpedienteId) {
            fetchInmueblesExpediente(currentExpedienteId);
        }
    }, [activeInternalTab, currentExpedienteId]);

    // Cargar datos financieros cuando se acceda a esa pestaña
    useEffect(() => {
        if (activeInternalTab === 'financiero-control' && currentExpedienteId) {
            fetchPresupuestos(currentExpedienteId);
            fetchRecibosProvisionales(currentExpedienteId);
            fetchPLD(currentExpedienteId);
        }
    }, [activeInternalTab, currentExpedienteId]);

    // Auto-seleccionar el primer cliente cuando se cargan los documentos
    useEffect(() => {
        if (documentosPorCliente && documentosPorCliente.length > 0 && !clienteSeleccionadoDocumentos) {
            setClienteSeleccionadoDocumentos(documentosPorCliente[0].id_Cliente);
        }
    }, [documentosPorCliente]);

    // Inicializar documentosEditados con valores del documento cuando se cargan
    useEffect(() => {
        const convertirFecha = (fecha: string | null): string | null => {
            if (!fecha) return null;
            // Si viene en formato "dd/mm/yyyy", convertir a "yyyy-mm-dd"
            const partes = fecha.split('/');
            if (partes.length === 3) {
                return `${partes[2]}-${partes[1]}-${partes[0]}`;
            }
            return fecha;
        };

        const nuevosEditados: Record<number, any> = {};
        documentosPorCliente.forEach(grupoCliente => {
            grupoCliente.documentos.forEach(doc => {
                if (!documentosEditados[doc.id]) {
                    nuevosEditados[doc.id] = {
                        cliente_Id: doc.cliente_Id,
                        documento_Id: doc.documento_Id,
                        fecha_Entrega: convertirFecha(doc.fecha_Entrega),
                        usuario_Recibe: doc.usuario_Recibe,
                        fecha_Recepcion: convertirFecha(doc.fecha_Recepcion),
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

    // Convertir fecha de formato DD/MM/YYYY a YYYY-MM-DD para inputs date
    // ==========================================
    // SECCIÓN: EXPEDIENTES
    // ==========================================

    const fetchDocumentosExpediente = async (expedienteId: number) => {
        setCargandoDocumentosExpediente(true);
        try {
            const data = await api.get(`/Expediente/GetDocumentosClienteXExpediente?expedienteId=${expedienteId}`);
            if (data && data.dataResponse) {
                setDocumentosPorCliente(data.dataResponse);
            } else {
                console.error('Error al cargar documentos:', data?.message);
                setDocumentosPorCliente([]);
            }
        } catch (error) {
            console.error('Error cargando documentos:', error);
            setDocumentosPorCliente([]);
        } finally {
            setCargandoDocumentosExpediente(false);
        }
    };

    const fetchInmueblesExpediente = async (expedienteId: number) => {
        setCargandoInmueblesExpediente(true);
        try {
            const data = await api.get(`/Expediente/GetInmueblesXExpedienteById?expedienteId=${expedienteId}`);
            if (data && data.dataResponse) {
                setInmueblesExpediente(data.dataResponse);
            } else {
                console.error('Error al cargar inmuebles:', data?.message);
                setInmueblesExpediente([]);
            }
        } catch (error) {
            console.error('Error cargando inmuebles:', error);
            setInmueblesExpediente([]);
        } finally {
            setCargandoInmueblesExpediente(false);
        }
    };

    const fetchExpedientes = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            let endpoint = '/Expediente/GetExpediente';
            if (filtroValue) {
                endpoint += `?filtro=${encodeURIComponent(filtroValue)}`;
            }
            const response = await api.get(endpoint);

            await handleControlNotarialResponse(response, {
            });

            // Si es 401, useAuthGuard maneja el toast
            if (response?.isUnauthorized) {
                setResultados([]);
            } else {
                const data = response?.dataResponse;
                if (response?.success !== false && data) {
                    setResultados(data);
                } else {
                    setSearchError(response?.message || 'No se pudieron cargar los expedientes.');
                    setResultados([]);
                }
            }
        } catch (error) {
            console.error('Error buscando expedientes:', error);
            setSearchError('No se pudieron cargar los expedientes. Verifica la conexión con el servidor.');
        } finally {
            setIsSearching(false);
        }
    };

    // Buscar expedientes
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchExpedientes(filtro);
    };

    // Cambios en inputs (EXPEDIENTES)
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    // Validar cambios en número de escritura (EXPEDIENTES)
    const handleNumeroEscrituraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleInputChange(e);
        setNumeroEscrituraTouched(true);
    };

    const validateNumeroEscrituraBeforeSave = async (): Promise<boolean> => {
        // Si no hay número de escritura, no validar
        if (!formData.numeroEscritura) {
            return true;
        }

        // Si el número de escritura no ha sido modificado del original, no validar
        if (isEditing && formData.numeroEscritura === numeroEscrituraOriginal) {
            return true;
        }

        try {
            const response = await api.post(`/Expediente/ChecarNumeroEscritura?numEscritura=${formData.numeroEscritura}`, {});

            // Verificar si dataResponse es true
            if (response?.dataResponse === true) {
                return true;
            } else {
                // Si dataResponse no es true, mostrar error
                setSaveError(`El número de escritura ${formData.numeroEscritura} no es válido.`);
                addToast(response?.message, 'warning', 4000);
                return false;
            }
        } catch (error: any) {
            // Si hay error en la API, mostrar el mensaje de error
            let errorMessage = 'Error al validar el número de escritura.';

            if (error?.response?.data?.message) {
                errorMessage = error.response.data.message;
            } else if (error?.message) {
                errorMessage = error.message;
            }

            setSaveError(errorMessage);
            addToast(errorMessage, 'error', 4000);
            return false;
        }
    };

    // Cancelar edición (EXPEDIENTES)
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

        // Limpiar búsquedas de formulario
        setOperacionBusqueda('');
        setMostrarDropdownOperaciones(false);
        setMunicipioBusqueda('');
        setMostrarDropdownMunicipios(false);
        setDependenciaBusqueda('');
        setMostrarDropdownDependencias(false);

        // Limpiar búsquedas de usuarios
        setBusquedaNotario('');
        setMostrarDropdownNotario(false);
        setBusquedaResponsable('');
        setMostrarDropdownResponsable(false);
        setBusquedaSecretaria('');
        setMostrarDropdownSecretaria(false);
        setBusquedaAutorizado('');
        setMostrarDropdownAutorizado(false);

        // Limpiar datos de dependencias
        setDatosDepdencias({});
        setDependenciaSeleccionada(null);
        setCheckboxesFecha({});

        // Limpiar comparecientes
        setFilasComparecientes([]);
        setClienteBusqueda('');
        setMostrarDropdownClientes(false);
        setClienteSeleccionado(null);
        setDropdownTipoAbierto({});
        setBusquedaTipo({});
        setShowClienteModalComparecientes(false);
        setClienteResultadosComparecientes([]);
        setClienteFiltroComparecientes('');
        setClientesSeleccionadosEnModal([]);

        // Limpiar fechas habilitadas
        setEnabledDates({
            fechaEscritura: false,
            fechaFirma: false,
            fechaElaboracion: false,
            fechaRevision: false,
            fechaImpresion: false,
            firmarTodos: false,
        });

        // Limpiar datos de recibo
        setReciboData({
            impuestosDerechos: 0,
            gastosNotariales: 0,
            honorarios: 0,
            concepto: '',
            formaPago: '',
            observaciones: '',
            clienteId: null,
        });

        // Limpiar recibos provisionales
        setRecibosProvisionales([]);
        setMostrarFormularioRecibo(false);
        setReciboDetalleSeleccionado(null);

        // Limpiar IDs
        setNumeroEscrituraTouched(false);
        setNumeroEscrituraOriginal('');
        setNumeroEscrituraError(null);
        setNotarioId(null);
        setResponsableId(null);
        setSecretariaId(null);
        setAutorizadoId(null);
        setMunicipioId(null);
        setOperacionesIds([]);
        setCurrentExpedienteId(null);

        // Limpiar estados de edición
        setIsEditing(false);
        setSaveError(null);
        setActiveTab('busqueda');
        setExpedienteEsVulnerable(false);
    };

    // Cargar un expediente específico (EXPEDIENTES)
    const handleLoadExpediente = async (expedienteId: number) => {
        try {
            const data = await api.get(`/Expediente/GetExpedienteById?expedienteId=${expedienteId}`);

            if (!data || !data.dataResponse || data.dataResponse.length === 0) {
                setSaveError('Error al cargar el expediente');
                return;
            }

            const fullData = data.dataResponse[0];
            const expediente = fullData.expediente;

            // Capturar si el expediente es vulnerable
            setExpedienteEsVulnerable(expediente.vulnerable || false);

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

            // Guardar el valor original del número de escritura para comparación posterior
            setNumeroEscrituraOriginal(expediente.escritura_Numero?.toString() || '');

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

                // Obtener IDs de operaciones y guardar operaciones completas del expediente
                const opsIds = operacionesDisponibles
                    .filter(op => operacionesDescripciones.includes(op.descripcion))
                    .map(op => op.id);
                setOperacionesIds(opsIds);

                // Guardar las operaciones completas del expediente para usarlas en presupuestos
                const operacionesExpediente = operacionesDisponibles.filter(op => opsIds.includes(op.id));
                setOperacionesDelExpediente(operacionesExpediente);
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
                comparecientes.forEach((comp: FilaCompareciente) => {
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
            setNumeroEscrituraTouched(false);
            setNumeroEscrituraOriginal(expediente.escritura_Numero?.toString() || '');
            setActiveTab('formulario');
            setActiveInternalTab('info-general');
            setSaveError(null);

            // Los datos se cargarán bajo demanda cuando se navegue a cada pestaña
        } catch (error) {
            setSaveError('Error al cargar el expediente');
            console.error('Error:', error);
        }
    };

    // Guardar expediente (EXPEDIENTES)
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

        // Validar número de escritura antes de guardar
        const isNumeroEscrituraValid = await validateNumeroEscrituraBeforeSave();
        if (!isNumeroEscrituraValid) {
            return;
        }

        setIsSaving(true);
        setSaveError(null);

        try {
            // Construir el payload base (igual para crear y actualizar)
            const expedientePayload = {
                observaciones: formData.observaciones || 'NA',
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
                fecha_Escritura: formData.fechaEscritura || null,
                fecha_Firma: formData.fechaFirma || null,
                fecha_Elaboracion: formData.fechaElaboracion || null,
                fecha_Revision: formData.fechaRevision || null,
                fecha_Impresion: formData.fechaImpresion || null,
                fecha_Firma_Todos: formData.firmarTodos || null,
                motivo: formData.motivoCancelacion || 'string'
            };

            const requestPayload = {
                expediente: isEditing ? expedientePayload : {
                    tipo_Expediente: 'EXPEDIENTE',
                    fecha_Apertura: new Date().toISOString(),
                    ...expedientePayload
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

            // Determinar endpoint y acción
            const endpoint = isEditing && currentExpedienteId
                ? `/Expediente/UpdateExpediente?expedienteId=${currentExpedienteId}`
                : '/Expediente/CreateExpediente';

            const data = isEditing
                ? await api.put(endpoint, requestPayload)
                : await api.post(endpoint, requestPayload);

            await handleControlNotarialResponse(data, {
            });

            if (data?.isUnauthorized) {
                return;
            }

            if (data?.success !== false) {
                const messageAction = isEditing ? 'actualizado' : 'creado';
                addToast(`Expediente ${messageAction} exitosamente`, 'success', 4000);

                // Establecer hora de última actualización
                const ahora = new Date();
                const horaFormato = ahora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                setLastSavedTime(horaFormato);

                // Si es actualización, solo recargar datos y volver a busqueda
                if (isEditing && currentExpedienteId) {
                    setIsEditing(false);
                    setCurrentExpedienteId(null);
                    setSaveError(null);
                    setActiveTab('busqueda');
                    setActiveInternalTab('info-general');

                    // Recargar expedientes
                    setTimeout(() => {
                        fetchExpedientes('');
                    }, 100);
                } else {
                    // Si es creación, resetear todo
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
                    setOperacionBusqueda('');
                    setMostrarDropdownOperaciones(false);
                    setMunicipioBusqueda('');
                    setMostrarDropdownMunicipios(false);
                    setDependenciaBusqueda('');
                    setMostrarDropdownDependencias(false);
                    setBusquedaNotario('');
                    setMostrarDropdownNotario(false);
                    setBusquedaResponsable('');
                    setBusquedaNotario('');
                    setMostrarDropdownNotario(false);
                    setBusquedaResponsable('');
                    setMostrarDropdownResponsable(false);
                    setBusquedaSecretaria('');
                    setMostrarDropdownSecretaria(false);
                    setBusquedaAutorizado('');
                    setMostrarDropdownAutorizado(false);
                    setMostrarDropdownClientes(false);
                    setMostrarDropdownOperaciones(false);
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
                    setActiveInternalTab('info-general');

                    // Recargar expedientes en el siguiente ciclo
                    setTimeout(() => {
                        fetchExpedientes('');
                    }, 100);
                }
            } else {
                const action = isEditing ? 'actualizar' : 'crear';
                setSaveError(data?.message || `Error al ${action} el expediente`);
                addToast(data?.message || `Error al ${action} el expediente`, 'error');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            const action = isEditing ? 'actualizar' : 'crear';
            setSaveError(`Error al ${action} expediente: ${errorMessage}`);
            addToast(`Error al ${action} expediente: ${errorMessage}`, 'error');
            console.error(`Error al guardar expediente:`, error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleAsignarFolios = async () => {
        if (!formData.foliosRequeridos || !currentExpedienteId) {
            addToast('Ingrese la cantidad de folios requeridos', 'error');
            return;
        }

        setCargandoAsignarFolios(true);
        try {
            const response = await api.post(
                `/Folios/AsignarFoliosExpediente?expedienteId=${currentExpedienteId}&foliosRequeridos=${formData.foliosRequeridos}`,
                {}
            );

            if (response?.isUnauthorized) {
                addToast('No autorizado para asignar folios', 'error');
                return;
            }

            if (response?.success) {
                const data = response.dataResponse;
                setFormData(prev => ({
                    ...prev,
                    folioInicial: data.folio_Inicial,
                    folioFinal: data.folio_Final,
                    volumen: data.volumen,
                    tomo: data.tomo,
                    foliosRequeridos: 0
                }));
                addToast('Folios asignados correctamente', 'success');
            } else {
                addToast(response?.message || 'Error al asignar folios', 'error');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            addToast(`Error al asignar folios: ${errorMessage}`, 'error');
            console.error('Error al asignar folios:', error);
        } finally {
            setCargandoAsignarFolios(false);
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

    const handleActualizarDatosDependencia = (campo: string, valor: string) => {
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
                handleActualizarDatosDependencia(campo, '');
            }
        }
    };

    const handleEliminarCompareciente = (id: string) => {
        setFilasComparecientes(prev => prev.filter(row => row.id !== id));
    };

    const handleActualizarCompareciente = (id: string, campo: string, valor: any) => {
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

    // Función para buscar clientes desde el modal de comparecientes
    const fetchClientesModal = async (filtroValue: string) => {
        setIsSearchingClientesComparecientes(true);
        setClienteErrorComparecientes(null);

        try {
            const url = `/Clientes/GetClientes?filtro=${encodeURIComponent(filtroValue)}`;
            const data = await api.get(url);

            if (data && data.dataResponse) {
                setClienteResultadosComparecientes(data.dataResponse || []);
            } else {
                setClienteErrorComparecientes(data?.message || 'No se encontraron clientes.');
                setClienteResultadosComparecientes([]);
            }
        } catch (error) {
            setClienteErrorComparecientes('No se pudieron cargar los clientes. Verifica la conexión con el servidor.');
            setClienteResultadosComparecientes([]);
        } finally {
            setIsSearchingClientesComparecientes(false);
        }
    };

    // Función para seleccionar cliente del modal y agregarlo a la lista temporal
    const handleSelectClienteFromModalComparecientes = (cliente: ClienteBusqueda) => {
        // Verificar que no esté ya seleccionado
        if (!clientesSeleccionadosEnModal.some(c => c.id === cliente.id)) {
            setClientesSeleccionadosEnModal(prev => [...prev, cliente]);
        }
    };

    // Función para remover cliente de la lista temporal
    const handleRemoverClienteDelModal = (clienteId: number) => {
        setClientesSeleccionadosEnModal(prev => prev.filter(c => c.id !== clienteId));
    };

    // Función para agregar todos los clientes seleccionados a la tabla de comparecientes
    const handleAgregarClientesSeleccionados = () => {
        const nuevosComparecientes: FilaCompareciente[] = clientesSeleccionadosEnModal.map((cliente) => ({
            id: Date.now().toString() + Math.random(),
            cliente_Id: cliente.id,
            nombreCompareciente: `${cliente.nombre} ${cliente.apellido_Paterno} ${cliente.apellido_Materno}`,
            tipoCompareciente: '',
            firmaRequerida: false,
            fechaFirma: ''
        }));

        setFilasComparecientes(prev => [...prev, ...nuevosComparecientes]);
        setShowClienteModalComparecientes(false);
        setClienteFiltroComparecientes('');
        setClienteResultadosComparecientes([]);
        setClienteErrorComparecientes(null);
        setClientesSeleccionadosEnModal([]);
    };

    // Cargar Recibos Provisionales del Expediente
    // ==========================================
    // SECCIÓN: RECIBOS / PRESUPUESTOS
    // ==========================================

    const fetchRecibosProvisionales = async (expedienteId: number) => {
        setCargandoRecibos(true);
        try {
            const data = await api.get(`/ReciboProvisional/GetRecibosProvisionalesXExpediente?expedienteId=${expedienteId}`);
            if (data && data.dataResponse) {
                setRecibosProvisionales(data.dataResponse);
            } else {
                setRecibosProvisionales([]);
            }
        } catch (error) {
            console.error('Error al cargar recibos:', error);
            setRecibosProvisionales([]);
        } finally {
            setCargandoRecibos(false);
        }
    };

    // Obtener datos PLD del expediente
    // ==========================================
    // SECCIÓN: CUMPLIMIENTO (PLD/LISTAS NEGRAS)
    // ==========================================

    const fetchPLD = async (expedienteId: number) => {
        setCargandoPLD(true);
        try {
            const data = await api.get(`/Expediente/GetExpedientePLD?expedienteId=${expedienteId}`);
            if (data && data.dataResponse) {
                setDatosPLD(data.dataResponse);
            } else {
                setDatosPLD([]);
            }
        } catch (error) {
            console.error('Error al cargar PLD:', error);
            setDatosPLD([]);
        } finally {
            setCargandoPLD(false);
        }
    };

    // Buscar en Listas Negras (SAT/OFAC)
    const buscarEnListasNegras = async (nombre: string) => {
        if (!nombre.trim()) return;

        setListasNegrasLoading(true);
        setListasNegrasError(null);
        setListasNegrasResults([]);

        try {
            const response = await fetch('/admin/search/persona-fisica', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    nombre: nombre,
                }),
            });

            const data = await response.json();

            if (data.success && data.data) {
                const allResults = [
                    ...(data.data.ofac_resultados || []).map((r: any) => ({ ...r, source: 'OFAC' })),
                    ...(data.data.sat_resultados || []).map((r: any) => ({ ...r, source: 'SAT' })),
                ];
                setListasNegrasResults(allResults);
                setShowListasNegrasModal(true);
            } else {
                setListasNegrasError(data.message || 'Error en la búsqueda');
                setShowListasNegrasModal(true);
            }
        } catch (error) {
            console.error('Error de búsqueda:', error);
            setListasNegrasError('Error de conexión');
            setShowListasNegrasModal(true);
        } finally {
            setListasNegrasLoading(false);
        }
    };

    // Obtener Recibo Provisional por ID
    const fetchReciboDetalle = async (reciboId: string | number) => {
        setCargandoReciboDetalle(true);
        try {
            const data = await api.get(`/ReciboProvisional/GetReciboProvicionalById?reciboId=${reciboId}`);
            if (data && data.dataResponse && data.dataResponse.length > 0) {
                setReciboDetalleSeleccionado(data.dataResponse[0]);
                setMostrarFormularioRecibo(true);
            } else {
                addToast('No se pudo obtener el recibo', 'error');
            }
        } catch (error) {
            console.error('Error al obtener recibo:', error);
            addToast('Error al cargar el recibo', 'error');
        } finally {
            setCargandoReciboDetalle(false);
        }
    };

    // Guardar Recibo Provisional
    const handleGuardarRecibo = async () => {
        if (!reciboData.clienteId || !reciboData.formaPago) {
            addToast('Por favor completa los campos requeridos (Cliente, Forma de Pago)', 'warning');
            return;
        }

        try {
            const payload = {
                expediente_Id: currentExpedienteId,
                cliente_Id: reciboData.clienteId,
                operacion_Concepto: reciboData.concepto || formData.operaciones.join(', '),
                total_Gastos_Impuestos_Derechos: reciboData.impuestosDerechos,
                total_Gastos_Notariales: reciboData.gastosNotariales,
                total_Honorarios: reciboData.honorarios,
                forma_Pago: reciboData.formaPago,
                observacion: reciboData.observaciones,
                notario_Id: notarioId,
            };

            const data = await api.post('/ReciboProvisional/CreateReciboProvisional', payload);

            await handleControlNotarialResponse(data, {
            });

            if (data?.isUnauthorized) {
                return;
            }

            if (data?.success !== false) {
                addToast('Recibo generado exitosamente', 'success');
                // Limpiar formulario
                setReciboData({ impuestosDerechos: 0, gastosNotariales: 0, honorarios: 0, concepto: '', formaPago: '', observaciones: '', clienteId: null });
                // Ocultar formulario
                setMostrarFormularioRecibo(false);
                // Recargar los recibos
                if (currentExpedienteId) {
                    await fetchRecibosProvisionales(currentExpedienteId);
                }
            } else {
                addToast(data?.message || 'Error al generar el recibo', 'error');
            }
        } catch (error) {
            console.error('Error guardando recibo:', error);
            addToast('No se pudo guardar el recibo', 'error');
        }
    };

    const handlePagarRecibo = async () => {
        if (!reciboDetalleSeleccionado?.id) {
            addToast('Error: No se pudo identificar el recibo', 'error');
            return;
        }

        try {
            setCargandoReciboDetalle(true);
            const data = await api.put(`/ReciboProvisional/PagarReciboProvisional?reciboId=${reciboDetalleSeleccionado.id}`, {});

            await handleControlNotarialResponse(data, {
            });

            if (data?.isUnauthorized) {
                return;
            }

            if (data?.success !== false) {
                addToast('Recibo pagado exitosamente', 'success');
                // Recargar los recibos
                if (currentExpedienteId) {
                    await fetchRecibosProvisionales(currentExpedienteId);
                    // Recargar el detalle del recibo
                    await fetchReciboDetalle(reciboDetalleSeleccionado.numero_Recibo);
                }
            } else {
                addToast(data?.message || 'Error al pagar el recibo', 'error');
            }
        } catch (error) {
            console.error('Error pagando recibo:', error);
            addToast('No se pudo pagar el recibo', 'error');
        } finally {
            setCargandoReciboDetalle(false);
        }
    };

    const handleCancelarRecibo = async () => {
        if (!reciboDetalleSeleccionado?.id) {
            addToast('Error: No se pudo identificar el recibo', 'error');
            return;
        }

        try {
            setCargandoReciboDetalle(true);
            const data = await api.put(`/ReciboProvisional/CancelarReciboProvisional?reciboId=${reciboDetalleSeleccionado.id}`, {});

            await handleControlNotarialResponse(data, {
            });

            if (data?.isUnauthorized) {
                return;
            }

            if (data?.success !== false) {
                addToast('Recibo cancelado exitosamente', 'success');
                // Recargar los recibos
                if (currentExpedienteId) {
                    await fetchRecibosProvisionales(currentExpedienteId);
                    // Recargar el detalle del recibo
                    await fetchReciboDetalle(reciboDetalleSeleccionado.id);
                }
            } else {
                addToast(data?.message || 'Error al cancelar el recibo', 'error');
            }
        } catch (error) {
            console.error('Error cancelando recibo:', error);
            addToast('No se pudo cancelar el recibo', 'error');
        } finally {
            setCargandoReciboDetalle(false);
        }
    };

    const handleImprimirRecibo = async (reciboId: number) => {
        try {
            setCargandoReciboDetalle(true);
            const { blob, response } = await api.getBlob(`/ReciboProvisional/GenerateReporteRecibosProvisionales?reciboId=${reciboId}`);

            if (response?.isUnauthorized) {
                addToast('No autorizado para generar el recibo', 'error');
                return;
            }

            if (blob && response?.success !== false) {
                const url = URL.createObjectURL(blob);
                setRecibosPdfUrl(url);
                setShowRecibosPdfViewer(true);
                addToast('Recibo generado exitosamente', 'success');
            } else {
                addToast(response?.message || 'Error al generar el reporte del recibo', 'error');
            }
        } catch (error) {
            console.error('Error imprimiendo recibo:', error);
            addToast('No se pudo generar el reporte del recibo', 'error');
        } finally {
            setCargandoReciboDetalle(false);
        }
    };

    const closeRecibosPdfViewer = () => {
        setShowRecibosPdfViewer(false);
        if (recibosPdfUrl) {
            URL.revokeObjectURL(recibosPdfUrl);
            setRecibosPdfUrl(null);
        }
    };

    return (
        <>
            <Head title="Expedientes - Control Notarial" />
            <PDFViewerModal
                isOpen={showRecibosPdfViewer}
                onClose={closeRecibosPdfViewer}
                pdfUrl={recibosPdfUrl || ''}
                title="Recibo Provisional"
                fileName={`recibo-${new Date().toISOString().split('T')[0]}.pdf`}
            />
            <MessageModal
                isOpen={messageModal.isOpen}
                type={messageModal.type}
                title={messageModal.title}
                message={messageModal.message}
                icon={messageModal.icon}
                buttons={messageModal.buttons}
                onClose={messageModal.close}
                size={messageModal.size}
            />

            <div className="space-y-6 mb-5 px-6 pt-6">

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
                        <SearchExpedientes
                            filtro={filtro}
                            setFiltro={setFiltro}
                            resultados={resultados}
                            isSearching={isSearching}
                            searchError={searchError}
                            setSearchError={setSearchError}
                            setResultados={setResultados}
                            onSelectExpediente={handleLoadExpediente}
                            onFetch={fetchExpedientes}
                        />
                    </TabsContent>

                    {/* ── PESTAÑA 2: FORMULARIO ── */}
                    <TabsContent value="formulario" className="space-y-6">
                        {/* Banner Vulnerable - ARRIBA DE TODO */}
                        {expedienteEsVulnerable && (
                            <div className="px-4 py-3 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20 flex items-center gap-3">
                                <AlertCircle className="h-6 w-6 text-red-600 shrink-0" />
                                <div>
                                    <p className="font-semibold text-red-700 dark:text-red-300">⚠️ Expediente Vulnerable</p>
                                    <p className="text-sm text-red-600 dark:text-red-300">Este expediente corresponde a una actividad vulnerable y requiere especial atención en el cumplimiento normativo.</p>
                                </div>
                            </div>
                        )}

                        <div className="border rounded-lg p-6 bg-background/50 backdrop-blur-sm">
                            {saveError && (
                                <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6">
                                    {saveError}
                                </div>
                            )}

                            {/* TABS INTERNOS: 4 CATEGORÍAS */}
                            <Tabs value={activeInternalTab} onValueChange={setActiveInternalTab} className="w-full">
                                <TabsList className="grid w-full grid-cols-5 gap-4 bg-transparent mb-6 p-0 border-b border-slate-200 dark:border-slate-700">

                                    {/* GRUPO 1: INFORMACIÓN GENERAL */}
                                    <TabsTrigger value="info-general" className="gap-2 py-3 px-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors rounded-none border-b-2 border-transparent">
                                        <FileText className="h-4 w-4" />
                                        <span className="hidden sm:inline">Info General</span>
                                    </TabsTrigger>

                                    {/* GRUPO 2: DOCUMENTOS */}
                                    <TabsTrigger
                                        value="documentos"
                                        className="gap-2 py-3 px-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors rounded-none border-b-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!isEditing}
                                        title={!isEditing ? "Guarda el expediente primero para acceder a esta sección" : ""}
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span className="hidden sm:inline">Documentos</span>
                                    </TabsTrigger>

                                    {/* GRUPO 3: INMUEBLES */}
                                    <TabsTrigger
                                        value="inmuebles"
                                        className="gap-2 py-3 px-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors rounded-none border-b-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!isEditing}
                                        title={!isEditing ? "Guarda el expediente primero para acceder a esta sección" : ""}
                                    >
                                        <Building className="h-4 w-4" />
                                        <span className="hidden sm:inline">Inmuebles</span>
                                    </TabsTrigger>

                                    {/* GRUPO 4: FINANCIERO & CONTROL */}
                                    <TabsTrigger
                                        value="financiero-control"
                                        className="gap-2 py-3 px-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors rounded-none border-b-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!isEditing}
                                        title={!isEditing ? "Guarda el expediente primero para acceder a esta sección" : ""}
                                    >
                                        <DollarSign className="h-4 w-4" />
                                        <span className="hidden sm:inline">Financiero</span>
                                    </TabsTrigger>

                                    {/* GRUPO 5: PROCESO & TRÁMITES */}
                                    <TabsTrigger
                                        value="proceso-tramites"
                                        className="gap-2 py-3 px-1 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 transition-colors rounded-none border-b-2 border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!isEditing}
                                        title={!isEditing ? "Guarda el expediente primero para acceder a esta sección" : ""}
                                    >
                                        <FileText className="h-4 w-4" />
                                        <span className="hidden sm:inline">Proceso</span>
                                    </TabsTrigger>
                                </TabsList>

                                {/* GRUPO 1: INFORMACIÓN GENERAL */}
                                {activeInternalTab === 'info-general' && (
                                <TabsContent value="info-general" className="space-y-6">
                                    <GeneralInfoForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        handleInputChange={handleInputChange}
                                        handleNumeroEscrituraChange={handleNumeroEscrituraChange}
                                        isEditing={isEditing}
                                        filasComparecientes={filasComparecientes}
                                        refDropdownMunicipios={refDropdownMunicipios}
                                        refDropdownOperaciones={refDropdownOperaciones}
                                        refDropdownNotario={refDropdownNotario}
                                        refDropdownResponsable={refDropdownResponsable}
                                        refDropdownSecretaria={refDropdownSecretaria}
                                        refDropdownAutorizado={refDropdownAutorizado}
                                        refDropdownDependencias={refDropdownDependencias}
                                        municipioBusqueda={municipioBusqueda}
                                        setMunicipioBusqueda={setMunicipioBusqueda}
                                        municipiosFiltrados={municipiosFiltrados}
                                        cargandoMunicipios={cargandoMunicipios}
                                        mostrarDropdownMunicipios={mostrarDropdownMunicipios}
                                        setMostrarDropdownMunicipios={setMostrarDropdownMunicipios}
                                        setMunicipioId={setMunicipioId}
                                        operacionBusqueda={operacionBusqueda}
                                        setOperacionBusqueda={setOperacionBusqueda}
                                        operacionesFiltradas={operacionesFiltradas}
                                        cargandoOperaciones={cargandoOperaciones}
                                        mostrarDropdownOperaciones={mostrarDropdownOperaciones}
                                        setMostrarDropdownOperaciones={setMostrarDropdownOperaciones}
                                        handleSeleccionarOperacion={handleSeleccionarOperacion}
                                        handleEliminarOperacion={handleEliminarOperacion}
                                        busquedaNotario={busquedaNotario}
                                        setBusquedaNotario={setBusquedaNotario}
                                        notariosFiltrados={notariosFiltrados}
                                        mostrarDropdownNotario={mostrarDropdownNotario}
                                        setMostrarDropdownNotario={setMostrarDropdownNotario}
                                        setNotarioId={setNotarioId}
                                        busquedaResponsable={busquedaResponsable}
                                        setBusquedaResponsable={setBusquedaResponsable}
                                        responsablesFiltrados={responsablesFiltrados}
                                        mostrarDropdownResponsable={mostrarDropdownResponsable}
                                        setMostrarDropdownResponsable={setMostrarDropdownResponsable}
                                        setResponsableId={setResponsableId}
                                        busquedaSecretaria={busquedaSecretaria}
                                        setBusquedaSecretaria={setBusquedaSecretaria}
                                        secretariasFiltradas={secretariasFiltradas}
                                        mostrarDropdownSecretaria={mostrarDropdownSecretaria}
                                        setMostrarDropdownSecretaria={setMostrarDropdownSecretaria}
                                        setSecretariaId={setSecretariaId}
                                        busquedaAutorizado={busquedaAutorizado}
                                        setBusquedaAutorizado={setBusquedaAutorizado}
                                        autorizadosFiltrados={autorizadosFiltrados}
                                        mostrarDropdownAutorizado={mostrarDropdownAutorizado}
                                        setMostrarDropdownAutorizado={setMostrarDropdownAutorizado}
                                        setAutorizadoId={setAutorizadoId}
                                        numeroEscrituraError={numeroEscrituraError}
                                        validandoNumeroEscritura={validandoNumeroEscritura}
                                        enabledDates={enabledDates}
                                        setEnabledDates={setEnabledDates}
                                        dependenciaBusqueda={dependenciaBusqueda}
                                        setDependenciaBusqueda={setDependenciaBusqueda}
                                        dependenciasFiltradas={dependenciasFiltradas}
                                        cargandoDependencias={cargandoDependencias}
                                        mostrarDropdownDependencias={mostrarDropdownDependencias}
                                        setMostrarDropdownDependencias={setMostrarDropdownDependencias}
                                        handleSeleccionarDependencia={handleSeleccionarDependencia}
                                        dependenciaSeleccionada={dependenciaSeleccionada}
                                        setDependenciaSeleccionada={setDependenciaSeleccionada}
                                        datosDepdencias={datosDepdencias}
                                        handleActualizarDatosDependencia={handleActualizarDatosDependencia}
                                        checkboxesFecha={checkboxesFecha}
                                        handleToggleCheckboxFecha={handleToggleCheckboxFecha}
                                        handleEliminarDependencia={handleEliminarDependencia}
                                        filasComparecientesArray={filasComparecientes}
                                        setShowClienteModalComparecientes={setShowClienteModalComparecientes}
                                        busquedaTipo={busquedaTipo}
                                        setBusquedaTipo={setBusquedaTipo}
                                        dropdownTipoAbierto={dropdownTipoAbierto}
                                        setDropdownTipoAbierto={setDropdownTipoAbierto}
                                        comparecientesDisponibles={comparecientesDisponibles}
                                        handleActualizarCompareciente={handleActualizarCompareciente}
                                        handleToggleCheckboxCompareciente={handleToggleCheckboxCompareciente}
                                        handleEliminarCompareciente={handleEliminarCompareciente}
                                        listasNegrasLoading={listasNegrasLoading}
                                        setComparecienteParaBuscar={setComparecienteParaBuscar}
                                        buscarEnListasNegras={buscarEnListasNegras}
                                        handleSaveExpediente={handleSaveExpediente}
                                        handleCancelEdit={handleCancelEdit}
                                        lastSavedTime={lastSavedTime}
                                        cargando={isSaving}
                                        showClienteModalComparecientes={showClienteModalComparecientes}
                                        clienteFiltroComparecientes={clienteFiltroComparecientes}
                                        setClienteFiltroComparecientes={setClienteFiltroComparecientes}
                                        clienteResultadosComparecientes={clienteResultadosComparecientes}
                                        clienteErrorComparecientes={clienteErrorComparecientes}
                                        setClienteErrorComparecientes={setClienteErrorComparecientes}
                                        isSearchingClientesComparecientes={isSearchingClientesComparecientes}
                                        fetchClientesModal={fetchClientesModal}
                                        handleSelectClienteFromModalComparecientes={handleSelectClienteFromModalComparecientes}
                                        clientesSeleccionadosEnModal={clientesSeleccionadosEnModal}
                                        handleRemoverClienteDelModal={handleRemoverClienteDelModal}
                                        handleAgregarClientesSeleccionados={handleAgregarClientesSeleccionados}
                                        expedienteEsVulnerable={expedienteEsVulnerable}
                                        cargandoAsignarFolios={cargandoAsignarFolios}
                                        handleAsignarFolios={handleAsignarFolios}
                                    />
                                </TabsContent>
                                )}

                                {/* GRUPO 2: DOCUMENTOS - Solo disponible al editar */}
                                {isEditing && (
                                <TabsContent value="documentos" className="space-y-6">
                                    <DocumentosForm
                                        formData={formData}
                                        setFormData={setFormData}
                                        mostrarModalAgregarDocumento={mostrarModalAgregarDocumento}
                                        setMostrarModalAgregarDocumento={setMostrarModalAgregarDocumento}
                                        documentosSeleccionados={documentosSeleccionados}
                                        setDocumentosSeleccionados={setDocumentosSeleccionados}
                                        documentosDisponibles={documentosDisponibles}
                                        cargandoDocumentosDisponibles={cargandoDocumentosDisponibles}
                                        fetchDocumentosDisponibles={fetchDocumentosDisponibles}
                                        obtenerDocumentosAgregados={obtenerDocumentosAgregados}
                                        handleAgregarDocumentosSeleccionados={handleAgregarDocumentosSeleccionados}
                                        documentosPorCliente={documentosPorCliente}
                                        clienteSeleccionadoDocumentos={clienteSeleccionadoDocumentos}
                                        setClienteSeleccionadoDocumentos={setClienteSeleccionadoDocumentos}
                                        documentosEditados={documentosEditados}
                                        setDocumentosEditados={setDocumentosEditados}
                                        cargandoDocumentosExpediente={cargandoDocumentosExpediente}
                                        handleDocumentoChange={handleDocumentoChange}
                                        handleEliminarDocumentoDeAll={handleEliminarDocumentoDeAll}
                                        currentExpedienteId={currentExpedienteId ?? undefined}
                                        api={api}
                                        addToast={addToast}
                                    />
                                </TabsContent>
                                )}

                                {/* GRUPO 3: INMUEBLES - Solo disponible al editar */}
                                {isEditing && (
                                <TabsContent value="inmuebles" className="space-y-6">
                                  <InmueblesForm
                                        inmueblesExpediente={inmueblesExpediente}
                                        cargandoInmueblesExpediente={cargandoInmueblesExpediente}
                                        mostrarFormInmueble={mostrarFormInmueble}
                                        setMostrarFormInmueble={setMostrarFormInmueble}
                                        cargandoGuardarInmueble={cargandoGuardarInmueble}
                                        formInmueble={formInmueble}
                                        setFormInmueble={setFormInmueble}
                                        inmuebleEnEdicion={inmuebleEnEdicion}
                                        setInmuebleEnEdicion={setInmuebleEnEdicion}
                                        inmuebleIdEnEdicion={inmuebleIdEnEdicion}
                                        setInmuebleIdEnEdicion={setInmuebleIdEnEdicion}
                                        checkboxesAntecedentes={checkboxesAntecedentes}
                                        setCheckboxesAntecedentes={setCheckboxesAntecedentes}
                                        tiposFactura={tiposFactura}
                                        tiposInmuebleFiltrados={tiposInmuebleFiltrados}
                                        tiposDeclaranot={tiposDeclaranot}
                                        handleGuardarInmueble={handleGuardarInmueble}
                                        handleEditarInmueble={handleEditarInmueble}
                                    />
                                </TabsContent>
                                )}

                                {/* GRUPO 4: FINANCIERO & CONTROL - Solo disponible al editar */}
                                {isEditing && (
                                <TabsContent value="financiero-control" className="space-y-6">
                                   <FinancieroControlForm
                                        presupuestos={presupuestos}
                                        cargandoPresupuestos={cargandoPresupuestos}
                                        mostrarFormularioPresupuesto={mostrarFormularioPresupuesto}
                                        setMostrarFormularioPresupuesto={setMostrarFormularioPresupuesto}
                                        formPresupuesto={formPresupuesto}
                                        setFormPresupuesto={setFormPresupuesto}
                                        operacionFiltro={operacionFiltro}
                                        setOperacionFiltro={setOperacionFiltro}
                                        showOperacionDropdown={showOperacionDropdown}
                                        setShowOperacionDropdown={setShowOperacionDropdown}
                                        ret_isr_check={ret_isr_check}
                                        setRetISRCheck={setRetISRCheck}
                                        ret_iva_check={ret_iva_check}
                                        setRetIVACheck={setRetIVACheck}
                                        clienteSelectedPresupuesto={clienteSelectedPresupuesto}
                                        setClienteSelectedPresupuesto={setClienteSelectedPresupuesto}
                                        clienteFiltro={clienteFiltro}
                                        setClienteFiltro={setClienteFiltro}
                                        showClienteDropdown={showClienteDropdown}
                                        setShowClienteDropdown={setShowClienteDropdown}
                                        municipioFiltroPresupuesto={municipioFiltroPresupuesto}
                                        setMunicipioFiltroPresupuesto={setMunicipioFiltroPresupuesto}
                                        showMunicipioPresupuestoDropdown={showMunicipioPresupuestoDropdown}
                                        setShowMunicipioPresupuestoDropdown={setShowMunicipioPresupuestoDropdown}
                                        recibosProvisionales={recibosProvisionales}
                                        cargandoRecibos={cargandoRecibos}
                                        mostrarFormularioRecibo={mostrarFormularioRecibo}
                                        setMostrarFormularioRecibo={setMostrarFormularioRecibo}
                                        reciboDetalleSeleccionado={reciboDetalleSeleccionado}
                                        setReciboDetalleSeleccionado={setReciboDetalleSeleccionado}
                                        cargandoReciboDetalle={cargandoReciboDetalle}
                                        reciboData={reciboData}
                                        setReciboData={setReciboData}
                                        datosPLD={datosPLD}
                                        cargandoPLD={cargandoPLD}
                                        operacionesDelExpediente={operacionesDelExpediente}
                                        municipiosDisponibles={municipiosDisponibles}
                                        filasComparecientes={filasComparecientes}
                                        clientesDisponibles={clientesDisponibles}
                                        formData={formData}
                                        currentExpedienteId={currentExpedienteId}
                                        handleGuardarRecibo={handleGuardarRecibo}
                                        handlePagarRecibo={handlePagarRecibo}
                                        handleCancelarRecibo={handleCancelarRecibo}
                                        handleImprimirRecibo={handleImprimirRecibo}
                                        fetchPresupuestos={fetchPresupuestos}
                                        fetchReciboDetalle={fetchReciboDetalle}
                                        showPresupuestoPrevioModal={showPresupuestoPrevioModal}
                                        setShowPresupuestoPrevioModal={setShowPresupuestoPrevioModal}
                                        presupuestosPrevios={presupuestosPrevios}
                                        filtroPresupuestoPrevio={filtroPresupuestoPrevio}
                                        setFiltroPresupuestoPrevio={setFiltroPresupuestoPrevio}
                                        isSearchingPresupuestoPrevio={isSearchingPresupuestoPrevio}
                                        errorPresupuestoPrevio={errorPresupuestoPrevio}
                                        setErrorPresupuestoPrevio={setErrorPresupuestoPrevio}
                                        fetchPresupuestosPrevios={fetchPresupuestosPrevios}
                                        handleSelectPresupuestoPrevio={handleSelectPresupuestoPrevio}
                                        isLoadingHonorarios={isLoadingHonorarios}
                                        setIsLoadingHonorarios={setIsLoadingHonorarios}
                                        isLoadingImpuestos={isLoadingImpuestos}
                                        setIsLoadingImpuestos={setIsLoadingImpuestos}
                                        impuestosCalculados={impuestosCalculados}
                                        setImpuestosCalculados={setImpuestosCalculados}
                                        showImpuestosModal={showImpuestosModal}
                                        setShowImpuestosModal={setShowImpuestosModal}
                                        impuestosFiltro={impuestosFiltro}
                                        setImpuestosFiltro={setImpuestosFiltro}
                                        impuestosResultados={impuestosResultados}
                                        isSearchingImpuestos={isSearchingImpuestos}
                                        impuestosError={impuestosError}
                                        dependenciasUnicas={dependenciasUnicas}
                                        activeDependenciaTab={activeDependenciaTab}
                                        setActiveDependenciaTab={setActiveDependenciaTab}
                                        handleCalcularHonorarios={handleCalcularHonorarios}
                                        handleCalcularImpuestos={handleCalcularImpuestos}
                                        addImpuestoDerechos={addImpuestoDerechos}
                                        addGastoNotarial={addGastoNotarial}
                                        removeImpuestoDerechos={removeImpuestoDerechos}
                                        updateImpuestoDerechos={updateImpuestoDerechos}
                                        removeGastoNotarial={removeGastoNotarial}
                                        updateGastoNotarial={updateGastoNotarial}
                                        calcularTotales={calcularTotales}
                                        handleSelectImpuesto={handleSelectImpuesto}
                                        handleGuardarPresupuesto={handleGuardarPresupuesto}
                                        handleObtenerDetallesPresupuesto={handleObtenerDetallesPresupuesto}
                                        presupuestoEditandoId={presupuestoEditandoId}
                                        setPresupuestoEditandoId={setPresupuestoEditandoId}
                                        presupuestoValidado={presupuestoValidado}
                                        setPresupuestoValidado={setPresupuestoValidado}
                                        handleValidarPresupuesto={handleValidarPresupuesto}
                                        handleEliminarPresupuesto={handleEliminarPresupuesto}
                                        isSaving={isSaving}
                                    />
                                </TabsContent>
                                )}

                                {/* GRUPO 5: PROCESO & TRÁMITES - Solo disponible al editar */}
                                {isEditing && (
                                <TabsContent value="proceso-tramites" className="space-y-6">
                                    <ProcesosForm formData={formData} currentExpedienteId={currentExpedienteId ?? undefined} />
                                </TabsContent>
                                )}
                            </Tabs>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>








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


