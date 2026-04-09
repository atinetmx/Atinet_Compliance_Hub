import { Head, useForm, router } from '@inertiajs/react';
import {
    User,
    Building2,
    Camera,
    IdCard,
    FileText,
    ChevronDown,
    ChevronUp,
    Search,
    Home,
    Phone,
    BookOpen,
    RotateCcw,
    Eye,
    Send,
    QrCode,
    PlusCircle,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { ScannerQR } from '@/components/Admin/RegistroWeb/ScannerQR';
import { ImageOCRScanner } from '@/components/Admin/RegistroWeb/ImageOCRScanner';
import { MissingFieldsModal } from '@/components/Admin/RegistroWeb/MissingFieldsModal';
import { DocumentSelectorModal } from '@/components/Admin/RegistroWeb/DocumentSelectorModal';
import { procesarDatosQR, type ParsedQRData } from '@/utils/qr-parser';
import { processSATQR } from '@/actions/App/Http/Controllers/Admin/OCRController';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { AtinetLoader } from '@/components/ui/AtinetLoader';
import {
    verificarCamposFaltantes,
    getSuggestedDocuments,
    type MissingFieldGroup,
    type DocumentType,
} from '@/utils/field-validation';

interface Props {
    historial: unknown[];
    notaria: string;
    stats: {
        total_nuevos: number;
        total_legacy: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administración', href: '/admin' },
    { title: 'Registro Web', href: '/admin/registro-web', icon: QrCode },
];

type PersonaType = 'fisica' | 'moral';
type SectionKey = 'generales' | 'domicilio' | 'contacto' | 'testador';

const AccordionHeader = ({
    label,
    icon,
    isOpen,
    onToggle,
}: {
    label: string;
    icon: React.ReactNode;
    isOpen: boolean;
    onToggle: () => void;
}) => (
    <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between rounded-t-lg px-5 py-3 text-left text-white transition-all duration-200"
        style={{ background: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)' }}
    >
        <div className="flex items-center gap-3 text-sm font-semibold tracking-wide">
            {icon}
            {label}
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
    </button>
);

const FieldGroup = ({ children }: { children: React.ReactNode }) => (
    <div
        className="grid gap-4 p-5"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
    >
        {children}
    </div>
);

const Field = ({
    label,
    required,
    children,
}: {
    label: string;
    required?: boolean;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-gray-600">
            {label}
            {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
        {children}
    </div>
);

const inputClass =
    'w-full rounded border border-gray-300 px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

const selectClass =
    'w-full rounded border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500';

export default function Index({ notaria, stats }: Props) {
    const [activeTab, setActiveTab] = useState<PersonaType>('fisica');
    const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
        generales: true,
        domicilio: false,
        contacto: false,
        testador: false,
    });
    const [qrScannerOpen, setQrScannerOpen] = useState(false);
    const [ineScannerOpen, setIneScannerOpen] = useState(false);
    const [curpScannerOpen, setCurpScannerOpen] = useState(false);
    const [actaScannerOpen, setActaScannerOpen] = useState(false);
    const [confirmCopyDialog, setConfirmCopyDialog] = useState<{
        isOpen: boolean;
        text: string;
    }>({ isOpen: false, text: '' });

    // Estados para modales de flujo de campos faltantes
    const [missingFieldsModal, setMissingFieldsModal] = useState<{
        isOpen: boolean;
        title: string;
        personData: {
            nombre: string;
            rfc: string;
            curp: string;
        };
        missingGroups: MissingFieldGroup[];
    }>({
        isOpen: false,
        title: '',
        personData: { nombre: '', rfc: '', curp: '' },
        missingGroups: [],
    });

    const [docSelectorModal, setDocSelectorModal] = useState<{
        isOpen: boolean;
        suggestedDocs: DocumentType[];
    }>({
        isOpen: false,
        suggestedDocs: [],
    });

    const { data, setData, post, processing, reset } = useForm({
        persona: 'fisica' as PersonaType,
        notaria: notaria || '',
        alias: '',
        curp: '',
        rfc: '',
        nombre: '',
        apellidopat: '',
        apellidomat: '',
        dia: '',
        genero: '',
        paisnac: 'MEXICO',
        nacionalidad: 'MEXICANA',
        estado_nac: '',
        ciudad_nac: '',
        municipio_nac: '',
        ocupacion: '',
        edo_civil: '',
        calle: '',
        no_exterior: '',
        no_interior: '',
        manzana: '',
        lote: '',
        cp: '',
        colonia: '',
        municipio: '',
        estado: '',
        ciudad: '',
        pais: 'MEXICO',
        calle_fiscal: '',
        no_exterior_fiscal: '',
        no_interior_fiscal: '',
        manzana_fiscal: '',
        lote_fiscal: '',
        cp_fiscal: '',
        colonia_fiscal: '',
        municipio_fiscal: '',
        estado_fiscal: '',
        ciudad_fiscal: '',
        pais_fiscal: 'MEXICO',
        telefono: '',
        telefono_movil: '',
        telefono_oficina: '',
        correo: '',
        gmail2: '',
        documento: '',
        no_identificacion: '',
        vigiencia_de_ine: '',
        autoridad_emisora_usuario: '',
        regimen_fiscal: '',
        servicios_medicos: '',
        id_y_cartainmigracion: '',
        observaciones_adicionales: '',
        padre_nombre: '',
        padre_vive: '',
        sabe_escribir: '',
        sabe_leer: '',
        madre_nombre: '',
        madre_vive: '',
        hijos: '',
        herederos: '',
        herederos_sustitutos: '',
        albacea: '',
        albacea_sustituto: '',
        tutor_tutriz: '',
        tutor_sustituto: '',
        observaciones: '',
    });

    const toggleSection = (section: SectionKey) => {
        setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
    };

    const handleTabChange = (tab: PersonaType) => {
        setActiveTab(tab);
        setData('persona', tab);
    };

    const handleSearchCurp = () => {
        if (!data.curp) return;
        window.open(`/admin/registro-web/search-curp?curp=${data.curp}`, '_blank');
    };

    const handleSearchRfc = () => {
        if (!data.rfc) return;
        window.open(`/admin/registro-web/search-rfc?rfc=${data.rfc}`, '_blank');
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/registro-web');
    };

    const handleClear = () => {
        reset();
        setData('paisnac', 'MEXICO');
        setData('nacionalidad', 'MEXICANA');
        setData('pais', 'MEXICO');
        setData('pais_fiscal', 'MEXICO');
    };

    const handleScanINE = () => setIneScannerOpen(true);
    const handleScanCURP = () => setCurpScannerOpen(true);
    const handleScanActa = () => setActaScannerOpen(true);

    // 🚀 PRECARGA: Cargar Three.js y modelo 3D al inicio para uso instantáneo
    useEffect(() => {
        console.log('📦 Iniciando precarga del loader 3D...');
        AtinetLoader.preload().catch((error) => {
            console.error('⚠️ Error en precarga del loader 3D:', error);
            // No bloqueante - el loader funcionará con carga on-demand
        });
    }, []); // Solo una vez al montar
    const handleScanQR = () => setQrScannerOpen(true);
    const handleManualEntry = () => alert('Captura Manual - Disponible');

    /**
     * Cierra el loader asegurando un tiempo mínimo de visualización (para ver el modelo 3D)
     */
    const closeLoaderWithMinDelay = async (
        loaderInstance: Awaited<ReturnType<typeof AtinetLoader.show>> | null,
        startTime: number,
        minDisplayTime: number = 2000
    ) => {
        if (!loaderInstance) return;

        const elapsed = Date.now() - startTime;
        if (elapsed < minDisplayTime) {
            await new Promise(resolve => setTimeout(resolve, minDisplayTime - elapsed));
        }

        loaderInstance.close();
    };

    /**
     * Procesar QR detectado
     * Flujo completo: Parse → Buscar en BD → Auto-completar con SAT → Verificar campos faltantes
     */
    const handleQRDetected = async (qrText: string) => {
        let loaderInstance: Awaited<ReturnType<typeof AtinetLoader.show>> | null = null;
        const startTime = Date.now(); // Timestamp inicio para delay mínimo

        try {
            // 1. Parsear QR localmente
            const parsedData = procesarDatosQR(qrText);

            if (!parsedData.rfc && !parsedData.urlSAT) {
                // QR no contiene RFC ni URL SAT - mostrar raw
                setConfirmCopyDialog({ isOpen: true, text: qrText });
                return;
            }

            // 2. Buscar en base de datos por RFC
            if (parsedData.rfc) {
                loaderInstance = await AtinetLoader.show({
                    title: 'Buscando en base de datos...',
                    text: `Consultando RFC: ${parsedData.rfc}`,
                    showRings: true,
                });

                const searchResponse = await fetch(
                    `/admin/registro-web/search-rfc?rfc=${encodeURIComponent(parsedData.rfc)}`
                );
                const searchResult = await searchResponse.json();

                if (searchResult.found && searchResult.data) {
                    // ✅ Encontrado en BD
                    await closeLoaderWithMinDelay(loaderInstance, startTime);

                    // Cargar datos de la BD al formulario
                    cargarDatosQR(searchResult.data);

                    // Verificar si tiene campos incompletos
                    const missingGroups = verificarCamposFaltantes(searchResult.data);

                    // Auto-completar con SAT si hay campos faltantes y URL disponible
                    if (missingGroups.length > 0 && parsedData.urlSAT) {
                        loaderInstance = await AtinetLoader.showCompletando();

                        try {
                            const satResponse = await fetch(processSATQR().url, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'X-CSRF-TOKEN':
                                        document
                                            .querySelector('meta[name="csrf-token"]')
                                            ?.getAttribute('content') || '',
                                },
                                body: JSON.stringify({ url: parsedData.urlSAT }),
                            });

                            const satResult = await satResponse.json();

                            if (satResult.success && satResult.data) {
                                // Merge solo campos vacíos (no sobrescribir datos existentes)
                                const mergedData = { ...searchResult.data };
                                Object.entries(satResult.data).forEach(([key, value]) => {
                                    if (
                                        value &&
                                        (!mergedData[key] ||
                                            mergedData[key as keyof typeof mergedData] === '')
                                    ) {
                                        mergedData[key as keyof typeof mergedData] =
                                            value as (typeof mergedData)[keyof typeof mergedData];
                                    }
                                });

                                // Cargar datos combinados
                                cargarDatosQR(mergedData);

                                // Re-verificar campos faltantes después de SAT
                                const updatedMissingGroups = verificarCamposFaltantes(mergedData);

                                await closeLoaderWithMinDelay(loaderInstance, startTime);

                                // Mostrar modal de campos faltantes
                                setMissingFieldsModal({
                                    isOpen: true,
                                    title: '✅ Datos completados con SAT',
                                    personData: {
                                        nombre: `${mergedData.nombre || ''} ${mergedData.apellidopat || ''} ${mergedData.apellidomat || ''}`.trim(),
                                        rfc: mergedData.rfc || '',
                                        curp: mergedData.curp || '',
                                    },
                                    missingGroups: updatedMissingGroups,
                                });

                                toast.success(
                                    '✅ Datos de BD completados con información del SAT'
                                );
                                return;
                            }
                        } catch (satError) {
                            console.warn('No se pudo completar con SAT:', satError);
                            // Continuar con datos de BD aunque SAT falle
                        }
                    }

                    await closeLoaderWithMinDelay(loaderInstance, startTime);

                    // Mostrar modal de campos faltantes (sin auto-complete SAT)
                    setMissingFieldsModal({
                        isOpen: true,
                        title: '✅ Encontrado en Base de Datos',
                        personData: {
                            nombre: `${searchResult.data.nombre || ''} ${searchResult.data.apellidopat || ''} ${searchResult.data.apellidomat || ''}`.trim(),
                            rfc: searchResult.data.rfc || '',
                            curp: searchResult.data.curp || '',
                        },
                        missingGroups: verificarCamposFaltantes(searchResult.data),
                    });

                    toast.success(
                        `✅ Datos encontrados en ${searchResult.source === 'nuevo' ? 'sistema nuevo' : 'sistema legacy'}`
                    );
                    return;
                }

                // ❌ No encontrado en BD - fetch desde SAT
                await closeLoaderWithMinDelay(loaderInstance, startTime);
            }

            // 3. Consultar SAT si no está en BD o no hay RFC
            if (parsedData.urlSAT) {
                loaderInstance = await AtinetLoader.showSAT();

                const satResponse = await fetch(processSATQR().url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({ url: parsedData.urlSAT }),
                });

                const satResult = await satResponse.json();

                await closeLoaderWithMinDelay(loaderInstance, startTime);

                if (satResult.success && satResult.data) {
                    // Cargar datos del SAT
                    cargarDatosQR(satResult.data);

                    // Verificar campos faltantes
                    const missingGroups = verificarCamposFaltantes(satResult.data);

                    // Mostrar modal
                    setMissingFieldsModal({
                        isOpen: true,
                        title: '✅ Datos del SAT cargados',
                        personData: {
                            nombre: `${satResult.data.nombre || ''} ${satResult.data.apellidopat || ''} ${satResult.data.apellidomat || ''}`.trim(),
                            rfc: satResult.data.rfc || '',
                            curp: satResult.data.curp || '',
                        },
                        missingGroups,
                    });

                    toast.success('✅ Datos del SAT cargados correctamente');
                } else {
                    toast.error(
                        '❌ Error al procesar QR del SAT: ' +
                            (satResult.message || 'Error desconocido')
                    );
                }
                return;
            }

            // 4. Cargar datos parseados localmente si no es URL SAT
            if (Object.keys(parsedData).length > 0) {
                cargarDatosQR(parsedData);

                const missingGroups = verificarCamposFaltantes(parsedData);

                setMissingFieldsModal({
                    isOpen: true,
                    title: '✅ Datos del QR cargados',
                    personData: {
                        nombre: `${parsedData.nombre || ''} ${parsedData.apellidopat || ''} ${parsedData.apellidomat || ''}`.trim(),
                        rfc: parsedData.rfc || '',
                        curp: parsedData.curp || '',
                    },
                    missingGroups,
                });

                toast.success('✅ Datos del QR cargados correctamente');
            }
        } catch (error) {
            console.error('Error procesando QR:', error);
            toast.error('❌ Error al procesar el código QR');
            await closeLoaderWithMinDelay(loaderInstance, startTime);
        }
    };

    /**
     * Handler para cuando el usuario elige escanear otro documento
     */
    const handleScanMore = () => {
        // Cerrar modal de campos faltantes
        setMissingFieldsModal({ ...missingFieldsModal, isOpen: false });

        // Obtener documentos sugeridos según campos faltantes
        const suggestedDocs = getSuggestedDocuments(missingFieldsModal.missingGroups);

        // Abrir modal de selección de documento
        setDocSelectorModal({
            isOpen: true,
            suggestedDocs,
        });
    };

    /**
     * Handler para cuando el usuario selecciona un documento específico
     */
    const handleSelectDocument = (doc: DocumentType) => {
        // Cerrar modal de selección
        setDocSelectorModal({ isOpen: false, suggestedDocs: [] });

        // Abrir el scanner correspondiente con un pequeño delay para animación
        setTimeout(() => {
            switch (doc) {
                case 'INE':
                    setIneScannerOpen(true);
                    break;
                case 'CURP':
                    setCurpScannerOpen(true);
                    break;
                case 'Acta':
                    setActaScannerOpen(true);
                    break;
                case 'QR':
                    setQrScannerOpen(true);
                    break;
            }
        }, 150);
    };

    /**
     * Cargar datos desde OCR (INE, CURP, Acta) al formulario
     */
    const handleOCRDataExtracted = (datos: Record<string, any>) => {
        // Determinar tipo de persona
        if (datos.Persona === 'MORAL' || datos.persona === 'moral') {
            setActiveTab('moral');
            setData('persona', 'moral');
        } else if (datos.Persona === 'FISICA' || datos.persona === 'fisica' || datos.curp) {
            setActiveTab('fisica');
            setData('persona', 'fisica');
        }

        // Mapear todos los campos posibles
        const fieldMapping: Record<string, keyof typeof data> = {
            nombre: 'nombre',
            apellidopat: 'apellidopat',
            apellidomat: 'apellidomat',
            curp: 'curp',
            rfc: 'rfc',
            dia: 'dia',
            genero: 'genero',
            paisnac: 'paisnac',
            nacionalidad: 'nacionalidad',
            estado_nac: 'estado_nac',
            ciudad_nac: 'ciudad_nac',
            municipio_nac: 'municipio_nac',
            ocupacion: 'ocupacion',
            calle: 'calle',
            no_exterior: 'no_exterior',
            no_interior: 'no_interior',
            cp: 'cp',
            colonia: 'colonia',
            municipio: 'municipio',
            estado: 'estado',
            ciudad: 'ciudad',
            pais: 'pais',
            calle_fiscal: 'calle_fiscal',
            no_exterior_fiscal: 'no_exterior_fiscal',
            no_interior_fiscal: 'no_interior_fiscal',
            cp_fiscal: 'cp_fiscal',
            colonia_fiscal: 'colonia_fiscal',
            municipio_fiscal: 'municipio_fiscal',
            estado_fiscal: 'estado_fiscal',
            ciudad_fiscal: 'ciudad_fiscal',
            pais_fiscal: 'pais_fiscal',
            correo: 'correo',
            padre_nombre: 'padre_nombre',
            madre_nombre: 'madre_nombre',
            no_identificacion: 'no_identificacion',
            vigiencia_de_ine: 'vigiencia_de_ine',
            regimen_fiscal: 'regimen_fiscal',
        };

        // Actualizar formulario con datos extraídos
        Object.entries(datos).forEach(([key, value]) => {
            const formField = fieldMapping[key];
            if (formField && value !== null && value !== undefined && value !== '') {
                // Convertir CP a string para el formulario
                if (key.includes('cp') && typeof value === 'number') {
                    setData(formField, String(value));
                } else {
                    setData(formField, String(value));
                }
            }
        });

        // Abrir sección de datos generales
        setOpenSections((prev) => ({ ...prev, generales: true }));

        toast.success('✅ Datos cargados correctamente desde el documento');

        // Verificar campos faltantes y mostrar modal
        const missingGroups = verificarCamposFaltantes(data);

        setMissingFieldsModal({
            isOpen: true,
            title: '✅ Datos extraídos del documento',
            personData: {
                nombre: `${data.nombre || ''} ${data.apellidopat || ''} ${data.apellidomat || ''}`.trim(),
                rfc: data.rfc || '',
                curp: data.curp || '',
            },
            missingGroups,
        });
    };

    /**
     * Cargar datos del QR al formulario
     */
    const cargarDatosQR = (datos: ParsedQRData) => {
        // Determinar tipo de persona
        if (datos.Persona === 'MORAL') {
            setActiveTab('moral');
            setData('persona', 'moral');
        } else if (datos.Persona === 'FISICA' || datos.curp) {
            setActiveTab('fisica');
            setData('persona', 'fisica');
        }

        // Mapear campos del QR al formulario
        const updates: Partial<typeof data> = {};

        if (datos.nombre) updates.nombre = datos.nombre;
        if (datos.apellidopat) updates.apellidopat = datos.apellidopat;
        if (datos.apellidomat) updates.apellidomat = datos.apellidomat;
        if (datos.curp) updates.curp = datos.curp;
        if (datos.rfc) updates.rfc = datos.rfc;
        if (datos.dia) updates.dia = datos.dia;
        if (datos.genero) updates.genero = datos.genero;
        if (datos.estado_nac) updates.estado_nac = datos.estado_nac;
        if (datos.municipio_nac) updates.municipio_nac = datos.municipio_nac;
        if (datos.paisnac) updates.paisnac = datos.paisnac;
        if (datos.nacionalidad) updates.nacionalidad = datos.nacionalidad;
        if (datos.padre_nombre) updates.padre_nombre = datos.padre_nombre;
        if (datos.madre_nombre) updates.madre_nombre = datos.madre_nombre;

        // Dirección fiscal (SAT)
        if (datos.calle_fiscal) updates.calle_fiscal = datos.calle_fiscal;
        if (datos.no_exterior_fiscal) updates.no_exterior_fiscal = datos.no_exterior_fiscal;
        if (datos.no_interior_fiscal) updates.no_interior_fiscal = datos.no_interior_fiscal;
        if (datos.colonia_fiscal) updates.colonia_fiscal = datos.colonia_fiscal;
        if (datos.cp_fiscal) updates.cp_fiscal = String(datos.cp_fiscal);
        if (datos.municipio_fiscal) updates.municipio_fiscal = datos.municipio_fiscal;
        if (datos.estado_fiscal) updates.estado_fiscal = datos.estado_fiscal;
        if (datos.correo) updates.correo = datos.correo;

        // Actualizar formulario con todos los datos
        Object.entries(updates).forEach(([key, value]) => {
            setData(key as keyof typeof data, value);
        });

        // Abrir sección de datos generales
        setOpenSections((prev) => ({ ...prev, generales: true }));
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Registro Web" />

            <div className="pb-20">
                {/* Estadísticas */}
                <div className="mb-4 flex justify-end gap-4 text-sm text-muted-foreground">
                    <div>
                        Notaría: <span className="font-semibold">{notaria || 'N/A'}</span>
                    </div>
                    <div>
                        <span className="font-semibold text-sky-600">{stats.total_nuevos}</span> nuevos
                        {' · '}
                        <span className="text-gray-500">{stats.total_legacy}</span> legacy
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-4 flex overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => handleTabChange('fisica')}
                        className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'fisica'
                                ? 'border-b-2 border-sky-600 bg-sky-50 text-sky-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                        <User className="h-4 w-4" />
                        Persona Física
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('moral')}
                        className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'moral'
                                ? 'border-b-2 border-sky-600 bg-sky-50 text-sky-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        }`}
                    >
                        <Building2 className="h-4 w-4" />
                        Persona Moral
                    </button>
                </div>

                {/* Acordeón */}
                <form onSubmit={handleSubmit} className="space-y-2">
                    {/* Datos Generales */}
                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <AccordionHeader
                            label="Datos Generales"
                            icon={<User className="h-4 w-4" />}
                            isOpen={openSections.generales}
                            onToggle={() => toggleSection('generales')}
                        />
                        {openSections.generales && (
                            <div className="bg-white">
                                <FieldGroup>
                                    <Field label="Notaria" required>
                                        <input
                                            className={inputClass}
                                            value={data.notaria}
                                            onChange={(e) => setData('notaria', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Alias">
                                        <input
                                            className={inputClass}
                                            value={data.alias}
                                            onChange={(e) => setData('alias', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="CURP" required>
                                        <div className="flex gap-1">
                                            <input
                                                className={inputClass}
                                                value={data.curp}
                                                onChange={(e) =>
                                                    setData('curp', e.target.value.toUpperCase())
                                                }
                                                maxLength={18}
                                                placeholder="18 caracteres"
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSearchCurp}
                                                className="flex items-center rounded border border-gray-300 bg-gray-50 px-2 hover:border-sky-400 hover:bg-sky-50"
                                            >
                                                <Search className="h-4 w-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </Field>
                                    <Field label="RFC" required>
                                        <div className="flex gap-1">
                                            <input
                                                className={inputClass}
                                                value={data.rfc}
                                                onChange={(e) =>
                                                    setData('rfc', e.target.value.toUpperCase())
                                                }
                                                maxLength={13}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleSearchRfc}
                                                className="flex items-center rounded border border-gray-300 bg-gray-50 px-2 hover:border-sky-400 hover:bg-sky-50"
                                            >
                                                <Search className="h-4 w-4 text-gray-500" />
                                            </button>
                                        </div>
                                    </Field>
                                    <Field label="Nombre(s)" required>
                                        <input
                                            className={inputClass}
                                            value={data.nombre}
                                            onChange={(e) => setData('nombre', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Apellido Paterno" required={activeTab === 'fisica'}>
                                        <input
                                            className={inputClass}
                                            value={data.apellidopat}
                                            onChange={(e) => setData('apellidopat', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Apellido Materno">
                                        <input
                                            className={inputClass}
                                            value={data.apellidomat}
                                            onChange={(e) => setData('apellidomat', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Fecha de Nacimiento" required>
                                        <input
                                            type="date"
                                            className={inputClass}
                                            value={data.dia}
                                            onChange={(e) => setData('dia', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Género" required={activeTab === 'fisica'}>
                                        <select
                                            className={selectClass}
                                            value={data.genero}
                                            onChange={(e) => setData('genero', e.target.value)}
                                        >
                                            <option value="">Seleccione...</option>
                                            <option value="Masculino">Masculino</option>
                                            <option value="Femenino">Femenino</option>
                                            <option value="No binario">No binario</option>
                                        </select>
                                    </Field>
                                    <Field label="País de Nacimiento">
                                        <input
                                            className={inputClass}
                                            value={data.paisnac}
                                            onChange={(e) => setData('paisnac', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Nacionalidad">
                                        <input
                                            className={inputClass}
                                            value={data.nacionalidad}
                                            onChange={(e) => setData('nacionalidad', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Estado de Nacimiento">
                                        <input
                                            className={inputClass}
                                            value={data.estado_nac}
                                            onChange={(e) => setData('estado_nac', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Ciudad de Nacimiento">
                                        <input
                                            className={inputClass}
                                            value={data.ciudad_nac}
                                            onChange={(e) => setData('ciudad_nac', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Municipio de Nacimiento">
                                        <input
                                            className={inputClass}
                                            value={data.municipio_nac}
                                            onChange={(e) => setData('municipio_nac', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Ocupación">
                                        <input
                                            className={inputClass}
                                            value={data.ocupacion}
                                            onChange={(e) => setData('ocupacion', e.target.value)}
                                        />
                                    </Field>
                                    <Field label="Estado Civil">
                                        <select
                                            className={selectClass}
                                            value={data.edo_civil}
                                            onChange={(e) => setData('edo_civil', e.target.value)}
                                        >
                                            <option value="">Seleccione...</option>
                                            <option value="Soltero(a)">Soltero(a)</option>
                                            <option value="Casado(a)">Casado(a)</option>
                                            <option value="Divorciado(a)">Divorciado(a)</option>
                                            <option value="Viudo(a)">Viudo(a)</option>
                                            <option value="Unión libre">Unión libre</option>
                                        </select>
                                    </Field>
                                </FieldGroup>
                            </div>
                        )}
                    </div>

                    {/* Domicilio */}
                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <AccordionHeader
                            label="Domicilio"
                            icon={<Home className="h-4 w-4" />}
                            isOpen={openSections.domicilio}
                            onToggle={() => toggleSection('domicilio')}
                        />
                        {openSections.domicilio && (
                            <div className="bg-white">
                                <p className="px-5 pt-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Domicilio Particular
                                </p>
                                <FieldGroup>
                                    <Field label="Calle">
                                        <input className={inputClass} value={data.calle} onChange={(e) => setData('calle', e.target.value)} />
                                    </Field>
                                    <Field label="No. Exterior">
                                        <input className={inputClass} value={data.no_exterior} onChange={(e) => setData('no_exterior', e.target.value)} />
                                    </Field>
                                    <Field label="No. Interior">
                                        <input className={inputClass} value={data.no_interior} onChange={(e) => setData('no_interior', e.target.value)} />
                                    </Field>
                                    <Field label="Manzana">
                                        <input className={inputClass} value={data.manzana} onChange={(e) => setData('manzana', e.target.value)} />
                                    </Field>
                                    <Field label="Lote">
                                        <input className={inputClass} value={data.lote} onChange={(e) => setData('lote', e.target.value)} />
                                    </Field>
                                    <Field label="Código Postal">
                                        <input className={inputClass} maxLength={5} value={data.cp} onChange={(e) => setData('cp', e.target.value)} />
                                    </Field>
                                    <Field label="Colonia">
                                        <input className={inputClass} value={data.colonia} onChange={(e) => setData('colonia', e.target.value)} />
                                    </Field>
                                    <Field label="Municipio">
                                        <input className={inputClass} value={data.municipio} onChange={(e) => setData('municipio', e.target.value)} />
                                    </Field>
                                    <Field label="Estado">
                                        <input className={inputClass} value={data.estado} onChange={(e) => setData('estado', e.target.value)} />
                                    </Field>
                                    <Field label="Ciudad">
                                        <input className={inputClass} value={data.ciudad} onChange={(e) => setData('ciudad', e.target.value)} />
                                    </Field>
                                    <Field label="País">
                                        <input className={inputClass} value={data.pais} onChange={(e) => setData('pais', e.target.value)} />
                                    </Field>
                                </FieldGroup>
                                <div className="flex items-center justify-center p-3">
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 rounded bg-sky-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-700"
                                        onClick={() => {
                                            setData('calle_fiscal', data.calle);
                                            setData('no_exterior_fiscal', data.no_exterior);
                                            setData('no_interior_fiscal', data.no_interior);
                                            setData('manzana_fiscal', data.manzana);
                                            setData('lote_fiscal', data.lote);
                                            setData('cp_fiscal', data.cp);
                                            setData('colonia_fiscal', data.colonia);
                                            setData('municipio_fiscal', data.municipio);
                                            setData('estado_fiscal', data.estado);
                                            setData('ciudad_fiscal', data.ciudad);
                                            setData('pais_fiscal', data.pais);
                                        }}
                                    >
                                        📋 Copiar dirección al Domicilio Fiscal
                                    </button>
                                </div>
                                <p className="px-5 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                                    Domicilio Fiscal
                                </p>
                                <FieldGroup>
                                    <Field label="Calle">
                                        <input className={inputClass} value={data.calle_fiscal} onChange={(e) => setData('calle_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="No. Exterior">
                                        <input className={inputClass} value={data.no_exterior_fiscal} onChange={(e) => setData('no_exterior_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="No. Interior">
                                        <input className={inputClass} value={data.no_interior_fiscal} onChange={(e) => setData('no_interior_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="Manzana">
                                        <input className={inputClass} value={data.manzana_fiscal} onChange={(e) => setData('manzana_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="Lote">
                                        <input className={inputClass} value={data.lote_fiscal} onChange={(e) => setData('lote_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="Código Postal">
                                        <input className={inputClass} maxLength={5} value={data.cp_fiscal} onChange={(e) => setData('cp_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="Colonia">
                                        <input className={inputClass} value={data.colonia_fiscal} onChange={(e) => setData('colonia_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="Municipio">
                                        <input className={inputClass} value={data.municipio_fiscal} onChange={(e) => setData('municipio_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="Estado">
                                        <input className={inputClass} value={data.estado_fiscal} onChange={(e) => setData('estado_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="Ciudad">
                                        <input className={inputClass} value={data.ciudad_fiscal} onChange={(e) => setData('ciudad_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="País">
                                        <input className={inputClass} value={data.pais_fiscal} onChange={(e) => setData('pais_fiscal', e.target.value)} />
                                    </Field>
                                </FieldGroup>
                                <div className="flex items-center justify-center p-3">
                                    <button
                                        type="button"
                                        className="flex items-center gap-2 rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
                                        onClick={() => {
                                            setData('calle', data.calle_fiscal);
                                            setData('no_exterior', data.no_exterior_fiscal);
                                            setData('no_interior', data.no_interior_fiscal);
                                            setData('manzana', data.manzana_fiscal);
                                            setData('lote', data.lote_fiscal);
                                            setData('cp', data.cp_fiscal);
                                            setData('colonia', data.colonia_fiscal);
                                            setData('municipio', data.municipio_fiscal);
                                            setData('estado', data.estado_fiscal);
                                            setData('ciudad', data.ciudad_fiscal);
                                            setData('pais', data.pais_fiscal);
                                        }}
                                    >
                                        📋 Copiar dirección al Domicilio Particular
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Datos de Contacto */}
                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <AccordionHeader
                            label="Datos de Contacto"
                            icon={<Phone className="h-4 w-4" />}
                            isOpen={openSections.contacto}
                            onToggle={() => toggleSection('contacto')}
                        />
                        {openSections.contacto && (
                            <div className="bg-white">
                                <FieldGroup>
                                    <Field label="Teléfono">
                                        <input className={inputClass} value={data.telefono} onChange={(e) => setData('telefono', e.target.value)} />
                                    </Field>
                                    <Field label="Teléfono Móvil">
                                        <input className={inputClass} value={data.telefono_movil} onChange={(e) => setData('telefono_movil', e.target.value)} />
                                    </Field>
                                    <Field label="Teléfono Oficina">
                                        <input className={inputClass} value={data.telefono_oficina} onChange={(e) => setData('telefono_oficina', e.target.value)} />
                                    </Field>
                                    <Field label="Correo Electrónico">
                                        <input type="email" className={inputClass} value={data.correo} onChange={(e) => setData('correo', e.target.value)} />
                                    </Field>
                                    <Field label="Correo Alternativo">
                                        <input type="email" className={inputClass} value={data.gmail2} onChange={(e) => setData('gmail2', e.target.value)} />
                                    </Field>
                                    <Field label="Documento Identificación">
                                        <input className={inputClass} value={data.documento} onChange={(e) => setData('documento', e.target.value)} />
                                    </Field>
                                    <Field label="No. Identificación">
                                        <input className={inputClass} value={data.no_identificacion} onChange={(e) => setData('no_identificacion', e.target.value)} />
                                    </Field>
                                    <Field label="Vigencia INE">
                                        <input type="date" className={inputClass} value={data.vigiencia_de_ine} onChange={(e) => setData('vigiencia_de_ine', e.target.value)} />
                                    </Field>
                                    <Field label="Autoridad Emisora">
                                        <input className={inputClass} value={data.autoridad_emisora_usuario} onChange={(e) => setData('autoridad_emisora_usuario', e.target.value)} />
                                    </Field>
                                    <Field label="Régimen Fiscal">
                                        <input className={inputClass} value={data.regimen_fiscal} onChange={(e) => setData('regimen_fiscal', e.target.value)} />
                                    </Field>
                                    <Field label="Servicios Médicos">
                                        <input className={inputClass} value={data.servicios_medicos} onChange={(e) => setData('servicios_medicos', e.target.value)} />
                                    </Field>
                                    <Field label="ID y Carta Inmigración">
                                        <input className={inputClass} value={data.id_y_cartainmigracion} onChange={(e) => setData('id_y_cartainmigracion', e.target.value)} />
                                    </Field>
                                    <Field label="Observaciones Adicionales">
                                        <input className={inputClass} value={data.observaciones_adicionales} onChange={(e) => setData('observaciones_adicionales', e.target.value)} />
                                    </Field>
                                </FieldGroup>
                            </div>
                        )}
                    </div>

                    {/* Datos del Testador */}
                    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm">
                        <AccordionHeader
                            label="Datos del Testador"
                            icon={<BookOpen className="h-4 w-4" />}
                            isOpen={openSections.testador}
                            onToggle={() => toggleSection('testador')}
                        />
                        {openSections.testador && (
                            <div className="bg-white">
                                <FieldGroup>
                                    <Field label="¿Sabe Escribir?">
                                        <select className={selectClass} value={data.sabe_escribir} onChange={(e) => setData('sabe_escribir', e.target.value)}>
                                            <option value="">Seleccione...</option>
                                            <option value="Si">Sí</option>
                                            <option value="No">No</option>
                                        </select>
                                    </Field>
                                    <Field label="¿Sabe Leer?">
                                        <select className={selectClass} value={data.sabe_leer} onChange={(e) => setData('sabe_leer', e.target.value)}>
                                            <option value="">Seleccione...</option>
                                            <option value="Si">Sí</option>
                                            <option value="No">No</option>
                                        </select>
                                    </Field>
                                    <Field label="Nombre del Padre">
                                        <input className={inputClass} value={data.padre_nombre} onChange={(e) => setData('padre_nombre', e.target.value)} />
                                    </Field>
                                    <Field label="¿Padre Vive?">
                                        <select className={selectClass} value={data.padre_vive} onChange={(e) => setData('padre_vive', e.target.value)}>
                                            <option value="">Seleccione...</option>
                                            <option value="Si">Sí</option>
                                            <option value="No">No</option>
                                        </select>
                                    </Field>
                                    <Field label="Nombre de la Madre">
                                        <input className={inputClass} value={data.madre_nombre} onChange={(e) => setData('madre_nombre', e.target.value)} />
                                    </Field>
                                    <Field label="¿Madre Vive?">
                                        <select className={selectClass} value={data.madre_vive} onChange={(e) => setData('madre_vive', e.target.value)}>
                                            <option value="">Seleccione...</option>
                                            <option value="Si">Sí</option>
                                            <option value="No">No</option>
                                        </select>
                                    </Field>
                                    <Field label="Hijos (separar por comas)">
                                        <input className={inputClass} value={data.hijos} onChange={(e) => setData('hijos', e.target.value)} placeholder="Nombre1, Nombre2, ..." />
                                    </Field>
                                    <Field label="Herederos">
                                        <input className={inputClass} value={data.herederos} onChange={(e) => setData('herederos', e.target.value)} />
                                    </Field>
                                    <Field label="Herederos Sustitutos">
                                        <input className={inputClass} value={data.herederos_sustitutos} onChange={(e) => setData('herederos_sustitutos', e.target.value)} />
                                    </Field>
                                    <Field label="Albacea">
                                        <input className={inputClass} value={data.albacea} onChange={(e) => setData('albacea', e.target.value)} />
                                    </Field>
                                    <Field label="Albacea Sustituto">
                                        <input className={inputClass} value={data.albacea_sustituto} onChange={(e) => setData('albacea_sustituto', e.target.value)} />
                                    </Field>
                                    <Field label="Tutor/Tutriz">
                                        <input className={inputClass} value={data.tutor_tutriz} onChange={(e) => setData('tutor_tutriz', e.target.value)} />
                                    </Field>
                                    <Field label="Tutor Sustituto">
                                        <input className={inputClass} value={data.tutor_sustituto} onChange={(e) => setData('tutor_sustituto', e.target.value)} />
                                    </Field>
                                    <Field label="Observaciones del Testamento">
                                        <input className={inputClass} value={data.observaciones} onChange={(e) => setData('observaciones', e.target.value)} />
                                    </Field>
                                </FieldGroup>
                            </div>
                        )}
                    </div>
                </form>
            </div>

            {/* Botones flotantes laterales */}
            <div className="fixed right-6 top-1/2 z-50 flex -translate-y-1/2 flex-col gap-3">
                <button
                    type="button"
                    onClick={handleScanINE}
                    title="Escanear INE (OCR)"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: '#0284c7' }}
                >
                    <Camera className="h-5 w-5" />
                </button>
                <button
                    type="button"
                    onClick={handleScanCURP}
                    title="Escanear CURP"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: '#ea580c' }}
                >
                    <IdCard className="h-5 w-5" />
                </button>
                <button
                    type="button"
                    onClick={handleScanActa}
                    title="Escanear Acta de Nacimiento"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: '#7c3aed' }}
                >
                    <FileText className="h-5 w-5" />
                </button>
                <button
                    type="button"
                    onClick={handleScanQR}
                    title="Escanear Código QR de INE"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: '#16a34a' }}
                >
                    <QrCode className="h-5 w-5" />
                </button>
                <button
                    type="button"
                    onClick={handleManualEntry}
                    title="Captura Manual de Datos"
                    className="flex h-12 w-12 items-center justify-center rounded-full text-white shadow-lg transition-transform hover:scale-110"
                    style={{ backgroundColor: '#0ea5e9' }}
                >
                    <PlusCircle className="h-5 w-5" />
                </button>
            </div>

            {/* Barra de acciones inferior fija (dentro del contenedor) */}
            <div className="sticky bottom-0 z-40 mt-4 flex border-t border-gray-200 bg-white shadow-lg">
                <button
                    type="button"
                    onClick={handleClear}
                    className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#374151' }}
                >
                    <RotateCcw className="h-4 w-4" />
                    Limpiar
                </button>
                <button
                    type="button"
                    className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#0284c7' }}
                    onClick={() => alert('Vista Previa - Pendiente')}
                >
                    <Eye className="h-4 w-4" />
                    Vista Previa
                </button>
                <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={processing}
                    className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#16a34a' }}
                >
                    <Send className="h-4 w-4" />
                    {processing ? 'Guardando...' : 'Guardar Registro'}
                </button>
            </div>

            {/* Scanner QR Modal */}
            <ScannerQR
                isOpen={qrScannerOpen}
                onClose={() => setQrScannerOpen(false)}
                onQRDetected={handleQRDetected}
            />

            {/* Scanner INE Modal */}
            <ImageOCRScanner
                isOpen={ineScannerOpen}
                onClose={() => setIneScannerOpen(false)}
                onDataExtracted={handleOCRDataExtracted}
                endpoint="/admin/ocr/ine"
                title="Escanear INE (Credencial de Elector)"
                documentType="INE"
                requiresSide={true}
            />

            {/* Scanner CURP Modal */}
            <ImageOCRScanner
                isOpen={curpScannerOpen}
                onClose={() => setCurpScannerOpen(false)}
                onDataExtracted={handleOCRDataExtracted}
                endpoint="/admin/ocr/curp"
                title="Escanear Documento CURP"
                documentType="CURP"
            />

            {/* Scanner Acta Modal */}
            <ImageOCRScanner
                isOpen={actaScannerOpen}
                onClose={() => setActaScannerOpen(false)}
                onDataExtracted={handleOCRDataExtracted}
                endpoint="/admin/ocr/acta"
                title="Escanear Acta de Nacimiento"
                documentType="ACTA"
            />

            {/* Confirm Copy QR Dialog */}
            <ConfirmDialog
                isOpen={confirmCopyDialog.isOpen}
                onClose={() => setConfirmCopyDialog({ isOpen: false, text: '' })}
                title="QR Escaneado"
                description={
                    <div className="space-y-2">
                        <p className="text-sm">No se pudo procesar automáticamente el contenido del QR:</p>
                        <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-48">
                            {confirmCopyDialog.text}
                        </pre>
                    </div>
                }
                confirmText="Copiar al portapapeles"
                cancelText="Cerrar"
                onConfirm={async () => {
                    await navigator.clipboard.writeText(confirmCopyDialog.text);
                    toast.success('📋 Copiado al portapapeles');
                }}
            />

            {/* Missing Fields Modal - Muestra campos faltantes después de escanear */}
            <MissingFieldsModal
                isOpen={missingFieldsModal.isOpen}
                onClose={() => setMissingFieldsModal({ ...missingFieldsModal, isOpen: false })}
                title={missingFieldsModal.title}
                personData={missingFieldsModal.personData}
                missingGroups={missingFieldsModal.missingGroups}
                onScanMore={handleScanMore}
            />

            {/* Document Selector Modal - Sugiere qué documento escanear */}
            <DocumentSelectorModal
                isOpen={docSelectorModal.isOpen}
                onClose={() => setDocSelectorModal({ isOpen: false, suggestedDocs: [] })}
                suggestedDocs={docSelectorModal.suggestedDocs}
                onSelectDocument={handleSelectDocument}
            />
        </AppLayout>
    );
}
