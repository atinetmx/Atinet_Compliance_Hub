/**
 * CSRF Token Handler
 *
 * Maneja errores 419 (CSRF token mismatch) automáticamente recargando la página
 * para obtener un nuevo token. Esto previene problemas después de deployments
 * o cuando el cache del navegador tiene una versión antigua de la aplicación.
 */

let reloadAttempted = false;
let lastReloadTime = 0;
const RELOAD_COOLDOWN = 5000; // 5 segundos entre recargas

/**
 * Intercepta respuestas fetch y maneja errores 419 automáticamente
 */
export function handleCsrfError(response: Response): void {
    if (response.status === 419) {
        const now = Date.now();

        // Prevenir recargas múltiples en corto tiempo
        if (reloadAttempted && now - lastReloadTime < RELOAD_COOLDOWN) {
            console.warn('⚠️ CSRF error detectado, pero recarga reciente. Ignoring.');
            return;
        }

        console.log('🔄 Token CSRF expirado. Recargando página...');

        reloadAttempted = true;
        lastReloadTime = now;

        // Dar tiempo para que se muestre algún mensaje en consola
        setTimeout(() => {
            window.location.reload();
        }, 100);
    }
}

/**
 * Wrapper para fetch que automáticamente maneja errores 419
 */
export async function fetchWithCsrfHandling(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    const response = await fetch(input, init);

    handleCsrfError(response);

    return response;
}

/**
 * Obtiene el token CSRF actual del meta tag
 */
export function getCsrfToken(): string | null {
    const token = document.head.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]'
    );
    return token?.content || null;
}

/**
 * Inicializa el interceptor global de window.fetch
 */
export function initializeCsrfHandler(): void {
    const originalFetch = window.fetch;

    window.fetch = async function (
        input: RequestInfo | URL,
        init?: RequestInit
    ): Promise<Response> {
        const response = await originalFetch(input, init);

        // Solo interceptar requests a nuestra propia API
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const isOurApi = url.startsWith('/') || url.includes(window.location.origin);

        if (isOurApi) {
            handleCsrfError(response);
        }

        return response;
    };

    console.log('✅ CSRF handler inicializado');
}
