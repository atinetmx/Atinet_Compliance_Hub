import { Head, usePage } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, DollarSign, Eye, Users } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { useApi } from '@/services/api';

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

interface ZonaMunicipio {
    id: number;
    descripcion: string;
    activo: boolean;
}

interface ImpuestoDerechoItem {
    id: number;
    descripcion: string;
    tipo: string;
    dependencia_Publica: string;
    activo: boolean;
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
    const [zonas, setZonas] = useState<ZonaMunicipio[]>([]);
    const [formData, setFormData] = useState<PresupuestoPrevioData>(defaultPresupuestoData);
    const [isLoadingClientes, setIsLoadingClientes] = useState(false);
    const [isLoadingOperaciones, setIsLoadingOperaciones] = useState(false);
    const [isLoadingZonas, setIsLoadingZonas] = useState(false);
    const [isLoadingImpuestos, setIsLoadingImpuestos] = useState(false);
    const [isLoadingHonorarios, setIsLoadingHonorarios] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [ret_isr_check, setRetISRCheck] = useState(false);
    const [ret_iva_check, setRetIVACheck] = useState(false);
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoadingPdf, setIsLoadingPdf] = useState(false);
    const [impuestosCalculados, setImpuestosCalculados] = useState(false);

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

    // --- Filtro de zonas/municipios ---
    const [zonaFiltro, setZonaFiltro] = useState('');
    const [showZonaDropdown, setShowZonaDropdown] = useState(false);

    // --- Modal de búsqueda de impuestos y derechos ---
    const [showImpuestosModal, setShowImpuestosModal] = useState(false);
    const [impuestosFiltro, setImpuestosFiltro] = useState('');
    const [impuestosResultados, setImpuestosResultados] = useState<ImpuestoDerechoItem[]>([]);
    const [isSearchingImpuestos, setIsSearchingImpuestos] = useState(false);
    const [impuestosError, setImpuestosError] = useState<string | null>(null);
    const [dependenciasUnicas, setDependenciasUnicas] = useState<string[]>([]);
    const [activeDependenciaTab, setActiveDependenciaTab] = useState<string>('');

    const { addToast } = useToast();
    const api = useApi();
    const { props } = usePage();
    const apiBaseUrl = (props as any).apiBaseUrl || 'https://localhost:44327/api';

    // Cargar presupuestos al montar (filtro vacío = todos)
    useEffect(() => {
        fetchPresupuestos('');
    }, []);

    // Cargar clientes al montar
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                setIsLoadingClientes(true);
                const data = await api.get('/Clientes/GetClientes');
                if (data && data.dataResponse) {
                    setClientes(data.dataResponse || []);
                } else {
                    throw new Error(data?.message || 'Error al obtener los clientes');
                }
            } catch (error) {
                console.error('Error cargando clientes:', error);
                const message = error instanceof Error ? error.message : 'Error al cargar los clientes';
                addToast(message, 'error');
            } finally {
                setIsLoadingClientes(false);
            }
        };
        fetchClientes();
    }, [addToast, api]);

    // Cargar operaciones al montar
    useEffect(() => {
        const fetchOperaciones = async () => {
            try {
                setIsLoadingOperaciones(true);
                const data = await api.get('/Catalogos/GetOperaciones');
                if (data && data.dataResponse) {
                    setOperaciones(data.dataResponse || []);
                } else {
                    throw new Error(data?.message || 'Error al obtener las operaciones');
                }
            } catch (error) {
                console.error('Error cargando operaciones:', error);
                const message = error instanceof Error ? error.message : 'Error al cargar las operaciones';
                addToast(message, 'error');
            } finally {
                setIsLoadingOperaciones(false);
            }
        };
        fetchOperaciones();
    }, [addToast, api]);

    // Cargar zonas/municipios al montar
    useEffect(() => {
        const fetchZonas = async () => {
            try {
                setIsLoadingZonas(true);
                const data = await api.get('/Catalogos/GetZonasMunicipios');
                if (data && data.dataResponse) {
                    setZonas(data.dataResponse || []);
                } else {
                    throw new Error(data?.message || 'Error al obtener las zonas/municipios');
                }
            } catch (error) {
                console.error('Error cargando zonas:', error);
                const message = error instanceof Error ? error.message : 'Error al cargar las zonas';
                addToast(message, 'error');
            } finally {
                setIsLoadingZonas(false);
            }
        };
        fetchZonas();
    }, [addToast, api]);

    // Búsqueda dinámica: actualizar resultados cuando cambia el filtro
    useEffect(() => {
        const debounceTimer = setTimeout(() => {
            fetchPresupuestos(filtro);
        }, 300); // Esperar 300ms después de que el usuario deje de escribir

        return () => clearTimeout(debounceTimer);
    }, [filtro]);

    // Cargar impuestos y derechos por operación
    useEffect(() => {
        const fetchImpuestosPorOperacion = async () => {
            // Si estamos editando un presupuesto existente (tiene ID), no ejecutar esta llamada
            // Los impuestos ya vienen cargados de la base de datos
            if (isEditing && formData.id) {
                return;
            }

            const operacionId = formData.operacion ? Number(formData.operacion) : null;

            // Solo si está seleccionada operación
            if (!operacionId) {
                setFormData(prev => ({
                    ...prev,
                    impuestos_derechos: []
                }));
                return;
            }

            try {
                setIsLoadingImpuestos(true);
                const data = await api.get(`/ConfiguracionOperacion/GetImpuestoDerechoOperacion?idOperacion=${operacionId}`);

                if (data && data.dataResponse) {
                    // Cargar impuestos sin importes
                    const impuestosFormato = data.dataResponse.map((item: any) => ({
                        id: item.impuestos_derechos_Id.toString(),
                        descripcion: item.descripcion,
                        importe: 0,
                        observaciones: ''
                    }));

                    setFormData(prev => ({
                        ...prev,
                        impuestos_derechos: impuestosFormato
                    }));
                    setImpuestosCalculados(false);
                } else {
                    setFormData(prev => ({
                        ...prev,
                        impuestos_derechos: []
                    }));
                }
            } catch (error) {
                console.error('Error cargando conceptos:', error);
                setFormData(prev => ({
                    ...prev,
                    impuestos_derechos: []
                }));
            } finally {
                setIsLoadingImpuestos(false);
            }
        };

        const debounceTimer = setTimeout(() => {
            fetchImpuestosPorOperacion();
        }, 500);

        return () => clearTimeout(debounceTimer);
    }, [formData.operacion, formData.id, isEditing, api]);

    const handleCalcularHonorarios = async () => {
        const zonaMunicipioId = formData.zona_municipio ? Number(formData.zona_municipio) : null;
        const operacionId = formData.operacion ? Number(formData.operacion) : null;

        if (!zonaMunicipioId || !operacionId) {
            addToast('Selecciona zona/municipio y operación para calcular honorarios', 'error');
            return;
        }

        try {
            setIsLoadingHonorarios(true);
            const data = await api.post(
                `/ConfiguracionTarifaria/CalcularHonorariosPrePrevio?zonaMunicipioId=${zonaMunicipioId}&operacionId=${operacionId}`,
                {}
            );

            if (data && data.dataResponse !== undefined) {
                const honorarios = data.dataResponse;
                setFormData(prev => ({
                    ...prev,
                    honorarios: honorarios
                }));
                addToast('Honorarios calculados exitosamente', 'success');
            } else {
                addToast('No se pudo calcular los honorarios', 'error');
            }
        } catch (error) {
            addToast(error instanceof Error ? error.message : 'Error al calcular honorarios', 'error');
        } finally {
            setIsLoadingHonorarios(false);
        }
    };

    const handleCalcularImpuestos = async () => {
        const zonaMunicipioId = formData.zona_municipio ? Number(formData.zona_municipio) : null;
        const valOperacion = formData.valor_operacion;
        const valAvaluo = formData.valor_avaluo;
        const valCatastral = formData.valor_catastral;

        if (!zonaMunicipioId || (valOperacion === 0 && valAvaluo === 0 && valCatastral === 0)) {
            addToast('Completa todos los datos: Zona/Municipio y al menos un valor', 'error');
            return;
        }

        if (formData.impuestos_derechos.length === 0) {
            addToast('Agrega al menos un trámite para calcular importes', 'error');
            return;
        }

        try {
            setIsLoadingImpuestos(true);

            // Preparar lista de trámites actuales
            const listaImpuestos = formData.impuestos_derechos.map(item => ({
                impuestos_Derechos_Id: Number(item.id),
                importe: 0
            }));

            const queryParams = new URLSearchParams({
                zonaMunicipioId: zonaMunicipioId.toString(),
                valOperacion: valOperacion.toString(),
                valAvaluo: valAvaluo.toString(),
                valCatastral: valCatastral.toString(),
            });

            const data = await api.post(
                `/ConfiguracionTarifaria/CalcularImpuestosDerechosPrePrevio?${queryParams.toString()}`,
                listaImpuestos
            );

            if (data && data.dataResponse && Array.isArray(data.dataResponse)) {
                // Actualizar importes con los valores calculados
                setFormData(prev => ({
                    ...prev,
                    impuestos_derechos: prev.impuestos_derechos.map(item => {
                        const calculado = data.dataResponse.find(
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
        } catch (error) {
            console.error('Error calculando importes:', error);
            const message = error instanceof Error ? error.message : 'Error al calcular importes';
            addToast(message, 'error');
        } finally {
            setIsLoadingImpuestos(false);
        }
    };

    const fetchPresupuestos = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            let endpoint = '/Presupuestos/GetPresupuestosPrevios';
            if (filtroValue) {
                endpoint += `?filtro=${encodeURIComponent(filtroValue)}`;
            }
            const data = await api.get(endpoint);
            if (data) {
                setResultados(data.dataResponse || []);
            } else {
                setSearchError(data?.message || 'No se pudieron cargar los presupuestos previos.');
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
        if ((name === 'operacion' || name === 'cliente' || name === 'zona_municipio') && value) {
            actualValue = Number(value);
        }
        setFormData(prev => ({ ...prev, [name]: actualValue }));
        // La carga de impuestos se maneja automáticamente mediante el useEffect
    };

    const fetchImpuestosDerechos = async () => {
        setIsSearchingImpuestos(true);
        setImpuestosError(null);
        try {
            const data = await api.get('/Catalogos/GetImpuestosDerechos');
            if (data && data.dataResponse) {
                setImpuestosResultados(data.dataResponse || []);
                // Extraer dependencias únicas
                const deps = Array.from(new Set(data.dataResponse.map((item: any) => item.dependencia_Publica)));
                const allDeps = ['Todas', ...deps.filter(d => d) as string[]];
                setDependenciasUnicas(allDeps);
                setActiveDependenciaTab('Todas');
            } else {
                setImpuestosError(data?.message || 'No se pudieron cargar los impuestos');
            }
        } catch (error) {
            console.error('Error cargando impuestos:', error);
            setImpuestosError('No se pudieron cargar los impuestos. Verifica la conexión.');
        } finally {
            setIsSearchingImpuestos(false);
        }
    };

    const handleSelectImpuesto = (impuesto: ImpuestoDerechoItem) => {
        setFormData(prev => {
            const existe = prev.impuestos_derechos.some(item => item.id === impuesto.id.toString());

            if (existe) {
                // Si existe, eliminarlo
                const nuevo = prev.impuestos_derechos.filter(item => item.id !== impuesto.id.toString());
                return { ...prev, impuestos_derechos: nuevo };
            } else {
                // Si no existe, agregarlo
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

        // Toast después de actualizar el estado
        const existe = formData.impuestos_derechos.some(item => item.id === impuesto.id.toString());
        if (existe) {
            addToast(`Trámite "${impuesto.descripcion}" eliminado`, 'info');
        } else {
            addToast(`Trámite "${impuesto.descripcion}" agregado`, 'success');
        }
    };

    const addImpuestoDerechos = () => {
        setShowImpuestosModal(true);
        fetchImpuestosDerechos();
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
        const totalHonorarios = subtotalHonorarios + ivaCalculado - retISR - retIVA;
        const totalPresupuesto = totalHonorarios + totalImpuestos + totalGastos;

        return { subtotalHonorarios, ivaCalculado, retISR, retIVA, totalImpuestos, totalGastos, totalHonorarios, totalPresupuesto };
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
                    chkIVA: formData.incluir_iva,
                    chkRetISR: ret_isr_check,
                    chkRetIVA: ret_iva_check,
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
                ? `/Presupuestos/UpdatePresupuestoPrevio?presupuestoPrevioId=${formData.id}`
                : '/Presupuestos/CreatePresupuestoPrevio';

            const data = isEditing && formData.id
                ? await api.put(url, payload)
                : await api.post(url, payload);

            if (data) {
                setFormData(defaultPresupuestoData);
                setOperacionFiltro('');
                setZonaFiltro('');
                setIsEditing(false);
                setActiveTab('busqueda');
                fetchPresupuestos(filtro);
            }
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
            const data = await api.get(`/Presupuestos/GetPresupuestoPrevioById?presupuestoPrevioId=${presupuesto.id}`);

            if (!data || !data.dataResponse) {
                throw new Error('Error al obtener los detalles del presupuesto');
            }

            const data_response = data.dataResponse;
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

            // Establecer el filtro de zona/municipio con el nombre seleccionado
            const zonaSeleccionada = zonas.find(z => z.id === presupuestoPrevio.zona_Municipio_Id);
            if (zonaSeleccionada) {
                setZonaFiltro(zonaSeleccionada.descripcion);
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
        setZonaFiltro('');
        setIsEditing(false);
        setSaveError(null);
        setActiveTab('busqueda');
    };

    const fetchClientesModal = async (filtroValue: string) => {
        setIsSearchingClientes(true);
        setClienteError(null);
        try {
            let endpoint = '/Clientes/GetClientes';
            if (filtroValue) {
                endpoint += `?filtro=${encodeURIComponent(filtroValue)}`;
            }
            const data = await api.get(endpoint);
            if (data) {
                setClienteResultados(data.dataResponse || []);
            } else {
                setClienteError(data?.message || 'No se encontraron clientes.');
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
            const response = await fetch(`${apiBaseUrl}/Presupuestos/GenerateReciboPresupuestoPrevio?presupuestoPrevioId=${formData.id}`, {
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

                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-200 dark:bg-slate-700 border-b">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold w-16">ID</th>
                                            <th className="px-4 py-2 text-left font-semibold">Nombre</th>
                                            <th className="px-4 py-2 text-left font-semibold">Operación</th>
                                            <th className="px-4 py-2 text-left font-semibold">Fecha Creación</th>
                                            <th className="px-4 py-2 text-center font-semibold w-20">Estatus</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {isSearching ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                    Cargando presupuestos previos...
                                                </td>
                                            </tr>
                                        ) : resultados.length === 0 ? (
                                            <tr>
                                                <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                    No se encontraron presupuestos previos.
                                                </td>
                                            </tr>
                                        ) : (
                                            resultados.map((presupuesto) => (
                                                <tr
                                                    key={presupuesto.id}
                                                    className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer"
                                                    onClick={() => handleSelectPresupuesto(presupuesto)}
                                                >
                                                    <td className="px-4 py-2 font-mono text-sm">{presupuesto.id}</td>
                                                    <td className="px-4 py-2">{presupuesto.nombre} {presupuesto.apellido_Paterno} {presupuesto.apellido_Materno}</td>
                                                    <td className="px-4 py-2">
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                                            {presupuesto.operacion}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-sm">{presupuesto.fecha_Creacion}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                                            presupuesto.activo
                                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                                                        }`}>
                                                            {presupuesto.activo ? 'Activo' : 'Inactivo'}
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
                                <div className="border-2 border-blue-200 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow space-y-4 col-span-2">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-blue-600 text-white p-3 rounded-lg">
                                            <Plus className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Datos del presupuesto</h3>
                                    </div>
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
                                                        className="flex-1 bg-white dark:bg-slate-900/50"
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
                                                        className="w-full pr-10 bg-white dark:bg-slate-900/50"
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
                                            <div className="space-y-2 relative">
                                                <SimpleLabel htmlFor="zona_municipio">Zona o Municipio</SimpleLabel>
                                                <div className="relative">
                                                    <Input
                                                        id="zona_municipio"
                                                        value={zonaFiltro}
                                                        onChange={(e) => {
                                                            setZonaFiltro(e.target.value);
                                                            setShowZonaDropdown(true);
                                                        }}
                                                        onFocus={() => setShowZonaDropdown(true)}
                                                        placeholder="Buscar zona o municipio..."
                                                        disabled={isLoadingZonas}
                                                        className="bg-white dark:bg-slate-900/50"
                                                    />
                                                    {zonaFiltro && (
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setZonaFiltro('');
                                                                handleSelectChange('zona_municipio', '');
                                                                setShowZonaDropdown(false);
                                                            }}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                                {showZonaDropdown && zonas.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg z-20 max-h-48 overflow-y-auto">
                                                        {zonas
                                                            .filter(zona =>
                                                                zona.descripcion
                                                                    .toLowerCase()
                                                                    .includes(zonaFiltro.toLowerCase())
                                                            )
                                                            .map(zona => (
                                                                <button
                                                                    key={zona.id}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleSelectChange('zona_municipio', zona.id.toString());
                                                                        setZonaFiltro(zona.descripcion);
                                                                        setShowZonaDropdown(false);
                                                                    }}
                                                                    className="w-full text-left px-3 py-2 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-sm"
                                                                >
                                                                    {zona.descripcion}
                                                                </button>
                                                            ))}
                                                    </div>
                                                )}
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
                                                    className="w-full px-3 py-2 border rounded-md bg-white dark:bg-slate-900/50 border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
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
                                                    name="valor_operacion"
                                                    type="number"
                                                    step="0.01"
                                                    value={formData.valor_operacion}
                                                    onChange={handleInputChange}
                                                    placeholder="0.00"
                                                    className="text-right font-bold text-green-600 bg-white dark:bg-slate-900/50"
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
                                                    className="text-right font-bold text-green-600 bg-white dark:bg-slate-900/50"
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
                                                    className="text-right font-bold text-green-600 bg-white dark:bg-slate-900/50"
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
                                            disabled={isLoadingHonorarios}
                                            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold shadow-md hover:shadow-lg transition-all"
                                        >
                                            {isLoadingHonorarios ? (<Loader2 className="h-3 w-3 mr-1 animate-spin" />) : null}
                                            Calcular
                                        </Button>
                                    </div>

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
                                                    className="text-right font-bold border-0 rounded-none bg-white dark:bg-slate-900/50"
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
                                                    className="text-right font-bold border-0 rounded-none bg-white dark:bg-slate-900/50"
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
                                                    className="text-right font-bold text-green-600 border-0 rounded-none bg-white dark:bg-slate-900/50"
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
                                                className="text-right font-bold text-red-600 border bg-white dark:bg-slate-900/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Sub Total</label>
                                            <Input
                                                readOnly
                                                value={formatCurrency(formData.incluir_iva ? ((formData.honorarios - formData.descuento) * 1.16) : (formData.honorarios - formData.descuento))}
                                                className="text-right font-bold text-blue-600 border bg-white dark:bg-slate-900/50"
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
                                                className="text-right font-bold text-green-600 border bg-white dark:bg-slate-900/50"
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
                                                className="text-right font-bold text-green-600 border bg-white dark:bg-slate-900/50"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Total Honorarios</label>
                                            <div className="px-3 py-2 border rounded-md text-right font-bold text-yellow-500">
                                                {(() => {
                                                    const t = calcularTotales();
                                                    return formatCurrency(t.subtotalHonorarios + t.ivaCalculado - t.retISR - t.retIVA);
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
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-lg font-bold text-gray-900">Impuestos y Derechos</h3>
                                                {isLoadingImpuestos && <Loader2 className="h-4 w-4 animate-spin" />}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button onClick={addImpuestoDerechos} size="sm" disabled={isLoadingImpuestos} className="bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-md hover:shadow-lg transition-all">
                                                <Plus className="h-3 w-3 mr-1" /> Agregar Trámite
                                            </Button>
                                            <Button onClick={handleCalcularImpuestos} size="sm" disabled={isLoadingImpuestos} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition-all">
                                                {isLoadingImpuestos ? (<Loader2 className="h-3 w-3 mr-1 animate-spin" />) : null}
                                                Calcular
                                            </Button>
                                        </div>
                                    </div>

                                    {formData.impuestos_derechos.length === 0 ? (
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
                                                        {formData.impuestos_derechos.map((item) => (
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
                                                                        placeholder="0.00"
                                                                        className="text-right text-sm h-8 font-bold text-green-600 bg-white dark:bg-slate-900/50"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3">
                                                                    <Input
                                                                        value={item.observaciones || ''}
                                                                        onChange={(e) => updateImpuestoDerechos(item.id, 'observaciones', e.target.value)}
                                                                        placeholder="Observaciones"
                                                                        className="w-full text-sm h-8 bg-white dark:bg-slate-900/50"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <Button
                                                                        onClick={() => removeImpuestoDerechos(item.id)}
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="h-6 w-6 p-0"
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
                                        <Button onClick={addGastoNotarial} size="sm" className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold shadow-md hover:shadow-lg transition-all">
                                            <Plus className="h-3 w-3 mr-1" /> Agregar Concepto
                                        </Button>
                                    </div>

                                    {formData.gastos_notariales.length === 0 ? (
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
                                                        {formData.gastos_notariales.map((item) => (
                                                            <tr key={item.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors">
                                                                <td className="px-4 py-3">
                                                                    <Input
                                                                        value={item.descripcion}
                                                                        onChange={(e) => updateGastoNotarial(item.id, 'descripcion', e.target.value)}
                                                                        placeholder="Concepto"
                                                                        className="w-full text-sm h-8 bg-white dark:bg-slate-900/50"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-right">
                                                                    <Input
                                                                        type="number"
                                                                        step="0.01"
                                                                        value={item.importe}
                                                                        onChange={(e) => updateGastoNotarial(item.id, 'importe', e.target.value)}
                                                                        placeholder="0.00"
                                                                        className="text-right text-sm h-8 font-bold text-green-600 bg-white dark:bg-slate-900/50"
                                                                    />
                                                                </td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <Button
                                                                        onClick={() => removeGastoNotarial(item.id)}
                                                                        size="sm"
                                                                        variant="destructive"
                                                                        className="h-6 w-6 p-0"
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
                                    {isEditing && (
                                        <>
                                            <Button
                                                onClick={handleCancelEdit}
                                                className="border-2 border-gray-400 text-gray-700 hover:bg-gray-100 font-semibold shadow-md hover:shadow-lg transition-all"
                                                variant="outline"
                                            >
                                                <X className="h-4 w-4 mr-2" />
                                                Cancelar
                                            </Button>
                                            <Button
                                                onClick={handleViewPdf}
                                                disabled={isLoadingPdf || !formData.id}
                                                className="border-2 border-blue-400 text-blue-700 hover:bg-blue-50 font-semibold shadow-md hover:shadow-lg transition-all"
                                                variant="outline"
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
                                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold shadow-lg hover:shadow-xl transition-all px-6"
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
                                        className="pr-10 bg-white dark:bg-slate-900/50"
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
                        <div className="border rounded-lg overflow-hidden m-2
                        ">
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
                                    {isSearchingClientes ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                Buscando clientes...
                                            </td>
                                        </tr>
                                    ) : clienteResultados.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="text-center py-8 text-muted-foreground px-4">
                                                No se encontraron clientes.
                                            </td>
                                        </tr>
                                    ) : (
                                        clienteResultados.map((cliente) => (
                                            <tr key={cliente.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                                                <td className="px-4 py-2 font-medium">{cliente.nombre} {cliente.apellido_Paterno} {cliente.apellido_Materno}</td>
                                                <td className="px-4 py-2 font-mono text-sm">{cliente.rfc}</td>
                                                <td className="px-4 py-2 font-mono text-sm">{cliente.curp}</td>
                                                <td className="px-4 py-2">{cliente.tipo_Cliente}</td>
                                                <td className="px-4 py-2 text-center">
                                                    <Button
                                                        onClick={() => handleSelectClienteFromModal(cliente)}
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

            {/* MODAL DE BÚSQUEDA DE IMPUESTOS Y DERECHOS */}
            {showImpuestosModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                    <div className="bg-background border rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] flex flex-col">
                        {/* Header */}
                        <div className="border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                Agregar Tramite
                            </h2>
                            <button
                                onClick={() => setShowImpuestosModal(false)}
                                className="text-muted-foreground hover:text-foreground"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Body - Búsqueda */}
                        <div className="border-b px-6 py-4 space-y-3">
                            <div className="flex gap-2">
                                <div className="relative flex-1 max-w-sm">
                                    <Input
                                        value={impuestosFiltro}
                                        onChange={(e) => setImpuestosFiltro(e.target.value)}
                                        placeholder="Filtrar por descripción..."
                                        className="bg-white dark:bg-slate-900/50"
                                    />
                                    {impuestosFiltro && (
                                        <button
                                            type="button"
                                            onClick={() => setImpuestosFiltro('')}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            {impuestosError && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-md border bg-red-50 border-red-200 text-red-800 text-sm">
                                    <AlertCircle className="h-4 w-4 shrink-0" />
                                    <span>{impuestosError}</span>
                                </div>
                            )}
                        </div>

                        {/* Tabs por dependencia */}
                        {dependenciasUnicas.length > 0 && (
                            <div className="border-b px-6 pt-4 overflow-x-auto">
                                <Tabs value={activeDependenciaTab} onValueChange={setActiveDependenciaTab}>
                                    <TabsList className="inline-flex w-max bg-transparent">
                                        {dependenciasUnicas.map((dep) => (
                                            <TabsTrigger key={dep} value={dep} className="rounded-none border-b-2 border-b-transparent data-[state=active]:border-b-amber-600 data-[state=active]:shadow-none whitespace-nowrap">
                                                <span className="truncate text-xs sm:text-sm">{dep}</span>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                </Tabs>
                            </div>
                        )}

                        {/* Table */}
                        <div className="border rounded-lg overflow-hidden m-2">
                            <div className="max-h-[400px] overflow-y-auto overflow-x-auto">
                                {isSearchingImpuestos ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                        <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                        Cargando trámites...
                                    </div>
                                ) : (
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-200 dark:bg-slate-700 border-b sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold w-12">ID</th>
                                            <th className="px-4 py-2 text-left font-semibold">Descripción</th>
                                            <th className="px-4 py-2 text-left font-semibold">Tipo</th>
                                            <th className="px-4 py-2 text-center font-semibold w-20">Agregar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {impuestosResultados
                                            .filter((item) => {
                                                const matchesFiltro = impuestosFiltro === '' || item.descripcion.toLowerCase().includes(impuestosFiltro.toLowerCase());
                                                const matchesDependencia = activeDependenciaTab === 'Todas' || item.dependencia_Publica === activeDependenciaTab;
                                                return matchesFiltro && matchesDependencia;
                                            })
                                            .map((impuesto) => (
                                                <tr key={impuesto.id} className="border-b hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors cursor-pointer">
                                                    <td className="px-4 py-2 font-mono text-sm">{impuesto.id}</td>
                                                    <td className="px-4 py-2 font-medium">{impuesto.descripcion}</td>
                                                    <td className="px-4 py-2">{impuesto.tipo}</td>
                                                    <td className="px-4 py-2 text-center">
                                                        {(() => {
                                                            const existe = formData.impuestos_derechos.some(item => item.id === impuesto.id.toString());
                                                            return (
                                                                <Button
                                                                    onClick={() => handleSelectImpuesto(impuesto)}
                                                                    size="sm"
                                                                    className={existe ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}
                                                                >
                                                                    {existe ? (
                                                                        <X className="h-4 w-4" />
                                                                    ) : (
                                                                        <Plus className="h-4 w-4" />
                                                                    )}
                                                                </Button>
                                                            );
                                                        })()}
                                                    </td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                                )}
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="border-t px-6 py-4 flex justify-end gap-2">
                            <Button
                                onClick={() => setShowImpuestosModal(false)}
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
