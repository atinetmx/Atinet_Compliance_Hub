import { useEffect, useRef } from 'react';
import { removeToken, saveToken } from '@/services/authService';

/** Tiempo en ms entre heartbeats para mantener la sesión C# viva (10 minutos) */
const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Llama al endpoint de Laravel que obtiene/renueva el JWT del usuario en C#.
 * @param force  true → descarta el JWT cacheado en Laravel y fuerza re-login en C#
 *               (usar cuando C# devuelve 401, indicando sesión muerta por inactividad)
 */
async function gatewayAutoLogin(force = false): Promise<boolean> {
    try {
        const csrf = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content;
        const url = force
            ? '/admin/control-notarial/auto-login?force=1'
            : '/admin/control-notarial/auto-login';
        const response = await fetch(url, {
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
 * Hook que valida y mantiene activa la sesión CN en cada página del Control Notarial.
 *
 * Al montar: siempre llama a gatewayAutoLogin para asegurar que el JWT en
 * localStorage es vigente y que Sesion_Iniciada=1 en C#. Si el JWT está
 * cacheado en Laravel (12 min) la respuesta es inmediata; si no, hace login fresco.
 *
 * Heartbeat: cada 10 min fuerza un nuevo login en C# (force=true) para evitar
 * que la sesión muera por los 15 min de inactividad que tiene configurados C#.
 */
export function useAuthGuard(options: {
    onUnauthorized?: () => void;
} = {}) {
    const { onUnauthorized } = options;
    const hasChecked = useRef(false);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        if (hasChecked.current) return;
        hasChecked.current = true;

        const validateAuth = async () => {
            // Siempre renovar al montar: evita JWT viejos de sesiones anteriores
            const ok = await gatewayAutoLogin(false);
            if (!ok) {
                // Cache inválido → forzar login fresco
                const retried = await gatewayAutoLogin(true);
                if (!retried) {
                    onUnauthorized?.();
                    return;
                }
            }

            // Heartbeat: cada 10 min fuerza re-login en C# (force=true) para
            // mantener Sesion_Iniciada=1 antes del timeout de 15 min de C#
            heartbeatRef.current = setInterval(async () => {
                await gatewayAutoLogin(true);
            }, HEARTBEAT_INTERVAL_MS);
        };

        validateAuth();

        return () => {
            if (heartbeatRef.current) {
                clearInterval(heartbeatRef.current);
            }
        };
    }, []);

    return { hasChecked: hasChecked.current };
}

/**
 * Hook que intercepta respuestas 401 y renueva el token automáticamente.
 * Usa force=true para que Laravel descarte el JWT cacheado que ya no sirve.
 */
export function useAuthInterceptor(options: {
    onTokenExpired?: () => void;
    showErrorToast?: (message: string) => void;
} = {}) {
    const { onTokenExpired, showErrorToast } = options;

    return {
        handleUnauthorized: async () => {
            removeToken();
            // force=true: el JWT cacheado en Laravel ya no es válido en C#
            const ok = await gatewayAutoLogin(true);
            if (!ok) {
                onTokenExpired?.();
                showErrorToast?.('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
            }
        },
    };
}