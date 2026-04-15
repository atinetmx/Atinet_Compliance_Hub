import { useEffect, useRef } from 'react';
import { useApi } from '@/services/api';
import { isAuthenticated, removeToken } from '@/services/authService';

/**
 * Hook que valida el token en cada página del Control Notarial
 * Si el token no es válido, limpia la sesión y muestra el login
 *
 * @param options Configuración del hook
 * @param options.onUnauthorized Callback cuando detecta 401 (token inválido)
 * @param options.validateOnMount Si true, hace una llamada al servidor para validar (opcional)
 *
 * @example
 * export default function MiPagina() {
 *   const [showLoginModal, setShowLoginModal] = useState(false);
 *
 *   useAuthGuard({
 *     onUnauthorized: () => setShowLoginModal(true)
 *   });
 *
 *   // El resto del componente...
 * }
 */
export function useAuthGuard(options: {
    onUnauthorized?: () => void;
    validateOnMount?: boolean;  // Si true, valida con servidor
} = {}) {
    const { onUnauthorized, validateOnMount = false } = options;
    const api = useApi();
    const hasChecked = useRef(false);

    useEffect(() => {
        // Solo ejecutar UNA VEZ al montar el componente
        if (hasChecked.current) return;
        hasChecked.current = true;

        const validateAuth = async () => {
            // 1️⃣ Verificar si hay token en localStorage
            if (!isAuthenticated()) {
                removeToken();
                onUnauthorized?.();
                return;
            }

            // 2️⃣ Si validateOnMount es true, hacer una llamada al servidor
            if (validateOnMount) {
                try {
                    // Llamar un endpoint seguro para validar el token
                    const response = await api.get('/ConfiguracionNotarial/GetConfiguracionNotaria');

                    // Si es 401, el token es inválido
                    if (response.isUnauthorized) {
                        removeToken();
                        onUnauthorized?.();
                    }
                } catch (error) {
                    console.error('Error validando token:', error);
                    removeToken();
                    onUnauthorized?.();
                }
            }
        };

        validateAuth();
    }, []);  // Array de dependencias vacío - solo se ejecuta al montar

    return { hasChecked: hasChecked.current };
}

/**
 * Hook que intercepta respuestas 401 y redirige al login automáticamente
 * Útil para manejar cuando el token expira durante el uso
 *
 * @param options Configuración
 * @param options.onTokenExpired Callback cuando detecta 401 durante una operación
 *
 * @example
 * export default function MiPagina() {
 *   const [showLoginModal, setShowLoginModal] = useState(false);
 *
 *   useAuthInterceptor({
 *     onTokenExpired: () => {
 *       setShowLoginModal(true);
 *       addToast('Tu sesión ha expirado. Por favor inicia sesión nuevamente.', 'warning');
 *     }
 *   });
 * }
 */
export function useAuthInterceptor(options: {
    onTokenExpired?: () => void;
    showErrorToast?: (message: string) => void;
} = {}) {
    const { onTokenExpired, showErrorToast } = options;

    // Este hook simplemente expone la funcionalidad
    // El manejo real ocurre cuando la API retorna isUnauthorized: true

    return {
        handleUnauthorized: () => {
            removeToken();
            onTokenExpired?.();
            showErrorToast?.('Tu sesión ha expirado. Por favor inicia sesión nuevamente.');
        },
    };
}
