import { Head } from '@inertiajs/react';
import { Calendar, CheckCircle2, Clock, FileText, FolderOpen } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';

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
    const breadcrumbItems = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Control Notarial',
            href: '/control-notarial',
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
        <AppLayout breadcrumbItems={breadcrumbItems}>
            <Head title="Control Notarial" />

            <div className="min-h-screen space-y-6 p-6">
                {/* Hero Section */}
                <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 p-8 dark:border-amber-800 dark:from-amber-950/50 dark:via-yellow-950/30 dark:to-orange-950/20">
                    <div className="relative z-10">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-amber-500 p-3 text-white shadow-lg">
                                <FolderOpen className="size-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                                    Sistema Control Notarial
                                </h1>
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    Migración VB6 → Laravel + React
                                </p>
                            </div>
                        </div>

                        <div className="mt-6 flex items-center gap-4">
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-300 bg-orange-100 px-4 py-2 text-sm font-medium text-orange-900 dark:border-orange-700 dark:bg-orange-900/30 dark:text-orange-200">
                                <Clock className="size-4" />
                                {status === 'development' ? 'En Desarrollo' : 'Estado'}
                            </div>
                            <div className="text-sm text-amber-700 dark:text-amber-300">
                                {message}
                            </div>
                        </div>
                    </div>

                    {/* Decorative background */}
                    <div className="absolute right-0 top-0 opacity-10">
                        <svg width="400" height="200" viewBox="0 0 200 200">
                            <path
                                fill="currentColor"
                                d="M40,80 Q60,20 80,80 T120,80 Q140,120 160,80"
                                className="text-amber-500"
                            />
                        </svg>
                    </div>
                </div>

                {/* Phase Information */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Current Phase */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-blue-500 p-2 text-white">
                                <Calendar className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Fase {phase.current}: {phase.name}
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Duración: {phase.duration}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Inicio:
                                </span>
                                <span className="font-medium">
                                    {new Date(phase.start_date).toLocaleDateString('es-MX')}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Fin estimado:
                                </span>
                                <span className="font-medium">
                                    {new Date(phase.end_date).toLocaleDateString('es-MX')}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Progreso:
                                </span>
                                <span className="font-bold text-amber-600">
                                    {progressPercentage}%
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                <div
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                                    style={{ width: `${progressPercentage}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Tasks Overview */}
                    <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                        <div className="mb-4 flex items-center gap-3">
                            <div className="rounded-lg bg-green-500 p-2 text-white">
                                <CheckCircle2 className="size-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold">
                                    Tareas Completadas
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    {completedTasks} de {totalTasks} tareas
                                </p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {taskCategories.map((category) => {
                                const task = tasks[category.key as keyof typeof tasks];
                                const taskProgress = task.total > 0
                                    ? (task.completed / task.total) * 100
                                    : 0;

                                return (
                                    <div key={category.key}>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="font-medium">
                                                {category.label}
                                                <span className="ml-2 text-xs text-muted-foreground">
                                                    (Semanas {category.weeks})
                                                </span>
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {task.completed}/{task.total}
                                            </span>
                                        </div>
                                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                            <div
                                                className="h-full bg-green-500 transition-all duration-300"
                                                style={{ width: `${taskProgress}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Documentation Links */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="rounded-lg bg-purple-500 p-2 text-white">
                            <FileText className="size-5" />
                        </div>
                        <h2 className="text-lg font-semibold">Documentación</h2>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <a
                            href={`/${docs.analysis}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group rounded-lg border border-sidebar-border/50 p-4 transition-all hover:border-purple-500 hover:shadow-md dark:border-sidebar-border"
                        >
                            <h3 className="mb-2 font-semibold text-purple-600 group-hover:text-purple-700 dark:text-purple-400">
                                📋 Análisis Completo
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Análisis técnico completo del sistema VB6 (1,800 líneas)
                            </p>
                        </a>

                        <a
                            href={`/${docs.quickStart}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group rounded-lg border border-sidebar-border/50 p-4 transition-all hover:border-green-500 hover:shadow-md dark:border-sidebar-border"
                        >
                            <h3 className="mb-2 font-semibold text-green-600 group-hover:text-green-700 dark:text-green-400">
                                🚀 Quick Start Guide
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Guía paso a paso para iniciar Fase 0 (12 semanas)
                            </p>
                        </a>

                        <a
                            href={`/${docs.workspace}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group rounded-lg border border-sidebar-border/50 p-4 transition-all hover:border-blue-500 hover:shadow-md dark:border-sidebar-border"
                        >
                            <h3 className="mb-2 font-semibold text-blue-600 group-hover:text-blue-700 dark:text-blue-400">
                                📂 Workspace README
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                Organización del workspace y seguimiento de progreso
                            </p>
                        </a>
                    </div>
                </div>

                {/* Next Steps */}
                <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 dark:border-blue-800 dark:bg-blue-950/20">
                    <h2 className="mb-4 text-lg font-semibold text-blue-900 dark:text-blue-100">
                        🎯 Próximos Pasos
                    </h2>
                    <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                        <li className="flex items-start gap-2">
                            <span className="font-bold">1.</span>
                            <span>
                                Importar base de datos legacy (<code className="rounded bg-blue-100 px-1 py-0.5 dark:bg-blue-900">controlnotarial_30campeche_dev</code>)
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold">2.</span>
                            <span>
                                Ejecutar scripts de análisis de schema y relaciones
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold">3.</span>
                            <span>
                                Crear diccionarios de datos para las 5 tablas core
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold">4.</span>
                            <span>
                                Documentar workflows críticos con diagramas Mermaid
                            </span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="font-bold">5.</span>
                            <span>
                                Catalogar 121 reportes Crystal Reports
                            </span>
                        </li>
                    </ol>
                </div>

                {/* Git Info */}
                <div className="rounded-xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/20">
                    <h2 className="mb-4 text-lg font-semibold text-green-900 dark:text-green-100">
                        🔀 Información de Git
                    </h2>
                    <div className="space-y-2 text-sm text-green-800 dark:text-green-200">
                        <p>
                            <strong>Rama dedicada:</strong>{' '}
                            <code className="rounded bg-green-100 px-2 py-1 dark:bg-green-900">
                                feature/control-notarial
                            </code>
                        </p>
                        <p>
                            <strong>Commits:</strong> Usar prefijo{' '}
                            <code className="rounded bg-green-100 px-2 py-1 dark:bg-green-900">
                                docs(control-notarial):
                            </code>{' '}
                            o{' '}
                            <code className="rounded bg-green-100 px-2 py-1 dark:bg-green-900">
                                feat(control-notarial):
                            </code>
                        </p>
                        <p className="text-xs">
                            Consulta el Quick Start Guide para más detalles sobre el workflow de Git
                        </p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
