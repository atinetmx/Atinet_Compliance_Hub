import { Link } from '@inertiajs/react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="relative bg-black border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-5 md:px-20 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-white">
                            Atinet Compliance Hub
                        </h3>
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
                            <li className="text-gray-400 text-sm">Listas Negras OFAC/SAT</li>
                            <li className="text-gray-400 text-sm">Gestión de Agenda</li>
                            <li className="text-gray-400 text-sm">Suscripciones</li>
                            <li className="text-gray-400 text-sm">Control Documental</li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Contacto</h4>
                        <ul className="space-y-2">
                            <li>
                                <a href="mailto:contacto@atinet.com.mx" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                    contacto@atinet.com.mx
                                </a>
                            </li>
                            <li>
                                <a href="tel:+525512345678" className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    +52 (55) 1234-5678
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="pt-8 border-t border-gray-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-400 text-sm text-center md:text-left">
                            © {currentYear} Atinet. Todos los derechos reservados.
                        </p>

                        <div className="flex items-center gap-6">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Términos de Servicio
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">
                                Privacidad
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
