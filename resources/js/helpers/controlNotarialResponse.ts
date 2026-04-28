import { ApiResponse } from '@/services/api';
import { removeToken } from '@/services/authService';

/**
 * Helper centralizado para manejar respuestas de API en Control Notarial
 *
 * Reglas:
 * - ESTATUS 200: Retorna los datos (dataResponse)
 * - ESTATUS 400: Retorna null + llama onError con el mensaje
 * - ESTATUS 401: Limpia token + llama onUnauthorized (SIN mostrar error aquí)
 * - ESTATUS 500 o ERROR: Retorna null + llama onError
 *
 * @example
 * const datos = handleControlNotarialResponse(
 *   await api.get('/endpoint'),
 *   {
 *     onError: (msg) => addToast(msg, 'error'),
 *     onUnauthorized: () => setLoginModalOpen(true)
 *   }
 * );
 *
 * if (datos) {
 *   setFormData(datos);  // OK - Datos válidos
 * }
 */
export function handleControlNotarialResponse<T = any>(
    response: ApiResponse<T> | null | undefined,
    options: {
        onError?: (message: string) => void;
        onUnauthorized?: () => void;
    } = {}
): T | null {
    const { onError, onUnauthorized } = options;

    // NO HAY RESPUESTA
    if (!response) {
        onError?.('Error: No se recibió respuesta del servidor');
        return null;
    }

    // ESTATUS 401 - Token inválido/expirado
    // IMPORTANTE: No llamar a onError aquí. El toast lo maneja useAuthGuard
    if (response.isUnauthorized) {
        removeToken();  // Limpiar token automáticamente
        onUnauthorized?.();  // Llamar callback para mostrar login
        return null;
    }

    // ESTATUS 400 o ERROR (mensaje personalizado del servidor)
    // Solo disparar error si success es explícitamente false.
    // No verificar dataResponse vacío: operaciones de actualización devuelven success:true sin dataResponse.
    if (response.success === false) {
        onError?.(response.message || 'Error en la solicitud');
        return null;
    }

    // ESTATUS 200 OK - Retorna los datos (puede ser null en updates sin retorno)
    return response.dataResponse ?? null;
}
