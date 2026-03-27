import { Head } from '@inertiajs/react';
import { X, Plus, AlertCircle, Search, Loader2, Users, User, Calendar, MapPin, Phone, FileText } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';

interface ClienteData {
    id?: string | number;
    // Datos Personales
    tipo: 'fisica' | 'juridica';
    nombre: string;
    apellido_paterno: string;
    apellido_materno: string;
    alias: string;
    rfc: string;
    curp: string;
    fecha_nacimiento: string;
    regimen_fiscal: string;

    // Lugar de Nacimiento
    pais_nacimiento: string;
    nacionalidad: string;
    ciudad_nacimiento: string;
    municipio_nacimiento: string;
    estado_nacimiento: string;

    // Domicilio Particular
    cp: string;
    colonia: string;
    calle: string;
    numero_exterior: string;
    numero_interior: string;
    manzana: string;
    lote: string;
    ciudad: string;
    municipio: string;
    estado: string;
    pais: string;
    email_1: string;
    email_2: string;
    tel_particular: string;
    tel_oficina: string;
    tel_movil: string;

    // Identificación
    doc_identificacion: string;
    numero_identificacion: string;
    edad: string;
    sexo: 'M' | 'F' | '';
    idmex: string;
    ocr: string;
    autoridad_emisora: string;
    vigencia: string;
    ocupacion: string;
    estado_civil: string;

    // Domicilio Fiscal
    domicilio_fiscal_igual: boolean;
    domicilio_fiscal_direccion: string;
    domicilio_fiscal_calle: string;
    domicilio_fiscal_num_ext: string;
    domicilio_fiscal_num_int: string;
    domicilio_fiscal_mz: string;
    domicilio_fiscal_lote: string;
    domicilio_fiscal_ciudad: string;
    domicilio_fiscal_colonia: string;
    domicilio_fiscal_cp: string;
    domicilio_fiscal_estado: string;
    domicilio_fiscal_pais: string;

    // Datos del Cónyuge (cuando estado_civil === 'casado')
    nombre_conyuge: string;
    apellido_paterno_conyuge: string;
    apellido_materno_conyuge: string;
    doc_identificacion_conyuge: string;
    numero_doc_conyuge: string;
    autoridad_emisora_conyuge: string;
    regimen_conyugal: string;

    observaciones: string;
    activo: boolean;
}

interface ClienteBusqueda {
    id: number;
    nombre: string;
    apellido_Paterno: string;
    apellido_Materno: string;
    alias: string;
    rfc: string;
    curp: string;
    correo: string;
    telefono: string;
    empresa: string;
    observaciones: string | null;
    activo: boolean;
}

const defaultClienteData: ClienteData = {
    tipo: 'fisica',
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    alias: '',
    rfc: '',
    curp: '',
    fecha_nacimiento: '',
    regimen_fiscal: '',

    pais_nacimiento: 'Mexico',
    nacionalidad: '',
    ciudad_nacimiento: '',
    municipio_nacimiento: '',
    estado_nacimiento: '',

    cp: '',
    colonia: '',
    calle: '',
    numero_exterior: '',
    numero_interior: '',
    manzana: '',
    lote: '',
    ciudad: '',
    municipio: '',
    estado: '',
    pais: '',
    email_1: '',
    email_2: '',
    tel_particular: '',
    tel_oficina: '',
    tel_movil: '',

    doc_identificacion: '',
    numero_identificacion: '',
    edad: '',
    sexo: '',
    idmex: '',
    ocr: '',
    autoridad_emisora: '',
    vigencia: '',
    ocupacion: '',
    estado_civil: '',

    domicilio_fiscal_igual: true,
    domicilio_fiscal_direccion: '',
    domicilio_fiscal_calle: '',
    domicilio_fiscal_num_ext: '',
    domicilio_fiscal_num_int: '',
    domicilio_fiscal_mz: '',
    domicilio_fiscal_lote: '',
    domicilio_fiscal_ciudad: '',
    domicilio_fiscal_colonia: '',
    domicilio_fiscal_cp: '',
    domicilio_fiscal_estado: '',
    domicilio_fiscal_pais: '',

    nombre_conyuge: '',
    apellido_paterno_conyuge: '',
    apellido_materno_conyuge: '',
    doc_identificacion_conyuge: '',
    numero_doc_conyuge: '',
    autoridad_emisora_conyuge: '',
    regimen_conyugal: '',

    observaciones: '',
    activo: true,
};

export default function ControlNotarialClientes() {
    // --- Estado pestaña Búsqueda ---
    const [filtro, setFiltro] = useState('');
    const [resultados, setResultados] = useState<ClienteBusqueda[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState<string | null>(null);

    // --- Control de pestaña activa ---
    const [activeTab, setActiveTab] = useState('busqueda');
    const [activeFormTab, setActiveFormTab] = useState('datos');
    const [domicilioType, setDomicilioType] = useState<'particular' | 'fiscal'>('particular');

    // --- Estado pestaña Formulario ---
    const [formData, setFormData] = useState<ClienteData>(defaultClienteData);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [isLoadingCliente, setIsLoadingCliente] = useState(false);
    const { addToast } = useToast();

    // Cargar clientes al montar (filtro vacío = todos)
    useEffect(() => {
        fetchClientes('');
    }, []);

    const fetchClientes = async (filtroValue: string) => {
        setIsSearching(true);
        setSearchError(null);
        try {
            const url = new URL('https://lauran-parthenocarpic-albertina.ngrok-free.dev/api/Clientes/GetClientes');
            if (filtroValue.trim()) {
                url.searchParams.append('filtro', filtroValue);
            }

            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Mapear respuesta API a ClienteBusqueda
            const clientesList: ClienteBusqueda[] = data.dataResponse.map((cliente: any) => ({
                id: cliente.id,
                nombre: cliente.nombre || '',
                apellido_Paterno: cliente.apellido_Paterno || '',
                apellido_Materno: cliente.apellido_Materno || '',
                alias: cliente.alias || '',
                rfc: cliente.rfc || '',
                curp: cliente.curp || '',
                correo: '', // No viene en la API
                telefono: '', // No viene en la API
                empresa: '', // No viene en la API
                observaciones: null,
                activo: cliente.activo || false,
            }));

            setResultados(clientesList);
        } catch (error) {
            console.error('Error buscando clientes:', error);
            setSearchError('No se pudieron cargar los clientes. Verifica la conexión con el servidor.');
        } finally {
            setIsSearching(false);
        }
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchClientes(filtro);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, type } = e.target;
        let value: any = e.target.value;

        if (type === 'checkbox') {
            value = (e.target as HTMLInputElement).checked;
        } else if (type === 'radio') {
            value = (e.target as HTMLInputElement).value;
        }

        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSelectCliente = async (cliente: ClienteBusqueda) => {
        setIsLoadingCliente(true);
        try {
            // Llamar a la API para obtener los datos completos del cliente
            const response = await fetch(
                `https://lauran-parthenocarpic-albertina.ngrok-free.dev/api/Clientes/GetClientesById?clienteId=${cliente.id}`,
                {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            const clienteData = data.dataResponse[0]?.cliente || {};
            const domicilios = data.dataResponse[0]?.domicilio || [];
            const identificaciones = data.dataResponse[0]?.identificacion || [];

            // Obtener domicilios por tipo
            const domicilioParticular = domicilios.find((d: any) => d.tipo_Domicilio?.toLowerCase() === 'particular') || domicilios[0] || {};
            const domicilioFisico = domicilios.find((d: any) => d.tipo_Domicilio?.toLowerCase() === 'fiscal') || {};

            // Obtener primer documento de identificación
            const docIdentificacion = identificaciones[0] || {};

            // Mapear tipo de cliente
            const tipoCliente = clienteData.tipo_Cliente?.toLowerCase() === 'física' ? 'fisica' : 'juridica';

            // Mapear sexo
            const mapearSexo = (sexo: string): 'M' | 'F' | '' => {
                if (!sexo) return '';
                return sexo.toUpperCase().startsWith('M') ? 'M' : 'F';
            };

            // Mapear estado civil
            const mapearEstadoCivil = (estado: string): string => {
                if (!estado) return '';
                const lower = estado.toLowerCase();
                if (lower.includes('soltero')) return 'soltero';
                if (lower.includes('casado')) return 'casado';
                if (lower.includes('divorciado')) return 'divorciado';
                if (lower.includes('viudo')) return 'viudo';
                if (lower.includes('unión')) return 'unión-libre';
                return '';
            };

            // Parsear fecha (formato: "11-12-1998")
            const parsearFecha = (fechaStr: string): string => {
                if (!fechaStr) return '';
                const partes = fechaStr.split('-');
                if (partes.length === 3) {
                    return `${partes[2]}-${partes[1]}-${partes[0]}`;
                }
                return '';
            };

            // Llenar el formulario con datos completos
            setFormData({
                id: clienteData.id,
                tipo: tipoCliente,
                nombre: clienteData.nombre ?? '',
                apellido_paterno: clienteData.apellido_Paterno ?? '',
                apellido_materno: clienteData.apellido_Materno ?? '',
                alias: clienteData.alias ?? '',
                rfc: clienteData.rfc ?? '',
                curp: clienteData.curp ?? '',
                fecha_nacimiento: parsearFecha(clienteData.fecha_Nacimiento) || '',
                regimen_fiscal: '',

                pais_nacimiento: clienteData.pais_Nacimiento ?? 'MEXICO',
                nacionalidad: clienteData.nacionalidad ?? '',
                ciudad_nacimiento: clienteData.ciudad_Nacimiento ?? '',
                municipio_nacimiento: clienteData.municipio_Nacimiento ?? '',
                estado_nacimiento: clienteData.estado_Nacimiento ?? '',

                cp: domicilioParticular.codigo_Postal ?? '',
                colonia: domicilioParticular.colonia ?? '',
                calle: domicilioParticular.calle ?? '',
                numero_exterior: domicilioParticular.numero_Exterior ?? '',
                numero_interior: domicilioParticular.numero_Interior ?? '',
                manzana: domicilioParticular.manzana ?? '',
                lote: domicilioParticular.lote ?? '',
                ciudad: domicilioParticular.ciudad ?? '',
                municipio: domicilioParticular?.municipio ?? '',
                estado: domicilioParticular.estado ?? '',
                pais: domicilioParticular.pais ?? '',
                email_1: clienteData.email1 ?? '',
                email_2: clienteData.email2 ?? '',
                tel_particular: clienteData.telefono_Particular ?? '',
                tel_oficina: clienteData.telefono_Oficina ?? '',
                tel_movil: clienteData.telefono_Movil ?? '',

                doc_identificacion: docIdentificacion.tipo_Identificacion ?? '',
                numero_identificacion: docIdentificacion.numero ?? '',
                edad: clienteData.edad?.toString() ?? '',
                sexo: mapearSexo(clienteData.sexo),
                idmex: docIdentificacion.idMex ?? '',
                ocr: docIdentificacion.ocr ?? '',
                autoridad_emisora: docIdentificacion.emisor ?? '',
                vigencia: docIdentificacion.vigencia ? docIdentificacion.vigencia.split('T')[0] : '',
                ocupacion: clienteData.ocupacion ?? '',
                estado_civil: mapearEstadoCivil(clienteData.estado_Civil),

                domicilio_fiscal_igual: true,
                domicilio_fiscal_direccion: '',
                domicilio_fiscal_calle: domicilioFisico.calle ?? '',
                domicilio_fiscal_num_ext: domicilioFisico.numero_Exterior ?? '',
                domicilio_fiscal_num_int: domicilioFisico.numero_Interior ?? '',
                domicilio_fiscal_mz: domicilioFisico.manzana ?? '',
                domicilio_fiscal_lote: domicilioFisico.lote ?? '',
                domicilio_fiscal_ciudad: domicilioFisico.ciudad ?? '',
                domicilio_fiscal_colonia: domicilioFisico.colonia ?? '',
                domicilio_fiscal_cp: domicilioFisico.codigo_Postal ?? '',
                domicilio_fiscal_estado: domicilioFisico.estado ?? '',
                domicilio_fiscal_pais: domicilioFisico.pais ?? '',

                // Datos del cónyuge
                nombre_conyuge: data.dataResponse[0]?.conyuge?.[0]?.nombre ?? '',
                apellido_paterno_conyuge: data.dataResponse[0]?.conyuge?.[0]?.apellido_Paterno ?? '',
                apellido_materno_conyuge: data.dataResponse[0]?.conyuge?.[0]?.apellido_Materno ?? '',
                doc_identificacion_conyuge: data.dataResponse[0]?.conyuge?.[0]?.tipo_Identificacion ?? '',
                numero_doc_conyuge: data.dataResponse[0]?.conyuge?.[0]?.numero_Identificacion ?? '',
                autoridad_emisora_conyuge: data.dataResponse[0]?.conyuge?.[0]?.autoridad_Emisora ?? '',
                regimen_conyugal: data.dataResponse[0]?.conyuge?.[0]?.regimen_Conyugal ?? '',

                observaciones: '',
                activo: clienteData.activo ?? false,
            });
            setIsEditing(true);
            setActiveTab('formulario');
        } catch (error) {
            console.error('Error al cargar cliente:', error);
            const message = error instanceof Error ? error.message : 'Error al cargar el cliente';
            addToast(message, 'error');
            setIsEditing(false);
            setActiveTab('busqueda');
        } finally {
            setIsLoadingCliente(false);
        }
    };

    const handleCopyDomicilioData = () => {
        setFormData(prev => ({
            ...prev,
            domicilio_fiscal_calle: prev.calle,
            domicilio_fiscal_num_ext: prev.numero_exterior,
            domicilio_fiscal_num_int: prev.numero_interior,
            domicilio_fiscal_mz: prev.manzana,
            domicilio_fiscal_lote: prev.lote,
            domicilio_fiscal_ciudad: prev.municipio,
            domicilio_fiscal_colonia: prev.colonia,
            domicilio_fiscal_cp: prev.cp,
            domicilio_fiscal_estado: prev.estado,
            domicilio_fiscal_pais: prev.pais,
        }));
    };

    const handleAddCliente = async () => {
        if (!formData.nombre || !formData.apellido_paterno || !formData.email_1) {
            addToast(
                'Completa los campos obligatorios: Nombre, Apellido Paterno y Email',
                'error'
            );
            return;
        }

        try {
            setIsSaving(true);
            setSaveError(null);

            // Construir objeto cliente
            const cliente = {
                id: formData.id ? parseInt(String(formData.id)) : 0,
                tipo_Cliente: formData.tipo || 'fisica',
                alias: formData.alias || '',
                nombre: formData.nombre || '',
                apellido_Paterno: formData.apellido_paterno || '',
                apellido_Materno: formData.apellido_materno || '',
                rfc: formData.rfc || '',
                curp: formData.curp || '',
                fecha_Nacimiento: formData.fecha_nacimiento ? new Date(formData.fecha_nacimiento).toISOString() : new Date().toISOString(),
                pais_Nacimiento: formData.pais_nacimiento || '',
                estado_Nacimiento: formData.estado_nacimiento || '',
                municipio_Nacimiento: formData.municipio_nacimiento || '',
                ciudad_Nacimiento: formData.ciudad_nacimiento || '',
                nacionalidad: formData.nacionalidad || '',
                email1: formData.email_1 || '',
                email2: formData.email_2 || '',
                telefono_Particular: formData.tel_particular || '',
                telefono_Oficina: formData.tel_oficina || '',
                telefono_Movil: formData.tel_movil || '',
                sexo: formData.sexo || '',
                estado_Civil: formData.estado_civil || '',
                ocupacion: formData.ocupacion || '',
                activo: formData.activo,
            };

            // Construir array de domicilios
            const domicilio = [];
            const clienteId = formData.id ? parseInt(String(formData.id)) : 0;

            // Domicilio Particular
            if (formData.calle) {
                domicilio.push({
                    cliente_Id: clienteId,
                    tipo_Domicilio: 'particular',
                    calle: formData.calle || '',
                    numero_Exterior: formData.numero_exterior || '',
                    numero_Interior: formData.numero_interior || '',
                    manzana: formData.manzana || '',
                    lote: formData.lote || '',
                    colonia: formData.colonia || '',
                    ciudad: formData.ciudad || '',
                    municipio: formData.municipio || '',
                    estado: formData.estado || '',
                    pais: formData.pais || '',
                    codigo_Postal: formData.cp || '',
                });
            }

            // Domicilio Fiscal (si es diferente del particular)
            if (formData.domicilio_fiscal_calle) {
                domicilio.push({
                    cliente_Id: clienteId,
                    tipo_Domicilio: 'fiscal',
                    calle: formData.domicilio_fiscal_calle || '',
                    numero_Exterior: formData.domicilio_fiscal_num_ext || '',
                    numero_Interior: formData.domicilio_fiscal_num_int || '',
                    manzana: formData.domicilio_fiscal_mz || '',
                    lote: formData.domicilio_fiscal_lote || '',
                    colonia: formData.domicilio_fiscal_colonia || '',
                    ciudad: formData.domicilio_fiscal_ciudad || '',
                    municipio: formData.domicilio_fiscal_ciudad || '',
                    estado: formData.domicilio_fiscal_estado || '',
                    pais: formData.domicilio_fiscal_pais || '',
                    codigo_Postal: formData.domicilio_fiscal_cp || '',
                });
            }

            // Construir objeto identificación
            const identificacion = {
                cliente_Id: clienteId,
                tipo_Identificacion: formData.doc_identificacion || '',
                numero: formData.numero_identificacion || '',
                emisor: formData.autoridad_emisora || '',
                vigencia: formData.vigencia ? new Date(formData.vigencia).toISOString() : new Date().toISOString(),
                ocr: formData.ocr || '',
                idMex: formData.idmex || '',
            };

            // Construir objeto cónyuge (solo si estado_civil === 'casado')
            const payload: any = {
                cliente,
                domicilio,
                identificacion,
            };

            if (formData.estado_civil === 'casado') {
                payload.conyuge = {
                    cliente_Id: clienteId,
                    nombre: formData.nombre_conyuge || '',
                    apellido_Paterno: formData.apellido_paterno_conyuge || '',
                    apellido_Materno: formData.apellido_materno_conyuge || '',
                    tipo_Identificacion: formData.doc_identificacion_conyuge || '',
                    numero_Identificacion: formData.numero_doc_conyuge || '',
                    autoridad_Emisora: formData.autoridad_emisora_conyuge || '',
                    regimen_Conyugal: formData.regimen_conyugal || '',
                    activo: true,
                };
            }

            // Determinar URL y método según si es crear o actualizar
            const isUpdating = isEditing && formData.id;
            const url = isUpdating
                ? `https://lauran-parthenocarpic-albertina.ngrok-free.dev/api/Clientes/UpdateCliente?clienteId=${formData.id}`
                : 'https://lauran-parthenocarpic-albertina.ngrok-free.dev/api/Clientes/CreateClient';
            const method = isUpdating ? 'PUT' : 'POST';

            // Llamar a API
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(
                    errorData.message || `HTTP error! status: ${response.status}`
                );
            }

            const responseData = await response.json();

            const successMessage = isUpdating
                ? responseData.message || 'Cliente actualizado correctamente'
                : responseData.message || 'Cliente creado correctamente';

            addToast(successMessage, 'success');
            setFormData(defaultClienteData);
            setIsEditing(false);
            setActiveTab('busqueda');
            fetchClientes(filtro);
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error al guardar el cliente';
            setSaveError(message);
            addToast(message, 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Componente de Label para campos requeridos
    const RequiredLabel = ({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) => (
        <label htmlFor={htmlFor} className="text-sm font-medium flex items-center gap-1">
            {children}
            <span className="text-red-500">*</span>
        </label>
    );

    const handleCancelEdit = () => {
        setFormData(defaultClienteData);
        setIsEditing(false);
        setSaveError(null);
        setActiveTab('busqueda');
    };

    return (
        <>
            <Head title="Clientes - Control Notarial" />

            <div className="space-y-6 px-6 pt-6">
                <div className="pb-2 border-b">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-amber-500 p-3 text-white">
                            <Users className="size-5" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
                            <p className="text-muted-foreground text-xs">Gestión de clientes</p>
                        </div>
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-2 bg-transparent">
                        <TabsTrigger value="busqueda" className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Search className="size-4" />
                            <span className="hidden sm:inline">Búsqueda</span>
                        </TabsTrigger>
                        <TabsTrigger value="formulario" className="gap-2 data-[state=active]:shadow-neutral-800">
                            <Plus className="size-4" />
                            <span className="hidden sm:inline">
                                {isEditing ? 'Editar Cliente' : 'Crear Cliente'}
                            </span>
                        </TabsTrigger>
                    </TabsList>

                    {/* ── PESTAÑA 1: BÚSQUEDA ── */}
                    <TabsContent value="busqueda" className="space-y-4">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <div className="relative flex-1 max-w-sm">
                                <Input
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value)}
                                    placeholder="Buscar por nombre, RFC, correo..."
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
                            <Button
                                type="submit"
                                disabled={isSearching}
                                className="bg-amber-600 hover:bg-amber-700"
                            >
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
                                        <TableHead className="w-16">ID</TableHead>
                                        <TableHead>Alias</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>CURP</TableHead>
                                        <TableHead>RFC</TableHead>
                                        <TableHead className="w-20 text-center">Activo</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isSearching ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                                                Cargando clientes...
                                            </TableCell>
                                        </TableRow>
                                    ) : resultados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                No se encontraron clientes.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        resultados.map((cliente) => (
                                            <TableRow
                                                key={cliente.id}
                                                className="cursor-pointer hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-colors"
                                                onClick={() => handleSelectCliente(cliente)}
                                            >
                                                <TableCell className="font-mono text-sm">
                                                    {cliente.id}
                                                </TableCell>
                                                <TableCell className="text-sm">
                                                    {cliente.alias || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {[
                                                        cliente.nombre,
                                                        cliente.apellido_Paterno,
                                                        cliente.apellido_Materno,
                                                    ]
                                                        .filter(Boolean)
                                                        .join(' ')}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {cliente.curp || '-'}
                                                </TableCell>
                                                <TableCell className="font-mono text-sm">
                                                    {cliente.rfc}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span
                                                        className={`px-2 py-1 rounded text-xs font-medium ${
                                                            cliente.activo
                                                                ? 'bg-green-100 text-green-800'
                                                                : 'bg-red-100 text-red-800'
                                                        }`}
                                                    >
                                                        {cliente.activo ? 'Sí' : 'No'}
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
                                {resultados.length} cliente(s) encontrado(s) —{' '}
                                <span className="text-amber-600">haz clic en un cliente para editarlo</span>
                            </p>
                        )}
                    </TabsContent>

                    {/* ── PESTAÑA 2: FORMULARIO ── */}
                    <TabsContent value="formulario">
                        {isLoadingCliente ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                                <p className="text-muted-foreground">Cargando datos del cliente...</p>
                            </div>
                        ) : (
                            <div className="border rounded-lg p-6 bg-background/50 backdrop-blur-sm">
                                {saveError && (
                                    <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6">
                                        {saveError}
                                    </div>
                                )}

                                <Tabs value={activeFormTab} onValueChange={setActiveFormTab}>
                                <TabsList className="grid w-full grid-cols-5 bg-transparent">
                                    <TabsTrigger value="datos" className="gap-2 data-[state=active]:shadow-neutral-800">
                                        <User className="size-4" />
                                        <span className="hidden sm:inline">Datos</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="nacimiento" className="gap-2 data-[state=active]:shadow-neutral-800">
                                        <Calendar className="size-4" />
                                        <span className="hidden sm:inline">Nacimiento</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="domicilio" className="gap-2 data-[state=active]:shadow-neutral-800">
                                        <MapPin className="size-4" />
                                        <span className="hidden sm:inline">Domicilio</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="contacto" className="gap-2 data-[state=active]:shadow-neutral-800">
                                        <Phone className="size-4" />
                                        <span className="hidden sm:inline">Contacto</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="identificacion" className="gap-2 data-[state=active]:shadow-neutral-800">
                                        <FileText className="size-4" />
                                        <span className="hidden sm:inline">Identificación</span>
                                    </TabsTrigger>
                                </TabsList>

                                {/* TAB 1: DATOS DEL CLIENTE */}
                                <TabsContent value="datos" className="space-y-6">
                                    <div className="border-b pb-4">
                                        {/* Tipo, Alias */}
                                        <div className="grid grid-cols-2 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="tipo">Tipo</RequiredLabel>
                                                <Select value={formData.tipo} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as 'fisica' | 'juridica' }))}>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="fisica">Persona Física</SelectItem>
                                                        <SelectItem value="juridica">Persona Moral</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="alias">Alias</RequiredLabel>
                                                <Input
                                                    id="alias"
                                                    name="alias"
                                                    value={formData.alias}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                </div>

                                {/* Nombre, Ap. Paterno, Ap. Materno */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="nombre">Nombre</RequiredLabel>
                                        <Input
                                            id="nombre"
                                            name="nombre"
                                            value={formData.nombre}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="apellido_paterno">Apellido Paterno</RequiredLabel>
                                        <Input
                                            id="apellido_paterno"
                                            name="apellido_paterno"
                                            value={formData.apellido_paterno}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="apellido_materno" className="text-sm font-medium">Apellido Materno</label>
                                        <Input
                                            id="apellido_materno"
                                            name="apellido_materno"
                                            value={formData.apellido_materno}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* CURP, RFC, Fecha Nacimiento, Edad */}
                                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label htmlFor="curp">C.U.R.P.</label>
                                        <Input
                                            id="curp"
                                            name="curp"
                                            value={formData.curp}
                                            onChange={handleInputChange}
                                            maxLength={18}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="rfc">R.F.C.</RequiredLabel>
                                        <Input
                                            id="rfc"
                                            name="rfc"
                                            value={formData.rfc}
                                            onChange={handleInputChange}
                                            maxLength={13}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="fecha_nacimiento">Fecha Nacimiento</RequiredLabel>
                                        <Input
                                            id="fecha_nacimiento"
                                            name="fecha_nacimiento"
                                            type="date"
                                            value={formData.fecha_nacimiento}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="edad">Edad</label>
                                        <Input
                                            id="edad"
                                            name="edad"
                                            type="number"
                                            value={formData.edad}
                                            onChange={handleInputChange}
                                            readOnly
                                        />
                                    </div>
                                </div>

                                {/* Régimen Fiscal */}
                                <div className="space-y-2 mb-4">
                                    <label htmlFor="regimen_fiscal">Régimen Fiscal</label>
                                    <Input
                                        id="regimen_fiscal"
                                        name="regimen_fiscal"
                                        value={formData.regimen_fiscal}
                                        onChange={handleInputChange}
                                    />
                                </div>

                                {/* Cliente Activo Switch */}
                                <div className="flex items-center gap-3 pt-4 border-t">
                                    <label htmlFor="activo" className="text-sm font-medium">
                                        Cliente Activo
                                    </label>
                                    <Switch
                                        id="activo"
                                        checked={formData.activo}
                                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, activo: checked }))}
                                    />
                                </div>
                            </div>
                            </TabsContent>

                            {/* TAB 2: LUGAR DE NACIMIENTO */}
                            <TabsContent value="nacimiento" className="space-y-6">
                            <div className="border-b pb-4">
                                {/* País, Nacionalidad */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="pais_nacimiento">País</RequiredLabel>
                                        <Input
                                            id="pais_nacimiento"
                                            name="pais_nacimiento"
                                            value={formData.pais_nacimiento}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="nacionalidad">Nacionalidad</RequiredLabel>
                                        <Input
                                            id="nacionalidad"
                                            name="nacionalidad"
                                            value={formData.nacionalidad}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* Ciudad, Municipio, Estado */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label htmlFor="ciudad_nacimiento" className="text-sm font-medium">Ciudad</label>
                                        <Input
                                            id="ciudad_nacimiento"
                                            name="ciudad_nacimiento"
                                            value={formData.ciudad_nacimiento}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="municipio_nacimiento">Municipio</RequiredLabel>
                                        <Input
                                            id="municipio_nacimiento"
                                            name="municipio_nacimiento"
                                            value={formData.municipio_nacimiento}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="estado_nacimiento">Estado</RequiredLabel>
                                        <Input
                                            id="estado_nacimiento"
                                            name="estado_nacimiento"
                                            value={formData.estado_nacimiento}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            </TabsContent>

                            {/* TAB 3: DOMICILIO PARTICULAR */}
                            <TabsContent value="domicilio" className="space-y-6">
                            <div className="border-b pb-4">

                                {/* Tipo de Domicilio */}
                                <div className="flex gap-4 mb-6">
                                    <div className="flex items-center space-x-2">
                                        <input
                                            id="domicilio-particular"
                                            type="radio"
                                            name="domicilio_type"
                                            checked={domicilioType === 'particular'}
                                            onChange={() => setDomicilioType('particular')}
                                            className="h-4 w-4"
                                        />
                                        <label htmlFor="domicilio-particular" className="cursor-pointer">
                                            Domicilio Particular
                                        </label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            id="domicilio-fiscal"
                                            type="radio"
                                            name="domicilio_type"
                                            checked={domicilioType === 'fiscal'}
                                            onChange={() => setDomicilioType('fiscal')}
                                            className="h-4 w-4"
                                        />
                                        <label htmlFor="domicilio-fiscal" className="cursor-pointer">
                                            Domicilio Fiscal
                                        </label>
                                    </div>
                                </div>

                                {/* --- DOMICILIO PARTICULAR --- */}
                                {domicilioType === 'particular' && (
                                    <div className="space-y-4">
                                        {/* Calle */}
                                        <div className="space-y-2">
                                            <RequiredLabel htmlFor="calle">Calle</RequiredLabel>
                                            <Input
                                                id="calle"
                                                name="calle"
                                                value={formData.calle}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* No. Exterior, No. Interior, Mz., Lote */}
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="numero_exterior">No. Exterior</RequiredLabel>
                                                <Input
                                                    id="numero_exterior"
                                                    name="numero_exterior"
                                                    value={formData.numero_exterior}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="numero_interior">No. Interior</label>
                                                <Input
                                                    id="numero_interior"
                                                    name="numero_interior"
                                                    value={formData.numero_interior}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="manzana">Mz.</label>
                                                <Input
                                                    id="manzana"
                                                    name="manzana"
                                                    value={formData.manzana}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="lote">Lote</label>
                                                <Input
                                                    id="lote"
                                                    name="lote"
                                                    value={formData.lote}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        {/* Ciudad, Colonia, CP */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="municipio">Municipio</RequiredLabel>
                                                <Input
                                                    id="municipio"
                                                    name="municipio"
                                                    value={formData.municipio}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="colonia">Colonia</RequiredLabel>
                                                <Input
                                                    id="colonia"
                                                    name="colonia"
                                                    value={formData.colonia}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="cp">CP</RequiredLabel>
                                                <Input
                                                    id="cp"
                                                    name="cp"
                                                    value={formData.cp}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        {/* Estado, País */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="estado">Estado/Provincia</RequiredLabel>
                                                <Input
                                                    id="estado"
                                                    name="estado"
                                                    value={formData.estado || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="pais">País</RequiredLabel>
                                                <Input
                                                    id="pais"
                                                    name="pais"
                                                    value={formData.pais || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* --- DOMICILIO FISCAL --- */}
                                {domicilioType === 'fiscal' && (
                                    <div className="space-y-4">
                                        {/* Botón para copiar datos del domicilio particular */}
                                        <div className="mb-4">
                                            <Button
                                                onClick={handleCopyDomicilioData}
                                                variant="outline"
                                                className="w-full"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Copiar Datos del Domicilio Particular
                                            </Button>
                                        </div>

                                        {/* Calle */}
                                        <div className="space-y-2">
                                            <label htmlFor="domicilio_fiscal_calle">Calle</label>
                                            <Input
                                                id="domicilio_fiscal_calle"
                                                name="domicilio_fiscal_calle"
                                                value={formData.domicilio_fiscal_calle || ''}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        {/* No. Exterior, No. Interior, Mz., Lote */}
                                        <div className="grid grid-cols-4 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="domicilio_fiscal_num_ext">No. Exterior</label>
                                                <Input
                                                    id="domicilio_fiscal_num_ext"
                                                    name="domicilio_fiscal_num_ext"
                                                    value={formData.domicilio_fiscal_num_ext || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="domicilio_fiscal_num_int">No. Interior</label>
                                                <Input
                                                    id="domicilio_fiscal_num_int"
                                                    name="domicilio_fiscal_num_int"
                                                    value={formData.domicilio_fiscal_num_int || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="domicilio_fiscal_mz">Mz.</label>
                                                <Input
                                                    id="domicilio_fiscal_mz"
                                                    name="domicilio_fiscal_mz"
                                                    value={formData.domicilio_fiscal_mz || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="domicilio_fiscal_lote">Lote</label>
                                                <Input
                                                    id="domicilio_fiscal_lote"
                                                    name="domicilio_fiscal_lote"
                                                    value={formData.domicilio_fiscal_lote || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        {/* Ciudad, Colonia, CP */}
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="domicilio_fiscal_ciudad">Municipio</label>
                                                <Input
                                                    id="domicilio_fiscal_ciudad"
                                                    name="domicilio_fiscal_ciudad"
                                                    value={formData.domicilio_fiscal_ciudad || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="domicilio_fiscal_colonia">Colonia</label>
                                                <Input
                                                    id="domicilio_fiscal_colonia"
                                                    name="domicilio_fiscal_colonia"
                                                    value={formData.domicilio_fiscal_colonia || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="domicilio_fiscal_cp">CP</label>
                                                <Input
                                                    id="domicilio_fiscal_cp"
                                                    name="domicilio_fiscal_cp"
                                                    value={formData.domicilio_fiscal_cp || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        {/* Estado, País */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label htmlFor="domicilio_fiscal_estado">Estado/Provincia</label>
                                                <Input
                                                    id="domicilio_fiscal_estado"
                                                    name="domicilio_fiscal_estado"
                                                    value={formData.domicilio_fiscal_estado || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="domicilio_fiscal_pais">País</label>
                                                <Input
                                                    id="domicilio_fiscal_pais"
                                                    name="domicilio_fiscal_pais"
                                                    value={formData.domicilio_fiscal_pais || ''}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            </TabsContent>

                            {/* TAB 4: CONTACTO */}
                            <TabsContent value="contacto" className="space-y-6">
                            <div className="border-b pb-4">

                                {/* Teléfonos */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label htmlFor="tel_particular">Tel. Particular</label>
                                        <Input
                                            id="tel_particular"
                                            name="tel_particular"
                                            value={formData.tel_particular}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="tel_oficina">Tel. Oficina</label>
                                        <Input
                                            id="tel_oficina"
                                            name="tel_oficina"
                                            value={formData.tel_oficina}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="tel_movil">Tel. Móvil</RequiredLabel>
                                        <Input
                                            id="tel_movil"
                                            name="tel_movil"
                                            value={formData.tel_movil}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* Email 1, Email 2 */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label htmlFor="email_1">E-mail (1)</label>
                                        <Input
                                            id="email_1"
                                            name="email_1"
                                            type="email"
                                            value={formData.email_1}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="email_2">E-mail (2)</label>
                                        <Input
                                            id="email_2"
                                            name="email_2"
                                            type="email"
                                            value={formData.email_2}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>
                            </div>
                            </TabsContent>

                            {/* TAB 4: IDENTIFICACIÓN */}
                            <TabsContent value="identificacion" className="space-y-6">
                            <div className="border-b pb-4">
                                {/* Doc. Identificación, No. Identificación */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="doc_identificacion">Doc. Identificación</RequiredLabel>
                                        <Input
                                            id="doc_identificacion"
                                            name="doc_identificacion"
                                            value={formData.doc_identificacion}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="numero_identificacion">No. Identificación</RequiredLabel>
                                        <Input
                                            id="numero_identificacion"
                                            name="numero_identificacion"
                                            value={formData.numero_identificacion}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* Sexo, IDMEX */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label htmlFor="sexo">Sexo</label>
                                        <Select value={formData.sexo} onValueChange={(value) => setFormData(prev => ({ ...prev, sexo: value as 'M' | 'F' | '' }))}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="M">Masculino</SelectItem>
                                                <SelectItem value="F">Femenino</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="idmex">IDMEX (INE)</label>
                                        <Input
                                            id="idmex"
                                            name="idmex"
                                            value={formData.idmex}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* OCR, Autoridad Emisora, Vigencia */}
                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label htmlFor="ocr">OCR</label>
                                        <Input
                                            id="ocr"
                                            name="ocr"
                                            value={formData.ocr}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="autoridad_emisora">Autoridad Emisora</RequiredLabel>
                                        <Input
                                            id="autoridad_emisora"
                                            name="autoridad_emisora"
                                            value={formData.autoridad_emisora}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="vigencia">Vigencia</RequiredLabel>
                                        <Input
                                            id="vigencia"
                                            name="vigencia"
                                            type="date"
                                            value={formData.vigencia}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                </div>

                                {/* Ocupación, Estado Civil */}
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div className="space-y-2">
                                        <label htmlFor="ocupacion">Ocupación</label>
                                        <Input
                                            id="ocupacion"
                                            name="ocupacion"
                                            value={formData.ocupacion}
                                            onChange={handleInputChange}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="estado_civil">Estado Civil</RequiredLabel>
                                        <Select value={formData.estado_civil || ""} onValueChange={(value) => setFormData(prev => ({ ...prev, estado_civil: value }))}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Selecciona..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="soltero">Soltero/a</SelectItem>
                                                <SelectItem value="casado">Casado/a</SelectItem>
                                                <SelectItem value="divorciado">Divorciado/a</SelectItem>
                                                <SelectItem value="viudo">Viudo/a</SelectItem>
                                                <SelectItem value="unión-libre">Unión Libre</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Datos del Cónyuge - Mostrar solo si estado_civil === 'casado' */}
                                {formData.estado_civil === 'casado' && (
                                    <div className="border-t pt-6 mt-6">
                                        <h4 className="font-semibold mb-4 text-sm text-amber-700">Datos del Cónyuge</h4>

                                        {/* Nombre, Ap. Paterno, Ap. Materno */}
                                        <div className="grid grid-cols-3 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="nombre_conyuge">Nombre (s)</RequiredLabel>
                                                <Input
                                                    id="nombre_conyuge"
                                                    name="nombre_conyuge"
                                                    value={formData.nombre_conyuge}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="apellido_paterno_conyuge">Apellido Paterno</RequiredLabel>
                                                <Input
                                                    id="apellido_paterno_conyuge"
                                                    name="apellido_paterno_conyuge"
                                                    value={formData.apellido_paterno_conyuge}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="apellido_materno_conyuge">Apellido Materno</label>
                                                <Input
                                                    id="apellido_materno_conyuge"
                                                    name="apellido_materno_conyuge"
                                                    value={formData.apellido_materno_conyuge}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        {/* Doc Identificación, Núm. Doc, Autoridad Emisora, Régimen Conyugal */}
                                        <div className="grid grid-cols-4 gap-4 mb-4">
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="doc_identificacion_conyuge">Doc Identificación</RequiredLabel>
                                                <Input
                                                    id="doc_identificacion_conyuge"
                                                    name="doc_identificacion_conyuge"
                                                    value={formData.doc_identificacion_conyuge}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="numero_doc_conyuge">Núm.Doc.Identificación</RequiredLabel>
                                                <Input
                                                    id="numero_doc_conyuge"
                                                    name="numero_doc_conyuge"
                                                    value={formData.numero_doc_conyuge}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label htmlFor="autoridad_emisora_conyuge">Autoridad Emisora</label>
                                                <Input
                                                    id="autoridad_emisora_conyuge"
                                                    name="autoridad_emisora_conyuge"
                                                    value={formData.autoridad_emisora_conyuge}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <RequiredLabel htmlFor="regimen_conyugal">Régimen Conyugal</RequiredLabel>
                                                <Input
                                                    id="regimen_conyugal"
                                                    name="regimen_conyugal"
                                                    value={formData.regimen_conyugal}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            </TabsContent>
                        </Tabs>

                            {/* Botones */}
                            <div className="flex gap-2 justify-end pt-4 border-t mt-6">
                                {isEditing && (
                                    <Button variant="outline" onClick={handleCancelEdit}>
                                        <X className="h-4 w-4 mr-2" />
                                        Cancelar
                                    </Button>
                                )}
                                <Button
                                    onClick={handleAddCliente}
                                    disabled={isSaving}
                                    className="bg-amber-600 hover:bg-amber-700"
                                >
                                    {isSaving ? (
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                        <Plus className="h-4 w-4 mr-2" />
                                    )}
                                    {isEditing ? 'Actualizar' : 'Guardar'} Cliente
                                </Button>
                            </div>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </>
    );
}

ControlNotarialClientes.layout = (page: React.ReactNode) => (
    <AppLayout
        breadcrumbs={[
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Control Notarial', href: '/admin/control-notarial' },
            { title: 'Configuración', href: '/admin/control-notarial/configuracion' },
            { title: 'Clientes', href: '/admin/control-notarial/clientes' },
        ]}
    >
        {page}
    </AppLayout>
);

