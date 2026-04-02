import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Save, Edit as EditIcon } from 'lucide-react';
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

interface Subscription {
    id: number;
    notaria_id: number;
    plan_id: number;
    fecha_inicio: string;
    fecha_vencimiento: string;
    status: string;
    metodo_pago: string;
    precio_pagado: number;
    moneda: string;
    ciclo_facturacion: string;
    auto_renovacion: boolean;
    fecha_cancelacion?: string;
    razon_cancelacion?: string;
    notas?: string;
    notaria: { id: number; nombre: string; numero_notaria: string };
    plan: { id: number; nombre: string };
}

interface Plan {
    id: number;
    nombre: string;
    precio_mensual: number;
    precio_anual: number;
}

interface SubscriptionEditProps {
    subscription: Subscription;
    plans: Plan[];
}

export default function Edit({ subscription, plans }: SubscriptionEditProps) {
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
            title: subscription.notaria.nombre,
            href: `/admin/subscriptions/${subscription.id}`,
        },
        {
            title: 'Editar',
            href: '#',
            icon: EditIcon,
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        plan_id: subscription.plan_id.toString(),
        fecha_inicio: subscription.fecha_inicio,
        fecha_vencimiento: subscription.fecha_vencimiento,
        status: subscription.status,
        metodo_pago: subscription.metodo_pago || '',
        precio_pagado: subscription.precio_pagado.toString(),
        moneda: subscription.moneda,
        ciclo_facturacion: subscription.ciclo_facturacion,
        auto_renovacion: subscription.auto_renovacion,
        fecha_cancelacion: subscription.fecha_cancelacion || '',
        razon_cancelacion: subscription.razon_cancelacion || '',
        notas: subscription.notas || '',
    });

    // Auto-actualizar precio cuando cambia plan o ciclo
    useEffect(() => {
        const plan = plans.find((p) => p.id.toString() === data.plan_id);
        if (plan) {
            const precio =
                data.ciclo_facturacion === 'mensual'
                    ? plan.precio_mensual
                    : plan.precio_anual;
            setData('precio_pagado', precio.toString());
        }
    }, [data.plan_id, data.ciclo_facturacion, plans, setData]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/subscriptions/${subscription.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Suscripción - ${subscription.notaria.nombre}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                <div className="flex justify-start">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información de Notaría (solo lectura) */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Notaría
                            </h3>
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm text-muted-foreground">
                                    {subscription.notaria.nombre} (Notaría #
                                    {subscription.notaria.numero_notaria})
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    No se puede cambiar la notaría de una suscripción existente
                                </p>
                            </div>
                        </div>

                        {/* Plan */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Plan y Facturación
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
                                            <SelectValue />
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
                                            <SelectItem value="vencida">
                                                Vencida
                                            </SelectItem>
                                            <SelectItem value="suspendida">
                                                Suspendida
                                            </SelectItem>
                                            <SelectItem value="cancelada">
                                                Cancelada
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            {data.status === 'cancelada' && (
                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="razon_cancelacion">
                                        Razón de Cancelación
                                    </RequiredLabel>
                                    <Textarea
                                        id="razon_cancelacion"
                                        value={data.razon_cancelacion}
                                        onChange={(e) =>
                                            setData(
                                                'razon_cancelacion',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Motivo de la cancelación..."
                                        rows={3}
                                    />
                                </div>
                            )}
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
                                    ? 'Guardando...'
                                    : 'Guardar Cambios'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
