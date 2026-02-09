import { Head, useForm } from '@inertiajs/react';
import { Building2, Save, ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AppLayout from '@/layouts/app-layout';

import type { BreadcrumbItem } from '@/types';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface Plan {
    id: number;
    nombre: string;
    descripcion: string;
    precio_mensual: number;
    limite_usuarios: number;
    limite_busquedas_mes: number;
    herramientas_activas: string[];
}

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
    plan_id: number;
    contacto_principal: string;
    email_contacto: string;
    telefono: string;
    direccion: string;
    notas_internas: string;
    activa: boolean;
    limite_usuarios_custom: number | null;
    limite_busquedas_mes_custom: number | null;
    herramientas_activas_custom: string[] | null;
}

interface NotariaEditProps {
    notaria: Notaria;
    planes: Plan[];
}

export default function NotariaEdit({ notaria, planes }: NotariaEditProps) {
    const { data, setData, put, processing, errors } = useForm({
        nombre: notaria.nombre,
        numero_notaria: notaria.numero_notaria,
        plan_id: notaria.plan_id.toString(),
        contacto_principal: notaria.contacto_principal,
        email_contacto: notaria.email_contacto,
        telefono: notaria.telefono || '',
        direccion: notaria.direccion || '',
        notas_internas: notaria.notas_internas || '',
        activa: notaria.activa,
        limite_usuarios_custom: notaria.limite_usuarios_custom?.toString() || '',
        limite_busquedas_mes_custom: notaria.limite_busquedas_mes_custom?.toString() || '',
        herramientas_activas_custom: notaria.herramientas_activas_custom || [],
    });

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Dashboard',
            href: '/dashboard',
        },
        {
            title: 'Notarías',
            href: '/admin/notarias',
        },
        {
            title: notaria.nombre,
            href: `/admin/notarias/${notaria.id}`,
        },
        {
            title: 'Editar',
            href: `/admin/notarias/${notaria.id}/edit`,
        },
    ];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(`/admin/notarias/${notaria.id}`);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Editar Notaría - ${notaria.nombre}`} />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="outline" size="sm" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <Building2 className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Editar Notaría: {notaria.nombre}</h1>
                </div>

                {/* Form */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información Básica */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Información Básica</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">Nombre de la Notaría *</Label>
                                    <Input
                                        id="nombre"
                                        value={data.nombre}
                                        onChange={e => setData('nombre', e.target.value)}
                                        placeholder="Ej. Notaría Pública No. 45"
                                        className={errors.nombre ? 'border-red-500' : ''}
                                    />
                                    {errors.nombre && (
                                        <p className="text-sm text-red-500">{errors.nombre}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="numero_notaria">Número de Notaría *</Label>
                                    <Input
                                        id="numero_notaria"
                                        value={data.numero_notaria}
                                        onChange={e => setData('numero_notaria', e.target.value)}
                                        placeholder="Ej. 45"
                                        className={errors.numero_notaria ? 'border-red-500' : ''}
                                    />
                                    {errors.numero_notaria && (
                                        <p className="text-sm text-red-500">{errors.numero_notaria}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="plan_id">Plan de Suscripción *</Label>
                                    <Select value={data.plan_id} onValueChange={(value) => setData('plan_id', value)}>
                                        <SelectTrigger className={errors.plan_id ? 'border-red-500' : ''}>
                                            <SelectValue placeholder="Seleccionar plan" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {planes.map((plan) => (
                                                <SelectItem key={plan.id} value={plan.id.toString()}>
                                                    {plan.nombre} - ${plan.precio_mensual}/mes
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    {errors.plan_id && (
                                        <p className="text-sm text-red-500">{errors.plan_id}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Switch
                                            checked={data.activa}
                                            onCheckedChange={(checked) => setData('activa', checked)}
                                        />
                                        Notaría Activa
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Información de Contacto */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Información de Contacto</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contacto_principal">Contacto Principal *</Label>
                                    <Input
                                        id="contacto_principal"
                                        value={data.contacto_principal}
                                        onChange={e => setData('contacto_principal', e.target.value)}
                                        placeholder="Nombre del responsable"
                                        className={errors.contacto_principal ? 'border-red-500' : ''}
                                    />
                                    {errors.contacto_principal && (
                                        <p className="text-sm text-red-500">{errors.contacto_principal}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email_contacto">Email de Contacto *</Label>
                                    <Input
                                        id="email_contacto"
                                        type="email"
                                        value={data.email_contacto}
                                        onChange={e => setData('email_contacto', e.target.value)}
                                        placeholder="contacto@notaria45.com"
                                        className={errors.email_contacto ? 'border-red-500' : ''}
                                    />
                                    {errors.email_contacto && (
                                        <p className="text-sm text-red-500">{errors.email_contacto}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input
                                        id="telefono"
                                        value={data.telefono}
                                        onChange={e => setData('telefono', e.target.value)}
                                        placeholder="555-123-4567"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="direccion">Dirección</Label>
                                    <Input
                                        id="direccion"
                                        value={data.direccion}
                                        onChange={e => setData('direccion', e.target.value)}
                                        placeholder="Dirección completa de la notaría"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="notas_internas">Notas Internas</Label>
                                    <Textarea
                                        id="notas_internas"
                                        value={data.notas_internas}
                                        onChange={e => setData('notas_internas', e.target.value)}
                                        placeholder="Notas adicionales para uso interno..."
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Configuraciones Personalizadas (Opcional) */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">
                                Configuraciones Personalizadas
                                <span className="text-sm font-normal text-muted-foreground ml-2">(Opcional - sobrescribe el plan)</span>
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="limite_usuarios_custom">Límite de Usuarios Personalizado</Label>
                                    <Input
                                        id="limite_usuarios_custom"
                                        type="number"
                                        min="0"
                                        value={data.limite_usuarios_custom}
                                        onChange={e => setData('limite_usuarios_custom', e.target.value)}
                                        placeholder="Dejar vacío para usar el del plan"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="limite_busquedas_mes_custom">Límite de Búsquedas/Mes Personalizado</Label>
                                    <Input
                                        id="limite_busquedas_mes_custom"
                                        type="number"
                                        min="0"
                                        value={data.limite_busquedas_mes_custom}
                                        onChange={e => setData('limite_busquedas_mes_custom', e.target.value)}
                                        placeholder="Dejar vacío para usar el del plan"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center gap-4 pt-6 border-t">
                            <Button type="submit" disabled={processing}>
                                <Save className="h-4 w-4 mr-2" />
                                {processing ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                            <Button type="button" variant="outline" onClick={() => window.history.back()}>
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
