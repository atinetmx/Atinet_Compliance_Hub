import { API_BASE_URL } from '@/services/api';
import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, DollarSign, Eye, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';

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

interface PresupuestoPrevioData {
    id?: string | number;
    cliente: string | number;
    operacion: string | number;
    zona_municipio: string | number;
    observaciones: string;
    valor_operacion: number;
    valor_avaluo: number;
    valor_catastral: number;
    parametro: string;
    honorarios: number;
    descuento: number;
    incluir_iva: boolean;
    iva: number;
    retencion_isr: number;
    retencion_iva: number;
    impuestos_derechos: DetalleItem[];
    gastos_notariales: DetalleItem[];
    activo: boolean;
}

interface DetalleItem {
    id: string;
    descripcion: string;
    importe: number;
    observaciones?: string;
}

interface Operacion {
    id: number;
    descripcion: string;
    actividad_Vulnerable_Id?: number | null;
    activo: boolean;
}

interface PresupuestoPrevioBusqueda {
    id: number;
    nombre: string;
    apellido_Paterno: string;
    apellido_Materno: string;
    operacion: string;
    fecha_Creacion: string;
    activo: boolean;
}

interface Cliente {
    id: number;
    nombre: string;
    apellido_Paterno: string;
    apellido_Materno: string;
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
    activo: boolean;
}

interface ImpuestoDerechoAPI {
    id?: number;
    impuestos_derechos_Id: number;
    descripcion: string;
    importe?: number;
    observaciones?: string;
}

const defaultPresupuestoData: PresupuestoPrevioData = {
    cliente: '',
    operacion: '',
    zona_municipio: '',
    observaciones: '',
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
    impuestos_derechos: [],
    gastos_notariales: [],
    activo: true,
};

const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

export default function PresupuestoPrevioIndex() {
    // --- Estado pestaña Búsqueda ---
    const [filtro, setFiltro] = useState('');
    const [resultados, setResultados] = useState<PresupuestoPrevioBusqueda[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // --- Control de pestaña activa ---
    const [activeTab, setActiveTab] = useState('busqueda');

    // --- Estado pestaña Formulario ---
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [operaciones, setOperaciones] = useState<Operacion[]>([]);
    const [formData, setFormData] = useState<PresupuestoPrevioData>(defaultPresupuestoData);
    const [isLoadingClientes, setIsLoadingClientes] = useState(false);
    const [isLoadingOperaciones, setIsLoadingOperaciones] = useState(false);
    const [isLoadingImpuestos, setIsLoadingImpuestos] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [ret_isr_check, setRetISRCheck] = useState(false);
    const [ret_iva_check, setRetIVACheck] = useState(false);
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);

    // --- Modal de búsqueda de clientes ---
    const [showClienteModal, setShowClienteModal] = useState(false);
    const [clienteFiltro, setClienteFiltro] = useState('');
    const [clienteResultados, setClienteResultados] = useState<ClienteBusqueda[]>([]);
    const [isSearchingClientes, setIsSearchingClientes] = useState(false);
    const [clienteError, setClienteError] = useState<string | null>(null);
    const [clienteSelected, setClienteSelected] = useState<ClienteBusqueda | null>(null);

    // --- Filtro de operaciones ---
    const [operacionFiltro, setOperacionFiltro] = useState('');
    const [showOperacionDropdown, setShowOperacionDropdown] = useState(false);

    const { addToast } = useToast();

    // Cargar presupuestos al montar (filtro vacío = todos)
    useEffect(() => {
        fetchPresupuestos('');
    }, []);

    // Cargar clientes al montar
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                setIsLoadingClientes(true);
                const response = await fetch(`${API_BASE_URL}/Clientes/GetClientes`, {
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.message || 'Error al obtener los clientes');
                }
                setClientes(data.dataResponse || []);
            } catch (error) {
                console.error('Error cargando clientes:', error);
                const message = error instanceof Error ? error.message : 'Error al cargar los clientes';
                addToast(message, 'error');
            } finally {
                setIsLoadingClientes(false);
            }
        };
        fetchClientes();
    }, [addToast]);

    // Cargar operaciones al montar
    useEffect(() => {
        const fetchOperaciones = async () => {
            try {
                setIsLoadingOperaciones(true);
                const response = await fetch(`${API_BASE_URL}/Catalogos/GetOperaciones`, {
                    headers: { 'Content-Type': 'application/json' },
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data?.message || 'Error al obtener las operaciones');
                }
                setOperaciones(data.dataResponse || []);
            } catch (error) {
                console.error('Error cargando operaciones:', error);
                const message = error instanceof Error ? error.message : 'Error al cargar las operaciones';
                addToast(message, 'error');
            } finally {
                setIsLoadingOperaciones(false);
            }
        };
        fetchOperaciones();
    }, [addToast]);

    // Búsqueda dinámica: actualizar resultados cuando cambia el filtro
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchPresupuestos(filtro);
        }, 300); // Esperar 300ms después de que el usuario deje de escribir

        return () => clearTimeout(debounceTimer);
    }, [filtro]);

    const fetchPresupuestos = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const url = new URL(`${API_BASE_URL}/Presupuestos/GetPresupuestosPrevios`);
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
                setSearchError(data.message || 'No se pudieron cargar los presupuestos previos.');
                setResultados([]);
            }
        } catch (error) {
            console.error('Error buscando presupuestos:', error);
            setSearchError('No se pudieron cargar los presupuestos. Verifica la conexión con el servidor.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchPresupuestos(filtro);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target as HTMLInputElement;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? Number(value) : value);
        setFormData(prev => ({ ...prev, [name]: val }));
    };

    const handleSelectChange = async (name: string, value: string) => {
        // Si es cliente u operación, convertir a número
        let actualValue: string | number = value;
        if ((name === 'operacion' || name === 'cliente') && value) {
            actualValue = Number(value);
        }
        setFormData(prev => ({ ...prev, [name]: actualValue }));

        // Si se selecciona una operación, cargar impuestos y derechos
        if (name === 'operacion' && value) {
            const operacionSeleccionada = operaciones.find(op => op.id === Number(value));
            if (operacionSeleccionada) {
                try {
                    setIsLoadingImpuestos(true);
                    const url = `${API_BASE_URL}/ConfiguracionOperacion/GetImpuestoDerechoOperacion?idOperacion=${operacionSeleccionada.id}`;
                    const response = await fetch(url, {
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const data = await response.json();

                    if (response.ok && data.dataResponse) {
                        // Mapear los datos del API al formato de impuestos_derechos
                        const impuestosFormato = data.dataResponse.map((item: ImpuestoDerechoAPI) => ({
                            id: item.impuestos_derechos_Id.toString(),
                            descripcion: item.descripcion,
                            importe: item.importe || 0,
                            observaciones: item.observaciones || ''
                        }));

                        setFormData(prev => ({
                            ...prev,
                            impuestos_derechos: impuestosFormato
                        }));
                        addToast('Impuestos y derechos cargados exitosamente', 'success');
                    } else {
                        addToast('No se encontraron impuestos para esta operación', 'info');
                        setFormData(prev => ({
                            ...prev,
                            impuestos_derechos: []
                        }));
                    }
                } catch (error) {
                    console.error('Error cargando impuestos:', error);
                    const message = error instanceof Error ? error.message : 'Error al cargar impuestos';
                    addToast(message, 'error');
                    setFormData(prev => ({
                        ...prev,
                        impuestos_derechos: []
                    }));
                } finally {
                    setIsLoadingImpuestos(false);
                }
            }
        }
    };

    const addImpuestoDerechos = () => {
        setFormData(prev => ({
            ...prev,
            impuestos_derechos: [...prev.impuestos_derechos, { id: Date.now().toString(), descripcion: '', importe: 0 }]
        }));
    };

    const removeImpuestoDerechos = (id: string) => {
        setFormData(prev => ({
            ...prev,
            impuestos_derechos: prev.impuestos_derechos.filter(item => item.id !== id)
        }));
    };

    const updateImpuestoDerechos = (id: string, field: 'descripcion' | 'importe' | 'observaciones', value: string | number) => {
        setFormData(prev => ({
            ...prev,
            impuestos_derechos: prev.impuestos_derechos.map(item =>
                item.id === id ? { ...item, [field]: field === 'importe' ? Number(value) : value } : item
            )
        }));
    };

    const addGastoNotarial = () => {
        setFormData(prev => ({
            ...prev,
            gastos_notariales: [...prev.gastos_notariales, { id: Date.now().toString(), descripcion: '', importe: 0 }]
        }));
    };

    const removeGastoNotarial = (id: string) => {
        setFormData(prev => ({
            ...prev,
            gastos_notariales: prev.gastos_notariales.filter(item => item.id !== id)
        }));
    };

    const updateGastoNotarial = (id: string, field: 'descripcion' | 'importe', value: string | number) => {
        setFormData(prev => ({
            ...prev,
            gastos_notariales: prev.gastos_notariales.map(item =>
                item.id === id ? { ...item, [field]: field === 'importe' ? Number(value) : value } : item
            )
        }));
    };

    // Cálculos automáticos
    const calcularTotales = () => {
        const subtotalHonorarios = formData.honorarios - formData.descuento;
        const ivaCalculado = formData.incluir_iva ? subtotalHonorarios * 0.16 : 0;

        // Cálculos de retención
        let retISR = 0;
        let retIVA = 0;

        if (ret_isr_check) {
            retISR = subtotalHonorarios * 0.10;
        }

        if (ret_iva_check && formData.incluir_iva) {
            retIVA = ivaCalculado * 0.6666667;
        }

        const totalImpuestos = formData.impuestos_derechos.reduce((sum, item) => sum + item.importe, 0);
        const totalGastos = formData.gastos_notariales.reduce((sum, item) => sum + item.importe, 0);
        const totalPresupuesto = subtotalHonorarios + ivaCalculado + totalImpuestos + totalGastos - retISR - retIVA;

        return { subtotalHonorarios, ivaCalculado, retISR, retIVA, totalImpuestos, totalGastos, totalPresupuesto };
    };

    const handleAddPresupuesto = async () => {
        if (!formData.cliente || !formData.operacion) {
            addToast('Completa los campos obligatorios: Cliente, Operación', 'error');
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);

            const totales = calcularTotales();

            // Validar que cliente y operacion tienen valores válidos
            const clienteId = Number(formData.cliente);
            const operacionId = Number(formData.operacion);

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

            const payload = {
                presupuestoPrevio: {
                    cliente_Id: clienteId,
                    operacion_Id: operacionId,
                    zona_Municipio_Id: formData.zona_municipio ? Number(formData.zona_municipio) : 0,
                    observaciones: formData.observaciones,
                    valor_Operacion: formData.valor_operacion,
                    valor_Avaluo: formData.valor_avaluo,
                    valor_Catastral: formData.valor_catastral,
                    parametro: formData.parametro,
                    honorarios: formData.honorarios,
                    descuento: formData.descuento,
                },
                presupuestoPrevioImpuestosDerechos: formData.impuestos_derechos.map(item => ({
                    impuestos_Derechos_Id: Number(item.id),
                    importe: item.importe,
                    observaciones: item.observaciones || '',
                })),
                presupuestoPrevioGastosNotariales: formData.gastos_notariales.map(item => ({
                    concepto: item.descripcion,
                    importe: item.importe,
                })),
            };

            const url = isEditing && formData.id
                ? `${API_BASE_URL}/Presupuestos/UpdatePresupuestoPrevio?presupuestoPrevioId=${formData.id}`
                : `${API_BASE_URL}/Presupuestos/CreatePresupuestoPrevio`;

            const method = isEditing && formData.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const resData = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(resData?.message || 'Error al guardar el presupuesto');
            }

            addToast(resData?.message || 'Presupuesto guardado correctamente', 'success');
            setFormData(defaultPresupuestoData);
            setIsEditing(false);
            setActiveTab('busqueda');
            fetchPresupuestos(filtro);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al guardar';
            setSaveError(message);
            addToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const [isLoadingPresupuesto, setIsLoadingPresupuesto] = useState(false);

    const handleSelectPresupuesto = async (presupuesto: PresupuestoPrevioBusqueda) => {
        setIsLoadingPresupuesto(true);
        setIsEditing(true);
        setSaveError(null);
        setActiveTab('formulario');
        try {
            // Llamar a la API para obtener los detalles completos del presupuesto
            const response = await fetch(`${API_BASE_URL}/Presupuestos/GetPresupuestoPrevioById?presupuestoPrevioId=${presupuesto.id}`, {
                headers: { 'Content-Type': 'application/json' },
            });

            if (!response.ok) {
                throw new Error('Error al obtener los detalles del presupuesto');
            }

            const data = await response.json();
            const { presupuestoPrevio, impuestosDerechos, gastosNotariales } = data.dataResponse;

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

            setFormData({
                id: presupuestoPrevio.id,
                cliente: presupuestoPrevio.cliente_Id,
                operacion: presupuestoPrevio.operacion_Id,
                zona_municipio: presupuestoPrevio.zona_Municipio_Id || '',
                observaciones: presupuestoPrevio.observaciones,
                valor_operacion: presupuestoPrevio.valor_Operacion,
                valor_avaluo: presupuestoPrevio.valor_Avaluo,
                valor_catastral: presupuestoPrevio.valor_Catastral,
                parametro: presupuestoPrevio.parametro,
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

            // Establecer el filtro de operación con el nombre de la operación seleccionada
            const operacionSeleccionada = operaciones.find(op => op.id === presupuestoPrevio.operacion_Id);
            if (operacionSeleccionada) {
                setOperacionFiltro(operacionSeleccionada.descripcion);
            }

            addToast('Presupuesto cargado correctamente', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cargar el presupuesto';
            addToast(message, 'error');
            setIsEditing(false);
            setActiveTab('busqueda');
        } finally {
            setIsLoadingPresupuesto(false);
        }
    };

    const handleCancelEdit = () => {
        setFormData(defaultPresupuestoData);
        setOperacionFiltro('');
        setIsEditing(false);
        setSaveError(null);
        setActiveTab('busqueda');
    };

    const fetchClientesModal = async (filtroValue: string) => {
        setIsSearchingClientes(true);
        setClienteError(null);
        try {
            const url = new URL(`${API_BASE_URL}/Clientes/GetClientes`);
            if (filtroValue) {
                url.searchParams.append('filtro', filtroValue);
            }
            const response = await fetch(url.toString(), {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();

            if (response.ok) {
                setClienteResultados(data.dataResponse || []);
            } else {
                setClienteError(data.message || 'No se encontraron clientes.');
                setClienteResultados([]);
            }
        } catch (error) {
            console.error('Error buscando clientes:', error);
            setClienteError('No se pudieron cargar los clientes. Verifica la conexión con el servidor.');
        } finally {
            setIsSearchingClientes(false);
        }
    };

    const handleSelectClienteFromModal = (cliente: ClienteBusqueda) => {
        setFormData(prev => ({ ...prev, cliente: cliente.id }));
        setClienteSelected(cliente);
        setShowClienteModal(false);
        addToast(`Cliente "${cliente.nombre} ${cliente.apellido_Paterno}" seleccionado`, 'success');
    };

    const handleViewPdf = async () => {
        if (!formData.id) {
            addToast('Debe guardar el presupuesto primero', 'error');
            return;
        }

        try {
            setIsLoadingPdf(true);
            const response = await fetch(`${API_BASE_URL}/Presupuestos/GenerateReciboPresupuestoPrevio?presupuestoPrevioId=${formData.id}`, {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error('Error al generar el PDF');
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
            setShowPdfViewer(true);
            addToast('PDF cargado correctamente', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al generar el PDF';
            addToast(message, 'error');
            console.error('Error:', error);
        } finally {
            setIsLoadingPdf(false);
        }
    };

    const closePdfViewer = () => {
        setShowPdfViewer(false);
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    };

    // Componente de Label para campos requeridos
    const RequiredLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
        <label htmlFor={htmlFor} className="flex items-center gap-1 text-sm font-medium">
            {children}
            <span className="text-red-500">*</span>
        </label>
    );

    const SimpleLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
        <label htmlFor={htmlFor} className="text-sm font-medium">
            {children}
        </label>
    );

    return (
        <>
            <Head title="Presupuesto Previo - Control Notarial" />

            <div className="space-y-6 px-6 pt-6">
                

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 bg-transparent">
                        <TabsTrigger value="busqueda" className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Search className="size-4" />
                            <span className="hidden sm:inline">Búsqueda</span>
                        </TabsTrigger>
                        <TabsTrigger value="formulario" className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Plus className="size-4" />
                            <span className="hidden sm:inline">
                                {isEditing ? 'Editar Presupuesto' : 'Crear Presupuesto'}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ── PESTAÑA 1: BÚSQUEDA ── */}
                    <TabsContent value="busqueda" className="space-y-4">
                        <div className="flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                    placeholder="Buscar por nombre, operación..."
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
                            <Button disabled={isSearching} className="bg-green-600 hover:bg-green-700" onClick={() => fetchPresupuestos(filtro)}>
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
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Operación</TableHead>
                                        <TableHead>Fecha Creación</TableHead>
                                        <TableHead className="w-20 text-center">Activo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isSearching ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                Cargando presupuestos previos...
                                            </TableCell>
                                        </TableRow>
                                    ) : resultados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No se encontraron presupuestos previos.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        resultados.map((presupuesto) => (
                                            <TableRow
                                                key={presupuesto.id}
                                                className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-950/20 transition-colors"
                                                onClick={() => handleSelectPresupuesto(presupuesto)}
                                            >
                                                <TableCell className="font-mono text-sm">{presupuesto.id}</TableCell>
                                                <TableCell className="font-medium">{presupuesto.nombre} {presupuesto.apellido_Paterno} {presupuesto.apellido_Materno}</TableCell>
                                                <TableCell>
                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                        {presupuesto.operacion}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-sm">{presupuesto.fecha_Creacion}</TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        presupuesto.activo
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {presupuesto.activo ? 'Sí' : 'No'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {!isSearching && resultados.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {resultados.length} presupuesto(s) previo(s) encontrado(s) — <span className="text-green-600">haz clic en uno para editarlo</span>
                            </p>
                        )}
                    </TabsContent>

                    {/* ── PESTAÑA 2: FORMULARIO ── */}
                    <TabsContent value="formulario">
                        {isLoadingClientes || isLoadingPresupuesto ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <p className="text-muted-foreground">
                                    {isLoadingPresupuesto ? 'Cargando datos del presupuesto...' : 'Cargando datos...'}
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {saveError && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
                                        {saveError}
                                    </div>
                                )}

                                {/* SECCIÓN SUPERIOR: DOS COLUMNAS */}
                                <div className="grid grid-cols-3 gap-4">
                                    {/* COLUMNA 1: DATOS DEL PRESUPUESTO */}
                                    <div className="border rounded-lg p-4 bg-background/50 space-y-4 col-span-2">
                                        <h3 className="text-lg font-bold">Datos del presupuesto</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="cliente">Cliente</RequiredLabel>
                                                <div className="flex gap-2">
                                                    <Input
                                                        id="cliente"
                                                        readOnly
                                                        value={
                                                            clientes.find(c => c.id === Number(formData.cliente))
                                                                ? `${clientes.find(c => c.id === Number(formData.cliente))?.nombre} ${clientes.find(c => c.id === Number(formData.cliente))?.apellido_Paterno} ${clientes.find(c => c.id === Number(formData.cliente))?.apellido_Materno}`
                                                                : 'Selecciona un cliente'
                                                        }
                                                        placeholder="Selecciona un cliente"
                                                        className="flex-1"
                                                    />
                                                    <Button
                                                        type="button"
                                                        onClick={() => {
                                                            setShowClienteModal(true);
                                                            setClienteFiltro('');
                                                            setClienteResultados([]);
                                                        }}
                                                        className="bg-amber-600 hover:bg-amber-700"
                                                        title="Buscar cliente"
                                                    >
                                                        <Users className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="space-y-2 relative">
                                                <RequiredLabel htmlFor="operacion">Operación</RequiredLabel>
                                                <div className="relative">
                                                    <Input
                                                        id="operacion"
                                                        type="text"
                                                        placeholder="Busca o selecciona una operación..."
                                                        value={operacionFiltro || ''}
                                                        onChange={(e) => {
                                                            setOperacionFiltro(e.target.value);
                                                            setShowOperacionDropdown(true);
                                                        }}
                                                        onFocus={() => setShowOperacionDropdown(true)}
                                                        onBlur={() => setTimeout(() => setShowOperacionDropdown(false), 200)}
                                                        disabled={isLoadingOperaciones}
                                                        className="w-full pr-10"
                                                    />
                                                    {operacionFiltro && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setOperacionFiltro('');
                                                                handleSelectChange('operacion', '');
                                                                setShowOperacionDropdown(false);
                                                            }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                {showOperacionDropdown && operaciones.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                                                        {operaciones
                                                            .filter(op =>
                                                                op.descripcion
                                                                    .toLowerCase()
                                                                    .includes(operacionFiltro.toLowerCase())
                                                            )
                                                            .map(operacion => (
                                                                <button
                                                                    key={operacion.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSelectChange('operacion', operacion.id.toString());
                                                                        setOperacionFiltro(operacion.descripcion);
                                                                        setShowOperacionDropdown(false);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 hover:bg-amber-50 border-b last:border-b-0 text-sm"
                                                                >
                                                                    {operacion.descripcion}
                                                                </button>
                                                            ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <SimpleLabel htmlFor="zona_municipio">Zona o Municipio</SimpleLabel>
                                                <Input
                                                    id="zona_municipio"
                                                    name="zona_municipio"
                                                    value={formData.zona_municipio}
                                                    onChange={handleInputChange}
                                                    placeholder="Zona o Municipio"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <SimpleLabel htmlFor="observaciones">Observaciones</SimpleLabel>
                                                <textarea
                                                    id="observaciones"
                                                    name="observaciones"
                                                    value={formData.observaciones}
                                                    onChange={handleInputChange}
                                                    placeholder="Observaciones adicionales"
                                                    rows={2}
                                                    className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                />
                                            </div>
                                        </div>
                                </div>

                                {/* COLUMNA 2: VALORES DE LA OPERACIÓN */}
                                <div className="border rounded-lg p-4 bg-background/50 space-y-4">
                                        <h3 className="text-lg font-bold">Valores</h3>
                                        <div className="space-y-3">
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium">Valor Operación</label>
                                                <Input
                                                    name="valor_operacion"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.valor_operacion}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    className="text-right font-bold text-green-600"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium">Valor Avalúo</label>
                                                <Input
                                                    name="valor_avaluo"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.valor_avaluo}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    className="text-right font-bold text-green-600"
                                                />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-sm font-medium">Valor Catastral</label>
                                                <Input
                                                    name="valor_catastral"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.valor_catastral}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    className="text-right font-bold text-green-600"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN MEDIA: HONORARIOS */}
                                <div className="border rounded-lg p-4 bg-background/50">
                                    <h3 className="text-lg font-bold mb-4">Detalles Honorarios</h3>

                                    {/* FILA 1: HONORARIOS - DESCUENTO - SUBTOTAL */}
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Honorarios</label>
                                            <div className="flex items-center border rounded-md overflow-hidden">
                                                <Input
                                                    name="honorarios"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.honorarios}
                                                    onChange={handleInputChange}
                                                    className="text-right font-bold border-0 rounded-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Descuento</label>
                                            <div className="flex items-center border rounded-md overflow-hidden">

                                                <Input
                                                    name="descuento"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.descuento}
                                                    onChange={handleInputChange}
                                                    className="text-right font-bold border-0 rounded-none"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Subtotal Honorarios</label>
                                            <div className="flex items-center border rounded-md overflow-hidden">
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    value={(formData.honorarios - formData.descuento).toFixed(2)}
                                                    readOnly
                                                    className="text-right font-bold text-green-600 border-0 rounded-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* FILA 2: CHECK IVA - VALOR IVA - SUBTOTAL IVA */}
                                    <div className="grid grid-cols-3 gap-4 mb-4">
                                        <div></div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <input
                                                    id="incluir_iva"
                                                    name="incluir_iva"
                                                    type="checkbox"
                                                    checked={formData.incluir_iva}
                                                    onChange={handleInputChange}
                                                    className="h-4 w-4 border border-primary rounded"
                                                />
                                                <label htmlFor="incluir_iva" className="text-sm font-medium">I.V.A. (16%)</label>
                                            </div>
                                            <Input
                                                readOnly
                                                value={formatCurrency(formData.incluir_iva ? ((formData.honorarios - formData.descuento) * 0.16) : 0)}
                                                className="text-right font-bold text-red-600 border"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Sub Total</label>
                                            <Input
                                                readOnly
                                                value={formatCurrency(formData.incluir_iva ? ((formData.honorarios - formData.descuento) * 1.16) : (formData.honorarios - formData.descuento))}
                                                className="text-right font-bold text-blue-600 border"
                                            />
                                        </div>
                                    </div>

                                    {/* FILA 3: CHECK RET ISR - CANTIDAD ISR - CHECK RET IVA - CANTIDAD IVA - TOTAL */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <input
                                                    id="ret_isr_check"
                                                    type="checkbox"
                                                    checked={ret_isr_check}
                                                    onChange={(e) => setRetISRCheck(e.target.checked)}
                                                    className="h-4 w-4 border border-primary rounded"
                                                />
                                                <label htmlFor="ret_isr_check" className="text-sm font-medium">Ret. I.S.R.</label>
                                            </div>
                                            <Input
                                                readOnly
                                                value={ret_isr_check ? formatCurrency(calcularTotales().retISR) : formatCurrency(0)}
                                                className="text-right font-bold text-green-600 border"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <input
                                                    id="ret_iva_check"
                                                    type="checkbox"
                                                    checked={ret_iva_check}
                                                    onChange={(e) => setRetIVACheck(e.target.checked)}
                                                    className="h-4 w-4 border border-primary rounded"
                                                />
                                                <label htmlFor="ret_iva_check" className="text-sm font-medium">Ret. I.V.A.</label>
                                            </div>
                                            <Input
                                                readOnly
                                                value={ret_iva_check && formData.incluir_iva ? formatCurrency(calcularTotales().retIVA) : formatCurrency(0)}
                                                className="text-right font-bold text-green-600 border"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Total Honorarios</label>
                                            <div className="px-3 py-2 border rounded-md text-right font-bold text-yellow-500">
                                                {formatCurrency(calcularTotales().totalPresupuesto)}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECCIÓN: IMPUESTOS Y DERECHOS */}
                                <div className="border rounded-lg p-4 bg-background/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-bold">Impuestos y Derechos</h3>
                                            {isLoadingImpuestos && <Loader2 className="h-4 w-4 animate-spin" />}
                                        </div>
                                        <Button onClick={addImpuestoDerechos} size="sm" variant="outline" disabled={isLoadingImpuestos}>
                                            <Plus className="h-3 w-3 mr-1" /> Agregar Concepto
                                        </Button>
                                    </div>

                                    {formData.impuestos_derechos.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-4">No hay conceptos agregados</p>
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted border-b">
                                                <div className="col-span-5">
                                                    <p className="text-xs font-medium">Concepto</p>
                                                </div>
                                                <div className="col-span-3">
                                                    <p className="text-xs font-medium">Importe</p>
                                                </div>
                                                <div className="col-span-3">
                                                    <p className="text-xs font-medium">Observaciones</p>
                                                </div>
                                                <div className="col-span-1"></div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {formData.impuestos_derechos.map((item) => (
                                                    <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border-b last:border-b-0 bg-background hover:bg-muted/50">
                                                        <div className="col-span-5">
                                                            <Input
                                                                value={item.descripcion}
                                                                placeholder="Concepto"
                                                                readOnly
                                                                className="w-full  text-sm h-8"
                                                            />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <Input
                                                                type="text"
                                                                value={formatCurrency(item.importe)}
                                                                readOnly
                                                                className="text-right text-sm h-8 font-bold text-green-600"
                                                            />
                                                        </div>
                                                        <div className="col-span-3">
                                                            <Input
                                                                value={item.observaciones || ''}
                                                                onChange={(e) => updateImpuestoDerechos(item.id, 'observaciones', e.target.value)}
                                                                placeholder="Observaciones"
                                                                className="w-full text-sm h-8"
                                                            />
                                                        </div>
                                                        <div className="col-span-1 flex items-center justify-center">
                                                            <Button
                                                                onClick={() => removeImpuestoDerechos(item.id)}
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <X className="h-2 w-2" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SECCIÓN: GASTOS NOTARIALES */}
                                <div className="border rounded-lg p-4 bg-background/50">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-bold">Gastos Notariales</h3>
                                        <Button onClick={addGastoNotarial} size="sm" variant="outline">
                                            <Plus className="h-3 w-3 mr-1" /> Agregar Concepto
                                        </Button>
                                    </div>

                                    {formData.gastos_notariales.length === 0 ? (
                                        <p className="text-center text-muted-foreground py-4">No hay conceptos agregados</p>
                                    ) : (
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="grid grid-cols-12 gap-2 px-3 py-2 bg-muted border-b">
                                                <div className="col-span-9">
                                                    <p className="text-xs font-medium">Concepto</p>
                                                </div>
                                                <div className="col-span-2">
                                                    <p className="text-xs font-medium">Importe</p>
                                                </div>
                                                <div className="col-span-1"></div>
                                            </div>
                                            <div className="max-h-64 overflow-y-auto">
                                                {formData.gastos_notariales.map((item) => (
                                                    <div key={item.id} className="grid grid-cols-12 gap-2 p-2 border-b last:border-b-0 bg-background hover:bg-muted/50">
                                                        <div className="col-span-9">
                                                            <Input
                                                                value={item.descripcion}
                                                                onChange={(e) => updateGastoNotarial(item.id, 'descripcion', e.target.value)}
                                                                placeholder="Concepto"
                                                                className="w-full text-sm h-8"
                                                            />
                                                        </div>
                                                        <div className="col-span-2">
                                                            <div className="flex items-center border rounded-md bg-background h-8 px-2">
                                                                <span className="text-sm font-bold text-foreground mr-1">$</span>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    value={item.importe}
                                                                    onChange={(e) => updateGastoNotarial(item.id, 'importe', e.target.value)}
                                                                    placeholder="0.00"
                                                                    className="text-right flex-1 text-sm h-6 border-0 focus-visible:ring-0 p-0 bg-transparent"
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1 flex items-center justify-center">
                                                            <Button
                                                                onClick={() => removeGastoNotarial(item.id)}
                                                                size="sm"
                                                                variant="destructive"
                                                                className="h-6 w-6 p-0"
                                                            >
                                                                <X className="h-2 w-2" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* RESUMEN TOTAL */}
                                {(() => {
                                    const totales = calcularTotales();
                                    return (
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="border rounded-lg p-4 bg-background/50">
                                                <p className="text-sm font-medium text-muted-foreground">Total Gastos Notaría</p>
                                                <p className="text-2xl font-bold text-yellow-500">
                                                    {formatCurrency(totales.totalGastos)}
                                                </p>
                                            </div>
                                            <div className="border rounded-lg p-4 bg-background/50">
                                                <p className="text-sm font-medium text-muted-foreground">Total Impuestos y Derechos</p>
                                                <p className="text-2xl font-bold text-yellow-500">
                                                    {formatCurrency(totales.totalImpuestos)}
                                                </p>
                                            </div>
                                            <div className="border rounded-lg p-4 bg-red-50">
                                                <p className="text-sm font-medium text-muted-foreground">TOTAL PRESUPUESTO</p>
                                                <p className="text-3xl font-bold text-red-600">
                                                    {formatCurrency(totales.totalPresupuesto)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* BOTONES DE ACCIÓN */}
                                <div className="flex gap-2 justify-end pt-6 pb-6 border-t">
                                    {isEditing && (
                                        <>
                                            <Button variant="outline" onClick={handleCancelEdit}>
                                                <X className="h-4 w-4 mr-2" />
                                                Cancelar
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleViewPdf}
                                                disabled={isLoadingPdf || !formData.id}
                                            >
                                                {isLoadingPdf ? (
                                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Eye className="h-4 w-4 mr-2" />
                                                )}
                                                Ver Impresión
                                            </Button>
                                        </>
                                    )}
                                    <Button
                                        onClick={handleAddPresupuesto}
                                        disabled={isSaving}
                                        className="bg-green-600 hover:bg-green-700"
                                    >
                                        {isSaving ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        {isEditing ? 'Actualizar' : 'Guardar'} Presupuesto
                                    </Button>
                                </div>


                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                {/* VISOR DE PDF */}
                {showPdfViewer && pdfUrl && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
                        <div className="bg-white rounded-lg shadow-lg w-[95vw] h-[95vh] flex flex-col">
                            <div className="flex justify-between items-center p-3 border-b bg-gray-50">
                                <h2 className="text-lg font-bold">

                                    Presupuesto Previo</h2>
                                <button
                                    onClick={closePdfViewer}
                                    className="text-gray-500 hover:text-gray-700 text-3xl font-bold"
                                >
                                    ×
                                </button>
                            </div>
                            <div className="flex-1 overflow-hidden">
                                <iframe
                                    src={pdfUrl}
                                    width="100%"
                                    height="100%"
                                    style={{ border: 'none' }}
                                    title="PDF Viewer"
                                />
                            </div>
                            <div className="flex gap-2 justify-end p-3 border-t bg-gray-50">
                                <a
                                    href={pdfUrl}
                                    download={`Presupuesto_Previo_${formData.id}.pdf`}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                                >
                                    Descargar PDF
                                </a>
                                <button
                                    onClick={closePdfViewer}
                                    className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-sm font-medium"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL DE BÚSQUEDA DE CLIENTES */}
            {showClienteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background border rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Búsqueda de Clientes
                            </h2>
                            <button
                                onClick={() => setShowClienteModal(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body - Búsqueda */}
                        <div className="border-b px-6 py-4 space-y-3">
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        value={clienteFiltro}
                                        onChange={(e) => setClienteFiltro(e.target.value)}
                                        placeholder="Buscar por nombre, RFC, CURP..."
                                        className="pr-10"
                                    />
                                    {clienteFiltro && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setClienteFiltro('');
                                                setClienteResultados([]);
                                                setClienteError(null);
                                            }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                                <Button
                                    onClick={() => fetchClientesModal(clienteFiltro)}
                                    disabled={isSearchingClientes}
                                    className="bg-amber-600 hover:bg-amber-700"
                                >
                                    {isSearchingClientes ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Search className="h-4 w-4" />
                                    )}
                                    <span className="ml-2">Buscar</span>
                                </Button>
                            </div>
                            {clienteError && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-red-50 border-red-200 text-red-800 text-sm">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{clienteError}</span>
                                </div>
                            )}
                        </div>

                        {/* Table */}
                        <div className="flex-1 overflow-y-auto px-6 py-4">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 bg-background">
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>RFC</TableHead>
                                        <TableHead>CURP</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead className="w-16 text-center">Seleccionar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isSearchingClientes ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                Buscando clientes...
                                            </TableCell>
                                        </TableRow>
                                    ) : clienteResultados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                                No se encontraron clientes.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        clienteResultados.map((cliente) => (
                                            <TableRow key={cliente.id} className="hover:bg-amber-50">
                                                <TableCell className="font-medium">{cliente.nombre} {cliente.apellido_Paterno} {cliente.apellido_Materno}</TableCell>
                                                <TableCell className="font-mono text-sm">{cliente.rfc}</TableCell>
                                                <TableCell className="font-mono text-sm">{cliente.curp}</TableCell>
                                                <TableCell>{cliente.tipo_Cliente}</TableCell>
                                                <TableCell className="text-center">
                                                    <Button
                                                        onClick={() => handleSelectClienteFromModal(cliente)}
                                                        size="sm"
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        <Plus className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Footer */}
                        <div className="border-t px-6 py-4 flex justify-end gap-2">
                            <Button
                                onClick={() => setShowClienteModal(false)}
                                variant="outline"
                            >
                                Cerrar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

PresupuestoPrevioIndex.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Control Notarial', href: '/admin/control-notarial' },
        { title: 'Expedientes', href: '/admin/control-notarial/expedientes' },
        { title: 'Presupuesto Previo', href: '/admin/control-notarial/expedientes/presupuesto-previo' },
    ]}>
        {page}
    </AppLayout>
);
