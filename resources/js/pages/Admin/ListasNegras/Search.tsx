import { Head } from '@inertiajs/react';
import { AlertCircle, Search, User, Building2, FileText, CheckCircle2, XCircle } from 'lucide-react';
import { useState } from 'react';

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
    type: string;
    source: 'OFAC' | 'SAT';
    similarity?: number;
    rfc?: string;
    details?: Record<string, unknown>;
}

interface SearchResponse {
    success: boolean;
    message?: string;
    data?: {
        ofac_resultados?: SearchResult[];
        sat_resultados?: SearchResult[];
        total_resultados: number;
        termino_busqueda: string;
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
            } else {
                setError(data.message || 'Error en la búsqueda');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleCombinedSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!combinedForm.nombre.trim() || !combinedForm.rfc.trim()) return;

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
            } else {
                setError(data.message || 'Error en la búsqueda');
            }
        } catch {
            setError('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const getSimilarityBadge = (similarity?: number) => {
        if (!similarity) return null;

        let variant: 'destructive' | 'outline' | 'default' = 'outline';
        if (similarity >= 80) variant = 'destructive';
        else if (similarity >= 60) variant = 'default';

        return (
            <Badge variant={variant}>
                {similarity}% coincidencia
            </Badge>
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
                                            onChange={(e) => setRfcForm({ rfc: e.target.value.toUpperCase() })}
                                            maxLength={13}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full">
                                        {loading ? 'Buscando...' : 'Buscar en SAT'}
                                    </Button>
                                </form>
                            </TabsContent>

                            <TabsContent value="combinada" className="mt-4">
                                <form onSubmit={handleCombinedSearch} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="tipo-persona">Tipo de persona</Label>
                                        <Select value={combinedForm.tipo_persona} onValueChange={(value: 'fisica' | 'moral') => setCombinedForm({ ...combinedForm, tipo_persona: value })}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="fisica">Persona Física</SelectItem>
                                                <SelectItem value="moral">Persona Moral</SelectItem>
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
                                        <Label htmlFor="rfc-combinado">RFC</Label>
                                        <Input
                                            id="rfc-combinado"
                                            placeholder="Ej: XAXX010101000"
                                            value={combinedForm.rfc}
                                            onChange={(e) => setCombinedForm({ ...combinedForm, rfc: e.target.value.toUpperCase() })}
                                            maxLength={13}
                                            required
                                        />
                                    </div>
                                    <Button type="submit" disabled={loading} className="w-full">
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

                {results.length > 0 && (
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
                        <CardContent>
                            <div className="space-y-4">
                                {results.map((result, index) => (
                                    <div
                                        key={`${result.source}-${index}`}
                                        className="border rounded-lg p-4 hover:shadow-sm transition-shadow"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className="space-y-2 flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-medium">{result.name}</h3>
                                                    <Badge variant={result.source === 'OFAC' ? 'destructive' : 'default'}>
                                                        {result.source}
                                                    </Badge>
                                                    {getSimilarityBadge(result.similarity)}
                                                </div>
                                                {result.rfc && (
                                                    <p className="text-sm text-muted-foreground">
                                                        RFC: {result.rfc}
                                                    </p>
                                                )}
                                                {result.type && (
                                                    <p className="text-sm text-muted-foreground">
                                                        Tipo: {result.type}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                                    Verificar manualmente
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {!loading && results.length === 0 && lastSearch && (
                    <Card>
                        <CardContent className="pt-6">
                            <div className="text-center space-y-2">
                                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
                                <h3 className="font-medium">Ninguna coincidencia encontrada</h3>
                                <p className="text-sm text-muted-foreground">
                                    No se encontraron registros en las listas OFAC y SAT para: <strong>{lastSearch}</strong>
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
