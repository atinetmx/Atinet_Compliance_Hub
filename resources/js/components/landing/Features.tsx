const features = [
    {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
        ),
        title: 'Dashboard Básico y Avanzado',
        description: 'Visualización de métricas clave con gráficos interactivos. Dashboard básico para usuarios estándar y avanzado con estadísticas detalladas para administradores.',
        color: 'from-blue-500 to-indigo-500'
    },
    {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
        ),
        title: 'Reportes Personalizados',
        description: 'Generación de reportes personalizados con filtros avanzados. Exportación a PDF y Excel, visualización de datos históricos y estadísticas por período.',
        color: 'from-purple-500 to-pink-500'
    },
    {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        title: 'API de Captura de Documentos',
        description: 'API REST completa para captura y digitalización de documentos. Integración con aplicaciones móviles y sistemas externos. Endpoints seguros con autenticación.',
        color: 'from-green-500 to-teal-500'
    },
    {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        ),
        title: 'Listas Negras OFAC y SAT',
        description: 'Búsqueda en tiempo real de personas físicas y morales en listas OFAC (EE.UU.) y SAT Artículo 69-B (México). Generación automática de reportes en PDF profesionales.',
        color: 'from-red-500 to-orange-500'
    },
    {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
        ),
        title: 'Gestión de Agenda',
        description: 'Calendario completo con FullCalendar v7, eventos recurrentes, sistema de citas, recordatorios y bitácora de actividades. Permisos multi-nivel por notaría.',
        color: 'from-cyan-500 to-blue-500'
    },
    {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
        ),
        title: 'Registro Web QR OCR',
        description: 'Sistema de registro web con códigos QR para identificación rápida. Tecnología OCR para extracción automática de datos de documentos oficiales (INE, pasaportes).',
        color: 'from-yellow-500 to-orange-500'
    },
    {
        icon: (
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
        ),
        title: 'Sistema de Control Notarial',
        description: 'Control integral de operaciones notariales: gestión de expedientes, presupuestos, escrituras y documentación. Integración con sistema legacy para historial completo.',
        color: 'from-indigo-500 to-purple-500'
    }
];

const Features = () => {
    return (
        <section id="features" className="relative py-20 md:py-32 px-5 md:px-20 bg-black">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                        Módulos del Sistema
                    </h2>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Herramientas especializadas para optimizar la gestión de tu notaría
                    </p>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="group relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-xl p-8 hover:border-gray-700 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                        >
                            {/* Gradient overlay on hover */}
                            <div className="absolute inset-0 bg-linear-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-xl"
                                 style={{
                                     backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`
                                 }}
                            />

                            <div className="relative z-10">
                                {/* Icon */}
                                <div className={`inline-flex p-3 rounded-lg bg-linear-to-br ${feature.color} mb-4`}>
                                    <div className="text-white">
                                        {feature.icon}
                                    </div>
                                </div>

                                {/* Content */}
                                <h3 className="text-xl font-semibold text-white mb-3 group-hover:text-blue-400 transition-colors">
                                    {feature.title}
                                </h3>
                                <p className="text-gray-400 leading-relaxed">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* CTA */}
                <div className="text-center mt-16">
                    <p className="text-gray-400 mb-6">
                        ¿Quieres conocer más sobre nuestros módulos?
                    </p>
                    <a
                        href="#contact"
                        className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-linear-to-r from-blue-600 to-cyan-600 rounded-lg hover:from-blue-700 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-blue-500/50"
                    >
                        Solicitar Demo
                    </a>
                </div>
            </div>
        </section>
    );
};

export default Features;
