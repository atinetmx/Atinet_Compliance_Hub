import { useEffect, useRef, useState } from 'react';
import { removeToken, saveToken } from '@/services/authService';

/** Tiempo en ms entre heartbeats para mantener la sesión C# viva (10 minutos) */
const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;

/**
 * Llama al endpoint de Laravel que obtiene/renueva el JWT del usuario en C#.
 * @param force  true → descarta el JWT cacheado en Laravel y fuerza re-login en C#
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
 * - Al montar: borra el token viejo de localStorage para evitar que llamadas
 *   a C# vuelen con un JWT de sesión anterior mientras el auto-login asincrónico
 *   está en progreso. Luego fuerza re-login (force=true) y expone `isReady=true`
 *   solo cuando el JWT fresco ya está guardado en localStorage.
 *
 * - Heartbeat: cada 10 min renueva el JWT en C# (force=true) para mantener
 *   Sesion_Iniciada=1 antes del timeout de 15 min de C#.
 *
 * Las páginas deben esperar `isReady` antes de hacer fetch a la API:
 *   const { isReady } = useAuthGuard();
 *   useEffect(() => { if (!isReady) return; fetchData(); }, [isReady, ...]);
 */
export function useAuthGuard(options: {
    onUnauthorized?: () => void;
} = {}) {
    const { onUnauthorized } = options;
    const [isReady, setIsReady] = useState(false);
    const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Borrar JWT viejo ANTES del fetch asincrónico para que ninguna llamada
        // a la API use credenciales de una sesión anterior.
        removeToken();

        const validateAuth = async () => {
            // force=true: siempre fuerza re-login en C# al montar la página.
            // Garantiza Sesion_Iniciada=1 y un JWT fresco después de login/logout.
            const ok = await gatewayAutoLogin(true);
            if (!ok) {
                onUnauthorized?.();
                return;
            }

            // JWT fresco guardado → las páginas pueden empezar a fetching
            setIsReady(true);

            // Heartbeat: renueva JWT cada 10 min para no llegar al timeout de 15 min de C#
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

    return { isReady };
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