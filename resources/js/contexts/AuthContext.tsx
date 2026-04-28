import React, { createContext, useContext, useEffect, useState } from 'react';
import {
    isAuthenticated,
    getAuthData,
    getAccessToken,
    getUser,
    refreshAccessToken,
    isTokenExpiringSoon,
    getTokenExpirationTime,
} from '@/services/authService';

interface AuthContextType {
    user: string | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<string | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [refreshToken, setRefreshToken] = useState<string | null>(null);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        // Cargar datos de autenticación guardados al montar el componente
        if (isAuthenticated()) {
            const authData = getAuthData();
            if (authData) {
                setUser(authData.user);
                setAccessToken(authData.accessToken);
                setRefreshToken(authData.refreshToken);
                setIsAuth(true);
            }
        }
    }, []);

    // Renovar token automáticamente cada 60 segundos
    useEffect(() => {
        if (!isAuth) return;

        const checkTokenExpiration = async () => {
            const currentToken = getAccessToken();

            // Obtener información del token para debugging
            const expirationTime = getTokenExpirationTime(currentToken);
            const now = Math.floor(Date.now() / 1000);
            const secondsUntilExpiration = expirationTime ? expirationTime - now : null;

            // 🔍 LOG: Solo mostrar cuando se renueva
            // Uncomment la siguiente línea si necesitas debugging:
            // console.log(`[AuthContext] ⏰ Verificación de token - Segundos hasta expiración: ${secondsUntilExpiration}s (Umbral: 300s / 5min)`);

            // Verificar si el token expira en los próximos 5 MINUTOS (300 segundos)
            if (isTokenExpiringSoon(currentToken, 300)) {
                console.log('[AuthContext] ⚠️ Token próximo a expirar, renovando...');
                const success = await refreshAccessToken();

                if (success) {
                    // Actualizar el token en el estado
                    const updatedToken = getAccessToken();
                    setAccessToken(updatedToken);
                    console.log('[AuthContext] ✅ Token renovado exitosamente');
                } else {
                    console.log('[AuthContext] ❌ Error renovando token');
                }
            }
        };

        // Ejecutar verificación inmediatamente y luego cada 60 segundos
        checkTokenExpiration();
        const tokenRefreshInterval = setInterval(checkTokenExpiration, 60000);

        return () => clearInterval(tokenRefreshInterval);
    }, [isAuth]);

    return (
        <AuthContext.Provider
            value={{
                user,
                accessToken,
                refreshToken,
                isAuthenticated: isAuth,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de AuthProvider');
    }
    return context;
}
