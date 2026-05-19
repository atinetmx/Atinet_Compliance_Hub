import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Loader2, X, DollarSign, TrendingUp, Link2, Search, AlertCircle, Eye } from 'lucide-react';
import { useApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { PDFViewerModal } from '../../../Modals';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Presupuesto {
    id?: number;
    numero_Presupuesto: string;
    cliente: string;
    tipo_Compareciente: string;
    operacion: any;
    total_Honorarios: number;
    total_Impuestos_Derechos: number;
    total_Gastos_Notariales: number;
    total_Presupuesto: number;
    validado?: boolean;
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

interface DataPLD {
    descripcion: string;
    usuario?: string;
    clave: 'PENDIENTE' | 'REALIZADO' | 'RECHAZADO';
    fecha_Realizado?: string;
}

interface FormPresupuestoData {
    cliente: string;
    operacion: string;
    zona_municipio: string;
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
    impuestos_derechos: Array<{id: string; descripcion: string; importe: number; observaciones?: string}>;
    gastos_notariales: Array<{id: string; descripcion: string; importe: number}>;
    activo: boolean;
}

interface ReciboData {
    impuestosDerechos: number;
    gastosNotariales: number;
    honorarios: number;
    concepto: string;
    formaPago: string;
    observaciones: string;
    clienteId: number | null;
}

interface FinancieroControlFormProps {
    presupuestos: Presupuesto[];
    cargandoPresupuestos: boolean;
    mostrarFormularioPresupuesto: boolean;
    setMostrarFormularioPresupuesto: (value: boolean) => void;
    formPresupuesto: FormPresupuestoData;
    setFormPresupuesto: (value: FormPresupuestoData) => void;
    operacionFiltro: string;
    setOperacionFiltro: (value: string) => void;
    showOperacionDropdown: boolean;
    setShowOperacionDropdown: (value: boolean) => void;
    ret_isr_check: boolean;
    setRetISRCheck: (value: boolean) => void;
    ret_iva_check: boolean;
    setRetIVACheck: (value: boolean) => void;
    clienteSelectedPresupuesto: any;
    setClienteSelectedPresupuesto: (value: any) => void;
    clienteFiltro: string;
    setClienteFiltro: (value: string) => void;
    showClienteDropdown: boolean;
    setShowClienteDropdown: (value: boolean) => void;
    municipioFiltroPresupuesto: string;
    setMunicipioFiltroPresupuesto: (value: string) => void;
    showMunicipioPresupuestoDropdown: boolean;
    setShowMunicipioPresupuestoDropdown: (value: boolean) => void;
    recibosProvisionales: ReciboProvisor[];
    cargandoRecibos: boolean;
    mostrarFormularioRecibo: boolean;
    setMostrarFormularioRecibo: (value: boolean) => void;
    reciboDetalleSeleccionado: ReciboDetalle | null;
    setReciboDetalleSeleccionado: (value: ReciboDetalle | null) => void;
    cargandoReciboDetalle: boolean;
    reciboData: ReciboData;
    setReciboData: (value: ReciboData) => void;
    datosPLD: DataPLD[];
    cargandoPLD: boolean;
    operacionesDelExpediente: any[];
    municipiosDisponibles: any[];
    filasComparecientes: any[];
    clientesDisponibles: any[];
    formData: any;
    currentExpedienteId: number | null;
    handleGuardarRecibo: () => void;
    handlePagarRecibo: () => void;
    handleCancelarRecibo: () => void;
    handleImprimirRecibo: (reciboId: number) => void;
    fetchPresupuestos: (expedienteId: number) => void;
    fetchReciboDetalle: (reciboId: number) => void;
    showPresupuestoPrevioModal: boolean;
    setShowPresupuestoPrevioModal: (value: boolean) => void;
    presupuestosPrevios: any[];
    filtroPresupuestoPrevio: string;
    setFiltroPresupuestoPrevio: (value: string) => void;
    isSearchingPresupuestoPrevio: boolean;
    errorPresupuestoPrevio: string | null;
    setErrorPresupuestoPrevio: (value: string | null) => void;
    fetchPresupuestosPrevios: (filtro: string) => Promise<void>;
    handleSelectPresupuestoPrevio: (presupuesto: any) => void;
    isLoadingHonorarios: boolean;
    setIsLoadingHonorarios: (value: boolean) => void;
    isLoadingImpuestos: boolean;
    setIsLoadingImpuestos: (value: boolean) => void;
    impuestosCalculados: boolean;
    setImpuestosCalculados: (value: boolean) => void;
    showImpuestosModal: boolean;
    setShowImpuestosModal: (value: boolean) => void;
    impuestosFiltro: string;
    setImpuestosFiltro: (value: string) => void;
    impuestosResultados: any[];
    isSearchingImpuestos: boolean;
    impuestosError: string | null;
    dependenciasUnicas: string[];
    activeDependenciaTab: string;
    setActiveDependenciaTab: (value: string) => void;
    handleCalcularHonorarios: () => Promise<void>;
    handleCalcularImpuestos: () => Promise<void>;
    addImpuestoDerechos: () => void;
    addGastoNotarial: () => void;
    removeImpuestoDerechos: (id: string) => void;
    updateImpuestoDerechos: (id: string, field: 'descripcion' | 'importe' | 'observaciones', value: string | number) => void;
    removeGastoNotarial: (id: string) => void;
    updateGastoNotarial: (id: string, field: 'descripcion' | 'importe', value: string | number) => void;
    calcularTotales: () => any;
    handleSelectImpuesto: (impuesto: any) => void;
    handleGuardarPresupuesto: () => Promise<void>;
    handleObtenerDetallesPresupuesto: (presupuestoId: number) => Promise<void>;
    presupuestoEditandoId: number | null;
    setPresupuestoEditandoId: (value: number | null) => void;
    presupuestoValidado: boolean;
    setPresupuestoValidado: (value: boolean) => void;
    handleValidarPresupuesto: () => Promise<void>;
    handleEliminarPresupuesto: () => Promise<void>;
    isSaving: boolean;
}

export default function FinancieroControlForm({
    presupuestos,
    cargandoPresupuestos,
    mostrarFormularioPresupuesto,
    setMostrarFormularioPresupuesto,
    formPresupuesto,
    setFormPresupuesto,
    operacionFiltro,
    setOperacionFiltro,
    showOperacionDropdown,
    setShowOperacionDropdown,
    ret_isr_check,
    setRetISRCheck,
    ret_iva_check,
    setRetIVACheck,
    clienteSelectedPresupuesto,
    setClienteSelectedPresupuesto,
    clienteFiltro,
    setClienteFiltro,
    showClienteDropdown,
    setShowClienteDropdown,
    municipioFiltroPresupuesto,
    setMunicipioFiltroPresupuesto,
    showMunicipioPresupuestoDropdown,
    setShowMunicipioPresupuestoDropdown,
    recibosProvisionales,
    cargandoRecibos,
    mostrarFormularioRecibo,
    setMostrarFormularioRecibo,
    reciboDetalleSeleccionado,
    setReciboDetalleSeleccionado,
    cargandoReciboDetalle,
    reciboData,
    setReciboData,
    datosPLD,
    cargandoPLD,
    operacionesDelExpediente,
    municipiosDisponibles,
    filasComparecientes,
    clientesDisponibles,
    formData,
    currentExpedienteId,
    handleGuardarRecibo,
    handlePagarRecibo,
    handleCancelarRecibo,
    handleImprimirRecibo,
    fetchPresupuestos,
    fetchReciboDetalle,
    showPresupuestoPrevioModal,
    setShowPresupuestoPrevioModal,
    presupuestosPrevios,
    filtroPresupuestoPrevio,
    setFiltroPresupuestoPrevio,
    isSearchingPresupuestoPrevio,
    errorPresupuestoPrevio,
    setErrorPresupuestoPrevio,
    fetchPresupuestosPrevios,
    handleSelectPresupuestoPrevio,
    isLoadingHonorarios,
    setIsLoadingHonorarios,
    isLoadingImpuestos,
    setIsLoadingImpuestos,
    impuestosCalculados,
    setImpuestosCalculados,
    showImpuestosModal,
    setShowImpuestosModal,
    impuestosFiltro,
    setImpuestosFiltro,
    impuestosResultados,
    isSearchingImpuestos,
    impuestosError,
    dependenciasUnicas,
    activeDependenciaTab,
    setActiveDependenciaTab,
    handleCalcularHonorarios,
    handleCalcularImpuestos,
    addImpuestoDerechos,
    addGastoNotarial,
    removeImpuestoDerechos,
    updateImpuestoDerechos,
    removeGastoNotarial,
    updateGastoNotarial,
    calcularTotales,
    handleSelectImpuesto,
    handleGuardarPresupuesto,
    handleObtenerDetallesPresupuesto,
    presupuestoEditandoId,
    setPresupuestoEditandoId,
    presupuestoValidado,
    setPresupuestoValidado,
    handleValidarPresupuesto,
    handleEliminarPresupuesto,
    isSaving,
}: FinancieroControlFormProps) {
    // Estado para búsqueda en tiempo real de presupuestos previos
    const [filtroPresupuestoPrevioLocal, setFiltroPresupuestoPrevioLocal] = useState('');

    // Estado para visor de PDF de presupuestos generados
    const [pdfUrlPresupuesto, setPdfUrlPresupuesto] = useState<string | null>(null);
    const [showPdfPresupuestoViewer, setShowPdfPresupuestoViewer] = useState(false);
    const [isLoadingPdfPresupuesto, setIsLoadingPdfPresupuesto] = useState(false);

    // Estado para PDF de Orden de Caja
    const [pdfUrlOrdenCaja, setPdfUrlOrdenCaja] = useState<string | null>(null);
    const [showPdfOrdenCajaViewer, setShowPdfOrdenCajaViewer] = useState(false);
    const [isLoadingPdfOrdenCaja, setIsLoadingPdfOrdenCaja] = useState(false);

    // Estado para Orden de Caja
    const [detallesOrdenCaja, setDetallesOrdenCaja] = useState<any>(null);
    const [cargandoOrdenCaja, setCargandoOrdenCaja] = useState(false);
    const [cargoTotal, setCargoTotal] = useState<number>(0);
    const [ordenesCaja, setOrdenesCaja] = useState<any[]>([]);
    const [cargandoOrdenesCaja, setCargandoOrdenesCaja] = useState(false);
    const [ordenCajaSeleccionada, setOrdenCajaSeleccionada] = useState<any>(null);
    const [detallesFormularioCargo, setDetallesFormularioCargo] = useState<any>(null);
    const [cargandoFormularioCargo, setCargandoFormularioCargo] = useState(false);
    const [mostrarFormularioNuevaOrden, setMostrarFormularioNuevaOrden] = useState(false);
    const [detallesNuevaOrden, setDetallesNuevaOrden] = useState<any>(null);
    const [cargandoNuevaOrden, setCargandoNuevaOrden] = useState(false);
    const [importesNuevaOrden, setImportesNuevaOrden] = useState<{ [key: string]: number }>({});
    const [formasPago, setFormasPago] = useState<any[]>([]);
    const [formaPagoSeleccionada, setFormaPagoSeleccionada] = useState<number>(0);
    const [cargandoFormasPago, setCargandoFormasPago] = useState(false);
    const [comparecienteSeleccionado, setComparecienteSeleccionado] = useState<any>(null);
    const [clienteIdSeleccionado, setClienteIdSeleccionado] = useState<number | null>(null);

    // Estado local para cargar recibo desde orden activa
    const [cargandoReciboDesdeOrdenActiva, setCargandoReciboDesdeOrdenActiva] = useState(false);

    // Servicios
    const api = useApi();
    const { addToast } = useToast();

    // Función para generar y mostrar el recibo del presupuesto
    const handleViewPdfPresupuesto = async (presupuestoId: number) => {
        try {
            setIsLoadingPdfPresupuesto(true);
            const { blob } = await api.getBlob(`/Presupuestos/GenerateReciboPresupuesto?presupuestoId=${presupuestoId}`);

            if (!blob) {
                throw new Error('Error al obtener el PDF');
            }

            const url = URL.createObjectURL(blob);
            setPdfUrlPresupuesto(url);
            setShowPdfPresupuestoViewer(true);
            addToast('PDF cargado correctamente', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al generar el PDF';
            addToast(message, 'error');
            console.error('Error:', error);
        } finally {
            setIsLoadingPdfPresupuesto(false);
        }
    };

    const closePdfPresupuestoViewer = () => {
        setShowPdfPresupuestoViewer(false);
        if (pdfUrlPresupuesto) {
            URL.revokeObjectURL(pdfUrlPresupuesto);
            setPdfUrlPresupuesto(null);
        }
    };

    // Función para generar y mostrar el PDF de Orden de Caja
    const handleGenerarPdfOrdenCaja = async (ordenCajaId: number) => {
        try {
            setIsLoadingPdfOrdenCaja(true);
            const { blob } = await api.getBlob(`/OrdenCaja/GenerarOrdenCaja?ordenCajaId=${ordenCajaId}`);

            if (!blob) {
                throw new Error('Error al obtener el PDF');
            }

            const url = URL.createObjectURL(blob);
            setPdfUrlOrdenCaja(url);
            setShowPdfOrdenCajaViewer(true);
            addToast('Orden de caja generada correctamente', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al generar la orden de caja';
            addToast(message, 'error');
            console.error('Error:', error);
        } finally {
            setIsLoadingPdfOrdenCaja(false);
        }
    };

    const closePdfOrdenCajaViewer = () => {
        setShowPdfOrdenCajaViewer(false);
        if (pdfUrlOrdenCaja) {
            URL.revokeObjectURL(pdfUrlOrdenCaja);
            setPdfUrlOrdenCaja(null);
        }
    };

    // Función para cargar detalles de Orden de Caja
    const fetchDetallesOrdenCaja = async () => {
        if (!currentExpedienteId) return;

        try {
            setCargandoOrdenCaja(true);
            const response = await api.get(`/OrdenCaja/GetDetallesOrdenCajaXExpediente?expedienteId=${currentExpedienteId}`);

            if (response.operationStatus === 'Success') {
                setDetallesOrdenCaja(response.dataResponse);
                addToast(response.message, 'success');
            } else if (response.operationStatus === 'Information') {
                setDetallesOrdenCaja(response.dataResponse);
                addToast(response.message, 'warning');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cargar orden de caja';
            addToast(message, 'error');
            console.error('Error:', error);
        } finally {
            setCargandoOrdenCaja(false);
        }
    };

    // Función para cargar órdenes de caja
    const fetchOrdenesCaja = async () => {
        if (!currentExpedienteId) return;

        try {
            setCargandoOrdenesCaja(true);
            const response = await api.get(`/OrdenCaja/GetOrdenesCajaExpediente?expedienteId=${currentExpedienteId}`);

            if (response.operationStatus === 'Success') {
                setOrdenesCaja(response.dataResponse || []);
                addToast(response.message, 'success', 500);
            } else if (response.operationStatus === 'Information') {
                setOrdenesCaja(response.dataResponse || []);
                addToast(response.message, 'warning');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cargar órdenes de caja';
            addToast(message, 'error');
            console.error('Error:', error);
        } finally {
            setCargandoOrdenesCaja(false);
        }
    };

    // Obtener detalles de una orden de caja por ID
    const fetchDetallesOrdenCajaXId = async (ordenCajaId: number) => {
        if (!ordenCajaId) return;

        try {
            setCargandoOrdenCaja(true);
            const response = await api.get(`/OrdenCaja/GetDetallesOrdenCajaXId?ordenCajaId=${ordenCajaId}`);

            if (response.operationStatus === 'Success') {
                setDetallesOrdenCaja(response.dataResponse || null);
                setCargoTotal(0);
                addToast(response.message, 'success', 500);
            } else if (response.operationStatus === 'Information') {
                setDetallesOrdenCaja(response.dataResponse || null);
                setCargoTotal(0);
                addToast(response.message, 'warning');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cargar detalles de orden';
            addToast(message, 'error');
            console.error('Error:', error);
        } finally {
            setCargandoOrdenCaja(false);
        }
    };

    // Obtener detalles del expediente para el formulario de crear cargo
    const fetchDetallesFormularioCargo = async () => {
        if (!currentExpedienteId) return;

        try {
            setCargandoFormularioCargo(true);
            const response = await api.get(`/OrdenCaja/GetDetallesOrdenCajaXExpediente?expedienteId=${currentExpedienteId}`);

            if (response.operationStatus === 'Success') {
                setDetallesFormularioCargo(response.dataResponse || null);
                addToast(response.message, 'success');
            } else if (response.operationStatus === 'Information') {
                setDetallesFormularioCargo(response.dataResponse || null);
                addToast(response.message, 'warning');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cargar detalles del formulario';
            addToast(message, 'error');
            console.error('Error:', error);
        } finally {
            setCargandoFormularioCargo(false);
        }
    };

    // Cargar detalles para crear una nueva orden
    const handleNuevaOrden = async () => {
        if (!currentExpedienteId) return;

        try {
            setCargandoNuevaOrden(true);
            setCargandoFormasPago(true);
            setMostrarFormularioNuevaOrden(true);

            // Pre-llenar cliente con el primero de la lista (si existe)
            if (formData?.clientes && formData.clientes.length > 0) {
                setClienteIdSeleccionado(formData.clientes[0].cliente_Id);
            }

            // Cargar detalles y formas de pago en paralelo
            const [detallesResponse, formasPagoResponse] = await Promise.all([
                api.get(`/OrdenCaja/GetDetallesOrdenCajaXExpediente?expedienteId=${currentExpedienteId}`),
                api.get(`/Catalogos/GetFormasPago`)
            ]);

            if (detallesResponse.operationStatus === 'Success') {
                setDetallesNuevaOrden(detallesResponse.dataResponse || null);
                setImportesNuevaOrden({});
                setFormaPagoSeleccionada(0);
                addToast(detallesResponse.message, 'success');
            } else if (detallesResponse.operationStatus === 'Information') {
                setDetallesNuevaOrden(detallesResponse.dataResponse || null);
                setImportesNuevaOrden({});
                setFormaPagoSeleccionada(0);
                addToast(detallesResponse.message, 'warning');
            } else {
                throw new Error(detallesResponse.message);
            }

            if (formasPagoResponse.operationStatus === 'Success') {
                setFormasPago(formasPagoResponse.dataResponse || []);
                // Seleccionar primera forma de pago por defecto
                if (formasPagoResponse.dataResponse?.length > 0) {
                    setFormaPagoSeleccionada(formasPagoResponse.dataResponse[0].id);
                }
                addToast(formasPagoResponse.message, 'success', 500);
            } else if (formasPagoResponse.operationStatus === 'Information') {
                setFormasPago(formasPagoResponse.dataResponse || []);
                if (formasPagoResponse.dataResponse?.length > 0) {
                    setFormaPagoSeleccionada(formasPagoResponse.dataResponse[0].id);
                }
                addToast(formasPagoResponse.message, 'warning');
            } else {
                throw new Error(formasPagoResponse.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al cargar datos de nueva orden';
            addToast(message, 'error');
            console.error('Error:', error);
            setMostrarFormularioNuevaOrden(false);
        } finally {
            setCargandoNuevaOrden(false);
            setCargandoFormasPago(false);
        }
    };

    // Seleccionar una orden y cargar sus detalles
    const handleSelectOrdenCaja = (orden: any) => {
        setOrdenCajaSeleccionada(orden);
        fetchDetallesOrdenCajaXId(orden.id);
    };

    // Cargar órdenes de caja al cambiar el expediente
    React.useEffect(() => {
        if (currentExpedienteId) {
            fetchOrdenesCaja();
            setOrdenCajaSeleccionada(null);
            setDetallesOrdenCaja(null);
        }
    }, [currentExpedienteId]);

    // Cargar detalles del formulario de cargo cuando se va a mostrar
    React.useEffect(() => {
        const debesMostrarFormularioCargo = !detallesOrdenCaja && !ordenesCaja.some(orden => orden.clave?.toUpperCase() === 'PENDIENTE');

        if (debesMostrarFormularioCargo && !detallesFormularioCargo && currentExpedienteId) {
            fetchDetallesFormularioCargo();
        }
    }, [detallesOrdenCaja, ordenesCaja, currentExpedienteId]);

    // Generar recibo desde orden activa
    const handleGenerarReciboDesdeOrdenActiva = async () => {
        if (!currentExpedienteId) return;

        try {
            setCargandoReciboDesdeOrdenActiva(true);
            const response = await api.get(`/OrdenCaja/GetDetallesOrdenCajaActiva?expedienteId=${currentExpedienteId}`);

            if (response.operationStatus === 'Success') {
                if (response.dataResponse) {
                    const datos = response.dataResponse;

                    // Extraer datos de HONORARIOS
                    const honorariosData = {
                    concepto: 'HONORARIOS',
                    presupuesto: datos.honorarios?.presupuesto_Honorarios || 0,
                    total: datos.honorarios?.presupuesto_Honorarios || 0,
                    importeOrdenActual: datos.honorarios?.importe_Orden_Actual || 0,
                    abono: datos.honorarios?.abono_Completo_Honorarios || 0,
                    saldo: datos.honorarios?.abono_Pendiente_Honorarios || 0
                };

                // Extraer datos de IVA
                const ivaData = {
                    concepto: 'IVA',
                    presupuesto: datos.honorarios?.presupuesto_IVA || 0,
                    total: datos.honorarios?.presupuesto_IVA || 0,
                    importeOrdenActual: datos.honorarios?.importe_Orden_Actual_IVA || 0,
                    abono: datos.honorarios?.abono_Completo_IVA || 0,
                    saldo: datos.honorarios?.abono_Pendiente_IVA || 0
                };

                // Extraer datos de GASTOS NOTARIALES
                const gastosData = {
                    concepto: 'GASTOS NOTARIALES',
                    presupuesto: datos.gastos_Notariales?.total_Presupuesto || 0,
                    total: datos.gastos_Notariales?.total_Presupuesto || 0,
                    importeOrdenActual: datos.gastos_Notariales?.importe_Orden_Actual || 0,
                    abono: datos.gastos_Notariales?.abono_Completo || 0,
                    saldo: datos.gastos_Notariales?.abono_Pendiente || 0
                };

                // Extraer datos de IMPUESTOS Y DERECHOS
                const impuestosDetalles = datos.impuestos_Derechos?.lista?.map((item: any) => ({
                    concepto: item.descripcion || 'Impuesto/Derecho',
                    presupuesto: item.importe || 0,
                    total: item.importe || 0,
                    importeOrdenActual: item.importe_Orden_Actual || 0,
                    abono: item.abono_Completo || 0,
                    saldo: item.abono_Pendiente || 0
                })) || [];

                // Calcular totales
                const totalHonorarios = (honorariosData.importeOrdenActual || 0) + (ivaData.importeOrdenActual || 0);
                const totalImpuestosDerechos = impuestosDetalles.reduce((sum: number, item: any) => sum + (item.importeOrdenActual || 0), 0);
                const totalGastos = gastosData.importeOrdenActual || 0;
                const granTotal = totalHonorarios + totalImpuestosDerechos + totalGastos;

                setReciboData({
                    // Datos del desglose
                    desglose: {
                        honorarios: datos.desglose?.honorarios || 0,
                        iva: datos.desglose?.iva || 0,
                        total_Honorarios_IVA: datos.desglose?.total_Honorarios_IVA || 0,
                        gastos_Notariales: datos.desglose?.gastos_Notariales || 0,
                        impuestos_Derechos: datos.desglose?.impuestos_Derechos || 0,
                        total_Orden: datos.desglose?.total_Orden || 0
                    },

                    // Datos agrupados por sección
                    honorariosData: honorariosData,
                    ivaData: ivaData,
                    gastosData: gastosData,
                    impuestosDerechosDetalle: impuestosDetalles,

                    // Totales
                    totalHonorarios: totalHonorarios,
                    totalGastos: totalGastos,
                    totalImpuestosDerechos: totalImpuestosDerechos,
                    granTotal: granTotal,

                    // Datos del recibo
                    concepto: '',
                    formaPago: datos.forma_Pago?.nombre || '',
                    observaciones: '',
                    clienteId: datos.cliente?.id || null,
                    clienteNombre: datos.cliente?.nombre || '',
                    ordenActiva: true,
                    formaPayId: datos.forma_Pago?.id || null,

                    // Datos de expediente, notario y otros
                    expediente: datos.expediente?.expediente || '',
                    escritura: datos.expediente?.escritura || '',
                    notario: datos.notario?.nombre || ''
                } as any);
                    setMostrarFormularioRecibo(true);
                    setReciboDetalleSeleccionado(null);
                } else {
                    addToast(response.message, 'success');
                }
            } else if (response.operationStatus === 'Information') {
                if (response.dataResponse) {
                    const datos = response.dataResponse;
                    const honorariosData = {
                        concepto: 'HONORARIOS',
                        presupuesto: datos.honorarios?.presupuesto_Honorarios || 0,
                        total: datos.honorarios?.presupuesto_Honorarios || 0,
                        importeOrdenActual: datos.honorarios?.importe_Orden_Actual || 0,
                        abono: datos.honorarios?.abono_Completo_Honorarios || 0,
                        saldo: datos.honorarios?.abono_Pendiente_Honorarios || 0
                    };
                    const ivaData = {
                        concepto: 'IVA',
                        presupuesto: datos.honorarios?.presupuesto_IVA || 0,
                        total: datos.honorarios?.presupuesto_IVA || 0,
                        importeOrdenActual: datos.honorarios?.importe_Orden_Actual_IVA || 0,
                        abono: datos.honorarios?.abono_Completo_IVA || 0,
                        saldo: datos.honorarios?.abono_Pendiente_IVA || 0
                    };
                    const gastosData = {
                        concepto: 'GASTOS NOTARIALES',
                        presupuesto: datos.gastos_Notariales?.total_Presupuesto || 0,
                        total: datos.gastos_Notariales?.total_Presupuesto || 0,
                        importeOrdenActual: datos.gastos_Notariales?.importe_Orden_Actual || 0,
                        abono: datos.gastos_Notariales?.abono_Completo || 0,
                        saldo: datos.gastos_Notariales?.abono_Pendiente || 0
                    };
                    const impuestosDetalles = datos.impuestos_Derechos?.lista?.map((item: any) => ({
                        concepto: item.descripcion || 'Impuesto/Derecho',
                        presupuesto: item.importe || 0,
                        total: item.importe || 0,
                        importeOrdenActual: item.importe_Orden_Actual || 0,
                        abono: item.abono_Completo || 0,
                        saldo: item.abono_Pendiente || 0
                    })) || [];
                    const totalHonorarios = (honorariosData.importeOrdenActual || 0) + (ivaData.importeOrdenActual || 0);
                    const totalImpuestosDerechos = impuestosDetalles.reduce((sum: number, item: any) => sum + (item.importeOrdenActual || 0), 0);
                    const totalGastos = gastosData.importeOrdenActual || 0;
                    const granTotal = totalHonorarios + totalImpuestosDerechos + totalGastos;
                    setReciboData({
                        desglose: {
                            honorarios: datos.desglose?.honorarios || 0,
                            iva: datos.desglose?.iva || 0,
                            total_Honorarios_IVA: datos.desglose?.total_Honorarios_IVA || 0,
                            gastos_Notariales: datos.desglose?.gastos_Notariales || 0,
                            impuestos_Derechos: datos.desglose?.impuestos_Derechos || 0,
                            total_Orden: datos.desglose?.total_Orden || 0
                        },
                        honorariosData: honorariosData,
                        ivaData: ivaData,
                        gastosData: gastosData,
                        impuestosDerechosDetalle: impuestosDetalles,
                        totalHonorarios: totalHonorarios,
                        totalGastos: totalGastos,
                        totalImpuestosDerechos: totalImpuestosDerechos,
                        granTotal: granTotal,
                        concepto: '',
                        formaPago: datos.forma_Pago?.nombre || '',
                        observaciones: '',
                        clienteId: datos.cliente?.id || null,
                        clienteNombre: datos.cliente?.nombre || '',
                        ordenActiva: true,
                        formaPayId: datos.forma_Pago?.id || null,
                        expediente: datos.expediente?.expediente || '',
                        escritura: datos.expediente?.escritura || '',
                        notario: datos.notario?.nombre || ''
                    } as any);
                    setMostrarFormularioRecibo(true);
                    setReciboDetalleSeleccionado(null);
                }
                addToast(response.message, 'warning');
            } else {
                throw new Error(response.message);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al obtener la orden activa';
            addToast(message, 'error');
            console.error('Error:', error);
        } finally {
            setCargandoReciboDesdeOrdenActiva(false);
        }
    };

    return (
        <Tabs defaultValue="presupuesto" className="w-full">
            <TabsList className="grid w-full grid-cols-7 gap-1 bg-slate-100 dark:bg-slate-800 mb-4 p-1">
                <TabsTrigger value="presupuesto" className="text-xs">Presupuesto</TabsTrigger>
                <TabsTrigger value="orden-de-caja" className="text-xs">Orden de Caja</TabsTrigger>
                <TabsTrigger value="recibos" className="text-xs">Recibos</TabsTrigger>
                <TabsTrigger value="estado-cuenta" className="text-xs">Estado Cuenta</TabsTrigger>
                <TabsTrigger value="pld" className="text-xs">PLD</TabsTrigger>
                <TabsTrigger value="operaciones-lavado" className="text-xs">Op. Lavado</TabsTrigger>
                <TabsTrigger value="exportaciones" className="text-xs">Exportaciones</TabsTrigger>
            </TabsList>

            {/* SubTab: Presupuesto */}
            <TabsContent value="presupuesto" className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-md mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-purple-900 dark:text-purple-100 mb-0">Presupuestos Generados</h3>
                    <Button
                        size="sm"
                        className="bg-purple-600 hover:bg-purple-700"
                        onClick={() => {
                            setMostrarFormularioPresupuesto(true);
                            setPresupuestoValidado(false);
                            setPresupuestoEditandoId(null);
                            setClienteSelectedPresupuesto(null);
                            setClienteFiltro('');
                            setOperacionFiltro('');
                            setRetISRCheck(false);
                            setRetIVACheck(false);
                            setFormPresupuesto({
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
                                impuestos_derechos: [],
                                gastos_notariales: [],
                                activo: true,
                            });
                        }}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Generar Presupuesto
                    </Button>
                </div>

                {cargandoPresupuestos && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Cargando presupuestos...</span>
                    </div>
                )}

                {!cargandoPresupuestos && presupuestos.length === 0 && (
                    <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground text-center py-8">No hay presupuestos registrados para este expediente.</p>
                    </div>
                )}

                {!cargandoPresupuestos && presupuestos.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-200 dark:bg-slate-700 border-b">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold">Nº Presupuesto</th>
                                        <th className="px-4 py-2 text-left font-semibold">Tipo Compareciente</th>
                                        <th className="px-4 py-2 text-left font-semibold">Cliente</th>
                                        <th className="px-4 py-2 text-left font-semibold">Operación</th>
                                        <th className="px-4 py-2 text-right font-semibold">Honorarios</th>
                                        <th className="px-4 py-2 text-right font-semibold">Impuestos/Derechos</th>
                                        <th className="px-4 py-2 text-right font-semibold">Gastos Notariales</th>
                                        <th className="px-4 py-2 text-right font-semibold">Total Presupuesto</th>
                                        <th className="px-4 py-2 text-center font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {presupuestos.map((presupuesto, idx) => (
                                        <tr
                                            key={idx}
                                            onClick={() => presupuesto.id && handleObtenerDetallesPresupuesto(presupuesto.id)}
                                            className="border-b hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors cursor-pointer"
                                        >
                                            <td className="px-4 py-2 font-semibold text-purple-600 dark:text-purple-400">{presupuesto.numero_Presupuesto}</td>
                                            <td className="px-4 py-2 text-xs">{presupuesto.tipo_Compareciente}</td>
                                            <td className="px-4 py-2">{presupuesto.cliente}</td>
                                            <td className="px-4 py-2 text-xs">
                                                {(() => {
                                                    if (typeof presupuesto.operacion === 'string') {
                                                        return presupuesto.operacion;
                                                    }
                                                    // Si es un número, buscar en operacionesDelExpediente
                                                    if (typeof presupuesto.operacion === 'number' || (typeof presupuesto.operacion === 'object' && presupuesto.operacion?.id)) {
                                                        const opId = typeof presupuesto.operacion === 'number' ? presupuesto.operacion : presupuesto.operacion?.id;
                                                        const operacionEncontrada = operacionesDelExpediente.find((op: any) => op.id === opId);
                                                        return operacionEncontrada?.descripcion || 'N/A';
                                                    }
                                                    return 'N/A';
                                                })()}
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                                                ${(presupuesto.total_Honorarios || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                                                ${(presupuesto.total_Impuestos_Derechos || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                                                ${(presupuesto.total_Gastos_Notariales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2 text-right font-semibold text-green-600 dark:text-green-400">
                                                ${(presupuesto.total_Presupuesto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </td>
                                            <td className="px-4 py-2 text-center">
                                                {presupuesto.validado && presupuesto.id && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleViewPdfPresupuesto(presupuesto.id!);
                                                        }}
                                                        disabled={isLoadingPdfPresupuesto}
                                                        className="border-2 border-blue-400 text-blue-700 hover:bg-blue-50 font-semibold shadow-md hover:shadow-lg transition-all"
                                                    >
                                                        {isLoadingPdfPresupuesto ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 mr-1" />
                                                        )}
                                                        Imprimir
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Formulario para Nuevo Presupuesto */}
                {mostrarFormularioPresupuesto && (
                    <div className="space-y-6">
                        {/* BOTÓN LIGAR PRESUPUESTO */}
                        <div className="flex justify-end">
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                onClick={() => {
                                    setShowPresupuestoPrevioModal(true);
                                    setFiltroPresupuestoPrevio('');
                                    setFiltroPresupuestoPrevioLocal('');
                                    setErrorPresupuestoPrevio(null);
                                    fetchPresupuestosPrevios('');
                                }}
                            >
                                <Link2 className="h-4 w-4 mr-2" />
                                Ligar Presupuesto
                            </Button>
                        </div>

                        {/* SECCIÓN SUPERIOR: DOS COLUMNAS */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* COLUMNA 1: DATOS DEL PRESUPUESTO */}
                            <div className="border-2 border-blue-200 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow space-y-4 col-span-2">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-blue-600 text-white p-3 rounded-lg">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Datos del presupuesto</h3>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Cliente</label>
                                        <select
                                            value={formPresupuesto.cliente}
                                            onChange={(e) => setFormPresupuesto({...formPresupuesto, cliente: e.target.value})}
                                            disabled={presupuestoValidado}
                                            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900/50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Selecciona un cliente</option>
                                            {filasComparecientes.map(comp => {
                                                const cliente = clientesDisponibles.find(c => c.id === comp.cliente_Id);
                                                return cliente ? (
                                                    <option key={cliente.id} value={cliente.id}>
                                                        {cliente.nombre} {cliente.apellido_Paterno}
                                                    </option>
                                                ) : null;
                                            })}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Operación</label>
                                        <select
                                            value={formPresupuesto.operacion}
                                            onChange={(e) => setFormPresupuesto({...formPresupuesto, operacion: e.target.value})}
                                            disabled={presupuestoValidado}
                                            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900/50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Selecciona una operación</option>
                                            {operacionesDelExpediente.map(op => (
                                                <option key={op.id} value={op.id}>
                                                    {op.descripcion}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Zona o Municipio</label>
                                        <select
                                            value={formPresupuesto.zona_municipio}
                                            onChange={(e) => setFormPresupuesto({...formPresupuesto, zona_municipio: e.target.value})}
                                            disabled={presupuestoValidado}
                                            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900/50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        >
                                            <option value="">Selecciona zona o municipio</option>
                                            {municipiosDisponibles.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.descripcion}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Observaciones</label>
                                        <textarea
                                            value={formPresupuesto.parametro}
                                            onChange={(e) => setFormPresupuesto({...formPresupuesto, parametro: e.target.value})}
                                            placeholder="Observaciones adicionales"
                                            rows={2}
                                            disabled={presupuestoValidado}
                                            className="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900/50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* COLUMNA 2: VALORES DE LA OPERACIÓN */}
                            <div className="border-2 border-green-200 rounded-lg p-5 bg-gradient-to-br from-green-50 to-white shadow-sm hover:shadow-md transition-shadow space-y-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-green-600 text-white p-3 rounded-lg">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Valores</h3>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Valor Operación</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formPresupuesto.valor_operacion}
                                            onChange={(e) => setFormPresupuesto({...formPresupuesto, valor_operacion: parseFloat(e.target.value) || 0})}
                                            placeholder="0.00"
                                            readOnly={presupuestoValidado}
                                            className="text-right font-bold text-green-600 bg-white dark:bg-slate-900/50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Valor Avalúo</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formPresupuesto.valor_avaluo}
                                            onChange={(e) => setFormPresupuesto({...formPresupuesto, valor_avaluo: parseFloat(e.target.value) || 0})}
                                            placeholder="0.00"
                                            readOnly={presupuestoValidado}
                                            className="text-right font-bold text-green-600 bg-white dark:bg-slate-900/50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium">Valor Catastral</label>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={formPresupuesto.valor_catastral}
                                            onChange={(e) => setFormPresupuesto({...formPresupuesto, valor_catastral: parseFloat(e.target.value) || 0})}
                                            placeholder="0.00"
                                            readOnly={presupuestoValidado}
                                            className="text-right font-bold text-green-600 bg-white dark:bg-slate-900/50 disabled:bg-gray-200 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN MEDIA: HONORARIOS */}
                        <div className="border-2 border-amber-200 rounded-lg p-5 bg-gradient-to-br from-amber-50 to-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-amber-600 text-white p-3 rounded-lg">
                                        <DollarSign className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Detalles Honorarios</h3>
                                </div>
                                <Button
                                    onClick={handleCalcularHonorarios}
                                    size="sm"
                                    disabled={isLoadingHonorarios || presupuestoValidado}
                                    className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoadingHonorarios ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                                    Calcular
                                </Button>
                            </div>

                            {/* FILA 1: HONORARIOS - DESCUENTO - SUBTOTAL */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Honorarios</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formPresupuesto.honorarios}
                                        onChange={(e) => setFormPresupuesto({...formPresupuesto, honorarios: parseFloat(e.target.value) || 0})}
                                        readOnly={presupuestoValidado}
                                        className="text-right font-bold border-0 rounded-none bg-white dark:bg-slate-900/50 read-only:bg-gray-200 read-only:cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Descuento</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={formPresupuesto.descuento}
                                        onChange={(e) => setFormPresupuesto({...formPresupuesto, descuento: parseFloat(e.target.value) || 0})}
                                        readOnly={presupuestoValidado}
                                        className="text-right font-bold border-0 rounded-none bg-white dark:bg-slate-900/50 read-only:bg-gray-200 read-only:cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Subtotal Honorarios</label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={(formPresupuesto.honorarios - formPresupuesto.descuento).toFixed(2)}
                                        readOnly
                                        className="text-right font-bold text-green-600 border-0 rounded-none bg-white dark:bg-slate-900/50"
                                    />
                                </div>
                            </div>

                            {/* FILA 2: CHECK IVA - VALOR IVA - SUBTOTAL IVA */}
                            <div className="grid grid-cols-3 gap-4 mb-4">
                                <div></div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {/* @ts-ignore */}
                                        <input
                                            id="incluir_iva"
                                            type="checkbox"
                                            checked={formPresupuesto.incluir_iva}
                                            onChange={(e) => setFormPresupuesto({...formPresupuesto, incluir_iva: e.target.checked})}
                                            disabled={presupuestoValidado}
                                            className="h-4 w-4 border border-primary rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <label htmlFor="incluir_iva" className="text-sm font-medium">I.V.A. (16%)</label>
                                    </div>
                                    <Input
                                        readOnly
                                        value={(formPresupuesto.incluir_iva ? ((formPresupuesto.honorarios - formPresupuesto.descuento) * 0.16) : 0).toFixed(2)}
                                        className="text-right font-bold text-red-600 border bg-white dark:bg-slate-900/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Sub Total</label>
                                    <Input
                                        readOnly
                                        value={(formPresupuesto.incluir_iva ? ((formPresupuesto.honorarios - formPresupuesto.descuento) * 1.16) : (formPresupuesto.honorarios - formPresupuesto.descuento)).toFixed(2)}
                                        className="text-right font-bold text-blue-600 border bg-white dark:bg-slate-900/50"
                                    />
                                </div>
                            </div>

                            {/* FILA 3: CHECK RET ISR - CANTIDAD ISR - CHECK RET IVA - CANTIDAD IVA - TOTAL */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {/* @ts-ignore */}
                                        <input
                                            id="ret_isr_check"
                                            type="checkbox"
                                            checked={ret_isr_check}
                                            onChange={(e) => setRetISRCheck(e.target.checked)}
                                            disabled={presupuestoValidado}
                                            className="h-4 w-4 border border-primary rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <label htmlFor="ret_isr_check" className="text-sm font-medium">Ret. I.S.R.</label>
                                    </div>
                                    <Input
                                        readOnly
                                        value={ret_isr_check ? ((formPresupuesto.honorarios - formPresupuesto.descuento) * 0.10).toFixed(2) : '0.00'}
                                        className="text-right font-bold text-green-600 border bg-white dark:bg-slate-900/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        {/* @ts-ignore */}
                                        <input
                                            id="ret_iva_check"
                                            type="checkbox"
                                            checked={ret_iva_check}
                                            onChange={(e) => setRetIVACheck(e.target.checked)}
                                            disabled={presupuestoValidado}
                                            className="h-4 w-4 border border-primary rounded disabled:opacity-50 disabled:cursor-not-allowed"
                                        />
                                        <label htmlFor="ret_iva_check" className="text-sm font-medium">Ret. I.V.A.</label>
                                    </div>
                                    <Input
                                        readOnly
                                        value={ret_iva_check && formPresupuesto.incluir_iva ? (((formPresupuesto.honorarios - formPresupuesto.descuento) * 0.16) * 0.50).toFixed(2) : '0.00'}
                                        className="text-right font-bold text-green-600 border bg-white dark:bg-slate-900/50"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium">Total Honorarios</label>
                                    <div className="px-3 py-2 border rounded-md text-right font-bold text-yellow-500 bg-white dark:bg-slate-900/50">
                                        {(() => {
                                            let total = formPresupuesto.honorarios - formPresupuesto.descuento;
                                            if (formPresupuesto.incluir_iva) total += total * 0.16;
                                            if (ret_isr_check) total -= (formPresupuesto.honorarios - formPresupuesto.descuento) * 0.10;
                                            if (ret_iva_check && formPresupuesto.incluir_iva) total -= ((formPresupuesto.honorarios - formPresupuesto.descuento) * 0.16) * 0.50;
                                            return total.toFixed(2);
                                        })()}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN: IMPUESTOS Y DERECHOS */}
                        <div className="border-2 border-purple-200 rounded-lg p-5 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-purple-600 text-white p-3 rounded-lg">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Impuestos y Derechos</h3>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={addImpuestoDerechos} size="sm" disabled={isLoadingImpuestos || presupuestoValidado} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        <Plus className="h-3 w-3 mr-1" /> Agregar Trámite
                                    </Button>
                                    <Button onClick={handleCalcularImpuestos} size="sm" disabled={isLoadingImpuestos || presupuestoValidado} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                        {isLoadingImpuestos ? <Loader2 className="h-3 w-3 mr-1 animate-spin" /> : null}
                                        Calcular
                                    </Button>
                                </div>
                            </div>

                            {formPresupuesto.impuestos_derechos.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No hay conceptos agregados</p>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gradient-to-r from-purple-600 to-purple-700 text-white sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                                                    <th className="px-4 py-3 text-right font-semibold w-32">Importe</th>
                                                    <th className="px-4 py-3 text-left font-semibold flex-1">Observaciones</th>
                                                    <th className="px-4 py-3 text-center font-semibold w-12">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formPresupuesto.impuestos_derechos.map((item) => (
                                                    <tr key={item.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                                        <td className="px-4 py-3 text-sm">
                                                            {item.descripcion}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.importe}
                                                                onChange={(e) => updateImpuestoDerechos(item.id, 'importe', e.target.value)}
                                                                readOnly={presupuestoValidado}
                                                                placeholder="0.00"
                                                                className="text-right text-sm h-8 font-bold text-green-600 bg-white dark:bg-slate-900/50 read-only:bg-gray-200 read-only:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <Input
                                                                value={item.observaciones || ''}
                                                                onChange={(e) => updateImpuestoDerechos(item.id, 'observaciones', e.target.value)}
                                                                readOnly={presupuestoValidado}
                                                                placeholder="Observaciones"
                                                                className="w-full text-sm h-8 bg-white dark:bg-slate-900/50 read-only:bg-gray-200 read-only:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button
                                                                onClick={() => removeImpuestoDerechos(item.id)}
                                                                size="sm"
                                                                variant="destructive"
                                                                disabled={presupuestoValidado}
                                                                className="h-6 w-6 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* SECCIÓN: GASTOS NOTARIALES */}
                        <div className="border-2 border-cyan-200 rounded-lg p-5 bg-gradient-to-br from-cyan-50 to-white shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-cyan-600 text-white p-3 rounded-lg">
                                        <Plus className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Gastos Notariales</h3>
                                </div>
                                <Button onClick={addGastoNotarial} size="sm" disabled={presupuestoValidado} className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    <Plus className="h-3 w-3 mr-1" /> Agregar Concepto
                                </Button>
                            </div>

                            {formPresupuesto.gastos_notariales.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No hay conceptos agregados</p>
                            ) : (
                                <div className="border-2 border-cyan-300 rounded-lg overflow-hidden">
                                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gradient-to-r from-cyan-600 to-cyan-700 text-white sticky top-0">
                                                <tr>
                                                    <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                                                    <th className="px-4 py-3 text-right font-semibold w-32">Importe</th>
                                                    <th className="px-4 py-3 text-center font-semibold w-12">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {formPresupuesto.gastos_notariales.map((item) => (
                                                    <tr key={item.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                                        <td className="px-4 py-3">
                                                            <Input
                                                                value={item.descripcion}
                                                                onChange={(e) => updateGastoNotarial(item.id, 'descripcion', e.target.value)}
                                                                readOnly={presupuestoValidado}
                                                                placeholder="Concepto"
                                                                className="w-full text-sm h-8 bg-white dark:bg-slate-900/50 read-only:bg-gray-200 read-only:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                value={item.importe}
                                                                onChange={(e) => updateGastoNotarial(item.id, 'importe', e.target.value)}
                                                                readOnly={presupuestoValidado}
                                                                placeholder="0.00"
                                                                className="text-right text-sm h-8 font-bold text-green-600 bg-white dark:bg-slate-900/50 read-only:bg-gray-200 read-only:cursor-not-allowed"
                                                            />
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button
                                                                onClick={() => removeGastoNotarial(item.id)}
                                                                size="sm"
                                                                variant="destructive"
                                                                disabled={presupuestoValidado}
                                                                className="h-6 w-6 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* RESUMEN TOTAL */}
                        {(() => {
                            const totales = calcularTotales();
                            const formatCurrency = (value: number): string => {
                                return new Intl.NumberFormat('es-MX', {
                                    style: 'currency',
                                    currency: 'MXN',
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                }).format(value);
                            };
                            return (
                                <div className="grid grid-cols-4 gap-4">
                                    <div className="border-2 border-yellow-400 rounded-lg p-5 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg hover:shadow-xl transition-shadow">
                                        <p className="text-xs font-bold text-yellow-800 uppercase tracking-wide">Total Gastos Notariales</p>
                                        <p className="text-2xl font-bold text-yellow-900 mt-2">
                                            {formatCurrency(totales.totalGastos)}
                                        </p>
                                    </div>
                                    <div className="border-2 border-blue-400 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-blue-100 shadow-lg hover:shadow-xl transition-shadow">
                                        <p className="text-xs font-bold text-blue-800 uppercase tracking-wide">Total Impuestos</p>
                                        <p className="text-2xl font-bold text-blue-900 mt-2">
                                            {formatCurrency(totales.totalImpuestos)}
                                        </p>
                                    </div>
                                    <div className="border-2 border-green-400 rounded-lg p-5 bg-gradient-to-br from-green-50 to-green-100 shadow-lg hover:shadow-xl transition-shadow">
                                        <p className="text-xs font-bold text-green-800 uppercase tracking-wide">Total Honorarios</p>
                                        <p className="text-2xl font-bold text-green-900 mt-2">
                                            {formatCurrency(totales.totalHonorarios)}
                                        </p>
                                    </div>
                                    <div className="border-4 border-red-500 rounded-lg p-5 bg-gradient-to-br from-red-50 to-red-100 shadow-xl hover:shadow-2xl transition-shadow">
                                        <p className="text-xs font-bold text-red-900 uppercase tracking-wide">TOTAL PRESUPUESTO</p>
                                        <p className="text-3xl font-bold text-red-700 mt-2">
                                            {formatCurrency(totales.totalPresupuesto)}
                                        </p>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* BOTONES DE ACCIÓN */}
                        <div className="flex gap-3 justify-end pt-6 pb-6 border-t-2 border-gray-200">
                            <Button
                                variant="outline"
                                className="text-sm"
                                onClick={() => {
                                    setMostrarFormularioPresupuesto(false);
                                    setFormPresupuesto({
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
                                        impuestos_derechos: [],
                                        gastos_notariales: [],
                                        activo: true,
                                    });
                                    setOperacionFiltro('');
                                    setClienteFiltro('');
                                    setRetISRCheck(false);
                                    setRetIVACheck(false);
                                    setClienteSelectedPresupuesto(null);
                                }}
                            >
                                Cerrar
                            </Button>

                            {presupuestoEditandoId && currentExpedienteId ? (
                                <>
                                    <Button
                                        onClick={handleValidarPresupuesto}
                                        disabled={isSaving}
                                        className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                {presupuestoValidado ? 'Invalidando...' : 'Validando...'}
                                            </>
                                        ) : (
                                            presupuestoValidado ? 'Invalidar' : 'Validar'
                                        )}
                                    </Button>
                                    <Button
                                        onClick={handleEliminarPresupuesto}
                                        disabled={isSaving || presupuestoValidado}
                                        className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isSaving ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Eliminando...
                                            </>
                                        ) : (
                                            'Eliminar'
                                        )}
                                    </Button>
                                </>
                            ) : null}

                            {!presupuestoValidado && (
                                <Button
                                    onClick={handleGuardarPresupuesto}
                                    disabled={isSaving}
                                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Guardar Presupuesto
                                    </>
                                )}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </TabsContent>

            {/* SubTab: Orden de Caja */}
            <TabsContent value="orden-de-caja" className="space-y-6">
                {/* Tabla de Órdenes de Caja */}
                <div>
                    <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-md mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-0">Órdenes de Caja</h3>
                        <div className="flex gap-2">
                            {!ordenesCaja.some(orden => orden.clave?.toUpperCase() === 'PENDIENTE') && (
                                <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={handleNuevaOrden}
                                    disabled={cargandoNuevaOrden || !currentExpedienteId}
                                >
                                    {cargandoNuevaOrden ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Cargando...
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="h-4 w-4 mr-2" />
                                            Nueva Orden
                                        </>
                                    )}
                                </Button>
                            )}
                            <Button
                                size="sm"
                                className="bg-orange-600 hover:bg-orange-700"
                                onClick={fetchOrdenesCaja}
                                disabled={cargandoOrdenesCaja || !currentExpedienteId}
                            >
                                {cargandoOrdenesCaja ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Cargando...
                                    </>
                                ) : (
                                    'Recargar'
                                )}
                            </Button>
                        </div>
                    </div>

                    {cargandoOrdenesCaja && (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="ml-2 text-sm text-muted-foreground">Cargando órdenes de caja...</span>
                        </div>
                    )}

                    {!cargandoOrdenesCaja && ordenesCaja.length === 0 && (
                        <div className="border rounded-lg p-4">
                            <p className="text-sm text-muted-foreground text-center py-8">No hay órdenes de caja registradas para este expediente.</p>
                        </div>
                    )}

                    {!cargandoOrdenesCaja && ordenesCaja.length > 0 && (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-orange-200 dark:bg-orange-700 border-b">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold">ID</th>
                                            <th className="px-4 py-2 text-left font-semibold">Folio</th>
                                            <th className="px-4 py-2 text-left font-semibold">Forma de Pago</th>
                                            <th className="px-4 py-2 text-right font-semibold">Total</th>
                                            <th className="px-4 py-2 text-center font-semibold">Estatus</th>
                                            <th className="px-4 py-2 text-left font-semibold">Usuario</th>
                                            <th className="px-4 py-2 text-left font-semibold">Fecha Creación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ordenesCaja.map((orden, idx) => {
                                            const getStatusColor = (clave: string) => {
                                                switch (clave?.toUpperCase()) {
                                                    case 'PAGADO':
                                                        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
                                                    case 'PENDIENTE':
                                                        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
                                                    case 'CANCELADO':
                                                        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                                                    default:
                                                        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
                                                }
                                            };

                                            return (
                                                <tr
                                                    key={idx}
                                                    onClick={() => handleSelectOrdenCaja(orden)}
                                                    className={`border-b cursor-pointer transition-colors ${
                                                        ordenCajaSeleccionada?.id === orden.id
                                                            ? 'bg-orange-100 dark:bg-orange-900/50'
                                                            : 'hover:bg-orange-50 dark:hover:bg-orange-900/30'
                                                    }`}
                                                >
                                                    <td className="px-4 py-2 font-semibold text-gray-600 dark:text-gray-400">{orden.id}</td>
                                                    <td className="px-4 py-2 font-semibold text-orange-600 dark:text-orange-400">{orden.folio}</td>
                                                    <td className="px-4 py-2">{orden.nombre}</td>
                                                    <td className="px-4 py-2 text-right font-semibold text-orange-600 dark:text-orange-400">${(orden.total_Orden || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(orden.clave)}`}>
                                                            {orden.clave}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2">{orden.usuario}</td>
                                                    <td className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{orden.fecha_Creacion}</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>

                {/* Divider */}
                {detallesOrdenCaja && <hr className="border-gray-300 dark:border-gray-600" />}

                {/* Detalles de Orden de Caja - Solo mostrar si hay una orden seleccionada */}
                {detallesOrdenCaja && <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Detalles de Orden de Caja</h3>}

                {detallesOrdenCaja && (
                    <div className="bg-orange-50 dark:bg-orange-950/30 p-4 rounded-md mb-4 flex items-center justify-between">
                        <h3 className="font-semibold text-orange-900 dark:text-orange-100 mb-0">Detalles Cargados</h3>
                        <Button
                            size="sm"
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={() => {
                                setOrdenCajaSeleccionada(null);
                                setDetallesOrdenCaja(null);
                            }}
                        >
                            Cerrar
                        </Button>
                    </div>
                )}

                {/* Filtros */}
                {detallesOrdenCaja && (
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        {/* Campo Operación - Solo Lectura */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Operación</label>
                            <Input
                                type="text"
                                readOnly
                                value={detallesOrdenCaja.operacion || ''}
                                className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                placeholder="N/A"
                            />
                        </div>

                        {/* Dropdown Comparecientes - Solo Lectura */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Compareciente</label>
                            <Input
                                type="text"
                                readOnly
                                value={detallesOrdenCaja.cliente || ''}
                                className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                placeholder="N/A"
                            />
                        </div>
                    </div>
                )}

                {detallesOrdenCaja && cargandoOrdenCaja && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Cargando detalles...</span>
                    </div>
                )}

                {detallesOrdenCaja && !cargandoOrdenCaja && (
                    <>
                        {/* TABLA 1: HONORARIOS + IVA */}
                        <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900/50">
                            <div className="overflow-x-auto">
                                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/30 border-b flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-blue-600" />
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">HONORARIOS E IVA</h4>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-blue-600 dark:bg-blue-800 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                                            <th className="px-4 py-3 text-right font-semibold">Monto Total</th>
                                            <th className="px-4 py-3 text-right font-semibold">Abono Completo</th>
                                            <th className="px-4 py-3 text-right font-semibold">Abono Pendiente/Saldo</th>
                                            <th className="px-4 py-3 text-right font-semibold">Importe Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">HONORARIOS</td>
                                            <td className="px-4 py-3 text-right font-semibold text-blue-600">${detallesOrdenCaja.honorarios?.presupuesto_Honorarios?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">${detallesOrdenCaja.honorarios?.abono_Completo_Honorarios?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">${detallesOrdenCaja.honorarios?.abono_Pendiente_Honorarios?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300">${detallesOrdenCaja.honorarios?.importe_Orden_Actual?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">IVA (16%)</td>
                                            <td className="px-4 py-3 text-right font-semibold text-blue-600">${detallesOrdenCaja.honorarios?.presupuesto_IVA?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">${detallesOrdenCaja.honorarios?.abono_Completo_IVA?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">${detallesOrdenCaja.honorarios?.abono_Pendiente_IVA?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-bold text-blue-700 dark:text-blue-300">${detallesOrdenCaja.honorarios?.importe_Orden_Actual_IVA?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                        <tr className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white border-t-4 border-blue-800">
                                            <td className="px-4 py-3 font-bold text-lg">TOTAL</td>
                                            <td className="px-4 py-3 text-right font-bold text-lg">${detallesOrdenCaja.honorarios?.total_Presupuesto?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-bold text-lg">${detallesOrdenCaja.honorarios?.abono_Completo_Total?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-bold text-lg">${detallesOrdenCaja.honorarios?.abono_Pendiente_Total?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-bold text-lg">${(parseFloat(detallesOrdenCaja.honorarios?.importe_Orden_Actual || 0) + parseFloat(detallesOrdenCaja.honorarios?.importe_Orden_Actual_IVA || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* TABLA 3: GASTOS NOTARIALES */}
                        <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900/50">
                            <div className="overflow-x-auto">
                                <div className="px-4 py-3 bg-green-50 dark:bg-green-900/30 border-b flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">GASTOS NOTARIALES</h4>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-green-600 dark:bg-green-800 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                                            <th className="px-4 py-3 text-right font-semibold">Monto Total</th>
                                            <th className="px-4 py-3 text-right font-semibold">Abono Completo</th>
                                            <th className="px-4 py-3 text-right font-semibold">Abono Pendiente/Saldo</th>
                                            <th className="px-4 py-3 text-right font-semibold">Importe Actual</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                                            <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">GASTOS NOTARIALES</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600">${detallesOrdenCaja.gastos_Notariales?.total_Presupuesto?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">${detallesOrdenCaja.gastos_Notariales?.abono_Completo?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">${detallesOrdenCaja.gastos_Notariales?.abono_Pendiente?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-3 text-right font-bold text-green-700 dark:text-green-300">${detallesOrdenCaja.gastos_Notariales?.importe_Orden_Actual?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* TABLA 4: IMPUESTOS Y DERECHOS */}
                        {detallesOrdenCaja.impuestos_Derechos?.lista && detallesOrdenCaja.impuestos_Derechos.lista.length > 0 && (
                            <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900/50">
                                <div className="overflow-x-auto">
                                    <div className="px-4 py-3 bg-purple-50 dark:bg-purple-900/30 border-b flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">IMPUESTOS Y DERECHOS</h4>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-purple-600 dark:bg-purple-800 text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">Descripción</th>
                                                <th className="px-4 py-3 text-right font-semibold">Monto Total</th>
                                                <th className="px-4 py-3 text-right font-semibold">Abono Completo</th>
                                                <th className="px-4 py-3 text-right font-semibold">Abono Pendiente/Saldo</th>
                                                <th className="px-4 py-3 text-right font-semibold">Importe Actual</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detallesOrdenCaja.impuestos_Derechos.lista.map((impuesto: any, idx: number) => (
                                                <tr key={idx} className="border-b hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors">
                                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{impuesto.descripcion}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-purple-600">${impuesto.importe?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">${impuesto.abono_Completo?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className={`px-4 py-3 text-right font-semibold ${impuesto.abono_Pendiente > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                                                        ${impuesto.abono_Pendiente?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-bold text-purple-700 dark:text-purple-300">${impuesto.importe_Orden_Actual?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {(!detallesOrdenCaja.impuestos_Derechos?.lista || detallesOrdenCaja.impuestos_Derechos.lista.length === 0) && (
                            <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-950/30">
                                <p className="text-sm text-muted-foreground text-center py-8">No hay impuestos y derechos registrados.</p>
                            </div>
                        )}
                    </>
                )}



                {!detallesOrdenCaja && ordenesCaja.some(orden => orden.clave?.toUpperCase() === 'PENDIENTE') && (
                    <div className="border rounded-lg p-4 bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0">
                                <div className="flex items-center justify-center h-8 w-8 rounded-md bg-yellow-200 dark:bg-yellow-800">
                                    <span className="text-yellow-800 dark:text-yellow-200 font-bold">⚠</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">Formulario bloqueado</h3>
                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">No puedes ingresar cargo/ingreso mientras haya órdenes de caja con estatus PENDIENTE. Por favor, resuelve todas las órdenes pendientes primero.</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal/Formulario Nueva Orden */}
                {mostrarFormularioNuevaOrden && detallesNuevaOrden && (
                    <div className="border-2 border-green-300 rounded-lg p-6 bg-green-50 dark:bg-green-950/20 space-y-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Crear Nueva Orden de Caja</h3>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setMostrarFormularioNuevaOrden(false);
                                    setDetallesNuevaOrden(null);
                                    setImportesNuevaOrden({});
                                    setFormaPagoSeleccionada(0);
                                    setComparecienteSeleccionado(null);
                                }}
                            >
                                ✕
                            </Button>
                        </div>

                        {/* Información General */}
                        <div className="bg-white dark:bg-slate-900/50 border rounded-lg p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Operación</label>
                                    <input
                                        type="text"
                                        value={operacionesDelExpediente?.[0]?.descripcion || ''}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100 cursor-not-allowed"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Compareciente</label>
                                    <select
                                        value={clienteIdSeleccionado?.toString() || ''}
                                        onChange={(e) => setClienteIdSeleccionado(parseInt(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-slate-900/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500"
                                    >
                                        <option value="">Selecciona un cliente</option>
                                        {formData?.clientes?.map((cliente: any) => (
                                            <option key={cliente.cliente_Id} value={cliente.cliente_Id.toString()}>
                                                {cliente.nombre} ({cliente.compareciente})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Forma de Pago</label>
                                    <select
                                        value={formaPagoSeleccionada}
                                        onChange={(e) => setFormaPagoSeleccionada(Number(e.target.value))}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-slate-900/50 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-green-500">
                                        <option value="">Selecciona forma de pago</option>
                                        {formasPago?.map((forma: any) => (
                                            <option key={forma.id} value={forma.id}>
                                                {forma.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Honorarios e IVA */}
                        <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900/50">
                            <div className="overflow-x-auto">
                                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">Honorarios e IVA</h4>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-green-600 dark:bg-green-800 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                                            <th className="px-4 py-3 text-right font-semibold">Presupuesto</th>
                                            <th className="px-4 py-3 text-right font-semibold">Abono</th>
                                            <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                                            <th className="px-4 py-3 text-right font-semibold">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const honorariosPresupuesto = (detallesNuevaOrden.honorarios?.presupuesto_Honorarios || 0);
                                            const ivaPresupuesto = (detallesNuevaOrden.honorarios?.presupuesto_IVA || 0);
                                            const sumaPresupuestos = honorariosPresupuesto + ivaPresupuesto;
                                            const totalIngresado = importesNuevaOrden['total'] || 0;
                                            const honorariosCalculado = sumaPresupuestos > 0 ? totalIngresado * (honorariosPresupuesto / sumaPresupuestos) : 0;
                                            const ivaCalculado = sumaPresupuestos > 0 ? totalIngresado * (ivaPresupuesto / sumaPresupuestos) : 0;
                                            return (
                                                <>
                                                    <tr className="border-b hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                                                        <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">HONORARIOS</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                            ${honorariosPresupuesto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                                                            ${detallesNuevaOrden.honorarios?.abono_Completo_Honorarios?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">
                                                            ${detallesNuevaOrden.honorarios?.abono_Pendiente_Honorarios?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-green-700 dark:text-green-300">
                                                            ${honorariosCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                    <tr className="border-b hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors">
                                                        <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">IVA</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                            ${ivaPresupuesto.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                                                            ${detallesNuevaOrden.honorarios?.abono_Completo_IVA?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">
                                                            ${detallesNuevaOrden.honorarios?.abono_Pendiente_IVA?.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-blue-700 dark:text-blue-300">
                                                            ${ivaCalculado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                    </tr>
                                                    <tr className="bg-gradient-to-r from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 text-white border-t-4 border-green-800">
                                                        <td className="px-4 py-3 font-bold text-lg">TOTAL HONORARIOS + IVA</td>
                                                        <td className="px-4 py-3 text-right font-bold text-lg">
                                                            ${(detallesNuevaOrden.honorarios?.total_Presupuesto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-lg">
                                                            ${(detallesNuevaOrden.honorarios?.abono_Completo_Total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-bold text-lg">
                                                            ${(detallesNuevaOrden.honorarios?.abono_Pendiente_Total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    placeholder="0.00"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max={detallesNuevaOrden.honorarios?.abono_Pendiente_Total || 0}
                                                                    value={importesNuevaOrden['total'] || ''}
                                                                    onChange={(e) => {
                                                                        const valor = parseFloat(e.target.value) || 0;
                                                                        const maximo = detallesNuevaOrden.honorarios?.abono_Pendiente_Total || 0;
                                                                        setImportesNuevaOrden({ ...importesNuevaOrden, total: Math.min(valor, maximo) });
                                                                    }}
                                                                    onFocus={() => {
                                                                        const valorAuto = (detallesNuevaOrden.honorarios?.abono_Pendiente_Total || 0) > 0
                                                                            ? (detallesNuevaOrden.honorarios?.abono_Pendiente_Total || 0)
                                                                            : (detallesNuevaOrden.honorarios?.total_Presupuesto || 0);
                                                                        if (!importesNuevaOrden['total']) {
                                                                            setImportesNuevaOrden({ ...importesNuevaOrden, total: valorAuto });
                                                                        }
                                                                    }}
                                                                    className="flex-1 px-2 py-1 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 text-right font-bold focus:outline-none focus:ring-2 focus:ring-green-500 text-sm cursor-pointer"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setImportesNuevaOrden({ ...importesNuevaOrden, total: 0 })}
                                                                    className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-colors"
                                                                    title="Limpiar"
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tabla de Gastos Notariales */}
                        <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900/50">
                            <div className="overflow-x-auto">
                                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-cyan-600" />
                                    <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">Gastos Notariales</h4>
                                </div>
                                <table className="w-full text-sm">
                                    <thead className="bg-cyan-600 dark:bg-cyan-800 text-white">
                                        <tr>
                                            <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                                            <th className="px-4 py-3 text-right font-semibold">Presupuesto</th>
                                            <th className="px-4 py-3 text-right font-semibold">Abono</th>
                                            <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                                            <th className="px-4 py-3 text-right font-semibold">Importe</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const gastosNota = detallesNuevaOrden.gastosNotariales || {};
                                            return (
                                                <tr className="border-b hover:bg-cyan-50 dark:hover:bg-cyan-900/30 transition-colors">
                                                    <td className="px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">GASTOS NOTARIALES</td>
                                                    <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                        ${(gastosNota.total_Presupuesto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                                                        ${(gastosNota.abono_Completo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">
                                                        ${(gastosNota.abono_Pendiente || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </td>
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="number"
                                                                placeholder="0.00"
                                                                step="0.01"
                                                                min="0"
                                                                max={gastosNota.abono_Pendiente || 0}
                                                                value={importesNuevaOrden['gastos'] || ''}
                                                                onChange={(e) => {
                                                                    const valor = parseFloat(e.target.value) || 0;
                                                                    const maximo = gastosNota.abono_Pendiente || 0;
                                                                    setImportesNuevaOrden({ ...importesNuevaOrden, gastos: Math.min(valor, maximo) });
                                                                }}
                                                                onFocus={() => {
                                                                    const valorAuto = (gastosNota.abono_Pendiente || 0) > 0 ? gastosNota.abono_Pendiente : gastosNota.total_Presupuesto;
                                                                    setImportesNuevaOrden({ ...importesNuevaOrden, gastos: valorAuto });
                                                                }}
                                                                className="flex-1 px-2 py-1 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 text-right font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm cursor-pointer"
                                                            />
                                                            <button
                                                                type="button"
                                                                onClick={() => setImportesNuevaOrden({ ...importesNuevaOrden, gastos: 0 })}
                                                                className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-colors"
                                                                title="Limpiar"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Tabla de Impuestos y Derechos */}
                        <div className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900/50">
                                <div className="overflow-x-auto">
                                    <div className="px-4 py-3 bg-gray-50 dark:bg-slate-800 border-b flex items-center gap-2">
                                        <TrendingUp className="h-5 w-5 text-purple-600" />
                                        <h4 className="font-bold text-lg text-gray-900 dark:text-gray-100">Impuestos y Derechos</h4>
                                    </div>
                                    <table className="w-full text-sm">
                                        <thead className="bg-purple-600 dark:bg-purple-800 text-white">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold">Concepto</th>
                                                <th className="px-4 py-3 text-right font-semibold">Presupuesto</th>
                                                <th className="px-4 py-3 text-right font-semibold">Abono</th>
                                                <th className="px-4 py-3 text-right font-semibold">Saldo</th>
                                                <th className="px-4 py-3 text-right font-semibold">Importe</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {detallesNuevaOrden.impuestosDerechos?.lista && detallesNuevaOrden.impuestosDerechos.lista.length > 0 ? (
                                                detallesNuevaOrden.impuestosDerechos.lista.map((tramite: any, idx: number) => (
                                                    <tr key={idx} className="border-b hover:bg-purple-50 dark:hover:bg-purple-900/30 transition-colors">
                                                        <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{tramite?.descripcion || 'N/A'}</td>
                                                        <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-gray-100">
                                                            ${(tramite?.importe || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                                                            ${(tramite?.abono_Completo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right font-semibold text-orange-600 dark:text-orange-400">
                                                            ${(tramite?.abono_Pendiente || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            {tramite.importe === tramite.abono_Completo ? (
                                                                <div className="text-center text-sm text-gray-500 italic">
                                                                    Completamente pagado
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2">
                                                                    <input
                                                                        type="number"
                                                                        placeholder="0.00"
                                                                        step="0.01"
                                                                        min="0"
                                                                        max={tramite.abono_Pendiente}
                                                                        value={importesNuevaOrden[`tramite_${tramite.impuestos_Derechos_Id}`] || ''}
                                                                        onChange={(e) => {
                                                                            const valor = parseFloat(e.target.value) || 0;
                                                                            const maximo = tramite.abono_Pendiente || 0;
                                                                            setImportesNuevaOrden({ ...importesNuevaOrden, [`tramite_${tramite.impuestos_Derechos_Id}`]: Math.min(valor, maximo) });
                                                                        }}
                                                                        onFocus={() => {
                                                                            if (!importesNuevaOrden[`tramite_${tramite.impuestos_Derechos_Id}`]) {
                                                                                const valorAuto = tramite.abono_Pendiente > 0 ? tramite.abono_Pendiente : tramite.importe;
                                                                                setImportesNuevaOrden({ ...importesNuevaOrden, [`tramite_${tramite.impuestos_Derechos_Id}`]: valorAuto });
                                                                            }
                                                                        }}
                                                                        className="flex-1 px-2 py-1 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 text-right font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm cursor-pointer"
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setImportesNuevaOrden({ ...importesNuevaOrden, [`tramite_${tramite.impuestos_Derechos_Id}`]: 0 })}
                                                                        className="p-1 hover:bg-red-100 rounded text-red-600 hover:text-red-700 transition-colors"
                                                                        title="Limpiar"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan={5} className="px-4 py-3 text-center text-gray-500">
                                                        No hay trámites registrados
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                        {/* Botones de Acción */}
                        <div className="flex gap-3 justify-end pt-6 border-t-2 border-gray-200">
                            <Button
                                variant="outline"
                                className="text-sm"
                                onClick={() => {
                                    setMostrarFormularioNuevaOrden(false);
                                    setDetallesNuevaOrden(null);
                                    setImportesNuevaOrden({});
                                    setFormaPagoSeleccionada(0);
                                    setComparecienteSeleccionado(null);
                                }}
                            >
                                Cancelar
                            </Button>
                            <Button
                                className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold"
                                onClick={async () => {
                                    try {
                                        if (!formaPagoSeleccionada) {
                                            addToast('Debes seleccionar una forma de pago', 'error');
                                            return;
                                        }

                                        if (!clienteIdSeleccionado) {
                                            addToast('Debes seleccionar un cliente', 'error');
                                            return;
                                        }

                                        // Construir lista de impuestos derechos con los importes ingresados
                                        const listaImpuestosDerechos = (detallesNuevaOrden.impuestosDerechos?.lista || []).map((tramite: any) => ({
                                            tramite_Id: parseInt(String(tramite.impuestos_Derechos_Id), 10),
                                            importe: parseFloat(String(importesNuevaOrden[`tramite_${tramite.impuestos_Derechos_Id}`] || 0))
                                        }));

                                        const expedienteId = parseInt(String(currentExpedienteId), 10);
                                        const clienteId = parseInt(String(clienteIdSeleccionado), 10);
                                        const formaPagoId = parseInt(String(formaPagoSeleccionada), 10);
                                        const operacionPrincipalId = operacionesDelExpediente && operacionesDelExpediente.length > 0 ? operacionesDelExpediente[0].id : 0;
                                        const honorariosTotal = parseFloat(String(importesNuevaOrden['total'] || 0));
                                        const gastosNotariales = parseFloat(String(importesNuevaOrden['gastos'] || 0));

                                        const payload = {
                                            expediente_Id: expedienteId,
                                            operacion_Principal_Id: operacionPrincipalId,
                                            cliente_Id: clienteId,
                                            forma_Pago_Id: formaPagoId,
                                            honorarios: honorariosTotal,
                                            gastos_Notariales: gastosNotariales,
                                            listaImpuestosDerechos: listaImpuestosDerechos
                                        };

                                        setCargandoNuevaOrden(true);
                                        const response = await api.post(`/OrdenCaja/CreateOrdenCajaXExpediente`, payload);

                                        if (response.operationStatus === 'Success') {
                                            // Extraer el ID de la orden del dataResponse
                                            const dataResponse = response.dataResponse;
                                            const ordenIdMatch = dataResponse && typeof dataResponse === 'string' ? dataResponse.match(/\d+/) : null;
                                            const ordenCajaId = ordenIdMatch ? parseInt(ordenIdMatch[0], 10) : null;

                                            if (ordenCajaId) {
                                                // Esperar un poco para que la orden esté lista en la DB
                                                setTimeout(async () => {
                                                    await handleGenerarPdfOrdenCaja(ordenCajaId);
                                                }, 500);
                                            }

                                            setMostrarFormularioNuevaOrden(false);
                                            setDetallesNuevaOrden(null);
                                            setImportesNuevaOrden({});
                                            setFormaPagoSeleccionada(0);
                                            setComparecienteSeleccionado(null);
                                            setClienteIdSeleccionado(null);
                                            // Recargar órdenes
                                            await fetchOrdenesCaja();
                                        } else {
                                            throw new Error(response.message || 'Error al crear la orden');
                                        }
                                    } catch (error) {
                                        const message = error instanceof Error ? error.message : 'Error al crear la orden';
                                        addToast(message, 'error');
                                        console.error('Error:', error);
                                    } finally {
                                        setCargandoNuevaOrden(false);
                                    }
                                }}
                                disabled={cargandoNuevaOrden}
                            >
                                {cargandoNuevaOrden ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Crear Orden
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </TabsContent>

            {/* SubTab: Recibos */}
            <TabsContent value="recibos" className="space-y-6">
                <div className="bg-green-50 dark:bg-green-950/30 p-4 rounded-md mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-green-900 dark:text-green-100 mb-0">Recibos Provisionales Generados</h3>
                    <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={handleGenerarReciboDesdeOrdenActiva}
                        disabled={cargandoReciboDesdeOrdenActiva}
                    >
                        {cargandoReciboDesdeOrdenActiva ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Cargando...
                            </>
                        ) : (
                            <>
                                <Plus className="h-4 w-4 mr-2" />
                                Generar Recibo
                            </>
                        )}
                    </Button>
                </div>

                {cargandoRecibos && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Cargando recibos...</span>
                    </div>
                )}

                {!cargandoRecibos && recibosProvisionales.length === 0 && (
                    <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground text-center py-8">No hay recibos provisionales registrados para este expediente.</p>
                    </div>
                )}

                {!cargandoRecibos && recibosProvisionales.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                 <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold">Nº Recibo</th>
                                        <th className="px-4 py-2 text-left font-semibold">Expediente</th>
                                        <th className="px-4 py-2 text-left font-semibold">Escritura</th>
                                        <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                                        <th className="px-4 py-2 text-left font-semibold">Operación / Concepto</th>
                                        <th className="px-4 py-2 text-right font-semibold">Total</th>
                                        <th className="px-4 py-2 text-center font-semibold">Estatus</th>
                                        <th className="px-4 py-2 text-left font-semibold">Fecha Creación</th>
                                        <th className="px-4 py-2 text-center font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recibosProvisionales.map((recibo, idx) => (
                                        <tr key={idx} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors" onClick={() => fetchReciboDetalle(recibo.id)}>
                                            <td className="px-4 py-2 font-semibold text-blue-600 dark:text-blue-400 cursor-pointer">{recibo.numero_Recibo}</td>
                                            <td className="px-4 py-2 cursor-pointer">{recibo.expediente}</td>
                                            <td className="px-4 py-2 cursor-pointer">{recibo.escritura_Numero || '-'}</td>
                                            <td className="px-4 py-2 cursor-pointer">{recibo.nombre}</td>
                                            <td className="px-4 py-2 text-xs cursor-pointer">{recibo.operacion_Concepto}</td>
                                            <td className="px-4 py-2 text-right font-semibold text-green-600 dark:text-green-400 cursor-pointer">${recibo.total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            <td className="px-4 py-2 text-center cursor-pointer">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    recibo.estatus === 'PAGADO'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : recibo.estatus === 'CANCELADO'
                                                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                    : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                }`}>
                                                    {recibo.estatus}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 cursor-pointer">{recibo.fecha_Creacion}</td>
                                            <td className="px-4 py-2 text-center">
                                                {recibo.estatus !== 'PENDIENTE' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleImprimirRecibo(recibo.id);
                                                        }}
                                                        disabled={cargandoReciboDetalle}
                                                        className="border-2 border-blue-400 text-blue-700 hover:bg-blue-50 font-semibold shadow-md hover:shadow-lg transition-all"
                                                        title="Imprimir recibo"
                                                    >
                                                        {cargandoReciboDetalle ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Eye className="h-4 w-4 mr-1" />
                                                        )}
                                                        Imprimir
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Formulario para Nuevo Recibo */}
                {mostrarFormularioRecibo && (
                    <div className="border rounded-lg p-6 bg-purple-50 dark:bg-purple-950/20">
                        <h4 className="font-semibold mb-6 text-purple-900 dark:text-purple-100">{reciboDetalleSeleccionado ? `Recibo #${reciboDetalleSeleccionado.numero_Recibo}` : 'Nuevo Recibo'}</h4>
                        <div className="grid grid-cols-4 gap-4 mb-6">
                            {/* Row 1: Información Básica */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Recibo Número</label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={reciboDetalleSeleccionado?.numero_Recibo || ''}
                                    className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                    placeholder="Auto-generado"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Expediente</label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={reciboDetalleSeleccionado?.expediente || (reciboData as any).expediente || formData.expediente}
                                    className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Escritura</label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={reciboDetalleSeleccionado?.escritura_Numero || (reciboData as any).escritura || '-'}
                                    className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                    placeholder="-"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Estatus</label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={reciboDetalleSeleccionado?.estatus || '-'}
                                    className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                    placeholder="-"
                                />
                            </div>

                            {/* Row 2: Notario, Forma de Pago, Fecha Emisión */}
                            <div className="col-span-2 space-y-2">
                                <label className="text-sm font-medium">Notario</label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={reciboDetalleSeleccionado?.notario || (reciboData as any).notario || formData.notario}
                                    className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                    placeholder="-"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Forma de Pago</label>
                                {reciboDetalleSeleccionado || (reciboData as any).ordenActiva ? (
                                    <Input
                                        type="text"
                                        readOnly
                                        value={reciboDetalleSeleccionado?.forma_Pago || reciboData.formaPago}
                                        className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                    />
                                ) : (
                                    <select value={reciboData.formaPago} onChange={(e) => setReciboData({ ...reciboData, formaPago: e.target.value })} className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm">
                                        <option value="">Selecciona</option>
                                        <option value="EFECTIVO">EFECTIVO</option>
                                        <option value="TARJETA CREDITO">TARJETA CREDITO</option>
                                        <option value="TARJETA DEBITO">TARJETA DEBITO</option>
                                        <option value="TRANSFERENCIA">TRANSFERENCIA</option>
                                        <option value="DEPOSITO">DEPOSITO</option>
                                        <option value="PAGO EN LINEA">PAGO EN LINEA</option>
                                        <option value="CHEQUE">CHEQUE</option>
                                    </select>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha Emisión</label>
                                <Input
                                    type="text"
                                    readOnly
                                    value={reciboDetalleSeleccionado?.fecha_Creacion || new Date().toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                />
                            </div>

                            {/* Row 3: Recibí De (Full Width) */}
                            <div className="col-span-4 space-y-2">
                                <label className="text-sm font-medium">Recibí De</label>
                                {reciboDetalleSeleccionado || (reciboData as any).ordenActiva ? (
                                    <Input
                                        type="text"
                                        readOnly
                                        value={reciboDetalleSeleccionado?.nombre || (reciboData as any)?.clienteNombre || ''}
                                        className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed"
                                    />
                                ) : (
                                    <select
                                        value={reciboData.clienteId || ''}
                                        onChange={(e) => setReciboData({ ...reciboData, clienteId: e.target.value ? parseInt(e.target.value) : null })}
                                        className="w-full px-3 py-2 border rounded-md bg-background border-input focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    >
                                        <option value="">Selecciona cliente</option>
                                        {filasComparecientes.map((fila) => (
                                            <option key={fila.id} value={fila.cliente_Id}>
                                                {fila.nombreCompareciente}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* Row 4: Desglose Summary (6 readonly inputs) */}
                            <div className="col-span-4 grid grid-cols-6 gap-2 mb-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Honorarios</label>
                                    <Input
                                        type="text"
                                        readOnly
                                        value={`$${((reciboData as any).desglose?.honorarios || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-center"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">IVA</label>
                                    <Input
                                        type="text"
                                        readOnly
                                        value={`$${((reciboData as any).desglose?.iva || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-center"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Total H+IVA</label>
                                    <Input
                                        type="text"
                                        readOnly
                                        value={`$${((reciboData as any).desglose?.total_Honorarios_IVA || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-center font-semibold"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Gastos Notariales</label>
                                    <Input
                                        type="text"
                                        readOnly
                                        value={`$${((reciboData as any).desglose?.gastos_Notariales || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-center"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-gray-600">Impuestos Derechos</label>
                                    <Input
                                        type="text"
                                        readOnly
                                        value={`$${((reciboData as any).desglose?.impuestos_Derechos || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        className="text-sm bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-center"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-green-600 font-semibold">Total Orden</label>
                                    <Input
                                        type="text"
                                        readOnly
                                        value={`$${((reciboData as any).desglose?.total_Orden || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                                        className="text-sm bg-green-100 dark:bg-green-900/30 cursor-not-allowed text-center font-bold text-green-700"
                                    />
                                </div>
                            </div>

                            {/* Tabla de Detalles Financieros */}
                            <div className="col-span-4 space-y-4">
                                <label className="text-sm font-medium">Detalles Financieros</label>
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-gray-200 dark:bg-gray-700">
                                                <th className="px-3 py-2 text-left">Concepto</th>
                                                <th className="px-3 py-2 text-right">Total</th>
                                                <th className="px-3 py-2 text-right">Abono</th>
                                                <th className="px-3 py-2 text-right">Saldo</th>
                                                <th className="px-3 py-2 text-right">Importe Actual</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {/* HONORARIOS */}
                                            {(reciboData as any).honorariosData && (
                                                <tr className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="px-3 py-2 font-medium">HONORARIOS</td>
                                                    <td className="px-3 py-2 text-right">${((reciboData as any).honorariosData?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right">${((reciboData as any).honorariosData?.abono || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right text-green-600 font-medium">${((reciboData as any).honorariosData?.saldo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right font-semibold text-blue-600">${((reciboData as any).honorariosData?.importeOrdenActual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            )}

                                            {/* IVA */}
                                            {(reciboData as any).ivaData && (
                                                <tr className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="px-3 py-2 font-medium">IVA</td>
                                                    <td className="px-3 py-2 text-right">${((reciboData as any).ivaData?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right">${((reciboData as any).ivaData?.abono || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right text-green-600 font-medium">${((reciboData as any).ivaData?.saldo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right font-semibold text-blue-600">${((reciboData as any).ivaData?.importeOrdenActual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            )}

                                            {/* TOTAL HONORARIOS + IVA */}
                                            {(reciboData as any).honorariosData && (reciboData as any).ivaData && (
                                                <tr className="border-t bg-amber-100 dark:bg-amber-900/30 font-semibold">
                                                    <td className="px-3 py-2 text-amber-700 dark:text-amber-300">TOTAL</td>
                                                    <td className="px-3 py-2 text-right text-amber-700 dark:text-amber-300"></td>
                                                    <td className="px-3 py-2 text-right text-amber-700 dark:text-amber-300"></td>
                                                    <td className="px-3 py-2 text-right text-amber-700 dark:text-amber-300"></td>
                                                    <td className="px-3 py-2 text-right font-bold text-amber-700 dark:text-amber-300">${(((reciboData as any).honorariosData?.importeOrdenActual || 0) + ((reciboData as any).ivaData?.importeOrdenActual || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            )}

                                            {/* GASTOS NOTARIALES */}
                                            {(reciboData as any).gastosData && (
                                                <tr className="border-t hover:bg-gray-50 dark:hover:bg-gray-800">
                                                    <td className="px-3 py-2 font-medium">GASTOS NOTARIALES</td>
                                                    <td className="px-3 py-2 text-right">${((reciboData as any).gastosData?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right">${((reciboData as any).gastosData?.abono || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right text-green-600 font-medium">${((reciboData as any).gastosData?.saldo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right font-semibold text-blue-600">${((reciboData as any).gastosData?.importeOrdenActual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            )}

                                            {/* IMPUESTOS Y DERECHOS - Header */}
                                            {((reciboData as any).impuestosDerechosDetalle || []).length > 0 && (
                                                <tr className="border-t bg-purple-100 dark:bg-purple-900/30">
                                                    <td colSpan={5} className="px-3 py-2 font-semibold text-purple-700 dark:text-purple-300">IMPUESTOS Y DERECHOS</td>
                                                </tr>
                                            )}

                                            {/* IMPUESTOS Y DERECHOS - Filas individuales */}
                                            {((reciboData as any).impuestosDerechosDetalle || []).map((item: any, idx: number) => (
                                                <tr key={idx} className="border-t hover:bg-gray-50 dark:hover:bg-gray-800 bg-purple-50 dark:bg-purple-950/20">
                                                    <td className="px-3 py-2 text-sm">{item.concepto}</td>
                                                    <td className="px-3 py-2 text-right">${(item.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right">${(item.abono || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right text-green-600">${(item.saldo || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                    <td className="px-3 py-2 text-right font-semibold text-blue-600">${(item.importeOrdenActual || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                </tr>
                                            ))}

                                            {/* TOTAL */}
                                            <tr className="border-t bg-green-100 dark:bg-green-900/30 font-bold">
                                                <td className="px-3 py-2 text-green-700 dark:text-green-300">TOTAL</td>
                                                <td className="px-3 py-2"></td>
                                                <td className="px-3 py-2"></td>
                                                <td className="px-3 py-2"></td>
                                                <td className="px-3 py-2 text-right text-green-700 dark:text-green-300 font-bold">${((reciboData as any).granTotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Row 5: Concepto (Full Width) */}
                            <div className="col-span-4 space-y-2">
                                <label className="text-sm font-medium">Concepto</label>
                                {reciboDetalleSeleccionado ? (
                                    <textarea
                                        readOnly
                                        value={reciboDetalleSeleccionado.operacion_Concepto}
                                        rows={4}
                                        className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-sm"
                                    />
                                ) : (
                                    <textarea
                                        value={reciboData.concepto || formData.operaciones?.join(', ') || ''}
                                        onChange={(e) => setReciboData({ ...reciboData, concepto: e.target.value })}
                                        placeholder="Descripción del concepto del recibo..."
                                        rows={4}
                                        className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    />
                                )}
                            </div>

                            {/* Row 6: Observaciones (Full Width) */}
                            <div className="col-span-4 space-y-2">
                                <label className="text-sm font-medium">Observaciones</label>
                                {reciboDetalleSeleccionado ? (
                                    <textarea
                                        readOnly
                                        value={reciboDetalleSeleccionado.observacion || ''}
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-md bg-gray-100 dark:bg-gray-600 cursor-not-allowed text-sm"
                                    />
                                ) : (
                                    <textarea
                                        value={reciboData.observaciones}
                                        onChange={(e) => setReciboData({ ...reciboData, observaciones: e.target.value })}
                                        placeholder="Observaciones adicionales..."
                                        rows={3}
                                        className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    />
                                )}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            {reciboDetalleSeleccionado ? (
                                <>
                                    {/* Botón Cerrar - Siempre disponible */}
                                    <Button
                                        variant="outline"
                                        className="text-sm"
                                        onClick={() => {
                                            setMostrarFormularioRecibo(false);
                                            setReciboDetalleSeleccionado(null);
                                            setReciboData({
                                                impuestosDerechos: 0,
                                                gastosNotariales: 0,
                                                honorarios: 0,
                                                concepto: '',
                                                formaPago: '',
                                                observaciones: '',
                                                clienteId: null
                                            });
                                        }}
                                    >
                                        Cerrar
                                    </Button>

                                    {/* Botón Pagar - Solo si status es PENDIENTE */}
                                    {reciboDetalleSeleccionado.estatus === 'PENDIENTE' && (
                                        <Button
                                            onClick={handlePagarRecibo}
                                            disabled={cargandoReciboDetalle}
                                            className="bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:bg-gray-400"
                                        >
                                            {cargandoReciboDetalle ? 'Procesando...' : 'Pagar'}
                                        </Button>
                                    )}

                                    {/* Botón Cancelar - Solo si status es PENDIENTE o PAGADO */}
                                    {(reciboDetalleSeleccionado.estatus === 'PENDIENTE' || reciboDetalleSeleccionado.estatus === 'PAGADO') && (
                                        <Button
                                            onClick={handleCancelarRecibo}
                                            disabled={cargandoReciboDetalle}
                                            className="bg-red-600 hover:bg-red-700 text-white text-sm disabled:bg-gray-400"
                                        >
                                            {cargandoReciboDetalle ? 'Procesando...' : 'Cancelar Recibo'}
                                        </Button>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        className="text-sm"
                                        onClick={() => {
                                            setMostrarFormularioRecibo(false);
                                            setReciboDetalleSeleccionado(null);
                                            setReciboData({
                                                impuestosDerechos: 0,
                                                gastosNotariales: 0,
                                                honorarios: 0,
                                                concepto: '',
                                                formaPago: '',
                                                observaciones: '',
                                                clienteId: null
                                            });
                                        }}
                                    >
                                        Cerrar
                                    </Button>
                                    <Button className="bg-green-600 hover:bg-green-700 text-sm" onClick={handleGuardarRecibo}>
                                        Generar Recibo
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </TabsContent>

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

            {/* SubTab: PLD */}
            <TabsContent value="pld" className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-md mb-4 flex items-center justify-between">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-0">Verificación PLD</h3>
                </div>

                {cargandoPLD && (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                        <span className="ml-2 text-sm text-muted-foreground">Cargando datos PLD...</span>
                    </div>
                )}

                {!cargandoPLD && datosPLD.length === 0 && (
                    <div className="border rounded-lg p-4">
                        <p className="text-sm text-muted-foreground text-center py-8">No hay datos PLD disponibles para este expediente.</p>
                    </div>
                )}

                {!cargandoPLD && datosPLD.length > 0 && (
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                 <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                                        <th className="px-4 py-2 text-left font-semibold">Usuario Responsable</th>
                                        <th className="px-4 py-2 text-center font-semibold">Estatus</th>
                                        <th className="px-4 py-2 text-left font-semibold">Fecha Realizado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {datosPLD.map((item, idx) => (
                                        <tr key={idx} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                            <td className="px-4 py-2">{item.descripcion}</td>
                                            <td className="px-4 py-2">{item.usuario || '-'}</td>
                                            <td className="px-4 py-2 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                    item.clave === 'PENDIENTE'
                                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                                                    : item.clave === 'REALIZADO'
                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                }`}>
                                                    {item.clave}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2">{item.fecha_Realizado || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
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

            {/* MODAL DE PRESUPUESTOS PREVIOS */}
            {showPresupuestoPrevioModal &&
                createPortal(
                    <>
                        {/* Backdrop oscuro con blur */}
                        <div
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                            onClick={() => {
                                setShowPresupuestoPrevioModal(false);
                                setFiltroPresupuestoPrevioLocal('');
                            }}
                        />

                        {/* Modal */}
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                                {/* Header con Gradiente */}
                                <div className="bg-linear-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between border-b border-blue-700">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Link2 className="h-5 w-5" />
                                        Ligar Presupuesto Previo
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowPresupuestoPrevioModal(false);
                                            setFiltroPresupuestoPrevioLocal('');
                                        }}
                                        className="text-white hover:text-blue-100 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                {/* Search Section */}
                                <div className="border-b px-6 py-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                value={filtroPresupuestoPrevioLocal}
                                                onChange={(e) => setFiltroPresupuestoPrevioLocal(e.target.value)}
                                                placeholder="Buscar por nombre, operación..."
                                                className="pl-10 pr-10 bg-white dark:bg-slate-900/50"
                                            />
                                            {filtroPresupuestoPrevioLocal && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFiltroPresupuestoPrevioLocal('')}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                        <Button
                                            onClick={() => fetchPresupuestosPrevios(filtroPresupuestoPrevioLocal)}
                                            disabled={isSearchingPresupuestoPrevio}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            {isSearchingPresupuestoPrevio ? (
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Search className="h-4 w-4" />
                                            )}
                                            <span className="ml-2">Buscar</span>
                                        </Button>
                                    </div>
                                    {errorPresupuestoPrevio && (
                                        <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-red-50 border-red-200 text-red-800 text-sm dark:bg-red-900/20 dark:border-red-800 dark:text-red-400">
                                            <AlertCircle className="h-4 w-4 shrink-0" />
                                            <span>{errorPresupuestoPrevio}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Table Content - Scrollable */}
                                <div className="flex-1 overflow-y-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0 border-b">
                                            <tr>
                                                <th className="px-4 py-3 text-left font-semibold w-16">ID</th>
                                                <th className="px-4 py-3 text-left font-semibold">Cliente</th>
                                                <th className="px-4 py-3 text-left font-semibold">Operación</th>
                                                <th className="px-4 py-3 text-left font-semibold">Fecha Creación</th>
                                                <th className="px-4 py-3 text-center font-semibold w-24">Estatus</th>
                                                <th className="px-4 py-3 text-center font-semibold w-28">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {isSearchingPresupuestoPrevio ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-8 text-muted-foreground px-4">
                                                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                        Buscando presupuestos...
                                                    </td>
                                                </tr>
                                            ) : presupuestosPrevios.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="text-center py-8 text-muted-foreground px-4">
                                                        {filtroPresupuestoPrevioLocal
                                                            ? 'No se encontraron presupuestos con ese criterio'
                                                            : 'No se encontraron presupuestos'}
                                                    </td>
                                                </tr>
                                            ) : (
                                                presupuestosPrevios.map((presupuesto) => (
                                                    <tr
                                                        key={presupuesto.id}
                                                        className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    >
                                                        <td className="px-4 py-3 font-mono text-sm">{presupuesto.id}</td>
                                                        <td className="px-4 py-3 font-medium">
                                                            {presupuesto.nombre} {presupuesto.apellido_Paterno} {presupuesto.apellido_Materno}
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                                                                {presupuesto.operacion}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm">{presupuesto.fecha_Creacion}</td>
                                                        <td className="px-4 py-3 text-center">
                                                            <span
                                                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                                    presupuesto.activo
                                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                        : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                                }`}
                                                            >
                                                                {presupuesto.activo ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-center">
                                                            <Button
                                                                onClick={() => {
                                                                    handleSelectPresupuestoPrevio(presupuesto);
                                                                    setShowPresupuestoPrevioModal(false);
                                                                    setFiltroPresupuestoPrevioLocal('');
                                                                }}
                                                                size="sm"
                                                                className="bg-green-600 hover:bg-green-700"
                                                            >
                                                                <Plus className="h-4 w-4" />
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Footer */}
                                <div className="border-t px-6 py-4 flex justify-end gap-2 bg-slate-50 dark:bg-slate-800/50">
                                    <Button
                                        onClick={() => {
                                            setShowPresupuestoPrevioModal(false);
                                            setFiltroPresupuestoPrevioLocal('');
                                        }}
                                        variant="outline"
                                    >
                                        Cerrar
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </>,
                    document.body
                )
            }

            {/* Modal: Búsqueda de Impuestos y Derechos */}
            {showImpuestosModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-950 rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Header */}
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h2 className="text-xl font-bold">Agregar Trámites/Impuestos</h2>
                            <button onClick={() => setShowImpuestosModal(false)} className="text-muted-foreground hover:text-foreground">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="px-6 py-4 space-y-4">
                            {/* Buscador */}
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Buscar por concepto..."
                                    value={impuestosFiltro}
                                    onChange={(e) => setImpuestosFiltro(e.target.value)}
                                    className="flex-1"
                                />
                                <button onClick={() => setImpuestosFiltro('')} className="text-muted-foreground hover:text-foreground p-2">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Categorías por Dependencia */}
                            {dependenciasUnicas.length > 0 && (
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        {dependenciasUnicas.map(dep => (
                                            <button
                                                key={dep}
                                                onClick={() => setActiveDependenciaTab(dep)}
                                                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                                                    activeDependenciaTab === dep
                                                        ? 'bg-purple-600 text-white'
                                                        : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300'
                                                }`}
                                            >
                                                {dep}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Resultados */}
                            {isSearchingImpuestos ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                </div>
                            ) : impuestosResultados.length === 0 ? (
                                <p className="text-center text-muted-foreground py-8">No hay impuestos disponibles</p>
                            ) : (
                                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                                    {impuestosResultados
                                        .filter(imp => {
                                            const matchesSearch = imp.descripcion.toLowerCase().includes(impuestosFiltro.toLowerCase());
                                            const matchesDep = activeDependenciaTab === 'Todas' || imp.dependencia_Publica === activeDependenciaTab;
                                            return matchesSearch && matchesDep;
                                        })
                                        .map(impuesto => {
                                            const estaSeleccionado = formPresupuesto.impuestos_derechos.some(item => item.id === impuesto.id.toString());
                                            return (
                                                <button
                                                    key={impuesto.id}
                                                    onClick={() => handleSelectImpuesto(impuesto)}
                                                    className={`w-full text-left px-3 py-2 rounded border-2 transition-colors ${
                                                        estaSeleccionado
                                                            ? 'bg-purple-100 border-purple-500 dark:bg-purple-900/30'
                                                            : 'bg-slate-50 border-slate-200 hover:border-purple-400'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <div className={`h-4 w-4 rounded border ${estaSeleccionado ? 'bg-purple-600 border-purple-600' : 'border-slate-300'}`} />
                                                        <div>
                                                            <p className="font-medium">{impuesto.descripcion}</p>
                                                            <p className="text-sm text-muted-foreground">{impuesto.dependencia_Publica}</p>
                                                        </div>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="border-t px-6 py-4 flex justify-end gap-2">
                            <Button
                                onClick={() => setShowImpuestosModal(false)}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                            >
                                Listo
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* VISOR DE PDF PARA PRESUPUESTOS GENERADOS */}
            <PDFViewerModal
                isOpen={showPdfPresupuestoViewer}
                onClose={closePdfPresupuestoViewer}
                pdfUrl={pdfUrlPresupuesto || ''}
                title="Recibo del Presupuesto"
                fileName="Recibo_Presupuesto.pdf"
            />

            {/* VISOR DE PDF PARA ÓRDENES DE CAJA GENERADAS */}
            <PDFViewerModal
                isOpen={showPdfOrdenCajaViewer}
                onClose={closePdfOrdenCajaViewer}
                pdfUrl={pdfUrlOrdenCaja || ''}
                title="Orden de Caja"
                fileName="Orden_Caja.pdf"
            />
        </Tabs>
    );
}
