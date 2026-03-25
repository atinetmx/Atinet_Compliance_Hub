import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, FileText, ChevronDown, DollarSign } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

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

interface FilaCompareciente {
    id: string;
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

    const { addToast } = useToast();

    // Cargar expedientes al montar (filtro vacío = todos)
    useEffect(() => {
        fetchExpedientes('');
        fetchOperaciones();
        fetchUsuarios();
        fetchDependencias();
        fetchClientes();
        fetchComparecientes();
    }, []);

    // Cargar operaciones disponibles desde API
    const fetchOperaciones = async () => {
        setCargandoOperaciones(true);
        try {
            const response = await fetch('http://192.168.1.1:5000/api/Catalogos/GetOperaciones', {
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

    // Cargar usuarios disponibles desde API
    const fetchUsuarios = async () => {
        setCargandoUsuarios(true);
        try {
            const response = await fetch('http://192.168.1.1:5000/api/User/GetRolesUsuarios', {
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
            const response = await fetch('http://192.168.1.1:5000/api/Catalogos/GetDependenciasPublicas', {
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
            const response = await fetch('http://192.168.1.1:5000/api/Clientes/GetClientes', {
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
            const response = await fetch('http://192.168.1.1:5000/api/Catalogos/GetComparecientes', {
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
            addToast({
                type: 'error',
                title: 'Error',
                message: 'No se pudieron cargar los comparecientes',
            });
        }
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
        if (usuarios.length > 0) {
            const notarios = usuarios.filter(u => u.rol === 'NOTARIOS');
            const responsables = usuarios.filter(u => u.rol === 'RESPONSABLES');
            const secretarias = usuarios.filter(u => u.rol === 'SECRETARIAS');
            const autorizados = usuarios.filter(u => u.rol === 'AUTORIZADOS');

            setFormData(prev => ({
                ...prev,
                notario: notarios.length > 0 && !prev.notario ? `${notarios[0].nombre} ${notarios[0].apellido_Paterno} ${notarios[0].apellido_Materno}` : prev.notario,
                responsable: responsables.length > 0 && !prev.responsable ? `${responsables[0].nombre} ${responsables[0].apellido_Paterno} ${responsables[0].apellido_Materno}` : prev.responsable,
                secretaria: secretarias.length > 0 && !prev.secretaria ? `${secretarias[0].nombre} ${secretarias[0].apellido_Paterno} ${secretarias[0].apellido_Materno}` : prev.secretaria,
                autorizado: autorizados.length > 0 && !prev.autorizado ? `${autorizados[0].nombre} ${autorizados[0].apellido_Paterno} ${autorizados[0].apellido_Materno}` : prev.autorizado,
            }));
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

    const fetchExpedientes = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const url = new URL('http://192.168.1.1:5000/api/Expediente/GetExpediente');
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
        setDependenciaBusqueda('');
        setMostrarDropdownDependencias(false);
        setDatosDepdencias({});
        setDependenciaSeleccionada(null);
        setIsEditing(false);
        setSaveError(null);
        setActiveTab('busqueda');
    };

    const handleSeleccionarOperacion = (operacion: Operacion) => {
        setFormData(prev => ({
            ...prev,
            operaciones: [...prev.operaciones, operacion.descripcion]
        }));
        setOperacionBusqueda('');
        setMostrarDropdownOperaciones(false);
    };

    const handleEliminarOperacion = (indice: number) => {
        setFormData(prev => ({
            ...prev,
            operaciones: prev.operaciones.filter((_, i) => i !== indice)
        }));
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
                <div className="pb-2 border-b">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-blue-600 p-3 text-white">
                            <FileText className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Expedientes</h1>
                            <p className="text-muted-foreground text-xs">Gestión de expedientes</p>
                        </div>
                    </div>
                </div>

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
                                    <TabsTrigger value="docs-inmuebles" className="gap-1 data-[state=active]:shadow-neutral-800">
                                        <FileText className="h-4 w-4" />
                                        <span className="hidden sm:inline">Documentos</span>
                                    </TabsTrigger>

                                    {/* GRUPO 3: FINANCIERO & CONTROL */}
                                    <TabsTrigger value="financiero-control" className="gap-1 data-[state=active]:shadow-neutral-800">
                                        <DollarSign className="h-4 w-4" />
                                        <span className="hidden sm:inline">Financiero</span>
                                    </TabsTrigger>

                                    {/* GRUPO 4: PROCESO & TRÁMITES */}
                                    <TabsTrigger value="proceso-tramites" className="gap-1 data-[state=active]:shadow-neutral-800">
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
                                                    <label className="text-sm font-medium">Referencia</label>
                                                    <Input name="referencia" value={formData.referencia} onChange={handleInputChange} placeholder="Referencia" className="text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Municipio</label>
                                                    <Input name="municipio" value={formData.municipio} onChange={handleInputChange} placeholder="Municipio" className="text-sm" />
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
                                                    <Input type="text" readOnly className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed" />
                                                </div>
                                            )}

                                            <div className="mb-6">
                                                <label className="text-sm font-medium block mb-2">Operaciones</label>
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

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Notario</label>
                                                    <div ref={refDropdownNotario} className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder={notariosFiltrados.length === 0 ? 'Sin notarios disponibles' : 'Buscar notario...'}
                                                                value={busquedaNotario}
                                                                onChange={(e) => setBusquedaNotario(e.target.value)}
                                                                onFocus={() => setMostrarDropdownNotario(true)}
                                                                className={`text-sm pr-16 ${notariosFiltrados.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                readOnly={notariosFiltrados.length === 0}
                                                            />
                                                            {busquedaNotario && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBusquedaNotario('')}
                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownNotario && notariosFiltrados.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                                                {notariosFiltrados.map(u => (
                                                                    <div
                                                                        key={u.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, notario: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
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
                                                    {formData.notario && (
                                                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">
                                                            <span className="text-sm">{formData.notario}</span>
                                                            <button onClick={() => setFormData(prev => ({ ...prev, notario: '' }))} className="text-red-600 hover:text-red-800 dark:text-red-400">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Responsable</label>
                                                    <div ref={refDropdownResponsable} className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder={responsablesFiltrados.length === 0 ? 'Sin responsables disponibles' : 'Buscar responsable...'}
                                                                value={busquedaResponsable}
                                                                onChange={(e) => setBusquedaResponsable(e.target.value)}
                                                                onFocus={() => setMostrarDropdownResponsable(true)}
                                                                className={`text-sm pr-16 ${responsablesFiltrados.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                readOnly={responsablesFiltrados.length === 0}
                                                            />
                                                            {busquedaResponsable && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBusquedaResponsable('')}
                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownResponsable && responsablesFiltrados.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                                                {responsablesFiltrados.map(u => (
                                                                    <div
                                                                        key={u.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, responsable: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
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
                                                    {formData.responsable && (
                                                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">
                                                            <span className="text-sm">{formData.responsable}</span>
                                                            <button onClick={() => setFormData(prev => ({ ...prev, responsable: '' }))} className="text-red-600 hover:text-red-800 dark:text-red-400">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Secretaria</label>
                                                    <div ref={refDropdownSecretaria} className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder={secretariasFiltradas.length === 0 ? 'Sin secretarias disponibles' : 'Buscar secretaria...'}
                                                                value={busquedaSecretaria}
                                                                onChange={(e) => setBusquedaSecretaria(e.target.value)}
                                                                onFocus={() => setMostrarDropdownSecretaria(true)}
                                                                className={`text-sm pr-16 ${secretariasFiltradas.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                readOnly={secretariasFiltradas.length === 0}
                                                            />
                                                            {busquedaSecretaria && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBusquedaSecretaria('')}
                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownSecretaria && secretariasFiltradas.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                                                {secretariasFiltradas.map(u => (
                                                                    <div
                                                                        key={u.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, secretaria: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
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
                                                    {formData.secretaria && (
                                                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">
                                                            <span className="text-sm">{formData.secretaria}</span>
                                                            <button onClick={() => setFormData(prev => ({ ...prev, secretaria: '' }))} className="text-red-600 hover:text-red-800 dark:text-red-400">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Autorizado</label>
                                                    <div ref={refDropdownAutorizado} className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder={autorizadosFiltrados.length === 0 ? 'Sin autorizados disponibles' : 'Buscar autorizado...'}
                                                                value={busquedaAutorizado}
                                                                onChange={(e) => setBusquedaAutorizado(e.target.value)}
                                                                onFocus={() => setMostrarDropdownAutorizado(true)}
                                                                className={`text-sm pr-16 ${autorizadosFiltrados.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                                readOnly={autorizadosFiltrados.length === 0}
                                                            />
                                                            {busquedaAutorizado && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setBusquedaAutorizado('')}
                                                                    className="absolute right-8 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground h-4 w-4 cursor-pointer"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            )}
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownAutorizado && autorizadosFiltrados.length > 0 && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                                                                {autorizadosFiltrados.map(u => (
                                                                    <div
                                                                        key={u.id}
                                                                        onClick={() => {
                                                                            setFormData(prev => ({ ...prev, autorizado: `${u.nombre} ${u.apellido_Paterno} ${u.apellido_Materno}` }));
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
                                                    {formData.autorizado && (
                                                        <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">
                                                            <span className="text-sm">{formData.autorizado}</span>
                                                            <button onClick={() => setFormData(prev => ({ ...prev, autorizado: '' }))} className="text-red-600 hover:text-red-800 dark:text-red-400">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
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
                                                    {/* Folios Requeridos con Botón */}
                                                    <div className="grid grid-cols-3 gap-4 items-end">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Folios Requeridos</label>
                                                            <Input type="number" name="foliosRequeridos" value={formData.foliosRequeridos} onChange={handleInputChange} placeholder="0" className="text-sm" />
                                                        </div>
                                                        <Button className="bg-blue-600 hover:bg-blue-700 h-10">
                                                            Asignar
                                                        </Button>
                                                        <div></div>
                                                    </div>

                                                    {/* Folio Inicial y Final */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Folio Inicial</label>
                                                            <Input type="number" name="folioInicial" value={formData.folioInicial} onChange={handleInputChange} placeholder="0" className="text-sm" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Folio Final</label>
                                                            <Input type="number" name="folioFinal" value={formData.folioFinal} onChange={handleInputChange} placeholder="0" className="text-sm" />
                                                        </div>
                                                    </div>

                                                    {/* Volumen, Tomo, Folios Inutilizados */}
                                                    <div className="grid grid-cols-3 gap-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Volumen</label>
                                                            <Input type="number" name="volumen" value={formData.volumen} onChange={handleInputChange} placeholder="0" className="text-sm" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Tomo</label>
                                                            <Input type="number" name="tomo" value={formData.tomo} onChange={handleInputChange} placeholder="0" className="text-sm" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-medium">Folios Inutilizados</label>
                                                            <Input type="number" name="foliosInutilizados" value={formData.foliosInutilizados} onChange={handleInputChange} placeholder="0" className="text-sm" />
                                                        </div>
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
                                                <div className="border rounded-lg overflow-hidden" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                                                    <div className="overflow-x-auto overflow-y-auto flex-1">
                                                        <table className="w-full text-sm">
                                                        <thead className="bg-slate-200 dark:bg-slate-700 border-b">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left">Nombre Compareciente</th>
                                                                <th className="px-4 py-2 text-left">Tipo Compareciente</th>
                                                                <th className="px-4 py-2 text-center">Firma Requerida</th>
                                                                <th className="px-4 py-2 text-left">Fecha Firma</th>
                                                                <th className="px-4 py-2 text-center">Lista Negra</th>
                                                                <th className="px-4 py-2 text-center">Lista SAT</th>
                                                                <th className="px-4 py-2 text-center">Acciones</th>
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
                                                                                className="text-sm pr-8"
                                                                            />
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
                                                                            Lista Negra
                                                                        </Button>
                                                                    </td>
                                                                    <td className="px-4 py-3 text-center">
                                                                        <Button
                                                                            size="sm"
                                                                            variant="outline"
                                                                            className="text-sm font-medium gap-2"
                                                                        >
                                                                            <Search className="h-4 w-4" />
                                                                            Lista SAT
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
                                                <div className="border rounded-lg p-6 bg-slate-50 dark:bg-slate-900/30 mt-8">
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

                                {/* GRUPO 2: DOCUMENTOS & INMUEBLES */}
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
                                                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-4">Recibo de Documentos</h3>

                                                {/* Dropdown de Otorgante */}
                                                <div className="mb-6">
                                                    <label className="text-sm font-medium block mb-2">Otorgante</label>
                                                    <div className="relative">
                                                        <div className="relative">
                                                            <Input
                                                                type="text"
                                                                placeholder="Buscar otorgante..."
                                                                value={busquedaOtorgante}
                                                                onChange={(e) => setBusquedaOtorgante(e.target.value)}
                                                                onFocus={() => setMostrarDropdownOtorgante(true)}
                                                                className="text-sm pr-8"
                                                            />
                                                            <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground pointer-events-none h-4 w-4" />
                                                        </div>
                                                        {mostrarDropdownOtorgante && (
                                                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-10 max-h-64 overflow-y-auto">
                                                                {cargandoClientes && <div className="px-3 py-2 text-sm text-muted-foreground">Cargando...</div>}
                                                                {!cargandoClientes && clientesFiltrados.filter(c => {
                                                                    const busqueda = busquedaOtorgante.toLowerCase();
                                                                    const nombreCompleto = `${c.nombre} ${c.apellido_Paterno} ${c.apellido_Materno}`.toLowerCase();
                                                                    return nombreCompleto.includes(busqueda);
                                                                }).length === 0 && <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>}
                                                                {clientesFiltrados.filter(c => {
                                                                    const busqueda = busquedaOtorgante.toLowerCase();
                                                                    const nombreCompleto = `${c.nombre} ${c.apellido_Paterno} ${c.apellido_Materno}`.toLowerCase();
                                                                    return nombreCompleto.includes(busqueda);
                                                                }).map(cliente => (
                                                                    <div
                                                                        key={cliente.id}
                                                                        onClick={() => {
                                                                            setOtorganteSeleccionado(cliente);
                                                                            setBusquedaOtorgante(`${cliente.nombre} ${cliente.apellido_Paterno} ${cliente.apellido_Materno}`);
                                                                            setMostrarDropdownOtorgante(false);
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
                                                    {otorganteSeleccionado && (
                                                        <div className="mt-3 flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-md">
                                                            <span className="text-sm">{otorganteSeleccionado.nombre} {otorganteSeleccionado.apellido_Paterno} {otorganteSeleccionado.apellido_Materno}</span>
                                                            <button onClick={() => {
                                                                setOtorganteSeleccionado(null);
                                                                setBusquedaOtorgante('');
                                                            }} className="text-red-600 hover:text-red-800 dark:text-red-400">
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Tabla de Documentos */}
                                            {otorganteSeleccionado && (
                                                <div className="border rounded-lg overflow-hidden" style={{ height: '500px', display: 'flex', flexDirection: 'column' }}>
                                                    <div className="overflow-x-auto overflow-y-auto flex-1">
                                                        <table className="w-full text-sm">
                                                            <thead className="bg-slate-200 dark:bg-slate-700 border-b sticky top-0">
                                                                <tr>
                                                                    <th className="px-3 py-2 text-left">Descripción</th>
                                                                    <th className="px-2 py-2 text-center">Entrega</th>
                                                                    <th className="px-2 py-2 text-center">Usu. Recibe</th>
                                                                    <th className="px-2 py-2 text-center">Copia</th>
                                                                    <th className="px-2 py-2 text-center">Original</th>
                                                                    <th className="px-2 py-2 text-center">Recepción</th>
                                                                    <th className="px-2 py-2 text-center">Abogado Rec.</th>
                                                                    <th className="px-3 py-2 text-left">Observaciones</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {/* Filas vacías para ser llenadas */}
                                                                {Array.from({ length: 12 }).map((_, index) => {
                                                                    const fila = filasDocumentos[index] || {
                                                                        descripcion: '',
                                                                        entregaCheck: false,
                                                                        entregaFecha: '',
                                                                        usuRecibe: false,
                                                                        copia: false,
                                                                        original: false,
                                                                        recepcionCheck: false,
                                                                        recepcionFecha: '',
                                                                        abogadoRec: false,
                                                                        observaciones: ''
                                                                    };

                                                                    const handleEntregaCheck = (checked: boolean) => {
                                                                        const today = new Date();
                                                                        const hoy = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
                                                                        setFilasDocumentos(prev => ({
                                                                            ...prev,
                                                                            [index]: {
                                                                                ...fila,
                                                                                entregaCheck: checked,
                                                                                entregaFecha: checked ? hoy : ''
                                                                            }
                                                                        }));
                                                                    };

                                                                    const handleRecepcionCheck = (checked: boolean) => {
                                                                        const today = new Date();
                                                                        const hoy = `${String(today.getDate()).padStart(2, '0')}-${String(today.getMonth() + 1).padStart(2, '0')}-${today.getFullYear()}`;
                                                                        setFilasDocumentos(prev => ({
                                                                            ...prev,
                                                                            [index]: {
                                                                                ...fila,
                                                                                recepcionCheck: checked,
                                                                                recepcionFecha: checked ? hoy : ''
                                                                            }
                                                                        }));
                                                                    };

                                                                    return (
                                                                        <tr key={index} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                                            <td className="px-3 py-2">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Tipo de documento"
                                                                                    value={fila.descripcion}
                                                                                    onChange={(e) => setFilasDocumentos(prev => ({
                                                                                        ...prev,
                                                                                        [index]: { ...fila, descripcion: e.target.value }
                                                                                    }))}
                                                                                    className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                                />
                                                                            </td>
                                                                            <td className="px-2 py-2 text-center">
                                                                                {fila.entregaCheck ? (
                                                                                    <div className="flex items-center justify-center gap-1">
                                                                                        <input type="checkbox" checked={true} onChange={() => handleEntregaCheck(false)} className="rounded w-5 h-5 cursor-pointer" />
                                                                                        <span className="text-xs whitespace-nowrap">{fila.entregaFecha}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <input type="checkbox" checked={false} onChange={(e) => handleEntregaCheck(e.target.checked)} className="rounded w-5 h-5 cursor-pointer" />
                                                                                )}
                                                                            </td>
                                                                            <td className="px-2 py-2 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={fila.usuRecibe}
                                                                                    onChange={(e) => setFilasDocumentos(prev => ({
                                                                                        ...prev,
                                                                                        [index]: { ...fila, usuRecibe: e.target.checked }
                                                                                    }))}
                                                                                    className="rounded w-5 h-5 cursor-pointer"
                                                                                />
                                                                            </td>
                                                                            <td className="px-2 py-2 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={fila.copia}
                                                                                    onChange={(e) => setFilasDocumentos(prev => ({
                                                                                        ...prev,
                                                                                        [index]: { ...fila, copia: e.target.checked }
                                                                                    }))}
                                                                                    className="rounded w-5 h-5 cursor-pointer"
                                                                                />
                                                                            </td>
                                                                            <td className="px-2 py-2 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={fila.original}
                                                                                    onChange={(e) => setFilasDocumentos(prev => ({
                                                                                        ...prev,
                                                                                        [index]: { ...fila, original: e.target.checked }
                                                                                    }))}
                                                                                    className="rounded w-5 h-5 cursor-pointer"
                                                                                />
                                                                            </td>
                                                                            <td className="px-2 py-2 text-center">
                                                                                {fila.recepcionCheck ? (
                                                                                    <div className="flex items-center justify-center gap-1">
                                                                                        <input type="checkbox" checked={true} onChange={() => handleRecepcionCheck(false)} className="rounded w-5 h-5 cursor-pointer" />
                                                                                        <span className="text-xs whitespace-nowrap">{fila.recepcionFecha}</span>
                                                                                    </div>
                                                                                ) : (
                                                                                    <input type="checkbox" checked={false} onChange={(e) => handleRecepcionCheck(e.target.checked)} className="rounded w-5 h-5 cursor-pointer" />
                                                                                )}
                                                                            </td>
                                                                            <td className="px-2 py-2 text-center">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={fila.abogadoRec}
                                                                                    onChange={(e) => setFilasDocumentos(prev => ({
                                                                                        ...prev,
                                                                                        [index]: { ...fila, abogadoRec: e.target.checked }
                                                                                    }))}
                                                                                    className="rounded w-5 h-5 cursor-pointer"
                                                                                />
                                                                            </td>
                                                                            <td className="px-3 py-2">
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Observaciones"
                                                                                    value={fila.observaciones}
                                                                                    onChange={(e) => setFilasDocumentos(prev => ({
                                                                                        ...prev,
                                                                                        [index]: { ...fila, observaciones: e.target.value }
                                                                                    }))}
                                                                                    className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                                />
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            )}

                                            {!otorganteSeleccionado && (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <p>Selecciona un otorgante para ver la tabla de documentos.</p>
                                                </div>
                                            )}
                                        </TabsContent>

                                        {/* SubTab: Inmuebles */}
                                        <TabsContent value="inmuebles" className="space-y-4">
                                            <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-md mb-6">
                                                <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-2">Gestión de Inmuebles</h3>
                                                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">+ Agregar Inmueble</Button>
                                            </div>
                                            {/* Tabla de resultados de inmuebles con mismo estilo que recibo documentos */}
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
                                                            {/* Ejemplo estático, reemplazar por tu mapeo real */}
                                                            {[{ numero: 1, tipo: 'Casa', catastral: '123-ABC' }, { numero: 2, tipo: 'Departamento', catastral: '456-DEF' }].map((inmueble, idx) => (
                                                                <tr key={idx} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                                    <td className="px-3 py-2">{inmueble.numero}</td>
                                                                    <td className="px-3 py-2">{inmueble.tipo}</td>
                                                                    <td className="px-3 py-2">{inmueble.catastral}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
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

                                {/* GRUPO 3: FINANCIERO & CONTROL */}
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

                                {/* GRUPO 4: PROCESO & TRÁMITES */}
                                <TabsContent value="proceso-tramites" className="space-y-6">
                                    <Tabs defaultValue="etapas-expediente" className="w-full">
                                        <TabsList className="grid w-full grid-cols-4 gap-1 bg-slate-100 dark:bg-slate-800 mb-4 p-1">
                                            <TabsTrigger value="etapas-expediente" className="text-xs">Etapas</TabsTrigger>
                                            <TabsTrigger value="solicitud-seguimiento" className="text-xs">Solicitud</TabsTrigger>
                                            <TabsTrigger value="recibo-general" className="text-xs">Recibo General</TabsTrigger>
                                            <TabsTrigger value="dependencias" className="text-xs">Dependencias</TabsTrigger>
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

                                        {/* SubTab: Dependencias */}
                                        <TabsContent value="dependencias" className="space-y-4">
                                            <div className="space-y-2 mb-6">
                                                <label className="text-sm font-medium">Dependencia Encargada</label>
                                                <Input type="text" placeholder="Nombre de la dependencia" className="text-sm" />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Responsable</label>
                                                    <Input type="text" placeholder="Nombre del responsable" className="text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Correo</label>
                                                    <Input type="email" placeholder="correo@ejemplo.com" className="text-sm" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Teléfono</label>
                                                    <Input type="tel" placeholder="Teléfono" className="text-sm" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-sm font-medium">Extensión</label>
                                                    <Input type="text" placeholder="Extensión" className="text-sm" />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Observaciones</label>
                                                <textarea placeholder="Observaciones de la dependencia..." rows={4} className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm" />
                                            </div>
                                        </TabsContent>
                                    </Tabs>
                                </TabsContent>

                            </Tabs>

                        {/* BOTONES DE ACCIÓN */}
                        <div className="flex gap-2 justify-end pt-6 border-t mt-6">
                            <Button variant="outline" onClick={handleCancelEdit}>
                                <X className="h-4 w-4 mr-2" />
                                Cancelar
                            </Button>
                            <Button
                                onClick={() => {
                                    addToast('Funcionalidad en desarrollo', 'info');
                                }}
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


