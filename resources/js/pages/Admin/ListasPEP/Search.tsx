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

interface PEPResultado {
    id: string;
    apellido_denominacion: string;
    nombres: string;
    identificacion?: string;
    exactitud: number; // 0–100
    tipo: TipoPEP;
    fuente: OrigenFuente;
}

interface BusquedaForm {
    apellido_denominacion: string;
    nombres: string;
    identificacion: string;
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
// Helpers UI
// ---------------------------------------------------------------------------

/** Barras de exactitud al estilo prevenciondelavado.com */
function ExactitudBars({ valor }: { valor: number }) {
    // 5 barras, se pintan según el porcentaje
    const total = 5;
    const llenas = Math.round((valor / 100) * total);

    const colorClass =
        valor >= 80 ? 'bg-green-500' : valor >= 50 ? 'bg-yellow-500' : 'bg-red-400';

    return (
        <div className="flex items-center gap-0.5" title={`${valor}% de exactitud`}>
            {Array.from({ length: total }).map((_, i) => (
                <span
                    key={i}
                    className={`inline-block h-3 w-2 rounded-sm ${i < llenas ? colorClass : 'bg-muted'}`}
                />
            ))}
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
    const colors: Record<OrigenFuente, string> = {
        MEX: 'bg-green-100 text-green-800',
        ARG: 'bg-sky-100 text-sky-800',
        USA: 'bg-indigo-100 text-indigo-800',
        OTRO: 'bg-muted text-muted-foreground',
    };
    return (
        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium ${colors[fuente]}`}>
            {fuente}
        </span>
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

    // ---- Estado de resultados ----
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resultados, setResultados] = useState<PEPResultado[]>([]);
    const [totalAciertos, setTotalAciertos] = useState<number | null>(null);
    const [ultimaBusqueda, setUltimaBusqueda] = useState<Partial<BusquedaForm> | null>(null);

    // ---- Estado de filtros ----
    const [filtroTipo, setFiltroTipo] = useState<TipoPEP[]>([]);
    const [filtroFuente, setFiltroFuente] = useState<OrigenFuente[]>([]);

    // ---- Selección para certificado ----
    const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
    const [generandoCertificado, setGenerandoCertificado] = useState(false);

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
        setSeleccionados(new Set());
        setFiltroTipo([]);
        setFiltroFuente([]);

        try {
            // TODO: Reemplazar con el endpoint real de la API del proveedor
            // cuando se entreguen las credenciales y documentación de la API.
            // Endpoint estimado: POST /admin/listas-pep/buscar
            // Body: { apellido_denominacion, nombres, identificacion }
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
                }),
            });

            const data = await response.json();

            if (data.success) {
                setResultados(data.data?.resultados ?? []);
                setTotalAciertos(data.data?.total_aciertos ?? 0);
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
        const pasaTipo = filtroTipo.length === 0 || filtroTipo.includes(r.tipo);
        const pasaFuente = filtroFuente.length === 0 || filtroFuente.includes(r.fuente);
        return pasaTipo && pasaFuente;
    });

    // ---- Toggle tipo de filtro ----
    const toggleFiltroTipo = (tipo: TipoPEP) => {
        setFiltroTipo((prev) =>
            prev.includes(tipo) ? prev.filter((t) => t !== tipo) : [...prev, tipo],
        );
    };

    const toggleFiltroFuente = (fuente: OrigenFuente) => {
        setFiltroFuente((prev) =>
            prev.includes(fuente) ? prev.filter((f) => f !== fuente) : [...prev, fuente],
        );
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

    // ---- Generación de certificados ----
    const generarCertificadoConCoincidencias = async () => {
        if (seleccionados.size === 0) {
            setError('Seleccione al menos un registro para generar el certificado.');
            return;
        }
        setGenerandoCertificado(true);
        try {
            // TODO: Implementar endpoint de generación de certificado PDF
            // POST /admin/listas-pep/certificado/con-coincidencias
            // Body: { ids: [...], busqueda }
            const response = await fetch('/admin/listas-pep/certificado/con-coincidencias', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    ids: Array.from(seleccionados),
                    busqueda: ultimaBusqueda,
                }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `certificado-pep-coincidencias-${Date.now()}.pdf`;
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
            // TODO: Implementar endpoint de certificado sin coincidencias
            // POST /admin/listas-pep/certificado/sin-coincidencias
            // Genera el certificado con leyenda:
            // "De acuerdo con el análisis del usuario, los aciertos hallados
            //  no se corresponden con la persona buscada"
            const response = await fetch('/admin/listas-pep/certificado/sin-coincidencias', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN':
                        document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ busqueda: ultimaBusqueda }),
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

                                <Alert className="border-amber-200 bg-amber-50 text-amber-800">
                                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                                    <AlertDescription className="text-xs">
                                        <strong>IMPORTANTE:</strong> Siempre respetar primer nombre/apellido y segundo nombre/apellido en los campos correspondientes.
                                        Cada búsqueda se descuenta del total contratado — no haga doble clic.
                                    </AlertDescription>
                                </Alert>

                                <div className="flex justify-end">
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
                            {/* Resumen de búsqueda */}
                            <div className="mb-4 flex items-start justify-between gap-4">
                                <div className="space-y-1">
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
                                                disabled={seleccionados.size === 0}
                                            >
                                                <CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">Con coincidencias</span>
                                                    <span className="text-xs text-muted-foreground">
                                                        Registros marcados ({seleccionados.size} sel.)
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
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-4">
                                    {/* Filtros laterales */}
                                    <div className="space-y-5 rounded-lg border bg-muted/20 p-4 lg:col-span-1">
                                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Filtros
                                        </p>

                                        {tiposDisponibles.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-foreground">
                                                    Tipo de Fuente
                                                </p>
                                                <div className="space-y-1.5">
                                                    {tiposDisponibles.map((tipo) => (
                                                        <button
                                                            key={tipo}
                                                            onClick={() => toggleFiltroTipo(tipo)}
                                                            className={`block text-left text-xs transition-colors ${filtroTipo.includes(tipo) ? 'font-semibold text-blue-700 underline' : 'text-blue-500 hover:text-blue-700 hover:underline'}`}
                                                        >
                                                            {tipo}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {fuentesDisponibles.length > 0 && (
                                            <div className="space-y-2">
                                                <p className="text-xs font-medium text-foreground">
                                                    Origen de la fuente
                                                </p>
                                                <div className="space-y-1.5">
                                                    {fuentesDisponibles.map((fuente) => (
                                                        <button
                                                            key={fuente}
                                                            onClick={() => toggleFiltroFuente(fuente)}
                                                            className={`block text-left text-xs transition-colors ${filtroFuente.includes(fuente) ? 'font-semibold text-blue-700 underline' : 'text-blue-500 hover:text-blue-700 hover:underline'}`}
                                                        >
                                                            {fuente === 'MEX' ? 'México' : fuente === 'ARG' ? 'Argentina' : fuente === 'USA' ? 'Estados Unidos' : fuente}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {(filtroTipo.length > 0 || filtroFuente.length > 0) && (
                                            <button
                                                onClick={() => { setFiltroTipo([]); setFiltroFuente([]); }}
                                                className="text-xs text-red-500 hover:underline"
                                            >
                                                Limpiar filtros
                                            </button>
                                        )}
                                    </div>

                                    {/* Tabla de resultados */}
                                    <div className="lg:col-span-3">
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
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {resultadosFiltrados.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={6}
                                                            className="py-8 text-center text-sm text-muted-foreground"
                                                        >
                                                            No hay resultados con los filtros aplicados.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    resultadosFiltrados.map((resultado) => (
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
                                                                <TipoBadge tipo={resultado.tipo} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <FuenteBadge fuente={resultado.fuente} />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
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
