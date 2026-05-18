import { Form, Head } from '@inertiajs/react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import AuthLayout from '@/layouts/auth-layout';
import { update } from '@/routes/password';

type Props = {
    token: string;
    email: string;
};

export default function ResetPassword({ token, email }: Props) {
    return (
        <AuthLayout
            title="Restablecer contraseña"
            description="Ingresa tu nueva contraseña"
        >
            <Head title="Restablecer contraseña" />

            <Form
                {...update.form()}
                transform={(data) => ({ ...data, token, email })}
                resetOnSuccess={['password', 'password_confirmation']}
            >
                {({ processing, errors }) => (
                    <div className="grid gap-6">
                        <div className="grid gap-2">
                            <RequiredLabel htmlFor="email" className="text-white">Correo electrónico</RequiredLabel>
                            <Input
                                id="email"
                                type="email"
                                name="email"
                                autoComplete="email"
                                value={email}
                                className="mt-1 block w-full text-white bg-gray-800/50 border-gray-700 placeholder:text-gray-500"
                                readOnly
                            />
                            <InputError
                                message={errors.email}
                                className="mt-2"
                            />
                        </div>

                        <div className="grid gap-2">
                            <RequiredLabel htmlFor="password" className="text-white">Nueva contraseña</RequiredLabel>
                            <Input
                                id="password"
                                type="password"
                                name="password"
                                autoComplete="new-password"
                                className="mt-1 block w-full text-white bg-gray-800/50 border-gray-700 placeholder:text-gray-500"
                                autoFocus
                                placeholder="Nueva contraseña"
                            />
                            <InputError message={errors.password} />
                        </div>

                        <div className="grid gap-2">
                            <RequiredLabel htmlFor="password_confirmation" className="text-white">
                                Confirmar contraseña
                            </RequiredLabel>
                            <Input
                                id="password_confirmation"
                                type="password"
                                name="password_confirmation"
                                autoComplete="new-password"
                                className="mt-1 block w-full text-white bg-gray-800/50 border-gray-700 placeholder:text-gray-500"
                                placeholder="Confirmar contraseña"
                            />
                            <InputError
                                message={errors.password_confirmation}
                                className="mt-2"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="mt-4 w-full bg-linear-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all duration-300"
                            disabled={processing}
                            data-test="reset-password-button"
                        >
                            {processing && <Spinner />}
                            Restablecer contraseña
                        </Button>
                    </div>
                )}
            </Form>
        </AuthLayout>
    );
}
