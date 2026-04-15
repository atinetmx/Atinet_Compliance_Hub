import { Link, usePage } from '@inertiajs/react';
import { BookOpen, CalendarDays, Folder, LayoutGrid, CreditCard, Package, Layers, Shield, BarChart3, Scale, History, Search, Settings, FileText, DollarSign, Users, QrCode, ScanSearch } from 'lucide-react';

import * as SubscriptionController from '@/actions/App/Http/Controllers/Admin/SubscriptionController';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import type { NavItem } from '@/types';

import AppLogo from './app-logo';

export function AppSidebar() {
    const { auth } = usePage<{
        auth: {
            user: { tipo_cuenta: string };
            servicios?: Array<{ code: string; name: string; is_included: boolean }>;
        };
    }>().props;
    const isSuperAdmin = auth?.user?.tipo_cuenta === 'super_admin';
    const servicios = auth?.servicios || [];

    // Check if user has blacklist services
    const hasBlacklistServices = servicios.some(
        (s) => s.code === 'BLACKLIST_OFAC' || s.code === 'BLACKLIST_SAT'
    );

    // Check if user has Control Notarial service (future: will be checked from servicios)
    const hasControlNotarial = servicios.some((s) => s.code === 'CONTROL_NOTARIAL') || isSuperAdmin;

    // Agenda Web: disponible para todos los usuarios autenticados
    const hasAgenda = isSuperAdmin || servicios.some((s) => s.code === 'AGENDA') || true;

    const mainNavItems: NavItem[] = [
        {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        },
        ...(isSuperAdmin
            ? [
                  {
                      title: 'Suscripciones',
                      href: SubscriptionController.index().url,
                      icon: CreditCard,
                  },
                  {
                      title: 'Planes',
                      href: '/admin/plans',
                      icon: Layers,
                  },
                  {
                      title: 'Servicios',
                      href: '/admin/services',
                      icon: Package,
                  },
                  {
                      title: 'Reportes',
                      href: '/admin/reports',
                      icon: BarChart3,
                  },
                  {
                      title: 'Listas Negras',
                      href: '/admin/listas-negras',
                      icon: Shield,
                      items: [
                          {
                              title: 'Búsqueda',
                              href: '/admin/listas-negras',
                              icon: Search,
                          },
                          {
                              title: 'Historial',
                              href: '/admin/search-history',
                              icon: History,
                          },
                      ],
                  },
                  {
                      title: 'Agenda',
                      href: '/admin/agenda',
                      icon: CalendarDays,
                  },
                  {
                      title: 'Registro Web',
                      href: '/admin/registro-web',
                      icon: QrCode,
                  },
                  {
                      title: 'Escáner Inteligente',
                      href: '/admin/escaner-inteligente',
                      icon: ScanSearch,
                  },
                  {
                      title: 'Control Notarial',
                      href: '/admin/control-notarial',
                      icon: Scale,
                      items: [
                          {
                              title: 'Expedientes',
                              href: '/admin/control-notarial/expedientes',
                              items: [
                                  {
                                      title: 'Alta Expedientes',
                                      href: '/admin/control-notarial/expedientes/alta-expedientes'
                                  },
                                  {
                                      title: 'Presupuesto Previo',
                                      href: '/admin/control-notarial/expedientes/presupuesto-previo'
                                  },
                              ],
                          },
                          {
                              title: 'Configuración',
                              href: '/admin/control-notarial/configuracion',
                              items: [
                                  {
                                      title: 'Notaria',
                                      href: '/admin/control-notarial/configuracion/notaria'
                                  },
                                  {
                                      title: 'Clientes',
                                      href: '/admin/control-notarial/clientes'
                                  },
                                  {
                                      title: 'Usuarios',
                                      href: '/admin/control-notarial/usuarios'
                                  },
                                  {
                                      title: 'Alta Catalogos',
                                      href: '/admin/control-notarial/alta-catalogos'
                                  },
                                  {
                                      title: 'Reporte Usuarios',
                                      href: '/admin/control-notarial/reporte-usuarios'
                                  },
                                  {
                                      title: 'Config Operaciones',
                                      href: '/admin/control-notarial/configuracion-operaciones'
                                  },
                                  {
                                      title: 'Config Tarifarias',
                                      href: '/admin/control-notarial/configuraciones-tarifarias'

                                  },
                              ],
                          },
                      ],
                  },
              ]
            : []),
        ...(hasBlacklistServices && !isSuperAdmin
            ? [
                  {
                      title: 'Listas Negras',
                      href: '/admin/listas-negras',
                      icon: Shield,
                      items: [
                          {
                              title: 'Búsqueda',
                              href: '/admin/listas-negras',
                              icon: Search,
                          },
                          {
                              title: 'Historial',
                              href: '/admin/search-history',
                              icon: History,
                          },
                      ],
                  },
              ]
            : []),
        ...(hasAgenda && !isSuperAdmin
            ? [
                  {
                      title: 'Agenda',
                      href: '/admin/agenda',
                      icon: CalendarDays,
                  },
              ]
            : []),
        ...(hasControlNotarial && !isSuperAdmin
            ? [
                  {
                      title: 'Control Notarial',
                      href: '/admin/control-notarial',
                      icon: Scale,
                      items: [
                          {
                              title: 'Expedientes',
                              href: '/admin/control-notarial/expedientes',
                              icon: FileText,
                              items: [
                                  {
                                     title: 'Alta de Expedientes',
                                      href: '/admin/control-notarial/expedientes/alta-expedientes',
                                      icon: FileText,
                                  },
                                  {
                                      title: 'Presupuesto Previo',
                                      href: '/admin/control-notarial/expedientes/presupuesto-previo',
                                      icon: DollarSign,
                                  },
                              ],
                          },
                          {
                              title: 'Configuración',
                              href: '/admin/control-notarial/configuracion',
                              icon: Settings,
                              items: [
                                  {
                                      title: 'Notaria',
                                      href: '/admin/control-notarial/configuracion/notaria',
                                      icon: Settings,
                                  },
                                  {
                                      title: 'Clientes',
                                      href: '/admin/control-notarial/clientes',
                                      icon: Users,
                                  },
                                  {
                                      title: 'Usuarios',
                                      href: '/admin/control-notarial/usuarios',
                                      icon: Settings,
                                  },
                                  {
                                      title: 'Configuración Operaciones',
                                      href: '/admin/control-notarial/configuracion-operaciones',
                                      icon: Settings,
                                  },
                                  {
                                      title: 'Configuraciones Tarifarias',
                                      href: '/admin/control-notarial/configuraciones-tarifarias',
                                      icon: DollarSign,
                                  },
                              ],
                          },
                      ],
                  },
              ]
            : []),
    ];

    const footerNavItems: NavItem[] = [

        // Boton para repositorio laravel.
        // {
        //     title: 'Repository',
        //     href: 'https://github.com/laravel/react-starter-kit',
        //     icon: Folder,
        // },

        {
            title: 'Documentación',
            href: '/admin/documentacion',
            icon: BookOpen,
        },
    ];

    return (
        <Sidebar collapsible="icon" variant="inset" className="backdrop-blur-md bg-background/1 border-sidebar-border/50">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild className="bg-background/10 hover:bg-amber-500/80 hover:text-amber-50 backdrop-blur-sm transition-all duration-200">
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent className="bg-background/10">
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter className="bg-background/10 backdrop-blur-sm">
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
