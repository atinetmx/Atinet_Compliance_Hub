import { Head, Link } from '@inertiajs/react';
<<<<<<< HEAD
import { Calendar, CheckCircle2, Clock, FileText, FolderOpen, Receipt, Settings, LogOut, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
=======
import { Calendar, CheckCircle2, Clock, FileText, FolderOpen, Settings } from 'lucide-react';
>>>>>>> 13871b557fa28d21f06ecd5282f8a13780480d1f

import AppLayout from '@/layouts/app-layout';
import { useAuthGuard } from '@/hooks/useAuthGuard';

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
    useAuthGuard();

    const breadcrumbs = [
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

                        {/* Módulo de Configuración Checklist */}
                        <div className="mt-4 rounded-lg bg-white/40 dark:bg-gray-900/40 backdrop-blur-sm border border-amber-300 dark:border-amber-700 p-4">
                            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-100 mb-3">
                                MODULO DE CONFIGURACION
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white font-bold">✓</span>
                                    <span className="text-amber-800 dark:text-amber-200">DATOS DE LA NOTARIA </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white font-bold">✓</span>
                                    <span className="text-amber-800 dark:text-amber-200">USUARIOS </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white font-bold">✓</span>
                                    <span className="text-amber-800 dark:text-amber-200">CLIENTES </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white font-bold">✓</span>
                                    <span className="text-amber-800 dark:text-amber-200">ALTA CATALOGOS </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white font-bold">✓</span>
                                    <span className="text-amber-800 dark:text-amber-200">REPORTE USUARIOS </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-green-500 text-white font-bold">✓</span>
                                    <span className="text-amber-800 dark:text-amber-200">CONFIGURACION DE OPERACIONES </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs col-span-1 sm:col-span-2">
                                    <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-yellow-500 text-white font-bold text-xs">80%</span>
                                    <span className="text-amber-800 dark:text-amber-200">CONFIGURACIONES TARIFARIAS PARCIALMENTE</span>
                                </div>
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

                {/* Acceso Rápido - Botones Principales */}
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                    {/* Botón Expedientes */}
                    <Link href="/admin/control-notarial/expedientes" prefetch>
                        <div className="group h-full cursor-pointer rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100 p-6 hover:shadow-lg hover:border-blue-400 dark:border-blue-800 dark:from-blue-950/50 dark:to-blue-900/30 transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-center sm:justify-start">
                            <div className="flex-shrink-0 rounded-lg bg-blue-500 p-3 text-white shadow-md group-hover:bg-blue-600 transition-colors">
                                <FileText className="size-8" />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h3 className="text-lg sm:text-xl font-semibold text-blue-900 dark:text-blue-100 group-hover:text-blue-600 dark:group-hover:text-blue-200">
                                    Expedientes
                                </h3>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Gestionar expedientes y documentos
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Botón Recibos */}
                    <Link href="/admin/control-notarial/recibos" prefetch>
                        <div className="group h-full cursor-pointer rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100 p-6 hover:shadow-lg hover:border-purple-400 dark:border-purple-800 dark:from-purple-950/50 dark:to-purple-900/30 transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-center sm:justify-start">
                            <div className="flex-shrink-0 rounded-lg bg-purple-500 p-3 text-white shadow-md group-hover:bg-purple-600 transition-colors">
                                <Receipt className="size-8" />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h3 className="text-lg sm:text-xl font-semibold text-purple-900 dark:text-purple-100 group-hover:text-purple-600 dark:group-hover:text-purple-200">
                                    Recibos
                                </h3>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    Gestionar y visualizar recibos
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Botón Reportes del Sistema */}
                    <Link href="/admin/control-notarial/reportes" prefetch>
                        <div className="group h-full cursor-pointer rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 hover:shadow-lg hover:border-indigo-400 dark:border-indigo-800 dark:from-indigo-950/50 dark:to-indigo-900/30 transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-center sm:justify-start">
                            <div className="flex-shrink-0 rounded-lg bg-indigo-500 p-3 text-white shadow-md group-hover:bg-indigo-600 transition-colors">
                                <BarChart3 className="size-8" />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h3 className="text-lg sm:text-xl font-semibold text-indigo-900 dark:text-indigo-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-200">
                                    Reportes del Sistema
                                </h3>
                                <p className="text-sm text-indigo-700 dark:text-indigo-300">
                                    Análisis y reportes del sistema
                                </p>
                            </div>
                        </div>
                    </Link>

                    {/* Botón Configuración */}
                    <Link href="/admin/control-notarial/configuracion" prefetch>
                        <div className="group h-full cursor-pointer rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 hover:shadow-lg hover:border-emerald-400 dark:border-emerald-800 dark:from-emerald-950/50 dark:to-emerald-900/30 transition-all duration-200 flex flex-col sm:flex-row sm:items-center gap-4 justify-center sm:justify-start">
                            <div className="flex-shrink-0 rounded-lg bg-emerald-500 p-3 text-white shadow-md group-hover:bg-emerald-600 transition-colors">
                                <Settings className="size-8" />
                            </div>
                            <div className="text-center sm:text-left flex-1">
                                <h3 className="text-lg sm:text-xl font-semibold text-emerald-900 dark:text-emerald-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-200">
                                    Configuración
                                </h3>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                    Configurar notaría, usuarios y catálogos
                                </p>
                            </div>
                        </div>
                    </Link>
                </div>

            </div>

        </AppLayout>
    );
}
