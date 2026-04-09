/**
 * Missing Fields Modal - Muestra campos pendientes después de escanear
 * Portado desde sistema PHP legacy (form-manager.js:mostrarDialogoPostEscaneo)
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
import type { MissingFieldGroup } from '@/utils/field-validation';
import { countMissingFields, generateMissingSummaryHTML, getFieldLabel } from '@/utils/field-validation';

export interface MissingFieldsModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    personData: {
        nombre?: string;
        apellidopat?: string;
        apellidomat?: string;
        rfc?: string;
        curp?: string;
    };
    missingGroups: MissingFieldGroup[];
    onScanMore: () => void;
}

export function MissingFieldsModal({
    isOpen,
    onClose,
    title,
    personData,
    missingGroups,
    onScanMore,
}: MissingFieldsModalProps) {
    const nombreCompleto = [
        personData.nombre,
        personData.apellidopat,
        personData.apellidomat,
    ]
        .filter(Boolean)
        .join(' ');

    const totalFaltantes = countMissingFields(missingGroups);
    const todoCompleto = missingGroups.length === 0;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl flex items-center gap-2">
                        {todoCompleto ? (
                            <>
                                <span className="text-2xl">✅</span>
                                <span>{title}</span>
                            </>
                        ) : (
                            <>
                                <span className="text-2xl">📋</span>
                                <span>{title}</span>
                            </>
                        )}
                    </DialogTitle>
                    <DialogDescription className="text-base mt-3">
                        {/* Resumen de la persona */}
                        <span className="block">
                            {nombreCompleto && (
                                <span className="font-semibold text-gray-900 text-lg block">
                                    {nombreCompleto}
                                </span>
                            )}
                            {personData.rfc && (
                                <span className="text-sm text-gray-600 mt-1 block">
                                    RFC: <code className="bg-gray-100 px-2 py-0.5 rounded">{personData.rfc}</code>
                                </span>
                            )}
                            {personData.curp && (
                                <span className="text-sm text-gray-600 block">
                                    CURP: <code className="bg-gray-100 px-2 py-0.5 rounded text-xs">{personData.curp}</code>
                                </span>
                            )}
                        </span>
                    </DialogDescription>
                </DialogHeader>

                {todoCompleto ? (
                    /* Todo completo */
                    <div className="py-6 text-center">
                        <div className="text-6xl mb-4">🎉</div>
                        <p className="text-lg text-green-600 font-semibold">
                            ✅ Todos los campos clave están completos
                        </p>
                        <p className="text-sm text-gray-500 mt-2">
                            El registro está listo para ser guardado
                        </p>
                    </div>
                ) : (
                    /* Campos faltantes */
                    <div className="py-4">
                        <div className="mb-4 pb-3 border-b">
                            <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                <span className="text-yellow-500">⚠️</span>
                                Campos pendientes ({totalFaltantes})
                            </p>
                        </div>

                        {/* Grupos de campos faltantes */}
                        <div className="space-y-3">
                            {missingGroups.map((group, index) => (
                                <div
                                    key={index}
                                    className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                                >
                                    <div className="flex items-start gap-3">
                                        <span className="text-2xl">{group.icon}</span>
                                        <div className="flex-1">
                                            <p className="font-semibold text-gray-900 mb-2">
                                                {group.name}:
                                            </p>
                                            <div className="text-sm text-gray-600">
                                                {group.missing.map((field, i) => (
                                                    <span key={field}>
                                                        {getFieldLabel(field)}
                                                        {i < group.missing.length - 1 && ', '}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pregunta */}
                        <div className="mt-6 pt-4 border-t">
                            <p className="text-sm text-gray-700 text-center">
                                ¿Deseas escanear otro documento para completar los datos?
                            </p>
                        </div>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    {!todoCompleto && (
                        <Button
                            onClick={onScanMore}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <span className="mr-2">📷</span>
                            Escanear otro documento
                        </Button>
                    )}
                    <Button
                        onClick={onClose}
                        variant={todoCompleto ? 'default' : 'secondary'}
                    >
                        {todoCompleto ? (
                            <>
                                <span className="mr-2">👍</span>
                                Entendido
                            </>
                        ) : (
                            <>
                                <span className="mr-2">✋</span>
                                Terminar escaneo
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
