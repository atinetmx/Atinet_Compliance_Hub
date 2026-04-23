/**
 * Cache en memoria para catálogos de Control Notarial.
 *
 * Los catálogos (Operaciones, Municipios, Comparecientes, etc.) son datos
 * estáticos que no cambian durante la sesión del usuario. Sin caché, cada
 * montaje de componente dispara un nuevo GET a C#, saturando tbl_log_general.
 *
 * TTL por defecto: 60 minutos. Si el usuario necesita refrescar un catálogo
 * (por ejemplo, después de agregar una operación nueva), puede llamar a
 * `invalidateCnCatalog('/Catalogos/GetOperaciones')`.
 */

interface CacheEntry {
    data: unknown;
    expiresAt: number;
}

const CACHE_TTL_MS = 60 * 60 * 1000; // 60 minutos

const cache = new Map<string, CacheEntry>();

/**
 * Obtiene un catálogo del cache o lo fetcha si no existe / expiró.
 * @param endpoint  Ej: '/Catalogos/GetOperaciones'
 * @param fetchFn   Función que hace el fetch real (normalmente `() => api.get(endpoint)`)
 */
export async function getCatalogoCacheado<T = unknown>(
    endpoint: string,
    fetchFn: () => Promise<T>,
): Promise<T> {
    const now = Date.now();
    const entry = cache.get(endpoint);

    if (entry && now < entry.expiresAt) {
        return entry.data as T;
    }

    const data = await fetchFn();
    cache.set(endpoint, { data, expiresAt: now + CACHE_TTL_MS });
    return data;
}

/**
 * Invalida un catálogo específico (útil tras crear/editar un item del catálogo).
 */
export function invalidateCnCatalog(endpoint: string): void {
    cache.delete(endpoint);
}

/**
 * Invalida todos los catálogos (útil en logout o cambio de notaría).
 */
export function invalidateAllCnCatalogs(): void {
    cache.clear();
}
