import React, { useState, useEffect, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, CheckCircle2, MoreHorizontal, Loader2 } from 'lucide-react';
import { useApi } from '@/services/api';
import { useToast } from '@/contexts/ToastContext';
import { handleControlNotarialResponse } from '@/helpers/controlNotarialResponse';

interface ProcesosFormProps {
    formData: any;
    currentExpedienteId?: number;
}

export default function ProcesosForm(props: ProcesosFormProps) {
    const api = useApi();
    const { addToast } = useToast();
    const [etapas, setEtapas] = useState<any[]>([]);
    const [cargandoEtapas, setCargandoEtapas] = useState(false);
    const [etapasEditadas, setEtapasEditadas] = useState<Record<string, any>>({});
    const debounceTimersRef = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

    // Cleanup timers al desmontar
    useEffect(() => {
        return () => {
            Object.values(debounceTimersRef.current).forEach(timer => clearTimeout(timer));
        };
    }, []);

    // Cargar etapas al montar el componente
    useEffect(() => {
        if (props.currentExpedienteId) {
            fetchEtapas();
        }
    }, [props.currentExpedienteId]);

    const fetchEtapas = async () => {
        try {
            setCargandoEtapas(true);
            const response = await api.get(`/Expediente/GetEtapasXExpediente?expedienteId=${props.currentExpedienteId}`);
            if (response?.dataResponse) {
                setEtapas(response.dataResponse);
            } else {
                addToast('Error al cargar las etapas', 'error');
            }
        } catch (error) {
            addToast('No se pudieron cargar las etapas del expediente', 'error');
            console.error('Error:', error);
        } finally {
            setCargandoEtapas(false);
        }
    };

    // Helper para formatear fechas para input type="date"
    const formatearFechaInput = (fecha: string | null): string => {
        if (!fecha) return '';
        // Si ya está en formato YYYY-MM-DD, retornar como está
        if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return fecha;
        }
        // Si tiene más información (como timestamp), extraer solo la parte de fecha
        if (fecha.includes('T')) {
            return fecha.split('T')[0];
        }
        return fecha;
    };

    const handleActualizarEtapaIndividual = async (
        etapaId: number,
        datosCompletos: {
            fecha_Inicio: string | null;
            fecha_Fin: string | null;
            observaciones: string | null;
        }
    ) => {
        try {
            // Función helper para formatear fechas
            const formatearFecha = (fecha: string | null): string | null => {
                if (!fecha) return null;
                // Si ya está en formato YYYY-MM-DD, retornar como está
                if (fecha.match(/^\d{4}-\d{2}-\d{2}$/)) {
                    return fecha;
                }
                // Si tiene más información (como timestamp), extraer solo la parte de fecha
                if (fecha.includes('T')) {
                    return fecha.split('T')[0];
                }
                return fecha;
            };

            const payload = {
                fecha_Inicio: formatearFecha(datosCompletos.fecha_Inicio),
                usuario_Inicio_Id: 0,
                fecha_Fin: formatearFecha(datosCompletos.fecha_Fin),
                usuario_Fin_Id: 0,
                observaciones: datosCompletos.observaciones,
            };

            console.log('Payload enviado:', payload);

            const data = await api.put(
                `/Expediente/UpdateEtapaXExpediente?etapaId=${etapaId}`,
                payload
            );

            await handleControlNotarialResponse(data, {
                onUnauthorized: () => {
                    addToast('No autorizado para actualizar etapas', 'error');
                },
            });

            if (data?.isUnauthorized) {
                return;
            }

            if (data?.success !== false) {
                addToast('Etapa actualizada exitosamente', 'success');
                console.log(`Etapa ${etapaId} actualizada exitosamente`);
            } else {
                addToast(data?.message || 'Error al actualizar etapa', 'error');
                console.error(`Error al actualizar etapa ${etapaId}:`, data?.message);
            }
        } catch (error) {
            addToast('Error al actualizar la etapa', 'error');
            console.error('Error:', error);
        }
    };

    const handleEtapaChange = (etapaId: number, field: string, value: any) => {
        // Actualizar el estado local
        setEtapasEditadas(prev => ({
            ...prev,
            [etapaId]: {
                ...prev[etapaId],
                [field]: value
            }
        }));

        // Si no hay expediente ID aún, no ejecutar API
        if (!props.currentExpedienteId) return;

        // Limpiar timer anterior para esta etapa específica
        if (debounceTimersRef.current[etapaId]) {
            clearTimeout(debounceTimersRef.current[etapaId]);
        }

        // Crear nuevo timer para esta etapa
        debounceTimersRef.current[etapaId] = setTimeout(() => {
            // Obtener la etapa original
            const etapaOriginal = etapas.find(e => e.id === etapaId);
            if (!etapaOriginal) return;

            // Obtener datos editados con valores originales como defaults
            const etapaEditada = etapasEditadas[etapaId] || {
                fecha_Inicio: etapaOriginal.fecha_Inicio,
                fecha_Fin: etapaOriginal.fecha_Fin,
                observaciones: etapaOriginal.observaciones,
            };

            // Combinar datos editados con el campo actual
            handleActualizarEtapaIndividual(etapaId, {
                ...etapaEditada,
                [field]: value
            });

            // Limpiar timer del registro
            delete debounceTimersRef.current[etapaId];
        }, 1000);
    };

    return (
        <div className="space-y-4">
            <Tabs defaultValue="etapas" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 mb-4 p-1">
                    <TabsTrigger value="etapas" className="gap-2">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Etapas del Expediente</span>
                        <span className="sm:hidden text-xs">Etapas</span>
                    </TabsTrigger>
                    <TabsTrigger value="solicitud" className="gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Solicitud de Trámite</span>
                        <span className="sm:hidden text-xs">Solicitud</span>
                    </TabsTrigger>
                    <TabsTrigger value="otros" className="gap-2">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="hidden sm:inline">Otros</span>
                        <span className="sm:hidden text-xs">Otros</span>
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Etapas del Expediente */}
                <TabsContent value="etapas" className="border-t pt-6">
                    {cargandoEtapas ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="ml-2 text-sm text-muted-foreground">Cargando etapas...</span>
                        </div>
                    ) : etapas.length === 0 ? (
                        <div className="border rounded-lg p-8 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center min-h-75">
                            <p className="text-muted-foreground text-center">No hay etapas disponibles para este expediente.</p>
                        </div>
                    ) : (
                        <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-125 overflow-y-auto">
                                <table className="w-full text-sm">
                                    <thead className="sticky top-0 z-10 bg-slate-400 dark:bg-slate-800 border-b uppercase">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Etapa</th>
                                            <th className="px-2 py-2 text-center">Fecha Inicio</th>
                                            <th className="px-2 py-2 text-center">Usuario Inicio</th>
                                            <th className="px-2 py-2 text-center">Fecha Fin</th>
                                            <th className="px-2 py-2 text-center">Usuario Fin</th>
                                            <th className="px-3 py-2 text-left">Observaciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {etapas.map((etapa) => {
                                            const etapaEditada = etapasEditadas[etapa.id] || {
                                                etapa: etapa.etapa,
                                                fecha_Inicio: etapa.fecha_Inicio,
                                                usuario_Inicio: etapa.usuario_Inicio,
                                                fecha_Fin: etapa.fecha_Fin,
                                                usuario_Fin: etapa.usuario_Fin,
                                                observaciones: etapa.observaciones,
                                            };
                                            return (
                                                <tr key={etapa.id} className="border-b hover:bg-slate-50 dark:hover:bg-slate-800/30">
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={etapa.etapa}
                                                            readOnly
                                                            className="w-full px-2 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <input
                                                            type="date"
                                                            value={formatearFechaInput(etapaEditada.fecha_Inicio) || formatearFechaInput(etapa.fecha_Inicio) || ''}
                                                            onChange={(e) => handleEtapaChange(etapa.id, 'fecha_Inicio', e.target.value || null)}
                                                            className="w-full px-2 py-1 border rounded text-sm bg-background text-center"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <input
                                                            type="text"
                                                            value={etapaEditada.usuario_Inicio || etapa.usuario_Inicio || ''}
                                                            readOnly
                                                            placeholder="-"
                                                            className="w-full px-2 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-center"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <input
                                                            type="date"
                                                            value={formatearFechaInput(etapaEditada.fecha_Fin) || formatearFechaInput(etapa.fecha_Fin) || ''}
                                                            onChange={(e) => handleEtapaChange(etapa.id, 'fecha_Fin', e.target.value || null)}
                                                            className="w-full px-2 py-1 border rounded text-sm bg-background text-center"
                                                        />
                                                    </td>
                                                    <td className="px-2 py-2 text-center">
                                                        <input
                                                            type="text"
                                                            value={etapaEditada.usuario_Fin || etapa.usuario_Fin || ''}
                                                            readOnly
                                                            placeholder="-"
                                                            className="w-full px-2 py-1 border rounded text-sm bg-gray-100 dark:bg-gray-700 cursor-not-allowed text-center"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            type="text"
                                                            value={etapaEditada.observaciones || etapa.observaciones || ''}
                                                            onChange={(e) => handleEtapaChange(etapa.id, 'observaciones', e.target.value || null)}
                                                            placeholder="-"
                                                            className="w-full px-2 py-1 border rounded text-sm bg-background"
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </TabsContent>

                {/* Tab 2: Solicitud de Trámite */}
                <TabsContent value="solicitud" className="border-t pt-6">
                    <div className="border rounded-lg p-8 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center min-h-75">
                        <p className="text-muted-foreground text-center">Contenido de Solicitud de Trámite</p>
                    </div>
                </TabsContent>

                {/* Tab 3: Otros */}
                <TabsContent value="otros" className="border-t pt-6">
                    <div className="border rounded-lg p-8 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center min-h-75">
                        <p className="text-muted-foreground text-center">Contenido de Otros</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
