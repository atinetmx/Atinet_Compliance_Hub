import { Eye, EyeOff, RotateCcw, Lock } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface User {
    id: number;
    name: string;
    email: string;
    tipo_cuenta: string;
}

interface PasswordManagerProps {
    user: User;
    onPasswordRevealed?: (password: string) => void;
    onPasswordReset?: (newPassword: string) => void;
}

export default function PasswordManager({
    user,
    onPasswordRevealed,
    onPasswordReset,
}: PasswordManagerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [adminPassword, setAdminPassword] = useState('');
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [revealedPassword, setRevealedPassword] = useState<string | null>(
        null,
    );
    const [showRevealedPassword, setShowRevealedPassword] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [action, setAction] = useState<'reveal' | 'reset'>('reveal');

    const handleRevealPassword = async () => {
        if (!adminPassword.trim()) {
            alert('Por favor ingresa tu contraseña de administrador');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `/admin/users/${user.id}/reveal-password`,
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        admin_password: adminPassword,
                    }),
                },
            );

            const data = await response.json();

            if (data.success) {
                setRevealedPassword(data.password || 'No disponible');
                onPasswordRevealed?.(data.password);
            } else {
                alert(data.message || 'Error al revelar la contraseña');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (!adminPassword.trim()) {
            alert('Por favor ingresa tu contraseña de administrador');
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(
                `/admin/users/${user.id}/reset-password`,
                {
                    method: 'POST',
                    credentials: 'same-origin',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN':
                            document
                                .querySelector('meta[name="csrf-token"]')
                                ?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        admin_password: adminPassword,
                        new_password: newPassword.trim() || undefined,
                    }),
                },
            );

            const data = await response.json();

            if (data.success) {
                setRevealedPassword(data.new_password);
                setShowRevealedPassword(true);
                onPasswordReset?.(data.new_password);
                alert('Contraseña restablecida exitosamente');
            } else {
                alert(data.message || 'Error al restablecer la contraseña');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setAdminPassword('');
        setRevealedPassword(null);
        setNewPassword('');
        setAction('reveal');
        setShowAdminPassword(false);
        setShowRevealedPassword(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Lock className="mr-1 h-4 w-4" />
                    Gestionar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Gestión de Contraseña
                    </DialogTitle>
                    <DialogDescription>
                        Usuario: <strong>{user.name}</strong> ({user.email})
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Verificación de Contraseña del Admin */}
                    <div className="space-y-2">
                        <Label htmlFor="adminPassword">
                            Tu contraseña de Super Administrador *
                        </Label>
                        <div className="relative">
                            <Input
                                id="adminPassword"
                                type={showAdminPassword ? 'text' : 'password'}
                                value={adminPassword}
                                onChange={(e) =>
                                    setAdminPassword(e.target.value)
                                }
                                placeholder="Ingresa tu contraseña"
                                className="pr-10"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() =>
                                    setShowAdminPassword(!showAdminPassword)
                                }
                            >
                                {showAdminPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Selección de Acción */}
                    <div className="flex gap-2">
                        <Button
                            variant={
                                action === 'reveal' ? 'default' : 'outline'
                            }
                            size="sm"
                            onClick={() => setAction('reveal')}
                            className="flex-1"
                        >
                            <Eye className="mr-1 h-4 w-4" />
                            Ver Contraseña
                        </Button>
                        <Button
                            variant={action === 'reset' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setAction('reset')}
                            className="flex-1"
                        >
                            <RotateCcw className="mr-1 h-4 w-4" />
                            Restablecer
                        </Button>
                    </div>

                    {/* Campo para nueva contraseña (solo en modo reset) */}
                    {action === 'reset' && (
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">
                                Nueva contraseña (opcional)
                            </Label>
                            <Input
                                id="newPassword"
                                type="text"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Dejar vacío para generar automáticamente"
                            />
                            <p className="text-xs text-muted-foreground">
                                Si no especificas una contraseña, se generará
                                una automáticamente.
                            </p>
                        </div>
                    )}

                    {/* Resultado */}
                    {revealedPassword && (
                        <div className="space-y-2 rounded-lg bg-muted p-4">
                            <Label>
                                {action === 'reveal'
                                    ? 'Contraseña actual:'
                                    : 'Nueva contraseña:'}
                            </Label>
                            <div className="relative">
                                <Input
                                    type={
                                        showRevealedPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    value={revealedPassword}
                                    readOnly
                                    className="pr-10 font-mono"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
                                    onClick={() =>
                                        setShowRevealedPassword(
                                            !showRevealedPassword,
                                        )
                                    }
                                >
                                    {showRevealedPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        revealedPassword,
                                    );
                                    alert('Contraseña copiada al portapapeles');
                                }}
                                className="w-full"
                            >
                                Copiar al portapapeles
                            </Button>
                        </div>
                    )}

                    {/* Botones de Acción */}
                    <div className="flex justify-between gap-2">
                        <Button variant="outline" onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={
                                action === 'reveal'
                                    ? handleRevealPassword
                                    : handleResetPassword
                            }
                            disabled={loading || !adminPassword.trim()}
                        >
                            {loading
                                ? 'Procesando...'
                                : action === 'reveal'
                                  ? 'Revelar Contraseña'
                                  : 'Restablecer'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
