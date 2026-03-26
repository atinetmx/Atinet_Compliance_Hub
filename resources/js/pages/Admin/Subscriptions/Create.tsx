import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Save } from 'lucide-react';
import { useEffect } from 'react';

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
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
}

interface Plan {
    id: number;
    nombre: string;
    precio_mensual: number;
    precio_anual: number;
}

interface SubscriptionCreateProps {
    notarias: Notaria[];
    plans: Plan[];
    defaultNotariaId?: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
    },
    {
        title: 'Suscripciones',
        href: '/admin/subscriptions',
    },
    {
        title: 'Crear',
        href: '#',
    },
];

export default function Create({
    notarias,
    plans,
    defaultNotariaId,
}: SubscriptionCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        notaria_id: defaultNotariaId?.toString() || '',
        plan_id: '',
        fecha_inicio: new Date().toISOString().split('T')[0],
        fecha_vencimiento: '',
        status: 'trial',
        metodo_pago: '',
        precio_pagado: '',
        moneda: 'MXN',
        ciclo_facturacion: 'mensual',
        auto_renovacion: true,
        notas: '',
    });

    // Auto-calcular fecha de vencimiento cuando cambia ciclo o fecha inicio
    useEffect(() => {
        if (data.fecha_inicio && data.ciclo_facturacion) {
            const inicio = new Date(data.fecha_inicio);
            const vencimiento = new Date(inicio);
            if (data.ciclo_facturacion === 'mensual') {
                vencimiento.setMonth(vencimiento.getMonth() + 1);
            } else {
                vencimiento.setFullYear(vencimiento.getFullYear() + 1);
            }
            setData(
                'fecha_vencimiento',
                vencimiento.toISOString().split('T')[0],
            );
        }
    }, [data.fecha_inicio, data.ciclo_facturacion, setData]);

    // Auto-calcular precio cuando cambia plan o ciclo
    useEffect(() => {
        if (data.plan_id) {
            const plan = plans.find((p) => p.id.toString() === data.plan_id);
            if (plan) {
                const precio =
                    data.ciclo_facturacion === 'mensual'
                        ? plan.precio_mensual
                        : plan.precio_anual;
                setData('precio_pagado', precio.toString());
            }
        }
    }, [data.plan_id, data.ciclo_facturacion, plans, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/subscriptions');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Suscripción" />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                    <Plus className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">
                        Crear Nueva Suscripción
                    </h1>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Notaría y Plan */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Información Básica
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="notaria_id">
                                        Notaría *
                                    </RequiredLabel>
                                    <Select
                                        value={data.notaria_id}
                                        onValueChange={(value) =>
                                            setData('notaria_id', value)
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.notaria_id
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        >
                                            <SelectValue placeholder="Seleccionar notaría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {notarias.map((notaria) => (
                                                <SelectItem
                                                    key={notaria.id}
                                                    value={notaria.id.toString()}
                                                >
                                                    {notaria.nombre} (Notaría #
                                                    {notaria.numero_notaria})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.notaria_id && (
                                        <p className="text-sm text-red-500">
                                            {errors.notaria_id}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="plan_id">Plan *</RequiredLabel>
                                    <Select
                                        value={data.plan_id}
                                        onValueChange={(value) =>
                                            setData('plan_id', value)
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.plan_id
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        >
                                            <SelectValue placeholder="Seleccionar plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {plans.map((plan) => (
                                                <SelectItem
                                                    key={plan.id}
                                                    value={plan.id.toString()}
                                                >
                                                    {plan.nombre} - $
                                                    {plan.precio_mensual}/mes
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.plan_id && (
                                        <p className="text-sm text-red-500">
                                            {errors.plan_id}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Fechas y Estado */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Período y Estado
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="fecha_inicio">
                                        Fecha Inicio *
                                    </RequiredLabel>
                                    <Input
                                        type="date"
                                        id="fecha_inicio"
                                        value={data.fecha_inicio}
                                        onChange={(e) =>
                                            setData(
                                                'fecha_inicio',
                                                e.target.value,
                                            )
                                        }
                                        className={
                                            errors.fecha_inicio
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.fecha_inicio && (
                                        <p className="text-sm text-red-500">
                                            {errors.fecha_inicio}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="fecha_vencimiento">
                                        Fecha Vencimiento *
                                    </RequiredLabel>
                                    <Input
                                        type="date"
                                        id="fecha_vencimiento"
                                        value={data.fecha_vencimiento}
                                        onChange={(e) =>
                                            setData(
                                                'fecha_vencimiento',
                                                e.target.value,
                                            )
                                        }
                                        className={
                                            errors.fecha_vencimiento
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.fecha_vencimiento && (
                                        <p className="text-sm text-red-500">
                                            {errors.fecha_vencimiento}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="status">Estado *</RequiredLabel>
                                    <Select
                                        value={data.status}
                                        onValueChange={(value) =>
                                            setData('status', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="trial">
                                                Trial
                                            </SelectItem>
                                            <SelectItem value="activa">
                                                Activa
                                            </SelectItem>
                                            <SelectItem value="suspendida">
                                                Suspendida
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Facturación */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Información de Facturación
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="ciclo_facturacion">
                                        Ciclo *
                                    </RequiredLabel>
                                    <Select
                                        value={data.ciclo_facturacion}
                                        onValueChange={(value) =>
                                            setData('ciclo_facturacion', value)
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="mensual">
                                                Mensual
                                            </SelectItem>
                                            <SelectItem value="anual">
                                                Anual
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="precio_pagado">
                                        Precio *
                                    </RequiredLabel>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        id="precio_pagado"
                                        value={data.precio_pagado}
                                        onChange={(e) =>
                                            setData(
                                                'precio_pagado',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                        className={
                                            errors.precio_pagado
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.precio_pagado && (
                                        <p className="text-sm text-red-500">
                                            {errors.precio_pagado}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="metodo_pago">
                                        Método de Pago
                                    </RequiredLabel>
                                    <Input
                                        id="metodo_pago"
                                        value={data.metodo_pago}
                                        onChange={(e) =>
                                            setData(
                                                'metodo_pago',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Transferencia, Tarjeta, etc."
                                    />
                                </div>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="auto_renovacion"
                                    checked={data.auto_renovacion}
                                    onCheckedChange={(checked) =>
                                        setData('auto_renovacion', checked)
                                    }
                                />
                                <RequiredLabel htmlFor="auto_renovacion">
                                    Renovación automática
                                </RequiredLabel>
                            </div>
                        </div>

                        {/* Notas */}
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="notas">Notas (Opcional)</RequiredLabel>
                            <Textarea
                                id="notas"
                                value={data.notas}
                                onChange={(e) =>
                                    setData('notas', e.target.value)
                                }
                                placeholder="Comentarios adicionales..."
                                rows={3}
                            />
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-2 border-t pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {processing
                                    ? 'Creando...'
                                    : 'Crear Suscripción'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
