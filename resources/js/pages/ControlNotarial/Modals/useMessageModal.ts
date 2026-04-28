import { useState, useCallback } from 'react';
import { MessageType, MessageModalButton } from './MessageModal';

export interface UseMessageModalOptions {
    type?: MessageType;
    title: string;
    message?: string;
    icon?: React.ReactNode;
    buttons?: MessageModalButton[];
    size?: 'sm' | 'md' | 'lg';
}

export const useMessageModal = () => {
    const [state, setState] = useState<{
        isOpen: boolean;
        type: MessageType;
        title: string;
        message?: string;
        icon?: React.ReactNode;
        buttons?: MessageModalButton[];
        size: 'sm' | 'md' | 'lg';
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        size: 'md',
    });

    const show = useCallback(
        (options: UseMessageModalOptions) => {
            setState({
                isOpen: true,
                type: options.type || 'info',
                title: options.title,
                message: options.message,
                icon: options.icon,
                buttons: options.buttons,
                size: options.size || 'md',
            });
        },
        []
    );

    const close = useCallback(() => {
        setState((prev) => ({
            ...prev,
            isOpen: false,
        }));
    }, []);

    const confirm = useCallback(
        (title: string, message?: string, type: MessageType = 'warning'): Promise<boolean> => {
            return new Promise((resolve) => {
                const buttons: MessageModalButton[] = [
                    {
                        type: 'no',
                        label: 'No',
                        onClick: () => {
                            resolve(false);
                            close();
                        },
                        variant: 'secondary',
                    },
                    {
                        type: 'si',
                        label: 'Sí',
                        onClick: () => {
                            resolve(true);
                            close();
                        },
                        variant: 'default',
                    },
                ];

                show({
                    type,
                    title,
                    message,
                    buttons,
                });
            });
        },
        [show, close]
    );

    const alert = useCallback(
        (title: string, message?: string, type: MessageType = 'info') => {
            return new Promise<void>((resolve) => {
                const buttons: MessageModalButton[] = [
                    {
                        type: 'aceptar',
                        label: 'Aceptar',
                        onClick: () => {
                            resolve();
                            close();
                        },
                        variant: 'default',
                    },
                ];

                show({
                    type,
                    title,
                    message,
                    buttons,
                });
            });
        },
        [show, close]
    );

    return {
        isOpen: state.isOpen,
        type: state.type,
        title: state.title,
        message: state.message,
        icon: state.icon,
        buttons: state.buttons,
        size: state.size,
        show,
        close,
        confirm,
        alert,
    };
};
