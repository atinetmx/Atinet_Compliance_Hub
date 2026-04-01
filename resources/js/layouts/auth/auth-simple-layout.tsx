import { Link } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh flex-col items-center justify-center gap-6 bg-black p-6 md:p-10">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-900" />

            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.15) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Floating decorative elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-cyan-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-pulse" />

            <div className="relative z-10 w-full max-w-sm">
                <div className="flex flex-col gap-8">
                    <div className="flex flex-col items-center gap-6">
                        <Link
                            href={home()}
                            className="flex flex-col items-center gap-3 hover:opacity-80 transition-opacity"
                        >
                            <img
                                src="/images/LogoAtinetSinFondo.png"
                                alt="Atinet Logo"
                                className="h-16 w-auto"
                            />
                            <span className="text-2xl font-bold text-white">
                                Compliance <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-cyan-400">Hub</span>
                            </span>
                        </Link>

                        <div className="space-y-2 text-center">
                            <h1 className="text-xl font-semibold text-white">{title}</h1>
                            <p className="text-center text-sm text-gray-400">
                                {description}
                            </p>
                        </div>
                    </div>

                    {/* Card container for the form */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-2xl p-6 shadow-2xl">
                        {children}
                    </div>
                </div>
            </div>
        </div>
    );
}
