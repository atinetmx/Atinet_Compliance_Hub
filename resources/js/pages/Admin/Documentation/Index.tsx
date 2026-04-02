import { Head, Link } from '@inertiajs/react';
import {
    BookOpen,
    Home,
    Users,
    CreditCard,
    Shield,
    CalendarDays,
    Scale,
    QrCode,
    BarChart3,
    Settings,
    Search,
    FileText,
    HelpCircle,
    PlayCircle,
    ArrowLeft,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    History as HistoryIcon,
    RefreshCw,
    Trash2,
    Download,
    Eye,
    User,
    Building2,
    Clock,
    Camera,
    BookOpenCheck,
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import DocumentationLayout from '@/layouts/documentation-layout';
import { dashboard } from '@/routes';
import { Page, PageFlipBook } from '@/components/page-flip-book';

interface Props {
    currentSection: string;
}

interface DocSection {
    id: string;
    title: string;
    icon: typeof Home;
    badge?: string;
    subsections?: Array<{
        id: string;
        title: string;
        badge?: string;
    }>;
}

const docSections: DocSection[] = [
    {
        id: 'introduccion',
        title: 'Introducción',
        icon: Home,
    },
    {
        id: 'primeros-pasos',
        title: 'Primeros Pasos',
        icon: PlayCircle,
        badge: 'Nuevo',
    },
    {
        id: 'usuarios',
        title: 'Gestión de Usuarios',
        icon: Users,
        subsections: [
            { id: 'usuarios-crear', title: 'Crear Usuario' },
            { id: 'usuarios-editar', title: 'Editar Usuario' },
            { id: 'usuarios-permisos', title: 'Roles y Permisos' },
        ],
    },
    {
        id: 'suscripciones',
        title: 'Suscripciones',
        icon: CreditCard,
        subsections: [
            { id: 'suscripciones-crear', title: 'Crear Suscripción' },
            { id: 'suscripciones-multiples', title: 'Múltiples Suscripciones', badge: 'Nuevo' },
            { id: 'suscripciones-renovar', title: 'Renovar Suscripción' },
        ],
    },
    {
        id: 'listas-negras',
        title: 'Listas Negras OFAC/SAT',
        icon: Shield,
        subsections: [
            { id: 'listas-negras-buscar', title: 'Realizar Búsqueda' },
            { id: 'listas-negras-historial', title: 'Ver Historial' },
            { id: 'listas-negras-exportar', title: 'Exportar Resultados' },
        ],
    },
    {
        id: 'agenda',
        title: 'Agenda Web',
        icon: CalendarDays,
        subsections: [
            { id: 'agenda-crear-evento', title: 'Crear Evento' },
            { id: 'agenda-compartir', title: 'Compartir Agenda' },
        ],
    },
    {
        id: 'registro-web',
        title: 'Registro Web',
        icon: QrCode,
    },
    {
        id: 'control-notarial',
        title: 'Control Notarial',
        icon: Scale,
        subsections: [
            { id: 'control-notarial-expedientes', title: 'Expedientes' },
            { id: 'control-notarial-presupuesto', title: 'Presupuesto Previo' },
            { id: 'control-notarial-configuracion', title: 'Configuración' },
        ],
    },
    {
        id: 'reportes',
        title: 'Reportes',
        icon: BarChart3,
    },
    {
        id: 'configuracion',
        title: 'Configuración',
        icon: Settings,
    },
    {
        id: 'faq',
        title: 'Preguntas Frecuentes',
        icon: HelpCircle,
    },
];

const sectionContent: Record<string, { title: string; content: React.ReactNode }> = {
    introduccion: {
        title: 'Bienvenido al Sistema Atinet Compliance Hub',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">¿Qué es Atinet Compliance Hub?</h2>
                    <p className="text-muted-foreground leading-relaxed">
                        Atinet Compliance Hub es una plataforma integral diseñada para notarías que permite la gestión
                        completa de servicios de cumplimiento normativo, incluyendo búsqueda en listas negras (OFAC/SAT),
                        agenda web, control notarial y registro web.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Módulos Principales</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card className="hover:shadow-lg transition-all">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-primary" />
                                    Listas Negras OFAC/SAT
                                </CardTitle>
                                <CardDescription>
                                    Búsqueda en tiempo real
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Sistema de búsqueda en tiempo real en bases de datos OFAC (Estados Unidos) y SAT 69-B
                                    (México) con generación automática de reportes en PDF.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-primary" />
                                    Agenda Web
                                </CardTitle>
                                <CardDescription>
                                    Calendario colaborativo
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Calendario completo con gestión de eventos recurrentes, sistema de citas, recordatorios
                                    y bitácora de actividades con permisos multi-nivel.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-primary" />
                                    Control Notarial
                                </CardTitle>
                                <CardDescription>
                                    Gestión de operaciones
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Control integral de operaciones notariales: gestión de expedientes, presupuestos,
                                    escrituras y documentación con integración al sistema legacy.
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="hover:shadow-lg transition-all">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <QrCode className="h-5 w-5 text-primary" />
                                    Registro Web
                                </CardTitle>
                                <CardDescription>
                                    Sistema QR y OCR
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Sistema de registro web con códigos QR para identificación rápida y tecnología OCR para
                                    extracción automática de datos de documentos oficiales.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <PlayCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        ¿Nuevo en el sistema?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                        Te recomendamos empezar con la sección "Primeros Pasos" para familiarizarte con la plataforma.
                    </p>
                    <Button
                        onClick={() => {
                            const section = document.getElementById('primeros-pasos-section');
                            section?.click();
                        }}
                        className="bg-amber-600 hover:bg-amber-700"
                    >
                        Ir a Primeros Pasos
                    </Button>
                </div>
            </div>
        ),
    },
    'primeros-pasos': {
        title: 'Primeros Pasos',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Guía de Inicio Rápido</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Esta guía te ayudará a familiarizarte con el sistema en pocos minutos.
                    </p>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 font-bold">
                                    1
                                </div>
                                Acceso al Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                El administrador de tu notaría debe haberte proporcionado tus credenciales de acceso
                                (email y contraseña).
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>Ingresa tu email y contraseña en la pantalla de login</li>
                                <li>Si olvidaste tu contraseña, usa la opción "¿Olvidaste tu contraseña?"</li>
                                <li>Se recomienda cambiar tu contraseña en el primer acceso</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 font-bold">
                                    2
                                </div>
                                Navegación del Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                El menú lateral (sidebar) contiene todos los módulos disponibles según tu suscripción:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>
                                    <strong>Dashboard:</strong> Vista general de estadísticas
                                </li>
                                <li>
                                    <strong>Listas Negras:</strong> Búsqueda OFAC/SAT
                                </li>
                                <li>
                                    <strong>Agenda:</strong> Calendario de eventos
                                </li>
                                <li>
                                    <strong>Control Notarial:</strong> Gestión de expedientes
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-400 font-bold">
                                    3
                                </div>
                                Tu Primer Búsqueda
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Para realizar tu primera búsqueda en listas negras:
                            </p>
                            <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>Ve al módulo "Listas Negras" en el menú lateral</li>
                                <li>Selecciona el tipo de búsqueda (OFAC o SAT)</li>
                                <li>Ingresa el nombre o RFC a buscar</li>
                                <li>Haz clic en "Buscar"</li>
                                <li>Revisa los resultados y exporta si es necesario</li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        ¿Necesitas ayuda?
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Si tienes dudas sobre algún módulo específico, consulta las secciones correspondientes en este
                        manual o contacta al equipo de soporte.
                    </p>
                </div>
            </div>
        ),
    },
    usuarios: {
        title: 'Gestión de Usuarios',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Gestión de Usuarios</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de gestión de usuarios permite a los administradores crear, editar y gestionar cuentas
                        de usuario del sistema, asignar roles, gestionar permisos y monitorear la actividad.
                    </p>
                </div>

                <Separator />

                {/* Tipos de Usuario */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Tipos de Usuario</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">
                                        Super Admin
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Acceso completo al sistema. Gestiona todas las notarías, planes, suscripciones y configuraciones
                                    globales.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                                        Admin Notaría
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Administra su notaría específica. Puede gestionar usuarios de su notaría, ver reportes y
                                    configuraciones.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                                        Usuario Notaría
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Usuario estándar con acceso a los módulos según la suscripción: listas negras, agenda,
                                    control notarial.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
                                        Invitado
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Acceso limitado de solo lectura. Ideal para consultores externos o revisores que no requieren
                                    permisos completos.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                {/* Listado de Usuarios */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Listado de Usuarios</h2>
                    <p className="text-muted-foreground mb-4">
                        La vista principal muestra todos los usuarios del sistema con capacidades avanzadas de búsqueda y
                        filtrado.
                    </p>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5 text-primary" />
                                Búsqueda y Filtros
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="font-semibold text-sm mb-2">Búsqueda Dinámica</p>
                                <p className="text-sm text-muted-foreground">
                                    Escribe en el campo de búsqueda para filtrar usuarios en tiempo real. La búsqueda se aplica
                                    sobre nombre y email.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm mb-2">Filtros Disponibles</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                    <li><strong>Tipo de Cuenta:</strong> Filtra por Super Admin, Admin Notaría, Usuario o Invitado</li>
                                    <li><strong>Notaría:</strong> Filtra usuarios por notaría específica</li>
                                    <li><strong>Estado:</strong> Usuario verificado o pendiente de verificación</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Información en el Listado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Cada usuario en la tabla muestra:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>Nombre completo e ID del usuario</li>
                                <li>Email de acceso</li>
                                <li>Tipo de cuenta con badge de color distintivo</li>
                                <li>Notaría asignada (número y nombre)</li>
                                <li>Estado de verificación del email</li>
                                <li>Botones de acción: Ver, Editar, Eliminar</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Crear Usuario */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Crear Nuevo Usuario</h2>
                    <p className="text-muted-foreground mb-4">
                        Para agregar un usuario al sistema, haz clic en el botón "Nuevo Usuario" desde el listado.
                    </p>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Campos Requeridos</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="font-semibold text-sm">Nombre <span className="text-red-600">*</span></p>
                                <p className="text-sm text-muted-foreground">Nombre completo del usuario</p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Email <span className="text-red-600">*</span></p>
                                <p className="text-sm text-muted-foreground">
                                    Email único para acceso al sistema. Se utilizará como nombre de usuario.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Tipo de Cuenta <span className="text-red-600">*</span></p>
                                <p className="text-sm text-muted-foreground">
                                    Selecciona el rol: Super Admin, Admin Notaría, Usuario Notaría o Invitado
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Notaría Asignada</p>
                                <p className="text-sm text-muted-foreground">
                                    Asigna la notaría correspondiente (requerido para Admin y Usuario Notaría)
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Contraseña <span className="text-red-600">*</span></p>
                                <p className="text-sm text-muted-foreground">
                                    Contraseña temporal. Se recomienda que el usuario la cambie en su primer acceso.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">💡 Consejo</p>
                        <p className="text-sm text-muted-foreground">
                            Al crear un usuario, el sistema validará que el email no esté en uso y que los permisos sean
                            consistentes con la notaría asignada.
                        </p>
                    </div>
                </div>

                <Separator />

                {/* Ver Detalles */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Ver Detalles de Usuario</h2>
                    <p className="text-muted-foreground mb-4">
                        Haz clic en el botón 👁️ (Ver) para acceder a la información detallada de un usuario.
                    </p>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Información Disponible</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div>
                                <p className="font-semibold text-sm">Datos Personales</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>Nombre y email</li>
                                    <li>Tipo de cuenta asignada</li>
                                    <li>Estado de verificación del email</li>
                                    <li>Fecha de creación de la cuenta</li>
                                </ul>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Notaría Asignada</p>
                                <p className="text-sm text-muted-foreground">
                                    Nombre y número de notaría vinculada (si aplica)
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Estadísticas de Uso</p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>Total de búsquedas realizadas</li>
                                    <li>Búsquedas del mes actual</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Reportes */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Reportes de Usuarios</h2>
                    <p className="text-muted-foreground mb-4">
                        El módulo incluye reportes estadísticos para analizar la distribución y actividad de usuarios.
                    </p>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Métricas Generales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                    <li>Total de usuarios registrados</li>
                                    <li>Usuarios activos (con email verificado)</li>
                                    <li>Registros recientes (últimos 30 días)</li>
                                    <li>Tipos de cuenta disponibles</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Distribución</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                                    <li>Usuarios por tipo de cuenta (con %)</li>
                                    <li>Usuarios por notaría (ordenados)</li>
                                    <li>Gráficos de distribución visual</li>
                                    <li>Comparativas entre notarías</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                {/* Permisos y Seguridad */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Permisos y Seguridad</h2>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Restricciones del Sistema
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li>Los usuarios <strong>Super Admin</strong> no pueden ser eliminados desde la interfaz</li>
                                <li>Solo los administradores pueden crear y gestionar usuarios</li>
                                <li>Los usuarios no verificados tienen funcionalidades limitadas</li>
                                <li>Las contraseñas deben cumplir con políticas de seguridad mínimas</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Contraseñas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Los administradores pueden:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>Revelar contraseñas de usuarios (con permisos adecuados)</li>
                                <li>Resetear contraseñas cuando un usuario las olvida</li>
                                <li>Forzar cambio de contraseña en el próximo inicio de sesión</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Mejores Prácticas
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✓ Asigna roles siguiendo el principio de menor privilegio</li>
                        <li>✓ Revisa periódicamente los usuarios activos</li>
                        <li>✓ Elimina cuentas que ya no se utilicen</li>
                        <li>✓ Verifica que cada usuario tenga email verificado</li>
                        <li>✓ Monitorea los reportes para detectar anomalías</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'usuarios-crear': {
        title: 'Crear Nuevo Usuario',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Crear Nuevo Usuario</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Para agregar un usuario al sistema, accede al listado de usuarios y haz clic en el botón "Nuevo Usuario".
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Campos Requeridos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold text-sm mb-1">Nombre <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                Ingresa el nombre completo del usuario. Este nombre se mostrará en todo el sistema.
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Email <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                Email único para acceso al sistema. Se utilizará como nombre de usuario para iniciar sesión.
                                El sistema validará que no esté en uso.
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Tipo de Cuenta <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                Selecciona el rol adecuado según las responsabilidades del usuario:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4 mt-2">
                                <li><strong>Super Admin:</strong> Gestión completa del sistema</li>
                                <li><strong>Admin Notaría:</strong> Gestión de su notaría</li>
                                <li><strong>Usuario Notaría:</strong> Uso estándar de módulos</li>
                                <li><strong>Invitado:</strong> Solo lectura</li>
                            </ul>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Notaría Asignada</p>
                            <p className="text-sm text-muted-foreground">
                                Selecciona la notaría correspondiente. <strong>Requerido para Admin Notaría y Usuario Notaría.</strong>
                                Los Super Admin e Invitados pueden no tener notaría asignada.
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Contraseña <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                Crea una contraseña temporal segura. El usuario deberá cambiarla en su primer acceso por seguridad.
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Confirmar Contraseña <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                Vuelve a escribir la contraseña para confirmar que es correcta.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 text-primary" />
                            Proceso Paso a Paso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                            <li>Haz clic en <strong>"Nuevo Usuario"</strong> desde el listado de usuarios</li>
                            <li>Completa todos los campos requeridos (marcados con *)</li>
                            <li>Selecciona el tipo de cuenta apropiado</li>
                            <li>Asigna una notaría si es necesario</li>
                            <li>Crea una contraseña temporal segura</li>
                            <li>Haz clic en <strong>"Guardar"</strong></li>
                            <li>El sistema validará la información y creará el usuario</li>
                            <li>Podrás ver un mensaje de confirmación y el usuario aparecerá en el listado</li>
                        </ol>
                    </CardContent>
                </Card>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">💡 Consejos</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Usa emails corporativos para mayor profesionalismo</li>
                        <li>• Asigna el rol con menor privilegio necesario para las tareas del usuario</li>
                        <li>• Comunica la contraseña temporal al usuario de forma segura</li>
                        <li>• Recuerda al usuario que debe cambiar su contraseña tras el primer acceso</li>
                    </ul>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">⚠️ Errores Comunes</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• <strong>Email ya existe:</strong> Verifica que no haya otro usuario con ese email</li>
                        <li>• <strong>Contraseñas no coinciden:</strong> Asegúrate de escribir la misma contraseña dos veces</li>
                        <li>• <strong>Notaría requerida:</strong> Los usuarios de notaría deben tener una notaría asignada</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'usuarios-editar': {
        title: 'Editar Usuario',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Editar Información de Usuario</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Puedes modificar la información de cualquier usuario haciendo clic en el botón de edición (✏️) desde el listado.
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Datos Editables</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="font-semibold text-sm mb-1">Información Personal</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>Nombre completo</li>
                                <li>Email (con validación de unicidad)</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold text-sm mb-1">Configuración de Cuenta</p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>Tipo de cuenta / Rol</li>
                                <li>Notaría asignada</li>
                                <li>Contraseña (opcional - dejar en blanco para mantener la actual)</li>
                            </ul>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-primary" />
                            Gestión de Contraseñas
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            Los administradores tienen opciones especiales para la gestión de contraseñas:
                        </p>
                        <div className="space-y-3">
                            <div>
                                <p className="font-semibold text-sm">Revelar Contraseña</p>
                                <p className="text-sm text-muted-foreground">
                                    Permite ver la contraseña actual del usuario (requiere permisos de Super Admin).
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm">Resetear Contraseña</p>
                                <p className="text-sm text-muted-foreground">
                                    Genera una nueva contraseña temporal para el usuario cuando olvida la suya.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">💡 Importante</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Los cambios de rol o notaría pueden afectar los permisos del usuario inmediatamente</li>
                        <li>• Cambiar el email cerrará las sesiones activas del usuario</li>
                        <li>• Si cambias la contraseña, notifica al usuario de forma segura</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'usuarios-permisos': {
        title: 'Roles y Permisos',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Roles y Permisos</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El sistema utiliza un modelo de permisos basado en roles para controlar el acceso a las diferentes funcionalidades.
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">
                                Super Admin
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-semibold mb-2">Permisos Completos:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                            <li>Gestión de todas las notarías del sistema</li>
                            <li>Creación y administración de usuarios de cualquier tipo</li>
                            <li>Gestión de planes y suscripciones</li>
                            <li>Configuración global del sistema</li>
                            <li>Acceso a todos los reportes y estadísticas</li>
                            <li>Gestión de servicios y catálogos</li>
                            <li>No puede ser eliminado desde la interfaz</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                                Admin Notaría
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-semibold mb-2">Permisos de Notaría:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                            <li>Gestión de usuarios de su notaría únicamente</li>
                            <li>Ver y gestionar suscripciones de su notaría</li>
                            <li>Acceso completo a los módulos contratados</li>
                            <li>Ver reportes y estadísticas de su notaría</li>
                            <li>Configuración específica de su notaría</li>
                            <li>Control sobre agenda y expedientes de su notaría</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                                Usuario Notaría
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-semibold mb-2">Permisos Operativos:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                            <li>Búsquedas en listas negras OFAC/SAT</li>
                            <li>Gestión de agenda (crear, editar eventos)</li>
                            <li>Control notarial (expedientes y presupuestos)</li>
                            <li>Registro web (captura y consulta)</li>
                            <li>Ver sus propias estadísticas</li>
                            <li>Exportar reportes de sus actividades</li>
                            <li>Limitado a los módulos de la suscripción activa</li>
                        </ul>
                    </CardContent>
                </Card>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
                                Invitado
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm font-semibold mb-2">Permisos de Solo Lectura:</p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                            <li>Visualización de información sin capacidad de edición</li>
                            <li>Consulta de reportes existentes</li>
                            <li>Ver expedientes y búsquedas previamente realizadas</li>
                            <li>No puede crear ni modificar registros</li>
                            <li>Ideal para auditores o consultores externos</li>
                        </ul>
                    </CardContent>
                </Card>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Restricciones y Seguridad</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Políticas de Seguridad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li>Los usuarios no verificados (email sin verificar) tienen funcionalidades limitadas</li>
                                <li>Los Super Admin no pueden ser eliminados desde la interfaz</li>
                                <li>Un usuario solo puede ver y gestionar información de su notaría asignada</li>
                                <li>Las contraseñas deben cumplir con políticas de complejidad mínimas</li>
                                <li>Las sesiones expiran después de un periodo de inactividad</li>
                                <li>Los cambios de rol o permisos se aplican inmediatamente</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Principio de Menor Privilegio
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Siempre asigna el rol con los <strong>menores privilegios necesarios</strong> para que el usuario pueda
                        realizar su trabajo. Esto minimiza riesgos de seguridad y errores accidentales.
                    </p>
                </div>
            </div>
        ),
    },
    suscripciones: {
        title: 'Gestión de Suscripciones',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Suscripciones</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de suscripciones permite gestionar los planes contratados por cada notaría, incluyendo
                        períodos de prueba, facturación, renovaciones y estado de las cuentas.
                    </p>
                </div>

                <Separator />

                {/* Estados de Suscripción */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Estados de Suscripción</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                                        Trial
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Período de prueba gratuito. Permite a las notarías evaluar el sistema antes de contratar.
                                    Duración típica: 15-30 días.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                                        Activa
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Suscripción vigente con acceso completo a todos los servicios del plan contratado.
                                    Facturación al día.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-400">
                                        Vencida
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    La suscripción ha llegado a su fecha de vencimiento. Período de gracia activo antes de
                                    suspensión automática.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-400">
                                        Suspendida
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Acceso restringido por falta de pago o violación de términos. Requiere acción administrativa
                                    para reactivar.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-400">
                                        Cancelada
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Suscripción terminada permanentemente. Los datos se conservan pero sin acceso al sistema.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                {/* Panel de Estadísticas */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Panel de Control</h2>
                    <p className="text-muted-foreground mb-4">
                        La vista principal de suscripciones incluye un dashboard completo con métricas clave.
                    </p>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5 text-primary" />
                                Métricas Disponibles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li><strong>Total de Suscripciones:</strong> Número total de cuentas (activas e inactivas)</li>
                                <li><strong>MRR (Monthly Recurring Revenue):</strong> Ingresos mensuales recurrentes totales</li>
                                <li><strong>Suscripciones Trial:</strong> Cuentas en período de prueba</li>
                                <li><strong>Alertas:</strong> Suscripciones que requieren atención inmediata</li>
                                <li><strong>Distribución por Estado:</strong> Gráficos visuales (Pie, Bar, Radial, TreeMap)</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">📊 Gráficos Interactivos</p>
                        <p className="text-sm text-muted-foreground">
                            El sistema guarda tu preferencia de tipo de gráfico (Pie, Bar, Radial, TreeMap) en el navegador
                            para futuras sesiones.
                        </p>
                    </div>
                </div>

                <Separator />

                {/* Filtros y Búsqueda */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Búsqueda y Filtros</h2>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Opciones de Filtrado</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li><strong>Por Estado:</strong> Filtra por Trial, Activa, Vencida, Suspendida o Cancelada</li>
                                <li><strong>Por Plan:</strong> Muestra solo suscripciones de un plan específico</li>
                                <li><strong>Búsqueda de Texto:</strong> Busca por nombre de notaría o número</li>
                                <li><strong>Vencimiento Próximo:</strong> Filtro rápido para ver suscripciones a punto de expirar</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                {/* Tabla de Suscripciones */}
                <div>
                    <h2 className="text-2xl font-bold mb-4">Listado de Suscripciones</h2>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Información en el Listado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Cada suscripción en la tabla muestra:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>Notaría (nombre y número)</li>
                                <li>Plan contratado</li>
                                <li>Estado actual con badge de color</li>
                                <li>Fecha de inicio y vencimiento</li>
                                <li>Precio pagado y ciclo de facturación</li>
                                <li>Días restantes o días vencido</li>
                                <li>Acciones: Ver detalles</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Alertas Automáticas
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>🔔 El sistema notifica suscripciones que vencen en los próximos 7 días</li>
                        <li>⚠️ Alertas de período de gracia (vencidas hace menos de 15 días)</li>
                        <li>❗ Destacado visual de suscripciones que requieren atención</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'suscripciones-crear': {
        title: 'Crear Suscripción',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Crear Nueva Suscripción</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Para crear una suscripción, accede al módulo de Suscripciones y haz clic en "Crear Suscripción".
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Campos Principales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="font-semibold text-sm mb-1">Notaría <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                Selecciona la notaría que recibirá la suscripción. <strong>El sistema alertará si la notaría
                                ya tiene una suscripción activa.</strong>
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Plan <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                Elige el plan a contratar. El precio se actualizará automáticamente según el ciclo de
                                facturación seleccionado.
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Ciclo de Facturación <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                <strong>Mensual:</strong> El cliente paga mes a mes<br />
                                <strong>Anual:</strong> Pago único por 12 meses (generalmente con descuento)
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Fecha de Inicio <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                Por defecto es la fecha actual, pero puede ajustarse. La fecha de vencimiento se calcula
                                automáticamente según el ciclo.
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Estado <span className="text-red-600">*</span></p>
                            <p className="text-sm text-muted-foreground">
                                Selecciona <strong>Trial</strong> para período de prueba o <strong>Activa</strong> para
                                suscripción de pago desde el inicio.
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Precio Pagado</p>
                            <p className="text-sm text-muted-foreground">
                                El sistema completa automáticamente este campo según el plan y ciclo, pero puede editarse
                                si se aplicó un descuento especial.
                            </p>
                        </div>
                        <Separator />
                        <div>
                            <p className="font-semibold text-sm mb-1">Auto-renovación</p>
                            <p className="text-sm text-muted-foreground">
                                Activado por defecto. Si está habilitado, la suscripción se renovará automáticamente al vencimiento.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <PlayCircle className="h-5 w-5 text-primary" />
                            Proceso Paso a Paso
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                            <li>Haz clic en <strong>"Crear Suscripción"</strong> desde el listado</li>
                            <li>Selecciona la notaría (verifica alertas de suscripciones existentes)</li>
                            <li>Elige el plan adecuado según las necesidades del cliente</li>
                            <li>Selecciona el ciclo de facturación (mensual/anual)</li>
                            <li>Ajusta la fecha de inicio si es necesario</li>
                            <li>Define el estado inicial (Trial o Activa)</li>
                            <li>Verifica el precio calculado automáticamente</li>
                            <li>Agrega información de pago y notas si aplica</li>
                            <li>Haz clic en <strong>"Crear Suscripción"</strong></li>
                        </ol>
                    </CardContent>
                </Card>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">⚠️ Múltiples Suscripciones</p>
                    <p className="text-sm text-muted-foreground">
                        Una notaría puede tener <strong>múltiples suscripciones simultáneas</strong> para diferentes planes
                        (ej: un plan de Listas Negras + un plan de Agenda). El sistema permite esto, pero alertará sobre
                        suscripciones existentes para evitar duplicados.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">💡 Consejos</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Usa suscripciones Trial para demos y evaluaciones</li>
                        <li>• El ciclo anual suele ofrecer mejor valor para el cliente</li>
                        <li>• Documenta descuentos especiales en el campo de notas</li>
                        <li>• Verifica la fecha de vencimiento calculada antes de guardar</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'suscripciones-multiples': {
        title: 'Múltiples Suscripciones',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Múltiples Suscripciones</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El sistema permite que una notaría tenga múltiples suscripciones activas simultáneamente,
                        permitiendo contratar diferentes módulos de forma independiente.
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>¿Por qué Múltiples Suscripciones?</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            Esta funcionalidad permite flexibilidad en los planes contratados:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                            <li><strong>Modularidad:</strong> Contratar solo los servicios necesarios</li>
                            <li><strong>Escalabilidad:</strong> Agregar módulos conforme crecen las necesidades</li>
                            <li><strong>Diferentes Vencimientos:</strong> Cada suscripción tiene su propio ciclo</li>
                            <li><strong>Facturación Independiente:</strong> Cada plan se factura por separado</li>
                        </ul>
                    </CardContent>
                </Card>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Ejemplos de Uso</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Escenario 1: Implementación Gradual</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    <strong>Notaría XYZ</strong> comienza con:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>Plan "Listas Negras OFAC/SAT" (mensual)</li>
                                    <li>Después de 3 meses, agrega "Agenda Web" (mensual)</li>
                                    <li>Más adelante contrata "Control Notarial" (anual con descuento)</li>
                                </ul>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Cada plan mantiene su propia fecha de renovación y precio.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base">Escenario 2: Pruebas y Producción</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    <strong>Notaría ABC</strong> mantiene:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                    <li>Plan "Básico" activo (producción)</li>
                                    <li>Plan "Premium" en trial (evaluando nuevas funcionalidades)</li>
                                </ul>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Al terminar el trial, decide si actualizar o mantener ambos planes.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Gestión de Múltiples Suscripciones</h2>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Vista de la Notaría</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Al crear o editar una suscripción, el sistema muestra:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li><strong>Suscripciones Activas:</strong> Lista de planes vigentes</li>
                                <li><strong>Suscripciones Trial:</strong> Períodos de prueba en curso</li>
                                <li><strong>Total de Suscripciones:</strong> Historial completo</li>
                                <li><strong>Alertas:</strong> Notificación si ya existe una suscripción del mismo tipo</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Vista del Sistema</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                En el listado principal de suscripciones:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>Cada suscripción aparece como registro separado</li>
                                <li>Se pueden filtrar por notaría para ver todas sus suscripciones</li>
                                <li>Los reportes suman el MRR de todas las suscripciones activas</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">⚠️ Consideraciones Importantes</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Evita crear suscripciones duplicadas del mismo plan</li>
                        <li>• Verifica las fechas de vencimiento para evitar lapsos de servicio</li>
                        <li>• Documenta correctamente el propósito de cada suscripción</li>
                        <li>• Revisa periódicamente si hay planes redundantes o sin uso</li>
                    </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Facturación
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Cada suscripción se factura <strong>independientemente</strong> según su propio ciclo. Una
                        notaría con 3 planes mensuales recibirá 3 cargos mensuales, cada uno en la fecha de renovación
                        correspondiente.
                    </p>
                </div>
            </div>
        ),
    },
    'suscripciones-renovar': {
        title: 'Renovar Suscripción',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Renovación de Suscripciones</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El sistema incluye herramientas para gestionar renovaciones automáticas y manuales de suscripciones,
                        asegurando continuidad en el servicio.
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Renovación Automática</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div>
                            <p className="font-semibold text-sm mb-1">¿Cómo funciona?</p>
                            <p className="text-sm text-muted-foreground">
                                Cuando una suscripción tiene <strong>auto-renovación activada</strong>, el sistema extiende
                                automáticamente la fecha de vencimiento al llegar a la fecha límite.
                            </p>
                        </div>
                        <div>
                            <p className="font-semibold text-sm mb-1">Configuración</p>
                            <p className="text-sm text-muted-foreground">
                                La renovación automática se configura al crear o editar la suscripción mediante un
                                interruptor on/off.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Renovación Manual</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            Para renovar manualmente una suscripción:
                        </p>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                            <li>Accede a la suscripción desde el listado (clic en Ver detalles)</li>
                            <li>Haz clic en <strong>"Editar"</strong></li>
                            <li>Actualiza la <strong>Fecha de Vencimiento</strong> según el nuevo período</li>
                            <li>Verifica o actualiza el <strong>Precio Pagado</strong></li>
                            <li>Cambia el estado a <strong>"Activa"</strong> si estaba vencida</li>
                            <li>Agrega notas sobre el pago recibido</li>
                            <li>Guarda los cambios</li>
                        </ol>
                    </CardContent>
                </Card>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Período de Gracia</h2>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CalendarDays className="h-5 w-5 text-primary" />
                                ¿Qué es el Período de Gracia?
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Es un tiempo adicional (típicamente 15 días) después del vencimiento donde:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                                <li>La suscripción cambia a estado <strong>"Vencida"</strong></li>
                                <li>El sistema muestra alertas al administrador</li>
                                <li>El acceso puede estar limitado pero no bloqueado completamente</li>
                                <li>Permite tiempo para gestionar el pago sin interrumpir el servicio</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Alertas de Vencimiento</h2>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Sistema de Notificaciones</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                El sistema emite alertas automáticas:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li><strong>7 días antes:</strong> Alerta amarilla "Vencimiento próximo"</li>
                                <li><strong>Al vencer:</strong> Cambia a estado "Vencida" con alerta naranja</li>
                                <li><strong>Durante período de gracia:</strong> Contador de días vencidos</li>
                                <li><strong>Después del período:</strong> Suspensión automática</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Filtro Rápido</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                En el listado de suscripciones, usa el filtro <strong>"Vencimiento Próximo"</strong> para
                                ver solo las suscripciones que requieren atención en los próximos días.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">💡 Mejores Prácticas</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Activa la renovación automática para clientes de pago recurrente</li>
                        <li>• Revisa semanalmente el panel de alertas de vencimiento</li>
                        <li>• Contacta a los clientes 15 días antes del vencimiento</li>
                        <li>• Documenta todos los pagos y renovaciones en las notas</li>
                        <li>• Considera ofrecer descuentos por renovación anticipada</li>
                    </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Cambio de Plan en Renovación
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Si un cliente desea cambiar de plan al renovar, <strong>edita el plan en la suscripción existente</strong>
                        y actualiza la fecha de vencimiento y precio. No es necesario crear una nueva suscripción.
                    </p>
                </div>
            </div>
        ),
    },
    'listas-negras': {
        title: 'Listas Negras OFAC/SAT',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Búsqueda en Listas Negras</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Listas Negras permite realizar búsquedas en tiempo real en bases de datos de sanciones
                        internacionales (OFAC) y fiscales de México (SAT 69-B), cumpliendo con normativas de prevención de
                        lavado de dinero (AML) y financiamiento al terrorismo.
                    </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">Datos Sensibles</p>
                            <p className="text-sm text-muted-foreground">
                                La información obtenida de las búsquedas es confidencial y debe manejarse de acuerdo a las
                                políticas de protección de datos personales. Solo personal autorizado debe tener acceso.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Tipos de Búsqueda</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400">
                                        Persona Física
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Búsqueda por nombre completo de una persona.
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Listas OFAC (SDN, Consolidated)</li>
                                    <li>Lista 69-B del SAT México</li>
                                    <li>Búsqueda por nombres similares (fuzzy matching)</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-400">
                                        Persona Moral
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Búsqueda por razón social de empresas u organizaciones.
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Listas OFAC de entidades sancionadas</li>
                                    <li>Lista 69-B del SAT México (empresas)</li>
                                    <li>Verificación de alias y nombres anteriores</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400">
                                        RFC (México)
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Búsqueda específica por RFC en la lista SAT 69-B.
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Solo Lista 69-B del SAT</li>
                                    <li>Validación del formato RFC (13 caracteres)</li>
                                    <li>Búsqueda exacta y rápida</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400">
                                        Búsqueda Combinada
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Búsqueda simultánea en OFAC y SAT con un solo término.
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Resultados agrupados por fuente</li>
                                    <li>Ideal para due diligence completo</li>
                                    <li>Ahorra tiempo en verificaciones múltiples</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Estadísticas en Tiempo Real</h2>
                    <p className="text-muted-foreground mb-4">
                        El sistema muestra estadísticas actualizadas sobre las búsquedas realizadas.
                    </p>

                    <Card>
                        <CardHeader>
                            <CardTitle>Métricas Disponibles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 md:grid-cols-2">
                                <div>
                                    <p className="font-semibold text-sm mb-1">Total de Búsquedas</p>
                                    <p className="text-sm text-muted-foreground">
                                        Contador global de todas las búsquedas realizadas en el mes actual.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">Coincidencias Encontradas</p>
                                    <p className="text-sm text-muted-foreground">
                                        Número de búsquedas que arrojaron resultados positivos (alertas).
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">Búsquedas esta Semana</p>
                                    <p className="text-sm text-muted-foreground">
                                        Actividad de búsqueda en los últimos 7 días.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">Búsquedas Hoy</p>
                                    <p className="text-sm text-muted-foreground">
                                        Número de búsquedas realizadas en el día actual.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Resultados e Interpretación</h2>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle2 className="h-5 w-5 text-green-600" />
                                Sin Coincidencias
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                Un resultado sin coincidencias indica que el nombre o RFC <strong>NO aparece</strong> en las
                                listas negras consultadas. Esto es favorable y permite continuar con la transacción u operación.
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-red-600" />
                                Con Coincidencias
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Una coincidencia requiere <strong>análisis adicional</strong>:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li>Verificar que sea la misma persona/entidad (nombre completo, fechas, alias)</li>
                                <li>Revisar el tipo de sanción y autoridad que la emitió</li>
                                <li>Evaluar el nivel de riesgo según políticas internas</li>
                                <li>Documentar la evaluación y decisión tomada</li>
                                <li>Considerar consultar con el área legal/compliance</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Subsecciones Disponibles
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Explora las siguientes guías para aprovechar al máximo el módulo:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                        <li><strong>Realizar Búsqueda:</strong> Guía paso a paso del proceso de búsqueda</li>
                        <li><strong>Ver Historial:</strong> Consulta búsquedas anteriores y gestiona el historial</li>
                        <li><strong>Exportar Resultados:</strong> Genera reportes PDF para tu expediente</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'listas-negras-buscar': {
        title: 'Realizar Búsqueda',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Cómo Realizar una Búsqueda</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Esta guía te ayudará a realizar búsquedas efectivas en las listas OFAC y SAT 69-B.
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Proceso Paso a Paso</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-3">
                            <li className="font-semibold text-foreground">
                                Accede al módulo
                                <p className="font-normal text-muted-foreground mt-1 ml-4">
                                    Ve a "Listas Negras" en el menú lateral. Si no ves esta opción, verifica que tu suscripción
                                    incluya el servicio BLACKLIST_OFAC o BLACKLIST_SAT.
                                </p>
                            </li>
                            <li className="font-semibold text-foreground">
                                Selecciona el tipo de búsqueda
                                <p className="font-normal text-muted-foreground mt-1 ml-4">
                                    Haz clic en una de las pestañas: Persona Física, Persona Moral, RFC o Búsqueda Combinada.
                                </p>
                            </li>
                            <li className="font-semibold text-foreground">
                                Ingresa el término de búsqueda
                                <p className="font-normal text-muted-foreground mt-1 ml-4">
                                    Escribe el nombre completo (sin abreviaturas) o RFC. Para mejores resultados, usa el formato
                                    completo y verifica la ortografía.
                                </p>
                            </li>
                            <li className="font-semibold text-foreground">
                                Ejecuta la búsqueda
                                <p className="font-normal text-muted-foreground mt-1 ml-4">
                                    Haz clic en el botón "Buscar". El sistema consultará las bases de datos en tiempo real
                                    (puede tardar 2-10 segundos).
                                </p>
                            </li>
                            <li className="font-semibold text-foreground">
                                Revisa los resultados
                                <p className="font-normal text-muted-foreground mt-1 ml-4">
                                    Si hay coincidencias, aparecerá una tabla con detalles de cada resultado. Si no hay, verás
                                    un mensaje de confirmación.
                                </p>
                            </li>
                        </ol>
                    </CardContent>
                </Card>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Campos de Búsqueda</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Persona Física</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        <p className="font-semibold text-sm">Nombre Completo</p>
                                        <p className="text-sm text-muted-foreground">
                                            Ingresa el nombre completo de la persona (nombre, apellido paterno, apellido materno).
                                        </p>
                                    </div>
                                    <div className="bg-muted p-3 rounded text-sm mt-2">
                                        <p className="font-semibold mb-1">Ejemplo:</p>
                                        <code>Juan García Martínez</code>
                                    </div>
                                    <div className="mt-3">
                                        <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">💡 Consejos:</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1 ml-2">
                                            <li>NO uses abreviaturas (ej: "Lic.", "Dr.")</li>
                                            <li>NO incluyas números o caracteres especiales</li>
                                            <li>Verifica la ortografía correcta</li>
                                            <li>Escribe en MAYÚSCULAS o minúsculas (el sistema normaliza)</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Persona Moral</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        <p className="font-semibold text-sm">Razón Social</p>
                                        <p className="text-sm text-muted-foreground">
                                            Ingresa el nombre completo de la empresa u organización como aparece en documentos
                                            oficiales.
                                        </p>
                                    </div>
                                    <div className="bg-muted p-3 rounded text-sm mt-2">
                                        <p className="font-semibold mb-1">Ejemplos:</p>
                                        <code className="block">Constructora ABC S.A. de C.V.</code>
                                        <code className="block mt-1">Banco Nacional de México</code>
                                    </div>
                                    <div className="mt-3">
                                        <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">💡 Consejos:</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1 ml-2">
                                            <li>Incluye la forma jurídica si la conoces (S.A., S.C., A.C.)</li>
                                            <li>Puedes buscar sin la forma jurídica para más resultados</li>
                                            <li>Si tiene nombre comercial, busca primero por razón social</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>RFC (México)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div>
                                        <p className="font-semibold text-sm">RFC (13 caracteres)</p>
                                        <p className="text-sm text-muted-foreground">
                                            Ingresa el Registro Federal de Contribuyentes completo (con homoclave).
                                        </p>
                                    </div>
                                    <div className="bg-muted p-3 rounded text-sm mt-2">
                                        <p className="font-semibold mb-1">Formato:</p>
                                        <code>GAMC800101AB1</code> (13 caracteres)
                                    </div>
                                    <div className="mt-3">
                                        <p className="font-semibold text-sm text-amber-600 dark:text-amber-400">⚠️ Importante:</p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-1 ml-2">
                                            <li>El RFC debe ser completo (13 caracteres incluida homoclave)</li>
                                            <li>Sin espacios ni guiones</li>
                                            <li>Solo busca en Lista 69-B del SAT (no OFAC)</li>
                                        </ul>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Interpretación de Resultados</h2>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Tabla de Resultados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Cuando hay coincidencias, la tabla muestra:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Nombre/Razón Social:</strong> Como aparece en la lista oficial</li>
                                <li><strong>Fuente:</strong> OFAC o SAT 69-B</li>
                                <li><strong>Tipo:</strong> Persona Física, Empresa, etc.</li>
                                <li><strong>RFC:</strong> Si está disponible (solo SAT)</li>
                                <li><strong>Fecha:</strong> Cuándo se agregó a la lista</li>
                                <li><strong>Detalles adicionales:</strong> Alias, direcciones, motivo de sanción</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Nivel de Coincidencia</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                El sistema puede encontrar coincidencias:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li>
                                    <strong>Exactas:</strong> El nombre coincide completamente (100% de certeza)
                                </li>
                                <li>
                                    <strong>Similares:</strong> El nombre es parecido pero no idéntico (requiere verificación
                                    manual para confirmar si es la misma persona/entidad)
                                </li>
                            </ul>
                            <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded">
                                <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">
                                    Siempre verifica manualmente
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Revisa nombres completos, fechas de nacimiento, nacionalidad y otros datos para confirmar
                                    que realmente se trata de la misma persona u organización.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div className="bg-red-50 dark:bg-red-950/20 p-6 rounded-lg border border-red-200 dark:border-red-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                        ¿Qué hacer si encuentro una coincidencia?
                    </h3>
                    <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 mt-3">
                        <li><strong>NO continúes automáticamente</strong> con la operación o transacción</li>
                        <li>Revisa cuidadosamente todos los detalles del resultado</li>
                        <li>Compara con los datos que tienes de tu cliente</li>
                        <li>Documenta tu análisis y conclusión</li>
                        <li>Consulta con el área de cumplimiento o legal de tu organización</li>
                        <li>Descarga el PDF para adjuntar al expediente</li>
                        <li>Sigue las políticas internas de tu notaría/organización</li>
                    </ol>
                </div>
            </div>
        ),
    },
    'listas-negras-historial': {
        title: 'Ver Historial',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Historial de Búsquedas</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El sistema mantiene un registro completo de todas las búsquedas realizadas, permitiendo auditorías,
                        seguimiento y consultas históricas.
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <HistoryIcon className="h-5 w-5 text-primary" />
                            Acceder al Historial
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            Para ver el historial de búsquedas:
                        </p>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                            <li>Desde cualquier vista de Listas Negras, busca el botón <strong>"Ver Historial"</strong></li>
                            <li>O accede directamente desde el menú a "Listas Negras" → "Historial"</li>
                        </ol>
                    </CardContent>
                </Card>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información del Historial</h2>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Datos Registrados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Cada búsqueda registra:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Fecha y hora exacta</strong> de la búsqueda</li>
                                <li><strong>Usuario que realizó</strong> la búsqueda (nombre y email)</li>
                                <li><strong>Tipo de búsqueda:</strong> Persona Física, Moral, RFC o Combinada</li>
                                <li><strong>Término buscado:</strong> El nombre o RFC consultado</li>
                                <li><strong>Resultados encontrados:</strong> Número de coincidencias</li>
                                <li><strong>Notaría asociada:</strong> Si el usuario pertenece a una notaría</li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Vista de Tabla</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                El historial se muestra en una tabla ordenada por fecha (más recientes primero) con paginación
                                para facilitar la navegación en historiales extensos.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Filtros de Búsqueda</h2>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Filtrar por Tipo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Selecciona el tipo de búsqueda para ver solo:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Persona Física</li>
                                    <li>Persona Moral</li>
                                    <li>RFC (SAT únicamente)</li>
                                    <li>Búsqueda Combinada</li>
                                    <li>Todas (opción por defecto)</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Filtrar por Período</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Filtra búsquedas por rango de tiempo:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Hoy:</strong> Solo búsquedas del día actual</li>
                                    <li><strong>Últimos 7 días:</strong> Esta semana</li>
                                    <li><strong>Últimos 30 días:</strong> Este mes (opción por defecto)</li>
                                    <li><strong>Últimos 90 días:</strong> Trimestre actual</li>
                                    <li><strong>Todo el historial:</strong> Sin límite de fecha</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Buscar por Término</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Usa el campo de búsqueda de texto para encontrar búsquedas que contengan un término específico
                                    (nombre, RFC, parte de un nombre).
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Acciones Disponibles</h2>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5 text-primary" />
                                    Repetir Búsqueda
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Haz clic en el icono de repetir para ejecutar nuevamente la misma búsqueda. Esto es útil para
                                    verificar si ha habido cambios en las listas desde la última consulta.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Trash2 className="h-5 w-5 text-destructive" />
                                    Eliminar del Historial
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Los usuarios pueden eliminar sus propias búsquedas del historial. Super Admins pueden
                                    eliminar cualquier búsqueda.
                                </p>
                                <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded">
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">
                                        ⚠️ Precaución
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Eliminar una búsqueda del historial es permanente. Considera si necesitas mantener el
                                        registro para auditorías o cumplimiento normativo antes de eliminar.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Download className="h-5 w-5 text-primary" />
                                    Descargar/Exportar
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Puedes exportar el historial filtrado a diferentes formatos (Excel, CSV) para análisis o
                                    reportes internos. Super Admins tienen acceso a exportación masiva.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Permisos y Visibilidad</h2>

                    <Card>
                        <CardHeader>
                            <CardTitle>¿Quién ve qué?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div>
                                    <p className="font-semibold text-sm mb-1">Super Admin</p>
                                    <p className="text-sm text-muted-foreground">
                                        Puede ver <strong>todas</strong> las búsquedas de todas las notarías del sistema.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">Admin Notaría</p>
                                    <p className="text-sm text-muted-foreground">
                                        Puede ver todas las búsquedas realizadas por usuarios de <strong>su notaría únicamente</strong>.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">Usuario Estándar</p>
                                    <p className="text-sm text-muted-foreground">
                                        Puede ver todas las búsquedas de <strong>su notaría</strong> (transparencia para trabajo
                                        colaborativo).
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Auditorías y Cumplimiento
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        El historial de búsquedas es una herramienta esencial para auditorías de cumplimiento normativo.
                        Mantiene un registro detallado de todas las verificaciones realizadas, demostrando due diligence
                        ante autoridades regulatorias.
                    </p>
                </div>
            </div>
        ),
    },
    'listas-negras-exportar': {
        title: 'Exportar Resultados',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Exportación de Resultados</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El sistema permite exportar los resultados de búsquedas a formato PDF para documentación y expedientes.
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Download className="h-5 w-5 text-primary" />
                            Generar PDF
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">
                            Para exportar una búsqueda a PDF:
                        </p>
                        <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                            <li>Realiza la búsqueda en la sección principal de Listas Negras</li>
                            <li>Una vez que aparezcan los resultados, busca el botón <strong>"Descargar PDF"</strong></li>
                            <li>El sistema generará automáticamente un documento PDF profesional</li>
                            <li>El PDF se descargará directamente a tu equipo</li>
                        </ol>
                    </CardContent>
                </Card>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Contenido del PDF</h2>

                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle>Elementos del Reporte</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                El PDF generado incluye:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li>
                                    <strong>Encabezado corporativo:</strong> Logo de la notaría y datos de contacto
                                </li>
                                <li>
                                    <strong>Fecha y hora de la búsqueda:</strong> Timestamp exacto de cuándo se realizó
                                </li>
                                <li>
                                    <strong>Tipo de búsqueda:</strong> OFAC, SAT, Combinada, etc.
                                </li>
                                <li>
                                    <strong>Término buscado:</strong> Nombre o RFC consultado
                                </li>
                                <li>
                                    <strong>Usuario que realizó la búsqueda:</strong> Nombre y cargo
                                </li>
                                <li>
                                    <strong>Resultados detallados:</strong> Tabla con todas las coincidencias encontradas
                                    (o mensaje de "Sin coincidencias")
                                </li>
                                <li>
                                    <strong>Detalles de cada coincidencia:</strong> Nombre completo, fuente, tipo, RFC,
                                    fecha, alias y otros datos disponibles
                                </li>
                                <li>
                                    <strong>Folio único:</strong> Número de referencia para el documento
                                </li>
                                <li>
                                    <strong>Disclaimer legal:</strong> Nota sobre el alcance y propósito del reporte
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Formato Profesional</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                El PDF está diseñado con formato profesional incluyendo:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mt-2 ml-2">
                                <li>Marca de agua de seguridad</li>
                                <li>Numeración de páginas</li>
                                <li>Tablas organizadas y fáciles de leer</li>
                                <li>Formato compatible para impresión y archivo digital</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Casos de Uso</h2>

                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Expediente de Cliente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Adjunta el PDF al expediente del cliente como evidencia documental de que se realizó la
                                    verificación en listas negras, cumpliendo con requisitos de due diligence.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Auditorías y Cumplimiento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Conserva los PDFs como respaldo para auditorías internas o externas, demostrando que la
                                    organización sigue procedimientos de prevención de lavado de dinero.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Reportes a Autoridades</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    En caso de encontrar coincidencias, el PDF sirve como soporte documental para reportes a
                                    la Unidad de Inteligencia Financiera (UIF) u otras autoridades competentes.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Consulta Offline</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Descarga el PDF para consultar los resultados sin necesidad de estar conectado al sistema,
                                    útil en reuniones con clientes o presentaciones.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Mejores Prácticas</h2>

                    <Card>
                        <CardHeader>
                            <CardTitle>Gestión de Documentos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li>
                                    <strong>Nomenclatura clara:</strong> Renombra los archivos con formato estándar,
                                    ej: <code className="text-xs bg-muted px-1 py-0.5 rounded">
                                        OFAC_JuanGarcia_20260402.pdf
                                    </code>
                                </li>
                                <li>
                                    <strong>Almacenamiento organizado:</strong> Guarda los PDFs en carpetas por cliente
                                    o expediente
                                </li>
                                <li>
                                    <strong>Conservación:</strong> Mantén los PDFs al menos durante el plazo legal requerido
                                    (generalmente 5-10 años según la jurisdicción)
                                </li>
                                <li>
                                    <strong>Backup:</strong> Respalda los documentos en sistemas seguros y redundantes
                                </li>
                                <li>
                                    <strong>Control de acceso:</strong> Restringe el acceso a los PDFs solo a personal
                                    autorizado (datos sensibles)
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Notas Importantes
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>
                            • Los PDFs NO son documentos oficiales emitidos por OFAC o SAT, son reportes generados por
                            el sistema Atinet para uso interno
                        </li>
                        <li>
                            • La información está sujeta a cambios; las listas se actualizan constantemente
                        </li>
                        <li>
                            • Cada búsqueda genera un PDF único con folio individual para trazabilidad
                        </li>
                        <li>
                            • Los PDFs contienen datos sensibles y deben manejarse con confidencialidad
                        </li>
                    </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        ¿No puedes generar PDF?
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Si experimientas problemas al generar PDFs, verifica:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                        <li>Que tu navegador permita descargas automáticas</li>
                        <li>Que tienes espacio suficiente en disco</li>
                        <li>Que completaste una búsqueda antes de intentar descargar</li>
                        <li>Si el problema persiste, contacta a soporte técnico</li>
                    </ul>
                </div>
            </div>
        ),
    },
    agenda: {
        title: 'Agenda Web',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Agenda Colaborativa</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        La Agenda Web es un calendario colaborativo completo que permite gestionar eventos, citas,
                        recordatorios y actividades de la notaría con capacidades de recurrencia, visualización
                        múltiple y bitácora de actividades.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Características Principales</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CalendarDays className="h-5 w-5 text-primary" />
                                    Calendario Completo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Visualización de eventos en múltiples formatos:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Vista mensual (día, semana, mes)</li>
                                    <li>Lista de eventos</li>
                                    <li>Arrastrar y soltar para reorganizar</li>
                                    <li>Zoom y navegación intuitiva</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5 text-primary" />
                                    Eventos Recurrentes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Crea eventos que se repiten automáticamente:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Diario, semanal, mensual, anual</li>
                                    <li>Selecciona días específicos de la semana</li>
                                    <li>Define duración personalizada</li>
                                    <li>Edita series completas o individuales</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Colaboración
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Comparte la agenda entre el equipo:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Ver todos los eventos de la notaría</li>
                                    <li>Filtrar por usuario (solo míos/todos)</li>
                                    <li>Editar eventos propios</li>
                                    <li>Admins gestionan todos los eventos</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-primary" />
                                    Bitácora de Actividades
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Registro automático de todas las acciones: creación, modificación y eliminación
                                    de eventos con fecha, hora, usuario y notaría.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Tipos de Eventos</h2>
                    <div className="space-y-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                                        General
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Eventos genéricos para cualquier actividad, reunión interna o tarea administrativa.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">
                                        Cita
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Citas con clientes, reuniones programadas, comparecencias o firmas de escrituras.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-400">
                                        Recordatorio
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Alertas para tareas pendientes, pagos, vencimientos o seguimientos importantes.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
                                        Festivo
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Días festivos oficiales, vacaciones o días no laborables de la notaría.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Vistas Disponibles</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Calendario Interactivo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Vista principal con calendario completo:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Haz clic en cualquier fecha/hora para crear un evento</li>
                                    <li>Arrastra eventos para cambiar fecha u hora</li>
                                    <li>Haz clic en un evento para ver detalles o editar</li>
                                    <li>Redimensiona eventos para ajustar duración</li>
                                    <li>Navega por meses, semanas o días usando los controles</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Citas del Día</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Lista enfocada de todas las citas programadas para el día actual, ordenadas por hora,
                                    con acceso rápido a detalles y acciones.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Bitácora</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Registro histórico de todas las acciones realizadas en la agenda: quién creó, modificó
                                    o eliminó eventos, con fecha, hora y notaría asociada.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Subsecciones Disponibles
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Explora las siguientes guías:
                    </p>
                    <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                        <li><strong>Crear Evento:</strong> Guía completa para crear y configurar eventos</li>
                        <li><strong>Compartir Agenda:</strong> Cómo colaborar con tu equipo</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'agenda-crear-evento': {
        title: 'Crear Evento',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Cómo Crear un Evento</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Existen múltiples formas de crear eventos en la agenda. Esta guía te mostrará todas las opciones.
                    </p>
                </div>

                <Card className="mb-4">
                    <CardHeader>
                        <CardTitle>Métodos de Creación</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <p className="font-semibold text-sm mb-2">1. Botón "Nuevo evento"</p>
                                <p className="text-sm text-muted-foreground">
                                    Haz clic en el botón <strong>"Nuevo evento"</strong> en la esquina superior derecha.
                                    Se abrirá un formulario con la fecha y hora actual por defecto.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm mb-2">2. Hacer clic en el calendario</p>
                                <p className="text-sm text-muted-foreground">
                                    Haz clic en cualquier fecha u hora del calendario. El formulario se abrirá con esa
                                    fecha/hora precargada.
                                </p>
                            </div>
                            <div>
                                <p className="font-semibold text-sm mb-2">3. Arrastrar en el calendario</p>
                                <p className="text-sm text-muted-foreground">
                                    Haz clic y arrastra sobre el calendario para seleccionar un rango de tiempo. El evento
                                    se creará con esa duración automáticamente.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Formulario de Evento</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Campos Básicos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Título *</p>
                                        <p className="text-sm text-muted-foreground">
                                            Nombre descriptivo del evento. Ejemplo: "Firma de escritura - Ramírez"
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Tipo *</p>
                                        <p className="text-sm text-muted-foreground">
                                            Selecciona: General, Cita, Recordatorio o Festivo. Esto ayuda a categorizar
                                            y filtrar eventos.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Fecha y hora de inicio *</p>
                                        <p className="text-sm text-muted-foreground">
                                            Cuándo comienza el evento. Usa el selector de fecha y hora.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Fecha y hora de fin *</p>
                                        <p className="text-sm text-muted-foreground">
                                            Cuándo termina el evento. Debe ser posterior a la fecha de inicio.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Todo el día</p>
                                        <p className="text-sm text-muted-foreground">
                                            Activa esta opción si el evento dura todo el día (sin horas específicas).
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Color</p>
                                        <p className="text-sm text-muted-foreground">
                                            Selecciona un color para identificar visualmente el evento en el calendario.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Comentarios</p>
                                        <p className="text-sm text-muted-foreground">
                                            Notas adicionales, detalles o descripción del evento.
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Eventos Recurrentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Activar recurrencia</p>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Marca la casilla <strong>"Evento recurrente"</strong> para configurar la repetición.
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Frecuencia</p>
                                        <p className="text-sm text-muted-foreground mb-2">
                                            Selecciona cada cuánto se repite:
                                        </p>
                                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                            <li><strong>Diario:</strong> Se repite todos los días</li>
                                            <li><strong>Semanal:</strong> Se repite cada semana (selecciona días)</li>
                                            <li><strong>Mensual:</strong> Se repite el mismo día cada mes</li>
                                            <li><strong>Anual:</strong> Se repite el mismo día cada año</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Días de la semana (solo semanal)</p>
                                        <p className="text-sm text-muted-foreground">
                                            Si elegiste frecuencia semanal, selecciona los días en que se repite
                                            (ejemplo: Lunes, Miércoles y Viernes).
                                        </p>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm mb-1">Duración</p>
                                        <p className="text-sm text-muted-foreground">
                                            Define cuánto dura cada instancia del evento recurrente (formato HH:MM).
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Editar y Eliminar Eventos</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Editar Evento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Para editar un evento:
                                </p>
                                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                                    <li>Haz clic sobre el evento en el calendario</li>
                                    <li>Se abrirá el modal con los detalles actuales</li>
                                    <li>Modifica los campos que necesites</li>
                                    <li>Haz clic en "Guardar cambios"</li>
                                </ol>
                                <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded">
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">
                                        ⚠️ Eventos recurrentes
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Al editar un evento recurrente desde el calendario, solo se modificará esa instancia
                                        específica. Para editar la serie completa, edítalo desde su configuración original.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Eliminar Evento</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Para eliminar un evento:
                                </p>
                                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                                    <li>Haz clic sobre el evento</li>
                                    <li>En el modal que se abre, haz clic en "Eliminar"</li>
                                    <li>Confirma la acción</li>
                                </ol>
                                <div className="mt-3 bg-red-50 dark:bg-red-950/20 p-3 rounded">
                                    <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">
                                        🗑️ Acción permanente
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        La eliminación es permanente y no se puede deshacer. Todas las acciones quedan
                                        registradas en la bitácora.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Mover Eventos (Arrastrar y Soltar)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Puedes arrastrar eventos directamente en el calendario para cambiar su fecha u hora.
                                    El sistema guardará automáticamente el cambio y lo registrará en la bitácora.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <HelpCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Consejos
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• Usa colores consistentes para tipos de eventos similares (todas las citas en azul, recordatorios en amarillo)</li>
                        <li>• Añade detalles en los comentarios para que otros usuarios del equipo comprendan el contexto</li>
                        <li>• Los eventos de todo el día son ideales para festivos y vacaciones</li>
                        <li>• Revisa la bitácora periódicamente para saber qué cambios ha realizado tu equipo</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'agenda-compartir': {
        title: 'Compartir Agenda',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Agenda Colaborativa</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        La agenda de Atinet está diseñada para el trabajo en equipo. Todos los usuarios de una notaría
                        comparten la misma agenda y pueden crear, ver y gestionar eventos según sus permisos.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                        <Users className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Colaboración Automática
                            </p>
                            <p className="text-sm text-muted-foreground">
                                No necesitas "compartir" manualmente. Todos los eventos creados por cualquier usuario
                                de tu notaría son visibles automáticamente para el resto del equipo.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Permisos y Visibilidad</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Usuarios Estándar</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Los usuarios normales pueden:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Ver todos los eventos de la notaría</li>
                                    <li>Crear nuevos eventos</li>
                                    <li>Editar y eliminar <strong>sus propios</strong> eventos</li>
                                    <li>Ver detalles completos de cualquier evento</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Administradores</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Los administradores (Admin Notaría y Super Admin) pueden:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Ver todos los eventos de la notaría o del sistema</li>
                                    <li>Crear nuevos eventos</li>
                                    <li>Editar y eliminar <strong>cualquier evento</strong></li>
                                    <li>Filtrar vista: "Ver todos" o "Solo míos"</li>
                                    <li>Acceder a la bitácora completa de actividades</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Filtros de Vista (Solo Admins)</h2>
                    <Card className="mb-4">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5 text-primary" />
                                Control de Visibilidad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Los administradores tienen un selector en la esquina superior derecha de la agenda:
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <p className="font-semibold text-sm mb-1">Ver todo</p>
                                    <p className="text-sm text-muted-foreground">
                                        Muestra todos los eventos de todos los usuarios de la notaría. Vista por defecto.
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">Solo míos</p>
                                    <p className="text-sm text-muted-foreground">
                                        Filtra para mostrar únicamente los eventos creados por el administrador actual.
                                        Útil para enfocarse en las propias actividades.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Identificación de Eventos</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>¿Quién creó qué?</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Cada evento muestra información del creador:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li>Al hacer clic en un evento, el modal muestra el título y detalles</li>
                                <li>Los eventos con restricción (no editables) muestran solo modo lectura</li>
                                <li>La bitácora registra qué usuario creó, modificó o eliminó cada evento</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Bitácora de Actividades</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Registro Completo
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                La pestaña "Bitácora" muestra un historial completo de todas las acciones:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Usuario:</strong> Quién realizó la acción (email)</li>
                                <li><strong>Acción:</strong> Creó, modificó o eliminó</li>
                                <li><strong>Fecha y hora:</strong> Cuándo ocurrió</li>
                                <li><strong>Notaría:</strong> En qué notaría se realizó (útil para Super Admins)</li>
                            </ul>
                            <p className="text-sm text-muted-foreground mt-3">
                                Esta bitácora es de solo lectura y sirve para auditoría y seguimiento de cambios.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Mejores Prácticas de Colaboración
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• <strong>Nombres claros:</strong> Usa títulos descriptivos que todo el equipo entienda</li>
                        <li>• <strong>Colores consistentes:</strong> Acuerda un código de colores con tu equipo (ej: azul para citas con clientes)</li>
                        <li>• <strong>Comentarios detallados:</strong> Agrega información relevante en los comentarios para contexto compartido</li>
                        <li>• <strong>Respeta eventos ajenos:</strong> No edites eventos de otros a menos que sea necesario</li>
                        <li>• <strong>Revisa la bitácora:</strong> Mantente informado de los cambios realizados por tu equipo</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'registro-web': {
        title: 'Registro Web',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Registro de Personas</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Registro Web permite capturar información completa de personas físicas y morales
                        con tecnología QR y OCR para agilizar el proceso de registro y evitar errores de transcripción.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                        <QrCode className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Tecnología Avanzada
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Escanea INE/IFE con códigos QR o usa OCR para extraer automáticamente los datos,
                                reduciendo tiempo de captura y minimizando errores.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Tipos de Registro</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-primary" />
                                    Persona Física
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Registro completo de individuos con:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Datos generales (nombre, RFC, CURP)</li>
                                    <li>Información de identificación oficial</li>
                                    <li>Domicilio completo</li>
                                    <li>Datos de contacto</li>
                                    <li>Información adicional de testador</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    Persona Moral
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Registro de empresas y organizaciones:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Razón social y nombre comercial</li>
                                    <li>RFC y datos fiscales</li>
                                    <li>Domicilio fiscal</li>
                                    <li>Datos de contacto</li>
                                    <li>Representante legal</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Secciones del Formulario</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>📋 Datos Generales</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Información básica de identificación:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Nombre completo (apellidos y nombre/s)</li>
                                    <li>RFC (Registro Federal de Contribuyentes)</li>
                                    <li>CURP (Clave Única de Registro de Población)</li>
                                    <li>Datos de identificación oficial (INE, Pasaporte, etc.)</li>
                                    <li>Fecha de nacimiento o constitución</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🏠 Domicilio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Dirección completa:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Calle, número exterior e interior</li>
                                    <li>Colonia y código postal</li>
                                    <li>Municipio y estado</li>
                                    <li>Referencias adicionales</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>📞 Contacto</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-2">
                                    Medios de comunicación:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Teléfono fijo y celular</li>
                                    <li>Email personal y/o corporativo</li>
                                    <li>Otros medios de contacto</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>⚖️ Datos de Testador (Opcional)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Información específica para testamentos: estado civil, nacionalidad, profesión,
                                    datos de cónyuge y beneficiarios.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Tecnología QR y OCR</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <QrCode className="h-5 w-5 text-primary" />
                                    Escaneo QR de INE/IFE
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Las credenciales INE actuales incluyen un código QR en el reverso:
                                </p>
                                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                                    <li>Haz clic en el botón de escaneo QR</li>
                                    <li>Permite el acceso a la cámara</li>
                                    <li>Enfoca el código QR de la INE</li>
                                    <li>El sistema extrae automáticamente: nombre, CURP, domicilio, fecha de nacimiento</li>
                                    <li>Revisa y completa campos faltantes</li>
                                </ol>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Camera className="h-5 w-5 text-primary" />
                                    OCR (Reconocimiento Óptico)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Para documentos sin QR o identificaciones antiguas:
                                </p>
                                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2">
                                    <li>Selecciona la opción OCR</li>
                                    <li>Toma o sube una foto del documento</li>
                                    <li>El sistema analiza la imagen y extrae texto</li>
                                    <li>Revisa y corrige la información detectada</li>
                                    <li>Guarda el registro</li>
                                </ol>
                                <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded">
                                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">
                                        💡 Consejo
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        Para mejores resultados con OCR, asegúrate de que la imagen esté bien iluminada,
                                        enfocada y sin reflejos.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Historial de Registros</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Búsqueda y Consulta</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                El sistema mantiene un historial completo de todos los registros capturados:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li>Búsqueda por nombre, RFC o CURP</li>
                                <li>Estadísticas: registros nuevos vs. importados del sistema legacy</li>
                                <li>Edición y actualización de registros existentes</li>
                                <li>Consulta de información completa</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Beneficios del Sistema
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Ahorro de tiempo:</strong> Captura datos en segundos con QR/OCR</li>
                        <li>✅ <strong>Reducción de errores:</strong> Menos transcripción manual = menos errores</li>
                        <li>✅ <strong>Base de datos centralizada:</strong> Toda la información en un solo lugar</li>
                        <li>✅ <strong>Integración con legacy:</strong> Acceso a registros históricos existentes</li>
                        <li>✅ <strong>Búsqueda rápida:</strong> Encuentra registros al instante</li>
                    </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Privacidad y Seguridad
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Toda la información capturada es confidencial y protegida por las políticas de privacidad
                        de datos personales. Solo usuarios autorizados de la notaría tienen acceso. Las imágenes
                        capturadas no se almacenan, solo la información extraída.
                    </p>
                </div>
            </div>
        ),
    },
    'control-notarial': {
        title: 'Control Notarial',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Control Notarial</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Control Notarial es un sistema integral para la gestión completa de operaciones
                        notariales: expedientes, presupuestos previos, escrituras y documentación con integración
                        al sistema legacy VB6.
                    </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">
                                Módulo en Desarrollo
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Este módulo está actualmente en proceso de migración desde el sistema legacy VB6.
                                Algunas funcionalidades están disponibles mientras otras se están desarrollando.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Componentes del Sistema</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Expedientes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Gestión completa de expedientes notariales:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Creación y organización de expedientes</li>
                                    <li>Asignación de número de expediente</li>
                                    <li>Control de estados (en proceso, finalizado)</li>
                                    <li>Historial de modificaciones</li>
                                    <li>Búsqueda y filtrado avanzado</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileText className="h-5 w-5 text-primary" />
                                    Presupuestos Previos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Generación de cotizaciones y presupuestos:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Cálculo automático de honorarios</li>
                                    <li>Desglose de costos y gastos</li>
                                    <li>Plantillas personalizables</li>
                                    <li>Generación de PDF</li>
                                    <li>Conversión a expediente formal</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Scale className="h-5 w-5 text-primary" />
                                    Escrituras
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Control de escrituras públicas:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Registro de escrituras</li>
                                    <li>Numeración y foliado</li>
                                    <li>Control de volúmenes</li>
                                    <li>Seguimiento de firmas y autorizaciones</li>
                                    <li>Integración con catálogos de operaciones</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-primary" />
                                    Configuración
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Personalización del sistema:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Catálogos de operaciones</li>
                                    <li>Tarifas y aranceles</li>
                                    <li>Plantillas de documentos</li>
                                    <li>Gestión de clientes</li>
                                    <li>Configuración de usuarios</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Integración con Sistema Legacy</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Acceso a Datos Históricos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                El sistema mantiene conexión con la base de datos del sistema anterior (VB6):
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2">
                                <li>
                                    <strong>Consulta de expedientes legacy:</strong> Acceso a todos los expedientes
                                    históricos sin necesidad de migración masiva
                                </li>
                                <li>
                                    <strong>Búsqueda unificada:</strong> Los resultados de búsqueda incluyen tanto
                                    registros nuevos como históricos
                                </li>
                                <li>
                                    <strong>Migración gradual:</strong> Los datos se migran automáticamente al sistema
                                    nuevo cuando se actualizan o modifican
                                </li>
                                <li>
                                    <strong>Estadísticas integradas:</strong> El dashboard muestra métricas combinadas
                                    de ambos sistemas
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Flujo de Trabajo Típico</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>1. Presupuesto Previo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Cuando un cliente consulta por un servicio, se genera primero un presupuesto previo
                                    con cotización detallada. Si el cliente acepta, este presupuesto se convierte en
                                    expediente formal.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>2. Creación de Expediente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Se crea el expediente con número asignado, se vinculan las personas (físicas/morales)
                                    involucradas, y se establece el tipo de operación notarial.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>3. Desarrollo y Documentación</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Durante el proceso se generan los documentos necesarios, se registran avances,
                                    se agregan notas y se mantiene el expediente actualizado.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>4. Escrituración</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Cuando corresponde, se genera la escritura pública con numeración oficial,
                                    se registra en el libro correspondiente y se controlan las firmas y autorizaciones.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>5. Cierre y Archivo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Al finalizar la operación, el expediente se marca como concluido y queda disponible
                                    para consulta histórica, reportes y auditorías.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Estado de Desarrollo
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        El sistema está siendo migrado en fases desde Visual Basic 6 a Laravel + React:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Fase 1:</strong> Exploración de base de datos legacy (Completado)</li>
                        <li>✅ <strong>Fase 2:</strong> Análisis de código VB6 (Completado)</li>
                        <li>🔄 <strong>Fase 3:</strong> Identificación de workflows (En proceso)</li>
                        <li>⏳ <strong>Fase 4:</strong> Desarrollo de interfaces modernas (Próximamente)</li>
                        <li>⏳ <strong>Fase 5:</strong> Generación de reportes (Próximamente)</li>
                        <li>⏳ <strong>Fase 6:</strong> Prototipos y pruebas finales (Próximamente)</li>
                    </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Importante
                    </h3>
                    <p className="text-sm text-muted-foreground">
                        Durante la migración, algunas funcionalidades se encuentran en modo de solo lectura o con
                        acceso limitado. El sistema legacy permanece disponible como respaldo hasta completar la
                        migración total. Consulta con tu administrador sobre funcionalidades específicas.
                    </p>
                </div>
            </div>
        ),
    },
    // Más secciones se agregarán progresivamente
};

export default function Documentation({ currentSection }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState(currentSection);
    const [bookMode, setBookMode] = useState(false);

    const handleSectionClick = (sectionId: string) => {
        setActiveSection(sectionId);
        window.history.pushState({}, '', `/admin/documentacion?section=${sectionId}`);
    };

    const currentContent = sectionContent[activeSection] || sectionContent.introduccion;

    return (
        <DocumentationLayout>
            <Head title="Manual de Usuario - Atinet Compliance Hub" />

            {/* Header estilo Welcome Navbar - con soporte light/dark */}
            <header className="fixed top-0 left-0 right-0 z-50 border-b border-sidebar-border/50 bg-white/95 dark:bg-[#00040f]/95 backdrop-blur-sm shadow-lg transition-all duration-400">
                <nav className="max-w-7xl mx-auto px-2 sm:px-5 md:px-20 py-3 sm:py-5 md:py-7">
                    <div className="flex items-center justify-between gap-2">
                        {/* Logo y Título */}
                        <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                            <div className="h-8 sm:h-10 md:h-14">
                                <AppLogo />
                            </div>
                            <Separator orientation="vertical" className="h-6 sm:h-10 md:h-12 bg-border hidden sm:block" />
                            <div className="hidden sm:block">
                                <h1 className="text-base sm:text-xl md:text-2xl font-bold flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
                                    <span>Manual de Usuario</span>
                                </h1>
                                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Guía completa del sistema</p>
                            </div>
                        </div>

                        {/* Controles Mobile/Desktop */}
                        <div className="flex items-center gap-2">
                            {/* Toggle Modo Libro */}
                            <div className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 bg-accent/50 rounded-lg">
                                <Label htmlFor="book-mode" className="text-xs sm:text-sm font-medium cursor-pointer flex items-center gap-1 sm:gap-2">
                                    <BookOpenCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                    <span className="hidden lg:inline">Modo Libro</span>
                                </Label>
                                <Switch
                                    id="book-mode"
                                    checked={bookMode}
                                    onCheckedChange={setBookMode}
                                />
                            </div>

                            {/* Botón Volver */}
                            <Link
                                href={dashboard()}
                                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 md:px-6 py-1.5 sm:py-2 text-xs sm:text-sm md:text-base font-medium text-foreground hover:text-primary bg-accent hover:bg-accent/80 rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                                <ArrowLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                <span className="hidden sm:inline">Volver</span>
                            </Link>
                        </div>
                    </div>
                </nav>
            </header>

            {/* Content con padding-top para compensar header fixed */}
            <div className="container mx-auto px-2 sm:px-5 md:px-20 py-4 sm:py-8 pt-20 sm:pt-28 md:pt-36">
                {bookMode ? (
                    /* Modo Libro con Page Flip */
                    <div className="flex flex-col items-center w-full">
                        <PageFlipBook
                            width={900}
                            height={1200}
                            showControls={true}
                            className="w-full"
                            onFlip={(data) => {
                                // Opcional: actualizar sección activa basado en página
                                console.log('Flipped to page:', data.page);
                            }}
                        >
                            {/* Portada */}
                            <Page>
                                <div className="h-full flex flex-col items-center justify-center bg-linear-to-br from-primary/20 to-accent/20 p-8">
                                    <div style={{ height: '96px', width: '96px', marginBottom: '32px' }}>
                                        <AppLogo />
                                    </div>
                                    <h1 className="text-4xl font-bold text-center mb-4">Manual de Usuario</h1>
                                    <h2 className="text-2xl font-semibold text-center text-muted-foreground mb-8">
                                        Atinet Compliance Hub
                                    </h2>
                                    <Separator className="my-6 w-1/2" />
                                    <p className="text-center text-muted-foreground">
                                        Guía completa del sistema
                                    </p>
                                    <p className="text-sm text-muted-foreground mt-8">
                                        Última actualización: 1 de abril, 2026
                                    </p>
                                </div>
                            </Page>

                            {/* Páginas de contenido */}
                            {Object.entries(sectionContent).map(([key, section]) => (
                                <Page key={key}>
                                    <div className="h-full p-8">
                                        <h2 className="text-3xl font-bold mb-6 text-primary sticky top-0 bg-card pb-4 border-b">{section.title}</h2>
                                        <div className="prose prose-base dark:prose-invert max-w-none">
                                            {section.content}
                                        </div>
                                    </div>
                                </Page>
                            ))}

                            {/* Contraportada */}
                            <Page>
                                <div className="h-full flex flex-col items-center justify-center bg-linear-to-br from-accent/20 to-primary/20 p-8">
                                    <BookOpen className="h-16 w-16 text-primary mb-6" />
                                    <h3 className="text-2xl font-bold text-center mb-4">¿Necesitas más ayuda?</h3>
                                    <p className="text-center text-muted-foreground mb-6">
                                        Contacta con el equipo de soporte para asistencia personalizada
                                    </p>
                                    <Separator className="my-6 w-1/2" />
                                    <p className="text-sm text-muted-foreground text-center">
                                        Atinet Compliance Hub © 2026
                                    </p>
                                </div>
                            </Page>
                        </PageFlipBook>
                    </div>
                ) : (
                    /* Vista Normal (modo actual) */
                <div className="flex gap-6 md:gap-8">
                    {/* Sidebar de navegación */}
                    <div className="w-64 md:w-80 shrink-0 hidden lg:block">
                        <div className="sticky top-36 border rounded-xl bg-card backdrop-blur-sm shadow-sm">
                            <ScrollArea className="h-[calc(100vh-10rem)]">
                                <div className="p-4 space-y-4">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                        <Input
                                            type="text"
                                            placeholder="Buscar en la documentación..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="pl-9"
                                        />
                                    </div>

                                    <Separator />

                                    <nav className="space-y-1">
                                        {docSections.map((section) => (
                                            <div key={section.id}>
                                                <Button
                                                    id={`${section.id}-section`}
                                                    variant={activeSection === section.id ? 'secondary' : 'ghost'}
                                                    className={`w-full justify-start gap-2 ${
                                                        activeSection === section.id
                                                            ? 'bg-primary/10 text-primary border border-primary/30'
                                                            : ''
                                                    }`}
                                                    onClick={() => handleSectionClick(section.id)}
                                                >
                                                    <section.icon className="h-4 w-4" />
                                                    <span className="flex-1 text-left">{section.title}</span>
                                                    {section.badge && (
                                                        <Badge variant="secondary" className="text-xs">
                                                            {section.badge}
                                                        </Badge>
                                                    )}
                                                </Button>

                                                {section.subsections && activeSection.startsWith(section.id) && (
                                                    <div className="ml-6 mt-1 space-y-1">
                                                        {section.subsections.map((subsection) => (
                                                            <Button
                                                                key={subsection.id}
                                                                variant={
                                                                    activeSection === subsection.id ? 'secondary' : 'ghost'
                                                                }
                                                                className={`w-full justify-start text-sm ${
                                                                    activeSection === subsection.id
                                                                        ? 'bg-primary/10 text-primary'
                                                                        : ''
                                                                }`}
                                                                onClick={() => handleSectionClick(subsection.id)}
                                                            >
                                                                <span className="flex-1 text-left">{subsection.title}</span>
                                                                {subsection.badge && (
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {subsection.badge}
                                                                    </Badge>
                                                                )}
                                                            </Button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </nav>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>

                    {/* Contenido principal */}
                    <div className="flex-1 min-w-0">
                        <div className="border rounded-xl bg-card backdrop-blur-sm shadow-lg">
                            <ScrollArea className="h-[calc(100vh-10rem)]">
                                <div className="p-6 md:p-8 max-w-4xl mx-auto">
                                    <div className="mb-8">
                                        <h1 className="text-3xl md:text-4xl font-bold mb-2">{currentContent.title}</h1>
                                        <p className="text-sm text-muted-foreground">
                                            Última actualización: 1 de abril, 2026
                                        </p>
                                    </div>

                                    <div className="prose prose-slate dark:prose-invert max-w-none">
                                        {currentContent.content}
                                    </div>

                                    <Separator className="my-8" />

                                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                                        <p>¿Esta página te fue útil?</p>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm" className="hover:bg-accent">
                                                👍 Sí
                                            </Button>
                                            <Button variant="outline" size="sm" className="hover:bg-accent">
                                                👎 No
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </DocumentationLayout>
    );
}
