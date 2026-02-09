import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, FileText, RefreshCw, Search, Calendar, AlertTriangle, Info } from 'lucide-react';
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
    { title: 'Logs', href: '/admin/settings/logs' },
];

export default function Logs({ logs, currentFile, availableLogs }: Props) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredLogs = logs.filter(log =>
        log.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const switchLogFile = (filename: string) => {
        router.get(`/admin/settings/logs?file=${filename}`);
    };

    const getLogLevelBadge = (line: string) => {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('error')) {
            return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">ERROR</Badge>;
        } else if (lowerLine.includes('warning')) {
            return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">WARNING</Badge>;
        } else if (lowerLine.includes('info')) {
            return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">INFO</Badge>;
        } else if (lowerLine.includes('debug')) {
            return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400">DEBUG</Badge>;
        }
        return null;
    };

    const formatLogLine = (line: string) => {
        // Extract timestamp if present
        const timestampMatch = line.match(/^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/);
        const hasTimestamp = timestampMatch !== null;

        return {
            timestamp: hasTimestamp ? timestampMatch[1] : null,
            content: hasTimestamp ? line.substring(timestampMatch[0].length).trim() : line,
            level: getLogLevelBadge(line)
        };
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Logs del Sistema" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/admin/settings">
                            <Button variant="outline" size="sm">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Volver
                            </Button>
                        </Link>
                        <div className="flex items-center gap-2">
                            <FileText className="h-6 w-6 text-primary" />
                            <h1 className="text-2xl font-bold">Logs del Sistema</h1>
                        </div>
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => window.location.reload()}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Actualizar
                    </Button>
                </div>

                {/* Log File Selector and Search */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Available Log Files */}
                    <div className="bg-background border rounded-lg p-4">
                        <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Archivos de Log
                        </h3>
                        <div className="space-y-2">
                            {availableLogs.map((file) => (
                                <button
                                    key={file.name}
                                    onClick={() => switchLogFile(file.name)}
                                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                                        file.name === currentFile
                                            ? 'bg-primary/10 border-primary text-primary'
                                            : 'bg-muted/30 hover:bg-muted/50 border-transparent'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-sm">{file.name}</span>
                                        <Badge variant="secondary" className="text-xs">
                                            {file.size}
                                        </Badge>
                                    </div>
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {file.modified}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Search and Current File Info */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                placeholder="Buscar en logs..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>

                        {/* Current File Info */}
                        <div className="bg-background border rounded-lg p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-semibold">Archivo Actual: {currentFile}</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Mostrando las últimas {logs.length} líneas
                                        {searchTerm && ` (filtrado: ${filteredLogs.length} resultados)`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Log Content */}
                <div className="bg-background border rounded-lg">
                    <div className="p-4 border-b">
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

                    <div className="max-h-[600px] overflow-y-auto">
                        {filteredLogs.length > 0 ? (
                            <div className="divide-y divide-border">
                                {filteredLogs.map((line, index) => {
                                    if (!line.trim()) return null;

                                    const formatted = formatLogLine(line);
                                    const isError = line.toLowerCase().includes('error');
                                    const isWarning = line.toLowerCase().includes('warning');

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
                                                <span className="text-xs text-muted-foreground select-none w-8">
                                                    {logs.length - index}
                                                </span>

                                                {formatted.level && (
                                                    <div className="flex-shrink-0">
                                                        {formatted.level}
                                                    </div>
                                                )}

                                                {formatted.timestamp && (
                                                    <span className="text-xs text-blue-600 dark:text-blue-400 flex-shrink-0">
                                                        {formatted.timestamp}
                                                    </span>
                                                )}

                                                <div className="flex-1 break-all">
                                                    {searchTerm ? (
                                                        <span
                                                            dangerouslySetInnerHTML={{
                                                                __html: formatted.content.replace(
                                                                    new RegExp(`(${searchTerm})`, 'gi'),
                                                                    '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
                                                                )
                                                            }}
                                                        />
                                                    ) : (
                                                        formatted.content
                                                    )}
                                                </div>

                                                {isError && (
                                                    <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
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
                                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No se encontraron resultados para "{searchTerm}"</p>
                                    </div>
                                ) : (
                                    <div>
                                        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
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
