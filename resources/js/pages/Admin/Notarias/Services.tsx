import { Head, router, useForm } from '@inertiajs/react';
import {
    Building2,
    ArrowLeft,
    Settings,
    Plus,
    Edit,
    Trash2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';

interface PlanConfig {
    is_included: boolean;
    usage_limit: number | null;
    extra_price: number | string | null;
    priority: number;
}

interface PlanService {
    id: number;
    code: string;
    name: string;
    description: string;
    category: string;
    billing_model: string;
    unit_price: number | string;
    is_active: boolean;
    plan_config: PlanConfig;
}

interface TenantService {
    id: number;
    service_id: number;
    is_enabled: boolean;
    custom_limit: number | null;
    custom_price: number | string | null;
    activation_date: string | null;
    expiration_date: string | null;
    notes: string | null;
    service: {
        id: number;
        code: string;
        name: string;
        category: string;
    };
}

interface Plan {
    id: number;
    nombre: string;
    descripcion: string;
}

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
    plan: Plan;
}

interface NotariasServicesProps {
    notaria: Notaria;
    planServices: PlanService[];
    tenantServices: TenantService[];
}

export default function NotariasServices({
    notaria,
    planServices,
    tenantServices,
}: NotariasServicesProps) {
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [selectedService, setSelectedService] = useState<PlanService | null>(null);
    const [editingTenant, setEditingTenant] = useState<TenantService | null>(null);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        service_id: 0,
        is_enabled: true,
        custom_limit: '',
        custom_price: '',
        activation_date: '',
        expiration_date: '',
        notes: '',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dashboard', href: '/dashboard' },
        { title: 'Notarías', href: '/admin/notarias' },
        { title: notaria.nombre, href: `/admin/notarias/${notaria.id}` },
        { title: 'Gestionar Servicios', href: '#' },
    ];

    const getCategoryColor = (category: string) => {
        const colors: { [key: string]: string } = {
            consulta: 'bg-blue-100 text-blue-800',
            api: 'bg-green-100 text-green-800',
            sistema: 'bg-purple-100 text-purple-800',
            analisis: 'bg-orange-100 text-orange-800',
            storage: 'bg-yellow-100 text-yellow-800',
            integration: 'bg-pink-100 text-pink-800',
        };
        return colors[category] || 'bg-gray-100 text-gray-800';
    };

    const openConfigModal = (service: PlanService) => {
        const existingConfig = tenantServices.find(
            (ts) => ts.service_id === service.id
        );

        if (existingConfig) {
            setEditingTenant(existingConfig);
            setData({
                service_id: service.id,
                is_enabled: existingConfig.is_enabled,
                custom_limit: existingConfig.custom_limit?.toString() || '',
                custom_price: existingConfig.custom_price?.toString() || '',
                activation_date: existingConfig.activation_date || '',
                expiration_date: existingConfig.expiration_date || '',
                notes: existingConfig.notes || '',
            });
        } else {
            setEditingTenant(null);
            setData({
                service_id: service.id,
                is_enabled: true,
                custom_limit: '',
                custom_price: '',
                activation_date: '',
                expiration_date: '',
                notes: '',
            });
        }

        setSelectedService(service);
        setShowConfigModal(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (editingTenant) {
            put(`/admin/notarias/${notaria.id}/services/${editingTenant.id}`, {
                onSuccess: () => {
                    setShowConfigModal(false);
                    reset();
                },
            });
        } else {
            post(`/admin/notarias/${notaria.id}/services`, {
                onSuccess: () => {
                    setShowConfigModal(false);
                    reset();
                },
            });
        }
    };

    const handleToggle = (tenantService: TenantService) => {
        router.post(
            `/admin/notarias/${notaria.id}/services/${tenantService.id}/toggle`,
            {},
            {
                preserveScroll: true,
            }
        );
    };

    const handleDelete = (tenantService: TenantService) => {
        if (confirm('¿Eliminar la configuración personalizada? Se usará la del plan.')) {
            router.delete(
                `/admin/notarias/${notaria.id}/services/${tenantService.id}`,
                {
                    preserveScroll: true,
                }
            );
        }
    };

    const getExistingConfig = (serviceId: number) => {
        return tenantServices.find((ts) => ts.service_id === serviceId);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Servicios - ${notaria.nombre}`} />

            <div className="flex h-full flex-1 flex-col gap-6 p-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.visit(`/admin/notarias/${notaria.id}`)}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Volver
                        </Button>
                        <Building2 className="h-6 w-6 text-primary" />
                        <div>
                            <h1 className="text-2xl font-bold">Gestionar Servicios</h1>
                            <p className="text-muted-foreground">
                                {notaria.nombre} - Plan: {notaria.plan.nombre}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Plan Info Card */}
                <Card>
                    <CardHeader>
                        <CardTitle>Información del Plan</CardTitle>
                        <CardDescription>
                            {notaria.plan.descripcion}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            <strong>Servicios incluidos:</strong> {planServices.length}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                            <strong>Personalizados:</strong> {tenantServices.length}
                        </p>
                    </CardContent>
                </Card>

                {/* Services Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {planServices.map((service) => {
                        const tenantConfig = getExistingConfig(service.id);
                        const hasCustomConfig = !!tenantConfig;

                        return (
                            <Card key={service.id} className="relative">
                                {hasCustomConfig && (
                                    <div className="absolute top-2 right-2">
                                        <Badge variant="secondary">
                                            Personalizado
                                        </Badge>
                                    </div>
                                )}
                                <CardHeader>
                                    <CardTitle className="flex items-center justify-between text-base">
                                        <span>{service.name}</span>
                                        <Badge className={getCategoryColor(service.category)}>
                                            {service.category}
                                        </Badge>
                                    </CardTitle>
                                    <CardDescription className="text-xs">
                                        {service.code}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Plan Config */}
                                    <div className="rounded-md bg-muted p-3 text-xs space-y-1">
                                        <p className="font-semibold">Configuración del Plan:</p>
                                        <p>
                                            Incluido: {service.plan_config.is_included ? '✓' : '✗'}
                                        </p>
                                        {service.plan_config.usage_limit && (
                                            <p>
                                                Límite: {service.plan_config.usage_limit} usos/mes
                                            </p>
                                        )}
                                        {service.plan_config.extra_price && (
                                            <p>
                                                Precio extra: ${service.plan_config.extra_price}
                                            </p>
                                        )}
                                    </div>

                                    {/* Custom Config */}
                                    {hasCustomConfig && tenantConfig && (
                                        <div className="rounded-md bg-blue-50 p-3 text-xs space-y-1">
                                            <div className="flex items-center justify-between">
                                                <p className="font-semibold">Personalizado:</p>
                                                {tenantConfig.is_enabled ? (
                                                    <ToggleRight className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <ToggleLeft className="h-4 w-4 text-gray-400" />
                                                )}
                                            </div>
                                            {tenantConfig.custom_limit && (
                                                <p>Límite: {tenantConfig.custom_limit} usos/mes</p>
                                            )}
                                            {tenantConfig.custom_price && (
                                                <p>Precio: ${tenantConfig.custom_price}</p>
                                            )}
                                            {tenantConfig.notes && (
                                                <p className="text-muted-foreground">
                                                    {tenantConfig.notes}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1"
                                            onClick={() => openConfigModal(service)}
                                        >
                                            {hasCustomConfig ? (
                                                <>
                                                    <Edit className="mr-1 h-3 w-3" />
                                                    Editar
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="mr-1 h-3 w-3" />
                                                    Personalizar
                                                </>
                                            )}
                                        </Button>
                                        {hasCustomConfig && tenantConfig && (
                                            <>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleToggle(tenantConfig)}
                                                >
                                                    {tenantConfig.is_enabled ? (
                                                        <ToggleRight className="h-4 w-4" />
                                                    ) : (
                                                        <ToggleLeft className="h-4 w-4" />
                                                    )}
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="destructive"
                                                    onClick={() => handleDelete(tenantConfig)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>

            {/* Config Modal */}
            <Dialog open={showConfigModal} onOpenChange={setShowConfigModal}>
                <DialogContent className="max-w-md">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editingTenant ? 'Editar' : 'Configurar'} Servicio
                            </DialogTitle>
                            <DialogDescription>
                                {selectedService?.name} - Configuración personalizada
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="is_enabled"
                                    checked={data.is_enabled}
                                    onCheckedChange={(checked) =>
                                        setData('is_enabled', checked)
                                    }
                                />
                                <Label htmlFor="is_enabled">Servicio Habilitado</Label>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom_limit">
                                    Límite Personalizado (usos/mes)
                                </Label>
                                <Input
                                    id="custom_limit"
                                    type="number"
                                    value={data.custom_limit}
                                    onChange={(e) =>
                                        setData('custom_limit', e.target.value)
                                    }
                                    placeholder="Dejar vacío para usar límite del plan"
                                />
                                {errors.custom_limit && (
                                    <p className="text-sm text-red-500">
                                        {errors.custom_limit}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="custom_price">
                                    Precio Personalizado ($)
                                </Label>
                                <Input
                                    id="custom_price"
                                    type="number"
                                    step="0.01"
                                    value={data.custom_price}
                                    onChange={(e) =>
                                        setData('custom_price', e.target.value)
                                    }
                                    placeholder="Dejar vacío para usar precio del plan"
                                />
                                {errors.custom_price && (
                                    <p className="text-sm text-red-500">
                                        {errors.custom_price}
                                    </p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="activation_date">
                                        Fecha Activación
                                    </Label>
                                    <Input
                                        id="activation_date"
                                        type="date"
                                        value={data.activation_date}
                                        onChange={(e) =>
                                            setData('activation_date', e.target.value)
                                        }
                                    />
                                    {errors.activation_date && (
                                        <p className="text-sm text-red-500">
                                            {errors.activation_date}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="expiration_date">
                                        Fecha Expiración
                                    </Label>
                                    <Input
                                        id="expiration_date"
                                        type="date"
                                        value={data.expiration_date}
                                        onChange={(e) =>
                                            setData('expiration_date', e.target.value)
                                        }
                                    />
                                    {errors.expiration_date && (
                                        <p className="text-sm text-red-500">
                                            {errors.expiration_date}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Notas</Label>
                                <Textarea
                                    id="notes"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Notas u observaciones internas..."
                                    rows={3}
                                />
                                {errors.notes && (
                                    <p className="text-sm text-red-500">
                                        {errors.notes}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowConfigModal(false)}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <Settings className="mr-2 h-4 w-4" />
                                {processing
                                    ? 'Guardando...'
                                    : editingTenant
                                    ? 'Actualizar'
                                    : 'Guardar'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
