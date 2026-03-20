import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, DollarSign } from 'lucide-react';
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
    cliente: string;
    operacion: string;
    zona_municipio: string;
    observaciones: string;
    valor_operacion: number;
    valor_avaluo: number;
    valor_catastral: number;
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

interface ImpuestoDerechoAPI {
    id: number;
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
                const response = await fetch('https://localhost:44327/api/Clientes/GetClientes', {
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
                const response = await fetch('https://localhost:44327/api/Catalogos/GetOperaciones', {
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

    const fetchPresupuestos = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const url = new URL('https://localhost:44327/api/Presupuestos/GetPresupuestosPrevios');
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
        setFormData(prev => ({ ...prev, [name]: value }));

        // Si se selecciona una operación, cargar impuestos y derechos
        if (name === 'operacion' && value) {
            const operacionSeleccionada = operaciones.find(op => op.descripcion === value);
            if (operacionSeleccionada) {
                try {
                    setIsLoadingImpuestos(true);
                    const url = `https://localhost:44327/api/ConfiguracionOperacion/GetImpuestoDerechoOperacion?idOperacion=${operacionSeleccionada.id}`;
                    const response = await fetch(url, {
                        headers: { 'Content-Type': 'application/json' },
                    });
                    const data = await response.json();

                    if (response.ok && data.dataResponse) {
                        // Mapear los datos del API al formato de impuestos_derechos
                        const impuestosFormato = data.dataResponse.map((item: ImpuestoDerechoAPI) => ({
                            id: item.id.toString(),
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

            const payload = {
                cliente: formData.cliente,
                operacion: formData.operacion,
                zona_municipio: formData.zona_municipio,
                observaciones: formData.observaciones,
                valor_operacion: formData.valor_operacion,
                valor_avaluo: formData.valor_avaluo,
                valor_catastral: formData.valor_catastral,
                honorarios: formData.honorarios,
                descuento: formData.descuento,
                incluir_iva: formData.incluir_iva,
                iva: totales.ivaCalculado,
                retencion_isr: totales.retISR,
                retencion_iva: totales.retIVA,
                impuestos_derechos: formData.impuestos_derechos,
                gastos_notariales: formData.gastos_notariales,
                activo: formData.activo,
            };

            const url = isEditing && formData.id
                ? `https://localhost:44327/api/Presupuestos/UpdatePresupuestoPrevio?id=${formData.id}`
                : 'https://localhost:44327/api/Presupuestos/CreatePresupuestoPrevio';

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
            setFormData({
                id: presupuesto.id,
                cliente: presupuesto.nombre,
                operacion: presupuesto.operacion,
                zona_municipio: '',
                observaciones: `Creado: ${presupuesto.fecha_Creacion}`,
                valor_operacion: 0,
                valor_avaluo: 0,
                valor_catastral: 0,
                honorarios: 0,
                descuento: 0,
                incluir_iva: false,
                iva: 0,
                retencion_isr: 0,
                retencion_iva: 0,
                impuestos_derechos: [],
                gastos_notariales: [],
                activo: presupuesto.activo,
            });
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
        setIsEditing(false);
        setSaveError(null);
        setActiveTab('busqueda');
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
                <div className="pb-6 border-b">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-green-600 p-3 text-white">
                            <DollarSign className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Presupuesto Previo</h1>
                            <p className="text-muted-foreground">Gestión de presupuestos previos de expedientes</p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-4">
                        <TabsTrigger value="busqueda">Búsqueda</TabsTrigger>
                        <TabsTrigger value="formulario">
                            {isEditing ? 'Editar Presupuesto' : 'Crear Presupuesto'}
                        </TabsTrigger>
                    </TabsList>

                    {/* ── PESTAÑA 1: BÚSQUEDA ── */}
                    <TabsContent value="busqueda" className="space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                    placeholder="Buscar por nombre, operación..."
                                    className="pr-10"
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
                            <Button type="submit" disabled={isSearching} className="bg-green-600 hover:bg-green-700">
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
                                                <select
                                                    id="cliente"
                                                    name="cliente"
                                                    value={formData.cliente}
                                                    onChange={(e) => handleSelectChange('cliente', e.target.value)}
                                                    className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                                                >
                                                    <option value="">Selecciona un cliente</option>
                                                    {clientes.map((cliente) => (
                                                        <option key={cliente.id} value={`${cliente.nombre} ${cliente.apellido_Paterno} ${cliente.apellido_Materno}`}>
                                                            {cliente.nombre} {cliente.apellido_Paterno} {cliente.apellido_Materno}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="operacion">Operación</RequiredLabel>
                                                <select
                                                    id="operacion"
                                                    name="operacion"
                                                    value={formData.operacion}
                                                    onChange={(e) => handleSelectChange('operacion', e.target.value)}
                                                    disabled={isLoadingOperaciones || isEditing}
                                                    className="w-full px-3 py-2 border rounded-md bg-background border-input placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    <option value="">Selecciona una operación</option>
                                                    {operaciones.map((operacion) => (
                                                        <option key={operacion.id} value={operacion.descripcion}>
                                                            {operacion.descripcion}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
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
                                            <Input
                                                name="honorarios"
                                                type="number"
                                                step="0.01"
                                                value={formData.honorarios}
                                                onChange={handleInputChange}
                                                className="text-right font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Descuento</label>
                                            <Input
                                                name="descuento"
                                                type="number"
                                                step="0.01"
                                                value={formData.descuento}
                                                onChange={handleInputChange}
                                                className="text-right font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Subtotal Honorarios</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={(formData.honorarios - formData.descuento).toFixed(2)}
                                                disabled
                                                className="text-right font-bold text-green-600"
                                            />
                                        </div>
                                    </div>

                                    {/* FILA 2: CHECK IVA - VALOR IVA - SUBTOTAL IVA */}
                                    <div className="grid grid-cols-3 gap-4 mb-4">
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
                                                name="iva"
                                                type="number"
                                                step="0.01"
                                                value={formData.incluir_iva ? ((formData.honorarios - formData.descuento) * 0.16).toFixed(2) : '0.00'}
                                                disabled
                                                className="text-right font-bold text-red-600 border"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Sub Total</label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={formData.incluir_iva ? ((formData.honorarios - formData.descuento) * 1.16).toFixed(2) : (formData.honorarios - formData.descuento).toFixed(2)}
                                                disabled
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
                                                name="retencion_isr"
                                                type="number"
                                                step="0.01"
                                                value={ret_isr_check ? (calcularTotales().retISR).toFixed(2) : '0.00'}
                                                disabled
                                                placeholder="0.00"
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
                                                name="retencion_iva"
                                                type="number"
                                                step="0.01"
                                                value={ret_iva_check && formData.incluir_iva ? (calcularTotales().retIVA).toFixed(2) : '0.00'}
                                                disabled
                                                placeholder="0.00"
                                                className="text-right font-bold text-green-600 border"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-sm font-medium">Total Honorarios</label>
                                            <div className="px-3 py-2 border rounded-md text-right font-bold text-yellow-500">
                                                ${(calcularTotales().totalPresupuesto).toFixed(2)}
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
                                        <div className="space-y-4">
                                            {formData.impuestos_derechos.map((item) => (
                                                <div key={item.id} className="grid grid-cols-12 gap-2 p-3 border rounded-lg bg-background/30">
                                                    <div className="col-span-5">
                                                        <label className="text-xs font-medium text-muted-foreground">Descripción</label>
                                                        <Input
                                                            value={item.descripcion}
                                                            placeholder="Descripción"
                                                            disabled
                                                            className="w-full bg-muted"
                                                        />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-xs font-medium text-muted-foreground">Importe</label>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            value={item.importe}
                                                            onChange={(e) => updateImpuestoDerechos(item.id, 'importe', e.target.value)}
                                                            placeholder="0.00"
                                                            className="text-right w-full"
                                                        />
                                                    </div>
                                                    <div className="col-span-4">
                                                        <label className="text-xs font-medium text-muted-foreground">Observaciones</label>
                                                        <Input
                                                            value={item.observaciones || ''}
                                                            onChange={(e) => updateImpuestoDerechos(item.id, 'observaciones', e.target.value)}
                                                            placeholder="Observaciones"
                                                            className="w-full"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 flex items-end">
                                                        <Button
                                                            onClick={() => removeImpuestoDerechos(item.id)}
                                                            size="sm"
                                                            variant="destructive"
                                                            className="w-full"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
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
                                        <div className="space-y-2">
                                            {formData.gastos_notariales.map((item) => (
                                                <div key={item.id} className="flex gap-2">
                                                    <Input
                                                        value={item.descripcion}
                                                        placeholder="Concepto"
                                                        disabled
                                                        className="flex-1 bg-muted"
                                                    />
                                                    <Input
                                                        type="number"
                                                        step="0.01"
                                                        value={item.importe}
                                                        onChange={(e) => updateGastoNotarial(item.id, 'importe', e.target.value)}
                                                        placeholder="Importe"
                                                        className="w-32 text-right"
                                                    />
                                                    <Button
                                                        onClick={() => removeGastoNotarial(item.id)}
                                                        size="sm"
                                                        variant="destructive"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
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
                                                    ${totales.totalGastos.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="border rounded-lg p-4 bg-background/50">
                                                <p className="text-sm font-medium text-muted-foreground">Total Impuestos y Derechos</p>
                                                <p className="text-2xl font-bold text-yellow-500">
                                                    ${totales.totalImpuestos.toFixed(2)}
                                                </p>
                                            </div>
                                            <div className="border rounded-lg p-4 bg-red-50">
                                                <p className="text-sm font-medium text-muted-foreground">TOTAL PRESUPUESTO</p>
                                                <p className="text-3xl font-bold text-red-600">
                                                    ${totales.totalPresupuesto.toFixed(2)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })()}

                                {/* BOTONES DE ACCIÓN */}
                                <div className="flex gap-2 justify-end pt-4 border-t">
                                    {isEditing && (
                                        <Button variant="outline" onClick={handleCancelEdit}>
                                            <X className="h-4 w-4 mr-2" />
                                            Cancelar
                                        </Button>
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

                                {/* CHECKBOX ACTIVO */}
                                <div className="flex items-center space-x-2 pt-2">
                                    <input
                                        id="activo"
                                        name="activo"
                                        type="checkbox"
                                        checked={formData.activo}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 border border-primary rounded"
                                    />
                                    <label htmlFor="activo" className="cursor-pointer text-sm">Activo</label>
                                </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
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
