import { Head } from '@inertiajs/react';
import { AlertTriangle, CheckCircle2, AlertCircle, Search, User, Building2, FileText, XCircle, Download, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

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

interface SearchStats {
    total_searches: number;
    this_month: number;
    this_week: number;
    today: number;
}

interface RecentSearch {
    search_term: string;
    search_type: string;
    results_count: number;
    created_at: string;
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

    // Estados para estadísticas y búsquedas recientes
    const [searchStats, setSearchStats] = useState<SearchStats | null>(null);
    const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);

    // Cargar estadísticas y búsquedas recientes al montar el componente
    useEffect(() => {
        loadSearchStats();
        loadRecentSearches();
    }, []);

    const loadSearchStats = async () => {
        try {
            const response = await fetch('/admin/search/stats', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setSearchStats(data);
            }
        } catch (error) {
            console.error('Error loading search stats:', error);
        }
    };

    const loadRecentSearches = async () => {
        try {
            const response = await fetch('/admin/search/recent', {
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });
            if (response.ok) {
                const data = await response.json();
                setRecentSearches(data);
            }
        } catch (error) {
            console.error('Error loading recent searches:', error);
        }
    };

    const saveRecentSearch = async (searchTerm: string, searchType: string, resultsCount: number) => {
        try {
            const response = await fetch('/admin/search/save-recent', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    search_term: searchTerm,
                    search_type: searchType,
                    results_count: resultsCount,
                }),
            });
            if (response.ok) {
                // Recargar búsquedas recientes y estadísticas
                loadRecentSearches();
                loadSearchStats();
            }
        } catch (error) {
            console.error('Error saving recent search:', error);
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
                    ...(data.data.ofac_resultados || []),
                    ...(data.data.sat_resultados || []),
                ];
                setResults(allResults);
                setTotalResults(data.data.total_resultados);
                setLastSearch(data.data.termino_busqueda);

                // Guardar búsqueda reciente
                await saveRecentSearch(
                    personaFisicaForm.nombre,
                    'Persona Física',
                    data.data.total_resultados
                );
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
                    ...(data.data.ofac_resultados || []),
                    ...(data.data.sat_resultados || []),
                ];
                setResults(allResults);
                setTotalResults(data.data.total_resultados);
                setLastSearch(data.data.termino_busqueda);

                // Guardar búsqueda reciente
                await saveRecentSearch(
                    personaMoralForm.razon_social,
                    'Persona Moral',
                    data.data.total_resultados
                );
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
                setResults(data.data?.sat_resultados || []);
                setTotalResults(data.data?.total_resultados || 0);
                setLastSearch(data.data?.termino_busqueda || '');

                // Guardar búsqueda reciente
                await saveRecentSearch(
                    rfcForm.rfc,
                    'RFC',
                    data.data?.total_resultados || 0
                );
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

        // Validación básica de formato RFC
        const rfcPattern = tipoPersona === 'fisica'
            ? /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{2}$/
            : /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;

        if (!rfcPattern.test(rfcClean)) {
            return `Formato de RFC ${tipoPersona === 'fisica' ? 'persona física' : 'persona moral'} inválido`;
        }

        return undefined;
    };

    const handleCombinedRfcChange = (value: string) => {
        const upperValue = value.toUpperCase();
        setCombinedForm({ ...combinedForm, rfc: upperValue });

        // Validar en tiempo real
        if (upperValue.trim()) {
            const error = validateRFC(upperValue, combinedForm.tipo_persona);
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

        // Validar RFC según tipo de persona
        const rfcValidationError = validateRFC(combinedForm.rfc, combinedForm.tipo_persona);
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
                    tipo_persona: combinedForm.tipo_persona,
                }),
            });

            const data: SearchResponse = await response.json();

            if (data.success && data.data) {
                const allResults = [
                    ...(data.data.ofac_resultados || []),
                    ...(data.data.sat_resultados || []),
                ];
                setResults(allResults);
                setTotalResults(data.data.total_resultados);
                setLastSearch(`${data.data.termino_busqueda} (${combinedForm.rfc})`);

                // Guardar búsqueda reciente
                await saveRecentSearch(
                    `${combinedForm.nombre} (${combinedForm.rfc})`,
                    'Búsqueda Combinada',
                    data.data.total_resultados
                );
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

    const handleRecentSearchClick = (search: RecentSearch) => {
        // Prellenar formulario según tipo de búsqueda
        switch (search.search_type) {
            case 'Persona Física':
                setActiveTab('persona-fisica');
                setPersonaFisicaForm({ nombre: search.search_term });
                break;
            case 'Persona Moral':
                setActiveTab('persona-moral');
                setPersonaMoralForm({ razon_social: search.search_term });
                break;
            case 'RFC':
                setActiveTab('rfc');
                setRfcForm({ rfc: search.search_term });
                break;
            case 'Búsqueda Combinada': {
                setActiveTab('combinada');
                // Para búsqueda combinada, el término incluye nombre y RFC
                const parts = search.search_term.split(' (');
                if (parts.length === 2) {
                    const nombre = parts[0];
                    const rfc = parts[1].replace(')', '');
                    setCombinedForm({
                        ...combinedForm,
                        nombre: nombre,
                        rfc: rfc,
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

        return (
            <div className="space-y-6">
                {/* Resultados OFAC */}
                {ofacResults.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-500" />
                                Lista OFAC (Estados Unidos)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {ofacResults.map((result, index) => (
                                <div key={`ofac-${index}`} className="border rounded-lg p-4 bg-red-50 dark:bg-red-900/20 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-lg">{result.nombre_limpio || result.name}</div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                Tipo: {result.type} | Fuente: OFAC
                                            </div>
                                        </div>
                                        {getSimilarityBadge(result.similarity, result.coincidencia)}
                                    </div>
                                    {result.rfc && (
                                        <div className="text-sm">
                                            <span className="font-medium">RFC:</span>
                                            <span className="ml-2 font-mono">{result.rfc}</span>
                                        </div>
                                    )}
                                    {result.publicacion_ofac && (
                                        <div className="text-sm">
                                            <span className="font-medium">Publicación:</span>
                                            <span className="ml-2 text-muted-foreground">{result.publicacion_ofac}</span>
                                        </div>
                                    )}
                                    {result.url_pdf && (
                                        <Button asChild variant="outline" className="w-full">
                                            <a href={result.url_pdf} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4 mr-2" />
                                                Generar PDF OFAC
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Resultados SAT */}
                {satResults.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-purple-500" />
                                Lista SAT (Artículo 69-B)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {satResults.map((result, index) => (
                                <div key={`sat-${index}`} className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="font-medium text-lg">{result.nombre_limpio || result.name}</div>
                                            <div className="text-sm text-muted-foreground mt-1">
                                                {result.tipo_coincidencia && `${result.tipo_coincidencia} | `}
                                                Fuente: SAT
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            {getSimilarityBadge(result.similarity, result.coincidencia)}
                                            {getSituacionBadge(result.situacion)}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm border-t pt-3">
                                        {result.rfc && (
                                            <div>
                                                <span className="font-medium">RFC:</span>
                                                <span className="ml-2 font-mono">{result.rfc}</span>
                                            </div>
                                        )}
                                        {result.publicacion_sat && (
                                            <div>
                                                <span className="font-medium">Publicación SAT:</span>
                                                <span className="ml-2 text-xs text-muted-foreground">{result.publicacion_sat}</span>
                                            </div>
                                        )}
                                    </div>
                                    {result.url_pdf && (
                                        <Button asChild variant="outline" className="w-full">
                                            <a href={result.url_pdf} target="_blank" rel="noopener noreferrer">
                                                <Download className="h-4 w-4 mr-2" />
                                                Generar PDF SAT
                                            </a>
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}

                {/* Sin resultados pero con opción de PDF negativo */}
                {results.length === 0 && lastSearch && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-4">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                                <h3 className="font-medium">Ninguna coincidencia encontrada</h3>
                                <p className="text-sm text-muted-foreground">
                                    No se encontraron registros en las listas OFAC y SAT para: <strong>{lastSearch}</strong>
                                </p>

                                {/* Opción de generar PDF negativo */}
                                <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-4">
                                    <Button variant="outline" asChild>
                                        <a href={`/pdf/ofac-negative?nombre=${encodeURIComponent(lastSearch)}`} target="_blank">
                                            <Download className="h-4 w-4 mr-2" />
                                            PDF OFAC (Sin coincidencias)
                                        </a>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <a href={`/pdf/sat-negative?nombre=${encodeURIComponent(lastSearch)}`} target="_blank">
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

                    {/* Sidebar con estadísticas y búsquedas recientes - Ocupa 1 columna */}
                    <div className="space-y-6">
                        {/* Estadísticas */}
                        {searchStats && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium">Estadísticas de Búsqueda</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Total búsquedas</span>
                                        <Badge variant="secondary">{searchStats.total_searches}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Este mes</span>
                                        <Badge variant="secondary">{searchStats.this_month}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Esta semana</span>
                                        <Badge variant="secondary">{searchStats.this_week}</Badge>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm">Hoy</span>
                                        <Badge variant="secondary">{searchStats.today}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        )}

                        {/* Búsquedas recientes */}
                        {recentSearches.length > 0 && (
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                                        <Clock className="h-4 w-4" />
                                        Búsquedas Recientes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        {recentSearches.slice(0, 10).map((search, index) => (
                                            <div key={index} className="flex items-center justify-between text-sm group hover:bg-muted/50 p-2 rounded-md transition-colors">
                                                <div className="truncate flex-1 mr-2">
                                                    <div className="font-medium truncate">{search.search_term}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {search.search_type} • {search.results_count} resultados
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {new Date(search.created_at).toLocaleDateString()}
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleRecentSearchClick(search)}
                                                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Repetir búsqueda"
                                                >
                                                    <Search className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
