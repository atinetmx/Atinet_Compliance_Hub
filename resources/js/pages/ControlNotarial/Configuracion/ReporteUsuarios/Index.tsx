import { Head } from '@inertiajs/react';
import { BarChart3, Download, Filter, MapPin } from 'lucide-react';
import React, { useState, useEffect } from 'react';import { useApi } from '@/services/api';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { handleControlNotarialResponse } from '@/helpers/controlNotarialResponse';
import { removeToken } from '@/services/authService';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';

// Función auxiliar para obtener la fecha de hoy en formato YYYY-MM-DD
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

export default function ControlNotarialReporteUsuarios() {
    // --- Estado Autenticación ---

    const { addToast } = useToast();
    const api = useApi();
    const [userId, setUserId] = useState('all');
    const [usuarios, setUsuarios] = useState<any[]>([]);
    const [filtroUsuario, setFiltroUsuario] = useState('');
    const [operacion, setOperacion] = useState('all');
    const [fechaInicio, setFechaInicio] = useState(getTodayDate());
    const [fechaFin, setFechaFin] = useState(getTodayDate());
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingUsuarios, setIsLoadingUsuarios] = useState(false);

    // Validar autenticación al montar
    useAuthGuard();

    // Cargar usuarios al montar el componente
    useEffect(() => {
        cargarUsuarios('');
    }, []);

    const cargarUsuarios = async (filtro: string) => {
        setIsLoadingUsuarios(true);
        try {
            const endpoint = '/User/GetUsuarios' + (filtro ? `?filtro=${encodeURIComponent(filtro)}` : '');
            const response = await api.get(endpoint);

            await handleControlNotarialResponse(response, {
            });

            // Si es 401, useAuthGuard maneja el toast
            if (response?.isUnauthorized) {
                setUsuarios([]);
            } else {
                const data = response?.dataResponse || [];
                if (response?.success !== false && Array.isArray(data)) {
                    setUsuarios(data);
                } else {
                    addToast(response?.message || 'Error al cargar usuarios', 'error');
                }
            }
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            addToast('Error al cargar usuarios', 'error');
        } finally {
            setIsLoadingUsuarios(false);
        }
    };

    const handleFiltroUsuarioChange = (valor: string) => {
        setFiltroUsuario(valor);
        cargarUsuarios(valor);
    };

    const handleGenerarReporte = async () => {
        setIsLoading(true);
        setPdfUrl(null);
        try {
            // Convertir fechas de formato YYYY-MM-DD a YYYY/MM/DD
            const convertirFecha = (fecha: string) => {
                if (!fecha) return '0';
                return fecha.replace(/-/g, '/');
            };

            // Construir URL con parámetros, omitiendo operacion si es 'all'
            const params = new URLSearchParams();
            params.append('userId', userId && userId !== 'all' ? userId : '0');
            if (operacion && operacion !== 'all') {
                params.append('operacion', operacion);
            }
            params.append('fechaInicio', convertirFecha(fechaInicio));
            params.append('fechaFin', convertirFecha(fechaFin));

            const endpoint = `/Bitacora/GenerateReporteBitacora?${params.toString()}`;
            console.log(`[DEBUG] Solicitando PDF a: ${endpoint}`);

            // Hacer fetch directo para obtener el PDF como blob
            // (Esta es una llamada especial que devuelve binario, no JSON)
            const token = localStorage.getItem('auth_token');
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const responseBlob = await fetch(api.baseUrl + endpoint, {
                method: 'GET',
                headers,
            });

            // Detectar 401 - el gateway renovará el token en la siguiente llamada
            if (responseBlob.status === 401) {
                removeToken();
                addToast('Tu sesión ha expirado. Por favor, intenta de nuevo.', 'error');
                return;
            }

            if (!responseBlob.ok) {
                throw new Error(`Error ${responseBlob.status}: ${responseBlob.statusText}`);
            }

            // Obtener el PDF como blob
            const pdfBlob = await responseBlob.blob();
            console.log(`[DEBUG] PDF recibido, tamaño: ${pdfBlob.size} bytes`);

            // Crear una URL para el blob
            const blobUrl = URL.createObjectURL(pdfBlob);
            setPdfUrl(blobUrl);
            addToast('Reporte generado correctamente', 'success');
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Error desconocido';
            console.error('[DEBUG] Error:', message);
            addToast(message, 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDescargarPDF = () => {
        if (!pdfUrl) {
            addToast('Primero debes generar un reporte', 'info');
            return;
        }

        // Descargar el PDF
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `Reporte_Bitacora_${new Date().toISOString().slice(0, 10)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <>
            <Head title="Reporte de Bitácora - Control Notarial" />
              <div className="space-y-6 px-6 pt-6">


                <div>
                    {/* Sección de Filtros */}
                    <div className="bg-background border rounded-lg p-6 space-y-6 mb-6">
                        <h2 className="text-lg font-semibold">Parámetros del Reporte</h2>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="usuario">Usuario</RequiredLabel>
                                <Select value={userId} onValueChange={setUserId}>
                                    <SelectTrigger id="usuario">
                                        <SelectValue placeholder={isLoadingUsuarios ? 'Cargando usuarios...' : 'Selecciona un usuario'} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos</SelectItem>
                                        {usuarios.map((usuario: any) => (
                                            <SelectItem key={usuario.id} value={String(usuario.id)}>
                                                {usuario.nombre || usuario.email}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="operacion">Operación</RequiredLabel>
                                <Select value={operacion} onValueChange={setOperacion}>
                                    <SelectTrigger id="operacion">
                                        <SelectValue placeholder="Selecciona una operación" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todo</SelectItem>
                                        <SelectItem value="create">Crear</SelectItem>
                                        <SelectItem value="update">Actualizar</SelectItem>
                                        <SelectItem value="delete">Eliminar</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="fecha-inicio">Fecha Inicio</RequiredLabel>
                                <Input
                                    id="fecha-inicio"
                                    type="date"
                                    value={fechaInicio}
                                    onChange={(e) => setFechaInicio(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <RequiredLabel htmlFor="fecha-fin">Fecha Fin</RequiredLabel>
                                <Input
                                    id="fecha-fin"
                                    type="date"
                                    value={fechaFin}
                                    onChange={(e) => setFechaFin(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end">
                            <Button
                                onClick={handleGenerarReporte}
                                disabled={isLoading}
                                className="gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                {isLoading ? 'Generando...' : 'Generar Reporte'}
                            </Button>
                            {pdfUrl && (
                                <Button
                                    variant="outline"
                                    onClick={handleDescargarPDF}
                                    className="gap-2"
                                >
                                    <Download className="h-4 w-4" />
                                    Descargar PDF
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Previsualización del PDF */}
                    {pdfUrl && (
                        <div className="bg-background border rounded-lg p-6">
                            <h2 className="text-lg font-semibold mb-4">Previsualización</h2>
                            <div className="w-full bg-gray-100 rounded-lg overflow-hidden">
                                <iframe
                                    src={pdfUrl}
                                    title="Previsualización de PDF"
                                    className="w-full h-[700px] border-0"
                                />
                            </div>
                        </div>
                    )}

                    {!pdfUrl && (
                        <div className="bg-background border rounded-lg p-12 text-center">
                            <MapPin className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                            <h3 className="text-lg font-semibold mb-2">Sin reporte generado</h3>
                            <p className="text-muted-foreground">
                                Completa los parámetros y haz clic en "Generar Reporte" para ver la previsualización
                            </p>
                        </div>
                    )}
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

