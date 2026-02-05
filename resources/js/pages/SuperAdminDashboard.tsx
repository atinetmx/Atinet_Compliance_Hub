import { Head } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import type { SharedData } from '@/types';

interface SuperAdminProps extends SharedData {
    stats: {
        total_notarias: number;
        total_usuarios: number;
        total_busquedas: number;
        suscripciones_activas: number;
    };
}

export default function SuperAdminDashboard({ auth, stats }: SuperAdminProps) {
    return (
        <>
            <Head title="Super Admin Dashboard" />

            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16 items-center">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    🔥 Dashboard Super Admin
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Vista global del sistema Atinet Compliance Hub
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">
                                    👤 {auth.user.name}
                                </span>
                                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                                    Super Admin
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            <Card className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-lg">🏢</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Notarías</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total_notarias}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-lg">👥</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Usuarios</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total_usuarios}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-lg">🔍</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Total Búsquedas</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.total_busquedas}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-yellow-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-lg">💰</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Suscripciones Activas</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.suscripciones_activas}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Action Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                            {/* Gestión de Tenants */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">🏢 Gestión de Notarías</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">
                                    Crear y administrar notarías (tenants) del sistema
                                </p>
                                <div className="space-y-2">
                                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                        ➕ Crear Nueva Notaría
                                    </button>
                                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                        📋 Ver Todas las Notarías
                                    </button>
                                </div>
                            </Card>

                            {/* Gestión de Planes */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">💎 Planes y Suscripciones</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">
                                    Administrar planes de suscripción y facturación
                                </p>
                                <div className="space-y-2">
                                    <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                                        💰 Gestionar Planes
                                    </button>
                                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                        📊 Ver Facturación
                                    </button>
                                </div>
                            </Card>

                            {/* Métricas y Reportes */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">📈 Métricas Globales</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">
                                    Reportes y análisis de uso del sistema
                                </p>
                                <div className="space-y-2">
                                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                                        📊 Ver Métricas
                                    </button>
                                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                        📋 Exportar Reportes
                                    </button>
                                </div>
                            </Card>

                        </div>

                        {/* Desarrollo/Testing Section */}
                        <div className="mt-8">
                            <Card className="p-6 bg-yellow-50 border-yellow-200">
                                <h3 className="text-lg font-medium text-yellow-800 mb-2">🧪 Herramientas de Desarrollo</h3>
                                <p className="text-yellow-700 text-sm mb-4">
                                    Herramientas para testing y desarrollo (solo ambiente local)
                                </p>
                                <div className="flex space-x-4">
                                    <a
                                        href="/examples"
                                        className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors"
                                    >
                                        🔍 Probar Ejemplos de Roles
                                    </a>
                                    <button className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 transition-colors">
                                        🗄️ Gestionar Base de Datos
                                    </button>
                                </div>
                            </Card>
                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}
