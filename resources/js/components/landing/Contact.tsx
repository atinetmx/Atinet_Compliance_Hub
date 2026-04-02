import { useState, FormEvent } from 'react';
import { useForm } from '@inertiajs/react';

const Contact = () => {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        message: '',
    });

    const [success, setSuccess] = useState(false);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Si tienes una ruta configurada para contacto, descomenta esto:
        // post('/contact', {
        //     onSuccess: () => {
        //         setSuccess(true);
        //         reset();
        //         setTimeout(() => setSuccess(false), 5000);
        //     },
        // });

        // Por ahora, solo simulamos el envío
        console.log('Contact form submitted:', data);
        setSuccess(true);
        reset();
        setTimeout(() => setSuccess(false), 5000);
    };

    return (
        <section id="contact" className="relative py-20 md:py-32 px-5 md:px-20 bg-linear-to-b from-black to-gray-900">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Contáctanos
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        ¿Tienes preguntas o quieres solicitar una demostración? Estamos aquí para ayudarte
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Contact Form */}
                    <div className="bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                                    Nombre Completo
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                                    placeholder="Tu nombre"
                                    required
                                />
                                {errors.name && (
                                    <p className="mt-1 text-sm text-red-400">{errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                                    Correo Electrónico
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all"
                                    placeholder="tu@email.com"
                                    required
                                />
                                {errors.email && (
                                    <p className="mt-1 text-sm text-red-400">{errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
                                    Mensaje
                                </label>
                                <textarea
                                    id="message"
                                    value={data.message}
                                    onChange={(e) => setData('message', e.target.value)}
                                    rows={5}
                                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent transition-all resize-none"
                                    placeholder="¿En qué podemos ayudarte?"
                                    required
                                />
                                {errors.message && (
                                    <p className="mt-1 text-sm text-red-400">{errors.message}</p>
                                )}
                            </div>

                            {success && (
                                <div className="p-4 bg-green-500/10 border border-green-500/50 rounded-lg">
                                    <p className="text-green-400 text-sm">
                                        ✓ Mensaje enviado correctamente. Te contactaremos pronto.
                                    </p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full px-8 py-4 text-lg font-semibold text-gray-900 bg-cyan-400 rounded-lg hover:bg-cyan-500 transition-all duration-300 shadow-lg hover:shadow-cyan-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {processing ? 'Enviando...' : 'Enviar Mensaje'}
                            </button>
                        </form>
                    </div>

                    {/* Contact Info */}
                    <div className="flex flex-col justify-center space-y-8">
                        <div className="space-y-6">
                            <h3 className="text-2xl font-bold text-white">
                                Información de Contacto
                            </h3>
                            <p className="text-gray-400 text-lg">
                                Nuestro equipo está listo para ayudarte a llevar tu gestión notarial al siguiente nivel.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {/* Email */}
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 w-12 h-12 bg-linear-to-br from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Email</h4>
                                    <a href="mailto:contacto@atinet.com.mx" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                        contacto@atinet.com.mx
                                    </a>
                                </div>
                            </div>

                            {/* Phone */}
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 w-12 h-12 bg-linear-to-br from-green-600 to-emerald-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Teléfono</h4>
                                    <a href="tel:+525512345678" className="text-cyan-400 hover:text-cyan-300 transition-colors">
                                        +52 (55) 1234-5678
                                    </a>
                                </div>
                            </div>

                            {/* Location */}
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 w-12 h-12 bg-linear-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Ubicación</h4>
                                    <p className="text-gray-400">
                                        Ciudad de México, México
                                    </p>
                                </div>
                            </div>

                            {/* Hours */}
                            <div className="flex items-start gap-4">
                                <div className="shrink-0 w-12 h-12 bg-linear-to-br from-yellow-600 to-orange-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="text-white font-semibold mb-1">Horario</h4>
                                    <p className="text-gray-400">
                                        Lunes a Viernes: 9:00 AM - 6:00 PM
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Contact;
