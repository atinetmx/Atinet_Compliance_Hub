import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Props {
    notaria: {
        id: number;
        nombre: string;
    };
}

export default function Create({ notaria }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
        tipo_cuenta: 'usuario_notaria' as 'admin_notaria' | 'usuario_notaria' | 'invitado',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Usuarios', href: '/notaria/users' },
        { title: 'Crear Usuario', href: '/notaria/users/create' },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/notaria/users');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Crear Usuario - ${notaria.nombre}`} />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <div className="flex items-center gap-4">
                    <Link href="/notaria/users">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Volver
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold">Crear Nuevo Usuario</h1>
                        <p className="text-muted-foreground">
                            Agregar un nuevo usuario a {notaria.nombre}
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

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="password">Contraseña</RequiredLabel>
                            <Input
                                id="password"
                                type="password"
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Mínimo 8 caracteres
                            </p>
                            {errors.password && (
                                <p className="text-sm text-destructive">{errors.password}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="password_confirmation">Confirmar Contraseña</RequiredLabel>
                            <Input
                                id="password_confirmation"
                                type="password"
                                value={data.password_confirmation}
                                onChange={(e) => setData('password_confirmation', e.target.value)}
                                placeholder="••••••••"
                                required
                            />
                            {errors.password_confirmation && (
                                <p className="text-sm text-destructive">{errors.password_confirmation}</p>
                            )}
                        </div>

                        {(errors as Record<string, string>).limit && (
                            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                                {(errors as Record<string, string>).limit}
                            </div>
                        )}

                        <div className="flex items-center gap-3 pt-4">
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Creando...' : 'Crear Usuario'}
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
