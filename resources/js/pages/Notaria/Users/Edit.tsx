import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    tipo_cuenta: string;
}

interface Props {
    user: User;
    notaria: {
        id: number;
        nombre: string;
    };
}

export default function Edit({ user }: Props) {
    const { data, setData, put, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        tipo_cuenta: user.tipo_cuenta as 'admin_notaria' | 'usuario_notaria' | 'invitado',
        password: '',
        password_confirmation: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Usuarios', href: '/notaria/users' },
        { title: 'Editar Usuario', href: `/notaria/users/${user.id}/edit` },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/notaria/users/${user.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Usuario - ${user.name}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/notaria/users">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Editar Usuario</h1>
                        <p className="text-muted-foreground">
                            Modificar información de {user.name}
                        </p>
                    </div>
                </div>

                <div className="rounded-lg border border-sidebar-border/70 bg-background p-6 max-w-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="name">Nombre Completo</RequiredLabel>
                            <Input
                                id="name"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                placeholder="Juan Pérez García"
                                required
                            />
                            {errors.name && (
                                <p className="text-sm text-destructive">{errors.name}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="email">Correo Electrónico</RequiredLabel>
                            <Input
                                id="email"
                                type="email"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="usuario@notaria.com"
                                required
                            />
                            {errors.email && (
                                <p className="text-sm text-destructive">{errors.email}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="tipo_cuenta">Tipo de Cuenta</RequiredLabel>
                            <Select
                                value={data.tipo_cuenta}
                                onValueChange={(value: 'admin_notaria' | 'usuario_notaria' | 'invitado') =>
                                    setData('tipo_cuenta', value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecciona un tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="admin_notaria">Administrador</SelectItem>
                                    <SelectItem value="usuario_notaria">Usuario</SelectItem>
                                    <SelectItem value="invitado">Invitado</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                Los administradores pueden gestionar usuarios y configuración
                            </p>
                            {errors.tipo_cuenta && (
                                <p className="text-sm text-destructive">{errors.tipo_cuenta}</p>
                            )}
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="text-lg font-medium mb-4">Cambiar Contraseña (Opcional)</h3>
                            <p className="text-sm text-muted-foreground mb-4">
                                Deja estos campos vacíos si no deseas cambiar la contraseña
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="password">Nueva Contraseña</RequiredLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    {errors.password && (
                                        <p className="text-sm text-destructive">{errors.password}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="password_confirmation">Confirmar Nueva Contraseña</RequiredLabel>
                                    <Input
                                        id="password_confirmation"
                                        type="password"
                                        value={data.password_confirmation}
                                        onChange={(e) => setData('password_confirmation', e.target.value)}
                                        placeholder="••••••••"
                                    />
                                    {errors.password_confirmation && (
                                        <p className="text-sm text-destructive">{errors.password_confirmation}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 pt-4">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                            <Link href="/notaria/users">
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
