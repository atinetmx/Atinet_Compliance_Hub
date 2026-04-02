import { Link } from '@inertiajs/react';
import Spline from '@splinetool/react-spline';
import { login } from '@/routes';

interface HeroProps {
    isAuthenticated: boolean;
}

const Hero = ({ isAuthenticated }: HeroProps) => {
    return (
        <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-linear-to-br from-gray-900 via-black to-gray-900" />

            {/* Animated background pattern */}
            <div className="absolute inset-0 opacity-20">
                <div className="absolute inset-0" style={{
                    backgroundImage: 'radial-gradient(circle at 1px 1px, rgb(255 255 255 / 0.15) 1px, transparent 0)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-20 pt-32 md:pt-40 pb-20">
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-12 items-center">
                    {/* LEFT: Hero Content */}
                    <div className="flex flex-col gap-8">
                        <div className="space-y-4">
                            <h1 className="text-4xl md:text-6xl xl:text-7xl font-bold text-white leading-tight">
                                Atinet
                                <span className="block text-cyan-400">
                                    Compliance Hub
                                </span>
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-300">
                                Sistema integral de gestión y cumplimiento normativo para notarías
                            </p>
                        </div>

                        <p className="text-lg text-gray-400 max-w-2xl">
                            Optimiza tu gestión notarial con herramientas especializadas: búsqueda en listas negras
                            OFAC y SAT, gestión de agenda, control documental y mucho más.
                        </p>

                        <div className="flex flex-wrap gap-4">
                            {isAuthenticated ? (
                                <Link
                                    href="/dashboard"
                                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-cyan-400 rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50"
                                >
                                    Ir al Dashboard
                                </Link>
                            ) : (
                                <Link
                                    href={login()}
                                    className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-gray-900 bg-cyan-400 rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50"
                                >
                                    Iniciar Sesión
                                </Link>
                            )}
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-cyan-400">50+</div>
                                <div className="text-sm text-gray-400 mt-1">Notarías</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-cyan-400">10k+</div>
                                <div className="text-sm text-gray-400 mt-1">Búsquedas</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-cyan-400">99%</div>
                                <div className="text-sm text-gray-400 mt-1">Disponibilidad</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl md:text-4xl font-bold text-cyan-400">24/7</div>
                                <div className="text-sm text-gray-400 mt-1">Soporte</div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: 3D Visual Element */}
                    <div className="hidden xl:flex items-center justify-center">
                        <div className="relative w-full h-150">
                            {/* Spline 3D Scene */}
                            <div className="absolute inset-0 rounded-2xl overflow-hidden border border-gray-700/50">
                                <Spline
                                    scene="https://prod.spline.design/KnXF8coogW5Xomx4/scene.splinecode"
                                />
                            </div>

                            {/* Floating elements */}
                            <div className="absolute -top-4 -right-4 w-32 h-32 bg-blue-500/30 rounded-full blur-3xl animate-pulse pointer-events-none" />
                            <div className="absolute -bottom-4 -left-4 w-40 h-40 bg-cyan-500/30 rounded-full blur-3xl animate-pulse delay-1000 pointer-events-none" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            </div>
        </section>
    );
};

export default Hero;
