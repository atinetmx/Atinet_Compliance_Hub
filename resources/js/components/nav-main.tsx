import { Link } from '@inertiajs/react';
import { ChevronRight } from 'lucide-react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarMenuBadge,
} from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useCurrentUrl, type IsCurrentUrlFn } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

function hasActiveChild(item: NavItem, isCurrentUrl: IsCurrentUrlFn): boolean {
    if (!item.items) return false;
    return item.items.some((child) => {
        if (isCurrentUrl(child.href)) return true;
        return hasActiveChild(child, isCurrentUrl);
    });
}

function renderMenuItems(items: NavItem[], isCurrentUrl: IsCurrentUrlFn, level: number = 0): React.ReactNode {
    return items.map((item) => {
        // Si el item tiene subitems, renderizar como Collapsible
        if (item.items && item.items.length > 0) {
            if (level === 0) {
                return (
                    <Collapsible
                        key={item.title}
                        asChild
                        defaultOpen={hasActiveChild(item, isCurrentUrl) || isCurrentUrl(item.href)}
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                {item.href ? (
                                    <Link href={item.href} prefetch>
                                        <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            className="bg-background/40 hover:bg-amber-500/80 hover:text-amber-50 data-[active=true]:bg-amber-600/90 data-[active=true]:text-amber-50 backdrop-blur-sm transition-all duration-200"
                                            isActive={isCurrentUrl(item.href)}
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </Link>
                                ) : (
                                    <SidebarMenuButton
                                        tooltip={{ children: item.title }}
                                        className="bg-background/40 hover:bg-amber-500/80 hover:text-amber-50 data-[active=true]:bg-amber-600/90 data-[active=true]:text-amber-50 backdrop-blur-sm transition-all duration-200"
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuButton>
                                )}
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <SidebarMenuSub>
                                    {renderMenuItems(item.items, isCurrentUrl, level + 1)}
                                </SidebarMenuSub>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                );
            } else {
                return (
                    <Collapsible
                        key={item.title}
                        defaultOpen={hasActiveChild(item, isCurrentUrl) || isCurrentUrl(item.href)}
                    >
                        <SidebarMenuSubItem>
                            <CollapsibleTrigger asChild>
                                {item.href ? (
                                    <Link href={item.href} prefetch>
                                        <SidebarMenuSubButton
                                            className="bg-background/30 hover:bg-amber-500/60 hover:text-amber-50 data-[active=true]:bg-amber-600/80 data-[active=true]:text-amber-50 backdrop-blur-sm transition-all duration-200"
                                        >
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuSubButton>
                                    </Link>
                                ) : (
                                    <SidebarMenuSubButton
                                        className="bg-background/30 hover:bg-amber-500/60 hover:text-amber-50 data-[active=true]:bg-amber-600/80 data-[active=true]:text-amber-50 backdrop-blur-sm transition-all duration-200"
                                    >
                                        {item.icon && <item.icon className="h-4 w-4" />}
                                        <span>{item.title}</span>
                                        <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                    </SidebarMenuSubButton>
                                )}
                            </CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="flex flex-col gap-1 pl-4">
                                    {renderMenuItems(item.items, isCurrentUrl, level + 1)}
                                </div>
                            </CollapsibleContent>
                        </SidebarMenuSubItem>
                    </Collapsible>
                );
            }
        }

        // Si no tiene subitems, renderizar como un item normal
        if (level === 0) {
            return (
                <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                        asChild
                        isActive={isCurrentUrl(item.href)}
                        tooltip={{ children: item.title }}
                        className="bg-background/40 hover:bg-amber-500/80 hover:text-amber-50 data-[active=true]:bg-amber-600/90 data-[active=true]:text-amber-50 backdrop-blur-sm transition-all duration-200"
                    >
                        <Link href={item.href} prefetch>
                            {item.icon && <item.icon />}
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            );
        } else {
            return (
                <SidebarMenuSubItem key={item.title}>
                    <SidebarMenuSubButton
                        asChild
                        isActive={isCurrentUrl(item.href)}
                        className="bg-background/30 hover:bg-amber-500/60 hover:text-amber-50 data-[active=true]:bg-amber-600/80 data-[active=true]:text-amber-50 backdrop-blur-sm transition-all duration-200"
                    >
                        <Link href={item.href} prefetch>
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span>{item.title}</span>
                        </Link>
                    </SidebarMenuSubButton>
                </SidebarMenuSubItem>
            );
        }
    });
}

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-foreground/70">Platform</SidebarGroupLabel>
            <SidebarMenu>
                {renderMenuItems(items, isCurrentUrl)}
            </SidebarMenu>
        </SidebarGroup>
    );
}
