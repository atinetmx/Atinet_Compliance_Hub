import { FileDown, Sparkles, Trash2, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    error_mensaje?: string | null;
}

interface Props {
    documento: Documento;
    open: boolean;
    onClose: () => void;
    onDownload: (documentoId: number, formato: string) => void;
    onAnalyze: (documento: Documento) => void;
    onDelete: (documento: Documento) => void;
}

export default function DocumentPreview({
    documento,
    open,
    onClose,
    onDownload,
    onAnalyze,
    onDelete,
}: Props) {
    const getEstadoBadge = (estado: string) => {
        const badges = {
            pendiente: <Badge variant="secondary">Pendiente</Badge>,
            procesando: <Badge variant="default">Procesando</Badge>,
            completado: <Badge variant="default">Completado</Badge>,
            error: <Badge variant="destructive">Error</Badge>,
        };
        return badges[estado as keyof typeof badges] || <Badge>{estado}</Badge>;
    };

    const renderDatosExtraidos = () => {
        if (!documento.datos_extraidos) {
            return <p className="text-sm text-muted-foreground">No hay datos extraídos disponibles</p>;
        }

        // Renderizar datos extraídos de forma estructurada
        const datos = documento.datos_extraidos;

        return (
            <div className="space-y-4">
                {datos.tipo_documento && (
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Tipo de Documento</h4>
                        <p className="text-sm">{datos.tipo_documento}</p>
                    </div>
                )}

                {datos.fecha_documento && (
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Fecha</h4>
                        <p className="text-sm">{datos.fecha_documento}</p>
                    </div>
                )}

                {datos.partes && datos.partes.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Partes</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {datos.partes.map((parte: string, index: number) => (
                                <li key={index}>{parte}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {datos.objeto && (
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Objeto</h4>
                        <p className="text-sm">{datos.objeto}</p>
                    </div>
                )}

                {datos.montos && datos.montos.length > 0 && (
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Montos</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {datos.montos.map((monto: any, index: number) => (
                                <li key={index}>
                                    {monto.concepto}: {monto.cantidad} {monto.moneda}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {datos.datos_notariales && (
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Datos Notariales</h4>
                        <div className="text-sm space-y-1">
                            {datos.datos_notariales.notaria && (
                                <p>Notaría: {datos.datos_notariales.notaria}</p>
                            )}
                            {datos.datos_notariales.numero && (
                                <p>Número: {datos.datos_notariales.numero}</p>
                            )}
                            {datos.datos_notariales.estado && (
                                <p>Estado: {datos.datos_notariales.estado}</p>
                            )}
                            {datos.datos_notariales.notario && (
                                <p>Notario: {datos.datos_notariales.notario}</p>
                            )}
                        </div>
                    </div>
                )}

                {datos.confianza && (
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Nivel de Confianza</h4>
                        <Badge variant={datos.confianza >= 0.8 ? 'default' : 'secondary'}>
                            {(datos.confianza * 100).toFixed(0)}%
                        </Badge>
                    </div>
                )}

                {/* Mostrar otros campos dinámicamente */}
                {Object.keys(datos).map((key) => {
                    // Ignorar campos ya renderizados
                    const renderedKeys = [
                        'tipo_documento',
                        'fecha_documento',
                        'partes',
                        'objeto',
                        'montos',
                        'datos_notariales',
                        'confianza',
                    ];
                    if (renderedKeys.includes(key)) return null;

                    const value = datos[key];
                    if (!value || (Array.isArray(value) && value.length === 0)) return null;

                    return (
                        <div key={key}>
                            <h4 className="font-semibold text-sm mb-1 capitalize">
                                {key.replace(/_/g, ' ')}
                            </h4>
                            {typeof value === 'object' && !Array.isArray(value) ? (
                                <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                                    {JSON.stringify(value, null, 2)}
                                </pre>
                            ) : Array.isArray(value) ? (
                                <ul className="list-disc list-inside text-sm space-y-1">
                                    {value.map((item, index) => (
                                        <li key={index}>
                                            {typeof item === 'object'
                                                ? JSON.stringify(item)
                                                : item}
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="text-sm">{String(value)}</p>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-175 max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{documento.nombre_original}</DialogTitle>
                    <DialogDescription>
                        Detalles del documento y datos extraídos
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Info básica */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-semibold mb-1">Tipo</p>
                            {documento.tipo_documento ? (
                                <Badge variant="outline">{documento.tipo_documento}</Badge>
                            ) : (
                                <span className="text-muted-foreground">No especificado</span>
                            )}
                        </div>
                        <div>
                            <p className="font-semibold mb-1">Estado</p>
                            {getEstadoBadge(documento.estado)}
                        </div>
                        <div>
                            <p className="font-semibold mb-1">Tamaño</p>
                            <p>{documento.tamano_formateado}</p>
                        </div>
                        <div>
                            <p className="font-semibold mb-1">Fecha de Carga</p>
                            <p>{new Date(documento.created_at).toLocaleString()}</p>
                        </div>
                    </div>

                    {documento.error_mensaje && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-800">
                                <strong>Error:</strong> {documento.error_mensaje}
                            </p>
                        </div>
                    )}

                    <Separator />

                    {/* Tabs con información */}
                    <Tabs defaultValue="resumen" className="w-full">
                        <TabsList className="grid w-full grid-cols-3">
                            <TabsTrigger value="resumen">Resumen IA</TabsTrigger>
                            <TabsTrigger value="datos">Datos Extraídos</TabsTrigger>
                            <TabsTrigger value="descargas">Descargas</TabsTrigger>
                        </TabsList>

                        <TabsContent value="resumen" className="space-y-4">
                            {documento.resumen_ia ? (
                                <div className="prose prose-sm max-w-none">
                                    <p className="whitespace-pre-wrap">{documento.resumen_ia}</p>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-muted-foreground mb-4">
                                        Este documento no ha sido analizado con IA
                                    </p>
                                    {documento.estado === 'completado' && !documento.analizado_ia && (
                                        <Button onClick={() => onAnalyze(documento)}>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Analizar con IA
                                        </Button>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="datos" className="space-y-4">
                            {renderDatosExtraidos()}
                        </TabsContent>

                        <TabsContent value="descargas" className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start"
                                onClick={() => onDownload(documento.id, 'original')}
                            >
                                <FileDown className="mr-2 h-4 w-4" />
                                Descargar Original
                            </Button>

                            {documento.ruta_pdf && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => onDownload(documento.id, 'pdf')}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Descargar PDF
                                </Button>
                            )}

                            {documento.ruta_word && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => onDownload(documento.id, 'word')}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Descargar Word
                                </Button>
                            )}

                            {documento.ruta_texto && (
                                <Button
                                    variant="outline"
                                    className="w-full justify-start"
                                    onClick={() => onDownload(documento.id, 'texto')}
                                >
                                    <FileDown className="mr-2 h-4 w-4" />
                                    Descargar Texto
                                </Button>
                            )}

                            {!documento.ruta_pdf &&
                                !documento.ruta_word &&
                                !documento.ruta_texto && (
                                    <p className="text-sm text-muted-foreground text-center py-4">
                                        No hay formatos procesados disponibles
                                    </p>
                                )}
                        </TabsContent>
                    </Tabs>

                    <Separator />

                    {/* Acciones */}
                    <div className="flex justify-between">
                        <Button
                            variant="destructive"
                            onClick={() => {
                                onDelete(documento);
                                onClose();
                            }}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                        </Button>

                        <Button variant="outline" onClick={onClose}>
                            <X className="mr-2 h-4 w-4" />
                            Cerrar
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
