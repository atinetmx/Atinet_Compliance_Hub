import { Head } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import type { SharedData } from '@/types';

interface InvitadoDashboardProps extends SharedData {
    notaria: {
        id: number;
        nombre: string;
        numero_notaria: string;
    };
}

export default function InvitadoDashboard({ auth, notaria }: InvitadoDashboardProps) {
    return (
        <>
            <Head title="Dashboard Invitado" />

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16 items-center">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    👥 Acceso de Invitado
                                </h1>
                                <p className="text-sm text-gray-500">
                                    {notaria.nombre} - No. {notaria.numero_notaria}
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">
                                    👤 {auth.user.name}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                                    Invitado
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="py-8">
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                        {/* Welcome Message */}
                        <Card className="p-6 mb-8 bg-yellow-50 border-yellow-200">
                            <h2 className="text-lg font-medium text-yellow-800 mb-2">
                                🎯 Bienvenido como Invitado
                            </h2>
                            <p className="text-yellow-700 text-sm">
                                Tienes acceso limitado al sistema. Puedes consultar información básica
                                pero no realizar modificaciones. Si necesitas más acceso, contacta al
                                administrador de la notaría.
                            </p>
                        </Card>

                        {/* Limited Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Consultas Básicas */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">📋 Consultas</h3>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                        Solo Lectura
                                    </span>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">
                                    Ver información básica y reportes públicos
                                </p>
                                <div className="space-y-2">
                                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                        📊 Ver Reportes Públicos
                                    </button>
                                    <button className="w-full bg-gray-400 text-white px-4 py-2 rounded-md cursor-not-allowed" disabled>
                                        🔍 Búsquedas (No Disponible)
                                    </button>
                                </div>
                            </Card>

                            {/* Información General */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">ℹ️ Información</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">
                                    Información general de la notaría
                                </p>
                                <div className="space-y-2">
                                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                        📞 Información de Contacto
                                    </button>
                                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                        📋 Servicios Disponibles
                                    </button>
                                </div>
                            </Card>

                        </div>

                        {/* Contact Admin */}
                        <Card className="p-6 mt-8 bg-blue-50 border-blue-200">
                            <h3 className="text-lg font-medium text-blue-800 mb-2">
                                💬 ¿Necesitas Más Acceso?
                            </h3>
                            <p className="text-blue-700 text-sm mb-4">
                                Si necesitas realizar búsquedas o acceder a más funciones del sistema,
                                contacta al administrador de la notaría.
                            </p>
                            <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                📧 Solicitar Acceso
                            </button>
                        </Card>

                    </div>
                </div>
            </div>
        </>
    );
}
