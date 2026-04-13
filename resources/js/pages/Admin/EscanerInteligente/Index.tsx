import { Head, router, usePage } from '@inertiajs/react';
import { FileDown, FileText, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

import DocumentUploader from '@/components/Admin/EscanerInteligente/DocumentUploader';
import DocumentPreview from '@/components/Admin/EscanerInteligente/DocumentPreview';

interface Documento {
    id: number;
    nombre_original: string;
    tipo_documento: string | null;
    tamano_bytes: number;
    estado: 'pendiente' | 'procesando' | 'completado' | 'error';
    analizado_ia: boolean;
    ruta_pdf: string | null;
    ruta_word: string | null;
    ruta_texto: string | null;
    resumen_ia: string | null;
    datos_extraidos: any;
    created_at: string;
    tamano_formateado: string;
}

interface Stats {
    total: number;
    pendientes: number;
    completados: number;
    analizados: number;
    espacio_usado: number;
}

interface Props {
    documentos: {
        data: Documento[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    stats: Stats;
    filters: {
        tipo_documento?: string;
        estado?: string;
        analizado?: string;
        search?: string;
    };
}

export default function Index({ documentos, stats, filters }: Props) {
    const [showUploader, setShowUploader] = useState(false);
    const [selectedDocument, setSelectedDocument] = useState<Documento | null>(null);
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleSearch = () => {
        router.get(
            '/admin/escaner-inteligente',
            {
                ...filters,
                search: searchTerm,
            },
            { preserveState: true }
        );
    };

    const handleFilter = (key: string, value: string) => {
        router.get(
            '/admin/escaner-inteligente',
            {
                ...filters,
                [key]: value === 'all' ? undefined : value,
            },
            { preserveState: true }
        );
    };

    const handleDelete = (documento: Documento) => {
        if (confirm(`¿Estás seguro de eliminar "${documento.nombre_original}"?`)) {
            router.delete(`/admin/escaner-inteligente/${documento.id}`, {
                onSuccess: () => {
                    toast.success('Documento eliminado correctamente');
                },
                onError: () => {
                    toast.error('Error al eliminar el documento');
                },
            });
        }
    };

    const handleAnalyze = (documento: Documento) => {
        router.post(
            `/admin/escaner-inteligente/${documento.id}/analyze`,
            {},
            {
                onSuccess: () => {
                    toast.success('Documento analizado correctamente');
                },
                onError: () => {
                    toast.error('Error al analizar el documento');
                },
            }
        );
    };

    const handleDownload = (documentoId: number, formato: string) => {
        window.location.href = `/admin/escaner-inteligente/${documentoId}/download/${formato}`;
    };

    const getEstadoBadge = (estado: string) => {
        const badges = {
            pendiente: <Badge variant="secondary">Pendiente</Badge>,
            procesando: <Badge variant="default">Procesando</Badge>,
            completado: <Badge variant="default">Completado</Badge>,
            error: <Badge variant="destructive">Error</Badge>,
        };
        return badges[estado as keyof typeof badges] || <Badge>{estado}</Badge>;
    };

    const formatBytes = (bytes: number) => {
        if (bytes >= 1073741824) {
            return (bytes / 1073741824).toFixed(2) + ' GB';
        } else if (bytes >= 1048576) {
            return (bytes / 1048576).toFixed(2) + ' MB';
        } else if (bytes >= 1024) {
            return (bytes / 1024).toFixed(2) + ' KB';
        }
        return bytes + ' bytes';
    };

    return (
        <AppLayout>
            <Head title="Escáner Inteligente de Documentos" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Escáner Inteligente</h1>
                        <p className="text-muted-foreground">
                            Digitaliza, convierte y analiza documentos con IA
                        </p>
                    </div>
                    <Button onClick={() => setShowUploader(true)} size="lg">
                        <Plus className="mr-2 h-4 w-4" />
                        Subir Documento
                    </Button>
                </div>

                {/* Stats Cards */}
                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Documentos</CardTitle>
                            <FileText className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Completados</CardTitle>
                            <FileText className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.completados}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Analizados con IA</CardTitle>
                            <Sparkles className="h-4 w-4 text-purple-600" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.analizados}</div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Espacio Usado</CardTitle>
                            <FileDown className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{formatBytes(stats.espacio_usado)}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <Card>
                    <CardHeader>
                        <CardTitle>Filtros</CardTitle>
                        <CardDescription>Busca y filtra tus documentos</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-4">
                            <div className="flex-1">
                                <Input
                                    placeholder="Buscar por nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') handleSearch();
                                    }}
                                />
                            </div>

                            <Select
                                value={filters.tipo_documento || 'all'}
                                onValueChange={(value) => handleFilter('tipo_documento', value)}
                            >
                                <SelectTrigger className="w-50">
                                    <SelectValue placeholder="Tipo de documento" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="escritura">Escritura</SelectItem>
                                    <SelectItem value="contrato">Contrato</SelectItem>
                                    <SelectItem value="poder">Poder</SelectItem>
                                    <SelectItem value="testamento">Testamento</SelectItem>
                                    <SelectItem value="otro">Otro</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={filters.estado || 'all'}
                                onValueChange={(value) => handleFilter('estado', value)}
                            >
                                <SelectTrigger className="w-45">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="pendiente">Pendiente</SelectItem>
                                    <SelectItem value="procesando">Procesando</SelectItem>
                                    <SelectItem value="completado">Completado</SelectItem>
                                    <SelectItem value="error">Error</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button onClick={handleSearch}>
                                <Search className="mr-2 h-4 w-4" />
                                Buscar
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Documents Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Documentos</CardTitle>
                        <CardDescription>
                            {documentos.total} documento(s) encontrado(s)
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Tipo</TableHead>
                                    <TableHead>Tamaño</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>IA</TableHead>
                                    <TableHead>Fecha</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documentos.data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8">
                                            <p className="text-muted-foreground">
                                                No hay documentos. ¡Sube tu primer documento!
                                            </p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    documentos.data.map((doc) => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium">
                                                {doc.nombre_original}
                                            </TableCell>
                                            <TableCell>
                                                {doc.tipo_documento ? (
                                                    <Badge variant="outline">{doc.tipo_documento}</Badge>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </TableCell>
                                            <TableCell>{doc.tamano_formateado}</TableCell>
                                            <TableCell>{getEstadoBadge(doc.estado)}</TableCell>
                                            <TableCell>
                                                {doc.analizado_ia ? (
                                                    <Badge variant="default">
                                                        <Sparkles className="mr-1 h-3 w-3" />
                                                        Sí
                                                    </Badge>
                                                ) : (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleAnalyze(doc)}
                                                        disabled={doc.estado !== 'completado'}
                                                    >
                                                        <Sparkles className="mr-1 h-3 w-3" />
                                                        Analizar
                                                    </Button>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedDocument(doc)}
                                                    >
                                                        Ver
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleDelete(doc)}
                                                    >
                                                        <Trash2 className="h-4 w-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Document Uploader Modal */}
            <DocumentUploader
                open={showUploader}
                onClose={() => setShowUploader(false)}
            />

            {/* Document Preview Modal */}
            {selectedDocument && (
                <DocumentPreview
                    documento={selectedDocument}
                    open={!!selectedDocument}
                    onClose={() => setSelectedDocument(null)}
                    onDownload={handleDownload}
                    onAnalyze={handleAnalyze}
                    onDelete={handleDelete}
                />
            )}
        </AppLayout>
    );
}
