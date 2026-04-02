import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    FileText,
    RefreshCw,
    Search,
    Calendar,
    AlertTriangle,
    Info,
} from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

interface Props {
    logs: string[];
    currentFile: string;
    availableLogs: Array<{
        name: string;
        size: string;
        modified: string;
    }>;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Administración', href: '/admin' },
    { title: 'Configuración', href: '/admin/settings' },
    { title: 'Logs', href: '/admin/settings/logs', icon: FileText },
];

export default function Logs({ logs, currentFile, availableLogs }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = logs.filter((log) =>
        log.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const switchLogFile = (filename: string) => {
        router.get(`/admin/settings/logs?file=${filename}`);
    };

    const getLogLevelBadge = (line: string) => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('error')) {
            return (
                <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">
                    ERROR
                </Badge>
            );
        } else if (lowerLine.includes('warning')) {
            return (
                <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">
                    WARNING
                </Badge>
            );
        } else if (lowerLine.includes('info')) {
            return (
                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                    INFO
                </Badge>
            );
        } else if (lowerLine.includes('debug')) {
            return (
                <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
                    DEBUG
                </Badge>
            );
        }
        return null;
    };

    const formatLogLine = (line: string) => {
        // Extract timestamp if present
        const timestampMatch = line.match(
            /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/,
        );
        const hasTimestamp = timestampMatch !== null;

        return {
            timestamp: hasTimestamp ? timestampMatch[1] : null,
            content: hasTimestamp
                ? line.substring(timestampMatch[0].length).trim()
                : line,
            level: getLogLevelBadge(line),
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Logs del Sistema" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Link href="/admin/settings">
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver a Configuración
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Actualizar
                    </Button>
                </div>

                {/* Log File Selector and Search */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Available Log Files */}
                    <div className="rounded-lg border bg-background p-4">
                        <h3 className="mb-4 flex items-center gap-2 font-semibold">
                            <FileText className="h-4 w-4" />
                            Archivos de Log
                        </h3>
                        <div className="space-y-2">
                            {availableLogs.map((file) => (
                                <button
                                    key={file.name}
                                    onClick={() => switchLogFile(file.name)}
                                    className={`w-full rounded-lg border p-3 text-left transition-colors ${
                                        file.name === currentFile
                                            ? 'border-primary bg-primary/10 text-primary'
                                            : 'border-transparent bg-muted/30 hover:bg-muted/50'
                                    }`}
                                >
                                    <div className="mb-1 flex items-center justify-between">
                                        <span className="text-sm font-medium">
                                            {file.name}
                                        </span>
                                        <Badge
                                            variant="secondary"
                                            className="text-xs"
                                        >
                                            {file.size}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <Calendar className="h-3 w-3" />
                                        {file.modified}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search and Current File Info */}
                    <div className="space-y-4 lg:col-span-2">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Current File Info */}
                        <div className="rounded-lg border bg-background p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">
                                        Archivo Actual: {currentFile}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        Mostrando las últimas {logs.length}{' '}
                                        líneas
                                        {searchTerm &&
                                            ` (filtrado: ${filteredLogs.length} resultados)`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Log Content */}
                <div className="rounded-lg border bg-background">
                    <div className="border-b p-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-semibold">Contenido del Log</h3>
                            {logs.length === 0 && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Info className="h-4 w-4" />
                                    Archivo vacío o no encontrado
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="max-h-150 overflow-y-auto">
                        {filteredLogs.length > 0 ? (
                            <div className="divide-y divide-border">
                                {filteredLogs.map((line, index) => {
                                    if (!line.trim()) return null;

                                    const formatted = formatLogLine(line);
                                    const isError = line
                                        .toLowerCase()
                                        .includes('error');
                                    const isWarning = line
                                        .toLowerCase()
                                        .includes('warning');

                                    return (
                                        <div
                                            key={index}
                                            className={`p-3 font-mono text-sm ${
                                                isError
                                                    ? 'bg-red-50/50 dark:bg-red-950/20'
                                                    : isWarning
                                                      ? 'bg-yellow-50/50 dark:bg-yellow-950/20'
                                                      : 'hover:bg-muted/30'
                                            }`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <span className="w-8 text-xs text-muted-foreground select-none">
                                                    {logs.length - index}
                                                </span>

                                                {formatted.level && (
                                                    <div className="flex-shrink-0">
                                                        {formatted.level}
                                                    </div>
                                                )}

                                                {formatted.timestamp && (
                                                    <span className="flex-shrink-0 text-xs text-blue-600 dark:text-blue-400">
                                                        {formatted.timestamp}
                                                    </span>
                                                )}

                                                <div className="flex-1 break-all">
                                                    {searchTerm ? (
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: formatted.content.replace(
                                                                    new RegExp(
                                                                        `(${searchTerm})`,
                                                                        'gi',
                                                                    ),
                                                                    '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>',
                                                                ),
                                                            }}
                                                        />
                                                    ) : (
                                                        formatted.content
                                                    )}
                                                </div>

                                                {isError && (
                                                    <AlertTriangle className="h-4 w-4 flex-shrink-0 text-red-500" />
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                {searchTerm ? (
                                    <div>
                                        <Search className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                        <p>
                                            No se encontraron resultados para "
                                            {searchTerm}"
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <FileText className="mx-auto mb-2 h-8 w-8 opacity-50" />
                                        <p>Este archivo de log está vacío</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
