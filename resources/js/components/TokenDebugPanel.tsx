import { useTokenDebug } from '@/hooks/useTokenDebug';

/**
 * Componente de Debug para tokens
 * Muestra en tiempo real el estado de autenticación
 *
 * Uso temporal para verificar que todo funciona:
 * 1. Importar: import TokenDebugPanel from '@/components/TokenDebugPanel';
 * 2. Agregar a tu componente: <TokenDebugPanel />
 * 3. Deberías ver los tokens actualizarse cada 10 segundos
 */
export default function TokenDebugPanel() {
    const debug = useTokenDebug();

    const formatSeconds = (seconds: number | null): string => {
        if (seconds === null) return 'N/A';
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}m ${secs}s`;
    };

    return (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-gray-100 p-4 rounded-lg shadow-lg max-w-sm z-50 text-xs font-mono border border-gray-700">
            <div className="mb-3 pb-3 border-b border-gray-700">
                <h3 className="text-yellow-400 font-bold mb-2">🔐 Token Debug</h3>
                <p className="text-gray-400">Actualizado: {debug.lastRefreshTime}</p>
            </div>

            <div className="space-y-2 mb-3 pb-3 border-b border-gray-700">
                <div>
                    <span className="text-blue-400">Usuario:</span>
                    <span className="ml-2">{debug.user || '❌ No autenticado'}</span>
                </div>
            </div>

            <div className="space-y-2 mb-3 pb-3 border-b border-gray-700">
                <div>
                    <span className="text-green-400">Access Token:</span>
                    <span className="ml-2">{debug.accessTokenExists ? '✅ Existe' : '❌ No existe'}</span>
                </div>
                <div>
                    <span className="text-green-400">Expiration:</span>
                    <span className="ml-2">{debug.accessTokenExpiration.date || 'N/A'}</span>
                </div>
                <div>
                    <span className="text-green-400">Tiempo restante:</span>
                    <span className={`ml-2 ${debug.accessTokenExpiration.isExpiringSoon ? 'text-red-400 animate-pulse' : 'text-green-300'}`}>
                        {formatSeconds(debug.accessTokenExpiration.secondsUntilExpiration)}
                    </span>
                </div>
            </div>

            <div className="space-y-2">
                <div>
                    <span className="text-purple-400">Refresh Token:</span>
                    <span className="ml-2">{debug.refreshTokenExists ? '✅ Existe' : '❌ No existe'}</span>
                </div>
                <div className={`text-sm mt-2 p-2 rounded ${debug.accessTokenExpiration.isExpiringSoon ? 'bg-red-900/30 text-red-300' : 'bg-green-900/30 text-green-300'}`}>
                    {debug.accessTokenExpiration.isExpiringSoon
                        ? '⚠️ Token próximo a expirar - Renovación inmediata'
                        : '✅ Token válido'}
                </div>
            </div>
        </div>
    );
}
