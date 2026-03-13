import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import timeGridPlugin from '@fullcalendar/timegrid';
import { DateClickArg } from '@fullcalendar/interaction';
import { EventClickArg, EventDropArg } from '@fullcalendar/core';
import { router, usePage } from '@inertiajs/react';
import { CalendarDays, Plus, X } from 'lucide-react';
import { useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
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
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';

const COLORS = [
    { label: 'Azul',      value: '#2563eb' },
    { label: 'Verde',     value: '#16a34a' },
    { label: 'Rojo',      value: '#dc2626' },
    { label: 'Morado',    value: '#9333ea' },
    { label: 'Naranja',   value: '#ea580c' },
    { label: 'Rosa',      value: '#db2777' },
    { label: 'Cian',      value: '#0891b2' },
    { label: 'Amarillo',  value: '#ca8a04' },
];

const TIPOS = [
    { label: 'General',      value: 'general' },
    { label: 'Cita',         value: 'cita' },
    { label: 'Recordatorio', value: 'recordatorio' },
    { label: 'Festivo',      value: 'festivo' },
];

interface EventForm {
    id: number | null;
    titulo: string;
    start_fecha: string;
    end_fecha: string;
    comentarios: string;
    color: string;
    tipo: string;
}

const emptyForm = (): EventForm => ({
    id: null,
    titulo: '',
    start_fecha: '',
    end_fecha: '',
    comentarios: '',
    color: '#2563eb',
    tipo: 'general',
});

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Agenda', href: '/admin/agenda' },
];

export default function AgendaIndex() {
    const { auth } = usePage<{ auth: { user: { tipo_cuenta: string; id: number } } }>().props;
    const calendarRef = useRef<FullCalendar>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<EventForm>(emptyForm());
    const [processing, setProcessing] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

    const isAdmin = ['super_admin', 'admin_notaria'].includes(auth.user.tipo_cuenta);

    function openCreate(start: string, end?: string) {
        setForm({ ...emptyForm(), start_fecha: start, end_fecha: end ?? start });
        setModalOpen(true);
    }

    function openEdit(event: EventClickArg) {
        const extendedProps = event.event.extendedProps;
        const canEdit = isAdmin || extendedProps.user_id === auth.user.id;

        if (!canEdit) return;

        setDeleteConfirmId(null);
        setForm({
            id: Number(event.event.id),
            titulo: event.event.title,
            start_fecha: toLocalInput(event.event.startStr),
            end_fecha: toLocalInput(event.event.endStr || event.event.startStr),
            comentarios: extendedProps.comentarios ?? '',
            color: event.event.backgroundColor,
            tipo: extendedProps.tipo ?? 'general',
        });
        setModalOpen(true);
    }

    function handleDateClick(arg: DateClickArg) {
        openCreate(arg.dateStr + 'T09:00', arg.dateStr + 'T10:00');
    }

    function handleSelect(info: { startStr: string; endStr: string }) {
        openCreate(toLocalInput(info.startStr), toLocalInput(info.endStr));
    }

    async function handleDrop(info: EventDropArg) {
        const confirmed = window.confirm(
            `¿Mover "${info.event.title}" a ${info.event.start?.toLocaleDateString('es-MX')}?`
        );
        if (!confirmed) {
            info.revert();
            return;
        }

        router.put(
            `/admin/agenda/${info.event.id}`,
            {
                start_fecha: info.event.startStr,
                end_fecha: info.event.endStr || info.event.startStr,
            },
            {
                preserveScroll: true,
                onError: () => info.revert(),
            }
        );
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setProcessing(true);

        const payload = {
            titulo: form.titulo,
            start_fecha: form.start_fecha,
            end_fecha: form.end_fecha,
            comentarios: form.comentarios || null,
            color: form.color,
            tipo: form.tipo,
        };

        const onFinish = () => {
            setProcessing(false);
            setModalOpen(false);
            calendarRef.current?.getApi().refetchEvents();
        };

        if (form.id) {
            router.put(`/admin/agenda/${form.id}`, payload, {
                preserveScroll: true,
                onFinish,
            });
        } else {
            router.post('/admin/agenda', payload, {
                preserveScroll: true,
                onFinish,
            });
        }
    }

    function handleDelete() {
        if (!form.id) return;
        setProcessing(true);
        router.delete(`/admin/agenda/${form.id}`, {
            preserveScroll: true,
            onFinish: () => {
                setProcessing(false);
                setModalOpen(false);
                calendarRef.current?.getApi().refetchEvents();
            },
        });
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="text-primary h-6 w-6" />
                        <h1 className="text-xl font-semibold">Agenda</h1>
                    </div>
                    <Button
                        size="sm"
                        onClick={() => openCreate(new Date().toISOString().slice(0, 10) + 'T09:00')}
                    >
                        <Plus className="mr-1 h-4 w-4" />
                        Nuevo evento
                    </Button>
                </div>

                {/* Calendar */}
                <div className="bg-background rounded-xl border p-4 shadow-sm">
                    <FullCalendar
                        ref={calendarRef}
                        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        locale="es"
                        height="auto"
                        headerToolbar={{
                            left: 'prev,next today',
                            center: 'title',
                            right: 'dayGridMonth,timeGridWeek,listWeek,timeGridDay',
                        }}
                        buttonText={{
                            today: 'Hoy',
                            month: 'Mes',
                            week: 'Semana',
                            day: 'Día',
                            list: 'Lista',
                        }}
                        events="/admin/agenda/events"
                        selectable={true}
                        editable={isAdmin}
                        select={handleSelect}
                        dateClick={handleDateClick}
                        eventClick={openEdit}
                        eventDrop={handleDrop}
                        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
                    />
                </div>
            </div>

            {/* Modal crear / editar */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>{form.id ? 'Editar evento' : 'Nuevo evento'}</DialogTitle>
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
                            />
                        </div>

                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label htmlFor="start_fecha">Inicio *</Label>
                                <Input
                                    id="start_fecha"
                                    type="datetime-local"
                                    value={form.start_fecha}
                                    onChange={(e) => setForm({ ...form, start_fecha: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="end_fecha">Fin *</Label>
                                <Input
                                    id="end_fecha"
                                    type="datetime-local"
                                    value={form.end_fecha}
                                    onChange={(e) => setForm({ ...form, end_fecha: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        {/* Tipo */}
                        <div className="space-y-1">
                            <Label>Tipo</Label>
                            <Select
                                value={form.tipo}
                                onValueChange={(v) => setForm({ ...form, tipo: v })}
                            >
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
                                        onClick={() => setForm({ ...form, color: c.value })}
                                        className="h-7 w-7 rounded-full border-2 transition-transform hover:scale-110"
                                        style={{
                                            backgroundColor: c.value,
                                            borderColor: form.color === c.value ? 'white' : 'transparent',
                                            outline: form.color === c.value ? `2px solid ${c.value}` : 'none',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <DialogFooter className="gap-2 pt-2">
                            {form.id && (isAdmin || true) && (
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
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                                disabled={processing}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                {processing ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear evento'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}

/** Convierte ISO a formato datetime-local (YYYY-MM-DDTHH:MM) */
function toLocalInput(iso: string): string {
    if (!iso) return '';
    return iso.slice(0, 16);
}
