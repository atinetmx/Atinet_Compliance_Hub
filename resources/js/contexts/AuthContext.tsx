import React, { createContext, useContext, useEffect, useState } from 'react';
import { isAuthenticated, getToken } from '@/services/authService';

interface AuthContextType {
    token: string | null;
    isAuthenticated: boolean;
    setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        // Verificar si hay token guardado al montar el componente
        if (isAuthenticated()) {
            const savedToken = getToken();
            setToken(savedToken);
            setIsAuth(true);
        }
    }, []);

    return (
        <AuthContext.Provider
            value={{
                token,
                isAuthenticated: isAuth,
                setToken: (newToken) => {
                    setToken(newToken);
                    setIsAuth(!!newToken);
                },
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
