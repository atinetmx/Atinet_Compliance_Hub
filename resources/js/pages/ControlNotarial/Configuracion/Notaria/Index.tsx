import { Head } from '@inertiajs/react';
import {
    Building2,
    Settings,
    Server,
    Calculator,
    File,
    Save,
    X,
    Phone,
    MapPin,
    Image,
    BarChart3,
    BookOpen,
    Mail
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';

interface NotariaData {
    nombre: string;
    domicilio: string;
    telefono: string;
    municipio: string;
    estado: string;
    ciudad: string;
    notaria_numero: string;
    codigo_postal: string;
    imagen: string | null;
    imagenFile?: File | null;
}

interface ControlData {
    expediente: number;
    acta_fuera_protocolo: number;
    certificacion: number;
    recibo_honorarios: number;
    ratificacion: number;
    recibo_general: number;
    cotejo: number;
}

interface ServidorData {
    ruta: string;
}

interface CorreoData {
    servidor_correo: string;
    usuario_correo: string;
    password_correo: string;
    asunto_correo: string;
    puerto: string;
    ssl_enabled: boolean;
}

interface CalculosData {
    iva: number;
    ret_iva: number;
    ret_isr: number;
    salario: number;
    uma: number;
}

interface FoliosData {
    // Folios Instrumentos
    tomo_inicial_instrumentos: number;
    volumenes_por_tomo_instrumentos: number;
    folios_por_volumen_instrumentos: number;
    volumen_inicial_instrumentos: number;
    folio_inicial_por_tomo_instrumentos: number;
    // Folios Certificaciones
    tomo_inicial_certificaciones: number;
    volumenes_por_tomo_certificaciones: number;
    folios_por_volumen_certificaciones: number;
    volumen_inicial_certificaciones: number;
    folio_inicial_por_tomo_certificaciones: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Control Notarial',
        href: '/control-notarial',
    },
    {
        title: 'Configuración',
        href: '/control-notarial/configuracion',
    },
];

export default function ControlNotarialConfiguracionIndex() {
    const { addToast } = useToast();
const api = useApi();
    const [notariaData, setNotariaData] = useState<NotariaData>({
        nombre: '',
        domicilio: '',
        telefono: '',
        municipio: '',
        estado: '',
        ciudad: '',
        notaria_numero: '',
        codigo_postal: '',
        imagen: null,
    });
    const [controlData, setControlData] = useState<ControlData>({
        expediente: 0,
        acta_fuera_protocolo: 0,
        certificacion: 0,
        recibo_honorarios: 0,
        ratificacion: 0,
        recibo_general: 0,
        cotejo: 0,
    });
    const [servidorData, setServidorData] = useState<ServidorData>({
        ruta: '',
    });
    const [correoData, setCorreoData] = useState<CorreoData>({
        servidor_correo: '',
        usuario_correo: '',
        password_correo: '',
        asunto_correo: '',
        puerto: '',
        ssl_enabled: false,
    });
    const [calculosData, setCalculosData] = useState<CalculosData>({
        iva: 0,
        ret_iva: 0,
        ret_isr: 0,
        salario: 0,
        uma: 0,
    });
    const [foliosData, setFoliosData] = useState<FoliosData>({
        tomo_inicial_instrumentos: 0,
        volumenes_por_tomo_instrumentos: 0,
        folios_por_volumen_instrumentos: 0,
        volumen_inicial_instrumentos: 0,
        folio_inicial_por_tomo_instrumentos: 0,
        tomo_inicial_certificaciones: 0,
        volumenes_por_tomo_certificaciones: 0,
        folios_por_volumen_certificaciones: 0,
        volumen_inicial_certificaciones: 0,
        folio_inicial_por_tomo_certificaciones: 0,
    });
    const [isSaved, setIsSaved] = useState(false);
    const [activeTab, setActiveTab] = useState('datos');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [configId, setConfigId] = useState<string | number | null>(null);
    const [controlConfigId, setControlConfigId] = useState<string | number | null>(null);

    // Cargar datos de la API al montar el componente
    useEffect(() => {
        const fetchConfiguracionNotaria = async () => {
            try {
                setIsLoading(true);
                const response = await api.get('/ConfiguracionNotarial/GetConfiguracionNotaria');

                if (!response.dataResponse) {
                    throw new Error('Error al obtener la configuracion');
                }

                const notaria = response.dataResponse;

                // Capturar el ID (puede ser id, idConfiguracionNotaria, configuracionId, etc.)
                const id = notaria.id || notaria.idConfiguracionNotaria || notaria.configuracionId || notaria.numero_Notaria;
                setConfigId(id);

                console.log('Datos completos de la API:', notaria); // Para debugging

                // Mapear los datos de la API a los campos del formulario
                setNotariaData({
                    nombre: notaria.nombre_Notario || '',
                    domicilio: notaria.domicilio || '',
                    telefono: notaria.telefono || '',
                    municipio: notaria.municipio || '',
                    estado: notaria.estado || '',
                    ciudad: notaria.ciudad || '',
                    notaria_numero: notaria.numero_Notaria || '',
                    codigo_postal: notaria.codigo_Postal || '',
                    imagen: notaria.logotipo ? `data:image/png;base64,${notaria.logotipo}` : null,
                });

            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error al cargar la configuración';
                console.error('Error:', errorMessage);
                addToast(errorMessage, 'error');
            } finally {
                setIsLoading(false);
            }
        };

        fetchConfiguracionNotaria();
    }, [addToast]);

    // Cargar datos de Control, Cálculos y Folios
    useEffect(() => {
        const fetchConfiguracionControl = async () => {
            try {
                const response = await api.get('/ConfiguracionNotarial/GetConfiguracionControlNotarial');

                if (!response.dataResponse) {
                    throw new Error(response.message || 'Error al obtener la configuración de control');
                }

                const config = response.dataResponse;

                console.log('Datos de Control, Cálculos y Folios:', config);

                // Capturar el ID del control
                setControlConfigId(config.id);

                // Mapear datos de Control
                setControlData({
                    expediente: parseInt(config.expediente) || 0,
                    acta_fuera_protocolo: parseInt(config.acta_Fuera_Protocolo) || 0,
                    certificacion: parseInt(config.certificado) || 0,
                    recibo_honorarios: parseInt(config.recibo_Honorarios) || 0,
                    ratificacion: parseInt(config.ratificacion) || 0,
                    recibo_general: parseInt(config.recibo_Provisional) || 0,
                    cotejo: parseInt(config.cotejo) || 0,
                });

                // Mapear datos de Cálculos
                setCalculosData({
                    iva: parseFloat(config.iva) || 0,
                    ret_iva: parseFloat(config.retencion_IVA) || 0,
                    ret_isr: parseFloat(config.isr) || 0,
                    salario: parseFloat(config.salario) || 0,
                    uma: parseFloat(config.uma) || 0,
                });

                // Mapear datos de Folios
                setFoliosData({
                    tomo_inicial_instrumentos: parseInt(config.tomo_Inicial_Instrumentos) || 0,
                    volumenes_por_tomo_instrumentos: parseInt(config.volumen_Tomo_Instrumentos) || 0,
                    folios_por_volumen_instrumentos: parseInt(config.folio_Volumen_Instrumentos) || 0,
                    volumen_inicial_instrumentos: parseInt(config.volumen_Inicial_Instrumentos) || 0,
                    folio_inicial_por_tomo_instrumentos: parseInt(config.folio_Inicial_Tomo_Instrumentos) || 0,
                    tomo_inicial_certificaciones: parseInt(config.tomo_Inicial_Certificaciones) || 0,
                    volumenes_por_tomo_certificaciones: parseInt(config.volumen_Tomo_Certificaciones) || 0,
                    folios_por_volumen_certificaciones: parseInt(config.folios_Volumen_Certificaciones) || 0,
                    volumen_inicial_certificaciones: parseInt(config.volumen_Inicial_Certificaciones) || 0,
                    folio_inicial_por_tomo_certificaciones: parseInt(config.folio_Inicial_Tomo_Certificaciones) || 0,
                });
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Error al cargar la configuración de control';
                console.error('Error:', errorMessage);
                addToast(errorMessage, 'error');
            }
        };

        fetchConfiguracionControl();
    }, [addToast]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            setSaveError(null);

            if (!configId) {
                throw new Error('ID de configuración no disponible');
            }

            // Siempre usar FormData (el servidor lo espera así)
            const formData = new FormData();

            formData.append('id', String(configId));
            formData.append('numero_Notaria', notariaData.notaria_numero);
            formData.append('nombre_Notario', notariaData.nombre);
            formData.append('telefono', notariaData.telefono);
            formData.append('domicilio', notariaData.domicilio);
            formData.append('municipio', notariaData.municipio);
            formData.append('estado', notariaData.estado);
            formData.append('codigo_Postal', notariaData.codigo_postal);

            // Si hay archivo de imagen, agregarlo
            if (notariaData.imagenFile) {
                formData.append('fileLogo', notariaData.imagenFile);
                console.log('Enviando FormData con imagen:', notariaData.imagenFile.name);
            }


            const notariaResponse = await api.put('/ConfiguracionNotarial/UpdateConfiguracionNotaria', formData);

            if (!notariaResponse.success) {
                throw new Error(notariaResponse.message);
            }

            console.log('Configuración de notaría guardada:', notariaResponse);

            // Ahora guardar los datos de Control, Cálculos y Folios
            if (controlConfigId) {
                const controlPayload = {
                    id: controlConfigId,
                    expediente: controlData.expediente.toString(),
                    consecutivo_Expediente: 0,
                    ratificacion: controlData.ratificacion.toString(),
                    consecutivo_Ratificacion: 0,
                    anio: new Date().getFullYear() % 100,
                    certificado: controlData.certificacion.toString(),
                    cotejo: controlData.cotejo,
                    acta_Fuera_Protocolo: controlData.acta_fuera_protocolo,
                    recibo_Honorarios: controlData.recibo_honorarios,
                    recibo_Provisional: controlData.recibo_general,
                    meses_Antilavado: 0,
                    umaS_Antilavado: 0,
                    iva: calculosData.iva,
                    retencion_IVA: calculosData.ret_iva,
                    isr: calculosData.ret_isr,
                    salario: calculosData.salario,
                    uma: calculosData.uma,
                    tomo_Inicial_Instrumentos: foliosData.tomo_inicial_instrumentos,
                    volumen_Tomo_Instrumentos: foliosData.volumenes_por_tomo_instrumentos,
                    folio_Volumen_Instrumentos: foliosData.folios_por_volumen_instrumentos,
                    volumen_Inicial_Instrumentos: foliosData.volumen_inicial_instrumentos,
                    folio_Inicial_Tomo_Instrumentos: foliosData.folio_inicial_por_tomo_instrumentos,
                    tomo_Inicial_Certificaciones: foliosData.tomo_inicial_certificaciones,
                    volumen_Tomo_Certificaciones: foliosData.volumenes_por_tomo_certificaciones,
                    folios_Volumen_Certificaciones: foliosData.folios_por_volumen_certificaciones,
                    folio_Inicial_Tomo_Certificaciones: foliosData.folio_inicial_por_tomo_certificaciones,
                };

                console.log('Enviando datos de Control con ID:', controlConfigId);

                const controlResponse = await api.put('/ConfiguracionNotarial/UpdateConfiguracionControlNotarial', controlPayload);

                if (!controlResponse.success) {
                    throw new Error(controlResponse.message);
                }
                console.log('Control guardado:', controlResponse);
            }

            // Mostrar mensaje del servidor
            addToast(notariaResponse.message, 'success');
            setSaveError(null);
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error al guardar la configuración';
            console.error('Error al guardar:', errorMessage);
            setSaveError(errorMessage);
            addToast(errorMessage, 'error');
            setTimeout(() => setSaveError(null), 5000);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        setNotariaData({
            nombre: '',
            domicilio: '',
            telefono: '',
            municipio: '',
            estado: '',
            ciudad: '',
            notaria_numero: '',
            codigo_postal: '',
            imagen: null,
        });
        setControlData({
            expediente: 0,
            acta_fuera_protocolo: 0,
            certificacion: 0,
            recibo_honorarios: 0,
            ratificacion: 0,
            recibo_general: 0,
            cotejo: 0,
        });
        setServidorData({
            ruta: '',
        });
        setCorreoData({
            servidor_correo: '',
            usuario_correo: '',
            password_correo: '',
            asunto_correo: '',
            puerto: '',
            ssl_enabled: false,
        });
        setCalculosData({
            iva: 0,
            ret_iva: 0,
            ret_isr: 0,
            salario: 0,
            uma: 0,
        });
        setFoliosData({
            tomo_inicial_instrumentos: 0,
            volumenes_por_tomo_instrumentos: 0,
            folios_por_volumen_instrumentos: 0,
            volumen_inicial_instrumentos: 0,
            folio_inicial_por_tomo_instrumentos: 0,
            tomo_inicial_certificaciones: 0,
            volumenes_por_tomo_certificaciones: 0,
            folios_por_volumen_certificaciones: 0,
            volumen_inicial_certificaciones: 0,
            folio_inicial_por_tomo_certificaciones: 0,
        });
    };

    return (
        <>
            <Head title="Configuración - Control Notarial" />

 <div className="space-y-6 px-6 pt-6">
                {/* Tabs Container */}
                <div>
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-6 bg-transparent">
                            <TabsTrigger value="datos" className="gap-2 data-[state=active]:shadow-neutral-800">
                                <Building2 className="size-4" />
                                <span className="hidden sm:inline">Datos</span>
                            </TabsTrigger>
                            <TabsTrigger value="control" className="gap-2 data-[state=active]:shadow-neutral-800">
                                <Settings className="size-4" />
                                <span className="hidden sm:inline">Control</span>
                            </TabsTrigger>
                            <TabsTrigger value="servidor" className="gap-2 data-[state=active]:shadow-neutral-800">
                                <Server className="size-4" />
                                <span className="hidden sm:inline">Servidor</span>
                            </TabsTrigger>
                            <TabsTrigger value="correo" className="gap-2 data-[state=active]:shadow-neutral-800">
                                <Settings className="size-4" />
                                <span className="hidden sm:inline">Correo</span>
                            </TabsTrigger>
                            <TabsTrigger value="calculos" className="gap-2 data-[state=active]:shadow-neutral-800">
                                <Calculator className="size-4" />
                                <span className="hidden sm:inline">Cálculos</span>
                            </TabsTrigger>
                            <TabsTrigger value="folios" className="gap-2 data-[state=active]:shadow-neutral-800">
                                <File className="size-4" />
                                <span className="hidden sm:inline">Folios</span>
                            </TabsTrigger>
                        </TabsList>
                        <div className="pb-3 border-b"/>
                        {/* Pestaña 1: Datos de la Notaría */}
                        <TabsContent value="datos" className="space-y-6 ">
                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-center">
                                        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500"></div>
                                        <p className="text-gray-600">Cargando datos de la notaría...</p>
                                    </div>
                                </div>
                            ) : (
                            <div className="grid gap-6">
                                {/* Sección 1: Información Principal */}
                                <div className="border-2 border-blue-200 rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-blue-600 text-white p-3 rounded-lg">
                                            <Building2 className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Información Principal</h3>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <RequiredLabel htmlFor="notaria_numero">Nº Notaría</RequiredLabel>
                                            <Input
                                                id="notaria_numero"
                                                value={notariaData.notaria_numero}
                                                onChange={(e) =>
                                                    setNotariaData({
                                                        ...notariaData,
                                                        notaria_numero: e.target.value,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="nombre">Nombre del Notario</RequiredLabel>
                                            <Input
                                                id="nombre"
                                                value={notariaData.nombre}
                                                onChange={(e) =>
                                                    setNotariaData({
                                                        ...notariaData,
                                                        nombre: e.target.value,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 2: Contacto */}
                                <div className="border-2 border-green-200 rounded-lg p-5 bg-gradient-to-br from-green-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-green-600 text-white p-3 rounded-lg">
                                            <Phone className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Contacto</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        <div>
                                            <RequiredLabel htmlFor="telefono">Teléfono</RequiredLabel>
                                            <Input
                                                id="telefono"
                                                value={notariaData.telefono}
                                                onChange={(e) =>
                                                    setNotariaData({
                                                        ...notariaData,
                                                        telefono: e.target.value,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 3: Ubicación */}
                                <div className="border-2 border-purple-200 rounded-lg p-5 bg-gradient-to-br from-purple-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-purple-600 text-white p-3 rounded-lg">
                                            <MapPin className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Ubicación</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        <div>
                                            <RequiredLabel htmlFor="domicilio">Domicilio</RequiredLabel>
                                            <Input
                                                id="domicilio"
                                                value={notariaData.domicilio}
                                                onChange={(e) =>
                                                    setNotariaData({
                                                        ...notariaData,
                                                        domicilio: e.target.value,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-3">
                                            <div>
                                                <RequiredLabel htmlFor="estado">Estado</RequiredLabel>
                                                <Input
                                                    id="estado"
                                                    value={notariaData.estado}
                                                    onChange={(e) =>
                                                        setNotariaData({
                                                            ...notariaData,
                                                            estado: e.target.value,
                                                        })
                                                    }
                                                    className="mt-2 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <RequiredLabel htmlFor="municipio">Municipio</RequiredLabel>
                                                <Input
                                                    id="municipio"
                                                    value={notariaData.municipio}
                                                    onChange={(e) =>
                                                        setNotariaData({
                                                            ...notariaData,
                                                            municipio: e.target.value,
                                                        })
                                                    }
                                                    className="mt-2 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <RequiredLabel htmlFor="codigo_postal">Código Postal</RequiredLabel>
                                                <Input
                                                    id="codigo_postal"
                                                    value={notariaData.codigo_postal}
                                                    onChange={(e) =>
                                                        setNotariaData({
                                                            ...notariaData,
                                                            codigo_postal: e.target.value,
                                                        })
                                                    }
                                                    className="mt-2 bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Sección 4: Imagen */}
                                <div className="border-2 border-amber-200 rounded-lg p-5 bg-gradient-to-br from-amber-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-amber-600 text-white p-3 rounded-lg">
                                            <Image className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Foto de la Notaría</h3>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div>
                                            <RequiredLabel htmlFor="imagen">Subir Imagen</RequiredLabel>
                                            <input
                                                id="imagen"
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (event) => {
                                                            setNotariaData({
                                                                ...notariaData,
                                                                imagen: event.target?.result as string,
                                                                imagenFile: file, // Guardar el archivo original
                                                            });
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                                className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-blue-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
                                            />
                                        </div>
                                        {notariaData.imagen && (
                                            <div className="mt-2 md:col-span-2">
                                                <RequiredLabel>Vista Previa</RequiredLabel>
                                                <img
                                                    src={notariaData.imagen}
                                                    alt="Foto de la notarÃƒÂ­a"
                                                    className="mt-2 h-110 w-full rounded-lg border border-gray-300 object-contain shadow-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                            )}
                        </TabsContent>

                        {/* PestaÃƒÂ±a 2: Control */}
                        <TabsContent value="control" className="space-y-6">
                            <div className="border-2 border-orange-200 rounded-lg p-5 bg-gradient-to-br from-orange-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-orange-600 text-white p-3 rounded-lg">
                                        <BarChart3 className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Contador de Documentos</h3>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                    <div>
                                        <RequiredLabel htmlFor="expediente">Expediente</RequiredLabel>
                                        <Input
                                            id="expediente"
                                            type="number"
                                            value={controlData.expediente}
                                            onChange={(e) =>
                                                setControlData({
                                                    ...controlData,
                                                    expediente: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="acta_fuera_protocolo">Acta Fuera de Protocolo</RequiredLabel>
                                        <Input
                                            id="acta_fuera_protocolo"
                                            type="number"
                                            value={controlData.acta_fuera_protocolo}
                                            onChange={(e) =>
                                                setControlData({
                                                    ...controlData,
                                                    acta_fuera_protocolo: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="certificacion">Certificación</RequiredLabel>
                                        <Input
                                            id="certificacion"
                                            type="number"
                                            value={controlData.certificacion}
                                            onChange={(e) =>
                                                setControlData({
                                                    ...controlData,
                                                    certificacion: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="recibo_honorarios">Recibo Honorarios</RequiredLabel>
                                        <Input
                                            id="recibo_honorarios"
                                            type="number"
                                            value={controlData.recibo_honorarios}
                                            onChange={(e) =>
                                                setControlData({
                                                    ...controlData,
                                                    recibo_honorarios: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="ratificacion">Ratificación</RequiredLabel>
                                        <Input
                                            id="ratificacion"
                                            type="number"
                                            value={controlData.ratificacion}
                                            onChange={(e) =>
                                                setControlData({
                                                    ...controlData,
                                                    ratificacion: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="recibo_general">Recibo General</RequiredLabel>
                                        <Input
                                            id="recibo_general"
                                            type="number"
                                            value={controlData.recibo_general}
                                            onChange={(e) =>
                                                setControlData({
                                                    ...controlData,
                                                    recibo_general: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="cotejo">Cotejo</RequiredLabel>
                                        <Input
                                            id="cotejo"
                                            type="number"
                                            value={controlData.cotejo}
                                            onChange={(e) =>
                                                setControlData({
                                                    ...controlData,
                                                    cotejo: parseInt(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Pestaña 3: Servidor */}
                        <TabsContent value="servidor" className="space-y-6">
                            <div className="grid gap-6">
                                {/* Sección de Ruta */}
                                <div className="border-2 border-red-200 rounded-lg p-5 bg-gradient-to-br from-red-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-red-600 text-white p-3 rounded-lg">
                                            <Server className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Configuración del Servidor</h3>
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="ruta">Ruta del Servidor</RequiredLabel>
                                        <Input
                                            id="ruta"
                                            value={servidorData.ruta}
                                            onChange={(e) =>
                                                setServidorData({
                                                    ...servidorData,
                                                    ruta: e.target.value,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Pestaña 4: Correo */}
                        <TabsContent value="correo" className="space-y-6">
                            <div className="grid gap-6">
                                {/* Sección de Correo */}
                                <div className="border-2 border-indigo-200 rounded-lg p-5 bg-gradient-to-br from-indigo-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-indigo-600 text-white p-3 rounded-lg">
                                            <Mail className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Configuración de Correo</h3>
                                    </div>
                                    <div className="grid gap-4">
                                        <div>
                                            <RequiredLabel htmlFor="correo_servidor">Servidor SMTP</RequiredLabel>
                                            <Input
                                                id="correo_servidor"
                                                value={correoData.servidor_correo}
                                                onChange={(e) =>
                                                    setCorreoData({
                                                        ...correoData,
                                                        servidor_correo: e.target.value,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <RequiredLabel htmlFor="correo_usuario">Usuario</RequiredLabel>
                                                <Input
                                                    id="correo_usuario"
                                                    value={correoData.usuario_correo}
                                                    onChange={(e) =>
                                                        setCorreoData({
                                                            ...correoData,
                                                            usuario_correo: e.target.value,
                                                        })
                                                    }
                                                    className="mt-2 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <RequiredLabel htmlFor="correo_password">Contraseña</RequiredLabel>
                                                <Input
                                                    id="correo_password"
                                                    type="password"
                                                    value={correoData.password_correo}
                                                    onChange={(e) =>
                                                        setCorreoData({
                                                            ...correoData,
                                                            password_correo: e.target.value,
                                                        })
                                                    }
                                                    className="mt-2 bg-white"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <RequiredLabel htmlFor="correo_puerto">Puerto</RequiredLabel>
                                                <Input
                                                    id="correo_puerto"
                                                    value={correoData.puerto}
                                                    onChange={(e) =>
                                                        setCorreoData({
                                                            ...correoData,
                                                            puerto: e.target.value,
                                                        })
                                                    }
                                                    className="mt-2 bg-white"
                                                />
                                            </div>
                                            <div>
                                                <RequiredLabel htmlFor="correo_ssl">SSL</RequiredLabel>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <input
                                                        id="correo_ssl"
                                                        type="checkbox"
                                                        checked={correoData.ssl_enabled}
                                                        onChange={(e) =>
                                                            setCorreoData({
                                                                ...correoData,
                                                                ssl_enabled: e.target.checked,
                                                            })
                                                        }
                                                        className="rounded-md border border-input"
                                                    />
                                                    <span className="text-sm">Habilitar SSL</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="correo_asunto">Asunto del Correo</RequiredLabel>
                                            <textarea
                                                id="correo_asunto"
                                                value={correoData.asunto_correo}
                                                onChange={(e) =>
                                                    setCorreoData({
                                                        ...correoData,
                                                        asunto_correo: e.target.value,
                                                    })
                                                }
                                                className="mt-2 w-full rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                rows={4}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="calculos" className="space-y-6">
                            <div className="border-2 border-emerald-200 rounded-lg p-5 bg-gradient-to-br from-emerald-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="bg-emerald-600 text-white p-3 rounded-lg">
                                        <Calculator className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900">Configuración de Cálculos</h3>
                                </div>
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div>
                                        <RequiredLabel htmlFor="iva">IVA (%)</RequiredLabel>
                                        <Input
                                            id="iva"
                                            type="number"
                                            step="0.01"
                                            value={calculosData.iva}
                                            onChange={(e) =>
                                                setCalculosData({
                                                    ...calculosData,
                                                    iva: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="ret_iva">Retención IVA (%)</RequiredLabel>
                                        <Input
                                            id="ret_iva"
                                            type="number"
                                            step="0.01"
                                            value={calculosData.ret_iva}
                                            onChange={(e) =>
                                                setCalculosData({
                                                    ...calculosData,
                                                    ret_iva: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="ret_isr">Retención ISR (%)</RequiredLabel>
                                        <Input
                                            id="ret_isr"
                                            type="number"
                                            step="0.01"
                                            value={calculosData.ret_isr}
                                            onChange={(e) =>
                                                setCalculosData({
                                                    ...calculosData,
                                                    ret_isr: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="salario">Salario Diario ($)</RequiredLabel>
                                        <Input
                                            id="salario"
                                            type="number"
                                            step="0.01"
                                            value={calculosData.salario}
                                            onChange={(e) =>
                                                setCalculosData({
                                                    ...calculosData,
                                                    salario: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                    <div>
                                        <RequiredLabel htmlFor="uma">UMA ($)</RequiredLabel>
                                        <Input
                                            id="uma"
                                            type="number"
                                            step="0.01"
                                            value={calculosData.uma}
                                            onChange={(e) =>
                                                setCalculosData({
                                                    ...calculosData,
                                                    uma: parseFloat(e.target.value) || 0,
                                                })
                                            }
                                            className="mt-2 bg-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                        {/* PestaÃƒÂ±a 6: Folios */}
                        <TabsContent value="folios" className="space-y-6">
                            <div className="grid gap-6">
                                {/* Folios de Instrumentos */}
                                <div className="border-2 border-violet-200 rounded-lg p-6 bg-gradient-to-br from-violet-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-violet-600 text-white p-3 rounded-lg">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Folios de Instrumentos</h3>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                        <div>
                                            <RequiredLabel htmlFor="tomo_inicial_inst">Tomo Inicial</RequiredLabel>
                                            <Input
                                                id="tomo_inicial_inst"
                                                type="number"
                                                value={foliosData.tomo_inicial_instrumentos}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        tomo_inicial_instrumentos: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="volumenes_tomo_inst">Volúmenes por Tomo</RequiredLabel>
                                            <Input
                                                id="volumenes_tomo_inst"
                                                type="number"
                                                value={foliosData.volumenes_por_tomo_instrumentos}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        volumenes_por_tomo_instrumentos: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="folios_vol_inst">Folios por Volumen</RequiredLabel>
                                            <Input
                                                id="folios_vol_inst"
                                                type="number"
                                                value={foliosData.folios_por_volumen_instrumentos}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        folios_por_volumen_instrumentos: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="volumen_inicial_inst">Volumen Inicial</RequiredLabel>
                                            <Input
                                                id="volumen_inicial_inst"
                                                type="number"
                                                value={foliosData.volumen_inicial_instrumentos}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        volumen_inicial_instrumentos: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="folio_inicial_tomo_inst">Folio Inicial por Tomo</RequiredLabel>
                                            <Input
                                                id="folio_inicial_tomo_inst"
                                                type="number"
                                                value={foliosData.folio_inicial_por_tomo_instrumentos}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        folio_inicial_por_tomo_instrumentos: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Folios de Certificaciones */}
                                <div className="border-2 border-violet-200 rounded-lg p-6 bg-gradient-to-br from-violet-50 to-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="bg-violet-600 text-white p-3 rounded-lg">
                                            <BookOpen className="h-5 w-5" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900">Folios de Certificaciones</h3>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                                        <div>
                                            <RequiredLabel htmlFor="tomo_inicial_cert">Tomo Inicial</RequiredLabel>
                                            <Input
                                                id="tomo_inicial_cert"
                                                type="number"
                                                value={foliosData.tomo_inicial_certificaciones}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        tomo_inicial_certificaciones: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="volumenes_tomo_cert">Volúmenes por Tomo</RequiredLabel>
                                            <Input
                                                id="volumenes_tomo_cert"
                                                type="number"
                                                value={foliosData.volumenes_por_tomo_certificaciones}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        volumenes_por_tomo_certificaciones: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="folios_vol_cert">Folios por Volumen</RequiredLabel>
                                            <Input
                                                id="folios_vol_cert"
                                                type="number"
                                                value={foliosData.folios_por_volumen_certificaciones}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        folios_por_volumen_certificaciones: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="volumen_inicial_cert">Volumen Inicial</RequiredLabel>
                                            <Input
                                                id="volumen_inicial_cert"
                                                type="number"
                                                value={foliosData.volumen_inicial_certificaciones}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        volumen_inicial_certificaciones: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                        <div>
                                            <RequiredLabel htmlFor="folio_inicial_tomo_cert">Folio Inicial por Tomo</RequiredLabel>
                                            <Input
                                                id="folio_inicial_tomo_cert"
                                                type="number"
                                                value={foliosData.folio_inicial_por_tomo_certificaciones}
                                                onChange={(e) =>
                                                    setFoliosData({
                                                        ...foliosData,
                                                        folio_inicial_por_tomo_certificaciones: parseInt(e.target.value) || 0,
                                                    })
                                                }
                                                className="mt-2 bg-white"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </TabsContent>

                    </Tabs>

                {/* Action Buttons */}
                <div className="pt-3 flex mb-3 gap-3 justify-end">

                    <Button
                        onClick={handleSave}
                        className="gap-2"
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <>
                                <div className="size-4 animate-spin rounded-full border-2 border-gray-300 border-t-white"></div>
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="size-4" />
                                {isSaved ? 'Guardado ✓' : 'Actualizar'}
                            </>
                        )}
                    </Button>
                </div>
            </div>

        </div>
        </>
    );
}

ControlNotarialConfiguracionIndex.layout = (page: React.ReactNode) => (
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
            title: 'Configuraciónn',
            href: '/admin/control-notarial/configuracion',
        },
    ]}>
        {page}
    </AppLayout>
);


