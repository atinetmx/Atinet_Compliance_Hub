/**
 * Document Selector Modal - Sugiere documentos para escanear según campos faltantes
 * Portado desde sistema PHP legacy (form-manager.js:mostrarDialogoPostEscaneo - segunda parte)
 */

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import type { DocumentType } from '@/utils/field-validation';
import { Camera, FileText, IdCard, QrCode } from 'lucide-react';

export interface DocumentSelectorModalProps {
    isOpen: boolean;
    onClose: () => void;
    suggestedDocs: DocumentType[];
    onSelectDocument: (doc: DocumentType) => void;
}

const DOCUMENT_CONFIG: Record<
    DocumentType,
    {
        label: string;
        icon: typeof Camera;
        color: string;
        description: string;
    }
> = {
    INE: {
        label: 'Escanear INE',
        icon: IdCard,
        color: 'bg-blue-600 hover:bg-blue-700',
        description: 'Credencial para votar (frente y reverso)',
    },
    CURP: {
        label: 'Escanear CURP',
        icon: FileText,
        color: 'bg-orange-600 hover:bg-orange-700',
        description: 'Constancia de CURP o documento con CURP',
    },
    Acta: {
        label: 'Escanear Acta de Nacimiento',
        icon: FileText,
        color: 'bg-purple-600 hover:bg-purple-700',
        description: 'Acta de nacimiento original o copia certificada',
    },
    QR: {
        label: 'Escanear código QR',
        icon: QrCode,
        color: 'bg-green-600 hover:bg-green-700',
        description: 'QR de CURP, Acta, o constancia SAT',
    },
};

export function DocumentSelectorModal({
    isOpen,
    onClose,
    suggestedDocs,
    onSelectDocument,
}: DocumentSelectorModalProps) {
    const handleSelect = (doc: DocumentType) => {
        onClose();
        // Pequeño delay para que el modal se cierre antes de abrir el siguiente
        setTimeout(() => {
            onSelectDocument(doc);
        }, 150);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        <span className="text-2xl">📸</span>
                        <span>¿Qué documento vas a escanear?</span>
                    </DialogTitle>
                    <DialogDescription className="text-sm mt-2">
                        Documentos sugeridos según los campos faltantes:
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3">
                    {suggestedDocs.map((doc) => {
                        const config = DOCUMENT_CONFIG[doc];
                        const Icon = config.icon;

                        return (
                            <button
                                key={doc}
                                onClick={() => handleSelect(doc)}
                                className={`w-full flex items-start gap-4 p-4 rounded-lg text-white transition-colors ${config.color} text-left`}
                            >
                                <div className="shrink-0 mt-0.5">
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-base mb-1">
                                        {config.label}
                                    </p>
                                    <p className="text-xs opacity-90">
                                        {config.description}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="border-t pt-4 pb-2">
                    <p className="text-xs text-gray-500 text-center leading-relaxed">
                        O usa los botones flotantes de la pantalla para escanear cualquier documento
                    </p>
                </div>

                <DialogFooter>
                    <Button onClick={onClose} variant="outline" className="w-full">
                        Cancelar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
