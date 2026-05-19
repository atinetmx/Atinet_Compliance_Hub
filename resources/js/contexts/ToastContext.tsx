import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    toasts: Toast[];
    addToast: (message: string, type: ToastType, duration?: number) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

const getDefaultDuration = (type: ToastType): number => {
    switch (type) {
        case 'success':
            return 2000; // 2 segundos
        case 'warning':
            return 3000; // 3 segundos
        case 'error':
            return 10000; // 10 segundos
        case 'info':
        default:
            return 3000; // 3 segundos
    }
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType, duration?: number) => {
        const finalDuration = duration !== undefined ? duration : getDefaultDuration(type);
        const id = Date.now().toString();
        setToasts((prev) => [...prev, { id, message, type, duration: finalDuration }]);
    }, []);

    return (
        <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
            {children}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe ser usado dentro de ToastProvider');
    }
    return context;
};
