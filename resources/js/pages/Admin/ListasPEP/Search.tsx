import { Head } from '@inertiajs/react';
import {
    Search,
    Shield,
    Download,
    FileText,
    ChevronDown,
    AlertTriangle,
    CheckCircle2,
    Info,
    Globe,
    Users,
    History as HistoryIcon,
    ExternalLink,
    Building,
    MapPin,
    Calendar,
    Briefcase,
    User,
    Hash,
    Link2,
} from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

type TipoPEP = 'PEP' | 'EX PEP' | 'AFIN PEP' | 'AFIN EX PEP' | 'OTROS';
type OrigenFuente = 'MEX' | 'ARG' | 'USA' | 'OTRO';

/** Respuesta real de la API de PrevencionDeLavado.com */
interface PEPResultadoAPI {
    codigoIndividuo: number;
    denominacion: string;
    identificacion: string | null;
    idTributaria: string | null;
    otraIdentificacion: string | null;
    fechaNacimiento: string | null; // YYYYMMDD
    tipo: string;
    subTipo: string;
    estado: string; // "ACTIVO" | "INACTIVO"
    cargo: string;
    finalizacionCargo: string | null;
    lugarTrabajo: string;
    direccion: string;
    lista: string;
    paisLista: string;
    supuesto: string | null;
    situacion: string | null;
    exactitudDenominacion: string; // "ALTO (5 sobre 5)"
    exactitudIdentificacion: string; // "COINCIDE" | "N/D"
    enlace: string | null;
    relaciones: string | null; // Ej: "Hijos de ROSALIA ELVIA PEREZ PEREZ (PEFR611575U8)" - solo AFIN PEP
}

interface BusquedaResponseAPI {
    codigoCertificadoBusqueda: string; // UUID
    fechaConsulta: string; // ISO DateTime
    resultados: PEPResultadoAPI[];
}

/** Tipo adaptado para React */
interface PEPResultado extends PEPResultadoAPI {
    id: string;
    apellido_denominacion: string;
    nombres: string;
    exactitud: number; // 0–100
    fuente: OrigenFuente;
}

interface BusquedaForm {
    apellido_denominacion: string;
    nombres: string;
    identificacion: string;
}

interface OpcionesBusqueda {
    pepsOtrosPaises: boolean;
    satXDenominacion: boolean;
    documentosSimilares: boolean;
    forzarApellidos: boolean;
    generarCertificados: boolean;
}

interface PaqueteInfo {
    total_contratado: number;
    consumidas: number;
    disponibles: number;
}

interface Props {
    paquete?: PaqueteInfo;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Convierte fecha YYYYMMDD a DD/MM/YYYY */
function formatoFecha(fecha: string | null): string {
    if (!fecha || fecha.length !== 8) return 'N/D';
    const year = fecha.substring(0, 4);
    const month = fecha.substring(4, 6);
    const day = fecha.substring(6, 8);
    return `${day}/${month}/${year}`;
}

/** Mapea resultado de API a formato React */
function mapearResultadoAPI(resultado: PEPResultadoAPI): PEPResultado {
    // Separar denominacion en apellido y nombres (heurística simple)
    const partes = resultado.denominacion.split(' ');
    const apellido = partes.slice(0, 2).join(' ');
    const nombres = partes.slice(2).join(' ') || '';

    // Convertir exactitud "ALTO (5 sobre 5)" -> 100
    let exactitud = 0;
    if (resultado.exactitudDenominacion?.includes('5 sobre 5')) exactitud = 100;
    else if (resultado.exactitudDenominacion?.includes('4 sobre 5')) exactitud = 80;
    else if (resultado.exactitudDenominacion?.includes('3 sobre 5')) exactitud = 60;
    else if (resultado.exactitudDenominacion?.includes('2 sobre 5')) exactitud = 40;
    else if (resultado.exactitudDenominacion?.includes('1 sobre 5')) exactitud = 20;

    // Determinar fuente por país
    let fuente: OrigenFuente = 'OTRO';
    if (resultado.paisLista?.toUpperCase().includes('MEX')) fuente = 'MEX';
    else if (resultado.paisLista?.toUpperCase().includes('ARG')) fuente = 'ARG';
    else if (resultado.paisLista?.toUpperCase().includes('USA') || resultado.paisLista?.toUpperCase().includes('ESTADOS UNIDOS')) fuente = 'USA';

    return {
        ...resultado,
        id: resultado.codigoIndividuo.toString(),
        apellido_denominacion: apellido,
        nombres: nombres,
        exactitud: exactitud,
        fuente: fuente,
    };
}

// ---------------------------------------------------------------------------
// Helpers UI
// ---------------------------------------------------------------------------

/** Barras de exactitud al estilo prevenciondelavado.com */
function ExactitudBars({ valor }: { valor: number }) {
    // Determinar color según el porcentaje
    const colorClass =
        valor >= 80 ? 'bg-green-500' : valor >= 50 ? 'bg-yellow-500' : 'bg-red-400';
    const textColorClass =
        valor >= 80 ? 'text-green-700' : valor >= 50 ? 'text-yellow-700' : 'text-red-700';
    const bgColorClass =
        valor >= 80 ? 'bg-green-50' : valor >= 50 ? 'bg-yellow-50' : 'bg-red-50';

    return (
        <div className="flex items-center gap-2">
            {/* Barra de progreso visual */}
            <div className="relative h-2 w-16 overflow-hidden rounded-full bg-muted">
                <div
                    className={`h-full transition-all ${colorClass}`}
                    style={{ width: `${valor}%` }}
                />
            </div>
            {/* Porcentaje numérico con badge */}
            <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold ${textColorClass} ${bgColorClass}`}>
                {valor}%
            </span>
        </div>
    );
}

/** Badge por tipo de PEP */
function TipoBadge({ tipo }: { tipo: TipoPEP }) {
    const variants: Record<TipoPEP, { color: string; label: string }> = {
        PEP: { color: 'bg-red-100 text-red-700 border-red-300', label: 'PEP' },
        'EX PEP': { color: 'bg-orange-100 text-orange-700 border-orange-300', label: 'EX PEP' },
        'AFIN PEP': { color: 'bg-yellow-100 text-yellow-700 border-yellow-300', label: 'AFIN PEP' },
        'AFIN EX PEP': { color: 'bg-blue-100 text-blue-700 border-blue-300', label: 'AFIN EX PEP' },
        OTROS: { color: 'bg-gray-100 text-gray-600 border-gray-300', label: 'OTROS' },
    };

    const v = variants[tipo];
    return (
        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold ${v.color}`}>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current opacity-70" />
            {v.label}
        </span>
    );
}

/** Badge por origen de fuente */
function FuenteBadge({ fuente }: { fuente: OrigenFuente }) {
    const variants: Record<OrigenFuente, { color: string; label: string }> = {
        MEX: {
            color: 'bg-green-100 text-green-800 border-green-300',
            label: 'México'
        },
        ARG: {
            color: 'bg-sky-100 text-sky-800 border-sky-300',
            label: 'Argentina'
        },
        USA: {
            color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
            label: 'USA'
        },
        OTRO: {
            color: 'bg-gray-100 text-gray-700 border-gray-300',
            label: 'Otro'
        },
    };

    const v = variants[fuente];
    return (
        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-xs font-semibold ${v.color}`}>
            <span className="mr-1 inline-block h-2 w-2 rounded-full bg-current opacity-70" />
            {v.label}
        </span>
    );
}

/** Componente de vista detallada de resultado */
/** Componente para mostrar detalles expandidos en una fila */
function DetalleExpandido({ resultado }: { resultado: PEPResultado }) {
    const getEstadoClass = (estado: string) => {
        return estado === 'ACTIVO'
            ? 'bg-green-100 text-green-800 border-green-300'
            : 'bg-gray-100 text-gray-600 border-gray-300';
    };

    const getExactitudClass = (exactitud: string) => {
        if (exactitud?.includes('5 sobre 5')) return 'text-green-700 font-semibold';
        if (exactitud?.includes('4 sobre 5')) return 'text-green-600 font-medium';
        if (exactitud?.includes('3 sobre 5')) return 'text-yellow-600 font-medium';
        return 'text-muted-foreground';
    };

    return (
        <div className="bg-muted/30 px-4 py-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {/* Información Personal */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground">
                            <User className="h-3.5 w-3.5" />
                            Información Personal
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                        <div>
                            <span className="text-muted-foreground">CURP:</span>
                            <p className="font-medium text-sm">{resultado.identificacion || 'N/D'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">RFC:</span>
                            <p className="font-medium text-sm">{resultado.idTributaria || 'N/D'}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">F. Nacimiento:</span>
                            <p className="font-medium text-sm">{formatoFecha(resultado.fechaNacimiento)}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Estado:</span>
                            <Badge className={`mt-1 ${getEstadoClass(resultado.estado)}`}>
                                {resultado.estado}
                            </Badge>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Código:</span>
                            <p className="font-mono text-[10px] break-all">{resultado.codigoIndividuo}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Cargo y Función */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground">
                            <Briefcase className="h-3.5 w-3.5" />
                            Cargo y Función
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                        <div>
                            <span className="text-muted-foreground">Cargo:</span>
                            <p className="font-medium text-sm mt-0.5">{resultado.cargo}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Institución:</span>
                            <p className="text-xs mt-0.5">{resultado.lugarTrabajo}</p>
                        </div>
                        {resultado.finalizacionCargo && (
                            <div>
                                <span className="text-muted-foreground">Fin Cargo:</span>
                                <p className="text-xs mt-0.5">{resultado.finalizacionCargo}</p>
                            </div>
                        )}
                        {resultado.relaciones && (
                            <div className="rounded-md border border-yellow-200 bg-yellow-50 p-2">
                                <span className="flex items-center gap-1 text-yellow-700 font-medium mb-0.5">
                                    <Link2 className="h-3 w-3" />
                                    Relaciones:
                                </span>
                                <p className="text-xs text-yellow-800">{resultado.relaciones}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-muted-foreground">Tipo:</span>
                            <div className="flex gap-1.5 mt-1 flex-wrap">
                                <TipoBadge tipo={resultado.tipo as TipoPEP} />
                                {resultado.subTipo && (
                                    <Badge variant="outline" className="text-[10px]">{resultado.subTipo}</Badge>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Ubicación */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5" />
                            Ubicación
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">{resultado.direccion}</p>
                    </CardContent>
                </Card>

                {/* Clasificación y Exactitud */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-xs flex items-center gap-1.5 text-muted-foreground">
                            <Hash className="h-3.5 w-3.5" />
                            Clasificación
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-xs">
                        <div>
                            <span className="text-muted-foreground">Lista:</span>
                            <p className="font-medium text-sm mt-0.5">{resultado.lista}</p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">País:</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <Globe className="h-3 w-3 text-muted-foreground" />
                                <span className="text-sm">{resultado.paisLista}</span>
                            </div>
                        </div>
                        <Separator className="my-2" />
                        <div>
                            <span className="text-muted-foreground">Exactitud Denom.:</span>
                            <p className={`mt-0.5 text-sm ${getExactitudClass(resultado.exactitudDenominacion)}`}>
                                {resultado.exactitudDenominacion}
                            </p>
                        </div>
                        <div>
                            <span className="text-muted-foreground">Exactitud ID:</span>
                            <p className={`mt-0.5 text-sm font-medium ${resultado.exactitudIdentificacion === 'COINCIDE' ? 'text-green-700' : 'text-muted-foreground'}`}>
                                {resultado.exactitudIdentificacion}
                            </p>
                        </div>
                        {resultado.enlace && (
                            <Button asChild size="sm" className="w-full mt-2 h-7 text-xs">
                                <a href={resultado.enlace} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="mr-1.5 h-3 w-3" />
                                    Ver más
                                </a>
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export default function ListasPEPSearch({ paquete }: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Listas PEP', href: '/admin/listas-pep', icon: Shield },
    ];

    // ---- Estado del formulario ----
    const [form, setForm] = useState<BusquedaForm>({
        apellido_denominacion: '',
        nombres: '',
        identificacion: '',
    });

    // ---- Estado de opciones de búsqueda ----
    const [opciones, setOpciones] = useState<OpcionesBusqueda>({
        pepsOtrosPaises: true,
        satXDenominacion: true,
        documentosSimilares: true,
        forzarApellidos: false,
        generarCertificados: true,
    });

    // ---- Estado de resultados ----
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultados, setResultados] = useState<PEPResultado[]>([]);
    const [totalAciertos, setTotalAciertos] = useState<number | null>(null);
    const [ultimaBusqueda, setUltimaBusqueda] = useState<Partial<BusquedaForm> | null>(null);
    const [codigoCertificado, setCodigoCertificado] = useState<string | null>(null);
    const [fechaConsulta, setFechaConsulta] = useState<string | null>(null);

    // ---- Estado de filtros ----
    const [filtroTipo, setFiltroTipo] = useState<string>('');
    const [filtroFuente, setFiltroFuente] = useState<string>('');
    const [filtroTexto, setFiltroTexto] = useState<string>('');
    const [showFilters, setShowFilters] = useState<boolean>(false);

    // ---- Selección para certificado ----
    const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
    const [generandoCertificado, setGenerandoCertificado] = useState(false);

    // ---- Estado de filas expandidas ----
    const [filasExpandidas, setFilasExpandidas] = useState<Set<string>>(new Set());

    // ---- Fuente de la última búsqueda ----
    const [fuenteBusqueda, setFuenteBusqueda] = useState<'API_PLD' | 'BD_INTERNA' | null>(null);

    // ---- Datos de ejemplo para demostración ----
    const generarDatosEjemplo = (): BusquedaResponseAPI => {
        return {
            codigoCertificadoBusqueda: "6a71f8da-a0d8-4946-9579-7b5978ae4f70",
            fechaConsulta: new Date().toISOString(),
            resultados: [
                {
                    codigoIndividuo: 3086274,
                    denominacion: "LOPEZ OBRADOR ANDRES MANUEL",
                    identificacion: "LOOA531113HTCPBN07",
                    idTributaria: "LOOA531113FI5",
                    otraIdentificacion: null,
                    fechaNacimiento: "19531113",
                    tipo: "EX PEP",
                    subTipo: "EX PEP",
                    estado: "INACTIVO",
                    cargo: "PRESIDENTE DE LOS ESTADOS UNIDOS MEXICANOS",
                    finalizacionCargo: "Septiembre de 2024",
                    lugarTrabajo: "Secretaría Particular del Presidente - Oficina de la Presidencia de la República - Federación",
                    direccion: "C ODONTOLOGIA 57 EDIF B, DEPT 301, COL COPILCO UNIVERSIDAD, 04360, CIUDAD DE MEXICO, COYOACAN, MEXICO",
                    lista: "EX-PEP según legislación de México",
                    paisLista: "MÉXICO",
                    supuesto: null,
                    situacion: null,
                    exactitudDenominacion: "ALTO (5 sobre 5)",
                    exactitudIdentificacion: "COINCIDE",
                    enlace: "https://www.prevenciondelavado.com/portal/enlace.aspx?c=UTERU6LnQHe/ATRWqgp8rSx5c4GJrRct0QBR+m0NY3Fv07W1S2LBs0iWf+wlEhNlaXag4e52Wc8=",
                    relaciones: null,
                },
                {
                    codigoIndividuo: 19231715,
                    denominacion: "GARCIA MORALES JUAN CARLOS",
                    identificacion: "GAMJ850615HDFRRL03",
                    idTributaria: "GAMJ850615KL8",
                    otraIdentificacion: null,
                    fechaNacimiento: "19850615",
                    tipo: "PEP",
                    subTipo: "PEP",
                    estado: "ACTIVO",
                    cargo: "DIRECTOR GENERAL DE ADMINISTRACIÓN",
                    finalizacionCargo: null,
                    lugarTrabajo: "Secretaría de Hacienda y Crédito Público - Gobierno Federal - México",
                    direccion: "AV INSURGENTES SUR 1735, COL GUADALUPE INN, 01020, CIUDAD DE MEXICO, ALVARO OBREGON, MEXICO",
                    lista: "PEP de México",
                    paisLista: "MÉXICO",
                    supuesto: null,
                    situacion: null,
                    exactitudDenominacion: "ALTO (5 sobre 5)",
                    exactitudIdentificacion: "COINCIDE",
                    enlace: "https://www.prevenciondelavado.com/portal/enlace.aspx?c=oNSpgET6KFhOhcwevXkLLG/X3nTKb/qwLfeYF7D7U+wNI99QGN9b+yAQQx5jw7rqFu/FzsB0Afk=",
                    relaciones: null,
                },
                {
                    codigoIndividuo: 18398241,
                    denominacion: "MARTINEZ RODRIGUEZ MARIA ELENA",
                    identificacion: null,
                    idTributaria: null,
                    otraIdentificacion: null,
                    fechaNacimiento: "19780320",
                    tipo: "AFIN PEP",
                    subTipo: "AFIN PEP",
                    estado: "ACTIVO",
                    cargo: "CONYUGE DE SUBSECRETARIO DE ESTADO",
                    finalizacionCargo: null,
                    lugarTrabajo: "Secretaría de Relaciones Exteriores - Gobierno Federal - México",
                    direccion: "CIUDAD DE MEXICO, MEXICO",
                    lista: "Afines PEP de México",
                    paisLista: "MÉXICO",
                    supuesto: null,
                    situacion: null,
                    exactitudDenominacion: "MEDIO (4 sobre 5)",
                    exactitudIdentificacion: "N/D",
                    enlace: "https://www.prevenciondelavado.com/portal/enlace.aspx?c=uKT+QQan/GcZnb8s7d8Hwwh7zQOKed2lwm0Bm3hA+7zbpsFKLVh7IjaonhuBlgsgrmw+kiDSeJs=",
                    relaciones: "Cónyuge de GARCIA MORALES JUAN CARLOS (GAMJ850615HDFRRL03)",
                },
                {
                    codigoIndividuo: 5738291,
                    denominacion: "HERNANDEZ LOPEZ CARLOS ALBERTO",
                    identificacion: null,
                    idTributaria: "HELC920804PN2",
                    otraIdentificacion: null,
                    fechaNacimiento: "19920804",
                    tipo: "PEP",
                    subTipo: "PEP",
                    estado: "ACTIVO",
                    cargo: "DIRECTOR DE AREA",
                    finalizacionCargo: null,
                    lugarTrabajo: "Dirección de Recursos de Revisión de Usos de Suelo - Ayuntamiento de Guadalajara - Jalisco",
                    direccion: "JALISCO, MEXICO",
                    lista: "PEP de México sin identificación",
                    paisLista: "MÉXICO",
                    supuesto: null,
                    situacion: null,
                    exactitudDenominacion: "MEDIO (3 sobre 5)",
                    exactitudIdentificacion: "N/D",
                    enlace: "https://www.prevenciondelavado.com/portal/enlace.aspx?c=xYz123ABC/def456GHI789jkl012MNO345pqr678STU901vwx234YZA567bcd890EFG123hij456KLM=",
                    relaciones: null,
                },
                {
                    codigoIndividuo: 4829156,
                    denominacion: "RAMIREZ SANCHEZ JOSE LUIS",
                    identificacion: "RASJ751025HDFMNL08",
                    idTributaria: "RASJ751025HK4",
                    otraIdentificacion: null,
                    fechaNacimiento: "19751025",
                    tipo: "EX PEP",
                    subTipo: "EX PEP",
                    estado: "INACTIVO",
                    cargo: "SECRETARIO DE ESTADO",
                    finalizacionCargo: "Diciembre de 2023",
                    lugarTrabajo: "Secretaría de Gobernación - Gobierno Federal - México",
                    direccion: "AV REVOLUCION 1425, COL CAMPESTRE, 01040, CIUDAD DE MEXICO, ALVARO OBREGON, MEXICO",
                    lista: "EX-PEP según legislación de México",
                    paisLista: "MÉXICO",
                    supuesto: null,
                    situacion: null,
                    exactitudDenominacion: "ALTO (5 sobre 5)",
                    exactitudIdentificacion: "COINCIDE",
                    enlace: "https://www.prevenciondelavado.com/portal/enlace.aspx?c=mNO789pQR012stu345VWX678yza901BCD234efg567HIJ890klm123NOP456qrs789TUV012wxy=",
                    relaciones: null,
                },
            ],
        };
    };

    // ---- Handler búsqueda simulada (DEMO) ----
    const handleSearchDemo = async (e: React.FormEvent) => {
        e.preventDefault();

        setLoading(true);
        setError(null);
        setResultados([]);
        setTotalAciertos(null);
        setSeleccionados(new Set());
        setFiltroTipo('');
        setFiltroFuente('');
        setFiltroTexto('');

        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            const datosEjemplo = generarDatosEjemplo();
            const resultadosMapeados = datosEjemplo.resultados.map(mapearResultadoAPI);
            setResultados(resultadosMapeados);
            setTotalAciertos(datosEjemplo.resultados.length);
            setCodigoCertificado(datosEjemplo.codigoCertificadoBusqueda);
            setFechaConsulta(datosEjemplo.fechaConsulta);
            setUltimaBusqueda({
                apellido_denominacion: 'LOPEZ',
                nombres: 'ANDRES',
                identificacion: ''
            });
        } catch (err) {
            setError('Error al cargar datos de ejemplo');
        } finally {
            setLoading(false);
        }
    };

    // ---- Handler búsqueda ----
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.apellido_denominacion.trim() && !form.nombres.trim() && !form.identificacion.trim()) {
            setError('Ingrese al menos un criterio de búsqueda.');
            return;
        }

        setLoading(true);
        setError(null);
        setResultados([]);
        setTotalAciertos(null);
        setFuenteBusqueda(null);
        setSeleccionados(new Set());
        setFiltroTipo('');
        setFiltroFuente('');
        setFiltroTexto('');

        try {
            const response = await fetch('/admin/listas-pep/buscar', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    apellido_denominacion: form.apellido_denominacion,
                    nombres: form.nombres,
                    identificacion: form.identificacion,
                    ...opciones,
                }),
            });

            const data = await response.json();

            if (data.success) {
                const resultadosAPI: PEPResultadoAPI[] = data.resultados ?? [];
                const resultadosMapeados = resultadosAPI.map(mapearResultadoAPI);

                setResultados(resultadosMapeados);
                setTotalAciertos(data.total_resultados ?? 0);
                setCodigoCertificado(data.codigo_certificado ?? null);
                setFechaConsulta(data.fecha_consulta ?? null);
                setFuenteBusqueda(data.fuente ?? null);
                setUltimaBusqueda({ ...form });
            } else {
                setError(data.message ?? 'Error en la búsqueda');
            }
        } catch {
            setError('Error de conexión al realizar la búsqueda. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    // ---- Filtrado local sobre resultados ----
    const resultadosFiltrados = resultados.filter((r) => {
        const pasaTipo = !filtroTipo || r.tipo === filtroTipo;
        const pasaFuente = !filtroFuente || r.fuente === filtroFuente;
        const pasaTexto = !filtroTexto ||
            r.apellido_denominacion.toLowerCase().includes(filtroTexto.toLowerCase()) ||
            r.nombres.toLowerCase().includes(filtroTexto.toLowerCase()) ||
            r.identificacion?.toLowerCase().includes(filtroTexto.toLowerCase());
        return pasaTipo && pasaFuente && pasaTexto;
    });

    // ---- Limpiar filtros ----
    const limpiarFiltros = () => {
        setFiltroTipo('');
        setFiltroFuente('');
        setFiltroTexto('');
    };

    // ---- Selección para certificados ----
    const toggleSeleccion = (id: string) => {
        setSeleccionados((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const toggleSeleccionTodos = () => {
        if (seleccionados.size === resultadosFiltrados.length) {
            setSeleccionados(new Set());
        } else {
            setSeleccionados(new Set(resultadosFiltrados.map((r) => r.id)));
        }
    };

    // ---- Expansión de filas ----
    const toggleExpansion = (id: string) => {
        setFilasExpandidas((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    // ---- Generación de certificados ----

    /** Extrae el número de exactitud del texto de la API: "ALTO (5 sobre 5)" → "5" */
    const extraerExactitud = (texto: string | null | undefined): string => {
        const match = texto?.match(/(\d+)\s+sobre/);
        return match ? match[1] : (texto ?? 'N/D');
    };

    const generarCertificadoConCoincidencias = async () => {
        if (seleccionados.size !== 1) {
            setError('Seleccione exactamente 1 registro para el certificado con coincidencia.');
            return;
        }
        const selectedId = Array.from(seleccionados)[0];
        const r = resultadosFiltrados.find((res) => res.id === selectedId);
        if (!r) {
            setError('Resultado seleccionado no encontrado.');
            return;
        }
        setGenerandoCertificado(true);
        try {
            const response = await fetch('/admin/listas-pep/certificado/con-coincidencia', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    apellido_denominacion: ultimaBusqueda?.apellido_denominacion ?? '',
                    nombres: ultimaBusqueda?.nombres ?? null,
                    identificacion: ultimaBusqueda?.identificacion ?? null,
                    fecha_consulta: fechaConsulta ?? new Date().toLocaleString('es-MX'),
                    resultado: {
                        denominacion:              r.denominacion,
                        identificacion:            r.identificacion ?? null,
                        rfc:                       r.idTributaria ?? null,
                        cargo:                     r.cargo ?? null,
                        institucion:               r.lugarTrabajo ?? null,
                        estado:                    r.estado ?? null,
                        link:                      r.enlace ?? null,
                        lista:                     r.lista ?? null,
                        tipo:                      r.tipo ?? null,
                        pais_lista:                r.paisLista ?? null,
                        exactitud_denominacion:    extraerExactitud(r.exactitudDenominacion),
                        exactitud_identificacion:  r.exactitudIdentificacion ?? 'N/D',
                        codigo_individuo:          r.codigoIndividuo?.toString() ?? null,
                        relaciones:                r.relaciones ?? null,
                        descripcion_fuente:        r.lista ?? null,
                    },
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificado-pep-coincidencia-${Date.now()}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                const data = await response.json();
                setError(data.message ?? 'Error al generar el certificado.');
            }
        } catch {
            setError('Error al generar el certificado.');
        } finally {
            setGenerandoCertificado(false);
        }
    };

    const generarCertificadoSinCoincidencias = async () => {
        setGenerandoCertificado(true);
        try {
            const response = await fetch('/admin/listas-pep/certificado/sin-coincidencias', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    apellido_denominacion: ultimaBusqueda?.apellido_denominacion ?? '',
                    nombres:               ultimaBusqueda?.nombres ?? null,
                    identificacion:        ultimaBusqueda?.identificacion ?? null,
                    total_resultados:      totalAciertos ?? resultados.length,
                    fecha_consulta:        fechaConsulta ?? new Date().toLocaleString('es-MX'),
                    resultados: resultadosFiltrados.map((r) => ({
                        denominacion:             r.denominacion,
                        identificacion:           r.identificacion ?? null,
                        exactitud_denominacion:   extraerExactitud(r.exactitudDenominacion),
                        exactitud_identificacion: r.exactitudIdentificacion ?? 'N/D',
                        tipo:                     r.tipo ?? null,
                        pais_lista:               r.paisLista ?? null,
                        lista:                    r.lista ?? null,
                    })),
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificado-pep-sin-coincidencias-${Date.now()}.pdf`;
                a.click();
                URL.revokeObjectURL(url);
            } else {
                const data = await response.json();
                setError(data.message ?? 'Error al generar el certificado.');
            }
        } catch {
            setError('Error al generar el certificado.');
        } finally {
            setGenerandoCertificado(false);
        }
    };

    // ---- Listados complementarios ----
    const descargarListadoComplementario = async (tipo: 'refipre' | 'ocde' | 'gafi') => {
        try {
            // TODO: Implementar endpoints de descarga de listados complementarios
            // GET /admin/listas-pep/listados/{tipo}
            window.open(`/admin/listas-pep/listados/${tipo}`, '_blank');
        } catch {
            setError('Error al descargar el listado.');
        }
    };

    // ---- Métricas del paquete contratado ----
    const paqueteLocal = paquete ?? {
        total_contratado: 600,
        consumidas: 0,
        disponibles: 600,
    };
    const porcentajeConsumo = Math.round((paqueteLocal.consumidas / paqueteLocal.total_contratado) * 100);
    const paqueteCritico = paqueteLocal.disponibles <= 50;
    const paqueteAdvertencia = paqueteLocal.disponibles <= 100 && !paqueteCritico;

    // ---- Tipos y fuentes únicos en resultados ----
    const tiposDisponibles = Array.from(new Set(resultados.map((r) => r.tipo)));
    const fuentesDisponibles = Array.from(new Set(resultados.map((r) => r.fuente)));

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Listas PEP — Búsqueda" />

            <div className="space-y-6 p-6">
                {/* ── Encabezado ── */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight">
                                PEPs y Listas de Interés
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Búsqueda interactiva — Prevención de Lavado de Dinero
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.visit('/admin/listas-pep/historial')}
                    >
                        <HistoryIcon className="mr-2 h-4 w-4" />
                        Historial
                    </Button>
                </div>

                {/* ── Contador del paquete ── */}
                <Card className={paqueteCritico ? 'border-red-400' : paqueteAdvertencia ? 'border-yellow-400' : ''}>
                    <CardContent className="flex items-center gap-6 py-4">
                        <div className="flex items-center gap-2">
                            {paqueteCritico ? (
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                            ) : paqueteAdvertencia ? (
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                            ) : (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                            )}
                            <span className="text-sm font-medium">Paquete contratado:</span>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                            <span>
                                <strong className="text-blue-600">{paqueteLocal.disponibles.toLocaleString()}</strong>{' '}
                                búsquedas disponibles
                            </span>
                            <Separator orientation="vertical" className="h-4" />
                            <span className="text-muted-foreground">
                                {paqueteLocal.consumidas.toLocaleString()} consumidas de{' '}
                                {paqueteLocal.total_contratado.toLocaleString()} totales
                            </span>
                            <Separator orientation="vertical" className="h-4" />
                            {/* Barra de progreso */}
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className={`h-full rounded-full transition-all ${paqueteCritico ? 'bg-red-500' : paqueteAdvertencia ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${porcentajeConsumo}%` }}
                                    />
                                </div>
                                <span className="text-xs text-muted-foreground">{porcentajeConsumo}%</span>
                            </div>
                        </div>

                        {paqueteCritico && (
                            <Badge variant="destructive" className="ml-auto">
                                ¡Pocas búsquedas disponibles!
                            </Badge>
                        )}
                        {paqueteAdvertencia && (
                            <Badge variant="outline" className="ml-auto border-yellow-400 text-yellow-700">
                                Búsquedas por agotarse
                            </Badge>
                        )}
                    </CardContent>
                </Card>

                {/* ── Formulario + Listados complementarios ── */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Formulario de búsqueda */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Search className="h-4 w-4 text-blue-600" />
                                Búsqueda Individual
                            </CardTitle>
                            <CardDescription>
                                Complete al menos un campo. Lo ideal es buscar por número de identificación para mayor precisión.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSearch} className="space-y-4">
                                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="apellido">Apellido / Denominación</Label>
                                        <Input
                                            id="apellido"
                                            placeholder="Ingrese apellido u organización"
                                            value={form.apellido_denominacion}
                                            onChange={(e) =>
                                                setForm({ ...form, apellido_denominacion: e.target.value })
                                            }
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="nombres">Nombres</Label>
                                        <Input
                                            id="nombres"
                                            placeholder="Ingrese nombre/s de la persona"
                                            value={form.nombres}
                                            onChange={(e) =>
                                                setForm({ ...form, nombres: e.target.value })
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="identificacion">Identificación</Label>
                                    <Input
                                        id="identificacion"
                                        placeholder="Ingrese número de identificación (RFC, CURP, etc.)"
                                        value={form.identificacion}
                                        onChange={(e) =>
                                            setForm({ ...form, identificacion: e.target.value })
                                        }
                                    />
                                </div>

                                {/* Opciones de búsqueda */}
                                <div className="space-y-3 pt-2">
                                    <Label className="text-sm font-medium">Opciones de búsqueda</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="pepsOtrosPaises"
                                                checked={opciones.pepsOtrosPaises}
                                                onCheckedChange={(checked) =>
                                                    setOpciones({ ...opciones, pepsOtrosPaises: checked === true })
                                                }
                                            />
                                            <label
                                                htmlFor="pepsOtrosPaises"
                                                className="text-sm cursor-pointer"
                                            >
                                                PEPs en otros países
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="satXDenominacion"
                                                checked={opciones.satXDenominacion}
                                                onCheckedChange={(checked) =>
                                                    setOpciones({ ...opciones, satXDenominacion: checked === true })
                                                }
                                            />
                                            <label
                                                htmlFor="satXDenominacion"
                                                className="text-sm cursor-pointer"
                                            >
                                                SAT por denominación
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="documentosSimilares"
                                                checked={opciones.documentosSimilares}
                                                onCheckedChange={(checked) =>
                                                    setOpciones({ ...opciones, documentosSimilares: checked === true })
                                                }
                                            />
                                            <label
                                                htmlFor="documentosSimilares"
                                                className="text-sm cursor-pointer"
                                            >
                                                Documentos similares
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                            <Checkbox
                                                id="forzarApellidos"
                                                checked={opciones.forzarApellidos}
                                                onCheckedChange={(checked) =>
                                                    setOpciones({ ...opciones, forzarApellidos: checked === true })
                                                }
                                            />
                                            <label
                                                htmlFor="forzarApellidos"
                                                className="text-sm cursor-pointer"
                                            >
                                                Forzar apellidos
                                            </label>
                                        </div>

                                        <div className="flex items-center space-x-2 col-span-2">
                                            <Checkbox
                                                id="generarCertificados"
                                                checked={opciones.generarCertificados}
                                                onCheckedChange={(checked) =>
                                                    setOpciones({ ...opciones, generarCertificados: checked === true })
                                                }
                                            />
                                            <label
                                                htmlFor="generarCertificados"
                                                className="text-sm cursor-pointer"
                                            >
                                                Generar certificados automáticamente
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-xs">
                                        <strong>IMPORTANTE:</strong> Siempre respetar primer nombre/apellido y segundo nombre/apellido en los campos correspondientes.
                                        Cada búsqueda se descuenta del total contratado — no haga doble clic.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleSearchDemo}
                                        disabled={loading}
                                        className="min-w-40"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                                                Cargando...
                                            </>
                                        ) : (
                                            <>
                                                <Info className="mr-2 h-4 w-4" />
                                                Vista Previa (Demo)
                                            </>
                                        )}
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={loading}
                                        className="min-w-32 bg-blue-600 hover:bg-blue-700"
                                    >
                                        {loading ? (
                                            <>
                                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                                                Buscando...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="mr-2 h-4 w-4" />
                                                Buscar
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Listados complementarios */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Globe className="h-4 w-4 text-blue-600" />
                                Listados complementarios
                            </CardTitle>
                            <CardDescription className="text-xs">
                                Haga clic para descargar automáticamente.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <button
                                onClick={() => descargarListadoComplementario('refipre')}
                                className="flex w-full items-start gap-3 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50"
                            >
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                                <span className="text-xs leading-snug text-blue-800">
                                    Países con Regímenes Fiscales Preferentes
                                    <br />
                                    <span className="font-semibold">(REFIPRE)</span>
                                </span>
                                <Download className="ml-auto h-3.5 w-3.5 shrink-0 text-blue-400" />
                            </button>

                            <button
                                onClick={() => descargarListadoComplementario('ocde')}
                                className="flex w-full items-start gap-3 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50"
                            >
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                                <span className="text-xs leading-snug text-blue-800">
                                    Miembros del Foro Mundial de Transparencia,
                                    <br />
                                    <span className="font-semibold">Paraísos Fiscales (OCDE)</span>
                                </span>
                                <Download className="ml-auto h-3.5 w-3.5 shrink-0 text-blue-400" />
                            </button>

                            <button
                                onClick={() => descargarListadoComplementario('gafi')}
                                className="flex w-full items-start gap-3 rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50"
                            >
                                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                                <span className="text-xs leading-snug text-blue-800">
                                    Territorios informados
                                    <br />
                                    <span className="font-semibold">por las Revisiones del GAFI</span>
                                </span>
                                <Download className="ml-auto h-3.5 w-3.5 shrink-0 text-blue-400" />
                            </button>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Error ── */}
                {error && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* ── Resultados ── */}
                {totalAciertos !== null && (
                    <Card>
                        <CardContent className="pt-5">
                            {/* Código de certificado y fecha */}
                            {codigoCertificado && (
                                <Card className="mb-4 bg-blue-50/50 border-blue-200">
                                    <CardContent className="flex items-center justify-between py-3">
                                        <div>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Código de Certificado de Búsqueda
                                            </p>
                                            <code className="text-sm font-mono font-semibold text-blue-800">
                                                {codigoCertificado}
                                            </code>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground mb-1">
                                                <Calendar className="inline h-3 w-3 mr-1" />
                                                Fecha de Consulta
                                            </p>
                                            <p className="text-sm font-medium">
                                                {fechaConsulta
                                                    ? new Date(fechaConsulta).toLocaleString('es-MX', {
                                                          dateStyle: 'short',
                                                          timeStyle: 'short',
                                                      })
                                                    : 'N/D'}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Resumen de búsqueda */}
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm">
                                            Se encontraron{' '}
                                            <strong className="text-blue-700">{totalAciertos}</strong>{' '}
                                            aciertos
                                            {ultimaBusqueda?.apellido_denominacion && (
                                                <>
                                                    {' '}para{' '}
                                                    <strong>
                                                        Apellido/Denominación:{' '}
                                                        {ultimaBusqueda.apellido_denominacion}
                                                    </strong>
                                                </>
                                            )}
                                            {ultimaBusqueda?.nombres && (
                                                <>
                                                    .{' '}Nombre:{' '}
                                                    <strong>{ultimaBusqueda.nombres}</strong>
                                                </>
                                            )}
                                            .
                                        </p>
                                        {fuenteBusqueda === 'BD_INTERNA' && (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-green-300 bg-green-50 px-1.5 py-0.5 text-[11px] font-semibold text-green-700">
                                                <Users className="h-3 w-3" />
                                                BD Interna
                                            </span>
                                        )}
                                        {fuenteBusqueda === 'API_PLD' && (
                                            <span className="inline-flex items-center gap-1 rounded-md border border-blue-300 bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700">
                                                <Globe className="h-3 w-3" />
                                                API PLD
                                            </span>
                                        )}
                                    </div>
                                    {totalAciertos > 50 && (
                                        <p className="text-xs text-muted-foreground">
                                            Se despliegan los 50 aciertos más relevantes.
                                        </p>
                                    )}
                                </div>

                                {/* Botón certificados */}
                                {resultados.length > 0 && (
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                disabled={generandoCertificado}
                                                className="shrink-0"
                                            >
                                                <FileText className="mr-2 h-4 w-4" />
                                                Certificados
                                                <ChevronDown className="ml-2 h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-64">
                                            <DropdownMenuItem
                                                onClick={generarCertificadoConCoincidencias}
                                                disabled={seleccionados.size !== 1}
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Con coincidencia</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        {seleccionados.size === 1
                                                            ? 'Listo — 1 registro seleccionado'
                                                            : 'Seleccione exactamente 1 registro'}
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={generarCertificadoSinCoincidencias}>
                                                <Info className="mr-2 h-4 w-4 text-blue-600" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Sin coincidencias</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Lista de aciertos
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                )}
                            </div>

                            {resultados.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-center">
                                    <CheckCircle2 className="mb-3 h-10 w-10 text-green-500" />
                                    <p className="font-medium text-green-700">Sin coincidencias encontradas</p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        La persona no figura en las listas PEP consultadas.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* Barra de búsqueda y botón de filtros */}
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                            <Input
                                                placeholder="Buscar por nombre, apellido o identificación..."
                                                value={filtroTexto}
                                                onChange={(e) => setFiltroTexto(e.target.value)}
                                                className="pl-10"
                                            />
                                        </div>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setShowFilters(!showFilters)}
                                            className="shrink-0"
                                        >
                                            <ChevronDown className="mr-2 h-4 w-4" />
                                            Filtros
                                        </Button>
                                        {(filtroTipo || filtroFuente || filtroTexto) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={limpiarFiltros}
                                                className="shrink-0"
                                            >
                                                Limpiar
                                            </Button>
                                        )}
                                    </div>

                                    {/* Panel de filtros expandible */}
                                    {showFilters && (
                                        <div className="grid grid-cols-1 gap-4 rounded-lg border bg-muted/20 p-4 md:grid-cols-2">
                                            <div>
                                                <Label className="mb-2 block text-sm font-medium">
                                                    Tipo de Fuente
                                                </Label>
                                                <select
                                                    value={filtroTipo}
                                                    onChange={(e) => setFiltroTipo(e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                                >
                                                    <option value="">Todos los tipos</option>
                                                    {tiposDisponibles.map((tipo) => (
                                                        <option key={tipo} value={tipo}>
                                                            {tipo}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <Label className="mb-2 block text-sm font-medium">
                                                    Origen de la fuente
                                                </Label>
                                                <select
                                                    value={filtroFuente}
                                                    onChange={(e) => setFiltroFuente(e.target.value)}
                                                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                                                >
                                                    <option value="">Todos los orígenes</option>
                                                    {fuentesDisponibles.map((fuente) => (
                                                        <option key={fuente} value={fuente}>
                                                            {fuente === 'MEX' ? 'México' : fuente === 'ARG' ? 'Argentina' : fuente === 'USA' ? 'Estados Unidos' : fuente}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    {/* Contador de resultados filtrados */}
                                    <div className="text-sm text-muted-foreground">
                                        Mostrando <strong>{resultadosFiltrados.length}</strong> de{' '}
                                        <strong>{resultados.length}</strong> resultados
                                    </div>

                                    {/* Tabla de resultados */}
                                    <div>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="w-10">
                                                        <Checkbox
                                                            checked={
                                                                resultadosFiltrados.length > 0 &&
                                                                seleccionados.size === resultadosFiltrados.length
                                                            }
                                                            onCheckedChange={toggleSeleccionTodos}
                                                        />
                                                    </TableHead>
                                                    <TableHead>Apellidos y Nombres / Denominación</TableHead>
                                                    <TableHead className="w-36">Identificación</TableHead>
                                                    <TableHead className="w-24">Exactitud</TableHead>
                                                    <TableHead className="w-28">Tipo</TableHead>
                                                    <TableHead className="w-16">Fuente</TableHead>
                                                    <TableHead className="w-28">Acciones</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {resultadosFiltrados.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={7}
                                                            className="py-8 text-center text-sm text-muted-foreground"
                                                        >
                                                            No hay resultados con los filtros aplicados.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    resultadosFiltrados.map((resultado) => {
                                                        const estaExpandido = filasExpandidas.has(resultado.id);
                                                        return (
                                                            <>
                                                                <TableRow
                                                                    key={resultado.id}
                                                                    className={seleccionados.has(resultado.id) ? 'bg-blue-50' : ''}
                                                                >
                                                                    <TableCell>
                                                                        <Checkbox
                                                                            checked={seleccionados.has(resultado.id)}
                                                                            onCheckedChange={() => toggleSeleccion(resultado.id)}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <span className="font-medium uppercase">
                                                                            {resultado.apellido_denominacion}
                                                                        </span>
                                                                        {resultado.nombres && (
                                                                            <>
                                                                                {' '}
                                                                                <span className="font-semibold text-blue-700">
                                                                                    {resultado.nombres.toUpperCase()}
                                                                                </span>
                                                                            </>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell className="text-sm text-muted-foreground">
                                                                        {resultado.identificacion ?? '—'}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <ExactitudBars valor={resultado.exactitud} />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <TipoBadge tipo={resultado.tipo as TipoPEP} />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <FuenteBadge fuente={resultado.fuente} />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            onClick={() => toggleExpansion(resultado.id)}
                                                                            className="h-8 w-8 p-0"
                                                                        >
                                                                            {estaExpandido ? (
                                                                                <ChevronDown className="h-4 w-4 rotate-180 transition-transform" />
                                                                            ) : (
                                                                                <ChevronDown className="h-4 w-4 transition-transform" />
                                                                            )}
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                                {estaExpandido && (
                                                                    <TableRow key={`${resultado.id}-detalle`}>
                                                                        <TableCell colSpan={7} className="p-0">
                                                                            <DetalleExpandido resultado={resultado} />
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )}
                                                            </>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* ── Info módulo en espera de API ── */}
                {totalAciertos === null && !loading && (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <Users className="mb-4 h-12 w-12 text-blue-200" />
                            <h3 className="font-semibold text-muted-foreground">
                                Módulo PEPs y Listas de Interés
                            </h3>
                            <p className="mt-2 max-w-md text-sm text-muted-foreground">
                                Realice una búsqueda para consultar si una persona física o moral figura en las
                                listas de Personas Políticamente Expuestas (PEP), Ex-PEPs, afines, y otras
                                listas de interés nacionales e internacionales.
                            </p>
                            <p className="mt-3 text-xs text-muted-foreground">
                                Proveedor: <strong>PrevencionDeLavado.com</strong> — MBA Systems
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
