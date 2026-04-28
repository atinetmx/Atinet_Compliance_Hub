import React from 'react';
import { AlertCircle, AlertTriangle, CheckCircle, Info, XCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export type MessageType = 'info' | 'warning' | 'error' | 'success';
export type ButtonType = 'si' | 'no' | 'cancelar' | 'aceptar' | 'custom';

export interface MessageModalButton {
    type: ButtonType;
    label?: string;
    onClick: () => void | Promise<void>;
    variant?: 'default' | 'destructive' | 'secondary' | 'outline' | 'ghost';
    className?: string;
}

interface MessageModalProps {
    isOpen: boolean;
    type?: MessageType;
    title: string;
    message?: string;
    icon?: React.ReactNode;
    buttons?: MessageModalButton[];
    onClose?: () => void;
    centered?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

const MessageModal: React.FC<MessageModalProps> = ({
    isOpen,
    type = 'info',
    title,
    message,
    icon,
    buttons,
    onClose,
    centered = true,
    size = 'md',
}) => {
    if (!isOpen) return null;

    // Determinar icono por defecto según el tipo
    const getDefaultIcon = () => {
        switch (type) {
            case 'info':
                return <Info className="h-8 w-8 text-blue-600" />;
            case 'warning':
                return <AlertTriangle className="h-8 w-8 text-amber-600" />;
            case 'error':
                return <XCircle className="h-8 w-8 text-red-600" />;
            case 'success':
                return <CheckCircle className="h-8 w-8 text-green-600" />;
            default:
                return <AlertCircle className="h-8 w-8 text-blue-600" />;
        }
    };

    // Determinar color del header según el tipo
    const getHeaderColor = () => {
        switch (type) {
            case 'info':
                return 'bg-blue-50 border-blue-200';
            case 'warning':
                return 'bg-amber-50 border-amber-200';
            case 'error':
                return 'bg-red-50 border-red-200';
            case 'success':
                return 'bg-green-50 border-green-200';
            default:
                return 'bg-blue-50 border-blue-200';
        }
    };

    // Determinar ancho del modal según el tamaño
    const getSizeClass = () => {
        switch (size) {
            case 'sm':
                return 'max-w-sm';
            case 'md':
                return 'max-w-md';
            case 'lg':
                return 'max-w-lg';
            default:
                return 'max-w-md';
        }
    };

    // Botones por defecto si no se especifican
    const defaultButtons: MessageModalButton[] = [
        {
            type: 'aceptar',
            label: 'Aceptar',
            onClick: onClose || (() => {}),
            variant: 'default',
        },
    ];

    const finalButtons = buttons || defaultButtons;

    const handleButtonClick = async (button: MessageModalButton) => {
        try {
            await button.onClick();
        } catch (error) {
            console.error('Error al ejecutar acción del botón:', error);
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className={`fixed z-50 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full mx-4 ${getSizeClass()}`}
            >
                <div className="bg-white dark:bg-slate-900 rounded-lg shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-700">
                    {/* Header */}
                    <div className={`border-b ${getHeaderColor()} px-6 py-4 flex items-center justify-between`}>
                        <div className="flex items-center gap-3">
                            {icon || getDefaultIcon()}
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                                {title}
                            </h2>
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        )}
                    </div>

                    {/* Contenido */}
                    <div className="px-6 py-4">
                        {message && (
                            <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                                {message}
                            </p>
                        )}
                    </div>

                    {/* Botones */}
                    {finalButtons && finalButtons.length > 0 && (
                        <div className="border-t bg-gray-50 dark:bg-slate-800 px-6 py-4 flex gap-3 justify-end">
                            {finalButtons.map((button, index) => (
                                <Button
                                    key={index}
                                    onClick={() => handleButtonClick(button)}
                                    variant={button.variant || 'default'}
                                    className={button.className}
                                >
                                    {button.label || button.type.charAt(0).toUpperCase() + button.type.slice(1)}
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MessageModal;
