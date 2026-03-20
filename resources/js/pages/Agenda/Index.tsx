import type { EventApi, EventClickArg, EventDropArg, EventMountArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import type { DateClickArg, EventResizeDoneArg } from '@fullcalendar/interaction';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import FullCalendar from '@fullcalendar/react';
import rrulePlugin from '@fullcalendar/rrule';
import timeGridPlugin from '@fullcalendar/timegrid';
import { router, usePage } from '@inertiajs/react';
import axios from 'axios';
import { BookOpen, CalendarDays, Eye, List, Plus, RefreshCw, User, X } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

// ==================== Constantes ====================

const COLORS = [
    { label: 'Azul', value: '#2563eb' },
    { label: 'Verde', value: '#16a34a' },
    { label: 'Rojo', value: '#dc2626' },
    { label: 'Morado', value: '#9333ea' },
    { label: 'Naranja', value: '#ea580c' },
    { label: 'Rosa', value: '#db2777' },
    { label: 'Cian', value: '#0891b2' },
    { label: 'Amarillo', value: '#ca8a04' },
];

const TIPOS = [
    { label: 'General', value: 'general' },
    { label: 'Cita', value: 'cita' },
    { label: 'Recordatorio', value: 'recordatorio' },
    { label: 'Festivo', value: 'festivo' },
];

const RRULE_FREQS = [
    { label: 'Diario', value: 'daily' },
    { label: 'Semanal', value: 'weekly' },
    { label: 'Mensual', value: 'monthly' },
    { label: 'Anual', value: 'yearly' },
];

const WEEKDAYS = [
    { label: 'L', value: 'mo', title: 'Lunes' },
    { label: 'M', value: 'tu', title: 'Martes' },
    { label: 'X', value: 'we', title: 'Miércoles' },
    { label: 'J', value: 'th', title: 'Jueves' },
    { label: 'V', value: 'fr', title: 'Viernes' },
    { label: 'S', value: 'sa', title: 'Sábado' },
    { label: 'D', value: 'su', title: 'Domingo' },
];

const TIPO_BADGE: Record<string, string> = {
    cita: 'bg-blue-100 text-blue-700',
    recordatorio: 'bg-yellow-100 text-yellow-700',
    festivo: 'bg-red-100 text-red-700',
    general: 'bg-gray-100 text-gray-700',
};

// ==================== Tipos ====================

interface EventForm {
    id: number | null;
    titulo: string;
    start_fecha: string;
    end_fecha: string;
    comentarios: string;
    color: string;
    tipo: string;
    all_day: boolean;
    recurrente: boolean;
    rrule_freq: string;
    rrule_byweekday: string[];
    duration: string;
}

interface CitaItem {
    id: number;
    titulo: string;
    start_fecha: string;
    end_fecha: string;
    comentarios: string | null;
    color: string;
    tipo: string;
    user_id: number;
}

interface LogEntry {
    mail: string;
    accion: string;
    fecha: string;
    hora: string;
    notaria: string;
}

interface Tooltip {
    visible: boolean;
    x: number;
    y: number;
    event: EventApi | null;
}

// ==================== Utils ====================

function toLocalInput(iso: string): string {
    if (!iso) return '';
    return iso.slice(0, 16);
}

function todayString(): string {
    return new Date().toISOString().slice(0, 10);
}

function emptyForm(): EventForm {
    return {
        id: null,
        titulo: '',
        start_fecha: '',
        end_fecha: '',
        comentarios: '',
        color: '#2563eb',
        tipo: 'general',
        all_day: false,
        recurrente: false,
        rrule_freq: 'weekly',
        rrule_byweekday: [],
        duration: '01:00',
    };
}

// ==================== Breadcrumbs ====================

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Agenda', href: '/admin/agenda' },
];

// ==================== Componente principal ====================

export default function AgendaIndex() {
    const { auth } = usePage<{ auth: { user: { tipo_cuenta: string; id: number } } }>().props;
    const calendarRef = useRef<FullCalendar>(null);
    const vistaRef = useRef<'propio' | 'todos'>('todos');

    const isAdmin = ['super_admin', 'admin_notaria'].includes(auth.user.tipo_cuenta);

    // Vista: 'propio' o 'todos' (solo para admins)
    const [vista, setVista] = useState<'propio' | 'todos'>('todos');

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<EventForm>(emptyForm());
    const [processing, setProcessing] = useState(false);
    const [readOnly, setReadOnly] = useState(false);

    // Tooltip
    const [tooltip, setTooltip] = useState<Tooltip>({ visible: false, x: 0, y: 0, event: null });
    const tooltipTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Tab: Citas del día
    const [citasFecha, setCitasFecha] = useState(todayString());
    const [citas, setCitas] = useState<CitaItem[]>([]);
    const [citasLoading, setCitasLoading] = useState(false);

    // Tab: Bitácora
    const [logFecha, setLogFecha] = useState(todayString());
    const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
    const [logLoading, setLogLoading] = useState(false);

    // -- Citas del día

    const fetchCitas = useCallback(async (fecha: string, currentVista: string) => {
        setCitasLoading(true);
        try {
            const { data } = await axios.get<CitaItem[]>('/admin/agenda/today', {
                params: { fecha, vista: currentVista },
            });
            setCitas(data);
        } finally {
            setCitasLoading(false);
        }
    }, []);

    // -- Bitácora

    const fetchLog = useCallback(async (fecha: string) => {
        setLogLoading(true);
        try {
            const { data } = await axios.get<LogEntry[]>('/admin/agenda/log', {
                params: { fecha },
            });
            setLogEntries(data);
        } finally {
            setLogLoading(false);
        }
    }, []);

    // -- Función de eventos para FullCalendar (memoizada para evitar re-renders)

    const fetchCalendarEvents = useCallback((fetchInfo: any, successCallback: any, failureCallback: any) => {
        axios
            .get('/admin/agenda/events', {
                params: {
                    start: fetchInfo.startStr,
                    end: fetchInfo.endStr,
                    vista: vistaRef.current,
                },
            })
            .then((response) => successCallback(response.data))
            .catch((error) => {
                console.error('Error fetching events:', error);
                failureCallback(error);
            });
    }, []);

    // -- Modal helpers

    function openCreate(start: string, end?: string) {
        setForm({ ...emptyForm(), start_fecha: start, end_fecha: end ?? start });
        setReadOnly(false);
        setModalOpen(true);
    }

    function openEdit(arg: EventClickArg) {
        const e = arg.event;
        const ext = e.extendedProps;
        const canEdit = isAdmin || ext.user_id === auth.user.id;

        setForm({
            id: Number(e.id),
            titulo: e.title,
            start_fecha: toLocalInput(e.startStr),
            end_fecha: toLocalInput(e.endStr || e.startStr),
            comentarios: ext.comentarios ?? '',
            color: e.backgroundColor,
            tipo: ext.tipo ?? 'general',
            all_day: e.allDay,
            recurrente: false,
            rrule_freq: 'weekly',
            rrule_byweekday: [],
            duration: '01:00',
        });
        setReadOnly(!canEdit);
        setModalOpen(true);
    }

    function openEditFromCita(cita: CitaItem) {
        const canEdit = isAdmin || cita.user_id === auth.user.id;
        setForm({
            id: cita.id,
            titulo: cita.titulo,
            start_fecha: '',
            end_fecha: '',
            comentarios: cita.comentarios ?? '',
            color: cita.color,
            tipo: cita.tipo,
            all_day: false,
            recurrente: false,
            rrule_freq: 'weekly',
            rrule_byweekday: [],
            duration: '01:00',
        });
        setReadOnly(!canEdit);
        setModalOpen(true);
    }

    // -- Tooltip

    function handleEventMouseEnter(info: EventMountArg) {
        if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
        const rect = (info.el as HTMLElement).getBoundingClientRect();
        tooltipTimeout.current = setTimeout(() => {
            setTooltip({
                visible: true,
                x: rect.left + window.scrollX,
                y: rect.bottom + window.scrollY + 5,
                event: info.event,
            });
        }, 300);
    }

    function handleEventMouseLeave() {
        if (tooltipTimeout.current) clearTimeout(tooltipTimeout.current);
        setTooltip((t) => ({ ...t, visible: false }));
    }

    // -- Calendar callbacks

    function handleDateClick(arg: DateClickArg) {
        openCreate(arg.dateStr + 'T09:00', arg.dateStr + 'T10:00');
    }

    function handleSelect(info: { startStr: string; endStr: string }) {
        openCreate(toLocalInput(info.startStr), toLocalInput(info.endStr));
    }

    function handleDrop(info: EventDropArg) {
        const ok = window.confirm(`¿Mover "${info.event.title}" a ${info.event.start?.toLocaleDateString('es-MX')}?`);
        if (!ok) { info.revert(); return; }

        axios.put(
            `/admin/agenda/${info.event.id}`,
            { start_fecha: info.event.startStr, end_fecha: info.event.endStr || info.event.startStr }
        ).catch((error) => {
            console.error('Error moving event:', error);
            info.revert();
        });
    }

    function handleResize(info: EventResizeDoneArg) {
        axios.put(
            `/admin/agenda/${info.event.id}`,
            { start_fecha: info.event.startStr, end_fecha: info.event.endStr || info.event.startStr }
        ).catch((error) => {
            console.error('Error resizing event:', error);
            info.revert();
        });
    }

    // -- Submit

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);

        const rrule = form.recurrente
            ? {
                  freq: form.rrule_freq,
                  ...(form.rrule_byweekday.length > 0 ? { byweekday: form.rrule_byweekday } : {}),
              }
            : null;

        const payload = {
            titulo: form.titulo,
            start_fecha: form.start_fecha,
            end_fecha: form.recurrente ? null : form.end_fecha,
            comentarios: form.comentarios || null,
            color: form.color,
            tipo: form.tipo,
            all_day: form.all_day,
            rrule,
            duration: form.recurrente ? form.duration : null,
        };

        const onFinish = () => {
            setProcessing(false);
            setModalOpen(false);
            calendarRef.current?.getApi().refetchEvents();
            fetchCitas(citasFecha, vistaRef.current);
        };

        if (form.id) {
            axios.put(`/admin/agenda/${form.id}`, payload)
                .then(() => onFinish())
                .catch((error) => {
                    console.error('Error updating event:', error);
                    setProcessing(false);
                });
        } else {
            axios.post('/admin/agenda', payload)
                .then(() => onFinish())
                .catch((error) => {
                    console.error('Error creating event:', error);
                    setProcessing(false);
                });
        }
    }

    function handleDelete() {
        if (!form.id) return;
        setProcessing(true);
        axios.delete(`/admin/agenda/${form.id}`)
            .then(() => {
                setProcessing(false);
                setModalOpen(false);
                calendarRef.current?.getApi().refetchEvents();
                fetchCitas(citasFecha, vistaRef.current);
            })
            .catch((error) => {
                console.error('Error deleting event:', error);
                setProcessing(false);
            });
    }

    // -- Weekday toggle

    function toggleWeekday(day: string) {
        setForm((f) => ({
            ...f,
            rrule_byweekday: f.rrule_byweekday.includes(day)
                ? f.rrule_byweekday.filter((d) => d !== day)
                : [...f.rrule_byweekday, day],
        }));
    }
    // -- Cambio de vista

    function handleVistaChange(newVista: 'propio' | 'todos') {
        // Actualizar ref INMEDIATAMENTE (sincrónico)
        vistaRef.current = newVista;

        // Actualizar estado (asincrónico)
        setVista(newVista);

        // Refrescar calendario y citas AHORA (con el ref ya actualizado)
        if (calendarRef.current) {
            calendarRef.current.getApi().refetchEvents();
        }
        fetchCitas(citasFecha, newVista);
    }
    // -- Effects

    // Inicializar ref con el valor actual de vista
    useEffect(() => {
        vistaRef.current = vista;
    }, []); // Solo en mount

    useEffect(() => {
        fetchLog(logFecha);
    }, [logFecha, fetchLog]);

    // Cargar citas inicialmente cuando cambia la fecha
    useEffect(() => {
        fetchCitas(citasFecha, vista);
    }, [citasFecha]);

    // ==================== Render ====================

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="text-primary h-6 w-6" />
                        <h1 className="text-xl font-semibold">Agenda</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        {isAdmin && (
                            <Select value={vista} onValueChange={(v) => handleVistaChange(v as 'propio' | 'todos')}>
                                <SelectTrigger className="w-[160px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todos">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            Ver todo
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="propio">
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4" />
                                            Solo míos
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                        <Button
                            size="sm"
                            onClick={() => openCreate(todayString() + 'T09:00', todayString() + 'T10:00')}
                        >
                            <Plus className="mr-1 h-4 w-4" />
                            Nuevo evento
                        </Button>
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="calendario" className="flex flex-1 flex-col gap-4">
                    <TabsList className="w-fit bg-muted/30">
                        <TabsTrigger value="calendario" className="gap-1.5 data-[state=inactive]:text-foreground/60">
                            <CalendarDays className="h-4 w-4" />
                            Calendario
                        </TabsTrigger>
                        <TabsTrigger value="citas" className="gap-1.5 data-[state=inactive]:text-foreground/60">
                            <List className="h-4 w-4" />
                            Citas del día
                        </TabsTrigger>
                        <TabsTrigger value="bitacora" className="gap-1.5 data-[state=inactive]:text-foreground/60">
                            <BookOpen className="h-4 w-4" />
                            Bitácora
                        </TabsTrigger>
                    </TabsList>

                    {/* Tab 1: Calendario */}
                    <TabsContent value="calendario" className="flex-1">
                        <div className="bg-background rounded-xl border p-4 shadow-sm">
                            <FullCalendar
                                ref={calendarRef}
                                plugins={[rrulePlugin, dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                                initialView="dayGridMonth"
                                locale="es"
                                height="auto"
                                headerToolbar={{
                                    left: 'prev,next today',
                                    center: 'title',
                                    right: 'dayGridMonth,timeGridWeek,listWeek,timeGridDay',
                                }}
                                buttonText={{ today: 'Hoy', month: 'Mes', week: 'Semana', day: 'Día', list: 'Lista' }}
                                events={fetchCalendarEvents}
                                selectable={true}
                                selectMirror={true}
                                editable={isAdmin}
                                eventResizableFromStart={isAdmin}
                                select={handleSelect}
                                dateClick={handleDateClick}
                                eventClick={openEdit}
                                eventDrop={handleDrop}
                                eventResize={handleResize}
                                eventDidMount={handleEventMouseEnter}
                                eventWillUnmount={handleEventMouseLeave}
                                eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                                dayMaxEvents={4}
                                nowIndicator={true}
                            />
                        </div>
                    </TabsContent>

                    {/* Tab 2: Citas del día */}
                    <TabsContent value="citas">
                        <div className="bg-background rounded-xl border shadow-sm">
                            {/* Toolbar */}
                            <div className="flex items-center gap-3 border-b px-4 py-3">
                                <Label htmlFor="citas-fecha" className="shrink-0 text-sm font-medium">
                                    Fecha:
                                </Label>
                                <Input
                                    id="citas-fecha"
                                    type="date"
                                    value={citasFecha}
                                    onChange={(e) => setCitasFecha(e.target.value)}
                                    className="w-44"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fetchCitas(citasFecha, vistaRef.current)}
                                    disabled={citasLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${citasLoading ? 'animate-spin' : ''}`} />
                                </Button>
                                <span className="text-muted-foreground ml-auto text-sm">
                                    {citas.length} evento{citas.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Tabla */}
                            {citasLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <RefreshCw className="text-muted-foreground h-6 w-6 animate-spin" />
                                </div>
                            ) : citas.length === 0 ? (
                                <div className="text-muted-foreground flex flex-col items-center gap-2 py-16">
                                    <List className="h-10 w-10 opacity-30" />
                                    <p className="text-sm">Sin eventos para esta fecha</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="text-muted-foreground px-4 py-2.5 font-medium">Inicio</th>
                                                <th className="text-muted-foreground px-4 py-2.5 font-medium">Fin</th>
                                                <th className="text-muted-foreground px-4 py-2.5 font-medium">Título</th>
                                                <th className="text-muted-foreground px-4 py-2.5 font-medium">Tipo</th>
                                                <th className="text-muted-foreground px-4 py-2.5 font-medium">Notas</th>
                                                <th className="px-4 py-2.5" />
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {citas.map((c) => (
                                                <tr
                                                    key={c.id}
                                                    className="hover:bg-muted/40 border-b last:border-0 transition-colors"
                                                >
                                                    <td className="px-4 py-2.5 font-mono text-xs">{c.start_fecha}</td>
                                                    <td className="px-4 py-2.5 font-mono text-xs">{c.end_fecha}</td>
                                                    <td className="px-4 py-2.5">
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                                                                style={{ backgroundColor: c.color }}
                                                            />
                                                            <span className="font-medium">{c.titulo}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <span
                                                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${TIPO_BADGE[c.tipo] ?? TIPO_BADGE.general}`}
                                                        >
                                                            {TIPOS.find((t) => t.value === c.tipo)?.label ?? c.tipo}
                                                        </span>
                                                    </td>
                                                    <td className="text-muted-foreground max-w-xs truncate px-4 py-2.5 text-xs">
                                                        {c.comentarios ?? '—'}
                                                    </td>
                                                    <td className="px-4 py-2.5">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-7 text-xs"
                                                            onClick={() => openEditFromCita(c)}
                                                        >
                                                            {isAdmin || c.user_id === auth.user.id ? 'Editar' : 'Ver'}
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Tab 3: Bitácora */}
                    <TabsContent value="bitacora">
                        <div className="bg-background rounded-xl border shadow-sm">
                            {/* Toolbar */}
                            <div className="flex items-center gap-3 border-b px-4 py-3">
                                <Label htmlFor="log-fecha" className="shrink-0 text-sm font-medium">
                                    Fecha:
                                </Label>
                                <Input
                                    id="log-fecha"
                                    type="date"
                                    value={logFecha}
                                    onChange={(e) => setLogFecha(e.target.value)}
                                    className="w-44"
                                />
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => fetchLog(logFecha)}
                                    disabled={logLoading}
                                >
                                    <RefreshCw className={`h-4 w-4 ${logLoading ? 'animate-spin' : ''}`} />
                                </Button>
                                <span className="text-muted-foreground ml-auto text-sm">
                                    {logEntries.length} registro{logEntries.length !== 1 ? 's' : ''}
                                </span>
                            </div>

                            {/* Tabla */}
                            {logLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <RefreshCw className="text-muted-foreground h-6 w-6 animate-spin" />
                                </div>
                            ) : logEntries.length === 0 ? (
                                <div className="text-muted-foreground flex flex-col items-center gap-2 py-16">
                                    <BookOpen className="h-10 w-10 opacity-30" />
                                    <p className="text-sm">Sin actividad registrada para esta fecha</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b text-left">
                                                <th className="text-muted-foreground px-4 py-2.5 font-medium">Hora</th>
                                                <th className="text-muted-foreground px-4 py-2.5 font-medium">Usuario</th>
                                                <th className="text-muted-foreground px-4 py-2.5 font-medium">Acción</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {logEntries.map((entry, i) => (
                                                <tr
                                                    key={i}
                                                    className="hover:bg-muted/40 border-b last:border-0 transition-colors"
                                                >
                                                    <td className="px-4 py-2.5 font-mono text-xs">{entry.hora}</td>
                                                    <td className="px-4 py-2.5 text-xs">{entry.mail}</td>
                                                    <td className="text-muted-foreground px-4 py-2.5 text-xs">
                                                        {entry.accion}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Tooltip */}
            {tooltip.visible && tooltip.event && (
                <div
                    className="bg-popover text-popover-foreground pointer-events-none fixed z-50 max-w-xs rounded-lg border p-3 shadow-lg"
                    style={{ top: tooltip.y, left: tooltip.x }}
                >
                    <p className="font-semibold">{tooltip.event.title}</p>
                    {tooltip.event.extendedProps.comentarios && (
                        <p className="text-muted-foreground mt-1 text-xs">{tooltip.event.extendedProps.comentarios}</p>
                    )}
                    {tooltip.event.extendedProps.tipo && (
                        <Badge variant="outline" className="mt-2 text-xs">
                            {TIPOS.find((t) => t.value === tooltip.event!.extendedProps.tipo)?.label}
                        </Badge>
                    )}
                </div>
            )}

            {/* Modal crear / editar */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader>
                        <DialogTitle>
                            {readOnly ? 'Ver evento' : form.id ? 'Editar evento' : 'Nuevo evento'}
                        </DialogTitle>
                    </DialogHeader>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Título */}
                        <div className="space-y-1">
                            <Label htmlFor="titulo">Título *</Label>
                            <Input
                                id="titulo"
                                value={form.titulo}
                                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                                maxLength={145}
                                required
                                autoFocus
                                disabled={readOnly}
                            />
                        </div>

                        {/* Todo el día */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="all_day"
                                checked={form.all_day}
                                onCheckedChange={(v) => setForm({ ...form, all_day: Boolean(v) })}
                                disabled={readOnly}
                            />
                            <Label htmlFor="all_day" className="cursor-pointer font-normal">
                                Todo el día
                            </Label>
                        </div>

                        {/* Fechas */}
                        {!form.recurrente && (
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor="start_fecha">Inicio *</Label>
                                    <Input
                                        id="start_fecha"
                                        type={form.all_day ? 'date' : 'datetime-local'}
                                        value={form.start_fecha}
                                        onChange={(e) => setForm({ ...form, start_fecha: e.target.value })}
                                        required
                                        disabled={readOnly}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="end_fecha">Fin</Label>
                                    <Input
                                        id="end_fecha"
                                        type={form.all_day ? 'date' : 'datetime-local'}
                                        value={form.end_fecha}
                                        onChange={(e) => setForm({ ...form, end_fecha: e.target.value })}
                                        disabled={readOnly}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Evento recurrente */}
                        {!form.id && (
                            <>
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="recurrente"
                                        checked={form.recurrente}
                                        onCheckedChange={(v) => setForm({ ...form, recurrente: Boolean(v) })}
                                    />
                                    <Label htmlFor="recurrente" className="cursor-pointer font-normal">
                                        Evento recurrente
                                    </Label>
                                </div>

                                {form.recurrente && (
                                    <div className="bg-muted/50 space-y-3 rounded-lg p-3">
                                        {/* Fecha inicio (para rrule dtstart) */}
                                        <div className="space-y-1">
                                            <Label>Fecha de inicio *</Label>
                                            <Input
                                                type="datetime-local"
                                                value={form.start_fecha}
                                                onChange={(e) => setForm({ ...form, start_fecha: e.target.value })}
                                                required
                                            />
                                        </div>

                                        {/* Frecuencia */}
                                        <div className="space-y-1">
                                            <Label>Frecuencia</Label>
                                            <Select
                                                value={form.rrule_freq}
                                                onValueChange={(v) => setForm({ ...form, rrule_freq: v })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {RRULE_FREQS.map((f) => (
                                                        <SelectItem key={f.value} value={f.value}>
                                                            {f.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Días de la semana (solo si es semanal) */}
                                        {form.rrule_freq === 'weekly' && (
                                            <div className="space-y-1">
                                                <Label>Días de la semana</Label>
                                                <div className="flex gap-1.5">
                                                    {WEEKDAYS.map((d) => (
                                                        <button
                                                            key={d.value}
                                                            type="button"
                                                            title={d.title}
                                                            onClick={() => toggleWeekday(d.value)}
                                                            className={`h-8 w-8 rounded-full text-xs font-medium transition-colors ${
                                                                form.rrule_byweekday.includes(d.value)
                                                                    ? 'bg-primary text-primary-foreground'
                                                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                                            }`}
                                                        >
                                                            {d.label}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Duración */}
                                        <div className="space-y-1">
                                            <Label htmlFor="duration">Duración (HH:MM)</Label>
                                            <Input
                                                id="duration"
                                                type="time"
                                                value={form.duration}
                                                onChange={(e) => setForm({ ...form, duration: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Tipo */}
                        <div className="space-y-1">
                            <Label>Tipo</Label>
                            <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })} disabled={readOnly}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIPOS.map((t) => (
                                        <SelectItem key={t.value} value={t.value}>
                                            {t.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Comentarios */}
                        <div className="space-y-1">
                            <Label htmlFor="comentarios">Comentarios</Label>
                            <Input
                                id="comentarios"
                                value={form.comentarios}
                                onChange={(e) => setForm({ ...form, comentarios: e.target.value })}
                                maxLength={255}
                                placeholder="Notas adicionales..."
                                disabled={readOnly}
                            />
                        </div>

                        {/* Color */}
                        <div className="space-y-1">
                            <Label>Color</Label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((c) => (
                                    <button
                                        key={c.value}
                                        type="button"
                                        title={c.label}
                                        onClick={() => !readOnly && setForm({ ...form, color: c.value })}
                                        className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                                        style={{
                                            backgroundColor: c.value,
                                            borderColor: form.color === c.value ? 'white' : 'transparent',
                                            outline: form.color === c.value ? `2px solid ${c.value}` : 'none',
                                            opacity: readOnly ? 0.6 : 1,
                                            cursor: readOnly ? 'default' : 'pointer',
                                        }}
                                        disabled={readOnly}
                                    />
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            {!readOnly && form.id && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={processing}
                                    className="mr-auto"
                                >
                                    <X className="mr-1 h-4 w-4" />
                                    Eliminar
                                </Button>
                            )}
                            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={processing}>
                                {readOnly ? 'Cerrar' : 'Cancelar'}
                            </Button>
                            {!readOnly && (
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear evento'}
                                </Button>
                            )}
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
