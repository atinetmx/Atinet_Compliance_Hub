import { Head, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Save, CalendarPlus, AlertTriangle } from 'lucide-react';
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
    has_active_subscription: boolean;
    has_trial_subscriptions: boolean;
    active_subscription?: {
        id: number;
        plan_id: number;
        plan?: {
            id: number;
            nombre: string;
        };
        status: string;
        fecha_vencimiento: string;
    };
    trial_subscriptions: Array<{
        id: number;
        plan_id: number;
        plan?: {
            id: number;
            nombre: string;
        };
        status: string;
        fecha_vencimiento: string;
    }>;
    total_subscriptions: number;
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
        title: 'Crear Nueva Suscripción',
        href: '#',
        icon: CalendarPlus,
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

    // Notaría seleccionada
    const selectedNotaria = notarias.find(
        (n) => n.id.toString() === data.notaria_id,
    );

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
                                                    <div className="flex items-center gap-2">
                                                        <span>
                                                            {notaria.nombre} (Notaría #
                                                            {notaria.numero_notaria})
                                                        </span>
                                                        {notaria.has_active_subscription && (
                                                            <span className="text-xs text-orange-600 dark:text-orange-400">
                                                                ⚠️ Ya tiene suscripción
                                                            </span>
                                                        )}
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.notaria_id && (
                                        <p className="text-sm text-red-500">
                                            {errors.notaria_id}
                                        </p>
                                    )}
                                    {selectedNotaria && selectedNotaria.total_subscriptions > 0 && (
                                        <div className="space-y-3 rounded-md border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
                                            <div className="flex items-start gap-2">
                                                <AlertTriangle className="mt-0.5 h-5 w-5 text-blue-600 dark:text-blue-400" />
                                                <div className="flex-1 space-y-3 text-sm">
                                                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                        Suscripciones actuales de esta notaría:
                                                    </p>

                                                    {/* Suscripción Activa */}
                                                    {selectedNotaria.has_active_subscription && (
                                                        <div className="rounded border border-orange-300 bg-orange-100 p-2 dark:border-orange-700 dark:bg-orange-900/30">
                                                            <p className="font-medium text-orange-900 dark:text-orange-200">
                                                                🔴 Suscripción ACTIVA (Principal)
                                                            </p>
                                                            <p className="text-xs text-orange-800 dark:text-orange-300">
                                                                Plan: {selectedNotaria.active_subscription?.plan?.nombre || 'Sin plan'}
                                                            </p>
                                                            <p className="text-xs text-orange-700 dark:text-orange-400">
                                                                Vence: {new Date(
                                                                    selectedNotaria.active_subscription?.fecha_vencimiento || '',
                                                                ).toLocaleDateString('es-MX')}
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Suscripciones Trial */}
                                                    {selectedNotaria.has_trial_subscriptions && (
                                                        <div className="space-y-2">
                                                            <p className="text-xs font-medium text-blue-800 dark:text-blue-300">
                                                                🔵 Suscripciones TRIAL ({selectedNotaria.trial_subscriptions.length}):
                                                            </p>
                                                            {selectedNotaria.trial_subscriptions.map((trial, idx) => (
                                                                <div key={idx} className="rounded border border-blue-300 bg-blue-100 p-2 dark:border-blue-700 dark:bg-blue-900/30">
                                                                    <p className="text-xs text-blue-800 dark:text-blue-300">
                                                                        Plan: {trial.plan?.nombre || 'Sin plan'}
                                                                    </p>
                                                                    <p className="text-xs text-blue-700 dark:text-blue-400">
                                                                        Vence: {new Date(trial.fecha_vencimiento).toLocaleDateString('es-MX')}
                                                                    </p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    {/* Reglas */}
                                                    <div className="border-t border-blue-300 pt-2 dark:border-blue-700">
                                                        <p className="text-xs font-medium text-blue-900 dark:text-blue-200">
                                                            📋 Reglas:
                                                        </p>
                                                        <ul className="mt-1 space-y-1 text-xs text-blue-800 dark:text-blue-300">
                                                            <li>• Solo puede tener <strong>UNA</strong> suscripción ACTIVA (principal)</li>
                                                            <li>• Puede tener <strong>MÚLTIPLES</strong> suscripciones TRIAL (para probar servicios)</li>
                                                            <li className="text-orange-700 dark:text-orange-400">• Si crea una nueva ACTIVA, debe cancelar la actual primero</li>
                                                            <li className="text-green-700 dark:text-green-400">• Las suscripciones TRIAL son independientes</li>
                                                        </ul>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
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
