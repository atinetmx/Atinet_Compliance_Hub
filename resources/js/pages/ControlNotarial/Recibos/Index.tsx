import { Head, Link } from '@inertiajs/react';
import { FileText, Receipt } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

export default function RecibosIndex() {
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
            title: 'Recibos',
            href: '/admin/control-notarial/recibos',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Recibos - Control Notarial" />

            <div className="min-h-screen space-y-6 p-6">
                {/* Header Section */}
                <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Recibos
                        </h1>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                            Gestiona y visualiza todos los recibos de la notaría
                        </p>
                    </div>
                </div>

                {/* Acceso Rápido - Botones Principales */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Botón Expediente */}
                    <Link href="/admin/control-notarial/recibos/expediente" prefetch>
                        <div className="group cursor-pointer rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-8 hover:shadow-lg hover:border-purple-400 dark:border-purple-800 dark:from-purple-950/50 dark:to-purple-900/30 transition-all duration-200">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-purple-500 p-3 text-white shadow-md group-hover:bg-purple-600 transition-colors">
                                    <FileText className="size-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-purple-900 dark:text-purple-100 group-hover:text-purple-600 dark:group-hover:text-purple-200">
                                        Expediente
                                    </h3>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">
                                        Ver recibos por expediente
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
