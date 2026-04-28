import React from 'react';
import { X, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RecibosPDFViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    fileName: string;
}

export default function RecibosPDFViewerModal({
    isOpen,
    onClose,
    pdfUrl,
    fileName,
}: RecibosPDFViewerModalProps) {
    if (!isOpen || !pdfUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        const iframe = document.createElement('iframe');
        iframe.src = pdfUrl;
        iframe.style.display = 'none';
        document.body.appendChild(iframe);
        iframe.onload = () => {
            iframe.contentWindow?.print();
        };
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2">
            <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl w-[95vw] h-[95vh] flex flex-col">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/50 dark:to-blue-800/50">
                    <div>
                        <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100">Recibo Provisional</h2>

                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-3xl font-bold transition-colors"
                        title="Cerrar"
                    >
                        ×
                    </button>
                </div>

                {/* PDF Content */}
                <div className="flex-1 overflow-hidden bg-gray-100 dark:bg-gray-800">
                    <iframe
                        src={pdfUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title="Recibo Provisional"
                    />
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-end p-4 border-t bg-gray-50 dark:bg-slate-800">
                    <Button
                        onClick={handlePrint}
                        variant="outline"
                        className="gap-2"
                        title="Imprimir PDF"
                    >
                        <Printer className="h-4 w-4" />
                        Imprimir
                    </Button>
                    <Button
                        onClick={handleDownload}
                        className="bg-blue-600 hover:bg-blue-700 gap-2"
                        title="Descargar PDF"
                    >
                        <Download className="h-4 w-4" />
                        Descargar PDF
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        title="Cerrar modal"
                    >
                        Cerrar
                    </Button>
                </div>
            </div>
        </div>
    );
}
