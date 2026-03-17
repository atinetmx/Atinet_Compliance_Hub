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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavItem } from '@/types';

export function NavMain({ items = [] }: { items: NavItem[] }) {
    const { isCurrentUrl } = useCurrentUrl();

    return (
        <SidebarGroup className="px-2 py-0">
            <SidebarGroupLabel className="text-foreground/70">Platform</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    // Si el item tiene subitems, renderizar como Collapsible
                    if (item.items && item.items.length > 0) {
                        return (
                            <Collapsible key={item.title} asChild defaultOpen={item.items.some(i => isCurrentUrl(i.href))}>
                                <SidebarMenuItem>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton
                                            tooltip={{ children: item.title }}
                                            className="bg-background/40 hover:bg-amber-500/80 hover:text-amber-50 data-[active=true]:bg-amber-600/90 data-[active=true]:text-amber-50 backdrop-blur-sm transition-all duration-200"
                                        >
                                            {item.icon && <item.icon />}
                                            <span>{item.title}</span>
                                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                    <CollapsibleContent>
                                        <SidebarMenuSub>
                                            {item.items.map((subitem) => (
                                                <SidebarMenuSubItem key={subitem.title}>
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={isCurrentUrl(subitem.href)}
                                                        className="bg-background/30 hover:bg-amber-500/60 hover:text-amber-50 data-[active=true]:bg-amber-600/80 data-[active=true]:text-amber-50 backdrop-blur-sm transition-all duration-200"
                                                    >
                                                        <Link href={subitem.href} prefetch>
                                                            {subitem.icon && <subitem.icon className="h-4 w-4" />}
                                                            <span>{subitem.title}</span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            ))}
                                        </SidebarMenuSub>
                                    </CollapsibleContent>
                                </SidebarMenuItem>
                            </Collapsible>
                        );
                    }

                    // Si no tiene subitems, renderizar como un item normal
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
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
