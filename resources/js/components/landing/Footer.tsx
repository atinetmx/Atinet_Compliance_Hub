import { Link } from '@inertiajs/react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-black border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-5 md:px-20 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-3">
                            <img
                                src="/images/LogoAtinetSinFondo.png"
                                alt="Atinet Logo"
                                className="h-12 w-auto"
                            />
                            <h3 className="text-xl font-bold text-white">
                                Compliance Hub
                            </h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Sistema integral de gestión y cumplimiento normativo diseñado específicamente para notarías.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Enlaces Rápidos</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="#hero" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Inicio
                                </a>
                            </li>
                            <li>
                                <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Características
                                </a>
                            </li>
                            <li>
                                <a href="#contact" className="text-gray-400 hover:text-white transition-colors text-sm">
                                    Contacto
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* Modules */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Módulos</h4>
                        <ul className="space-y-2">
                            <li className="text-gray-400 text-sm">Dashboard Avanzado</li>
                            <li className="text-gray-400 text-sm">Listas Negras OFAC/SAT</li>
                            <li className="text-gray-400 text-sm">Gestión de Agenda</li>
                            <li className="text-gray-400 text-sm">Registro Web QR OCR</li>
                            <li className="text-gray-400 text-sm">Control Notarial</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Contacto</h4>
                        <ul className="space-y-3">
                            <li>
                                <a href="mailto:soporte@atinet.com.mx" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    soporte@atinet.com.mx
                                </a>
                            </li>
                            <li className="text-gray-400 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Ciudad de México, México
                            </li>
                            <li className="text-gray-400 text-sm flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Lun - Vie: 9:00 AM - 6:00 PM
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm text-center md:text-left">
                            © {currentYear} Atinet Technologies. Todos los derechos reservados.
                        </p>

                        <div className="flex items-center gap-6">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Términos y Condiciones
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Aviso de Privacidad
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
