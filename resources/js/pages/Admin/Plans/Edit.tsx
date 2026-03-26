import { Head, useForm } from '@inertiajs/react';
import { Package, Save, ArrowLeft, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { RequiredLabel } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    nombre: string;
    slug: string;
    descripcion?: string;
    precio_mensual: number;
    precio_anual: number;
    limite_usuarios: number | null;
    limite_busquedas_mes: number | null;
    herramientas_activas: string[];
    caracteristicas: string[];
    is_active: boolean;
    orden: number;
    created_at: string;
    updated_at: string;
}

interface PlansEditProps {
    plan: Plan;
}

export default function PlansEdit({ plan }: PlansEditProps) {
    const [caracteristicas, setCaracteristicas] = useState<string[]>(plan.caracteristicas || []);
    const [showCaracteristicaModal, setShowCaracteristicaModal] = useState(false);
    const [newCaracteristica, setNewCaracteristica] = useState('');

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Inicio',
            href: '/dashboard',
        },
        {
            title: 'Planes',
            href: '/admin/plans',
        },
        {
            title: plan.nombre,
            href: `/admin/plans/${plan.id}`,
        },
        {
            title: 'Editar',
            href: '#',
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        nombre: plan.nombre,
        slug: plan.slug,
        descripcion: plan.descripcion || '',
        precio_mensual: plan.precio_mensual.toString(),
        precio_anual: plan.precio_anual.toString(),
        limite_usuarios: plan.limite_usuarios?.toString() ?? '',
        limite_busquedas_mes: plan.limite_busquedas_mes?.toString() ?? '',
        herramientas_activas: plan.herramientas_activas || [] as string[],
        caracteristicas: plan.caracteristicas || [] as string[],
        is_active: plan.is_active,
        orden: plan.orden.toString(),
    });

    // Sync caracteristicas with form data
    useEffect(() => {
        setData('caracteristicas', caracteristicas);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caracteristicas]);

    const addCaracteristica = () => {
        if (newCaracteristica.trim()) {
            setCaracteristicas([...caracteristicas, newCaracteristica.trim()]);
            setNewCaracteristica('');
            setShowCaracteristicaModal(false);
        }
    };

    const removeCaracteristica = (index: number) => {
        setCaracteristicas(caracteristicas.filter((_, i) => i !== index));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/plans/${plan.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Plan - ${plan.nombre}`} />

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
                    <Package className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">
                        Editar Plan: {plan.nombre}
                    </h1>
                </div>

                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información Básica */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Información Básica
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="nombre">
                                        Nombre del Plan *
                                    </RequiredLabel>
                                    <Input
                                        id="nombre"
                                        value={data.nombre}
                                        onChange={(e) =>
                                            setData('nombre', e.target.value)
                                        }
                                        placeholder="Ej: Plan Básico"
                                        className={
                                            errors.nombre
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.nombre && (
                                        <p className="text-sm text-red-500">
                                            {errors.nombre}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="slug">Slug *</RequiredLabel>
                                    <Input
                                        id="slug"
                                        value={data.slug}
                                        onChange={(e) =>
                                            setData('slug', e.target.value)
                                        }
                                        placeholder="plan-basico"
                                        className={
                                            errors.slug ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.slug && (
                                        <p className="text-sm text-red-500">
                                            {errors.slug}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <RequiredLabel htmlFor="descripcion">
                                        Descripción
                                    </RequiredLabel>
                                    <Textarea
                                        id="descripcion"
                                        value={data.descripcion}
                                        onChange={(e) =>
                                            setData(
                                                'descripcion',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Descripción del plan..."
                                        rows={3}
                                        className={
                                            errors.descripcion
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.descripcion && (
                                        <p className="text-sm text-red-500">
                                            {errors.descripcion}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Precios y Límites */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Precios y Límites
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="precio_mensual">
                                        Precio Mensual *
                                    </RequiredLabel>
                                    <Input
                                        id="precio_mensual"
                                        type="number"
                                        step="0.01"
                                        value={data.precio_mensual}
                                        onChange={(e) =>
                                            setData(
                                                'precio_mensual',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                        className={
                                            errors.precio_mensual
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.precio_mensual && (
                                        <p className="text-sm text-red-500">
                                            {errors.precio_mensual}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="precio_anual">
                                        Precio Anual *
                                    </RequiredLabel>
                                    <Input
                                        id="precio_anual"
                                        type="number"
                                        step="0.01"
                                        value={data.precio_anual}
                                        onChange={(e) =>
                                            setData(
                                                'precio_anual',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="0.00"
                                        className={
                                            errors.precio_anual
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.precio_anual && (
                                        <p className="text-sm text-red-500">
                                            {errors.precio_anual}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="limite_usuarios">
                                        Límite de Usuarios
                                    </RequiredLabel>
                                    <Input
                                        id="limite_usuarios"
                                        type="number"
                                        value={data.limite_usuarios}
                                        onChange={(e) =>
                                            setData(
                                                'limite_usuarios',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Dejar vacío para ilimitado"
                                        className={
                                            errors.limite_usuarios
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.limite_usuarios && (
                                        <p className="text-sm text-red-500">
                                            {errors.limite_usuarios}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="limite_busquedas_mes">
                                        Límite de Búsquedas/Mes
                                    </RequiredLabel>
                                    <Input
                                        id="limite_busquedas_mes"
                                        type="number"
                                        value={data.limite_busquedas_mes}
                                        onChange={(e) =>
                                            setData(
                                                'limite_busquedas_mes',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Dejar vacío para ilimitado"
                                        className={
                                            errors.limite_busquedas_mes
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.limite_busquedas_mes && (
                                        <p className="text-sm text-red-500">
                                            {errors.limite_busquedas_mes}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Configuración */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Configuración
                            </h3>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <RequiredLabel>
                                        Características del Plan
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            (Se muestran en las tarjetas de planes)
                                        </span>
                                    </RequiredLabel>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowCaracteristicaModal(true)}
                                        className="w-full"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Agregar Característica
                                    </Button>
                                    {caracteristicas.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {caracteristicas.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-sm"
                                                >
                                                    <span>{item}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeCaracteristica(index)
                                                        }
                                                        className="ml-1 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.caracteristicas && (
                                        <p className="text-sm text-red-500">
                                            {errors.caracteristicas}
                                        </p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                    <div className="flex items-center space-x-2">
                                        <Switch
                                            id="is_active"
                                            checked={data.is_active}
                                            onCheckedChange={(checked) =>
                                                setData('is_active', checked)
                                            }
                                        />
                                        <RequiredLabel htmlFor="is_active">
                                            Plan Activo
                                        </RequiredLabel>
                                    </div>

                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="orden">
                                            Orden de Visualización
                                        </RequiredLabel>
                                        <Input
                                            id="orden"
                                            type="number"
                                            value={data.orden}
                                            onChange={(e) =>
                                                setData('orden', e.target.value)
                                            }
                                            className={
                                                errors.orden
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Números menores aparecen primero en la lista
                                        </p>
                                        {errors.orden && (
                                            <p className="text-sm text-red-500">
                                                {errors.orden}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
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

            {/* Modal para agregar características */}
            <Dialog
                open={showCaracteristicaModal}
                onOpenChange={setShowCaracteristicaModal}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar Característica</DialogTitle>
                        <DialogDescription>
                            Escribe una característica del plan (ej: Soporte
                            24/7)
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <RequiredLabel htmlFor="caracteristica">
                                Característica
                            </RequiredLabel>
                            <Input
                                id="caracteristica"
                                value={newCaracteristica}
                                onChange={(e) =>
                                    setNewCaracteristica(e.target.value)
                                }
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addCaracteristica();
                                    }
                                }}
                                placeholder="Ej: Soporte técnico 24/7"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                setShowCaracteristicaModal(false);
                                setNewCaracteristica('');
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="button"
                            onClick={addCaracteristica}
                            disabled={!newCaracteristica.trim()}
                        >
                            Agregar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
