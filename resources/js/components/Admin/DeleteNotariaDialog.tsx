import { router } from '@inertiajs/react';
import { AlertTriangle, Database, Info, Users, RefreshCw } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { update, destroy } from '@/routes/admin/notarias';

interface Notaria {
    id: number;
    nombre: string;
    numero_notaria: string;
    activa: boolean;
    users_count: number;
    total_usuarios?: number;
    busquedas_mes_actual?: number;
}

interface DeleteNotariaDialogProps {
    notaria: Notaria | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function DeleteNotariaDialog({
    notaria,
    open,
    onOpenChange,
}: DeleteNotariaDialogProps) {
    const [action, setAction] = useState<'disable' | 'delete'>('disable');
    const [reason, setReason] = useState('');
    const [password, setPassword] = useState('');
    const [processing, setProcessing] = useState(false);

    const handleSubmit = () => {
        if (!notaria) return;

        // Validaciones
        if (!reason.trim()) {
            alert('Debes especificar una razón');
            return;
        }

        if (action === 'delete' && !password) {
            alert('Debes ingresar tu contraseña para confirmar la eliminación permanente');
            return;
        }

        setProcessing(true);

        if (action === 'disable') {
            // Simplemente desactivar la notaría
            router.put(
                update.url(notaria.id),
                {
                    activa: false,
                    _reason: reason, // Guardamos la razón en logs
                },
                {
                    onSuccess: () => {
                        onOpenChange(false);
                        resetForm();
                    },
                    onFinish: () => setProcessing(false),
                },
            );
        } else {
            // Eliminación permanente con contraseña
            // En Inertia, DELETE requests envían datos como FormData por defecto
            // Hay dos formas: 1) Convertir a POST con _method o 2) Enviar via headers
            router.post(
                destroy.url(notaria.id),
                {
                    _method: 'DELETE',
                    password,
                    reason,
                },
                {
                    onSuccess: () => {
                        onOpenChange(false);
                        resetForm();
                    },
                    onFinish: () => setProcessing(false),
                },
            );
        }
    };

    const resetForm = () => {
        setAction('disable');
        setReason('');
        setPassword('');
        setProcessing(false);
    };

    if (!notaria) return null;

    const tenantName = `notaria_${notaria.numero_notaria}${notaria.nombre
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20)}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-amber-600" />
                        Gestionar Notaría: {notaria.nombre}
                    </DialogTitle>
                    <DialogDescription>
                        Elige cómo proceder con esta notaría
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Información de la notaría */}
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            <div className="space-y-1 text-sm">
                                <p>
                                    <strong>Notaría:</strong> {notaria.nombre} (
                                    {notaria.numero_notaria})
                                </p>
                                <p>
                                    <strong>Usuarios:</strong>{' '}
                                    {notaria.total_usuarios || notaria.users_count}
                                </p>
                                <p>
                                    <strong>Búsquedas este mes:</strong>{' '}
                                    {notaria.busquedas_mes_actual || 0}
                                </p>
                                <p>
                                    <strong>Estado actual:</strong>{' '}
                                    <Badge
                                        variant={
                                            notaria.activa
                                                ? 'default'
                                                : 'secondary'
                                        }
                                    >
                                        {notaria.activa ? 'Activa' : 'Inactiva'}
                                    </Badge>
                                </p>
                            </div>
                        </AlertDescription>
                    </Alert>

                    {/* Advertencia de usuarios activos */}
                    {(notaria.total_usuarios || notaria.users_count) > 0 && (
                        <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription>
                                <div className="space-y-2">
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400">
                                        ⚠️ Esta notaría tiene {notaria.total_usuarios || notaria.users_count} usuario(s) activo(s)
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Para eliminar permanentemente esta notaría, primero debes:
                                    </p>
                                    <ol className="text-sm space-y-1 list-decimal list-inside ml-2 text-muted-foreground">
                                        <li>Ir a Gestión de Usuarios</li>
                                        <li>Eliminar o reasignar los usuarios de esta notaría</li>
                                        <li>Volver aquí y hacer clic en "Actualizar Datos"</li>
                                    </ol>
                                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                router.reload({ only: ['notarias'] });
                                            }}
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Actualizar Datos
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => {
                                                onOpenChange(false);
                                                router.visit('/admin/users?notaria_id=' + notaria.id);
                                            }}
                                        >
                                            <Users className="h-4 w-4 mr-2" />
                                            Gestionar Usuarios
                                        </Button>
                                    </div>
                                </div>
                            </AlertDescription>
                        </Alert>
                    )}

                    {/* Información de la BD tenant */}
                    <Alert className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                        <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <AlertDescription>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Base de Datos Tenant
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Esta notaría debería tener una base de datos con el
                                nombre:{' '}
                                <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">
                                    {tenantName}
                                </code>
                            </p>
                        </AlertDescription>
                    </Alert>

                    {/* Opciones de acción */}
                    <div className="space-y-3">
                        <Label>¿Qué deseas hacer?</Label>
                        <RadioGroup value={action} onValueChange={(v: any) => setAction(v)}>
                            <div className="flex items-start space-x-2 p-3 border rounded-lg">
                                <RadioGroupItem value="disable" id="disable" />
                                <div className="flex-1">
                                    <Label
                                        htmlFor="disable"
                                        className="font-semibold cursor-pointer"
                                    >
                                        Inhabilitar (Recomendado)
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Deshabilita el acceso pero mantiene todos los datos,
                                        historial y base de datos. La notaría no podrá iniciar
                                        sesión pero toda la información permanece disponible
                                        para consultas.
                                    </p>
                                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                                        <p>✅ Mantiene historial de búsquedas</p>
                                        <p>✅ Conserva usuarios y suscripciones</p>
                                        <p>✅ Base de datos intacta</p>
                                        <p>✅ Se puede reactivar fácilmente</p>
                                    </div>
                                </div>
                            </div>

                            <div className={`flex items-start space-x-2 p-3 border rounded-lg border-red-200 bg-red-50 dark:bg-red-950/20 ${
                                (notaria.total_usuarios || notaria.users_count) > 0 ? 'opacity-50' : ''
                            }`}>
                                <RadioGroupItem
                                    value="delete"
                                    id="delete"
                                    disabled={(notaria.total_usuarios || notaria.users_count) > 0}
                                />
                                <div className="flex-1">
                                    <Label
                                        htmlFor="delete"
                                        className={`font-semibold cursor-pointer text-red-600 ${
                                            (notaria.total_usuarios || notaria.users_count) > 0 ? 'cursor-not-allowed' : ''
                                        }`}
                                    >
                                        Eliminar Permanentemente
                                        {(notaria.total_usuarios || notaria.users_count) > 0 && (
                                            <span className="text-xs font-normal ml-2">(Bloqueado: hay usuarios activos)</span>
                                        )}
                                    </Label>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        <strong className="text-red-600">⚠️ PELIGRO:</strong>{' '}
                                        Elimina TODOS los datos de la notaría de la base de datos central.
                                        La base de datos del tenant debe ser eliminada MANUALMENTE.
                                    </p>
                                    <div className="mt-2 space-y-1 text-xs text-red-600">
                                        <p>❌ Elimina el registro de la notaría</p>
                                        <p>❌ Elimina suscripciones asociadas</p>
                                        <p>❌ Base de datos tenant debe eliminarse manualmente</p>
                                        <p>❌ NO se puede deshacer</p>
                                    </div>
                                    <p className="text-xs font-semibold text-red-600 mt-2">
                                        Solo para notarías de prueba sin usuarios ni datos productivos
                                    </p>
                                </div>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Razón */}
                    <div className="space-y-2">
                        <Label htmlFor="reason">
                            Razón {action === 'disable' ? 'de inhabilitación' : 'de eliminación'} *
                        </Label>
                        <Textarea
                            id="reason"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder={
                                action === 'disable'
                                    ? 'Ej: Cliente canceló el servicio, impago, migración a otro sistema, etc.'
                                    : 'Ej: Notaría de prueba creada para testing, datos erróneos, duplicado, etc.'
                            }
                            rows={3}
                            className="resize-none"
                        />
                        <p className="text-xs text-muted-foreground">
                            Esta razón quedará registrada en los logs del sistema
                        </p>
                    </div>

                    {/* Contraseña solo para eliminación */}
                    {action === 'delete' && (
                        <div className="space-y-2">
                            <Label htmlFor="password">Tu Contraseña *</Label>
                            <Input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Confirma con tu contraseña de super admin"
                            />
                            <p className="text-xs text-amber-600">
                                ⚠️ Se requiere contraseña para eliminaciones permanentes
                            </p>
                        </div>
                    )}

                    {/* Advertencia final para eliminación */}
                    {action === 'delete' && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <p className="font-semibold mb-2">
                                    Después de eliminar, DEBES:
                                </p>
                                <ol className="text-sm space-y-1 list-decimal list-inside">
                                    <li>
                                        Eliminar manualmente la base de datos:{' '}
                                        <code className="bg-red-100 dark:bg-red-900 px-1 rounded">
                                            {tenantName}
                                        </code>
                                    </li>
                                    <li>
                                        Verificar que no haya datos relacionados en otras
                                        tablas
                                    </li>
                                    <li>
                                        Documentar la eliminación en el registro de cambios
                                    </li>
                                </ol>
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => {
                            onOpenChange(false);
                            resetForm();
                        }}
                        disabled={processing}
                    >
                        Cancelar
                    </Button>
                    <Button
                        variant={action === 'delete' ? 'destructive' : 'default'}
                        onClick={handleSubmit}
                        disabled={processing || !reason.trim()}
                    >
                        {processing
                            ? 'Procesando...'
                            : action === 'disable'
                              ? 'Inhabilitar Notaría'
                              : 'Eliminar Permanentemente'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
