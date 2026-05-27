import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileSpreadsheet, Printer, ArrowLeft } from 'lucide-react';
import { useState } from 'react';
import * as ReportsController from '@/actions/App/Http/Controllers/Admin/ReportsController';
import type { BreadcrumbItem } from '@/types';

interface PreviewProps {
    reportType: 'usage' | 'notarias' | 'services';
    data: any[];
    period: string;
    periodLabel: string;
    notariaId?: number;
    notariaName?: string;
    serviceCode?: string;
    totalRecords: number;
    generatedAt: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Reportes',
        href: ReportsController.index.url(),
    },
    {
        title: 'Vista Previa',
    },
];

export default function Preview({
    reportType,
    data,
    period,
    periodLabel,
    notariaId,
    notariaName,
    serviceCode,
    totalRecords,
    generatedAt,
}: PreviewProps) {
    const [isExporting, setIsExporting] = useState(false);

    const getReportTitle = () => {
        switch (reportType) {
            case 'usage':
                return 'Reporte de Uso Detallado';
            case 'notarias':
                return 'Reporte de Notarías';
            case 'services':
                return 'Reporte de Servicios';
            default:
                return 'Vista Previa del Reporte';
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const response = await fetch(ReportsController.export.url(), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    type: reportType,
                    period,
                    notaria_id: notariaId,
                    service_code: serviceCode,
                }),
            });

            if (!response.ok) throw new Error('Error al exportar');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte_${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error al exportar:', error);
            alert('Error al exportar el reporte');
        } finally {
            setIsExporting(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleBack = () => {
        router.get('/admin/reports/service-usage');
    };

    const renderUsageTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Fecha y Hora</TableHead>
                    <TableHead>Notaría</TableHead>
                    <TableHead>Servicio</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead className="text-center">Cantidad</TableHead>
                    <TableHead className="text-right">Costo ($)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No hay datos para mostrar
                        </TableCell>
                    </TableRow>
                ) : (
                    data.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell>{row.consumed_at}</TableCell>
                            <TableCell>{row.notaria_nombre}</TableCell>
                            <TableCell>{row.service_name}</TableCell>
                            <TableCell>{row.user_name}</TableCell>
                            <TableCell className="text-center">{row.quantity}</TableCell>
                            <TableCell className="text-right">${row.cost}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    const renderNotariasTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Notaría</TableHead>
                    <TableHead className="text-center">Total Solicitudes</TableHead>
                    <TableHead className="text-center">Cantidad Total</TableHead>
                    <TableHead className="text-right">Costo Total ($)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No hay datos para mostrar
                        </TableCell>
                    </TableRow>
                ) : (
                    data.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell>{row.nombre}</TableCell>
                            <TableCell className="text-center">{row.total_requests}</TableCell>
                            <TableCell className="text-center">{row.total_quantity}</TableCell>
                            <TableCell className="text-right">${row.total_cost}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    const renderServicesTable = () => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Servicio</TableHead>
                    <TableHead className="text-center">Total Solicitudes</TableHead>
                    <TableHead className="text-center">Cantidad Total</TableHead>
                    <TableHead className="text-right">Costo Total ($)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No hay datos para mostrar
                        </TableCell>
                    </TableRow>
                ) : (
                    data.map((row, index) => (
                        <TableRow key={index}>
                            <TableCell>{row.name}</TableCell>
                            <TableCell className="text-center">{row.total_requests}</TableCell>
                            <TableCell className="text-center">{row.total_quantity}</TableCell>
                            <TableCell className="text-right">${row.total_cost}</TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    const renderTable = () => {
        switch (reportType) {
            case 'usage':
                return renderUsageTable();
            case 'notarias':
                return renderNotariasTable();
            case 'services':
                return renderServicesTable();
            default:
                return null;
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Vista Previa del Reporte" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl space-y-6 sm:px-6 lg:px-8">
                {/* Header con botones de acción */}
                <div className="flex items-center justify-between print:hidden">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{getReportTitle()}</h1>
                        <p className="text-muted-foreground">Vista previa antes de exportar o imprimir</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleBack}>
                            <ArrowLeft className="h-4 w-4" />
                            Volver
                        </Button>
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="h-4 w-4" />
                            Imprimir
                        </Button>
                        <Button onClick={handleExport} disabled={isExporting}>
                            {isExporting ? (
                                <>Exportando...</>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    Descargar Excel
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Información del reporte */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-blue-600">{getReportTitle()}</CardTitle>
                        <CardDescription>Atinet Compliance Hub</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
                            <div>
                                <p className="font-semibold text-muted-foreground">Período:</p>
                                <p>{periodLabel}</p>
                            </div>
                            {notariaName && (
                                <div>
                                    <p className="font-semibold text-muted-foreground">Notaría:</p>
                                    <p>{notariaName}</p>
                                </div>
                            )}
                            <div>
                                <p className="font-semibold text-muted-foreground">Generado:</p>
                                <p>{generatedAt}</p>
                            </div>
                            <div>
                                <p className="font-semibold text-muted-foreground">Total Registros:</p>
                                <p className="font-semibold">{totalRecords}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de datos */}
                <Card>
                    <CardContent className="p-0">
                        <div className="overflow-auto">{renderTable()}</div>
                    </CardContent>
                </Card>

                {/* Resumen */}
                {totalRecords > 0 && (
                    <Card className="print:break-before-page">
                        <CardHeader>
                            <CardTitle className="text-lg text-blue-600">Resumen del Reporte</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Este reporte contiene {totalRecords} registro{totalRecords !== 1 ? 's' : ''} de{' '}
                                {reportType === 'usage'
                                    ? 'uso de servicios'
                                    : reportType === 'notarias'
                                      ? 'estadísticas por notaría'
                                      : 'estadísticas por servicio'}{' '}
                                para el período seleccionado ({periodLabel}). Los datos fueron generados el {generatedAt}.
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
            </div>

            {/* Estilos para impresión */}
            <style>{`
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:break-before-page {
                        break-before: page;
                    }
                    @page {
                        margin: 2cm;
                    }
                }
            `}</style>
        </AppLayout>
    );
}
