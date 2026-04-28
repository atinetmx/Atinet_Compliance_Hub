import React from 'react';
import { createPortal } from 'react-dom';

interface PDFViewerModalProps {
    isOpen: boolean;
    onClose: () => void;
    pdfUrl: string;
    title: string;
    fileName: string;
}

export default function PDFViewerModal({
    isOpen,
    onClose,
    pdfUrl,
    title,
    fileName,
}: PDFViewerModalProps) {
    if (!isOpen || !pdfUrl) return null;

    const handleDownload = () => {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return createPortal(
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-2">
            <div className="bg-white rounded-lg shadow-lg w-[95vw] h-[95vh] flex flex-col">
                {/* PDF Content */}
                <div className="flex-1 overflow-hidden">
                    <iframe
                        src={pdfUrl}
                        width="100%"
                        height="100%"
                        style={{ border: 'none' }}
                        title={title}
                    />
                </div>

                {/* Footer */}
                <div className="flex gap-3 justify-between items-center p-4 border-t bg-gray-50">
                    <h2 className="text-lg font-bold text-gray-900">{title}</h2>
                    <div className="flex gap-3">
                        <button
                            onClick={handleDownload}
                            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                            title="Descargar PDF"
                        >
                            Descargar PDF
                        </button>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 text-sm font-medium transition-colors shadow-md hover:shadow-lg"
                            title="Cerrar modal"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
