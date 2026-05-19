import { Head } from '@inertiajs/react';
import { BarChart3, Loader2, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApi } from '@/services/api';

import AppLayout from '@/layouts/app-layout';
import PDFViewerModal from '@/pages/ControlNotarial/Modals/PDFViewerModal';

interface BreadcrumbItem {
    title: string;
    href?: string;
}

interface Notario {
    id: number;
    nombre: string;
    apellido_Paterno: string;
    apellido_Materno: string;
    rol: string;
}

interface Operacion {
    id: number;
    descripcion: string;
    actividad_Vulnerable_Id: number | null;
    activo: boolean;
}

export default function ReportesIndex() {
    const [selectedReportType, setSelectedReportType] = useState<string>('expedientes');
    const [selectedReport, setSelectedReport] = useState<string>('');
    const [notarios, setNotarios] = useState<Notario[]>([]);
    const [operaciones, setOperaciones] = useState<Operacion[]>([]);
    const [cargandoNotarios, setCargandoNotarios] = useState(false);
    const [cargandoOperaciones, setCargandoOperaciones] = useState(false);
    const [filterType, setFilterType] = useState<'todos' | 'fecha'>('todos');
    const [selectedNotario, setSelectedNotario] = useState<number | 'todos'>('todos');
    const [selectedOperacion, setSelectedOperacion] = useState<string>('');
    const [fechaInicio, setFechaInicio] = useState<string>('');
    const [fechaFin, setFechaFin] = useState<string>('');
    const [buscando, setBuscando] = useState(false);
    const [showPdfViewer, setShowPdfViewer] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const api = useApi();

    // Simple notification function (will use toast when context is available)
    const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info', duration = 5000) => {
        console.log(`[${type.toUpperCase()}] ${message}`);
    };

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Control Notarial',
            href: '/admin/control-notarial',
        },
        {
            title: 'Reportes del Sistema',
        },
    ];

    const reportOptions: Record<string, Array<{ id: string; name: string }>> = {
        expedientes: [
            {
                id: 'expedientes',
                name: 'Expedientes'
            },
            {
                id: 'expedientes-por-estatus',
                name: 'Expedientes por Estatus'
            },
            {
                id: 'expedientes-por-responsable',
                name: 'Expedientes por Responsable'
            }
        ]
    };

    // Cargar notarios y operaciones cuando se selecciona el reporte "expedientes"
    useEffect(() => {
        if (selectedReport === 'expedientes') {
            fetchNotarios();
            fetchOperaciones();
        }
    }, [selectedReport]);

    const fetchNotarios = async () => {
        setCargandoNotarios(true);
        try {
            const response = await api.get('/User/GetNotarios');
            if (response?.dataResponse && Array.isArray(response.dataResponse)) {
                setNotarios(response.dataResponse);
            }
        } catch (error) {
            console.error('Error cargando notarios:', error);
        } finally {
            setCargandoNotarios(false);
        }
    };

    const fetchOperaciones = async () => {
        setCargandoOperaciones(true);
        try {
            const response = await api.get('/Catalogos/GetOperaciones');
            if (response?.dataResponse && Array.isArray(response.dataResponse)) {
                setOperaciones(response.dataResponse);
            }
        } catch (error) {
            console.error('Error cargando operaciones:', error);
        } finally {
            setCargandoOperaciones(false);
        }
    };

    const handleBuscar = async () => {
        try {
            setBuscando(true);

            // Construir parámetros de la URL
            const params = new URLSearchParams();

            // Agregar fechas si está en modo "fecha"
            if (filterType === 'fecha') {
                if (fechaInicio) params.append('fechaInicio', fechaInicio);
                if (fechaFin) params.append('fechaFin', fechaFin);
            }

            // Agregar notario si no es "Todos"
            if (selectedNotario !== 'todos') {
                params.append('notarioId', selectedNotario.toString());
            }

            // Agregar operación si está seleccionada
            if (selectedOperacion) {
                params.append('operacionId', selectedOperacion.toString());
            }

            // Llamar a la API para obtener el reporte
            const { blob, response } = await api.getBlob(
                `/Expediente/GenerateReporteExpedientes?${params.toString()}`
            );

            // Verificar si hay error de autorización
            if (response?.isUnauthorized) {
                addToast('No autorizado para generar el reporte', 'error');
                return;
            }

            // Mostrar el PDF en el modal si se generó correctamente
            if (blob && response?.success !== false) {
                const url = URL.createObjectURL(blob);
                setPdfUrl(url);
                setShowPdfViewer(true);
                addToast('Reporte generado correctamente', 'success');
            } else {
                addToast(response?.message || 'Error al generar el reporte', 'error');
            }
        } catch (error) {
            console.error('Error generando reporte:', error);
            addToast('No se pudo generar el reporte', 'error');
        } finally {
            setBuscando(false);
        }
    };

    const closePdfViewer = () => {
        setShowPdfViewer(false);
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Reportes del Sistema" />

            <div className="min-h-screen space-y-6 p-6">


                {/* Selectores de Reporte */}
                <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-6">
                    <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
                        {/* Selector de Tipo de Reporte */}
                        <div>
                            <label htmlFor="reportType" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Tipo de Reporte
                            </label>
                            <select
                                id="reportType"
                                value={selectedReportType}
                                onChange={(e) => {
                                    setSelectedReportType(e.target.value);
                                    setSelectedReport('');
                                }}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                            >
                                <option value="expedientes">Expedientes</option>
                            </select>
                        </div>

                        {/* Selector de Reporte Específico */}
                        <div>
                            <label htmlFor="reportSpecific" className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                                Seleccionar Reporte
                            </label>
                            <select
                                id="reportSpecific"
                                value={selectedReport}
                                onChange={(e) => setSelectedReport(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                            >
                                <option value="">Selecciona un reporte...</option>
                                {selectedReportType && reportOptions[selectedReportType] &&
                                    reportOptions[selectedReportType].map((option) => (
                                        <option key={option.id} value={option.id}>
                                            {option.name}
                                        </option>
                                    ))
                                }
                            </select>
                        </div>
                    </div>
                </div>

                {/* Formulario de Filtros para Expedientes */}
                {selectedReport === 'expedientes' && (
                    <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-6">
                        <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-6">
                            Filtros del Reporte
                        </h2>

                        <div className="space-y-6">
                            {/* PERIODO: Todos - Fecha */}
                            <div>
                                <label className="block text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-3">
                                    Período
                                </label>
                                <div className="flex gap-6">
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="filter-todos"
                                            name="filterType"
                                            value="todos"
                                            checked={filterType === 'todos'}
                                            onChange={(e) => setFilterType(e.target.value as 'todos' | 'fecha')}
                                            className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                                        />
                                        <label htmlFor="filter-todos" className="ml-2 text-sm text-indigo-900 dark:text-indigo-100 cursor-pointer">
                                            Todos
                                        </label>
                                    </div>
                                    <div className="flex items-center">
                                        <input
                                            type="radio"
                                            id="filter-fecha"
                                            name="filterType"
                                            value="fecha"
                                            checked={filterType === 'fecha'}
                                            onChange={(e) => setFilterType(e.target.value as 'todos' | 'fecha')}
                                            className="w-4 h-4 text-indigo-600 dark:text-indigo-400"
                                        />
                                        <label htmlFor="filter-fecha" className="ml-2 text-sm text-indigo-900 dark:text-indigo-100 cursor-pointer">
                                            Fecha
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* FECHA INICIO - FECHA FIN (lado a lado) */}
                            {filterType === 'fecha' && (
                                <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                                    <div>
                                        <label htmlFor="fechaInicio" className="block text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                            Fecha Inicio
                                        </label>
                                        <input
                                            type="date"
                                            id="fechaInicio"
                                            value={fechaInicio}
                                            onChange={(e) => setFechaInicio(e.target.value)}
                                            className="w-full px-4 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="fechaFin" className="block text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                            Fecha Fin
                                        </label>
                                        <input
                                            type="date"
                                            id="fechaFin"
                                            value={fechaFin}
                                            onChange={(e) => setFechaFin(e.target.value)}
                                            className="w-full px-4 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* NOTARIO */}
                            <div>
                                <label htmlFor="notario" className="block text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                    Notario
                                </label>
                                {cargandoNotarios ? (
                                    <div className="flex items-center justify-center h-10">
                                        <Loader2 className="size-5 text-indigo-600 animate-spin" />
                                    </div>
                                ) : (
                                    <select
                                        id="notario"
                                        value={selectedNotario}
                                        onChange={(e) => setSelectedNotario(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                                        className="w-full px-4 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                    >
                                        <option value="todos">Todos</option>
                                        {notarios.map((notario) => (
                                            <option key={notario.id} value={notario.id}>
                                                {notario.nombre} {notario.apellido_Paterno} {notario.apellido_Materno}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>

                            {/* OPERACION */}
                            <div>
                                <label htmlFor="operacion" className="block text-sm font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                                    Operación
                                </label>
                                {cargandoOperaciones ? (
                                    <div className="flex items-center justify-center h-10">
                                        <Loader2 className="size-5 text-indigo-600 animate-spin" />
                                    </div>
                                ) : (
                                    <select
                                        id="operacion"
                                        value={selectedOperacion}
                                        onChange={(e) => setSelectedOperacion(e.target.value)}
                                        className="w-full px-4 py-2 border border-indigo-300 dark:border-indigo-600 rounded-lg bg-white dark:bg-indigo-900/50 text-indigo-900 dark:text-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400"
                                    >
                                        <option value="">Todas</option>
                                        {operaciones.map((operacion) => (
                                            <option key={operacion.id} value={operacion.id}>
                                                {operacion.descripcion}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>



                        {/* Botones de Acción */}
                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={handleBuscar}
                                disabled={buscando}
                                className="flex items-center justify-center gap-2 flex-1 px-6 py-3 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 disabled:from-indigo-400 disabled:to-indigo-500 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 dark:from-indigo-600 dark:to-indigo-700 dark:hover:from-indigo-700 dark:hover:to-indigo-800"
                            >
                                {buscando ? (
                                    <>
                                        <Loader2 className="size-5 animate-spin" />
                                        Buscando...
                                    </>
                                ) : (
                                    <>
                                        <Search className="size-5" />
                                        Buscar
                                    </>
                                )}
                            </button>
                        </div>

                    </div>
                )}

                {/* Información de otros reportes */}
                {selectedReport && selectedReport !== 'expedientes' && (
                    <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/30 p-6">
                        <h2 className="text-lg font-semibold text-indigo-900 dark:text-indigo-100 mb-2">
                            Reporte Seleccionado
                        </h2>
                        <p className="text-sm text-indigo-800 dark:text-indigo-200">
                            {reportOptions[selectedReportType]?.find(r => r.id === selectedReport)?.name}
                        </p>
                        <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-2">
                            Este reporte está en desarrollo y será disponible próximamente.
                        </p>
                    </div>
                )}
            </div>

            {/* PDF Viewer Modal */}
            <PDFViewerModal
                isOpen={showPdfViewer}
                onClose={closePdfViewer}
                pdfUrl={pdfUrl || ''}
                title="Reporte de Expedientes"
                fileName="reporte-expedientes.pdf"
            />
        </AppLayout>
    );
}
