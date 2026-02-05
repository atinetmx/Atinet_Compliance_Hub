import { Head } from '@inertiajs/react';
import { Card } from '@/components/ui/card';
import type { SharedData } from '@/types';

interface NotariaDashboardProps extends SharedData {
    notaria: {
        id: number;
        nombre: string;
        numero_notaria: string;
        activa: boolean;
    };
    stats: {
        busquedas_mes: number;
        busquedas_hoy: number;
        usuarios_notaria: number;
    };
}

export default function NotariaDashboard({ auth, notaria, stats }: NotariaDashboardProps) {
    const isAdmin = auth.user.tipo_cuenta === 'admin_notaria';
    
    return (
        <>
            <Head title="Dashboard Notaría" />
            
            <div className="min-h-screen bg-gray-50">
                {/* Header */}
                <div className="bg-white shadow">
                    <div className="px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16 items-center">
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900">
                                    🏢 {notaria.nombre}
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Notaría No. {notaria.numero_notaria}
                                </p>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm text-gray-700">
                                    👤 {auth.user.name}
                                </span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    isAdmin ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                                }`}>
                                    {isAdmin ? 'Administrador' : 'Usuario'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="py-8">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        
                        {/* Stats Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            <Card className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-lg">🔍</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Búsquedas este Mes</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.busquedas_mes}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-lg">📅</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Búsquedas Hoy</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.busquedas_hoy}</p>
                                    </div>
                                </div>
                            </Card>

                            <Card className="p-6">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0">
                                        <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                                            <span className="text-white text-lg">👥</span>
                                        </div>
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-500">Usuarios</p>
                                        <p className="text-2xl font-bold text-gray-900">{stats.usuarios_notaria}</p>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Action Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            
                            {/* Búsquedas */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">🔍 Búsquedas</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">
                                    Realizar búsquedas en registros públicos
                                </p>
                                <div className="space-y-2">
                                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
                                        🔍 Nueva Búsqueda
                                    </button>
                                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                        📋 Ver Historial
                                    </button>
                                </div>
                            </Card>

                            {/* Reportes */}
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900">📊 Reportes</h3>
                                </div>
                                <p className="text-gray-600 text-sm mb-4">
                                    Generar reportes y estadísticas
                                </p>
                                <div className="space-y-2">
                                    <button className="w-full bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors">
                                        📊 Generar Reporte
                                    </button>
                                    <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                        📋 Ver Reportes
                                    </button>
                                </div>
                            </Card>

                            {/* Gestión (Solo Admin) */}
                            {isAdmin && (
                                <Card className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-medium text-gray-900">⚙️ Administración</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-4">
                                        Gestionar usuarios y configuración
                                    </p>
                                    <div className="space-y-2">
                                        <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors">
                                            👥 Gestionar Usuarios
                                        </button>
                                        <button className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors">
                                            ⚙️ Configuración
                                        </button>
                                    </div>
                                </Card>
                            )}

                        </div>

                    </div>
                </div>
            </div>
        </>
    );
}