import { useEffect, useRef } from 'react';
import { useApi } from '@/services/api';
import { isAuthenticated, removeToken, saveToken } from '@/services/authService';

/**
 * Llama al endpoint de Laravel que obtiene el JWT del usuario en C#.
 * Guarda el token en localStorage. Retorna true si se obtuvo correctamente.
 */
async function gatewayAutoLogin(): Promise<boolean> {
    try {
        // El meta csrf-token lo inserta Laravel en el <head> en app.tsx / layout
        const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
        const response = await fetch('/admin/control-notarial/auto-login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...(csrf ? { 'X-CSRF-TOKEN': csrf } : {}),
            },
        });
        if (!response.ok) return false;
        const data = await response.json();
        if (data.success && data.token) {
            saveToken(data.token);
            return true;
        }
        return false;
    } catch {
        return false;
    }
}

/**
 * Hook que valida el token en cada página del Control Notarial.
 * Si no hay token (o el actual es inválido) intenta obtener uno automáticamente
 * vía el gateway de Laravel, sin mostrar ningún modal de login.
 * Solo en caso de fallo llama a `onUnauthorized` como fallback.
 */
export function useAuthGuard(options: {
    onUnauthorized?: () => void;
    validateOnMount?: boolean;
} = {}) {
    const { onUnauthorized, validateOnMount = false } = options;
    const api = useApi();
    const hasChecked = useRef(false);

    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;

        const validateAuth = async () => {
            // Sin token → pedir uno automáticamente al gateway
            if (!isAuthenticated()) {
                const ok = await gatewayAutoLogin();
                if (!ok) {
                    onUnauthorized?.();
                }
                return;
            }

            // Con token y validateOnMount → verificar con servidor
            if (validateOnMount) {
                try {
                    const response = await api.get('/ConfiguracionNotarial/GetConfiguracionNotaria');
                    if (response.isUnauthorized) {
                        removeToken();
                        // Token expirado → renovar automáticamente
                        const ok = await gatewayAutoLogin();
                        if (!ok) {
                            onUnauthorized?.();
                        }
                    }
                } catch {
                    removeToken();
                    const ok = await gatewayAutoLogin();
                    if (!ok) {
                        onUnauthorized?.();
                    }
                }
            }
        };

        validateAuth();
    }, []);

    return { hasChecked: hasChecked.current };
}

/**
 * Hook que intercepta respuestas 401 y renueva el token automáticamente.
 */
export function useAuthInterceptor(options: {
    onTokenExpired?: () => void;
    showErrorToast?: (message: string) => void;
} = {}) {
    const { onTokenExpired, showErrorToast } = options;

    return {
        handleUnauthorized: async () => {
            removeToken();
            const ok = await gatewayAutoLogin();
            if (!ok) {
                onTokenExpired?.();
                showErrorToast?.('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            }
        },
    };
}

