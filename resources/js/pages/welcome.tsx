import { Head, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

// ============================================================================
// COMPONENTES DE LA LANDING PAGE
// ============================================================================
// Cada sección de la página de bienvenida está modularizada para mantener
// el código limpio, reutilizable y fácil de mantener.
// - Navbar: Barra de navegación superior (logo, enlaces, botones de acceso)
// - Hero: Sección principal con llamado a la acción (CTA)
// - Features: Muestra los beneficios/características del sistema
// - Contact: Formulario o información de contacto
// - Footer: Pie de página con enlaces legales y redes sociales
// ============================================================================
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Contact from '@/components/landing/Contact';
import Footer from '@/components/landing/Footer';

/**
 * Página de bienvenida (Landing Page) para Atinet Compliance Hub.
 *
 * Esta es la puerta de entrada al sistema. Muestra información del producto
 * y permite a usuarios no autenticados conocer los servicios, mientras que
 * los usuarios autenticados ven opciones personalizadas (ej. botón "Ir al Dashboard").
 *
 * @returns {JSX.Element} Vista completa de la landing page
 */
export default function Welcome() {
    // ------------------------------------------------------------------------
    // OBTENER ESTADO DE AUTENTICACIÓN DESDE INERTIA
    // ------------------------------------------------------------------------
    // usePage<SharedData>() provee las props compartidas desde Laravel,
    // incluyendo la información del usuario autenticado (auth.user).
    // Esto es posible gracias al middleware HandleInertiaRequests de Laravel.
    // ------------------------------------------------------------------------
    const { auth } = usePage<SharedData>().props;

    // Bandera booleana que indica si hay un usuario logueado.
    // Se pasa a Navbar y Hero para mostrar/ocultar botones como:
    // - "Dashboard" en lugar de "Iniciar sesión"
    // - "Ir al sistema" en el CTA del Hero
    const isAuthenticated = !!auth.user;

    return (
        <>
            {/* --------------------------------------------------------------------
                 METADATOS SEO Y REDES SOCIALES
                 --------------------------------------------------------------------
                 Head es un componente de Inertia que inyecta etiquetas en el <head>
                 de HTML. Esto mejora el SEO y la experiencia al compartir en redes.
                 -------------------------------------------------------------------- */}
            <Head title="Atinet Compliance Hub - Sistema de Gestión Notarial">
                <meta
                    name="description"
                    content="Sistema integral de gestión y cumplimiento normativo para notarías. Búsqueda en listas negras OFAC y SAT, gestión de agenda, control documental y más."
                />
                {/* Aquí se pueden agregar más metatags: Open Graph, Twitter Card, etc. */}
            </Head>

            {/* --------------------------------------------------------------------
                 CONTENEDOR PRINCIPAL
                 --------------------------------------------------------------------
                 - min-h-screen: altura mínima igual al viewport.
                 - bg-[#00040f]: Fondo azul muy oscuro (casi negro), típico de diseños
                   modernos tipo "dark mode corporativo".
                 - text-white: Texto blanco para contraste.
                 -------------------------------------------------------------------- */}
            <div className="min-h-screen bg-[#00040f] text-white">

                {/* BARRA DE NAVEGACIÓN */}
                {/* Recibe isAuthenticated para decidir qué enlaces mostrar */}
                <Navbar isAuthenticated={isAuthenticated} />

                {/* SECCIÓN PRINCIPAL (HERO) */}
                {/* También recibe la bandera para cambiar el botón CTA */}
                <Hero isAuthenticated={isAuthenticated} />

                {/* SECCIÓN DE CARACTERÍSTICAS */}
                {/* Muestra tarjetas con funcionalidades clave del sistema */}
                <Features />

                {/* SECCIÓN DE CONTACTO */}
                {/* Formulario o datos de contacto para ventas/soporte */}
                <Contact />

                {/* PIE DE PÁGINA */}
                <Footer />
            </div>
        </>
    );
}
