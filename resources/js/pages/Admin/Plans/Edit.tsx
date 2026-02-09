import { Head, useForm } from '@inertiajs/react';
import { Package, Save, ArrowLeft, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Badge } from '@/components/ui/badge';
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
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';

interface Service {
    id: number;
    code: string;
    name: string;
    category: string;
    billing_model: string;
}

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
    availableServices: Service[];
}

export default function PlansEdit({ plan, availableServices }: PlansEditProps) {
    const [selectedServices, setSelectedServices] = useState<Service[]>(() => {
        // Convertir herramientas_activas (nombres) a objetos Service
        return availableServices.filter(service => 
            plan.herramientas_activas?.includes(service.name)
        );
    });
    const [caracteristicas, setCaracteristicas] = useState<string[]>(plan.caracteristicas || []);
    const [showServiceModal, setShowServiceModal] = useState(false);
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
        herramientas_activas: JSON.stringify(plan.herramientas_activas),
        caracteristicas: JSON.stringify(plan.caracteristicas),
        is_active: plan.is_active,
        orden: plan.orden.toString(),
    });

    // Sync arrays with form data
    useEffect(() => {
        const serviceNames = selectedServices.map(s => s.name);
        setData('herramientas_activas', JSON.stringify(serviceNames));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedServices]);

    useEffect(() => {
        setData('caracteristicas', JSON.stringify(caracteristicas));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [caracteristicas]);

    const addService = (service: Service) => {
        if (!selectedServices.find(s => s.id === service.id)) {
            setSelectedServices([...selectedServices, service]);
        }
    };

    const removeService = (serviceId: number) => {
        setSelectedServices(selectedServices.filter(s => s.id !== serviceId));
    };

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
                                    <Label htmlFor="nombre">
                                        Nombre del Plan *
                                    </Label>
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
                                    <Label htmlFor="slug">Slug *</Label>
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
                                    <Label htmlFor="descripcion">
                                        Descripción
                                    </Label>
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
                                    <Label htmlFor="precio_mensual">
                                        Precio Mensual *
                                    </Label>
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
                                    <Label htmlFor="precio_anual">
                                        Precio Anual *
                                    </Label>
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
                                    <Label htmlFor="limite_usuarios">
                                        Límite de Usuarios
                                    </Label>
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
                                    <Label htmlFor="limite_busquedas_mes">
                                        Límite de Búsquedas/Mes
                                    </Label>
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
                                    <Label>
                                        Herramientas/Servicios Incluidos
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            (Opcional - Los servicios se gestionan desde "Gestionar Servicios")
                                        </span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={newHerramienta}
                                            onChange={(e) =>
                                                setNewHerramienta(e.target.value)
                                            }
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    addHerramienta();
                                                }
                                            }}
                                            placeholder="Ej: Consulta de listas negras"
                                            className={
                                                errors.herramientas_activas
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addHerramienta}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    {herramientas.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {herramientas.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex items-center gap-1 rounded-md bg-secondary px-3 py-1 text-sm"
                                                >
                                                    <span>{item}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removeHerramienta(index)
                                                        }
                                                        className="ml-1 text-muted-foreground hover:text-destructive"
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                    {errors.herramientas_activas && (
                                        <p className="text-sm text-red-500">
                                            {errors.herramientas_activas}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label>
                                        Características del Plan
                                        <span className="ml-2 text-xs text-muted-foreground">
                                            (Se muestran en las tarjetas de planes)
                                        </span>
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
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
                                            placeholder="Ej: Soporte 24/7"
                                            className={
                                                errors.caracteristicas
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={addCaracteristica}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
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
                                        <Label htmlFor="is_active">
                                            Plan Activo
                                        </Label>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="orden">
                                            Orden de Visualización
                                        </Label>
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
        </AppLayout>
    );
}
