import { usePage } from '@inertiajs/react';
import ApiService from './api';

/**
 * Interfaz de respuesta de autenticación
 */
export interface AuthResponse {
    message: string;
    dataResponse: {
        token: string;
        modulos: {
            modulo_id: number[];
        };
    };
}

/**
 * Hook para obtener la URL base de la API de autenticación
 * Detecta automáticamente desde las props de Inertia
 * Fallback a apiBaseUrl si no hay authApiBaseUrl específico
 */
export function useAuthApi(): ApiService {
    const { props } = usePage();
    const authApiBaseUrl = (props as any).authApiBaseUrl || (props as any).apiBaseUrl || 'https://localhost:44327';

    return new ApiService(authApiBaseUrl);
}

/**
 * Obtiene la URL base directamente para funciones no-hook
 * Intenta obtener desde window (set por Inertia)
 */
function getAuthApiBaseUrl(): string {
    // En contextos donde no podemos usar hooks, intentar desde window
    if (typeof window !== 'undefined') {
        return (window as any).__AUTH_API_BASE_URL__ || (window as any).__API_BASE_URL__ || 'https://localhost:44327';
    }
    return 'https://localhost:44327';
}

/**
 * Obtiene la IP pública del cliente
 */
export async function getClientIp(): Promise<string> {
    try {
        const response = await fetch('https://api.ipify.org?format=json', {
            method: 'GET',
        });
        const data = await response.json();
        return data.ip || 'unknown';
    } catch (error) {
        console.error('Error obteniendo IP:', error);
        return 'unknown';
    }
}

/**
 * Guarda el token de autenticación
 */
export function saveToken(token: string): void {
    localStorage.setItem('auth_token', token);
}

/**
 * Obtiene el token de autenticación guardado
 */
export function getToken(): string | null {
    return localStorage.getItem('auth_token');
}

/**
 * Elimina el token de autenticación
 */
export function removeToken(): void {
    localStorage.removeItem('auth_token');
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
    return !!getToken();
}

/**
 * Realiza logout contra la API de Control Notarial
 */
export async function logout(): Promise<void> {
    try {
        // Obtener URL de autenticación (detecta DEBUG/RELEASE)
        const authApiBaseUrl = getAuthApiBaseUrl();
        const authApi = new ApiService(authApiBaseUrl);

        // Llamar al API de logout
        await authApi.post('/Login/Logout', {});

        // Limpiar el token
        removeToken();
    } catch (error) {
        console.error('Error en logout:', error);
        // Aún así limpiar el token
        removeToken();
    }
}
