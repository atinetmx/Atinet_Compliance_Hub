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
    Package,
    Filter,
    Layers,
    Database,
    DollarSign,
    Activity,
    TrendingUp,
    FileDown,
    Mail,
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
    children?: Array<{
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
        id: 'servicios',
        title: 'Gestión de Servicios',
        icon: Package,
        subsections: [
            { id: 'servicios-catalogo', title: 'Catálogo de Servicios' },
            { id: 'servicios-crear', title: 'Crear Servicio' },
            { id: 'servicios-editar', title: 'Editar Servicio' },
            { id: 'servicios-detalles', title: 'Ver Detalles' },
        ],
    },
    {
        id: 'planes',
        title: 'Gestión de Planes',
        icon: Layers,
        subsections: [
            { id: 'planes-catalogo', title: 'Catálogo de Planes' },
            { id: 'planes-crear', title: 'Crear Plan' },
            { id: 'planes-editar', title: 'Editar Plan' },
            { id: 'planes-detalles', title: 'Ver Detalles' },
            { id: 'planes-servicios', title: 'Configurar Servicios' },
        ],
    },
    {
        id: 'notarias',
        title: 'Gestión de Notarías',
        icon: Building2,
        subsections: [
            { id: 'notarias-catalogo', title: 'Catálogo de Notarías' },
            { id: 'notarias-crear', title: 'Crear Notaría' },
            { id: 'notarias-editar', title: 'Editar Notaría' },
            { id: 'notarias-detalles', title: 'Ver Detalles' },
            { id: 'notarias-servicios', title: 'Configurar Servicios' },
            { id: 'notarias-eliminar', title: 'Eliminar / Inhabilitar' },
        ],
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
        children: [
            { id: 'reportes-general', title: 'Dashboard Principal' },
            { id: 'reportes-uso-servicio', title: 'Uso por Servicio' },
            { id: 'reportes-top-servicios', title: 'Top Servicios' },
            { id: 'reportes-comparativa', title: 'Comparativa de Notarías' },
            { id: 'reportes-tendencias', title: 'Tendencias de Uso' },
            { id: 'reportes-alertas', title: 'Notarías Cerca del Límite' },
            { id: 'reportes-exportacion', title: 'Exportar Reportes' },
        ],
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
    servicios: {
        title: 'Gestión de Servicios',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Gestión de Servicios</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Gestión de Servicios permite administrar el catálogo completo de servicios disponibles
                        para las notarías, incluyendo configuración de precios, categorías, modelos de facturación y control
                        de disponibilidad. Cada servicio puede ser personalizado según las necesidades de cada plan de suscripción.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Características Principales</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Catálogo Completo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Administra todos los servicios del sistema:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Búsqueda y filtrado avanzado</li>
                                    <li>Organización por categorías</li>
                                    <li>Activación/desactivación rápida</li>
                                    <li>Estadísticas de uso en tiempo real</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-primary" />
                                    Modelos de Facturación
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Configura cómo se cobra cada servicio:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Incluido: Sin costo adicional</li>
                                    <li>Limitado: Con límite mensual</li>
                                    <li>Por Uso: Cobro por consulta</li>
                                    <li>Ilimitado: Sin restricciones</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-primary" />
                                    Categorías de Servicios
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Organiza servicios por tipo:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Consulta: Búsquedas OFAC/SAT</li>
                                    <li>API: Integraciones externas</li>
                                    <li>Sistema: Funciones internas</li>
                                    <li>Análisis, Storage, Integration</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    Monitoreo y Estadísticas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Visualiza el rendimiento de cada servicio:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Uso mensual por servicio</li>
                                    <li>Ingresos generados</li>
                                    <li>Notarías activas usando el servicio</li>
                                    <li>Planes asociados</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Flujo de Trabajo</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pasos para Gestionar Servicios</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                                <li>
                                    <strong>Crear Servicio:</strong> Define nombre, categoría y modelo de facturación
                                </li>
                                <li>
                                    <strong>Configurar Precios:</strong> Establece precio unitario si es "Por Uso"
                                </li>
                                <li>
                                    <strong>Asociar a Planes:</strong> Incluye el servicio en planes de suscripción
                                </li>
                                <li>
                                    <strong>Activar:</strong> Habilita el servicio para que las notarías puedan usarlo
                                </li>
                                <li>
                                    <strong>Monitorear:</strong> Revisa estadísticas de uso y rentabilidad
                                </li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Código de Servicio</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Generación Automática</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Cada servicio tiene un código único que se genera automáticamente al escribir el nombre:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>Conversión a MAYÚSCULAS automática</li>
                                <li>Eliminación de acentos y caracteres especiales</li>
                                <li>Espacios reemplazados por guiones bajos (_)</li>
                                <li>No se puede modificar una vez creado el servicio</li>
                            </ul>
                            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                                <p className="text-xs font-semibold mb-2">Ejemplos:</p>
                                <ul className="text-xs space-y-1">
                                    <li>• "Lista Negra SAT" → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">LISTA_NEGRA_SAT</code></li>
                                    <li>• "Búsqueda OFAC" → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">BUSQUEDA_OFAC</code></li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Importante
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ Los servicios activos están disponibles para todas las notarías con planes que los incluyan</li>
                        <li>✅ Puedes modificar precios, pero solo afectarán consultas futuras</li>
                        <li>✅ El código de servicio es permanente y no puede modificarse después de la creación</li>
                        <li>⚠️ Desactivar un servicio lo hace no disponible inmediatamente para nuevas consultas</li>
                        <li>⚠️ Eliminar un servicio es permanente y no se puede deshacer</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'servicios-catalogo': {
        title: 'Catálogo de Servicios',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Catálogo de Servicios</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Gestión de Servicios permite administrar el catálogo completo de servicios disponibles
                        para las notarías, incluyendo configuración de precios, categorías, modelos de facturación y control
                        de disponibilidad.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Gestión Centralizada
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Administra todos los servicios del sistema desde un solo lugar, con control de categorías,
                                precios y modelos de facturación para cada servicio.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Vista Principal de Servicios</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        La vista principal muestra la lista completa de servicios con información clave y opciones
                        de filtrado avanzado.
                    </p>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                Búsqueda y Filtros
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Filtra los servicios para encontrar rápidamente lo que necesitas:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Búsqueda:</strong> Por nombre o código de servicio
                                    <br />
                                    <span className="text-xs italic text-blue-600">
                                        💡 Escribe en el campo de búsqueda y presiona Enter o haz clic en el botón de búsqueda
                                    </span>
                                </li>
                                <li><strong>Categoría:</strong> Consulta, API, Sistema, Análisis, Storage, Integration</li>
                                <li><strong>Modelo de Facturación:</strong> Incluido, Limitado, Por Uso, Ilimitado</li>
                                <li>
                                    <strong>Estado:</strong> Servicios activos o inactivos
                                    <br />
                                    <span className="text-xs italic">Filtra por disponibilidad del servicio</span>
                                </li>
                            </ul>
                            <p className="text-xs text-muted-foreground mt-3 italic">
                                Los filtros se aplican automáticamente al seleccionarlos. La búsqueda requiere presionar Enter o hacer clic en el botón.
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Categorías de Servicios</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-blue-600 dark:text-blue-400">Consulta</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios de consulta en bases de datos externas como OFAC, SAT 69-B y otros
                                    sistemas de verificación.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-green-600 dark:text-green-400">API</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios de integración mediante API con sistemas externos y proveedores
                                    de datos.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-purple-600 dark:text-purple-400">Sistema</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios internos del sistema como gestión de usuarios, notificaciones
                                    y configuración.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-orange-600 dark:text-orange-400">Análisis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios de análisis de datos, reportes y estadísticas de uso.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-yellow-600 dark:text-yellow-400">Storage</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios de almacenamiento de documentos, imágenes y archivos.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-pink-600 dark:text-pink-400">Integration</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios de integración con software de terceros y sistemas legacy.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Modelos de Facturación</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>📦 Incluido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios que están incluidos en el plan base sin costo adicional.
                                    La notaría puede usar estos servicios libremente.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>⚖️ Limitado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios con un límite mensual de uso incluido en el plan. Al superar
                                    el límite, puede aplicar cargo adicional según configuración.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>💰 Por Uso</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios que se cobran por cada uso individual. Cada consulta o transacción
                                    genera un cargo según el precio unitario configurado.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>♾️ Ilimitado</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Servicios sin límite de uso incluidos en el plan. La notaría puede usar
                                    estos servicios sin restricciones ni cargos adicionales.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información Mostrada</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Tabla de Servicios</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                La tabla principal muestra para cada servicio:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Código:</strong> Identificador único del servicio</li>
                                <li><strong>Nombre:</strong> Nombre descriptivo del servicio</li>
                                <li><strong>Categoría:</strong> Badge de color según la categoría</li>
                                <li><strong>Modelo de Facturación:</strong> Badge según el tipo de cobro</li>
                                <li><strong>Precio Unitario:</strong> Costo por uso (si aplica)</li>
                                <li><strong>Estado:</strong> Activo/Inactivo</li>
                                <li><strong>Acciones:</strong> Ver detalles, editar, activar/desactivar, eliminar</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Acciones Disponibles</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Operaciones en Servicios</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>👁️ <strong>Ver Detalles:</strong> Consulta información completa del servicio</li>
                                <li>✏️ <strong>Editar:</strong> Modifica nombre, descripción, precios y configuración</li>
                                <li>🔄 <strong>Activar/Desactivar:</strong> Controla la disponibilidad del servicio</li>
                                <li>🗑️ <strong>Eliminar:</strong> Elimina servicios que ya no se utilizan</li>
                                <li>➕ <strong>Nuevo Servicio:</strong> Agrega nuevos servicios al catálogo</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Consideraciones Importantes
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>⚠️ Los servicios activos están disponibles para todas las notarías con planes que los incluyan</li>
                        <li>⚠️ Desactivar un servicio lo hace no disponible para nuevas consultas</li>
                        <li>⚠️ Los cambios de precio solo afectan nuevas consultas, no retroactivamente</li>
                        <li>⚠️ El código del servicio no puede modificarse una vez creado (es el identificador único)</li>
                        <li>⚠️ Eliminar un servicio es permanente y no se puede deshacer</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'servicios-crear': {
        title: 'Crear Servicio',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Crear Nuevo Servicio</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Para agregar un nuevo servicio al catálogo, haz clic en el botón <strong>"Nuevo Servicio"</strong>
                        en la vista principal. Se abrirá un formulario con todas las configuraciones necesarias.
                    </p>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>📝 Información Básica</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Campos obligatorios para identificar el servicio:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Nombre del Servicio *:</strong> Nombre descriptivo y comprensible del servicio
                                    <br />
                                    <span className="text-xs italic">Ejemplo: Lista Negra SAT, Búsqueda OFAC, Validación de CURP</span>
                                </li>
                                <li>
                                    <strong>Código del Servicio:</strong> Se genera <strong>automáticamente</strong> a partir del nombre
                                    <br />
                                    <span className="text-xs italic">
                                        El sistema convierte el nombre a MAYÚSCULAS, elimina acentos y caracteres especiales,
                                        y reemplaza espacios con guiones bajos (_)
                                    </span>
                                    <br />
                                    <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                                        <p className="text-xs font-semibold mb-1">Ejemplos de conversión automática:</p>
                                        <ul className="text-xs space-y-1">
                                            <li>• "Lista Negra SAT" → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">LISTA_NEGRA_SAT</code></li>
                                            <li>• "Búsqueda OFAC" → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">BUSQUEDA_OFAC</code></li>
                                            <li>• "Validación de CURP" → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">VALIDACION_DE_CURP</code></li>
                                            <li>• "API Verificación 123" → <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">API_VERIFICACION_123</code></li>
                                        </ul>
                                    </div>
                                </li>
                                <li>
                                    <strong>Descripción *:</strong> Explicación detallada de qué hace el servicio y para qué sirve
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>⚙️ Configuración</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Parámetros de clasificación y facturación:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Categoría *:</strong> Tipo de servicio (Consulta, API, Sistema, Análisis, Storage, Integration)
                                    <br />
                                    <span className="text-xs italic">
                                        💡 Al seleccionar una categoría, aparecerá una descripción explicando qué tipo de servicios corresponden a esa categoría
                                    </span>
                                </li>
                                <li>
                                    <strong>Modelo de Facturación *:</strong> Cómo se cobra el servicio
                                    <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                                        <li><em>Incluido:</em> Sin costo adicional</li>
                                        <li><em>Limitado:</em> Con límite mensual</li>
                                        <li><em>Por Uso:</em> Se cobra cada consulta (requiere precio unitario)</li>
                                        <li><em>Ilimitado:</em> Uso sin restricciones</li>
                                    </ul>
                                    <span className="text-xs italic">
                                        💡 Al seleccionar un modelo, aparecerá una descripción detallada de cómo funciona ese tipo de facturación
                                    </span>
                                </li>
                                <li>
                                    <strong>Precio Unitario:</strong> Solo si el modelo es "Por Uso". Define el costo de cada consulta.
                                    <br />
                                    <span className="text-xs italic">Ejemplo: $5.00 por búsqueda OFAC</span>
                                    <br />
                                    <span className="text-xs italic">
                                        Este campo aparece automáticamente al seleccionar "Por Uso" y se oculta con otros modelos
                                    </span>
                                </li>
                                <li>
                                    <strong>Servicio Activo:</strong> Switch para activar/desactivar el servicio inmediatamente
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Proceso de Creación
                    </h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Escribe el <strong>nombre del servicio</strong> (el código se genera automáticamente)</li>
                        <li>Completa la descripción detallada</li>
                        <li>Selecciona la categoría (verás una descripción de ayuda)</li>
                        <li>Elige el modelo de facturación (verás una descripción de ayuda)</li>
                        <li>Si es "Por Uso", especifica el precio unitario</li>
                        <li>Decide si el servicio estará activo inmediatamente</li>
                        <li>Haz clic en <strong>"Crear Servicio"</strong> para guardar</li>
                    </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Importante: Código de Servicio
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Se genera automáticamente:</strong> No necesitas preocuparte por el formato del código</li>
                        <li>✅ <strong>Actualización en tiempo real:</strong> Mientras escribes el nombre, verás el código generándose</li>
                        <li>✅ <strong>Formato consistente:</strong> Todos los servicios seguirán el mismo estándar de nomenclatura</li>
                        <li>⚠️ <strong>No se puede modificar después:</strong> Una vez creado el servicio, el código no puede editarse</li>
                        <li>⚠️ <strong>Es el identificador único:</strong> El código se usa internamente en el sistema y en las rutas</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'servicios-editar': {
        title: 'Editar Servicio',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Editar Servicio</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Puedes modificar la información de un servicio existente haciendo clic en el botón de editar (✏️)
                        en la vista principal o desde la vista de detalles del servicio.
                    </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">
                                Código No Editable
                            </p>
                            <p className="text-sm text-muted-foreground">
                                El código del servicio no puede modificarse. Es el identificador único usado en todo el sistema.
                                Si necesitas un código diferente, debes crear un nuevo servicio.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Campos Editables</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>✏️ Información Modificable</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Puedes editar los siguientes campos:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>Nombre del Servicio:</strong> Puedes cambiar el nombre descriptivo
                                        <br />
                                        <span className="text-xs italic text-amber-600">
                                            ⚠️ Nota: Cambiar el nombre NO actualiza el código. El código permanece inmutable.
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Descripción:</strong> Actualiza o mejora la explicación del servicio
                                    </li>
                                    <li>
                                        <strong>Categoría:</strong> Cambia la categoría si fue mal clasificado
                                        <br />
                                        <span className="text-xs italic">
                                            💡 Al seleccionar una categoría, aparecerá una descripción de ayuda
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Modelo de Facturación:</strong> Modifica cómo se cobra el servicio
                                        <br />
                                        <span className="text-xs italic">
                                            💡 Al seleccionar un modelo, aparecerá una descripción detallada
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Precio Unitario:</strong> Actualiza el precio si el modelo es "Por Uso"
                                        <br />
                                        <span className="text-xs italic text-blue-600">
                                            ℹ️ Los cambios de precio solo afectan consultas nuevas, no las anteriores
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Estado (Activo/Inactivo):</strong> Controla la disponibilidad del servicio
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🔒 Campos Bloqueados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Estos campos NO se pueden modificar:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>Código del Servicio:</strong> Aparece deshabilitado y con fondo gris
                                        <br />
                                        <span className="text-xs italic">
                                            Es el identificador único usado en rutas, planes y consultas. No puede cambiar.
                                        </span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Proceso de Edición
                    </h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Ve a la vista principal de servicios o a los detalles del servicio</li>
                        <li>Haz clic en el botón de editar (✏️)</li>
                        <li>Modifica los campos que necesites actualizar</li>
                        <li>Observa el código bloqueado (no editable) con fondo gris</li>
                        <li>Si cambias categoría o modelo de facturación, lee las descripciones de ayuda</li>
                        <li>Verifica que el precio unitario sea correcto si usas modelo "Por Uso"</li>
                        <li>Haz clic en <strong>"Guardar Cambios"</strong> para aplicar las modificaciones</li>
                    </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Impacto de los Cambios
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Cambios de nombre:</strong> Se reflejan inmediatamente pero el código sigue igual</li>
                        <li>✅ <strong>Cambios de precio:</strong> Solo afectan consultas futuras, no las pasadas</li>
                        <li>✅ <strong>Cambios de categoría:</strong> Cambian la organización pero no afectan funcionalidad</li>
                        <li>✅ <strong>Cambios de modelo:</strong> Pueden requerir ajuste de precio unitario</li>
                        <li>⚠️ <strong>Desactivar servicio:</strong> Lo hace no disponible para nuevas consultas inmediatamente</li>
                        <li>⚠️ <strong>Activar servicio:</strong> Lo hace disponible para notarías con planes que lo incluyan</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'servicios-detalles': {
        title: 'Ver Detalles',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Detalles del Servicio</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        La vista de detalles muestra información completa sobre un servicio específico, incluyendo
                        su configuración, estadísticas de uso y planes asociados.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información Mostrada</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>📊 Información General</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Datos principales del servicio:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Código:</strong> Identificador único del servicio</li>
                                    <li><strong>Nombre:</strong> Nombre descriptivo completo</li>
                                    <li><strong>Descripción:</strong> Explicación detallada de funcionalidad</li>
                                    <li><strong>Categoría:</strong> Badge de color con el tipo de servicio</li>
                                    <li><strong>Modelo de Facturación:</strong> Cómo se cobra el servicio</li>
                                    <li><strong>Precio Unitario:</strong> Costo por uso (si aplica)</li>
                                    <li><strong>Estado:</strong> Badge indicando si está activo o inactivo</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>📈 Estadísticas de Uso</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Métricas del servicio:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Planes Asociados:</strong> Número de planes que incluyen este servicio</li>
                                    <li><strong>Notarías Activas:</strong> Cantidad de notarías que usan actualmente el servicio</li>
                                    <li><strong>Uso Mensual:</strong> Total de consultas o transacciones del mes actual</li>
                                    <li><strong>Ingresos Mensuales:</strong> Facturación generada por el servicio (si aplica)</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>📦 Planes Asociados</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Tabla detallada de planes que incluyen este servicio con su configuración específica:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Nombre del Plan:</strong> Identificación del plan de suscripción</li>
                                    <li>
                                        <strong>Incluido:</strong> Badge indicando si está incluido en el plan base
                                        <br />
                                        <span className="text-xs italic">Verde = Incluido | Gris = No incluido</span>
                                    </li>
                                    <li>
                                        <strong>Límite de Uso:</strong> Cantidad mensual permitida
                                        <br />
                                        <span className="text-xs italic">Número específico o "Sin límite" si es ilimitado</span>
                                    </li>
                                    <li>
                                        <strong>Precio Extra:</strong> Costo adicional por unidad al exceder el límite
                                        <br />
                                        <span className="text-xs italic">Solo aplica si hay límite configurado y se sobrepasa</span>
                                    </li>
                                </ul>
                                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-md">
                                    <p className="text-xs font-semibold mb-2">Ejemplos de configuración:</p>
                                    <ul className="text-xs space-y-1">
                                        <li>• Plan Básico: Incluido | Límite: 100 | Precio extra: $2.00</li>
                                        <li>• Plan Premium: Incluido | Límite: Sin límite | Precio extra: N/A</li>
                                        <li>• Plan Free: No incluido | Límite: 0 | Precio extra: $5.00</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Operaciones Disponibles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Desde la vista de detalles puedes:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>🔙 <strong>Volver:</strong> Regresa a la lista principal de servicios</li>
                                <li>✏️ <strong>Editar:</strong> Modifica la configuración del servicio</li>
                                <li>🔄 <strong>Activar/Desactivar:</strong> Cambia el estado del servicio</li>
                                <li>🗑️ <strong>Eliminar:</strong> Elimina el servicio (con confirmación)</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Datos en Tiempo Real
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Las estadísticas se calculan dinámicamente:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Uso Mensual:</strong> Cuenta las consultas del mes calendario actual</li>
                        <li>✅ <strong>Ingresos Mensuales:</strong> Calcula según precio unitario y consultas del mes</li>
                        <li>✅ <strong>Notarías Activas:</strong> Cuenta notarías con suscripción activa que incluye el servicio</li>
                        <li>✅ <strong>Planes Asociados:</strong> Lista todos los planes que configuran este servicio</li>
                    </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Análisis de Rendimiento
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Usa esta vista para:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>📊 Monitorear la popularidad del servicio</li>
                        <li>💰 Evaluar la rentabilidad de servicios "Por Uso"</li>
                        <li>📈 Identificar servicios infrautilizados o muy demandados</li>
                        <li>⚖️ Decidir ajustes de precio o modelo de facturación</li>
                        <li>🎯 Planear estrategias comerciales basadas en uso real</li>
                    </ul>
                </div>
            </div>
        ),
    },
    planes: {
        title: 'Gestión de Planes',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Gestión de Planes</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Gestión de Planes permite crear y administrar diferentes planes de suscripción
                        con configuraciones personalizadas de servicios, límites de uso y precios. Cada plan define
                        qué servicios están disponibles para las notarías y bajo qué condiciones.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Características Principales</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Layers className="h-5 w-5 text-primary" />
                                    Planes Flexibles
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Crea planes adaptados a diferentes necesidades:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Planes básicos, estándar y premium</li>
                                    <li>Configuración de precios mensuales</li>
                                    <li>Límites de usuarios por notaría</li>
                                    <li>Activación/desactivación rápida</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="h-5 w-5 text-primary" />
                                    Configuración de Servicios
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Define qué servicios incluye cada plan:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Selección de servicios incluidos</li>
                                    <li>Límites de uso mensuales</li>
                                    <li>Precios extra al exceder límites</li>
                                    <li>Prioridad de servicios</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-primary" />
                                    Control de Costos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Administra los aspectos financieros:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Precio base mensual del plan</li>
                                    <li>Costos adicionales por servicio</li>
                                    <li>Configuración de límites gratuitos</li>
                                    <li>Facturación automática</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-primary" />
                                    Estadísticas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Monitorea el uso de cada plan:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Suscripciones activas por plan</li>
                                    <li>Ingresos generados</li>
                                    <li>Servicios más utilizados</li>
                                    <li>Notarías suscritas</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Flujo de Trabajo</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Pasos para Crear un Plan</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                                <li>
                                    <strong>Crear Plan Base:</strong> Define nombre, descripción y precio mensual
                                </li>
                                <li>
                                    <strong>Configurar Servicios:</strong> Selecciona qué servicios incluir en el plan
                                </li>
                                <li>
                                    <strong>Establecer Límites:</strong> Define límites de uso para cada servicio
                                </li>
                                <li>
                                    <strong>Definir Precios Extra:</strong> Configura costos adicionales al exceder límites
                                </li>
                                <li>
                                    <strong>Activar Plan:</strong> Habilita el plan para que las notarías puedan suscribirse
                                </li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Tipos de Configuración de Servicios</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>✅ Servicio Incluido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    El servicio está incluido en el plan base. Puedes configurar límites de uso
                                    y precios extra si el servicio se usa en exceso.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>❌ Servicio No Incluido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    El servicio no está disponible para notarías con este plan. Las notarías
                                    necesitarían actualizar a un plan superior para acceder.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🔢 Límite de Uso</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Define cuántas veces al mes se puede usar el servicio sin cargo adicional.
                                    Por ejemplo: 100 búsquedas OFAC incluidas, $5 por cada adicional.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>♾️ Sin Límite</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    El servicio se puede usar ilimitadamente sin cargos adicionales.
                                    Deja el campo de límite vacío para configurar uso ilimitado.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Importante
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ Los cambios en planes afectan solo nuevas suscripciones, no las existentes</li>
                        <li>✅ Puedes tener múltiples planes activos simultáneamente</li>
                        <li>✅ Las notarías pueden actualizar o degradar su plan en cualquier momento</li>
                        <li>⚠️ Desactivar un plan impide nuevas suscripciones pero mantiene las existentes</li>
                        <li>⚠️ Los límites de uso se renuevan cada mes calendario</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'planes-catalogo': {
        title: 'Catálogo de Planes',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Catálogo de Planes</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Gestión de Planes permite administrar los diferentes planes de suscripción disponibles
                        para las notarías, incluyendo configuración de precios, límites, servicios incluidos y características.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                        <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Gestión Flexible de Planes
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Crea planes personalizados con diferentes niveles de acceso, servicios y precios según
                                las necesidades de cada notaría.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Vista Principal de Planes</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        La vista principal muestra todos los planes disponibles con opciones de filtrado y organización.
                    </p>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                Filtros Disponibles
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Filtra los planes para encontrar rápidamente lo que necesitas:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Búsqueda:</strong> Por nombre o descripción del plan</li>
                                <li><strong>Estado:</strong> Planes activos o inactivos</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información Mostrada</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Tabla de Planes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                La tabla principal muestra para cada plan:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Nombre:</strong> Nombre descriptivo del plan</li>
                                <li><strong>Descripción:</strong> Breve descripción de características</li>
                                <li><strong>Precio Mensual:</strong> Costo mensual del plan</li>
                                <li><strong>Precio Anual:</strong> Costo anual del plan</li>
                                <li><strong>Servicios:</strong> Cantidad de servicios incluidos</li>
                                <li><strong>Notarías:</strong> Cantidad de notarías con este plan</li>
                                <li><strong>Suscripciones:</strong> Total de suscripciones activas</li>
                                <li><strong>Estado:</strong> Activo/Inactivo</li>
                                <li><strong>Acciones:</strong> Ver detalles, editar, configurar servicios, activar/desactivar, eliminar</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Orden de Visualización</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Organización de Planes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Los planes se muestran ordenados por:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Orden:</strong> Número de orden personalizado (números menores aparecen primero)</li>
                                <li><strong>Nombre:</strong> Alfabéticamente como segundo criterio</li>
                            </ul>
                            <p className="text-xs text-muted-foreground mt-3">
                                💡 Cambia el orden en la vista de edición para controlar cómo se muestran en el sitio público
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Acciones Disponibles</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Operaciones en Planes</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>👁️ <strong>Ver Detalles:</strong> Consulta información completa y estadísticas del plan</li>
                                <li>✏️ <strong>Editar:</strong> Modifica nombre, precios, límites y configuración</li>
                                <li>⚙️ <strong>Configurar Servicios:</strong> Gestiona servicios incluidos y sus límites</li>
                                <li>🔄 <strong>Activar/Desactivar:</strong> Controla la disponibilidad del plan</li>
                                <li>🗑️ <strong>Eliminar:</strong> Elimina planes que ya no se utilizan</li>
                                <li>➕ <strong>Nuevo Plan:</strong> Agrega nuevos planes al catálogo</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Consideraciones Importantes
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>⚠️ Los planes activos están disponibles para nuevas suscripciones</li>
                        <li>⚠️ Desactivar un plan no afecta suscripciones existentes</li>
                        <li>⚠️ Los cambios de precio solo afectan nuevas suscripciones</li>
                        <li>⚠️ No puedes eliminar planes con suscripciones activas</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'planes-crear': {
        title: 'Crear Plan',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Crear Nuevo Plan</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Para agregar un nuevo plan al catálogo, haz clic en el botón <strong>"Nuevo Plan"</strong>
                        en la vista principal. Se abrirá un formulario con todas las configuraciones necesarias.
                    </p>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>📝 Información Básica</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Campos obligatorios para identificar el plan:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Nombre del Plan *:</strong> Nombre descriptivo y atractivo
                                    <br />
                                    <span className="text-xs italic">Ejemplo: Plan Básico, Plan Profesional, Plan Enterprise</span>
                                </li>
                                <li>
                                    <strong>Slug *:</strong> Identificador único para URLs (se genera automáticamente del nombre)
                                    <br />
                                    <span className="text-xs italic">Ejemplo: "Plan Básico" → "plan-basico"</span>
                                </li>
                                <li>
                                    <strong>Descripción:</strong> Explicación breve de qué incluye el plan
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>💰 Precios y Límites</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Configuración de precios y restricciones:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Precio Mensual *:</strong> Costo mensual del plan
                                    <br />
                                    <span className="text-xs italic">Acepta decimales. Ejemplo: 299.99</span>
                                </li>
                                <li>
                                    <strong>Precio Anual *:</strong> Costo anual del plan (generalmente con descuento)
                                    <br />
                                    <span className="text-xs italic">Ejemplo: Si mensual es $300, anual podría ser $3000 (2 meses gratis)</span>
                                </li>
                                <li>
                                    <strong>Límite de Usuarios:</strong> Cantidad máxima de usuarios permitidos
                                    <br />
                                    <span className="text-xs italic">Dejar vacío para ilimitado</span>
                                </li>
                                <li>
                                    <strong>Límite de Búsquedas/Mes:</strong> Límite mensual solo para servicios de consultas
                                    <br />
                                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                        (Solo para categoría: Consultas/Búsquedas)
                                    </span>
                                    <br />
                                    <span className="text-xs italic">
                                        💡 Este límite aplica únicamente para servicios de búsqueda y verificación en bases de datos externas (OFAC, SAT, etc.)
                                    </span>
                                    <br />
                                    <span className="text-xs italic">Dejar vacío para ilimitado</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>⚙️ Configuración</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Servicios y características del plan:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Herramientas/Servicios Incluidos:</strong> Servicios que tendrá el plan (Opcional)
                                    <br />
                                    <span className="text-xs italic">
                                        Haz clic en "Agregar Servicio" para seleccionar de la lista disponible
                                    </span>
                                    <br />
                                    <span className="text-xs italic">
                                        Los servicios se muestran con su categoría y modelo de facturación
                                    </span>
                                    <br />
                                    <span className="text-xs italic">
                                        💡 Los servicios también se pueden gestionar desde "Configurar Servicios" después de crear el plan
                                    </span>
                                </li>
                                <li>
                                    <strong>Características del Plan:</strong> Lista de beneficios que se mostrarán
                                    <br />
                                    <span className="text-xs italic">
                                        Haz clic en "Agregar Característica" para añadir puntos clave
                                    </span>
                                    <br />
                                    <span className="text-xs italic">
                                        Ejemplo: "Soporte técnico 24/7", "Reportes personalizados", "API de integración"
                                    </span>
                                    <br />
                                    <span className="text-xs italic">
                                        Se muestran como lista de viñetas en las tarjetas de planes
                                    </span>
                                </li>
                                <li>
                                    <strong>Plan Activo:</strong> Controla si el plan está disponible para nuevas suscripciones
                                </li>
                                <li>
                                    <strong>Orden de Visualización:</strong> Número para controlar el orden en que aparece
                                    <br />
                                    <span className="text-xs italic">
                                        Números menores aparecen primero. El sistema sugiere el siguiente disponible
                                    </span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Proceso de Creación
                    </h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Escribe el <strong>nombre del plan</strong> (el slug se genera automáticamente)</li>
                        <li>Completa la descripción del plan</li>
                        <li>Establece los <strong>precios mensual y anual</strong></li>
                        <li>Define límites de usuarios (opcional - vacío = ilimitado)</li>
                        <li>Define límite de búsquedas <strong>solo si incluye servicios de consultas</strong> (opcional)</li>
                        <li>Selecciona servicios incluidos (opcional - puedes configurar después)</li>
                        <li>Agrega características destacadas del plan</li>
                        <li>Decide si el plan estará activo inmediatamente</li>
                        <li>Ajusta el orden si es necesario (opcional)</li>
                        <li>Haz clic en <strong>"Guardar Plan"</strong></li>
                    </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Importante: Servicios del Plan
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Configuración básica al crear:</strong> Servicios se agregan con valores por defecto</li>
                        <li>✅ <strong>Configuración avanzada después:</strong> Usa "Configurar Servicios" para límites específicos</li>
                        <li>💡 <strong>Flexibilidad:</strong> Puedes crear el plan primero y configurar servicios después</li>
                        <li>⚙️ <strong>Personalización:</strong> Cada servicio puede tener límites y precios específicos por plan</li>
                    </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Campo "Límite de Búsquedas/Mes"
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>⚠️ <strong>No es obligatorio:</strong> Solo úsalo si el plan incluye servicios de consultas/búsquedas</li>
                        <li>⚠️ <strong>Categoría específica:</strong> Aplica únicamente a servicios de tipo "Consulta"</li>
                        <li>📋 <strong>Ejemplos:</strong> Listas OFAC, Listas SAT 69-B, Listas PEP, verificaciones en bases de datos</li>
                        <li>♾️ <strong>Dejar vacío:</strong> Significa búsquedas ilimitadas para esos servicios</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'planes-editar': {
        title: 'Editar Plan',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Editar Plan</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Puedes modificar la información de un plan existente haciendo clic en el botón de editar (✏️)
                        en la vista principal o desde la vista de detalles del plan.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Cambios No Afectan Suscripciones Activas
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Las modificaciones de precios y límites solo aplican a las nuevas suscripciones.
                                Las suscripciones existentes mantienen sus condiciones originales.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Campos Editables</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>✏️ Información Modificable</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Puedes editar todos los campos del plan:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>Nombre del Plan:</strong> Cambia el nombre descriptivo
                                    </li>
                                    <li>
                                        <strong>Slug:</strong> Modifica el identificador de URL
                                        <br />
                                        <span className="text-xs italic text-amber-600">
                                            ⚠️ Cambiar el slug puede romper enlaces existentes
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Descripción:</strong> Actualiza o mejora la descripción
                                    </li>
                                    <li>
                                        <strong>Precios:</strong> Ajusta precio mensual y anual
                                        <br />
                                        <span className="text-xs italic text-blue-600">
                                            ℹ️ Los cambios solo afectan nuevas suscripciones
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Límites:</strong> Modifica límites de usuarios y búsquedas
                                    </li>
                                    <li>
                                        <strong>Estado (Activo/Inactivo):</strong> Controla disponibilidad para nuevas suscripciones
                                    </li>
                                    <li>
                                        <strong>Orden:</strong> Cambia la posición en que aparece
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Proceso de Edición
                    </h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Ve a la vista principal de planes o a los detalles del plan</li>
                        <li>Haz clic en el botón de editar (✏️)</li>
                        <li>Modifica los campos que necesites actualizar</li>
                        <li>Revisa que los precios sean correctos</li>
                        <li>Ajusta los límites según las necesidades</li>
                        <li>Haz clic en <strong>"Guardar Cambios"</strong></li>
                    </ol>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Nota Sobre Servicios
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Los servicios del plan NO se editan en esta vista:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>⚙️ Usa el botón <strong>"Configurar Servicios"</strong> para gestionar servicios incluidos</li>
                        <li>✅ Desde allí puedes agregar/quitar servicios y configurar límites específicos</li>
                        <li>💡 Esta separación permite configuraciones más detalladas por servicio</li>
                    </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Impacto de los Cambios
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Cambios de nombre:</strong> Se reflejan inmediatamente en todo el sistema</li>
                        <li>✅ <strong>Cambios de precio:</strong> Solo afectan suscripciones futuras</li>
                        <li>✅ <strong>Cambios de límites:</strong> Solo afectan nuevas suscripciones</li>
                        <li>⚠️ <strong>Desactivar plan:</strong> No permite nuevas suscripciones pero mantiene las activas</li>
                        <li>⚠️ <strong>Cambio de slug:</strong> Puede afectar enlaces directos al plan</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'planes-detalles': {
        title: 'Ver Detalles',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Detalles del Plan</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        La vista de detalles muestra información completa sobre un plan específico, incluyendo
                        su configuración, estadísticas de uso, servicios incluidos y métricas financieras.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información Mostrada</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>📊 Información General</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Datos principales del plan:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Nombre:</strong> Nombre descriptivo del plan</li>
                                    <li><strong>Slug:</strong> Identificador único en URLs</li>
                                    <li><strong>Descripción:</strong> Explicación detallada del plan</li>
                                    <li><strong>Precio Mensual:</strong> Costo por suscripción mensual</li>
                                    <li><strong>Precio Anual:</strong> Costo por suscripción anual</li>
                                    <li><strong>Límite de Usuarios:</strong> Máximo de usuarios permitidos</li>
                                    <li><strong>Límite de Búsquedas/Mes:</strong> Límite mensual para servicios de consultas</li>
                                    <li><strong>Estado:</strong> Badge indicando si está activo o inactivo</li>
                                    <li><strong>Orden:</strong> Posición en la que aparece</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>📈 Estadísticas de Uso</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Métricas del plan en tiempo real:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Total de Notarías:</strong> Número de notarías que tienen este plan</li>
                                    <li><strong>Suscripciones Activas:</strong> Cantidad de suscripciones vigentes</li>
                                    <li><strong>Total de Servicios:</strong> Número de servicios incluidos en el plan</li>
                                    <li><strong>Ingresos Mensuales:</strong> Facturación mensual generada por este plan</li>
                                    <li><strong>Ingresos Anuales:</strong> Facturación anual generada por este plan</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🛠️ Servicios Incluidos</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Lista de servicios configurados en el plan con su información:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Nombre del Servicio:</strong> Servicio incluido</li>
                                    <li><strong>¿Incluido?:</strong> Si está incluido o tiene costo adicional</li>
                                    <li><strong>Límite de Uso:</strong> Cantidad mensual permitida (si aplica)</li>
                                    <li><strong>Precio Extra:</strong> Costo adicional por unidad (si aplica)</li>
                                    <li><strong>Prioridad:</strong> Orden de importancia del servicio</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>✨ Características del Plan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Lista de características destacadas que se muestran en las tarjetas:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Cada característica aparece como un punto de beneficio</li>
                                    <li>Se muestran en el sitio público al seleccionar un plan</li>
                                    <li>Ayudan a los clientes a comparar entre planes</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Operaciones Disponibles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Desde la vista de detalles puedes:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>🔙 <strong>Volver:</strong> Regresa a la lista principal de planes</li>
                                <li>✏️ <strong>Editar:</strong> Modifica la configuración del plan</li>
                                <li>⚙️ <strong>Configurar Servicios:</strong> Gestiona servicios y sus límites</li>
                                <li>🔄 <strong>Activar/Desactivar:</strong> Cambia el estado del plan</li>
                                <li>🗑️ <strong>Eliminar:</strong> Elimina el plan (solo si no tiene suscripciones activas)</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Datos en Tiempo Real
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Las estadísticas se calculan dinámicamente:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Suscripciones Activas:</strong> Solo cuenta suscripciones con status "activa"</li>
                        <li>✅ <strong>Ingresos Mensuales:</strong> Suma de suscripciones activas × precio mensual</li>
                        <li>✅ <strong>Ingresos Anuales:</strong> Suma de suscripciones activas × precio anual</li>
                        <li>✅ <strong>Servicios:</strong> Cantidad total de servicios configurados</li>
                    </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Análisis de Rendimiento
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Usa esta vista para:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>📊 Monitorear la popularidad del plan</li>
                        <li>💰 Evaluar la rentabilidad (ingresos vs servicios incluidos)</li>
                        <li>📈 Identificar planes más demandados</li>
                        <li>⚖️ Decidir ajustes de precio o servicios incluidos</li>
                        <li>🎯 Planear estrategias comerciales basadas en adopción real</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'planes-servicios': {
        title: 'Configurar Servicios',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Configurar Servicios del Plan</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Esta vista especial permite gestionar de forma avanzada los servicios incluidos en un plan,
                        configurando límites específicos, precios adicionales y prioridades para cada servicio.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Configuración Granular por Servicio
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Cada servicio puede tener configuraciones únicas dentro del plan: límites personalizados,
                                precios específicos y niveles de prioridad.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Funcionalidad Principal</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>➕ Agregar Servicios</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Pasos para agregar un servicio al plan:
                                </p>
                                <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>Haz clic en <strong>"Agregar Servicio"</strong></li>
                                    <li>Selecciona el servicio de la lista disponible</li>
                                    <li>Completa la configuración del servicio</li>
                                    <li>Guarda los cambios</li>
                                </ol>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>⚙️ Configuración por Servicio</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Para cada servicio puedes configurar:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>¿Incluido en el Plan?:</strong> Switch para indicar si está incluido o tiene costo extra
                                        <br />
                                        <span className="text-xs italic">Activado = Incluido sin cargo adicional</span>
                                    </li>
                                    <li>
                                        <strong>Límite de Uso Mensual:</strong> Cantidad máxima permitida por mes
                                        <br />
                                        <span className="text-xs italic">Dejar vacío o 0 para ilimitado</span>
                                        <br />
                                        <span className="text-xs italic">Ejemplo: 100 consultas OFAC por mes</span>
                                    </li>
                                    <li>
                                        <strong>Precio Extra por Unidad:</strong> Costo adicional si no está incluido o se supera el límite
                                        <br />
                                        <span className="text-xs italic">Solo aplica si el servicio no está totalmente incluido</span>
                                        <br />
                                        <span className="text-xs italic">Ejemplo: $5.00 por consulta adicional</span>
                                    </li>
                                    <li>
                                        <strong>Prioridad:</strong> Orden de importancia del servicio (0 = más importante)
                                        <br />
                                        <span className="text-xs italic">Afecta el orden en que se muestran al cliente</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>✏️ Editar Servicios Existentes</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Los servicios ya agregados se muestran en una tabla con:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Nombre del Servicio:</strong> Identificación</li>
                                    <li><strong>Categoría:</strong> Badge de color</li>
                                    <li><strong>¿Incluido?:</strong> Badge verde (Sí) o rojo (No)</li>
                                    <li><strong>Límite Mensual:</strong> Cantidad o "Ilimitado"</li>
                                    <li><strong>Precio Extra:</strong> Costo adicional o "-"</li>
                                    <li><strong>Prioridad:</strong> Número de orden</li>
                                    <li><strong>Acciones:</strong> Editar o Eliminar</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🗑️ Eliminar Servicios</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    Haz clic en el botón de eliminar para quitar un servicio del plan.
                                    Se mostrará una confirmación antes de eliminarlo permanentemente.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Ejemplos de Configuración</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>📋 Ejemplo 1: Servicio Totalmente Incluido</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• <strong>Servicio:</strong> Gestión de Usuarios</li>
                                    <li>• <strong>¿Incluido?:</strong> Sí ✅</li>
                                    <li>• <strong>Límite:</strong> (vacío) = Ilimitado</li>
                                    <li>• <strong>Precio Extra:</strong> (vacío) = Sin cargo</li>
                                    <li>• <strong>Prioridad:</strong> 0 (alta prioridad)</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>📋 Ejemplo 2: Servicio con Límite</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• <strong>Servicio:</strong> Consultas OFAC</li>
                                    <li>• <strong>¿Incluido?:</strong> Sí ✅</li>
                                    <li>• <strong>Límite:</strong> 100 consultas/mes</li>
                                    <li>• <strong>Precio Extra:</strong> $5.00 por consulta adicional</li>
                                    <li>• <strong>Prioridad:</strong> 1</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>📋 Ejemplo 3: Servicio No Incluido (Pago por Uso)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="text-sm text-muted-foreground space-y-1">
                                    <li>• <strong>Servicio:</strong> API Premium</li>
                                    <li>• <strong>¿Incluido?:</strong> No ❌</li>
                                    <li>• <strong>Límite:</strong> (vacío) = Disponible a demanda</li>
                                    <li>• <strong>Precio Extra:</strong> $10.00 por uso</li>
                                    <li>• <strong>Prioridad:</strong> 99 (baja prioridad)</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Mejores Prácticas
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ Agrupa servicios similares con prioridades cercanas</li>
                        <li>✅ Usa límites claros para evitar confusión (100, 500, 1000)</li>
                        <li>✅ Establece precios extra competitivos pero rentables</li>
                        <li>✅ Marca como "Incluido" los servicios esenciales del plan</li>
                        <li>✅ Deja ilimitados los servicios sin costo operativo alto</li>
                    </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Consideraciones Importantes
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>⚠️ Los cambios afectan al plan inmediatamente</li>
                        <li>⚠️ Las suscripciones existentes no se modifican automáticamente</li>
                        <li>⚠️ Si eliminas un servicio, las notarías perderán acceso</li>
                        <li>⚠️ Los límites se renuevan cada mes calendario</li>
                        <li>⚠️ Los cargos extra se facturan al final del mes</li>
                    </ul>
                </div>
            </div>
        ),
    },
    notarias: {
        title: 'Gestión de Notarías',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Gestión de Notarías</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Gestión de Notarías permite administrar todas las notarías registradas en el sistema,
                        incluyendo su información general, ubicación, suscripciones, usuarios y servicios personalizados.
                        Cada notaría es un cliente independiente con su propia configuración y acceso al sistema.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Características Principales</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Building2 className="h-5 w-5 text-primary" />
                                    Registro Completo
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Información detallada de cada notaría:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Número de notaría y nombre</li>
                                    <li>Notario titular y datos de contacto</li>
                                    <li>Dirección completa y georeferencia</li>
                                    <li>Teléfonos y correo electrónico</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="h-5 w-5 text-primary" />
                                    Gestión de Suscripciones
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Control de planes y pagos:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Asignación de planes</li>
                                    <li>Suscripciones activas y vencidas</li>
                                    <li>Múltiples suscripciones simultáneas</li>
                                    <li>Historial de renovaciones</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-primary" />
                                    Administración de Usuarios
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Gestión del equipo de la notaría:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Admin notaría y usuarios</li>
                                    <li>Límite de usuarios según plan</li>
                                    <li>Permisos y roles</li>
                                    <li>Control de accesos</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Settings className="h-5 w-5 text-primary" />
                                    Servicios Personalizados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Configuración específica por notaría:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Habilitar/deshabilitar servicios</li>
                                    <li>Límites personalizados</li>
                                    <li>Precios especiales</li>
                                    <li>Prioridades ajustadas</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información de Ubicación</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>📍 Datos de Dirección</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Sistema completo de ubicación:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Dirección Completa:</strong> Calle, número exterior e interior
                                </li>
                                <li>
                                    <strong>Ubicación Administrativa:</strong> Colonia, municipio, estado, código postal
                                </li>
                                <li>
                                    <strong>Coordenadas GPS:</strong> Latitud y longitud para georeferencia
                                </li>
                                <li>
                                    <strong>Referencias:</strong> Información adicional para localización
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Estados de Notaría</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>✅ Activa</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    La notaría tiene acceso completo al sistema. Los usuarios pueden iniciar sesión
                                    y utilizar todos los servicios incluidos en su suscripción activa.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>⏸️ Inactiva</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    La notaría está deshabilitada temporalmente. Los usuarios no pueden acceder
                                    al sistema hasta que se reactive. Útil para suspensiones temporales.
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🗑️ Eliminada (Soft Delete)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    La notaría fue eliminada pero sus datos se mantienen en el sistema.
                                    No aparece en listados principales pero puede restaurarse si es necesario.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Operaciones Disponibles</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Acciones Principales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>📋 <strong>Ver Catálogo:</strong> Lista completa de notarías con búsqueda y filtros</li>
                                <li>➕ <strong>Crear Notaría:</strong> Registro de nueva notaría con datos completos</li>
                                <li>✏️ <strong>Editar:</strong> Modificar información, contacto y ubicación</li>
                                <li>👁️ <strong>Ver Detalles:</strong> Información completa con estadísticas y suscripciones</li>
                                <li>⚙️ <strong>Configurar Servicios:</strong> Personalizar servicios y límites</li>
                                <li>🔄 <strong>Activar/Desactivar:</strong> Habilitar o suspender acceso</li>
                                <li>🗑️ <strong>Eliminar:</strong> Soft delete manteniendo historial</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Importante: Arquitectura Multi-Tenant
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ Cada notaría es un tenant independiente con sus propios datos</li>
                        <li>✅ Los usuarios de una notaría solo ven información de su notaría</li>
                        <li>✅ El super admin ve y gestiona todas las notarías</li>
                        <li>✅ Los datos están completamente aislados entre notarías</li>
                        <li>⚠️ Desactivar una notaría bloquea acceso inmediato a todos sus usuarios</li>
                        <li>⚠️ Eliminar una notaría es reversible (soft delete)</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'notarias-catalogo': {
        title: 'Catálogo de Notarías',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Catálogo de Notarías</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Gestión de Notarías permite administrar todas las notarías registradas en el sistema,
                        incluyendo su información de contacto, ubicación, plan contratado y configuración personalizada.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Gestión Centralizada de Notarías
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Administra todas las notarías desde un solo lugar, con control total sobre
                                configuración, usuarios, servicios y suscripciones.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Vista Principal de Notarías</h2>
                    <p className="text-muted-foreground leading-relaxed mb-4">
                        La vista principal muestra todas las notarías registradas con opciones de búsqueda rápida.
                    </p>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Search className="h-5 w-5 text-primary" />
                                Búsqueda y Filtros
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Características de búsqueda:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Búsqueda rápida:</strong> Por nombre de notaría</li>
                                <li><strong>Búsqueda en tiempo real:</strong> Resultados automáticos al escribir</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información Mostrada</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Tabla de Notarías</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                La tabla principal muestra para cada notaría:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Nombre:</strong> Nombre completo de la notaría</li>
                                <li><strong>Número:</strong> Número de notaría asignado</li>
                                <li><strong>Contacto Principal:</strong> Nombre del responsable</li>
                                <li><strong>Email:</strong> Correo de contacto</li>
                                <li><strong>Teléfono:</strong> Número telefónico</li>
                                <li><strong>Plan Actual:</strong> Badge con el plan contratado y precio mensual</li>
                                <li><strong>Usuarios:</strong> Cantidad de usuarios registrados</li>
                                <li><strong>Fecha de Registro:</strong> Cuándo se dio de alta</li>
                                <li><strong>Estado:</strong> Badge Activa (verde) o Inactiva (rojo)</li>
                                <li><strong>Acciones:</strong> Ver detalles, editar, gestionar servicios</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Acciones Disponibles</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Operaciones en Notarías</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>👁️ <strong>Ver Detalles:</strong> Consulta información completa, usuarios y búsquedas</li>
                                <li>✏️ <strong>Editar:</strong> Modifica datos de contacto, ubicación y configuración</li>
                                <li>⚙️ <strong>Gestionar Servicios:</strong> Personaliza límites y servicios específicos</li>
                                <li>➕ <strong>Nueva Notaría:</strong> Registra una nueva notaría en el sistema</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Consideraciones Importantes
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>⚠️ Las notarías inactivas no pueden acceder al sistema</li>
                        <li>⚠️ Cada notaría debe tener al menos una suscripción activa</li>
                        <li>⚠️ Los límites personalizados sobrescriben los del plan</li>
                        <li>⚠️ La información de contacto es crítica para comunicaciones y facturación</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'notarias-crear': {
        title: 'Crear Notaría',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Crear Nueva Notaría</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Para registrar una nueva notaría en el sistema, haz clic en el botón <strong>"Nueva Notaría"</strong>
                        en la vista principal. El formulario te guiará a través de toda la configuración necesaria.
                    </p>
                </div>

                <div className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>📝 Información Básica</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Datos principales de identificación:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Nombre de la Notaría *:</strong> Nombre oficial completo
                                    <br />
                                    <span className="text-xs italic">Ejemplo: Notaría Pública Número 10 de Cuernavaca</span>
                                </li>
                                <li>
                                    <strong>Número de Notaría *:</strong> Número oficial asignado
                                    <br />
                                    <span className="text-xs italic">Ejemplo: 10</span>
                                </li>
                                <li>
                                    <strong>Plan *:</strong> Selecciona el plan de suscripción inicial
                                    <br />
                                    <span className="text-xs italic">💡 Se puede cambiar después desde la vista de suscripciones</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>👤 Información de Contacto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Datos del responsable y comunicación:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Contacto Principal *:</strong> Nombre del notario o responsable
                                </li>
                                <li>
                                    <strong>Email de Contacto *:</strong> Correo electrónico principal
                                    <br />
                                    <span className="text-xs italic">Se usará para notificaciones y facturación</span>
                                </li>
                                <li>
                                    <strong>Teléfono:</strong> Número de contacto
                                    <br />
                                    <span className="text-xs italic">Incluye código de área</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>📍 Ubicación</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Dirección física de la notaría:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Estado:</strong> Selector de estado de la República Mexicana
                                </li>
                                <li>
                                    <strong>Municipio:</strong> Se carga automáticamente según el estado seleccionado
                                </li>
                                <li>
                                    <strong>Código Postal:</strong> CP de 5 dígitos
                                    <br />
                                    <span className="text-xs italic">💡 Al ingresar el CP, se sugieren colonias disponibles</span>
                                </li>
                                <li>
                                    <strong>Colonia:</strong> Lista de colonias según el CP
                                </li>
                                <li>
                                    <strong>Calle y Número:</strong> Dirección específica
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>⚙️ Configuración</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Opciones adicionales:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Notas Internas:</strong> Información adicional de uso interno
                                    <br />
                                    <span className="text-xs italic">No visible para la notaría</span>
                                </li>
                                <li>
                                    <strong>Notaría Activa:</strong> Switch para activar/desactivar inmediatamente
                                    <br />
                                    <span className="text-xs italic">Desactivada = Sin acceso al sistema</span>
                                </li>
                            </ul>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>🔗 Integración con Sistema Legacy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Si la notaría ya existe en el sistema VB6:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Buscar en Sistema Legacy:</strong> Autocomplete con notarías existentes
                                    <br />
                                    <span className="text-xs italic">Escribe para buscar por nombre o identificador</span>
                                </li>
                                <li>
                                    <strong>Vinculación automática:</strong> Al seleccionar, se importan datos y se vinculan búsquedas históricas
                                </li>
                                <li>
                                    <strong>Legacy Identifier:</strong> Se guarda automáticamente para sincronización continua
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Proceso de Creación
                    </h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Completa <strong>nombre y número</strong> de la notaría</li>
                        <li>Selecciona el <strong>plan inicial</strong></li>
                        <li>Ingresa datos del <strong>contacto principal y email</strong></li>
                        <li>Selecciona <strong>estado y municipio</strong></li>
                        <li>Ingresa el <strong>código postal</strong> (se cargarán colonias disponibles)</li>
                        <li>Selecciona <strong>colonia</strong> y completa dirección</li>
                        <li>Opcionalmente, agrega <strong>notas internas</strong></li>
                        <li>Si existe en sistema legacy, <strong>búscala y vincúlala</strong></li>
                        <li>Decide si estará <strong>activa</strong> inmediatamente</li>
                        <li>Haz clic en <strong>"Guardar Notaría"</strong></li>
                    </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Después de Crear la Notaría
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Suscripción automática:</strong> Se crea automáticamente con el plan seleccionado</li>
                        <li>✅ <strong>Ya puede acceder:</strong> Si está activa, ya puede usar el sistema</li>
                        <li>⚙️ <strong>Configuración adicional:</strong> Usa "Gestionar Servicios" para personalizar límites</li>
                        <li>👥 <strong>Crear usuarios:</strong> Desde la vista de la notaría, agrega usuarios para acceso</li>
                    </ul>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Ubicación Normalizada
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Datos oficiales:</strong> Estado, municipio, CP y colonia usan catálogos oficiales</li>
                        <li>✅ <strong>Validación automática:</strong> CP de 5 dígitos, colonias reales del SEPOMEX</li>
                        <li>💡 <strong>Beneficios:</strong> Permite reportes por ubicación, estadísticas por región</li>
                        <li>🔄 <strong>Campo legacy:</strong> La dirección completa antigua se guarda en "direccion" para compatibilidad</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'notarias-editar': {
        title: 'Editar Notaría',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Editar Notaría</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Puedes modificar la información de una notaría haciendo clic en el botón de editar (✏️)
                        en la vista principal o desde la vista de detalles.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Campos Editables</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>✏️ Información Modificable</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Puedes editar todos los datos excepto el vínculo con sistema legacy:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>Nombre de la Notaría:</strong> Actualiza el nombre oficial
                                    </li>
                                    <li>
                                        <strong>Número de Notaría:</strong> Modifica el número asignado
                                    </li>
                                    <li>
                                        <strong>Contacto y Email:</strong> Actualiza responsable y correo
                                        <br />
                                        <span className="text-xs italic text-amber-600">
                                            ⚠️ El email se usa para todo el sistema - verifica que sea correcto
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Teléfono:</strong> Actualiza número de contacto
                                    </li>
                                    <li>
                                        <strong>Ubicación:</strong> Modifica estado, municipio, CP, colonia y dirección
                                    </li>
                                    <li>
                                        <strong>Notas Internas:</strong> Actualiza información interna
                                    </li>
                                    <li>
                                        <strong>Estado Activa:</strong> Activa o desactiva el acceso
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🔒 Campos No Editables</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Estos campos NO se pueden modificar:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>Legacy Identifier:</strong> La vinculación con sistema VB6 no se puede cambiar
                                        <br />
                                        <span className="text-xs italic">
                                            Se establece al crear la notaría y es permanente para mantener sincronización
                                        </span>
                                    </li>
                                    <li>
                                        <strong>Plan:</strong> No se edita aquí - usa el módulo de Suscripciones
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Proceso de Edición
                    </h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Ve a la vista principal o detalles de la notaría</li>
                        <li>Haz clic en el botón de editar (✏️)</li>
                        <li>Modifica los campos necesarios</li>
                        <li>Si cambias el estado, espera a que se cargue la lista de municipios</li>
                        <li>Si cambias el CP, selecciona la colonia de la lista actualizada</li>
                        <li>Verifica el email antes de guardar</li>
                        <li>Haz clic en <strong>"Guardar Cambios"</strong></li>
                    </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Impacto de los Cambios
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Cambios inmediatos:</strong> Toda la información se actualiza al instante</li>
                        <li>⚠️ <strong>Desactivar notaría:</strong> Bloquea acceso inmediato a todos los usuarios</li>
                        <li>⚠️ <strong>Cambio de email:</strong> Afecta notificaciones y recuperación de contraseñas</li>
                        <li>✅ <strong>Ubicación normalizada:</strong> Mejora reportes y estadísticas geográficas</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'notarias-detalles': {
        title: 'Ver Detalles',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Detalles de la Notaría</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        La vista de detalles muestra información completa sobre una notaría específica, incluyendo
                        datos de contacto, suscripciones activas, usuarios, historial de búsquedas y estadísticas.
                    </p>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información Mostrada</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>📊 Información General</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Datos principales de la notaría:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Nombre:</strong> Nombre oficial completo</li>
                                    <li><strong>Número:</strong> Número de notaría</li>
                                    <li><strong>Contacto Principal:</strong> Nombre del responsable</li>
                                    <li><strong>Email de Contacto:</strong> Correo principal</li>
                                    <li><strong>Teléfono:</strong> Número de contacto</li>
                                    <li><strong>Dirección Completa:</strong> Ubicación física detallada</li>
                                    <li><strong>Estado:</strong> Badge Activa/Inactiva</li>
                                    <li><strong>Fecha de Registro:</strong> Cuándo se dio de alta</li>
                                    <li><strong>Notas Internas:</strong> Información de uso administrativo</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>📈 Estadísticas Rápidas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    4 tarjetas con métricas clave:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>👥 Total de Usuarios:</strong> Cantidad de usuarios registrados</li>
                                    <li><strong>🔍 Búsquedas del Mes:</strong> Total de búsquedas realizadas en el mes actual</li>
                                    <li><strong>💰 Plan Actual:</strong> Nombre del plan y precio mensual</li>
                                    <li><strong>📅 Fecha de Registro:</strong> Antigüedad en el sistema</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>💳 Suscripciones Activas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Lista de suscripciones vigentes con:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Plan:</strong> Nombre del plan contratado</li>
                                    <li><strong>Estado:</strong> Badge con status (Activa, Suspendida, Cancelada, Expirada)</li>
                                    <li><strong>Ciclo:</strong> Mensual o Anual</li>
                                    <li><strong>Precio:</strong> Monto pagado</li>
                                    <li><strong>Fechas:</strong> Inicio y vencimiento</li>
                                    <li><strong>Auto-renovación:</strong> Si renueva automáticamente</li>
                                </ul>
                                <p className="text-xs text-muted-foreground mt-3">
                                    💡 Una notaría puede tener múltiples suscripciones simultáneas
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>👥 Lista de Usuarios</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Usuarios asociados a la notaría:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Nombre:</strong> Nombre completo del usuario</li>
                                    <li><strong>Email:</strong> Correo de acceso</li>
                                    <li><strong>Tipo:</strong> Notario, Oficial, Usuario</li>
                                    <li><strong>Fecha de Registro:</strong> Cuándo se creó la cuenta</li>
                                    <li><strong>Gestión de Contraseñas:</strong> Opción para cambiar/resetear contraseña</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🔍 Historial de Búsquedas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Registro completo de búsquedas realizadas:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li><strong>Tipo de Búsqueda:</strong> OFAC, SAT, PEP, etc.</li>
                                    <li><strong>Estado:</strong> Completada, Pendiente, Error</li>
                                    <li><strong>Fecha y Hora:</strong> Cuándo se realizó</li>
                                    <li><strong>Sistema:</strong> Web o Legacy (VB6)</li>
                                </ul>
                                <p className="text-xs text-muted-foreground mt-3">
                                    💡 Incluye búsquedas del sistema legacy si la notaría está vinculada
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Operaciones Disponibles</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                Desde la vista de detalles puedes:
                            </p>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li>🔙 <strong>Volver:</strong> Regresa al catálogo de notarías</li>
                                <li>✏️ <strong>Editar:</strong> Modifica información de la notaría</li>
                                <li>⚙️ <strong>Gestionar Servicios:</strong> Personaliza límites y servicios</li>
                                <li>🔑 <strong>Gestionar Contraseñas:</strong> Cambia contraseñas de usuarios</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Integración con Sistema Legacy
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Si la notaría está vinculada con el sistema VB6:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Historial completo:</strong> Incluye búsquedas del sistema antiguo</li>
                        <li>✅ <strong>Identificador visible:</strong> Muestra el Legacy ID para referencia</li>
                        <li>✅ <strong>Sincronización:</strong> Los datos se mantienen sincronizados</li>
                        <li>🔄 <strong>Badge especial:</strong> Indica que tiene integración legacy activa</li>
                    </ul>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Gestión de Contraseñas
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        Funcionalidad administrativa para contraseñas:
                    </p>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>🔑 Cambiar contraseña de cualquier usuario</li>
                        <li>🔄 Resetear contraseña si el usuario la olvidó</li>
                        <li>📧 Enviar nueva contraseña por email</li>
                        <li>⚡ Cambios inmediatos sin necesidad de confirmación del usuario</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'notarias-servicios': {
        title: 'Servicios Personalizados',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Servicios Personalizados por Notaría</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Esta vista permite personalizar límites y configuraciones de servicios específicos para una notaría,
                        sobrescribiendo la configuración del plan cuando se requieren ajustes especiales.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                        <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Configuración Personalizada
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Los cambios aquí sobrescriben la configuración del plan solo para esta notaría específica.
                                Útil para casos especiales, promociones o acuerdos personalizados.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Opciones de Personalización</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>👥 Límite de Usuarios Custom</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Sobrescribe el límite de usuarios del plan:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>Dejar vacío:</strong> Usa el límite del plan
                                    </li>
                                    <li>
                                        <strong>Especificar número:</strong> Límite personalizado para esta notaría
                                    </li>
                                    <li>
                                        <strong>Casos de uso:</strong>
                                        <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                                            <li>Promoción temporal con más usuarios</li>
                                            <li>Acuerdo especial por volumen</li>
                                            <li>Restricción temporal por impago</li>
                                        </ul>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>🔍 Límite de Búsquedas/Mes Custom</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Sobrescribe el límite de búsquedas del plan:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>Dejar vacío:</strong> Usa el límite del plan
                                    </li>
                                    <li>
                                        <strong>Especificar número:</strong> Límite personalizado de consultas mensuales
                                    </li>
                                    <li>
                                        <strong>Solo afecta servicios de tipo "Consulta":</strong> OFAC, SAT, PEP, etc.
                                    </li>
                                    <li>
                                        <strong>Casos de uso:</strong>
                                        <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                                            <li>Aumento temporal para mes con alto volumen</li>
                                            <li>Promoción de prueba con búsquedas extra</li>
                                            <li>Reducción por plan de pago diferido</li>
                                        </ul>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>⚙️ Herramientas/Servicios Activos Custom</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Personaliza qué servicios tiene acceso esta notaría:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                    <li>
                                        <strong>Dejar vacío:</strong> Usa los servicios del plan
                                    </li>
                                    <li>
                                        <strong>Seleccionar servicios:</strong> Lista personalizada que sobrescribe el plan
                                    </li>
                                    <li>
                                        <strong>Agregar servicios:</strong> Haz clic en "Agregar Servicio" y selecciona de la lista
                                    </li>
                                    <li>
                                        <strong>Quitar servicios:</strong> Haz clic en la X del servicio
                                    </li>
                                    <li>
                                        <strong>Casos de uso:</strong>
                                        <ul className="list-circle list-inside ml-6 mt-1 space-y-1">
                                            <li>Dar acceso a servicios premium sin cambiar de plan</li>
                                            <li>Prueba de nuevos servicios antes de lanzamiento</li>
                                            <li>Restricción temporal de servicios específicos</li>
                                            <li>Acuerdos comerciales personalizados</li>
                                        </ul>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Cómo Funciona la Prioridad
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        El sistema verifica en este orden:
                    </p>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li><strong>Configuración Custom:</strong> Si existe, se usa esta (máxima prioridad)</li>
                        <li><strong>Configuración del Plan:</strong> Si no hay custom, se usa la del plan</li>
                        <li><strong>Valores por defecto:</strong> Si nada está configurado, usa valores del sistema</li>
                    </ol>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Consideraciones Importantes
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>⚠️ <strong>Sobrescribe completamente:</strong> Si estableces servicios custom, se ignoran los del plan</li>
                        <li>⚠️ <strong>Cambios inmediatos:</strong> Los ajustes se aplican instantáneamente</li>
                        <li>⚠️ <strong>No afecta facturación:</strong> Los cambios custom no alteran el precio del plan</li>
                        <li>⚠️ <strong>Renovación de límites:</strong> Los límites de búsquedas se renuevan cada mes calendario</li>
                        <li>💡 <strong>Restaurar valores del plan:</strong> Simplemente deja el campo vacío</li>
                    </ul>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Ejemplos de Uso
                    </h3>
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div>
                            <p className="font-semibold">Ejemplo 1: Promoción temporal</p>
                            <ul className="list-disc list-inside ml-2 mt-1">
                                <li>Plan: Básico (100 búsquedas/mes)</li>
                                <li>Custom: 500 búsquedas/mes por 3 meses</li>
                                <li>Resultado: Notaría tiene 500 búsquedas pero paga precio de Plan Básico</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold">Ejemplo 2: Acceso premium temporal</p>
                            <ul className="list-disc list-inside ml-2 mt-1">
                                <li>Plan: Estándar (sin API Premium)</li>
                                <li>Custom: Agregar "API Premium" a servicios</li>
                                <li>Resultado: Accede a API Premium sin cambiar de plan</li>
                            </ul>
                        </div>
                        <div>
                            <p className="font-semibold">Ejemplo 3: Restricción por impago</p>
                            <ul className="list-disc list-inside ml-2 mt-1">
                                <li>Plan: Premium (ilimitado)</li>
                                <li>Custom: 50 búsquedas/mes hasta regularizar pago</li>
                                <li>Resultado: Servicio limitado temporalmente</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        ),
    },
    'notarias-eliminar': {
        title: 'Eliminar / Inhabilitar Notaría',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Eliminar o Inhabilitar Notaría</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Desde la lista de notarías, el botón <strong>🗑️ (papelera)</strong> abre un modal inteligente
                        que guía al administrador para tomar la decisión correcta antes de proceder.
                    </p>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-900">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800 dark:text-amber-400 mb-1">
                                Acción Crítica — Lee antes de proceder
                            </p>
                            <p className="text-sm text-muted-foreground">
                                El sistema verifica el estado de la notaría (usuarios activos, búsquedas, etc.)
                                y presenta advertencias específicas para evitar pérdida accidental de datos.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Opción 1: Inhabilitar (Recomendado)</h2>
                    <Card className="border-green-200 dark:border-green-900">
                        <CardHeader>
                            <CardTitle className="text-green-700 dark:text-green-400">✅ Inhabilitar Acceso</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Desactiva el acceso al sistema sin eliminar ningún dato. La notaría no podrá
                                iniciar sesión, pero toda su información permanece disponible.
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li>✅ Mantiene historial completo de búsquedas</li>
                                <li>✅ Conserva usuarios, suscripciones y configuración</li>
                                <li>✅ Base de datos tenant permanece intacta</li>
                                <li>✅ Se puede reactivar fácilmente en cualquier momento</li>
                                <li>✅ No requiere contraseña de confirmación</li>
                            </ul>
                            <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg mt-3">
                                <p className="text-sm font-semibold text-green-800 dark:text-green-400">¿Cuándo usar?</p>
                                <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside ml-2">
                                    <li>Cliente canceló el servicio temporalmente</li>
                                    <li>Impago pendiente de regularizar</li>
                                    <li>Notaría en proceso de auditoría</li>
                                    <li>Migración a otro sistema (acceso de lectura)</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div>
                    <h2 className="text-2xl font-bold mb-4">Opción 2: Eliminar Permanentemente</h2>
                    <Card className="border-red-200 dark:border-red-900">
                        <CardHeader>
                            <CardTitle className="text-red-600 dark:text-red-400">❌ Eliminación Permanente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className="text-sm text-muted-foreground">
                                Elimina el registro de la notaría de la base de datos central junto con sus
                                suscripciones asociadas. <strong className="text-red-600">Esta acción NO se puede deshacer.</strong>
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li>❌ Elimina el registro de la notaría</li>
                                <li>❌ Elimina suscripciones asociadas</li>
                                <li>❌ Requiere contraseña de super admin para confirmar</li>
                                <li>❌ Requiere razón (mínimo 10 caracteres)</li>
                                <li>⚠️ La base de datos tenant debe eliminarse <strong>manualmente</strong> en el servidor</li>
                            </ul>
                            <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg mt-3">
                                <p className="text-sm font-semibold text-red-700 dark:text-red-400">¿Cuándo usar?</p>
                                <ul className="text-sm text-muted-foreground mt-1 space-y-1 list-disc list-inside ml-2">
                                    <li>Notaría de prueba o demostración creada por error</li>
                                    <li>Registro duplicado que nunca tuvo operaciones reales</li>
                                    <li>Datos de testing que deben limpiarse</li>
                                </ul>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Bloqueo Inteligente</h2>
                    <p className="text-muted-foreground mb-4">
                        El modal detecta automáticamente si la notaría tiene condiciones que impiden la eliminación segura:
                    </p>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-amber-600" />
                                    Bloqueo por Usuarios Activos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Si la notaría tiene usuarios registrados, la opción <strong>"Eliminar Permanentemente"</strong> aparece
                                    bloqueada y el modal muestra una alerta con el número de usuarios y los pasos a seguir:
                                </p>
                                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside ml-2">
                                    <li>Haz clic en <strong>"Gestionar Usuarios"</strong> — el modal cierra y redirige a la lista de usuarios filtrada por esa notaría</li>
                                    <li>Elimina o reasigna los usuarios de la notaría</li>
                                    <li>Regresa al catálogo de notarías y vuelve a abrir el modal</li>
                                    <li>Ahora la opción de eliminar estará disponible</li>
                                </ol>
                                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mt-3">
                                    <p className="text-xs text-muted-foreground">
                                        💡 El contador de usuarios se actualiza automáticamente en tiempo real.
                                        Después de eliminar un usuario, el contador en la tabla de notarías se sincroniza de inmediato.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Flujo Completo de Eliminación</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                                <li>Haz clic en el ícono 🗑️ en la fila de la notaría</li>
                                <li>El modal muestra el estado actual: usuarios, búsquedas del mes, estado activo/inactivo</li>
                                <li>Si hay usuarios activos → aparece alerta ámbar con las instrucciones</li>
                                <li>Haz clic en <strong>"Gestionar Usuarios"</strong> → redirige a usuarios filtrados por la notaría</li>
                                <li>Elimina los usuarios de esa notaría</li>
                                <li>Regresa al catálogo de notarías y abre el modal de la notaría nuevamente</li>
                                <li>El bloqueo ya no aparece — selecciona <strong>"Eliminar Permanentemente"</strong></li>
                                <li>Escribe la razón (mínimo 10 caracteres)</li>
                                <li>Ingresa tu contraseña de super admin</li>
                                <li>Haz clic en <strong>"Eliminar Permanentemente"</strong></li>
                                <li>✅ La notaría es eliminada y se registra en los logs del sistema</li>
                                <li>⚠️ <strong>Acción posterior requerida:</strong> Eliminar manualmente la base de datos tenant del servidor</li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Base de Datos Tenant
                    </h3>
                    <p className="text-sm text-muted-foreground mb-3">
                        Cada notaría tiene su propia base de datos separada para almacenar sus búsquedas y datos operativos.
                        El sistema <strong>no elimina automáticamente</strong> esta base de datos al borrar la notaría.
                        Después de eliminar una notaría, debes eliminar manualmente la base de datos en el servidor.
                    </p>
                    <p className="text-sm text-muted-foreground">
                        El modal muestra el nombre exacto de la base de datos tenant para que puedas identificarla fácilmente.
                    </p>
                </div>

                <div className="bg-gray-50 dark:bg-gray-950/20 p-6 rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2">📋 Auditoría y Logs</h3>
                    <p className="text-sm text-muted-foreground">
                        Toda eliminación permanente queda registrada en los logs del sistema con:
                        nombre del administrador responsable, fecha y hora, razón proporcionada, IP de origen
                        y número de usuarios que tenía la notaría al momento de la eliminación.
                    </p>
                </div>
            </div>
        ),
    },
    'reportes': {
        title: 'Sistema de Reportes y Estadísticas',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Sistema de Reportes y Estadísticas</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El módulo de Reportes proporciona análisis detallados del uso de servicios, permitiendo
                        monitorear consumo, costos, tendencias y detectar patrones de uso para la toma de decisiones.
                    </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                    <div className="flex items-start gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-1">
                                Análisis Integral de Uso
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Reportes en tiempo real con múltiples vistas, filtros y exportación profesional a Excel.
                                Visualiza el comportamiento de uso por servicio, notaría, período y detecta anomalías.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Características Principales</h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-primary" />
                                    Estadísticas en Tiempo Real
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Total de solicitudes y cantidad consumida</li>
                                    <li>Costo total y promedio por solicitud</li>
                                    <li>Notarías activas con uso de servicios</li>
                                    <li>Servicios únicos utilizados</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Filter className="h-5 w-5 text-primary" />
                                    Filtros Avanzados
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Por período: Semana, Mes, Año</li>
                                    <li>Por notaría específica o todas</li>
                                    <li>Por servicio individual o global</li>
                                    <li>Combinación de múltiples filtros</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-primary" />
                                    Análisis de Tendencias
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Gráficos de tendencia histórica</li>
                                    <li>Comparativas entre períodos</li>
                                    <li>Sparklines de últimos 7 días</li>
                                    <li>Proyecciones de consumo</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileDown className="h-5 w-5 text-primary" />
                                    Exportación Profesional
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Exportación a Excel con logo de Atinet</li>
                                    <li>3 tipos de reportes especializados</li>
                                    <li>Formato profesional con colores</li>
                                    <li>Headers personalizados por tipo</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Tipos de Reportes Disponibles</h2>
                    <div className="space-y-3">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
                                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">Dashboard Principal</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Vista general con estadísticas clave, filtros y accesos rápidos a reportes especializados
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg">
                                        <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">Uso por Servicio</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Detalles de consumo por cada servicio con tendencias de últimos 7 días
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-purple-100 dark:bg-purple-900/30 p-2 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">Top Servicios</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Ranking de servicios más utilizados con métricas de popularidad
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg">
                                        <Users className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">Comparativa de Notarías</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Análisis comparativo del uso de servicios entre diferentes notarías
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-cyan-100 dark:bg-cyan-900/30 p-2 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">Tendencias de Uso</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Análisis histórico de consumo con gráficos de evolución temporal
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-start gap-3">
                                    <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded-lg">
                                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold mb-1">Notarías Cerca del Límite</h3>
                                        <p className="text-sm text-muted-foreground">
                                            Alertas de notarías próximas a alcanzar sus límites de uso mensual
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-lg border border-amber-200 dark:border-amber-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                        Consideraciones Importantes
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>📊 Los reportes se actualizan en tiempo real con cada nueva solicitud</li>
                        <li>🔒 Super Admins ven datos de todas las notarías, Admin Notaría solo ve su propia data</li>
                        <li>📈 Los costos mostrados son calculados en base al plan y configuración de cada notaría</li>
                        <li>📅 Los filtros de período afectan todas las estadísticas y exportaciones</li>
                        <li>💾 Las exportaciones incluyen marca de tiempo del período filtrado</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'reportes-general': {
        title: 'Dashboard Principal',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Dashboard Principal de Reportes</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        La vista principal de reportes muestra un resumen ejecutivo con las métricas más importantes
                        y proporciona acceso rápido a todos los reportes especializados del sistema.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Filtros Globales</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Filter className="h-5 w-5 text-primary" />
                                Controles de Filtrado
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                La barra superior contiene controles que afectan todas las estadísticas mostradas:
                            </p>
                            <div className="space-y-3">
                                <div>
                                    <p className="font-semibold text-sm mb-1">📅 Selector de Período</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 space-y-1">
                                        <li><strong>Esta Semana:</strong> Lunes a Domingo de la semana actual</li>
                                        <li><strong>Este Mes:</strong> Del día 1 al último día del mes actual</li>
                                        <li><strong>Este Año:</strong> Del 1 de enero al 31 de diciembre del año actual</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">🏢 Selector de Notaría</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 space-y-1">
                                        <li><strong>Todas las notarías:</strong> Vista consolidada del sistema completo</li>
                                        <li><strong>Notaría específica:</strong> Filtra solo el uso de esa notaría</li>
                                    </ul>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">💾 Botón de Exportar</p>
                                    <ul className="list-disc list-inside text-sm text-muted-foreground ml-2 space-y-1">
                                        <li>Descarga rápida del reporte de uso detallado</li>
                                        <li>Incluye los filtros actualmente aplicados</li>
                                        <li>Formato Excel profesional con logo de Atinet</li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Tarjetas de Estadísticas</h2>
                    <p className="text-muted-foreground mb-4">
                        3 tarjetas principales muestran las métricas clave del período seleccionado:
                    </p>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-blue-600" />
                                    Total de Solicitudes
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Muestra el número de solicitudes de servicio realizadas:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Número principal:</strong> Total de requests realizados</li>
                                    <li><strong>Cantidad total:</strong> Suma de la cantidad consumida de todos los servicios</li>
                                    <li>💡 Una solicitud puede consumir múltiples unidades (ej: 5 búsquedas en una sola request)</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <DollarSign className="h-5 w-5 text-green-600" />
                                    Costo Total
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Cálculo del costo total generado por el uso de servicios:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Monto principal:</strong> Suma de todos los costos del período</li>
                                    <li><strong>Promedio por solicitud:</strong> Costo total ÷ número de solicitudes</li>
                                    <li>💡 Los costos son calculados según el modelo de facturación de cada servicio y plan</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Users className="h-5 w-5 text-purple-600" />
                                    Notarías Activas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Cantidad de notarías con suscripción activa:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Número principal:</strong> Notarías con suscripción vigente</li>
                                    <li><strong>Servicios disponibles:</strong> Cantidad de servicios únicos utilizados en el período</li>
                                    <li>💡 Una notaría activa puede o no tener uso en el período seleccionado</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Accesos Rápidos</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Enlaces a Reportes Especializados</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                La sección de accesos rápidos contiene 5 enlaces a reportes detallados:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Uso por Servicio:</strong> Tabla detallada de cada servicio con sparklines de tendencia
                                </li>
                                <li>
                                    <strong>Top Servicios:</strong> Ranking de los servicios más populares ordenados por uso
                                </li>
                                <li>
                                    <strong>Comparativa de Notarías:</strong> Compara el uso y costos entre diferentes notarías
                                </li>
                                <li>
                                    <strong>Tendencias de Uso:</strong> Gráficos de evolución temporal del consumo
                                </li>
                                <li>
                                    <strong>Notarías Cerca del Límite:</strong> Alertas de notarías próximas a exceder sus límites
                                </li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Sección de Exportación</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileDown className="h-5 w-5 text-primary" />
                                Exportar Reportes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground mb-3">
                                3 botones para descargar diferentes tipos de reportes en formato Excel:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li>
                                    <strong>Reporte de Uso Detallado:</strong> Cada fila es una solicitud individual con fecha,
                                    notaría, servicio, usuario, cantidad y costo
                                </li>
                                <li>
                                    <strong>Reporte por Notarías:</strong> Resumen agrupado por notaría con totales de
                                    solicitudes, cantidad consumida y costo
                                </li>
                                <li>
                                    <strong>Reporte por Servicios:</strong> Resumen agrupado por servicio con totales y
                                    cantidad de notarías únicas que lo usaron
                                </li>
                            </ul>
                            <p className="text-xs text-muted-foreground mt-3">
                                💡 Todos los archivos incluyen el logo de Atinet, headers formateados y respetan los filtros aplicados
                            </p>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Flujo de Uso Típico
                    </h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Selecciona el período que deseas analizar (semana, mes, año)</li>
                        <li>Opcionalmente filtra por una notaría específica</li>
                        <li>Revisa las 3 tarjetas de estadísticas generales</li>
                        <li>Navega a un reporte especializado según lo que necesites analizar</li>
                        <li>Descarga el reporte en Excel si necesitas compartirlo o analizarlo externamente</li>
                    </ol>
                </div>
            </div>
        ),
    },
    'reportes-uso-servicio': {
        title: 'Uso por Servicio',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Reporte de Uso por Servicio</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Vista detallada del consumo de servicios con historial completo de cada solicitud,
                        sparklines de tendencia de los últimos 7 días y filtros avanzados.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Filtros Disponibles</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <div className="space-y-3">
                                <div>
                                    <p className="font-semibold text-sm mb-1">📦 Por Servicio</p>
                                    <p className="text-sm text-muted-foreground ml-2">
                                        Selecciona un servicio específico (ej: OFAC, SAT) o deja vacío para ver todos
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">📅 Por Período</p>
                                    <p className="text-sm text-muted-foreground ml-2">
                                        Esta Semana, Este Mes o Este Año
                                    </p>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm mb-1">🏢 Por Notaría</p>
                                    <p className="text-sm text-muted-foreground ml-2">
                                        Filtra por una notaría específica o muestra todas
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Tabla de Uso Detallado</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Columnas Mostradas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li><strong>Fecha y Hora:</strong> Momento exacto de la solicitud (formato completo)</li>
                                <li><strong>Servicio:</strong> Nombre del servicio consumido y categoría</li>
                                <li><strong>Notaría:</strong> Nombre y número de notaría</li>
                                <li><strong>Usuario:</strong> Nombre del usuario que realizó la solicitud</li>
                                <li><strong>Cantidad:</strong> Unidades consumidas en esa solicitud</li>
                                <li><strong>Costo:</strong> Monto generado por esa solicitud específica</li>
                                <li><strong>Detalles:</strong> Información adicional según el tipo de servicio</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Sparklines de Tendencia</h2>
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                        <p className="text-sm text-muted-foreground mb-3">
                            <strong>📈 Gráficos de Últimos 7 Días:</strong>
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                            <li>Cada servicio muestra un mini-gráfico de línea (sparkline) con su uso diario</li>
                            <li>Detecta visualmente picos o caídas abruptas en el consumo</li>
                            <li>Útil para identificar patrones: días de mayor uso, servicios con crecimiento, etc.</li>
                            <li>Se actualiza en tiempo real conforme hay nuevo consumo</li>
                        </ul>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Paginación y Navegación</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li>Muestra 50 registros por página para mejor rendimiento</li>
                                <li>Controles de paginación en la parte inferior</li>
                                <li>Contador de resultados: "Mostrando X a Y de Z registros"</li>
                                <li>Ordenado por fecha descendente (más recientes primero)</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Casos de Uso
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ Auditar el uso de un servicio específico por período</li>
                        <li>✅ Identificar qué usuario consumió más de un servicio</li>
                        <li>✅ Verificar las búsquedas de OFAC/SAT realizadas este mes</li>
                        <li>✅ Detectar anomalías en el patrón de consumo (sparklines)</li>
                        <li>✅ Exportar datos para análisis externo o facturación</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'reportes-top-servicios': {
        title: 'Top Servicios',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Ranking de Servicios Más Utilizados</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Vista ordenada de los servicios según su popularidad, mostrando métricas de uso,
                        costos generados y cantidad de notarías que los consumen.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información Mostrada</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Métricas por Servicio</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li><strong>#  Posición en el Ranking:</strong> Orden basado en total de solicitudes</li>
                                <li><strong>📦 Nombre del Servicio:</strong> Servicio con categoría (ej: Consulta - OFAC)</li>
                                <li><strong>📊 Total de Solicitudes:</strong> Número de veces que se usó el servicio</li>
                                <li><strong>🔢 Cantidad Consumida:</strong> Suma total de unidades utilizadas</li>
                                <li><strong>💰 Costo Total Generado:</strong> Suma de ingresos por ese servicio</li>
                                <li><strong>🏢 Notarías Únicas:</strong> Cantidad de notarías diferentes que lo usaron</li>
                                <li><strong>📈 Porcentaje de Adopción:</strong> % de notarías que usan este servicio</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Filtros de Período</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-3">
                                Puedes cambiar el período para ver cómo varía la popularidad:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Esta Semana:</strong> Servicios más usados en los últimos 7 días</li>
                                <li><strong>Este Mes:</strong> Ranking del mes en curso</li>
                                <li><strong>Este Año:</strong> Tendencias anuales de uso</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Indicadores Visuales</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    Badges de Popularidad
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Los servicios tienen badges especiales según su posición:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>🥇 Puesto #1:</strong> Badge dorado - Servicio más usado</li>
                                    <li><strong>🥈 Puesto #2:</strong> Badge plateado - Segundo lugar</li>
                                    <li><strong>🥉 Puesto #3:</strong> Badge bronce - Tercer lugar</li>
                                    <li><strong>🔥 Top 10:</strong> Badge especial para los primeros 10 servicios</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-blue-600" />
                                    Barras de Progreso
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Representación visual del uso relativo:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Barra de color que representa el % respecto al servicio #1</li>
                                    <li>El servicio más usado tiene barra al 100%</li>
                                    <li>Los demás muestran su proporción relativa</li>
                                    <li>Colores degradados según la posición</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 p-6 rounded-lg border border-purple-200 dark:border-purple-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        Insights de Negocio
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>💡 <strong>Servicios populares</strong> → Considerar destacarlos en marketing</li>
                        <li>💡 <strong>Servicios con baja adopción</strong> → Evaluar si necesitan mejora o capacitación</li>
                        <li>💡 <strong>Alta adopción + alto costo</strong> → Servicios que generan más ingresos</li>
                        <li>💡 <strong>Notarías únicas bajas</strong> → Servicios especializados para nichos específicos</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'reportes-comparativa': {
        title: 'Comparativa de Notarías',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Comparativa de Uso entre Notarías</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Análisis comparativo del consumo de servicios entre diferentes notarías, permitiendo
                        identificar patrones de uso, clientes de alto valor y oportunidades de upselling.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Tabla Comparativa</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Columnas de Datos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li><strong>Ranking:</strong> Posición ordenada por volumen de uso</li>
                                <li><strong>Notaría:</strong> Nombre y número de notaría</li>
                                <li><strong>Plan Actual:</strong> Plan contratado y precio mensual</li>
                                <li><strong>Total Solicitudes:</strong> Número de requests realizadas</li>
                                <li><strong>Cantidad Consumida:</strong> Unidades totales utilizadas</li>
                                <li><strong>Costo Generado:</strong> Ingresos por uso de servicios</li>
                                <li><strong>Servicios Únicos:</strong> Cantidad de servicios diferentes usados</li>
                                <li><strong>Promedio Diario:</strong> Solicitudes por día en el período</li>
                                <li><strong>% del Total:</strong> Proporción respecto al uso total del sistema</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Opciones de Ordenamiento</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-3">
                                Ordena la tabla haciendo clic en los encabezados de columna:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Por nombre:</strong> Orden alfabético de notarías</li>
                                <li><strong>Por uso:</strong> De mayor a menor volumen de solicitudes</li>
                                <li><strong>Por costo:</strong> Notarías que generan más ingresos</li>
                                <li><strong>Por diversidad:</strong> Cantidad de servicios diferentes utilizados</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Indicadores de Performance</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-green-600" />
                                    Clientes de Alto Valor
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Identificación de notarías con mayor uso:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Top 10%:</strong> Badge verde - Clientes más activos</li>
                                    <li><strong>20-30% del total:</strong> Clientes de alto volumen</li>
                                    <li><strong>Bajo uso:</strong> Oportunidades de activación o capacitación</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-600" />
                                    Alertas de Comportamiento
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    El sistema detecta patrones anormales:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>🔴 <strong>Sin uso en el período:</strong> Cliente inactivo - riesgo de cancelación</li>
                                    <li>🟡 <strong>Uso muy por debajo del plan:</strong> Posible downgrade</li>
                                    <li>🟢 <strong>Uso cerca del límite:</strong> Oportunidad de upgrade</li>
                                    <li>🟣 <strong>Alto uso de 1 solo servicio:</strong> Cliente especializado</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Filtros de Análisis</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li><strong>Por Plan:</strong> Compara solo notarías con el mismo plan</li>
                                <li><strong>Por Período:</strong> Semana, mes o año para análisis temporal</li>
                                <li><strong>Solo Activas:</strong> Excluye notarías inactivas del análisis</li>
                                <li><strong>Mínimo de Uso:</strong> Filtra notarías con al menos X solicitudes</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 p-6 rounded-lg border border-blue-200 dark:border-blue-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        Aplicaciones Prácticas
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>📊 <strong>Segmentación de clientes:</strong> Identifica grupos con patrones similares</li>
                        <li>💰 <strong>Análisis de rentabilidad:</strong> Costos vs ingresos por notaría</li>
                        <li>📈 <strong>Oportunidades de upselling:</strong> Clientes cerca de sus límites</li>
                        <li>⚠️ <strong>Riesgo de churn:</strong> Baja actividad o uso decreciente</li>
                        <li>🎯 <strong>Campañas dirigidas:</strong> Personaliza ofertas según el perfil de uso</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'reportes-tendencias': {
        title: 'Tendencias de Uso',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Análisis de Tendencias Históricas</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Visualización gráfica de la evolución del consumo de servicios a lo largo del tiempo,
                        con detección de patrones estacionales, picos de uso y proyecciones futuras.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Gráficos Disponibles</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-blue-600" />
                                    Gráfico de Línea Temporal
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Evolución del uso de servicios por día/semana/mes:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Eje X:</strong> Timeline (días, semanas o meses según el período)</li>
                                    <li><strong>Eje Y:</strong> Cantidad de solicitudes</li>
                                    <li><strong>Líneas múltiples:</strong> Una por cada servicio o comparativa</li>
                                    <li><strong>Puntos interactivos:</strong> Hover para ver valores exactos</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <BarChart3 className="h-5 w-5 text-green-600" />
                                    Gráfico de Barras Acumuladas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Distribución del uso por servicio en el tiempo:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Cada barra representa un período (día/semana/mes)</li>
                                    <li>Colores diferentes por servicio</li>
                                    <li>Muestra participación proporcional de cada servicio</li>
                                    <li>Fácil identificación de servicios dominantes</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Activity className="h-5 w-5 text-purple-600" />
                                    Heatmap de Actividad
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Mapa de calor mostrando intensidad de uso:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Columnas:</strong> Días de la semana (L-D)</li>
                                    <li><strong>Filas:</strong> Semanas del período</li>
                                    <li><strong>Color:</strong> Intensidad del verde según volumen</li>
                                    <li><strong>Patrones:</strong> Detecta días con mayor actividad</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Métricas de Tendencia</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li><strong>Crecimiento (%):</strong> Aumento o disminución vs período anterior</li>
                                <li><strong>Promedio Móvil:</strong> Línea suavizada de 7 días para ver tendencia real</li>
                                <li><strong>Pico Máximo:</strong> Día con mayor uso y su valor</li>
                                <li><strong>Valle Mínimo:</strong> Día con menor uso (detecta problemas o días festivos)</li>
                                <li><strong>Desviación Estándar:</strong> Variabilidad del uso (cliente predecible vs errático)</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Detección de Patrones</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Clock className="h-5 w-5 text-orange-600" />
                                    Patrones Temporales
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    El sistema detecta automáticamente:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Días pico:</strong> Lunes suele tener más búsquedas que viernes</li>
                                    <li><strong>Fin de mes:</strong> Incremento en últimos 3 días del mes</li>
                                    <li><strong>Estacionalidad:</strong> Meses con mayor actividad notarial</li>
                                    <li><strong>Horarios:</strong> Franjas horarias de mayor uso (8am-2pm)</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-red-600" />
                                    Anomalías Detectadas
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Alertas automáticas cuando se detectan:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>🔴 <strong>Pico súbito:</strong> Uso +200% del promedio (posible ataque o error)</li>
                                    <li>🟡 <strong>Caída abrupta:</strong> Uso -50% del promedio (posible problema técnico)</li>
                                    <li>🟣 <strong>Días sin uso:</strong> Período inusual de inactividad</li>
                                    <li>🟢 <strong>Crecimiento sostenido:</strong> Tendencia alcista (indicador positivo)</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Proyecciones y Estimaciones</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-3">
                                Basándose en el histórico, el sistema proyecta:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li><strong>Consumo esperado fin de mes:</strong> Proyección de solicitudes totales</li>
                                <li><strong>Fecha estimada de límite:</strong> Cuándo una notaría alcanzará su máximo</li>
                                <li><strong>Ingresos proyectados:</strong> Estimación de facturación mensual</li>
                                <li><strong>Tendencia trimestral:</strong> Si el uso va en aumento o disminución</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <div className="bg-cyan-50 dark:bg-cyan-950/20 p-6 rounded-lg border border-cyan-200 dark:border-cyan-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                        Interpretación de Tendencias
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>📈 <strong>Línea ascendente:</strong> Adopción creciente - buena señal de satisfacción</li>
                        <li>📉 <strong>Línea descendente:</strong> Posible insatisfacción o competencia</li>
                        <li>➡️ <strong>Línea estable:</strong> Uso predecible - cliente consolidado</li>
                        <li>⚡ <strong>Línea errática:</strong> Uso irregular - investigar causa</li>
                        <li>🎯 <strong>Spikes periódicos:</strong> Uso vinculado a eventos (fin de mes, fiscales, etc.)</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'reportes-alertas': {
        title: 'Notarías Cerca del Límite',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Notarías Cerca del Límite</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        Sistema de alertas proactivas que identifica notarías próximas a alcanzar sus límites
                        mensuales de búsquedas, permitiendo contactarlas para evitar interrupciones o ofrecer upgrades.
                    </p>
                </div>

                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-lg border border-red-200 dark:border-red-900">
                    <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-1">
                                Alertas Preventivas
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Este reporte te permite anticiparte y contactar proactivamente a los clientes
                                antes de que se queden sin servicio.
                            </p>
                        </div>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Criterios de Alerta</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-600">
                                    🔴 Crítico (≥ 90%)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Notarías que han consumido el 90% o más de su límite mensual:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>⚠️ <strong>Riesgo inminente de quedarse sin servicio</strong></li>
                                    <li>📞 <strong>Acción requerida:</strong> Contactar INMEDIATAMENTE</li>
                                    <li>💡 <strong>Oferta sugerida:</strong> Upgrade de plan o compra de paquete adicional</li>
                                    <li>🎯 <strong>Badge rojo</strong> en la tabla para fácil identificación</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-orange-600">
                                    🟡 Advertencia (75-89%)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Notarías entre 75% y 89% de su límite:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>⚠️ <strong>Riesgo moderado</strong> - monitorear de cerca</li>
                                    <li>📧 <strong>Acción recomendada:</strong> Enviar email informativo</li>
                                    <li>💡 <strong>Mensaje sugerido:</strong> "Estás cerca de tu límite, considera un upgrade"</li>
                                    <li>🎯 <strong>Badge naranja</strong> en la tabla</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-yellow-600">
                                    🟢 Precaución (60-74%)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Notarías entre 60% y 74% de su límite:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>⚠️ <strong>Riesgo bajo</strong> - observación</li>
                                    <li>📊 <strong>Acción sugerida:</strong> Incluir en reporte semanal</li>
                                    <li>💡 <strong>Oportunidad:</strong> Cliente que usa activamente el servicio</li>
                                    <li>🎯 <strong>Badge amarillo</strong> en la tabla</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Información Mostrada</h2>
                    <Card>
                        <CardHeader>
                            <CardTitle>Datos por Notaría</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-2 ml-2">
                                <li><strong>Notaría:</strong> Nombre y número</li>
                                <li><strong>Plan Actual:</strong> Plan contratado con límite mensual</li>
                                <li><strong>Búsquedas Realizadas:</strong> Cantidad consumida este mes</li>
                                <li><strong>Límite del Plan:</strong> Máximo permitido por mes</li>
                                <li><strong>Búsquedas Restantes:</strong> Cuántas le quedan disponibles</li>
                                <li><strong>% Consumido:</strong> Porcentaje de uso con barra de progreso</li>
                                <li><strong>Proyección:</strong> Días estimados hasta alcanzar el límite</li>
                                <li><strong>Contacto:</strong> Email y teléfono para comunicación rápida</li>
                                <li><strong>Acciones:</strong> Botones para upgrade o enviar notificación</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Barra de Progreso Visual</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-sm text-muted-foreground mb-3">
                                Cada notaría muestra una barra coloreada según el nivel de uso:
                            </p>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                <li><strong>Verde (0-59%):</strong> Uso normal, sin preocupaciones</li>
                                <li><strong>Amarillo (60-74%):</strong> Precaución - monitorear</li>
                                <li><strong>Naranja (75-89%):</strong> Advertencia - contactar pronto</li>
                                <li><strong>Rojo (90-100%):</strong> Crítico - ACCIÓN INMEDIATA</li>
                                <li><strong>Gris (100% alcanzado):</strong> Límite alcanzado - servicio bloqueado</li>
                            </ul>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Acciones Rápidas</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Mail className="h-5 w-5 text-blue-600" />
                                    Enviar Notificación
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Botón para enviar email automático con:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Estado actual de consumo (X% usado)</li>
                                    <li>Búsquedas restantes</li>
                                    <li>Recomendación de upgrade</li>
                                    <li>Enlace directo para actualizar plan</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <TrendingUp className="h-5 w-5 text-green-600" />
                                    Sugerir Upgrade
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    Botón que abre modal con:
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li>Planes superiores disponibles</li>
                                    <li>Diferencia de precio</li>
                                    <li>Beneficios adicionales</li>
                                    <li>Opción de aplicar upgrade inmediatamente</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-orange-50 dark:bg-orange-950/20 p-6 rounded-lg border border-orange-200 dark:border-orange-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                        Workflow Recomendado
                    </h3>
                    <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Revisa este reporte diariamente (especialmente últimos días del mes)</li>
                        <li>Contacta primero las notarías en estado <strong>Crítico (rojo)</strong></li>
                        <li>Envía emails masivos a las notarías en <strong>Advertencia (naranja)</strong></li>
                        <li>Incluye notarías en <strong>Precaución (amarillo)</strong> en reportes semanales</li>
                        <li>Exporta la lista para seguimiento en CRM externo si es necesario</li>
                        <li>Marca las notarías contactadas para no duplicar comunicaciones</li>
                    </ol>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Beneficios del Sistema de Alertas
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>✅ <strong>Previene interrupciones:</strong> Los clientes no se quedan sin servicio inesperadamente</li>
                        <li>✅ <strong>Incrementa ingresos:</strong> Oportunidades de upselling en el momento preciso</li>
                        <li>✅ <strong>Mejora satisfacción:</strong> Comunicación proactiva generabuen will</li>
                        <li>✅ <strong>Reduce churn:</strong> Clientes no cancelan por límites alcanzados</li>
                        <li>✅ <strong>Automatización:</strong> Menos tiempo manual revisando datos</li>
                    </ul>
                </div>
            </div>
        ),
    },
    'reportes-exportacion': {
        title: 'Exportar Reportes',
        content: (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-4">Exportación de Reportes a Excel</h2>
                    <p className="text-muted-foreground leading-relaxed mb-6">
                        El sistema permite exportar todos los reportes a archivos Excel profesionales con
                        formato corporativo, logo de Atinet y estructuras optimizadas para análisis posterior.
                    </p>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Formatos de Exportación Disponibles</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileDown className="h-5 w-5 text-blue-600" />
                                    Reporte de Uso Detallado
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    <strong>Contenido:</strong> Lista completa de cada solicitud de servicio
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Columnas:</strong> Fecha, Notaría, Servicio, Usuario, Cantidad, Costo</li>
                                    <li><strong>Ordenamiento:</strong> Por fecha descendente (más recientes primero)</li>
                                    <li><strong>Uso típico:</strong> Auditoría detallada, análisis por usuario, facturación</li>
                                    <li><strong>Formato:</strong> Una fila por cada solicitud de servicio</li>
                                </ul>
                                <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg mt-3">
                                    <p className="text-xs text-muted-foreground">
                                        💡 Ideal para importar a sistemas de BI, bases de datos o herramientas de análisis
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileDown className="h-5 w-5 text-green-600" />
                                    Reporte por Notarías
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    <strong>Contenido:</strong> Resumen agregado por notaría
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Columnas:</strong> Notaría, Total Solicitudes, Total Cantidad, Total Costo</li>
                                    <li><strong>Ordenamiento:</strong> Alfabético por nombre de notaría</li>
                                    <li><strong>Uso típico:</strong> Análisis de clientes, facturación mensual, comparativas</li>
                                    <li><strong>Formato:</strong> Una fila por notaría con totales del período</li>
                                </ul>
                                <div className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg mt-3">
                                    <p className="text-xs text-muted-foreground">
                                        💡 Perfecto para reportes ejecutivos y análisis de rentabilidad por cliente
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <FileDown className="h-5 w-5 text-purple-600" />
                                    Reporte por Servicios
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground mb-3">
                                    <strong>Contenido:</strong> Resumen agregado por servicio
                                </p>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Columnas:</strong> Servicio, Total Solicitudes, Total Cantidad, Total Costo, Notarías Únicas</li>
                                    <li><strong>Ordenamiento:</strong> Por popularidad (más usado primero)</li>
                                    <li><strong>Uso típico:</strong> Análisis de productos, decisiones de pricing, estrategia comercial</li>
                                    <li><strong>Formato:</strong> Una fila por servicio con totales y métricas de adopción</li>
                                </ul>
                                <div className="bg-purple-50 dark:bg-purple-950/20 p-3 rounded-lg mt-3">
                                    <p className="text-xs text-muted-foreground">
                                        💡 Excelente para identificar servicios de alto valor y oportunidades de mejora
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Características Profesionales del Excel</h2>
                    <div className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>🎨 Formato Corporativo</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Logo de Atinet:</strong> En la esquina superior izquierda (80px de alto)</li>
                                    <li><strong>Título del reporte:</strong> Con nombre descriptivo y período</li>
                                    <li><strong>Fecha de generación:</strong> Timestamp de cuándo se exportó</li>
                                    <li><strong>Filtros aplicados:</strong> Muestra qué período y notaría se filtró</li>
                                    <li><strong>Headers con color:</strong> Azul para reportes principales</li>
                                    <li><strong>Filas alternadas:</strong> Gris claro para mejor lectura</li>
                                    <li><strong>Bordes y gridlines:</strong> Estructura clara y profesional</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>📊 Optimizado para Análisis</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                                    <li><strong>Anchos de columna ajustados:</strong> Todo el texto es legible sin ajustar</li>
                                    <li><strong>Números formateados:</strong> Decimales, moneda ($) y separadores de miles</li>
                                    <li><strong>Fechas estandarizadas:</strong> Formato YYYY-MM-DD HH:MM:SS</li>
                                    <li><strong>Sin celdas fusionadas innecesarias:</strong> Facilita filtros y pivotes</li>
                                    <li><strong>Tablas estructuradas:</strong> Compatible con Power BI, Tableau, etc.</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Proceso de Exportación</h2>
                    <Card>
                        <CardContent className="pt-6">
                            <ol className="text-sm text-muted-foreground space-y-3 list-decimal list-inside">
                                <li>Selecciona el período y filtros que deseas incluir en el reporte</li>
                                <li>Haz clic en el botón correspondiente al tipo de reporte que necesitas:</li>
                                <ul className="list-disc list-inside ml-8 mt-2 space-y-1">
                                    <li><strong>"Reporte de Uso Detallado"</strong> → Cada solicitud individual</li>
                                    <li><strong>"Reporte por Notarías"</strong> → Totales agrupados por cliente</li>
                                    <li><strong>"Reporte por Servicios"</strong> → Totales agrupados por servicio</li>
                                </ul>
                                <li>El sistema procesa los datos (puede tardar unos segundos si hay muchos registros)</li>
                                <li>El navegador descarga automáticamente el archivo Excel</li>
                                <li>El archivo se guarda con nombre descriptivo: <code>reporte_[tipo]_YYYYMMDD_HHMMSS.xlsx</code></li>
                                <li>Abre el archivo en Excel, Google Sheets o cualquier software compatible</li>
                            </ol>
                        </CardContent>
                    </Card>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Respeto de Filtros Aplicados</h2>
                    <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900">
                        <p className="text-sm font-semibold text-blue-800 dark:text-blue-400 mb-2">
                            ⚠️ Importante: Los Filtros Se Respetan en la Exportación
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">
                            Los archivos Excel solo incluyen los datos que cumplan con los filtros activos:
                        </p>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-2">
                            <li>Si seleccionaste "Este Mes" → solo datos del mes actual</li>
                            <li>Si seleccionaste una notaría específica → solo esa notaría</li>
                            <li>Los totales reflejan únicamente los datos filtrados</li>
                            <li>El nombre del archivo incluye la fecha de generación para identificarlo</li>
                        </ul>
                    </div>
                </div>

                <Separator />

                <div>
                    <h2 className="text-2xl font-bold mb-4">Casos de Uso Comunes</h2>
                    <div className="space-y-3">
                        <Card>
                            <CardContent className="pt-6">
                                <p className="font-semibold text-sm mb-2">📊 Análisis Mensual de Ingresos</p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside ml-2 space-y-1">
                                    <li>Selecciona "Este Mes" y descarga "Reporte por Notarías"</li>
                                    <li>Abre en Excel y crea una tabla dinámica por plan</li>
                                    <li>Calcula MRR (Monthly Recurring Revenue) por segmento</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <p className="font-semibold text-sm mb-2">🔍 Auditoría de Búsquedas OFAC</p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside ml-2 space-y-1">
                                    <li>Descarga "Reporte de Uso Detallado" del período requerido</li>
                                    <li>Filtra en Excel por servicio = "OFAC"</li>
                                    <li>Revisa fecha, usuario y términos de búsqueda</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <p className="font-semibold text-sm mb-2">📈 Análisis de Popularidad de Servicios</p>
                                <ul className="text-xs text-muted-foreground list-disc list-inside ml-2 space-y-1">
                                    <li>Descarga "Reporte por Servicios" del año completo</li>
                                    <li>Ordena por Total Costo (descendente)</li>
                                    <li>Identifica los 5 servicios que generan más ingresos</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="bg-green-50 dark:bg-green-950/20 p-6 rounded-lg border border-green-200 dark:border-green-900">
                    <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        Buenas Prácticas
                    </h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>💾 <strong>Exporta regularmente:</strong> Crea respaldos mensuales de tus datos</li>
                        <li>📅 <strong>Usa nombres descriptivos:</strong> Renombra los archivos con contexto claro</li>
                        <li>📂 <strong>Organiza por carpetas:</strong> Por mes y año para fácil localización</li>
                        <li>🔒 <strong>Protege datos sensibles:</strong> Los reportes contienen información confidencial</li>
                        <li>📊 <strong>Importa a BI:</strong> Conecta Power BI o Tableau para dashboards avanzados</li>
                    </ul>
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
                        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
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

                                                {(section.subsections || section.children) && activeSection.startsWith(section.id) && (
                                                    <div className="ml-6 mt-1 space-y-1">
                                                        {(section.subsections || section.children)?.map((subsection) => (
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
