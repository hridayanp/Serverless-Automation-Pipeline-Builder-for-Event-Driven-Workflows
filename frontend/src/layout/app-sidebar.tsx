/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  FolderKanban,
  GalleryVerticalEnd,
  Minus,
  Plus,
  Settings,
  LogOut,
  Workflow,
  LayoutDashboard,
  User2,
  ListTree,
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';

const data = {
  navMain: [
    {
      title: 'Dashboard',
      url: '/dashboard',
      icon: <LayoutDashboard className="mr-2 size-4" />,
      items: [],
    },
    {
      title: 'Projects',
      url: '/workflow/projects',
      icon: <FolderKanban className="mr-2 size-4" />,
      items: [],
    },
    {
      title: 'Tasks',
      url: '/workflow/tasks',
      icon: <ClipboardList className="mr-2 size-4" />,
      items: [],
    },
    {
      title: 'Workflow',
      url: '/workflow/details',
      icon: <Workflow className="mr-2 size-4" />,
      items: [],
    },
    {
      title: 'Jobs',
      url: '/workflow/jobs',
      icon: <ListTree className="mr-2 size-4" />,
      items: [],
    },
  ],
  navSecondary: [
    {
      title: 'Settings',
      url: '/settings',
      icon: <Settings className="mr-2 size-4" />,
    },
    {
      title: 'Profile',
      url: '/profile',
      icon: <User2 className="mr-2 size-4" />,
    },
    {
      title: 'Logout',
      icon: <LogOut className="mr-2 size-4" />,
      action: 'logout',
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = React.useState<string | null>(null);

  React.useEffect(() => {
    const match = data.navMain.find((item) =>
      item.items?.some((sub: any) => sub.url === location.pathname)
    );
    if (match) setOpenMenu(match.title);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link to="#">
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <GalleryVerticalEnd className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="text-lg font-medium">Dataflow</span>
                  <span className="text-xs font-normal">v1.0.0</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        {/* Primary navigation */}
        <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item) =>
              item.items.length > 0 ? (
                <Collapsible
                  key={item.title}
                  open={openMenu === item.title}
                  onOpenChange={(isOpen) =>
                    setOpenMenu(isOpen ? item.title : null)
                  }
                  className="group/collapsible"
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton>
                        {item.icon}
                        {item.title}
                        <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                        <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items.map((sub: any) => (
                          <SidebarMenuSubItem key={sub.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={sub.url === location.pathname}
                            >
                              <Link to={sub.url}>{sub.title}</Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              ) : (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === location.pathname}
                  >
                    <Link to={item.url}>
                      {item.icon}
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )
            )}
          </SidebarMenu>
        </SidebarGroup>

        {/* Secondary navigation with Logout handler */}
        <SidebarGroup className="mt-auto">
          <SidebarMenu>
            {data.navSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.action === 'logout' ? (
                  <SidebarMenuButton onClick={handleLogout}>
                    {item.icon}
                    {item.title}
                  </SidebarMenuButton>
                ) : (
                  <SidebarMenuButton
                    asChild
                    isActive={item.url === location.pathname}
                  >
                    <Link to={item.url as any}>
                      {item.icon}
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}
