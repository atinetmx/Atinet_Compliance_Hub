import { useEffect, useState } from 'react';
import { getAccessToken, getUser, getRefreshToken, getTokenExpirationTime } from '@/services/authService';

interface TokenDebugInfo {
    user: string | null;
    accessTokenExists: boolean;
    accessTokenExpiration: {
        timestamp: number | null;
        date: string | null;
        secondsUntilExpiration: number | null;
        isExpiringSoon: boolean;
    };
    refreshTokenExists: boolean;
    lastRefreshTime: string;
}

/**
 * Hook para debuggear el estado de los tokens
 * Actualiza cada 10 segundos para monitoreo en tiempo real
 */
export function useTokenDebug(): TokenDebugInfo {
    const [debugInfo, setDebugInfo] = useState<TokenDebugInfo>({
        user: null,
        accessTokenExists: false,
        accessTokenExpiration: {
            timestamp: null,
            date: null,
            secondsUntilExpiration: null,
            isExpiringSoon: false,
        },
        refreshTokenExists: false,
        lastRefreshTime: new Date().toLocaleTimeString(),
    });

    useEffect(() => {
        const updateDebug = () => {
            const user = getUser();
            const accessToken = getAccessToken();
            const refreshToken = getRefreshToken();

            const expirationTime = getTokenExpirationTime(accessToken);
            const now = Math.floor(Date.now() / 1000);
            const secondsUntilExpiration = expirationTime ? expirationTime - now : null;
            const isExpiringSoon = secondsUntilExpiration !== null && secondsUntilExpiration < 300; // 5 minutos

            setDebugInfo({
                user,
                accessTokenExists: !!accessToken,
                accessTokenExpiration: {
                    timestamp: expirationTime,
                    date: expirationTime ? new Date(expirationTime * 1000).toLocaleString() : null,
                    secondsUntilExpiration,
                    isExpiringSoon,
                },
                refreshTokenExists: !!refreshToken,
                lastRefreshTime: new Date().toLocaleTimeString(),
            });
        };

        updateDebug();
        const interval = setInterval(updateDebug, 10000); // Actualizar cada 10 segundos

        return () => clearInterval(interval);
    }, []);

    return debugInfo;
}
