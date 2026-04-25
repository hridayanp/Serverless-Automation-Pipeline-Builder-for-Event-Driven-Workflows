/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import * as React from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  ClipboardList,
  FolderKanban,
  GalleryVerticalEnd,
  Settings,
  LogOut,
  Workflow,
  LayoutDashboard,
  User2,
  ListTree,
  ChevronRight,
} from 'lucide-react';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar';

/* ── palette tokens (mirror the dashboard) ─────────────────────────────── */
const BRAND   = '#1a2c20';   // deep forest
const LIGHT   = '#f7f8f5';   // page bg
const ACCENT  = '#d4edda';   // emerald tint

const navMain = [
  { title: 'Dashboard', url: '/dashboard',         icon: LayoutDashboard },
  { title: 'Projects',  url: '/workflow/projects', icon: FolderKanban    },
  { title: 'Tasks',     url: '/workflow/tasks',    icon: ClipboardList   },
  { title: 'Workflow',  url: '/workflow/details',  icon: Workflow        },
  { title: 'Jobs',      url: '/workflow/jobs',     icon: ListTree        },
];

const navSecondary = [
  { title: 'Settings', url: '/settings', icon: Settings },
  { title: 'Profile',  url: '/profile',  icon: User2    },
  { title: 'Logout',   icon: LogOut,     action: 'logout' },
];

/* ── NavItem ────────────────────────────────────────────────────────────── */
function NavItem({
  item,
  active,
  onClick,
}: {
  item: (typeof navMain)[number];
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;

  const inner = (
    <div
      onClick={onClick}
      className="group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 relative"
      style={{
        backgroundColor: active ? BRAND    : 'transparent',
        color:           active ? '#fff'   : `${BRAND}99`,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = ACCENT;
          (e.currentTarget as HTMLDivElement).style.color = BRAND;
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLDivElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLDivElement).style.color = `${BRAND}99`;
        }
      }}
    >
      {/* active pill */}
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full"
          style={{ backgroundColor: '#a8d5b5' }}
        />
      )}

      <Icon
        className="w-4 h-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
        strokeWidth={active ? 2.5 : 2}
      />

      <span
        className="text-[13px] font-bold tracking-wide truncate flex-1"
        style={{ fontVariant: 'normal' }}
      >
        {item.title}
      </span>

      {active && (
        <ChevronRight className="w-3.5 h-3.5 opacity-60" strokeWidth={2.5} />
      )}
    </div>
  );

  if (onClick) return inner;
  return <Link to={(item as any).url} className="block no-underline">{inner}</Link>;
}

/* ── AppSidebar ─────────────────────────────────────────────────────────── */
export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const navigate  = useNavigate();

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <Sidebar
      {...props}
      collapsible="icon"
      style={
        {
          '--sidebar-background': '#ffffff',
          '--sidebar-foreground': BRAND,
          '--sidebar-border':     '#e8ede9',
          borderRight: '1px solid #e8ede9',
        } as React.CSSProperties
      }
    >
      {/* ── Logo / Brand ───────────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-4 border-b border-[#e8ede9]">
        <SidebarMenu>
          <SidebarMenuItem>
            <Link to="#" className="flex items-center gap-3 no-underline">
              {/* icon square — same accent palette as stat cards */}
              <div
                className="flex items-center justify-center w-8 h-8 rounded-xl shrink-0"
                style={{ backgroundColor: BRAND }}
              >
                <GalleryVerticalEnd className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>

              <div className="flex flex-col leading-none gap-0.5">
                <span
                  className="text-[15px] font-black tracking-tight"
                  style={{ color: BRAND }}
                >
                  Dataflow
                </span>
                <span
                  className="text-[9px] font-bold uppercase tracking-[0.2em]"
                  style={{ color: `${BRAND}50` }}
                >
                  v1.0.0
                </span>
              </div>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="flex flex-col gap-0 pt-4">
        {/* ── Primary nav ──────────────────────────────────────────────── */}
        <SidebarGroup className="px-3">
          {/* section label */}
          <p
            className="text-[9px] font-black uppercase tracking-[0.28em] mb-3 px-3"
            style={{ color: `${BRAND}40` }}
          >
            Navigation
          </p>

          <SidebarMenu className="flex flex-col gap-1">
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <NavItem item={item} active={location.pathname === item.url} />
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <div className="mx-6 my-5 h-px" style={{ backgroundColor: '#e8ede9' }} />

        {/* ── Secondary nav ────────────────────────────────────────────── */}
        <SidebarGroup className="px-3 mt-auto mb-3">
          <p
            className="text-[9px] font-black uppercase tracking-[0.28em] mb-3 px-3"
            style={{ color: `${BRAND}40` }}
          >
            Account
          </p>

          <SidebarMenu className="flex flex-col gap-1">
            {navSecondary.map((item) => (
              <SidebarMenuItem key={item.title}>
                {item.action === 'logout' ? (
                  <NavItem
                    item={item as any}
                    active={false}
                    onClick={handleLogout}
                  />
                ) : (
                  <NavItem
                    item={item as any}
                    active={location.pathname === (item as any).url}
                  />
                )}
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        {/* ── Status pill at the very bottom ───────────────────────────── */}
        <div className="mx-4 mb-5 px-3 py-2.5 rounded-xl flex items-center gap-2.5"
          style={{ backgroundColor: LIGHT }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <div className="flex flex-col leading-none gap-0.5">
            <span className="text-[9px] font-black uppercase tracking-[0.2em]"
              style={{ color: `${BRAND}50` }}>
              System Status
            </span>
            <span className="text-[11px] font-bold" style={{ color: BRAND }}>
              All Systems Operational
            </span>
          </div>
        </div>
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}