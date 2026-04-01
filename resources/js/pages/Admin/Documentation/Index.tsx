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
} from 'lucide-react';
import { useState } from 'react';
import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import DocumentationLayout from '@/layouts/documentation-layout';
import { dashboard } from '@/routes';

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
    // Más secciones se agregarán progresivamente
};

export default function Documentation({ currentSection }: Props) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeSection, setActiveSection] = useState(currentSection);

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
                <nav className="max-w-7xl mx-auto px-5 md:px-20 py-7">
                    <div className="flex items-center justify-between">
                        {/* Logo y Título */}
                        <div className="flex items-center gap-4">
                            <div className="h-12 md:h-14">
                                <AppLogo />
                            </div>
                            <Separator orientation="vertical" className="h-10 md:h-12 bg-border" />
                            <div>
                                <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                                    <span className="hidden sm:inline">Manual de Usuario</span>
                                    <span className="sm:hidden">Manual</span>
                                </h1>
                                <p className="text-xs md:text-sm text-muted-foreground hidden md:block">Guía completa del sistema</p>
                            </div>
                        </div>

                        {/* Botón Volver */}
                        <Link
                            href={dashboard()}
                            className="flex items-center gap-2 px-4 md:px-6 py-2 text-sm md:text-base font-medium text-foreground hover:text-primary bg-accent hover:bg-accent/80 rounded-lg transition-all shadow-sm hover:shadow-md"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            <span className="hidden sm:inline">Volver al Dashboard</span>
                            <span className="sm:hidden">Volver</span>
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Content con padding-top para compensar header fixed */}
            <div className="container mx-auto px-5 md:px-20 py-8 pt-32 md:pt-36">
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
            </div>
        </DocumentationLayout>
    );
}
