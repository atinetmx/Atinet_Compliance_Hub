import { usePage } from '@inertiajs/react';

/**
 * Interfaz estándar para todas las respuestas de la API
 */
export interface ApiResponse<T = any> {
    message: string;          // Mensaje personalizado desde el backend
    dataResponse?: T;          // Datos (objeto, lista, etc)
    success?: boolean;         // Indica si la operación fue exitosa
    statusCode?: number;       // Código HTTP
}

/**
 * API Service Class
 * Centralizes all API calls with dynamic base URL from Inertia props
 */
class ApiService {
    public baseUrl: string = '';

    constructor(baseUrl: string = '') {
        this.baseUrl = baseUrl;
    }

    /**
     * Obtiene los headers base incluyendo el token JWT si existe
     */
    private getHeaders(baseHeaders: Record<string, string> = {}): Record<string, string> {
        const headers = { ...baseHeaders };

        // Agregar token JWT si existe en localStorage
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('auth_token');
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
        }

        return headers;
    }

    /**
     * Normaliza la respuesta del servidor a una estructura estándar
     */
    private normalizeResponse<T = any>(data: any): ApiResponse<T> {
        // Si ya tiene la estructura correcta, devolverla
        if (data?.message !== undefined && (data?.dataResponse !== undefined || data?.message)) {
            return {
                message: data.message || 'Operación completada',
                dataResponse: data.dataResponse,
                success: data.success !== undefined ? data.success : true,
                statusCode: data.statusCode,
            };
        }

        // Si solo tiene dataResponse, crear mensaje por defecto
        if (data?.dataResponse !== undefined) {
            return {
                message: 'Operación completada exitosamente',
                dataResponse: data.dataResponse,
                success: true,
                statusCode: 200,
            };
        }

        // Si es cualquier otro objeto, usarlo como dataResponse
        if (typeof data === 'object' && data !== null) {
            return {
                message: 'Operación completada exitosamente',
                dataResponse: data,
                success: true,
                statusCode: 200,
            };
        }

        // Si es string (error), convertir a mensaje de error
        return {
            message: typeof data === 'string' ? data : 'Error desconocido',
            dataResponse: undefined,
            success: false,
            statusCode: 500,
        };
    }

    /**
     * Perform a GET request
     */
    async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        });

        const response = await fetch(url, {
            method: 'GET',
            headers,
        });

        const data = await response.json();
        return this.normalizeResponse<T>(data);
    }

    /**
     * Perform a POST request
     */
    async post<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const isFormData = body instanceof FormData;
        const baseHeaders: Record<string, string> = {
            'Accept': 'application/json',
        };

        // Solo establecer Content-Type para JSON, no para FormData
        // El navegador establece automáticamente multipart/form-data para FormData
        if (!isFormData) {
            baseHeaders['Content-Type'] = 'application/json';
        }

        const headers = this.getHeaders(baseHeaders);

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = text || 'Operación completada';
        }

        return this.normalizeResponse<T>(data);
    }

    /**
     * Perform a PUT request
     */
    async put<T = any>(endpoint: string, body: any): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const isFormData = body instanceof FormData;
        const baseHeaders: Record<string, string> = {
            'Accept': 'application/json',
        };

        // Solo establecer Content-Type para JSON, no para FormData
        // El navegador establece automáticamente multipart/form-data para FormData
        if (!isFormData) {
            baseHeaders['Content-Type'] = 'application/json';
        }

        const headers = this.getHeaders(baseHeaders);

        const response = await fetch(url, {
            method: 'PUT',
            headers,
            body: isFormData ? body : JSON.stringify(body),
        });

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = text || 'Operación completada';
        }

        return this.normalizeResponse<T>(data);
    }

    /**
     * Perform a DELETE request
     */
    async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = this.getHeaders({
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        });

        const response = await fetch(url, {
            method: 'DELETE',
            headers,
        });

        const data = await response.json();
        return this.normalizeResponse<T>(data);
    }
}

/**
 * React Hook to use the API Service with Inertia props
 */
export function useApi(): ApiService {
    const { props } = usePage();
    const apiBaseUrl = (props as any).apiBaseUrl || '';

    return new ApiService(apiBaseUrl);
}

export default ApiService;
