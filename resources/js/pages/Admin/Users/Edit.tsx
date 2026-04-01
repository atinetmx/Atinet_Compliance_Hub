import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Loader2, UserCog } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface User {
    id: number;
    name: string;
    email: string;
    tipo_cuenta: string;
    notaria_id: number | null;
}

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
}

interface Props {
    user: User;
    notarias: Notaria[];
    tiposCuenta: Record<string, string>;
}

export default function Edit({ user, notarias, tiposCuenta }: Props) {
    const { data, setData, patch, processing, errors } = useForm({
        name: user.name,
        email: user.email,
        tipo_cuenta: user.tipo_cuenta,
        notaria_id: user.notaria_id ? String(user.notaria_id) : '',
        password: '',
        password_confirmation: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Administración', href: '/admin' },
        { title: 'Usuarios', href: '/admin/users' },
        { title: user.name, href: `/admin/users/${user.id}` },
        { title: 'Editar Usuario', href: `/admin/users/${user.id}/edit`, icon: UserCog },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        patch(`/admin/users/${user.id}`, {
            onSuccess: () => {
                // Success message will be shown by laravel
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar - ${user.name}`} />

            <div className="space-y-6">
                {/* Header con botón Volver */}
                <div className="flex items-center gap-4">
                    <Link href={`/admin/users/${user.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                    </Link>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="max-w-2xl rounded-lg border bg-background p-6"
                >
                    <div className="space-y-6">
                        {/* Nombre */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="Nombre del usuario"
                            />
                            {errors.name && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.name}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Email
                            </label>
                            <input
                                type="email"
                                value={data.email}
                                onChange={(e) =>
                                    setData('email', e.target.value)
                                }
                                className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                placeholder="email@example.com"
                            />
                            {errors.email && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Tipo de Cuenta */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Tipo de Cuenta
                            </label>
                            <select
                                value={data.tipo_cuenta}
                                onChange={(e) =>
                                    setData('tipo_cuenta', e.target.value)
                                }
                                className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                {Object.entries(tiposCuenta).map(
                                    ([key, label]) => (
                                        <option key={key} value={key}>
                                            {label}
                                        </option>
                                    ),
                                )}
                            </select>
                            {errors.tipo_cuenta && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.tipo_cuenta}
                                </p>
                            )}
                        </div>

                        {/* Notaría */}
                        <div>
                            <label className="mb-2 block text-sm font-medium">
                                Notaría Asignada
                            </label>
                            <select
                                value={data.notaria_id}
                                onChange={(e) =>
                                    setData('notaria_id', e.target.value)
                                }
                                className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                            >
                                <option value="">Sin asignar</option>
                                {notarias.map((notaria) => (
                                    <option key={notaria.id} value={notaria.id}>
                                        {notaria.numero_notaria} -{' '}
                                        {notaria.nombre}
                                    </option>
                                ))}
                            </select>
                            {errors.notaria_id && (
                                <p className="mt-1 text-sm text-red-600">
                                    {errors.notaria_id}
                                </p>
                            )}
                        </div>

                        {/* Cambiar Contraseña */}
                        <div className="border-t pt-6">
                            <h3 className="mb-4 text-lg font-semibold">
                                Cambiar Contraseña
                            </h3>

                            {/* Nueva Contraseña */}
                            <div className="mb-4">
                                <label className="mb-2 block text-sm font-medium">
                                    Nueva Contraseña (opcional)
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    onChange={(e) =>
                                        setData('password', e.target.value)
                                    }
                                    className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="Dejar vacío para no cambiar"
                                />
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">
                                        {errors.password}
                                    </p>
                                )}
                            </div>

                            {/* Confirmar Contraseña */}
                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Confirmar Contraseña
                                </label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    onChange={(e) =>
                                        setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border px-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
                                    placeholder="Confirmar contraseña"
                                />
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-4 border-t pt-6">
                            <Button
                                type="submit"
                                disabled={processing}
                                className="flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                            <Link href={`/admin/users/${user.id}`}>
                                <Button variant="outline">Cancelar</Button>
                            </Link>
                        </div>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
