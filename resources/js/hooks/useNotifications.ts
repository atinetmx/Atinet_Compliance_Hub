import { useState, useCallback } from 'react';

export interface Notification {
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    duration?: number;
}

/**
 * Hook para gestionar notificaciones en tiempo real
 * Soporta auto-dismiss y manual dismiss
 */
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const removeNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const addNotification = useCallback(
        (notification: Omit<Notification, 'id'>) => {
            const id = Math.random().toString(36).substr(2, 9);
            const newNotification: Notification = {
                ...notification,
                id,
                duration: notification.duration || 5000,
            };

            setNotifications((prev) => [...prev, newNotification]);

            // Auto-dismiss si tiene duration
            if (newNotification.duration) {
                setTimeout(
                    () => removeNotification(id),
                    newNotification.duration,
                );
            }

            return id;
        },
        [removeNotification],
    );

    const success = useCallback(
        (message: string, duration?: number) => {
            return addNotification({ type: 'success', message, duration });
        },
        [addNotification],
    );

    const error = useCallback(
        (message: string, duration?: number) => {
            return addNotification({ type: 'error', message, duration });
        },
        [addNotification],
    );

    const warning = useCallback(
        (message: string, duration?: number) => {
            return addNotification({ type: 'warning', message, duration });
        },
        [addNotification],
    );

    const info = useCallback(
        (message: string, duration?: number) => {
            return addNotification({ type: 'info', message, duration });
        },
        [addNotification],
    );

    return {
        notifications,
        addNotification,
        removeNotification,
        success,
        error,
        warning,
        info,
    };
};
