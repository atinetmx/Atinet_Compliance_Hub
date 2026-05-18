/**
 * CSRF Token Handler
 *
 * Maneja errores 419 (CSRF token mismatch) automáticamente:
 * 1. Refresca el token CSRF silenciosamente via GET /csrf-refresh
 * 2. Reintenta la request original con el token nuevo
 * 3. Solo recarga la página si el refresh falla (último recurso)
 */

/** Promesa compartida para evitar múltiples refreshes simultáneos */
let refreshPromise: Promise<string | null> | null = null;

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
 * Refresca el CSRF token silenciosamente haciendo GET a cualquier ruta de Laravel
 * que incluya el meta tag actualizado, o usando el endpoint dedicado /csrf-refresh.
 * Retorna el nuevo token, o null si falla.
 */
async function refreshCsrfToken(originalFetch: typeof fetch): Promise<string | null> {
    // Reutilizar refresh en vuelo si ya hay uno en progreso
    if (refreshPromise) return refreshPromise;

    refreshPromise = (async () => {
        try {
            // GET /csrf-refresh devuelve { token: '...' } con un CSRF fresco
            const res = await originalFetch('/csrf-refresh', {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'same-origin',
            });
            if (!res.ok) return null;
            const data = await res.json();
            const newToken: string | null = data.token ?? null;
            if (newToken) {
                // Actualizar el meta tag para que futuros requests lo usen
                const meta = document.head.querySelector<HTMLMetaElement>('meta[name="csrf-token"]');
                if (meta) meta.content = newToken;
            }
            return newToken;
        } catch {
            return null;
        } finally {
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}

/**
 * Dado un RequestInit, devuelve uno nuevo con el token CSRF actualizado
 */
function withNewCsrf(init: RequestInit | undefined, token: string): RequestInit {
    const headers = new Headers(init?.headers);
    headers.set('X-CSRF-TOKEN', token);
    return { ...init, headers };
}

/**
 * Inicializa el interceptor global de window.fetch.
 * Al detectar 419: refresca CSRF y reintenta una vez. Si falla → recarga.
 */
export function initializeCsrfHandler(): void {
    const originalFetch = window.fetch.bind(window);

    window.fetch = async function (
        input: RequestInfo | URL,
        init?: RequestInit
    ): Promise<Response> {
        const response = await originalFetch(input, init);

        // Solo interceptar requests a nuestra propia API
        const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
        const isOurApi = url.startsWith('/') || url.includes(window.location.origin);

        if (isOurApi && response.status === 419) {
            console.warn('🔄 Token CSRF expirado. Intentando refrescar silenciosamente...');

            const newToken = await refreshCsrfToken(originalFetch);

            if (newToken) {
                // Reintentar la request original con el token nuevo
                console.log('✅ CSRF renovado. Reintentando request...');
                return originalFetch(input, withNewCsrf(init, newToken));
            }

            // Si no se pudo refrescar, recargar como último recurso
            console.error('❌ No se pudo renovar CSRF. Recargando página...');
            setTimeout(() => window.location.reload(), 300);
        }

        return response;
    };

    console.log('✅ CSRF handler inicializado');
}

/** @deprecated Usar initializeCsrfHandler() — se mantiene por compatibilidad */
export function handleCsrfError(_response: Response): void { /* no-op */ }

/** @deprecated Usar window.fetch directamente — se mantiene por compatibilidad */
export async function fetchWithCsrfHandling(
    input: RequestInfo | URL,
    init?: RequestInit
): Promise<Response> {
    return fetch(input, init);
}
