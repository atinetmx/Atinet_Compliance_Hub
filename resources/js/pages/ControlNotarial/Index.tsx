import { Head, Link } from '@inertiajs/react';
import { Calendar, CheckCircle2, Clock, FileText, FolderOpen, Settings } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Task {
    total: number;
    completed: number;
}

interface Props {
    status: string;
    message: string;
    docs: {
        analysis: string;
        quickStart: string;
        workspace: string;
    };
    phase: {
        current: number;
        name: string;
        duration: string;
        start_date: string;
        end_date: string;
        progress: number;
    };
    tasks: {
        setup: Task;
        db_exploration: Task;
        vb6_analysis: Task;
        workflows: Task;
        reports: Task;
        prototypes: Task;
    };
}

export default function ControlNotarialIndex({
    status,
    message,
    docs,
    phase,
    tasks,
}: Props) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Control Notarial',
            href: '/admin/control-notarial',
        },
    ];

    const totalTasks = Object.values(tasks).reduce(
        (sum, task) => sum + task.total,
        0
    );
    const completedTasks = Object.values(tasks).reduce(
        (sum, task) => sum + task.completed,
        0
    );
    const progressPercentage = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    const taskCategories = [
        { key: 'setup', label: 'Setup Inicial', weeks: '1-2' },
        { key: 'db_exploration', label: 'Exploración BD', weeks: '3-4' },
        { key: 'vb6_analysis', label: 'Análisis VB6', weeks: '5-6' },
        { key: 'workflows', label: 'Workflows', weeks: '7-8' },
        { key: 'reports', label: 'Reportes', weeks: '9-10' },
        { key: 'prototypes', label: 'Prototipos', weeks: '11-12' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Control Notarial" />

            <div className="min-h-screen space-y-6 p-6">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-xl border border-sidebar-border/70 bg-linear-to-br from-amber-500/10 to-orange-500/10 p-8 dark:border-sidebar-border">
                    <h1 className="text-3xl font-bold text-foreground">
                        Control Notarial
                    </h1>
                    <p className="mt-2 text-lg text-muted-foreground">
                        Sistema de gestión y control para operaciones notariales
                    </p>
                </div>

                {/* Acceso Rápido - Botones Principales */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Botón Expedientes */}
                    <Link href="/admin/control-notarial/expedientes" prefetch>
                        <div className="group cursor-pointer rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-8 hover:shadow-lg hover:border-blue-400 dark:border-blue-800 dark:from-blue-950/50 dark:to-blue-900/30 transition-all duration-200">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-blue-500 p-3 text-white shadow-md group-hover:bg-blue-600 transition-colors">
                                    <FileText className="size-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100 group-hover:text-blue-600 dark:group-hover:text-blue-200">
                                        Expedientes
                                    </h3>
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        Gestionar expedientes y documentos
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Botón Configuración */}
                    <Link href="/admin/control-notarial/configuracion" prefetch>
                        <div className="group cursor-pointer rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-8 hover:shadow-lg hover:border-emerald-400 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-emerald-900/30 transition-all duration-200">
                            <div className="flex items-center gap-4">
                                <div className="rounded-lg bg-emerald-500 p-3 text-white shadow-md group-hover:bg-emerald-600 transition-colors">
                                    <Settings className="size-8" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold text-emerald-900 dark:text-emerald-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-200">
                                        Configuración
                                    </h3>
                                    <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                        Configurar notaría, usuarios y catálogos
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
