import { Head, useForm } from '@inertiajs/react';
import { Building2, Save, ArrowLeft } from 'lucide-react';

import CodigoPostalInput from '@/components/Admin/CodigoPostalInput';
import EstadoSelector from '@/components/Admin/EstadoSelector';
import LegacyNotariaAutocomplete from '@/components/Admin/LegacyNotariaAutocomplete';
import MunicipioSelector from '@/components/Admin/MunicipioSelector';
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
        legacy_identifier: '',
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
                                    <RequiredLabel htmlFor="nombre">
                                        Nombre de la Notaría *
                                    </RequiredLabel>
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
                                    <RequiredLabel htmlFor="numero_notaria">
                                        Número de Notaría *
                                    </RequiredLabel>
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

                                {/* Legacy System Identifier */}
                                <div className="md:col-span-2">
                                    <LegacyNotariaAutocomplete
                                        value={data.legacy_identifier}
                                        onChange={(value, legacyData) => {
                                            setData('legacy_identifier', value);
                                            // Optionally auto-fill some fields from legacy data
                                            if (legacyData) {
                                                console.log('Legacy data:', legacyData);
                                            }
                                        }}
                                        error={errors.legacy_identifier}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <RequiredLabel htmlFor="plan_id">
                                        Plan de Suscripción *
                                    </RequiredLabel>
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
                                    <RequiredLabel className="flex items-center gap-2">
                                        <Switch
                                            checked={data.activa}
                                            onCheckedChange={(checked) =>
                                                setData('activa', checked)
                                            }
                                        />
                                        Notaría Activa
                                    </RequiredLabel>
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
                                    <RequiredLabel htmlFor="contacto_principal">
                                        Contacto Principal *
                                    </RequiredLabel>
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
                                    <RequiredLabel htmlFor="email_contacto">
                                        Email de Contacto *
                                    </RequiredLabel>
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
                                    <RequiredLabel htmlFor="telefono">Teléfono</RequiredLabel>
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
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold">
                                        Ubicación
                                    </h3>
                                    <span className="text-xs text-muted-foreground">
                                        Datos de SEPOMEX
                                    </span>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    {/* Código Postal con auto-completado */}
                                    <CodigoPostalInput
                                        value={data.codigo_postal}
                                        onChange={(value) =>
                                            setData('codigo_postal', value)
                                        }
                                        coloniaValue={data.colonia}
                                        onColoniaChange={(value) =>
                                            setData('colonia', value)
                                        }
                                        onAutoComplete={(cpData) => {
                                            // Auto-completar estado y municipio
                                            setData({
                                                ...data,
                                                estado: cpData.estado,
                                                municipio: cpData.municipio,
                                                colonia: cpData.colonia || '',
                                            });
                                        }}
                                        error={errors.codigo_postal}
                                        showColoniaSelector={false}
                                    />

                                    {/* Estado dinámico (solo lectura si viene de CP) */}
                                    <EstadoSelector
                                        value={data.estado}
                                        onChange={(value) => {
                                            setData({
                                                ...data,
                                                estado: value,
                                                municipio: '', // Limpiar municipio al cambiar estado
                                            });
                                        }}
                                        error={errors.estado}
                                        required
                                    />

                                    {/* Municipio en cascada (filtrado por estado) */}
                                    <MunicipioSelector
                                        value={data.municipio}
                                        onChange={(value) =>
                                            setData('municipio', value)
                                        }
                                        estado={data.estado}
                                        error={errors.municipio}
                                        required
                                    />

                                    {/* Colonia */}
                                    <div className="space-y-2">
                                        <RequiredLabel htmlFor="colonia">
                                            Colonia / Asentamiento
                                        </RequiredLabel>
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
                                        <p className="text-xs text-muted-foreground">
                                            Se auto-completa al ingresar el CP
                                        </p>
                                    </div>

                                    {/* Calle (span 2 columns) */}
                                    <div className="space-y-2 md:col-span-2">
                                        <RequiredLabel htmlFor="calle">
                                            Calle y Número
                                        </RequiredLabel>
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
                                <RequiredLabel htmlFor="notas_internas">
                                    Notas Internas
                                </RequiredLabel>
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
                                    <RequiredLabel htmlFor="limite_usuarios_custom">
                                        Límite de Usuarios Personalizado
                                    </RequiredLabel>
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
                                    <RequiredLabel htmlFor="limite_busquedas_mes_custom">
                                        Límite de Búsquedas/Mes Personalizado
                                    </RequiredLabel>
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
