import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { type NavItem } from '@/types';
import { Link } from '@inertiajs/react';
import { Ambulance, BarChart3, Bell, Building2, ClipboardList, LayoutDashboard, MapPinned, PackageCheck, RadioTower, UsersRound } from 'lucide-react';
import AppLogo from './app-logo';

const mainNavItems: NavItem[] = [
    {
        title: 'Overview',
        url: '/gcc/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Disaster Map',
        url: '/gcc/disaster-map',
        icon: MapPinned,
    },
    {
        title: 'Incident Reports',
        url: '/gcc/dashboard#incidents',
        icon: ClipboardList,
    },
    {
        title: 'Affected Residents',
        url: '/gcc/affected-residents',
        icon: UsersRound,
    },
    {
        title: 'Rescue Units',
        url: '/gcc/dashboard#units',
        icon: Ambulance,
    },
    {
        title: 'Evacuation Centers',
        url: '/gcc/dashboard#evacuation',
        icon: Building2,
    },
    {
        title: 'Alerts',
        url: '/gcc/dashboard#alerts',
        icon: Bell,
    },
    {
        title: 'Resources',
        url: '/gcc/dashboard#resources',
        icon: PackageCheck,
    },
    {
        title: 'Analytics',
        url: '/gcc/dashboard#analytics',
        icon: BarChart3,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Command Hotline',
        url: '/gcc/dashboard#hotline',
        icon: RadioTower,
    },
];

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/gcc/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
