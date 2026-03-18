import { Head } from '@inertiajs/react';
import { BarChart3, Download, Filter } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

export default function ControlNotarialReporteUsuarios() {
    const [filtroEmail, setFiltroEmail] = useState('');
    const [filtroNombre, setFiltroNombre] = useState('');
    const [reportData, setReportData] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerarReporte = async () => {
        setIsLoading(true);
        try {
            // Aquí iría la lógica para traer datos de usuarios
            const response = await fetch(`/api/usuarios/reporte`, {
                headers: { 'Content-Type': 'application/json' },
            });
            const data = await response.json();
            if (data.dataResponse) {
                setReportData(data.dataResponse);
            }
        } catch (error) {
            console.error('Error al generar reporte:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDescargarPDF = () => {
        // Lógica para descargar reporte como PDF
        console.log('Descargando reporte como PDF...');
    };

    const handleDescargarExcel = () => {
        // Lógica para descargar reporte como Excel
        console.log('Descargando reporte como Excel...');
    };

    // Filtrar datos
    const datosFiltrados = reportData.filter(usuario =>
        (usuario.email?.toLowerCase().includes(filtroEmail.toLowerCase()) || true) &&
        (usuario.nombre?.toLowerCase().includes(filtroNombre.toLowerCase()) || true)
    );

    return (
        <>
            <Head title="Reporte de Usuarios - Control Notarial" />

            <div className="space-y-8">
                <div className="pb-8 border-b px-6">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="rounded-lg bg-orange-500 p-3 text-white">
                            <BarChart3 className="size-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Reporte de Usuarios</h1>
                            <p className="text-muted-foreground">Análisis y estadísticas de usuarios del sistema</p>
                        </div>
                    </div>
                </div>

                <div className="px-6">
                    {/* Sección de Filtros */}
                    <div className="bg-background border rounded-lg p-6 space-y-6 mb-6">
                        <h2 className="text-lg font-semibold">Filtros</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="filtro-nombre">Nombre</Label>
                                <Input
                                    id="filtro-nombre"
                                    placeholder="Buscar por nombre..."
                                    value={filtroNombre}
                                    onChange={(e) => setFiltroNombre(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="filtro-email">Email</Label>
                                <Input
                                    id="filtro-email"
                                    type="email"
                                    placeholder="Buscar por email..."
                                    value={filtroEmail}
                                    onChange={(e) => setFiltroEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                onClick={handleGenerarReporte}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                {isLoading ? 'Generando...' : 'Generar Reporte'}
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDescargarPDF}
                                disabled={reportData.length === 0}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Descargar PDF
                            </Button>
                            <Button
                                variant="outline"
                                onClick={handleDescargarExcel}
                                disabled={reportData.length === 0}
                                className="gap-2"
                            >
                                <Download className="h-4 w-4" />
                                Descargar Excel
                            </Button>
                        </div>
                    </div>

                    {/* Tabla de Resultados */}
                    <div className="bg-background border rounded-lg p-6">
                        <h2 className="text-lg font-semibold mb-4">Resultados</h2>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>ID</TableHead>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Fecha Creación</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {datosFiltrados.length > 0 ? (
                                        datosFiltrados.map((usuario) => (
                                            <TableRow key={usuario.id}>
                                                <TableCell className="font-medium">{usuario.id}</TableCell>
                                                <TableCell>{usuario.nombre}</TableCell>
                                                <TableCell>{usuario.email}</TableCell>
                                                <TableCell>{usuario.rol}</TableCell>
                                                <TableCell>
                                                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                        usuario.activo
                                                            ? 'bg-green-100 text-green-800'
                                                            : 'bg-red-100 text-red-800'
                                                    }`}>
                                                        {usuario.activo ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>{usuario.created_at}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                {reportData.length === 0 ? 'Haz clic en "Generar Reporte" para ver resultados' : 'No hay resultados que coincidan con los filtros'}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {datosFiltrados.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-4">
                                Total: <span className="text-amber-600 font-semibold">{datosFiltrados.length}</span> usuario(s)
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

ControlNotarialReporteUsuarios.layout = (page: React.ReactNode) => (
    <AppLayout breadcrumbs={[
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
        {
            title: 'Reporte de Usuarios',
            href: '/admin/control-notarial/reporte-usuarios',
        },
    ]}>
        {page}
    </AppLayout>
);
