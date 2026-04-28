import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    getClientIp,
    saveAuthData,
    AuthResponse,
    useAuthApi,
} from '@/services/authService';

interface LoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (token: string) => void;
}

export default function LoginModal({
    isOpen,
    onClose,
    onSuccess,
}: LoginModalProps) {
    const [usuario, setUsuario] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string>('');
    const authApi = useAuthApi();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setProcessing(true);

        try {
            // Obtener IP del cliente
            const clientIp = await getClientIp();

            // Autenticar usuario (authApi ya tiene la URL correcta: .../api)
            const response = await authApi.post<AuthResponse>(
                '/Login/Authentication',
                {
                    usuario,
                    contrasena,
                    equipo: clientIp,
                }
            );

            // Verificar si la autenticación fue exitosa
            if (!response.dataResponse?.accessToken) {
                throw new Error(response.message || 'Error en la autenticación');
            }

            // Guardar datos de autenticación
            const authData = {
                user: response.dataResponse.user,
                accessToken: response.dataResponse.accessToken,
                refreshToken: response.dataResponse.refreshToken,
            };
            saveAuthData(authData);

            // Limpiar formulario
            setUsuario('');
            setContrasena('');

            // Llamar callback de éxito
            onSuccess?.(response.dataResponse.accessToken);

            // Cerrar modal
            onClose();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error en la autenticación';
            setError(message);
        } finally {
            setProcessing(false);
        }
    };

    const handleClose = () => {
        if (!processing) {
            setError('');
            onClose();
        }
    };
    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="w-full max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">Iniciar Sesión</DialogTitle>
                    <DialogDescription>
                        Ingresa tu usuario y contraseña para acceder al Control Notarial
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Usuario */}
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="modal-usuario">
                            Usuario
                        </RequiredLabel>
                        <Input
                            id="modal-usuario"
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            required
                            autoFocus
                            autoComplete="username"
                            placeholder="Ej: ADMIN"
                            disabled={processing}
                        />
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-2">
                        <RequiredLabel htmlFor="modal-contrasena">
                            Contraseña
                        </RequiredLabel>
                        <Input
                            id="modal-contrasena"
                            type="password"
                            value={contrasena}
                            onChange={(e) => setContrasena(e.target.value)}
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            disabled={processing}
                        />
                    </div>

                    {/* Error general */}
                    {error && (
                        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200">
                            {error}
                        </div>
                    )}

                    {/* Botón de envío */}
                    <Button
                        type="submit"
                        className="w-full"
                        disabled={processing}
                    >
                        {processing && <Spinner className="mr-2" />}
                        {processing ? 'Ingresando...' : 'Iniciar Sesión'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
