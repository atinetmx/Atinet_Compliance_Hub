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
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { AtinetLoader } from '@/components/ui/AtinetLoader';
import CodigoPostalInput from '@/components/Admin/CodigoPostalInput';
import {
    verificarCamposFaltantes,
    getSuggestedDocuments,
    type MissingFieldGroup,
    type DocumentType,
} from '@/utils/field-validation';

interface Props {
    historial: unknown[];
    notaria: string | null;
    notaria_nombre: string | null;
    has_notaria: boolean;
    is_super_admin: boolean;
    registro_web_url: string | null;
    flash?: { success?: string; error?: string };
    stats: {
        total_nuevos: number;
        total_legacy: number;
    };
}

const PROCESS_SAT_QR_URL = '/admin/ocr/sat-qr';

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

function RegistroWebDevView({ notaria, notaria_nombre, has_notaria, stats, flash }: Props) {
    const [activeTab, setActiveTab] = useState<PersonaType>('fisica');
    const [personTypeLockedByQR, setPersonTypeLockedByQR] = useState(false); // Bloquear cambio de tipo cuando viene del QR
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

    const [showVistaPrevia, setShowVistaPrevia] = useState(false);

    // Diálogo de confirmación para flujo SAT (promise-based para usarlo en async)
    const [satConfirmDialog, setSatConfirmDialog] = useState<{
        isOpen: boolean;
        title: string;
        body: string;
        confirmText?: string;
        cancelText?: string;
        variant?: 'question' | 'warning';
        resolve: ((value: boolean) => void) | null;
    }>({ isOpen: false, title: '', body: '', resolve: null });

    const askSatConfirm = (title: string, body: string, confirmText?: string, cancelText?: string, variant?: 'question' | 'warning'): Promise<boolean> => {
        return new Promise((resolve) => {
            setSatConfirmDialog({ isOpen: true, title, body, confirmText, cancelText, variant: variant ?? 'question', resolve });
        });
    };

    const resolveSatConfirm = (value: boolean) => {
        setSatConfirmDialog(prev => {
            prev.resolve?.(value);
            return { isOpen: false, title: '', body: '', resolve: null };
        });
    };

    const [docSelectorModal, setDocSelectorModal] = useState<{
        isOpen: boolean;
        suggestedDocs: DocumentType[];
    }>({
        isOpen: false,
        suggestedDocs: [],
    });

    const { data, setData, post, processing, reset, errors } = useForm({
        persona: 'fisica' as PersonaType,
        notaria: notaria_nombre || notaria || '',
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
        // No permitir cambio si el tipo fue detectado automáticamente
        if (personTypeLockedByQR) {
            toast.warning('⚠️ El tipo de persona fue detectado automáticamente y no puede cambiarse');
            return;
        }
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
        console.group('📤 [RegistroWeb] Enviando formulario');
        console.log('📋 Datos del formulario:', { ...data });
        console.log('🔑 Campos clave:', {
            rfc: data.rfc,
            curp: data.curp,
            notaria: data.notaria,
            sabe_escribir: data.sabe_escribir,
            sabe_leer: data.sabe_leer,
            persona: data.persona,
        });
        console.groupEnd();
        post('/admin/registro-web', {
            onError: (errors) => {
                console.error('❌ [RegistroWeb] Errores de validación:', errors);
                const mensajes = Object.values(errors).flat() as string[];
                if (mensajes.length > 0) {
                    setDatosIncompletosModal({ isOpen: true, errores: mensajes });
                }
            },
            onSuccess: () => {
                console.log('✅ [RegistroWeb] Guardado exitosamente');
            },
        });
    };

    // Estado modal "Datos incompletos" (validación client-side igual al legacy)
    const [datosIncompletosModal, setDatosIncompletosModal] = useState<{
        isOpen: boolean;
        errores: string[];
    }>({ isOpen: false, errores: [] });

    // Validación client-side replicando validar() del legacy form-manager.js
    const validarFormulario = (): string[] => {
        const errores: string[] = [];

        if (!data.notaria) errores.push('La notaría es obligatoria');
        if (!data.rfc || data.rfc.length < 12) errores.push('El RFC es obligatorio (mínimo 12 caracteres)');
        if (data.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.correo)) {
            errores.push('El formato del correo electrónico no es válido');
        }

        if (activeTab === 'fisica') {
            if (!data.curp || data.curp.length !== 18) errores.push('El CURP debe tener 18 caracteres');
            if (!data.nombre) errores.push('El nombre es obligatorio');
            if (!data.apellidopat) errores.push('El apellido paterno es obligatorio');
            if (!data.dia) errores.push('La fecha de nacimiento es obligatoria');
            if (!data.genero) errores.push('El género es obligatorio');
        }

        if (activeTab === 'moral') {
            if (!data.nombre) errores.push('La razón social es obligatoria');
        }

        return errores;
    };

    // Abrir Vista Previa solo si pasa validación client-side
    const handleAbrirVistaPrevia = () => {
        const errores = validarFormulario();
        if (errores.length > 0) {
            setDatosIncompletosModal({ isOpen: true, errores });
            return;
        }
        setShowVistaPrevia(true);
    };

    // Mostrar toast de éxito/error al volver del redirect post-guardado
    useEffect(() => {
        if (flash?.success) toast.success(`✅ ${flash.success}`);
        if (flash?.error) toast.error(`❌ ${flash.error}`);
    }, [flash]);

    // Mostrar errores de validación del servidor
    useEffect(() => {
        const errList = Object.values(errors);
        if (errList.length > 0) {
            errList.forEach((msg) => toast.error(`❌ ${msg}`));
        }
    }, [errors]);

    const handleClear = () => {
        reset();
        setData('paisnac', 'MEXICO');
        setData('nacionalidad', 'MEXICANA');
        setData('pais', 'MEXICO');
        setData('pais_fiscal', 'MEXICO');
        setPersonTypeLockedByQR(false); // Desbloquear selector al limpiar
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

    // 🏛️ AUTO-COMPLETAR RÉGIMEN FISCAL: cuando se recibe un código SAT (2-3 dígitos), resolver descripción
    useEffect(() => {
        const codigo = data.regimen_fiscal?.trim();
        if (!codigo || !/^\d{2,3}$/.test(codigo)) return;

        fetch(`/admin/catalogos/regimen-fiscal?codigo=${codigo}`)
            .then((r) => r.json())
            .then((result) => {
                if (result.success && result.data?.descripcion) {
                    setData('regimen_fiscal', result.data.descripcion);
                }
            })
            .catch(() => {}); // silencioso — el campo queda editable
    }, [data.regimen_fiscal]);

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

            // Verificar si el QR tiene datos útiles
            const hasUsefulData = parsedData.rfc ||
                                  parsedData.urlSAT ||
                                  parsedData.curp ||
                                  parsedData.nombre ||
                                  parsedData.apellidopat ||
                                  parsedData._tipoDocumento;

            if (!hasUsefulData) {
                // QR no reconocido - mostrar texto crudo para copiar
                setConfirmCopyDialog({ isOpen: true, text: qrText });
                toast.info('ℹ️ QR no reconocido. Puedes copiar el contenido manualmente.');
                return;
            }

            console.log('📄 Tipo de documento detectado:', parsedData._tipoDocumento || 'desconocido');
            console.log('📊 Datos parseados:', parsedData);

            console.log('📄 Tipo de documento detectado:', parsedData._tipoDocumento || 'desconocido');
            console.log('📊 Datos parseados:', parsedData);

            // 2. Buscar en base de datos por RFC (solo si tiene RFC)
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

                    // Preguntar si completar con SAT cuando hay campos faltantes
                    if (missingGroups.length > 0 && parsedData.urlSAT) {
                        const nombre = `${searchResult.data.nombre || ''} ${searchResult.data.apellidopat || ''}`.trim() || searchResult.data.rfc || 'la persona';
                        const confirmar = await askSatConfirm(
                            '¿Completar con SAT?',
                            `Se encontró a ${nombre} en la base de datos, pero faltan algunos campos (${missingGroups.map(g => g.name).join(', ')}).\n\n¿Deseas completar la información consultando la constancia fiscal del SAT?`
                        );

                        if (!confirmar) {
                            // Usuario dijo No → usar solo datos de BD
                            await closeLoaderWithMinDelay(loaderInstance, startTime);
                            setMissingFieldsModal({
                                isOpen: true,
                                title: '✅ Encontrado en Base de Datos',
                                personData: {
                                    nombre: `${searchResult.data.nombre || ''} ${searchResult.data.apellidopat || ''} ${searchResult.data.apellidomat || ''}`.trim(),
                                    rfc: searchResult.data.rfc || '',
                                    curp: searchResult.data.curp || '',
                                },
                                missingGroups,
                            });
                            toast.success(`✅ Datos encontrados en ${searchResult.source === 'nuevo' ? 'sistema nuevo' : 'sistema legacy'}`);
                            return;
                        }

                        loaderInstance = await AtinetLoader.showCompletando();

                        try {
                            const satResponse = await fetch(PROCESS_SAT_QR_URL, {
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
                // Cargar datos básicos primero (los que se extrajeron sin IA)
                const basicFields = Object.keys(parsedData).filter(k => !k.startsWith('_')).length;
                if (basicFields > 0) {
                    cargarDatosQR(parsedData);
                }

                // Preguntar si procesar con IA (como en el legacy)
                const nombreBasico = `${parsedData.nombre || ''} ${parsedData.apellidopat || ''}`.trim();
                const rfcBasico = parsedData.rfc || '';
                const descripcion = rfcBasico
                    ? `RFC ${rfcBasico}${nombreBasico ? ` (${nombreBasico})` : ''} no se encontró en la base de datos.`
                    : 'No se encontró en la base de datos.';

                const confirmarIA = await askSatConfirm(
                    '¿Procesar con Inteligencia Artificial?',
                    `${descripcion}\n\nSe cargaron los datos básicos de la constancia fiscal. ¿Deseas procesarla con IA para extraer información adicional como domicilio, régimen fiscal y más campos?`
                );

                if (!confirmarIA) {
                    // Usar solo datos básicos ya cargados
                    const missingGroupsBasic = verificarCamposFaltantes(parsedData);
                    setMissingFieldsModal({
                        isOpen: true,
                        title: '✅ Datos básicos cargados',
                        personData: {
                            nombre: nombreBasico,
                            rfc: rfcBasico,
                            curp: parsedData.curp || '',
                        },
                        missingGroups: missingGroupsBasic,
                    });
                    return;
                }

                loaderInstance = await AtinetLoader.showSAT();

                const satResponse = await fetch(PROCESS_SAT_QR_URL, {
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
                    // Detectar errores de saturación del servicio
                    const errorMsg = satResult.message || 'Error desconocido';
                    const isSaturationError =
                        errorMsg.includes('saturado') ||
                        errorMsg.includes('high demand') ||
                        errorMsg.includes('overloaded') ||
                        errorMsg.includes('rate limit');

                    if (isSaturationError) {
                        toast.error(
                            '⏳ El servicio está temporalmente saturado. ' +
                            'Por favor intenta de nuevo en unos momentos.',
                            { duration: 6000 }
                        );
                    } else {
                        toast.error(
                            '❌ Error al procesar QR del SAT: ' + errorMsg,
                            { duration: 5000 }
                        );
                    }
                }
                return;
            }

            // 4. Cargar datos parseados localmente (CURP, Acta de Nacimiento, u otros)
            if (Object.keys(parsedData).filter(k => !k.startsWith('_')).length > 0) {
                cargarDatosQR(parsedData);

                const missingGroups = verificarCamposFaltantes(parsedData);

                // Determinar título según tipo de documento
                let title = '✅ Datos del QR cargados';
                if (parsedData._tipoDocumento === 'curp') {
                    title = '✅ Datos de CURP cargados';
                } else if (parsedData._tipoDocumento === 'acta_nacimiento') {
                    title = '✅ Datos de Acta de Nacimiento cargados';
                } else if (parsedData._tipoDocumento === 'sat') {
                    title = '✅ Datos del SAT cargados';
                }

                setMissingFieldsModal({
                    isOpen: true,
                    title,
                    personData: {
                        nombre: `${parsedData.nombre || ''} ${parsedData.apellidopat || ''} ${parsedData.apellidomat || ''}`.trim(),
                        rfc: parsedData.rfc || '',
                        curp: parsedData.curp || '',
                    },
                    missingGroups,
                });

                toast.success(
                    parsedData._tipoDocumento === 'curp'
                        ? '✅ Datos de CURP cargados correctamente'
                        : parsedData._tipoDocumento === 'acta_nacimiento'
                        ? '✅ Datos de Acta de Nacimiento cargados correctamente'
                        : '✅ Datos del QR cargados correctamente'
                );
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
            vigencia: 'vigiencia_de_ine',
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
            setPersonTypeLockedByQR(true); // Bloquear cambio de selector
        } else if (datos.Persona === 'FISICA' || datos.curp) {
            setActiveTab('fisica');
            setData('persona', 'fisica');
            setPersonTypeLockedByQR(true); // Bloquear cambio de selector
        }

        // Mapear campos del QR al formulario
        const updates: Partial<typeof data> = {};

        if (datos.nombre) updates.nombre = datos.nombre;
        if (datos.apellidopat) updates.apellidopat = datos.apellidopat;
        if (datos.apellidomat) updates.apellidomat = datos.apellidomat;
        if (datos.curp) updates.curp = datos.curp;
        if (datos.rfc) updates.rfc = datos.rfc;
        if (datos.dia) updates.dia = datos.dia;
        if (datos.genero) {
            // Normalizar a H/M independientemente de lo que venga del SAT/OCR
            const g = datos.genero.toString().toUpperCase();
            updates.genero = (g === 'H' || g === 'HOMBRE' || g === 'MASCULINO' || g === 'M_HOMBRE') ? 'H' : 'M';
        }
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
        if (datos.pais_fiscal) updates.pais_fiscal = datos.pais_fiscal;
        if (datos.correo) updates.correo = datos.correo;
        if (datos.regimen_fiscal) updates.regimen_fiscal = String(datos.regimen_fiscal);

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
                        disabled={personTypeLockedByQR}
                        title={personTypeLockedByQR ? 'Tipo de persona detectado automáticamente' : ''}
                        className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'fisica'
                                ? 'border-b-2 border-sky-600 bg-sky-50 text-sky-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                        } ${
                            personTypeLockedByQR
                                ? 'cursor-not-allowed opacity-60'
                                : ''
                        }`}
                    >
                        <User className="h-4 w-4" />
                        Persona Física
                        {personTypeLockedByQR && activeTab === 'fisica' && (
                            <span className="ml-1 text-xs text-sky-600">🔒</span>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => handleTabChange('moral')}
                        disabled={personTypeLockedByQR}
                        title={personTypeLockedByQR ? 'Tipo de persona detectado automáticamente' : ''}
                        className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
                            activeTab === 'moral'
                                ? 'border-b-2 border-sky-600 bg-sky-50 text-sky-700'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-70 0'
                        } ${
                            personTypeLockedByQR
                                ? 'cursor-not-allowed opacity-60'
                                : ''
                        }`}
                    >
                        <Building2 className="h-4 w-4" />
                        Persona Moral
                        {personTypeLockedByQR && activeTab === 'moral' && (
                            <span className="ml-1 text-xs text-sky-600">🔒</span>
                        )}
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
                                            className={has_notaria ? `${inputClass} cursor-not-allowed bg-gray-100 text-gray-500` : inputClass}
                                            value={data.notaria}
                                            readOnly={has_notaria}
                                            tabIndex={has_notaria ? -1 : undefined}
                                            title={has_notaria ? 'Este campo se asigna automáticamente según tu notaría' : undefined}
                                            onChange={has_notaria ? undefined : (e) => setData('notaria', e.target.value)}
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
                                            <option value="H">Hombre</option>
                                            <option value="M">Mujer</option>
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
                                        <CodigoPostalInput
                                            label=""
                                            value={data.cp}
                                            onChange={(v) => setData('cp', v)}
                                            coloniaValue={data.colonia}
                                            onColoniaChange={(v) => setData('colonia', v)}
                                            onAutoComplete={(cpData) => {
                                                setData('estado', cpData.estado);
                                                setData('municipio', cpData.municipio);
                                                if (cpData.ciudad) setData('ciudad', cpData.ciudad);
                                                if (cpData.colonia) setData('colonia', cpData.colonia);
                                            }}
                                            showColoniaSelector={false}
                                        />
                                    </Field>
                                    <Field label="Colonia">
                                        <input className={inputClass} value={data.colonia} onChange={(e) => setData('colonia', e.target.value)} placeholder="Auto-completa con el CP" />
                                    </Field>
                                    <Field label="Municipio">
                                        <input className={inputClass} value={data.municipio} onChange={(e) => setData('municipio', e.target.value)} placeholder="Auto-completa con el CP" />
                                    </Field>
                                    <Field label="Estado">
                                        <input className={inputClass} value={data.estado} onChange={(e) => setData('estado', e.target.value)} placeholder="Auto-completa con el CP" />
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
                                        onClick={async () => {
                                            const camposLlenos = [
                                                data.calle && 'Calle',
                                                data.cp && 'CP',
                                                data.colonia && 'Colonia',
                                                data.municipio && 'Municipio',
                                                data.estado && 'Estado',
                                            ].filter(Boolean) as string[];
                                            if (camposLlenos.length === 0) {
                                                await askSatConfirm('Dirección vacía', 'El domicilio particular no tiene datos para copiar.');
                                                return;
                                            }
                                            const destinoTieneDatos = !!(data.calle_fiscal || data.cp_fiscal || data.colonia_fiscal || data.municipio_fiscal || data.estado_fiscal);
                                            let body = `Se copiarán los siguientes campos al domicilio fiscal:\n\n${camposLlenos.map(c => `✓ ${c}`).join('\n')}`;
                                            if (destinoTieneDatos) body += '\n\n⚠️ El domicilio fiscal ya tiene datos que serán sobrescritos.';
                                            const ok = await askSatConfirm('¿Copiar dirección?', body, 'Sí, copiar', 'Cancelar', 'warning');
                                            if (!ok) return;
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
                                            toast.success('✅ Dirección particular copiada al domicilio fiscal');
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
                                        <CodigoPostalInput
                                            label=""
                                            value={data.cp_fiscal}
                                            onChange={(v) => setData('cp_fiscal', v)}
                                            coloniaValue={data.colonia_fiscal}
                                            onColoniaChange={(v) => setData('colonia_fiscal', v)}
                                            onAutoComplete={(cpData) => {
                                                setData('estado_fiscal', cpData.estado);
                                                setData('municipio_fiscal', cpData.municipio);
                                                if (cpData.ciudad) setData('ciudad_fiscal', cpData.ciudad);
                                                if (cpData.colonia) setData('colonia_fiscal', cpData.colonia);
                                            }}
                                            showColoniaSelector={false}
                                        />
                                    </Field>
                                    <Field label="Colonia">
                                        <input className={inputClass} value={data.colonia_fiscal} onChange={(e) => setData('colonia_fiscal', e.target.value)} placeholder="Auto-completa con el CP" />
                                    </Field>
                                    <Field label="Municipio">
                                        <input className={inputClass} value={data.municipio_fiscal} onChange={(e) => setData('municipio_fiscal', e.target.value)} placeholder="Auto-completa con el CP" />
                                    </Field>
                                    <Field label="Estado">
                                        <input className={inputClass} value={data.estado_fiscal} onChange={(e) => setData('estado_fiscal', e.target.value)} placeholder="Auto-completa con el CP" />
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
                                        onClick={async () => {
                                            const camposLlenos = [
                                                data.calle_fiscal && 'Calle',
                                                data.cp_fiscal && 'CP',
                                                data.colonia_fiscal && 'Colonia',
                                                data.municipio_fiscal && 'Municipio',
                                                data.estado_fiscal && 'Estado',
                                            ].filter(Boolean) as string[];
                                            if (camposLlenos.length === 0) {
                                                await askSatConfirm('Dirección vacía', 'El domicilio fiscal no tiene datos para copiar.');
                                                return;
                                            }
                                            const destinoTieneDatos = !!(data.calle || data.cp || data.colonia || data.municipio || data.estado);
                                            let body = `Se copiarán los siguientes campos al domicilio particular:\n\n${camposLlenos.map(c => `✓ ${c}`).join('\n')}`;
                                            if (destinoTieneDatos) body += '\n\n⚠️ El domicilio particular ya tiene datos que serán sobrescritos.';
                                            const ok = await askSatConfirm('¿Copiar dirección?', body, 'Sí, copiar', 'Cancelar', 'warning');
                                            if (!ok) return;
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
                                            toast.success('✅ Dirección fiscal copiada al domicilio particular');
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
                                        <div className="relative">
                                            <input
                                                className={inputClass}
                                                value={data.regimen_fiscal}
                                                onChange={(e) => setData('regimen_fiscal', e.target.value)}
                                                placeholder="Se auto-completa desde SAT"
                                            />
                                            {data.regimen_fiscal && !/^\d{2,3}$/.test(data.regimen_fiscal.trim()) && (
                                                <span className="absolute inset-y-0 right-2 flex items-center text-green-500 text-xs pointer-events-none">✓</span>
                                            )}
                                        </div>
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
                    onClick={handleAbrirVistaPrevia}
                >
                    <Eye className="h-4 w-4" />
                    Vista Previa
                </button>
                <button
                    type="button"
                    onClick={handleAbrirVistaPrevia}
                    disabled={processing}
                    className="flex flex-1 items-center justify-center gap-2 py-3.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: '#16a34a' }}
                >
                    <Send className="h-4 w-4" />
                    {processing ? 'Guardando...' : 'Guardar Registro'}
                </button>
            </div>

            {/* Modal Vista Previa */}
            <Dialog open={showVistaPrevia} onOpenChange={setShowVistaPrevia}>
                <DialogContent className="max-w-200 sm:max-w-200">
                    <DialogDescription className="sr-only">
                        Revisa la vista previa de los datos capturados antes de guardar el registro.
                    </DialogDescription>
                    {/* Cabecera estilo SweetAlert2 info */}
                    <div className="flex flex-col items-center pt-4 pb-2">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full border-4 border-sky-400 text-sky-400 mb-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                            </svg>
                        </div>
                        <DialogTitle className="text-xl font-bold text-gray-800">Vista Previa de Datos</DialogTitle>
                    </div>
                    <div className="max-h-96 overflow-y-auto space-y-4 text-sm px-1">
                        {/* Tipo de persona */}
                        <div className="rounded border-l-4 border-blue-600 bg-blue-50 p-3 font-semibold text-blue-900">
                            {data.persona === 'fisica' ? '👤 Persona Física' : '🏢 Persona Moral'}
                        </div>

                        {/* Datos Generales */}
                        <div className="border-l-4 border-gray-300 pl-3">
                            <h3 className="mb-2 font-bold text-gray-800">🪪 Datos Generales</h3>
                            <div className="grid grid-cols-2 gap-1.5">
                                {data.notaria && <div><strong>Notaría:</strong> {data.notaria}</div>}
                                {data.alias && <div><strong>Alias:</strong> {data.alias}</div>}
                                {data.persona === 'fisica' ? (
                                    <>
                                        {data.curp && <div><strong>CURP:</strong> {data.curp}</div>}
                                        {data.rfc && <div><strong>RFC:</strong> {data.rfc}</div>}
                                        {data.nombre && <div className="col-span-2"><strong>Nombre:</strong> {data.nombre} {data.apellidopat} {data.apellidomat}</div>}
                                        {data.dia && <div><strong>Nacimiento:</strong> {data.dia}</div>}
                                        {data.genero && <div><strong>Género:</strong> {data.genero === 'H' ? 'Hombre' : 'Mujer'}</div>}
                                        {data.paisnac && <div><strong>País nac.:</strong> {data.paisnac}</div>}
                                        {data.nacionalidad && <div><strong>Nacionalidad:</strong> {data.nacionalidad}</div>}
                                        {data.ocupacion && <div><strong>Ocupación:</strong> {data.ocupacion}</div>}
                                        {data.edo_civil && <div><strong>Estado Civil:</strong> {data.edo_civil}</div>}
                                        {data.regimen_fiscal && <div className="col-span-2"><strong>Régimen Fiscal:</strong> {data.regimen_fiscal}</div>}
                                    </>
                                ) : (
                                    <>
                                        {data.rfc && <div><strong>RFC:</strong> {data.rfc}</div>}
                                        {data.nombre && <div className="col-span-2"><strong>Razón Social:</strong> {data.nombre}</div>}
                                        {data.regimen_fiscal && <div className="col-span-2"><strong>Régimen Fiscal:</strong> {data.regimen_fiscal}</div>}
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Domicilio Particular */}
                        {(data.calle || data.cp) && (
                            <div className="border-l-4 border-green-400 pl-3">
                                <h3 className="mb-2 font-bold text-gray-800">🏠 Domicilio Particular</h3>
                                <div className="space-y-0.5">
                                    {data.calle && <div><strong>Calle:</strong> {data.calle} {data.no_exterior} {data.no_interior}</div>}
                                    {data.colonia && <div><strong>Colonia:</strong> {data.colonia}</div>}
                                    {(data.municipio || data.estado) && <div><strong>Municipio/Estado:</strong> {data.municipio}, {data.estado}</div>}
                                    {data.cp && <div><strong>CP:</strong> {data.cp}</div>}
                                    {data.pais && <div><strong>País:</strong> {data.pais}</div>}
                                </div>
                            </div>
                        )}

                        {/* Domicilio Fiscal */}
                        {(data.calle_fiscal || data.cp_fiscal) && (
                            <div className="border-l-4 border-purple-400 pl-3">
                                <h3 className="mb-2 font-bold text-gray-800">🏢 Domicilio Fiscal</h3>
                                <div className="space-y-0.5">
                                    {data.calle_fiscal && <div><strong>Calle:</strong> {data.calle_fiscal} {data.no_exterior_fiscal} {data.no_interior_fiscal}</div>}
                                    {data.colonia_fiscal && <div><strong>Colonia:</strong> {data.colonia_fiscal}</div>}
                                    {(data.municipio_fiscal || data.estado_fiscal) && <div><strong>Municipio/Estado:</strong> {data.municipio_fiscal}, {data.estado_fiscal}</div>}
                                    {data.cp_fiscal && <div><strong>CP:</strong> {data.cp_fiscal}</div>}
                                    {data.pais_fiscal && <div><strong>País:</strong> {data.pais_fiscal}</div>}
                                </div>
                            </div>
                        )}

                        {/* Contacto */}
                        <div className="border-l-4 border-yellow-400 pl-3">
                            <h3 className="mb-2 font-bold text-gray-800">📋 Contacto</h3>
                            <div className="grid grid-cols-2 gap-1.5">
                                {data.telefono && <div><strong>Tel. Casa:</strong> {data.telefono}</div>}
                                {data.telefono_movil && <div><strong>Tel. Móvil:</strong> {data.telefono_movil}</div>}
                                {data.telefono_oficina && <div><strong>Tel. Oficina:</strong> {data.telefono_oficina}</div>}
                                {data.correo && <div className="col-span-2"><strong>Email:</strong> {data.correo}</div>}
                                {data.documento && <div><strong>Identificación:</strong> {data.documento}</div>}
                                {data.no_identificacion && <div><strong>No. ID:</strong> {data.no_identificacion}</div>}
                            </div>
                        </div>

                        {/* Testamento */}
                        {(data.herederos || data.albacea_sustituto) && (
                            <div className="border-l-4 border-orange-400 pl-3">
                                <h3 className="mb-2 font-bold text-gray-800">📜 Testamento</h3>
                                <div className="space-y-0.5">
                                    {data.herederos && <div><strong>Herederos:</strong> {data.herederos.substring(0, 120)}{data.herederos.length > 120 ? '...' : ''}</div>}
                                    {data.albacea_sustituto && <div><strong>Albacea:</strong> {data.albacea_sustituto}</div>}
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="mt-4 flex justify-center gap-3 pb-2">
                        <button
                            type="button"
                            disabled={processing}
                            onClick={() => {
                                setShowVistaPrevia(false);
                                console.group('📤 [RegistroWeb] Guardando desde Vista Previa');
                                console.log('📋 Datos:', { ...data });
                                console.groupEnd();
                                post('/admin/registro-web', {
                                    onError: (errors) => {
                                        console.error('❌ [RegistroWeb] Errores:', errors);
                                        const mensajes = Object.values(errors).flat() as string[];
                                        if (mensajes.length > 0) {
                                            setDatosIncompletosModal({ isOpen: true, errores: mensajes });
                                        }
                                    },
                                    onSuccess: () => console.log('✅ [RegistroWeb] Guardado exitosamente'),
                                });
                            }}
                            className="min-w-28 rounded px-6 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
                            style={{ backgroundColor: '#16a34a' }}
                        >
                            {processing ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowVistaPrevia(false)}
                            className="min-w-28 rounded border border-gray-300 px-6 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

            {/* SAT Confirm Dialog - ¿Completar con SAT? / ¿Procesar con IA? */}
            <Dialog open={satConfirmDialog.isOpen} onOpenChange={(open) => { if (!open) resolveSatConfirm(false); }}>
                <DialogContent className="sm:max-w-105 text-center [&>button]:hidden">
                    <DialogTitle className="sr-only">Confirmación de acción</DialogTitle>
                    <DialogDescription className="sr-only">
                        Confirma si deseas continuar con la acción sugerida para los datos escaneados.
                    </DialogDescription>
                    <div className="flex flex-col items-center gap-4 px-4 pt-4 pb-2">
                        {/* Icono circular — naranja warning o azul question */}
                        {satConfirmDialog.variant === 'warning' ? (
                            <div className="flex size-24 items-center justify-center rounded-full border-4 border-amber-400">
                                <span className="text-5xl font-bold text-amber-400">!</span>
                            </div>
                        ) : (
                            <div className="flex size-24 items-center justify-center rounded-full border-4 border-blue-400">
                                <span className="text-5xl font-bold text-blue-400">?</span>
                            </div>
                        )}

                        {/* Título */}
                        <h2 className="text-2xl font-semibold text-gray-800">{satConfirmDialog.title}</h2>

                        {/* Cuerpo: párrafos separados por \n\n, líneas por \n */}
                        <div className="space-y-3 text-gray-600 text-sm">
                            {satConfirmDialog.body.split('\n\n').map((paragraph, i) => {
                                const isWarning = paragraph.startsWith('⚠️');
                                const lines = paragraph.split('\n');
                                return (
                                    <div key={i} className={isWarning ? 'font-semibold text-red-500' : ''}>
                                        {lines.map((line, j) => (
                                            <p key={j}>{line}</p>
                                        ))}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Botones: warning → confirmar (rojo) izq, cancelar der; question → cancelar izq, confirmar (índigo) der */}
                        <div className="flex gap-3 mt-2">
                            {satConfirmDialog.variant === 'warning' ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => resolveSatConfirm(true)}
                                        className="inline-flex h-10 items-center justify-center rounded-md bg-red-500 px-6 text-sm font-medium text-white shadow hover:bg-red-600 focus:outline-none"
                                    >
                                        {satConfirmDialog.confirmText ?? 'Sí'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => resolveSatConfirm(false)}
                                        className="inline-flex h-10 items-center justify-center rounded-md bg-gray-500 px-6 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none"
                                    >
                                        {satConfirmDialog.cancelText ?? 'Cancelar'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button
                                        type="button"
                                        onClick={() => resolveSatConfirm(false)}
                                        className="inline-flex h-10 items-center justify-center rounded-md bg-gray-200 px-6 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none"
                                    >
                                        {satConfirmDialog.cancelText ?? 'No, continuar sin IA'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => resolveSatConfirm(true)}
                                        className="inline-flex h-10 items-center justify-center rounded-md bg-indigo-500 px-6 text-sm font-medium text-white shadow hover:bg-indigo-600 focus:outline-none"
                                    >
                                        {satConfirmDialog.confirmText ?? 'Sí, procesar'}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Datos Incompletos Modal - Estilo SweetAlert2 igual al legacy PHP */}
            <Dialog open={datosIncompletosModal.isOpen} onOpenChange={(open) => { if (!open) setDatosIncompletosModal({ isOpen: false, errores: [] }); }}>
                <DialogContent className="sm:max-w-100 text-center [&>button]:hidden">
                    <DialogTitle className="sr-only">Datos incompletos</DialogTitle>
                    <DialogDescription className="sr-only">
                        El formulario tiene errores o campos faltantes que deben corregirse antes de guardar.
                    </DialogDescription>
                    <div className="flex flex-col items-center gap-4 px-4 pt-4 pb-2">
                        {/* Icono circular grande estilo SweetAlert2 */}
                        <div className="flex size-24 items-center justify-center rounded-full border-4 border-red-400">
                            <svg className="size-12 text-red-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>

                        {/* Título */}
                        <h2 className="text-2xl font-semibold text-gray-800">Datos incompletos</h2>

                        {/* Lista de errores — uno por línea, centrado */}
                        <div className="space-y-1 text-gray-600 text-sm">
                            {datosIncompletosModal.errores.map((err, i) => (
                                <p key={i}>{err}</p>
                            ))}
                        </div>

                        {/* Botón OK estilo SweetAlert2 */}
                        <button
                            type="button"
                            onClick={() => setDatosIncompletosModal({ isOpen: false, errores: [] })}
                            className="mt-2 inline-flex h-10 items-center justify-center rounded-md bg-indigo-500 px-10 text-sm font-medium text-white shadow hover:bg-indigo-600 focus:outline-none"
                        >
                            OK
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

function NotariaIframeView({ registroWebUrl, notaria }: { registroWebUrl: string; notaria: string | null }) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Registro Web" />
            <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
                {/* Barra superior */}
                <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-2">
                    <div className="flex items-center gap-2">
                        <QrCode className="size-4 text-amber-500" />
                        <span className="text-sm font-medium">Registro Web</span>
                        {notaria && (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">{notaria}</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => {
                                const iframe = document.getElementById('registro-web-iframe') as HTMLIFrameElement | null;
                                if (iframe) { iframe.src = iframe.src; }
                            }}
                        >
                            <RotateCcw className="size-3" />
                            Recargar
                        </button>
                        <a
                            href={registroWebUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
                        >
                            <Eye className="size-3" />
                            Abrir en nueva pestaña
                        </a>
                    </div>
                </div>
                {/* Iframe */}
                <div className="flex-1 overflow-hidden rounded-lg border bg-white dark:bg-zinc-900">
                    <iframe
                        id="registro-web-iframe"
                        src={registroWebUrl}
                        className="size-full"
                        title="Registro Web"
                        allow="camera; microphone"
                    />
                </div>
            </div>
        </AppLayout>
    );
}

export default function Index(props: Props) {
    if (!props.is_super_admin && props.registro_web_url) {
        return <NotariaIframeView registroWebUrl={props.registro_web_url} notaria={props.notaria} />;
    }
    return <RegistroWebDevView {...props} />;
}
