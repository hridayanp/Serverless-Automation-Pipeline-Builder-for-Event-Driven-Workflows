import { useLocation, useNavigate } from 'react-router-dom';
import { useMemo } from 'react';

import bgImage from '@/assets/images/common/bg-2.svg';
import misteoLogo from '@/assets/images/common/misteo-large.png';

import { Card } from '@/components/ui/card';
import {
  SidebarProvider,
  Sidebar,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar';

import { AppSidebar } from './app-sidebar';
import { Button } from '@/components/ui/button';
import { PanelLeft } from 'lucide-react';

/* ── palette tokens (shared across sidebar / header / dashboard) ────────── */
// const BRAND = '#1a2c20';
const LIGHT = '#f7f8f5';

interface LayoutProps {
  children: React.ReactNode;
}

const AuthToggleButton = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLogin = location.pathname === '/signup';
  const togglePath = isLogin ? '/' : '/signup';
  const buttonLabel = isLogin ? 'Sign In' : 'Sign Up';

  return <Button onClick={() => navigate(togglePath)}>{buttonLabel}</Button>;
};

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const authRoutes = useMemo(
    () => [
      '/',
      '/signup',
      '/verify',
      '/forgot-password',
      '/setup',
      '/create-password',
      '/forgot-password/success',
    ],
    [],
  );

  if (authRoutes.includes(location.pathname)) {
    return (
      <div className="container relative hidden h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
        <div className="relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
          <img
            src={bgImage}
            alt="Agrylitics"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/10" />
        </div>
        <div className="lg:p-4 h-full grid grid-rows-[auto_1fr]">
          <div className="px-4 flex items-center justify-end">
            <div className="text-center mt-4">
              <AuthToggleButton />
            </div>
          </div>
          <div className="flex items-center justify-center p-4">
            <Card className="max-w-full overflow-hidden p-1">
              <div className="p-4">{children}</div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: LIGHT }}>
        {/* Sidebar */}
        <Sidebar className="border-r" style={{ borderColor: '#e8ede9' }}>
          <div className="h-16 px-6 flex items-center border-b" style={{ borderColor: '#e8ede9' }}>
            <img src={misteoLogo} alt="Logo" className="h-6" />
          </div>
          <AppSidebar />
        </Sidebar>

        {/* Sidebar Inset (Layout Shell) */}
        <SidebarInset style={{ backgroundColor: LIGHT }}>

          {/* ── Header — matches sidebar design language ─────────────── */}
          <header
            className="sticky top-0 z-10 flex h-16 items-center justify-between px-5 shrink-0"
            style={{
              backgroundColor: '#ffffff',
              borderBottom: '1px solid #e8ede9',
            }}
          >
            {/* left: trigger + divider + logo */}
            <div className="flex items-center gap-3">
              <SidebarTrigger className="-ml-1 flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150 text-muted-foreground hover:bg-[#d4edda] hover:text-[#1a2c20]">
  <PanelLeft className="w-4 h-4.5" strokeWidth={2.2} />
</SidebarTrigger>

              <div className="h-4 w-px" style={{ backgroundColor: '#e8ede9' }} />

              
            </div>

            {/* right: live status pill — mirrors dashboard + sidebar bottom pill */}
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
              style={{ backgroundColor: '#f0faf3', borderColor: '#c8e6c9' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span
                className="text-[10px] font-black uppercase tracking-[0.2em]"
                style={{ color: '#2d5a3d' }}
              >
                Live
              </span>
            </div>
          </header>

          {/* Scrollable Page Content */}
          <main className="flex-1 overflow-auto thin-scrollbar">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default Layout;