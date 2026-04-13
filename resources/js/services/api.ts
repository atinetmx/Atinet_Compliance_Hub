import { usePage } from '@inertiajs/react';

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
     * Perform a GET request
     */
    async get<T = any>(endpoint: string): Promise<T & { dataResponse?: any; message?: string }> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        return data;
    }

    /**
     * Perform a POST request
     */
    async post<T = any>(endpoint: string, body: any): Promise<T & { dataResponse?: any; message?: string }> {
        const url = `${this.baseUrl}${endpoint}`;
        const isFormData = body instanceof FormData;
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        // Solo establecer Content-Type para JSON, no para FormData
        // El navegador establece automáticamente multipart/form-data para FormData
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

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
            data = text ? { message: text } : {};
        }

        return data;
    }

    /**
     * Perform a PUT request
     */
    async put<T = any>(endpoint: string, body: any): Promise<T & { dataResponse?: any; message?: string }> {
        const url = `${this.baseUrl}${endpoint}`;
        const isFormData = body instanceof FormData;
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        // Solo establecer Content-Type para JSON, no para FormData
        // El navegador establece automáticamente multipart/form-data para FormData
        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

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
            data = text ? { message: text } : {};
        }

        return data;
    }

    /**
     * Perform a DELETE request
     */
    async delete<T = any>(endpoint: string): Promise<T & { dataResponse?: any; message?: string }> {
        const url = `${this.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
        });

        const data = await response.json();
        return data;
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
