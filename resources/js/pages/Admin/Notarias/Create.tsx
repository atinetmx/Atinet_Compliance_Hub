import { Head, useForm } from '@inertiajs/react';
import { Building2, Save, ArrowLeft } from 'lucide-react';
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
import { ESTADOS_MEXICO } from '@/types/estados';

interface Plan {
    id: number;
    nombre: string;
    descripcion: string;
    precio_mensual: number;
    limite_usuarios: number;
    limite_busquedas_mes: number;
    herramientas_activas: string[];
}

interface NotariaCreateProps {
    planes: Plan[];
}

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
        title: 'Crear Nueva',
        href: '/admin/notarias/create',
    },
];

export default function NotariaCreate({ planes }: NotariaCreateProps) {
    const { data, setData, post, processing, errors } = useForm({
        nombre: '',
        numero_notaria: '',
        plan_id: '',
        contacto_principal: '',
        email_contacto: '',
        telefono: '',
        direccion: '',
        notas_internas: '',
        activa: true,
        limite_usuarios_custom: '',
        limite_busquedas_mes_custom: '',
        herramientas_activas_custom: [],
        // Campos de ubicación normalizados
        estado: '',
        municipio: '',
        codigo_postal: '',
        colonia: '',
        calle: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/notarias');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Crear Nueva Notaría" />

            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                {/* Header */}
                <div className="mb-6 flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.history.back()}
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Button>
                    <Building2 className="h-6 w-6 text-primary" />
                    <h1 className="text-2xl font-bold">Crear Nueva Notaría</h1>
                </div>

                {/* Form */}
                <div className="rounded-xl border border-sidebar-border/70 bg-background p-6 dark:border-sidebar-border">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Información Básica */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Información Básica
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">
                                        Nombre de la Notaría *
                                    </Label>
                                    <Input
                                        id="nombre"
                                        value={data.nombre}
                                        onChange={(e) =>
                                            setData('nombre', e.target.value)
                                        }
                                        placeholder="Ej. Notaría Pública No. 45"
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
                                    <Label htmlFor="numero_notaria">
                                        Número de Notaría *
                                    </Label>
                                    <Input
                                        id="numero_notaria"
                                        value={data.numero_notaria}
                                        onChange={(e) =>
                                            setData(
                                                'numero_notaria',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Ej. 45"
                                        className={
                                            errors.numero_notaria
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.numero_notaria && (
                                        <p className="text-sm text-red-500">
                                            {errors.numero_notaria}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="plan_id">
                                        Plan de Suscripción *
                                    </Label>
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
                                            {planes.map((plan) => (
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
                                    <Label className="flex items-center gap-2">
                                        <Switch
                                            checked={data.activa}
                                            onCheckedChange={(checked) =>
                                                setData('activa', checked)
                                            }
                                        />
                                        Notaría Activa
                                    </Label>
                                </div>
                            </div>
                        </div>

                        {/* Información de Contacto */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Información de Contacto
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contacto_principal">
                                        Contacto Principal *
                                    </Label>
                                    <Input
                                        id="contacto_principal"
                                        value={data.contacto_principal}
                                        onChange={(e) =>
                                            setData(
                                                'contacto_principal',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Nombre del responsable"
                                        className={
                                            errors.contacto_principal
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.contacto_principal && (
                                        <p className="text-sm text-red-500">
                                            {errors.contacto_principal}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email_contacto">
                                        Email de Contacto *
                                    </Label>
                                    <Input
                                        id="email_contacto"
                                        type="email"
                                        value={data.email_contacto}
                                        onChange={(e) =>
                                            setData(
                                                'email_contacto',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="contacto@notaria45.com"
                                        className={
                                            errors.email_contacto
                                                ? 'border-red-500'
                                                : ''
                                        }
                                    />
                                    {errors.email_contacto && (
                                        <p className="text-sm text-red-500">
                                            {errors.email_contacto}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input
                                        id="telefono"
                                        value={data.telefono}
                                        onChange={(e) =>
                                            setData('telefono', e.target.value)
                                        }
                                        placeholder="555-123-4567"
                                    />
                                </div>
                            </div>

                            {/* Sección Ubicación */}
                            <div className="mt-6 space-y-4">
                                <h3 className="text-lg font-semibold">
                                    Ubicación
                                </h3>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Estado */}
                                    <div className="space-y-2">
                                        <Label htmlFor="estado">Estado</Label>
                                        <select
                                            id="estado"
                                            value={data.estado}
                                            onChange={(e) =>
                                                setData('estado', e.target.value)
                                            }
                                            className={`w-full rounded-md border ${
                                                errors.estado
                                                    ? 'border-red-500'
                                                    : 'border-gray-300'
                                            } px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                        >
                                            <option value="">
                                                Seleccionar estado
                                            </option>
                                            {ESTADOS_MEXICO.map((estado) => (
                                                <option
                                                    key={estado}
                                                    value={estado}
                                                >
                                                    {estado}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.estado && (
                                            <p className="text-sm text-red-500">
                                                {errors.estado}
                                            </p>
                                        )}
                                    </div>

                                    {/* Municipio */}
                                    <div className="space-y-2">
                                        <Label htmlFor="municipio">
                                            Municipio
                                        </Label>
                                        <Input
                                            id="municipio"
                                            value={data.municipio}
                                            onChange={(e) =>
                                                setData(
                                                    'municipio',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Ej: Guadalajara"
                                        />
                                        {errors.municipio && (
                                            <p className="text-sm text-red-500">
                                                {errors.municipio}
                                            </p>
                                        )}
                                    </div>

                                    {/* Código Postal */}
                                    <div className="space-y-2">
                                        <Label htmlFor="codigo_postal">
                                            Código Postal
                                        </Label>
                                        <Input
                                            id="codigo_postal"
                                            value={data.codigo_postal}
                                            onChange={(e) =>
                                                setData(
                                                    'codigo_postal',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="44100"
                                            maxLength={5}
                                        />
                                        {errors.codigo_postal && (
                                            <p className="text-sm text-red-500">
                                                {errors.codigo_postal}
                                            </p>
                                        )}
                                    </div>

                                    {/* Colonia */}
                                    <div className="space-y-2">
                                        <Label htmlFor="colonia">Colonia</Label>
                                        <Input
                                            id="colonia"
                                            value={data.colonia}
                                            onChange={(e) =>
                                                setData('colonia', e.target.value)
                                            }
                                            placeholder="Ej: Centro"
                                        />
                                        {errors.colonia && (
                                            <p className="text-sm text-red-500">
                                                {errors.colonia}
                                            </p>
                                        )}
                                    </div>

                                    {/* Calle (span 2 columns) */}
                                    <div className="space-y-2 md:col-span-2">
                                        <Label htmlFor="calle">
                                            Calle y Número
                                        </Label>
                                        <Input
                                            id="calle"
                                            value={data.calle}
                                            onChange={(e) =>
                                                setData('calle', e.target.value)
                                            }
                                            placeholder="Av. Juárez #123 Int. 4"
                                        />
                                        {errors.calle && (
                                            <p className="text-sm text-red-500">
                                                {errors.calle}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Notas Internas */}
                            <div className="space-y-2">
                                <Label htmlFor="notas_internas">
                                    Notas Internas
                                </Label>
                                <Textarea
                                    id="notas_internas"
                                    value={data.notas_internas}
                                    onChange={(e) =>
                                        setData(
                                            'notas_internas',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="Notas adicionales para uso interno..."
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Configuraciones Personalizadas (Opcional) */}
                        <div className="space-y-4">
                            <h3 className="border-b pb-2 text-lg font-semibold">
                                Configuraciones Personalizadas
                                <span className="ml-2 text-sm font-normal text-muted-foreground">
                                    (Opcional - sobrescribe el plan)
                                </span>
                            </h3>

                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="limite_usuarios_custom">
                                        Límite de Usuarios Personalizado
                                    </Label>
                                    <Input
                                        id="limite_usuarios_custom"
                                        type="number"
                                        min="0"
                                        value={data.limite_usuarios_custom}
                                        onChange={(e) =>
                                            setData(
                                                'limite_usuarios_custom',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Dejar vacío para usar el del plan"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="limite_busquedas_mes_custom">
                                        Límite de Búsquedas/Mes Personalizado
                                    </Label>
                                    <Input
                                        id="limite_busquedas_mes_custom"
                                        type="number"
                                        min="0"
                                        value={data.limite_busquedas_mes_custom}
                                        onChange={(e) =>
                                            setData(
                                                'limite_busquedas_mes_custom',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Dejar vacío para usar el del plan"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center gap-4 border-t pt-6">
                            <Button type="submit" disabled={processing}>
                                <Save className="mr-2 h-4 w-4" />
                                {processing ? 'Creando...' : 'Crear Notaría'}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => window.history.back()}
                            >
                                Cancelar
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
