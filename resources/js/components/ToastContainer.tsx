import React from 'react';
import { CheckCircle, AlertCircle, Info, XCircle, X } from 'lucide-react';
import { useToast, Toast } from '@/contexts/ToastContext';

const ToastItem: React.FC<{ toast: Toast; onClose: () => void }> = ({ toast, onClose }) => {
    React.useEffect(() => {
        if (!toast.duration || toast.duration === 0) return;

        const timer = setTimeout(onClose, toast.duration);
        return () => clearTimeout(timer);
    }, [toast.duration, onClose]);

    const styles: Record<string, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
        success: {
            bg: 'bg-green-50 dark:bg-green-950/30',
            border: 'border-green-200 dark:border-green-800',
            icon: <CheckCircle className="size-5 text-green-600 dark:text-green-400" />,
            text: 'text-green-900 dark:text-green-200',
        },
        error: {
            bg: 'bg-red-50 dark:bg-red-950/30',
            border: 'border-red-200 dark:border-red-800',
            icon: <XCircle className="size-5 text-red-600 dark:text-red-400" />,
            text: 'text-red-900 dark:text-red-200',
        },
        info: {
            bg: 'bg-blue-50 dark:bg-blue-950/30',
            border: 'border-blue-200 dark:border-blue-800',
            icon: <Info className="size-5 text-blue-600 dark:text-blue-400" />,
            text: 'text-blue-900 dark:text-blue-200',
        },
        warning: {
            bg: 'bg-yellow-50 dark:bg-yellow-950/30',
            border: 'border-yellow-200 dark:border-yellow-800',
            icon: <AlertCircle className="size-5 text-yellow-600 dark:text-yellow-400" />,
            text: 'text-yellow-900 dark:text-yellow-200',
        },
    };

    const style = styles[toast.type];

    return (
        <div
            className={`${style.bg} border ${style.border} rounded-lg p-4 flex items-start gap-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-300`}
            role="alert"
        >
            <div className="shrink-0 mt-0.5">{style.icon}</div>
            <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${style.text}`}>{toast.message}</p>
            </div>
            <button
                onClick={onClose}
                className={`shrink-0 ml-2 inline-flex ${style.text} hover:opacity-75 transition-opacity`}
                aria-label="Cerrar notificación"
            >
                <X className="size-5" />
            </button>
        </div>
    );
};

export const ToastContainer: React.FC = () => {
    const { toasts, removeToast } = useToast();

    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 max-w-sm pointer-events-auto">
            {toasts.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <ToastItem toast={toast} onClose={() => removeToast(toast.id)} />
                </div>
            ))}
        </div>
    );
};
