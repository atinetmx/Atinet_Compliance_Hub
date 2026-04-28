import { Head, Link } from '@inertiajs/react';
import {
    Building2,
    Users,
    UserCheck,
    Tags,
    BarChart3,
    Settings,
} from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

export default function ControlNotarialConfiguracionIndex() {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Control Notarial',
            href: '/admin/control-notarial',
        },
        {
            title: 'Configuración',
            href: '/admin/control-notarial/configuracion',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración - Control Notarial" />

            <div className="min-h-screen space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Configuración
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Gestiona todos los datos y configuraciones de tu notaría
                        </p>
                    </div>
                </div>

                {/* Acceso Rápido - Botones Principales */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Datos de Notaría */}
                    <Link href="/admin/control-notarial/configuracion/notaria" prefetch>
                        <div className="group flex h-full min-h-40 cursor-pointer flex-col justify-between rounded-xl border border-blue-200 bg-linear-to-br from-blue-50 to-blue-100 p-4 sm:p-6 hover:shadow-lg hover:border-blue-400 dark:border-blue-800 dark:from-blue-950/50 dark:to-blue-900/30 transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-blue-500 p-2 sm:p-3 text-white shadow-md group-hover:bg-blue-600 transition-colors shrink-0">
                                    <Building2 className="size-6 sm:size-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-xl font-semibold text-blue-900 dark:text-blue-100 group-hover:text-blue-600 dark:group-hover:text-blue-200 line-clamp-2">
                                        Datos de Notaría
                                    </h3>
                                    <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300 line-clamp-2 mt-1">
                                        Configura información básica de tu notaría
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Usuarios */}
                    <Link href="/admin/control-notarial/usuarios" prefetch>
                        <div className="group flex h-full min-h-40 cursor-pointer flex-col justify-between rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50 to-emerald-100 p-4 sm:p-6 hover:shadow-lg hover:border-emerald-400 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-emerald-900/30 transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-emerald-500 p-2 sm:p-3 text-white shadow-md group-hover:bg-emerald-600 transition-colors shrink-0">
                                    <Users className="size-6 sm:size-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-xl font-semibold text-emerald-900 dark:text-emerald-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-200 line-clamp-2">
                                        Usuarios
                                    </h3>
                                    <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 line-clamp-2 mt-1">
                                        Gestiona los usuarios de la notaría
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Clientes */}
                    <Link href="/admin/control-notarial/clientes" prefetch>
                        <div className="group flex h-full min-h-40 cursor-pointer flex-col justify-between rounded-xl border border-purple-200 bg-linear-to-br from-purple-50 to-purple-100 p-4 sm:p-6 hover:shadow-lg hover:border-purple-400 dark:border-purple-800 dark:from-purple-950/50 dark:to-purple-900/30 transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-purple-500 p-2 sm:p-3 text-white shadow-md group-hover:bg-purple-600 transition-colors shrink-0">
                                    <UserCheck className="size-6 sm:size-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-xl font-semibold text-purple-900 dark:text-purple-100 group-hover:text-purple-600 dark:group-hover:text-purple-200 line-clamp-2">
                                        Clientes
                                    </h3>
                                    <p className="text-xs sm:text-sm text-purple-700 dark:text-purple-300 line-clamp-2 mt-1">
                                        Administra la base de datos de clientes
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Alta de Catálogos */}
                    <Link href="/admin/control-notarial/alta-catalogos" prefetch>
                        <div className="group flex h-full min-h-40 cursor-pointer flex-col justify-between rounded-xl border border-amber-200 bg-linear-to-br from-amber-50 to-amber-100 p-4 sm:p-6 hover:shadow-lg hover:border-amber-400 dark:border-amber-800 dark:from-amber-950/50 dark:to-amber-900/30 transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-amber-500 p-2 sm:p-3 text-white shadow-md group-hover:bg-amber-600 transition-colors shrink-0">
                                    <Tags className="size-6 sm:size-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-xl font-semibold text-amber-900 dark:text-amber-100 group-hover:text-amber-600 dark:group-hover:text-amber-200 line-clamp-2">
                                        Alta de Catálogos
                                    </h3>
                                    <p className="text-xs sm:text-sm text-amber-700 dark:text-amber-300 line-clamp-2 mt-1">
                                        Crea y edita catálogos disponibles
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Reporte de Usuarios */}
                    <Link href="/admin/control-notarial/reporte-usuarios" prefetch>
                        <div className="group flex h-full min-h-40 cursor-pointer flex-col justify-between rounded-xl border border-rose-200 bg-linear-to-br from-rose-50 to-rose-100 p-4 sm:p-6 hover:shadow-lg hover:border-rose-400 dark:border-rose-800 dark:from-rose-950/50 dark:to-rose-900/30 transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-rose-500 p-2 sm:p-3 text-white shadow-md group-hover:bg-rose-600 transition-colors shrink-0">
                                    <BarChart3 className="size-6 sm:size-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-xl font-semibold text-rose-900 dark:text-rose-100 group-hover:text-rose-600 dark:group-hover:text-rose-200 line-clamp-2">
                                        Reporte de Usuarios
                                    </h3>
                                    <p className="text-xs sm:text-sm text-rose-700 dark:text-rose-300 line-clamp-2 mt-1">
                                        Visualiza estadísticas de usuarios
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Configuración de Operaciones */}
                    <Link href="/admin/control-notarial/configuracion-operaciones" prefetch>
                        <div className="group flex h-full min-h-40 cursor-pointer flex-col justify-between rounded-xl border border-indigo-200 bg-linear-to-br from-indigo-50 to-indigo-100 p-4 sm:p-6 hover:shadow-lg hover:border-indigo-400 dark:border-indigo-800 dark:from-indigo-950/50 dark:to-indigo-900/30 transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-indigo-500 p-2 sm:p-3 text-white shadow-md group-hover:bg-indigo-600 transition-colors shrink-0">
                                    <Settings className="size-6 sm:size-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-xl font-semibold text-indigo-900 dark:text-indigo-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-200 line-clamp-2">
                                        Configuración de Operaciones
                                    </h3>
                                    <p className="text-xs sm:text-sm text-indigo-700 dark:text-indigo-300 line-clamp-2 mt-1">
                                        Configura etapas, documentos e impuestos
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Configuraciones Tarifarias */}
                    <Link href="/admin/control-notarial/configuraciones-tarifarias" prefetch>
                        <div className="group flex h-full min-h-40 cursor-pointer flex-col justify-between rounded-xl border border-teal-200 bg-linear-to-br from-teal-50 to-teal-100 p-4 sm:p-6 hover:shadow-lg hover:border-teal-400 dark:border-teal-800 dark:from-teal-950/50 dark:to-teal-900/30 transition-all duration-200">
                            <div className="flex items-start gap-3">
                                <div className="rounded-lg bg-teal-500 p-2 sm:p-3 text-white shadow-md group-hover:bg-teal-600 transition-colors shrink-0">
                                    <BarChart3 className="size-6 sm:size-8" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-base sm:text-xl font-semibold text-teal-900 dark:text-teal-100 group-hover:text-teal-600 dark:group-hover:text-teal-200 line-clamp-2">
                                        Configuraciones Tarifarias
                                    </h3>
                                    <p className="text-xs sm:text-sm text-teal-700 dark:text-teal-300 line-clamp-2 mt-1">
                                        Administra las tarifas y servicios
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </AppLayout>
    );
}
