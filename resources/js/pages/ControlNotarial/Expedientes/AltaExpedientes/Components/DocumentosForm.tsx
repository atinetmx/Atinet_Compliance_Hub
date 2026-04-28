import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Upload, FileText, AlertCircle, Loader2, X, Search, Eye } from 'lucide-react';
import { PDFViewerModal } from '../../../Modals';

interface DocumentosFormProps {
    formData: any;
    setFormData: (value: any) => void;
    mostrarModalAgregarDocumento?: boolean;
    setMostrarModalAgregarDocumento?: (value: boolean) => void;
    documentosSeleccionados?: Record<number, boolean>;
    setDocumentosSeleccionados?: (value: Record<number, boolean>) => void;
    documentosDisponibles?: any[];
    cargandoDocumentosDisponibles?: boolean;
    fetchDocumentosDisponibles?: () => void;
    obtenerDocumentosAgregados?: () => Set<string>;
    handleAgregarDocumentosSeleccionados?: () => void;
    documentosPorCliente?: any[];
    clienteSeleccionadoDocumentos?: number | null;
    setClienteSeleccionadoDocumentos?: (value: number | null) => void;
    documentosEditados?: Record<string, any>;
    setDocumentosEditados?: (value: Record<string, any>) => void;
    cargandoDocumentosExpediente?: boolean;
    handleDocumentoChange?: (id: string, field: string, value: any) => void;
    handleEliminarDocumentoDeAll?: (documento: string) => void;
    currentExpedienteId?: number;
    api?: any;
    addToast?: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export default function DocumentosForm(props: DocumentosFormProps) {
    const [filtroDocumentos, setFiltroDocumentos] = useState('');
    const [showPdfDocumentosViewer, setShowPdfDocumentosViewer] = useState(false);
    const [pdfUrlDocumentos, setPdfUrlDocumentos] = useState<string | null>(null);
    const [cargandoDocumentosImpresion, setCargandoDocumentosImpresion] = useState(false);

    const closePdfDocumentosViewer = () => {
        setShowPdfDocumentosViewer(false);
        if (pdfUrlDocumentos) {
            URL.revokeObjectURL(pdfUrlDocumentos);
            setPdfUrlDocumentos(null);
        }
    };

    const handleImprimirDocumentos = async () => {
        const { currentExpedienteId, clienteSeleccionadoDocumentos, api, addToast } = props;

        if (!currentExpedienteId) {
            addToast?.('Error: No se encontró el ID del expediente', 'error');
            return;
        }

        if (!clienteSeleccionadoDocumentos) {
            addToast?.('Por favor selecciona un cliente para imprimir los documentos', 'error');
            return;
        }

        setCargandoDocumentosImpresion(true);
        try {
            const { blob, response } = await api?.getBlob?.(
                `/Expediente/GenerateReciboDocumentosExpediente?expedienteId=${currentExpedienteId}&clienteId=${clienteSeleccionadoDocumentos}`
            );

            if (response?.isUnauthorized) {
                addToast?.('No autorizado para generar documentos', 'error');
                return;
            }

            if (blob && response?.success !== false) {
                const url = URL.createObjectURL(blob);
                setPdfUrlDocumentos(url);
                setShowPdfDocumentosViewer(true);
                addToast?.('Documentos generados exitosamente', 'success');
            } else {
                addToast?.(response?.message || 'Error al generar los documentos', 'error');
            }
        } catch (error) {
            console.error('Error imprimiendo documentos:', error);
            addToast?.('No se pudieron generar los documentos', 'error');
        } finally {
            setCargandoDocumentosImpresion(false);
        }
    };

    const {
        mostrarModalAgregarDocumento = false,
        setMostrarModalAgregarDocumento,
        documentosSeleccionados = {},
        setDocumentosSeleccionados,
        documentosDisponibles = [],
        cargandoDocumentosDisponibles = false,
        fetchDocumentosDisponibles,
        obtenerDocumentosAgregados,
        handleAgregarDocumentosSeleccionados,
        documentosPorCliente = [],
        clienteSeleccionadoDocumentos = null,
        setClienteSeleccionadoDocumentos,
        documentosEditados = {},
        setDocumentosEditados,
        cargandoDocumentosExpediente = false,
        handleDocumentoChange,
        handleEliminarDocumentoDeAll,
    } = props;
    return (
        <>
                                <div className="space-y-4">
                        {/* Sección de Documentos */}
                        <div className="border rounded-lg p-5 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-transparent">
                            <div className="flex items-center justify-between gap-2 mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-blue-600 text-white p-3 rounded-lg">
                                        <Upload className="h-5 w-5" />
                                    </div>
                                    <h4 className="text-lg font-bold text-gray-900 dark:text-white">Documentos Adjuntos</h4>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={handleImprimirDocumentos}
                                        disabled={cargandoDocumentosImpresion || !props.clienteSeleccionadoDocumentos}
                                        className="border-2 border-blue-400 text-blue-700 hover:bg-blue-50 font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                        title={!props.clienteSeleccionadoDocumentos ? "Selecciona un cliente para imprimir" : "Imprimir documentos"}
                                    >
                                        {cargandoDocumentosImpresion ? (
                                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                        ) : (
                                            <Eye className="h-4 w-4 mr-2" />
                                        )}
                                        Imprimir
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-blue-600 hover:bg-blue-700"
                                        onClick={() => {
                                            if (fetchDocumentosDisponibles) {
                                                fetchDocumentosDisponibles();
                                            }
                                        }}
                                        disabled={cargandoDocumentosDisponibles}
                                    >
                                        {cargandoDocumentosDisponibles ? (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        ) : (
                                            <Plus className="h-4 w-4 mr-2" />
                                        )}
                                        Agregar Documento
                                    </Button>
                                </div>
                            </div>

                            {/* Modal para agregar documentos */}
                            {mostrarModalAgregarDocumento &&
                                createPortal(
                                    <>
                                        {/* Overlay oscuro con blur */}
                                        <div
                                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                                            onClick={() => {
                                                setMostrarModalAgregarDocumento?.(false);
                                                setDocumentosSeleccionados?.({});
                                                setFiltroDocumentos('');
                                            }}
                                        />

                                    {/* Modal */}
                                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                                        <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col border border-gray-200 dark:border-slate-700">
                                            {/* Header */}
                                            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 flex items-center justify-between border-b border-blue-700">
                                                <div className="flex items-center gap-3">
                                                    <FileText className="h-5 w-5" />
                                                    <h3 className="text-lg font-semibold">Selecciona Documentos para Agregar</h3>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        setMostrarModalAgregarDocumento?.(false);
                                                        setDocumentosSeleccionados?.({});
                                                        setFiltroDocumentos('');
                                                    }}
                                                    className="text-white hover:bg-blue-600 transition-colors p-1 rounded"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>

                                            {/* Search Bar */}
                                            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800">
                                                <div className="relative">
                                                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                                    <Input
                                                        placeholder="Buscar documento..."
                                                        value={filtroDocumentos}
                                                        onChange={(e) => setFiltroDocumentos(e.target.value)}
                                                        className="pl-10 bg-white dark:bg-slate-900"
                                                    />
                                                </div>
                                            </div>

                                            {/* Content - Scrollable Table */}
                                            <div className="flex-1 overflow-hidden flex flex-col">
                                                {(() => {
                                                    const documentosAgregados = obtenerDocumentosAgregados?.() || new Set<string>();
                                                    const documentosArray = Array.isArray(documentosDisponibles) ? documentosDisponibles : [];

                                                    // Filtrar por búsqueda y documentos ya agregados
                                                    const documentosFiltrados = documentosArray.filter(
                                                        d =>
                                                            d.activo &&
                                                            !documentosAgregados.has(d.descripcion) &&
                                                            d.descripcion.toLowerCase().includes(filtroDocumentos.toLowerCase())
                                                    );

                                                    if (cargandoDocumentosDisponibles) {
                                                        return (
                                                            <div className="flex items-center justify-center py-8">
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="h-5 w-5 animate-spin" />
                                                                    <span className="text-sm text-muted-foreground">Cargando documentos...</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    if (documentosFiltrados.length === 0) {
                                                        return (
                                                            <div className="flex items-center justify-center py-12">
                                                                <div className="text-center">
                                                                    <AlertCircle className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                                                                    <p className="text-sm text-muted-foreground">
                                                                        {filtroDocumentos
                                                                            ? 'No se encontraron documentos que coincidan con la búsqueda.'
                                                                            : 'Todos los documentos disponibles ya han sido agregados.'}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        );
                                                    }

                                                    return (
                                                        <div className="overflow-y-auto flex-1">
                                                            <table className="w-full text-sm">
                                                                <thead className="sticky top-0 bg-gray-100 dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                                                                    <tr>
                                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white w-10">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={
                                                                                    documentosFiltrados.length > 0 &&
                                                                                    documentosFiltrados.every((d) => documentosSeleccionados[d.id])
                                                                                }
                                                                                onChange={(e) => {
                                                                                    const nuevoSeleccionados = { ...documentosSeleccionados };
                                                                                    documentosFiltrados.forEach((d) => {
                                                                                        nuevoSeleccionados[d.id] = e.target.checked;
                                                                                    });
                                                                                    setDocumentosSeleccionados?.(nuevoSeleccionados);
                                                                                }}
                                                                                className="w-4 h-4 cursor-pointer"
                                                                            />
                                                                        </th>
                                                                        <th className="px-4 py-3 text-left font-semibold text-gray-900 dark:text-white">
                                                                            Documento
                                                                        </th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                                                                    {documentosFiltrados.map((doc) => (
                                                                        <tr
                                                                            key={doc.id}
                                                                            className="hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                                        >
                                                                            <td className="px-4 py-3">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    id={`doc-${doc.id}`}
                                                                                    checked={documentosSeleccionados[doc.id] || false}
                                                                                    onChange={(e) =>
                                                                                        setDocumentosSeleccionados?.({
                                                                                            ...documentosSeleccionados,
                                                                                            [doc.id]: e.target.checked,
                                                                                        })
                                                                                    }
                                                                                    className="w-4 h-4 cursor-pointer"
                                                                                />
                                                                            </td>
                                                                            <td className="px-4 py-3">
                                                                                <label
                                                                                    htmlFor={`doc-${doc.id}`}
                                                                                    className="text-sm text-gray-900 dark:text-gray-100 cursor-pointer font-medium"
                                                                                >
                                                                                    {doc.descripcion}
                                                                                </label>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    );
                                                })()}
                                            </div>

                                            {/* Footer */}
                                            <div className="border-t border-gray-200 dark:border-slate-700 px-6 py-4 bg-gray-50 dark:bg-slate-800 flex gap-3 justify-end">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => {
                                                        setMostrarModalAgregarDocumento?.(false);
                                                        setDocumentosSeleccionados?.({});
                                                        setFiltroDocumentos('');
                                                    }}
                                                >
                                                    Cancelar
                                                </Button>
                                                <Button
                                                    className="bg-blue-600 hover:bg-blue-700"
                                                    onClick={() => {
                                                        handleAgregarDocumentosSeleccionados?.();
                                                        setFiltroDocumentos('');
                                                    }}
                                                    disabled={Object.values(documentosSeleccionados).every((v) => !v)}
                                                >
                                                    Agregar Seleccionados
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                    </>
                                , document.body)
                            }

                            {cargandoDocumentosExpediente && (
                                <div className="flex items-center justify-center py-8">
                                    <div className="flex items-center gap-2">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span className="text-sm text-muted-foreground">Cargando documentos...</span>
                                    </div>
                                </div>
                            )}

                            {!cargandoDocumentosExpediente && documentosPorCliente && documentosPorCliente.length === 0 && (
                                <div className="text-center py-8 text-muted-foreground">
                                    <p>No hay documentos disponibles para este expediente.</p>
                                </div>
                            )}

                            {!cargandoDocumentosExpediente && documentosPorCliente && documentosPorCliente.length > 0 && (
                                <div className="space-y-4">
                                    {/* Dropdown para seleccionar cliente */}
                                    <div className="flex items-center gap-3">
                                        <label className="text-sm font-medium">Cliente:</label>
                                        <select
                                            value={String(clienteSeleccionadoDocumentos || '')}
                                            onChange={(e) => setClienteSeleccionadoDocumentos?.(parseInt(e.target.value))}
                                            className="px-3 py-2 border rounded-md bg-background text-foreground text-sm"
                                        >
                                            {documentosPorCliente.map((grupoCliente) => (
                                                <option key={grupoCliente.id_Cliente} value={String(grupoCliente.id_Cliente)}>
                                                    {grupoCliente.cliente}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Mostrar tabla del cliente seleccionado */}
                                    {clienteSeleccionadoDocumentos && (
                                        <div className="border rounded-lg overflow-hidden">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                     <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left">Documento</th>
                                                            <th className="px-2 py-2 text-center">Copia</th>
                                                            <th className="px-2 py-2 text-center">Original</th>
                                                            <th className="px-2 py-2 text-center">Fecha Entrega</th>
                                                            <th className="px-2 py-2 text-center">Usuario Recibe</th>
                                                            <th className="px-2 py-2 text-center">Fecha Recepción</th>
                                                            <th className="px-2 py-2 text-center">Usuario Recepción</th>
                                                            <th className="px-3 py-2 text-left">Observaciones</th>
                                                            <th className="px-2 py-2 text-center"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {documentosPorCliente
                                                            .find(gc => gc.id_Cliente === clienteSeleccionadoDocumentos)
                                                            ?.documentos.map((doc, docIdx) => {
                                                            const docEditado = documentosEditados[doc.id] || {
                                                                cliente_Id: doc.cliente_Id,
                                                                documento_Id: doc.documento_Id,
                                                                fecha_Entrega: doc.fecha_Entrega,
                                                                usuario_Recibe: doc.usuario_Recibe,
                                                                fecha_Recepcion: doc.fecha_Recepcion,
                                                                usuario_Recepcion: doc.usuario_Recepcion,
                                                                observaciones: doc.observaciones,
                                                                copia: doc.copia,
                                                                original: doc.original,
                                                            };
                                                            return (
                                                                <tr key={docIdx} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="text"
                                                                            value={doc.documento}
                                                                            readOnly
                                                                            className="w-full px-2 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={docEditado.copia}
                                                                            onChange={(e) => handleDocumentoChange?.(doc.id, 'copia', e.target.checked)}
                                                                            className="rounded w-5 h-5 cursor-pointer"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={docEditado.original}
                                                                            onChange={(e) => handleDocumentoChange?.(doc.id, 'original', e.target.checked)}
                                                                            className="rounded w-5 h-5 cursor-pointer"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <input
                                                                            type="date"
                                                                            value={docEditado.fecha_Entrega || ''}
                                                                            onChange={(e) => handleDocumentoChange?.(doc.id, 'fecha_Entrega', e.target.value || null)}
                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <input
                                                                            type="text"
                                                                            value={doc.usuario_Recibe || ''}
                                                                            readOnly
                                                                            placeholder="-"
                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <input
                                                                            type="date"
                                                                            value={docEditado.fecha_Recepcion || ''}
                                                                            onChange={(e) => handleDocumentoChange?.(doc.id, 'fecha_Recepcion', e.target.value || null)}
                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <input
                                                                            type="text"
                                                                            value={doc.usuario_Recepcion || ''}
                                                                            readOnly
                                                                            placeholder="-"
                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                        />
                                                                    </td>
                                                                    <td className="px-3 py-2">
                                                                        <input
                                                                            type="text"
                                                                            value={docEditado.observaciones || ''}
                                                                            onChange={(e) => handleDocumentoChange?.(doc.id, 'observaciones', e.target.value || null)}
                                                                            placeholder="-"
                                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                                        />
                                                                    </td>
                                                                    <td className="px-2 py-2 text-center">
                                                                        <button
                                                                            onClick={() => handleEliminarDocumentoDeAll?.(doc.documento)}
                                                                            className="inline-flex items-center justify-center px-2 py-1 rounded bg-red-500 hover:bg-red-600 text-white text-xs transition-colors"
                                                                            title="Eliminar documento de todas las tablas"
                                                                        >
                                                                            <X className="h-4 w-4" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* VISOR DE PDF PARA DOCUMENTOS */}
                    <PDFViewerModal
                        isOpen={showPdfDocumentosViewer}
                        onClose={closePdfDocumentosViewer}
                        pdfUrl={pdfUrlDocumentos || ''}
                        title="Documentos Adjuntos"
                        fileName="Documentos_Adjuntos.pdf"
                    />
        </>
    );
}
