import { usePage } from '@inertiajs/react';
import ApiService from './api';

/**
 * Interfaz de respuesta de autenticación
 */
export interface AuthResponse {
    operationStatus: string;
    message: string;
    dataResponse: {
        user: string;
        accessToken: string;
        refreshToken: string;
        modulos: {
            modulo_id: number[];
        };
    };
}

/**
 * Interfaz para datos guardados del usuario
 */
export interface SavedAuthData {
    user: string;
    accessToken: string;
    refreshToken: string;
}

/**
 * Hook para obtener la URL base de la API de autenticación
 * Detecta automáticamente desde las props de Inertia
 * Fallback a apiBaseUrl si no hay authApiBaseUrl específico
 */
export function useAuthApi(): ApiService {
    const { props } = usePage();
    const authApiBaseUrl = (props as any).authApiBaseUrl || (props as any).apiBaseUrl || '/admin/cn-api';

    return new ApiService(authApiBaseUrl);
}

/**
 * Obtiene la URL base directamente para funciones no-hook
 * Intenta obtener desde window (set por Inertia)
 */
function getAuthApiBaseUrl(): string {
    // En contextos donde no podemos usar hooks, intentar desde window
    if (typeof window !== 'undefined') {
        return (window as any).__AUTH_API_BASE_URL__ || (window as any).__API_BASE_URL__ || '/admin/cn-api';
    }
    return '/admin/cn-api';
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
 * Guarda el token de acceso
 */
export function saveAccessToken(token: string): void {
    localStorage.setItem('scn_auth_access_token', token);
}

/**
 * Obtiene el token de acceso guardado
 */
export function getAccessToken(): string | null {
    return localStorage.getItem('scn_auth_access_token');
}

/**
 * Guarda el token de refresco
 */
export function saveRefreshToken(token: string): void {
    localStorage.setItem('scn_auth_refresh_token', token);
}

/**
 * Obtiene el token de refresco guardado
 */
export function getRefreshToken(): string | null {
    return localStorage.getItem('scn_auth_refresh_token');
}

/**
 * Guarda el usuario autenticado
 */
export function saveUser(user: string): void {
    localStorage.setItem('scn_auth_user', user);
}

/**
 * Obtiene el usuario autenticado
 */
export function getUser(): string | null {
    return localStorage.getItem('scn_auth_user');
}

/**
 * Guarda toda la información de autenticación
 */
export function saveAuthData(data: SavedAuthData): void {
    saveUser(data.user);
    saveAccessToken(data.accessToken);
    saveRefreshToken(data.refreshToken);
}

/**
 * Obtiene toda la información de autenticación
 */
export function getAuthData(): SavedAuthData | null {
    const user = getUser();
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!user || !accessToken || !refreshToken) {
        return null;
    }

    return { user, accessToken, refreshToken };
}

/**
 * Guarda el token de autenticación (compatibilidad hacia atrás)
 */
export function saveToken(token: string): void {
    saveAccessToken(token);
}

/**
 * Obtiene el token de autenticación guardado (compatibilidad hacia atrás)
 */
export function getToken(): string | null {
    return getAccessToken();
}

/**
 * Elimina todo los tokens y datos de autenticación
 */
export function removeToken(): void {
    localStorage.removeItem('scn_auth_access_token');
    localStorage.removeItem('scn_auth_refresh_token');
    localStorage.removeItem('scn_auth_user');
}

/**
 * Verifica si el usuario está autenticado
 */
export function isAuthenticated(): boolean {
    return !!getAccessToken() && !!getRefreshToken();
}

/**
 * Interfaz para respuesta de renovación de token
 */
export interface RefreshTokenResponse {
    operationStatus: string;
    message: string;
    dataResponse: {
        accessToken: string;
        refreshToken: string;
        refreshExpiresAt: string;
    };
}

/**
 * Decodifica un JWT sin validar la firma
 * Útil para obtener el tiempo de expiración
 */
function decodeJwt(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Error decodificando JWT:', error);
        return null;
    }
}

/**
 * Obtiene el tiempo de expiración del token en segundos (unix timestamp)
 */
export function getTokenExpirationTime(token: string | null): number | null {
    if (!token) return null;
    const decoded = decodeJwt(token);
    return decoded?.exp || null;
}

/**
 * Verifica si el token expira en los próximos N segundos
 */
export function isTokenExpiringSoon(token: string | null, secondsThreshold: number = 300): boolean {
    const expirationTime = getTokenExpirationTime(token);
    if (!expirationTime) return true;

    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiration = expirationTime - now;

    return timeUntilExpiration < secondsThreshold;
}

/**
 * Renueva el access token usando el refresh token
 */
export async function refreshAccessToken(): Promise<boolean> {
    try {
        const user = getUser();
        const refreshToken = getRefreshToken();

        if (!user || !refreshToken) {
            console.warn('No hay usuario o refresh token para renovar');
            return false;
        }

        const authApiBaseUrl = getAuthApiBaseUrl();
        const authApi = new ApiService(authApiBaseUrl);

        const response = await authApi.post<RefreshTokenResponse>(
            '/api/Login/Refresh',
            {
                usuario: user,
                refreshToken: refreshToken,
            }
        );

        if (!response.dataResponse?.accessToken) {
            console.error('No se recibió access token en la renovación');
            return false;
        }

        // Guardar los nuevos tokens
        saveAccessToken(response.dataResponse.accessToken);
        saveRefreshToken(response.dataResponse.refreshToken);

        console.log('Token renovado exitosamente');
        return true;
    } catch (error) {
        console.error('Error renovando access token:', error);
        // Si hay error en la renovación, hacer logout
        await logout();
        return false;
    }
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
        await authApi.post('/api/Login/Logout', {});

        // Limpiar el token
        removeToken();
    } catch (error) {
        console.error('Error en logout:', error);
        // Aún así limpiar el token
        removeToken();
    }
}
