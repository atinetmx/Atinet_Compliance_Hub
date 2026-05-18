import { Head, Link, useForm } from '@inertiajs/react';
import {
    Settings,
    Database,
    HardDrive,
    Zap,
    Trash2,
    RotateCcw,
    FileText,
    Info,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Props {
    systemInfo: {
        laravel_version: string;
        php_version: string;
        app_name: string;
        app_env: string;
        database_connection: string;
        cache_driver: string;
        queue_driver: string;
    };
    stats: {
        total_storage: string;
        free_storage: string;
        database_size: string;
        log_files: Array<{
            name: string;
            size: string;
            modified: string;
        }>;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administración', href: '/admin' },
    { title: 'Configuración', href: '/admin/settings', icon: Settings },
];

export default function Index({ systemInfo, stats }: Props) {
    const [isClearing, setIsClearing] = useState<string | null>(null);
    const [isOptimizing, setIsOptimizing] = useState(false);

    const { setData, post } = useForm({
        type: '',
    });

    const clearCache = (type: string) => {
        setIsClearing(type);
        setData('type', type);
        post('/admin/settings/cache/clear', {
            onFinish: () => setIsClearing(null),
            onError: () => setIsClearing(null),
        });
    };

    const optimizeApp = () => {
        setIsOptimizing(true);
        post('/admin/settings/optimize', {
            onFinish: () => setIsOptimizing(false),
            onError: () => setIsOptimizing(false),
        });
    };

    const getEnvironmentBadgeColor = (env: string) => {
        switch (env) {
            case 'production':
                return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400';
            case 'staging':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400';
            case 'local':
                return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Configuración del Sistema" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-end">
                    <div className="flex items-center gap-2">
                        <Link href="/admin/settings/logs">
                            <Button variant="outline">
                                <FileText className="mr-2 h-4 w-4" />
                                Ver Logs
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* System Information */}
                <div className="rounded-lg border bg-background p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <Info className="h-5 w-5 text-primary" />
                        Información del Sistema
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Aplicación
                            </label>
                            <div className="rounded bg-muted/50 p-2 font-mono text-sm">
                                {systemInfo.app_name}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Entorno
                            </label>
                            <div>
                                <Badge
                                    className={getEnvironmentBadgeColor(
                                        systemInfo.app_env,
                                    )}
                                >
                                    {systemInfo.app_env.toUpperCase()}
                                </Badge>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Laravel
                            </label>
                            <div className="rounded bg-muted/50 p-2 font-mono text-sm">
                                v{systemInfo.laravel_version}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                PHP
                            </label>
                            <div className="rounded bg-muted/50 p-2 font-mono text-sm">
                                v{systemInfo.php_version}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Base de Datos
                            </label>
                            <div className="rounded bg-muted/50 p-2 font-mono text-sm">
                                {systemInfo.database_connection}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">
                                Cache
                            </label>
                            <div className="rounded bg-muted/50 p-2 font-mono text-sm">
                                {systemInfo.cache_driver}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Storage Information */}
                <div className="rounded-lg border bg-background p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <HardDrive className="h-5 w-5 text-primary" />
                        Información de Almacenamiento
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <div className="rounded-lg bg-muted/30 p-4 text-center">
                            <div className="text-2xl font-bold text-primary">
                                {stats.total_storage}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Almacenamiento Total
                            </div>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-4 text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {stats.free_storage}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Espacio Libre
                            </div>
                        </div>
                        <div className="rounded-lg bg-muted/30 p-4 text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {stats.database_size}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                Tamaño BD
                            </div>
                        </div>
                    </div>
                </div>

                {/* Cache Management */}
                <div className="rounded-lg border bg-background p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <Database className="h-5 w-5 text-primary" />
                        Gestión de Cache
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Button
                            variant="outline"
                            onClick={() => clearCache('config')}
                            disabled={isClearing === 'config'}
                            className="justify-start"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isClearing === 'config'
                                ? 'Limpiando...'
                                : 'Cache Config'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => clearCache('route')}
                            disabled={isClearing === 'route'}
                            className="justify-start"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isClearing === 'route'
                                ? 'Limpiando...'
                                : 'Cache Rutas'}
                        </Button>

                        <Button
                            variant="outline"
                            onClick={() => clearCache('view')}
                            disabled={isClearing === 'view'}
                            className="justify-start"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isClearing === 'view'
                                ? 'Limpiando...'
                                : 'Cache Vistas'}
                        </Button>

                        <Button
                            variant="destructive"
                            onClick={() => clearCache('all')}
                            disabled={isClearing === 'all'}
                            className="justify-start"
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {isClearing === 'all'
                                ? 'Limpiando...'
                                : 'Limpiar Todo'}
                        </Button>
                    </div>
                </div>

                {/* Application Optimization */}
                <div className="rounded-lg border bg-background p-6">
                    <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
                        <Zap className="h-5 w-5 text-primary" />
                        Optimización
                    </h3>
                    <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Optimiza la aplicación para mejorar el rendimiento.
                            Esto incluye cache de configuración, rutas y vistas.
                        </p>
                        <Button
                            onClick={optimizeApp}
                            disabled={isOptimizing}
                            className="w-full md:w-auto"
                        >
                            <RotateCcw
                                className={`mr-2 h-4 w-4 ${isOptimizing ? 'animate-spin' : ''}`}
                            />
                            {isOptimizing
                                ? 'Optimizando...'
                                : 'Optimizar Aplicación'}
                        </Button>
                    </div>
                </div>

                {/* Log Files */}
                <div className="rounded-lg border bg-background p-6">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-lg font-semibold">
                            <FileText className="h-5 w-5 text-primary" />
                            Archivos de Log
                        </h3>
                        <Link href="/admin/settings/logs">
                            <Button variant="outline" size="sm">
                                Ver Todos
                            </Button>
                        </Link>
                    </div>

                    {stats.log_files.length > 0 ? (
                        <div className="space-y-2">
                            {stats.log_files.slice(0, 5).map((file) => (
                                <div
                                    key={file.name}
                                    className="flex items-center justify-between rounded-lg bg-muted/30 p-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <div className="font-medium">
                                                {file.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                Modificado: {file.modified}
                                            </div>
                                        </div>
                                    </div>
                                    <Badge variant="secondary">
                                        {file.size}
                                    </Badge>
                                </div>
                            ))}

                            {stats.log_files.length > 5 && (
                                <div className="pt-2 text-center">
                                    <Link href="/admin/settings/logs">
                                        <Button variant="ghost" size="sm">
                                            Ver {stats.log_files.length - 5}{' '}
                                            archivos más
                                        </Button>
                                    </Link>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-8 text-center text-muted-foreground">
                            No hay archivos de log disponibles
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
