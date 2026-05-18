import { Head } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, AlertCircle, Search, User, Building2, FileText, XCircle, Download, BarChart3, TrendingUp, Calendar, Clock, FileSpreadsheet, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface SearchResult {
    id: string;
    name: string;
    nombre_limpio?: string;
    type: string;
    source: 'OFAC' | 'SAT';
    similarity?: number;
    coincidencia?: number;
    rfc?: string;
    situacion?: string;
    publicacion_sat?: string;
    publicacion_ofac?: string;
    tipo_coincidencia?: string;
    url_pdf?: string;
    details?: Record<string, unknown>;
}

interface SearchResponse {
    success: boolean;
    message?: string;
    data?: {
        ofac_resultados?: SearchResult[];
        sat_resultados?: SearchResult[];
        resultados_sat?: {
            combinados?: SearchResult[];
            por_rfc?: SearchResult[];
            por_nombre?: SearchResult[];
        };
        total_resultados: number;
        termino_busqueda: string;
        termino_nombre?: string;
        termino_rfc?: string;
    };
}

export default function ListasNegrasSearch() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Listas Negras OFAC/SAT',
            href: '/admin/listas-negras',
            icon: Shield,
        },
    ];

    const [activeTab, setActiveTab] = useState('persona-fisica');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [totalResults, setTotalResults] = useState(0);
    const [lastSearch, setLastSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [historyRefresh, setHistoryRefresh] = useState(0);

    // Formulario para búsqueda de persona física
    const [personaFisicaForm, setPersonaFisicaForm] = useState({
        nombre: '',
    });

    // Formulario para búsqueda de persona moral
    const [personaMoralForm, setPersonaMoralForm] = useState({
        razon_social: '',
    });

    // Formulario para búsqueda por RFC
    const [rfcForm, setRfcForm] = useState({
        rfc: '',
    });

    // Formulario para búsqueda combinada
    const [combinedForm, setCombinedForm] = useState({
        nombre: '',
        rfc: '',
        tipo_persona: 'fisica' as 'fisica' | 'moral',
    });

    // Estados de validación
    const [validationErrors, setValidationErrors] = useState<{
        combinedRfc?: string;
        rfcOnly?: string;
    }>({});

    // Estadísticas del historial
    interface SearchStatistics {
        total_busquedas: number;
        busquedas_este_mes: number;
        busquedas_esta_semana: number;
        busquedas_hoy: number;
        promedio_resultados: number;
        tipo_mas_usado: string;
        por_tipo: Array<{ tipo_busqueda: string; total: number }>;
        por_notaria_y_tipo: Array<{
            notaria_id: number | null;
            tipo_busqueda: string;
            total: number;
            notaria?: { id: number; nombre: string; numero_notaria: string };
        }>;
    }
    const [statistics, setStatistics] = useState<SearchStatistics | null>(null);
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        loadStats();
    }, [historyRefresh]);

    const loadStats = async () => {
        try {
            setStatsLoading(true);
            const res = await fetch('/admin/search-history/statistics', {
                credentials: 'same-origin',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success) setStatistics(json.data);
            }
        } catch {
            // silencioso – las cards mostrarán —
        } finally {
            setStatsLoading(false);
        }
    };

    const handlePersonaFisicaSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!personaFisicaForm.nombre.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch('/admin/search/persona-fisica', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    nombre: personaFisicaForm.nombre,
                }),
            });

            const data: SearchResponse = await response.json();

            if (data.success && data.data) {
                const allResults = [
                    ...(data.data.ofac_resultados || []).map((r: SearchResult) => ({ ...r, source: 'OFAC' as const })),
                    ...(data.data.sat_resultados || []).map((r: SearchResult) => ({ ...r, source: 'SAT' as const })),
                ];
                setResults(allResults);
                setTotalResults(data.data.total_resultados);
                setLastSearch(data.data.termino_busqueda);
                setHistoryRefresh(prev => prev + 1);
            } else {
                setError(data.message || 'Error en la búsqueda');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handlePersonaMoralSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!personaMoralForm.razon_social.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch('/admin/search/persona-moral', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    razon_social: personaMoralForm.razon_social,
                }),
            });

            const data: SearchResponse = await response.json();

            if (data.success && data.data) {
                const allResults = [
                    ...(data.data.ofac_resultados || []).map((r: SearchResult) => ({ ...r, source: 'OFAC' as const })),
                    ...(data.data.sat_resultados || []).map((r: SearchResult) => ({ ...r, source: 'SAT' as const })),
                ];
                setResults(allResults);
                setTotalResults(data.data.total_resultados);
                setLastSearch(data.data.termino_busqueda);
                setHistoryRefresh(prev => prev + 1);
            } else {
                setError(data.message || 'Error en la búsqueda');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleRfcSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rfcForm.rfc.trim()) return;

        // Validar RFC (asumimos que es persona moral por defecto, pero podría ser física también)
        // Para RFC solo, validamos ambos formatos
        const rfcClean = rfcForm.rfc.trim().toUpperCase();
        const isValidLength = rfcClean.length === 12 || rfcClean.length === 13;
        if (!isValidLength) {
            setError('RFC debe tener 12 caracteres (persona física) o 13 caracteres (persona moral)');
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch('/admin/search/rfc', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    rfc: rfcForm.rfc,
                }),
            });

            const data: SearchResponse = await response.json();

            if (data.success) {
                const satResults = (data.data?.sat_resultados || []).map((r: SearchResult) => ({ ...r, source: 'SAT' as const }));
                setResults(satResults);
                setTotalResults(data.data?.total_resultados || 0);
                setLastSearch(data.data?.termino_busqueda || '');
                setHistoryRefresh(prev => prev + 1);
            } else {
                setError(data.message || 'Error en la búsqueda');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

const validateRFC = (rfc: string, tipoPersona: 'fisica' | 'moral'): string | undefined => {
        const rfcClean = rfc.trim().toUpperCase();

        if (tipoPersona === 'fisica' && rfcClean.length !== 12) {
            return 'RFC de persona física debe tener exactamente 12 caracteres';
        }

        if (tipoPersona === 'moral' && rfcClean.length !== 13) {
            return 'RFC de persona moral debe tener exactamente 13 caracteres';
        }

        // Validación permisiva: RFC solo puede contener letras (A-Z, Ñ, &), números y no puede estar vacío
        // Esto permite variaciones en la estructura del RFC que están registradas en el SAT
        const rfcPattern = /^[A-ZÑ&0-9]+$/;

        if (!rfcPattern.test(rfcClean)) {
            return `RFC solo puede contener letras, números, Ñ y &`;
        }

        return undefined;
    };

    const handleCombinedRfcChange = (value: string) => {
        const upperValue = value.toUpperCase();
        const rfcLength = upperValue.trim().length;

        // Auto-detectar tipo de persona según longitud del RFC
        let autoTipoPersona = combinedForm.tipo_persona;
        if (rfcLength === 12) {
            autoTipoPersona = 'fisica';
        } else if (rfcLength === 13) {
            autoTipoPersona = 'moral';
        }

        setCombinedForm({ ...combinedForm, rfc: upperValue, tipo_persona: autoTipoPersona });

        // Validar en tiempo real con el tipo detectado automáticamente
        if (upperValue.trim()) {
            const error = validateRFC(upperValue, autoTipoPersona);
            setValidationErrors(prev => ({ ...prev, combinedRfc: error }));
        } else {
            setValidationErrors(prev => ({ ...prev, combinedRfc: undefined }));
        }
    };

    const handleRfcOnlyChange = (value: string) => {
        const upperValue = value.toUpperCase();
        setRfcForm({ rfc: upperValue });

        // Validar en tiempo real para RFC solo
        if (upperValue.trim()) {
            const rfcClean = upperValue.trim();
            const isValidLength = rfcClean.length === 12 || rfcClean.length === 13;
            if (!isValidLength && rfcClean.length > 0) {
                setValidationErrors(prev => ({
                    ...prev,
                    rfcOnly: 'RFC debe tener 12 caracteres (persona física) o 13 caracteres (persona moral)'
                }));
            } else {
                setValidationErrors(prev => ({ ...prev, rfcOnly: undefined }));
            }
        } else {
            setValidationErrors(prev => ({ ...prev, rfcOnly: undefined }));
        }
    };

    const handleTipoPersonaChange = (value: 'fisica' | 'moral') => {
        setCombinedForm({ ...combinedForm, tipo_persona: value });

        // Re-validar RFC cuando cambia el tipo de persona
        if (combinedForm.rfc.trim()) {
            const error = validateRFC(combinedForm.rfc, value);
            setValidationErrors(prev => ({ ...prev, combinedRfc: error }));
        }
    };

    const handleCombinedSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!combinedForm.nombre.trim() || !combinedForm.rfc.trim()) return;

        // Auto-detectar tipo de persona según longitud del RFC (más confiable que el selector)
        const rfcLength = combinedForm.rfc.trim().length;
        let tipoPersonaReal = combinedForm.tipo_persona;

        if (rfcLength === 12) {
            tipoPersonaReal = 'fisica';
        } else if (rfcLength === 13) {
            tipoPersonaReal = 'moral';
        }

        // Validar RFC según tipo auto-detectado
        const rfcValidationError = validateRFC(combinedForm.rfc, tipoPersonaReal);
        if (rfcValidationError) {
            setError(rfcValidationError);
            return;
        }

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch('/admin/search/combined', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    nombre: combinedForm.nombre,
                    rfc: combinedForm.rfc,
                    tipo_persona: tipoPersonaReal, // Usar el tipo auto-detectado
                }),
            });

            const data: SearchResponse = await response.json();

            if (data.success && data.data) {
                const allResults = [
                    ...(data.data.ofac_resultados || []).map((r: SearchResult) => ({ ...r, source: 'OFAC' as const })),
                    ...(data.data.sat_resultados || []).map((r: SearchResult) => ({ ...r, source: 'SAT' as const })),
                ];
                setResults(allResults);
                setTotalResults(data.data.total_resultados);
                // Formato correcto: RFC / nombre
                setLastSearch(`${combinedForm.rfc.toUpperCase()} / ${combinedForm.nombre}`);
                setHistoryRefresh(prev => prev + 1);
            } else {
                setError(data.message || 'Error en la búsqueda');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const getSimilarityBadge = (similarity?: number, coincidencia?: number) => {
        const percent = similarity || coincidencia;
        if (!percent) return null;

        let variant: 'destructive' | 'outline' | 'default' = 'outline';
        if (percent >= 80) variant = 'destructive';
        else if (percent >= 60) variant = 'default';

        return (
            <Badge variant={variant}>
                {percent}% coincidencia
            </Badge>
        );
    };

    const getSituacionBadge = (situacion?: string) => {
        if (!situacion) return null;

        let variant: 'destructive' | 'default' | 'secondary' = 'secondary';
        if (situacion.includes('Definitivo')) variant = 'destructive';
        else if (situacion.includes('Sentencia Favorable')) variant = 'default';

        return (
            <Badge variant={variant}>
                {situacion}
            </Badge>
        );
    };

    // ── helpers para el scatter chart ────────────────────────────
    const TIPO_NUM: Record<string, number> = {
        'Persona Física': 1,
        'Persona Moral': 2,
        RFC: 3,
        'Búsqueda Combinada': 4,
    };
    const TIPO_LABEL: Record<number, string> = { 1: 'P. Física', 2: 'P. Moral', 3: 'RFC', 4: 'Combinada' };
    const SCATTER_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16'];

    const buildScatterSeries = () => {
        if (!statistics?.por_notaria_y_tipo?.length) return [];

        // Agrupar por notaría
        const grouped: Record<string, { label: string; points: { x: number; y: number; z: number; tipo: string }[] }> = {};

        statistics.por_notaria_y_tipo.forEach((item) => {
            const key = item.notaria_id == null ? 'super-admin' : String(item.notaria_id);
            const label = item.notaria?.nombre
                ? `${item.notaria.nombre} #${item.notaria.numero_notaria}`
                : 'Super Admin';

            if (!grouped[key]) grouped[key] = { label, points: [] };

            grouped[key].points.push({
                x: TIPO_NUM[item.tipo_busqueda] ?? 0,
                y: item.total,
                z: Math.max(item.total * 200, 400),
                tipo: item.tipo_busqueda,
            });
        });

        return Object.values(grouped);
    };

    const renderAdvancedResults = () => {
        if (!results.length && !lastSearch) return null;

        // Separar resultados por tipo
        const ofacResults = results.filter(r => r.source === 'OFAC');
        const satResults = results.filter(r => r.source === 'SAT');

        // Extraer nombre y RFC de lastSearch si es combinada
        const searchParts = lastSearch.match(/^(.+?)\s*\(([A-Z0-9]{12,13})\)$/);
        const searchNombre = searchParts ? searchParts[1] : lastSearch;
        const searchRfc = searchParts ? searchParts[2] : '';

        // Generar URL de PDF para un resultado OFAC individual
        const generateSingleOfacPdfUrl = (result: SearchResult) => {
            const params = new URLSearchParams({
                nombre: searchNombre,
                rfc: searchRfc || '',
                resultados: JSON.stringify([{
                    name: result.name || result.nombre_limpio,
                    nombre_limpio: result.nombre_limpio,
                    similarity: result.similarity || result.coincidencia,
                    tipo_coincidencia: result.tipo_coincidencia,
                    publicacion_ofac: result.publicacion_ofac,
                }]),
            });
            return `/admin/pdf/ofac?${params.toString()}`;
        };

        // Generar URL de PDF para un resultado SAT individual
        const generateSingleSatPdfUrl = (result: SearchResult) => {
            const params = new URLSearchParams({
                nombre: searchNombre,
                rfc: searchRfc || '',
                resultados: JSON.stringify([{
                    name: result.name || result.nombre_limpio,
                    nombre_limpio: result.nombre_limpio,
                    rfc: result.rfc,
                    similarity: result.similarity || result.coincidencia,
                    situacion: result.situacion,
                    tipo_coincidencia: result.tipo_coincidencia,
                    publicacion_sat: result.publicacion_sat,
                }]),
            });
            return `/admin/pdf/sat?${params.toString()}`;
        };

        // Exportar resultados OFAC a Excel
        const handleExportOfac = async () => {
            try {
                const searchTypeLabel = activeTab === 'persona-fisica' ? 'Persona Física' : activeTab === 'persona-moral' ? 'Persona Moral' : activeTab === 'combined' ? 'Combinada' : 'RFC';
                const payload = {
                    results: ofacResults.map(r => ({
                        nombre_original: r.name,
                        nombre_limpio: r.nombre_limpio,
                        coincidencia: r.similarity || r.coincidencia,
                        fuente: 'OFAC',
                    })),
                    searchTerm: searchNombre,
                    searchType: `Búsqueda ${searchTypeLabel}`,
                };

                const response = await fetch('/admin/export/ofac', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) throw new Error('Error al exportar OFAC');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `busqueda_ofac_${searchNombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error al exportar OFAC:', error);
                alert('Error al generar el archivo Excel. Por favor intente nuevamente.');
            }
        };

        // Exportar resultados SAT a Excel
        const handleExportSat = async () => {
            try {
                const searchTypeLabel = activeTab === 'persona-fisica' ? 'Persona Física' : activeTab === 'persona-moral' ? 'Persona Moral' : activeTab === 'combined' ? 'Combinada' : 'RFC';
                const payload = {
                    results: satResults.map(r => ({
                        nombre_original: r.name,
                        nombre_limpio: r.nombre_limpio,
                        rfc: r.rfc,
                        situacion: r.situacion,
                        publicacion_sat: r.publicacion_sat,
                        publicacion_dof: null,
                        coincidencia: r.similarity || r.coincidencia,
                        fuente: 'SAT',
                    })),
                    searchTerm: searchNombre,
                    searchType: `Búsqueda ${searchTypeLabel}`,
                };

                const response = await fetch('/admin/export/sat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) throw new Error('Error al exportar SAT');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `busqueda_sat_${searchNombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error al exportar SAT:', error);
                alert('Error al generar el archivo Excel. Por favor intente nuevamente.');
            }
        };

        // Exportar resultados combinados (OFAC + SAT) a Excel
        const handleExportCombined = async () => {
            try {
                const searchTypeLabel = activeTab === 'persona-fisica' ? 'Persona Física' : activeTab === 'persona-moral' ? 'Persona Moral' : activeTab === 'combined' ? 'Combinada' : 'RFC';
                const payload = {
                    ofacResults: ofacResults.map(r => ({
                        nombre_original: r.name,
                        nombre_limpio: r.nombre_limpio,
                        coincidencia: r.similarity || r.coincidencia,
                        fuente: 'OFAC',
                    })),
                    satResults: satResults.map(r => ({
                        nombre_original: r.name,
                        nombre_limpio: r.nombre_limpio,
                        rfc: r.rfc,
                        situacion: r.situacion,
                        publicacion_sat: r.publicacion_sat,
                        publicacion_dof: null,
                        coincidencia: r.similarity || r.coincidencia,
                        fuente: 'SAT',
                    })),
                    searchTerm: searchNombre,
                    searchType: `Búsqueda ${searchTypeLabel}`,
                };

                const response = await fetch('/admin/export/combined', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify(payload),
                });

                if (!response.ok) throw new Error('Error al exportar resultados combinados');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `busqueda_completa_${searchNombre.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error('Error al exportar combinado:', error);
                alert('Error al generar el archivo Excel. Por favor intente nuevamente.');
            }
        };

        return (
            <div className="space-y-6">

                {/* Resultados OFAC */}
                {ofacResults.length > 0 && (
                    <Card className="border-red-200 bg-linear-to-br from-red-50 to-transparent dark:from-red-950/30">
                        <CardHeader className="border-b border-red-200 dark:border-red-800">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <AlertTriangle className="h-5 w-5 text-red-600" />
                                        Lista OFAC (Estados Unidos)
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {ofacResults.length} coincidencia{ofacResults.length !== 1 ? 's' : ''} encontrada{ofacResults.length !== 1 ? 's' : ''}
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={handleExportOfac}
                                    variant="outline"
                                    size="sm"
                                    className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 whitespace-nowrap"
                                >
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Exportar Excel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {ofacResults.map((result, index) => (
                                    <div key={`ofac-${index}`} className="border border-red-200 dark:border-red-800 rounded-lg p-5 bg-white dark:bg-slate-950 hover:shadow-md transition-shadow">
                                        <div className="space-y-4">
                                            {/* Header with PDF Button */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-lg text-red-700 dark:text-red-400">{result.nombre_limpio || result.name}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        <span className="font-medium">Tipo:</span> {result.type || 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 items-start flex-wrap justify-end">
                                                    {getSimilarityBadge(result.similarity, result.coincidencia)}
                                                    <Button asChild variant="destructive" size="sm" className="whitespace-nowrap">
                                                        <a href={generateSingleOfacPdfUrl(result)} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4 mr-2" />
                                                            PDF
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Detalles en grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-4">
                                                {result.rfc && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">RFC</p>
                                                        <p className="font-mono text-sm mt-1 font-bold">{result.rfc}</p>
                                                    </div>
                                                )}
                                                {result.tipo_coincidencia && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">Tipo Coincidencia</p>
                                                        <p className="text-sm mt-1">{result.tipo_coincidencia}</p>
                                                    </div>
                                                )}
                                                {result.publicacion_ofac && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded md:col-span-2">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">Publicación OFAC</p>
                                                        <p className="text-sm mt-1 text-muted-foreground">{result.publicacion_ofac}</p>
                                                    </div>
                                                )}
                                                {result.details && Object.keys(result.details).length > 0 && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded md:col-span-2">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">Información Adicional</p>
                                                        <ul className="text-sm mt-2 space-y-1">
                                                            {Object.entries(result.details).map(([key, value]) => (
                                                                <li key={key}>
                                                                    <span className="font-medium">{key}:</span> {String(value)}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Resultados SAT */}
                {satResults.length > 0 && (
                    <Card className="border-blue-200 bg-linear-to-br from-blue-50 to-transparent dark:from-blue-950/30">
                        <CardHeader className="border-b border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <CardTitle className="flex items-center gap-2">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                        Lista SAT (Artículo 69-B)
                                    </CardTitle>
                                    <CardDescription className="mt-2">
                                        {satResults.length} coincidencia{satResults.length !== 1 ? 's' : ''} encontrada{satResults.length !== 1 ? 's' : ''}
                                    </CardDescription>
                                </div>
                                <Button
                                    onClick={handleExportSat}
                                    variant="outline"
                                    size="sm"
                                    className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 whitespace-nowrap"
                                >
                                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                                    Exportar Excel
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="space-y-4">
                                {satResults.map((result, index) => (
                                    <div key={`sat-${index}`} className="border border-blue-200 dark:border-blue-800 rounded-lg p-5 bg-white dark:bg-slate-950 hover:shadow-md transition-shadow">
                                        <div className="space-y-4">
                                            {/* Header with PDF Button */}
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex-1">
                                                    <h4 className="font-bold text-lg text-blue-700 dark:text-blue-400">{result.nombre_limpio || result.name}</h4>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {result.tipo_coincidencia && (
                                                            <>
                                                                <span className="font-medium">Búsqueda:</span> {result.tipo_coincidencia}
                                                            </>
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="flex gap-2 flex-wrap justify-end items-start">
                                                    {getSimilarityBadge(result.similarity, result.coincidencia)}
                                                    {getSituacionBadge(result.situacion)}
                                                    <Button asChild variant="default" size="sm" className="whitespace-nowrap">
                                                        <a href={generateSingleSatPdfUrl(result)} target="_blank" rel="noopener noreferrer">
                                                            <Download className="h-4 w-4 mr-2" />
                                                            PDF
                                                        </a>
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Detalles en grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-4">
                                                {result.rfc && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">RFC</p>
                                                        <p className="font-mono text-sm mt-1 font-bold">{result.rfc}</p>
                                                    </div>
                                                )}
                                                {result.situacion && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">Situación</p>
                                                        <p className="text-sm mt-1">{result.situacion}</p>
                                                    </div>
                                                )}
                                                {result.publicacion_sat && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded md:col-span-2">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">Fecha de Publicación SAT</p>
                                                        <p className="text-sm mt-1 text-muted-foreground">{result.publicacion_sat}</p>
                                                    </div>
                                                )}
                                                {result.details && Object.keys(result.details).length > 0 && (
                                                    <div className="bg-slate-50 dark:bg-slate-900 p-3 rounded md:col-span-2">
                                                        <p className="text-xs font-medium text-muted-foreground uppercase">Información Adicional</p>
                                                        <ul className="text-sm mt-2 space-y-1">
                                                            {Object.entries(result.details).map(([key, value]) => (
                                                                <li key={key}>
                                                                    <span className="font-medium">{key}:</span> {String(value)}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Exportar resultados combinados si hay OFAC y SAT */}
                {ofacResults.length > 0 && satResults.length > 0 && (
                    <div className="flex justify-center">
                        <Button
                            onClick={handleExportCombined}
                            variant="default"
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <FileSpreadsheet className="h-5 w-5 mr-2" />
                            Exportar Todo a Excel (OFAC + SAT)
                        </Button>
                    </div>
                )}

                {/* Sin resultados pero con opción de PDF negativo */}
                {results.length === 0 && lastSearch && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                                <h3 className="font-medium text-lg">✓ Ninguna coincidencia encontrada</h3>
                                <p className="text-sm text-muted-foreground">
                                    No se encontraron registros en las listas OFAC y SAT para: <strong className="text-foreground">{lastSearch}</strong>
                                </p>

                                {/* Opción de generar PDF negativo */}
                                <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-4">
                                    <Button
                                        variant="outline"
                                        asChild
                                    >
                                        <a
                                            href={`/admin/pdf/ofac?nombre=${encodeURIComponent(lastSearch)}&rfc=${encodeURIComponent('')}&resultados=${encodeURIComponent('[]')}`}
                                            target="_blank"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            PDF OFAC (Sin coincidencias)
                                        </a>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        asChild
                                    >
                                        <a
                                            href={`/admin/pdf/sat?nombre=${encodeURIComponent(lastSearch)}&rfc=${encodeURIComponent('')}&resultados=${encodeURIComponent('[]')}`}
                                            target="_blank"
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            PDF SAT (Sin coincidencias)
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Búsqueda en Listas Negras" />

            <div className="space-y-6">
                {/* Badge de datos sensibles */}
                <div className="flex justify-end">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Datos Sensibles
                    </Badge>
                </div>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Las búsquedas se realizan en las bases de datos oficiales OFAC (EE.UU.) y SAT 69-B (México). Los resultados pueden contener falsos positivos que requieren verificación manual.
                    </AlertDescription>
                </Alert>

                {/* ── Stats cards (4 columnas) ── */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Total búsquedas</p>
                                    <p className="text-3xl font-bold">
                                        {statsLoading ? '—' : (statistics?.total_busquedas ?? 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Historial completo</p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Este mes</p>
                                    <p className="text-3xl font-bold">
                                        {statsLoading ? '—' : (statistics?.busquedas_este_mes ?? 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Últimos 30 días</p>
                                </div>
                                <Calendar className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Hoy</p>
                                    <p className="text-3xl font-bold">
                                        {statsLoading ? '—' : (statistics?.busquedas_hoy ?? 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Esta semana: {statsLoading ? '—' : (statistics?.busquedas_esta_semana ?? 0)}
                                    </p>
                                </div>
                                <Clock className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                    <p className="text-sm text-muted-foreground">Promedio resultados</p>
                                    <p className="text-3xl font-bold">
                                        {statsLoading ? '—' : (statistics?.promedio_resultados ?? 0)}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        Más usado: {statsLoading ? '—' : (statistics?.tipo_mas_usado ?? 'N/A')}
                                    </p>
                                </div>
                                <TrendingUp className="h-8 w-8 text-muted-foreground" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* ── Tabla por tipo + Scatter chart ── */}
                {statistics && (
                    <div className="grid gap-4 md:grid-cols-3">
                        {/* Tabla distribución por tipo */}
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Búsquedas por tipo
                                </CardTitle>
                                <CardDescription>Distribución total del historial</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 font-medium text-muted-foreground">Tipo</th>
                                            <th className="text-right py-2 font-medium text-muted-foreground">Total</th>
                                            <th className="text-right py-2 font-medium text-muted-foreground">%</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(['Persona Física', 'Persona Moral', 'RFC', 'Búsqueda Combinada'] as const).map((tipo) => {
                                            const row = statistics.por_tipo.find((r) => r.tipo_busqueda === tipo);
                                            const count = row?.total ?? 0;
                                            const pct = statistics.total_busquedas > 0 ? Math.round((count / statistics.total_busquedas) * 100) : 0;
                                            const colorMap: Record<string, string> = {
                                                'Persona Física': 'bg-blue-500',
                                                'Persona Moral': 'bg-purple-500',
                                                RFC: 'bg-green-500',
                                                'Búsqueda Combinada': 'bg-orange-500',
                                            };
                                            return (
                                                <tr key={tipo} className="border-b last:border-0">
                                                    <td className="py-2 flex items-center gap-2">
                                                        <span className={`inline-block w-2 h-2 rounded-full ${colorMap[tipo]}`} />
                                                        {tipo}
                                                    </td>
                                                    <td className="py-2 text-right font-mono font-bold">{count}</td>
                                                    <td className="py-2 text-right text-muted-foreground">{pct}%</td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td className="pt-3 font-semibold">Total</td>
                                            <td className="pt-3 text-right font-mono font-bold">{statistics.total_busquedas}</td>
                                            <td className="pt-3 text-right text-muted-foreground">100%</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </CardContent>
                        </Card>

                        {/* Scatter chart por tipo y notaría */}
                        <Card className="md:col-span-2">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <BarChart3 className="h-4 w-4" />
                                    Dispersión por notaría y tipo de búsqueda
                                </CardTitle>
                                <CardDescription>
                                    Eje X: tipo · Eje Y: cantidad · Tamaño: volumen relativo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {statistics.por_notaria_y_tipo.length === 0 ? (
                                    <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
                                        Sin datos suficientes para la gráfica
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height={260}>
                                        <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                                            <XAxis
                                                type="number"
                                                dataKey="x"
                                                domain={[0.5, 4.5]}
                                                ticks={[1, 2, 3, 4]}
                                                tickFormatter={(v) => TIPO_LABEL[v] ?? ''}
                                                tick={{ fontSize: 11 }}
                                                label={{ value: 'Tipo de búsqueda', position: 'insideBottom', offset: -10, fontSize: 11 }}
                                            />
                                            <YAxis
                                                type="number"
                                                dataKey="y"
                                                allowDecimals={false}
                                                tick={{ fontSize: 11 }}
                                                label={{ value: 'Búsquedas', angle: -90, position: 'insideLeft', fontSize: 11 }}
                                            />
                                            <ZAxis type="number" dataKey="z" range={[60, 600]} />
                                            <Tooltip
                                                cursor={{ strokeDasharray: '3 3' }}
                                                content={({ payload }) => {
                                                    if (!payload?.length) return null;
                                                    const d = payload[0].payload as { tipo: string; y: number };
                                                    return (
                                                        <div className="rounded border bg-background p-2 text-xs shadow-lg">
                                                            <p className="font-semibold">{d.tipo}</p>
                                                            <p className="text-muted-foreground">Búsquedas: {d.y}</p>
                                                        </div>
                                                    );
                                                }}
                                            />
                                            <Legend wrapperStyle={{ fontSize: 11 }} />
                                            {buildScatterSeries().map((series, idx) => (
                                                <Scatter
                                                    key={series.label}
                                                    name={series.label}
                                                    data={series.points}
                                                    fill={SCATTER_COLORS[idx % SCATTER_COLORS.length]}
                                                >
                                                    {series.points.map((_, pi) => (
                                                        <Cell
                                                            key={pi}
                                                            fill={SCATTER_COLORS[idx % SCATTER_COLORS.length]}
                                                            fillOpacity={0.75}
                                                        />
                                                    ))}
                                                </Scatter>
                                            ))}
                                        </ScatterChart>
                                    </ResponsiveContainer>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* ── Formulario de búsqueda (ancho completo) ── */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5" />
                            Búsqueda en Listas Negras
                        </CardTitle>
                        <CardDescription>Selecciona el tipo de búsqueda que deseas realizar</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                            <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                                <TabsTrigger
                                    value="persona-fisica"
                                    className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-transparent hover:bg-gray-200"
                                >
                                    <User className="w-4 h-4" />
                                    Persona Física
                                </TabsTrigger>
                                <TabsTrigger
                                    value="persona-moral"
                                    className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-transparent hover:bg-gray-200"
                                >
                                    <Building2 className="w-4 h-4" />
                                    Persona Moral
                                </TabsTrigger>
                                <TabsTrigger
                                    value="rfc"
                                    className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-transparent hover:bg-gray-200"
                                >
                                    <FileText className="w-4 h-4" />
                                    RFC
                                </TabsTrigger>
                                <TabsTrigger
                                    value="combinada"
                                    className="flex items-center gap-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=inactive]:text-gray-600 data-[state=inactive]:bg-transparent hover:bg-gray-200"
                                >
                                    <Search className="w-4 h-4" />
                                    Combinada
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value="persona-fisica" className="mt-4">
                                <form onSubmit={handlePersonaFisicaSearch} className="space-y-4">
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="nombre-fisica">Nombre completo</RequiredLabel>
                                        <Input
                                            id="nombre-fisica"
                                            placeholder="Ej: Juan Pérez García"
                                            value={personaFisicaForm.nombre}
                                            onChange={(e) => setPersonaFisicaForm({ nombre: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading ? 'Buscando...' : 'Buscar en OFAC + SAT'}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="persona-moral" className="mt-4">
                                <form onSubmit={handlePersonaMoralSearch} className="space-y-4">
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="razon-social">Razón social / Denominación</RequiredLabel>
                                        <Input
                                            id="razon-social"
                                            placeholder="Ej: EMPRESA DEMO SA DE CV"
                                            value={personaMoralForm.razon_social}
                                            onChange={(e) => setPersonaMoralForm({ razon_social: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading ? 'Buscando...' : 'Buscar en OFAC + SAT'}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="rfc" className="mt-4">
                                <form onSubmit={handleRfcSearch} className="space-y-4">
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="rfc">RFC</RequiredLabel>
                                        <Input
                                            id="rfc"
                                            placeholder="Ej: XAXX010101000"
                                            value={rfcForm.rfc}
                                            onChange={(e) => handleRfcOnlyChange(e.target.value)}
                                            maxLength={13}
                                            required
                                            className={validationErrors.rfcOnly ? 'border-red-500' : ''}
                                        />
                                        {validationErrors.rfcOnly && (
                                            <p className="text-sm text-red-500">{validationErrors.rfcOnly}</p>
                                        )}
                                    </div>
                                    <Button type="submit" disabled={loading || !!validationErrors.rfcOnly} className="w-full">
                                        {loading ? 'Buscando...' : 'Buscar en SAT'}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="combinada" className="mt-4">
                                <form onSubmit={handleCombinedSearch} className="space-y-4">
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="tipo-persona">Tipo de persona</RequiredLabel>
                                        <Select value={combinedForm.tipo_persona} onValueChange={handleTipoPersonaChange}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fisica">Persona Física (RFC 12 caracteres)</SelectItem>
                                                <SelectItem value="moral">Persona Moral (RFC 13 caracteres)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="nombre-combinado">Nombre / Razón social</RequiredLabel>
                                        <Input
                                            id="nombre-combinado"
                                            placeholder={combinedForm.tipo_persona === 'fisica' ? 'Ej: Juan Pérez García' : 'Ej: EMPRESA DEMO SA DE CV'}
                                            value={combinedForm.nombre}
                                            onChange={(e) => setCombinedForm({ ...combinedForm, nombre: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="rfc-combinado">
                                            RFC{' '}
                                            <span className="text-sm text-muted-foreground">
                                                ({combinedForm.tipo_persona === 'fisica' ? '12' : '13'} caracteres)
                                            </span>
                                        </RequiredLabel>
                                        <Input
                                            id="rfc-combinado"
                                            placeholder={combinedForm.tipo_persona === 'fisica' ? 'Ej: XAXX010101XX' : 'Ej: XXX010101XXX'}
                                            value={combinedForm.rfc}
                                            onChange={(e) => handleCombinedRfcChange(e.target.value)}
                                            maxLength={13}
                                            required
                                            className={validationErrors.combinedRfc ? 'border-red-500' : ''}
                                        />
                                        {validationErrors.combinedRfc && (
                                            <p className="text-sm text-red-500">{validationErrors.combinedRfc}</p>
                                        )}
                                    </div>
                                    <Button type="submit" disabled={loading || !!validationErrors.combinedRfc} className="w-full">
                                        {loading ? 'Buscando...' : 'Búsqueda Cruzada OFAC + SAT'}
                                    </Button>
                                </form>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {error && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {/* ── Resultados ── */}
                {(results.length > 0 || (!loading && lastSearch)) && (
                    <div>
                        {results.length > 0 && (
                            <div className="mb-4">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center justify-between">
                                            Resultados de búsqueda
                                            <Badge variant="outline">
                                                {totalResults} resultado{totalResults !== 1 ? 's' : ''}
                                            </Badge>
                                        </CardTitle>
                                        <CardDescription>
                                            Búsqueda: <strong>{lastSearch}</strong>
                                        </CardDescription>
                                    </CardHeader>
                                </Card>
                            </div>
                        )}
                        {renderAdvancedResults()}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}
