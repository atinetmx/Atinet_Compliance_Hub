import { Head } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, AlertCircle, Search, User, Building2, FileText, XCircle, Download } from 'lucide-react';
import { useState } from 'react';

import SearchHistorySidebar from '@/components/SearchHistorySidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

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

    // TODO: Implementar endpoints de estadísticas y búsquedas recientes en el backend
    // Historial de búsquedas ahora se maneja con SearchHistorySidebar component

    // Búsquedas se guardan automáticamente en el backend (ver saveSearchHistory en SuperAdminSearchController)

    const handlePersonaFisicaSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!personaFisicaForm.nombre.trim()) return;

        setLoading(true);
        setError(null);
        setResults([]);

        try {
            const response = await fetch('/admin/search/persona-fisica', {
                method: 'POST',
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

    const handleSearchHistorySelect = (search: { tipo_busqueda: string; termino_busqueda: string }) => {
        const tipo = search.tipo_busqueda;

        switch (tipo) {
            case 'Persona Física':
                setActiveTab('persona-fisica');
                setPersonaFisicaForm({ nombre: search.termino_busqueda });
                break;
            case 'Persona Moral':
                setActiveTab('persona-moral');
                setPersonaMoralForm({ razon_social: search.termino_busqueda });
                break;
            case 'RFC':
                setActiveTab('rfc');
                setRfcForm({ rfc: search.termino_busqueda });
                break;
            case 'Búsqueda Combinada': {
                setActiveTab('combinada');
                // Parseamos el término que viene en formato "RFC / nombre"
                const parts = search.termino_busqueda.split(' / ');
                if (parts.length === 2) {
                    setCombinedForm({
                        ...combinedForm,
                        rfc: parts[0].trim(),
                        nombre: parts[1].trim(),
                    });
                }
                break;
            }
        }
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
        <AppLayout>
            <Head title="Búsqueda en Listas Negras - SuperAdmin" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Listas Negras</h1>
                        <p className="text-muted-foreground">
                            Búsqueda en listas OFAC y SAT - Acceso SuperAdmin
                        </p>
                    </div>
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        Datos Sensibles
                    </Badge>
                </div>

                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Las búsquedas se realizan en las bases de datos oficiales OFAC (EE.UU.) y SAT 69-B (México).
                        Los resultados pueden contener falsos positivos que requieren verificación manual.
                    </AlertDescription>
                </Alert>

                {/* Layout principal con grilla: formulario + sidebar */}
                <div className="grid gap-6 lg:grid-cols-4">
                    {/* Formulario de Búsqueda - Ocupa 3 columnas */}
                    <div className="lg:col-span-3 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Search className="w-5 h-5" />
                                    Búsqueda en Listas Negras
                                </CardTitle>
                                <CardDescription>
                                    Selecciona el tipo de búsqueda que deseas realizar
                                </CardDescription>
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
                                        <Label htmlFor="nombre-fisica">Nombre completo</Label>
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
                                        <Label htmlFor="razon-social">Razón social / Denominación</Label>
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
                                        <Label htmlFor="rfc">RFC</Label>
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
                                        <Label htmlFor="tipo-persona">Tipo de persona</Label>
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
                                        <Label htmlFor="nombre-combinado">Nombre / Razón social</Label>
                                        <Input
                                            id="nombre-combinado"
                                            placeholder={combinedForm.tipo_persona === 'fisica' ? "Ej: Juan Pérez García" : "Ej: EMPRESA DEMO SA DE CV"}
                                            value={combinedForm.nombre}
                                            onChange={(e) => setCombinedForm({ ...combinedForm, nombre: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rfc-combinado">
                                            RFC <span className="text-sm text-muted-foreground">
                                                ({combinedForm.tipo_persona === 'fisica' ? '12' : '13'} caracteres)
                                            </span>
                                        </Label>
                                        <Input
                                            id="rfc-combinado"
                                            placeholder={combinedForm.tipo_persona === 'fisica' ? "Ej: XAXX010101XX" : "Ej: XXX010101XXX"}
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

                        {/* Resultados con diseño avanzado */}
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

                    {/* Sidebar con historial de búsquedas - Ocupa 1 columna */}
                    <div>
                        <SearchHistorySidebar
                            onSelectSearch={handleSearchHistorySelect}
                            refreshTrigger={historyRefresh}
                        />
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
