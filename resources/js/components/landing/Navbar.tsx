import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { login, register } from '@/routes';

interface NavbarProps {
    isAuthenticated: boolean;
    canRegister: boolean;
}

const navLinks = [
    { name: 'Inicio', href: '#hero' },
    { name: 'Características', href: '#features' },
    { name: 'Contacto', href: '#contact' },
];

const Navbar = ({ isAuthenticated, canRegister }: NavbarProps) => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                scrolled ? 'bg-black/95 backdrop-blur-sm shadow-lg' : 'bg-transparent'
            }`}
        >
            <nav className="max-w-7xl mx-auto px-5 md:px-20 py-5">
                <div className="flex items-center justify-between">
                    {/* Logo */}
                    <a
                        href="#hero"
                        className="text-xl md:text-2xl font-bold text-white hover:text-blue-400 transition-colors"
                    >
                        Atinet <span className="text-blue-400">Compliance</span>
                    </a>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <a
                                key={link.name}
                                href={link.href}
                                className="text-gray-300 hover:text-white transition-colors relative group"
                            >
                                {link.name}
                                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-400 transition-all duration-300 group-hover:w-full" />
                            </a>
                        ))}
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden lg:flex items-center gap-4">
                        {isAuthenticated ? (
                            <Link
                                href="/dashboard"
                                className="px-6 py-2 text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <Link
                                href={login()}
                                className="px-6 py-2 text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
                            >
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden text-white p-2"
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {mobileMenuOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="lg:hidden mt-4 py-4 border-t border-gray-800">
                        <div className="flex flex-col gap-4">
                            {navLinks.map((link) => (
                                <a
                                    key={link.name}
                                    href={link.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="text-gray-300 hover:text-white transition-colors py-2"
                                >
                                    {link.name}
                                </a>
                            ))}
                            <div className="flex flex-col gap-3 pt-4 border-t border-gray-800">
                                {isAuthenticated ? (
                                    <Link
                                        href="/dashboard"
                                        className="px-6 py-3 text-center text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
                                    >
                                        Dashboard
                                    </Link>
                                ) : (
                                    <Link
                                        href={login()}
                                        className="px-6 py-3 text-center text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all"
                                    >
                                        Iniciar Sesión
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Navbar;
