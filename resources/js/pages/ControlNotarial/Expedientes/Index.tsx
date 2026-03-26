import { Head } from '@inertiajs/react';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';

interface Expediente {
    id: number;
    numero: string;
    titulo: string;
    estado: string;
    fecha_creacion: string;
    fecha_modificacion: string;
}

interface Props {
    expedientes: Expediente[];
    phase?: string;
    message?: string;
}

export default function ExpedientesIndex({ expedientes = [], phase = 'production', message }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const breadcrumpItems: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Control Notarial',
            href: '/control-notarial',
        },
        {
            title: 'Expedientes',
            href: '/control-notarial/expedientes',
        },
    ];

    const filteredExpedientes = expedientes.filter(
        (exp) =>
            exp.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.titulo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const isDevelopment = phase === 'development';

    return (
        <AppLayout breadcrumbItems={breadcrumpItems}>
            <Head title="Expedientes - Control Notarial" />

            <div className="min-h-screen space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Expedientes
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Gestiona todos los expedientes de la notaría
                        </p>
                    </div>
                    {!isDevelopment && (
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Nuevo Expediente
                        </Button>
                    )}
                </div>

                {isDevelopment && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                        <p className="text-sm text-blue-900 dark:text-blue-200">
                            <strong>En desarrollo:</strong> Este módulo está siendo actualizado. Pronto podrás
                            gestionar expedientes desde aquí.
                        </p>
                    </div>
                )}

                {/* Search and Filter Section */}
                {!isDevelopment && (
                    <div className="flex flex-col gap-4 md:flex-row">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                <Input
                                    placeholder="Buscar por número o título del expediente..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filtros
                        </Button>
                    </div>
                )}

                {/* Empty State or Table */}
                {!isDevelopment && filteredExpedientes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 border-dashed px-6 py-12 dark:border-gray-700">
                        <div className="rounded-lg bg-blue-100 p-3 dark:bg-blue-900/30">
                            <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
                            {searchTerm
                                ? 'No se encontraron expedientes'
                                : 'No hay expedientes registrados'}
                        </h3>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            {searchTerm
                                ? 'Intenta con otros términos de búsqueda'
                                : 'Comienza creando tu primer expediente'}
                        </p>
                        {!searchTerm && (
                            <Button className="mt-6 gap-2">
                                <Plus className="h-4 w-4" />
                                Crear Expediente
                            </Button>
                        )}
                    </div>
                ) : !isDevelopment ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/50">
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Número
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Título
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                                        Creado
                                    </th>
                                    <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900 dark:text-white">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredExpedientes.map((expediente) => (
                                    <tr
                                        key={expediente.id}
                                        className="border-b border-gray-200 last:border-b-0 dark:border-gray-700"
                                    >
                                        <td className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white">
                                            {expediente.numero}
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {expediente.titulo}
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                                {expediente.estado}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(
                                                expediente.fecha_creacion
                                            ).toLocaleDateString('es-MX')}
                                        </td>
                                        <td className="px-6 py-3 text-right">
                                            <Button variant="ghost" size="sm">
                                                Ver
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : null}
            </div>
        </AppLayout>
    );
}
