import { Head, usePage } from '@inertiajs/react';
import type { SharedData } from '@/types';

// Landing Page Components
import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import Features from '@/components/landing/Features';
import Contact from '@/components/landing/Contact';
import Footer from '@/components/landing/Footer';

export default function Welcome({
    canRegister = true,
}: {
    canRegister?: boolean;
}) {
    const { auth } = usePage<SharedData>().props;
    const isAuthenticated = !!auth.user;

    return (
        <>
            <Head title="Atinet Compliance Hub - Sistema de Gestión Notarial">
                <meta name="description" content="Sistema integral de gestión y cumplimiento normativo para notarías. Búsqueda en listas negras OFAC y SAT, gestión de agenda, control documental y más." />
            </Head>

            <div className="min-h-screen bg-black text-white">
                {/* Navbar */}
                <Navbar
                    isAuthenticated={isAuthenticated}
                    canRegister={canRegister}
                />

                {/* Hero Section */}
                <Hero
                    isAuthenticated={isAuthenticated}
                    canRegister={canRegister}
                />

                {/* Features Section */}
                <Features />

                {/* Contact Section */}
                <Contact />

                {/* Footer */}
                <Footer />
            </div>
        </>
    );
}
