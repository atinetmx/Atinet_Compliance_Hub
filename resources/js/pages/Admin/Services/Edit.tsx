import { Head, useForm } from '@inertiajs/react';
import { Package, Save, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

interface Service {
    id: number;
    code: string;
    name: string;
    description: string;
    category: string;
    billing_model: string;
    unit_price: number | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

interface Category {
    value: string;
    label: string;
}

interface BillingModel {
    value: string;
    label: string;
}

interface ServicesEditProps {
    service: Service;
    categories: Category[];
    billingModels: BillingModel[];
}

export default function ServicesEdit({
    service,
    categories,
    billingModels,
}: ServicesEditProps) {
    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Servicios',
            href: '/admin/services',
        },
        {
            title: service.name,
            href: `/admin/services/${service.id}`,
        },
        {
            title: 'Editar',
            href: '#',
        },
    ];

    const { data, setData, put, processing, errors } = useForm({
        code: service.code,
        name: service.name,
        description: service.description,
        category: service.category,
        billing_model: service.billing_model,
        unit_price: service.unit_price?.toString() ?? '',
        is_active: service.is_active,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/services/${service.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Servicio - ${service.name}`} />

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
                        Editar Servicio: {service.name}
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
                                    <Label htmlFor="code">
                                        Código del Servicio *
                                    </Label>
                                    <Input
                                        id="code"
                                        value={data.code}
                                        onChange={(e) =>
                                            setData('code', e.target.value)
                                        }
                                        placeholder="Ej: BLACKLIST_SAT"
                                        className={
                                            errors.code ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.code && (
                                        <p className="text-sm text-red-500">
                                            {errors.code}
                                        </p>
                                    )}
                                    <p className="text-sm text-muted-foreground">
                                        Solo mayúsculas y guiones bajos
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="name">
                                        Nombre del Servicio *
                                    </Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        placeholder="Ej: Lista Negra SAT"
                                        className={
                                            errors.name ? 'border-red-500' : ''
                                        }
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="description">
                                        Descripción *
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) =>
                                            setData(
                                                'description',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Descripción detallada del servicio..."
                                        rows={3}
                                        className={
                                            errors.description
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-500">
                                            {errors.description}
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

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="category">
                                        Categoría *
                                    </Label>
                                    <Select
                                        value={data.category}
                                        onValueChange={(value) =>
                                            setData('category', value)
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.category
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        >
                                            <SelectValue placeholder="Seleccionar categoría" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((cat) => (
                                                <SelectItem
                                                    key={cat.value}
                                                    value={cat.value}
                                                >
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.category && (
                                        <p className="text-sm text-red-500">
                                            {errors.category}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="billing_model">
                                        Modelo de Facturación *
                                    </Label>
                                    <Select
                                        value={data.billing_model}
                                        onValueChange={(value) =>
                                            setData('billing_model', value)
                                        }
                                    >
                                        <SelectTrigger
                                            className={
                                                errors.billing_model
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        >
                                            <SelectValue placeholder="Seleccionar modelo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {billingModels.map((model) => (
                                                <SelectItem
                                                    key={model.value}
                                                    value={model.value}
                                                >
                                                    {model.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.billing_model && (
                                        <p className="text-sm text-red-500">
                                            {errors.billing_model}
                                        </p>
                                    )}
                                </div>

                                {data.billing_model === 'per_use' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="unit_price">
                                            Precio Unitario *
                                        </Label>
                                        <Input
                                            id="unit_price"
                                            type="number"
                                            step="0.01"
                                            value={data.unit_price}
                                            onChange={(e) =>
                                                setData(
                                                    'unit_price',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="0.00"
                                            className={
                                                errors.unit_price
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        {errors.unit_price && (
                                            <p className="text-sm text-red-500">
                                                {errors.unit_price}
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center space-x-2">
                                    <Switch
                                        id="is_active"
                                        checked={data.is_active}
                                        onCheckedChange={(checked) =>
                                            setData('is_active', checked)
                                        }
                                    />
                                    <Label htmlFor="is_active">
                                        Servicio activo
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Botones */}
                        <div className="flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
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
