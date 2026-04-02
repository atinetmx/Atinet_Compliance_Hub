import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowLeft,
    Package,
    Plus,
    Settings,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';

interface Plan {
    id: number;
    nombre: string;
    descripcion?: string;
    precio_mensual: number;
    precio_anual: number;
}

interface Service {
    id: number;
    code: string;
    name: string;
    description: string;
    category: string;
    billing_model: string;
    unit_price: number | null;
    is_active: boolean;
    pivot?: {
        is_included: boolean;
        usage_limit: number | null;
        extra_price: number | null;
        priority: number;
    };
}

interface PlanServicesProps {
    plan: Plan;
    assignedServices: Service[];
    availableServices: Service[];
}

interface ServiceFormData {
    is_included: boolean;
    usage_limit: string;
    extra_price: string;
    priority: string;
}

export default function PlanServices({
    plan,
    assignedServices,
    availableServices,
}: PlanServicesProps) {
    const [editingService, setEditingService] = useState<Service | null>(null);
    const [addingService, setAddingService] = useState<Service | null>(null);
    const [formData, setFormData] = useState<ServiceFormData>({
        is_included: true,
        usage_limit: '',
        extra_price: '',
        priority: '0',
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
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
            title: 'Servicios',
            href: `/admin/plans/${plan.id}/services`,
            icon: Package,
        },
    ];

    const getCategoryBadge = (category: string) => {
        const colors: Record<string, string> = {
            consulta:
                'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
            api: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
            sistema:
                'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
            analisis:
                'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
            storage:
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
            integration:
                'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300',
        };

        return (
            <Badge
                className={colors[category] || 'bg-gray-100 text-gray-800'}
            >
                {category}
            </Badge>
        );
    };

    const openEditDialog = (service: Service) => {
        setEditingService(service);
        setFormData({
            is_included: service.pivot?.is_included ?? true,
            usage_limit: service.pivot?.usage_limit?.toString() ?? '',
            extra_price: service.pivot?.extra_price?.toString() ?? '',
            priority: service.pivot?.priority?.toString() ?? '0',
        });
    };

    const openAddDialog = (service: Service) => {
        setAddingService(service);
        setFormData({
            is_included: true,
            usage_limit: '',
            extra_price: '',
            priority: '0',
        });
    };

    const closeDialogs = () => {
        setEditingService(null);
        setAddingService(null);
        setFormData({
            is_included: true,
            usage_limit: '',
            extra_price: '',
            priority: '0',
        });
    };

    const handleSaveEdit = () => {
        if (!editingService) return;

        router.put(
            `/admin/plans/${plan.id}/services/${editingService.id}`,
            {
                is_included: formData.is_included,
                usage_limit: formData.usage_limit || null,
                extra_price: formData.extra_price || null,
                priority: parseInt(formData.priority) || 0,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => closeDialogs(),
            },
        );
    };

    const handleAddService = () => {
        if (!addingService) return;

        router.post(
            `/admin/plans/${plan.id}/services`,
            {
                service_id: addingService.id,
                is_included: formData.is_included,
                usage_limit: formData.usage_limit || null,
                extra_price: formData.extra_price || null,
                priority: parseInt(formData.priority) || 0,
            },
            {
                preserveState: true,
                preserveScroll: true,
                onSuccess: () => closeDialogs(),
            },
        );
    };

    const handleRemoveService = (service: Service) => {
        if (
            confirm(
                `¿Estás seguro de quitar el servicio "${service.name}" del plan? Esta acción no se puede deshacer.`,
            )
        ) {
            router.delete(`/admin/plans/${plan.id}/services/${service.id}`, {
                preserveState: true,
                preserveScroll: true,
            });
        }
    };

    const handleToggleIncluded = (service: Service) => {
        router.put(
            `/admin/plans/${plan.id}/services/${service.id}`,
            {
                is_included: !service.pivot?.is_included,
                usage_limit: service.pivot?.usage_limit ?? null,
                extra_price: service.pivot?.extra_price ?? null,
                priority: service.pivot?.priority ?? 0,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Servicios - ${plan.nombre}`} />

            <div className="flex h-full flex-1 flex-col gap-6 overflow-x-auto rounded-xl p-4">
                {/* Servicios Asignados */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background">
                    <div className="border-b p-4">
                        <div className="flex items-center gap-2">
                            <Package className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">
                                Servicios Asignados
                            </h2>
                        </div>
                    </div>

                    <div className="p-4">
                        {assignedServices.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <Package className="mx-auto mb-2 h-12 w-12 opacity-30" />
                                <p>No hay servicios asignados a este plan</p>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-20">
                                            Prioridad
                                        </TableHead>
                                        <TableHead>Servicio</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead className="w-32">
                                            Incluido
                                        </TableHead>
                                        <TableHead>Límite</TableHead>
                                        <TableHead>Precio Extra</TableHead>
                                        <TableHead className="w-32 text-right">
                                            Acciones
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {assignedServices.map((service) => (
                                        <TableRow key={service.id}>
                                            <TableCell className="font-mono">
                                                {service.pivot?.priority ?? 0}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {service.name}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {service.code}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {getCategoryBadge(
                                                    service.category,
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Switch
                                                    checked={
                                                        service.pivot
                                                            ?.is_included ??
                                                        false
                                                    }
                                                    onCheckedChange={() =>
                                                        handleToggleIncluded(
                                                            service,
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {service.pivot?.usage_limit ??
                                                    'Sin límite'}
                                            </TableCell>
                                            <TableCell>
                                                {service.pivot?.extra_price
                                                    ? `$${service.pivot.extra_price}`
                                                    : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            openEditDialog(
                                                                service,
                                                            )
                                                        }
                                                    >
                                                        <Settings className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            handleRemoveService(
                                                                service,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>

                {/* Servicios Disponibles */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background">
                    <div className="border-b p-4">
                        <div className="flex items-center gap-2">
                            <Plus className="h-5 w-5 text-primary" />
                            <h2 className="text-lg font-semibold">
                                Servicios Disponibles
                            </h2>
                        </div>
                    </div>

                    <div className="p-4">
                        {availableServices.length === 0 ? (
                            <div className="py-8 text-center text-muted-foreground">
                                <Package className="mx-auto mb-2 h-12 w-12 opacity-30" />
                                <p>
                                    Todos los servicios están asignados a este
                                    plan
                                </p>
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {availableServices.map((service) => (
                                    <Card key={service.id}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <CardTitle className="text-base">
                                                        {service.name}
                                                    </CardTitle>
                                                    <p className="mt-1 text-xs text-muted-foreground">
                                                        {service.code}
                                                    </p>
                                                </div>
                                                {getCategoryBadge(
                                                    service.category,
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
                                                {service.description}
                                            </p>
                                            <Button
                                                className="w-full"
                                                variant="outline"
                                                onClick={() =>
                                                    openAddDialog(service)
                                                }
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                Agregar al plan
                                            </Button>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal de Edición */}
            <Dialog open={!!editingService} onOpenChange={closeDialogs}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Configurar Servicio</DialogTitle>
                        <DialogDescription>
                            {editingService?.name} - {editingService?.code}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <RequiredLabel htmlFor="edit-included">
                                Incluido en el plan
                            </RequiredLabel>
                            <Switch
                                id="edit-included"
                                checked={formData.is_included}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        is_included: checked,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="edit-limit">
                                Límite de uso (opcional)
                            </RequiredLabel>
                            <Input
                                id="edit-limit"
                                type="number"
                                placeholder="Ej: 100"
                                value={formData.usage_limit}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        usage_limit: e.target.value,
                                    })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Dejar vacío para sin límite
                            </p>
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="edit-price">
                                Precio extra por uso (opcional)
                            </RequiredLabel>
                            <Input
                                id="edit-price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.extra_price}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        extra_price: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="edit-priority">Prioridad</RequiredLabel>
                            <Input
                                id="edit-priority"
                                type="number"
                                placeholder="0"
                                value={formData.priority}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        priority: e.target.value,
                                    })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Mayor número = mayor prioridad
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialogs}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveEdit}>Guardar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Agregar Servicio */}
            <Dialog open={!!addingService} onOpenChange={closeDialogs}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar Servicio al Plan</DialogTitle>
                        <DialogDescription>
                            {addingService?.name} - {addingService?.code}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <RequiredLabel htmlFor="add-included">
                                Incluido en el plan
                            </RequiredLabel>
                            <Switch
                                id="add-included"
                                checked={formData.is_included}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        is_included: checked,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="add-limit">
                                Límite de uso (opcional)
                            </RequiredLabel>
                            <Input
                                id="add-limit"
                                type="number"
                                placeholder="Ej: 100"
                                value={formData.usage_limit}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        usage_limit: e.target.value,
                                    })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Dejar vacío para sin límite
                            </p>
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="add-price">
                                Precio extra por uso (opcional)
                            </RequiredLabel>
                            <Input
                                id="add-price"
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.extra_price}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        extra_price: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <RequiredLabel htmlFor="add-priority">Prioridad</RequiredLabel>
                            <Input
                                id="add-priority"
                                type="number"
                                placeholder="0"
                                value={formData.priority}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        priority: e.target.value,
                                    })
                                }
                            />
                            <p className="text-xs text-muted-foreground">
                                Mayor número = mayor prioridad
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={closeDialogs}>
                            Cancelar
                        </Button>
                        <Button onClick={handleAddService}>
                            Agregar Servicio
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
}
